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
import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";
import { useChatStore } from "../app/store/chat";
import { ServiceProvider } from "../app/constant";
import type { PublicAppConfig } from "../app/utils/public-app-config";

function publicConfig(overrides: Partial<PublicAppConfig> = {}): PublicAppConfig {
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
