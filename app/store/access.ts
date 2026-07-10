import {
  GoogleSafetySettingsThreshold,
  ServiceProvider,
  StoreKey,
  ApiPath,
  ACCESS_CODE_PREFIX,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
  GEMINI_BASE_URL,
  BAIDU_BASE_URL,
  BYTEDANCE_BASE_URL,
  ALIBABA_BASE_URL,
  TENCENT_BASE_URL,
  MOONSHOT_BASE_URL,
  STABILITY_BASE_URL,
  IFLYTEK_BASE_URL,
  XAI_BASE_URL,
  CHATGLM_BASE_URL,
} from "../constant";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import { ensure } from "../utils/clone";
import {
  DEFAULT_CONFIG,
  ModelConfig,
  ModelConfigMeta,
  useAppConfig,
} from "./config";
import {
  createConfigFieldMeta,
  isPublicConfigFieldLocked,
  normalizeModelRef,
  resolveAllowedModelRef,
  splitModelRef,
  type PublicAppConfig,
} from "../utils/public-app-config";
import {
  applyOpenAIResponsesModelConstraints,
  OPENAI_RESPONSES_DEFAULT_MODEL,
} from "../utils/openai-responses";
import {
  getAccessCodeValidationServerId,
  isAccessCodeValidationCurrent,
} from "../utils/access-code-validation";
import {
  applyChatStateUpdate,
  getRegisteredChatStore,
} from "./chat-state-link";

let isFetchingConfig = false;
let hasFetchedConfig = false;

const isApp = getClientConfig()?.buildMode === "export";
const ACCESS_CODE_VALIDATE_TIMEOUT_MS = 15_000;

const DEFAULT_OPENAI_URL = isApp ? OPENAI_BASE_URL : ApiPath.OpenAI;

const DEFAULT_GOOGLE_URL = isApp ? GEMINI_BASE_URL : ApiPath.Google;

const DEFAULT_ANTHROPIC_URL = isApp ? ANTHROPIC_BASE_URL : ApiPath.Anthropic;

const DEFAULT_BAIDU_URL = isApp ? BAIDU_BASE_URL : ApiPath.Baidu;

const DEFAULT_BYTEDANCE_URL = isApp ? BYTEDANCE_BASE_URL : ApiPath.ByteDance;

const DEFAULT_ALIBABA_URL = isApp ? ALIBABA_BASE_URL : ApiPath.Alibaba;

const DEFAULT_TENCENT_URL = isApp ? TENCENT_BASE_URL : ApiPath.Tencent;

const DEFAULT_MOONSHOT_URL = isApp ? MOONSHOT_BASE_URL : ApiPath.Moonshot;

const DEFAULT_STABILITY_URL = isApp ? STABILITY_BASE_URL : ApiPath.Stability;

const DEFAULT_IFLYTEK_URL = isApp ? IFLYTEK_BASE_URL : ApiPath.Iflytek;

const DEFAULT_XAI_URL = isApp ? XAI_BASE_URL : ApiPath.XAI;

const DEFAULT_CHATGLM_URL = isApp ? CHATGLM_BASE_URL : ApiPath.ChatGLM;

