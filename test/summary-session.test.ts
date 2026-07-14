jest.mock("nanoid", () => ({ nanoid: () => "summary-session-id" }));

const chat = jest.fn();
jest.mock("../app/client/api", () => ({
  getClientApi: jest.fn(() => ({ llm: { chat } })),
  ClientApi: jest.fn(),
}));

import { ServiceProvider } from "../app/constant";
import { useAccessStore } from "../app/store/access";
import { useAppConfig, DEFAULT_CONFIG } from "../app/store/config";
import {
  DEFAULT_TOPIC,
  useChatStore,
  type ChatSession,
} from "../app/store/chat";

function session(
  id: string,
  overrides: Partial<ChatSession["mask"]["modelConfig"]> = {},
): ChatSession {
  return {
    id,
    topic: DEFAULT_TOPIC,
    memoryPrompt: "",
    messages: [
      {
        id: `${id}-user`,
        role: "user",
        content: "A".repeat(80),
        date: "",
      },
      {
        id: `${id}-assistant`,
        role: "assistant",
        content: "B".repeat(80),
        date: "",
      },
    ],
    stat: { tokenCount: 0, wordCount: 0, charCount: 0 },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,
    mask: {
      id: `${id}-mask`,
      avatar: "gpt-bot",
      name: id,
      context: [],
      syncGlobalConfig: false,
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "gpt-5.6-terra" as any,
        providerName: ServiceProvider.OpenAI,
        reasoningEffort: "low",
        max_output_tokens: 10000,
        compressModel: "",
        compressProviderName: "",
        compressMessageLengthThreshold: 1,
        sendMemory: true,
        ...overrides,
      },
      modelConfigMeta: {},
      lang: "en",
      builtin: false,
      createdAt: Date.now(),
      plugin: [],
    },
  } as ChatSession;
}

