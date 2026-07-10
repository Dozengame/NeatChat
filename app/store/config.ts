import { LLMModel } from "../client/types";
import {
  DalleStyle,
  OpenAIImageBackground,
  OpenAIImageModeration,
  OpenAIImageOutputFormat,
  OpenAIImageQuality,
  OpenAIImageSize,
} from "../typing";
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
  getOpenAIResponsesMaxOutputTokensLimit,
  OPENAI_RESPONSES_DEFAULT_MODEL,
  OPENAI_RESPONSES_DEFAULT_INPUT_IMAGE_DETAIL,
  OPENAI_RESPONSES_DEFAULT_PROMPT_CACHE_MODE,
  OPENAI_RESPONSES_DEFAULT_REASONING_CONTEXT,
  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
  OPENAI_RESPONSES_DEFAULT_REASONING_MODE,
  OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY,
  OPENAI_RESPONSES_DEFAULT_TEMPERATURE,
  parseOpenAIResponsesInputImageDetail,
  parseOpenAIResponsesPromptCacheKey,
  parseOpenAIResponsesPromptCacheMode,
  parseOpenAIResponsesReasoningContext,
  parseOpenAIResponsesReasoningMode,
  type OpenAIChatReasoningEffort,
  type OpenAIResponsesInputImageDetail,
  type OpenAIResponsesPromptCacheMode,
  type OpenAIResponsesReasoningContext,
  type OpenAIResponsesReasoningMode,
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

const LEGACY_DEFAULT_CUSTOM_INSTRUCTIONS = `回答前先在内部理清问题，不展示完整推理过程、内部标签或逐步思考。
默认用自然、像真人的中文表达：少官腔、少模板，直白克制，不油腻、不居高临下。先给结论/建议，再给 2–4 条关键理由；必要时补步骤、风险和注意事项。除非我要求“展开”，否则优先短而有用。
在不影响准确性和简洁性的前提下，尽量用第一性原理点出本质：目标、关键变量、主要约束，然后再给建议和行动；不要机械套用模板。
尽量具体，能给路径、按钮、步骤、数字、时间点、示例，就不要只讲抽象原则。信息不足时，先按常见前提给可用方案，再问 1–2 个关键问题。
可以表达倾向，但要区分事实、推测和个人判断。不确定时说明不确定点，并给验证方法。涉及风险、成本或可能误解时，提前说明触发条件、影响范围和替代方案。
语言上少用“不是……而是……”“既……又……”“不仅……更……”等对称句式，避免把破折号当成固定解释方式。默认自然段为主，复杂问题可用少量小标题或要点。
场景开关：
- “工作模式 / 写方案 / 写给老板”：更克制清晰，强调结论、依据、步骤、风险。
- “聊天模式 / 更口语 / 随便聊聊”：更放松，更像真人对话，事实仍谨慎。
- “展开”：补充细节、例子、备选方案和权衡。
需要联网检索时，优先英文或非中文来源；如必须用中文来源，标注“中文来源，需谨慎核对”。`;

export const DEFAULT_CUSTOM_INSTRUCTIONS = `你是资深全栈开发工程师，游戏设计师，提示词优化专家。擅长后端开发、H5前端开发和互联网行业的所有专业知识与技巧。回答问题时，优先提供可执行、可靠、贴近实际场景的建议。

先理解用户的目标、上下文和约束；信息不完整时，先基于常见前提给出可用答案，再补充 1–2 个关键澄清问题。不要为了追求完整而过度追问。

面向用户时，必须使用中文回复，专有名词保留 English。表达清楚、直接、简洁，像对一个聪明但没看代码的人说明问题。优先输出：结论、原因、建议方案、必要风险或注意事项。需要时再补充步骤、示例、代码或配置。

如果存在多个方案，简要说明优缺点，并明确推荐方案和原因，不回避成本、限制和风险。避免空话、过程汇报腔、无关术语和不必要的实现细节。`;

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
  store: boolean;
  reasoningEffort?: OpenAIChatReasoningEffort;
  reasoningMode?: OpenAIResponsesReasoningMode;
  reasoningContext?: OpenAIResponsesReasoningContext;
  inputImageDetail?: OpenAIResponsesInputImageDetail;
  promptCacheMode?: OpenAIResponsesPromptCacheMode;
  promptCacheKey?: string;
  textVerbosity?: OpenAIResponsesTextVerbosity;
  size: OpenAIImageSize;
  quality: OpenAIImageQuality;
  style?: DalleStyle;
  background?: OpenAIImageBackground;
  output_format?: OpenAIImageOutputFormat;
  output_compression?: number;
  moderation?: OpenAIImageModeration;
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
  enableCustomInstructions: boolean;
  customInstructions: string;
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
  enableCustomInstructions: true,
  customInstructions: DEFAULT_CUSTOM_INSTRUCTIONS,
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
    store: false,
    reasoningEffort: OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
    reasoningMode: OPENAI_RESPONSES_DEFAULT_REASONING_MODE,
    reasoningContext: OPENAI_RESPONSES_DEFAULT_REASONING_CONTEXT,
    inputImageDetail: OPENAI_RESPONSES_DEFAULT_INPUT_IMAGE_DETAIL,
    promptCacheMode: OPENAI_RESPONSES_DEFAULT_PROMPT_CACHE_MODE,
    promptCacheKey: "",
    textVerbosity: OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY,
    size: "1024x1024" as OpenAIImageSize,
    quality: "standard" as OpenAIImageQuality,
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

export type CustomInstructionsConfig = Pick<
  AppConfig,
  "enableCustomInstructions" | "customInstructions"
>;

export function getEnabledCustomInstructions(config: CustomInstructionsConfig) {
  if (!config.enableCustomInstructions) {
    return "";
  }

  return config.customInstructions.trim();
}

export function applyCustomInstructionsDefaults<
  T extends Partial<CustomInstructionsConfig>,
>(state: T) {
  const customInstructions = state.customInstructions?.trim() ?? "";
  const shouldApplyDefault =
    customInstructions.length === 0 ||
    customInstructions === LEGACY_DEFAULT_CUSTOM_INSTRUCTIONS.trim();

  if (shouldApplyDefault) {
    state.enableCustomInstructions = DEFAULT_CONFIG.enableCustomInstructions;
    state.customInstructions = DEFAULT_CONFIG.customInstructions;
    return state;
  }

  state.enableCustomInstructions =
    state.enableCustomInstructions ?? DEFAULT_CONFIG.enableCustomInstructions;
  return state;
}

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
  max_output_tokens(x: number, model?: string) {
    return limitNumber(
      x,
      0,
      getOpenAIResponsesMaxOutputTokensLimit(model),
      1024,
    );
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
  reasoningMode: parseOpenAIResponsesReasoningMode,
  reasoningContext: parseOpenAIResponsesReasoningContext,
  inputImageDetail: parseOpenAIResponsesInputImageDetail,
  promptCacheMode: parseOpenAIResponsesPromptCacheMode,
  promptCacheKey(x: string) {
    return parseOpenAIResponsesPromptCacheKey(x) ?? "";
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
    version: 4.6,

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

      if (version < 4.6) {
        applyCustomInstructionsDefaults(state);
      }

      return state as any;
    },
  },
);
