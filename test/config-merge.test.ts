jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("../app/client/api", () => ({
  getHeaders: () => ({}),
  getClientApi: jest.fn(),
  ClientApi: jest.fn(),
}));

import {
  applyPublicAppConfig,
  sanitizeAccessPersistedState,
} from "../app/store/access";
import {
  DEFAULT_CONFIG,
  ModalConfigValidator,
  useAppConfig,
} from "../app/store/config";
import { useChatStore } from "../app/store/chat";
import { ServiceProvider } from "../app/constant";
import type { PublicAppConfig } from "../app/utils/public-app-config";

function publicConfig(
  overrides: Partial<PublicAppConfig> = {},
): PublicAppConfig {
  const base: PublicAppConfig = {
    schemaVersion: 1,
    configVersion: "v1",
    configHash: "hash-1",
    updatedAt: "2026-04-28T00:00:00.000Z",
    defaults: {
      model: "gpt-5.5",
      providerName: "OpenAI",
      temperature: 1,
      max_output_tokens: 10000,
      reasoningEffort: "low",
      textVerbosity: "low",
      compressMessageLengthThreshold: 1200,
      historyMessageCount: 4,
      sendMemory: true,
      enableInjectSystemPrompts: true,
      template: "{{input}}",
    },
    forced: {
      model: "gpt-5.5",
      providerName: "OpenAI",
      baseUrlLocked: true,
      apiKeyLocked: true,
      temperature: 1,
      textVerbosity: "low",
    },
    allowedModels: ["gpt-5.5@OpenAI"],
    lockedFields: [
      "customModels",
      "model",
      "providerName",
      "baseUrl",
      "apiKey",
      "temperature",
      "textVerbosity",
    ],
    serverFlags: {
      needCode: false,
      hideUserApiKey: true,
      hideBalanceQuery: true,
      disableFastLink: false,
      disableGPT4: false,
    },
    legacy: {
      customModels: "-all,gpt-5.5@openai",
      defaultModel: "gpt-5.5",
      defaultTemperature: 1,
      openaiReasoningEffort: "low",
      openaiTextVerbosity: "low",
      compressMessageLengthThreshold: 1200,
    },
  };

  return {
    ...base,
    ...overrides,
    defaults: { ...base.defaults, ...(overrides.defaults ?? {}) },
    forced: { ...base.forced, ...(overrides.forced ?? {}) },
    serverFlags: { ...base.serverFlags, ...(overrides.serverFlags ?? {}) },
    legacy: { ...base.legacy, ...(overrides.legacy ?? {}) },
  };
}

function session(maxOutputTokens: number, syncGlobalConfig: boolean) {
  return {
    id: "s1",
    topic: "t",
    memoryPrompt: "",
    messages: [],
    stat: { tokenCount: 0, wordCount: 0, charCount: 0 },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,
    mask: {
      id: "m1",
      avatar: "gpt-bot",
      name: "m",
      context: [],
      syncGlobalConfig,
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "gpt-4o" as any,
        providerName: ServiceProvider.OpenAI,
        max_output_tokens: maxOutputTokens,
        compressMessageLengthThreshold: 1500,
      },
      modelConfigMeta: {},
      lang: "cn",
      builtin: false,
      createdAt: Date.now(),
      plugin: [],
    },
  };
}