const DEFAULT_ACCESS_STATE = {
  accessCode: "",
  validatedAccessCode: "",
  accessCodeValidatedAt: 0,
  accessCodeValidatedServerId: "",
  isValidatingAccessCode: false,
  accessCodeError: "",
  useCustomConfig: false,

  provider: ServiceProvider.OpenAI,

  // openai
  openaiUrl: DEFAULT_OPENAI_URL,
  openaiApiKey: "",

  // azure
  azureUrl: "",
  azureApiKey: "",
  azureApiVersion: "2023-08-01-preview",

  // google ai studio
  googleUrl: DEFAULT_GOOGLE_URL,
  googleApiKey: "",
  googleApiVersion: "v1",
  googleSafetySettings: GoogleSafetySettingsThreshold.BLOCK_ONLY_HIGH,

  // anthropic
  anthropicUrl: DEFAULT_ANTHROPIC_URL,
  anthropicApiKey: "",
  anthropicApiVersion: "2023-06-01",

  // baidu
  baiduUrl: DEFAULT_BAIDU_URL,
  baiduApiKey: "",
  baiduSecretKey: "",

  // bytedance
  bytedanceUrl: DEFAULT_BYTEDANCE_URL,
  bytedanceApiKey: "",

  // alibaba
  alibabaUrl: DEFAULT_ALIBABA_URL,
  alibabaApiKey: "",

  // moonshot
  moonshotUrl: DEFAULT_MOONSHOT_URL,
  moonshotApiKey: "",

  //stability
  stabilityUrl: DEFAULT_STABILITY_URL,
  stabilityApiKey: "",

  // tencent
  tencentUrl: DEFAULT_TENCENT_URL,
  tencentSecretKey: "",
  tencentSecretId: "",

  // iflytek
  iflytekUrl: DEFAULT_IFLYTEK_URL,
  iflytekApiKey: "",
  iflytekApiSecret: "",

  // xai
  xaiUrl: DEFAULT_XAI_URL,
  xaiApiKey: "",

  // chatglm
  chatglmUrl: DEFAULT_CHATGLM_URL,
  chatglmApiKey: "",

  // server config
  needCode: true,
  hideUserApiKey: false,
  hideBalanceQuery: false,
  disableGPT4: false,
  disableFastLink: false,
  customModels: "",
  defaultModel: "",
  defaultTemperature: DEFAULT_CONFIG.modelConfig.temperature,
  openaiReasoningEffort: "low",
  openaiMaxOutputTokens: undefined as number | undefined,
  openaiTextVerbosity: "medium",
  openaiCompressMessageLengthThreshold:
    DEFAULT_CONFIG.modelConfig.compressMessageLengthThreshold,
  allowedModels: [] as string[],
  lockedFields: [] as string[],
  serverConfigSnapshot: undefined as PublicAppConfig | undefined,

  // tts config
  edgeTTSVoiceName: "zh-CN-YunxiNeural",
};

export function sanitizeAccessPersistedState<T extends Record<string, any>>(
  state: T,
) {
  return {
    ...state,
    isValidatingAccessCode: false,
  };
}

const MODEL_CONFIG_FIELDS = [
  "model",
  "providerName",
  "temperature",
  "max_output_tokens",
  "reasoningEffort",
  "reasoningMode",
  "reasoningContext",
  "inputImageDetail",
  "promptCacheMode",
  "promptCacheKey",
  "textVerbosity",
  "compressMessageLengthThreshold",
  "historyMessageCount",
  "sendMemory",
  "enableInjectSystemPrompts",
  "template",
  "store",
] as const;

function publicConfigToAccessState(config: PublicAppConfig) {
  return {
    needCode: config.serverFlags.needCode,
    hideUserApiKey: config.serverFlags.hideUserApiKey,
    hideBalanceQuery: config.serverFlags.hideBalanceQuery,
    disableGPT4: config.serverFlags.disableGPT4,
    disableFastLink: config.serverFlags.disableFastLink,
    customModels: config.legacy.customModels,
    defaultModel: config.legacy.defaultModel ?? "",
    defaultTemperature: config.legacy.defaultTemperature,
    openaiReasoningEffort: config.legacy.openaiReasoningEffort ?? "low",
    openaiMaxOutputTokens: config.legacy.openaiMaxOutputTokens,
    openaiTextVerbosity: config.legacy.openaiTextVerbosity ?? "medium",
    openaiCompressMessageLengthThreshold:
      config.legacy.compressMessageLengthThreshold,
    allowedModels: config.allowedModels,
    lockedFields: config.lockedFields,
    serverConfigSnapshot: config,
  };
}

