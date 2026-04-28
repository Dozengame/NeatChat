import { LLMModel } from "../client/api";
import { DalleSize, DalleQuality, DalleStyle } from "../typing";
import { getClientConfig } from "../config/client";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_TTS_ENGINE,
  DEFAULT_TTS_ENGINES,
  DEFAULT_TTS_MODEL,
  DEFAULT_TTS_MODELS,
  DEFAULT_TTS_VOICE,
  DEFAULT_TTS_VOICES,
  StoreKey,
  ServiceProvider,
} from "../constant";
import { createPersistStore } from "../utils/store";
import type { Voice } from "rt-client";
import {
  getMaxOutputTokensForReasoningEffort,
  OPENAI_RESPONSES_DEFAULT_MODEL,
  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
  OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY,
  OPENAI_RESPONSES_DEFAULT_TEMPERATURE,
  type OpenAIChatReasoningEffort,
  type OpenAIResponsesTextVerbosity,
} from "../utils/openai-responses";
import type {
  ModelConfigMeta,
  PublicAppConfig,
} from "../utils/public-app-config";
export type {
  ConfigFieldMeta,
  ConfigSource,
  ModelConfigMeta,
  PublicAppConfig,
} from "../utils/public-app-config";

export type ModelType = (typeof DEFAULT_MODELS)[number]["name"];
export type TTSModelType = (typeof DEFAULT_TTS_MODELS)[number];
export type TTSVoiceType = (typeof DEFAULT_TTS_VOICES)[number];
export type TTSEngineType = (typeof DEFAULT_TTS_ENGINES)[number];

export enum SubmitKey {
  Enter = "Enter",
  CtrlEnter = "Ctrl + Enter",
  ShiftEnter = "Shift + Enter",
  AltEnter = "Alt + Enter",
  MetaEnter = "Meta + Enter",
}

export enum Theme {
  Auto = "auto",
  Dark = "dark",
  Light = "light",
}

const config = getClientConfig();

export type ModelConfig = {
  model: ModelType;
  providerName: ServiceProvider;
  temperature: number;
  top_p: number;
  max_output_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
  sendMemory: boolean;
  historyMessageCount: number;
  compressMessageLengthThreshold: number;
  compressModel: string;
  compressProviderName: string;
  enableInjectSystemPrompts: boolean;
  template: string;
  reasoningEffort?: OpenAIChatReasoningEffort;
  textVerbosity?: OpenAIResponsesTextVerbosity;
  size: DalleSize;
  quality: DalleQuality;
  style: DalleStyle;
};

export type AppConfig = {
  lastUpdate: number;
  submitKey: SubmitKey;
  avatar: string;
  fontSize: number;
  fontFamily: string;
  theme: Theme;
  tightBorder: boolean;
  sendPreviewBubble: boolean;
  enableAutoGenerateTitle: boolean;
  sidebarWidth: number;
  enableArtifacts: boolean;
  enableCodeFold: boolean;
  disablePromptHint: boolean;
  dontShowMaskSplashScreen: boolean;
  hideBuiltinMasks: boolean;
  customModels: string;
  models: LLMModel[];
  modelConfig: ModelConfig;
  modelConfigMeta?: ModelConfigMeta;
  serverConfigSnapshot?: PublicAppConfig;
  ttsConfig: TTSConfig;
  realtimeConfig: RealtimeConfig;
  enableModelSearch: boolean;
  enableThemeChange: boolean;
  enablePromptHints: boolean;
  enableClearContext: boolean;
  enablePlugins: boolean;
  enableShortcuts: boolean;
};

export const DEFAULT_CONFIG: AppConfig = {
  lastUpdate: Date.now(),
  submitKey: SubmitKey.Enter,
  avatar: "1f603",
  fontSize: 14,
  fontFamily: "",
  theme: Theme.Auto,
  tightBorder: !!config?.isApp,
  sendPreviewBubble: true,
  enableAutoGenerateTitle: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  enableArtifacts: true,
  enableCodeFold: true,
  disablePromptHint: false,
  dontShowMaskSplashScreen: true,
  hideBuiltinMasks: false,
  customModels: "",
  models: DEFAULT_MODELS as any as LLMModel[],
  modelConfigMeta: {},
  serverConfigSnapshot: undefined,
  modelConfig: {
    model: OPENAI_RESPONSES_DEFAULT_MODEL as ModelType,
    providerName: "OpenAI" as ServiceProvider,
    temperature: OPENAI_RESPONSES_DEFAULT_TEMPERATURE,
    top_p: 1,
    max_output_tokens: getMaxOutputTokensForReasoningEffort(
      OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
    ),
    presence_penalty: 0,
    frequency_penalty: 0,
    sendMemory: true,
    historyMessageCount: 4,
    compressMessageLengthThreshold: 1000,
    compressModel: "",
    compressProviderName: "",
    enableInjectSystemPrompts: true,
    template: config?.template ?? DEFAULT_INPUT_TEMPLATE,
    reasoningEffort: OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
    textVerbosity: OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY,
    size: "1024x1024" as DalleSize,
    quality: "standard" as DalleQuality,
    style: "vivid" as DalleStyle,
  },
  ttsConfig: {
    enable: false,
    autoplay: false,
    engine: DEFAULT_TTS_ENGINE,
    model: DEFAULT_TTS_MODEL,
    voice: DEFAULT_TTS_VOICE,
    speed: 1.0,
  },
  realtimeConfig: {
    enable: false,
    provider: "OpenAI" as ServiceProvider,
    model: "gpt-4o-realtime-preview-2024-10-01",
    apiKey: "",
    azure: {
      endpoint: "",
      deployment: "",
    },
    temperature: 0.9,
    voice: "alloy" as Voice,
  },
  enableModelSearch: false,
  enableThemeChange: false,
  enablePromptHints: false,
  enableClearContext: true,
  enablePlugins: false,
  enableShortcuts: false,
};