describe("applyPublicAppConfig", () => {
  beforeEach(() => {
    useAppConfig.setState({
      modelConfig: { ...DEFAULT_CONFIG.modelConfig },
      modelConfigMeta: {},
      serverConfigSnapshot: undefined,
      customModels: "",
    });
    useChatStore.setState({
      sessions: [],
      temporarySession: session(12345, false) as any,
      currentSessionIndex: -1,
    } as any);
  });

  test("forces locked model and keeps unlocked conversation max_output_tokens", () => {
    applyPublicAppConfig(publicConfig());

    const current = useChatStore.getState().temporarySession!;
    expect(current.mask.modelConfig.model).toBe("gpt-5.5");
    expect(current.mask.modelConfig.providerName).toBe("OpenAI");
    expect(current.mask.modelConfig.temperature).toBe(1);
    expect(current.mask.modelConfig.reasoningEffort).toBe("low");
    expect(current.mask.modelConfig.textVerbosity).toBe("low");
    expect(current.mask.modelConfig.max_output_tokens).toBe(12345);
  });

  test("keeps conversation reasoning effort independent from server default", () => {
    useChatStore.setState({
      temporarySession: {
        ...(session(12345, false) as any),
        mask: {
          ...(session(12345, false) as any).mask,
          modelConfig: {
            ...(session(12345, false) as any).mask.modelConfig,
            reasoningEffort: "high",
            max_output_tokens: 30000,
          },
        },
      },
    } as any);

    applyPublicAppConfig(publicConfig());

    const current = useChatStore.getState().temporarySession!;
    expect(current.mask.modelConfig.reasoningEffort).toBe("high");
    expect(current.mask.modelConfig.max_output_tokens).toBe(30000);
  });

  test("propagates GPT-5.6 response capability defaults to global and synced sessions", () => {
    useChatStore.setState({
      temporarySession: session(12345, true) as any,
    } as any);

    applyPublicAppConfig(
      publicConfig({
        defaults: {
          model: "gpt-5.6-terra",
          providerName: "OpenAI",
          reasoningMode: "pro",
          reasoningContext: "all_turns",
          inputImageDetail: "original",
          promptCacheMode: "explicit",
          promptCacheKey: "project-neatchat",
        } as any,
        forced: {
          model: "gpt-5.6-terra",
          providerName: "OpenAI",
        },
        allowedModels: ["gpt-5.6-terra@OpenAI"],
        legacy: {
          customModels: "-all,gpt-5.6-terra@openai",
          defaultModel: "gpt-5.6-terra",
        },
      }),
    );

    expect(useAppConfig.getState().modelConfig).toMatchObject({
      reasoningMode: "pro",
      reasoningContext: "all_turns",
      inputImageDetail: "original",
      promptCacheMode: "explicit",
      promptCacheKey: "project-neatchat",
    });
    expect(
      useChatStore.getState().temporarySession!.mask.modelConfig,
    ).toMatchObject({
      reasoningMode: "pro",
      reasoningContext: "all_turns",
      inputImageDetail: "original",
      promptCacheMode: "explicit",
      promptCacheKey: "project-neatchat",
    });
  });

  test("preserves unsynced GPT-5.6 capability overrides", () => {
    const overriddenSession = session(12345, false) as any;
    overriddenSession.mask.modelConfig.model = "gpt-5.6-terra";
    Object.assign(overriddenSession.mask.modelConfig, {
      reasoningMode: "standard",
      reasoningContext: "current_turn",
      inputImageDetail: "low",
      promptCacheMode: "implicit",
      promptCacheKey: "conversation-key",
    });
    useChatStore.setState({
      temporarySession: overriddenSession,
    } as any);

    applyPublicAppConfig(
      publicConfig({
        defaults: {
          model: "gpt-5.6-terra",
          providerName: "OpenAI",
          reasoningMode: "pro",
          reasoningContext: "all_turns",
          inputImageDetail: "original",
          promptCacheMode: "explicit",
          promptCacheKey: "server-key",
        } as any,
        forced: {
          model: "gpt-5.6-terra",
          providerName: "OpenAI",
        },
        allowedModels: ["gpt-5.6-terra@OpenAI"],
      }),
    );

    expect(
      useChatStore.getState().temporarySession!.mask.modelConfig,
    ).toMatchObject({
      reasoningMode: "standard",
      reasoningContext: "current_turn",
      inputImageDetail: "low",
      promptCacheMode: "implicit",
      promptCacheKey: "conversation-key",
    });
  });

  test("hydrates missing GPT-5.6 capability fields in old unsynced sessions", () => {
    const persistedSession = session(12345, false) as any;
    persistedSession.mask.modelConfig.model = "gpt-5.6-terra";
    for (const field of [
      "reasoningMode",
      "reasoningContext",
      "inputImageDetail",
      "promptCacheMode",
      "promptCacheKey",
    ]) {
      delete persistedSession.mask.modelConfig[field];
    }
    useChatStore.setState({
      temporarySession: persistedSession,
    } as any);

    applyPublicAppConfig(
      publicConfig({
        defaults: {
          model: "gpt-5.6-terra",
          providerName: "OpenAI",
          reasoningMode: "pro",
          reasoningContext: "all_turns",
          inputImageDetail: "original",
          promptCacheMode: "explicit",
          promptCacheKey: "server-key",
        } as any,
        forced: {
          model: "gpt-5.6-terra",
          providerName: "OpenAI",
        },
        allowedModels: ["gpt-5.6-terra@OpenAI"],
      }),
    );

    const current = useChatStore.getState().temporarySession!;
    expect(current.mask.modelConfig).toMatchObject({
      reasoningMode: "pro",
      reasoningContext: "all_turns",
      inputImageDetail: "original",
      promptCacheMode: "explicit",
      promptCacheKey: "server-key",
    });
    expect(current.mask.modelConfigMeta).toMatchObject({
      reasoningMode: { source: "server_default" },
      reasoningContext: { source: "server_default" },
      inputImageDetail: { source: "server_default" },
      promptCacheMode: { source: "server_default" },
      promptCacheKey: { source: "server_default" },
    });
  });

  test("keeps an allowed conversation model selectable when only customModels is locked", () => {
    useChatStore.setState({
      temporarySession: {
        ...(session(12345, false) as any),
        mask: {
          ...(session(12345, false) as any).mask,
          modelConfig: {
            ...(session(12345, false) as any).mask.modelConfig,
            model: "gpt-image-2",
            providerName: ServiceProvider.OpenAI,
          },
        },
      },
    } as any);

    applyPublicAppConfig(
      publicConfig({
        defaults: {
          model: "gpt-5.4",
          providerName: "OpenAI",
        },
        forced: {
          model: "gpt-5.4",
          providerName: "OpenAI",
        },
        allowedModels: ["gpt-5.4@OpenAI", "gpt-image-2@OpenAI"],
        lockedFields: [
          "customModels",
          "baseUrl",
          "apiKey",
          "temperature",
          "textVerbosity",
        ],
        legacy: {
          customModels: "-all,gpt-5.4@openai,gpt-image-2@openai",
          defaultModel: "gpt-5.4",
        },
      }),
    );

    const current = useChatStore.getState().temporarySession!;
    expect(current.mask.modelConfig.model).toBe("gpt-image-2");
    expect(current.mask.modelConfig.providerName).toBe("OpenAI");
  });

  test("moves a disallowed GPT-5.4 session to Terra while preserving allowed Luna", () => {
    const oldSession = session(512000, false) as any;
    oldSession.mask.modelConfig.model = "gpt-5.4";
    const lunaSession = session(30000, false) as any;
    lunaSession.id = "s2";
    lunaSession.mask.modelConfig.model = "gpt-5.6-luna";

    useChatStore.setState({
      sessions: [oldSession, lunaSession],
      temporarySession: undefined,
      currentSessionIndex: 0,
    } as any);

    applyPublicAppConfig(
      publicConfig({
        defaults: {
          model: "gpt-5.6-terra",
          providerName: "OpenAI",
        },
        forced: {
          model: "gpt-5.6-terra",
          providerName: "OpenAI",
        },
        allowedModels: [
          "gpt-5.6@OpenAI",
          "gpt-5.6-sol@OpenAI",
          "gpt-5.6-terra@OpenAI",
          "gpt-5.6-luna@OpenAI",
        ],
        lockedFields: ["customModels", "baseUrl", "apiKey"],
        legacy: {
          customModels:
            "-all,gpt-5.6@openai,gpt-5.6-sol@openai,gpt-5.6-terra@openai,gpt-5.6-luna@openai",
          defaultModel: "gpt-5.6-terra",
        },
      }),
    );

    expect(useChatStore.getState().sessions[0].mask.modelConfig.model).toBe(
      "gpt-5.6-terra",
    );
    expect(
      useChatStore.getState().sessions[0].mask.modelConfig.max_output_tokens,
    ).toBe(128000);
    expect(useChatStore.getState().sessions[1].mask.modelConfig.model).toBe(
      "gpt-5.6-luna",
    );
    expect(
      useChatStore.getState().sessions[1].mask.modelConfig.max_output_tokens,
    ).toBe(30000);
  });

  test.each(["gpt-5.6", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"])(
    "caps %s max_output_tokens at 128K in the config validator",
    (model) => {
      expect(ModalConfigValidator.max_output_tokens(512000, model)).toBe(
        128000,
      );
    },
  );

  test("reapplies GPT-5.6 constraints when the public config snapshot is unchanged", () => {
    const unchangedConfig = publicConfig({
      defaults: {
        model: "gpt-5.6-terra",
        providerName: "OpenAI",
        max_output_tokens: 128000,
      },
      forced: {
        model: "gpt-5.6-terra",
        providerName: "OpenAI",
      },
      allowedModels: ["gpt-5.6-terra@OpenAI"],
      legacy: {
        customModels: "-all,gpt-5.6-terra@openai",
        defaultModel: "gpt-5.6-terra",
      },
    });
    const staleSession = session(512000, false) as any;
    staleSession.mask.modelConfig.model = "gpt-5.4";

    useAppConfig.setState({
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "gpt-5.4" as any,
        max_output_tokens: 512000,
      },
      modelConfigMeta: {},
      serverConfigSnapshot: unchangedConfig,
    });
    useChatStore.setState({
      sessions: [staleSession],
      temporarySession: undefined,
      currentSessionIndex: 0,
    } as any);

    applyPublicAppConfig(unchangedConfig);

    expect(useAppConfig.getState().modelConfig).toMatchObject({
      model: "gpt-5.6-terra",
      max_output_tokens: 128000,
    });
    expect(useChatStore.getState().sessions[0].mask.modelConfig).toMatchObject({
      model: "gpt-5.6-terra",
      max_output_tokens: 128000,
    });
  });

  test("forces max_output_tokens when admin sets a numeric value", () => {
    applyPublicAppConfig(
      publicConfig({
        forced: { max_output_tokens: 30000 },
        lockedFields: [
          "customModels",
          "model",
          "providerName",
          "baseUrl",
          "apiKey",
          "temperature",
          "textVerbosity",
          "max_output_tokens",
        ],
        legacy: {
          customModels: "-all,gpt-5.5@openai",
          openaiMaxOutputTokens: 30000,
        },
      }),
    );

    expect(
      useChatStore.getState().temporarySession!.mask.modelConfig
        .max_output_tokens,
    ).toBe(30000);
  });

  test("updates global default compression threshold but keeps session override", () => {
    applyPublicAppConfig(publicConfig());

    expect(
      useAppConfig.getState().modelConfig.compressMessageLengthThreshold,
    ).toBe(1200);
    expect(
      useChatStore.getState().temporarySession!.mask.modelConfig
        .compressMessageLengthThreshold,
    ).toBe(1500);
  });

  test("syncGlobalConfig sessions follow global effective config", () => {
    useChatStore.setState({
      temporarySession: session(12345, true) as any,
    } as any);

    applyPublicAppConfig(publicConfig());

    expect(
      useChatStore.getState().temporarySession!.mask.modelConfig
        .max_output_tokens,
    ).toBe(10000);
  });
});

describe("sanitizeAccessPersistedState", () => {
  test("does not restore a stale access-code validating state", () => {
    expect(
      sanitizeAccessPersistedState({
        accessCode: "code",
        isValidatingAccessCode: true,
      }),
    ).toMatchObject({
      accessCode: "code",
      isValidatingAccessCode: false,
    });
  });
});
