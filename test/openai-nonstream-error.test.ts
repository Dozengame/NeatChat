jest.mock("nanoid", () => ({ nanoid: () => "openai-test-id" }));
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
jest.mock("@/app/store", () => {
  const { useAccessStore } = jest.requireActual("../app/store/access");
  const { useAppConfig } = jest.requireActual("../app/store/config");
  const { useChatStore } = jest.requireActual("../app/store/chat");
  return {
    useAccessStore,
    useAppConfig,
    useChatStore,
    usePluginStore: {
      getState: () => ({ getAsTools: () => [[], {}] }),
    },
  };
});
jest.mock("../app/client/header-loader", () => ({
  getHeadersAsync: jest.fn(async () => ({})),
}));
jest.mock("../app/utils/stream", () => ({
  ...jest.requireActual("../app/utils/stream"),
  fetch: jest.fn(),
}));

import { ChatGPTApi } from "../app/client/platforms/openai";
import { ServiceProvider } from "../app/constant";
import { useAccessStore } from "../app/store/access";
import { useChatStore } from "../app/store/chat";
import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";
import * as streamUtils from "../app/utils/stream";

describe("OpenAI non-stream response validation", () => {
  const consoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    const modelConfig = {
      ...DEFAULT_CONFIG.modelConfig,
      model: "gpt-5.6-terra" as any,
      providerName: ServiceProvider.OpenAI,
      stream: false,
    };
    useAppConfig.setState({ ...DEFAULT_CONFIG, modelConfig });
    useChatStore.getState().currentSession().mask.modelConfig = {
      ...modelConfig,
    };
    useAccessStore.setState({
      useCustomConfig: false,
      hideUserApiKey: true,
      lockedFields: [],
    });
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  async function requestWithResponse(options: {
    status: number;
    body: string;
    contentType?: string;
  }) {
    const response = {
      ok: options.status >= 200 && options.status < 300,
      status: options.status,
      headers: new Headers({
        "content-type": options.contentType ?? "application/json",
      }),
      text: async () => options.body,
    } as Response;
    (streamUtils.fetch as jest.Mock).mockResolvedValueOnce(response);
    const onFinish = jest.fn();
    const onError = jest.fn();

    await new ChatGPTApi().chat({
      messages: [{ role: "user", content: "Hello" }],
      config: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "gpt-5.6-terra" as any,
        providerName: ServiceProvider.OpenAI,
        stream: false,
      },
      onFinish,
      onError,
    });

    return { onError, onFinish };
  }

  test("rejects a non-JSON upstream failure without exposing its body", async () => {
    const { onError, onFinish } = await requestWithResponse({
      status: 502,
      contentType: "text/html",
      body: "<html>Authorization: Bearer upstream-secret</html>",
    });

    expect(onFinish).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    const message = String(onError.mock.calls[0][0]?.message);
    expect(message).toContain("502");
    expect(message).not.toContain("upstream-secret");
    expect(message).not.toContain("<html>");
  });

  test("rejects an incomplete Responses result as a terminal error", async () => {
    const { onError, onFinish } = await requestWithResponse({
      status: 200,
      body: JSON.stringify({
        id: "resp_incomplete",
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output: [],
      }),
    });

    expect(onFinish).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  test("rejects a completed response with no displayable output", async () => {
    const { onError, onFinish } = await requestWithResponse({
      status: 200,
      body: JSON.stringify({
        id: "resp_empty",
        status: "completed",
        output: [],
      }),
    });

    expect(onFinish).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
