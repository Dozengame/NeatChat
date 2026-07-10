jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("../app/mcp/actions", () => ({
  executeMcpAction: jest.fn(),
  getAllTools: jest.fn(() => Promise.resolve([])),
  getClientsStatus: jest.fn(() => Promise.resolve({})),
  initializeMcpSystem: jest.fn(() => Promise.resolve()),
  isMcpEnabled: jest.fn(() => Promise.resolve(false)),
}));
jest.mock("../app/client/api", () => ({
  getHeaders: () => ({}),
  getClientApi: jest.fn(),
  ClientApi: jest.fn(),
}));

import { buildOpenAIResponsesPayload } from "../app/client/platforms/openai-responses-builder";
import { getClientApi } from "../app/client/api";
import { ServiceProvider } from "../app/constant";
import { useChatStore } from "../app/store/chat";
import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";

const message = (index: number, role: "user" | "assistant") => ({
  id: `m_${index}`,
  date: "",
  role,
  content: `${role}-${index}`,
  ...(role === "assistant"
    ? {
        openaiResponseId: `resp_${index}`,
        openaiResponseStored: true,
        openaiResponsesOutput: [
          {
            id: `rs_${index}`,
            type: "reasoning",
            encrypted_content: `encrypted_${index}`,
            summary: [],
          },
          {
            id: `out_${index}`,
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: `${role}-${index}` }],
          },
        ],
      }
    : {}),
});

const recoveryTrace = (suffix: string) => [
  {
    id: `fc_${suffix}`,
    type: "function_call",
    call_id: `call_${suffix}`,
    name: "side_effect",
    arguments: "{}",
  },
  {
    type: "function_call_output",
    call_id: `call_${suffix}`,
    output: `completed_${suffix}`,
  },
];

