jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("../app/client/api", () => ({
  getHeaders: () => ({}),
  getClientApi: jest.fn(),
  ClientApi: jest.fn(),
}));

import { ServiceProvider } from "../app/constant";
import { applyPublicAppConfig, useAccessStore } from "../app/store/access";
import { useChatStore } from "../app/store/chat";
import {
  DEFAULT_CONFIG,
  type ModelConfig,
  type ModelConfigMeta,
  useAppConfig,
} from "../app/store/config";
import type { PublicAppConfig } from "../app/utils/public-app-config";

function publicConfig(): PublicAppConfig {
  return {
    schemaVersion: 1,
    configVersion: "gpt6-migration",
    configHash: "gpt6-migration-hash",
    updatedAt: "2026-09-23T00:00:00.000Z",
    defaults: {
      model: "gpt-6-luna",
      providerName: ServiceProvider.OpenAI,
      reasoningEffort: "xhigh",
      reasoningMode: "standard",
      reasoningContext: "auto",
      inputImageDetail: "high",
      promptCacheMode: "explicit",
      promptCacheKey: "",
      temperature: 1,
      textVerbosity: "medium",
      store: false,
    },
    forced: { baseUrlLocked: true, apiKeyLocked: true },
    allowedModels: ["gpt-6-luna@OpenAI", "gpt-image-2.5-flare@OpenAI"],
    lockedFields: [
      "customModels",
      "baseUrl",
      "apiKey",
      "temperature",
      "textVerbosity",
      "reasoningMode",
      "reasoningContext",
      "inputImageDetail",
      "promptCacheMode",
      "promptCacheKey",
    ],
    reasoningEffortDefaults: {
      default: "medium",
      models: { "gpt-6-luna": "xhigh" },
    },
    reasoningEffortAllowlist: {
      default: ["low", "medium"],
      models: {
        "gpt-6-sol": ["low", "medium", "high"],
        "gpt-6-luna": ["low", "medium", "high", "xhigh", "max"],
      },
    },
    serverFlags: {
      needCode: false,
      hideUserApiKey: true,
      hideBalanceQuery: true,
      disableFastLink: false,
      disableGPT4: false,
    },
    legacy: {
      customModels: "-all,gpt-6-luna@openai,gpt-image-2.5-flare@openai",
      defaultModel: "gpt-6-luna",
      openaiReasoningEffort: "*=medium;gpt-6-luna=xhigh",
    },
  };
}

const imageParameters: Partial<ModelConfig> = {
  size: "3840x2160",
  quality: "high",
  background: "opaque",
  output_format: "webp",
  output_compression: 72,
};

function modelConfig(model: string): ModelConfig {
  return {
    ...DEFAULT_CONFIG.modelConfig,
    model: model as any,
    providerName: ServiceProvider.OpenAI,
    reasoningEffort: "medium",
    max_output_tokens: 75000,
    ...imageParameters,
  };
}

function overrideMeta(
  source: "user_override" | "conversation_override",
): ModelConfigMeta {
  return {
    model: { source, updatedAt: Date.parse("2026-09-23T00:00:00Z") },
    providerName: { source, updatedAt: Date.parse("2026-09-23T00:00:00Z") },
    reasoningEffort: {
      source: "server_default",
      updatedAt: Date.parse("2026-09-23T00:00:00Z"),
    },
    max_output_tokens: {
      source,
      updatedAt: Date.parse("2026-09-23T00:00:00Z"),
    },
  };
}

function session(id: string, model: string, syncGlobalConfig = false) {
  return {
    id,
    topic: "preserved topic",
    memoryPrompt: "preserved summary",
    messages: [
      {
        id: `${id}-message`,
        role: "assistant",
        model,
        content: `![saved image](https://example.test/${id}.png)`,
        date: "2026/09/22 10:00:00",
      },
    ],
    stat: { tokenCount: 10, wordCount: 4, charCount: 20 },
    lastUpdate: 123,
    lastSummarizeIndex: 0,
    customInstructions: "preserved conversation instructions",
    mask: {
      id: `mask-${id}`,
      avatar: "gpt-bot",
      name: "m",
      context: [],
      syncGlobalConfig,
      modelConfig: modelConfig(model),
      modelConfigMeta: overrideMeta("conversation_override"),
      lang: "cn",
      builtin: false,
      createdAt: 123,
      plugin: [],
    },
  };
}