function getServerModelConfig(publicConfig: PublicAppConfig) {
  const modelRef = resolveAllowedModelRef({
    model: publicConfig.forced.model ?? publicConfig.defaults.model,
    providerName:
      publicConfig.forced.providerName ?? publicConfig.defaults.providerName,
    allowedModels: publicConfig.allowedModels,
    fallbackModelRef: `${OPENAI_RESPONSES_DEFAULT_MODEL}@OpenAI`,
  });
  const [model, providerName] = splitModelRef(modelRef);

  return {
    model,
    providerName,
    temperature:
      publicConfig.forced.temperature ?? publicConfig.defaults.temperature,
    max_output_tokens:
      publicConfig.forced.max_output_tokens ??
      publicConfig.defaults.max_output_tokens,
    reasoningEffort:
      publicConfig.forced.reasoningEffort ??
      publicConfig.defaults.reasoningEffort,
    reasoningMode:
      publicConfig.forced.reasoningMode ?? publicConfig.defaults.reasoningMode,
    reasoningContext:
      publicConfig.forced.reasoningContext ??
      publicConfig.defaults.reasoningContext,
    inputImageDetail:
      publicConfig.forced.inputImageDetail ??
      publicConfig.defaults.inputImageDetail,
    promptCacheMode:
      publicConfig.forced.promptCacheMode ??
      publicConfig.defaults.promptCacheMode,
    promptCacheKey:
      publicConfig.forced.promptCacheKey ??
      publicConfig.defaults.promptCacheKey,
    textVerbosity:
      publicConfig.forced.textVerbosity ?? publicConfig.defaults.textVerbosity,
    compressMessageLengthThreshold:
      publicConfig.defaults.compressMessageLengthThreshold,
    historyMessageCount: publicConfig.defaults.historyMessageCount,
    sendMemory: publicConfig.defaults.sendMemory,
    enableInjectSystemPrompts: publicConfig.defaults.enableInjectSystemPrompts,
    template: publicConfig.defaults.template,
    store: publicConfig.defaults.store ?? false,
  } as Partial<ModelConfig>;
}

function setFieldMeta(
  meta: ModelConfigMeta | undefined,
  field: string,
  publicConfig: PublicAppConfig,
  source: "server_default" | "admin_forced" | "conversation_override",
  locked = false,
) {
  return {
    ...(meta ?? {}),
    [field]: createConfigFieldMeta({
      source,
      publicConfig,
      locked,
    }),
  };
}

function fieldHasUserOverride(
  meta: ModelConfigMeta | undefined,
  field: string,
) {
  return meta?.[field]?.source === "user_override";
}

function fullModelRef(modelConfig: Partial<ModelConfig>) {
  return normalizeModelRef(
    modelConfig.providerName
      ? `${modelConfig.model}@${modelConfig.providerName}`
      : modelConfig.model,
  );
}

function isAllowedModel(
  modelConfig: Partial<ModelConfig>,
  publicConfig: PublicAppConfig,
) {
  if (!publicConfig.allowedModels.length) {
    return true;
  }

  const ref = fullModelRef(modelConfig);
  return !!ref && publicConfig.allowedModels.includes(ref);
}