describe("GPT-5.6 all_turns history", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppConfig.setState({
      ...DEFAULT_CONFIG,
      enableCustomInstructions: false,
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "gpt-5.6-terra" as any,
        providerName: ServiceProvider.OpenAI,
        reasoningContext: "all_turns",
        historyMessageCount: 1,
        max_output_tokens: 1,
        enableInjectSystemPrompts: false,
      },
    });
    useChatStore.setState({
      sessions: [],
      temporarySession: undefined,
      currentSessionIndex: -1,
      lastInput: "",
    } as any);
  });

  test("keeps every raw turn after clear-context despite history and token limits", async () => {
    const session = useChatStore.getState().currentSession();
    session.mask.modelConfig = {
      ...useAppConfig.getState().modelConfig,
    };
    session.clearContextIndex = 1;
    session.messages = Array.from({ length: 6 }, (_, index) =>
      message(index, index % 2 === 0 ? "user" : "assistant"),
    ) as any;

    const recent = await useChatStore
      .getState()
      .getMessagesWithMemory({ session });

    expect(recent.map((item) => item.content)).toEqual([
      "assistant-1",
      "user-2",
      "assistant-3",
      "user-4",
      "assistant-5",
    ]);
    expect(recent.at(-1)).toMatchObject({
      openaiResponseId: "resp_5",
      openaiResponsesOutput: expect.any(Array),
    });
  });

  test("builds stateful and stateless continuations from the complete retained trace", async () => {
    const session = useChatStore.getState().currentSession();
    session.mask.modelConfig = {
      ...useAppConfig.getState().modelConfig,
    };
    session.messages = Array.from({ length: 6 }, (_, index) =>
      message(index, index % 2 === 0 ? "user" : "assistant"),
    ) as any;

    const recent = await useChatStore
      .getState()
      .getMessagesWithMemory({ session });
    const messages = [
      ...recent,
      { role: "user" as const, content: "latest-user" },
    ];
    const stateful = buildOpenAIResponsesPayload({
      messages,
      modelConfig: session.mask.modelConfig,
      store: true,
    }) as any;
    const stateless = buildOpenAIResponsesPayload({
      messages,
      modelConfig: session.mask.modelConfig,
      store: false,
    }) as any;

    expect(stateful.previous_response_id).toBe("resp_5");
    expect(stateful.input).toEqual([
      {
        role: "user",
        content: [{ type: "input_text", text: "latest-user" }],
      },
    ]);
    expect(stateless.previous_response_id).toBeUndefined();
    expect(
      stateless.input.filter((item: any) => item.type === "reasoning"),
    ).toHaveLength(3);
    expect(stateless.include).toEqual(["reasoning.encrypted_content"]);
  });

  test.each(["auto", "current_turn", "all_turns"] as const)(
    "retains the error user turn paired with a replayable tool trace in %s context",
    async (reasoningContext) => {
      useAppConfig.setState({
        modelConfig: {
          ...useAppConfig.getState().modelConfig,
          reasoningContext,
          historyMessageCount: 0,
        },
      });
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const trace = [
        {
          id: "fc_error",
          type: "function_call",
          call_id: "call_error",
          name: "side_effect",
          arguments: "{}",
        },
        {
          type: "function_call_output",
          call_id: "call_error",
          output: "completed",
        },
      ];
      (getClientApi as jest.Mock).mockReturnValue({
        llm: {
          chat: jest.fn(async (options) => {
            options.onError(new Error("continuation failed"), {
              openaiResponseStored: false,
              openaiResponsesOutput: trace,
              openaiResponsesRecoveryPending: true,
            });
          }),
        },
      });

      await useChatStore.getState().onUserInput("run side effect");
      consoleErrorSpy.mockRestore();

      const session = useChatStore.getState().currentSession();
      expect(session.messages).toEqual([
        expect.objectContaining({
          role: "user",
          content: "run side effect",
          isError: true,
        }),
        expect.objectContaining({
          role: "assistant",
          isError: true,
          openaiResponseStored: false,
          openaiResponsesOutput: trace,
          openaiResponsesRecoveryPending: true,
        }),
      ]);

      const recent = await useChatStore
        .getState()
        .getMessagesWithMemory({ session });
      expect(recent.map((item) => item.role)).toEqual(["user", "assistant"]);

      for (const store of [false, true]) {
        const payload = buildOpenAIResponsesPayload({
          messages: [...recent, { role: "user", content: "continue safely" }],
          modelConfig: session.mask.modelConfig,
          store,
        }) as any;
        expect(payload.previous_response_id).toBeUndefined();
        expect(payload.input).toEqual([
          {
            role: "user",
            content: [{ type: "input_text", text: "run side effect" }],
          },
          ...trace,
          {
            role: "user",
            content: [{ type: "input_text", text: "continue safely" }],
          },
        ]);
      }

      session.mask.modelConfig = {
        ...session.mask.modelConfig,
        model: "claude-3-5-sonnet" as any,
        providerName: ServiceProvider.Anthropic,
        historyMessageCount: 0,
      };
      expect(
        await useChatStore.getState().getMessagesWithMemory({ session }),
      ).toEqual([]);
    },
  );

  test("unpins a recovery trace after a successful GPT-5.6 response", async () => {
    useAppConfig.setState({
      modelConfig: {
        ...useAppConfig.getState().modelConfig,
        reasoningContext: "auto",
        historyMessageCount: 0,
      },
    });
    const trace = [
      {
        id: "fc_error",
        type: "function_call",
        call_id: "call_error",
        name: "side_effect",
        arguments: "{}",
      },
      {
        type: "function_call_output",
        call_id: "call_error",
        output: "completed",
      },
    ];
    const chat = jest
      .fn()
      .mockImplementationOnce(async (options) => {
        options.onError(new Error("continuation failed"), {
          openaiResponseStored: false,
          openaiResponsesOutput: trace,
          openaiResponsesRecoveryPending: true,
        });
      })
      .mockImplementationOnce(async (options) => {
        options.onFinish("Recovered", undefined, {
          openaiResponseId: "resp_recovered",
          openaiResponseStored: false,
          openaiResponsesOutput: [
            {
              id: "msg_recovered",
              type: "message",
              role: "assistant",
              content: [{ type: "output_text", text: "Recovered" }],
            },
          ],
        });
      });
    (getClientApi as jest.Mock).mockReturnValue({ llm: { chat } });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    await useChatStore.getState().onUserInput("run side effect");
    await useChatStore.getState().onUserInput("continue");
    await new Promise((resolve) => setTimeout(resolve, 0));
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();

    const session = useChatStore.getState().currentSession();
    expect(session.messages[1]).toMatchObject({
      openaiResponsesRecoveryPending: false,
    });
    session.mask.modelConfig.historyMessageCount = 0;
    expect(
      await useChatStore.getState().getMessagesWithMemory({ session }),
    ).toEqual([]);
  });

  test("keeps every consecutive recovery segment until a success consumes them", async () => {
    useAppConfig.setState({
      modelConfig: {
        ...useAppConfig.getState().modelConfig,
        reasoningContext: "auto",
        historyMessageCount: 0,
      },
    });
    const firstTrace = recoveryTrace("first");
    const secondTrace = recoveryTrace("second");
    const chat = jest
      .fn()
      .mockImplementationOnce(async (options) => {
        options.onError(new Error("first continuation failed"), {
          openaiResponseStored: false,
          openaiResponsesOutput: firstTrace,
          openaiResponsesRecoveryPending: true,
        });
      })
      .mockImplementationOnce(async (options) => {
        options.onError(new Error("second continuation failed"), {
          openaiResponseStored: false,
          openaiResponsesOutput: secondTrace,
          openaiResponsesRecoveryPending: true,
        });
      })
      .mockImplementationOnce(async (options) => {
        options.onFinish("Recovered", undefined, {
          openaiResponseId: "resp_recovered",
          openaiResponseStored: false,
          openaiResponsesOutput: [
            {
              id: "msg_recovered",
              type: "message",
              role: "assistant",
              content: [{ type: "output_text", text: "Recovered" }],
            },
          ],
        });
      });
    (getClientApi as jest.Mock).mockReturnValue({ llm: { chat } });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    await useChatStore.getState().onUserInput("first side effect");
    await useChatStore.getState().onUserInput("second side effect");

    const session = useChatStore.getState().currentSession();
    const pendingHistory = await useChatStore
      .getState()
      .getMessagesWithMemory({ session });
    expect(pendingHistory.map((item) => item.content)).toEqual([
      "first side effect",
      expect.any(String),
      "second side effect",
      expect.any(String),
    ]);
    const recoveryPayload = buildOpenAIResponsesPayload({
      messages: [
        ...pendingHistory,
        { role: "user", content: "finish recovery" },
      ],
      modelConfig: session.mask.modelConfig,
      store: false,
    }) as any;
    expect(
      recoveryPayload.input.filter(
        (item: any) => item.type === "function_call",
      ),
    ).toEqual([firstTrace[0], secondTrace[0]]);
    expect(
      recoveryPayload.input.filter(
        (item: any) => item.type === "function_call_output",
      ),
    ).toEqual([firstTrace[1], secondTrace[1]]);

    await useChatStore.getState().onUserInput("finish recovery");

    const thirdRequestMessages = chat.mock.calls[2][0].messages;
    expect(thirdRequestMessages.map((item: any) => item.content)).toEqual([
      "first side effect",
      expect.any(String),
      "second side effect",
      expect.any(String),
      "finish recovery",
    ]);
    expect(
      session.messages
        .filter((item) => item.openaiResponsesOutput)
        .every((item) => !item.openaiResponsesRecoveryPending),
    ).toBe(true);
    expect(
      await useChatStore.getState().getMessagesWithMemory({ session }),
    ).toEqual([]);

    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