describe("GPT-6 and Flare public configuration migration", () => {
  beforeEach(() => {
    useAppConfig.setState({
      modelConfig: modelConfig("gpt-5.6-luna"),
      modelConfigMeta: overrideMeta("user_override"),
      serverConfigSnapshot: undefined,
      customModels: "",
    });
    useAccessStore.setState({
      allowedModels: [],
      lockedFields: [],
      serverConfigSnapshot: undefined,
      openaiReasoningEffort: "medium",
      openaiMaxOutputTokens: undefined,
    });
    useChatStore.setState({
      sessions: [],
      temporarySession: undefined,
      currentSessionIndex: -1,
    } as any);
  });

  test("migrates global, ordinary and temporary GPT-5.6 configs to Luna", () => {
    const ordinary = session("ordinary", "gpt-5.6-terra");
    const synced = session("synced", "gpt-5.6-sol", true);
    const temporary = session("temporary", "gpt-5.6-luna");
    useChatStore.setState({
      sessions: [ordinary, synced],
      temporarySession: temporary,
      currentSessionIndex: 0,
    } as any);

    applyPublicAppConfig(publicConfig());

    const global = useAppConfig.getState();
    const chat = useChatStore.getState();
    const configurations = [
      global.modelConfig,
      ...chat.sessions.map((item) => item.mask.modelConfig),
      chat.temporarySession!.mask.modelConfig,
    ];
    for (const config of configurations) {
      expect(config).toMatchObject({
        model: "gpt-6-luna",
        providerName: ServiceProvider.OpenAI,
        reasoningEffort: "xhigh",
        max_output_tokens: 75000,
      });
    }
    expect(chat.sessions[0].messages).toEqual(ordinary.messages);
    expect(chat.sessions[1].messages).toEqual(synced.messages);
    expect(chat.temporarySession!.messages).toEqual(temporary.messages);
    expect(global.modelConfigMeta?.model?.locked).not.toBe(true);
    expect(chat.sessions[0].mask.modelConfigMeta?.model?.locked).not.toBe(true);
    expect(chat.temporarySession!.mask.modelConfigMeta?.model?.locked).not.toBe(
      true,
    );
    expect(useAccessStore.getState().allowedModels).toEqual(
      publicConfig().allowedModels,
    );
  });

  test.each([1, 2, 3])(
    "keeps image mode and image settings after %s configuration loads",
    (loads) => {
      useAppConfig.setState({ modelConfig: modelConfig("gpt-image-2") });
      const ordinary = session("ordinary-image", "gpt-image-2");
      const synced = session("synced-image", "gpt-image-2", true);
      const temporary = session("temporary-image", "gpt-image-2-2026-04-21");
      useChatStore.setState({
        sessions: [ordinary, synced],
        temporarySession: temporary,
        currentSessionIndex: 0,
      } as any);

      for (let load = 0; load < loads; load += 1) {
        applyPublicAppConfig(publicConfig());
      }

      const global = useAppConfig.getState();
      const chat = useChatStore.getState();
      for (const config of [
        global.modelConfig,
        ...chat.sessions.map((item) => item.mask.modelConfig),
        chat.temporarySession!.mask.modelConfig,
      ]) {
        expect(config).toMatchObject({
          model: "gpt-image-2.5-flare",
          providerName: ServiceProvider.OpenAI,
          ...imageParameters,
        });
      }
      expect(chat.sessions[0].messages).toEqual(ordinary.messages);
      expect(chat.sessions[1].messages).toEqual(synced.messages);
      expect(chat.temporarySession!.messages).toEqual(temporary.messages);
      expect(chat.sessions[0].memoryPrompt).toBe(ordinary.memoryPrompt);
      expect(global.modelConfigMeta?.model?.locked).not.toBe(true);
      expect(
        chat.temporarySession!.mask.modelConfigMeta?.model?.locked,
      ).not.toBe(true);
    },
  );

  test("preserves the migrated image selection through persistence and a new config version", () => {
    useAppConfig.setState({ modelConfig: modelConfig("gpt-image-2") });
    applyPublicAppConfig(publicConfig());
    const saved = JSON.parse(JSON.stringify(useAppConfig.getState()));
    useAppConfig.setState({
      modelConfig: saved.modelConfig,
      modelConfigMeta: saved.modelConfigMeta,
      serverConfigSnapshot: saved.serverConfigSnapshot,
    });
    const next = publicConfig();
    next.configVersion = "gpt6-next";
    next.configHash = "gpt6-next-hash";
    applyPublicAppConfig(next);
    expect(useAppConfig.getState().modelConfig).toMatchObject({
      model: "gpt-image-2.5-flare",
      ...imageParameters,
    });
    expect(useAppConfig.getState().modelConfigMeta?.model).toMatchObject({
      source: "user_override",
      locked: false,
    });
  });

  test.each(["locked", "removed"])(
    "respects an administrator %s image selection",
    (policy) => {
      useAppConfig.setState({ modelConfig: modelConfig("gpt-image-2") });
      applyPublicAppConfig(publicConfig());
      const next = publicConfig();
      if (policy === "locked") {
        next.lockedFields.push("model", "providerName");
        next.forced.model = "gpt-6-luna";
        next.forced.providerName = ServiceProvider.OpenAI;
      } else {
        next.allowedModels = ["gpt-6-luna@OpenAI"];
      }
      applyPublicAppConfig(next);
      expect(useAppConfig.getState().modelConfig.model).toBe("gpt-6-luna");
    },
  );

  test("keeps ordinary chat fallback following later server defaults", () => {
    applyPublicAppConfig(publicConfig());
    const next = publicConfig();
    next.defaults.model = "gpt-6-sol";
    next.allowedModels.push("gpt-6-sol@OpenAI");
    applyPublicAppConfig(next);
    expect(useAppConfig.getState().modelConfig.model).toBe("gpt-6-sol");
  });
});