export function applyPublicAppConfig(publicConfig: PublicAppConfig) {
  hasFetchedConfig = true;

  const oldSnapshot = useAppConfig.getState().serverConfigSnapshot;
  const serverModelConfig = getServerModelConfig(publicConfig);

  useAppConfig.setState((state) => {
    let modelConfig = { ...state.modelConfig };
    let modelConfigMeta = { ...(state.modelConfigMeta ?? {}) };

    for (const field of MODEL_CONFIG_FIELDS) {
      const serverValue = serverModelConfig[field];
      if (serverValue === undefined) continue;

      const locked = isPublicConfigFieldLocked(publicConfig, field);

      if (locked) {
        modelConfig = {
          ...modelConfig,
          [field]: serverValue,
        };
        modelConfigMeta = setFieldMeta(
          modelConfigMeta,
          field,
          publicConfig,
          "admin_forced",
          true,
        );
        continue;
      }

      if (fieldHasUserOverride(modelConfigMeta, field)) {
        continue;
      }

      const codeDefault = DEFAULT_CONFIG.modelConfig[field];
      const currentValue = modelConfig[field];
      const oldServerValue =
        oldSnapshot?.forced?.[field as keyof PublicAppConfig["forced"]] ??
        oldSnapshot?.defaults?.[field as keyof PublicAppConfig["defaults"]];
      if (
        modelConfigMeta[field] === undefined &&
        currentValue !== undefined &&
        codeDefault !== undefined &&
        currentValue !== codeDefault &&
        currentValue !== oldServerValue
      ) {
        modelConfigMeta = {
          ...modelConfigMeta,
          [field]: createConfigFieldMeta({
            source: "user_override",
          }),
        };
        continue;
      }

      modelConfig = {
        ...modelConfig,
        [field]: serverValue,
      };
      modelConfigMeta = setFieldMeta(
        modelConfigMeta,
        field,
        publicConfig,
        "server_default",
      );
    }

    if (!isAllowedModel(modelConfig, publicConfig)) {
      const modelRef = resolveAllowedModelRef({
        model: modelConfig.model,
        providerName: modelConfig.providerName,
        allowedModels: publicConfig.allowedModels,
        fallbackModelRef: fullModelRef(serverModelConfig),
      });
      const [model, providerName] = splitModelRef(modelRef);
      modelConfig = {
        ...modelConfig,
        model: model as ModelConfig["model"],
        providerName: providerName as ModelConfig["providerName"],
      };
      modelConfigMeta = setFieldMeta(
        setFieldMeta(
          modelConfigMeta,
          "model",
          publicConfig,
          "admin_forced",
          true,
        ),
        "providerName",
        publicConfig,
        "admin_forced",
        true,
      );
    }

    applyOpenAIResponsesModelConstraints(modelConfig);

    return {
      customModels: publicConfig.legacy.customModels,
      serverConfigSnapshot: publicConfig,
      modelConfig,
      modelConfigMeta,
    };
  });

  const globalConfig = useAppConfig.getState();

  applyChatStateUpdate((state) => {
    const applyToSession = (session: typeof state.temporarySession) => {
      if (!session) return session;

      let modelConfig = { ...session.mask.modelConfig };
      let modelConfigMeta = { ...(session.mask.modelConfigMeta ?? {}) };

      for (const field of MODEL_CONFIG_FIELDS) {
        const serverValue = serverModelConfig[field];
        if (serverValue === undefined) continue;

        const locked = isPublicConfigFieldLocked(publicConfig, field);

        if (locked) {
          modelConfig = {
            ...modelConfig,
            [field]: serverValue,
          };
          modelConfigMeta = setFieldMeta(
            modelConfigMeta,
            field,
            publicConfig,
            "admin_forced",
            true,
          );
          continue;
        }

        if (!session.mask.syncGlobalConfig) {
          if (modelConfig[field] === undefined) {
            modelConfig = {
              ...modelConfig,
              [field]: globalConfig.modelConfig[field] ?? serverValue,
            };
            modelConfigMeta = {
              ...modelConfigMeta,
              [field]:
                globalConfig.modelConfigMeta?.[field] ??
                createConfigFieldMeta({
                  source: "server_default",
                  publicConfig,
                }),
            };
            continue;
          }

          modelConfigMeta = setFieldMeta(
            modelConfigMeta,
            field,
            publicConfig,
            "conversation_override",
          );
          continue;
        }

        modelConfig = {
          ...modelConfig,
          [field]: globalConfig.modelConfig[field],
        };
        modelConfigMeta = {
          ...modelConfigMeta,
          [field]:
            globalConfig.modelConfigMeta?.[field] ??
            createConfigFieldMeta({
              source: "server_default",
              publicConfig,
            }),
        };
      }

      if (!isAllowedModel(modelConfig, publicConfig)) {
        const modelRef = resolveAllowedModelRef({
          model: modelConfig.model,
          providerName: modelConfig.providerName,
          allowedModels: publicConfig.allowedModels,
          fallbackModelRef: fullModelRef(serverModelConfig),
        });
        const [model, providerName] = splitModelRef(modelRef);
        modelConfig = {
          ...modelConfig,
          model: model as ModelConfig["model"],
          providerName: providerName as ModelConfig["providerName"],
        };
        modelConfigMeta = setFieldMeta(
          setFieldMeta(
            modelConfigMeta,
            "model",
            publicConfig,
            "admin_forced",
            true,
          ),
          "providerName",
          publicConfig,
          "admin_forced",
          true,
        );
      }

      applyOpenAIResponsesModelConstraints(modelConfig);

      return {
        ...session,
        mask: {
          ...session.mask,
          modelConfig,
          modelConfigMeta,
        },
      };
    };

    return {
      temporarySession: applyToSession(state.temporarySession),
      sessions: state.sessions.map((session: any) => applyToSession(session)!),
    };
  });

  useAccessStore.setState(() => publicConfigToAccessState(publicConfig));
}