describe("summarizeSession request config", () => {
  beforeEach(() => {
    chat.mockReset();
    chat.mockResolvedValue(undefined);
    useAppConfig.setState({
      enableAutoGenerateTitle: true,
      customModels: "",
      models: DEFAULT_CONFIG.models,
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "gpt-5.6-luna" as any,
        providerName: ServiceProvider.OpenAI,
        reasoningEffort: "xhigh",
        max_output_tokens: 30000,
      },
      serverConfigSnapshot: {
        schemaVersion: 1,
        configVersion: "summary-session",
        configHash: "summary-session-hash",
        updatedAt: "2026-07-13T00:00:00.000Z",
        defaults: {
          model: "gpt-5.6-luna",
          providerName: ServiceProvider.OpenAI,
          reasoningEffort: "xhigh",
          max_output_tokens: 30000,
        },
        forced: {
          model: "gpt-5.6-luna",
          providerName: ServiceProvider.OpenAI,
        },
        allowedModels: ["gpt-5.6-luna@OpenAI", "gpt-5.6-terra@OpenAI"],
        reasoningEffortDefaults: {
          default: "medium",
          models: { "gpt-5.6-luna": "xhigh", "gpt-5.6-terra": "high" },
        },
        lockedFields: [],
        serverFlags: {
          needCode: false,
          hideUserApiKey: false,
          hideBalanceQuery: false,
          disableFastLink: false,
          disableGPT4: false,
        },
        legacy: { customModels: "", defaultModel: "gpt-5.6-luna" },
      },
    });
    useAccessStore.setState({
      allowedModels: ["gpt-5.6-luna@OpenAI", "gpt-5.6-terra@OpenAI"],
      customModels: "",
      defaultModel: "gpt-5.6-luna",
    });
  });

  test("uses the target session with the default Summary model and effort", async () => {
    const currentSession = session("current", {
      model: "gpt-5.6-terra" as any,
      reasoningEffort: "low",
    });
    currentSession.memoryPrompt = "CURRENT_MEMORY";
    const targetSession = session("target");
    targetSession.memoryPrompt = "TARGET_MEMORY";
    useChatStore.setState({
      sessions: [targetSession],
      currentSessionIndex: -1,
      temporarySession: currentSession,
    } as any);

    await useChatStore.getState().summarizeSession(true, targetSession);

    expect(chat).toHaveBeenCalledTimes(2);
    for (const call of chat.mock.calls) {
      expect(call[0].config).toMatchObject({
        model: "gpt-5.6-luna",
        providerName: ServiceProvider.OpenAI,
        reasoningEffort: "xhigh",
        max_output_tokens: 30000,
      });
    }
    expect(chat.mock.calls[0][0].config.stream).toBe(false);
    expect(chat.mock.calls[1][0].config.stream).toBe(true);
    const compressionMessages = JSON.stringify(chat.mock.calls[1][0].messages);
    expect(compressionMessages).toContain("TARGET_MEMORY");
    expect(compressionMessages).not.toContain("CURRENT_MEMORY");
  });

  test("keeps the non-OpenAI default output budget without enabling tools", async () => {
    useAppConfig.setState((state) => ({
      modelConfig: {
        ...state.modelConfig,
        model: "claude-sonnet-4-5" as any,
        providerName: ServiceProvider.Anthropic,
        max_output_tokens: 8192,
      },
      serverConfigSnapshot: {
        ...state.serverConfigSnapshot!,
        defaults: {
          model: "claude-sonnet-4-5",
          providerName: ServiceProvider.Anthropic,
          max_output_tokens: 8192,
        },
        forced: {
          model: "claude-sonnet-4-5",
          providerName: ServiceProvider.Anthropic,
        },
        allowedModels: ["claude-sonnet-4-5@Anthropic"],
      },
    }));
    const targetSession = session("anthropic-target", {
      max_output_tokens: 4096,
    });
    useChatStore.setState({
      sessions: [targetSession],
      currentSessionIndex: 0,
      temporarySession: undefined,
    } as any);

    await useChatStore.getState().summarizeSession(true, targetSession);

    expect(chat).toHaveBeenCalledTimes(2);
    for (const call of chat.mock.calls) {
      expect(call[0].config).toMatchObject({
        model: "claude-sonnet-4-5",
        providerName: ServiceProvider.Anthropic,
        reasoningEffort: undefined,
        max_output_tokens: 8192,
      });
      expect(call[0].allowTools).toBeUndefined();
    }
  });

  test("falls back before requesting an allowed but catalog-disabled override", async () => {
    const provider = {
      id: "openai",
      providerName: ServiceProvider.OpenAI,
      providerType: "openai",
      sorted: 1,
    };
    useAppConfig.setState((state) => ({
      models: [
        {
          name: "gpt-5.6-luna",
          available: true,
          provider,
          sorted: 1,
        },
        {
          name: "gpt-5.6-sol",
          available: false,
          provider,
          sorted: 2,
        },
      ],
      serverConfigSnapshot: {
        ...state.serverConfigSnapshot!,
        allowedModels: ["gpt-5.6-luna@OpenAI", "gpt-5.6-sol@OpenAI"],
      },
    }));
    useAccessStore.setState({
      allowedModels: ["gpt-5.6-luna@OpenAI", "gpt-5.6-sol@OpenAI"],
    });
    const targetSession = session("disabled-summary-target", {
      compressModel: "gpt-5.6-sol",
      compressProviderName: ServiceProvider.OpenAI,
    });
    useChatStore.setState({
      sessions: [targetSession],
      currentSessionIndex: 0,
      temporarySession: undefined,
    } as any);

    await useChatStore.getState().summarizeSession(true, targetSession);

    expect(chat).toHaveBeenCalledTimes(2);
    for (const call of chat.mock.calls) {
      expect(call[0].config).toMatchObject({
        model: "gpt-5.6-luna",
        providerName: ServiceProvider.OpenAI,
        reasoningEffort: "xhigh",
      });
    }
  });

  test("falls back before requesting an override removed from an unrestricted catalog", async () => {
    const provider = {
      id: "openai",
      providerName: ServiceProvider.OpenAI,
      providerType: "openai",
      sorted: 1,
    };
    useAppConfig.setState((state) => ({
      models: [
        {
          name: "gpt-5.6-luna",
          available: true,
          provider,
          sorted: 1,
        },
      ],
      serverConfigSnapshot: {
        ...state.serverConfigSnapshot!,
        allowedModels: [],
      },
    }));
    useAccessStore.setState({ allowedModels: [] });
    const targetSession = session("removed-summary-target", {
      compressModel: "retired-summary-model",
      compressProviderName: ServiceProvider.OpenAI,
    });
    useChatStore.setState({
      sessions: [targetSession],
      currentSessionIndex: 0,
      temporarySession: undefined,
    } as any);

    await useChatStore.getState().summarizeSession(true, targetSession);

    expect(chat).toHaveBeenCalledTimes(2);
    for (const call of chat.mock.calls) {
      expect(call[0].config).toMatchObject({
        model: "gpt-5.6-luna",
        providerName: ServiceProvider.OpenAI,
        reasoningEffort: "xhigh",
      });
    }
  });

  test("trims compression history against the resolved Summary model budget", async () => {
    useAppConfig.setState((state) => ({
      serverConfigSnapshot: {
        ...state.serverConfigSnapshot!,
        forced: {
          ...state.serverConfigSnapshot!.forced,
          max_output_tokens: 100,
        },
      },
    }));
    const targetSession = session("summary-budget", {
      historyMessageCount: 2,
      max_output_tokens: 10000,
    });
    targetSession.messages = Array.from({ length: 6 }, (_, index) => ({
      id: `history-${index}`,
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `${index}-${"x".repeat(400)}`,
      date: "",
    }));
    useChatStore.setState({
      sessions: [targetSession],
      currentSessionIndex: 0,
      temporarySession: undefined,
    } as any);

    await useChatStore.getState().summarizeSession(true, targetSession);

    expect(chat).toHaveBeenCalledTimes(2);
    const compressionMessages = chat.mock.calls[1][0].messages;
    expect(compressionMessages.map((message: any) => message.id)).toEqual([
      "history-4",
      "history-5",
      "summary-session-id",
    ]);
    expect(chat.mock.calls[1][0].config.max_output_tokens).toBe(100);
  });

  test("treats a zero Summary max output value as an unset budget", async () => {
    useAppConfig.setState((state) => ({
      serverConfigSnapshot: {
        ...state.serverConfigSnapshot!,
        forced: {
          ...state.serverConfigSnapshot!.forced,
          max_output_tokens: 0,
        },
      },
    }));
    const targetSession = session("summary-zero-budget", {
      historyMessageCount: 2,
      max_output_tokens: 10000,
    });
    targetSession.messages = Array.from({ length: 6 }, (_, index) => ({
      id: `zero-history-${index}`,
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `${index}-${"x".repeat(400)}`,
      date: "",
    }));
    useChatStore.setState({
      sessions: [targetSession],
      currentSessionIndex: 0,
      temporarySession: undefined,
    } as any);

    await useChatStore.getState().summarizeSession(true, targetSession);

    expect(chat).toHaveBeenCalledTimes(2);
    expect(
      chat.mock.calls[1][0].messages.map((message: any) => message.id),
    ).toEqual([
      "zero-history-0",
      "zero-history-1",
      "zero-history-2",
      "zero-history-3",
      "zero-history-4",
      "zero-history-5",
      "summary-session-id",
    ]);
  });
});
