jest.mock("nanoid", () => ({ nanoid: () => "gpt6-tool-test-id" }));
jest.mock("lodash-es/mapKeys", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("lodash-es/mapValues", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("lodash-es/isArray", () => ({
  __esModule: true,
  default: Array.isArray,
}));
jest.mock("lodash-es/isObject", () => ({
  __esModule: true,
  default: (value: unknown) => typeof value === "object" && value !== null,
}));
jest.mock("@/app/store", () => ({
  ...jest.requireActual("../app/store/access"),
  ...jest.requireActual("../app/store/config"),
  ...jest.requireActual("../app/store/chat"),
  usePluginStore: { getState: () => ({ getAsTools: mockGetAsTools }) },
}));
jest.mock("../app/client/header-loader", () => ({
  getHeadersAsync: jest.fn(async () => ({})),
}));
jest.mock("../app/client/platforms/openai-responses-tools", () => ({
  ...jest.requireActual("../app/client/platforms/openai-responses-tools"),
  sendOpenAIResponsesSseRound: jest.fn(),
}));
jest.mock("../app/utils/stream", () => ({
  ...jest.requireActual("../app/utils/stream"),
  fetch: jest.fn(),
}));

import { ChatGPTApi } from "../app/client/platforms/openai";
import { sendOpenAIResponsesSseRound } from "../app/client/platforms/openai-responses-tools";
import { ServiceProvider } from "../app/constant";
import { useAccessStore } from "../app/store/access";
import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";
import { fetch as transportFetch } from "../app/utils/stream";

const mockGetAsTools = jest.fn();
const sendRound = sendOpenAIResponsesSseRound as jest.Mock;
const functionCall = {
  id: "fc_write",
  type: "function_call",
  call_id: "call_write",
  name: "save_note",
  arguments: '{"text":"hello"}',
};
const reasoning = {
  id: "rs_tool",
  type: "reasoning",
  encrypted_content: "opaque-reasoning",
  summary: [],
};
const completedOutput = {
  id: "msg_done",
  type: "message",
  role: "assistant",
  content: [{ type: "output_text", text: "Saved" }],
};

describe.each(["gpt-5.6-terra", "gpt-6-astra", "gpt-6-sol", "gpt-6-luna"])(
  "%s client function tools",
  (model) => {
    const executor = jest.fn();
    const modelConfig = () => ({
      ...DEFAULT_CONFIG.modelConfig,
      model: model as any,
      providerName: ServiceProvider.OpenAI,
      stream: true,
      reasoningEffort: "medium" as const,
      reasoningContext: "all_turns" as const,
      promptCacheMode: "disabled" as const,
    });

    beforeEach(() => {
      jest.clearAllMocks();
      sendRound.mockReset();
      executor
        .mockReset()
        .mockResolvedValue({ status: 200, data: "saved-once" });
      mockGetAsTools.mockReturnValue([
        [
          {
            type: "function",
            function: {
              name: "save_note",
              description: "Save a note",
              parameters: {
                type: "object",
                properties: { text: { type: "string" } },
                required: ["text"],
              },
            },
          },
        ],
        { save_note: executor },
      ]);
      useAppConfig.setState({ ...DEFAULT_CONFIG, modelConfig: modelConfig() });
      useAccessStore.setState({
        useCustomConfig: false,
        hideUserApiKey: true,
        lockedFields: [],
        serverConfigSnapshot: undefined,
      });
    });

    test.each([false, true])(
      "attaches selected tools and continues with store=%s without rerunning the executor",
      async (store) => {
        sendRound
          .mockResolvedValueOnce({
            id: "resp_tool",
            output: [reasoning, functionCall],
            calls: [functionCall],
            text: "",
          })
          .mockResolvedValueOnce({
            id: "resp_done",
            output: [completedOutput],
            calls: [],
            text: "Saved",
          });
        const onFinish = jest.fn();
        const onError = jest.fn();

        await new ChatGPTApi().chat({
          config: { ...modelConfig(), store },
          messages: [{ role: "user", content: "Save the note hello" }],
          allowTools: true,
          pluginIds: ["notes-plugin"],
          onFinish,
          onError,
        });

        expect(mockGetAsTools).toHaveBeenCalledWith(["notes-plugin"]);
        expect(sendRound).toHaveBeenCalledTimes(2);
        const initial = sendRound.mock.calls[0][0];
        expect(initial.url).toBe("/api/openai/v1/responses");
        expect(initial.payload).toMatchObject({
          model,
          store,
          stream: true,
          tools: [
            expect.objectContaining({ type: "function", name: "save_note" }),
          ],
        });
        const output = {
          type: "function_call_output",
          call_id: "call_write",
          output: "saved-once",
        };
        const continuation = sendRound.mock.calls[1][0].payload;
        if (store) {
          expect(continuation.previous_response_id).toBe("resp_tool");
          expect(continuation.input).toEqual([output]);
        } else {
          expect(continuation.previous_response_id).toBeUndefined();
          expect(continuation.input).toEqual([
            ...initial.payload.input,
            reasoning,
            functionCall,
            output,
          ]);
        }
        expect(executor).toHaveBeenCalledTimes(1);
        expect(executor).toHaveBeenCalledWith(
          { text: "hello" },
          expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
        expect(onError).not.toHaveBeenCalled();
        expect(onFinish).toHaveBeenCalledWith(
          "Saved",
          undefined,
          expect.objectContaining({
            openaiResponseId: "resp_done",
            openaiResponseStored: store,
            openaiResponsesOutput: [
              reasoning,
              functionCall,
              output,
              completedOutput,
            ],
          }),
        );
        expect(transportFetch).not.toHaveBeenCalled();
      },
    );

    test.each([false, true])(
      "replays a failed continuation with store=%s and does not re-enable side effects",
      async (store) => {
        sendRound
          .mockResolvedValueOnce({
            id: "resp_tool",
            output: [reasoning, functionCall],
            calls: [functionCall],
            text: "",
          })
          .mockRejectedValueOnce(new Error("continuation interrupted"))
          .mockResolvedValueOnce({
            id: "resp_recovered",
            output: [completedOutput],
            calls: [],
            text: "Saved",
          });
        const onError = jest.fn();
        const interruptedFinish = jest.fn();
        const client = new ChatGPTApi();
        await client.chat({
          config: { ...modelConfig(), store },
          messages: [{ role: "user", content: "Save the note hello" }],
          allowTools: true,
          pluginIds: ["notes-plugin"],
          onError,
          onFinish: interruptedFinish,
        });

        expect(interruptedFinish).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
        const metadata = onError.mock.calls[0][1];
        expect(metadata).toMatchObject({
          openaiResponseStored: false,
          openaiResponsesRecoveryPending: true,
          openaiResponsesOutput: [
            reasoning,
            functionCall,
            {
              type: "function_call_output",
              call_id: "call_write",
              output: "saved-once",
            },
          ],
        });
        const onFinish = jest.fn();
        await client.chat({
          config: { ...modelConfig(), store },
          messages: [
            { role: "user", content: "Save the note hello" },
            {
              role: "assistant",
              model,
              content: "",
              ...metadata,
            },
            { role: "user", content: "Continue from the saved result" },
          ],
          allowTools: true,
          pluginIds: ["notes-plugin"],
          openaiResponsesRecoveryPending: true,
          onFinish,
          onError,
        });

        const recovery = sendRound.mock.calls[2][0].payload;
        expect(recovery.previous_response_id).toBeUndefined();
        expect(recovery.input).toEqual([
          {
            role: "user",
            content: [{ type: "input_text", text: "Save the note hello" }],
          },
          ...metadata.openaiResponsesOutput,
          {
            role: "user",
            content: [
              { type: "input_text", text: "Continue from the saved result" },
            ],
          },
        ]);
        expect(recovery.tools).toBeUndefined();
        expect(mockGetAsTools).toHaveBeenCalledTimes(1);
        expect(executor).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(transportFetch).not.toHaveBeenCalled();
      },
    );
  },
);