function runAfterStoreHydration(callback: () => void) {
  const chatStore = getRegisteredChatStore();
  const stores = chatStore
    ? [useAccessStore, useAppConfig, chatStore]
    : [useAccessStore, useAppConfig];
  let unsubscribes: Array<() => void> = [];
  let finished = false;

  const isReady = () =>
    stores.every((store) => store.getState()._hasHydrated === true);

  const finish = () => {
    if (finished || !isReady()) return;
    finished = true;
    unsubscribes.forEach((unsubscribe) => unsubscribe());
    callback();
  };

  unsubscribes = stores.map((store) => store.subscribe(finish));
  finish();
}

function applyServerConfig(config: PublicAppConfig) {
  runAfterStoreHydration(() => {
    applyPublicAppConfig(config);
  });
}

export const useAccessStore = createPersistStore(
  { ...DEFAULT_ACCESS_STATE },

  (set, get) => ({
    enabledAccessControl() {
      this.fetch();

      return get().needCode;
    },

    edgeVoiceName() {
      this.fetch();

      return get().edgeTTSVoiceName;
    },

    isValidOpenAI() {
      return ensure(get(), ["openaiApiKey"]);
    },

    isValidAzure() {
      return ensure(get(), ["azureUrl", "azureApiKey", "azureApiVersion"]);
    },

    isValidGoogle() {
      return ensure(get(), ["googleApiKey"]);
    },

    isValidAnthropic() {
      return ensure(get(), ["anthropicApiKey"]);
    },

    isValidBaidu() {
      return ensure(get(), ["baiduApiKey", "baiduSecretKey"]);
    },

    isValidByteDance() {
      return ensure(get(), ["bytedanceApiKey"]);
    },

    isValidAlibaba() {
      return ensure(get(), ["alibabaApiKey"]);
    },

    isValidTencent() {
      return ensure(get(), ["tencentSecretKey", "tencentSecretId"]);
    },

    isValidMoonshot() {
      return ensure(get(), ["moonshotApiKey"]);
    },
    isValidIflytek() {
      return ensure(get(), ["iflytekApiKey"]);
    },

    isValidXAI() {
      return ensure(get(), ["xaiApiKey"]);
    },

    isValidChatGLM() {
      return ensure(get(), ["chatglmApiKey"]);
    },

    setAccessCode(accessCode: string) {
      set({
        accessCode,
        validatedAccessCode: "",
        accessCodeValidatedAt: 0,
        accessCodeValidatedServerId: "",
        accessCodeError: "",
        lastUpdateTime: Date.now(),
      } as Partial<ReturnType<typeof get>>);
    },

    clearAccessCode() {
      set({
        accessCode: "",
        validatedAccessCode: "",
        accessCodeValidatedAt: 0,
        accessCodeValidatedServerId: "",
        accessCodeError: "",
        lastUpdateTime: Date.now(),
      } as Partial<ReturnType<typeof get>>);
    },

    hasValidAccessCode() {
      const state = get();
      return isAccessCodeValidationCurrent({
        accessCode: state.accessCode,
        validatedAccessCode: state.validatedAccessCode,
        accessCodeValidatedAt: state.accessCodeValidatedAt,
        accessCodeValidatedServerId: state.accessCodeValidatedServerId,
        serverConfig: state.serverConfigSnapshot,
      });
    },

    async validateAccessCode() {
      const accessCode = get().accessCode.trim();
      if (!accessCode) {
        set({
          accessCode: "",
          validatedAccessCode: "",
          accessCodeValidatedAt: 0,
          accessCodeValidatedServerId: "",
          isValidatingAccessCode: false,
          accessCodeError: "invalid",
          lastUpdateTime: Date.now(),
        } as Partial<ReturnType<typeof get>>);
        return false;
      }

      set({ isValidatingAccessCode: true } as Partial<ReturnType<typeof get>>);
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        ACCESS_CODE_VALIDATE_TIMEOUT_MS,
      );
      try {
        const res = await fetch("/api/access-code", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ accessCode }),
        });
        const body = (await res.json().catch(() => ({}))) as { ok?: boolean };
        const ok = res.ok && body.ok === true;

        if (ok) {
          set({
            accessCode,
            validatedAccessCode: accessCode,
            accessCodeValidatedAt: Date.now(),
            accessCodeValidatedServerId: getAccessCodeValidationServerId(
              get().serverConfigSnapshot,
            ),
            isValidatingAccessCode: false,
            accessCodeError: "",
            lastUpdateTime: Date.now(),
          } as Partial<ReturnType<typeof get>>);
          return true;
        }

        set({
          accessCode: "",
          validatedAccessCode: "",
          accessCodeValidatedAt: 0,
          accessCodeValidatedServerId: "",
          isValidatingAccessCode: false,
          accessCodeError: res.status === 429 ? "rate_limited" : "invalid",
          lastUpdateTime: Date.now(),
        } as Partial<ReturnType<typeof get>>);
        return false;
      } catch {
        set({
          validatedAccessCode: "",
          accessCodeValidatedAt: 0,
          accessCodeValidatedServerId: "",
          isValidatingAccessCode: false,
          accessCodeError: "invalid",
          lastUpdateTime: Date.now(),
        } as Partial<ReturnType<typeof get>>);
        return false;
      } finally {
        clearTimeout(timeout);
      }
    },

    isAuthorized() {
      this.fetch();

      // disabled access control or a server-verified access code
      return (
        !this.enabledAccessControl() ||
        (this.enabledAccessControl() && this.hasValidAccessCode())
      );
    },
    hasFetchedServerConfig() {
      return getClientConfig()?.buildMode === "export" || hasFetchedConfig;
    },
    fetch() {
      if (
        isFetchingConfig ||
        hasFetchedConfig ||
        getClientConfig()?.buildMode === "export"
      ) {
        return;
      }
      isFetchingConfig = true;
      fetch("/api/config", {
        method: "post",
        body: null,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(get().accessCode
            ? {
                Authorization: `Bearer ${ACCESS_CODE_PREFIX}${
                  get().accessCode
                }`,
              }
            : {}),
        },
      })
        .then((res) => res.json())
        .then((res) => {
          applyServerConfig(res);

          return res;
        })
        .then((res: DangerConfig) => {
          console.log("[Config] got config from server", res);
        })
        .catch(() => {
          console.error("[Config] failed to fetch config");
        })
        .finally(() => {
          isFetchingConfig = false;
        });
    },
  }),
  {
    name: StoreKey.Access,
    version: 3,
    partialize(state) {
      return sanitizeAccessPersistedState(state as any);
    },
    migrate(persistedState, version) {
      const state = sanitizeAccessPersistedState(persistedState as any);

      if (version < 2) {
        const legacyState = state as {
          token: string;
          openaiApiKey: string;
          azureApiVersion: string;
          googleApiKey: string;
        };
        legacyState.openaiApiKey = legacyState.token;
        legacyState.azureApiVersion = "2023-08-01-preview";
      }

      return state as any;
    },
  },
);
