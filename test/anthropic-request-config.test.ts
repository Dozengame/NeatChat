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
import { ServiceProvider } from "../app/constant";
import { useAccessStore } from "../app/store/access";
import { useChatStore } from "../app/store/chat";
import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";
import * as streamUtils from "../app/utils/stream";

describe("Anthropic request-level config", () => {
  afterEach(() => {
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
      json: async () => ({ content: [{ text: "ok" }] }),
    } as Response);

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
      onFinish: jest.fn(),
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
  });
});