export type ChatConfig = typeof DEFAULT_CONFIG;

export type TTSConfig = {
  enable: boolean;
  autoplay: boolean;
  engine: TTSEngineType;
  model: TTSModelType;
  voice: TTSVoiceType;
  speed: number;
};

export type RealtimeConfig = {
  enable: boolean;
  provider: ServiceProvider;
  model: string;
  apiKey: string;
  azure: {
    endpoint: string;
    deployment: string;
  };
  temperature: number;
  voice: Voice;
};

export function limitNumber(
  x: number,
  min: number,
  max: number,
  defaultValue: number,
) {
  if (isNaN(x)) {
    return defaultValue;
  }

  return Math.min(max, Math.max(min, x));
}

export const TTSConfigValidator = {
  engine(x: string) {
    return x as TTSEngineType;
  },
  model(x: string) {
    return x as TTSModelType;
  },
  voice(x: string) {
    return x as TTSVoiceType;
  },
  speed(x: number) {
    return limitNumber(x, 0.25, 4.0, 1.0);
  },
};

export const ModalConfigValidator = {
  model(x: string) {
    return x as ModelType;
  },
  max_output_tokens(x: number) {
    return limitNumber(x, 0, 512000, 1024);
  },
  compressMessageLengthThreshold(x: number) {
    return limitNumber(x, 500, 4000, 1000);
  },
  presence_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  frequency_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  temperature(x: number) {
    return limitNumber(x, 0, 2, 1);
  },
  top_p(x: number) {
    return limitNumber(x, 0, 1, 1);
  },
  textVerbosity(x: string) {
    return ["low", "medium", "high"].includes(x)
      ? (x as OpenAIResponsesTextVerbosity)
      : OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY;
  },
};

export const useAppConfig = createPersistStore(
  { ...DEFAULT_CONFIG },
  (set, get) => ({
    reset() {
      set(() => ({ ...DEFAULT_CONFIG }));
    },

    mergeModels(newModels: LLMModel[]) {
      if (!newModels || newModels.length === 0) {
        return;
      }

      const oldModels = get().models;
      const modelMap: Record<string, LLMModel> = {};

      for (const model of oldModels) {
        model.available = false;
        modelMap[`${model.name}@${model?.provider?.id}`] = model;
      }

      for (const model of newModels) {
        model.available = true;
        modelMap[`${model.name}@${model?.provider?.id}`] = model;
      }

      set(() => ({
        models: Object.values(modelMap),
      }));
    },

    allModels() {},
  }),
  {
    name: StoreKey.Config,
    version: 4.3,

    merge(persistedState, currentState) {
      const state = persistedState as ChatConfig | undefined;
      if (!state) return { ...currentState };
      const models = currentState.models.slice();
      state.models.forEach((pModel) => {
        const idx = models.findIndex(
          (v) => v.name === pModel.name && v.provider === pModel.provider,
        );
        if (idx !== -1) models[idx] = pModel;
        else models.push(pModel);
      });
      return { ...currentState, ...state, models: models };
    },

    migrate(persistedState, version) {
      const state = persistedState as ChatConfig;
      const modelConfig = state.modelConfig as ModelConfig & {
        max_tokens?: number;
      };

      if (version < 3.4) {
        state.modelConfig.sendMemory = true;
        state.modelConfig.historyMessageCount = 4;
        state.modelConfig.compressMessageLengthThreshold = 1000;
        state.modelConfig.frequency_penalty = 0;
        state.modelConfig.top_p = 1;
        state.modelConfig.template = DEFAULT_INPUT_TEMPLATE;
        state.dontShowMaskSplashScreen = false;
        state.hideBuiltinMasks = false;
      }

      if (version < 3.5) {
        state.customModels = "claude,claude-100k";
      }

      if (version < 3.6) {
        state.modelConfig.enableInjectSystemPrompts = true;
      }

      if (version < 3.7) {
        state.enableAutoGenerateTitle = true;
      }

      if (version < 3.8) {
        state.lastUpdate = Date.now();
      }

      if (version < 3.9) {
        state.modelConfig.template =
          state.modelConfig.template !== DEFAULT_INPUT_TEMPLATE
            ? state.modelConfig.template
            : config?.template ?? DEFAULT_INPUT_TEMPLATE;
      }

      if (version < 4.1) {
        state.modelConfig.compressModel =
          DEFAULT_CONFIG.modelConfig.compressModel;
        state.modelConfig.compressProviderName =
          DEFAULT_CONFIG.modelConfig.compressProviderName;
      }

      if (version < 4.2 && typeof modelConfig.max_output_tokens !== "number") {
        modelConfig.max_output_tokens =
          typeof modelConfig.max_tokens === "number"
            ? modelConfig.max_tokens
            : DEFAULT_CONFIG.modelConfig.max_output_tokens;
      }
      delete modelConfig.max_tokens;

      if (version < 4.3) {
        state.modelConfig.textVerbosity =
          state.modelConfig.textVerbosity ??
          DEFAULT_CONFIG.modelConfig.textVerbosity;
        state.modelConfigMeta = state.modelConfigMeta ?? {};
        state.serverConfigSnapshot = state.serverConfigSnapshot ?? undefined;
      }

      return state as any;
    },
  },
);
