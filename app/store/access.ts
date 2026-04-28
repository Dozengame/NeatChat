import {
  GoogleSafetySettingsThreshold,
  ServiceProvider,
  StoreKey,
  ApiPath,
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
import { getHeaders } from "../client/api";
import { getClientConfig } from "../config/client";
import { createPersistStore } from "../utils/store";
import { ensure } from "../utils/clone";
import { DEFAULT_CONFIG, useAppConfig } from "./config";
import { useChatStore } from "./chat";
import {
  resolveServerModelConfig,
  ServerModelDefaults,
} from "../utils/server-model-defaults";

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

const isApp = getClientConfig()?.buildMode === "export";

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
  openaiResponsesMode: false,
  openaiReasoningEffort: "low",
  openaiTextVerbosity: "medium",

  // tts config
  edgeTTSVoiceName: "zh-CN-YunxiNeural",
};

function applyServerModelDefaults(config: ServerModelDefaults) {
  const modelConfig = resolveServerModelConfig(config) as Partial<
    typeof DEFAULT_CONFIG.modelConfig
  >;

  if (Object.keys(modelConfig).length === 0) return;

  DEFAULT_CONFIG.modelConfig = {
    ...DEFAULT_CONFIG.modelConfig,
    ...modelConfig,
  };
  useAppConfig.setState((state) => ({
    modelConfig: {
      ...state.modelConfig,
      ...modelConfig,
    },
  }));
  useChatStore.setState((state) => ({
    sessions: state.sessions.map((session) => {
      if (!session.mask.syncGlobalConfig) {
        return session;
      }

      return {
        ...session,
        mask: {
          ...session.mask,
          modelConfig: {
            ...session.mask.modelConfig,
            ...modelConfig,
          },
        },
      };
    }),
  }));
}

function runAfterStoreHydration(callback: () => void) {
  const stores = [useAccessStore, useAppConfig, useChatStore];
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

function applyServerConfig(config: Partial<typeof DEFAULT_ACCESS_STATE>) {
  runAfterStoreHydration(() => {
    applyServerModelDefaults(config);
    if (typeof config.customModels === "string") {
      useAppConfig.setState(() => ({
        customModels: config.customModels,
      }));
    }
    useAccessStore.setState(() => ({ ...config }));
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

    isAuthorized() {
      this.fetch();

      // has token or has code or disabled access control
      return (
        this.isValidOpenAI() ||
        this.isValidAzure() ||
        this.isValidGoogle() ||
        this.isValidAnthropic() ||
        this.isValidBaidu() ||
        this.isValidByteDance() ||
        this.isValidAlibaba() ||
        this.isValidTencent() ||
        this.isValidMoonshot() ||
        this.isValidIflytek() ||
        this.isValidXAI() ||
        this.isValidChatGLM() ||
        !this.enabledAccessControl() ||
        (this.enabledAccessControl() && ensure(get(), ["accessCode"]))
      );
    },
    fetch() {
      if (fetchState > 0 || getClientConfig()?.buildMode === "export") return;
      fetchState = 1;
      fetch("/api/config", {
        method: "post",
        body: null,
        headers: {
          ...getHeaders(),
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
          fetchState = 2;
        });
    },
  }),
  {
    name: StoreKey.Access,
    version: 2,
    migrate(persistedState, version) {
      if (version < 2) {
        const state = persistedState as {
          token: string;
          openaiApiKey: string;
          azureApiVersion: string;
          googleApiKey: string;
        };
        state.openaiApiKey = state.token;
        state.azureApiVersion = "2023-08-01-preview";
      }

      return persistedState as any;
    },
  },
);
