jest.mock("nanoid", () => ({ nanoid: () => "anthropic-test-id" }));
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
jest.mock("../app/utils/stream", () => ({
  ...jest.requireActual("../app/utils/stream"),
  fetch: jest.fn(),
}));

import { ClaudeApi } from "../app/client/platforms/anthropic";
import { REQUEST_TIMEOUT_MS, ServiceProvider } from "../app/constant";
import { useAccessStore } from "../app/store/access";
import { useChatStore } from "../app/store/chat";
import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";
import * as streamUtils from "../app/utils/stream";

describe("Anthropic request-level config", () => {
  async function waitForController(readController: () => AbortController) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const controller = readController();
      if (controller) return controller;
      await Promise.resolve();
    }
    throw new Error("Anthropic request controller was not registered");
  }

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("uses the request provider for body fields and authentication", async () => {
    useAppConfig.setState({
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "global-openai" as any,
        providerName: ServiceProvider.OpenAI,
        temperature: 0.1,
        top_p: 0.2,
        max_output_tokens: 1000,
      },
    });
    const currentSession = useChatStore.getState().currentSession();
    currentSession.mask.modelConfig = {
      ...currentSession.mask.modelConfig,
      model: "current-openai" as any,
      providerName: ServiceProvider.OpenAI,
      temperature: 0.3,
      top_p: 0.4,
      max_output_tokens: 2000,
    };
    useAccessStore.setState({
      openaiApiKey: "openai-current-key",
      anthropicApiKey: "anthropic-request-key",
      hideUserApiKey: false,
      lockedFields: [],
    });

    const fetchMock = streamUtils.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      status: 200,
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ content: [{ text: "ok" }] }),
      json: async () => ({ content: [{ text: "ok" }] }),
    } as Response);
    const onFinish = jest.fn();
    const onError = jest.fn();

    await new ClaudeApi().chat({
      messages: [{ role: "user", content: "Summarize this" }],
      config: {
        model: "claude-sonnet-4-5",
        providerName: ServiceProvider.Anthropic,
        temperature: 0.7,
        top_p: 0.8,
        max_output_tokens: 4321,
        stream: false,
      },
      onFinish,
      onError,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      model: "claude-sonnet-4-5",
      temperature: 0.7,
      top_p: 0.8,
      max_tokens: 4321,
      stream: false,
    });
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("anthropic-request-key");
    expect(headers.Authorization).toBeUndefined();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith("ok", expect.anything());
    expect(onError).not.toHaveBeenCalled();
  });

  test("reports a non-stream timeout through one error callback", async () => {
    jest.useFakeTimers();
    const fetchMock = streamUtils.fetch as jest.Mock;
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    const onFinish = jest.fn();
    const onError = jest.fn();

    const request = new ClaudeApi().chat({
      messages: [{ role: "user", content: "Hello" }],
      config: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "claude-sonnet-4-5" as any,
        providerName: ServiceProvider.Anthropic,
        stream: false,
      },
      onFinish,
      onError,
    });
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await request;

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toMatchObject({ name: "TimeoutError" });
    expect(onFinish).not.toHaveBeenCalled();
  });

  test("treats a user abort as one partial finish", async () => {
    const fetchMock = streamUtils.fetch as jest.Mock;
    fetchMock.mockImplementation(() => new Promise(() => undefined));
    const onFinish = jest.fn();
    const onError = jest.fn();
    let controller!: AbortController;

    const request = new ClaudeApi().chat({
      messages: [{ role: "user", content: "Hello" }],
      config: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "claude-sonnet-4-5" as any,
        providerName: ServiceProvider.Anthropic,
        stream: false,
      },
      onController: (value) => {
        controller = value;
      },
      onFinish,
      onError,
    });
    const activeController = await waitForController(() => controller);
    activeController.abort();
    await request;

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });
});
