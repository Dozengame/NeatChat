import { DEFAULT_MODELS, DEFAULT_GA_ID } from "../constant";
import {
  buildAccessControlConfig,
  getAccessCodeHashes,
} from "../utils/access-control";
import {
  OPENAI_RESPONSES_DEFAULT_COMPRESS_MESSAGE_LENGTH_THRESHOLD,
  OPENAI_RESPONSES_DEFAULT_MODEL,
  OPENAI_RESPONSES_DEFAULT_TEMPERATURE,
  parseOpenAICompressMessageLengthThreshold,
  parseOpenAIMaxOutputTokens,
  parseOpenAIResponsesReasoningEffort,
  parseOpenAIResponsesTextVerbosity,
} from "../utils/openai-responses";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PROXY_URL?: string; // docker only

      OPENAI_API_KEY?: string;
      CODE?: string;
      ACCESS_CODE_ADMIN?: string;
      ACCESS_CODE_ADVANCED?: string;
      ACCESS_CODE_NORMAL?: string;
      ADMIN_ACCESS_CODE?: string;
      ADVANCED_ACCESS_CODE?: string;
      NORMAL_ACCESS_CODE?: string;
      ACCESS_ADMIN_DAILY_TOKENS?: string;
      ACCESS_ADVANCED_DAILY_TOKENS?: string;
      ACCESS_NORMAL_DAILY_TOKENS?: string;
      ACCESS_IP_WHITELIST?: string;
      IP_WHITELIST?: string;
      ACCESS_WHITELIST_TOKEN_MULTIPLIER?: string;
      ACCESS_BURST_WINDOW_SECONDS?: string;
      ACCESS_BURST_TOKEN_LIMIT?: string;
      ACCESS_BURST_COOLDOWN_SECONDS?: string;
      ACCESS_DEVICE_ID_ENABLED?: string;
      ACCESS_DEVICE_ID_SECRET?: string;
      ACCESS_DEVICE_ID_COOKIE_NAME?: string;
      ACCESS_DEVICE_ID_MAX_AGE_DAYS?: string;
      ACCESS_IP_BURST_GUARD_ENABLED?: string;
      ACCESS_IP_BURST_TOKEN_LIMIT?: string;
      ACCESS_IP_BURST_WINDOW_SECONDS?: string;
      ACCESS_QUOTA_TIME_ZONE?: string;
      ACCESS_USAGE_REDIS_URL?: string;
      ACCESS_USAGE_REDIS_TOKEN?: string;
      ACCESS_USAGE_REDIS_PREFIX?: string;
      ACCESS_USAGE_STATE_VERSION?: string;
      NEATCHAT_REDIS_KV_REST_API_URL?: string;
      NEATCHAT_REDIS_KV_REST_API_TOKEN?: string;
      NEATCHAT_REDIS_KV_REST_API_READ_ONLY_TOKEN?: string;
      NEATCHAT_REDIS_KV_URL?: string;
      NEATCHAT_REDIS_REDIS_URL?: string;
      NEATCHAT_REDIS_REST_API_URL?: string;
      NEATCHAT_REDIS_REST_API_TOKEN?: string;
      KV_REST_API_URL?: string;
      KV_REST_API_TOKEN?: string;
      UPSTASH_REDIS_REST_URL?: string;
      UPSTASH_REDIS_REST_TOKEN?: string;

      BASE_URL?: string;
      OPENAI_ORG_ID?: string; // openai only
      OPENAI_IMAGES_URL?: string; // custom image generation/edit endpoint base
      OPENAI_RESPONSES_URL?: string; // custom responses endpoint
      OPENAI_STORE_RESPONSES?: string; // store responses for OpenAI dashboard/API logs
      OPENAI_REASONING_EFFORT?: string; // responses api reasoning effort
      OPENAI_MAX_OUTPUT_TOKENS?: string; // responses api max_output_tokens
      OPENAI_TEXT_VERBOSITY?: string; // responses api text verbosity
      OPENAI_COMPRESS_MESSAGE_LENGTH_THRESHOLD?: string; // default history compression threshold
      WEBUI_CONFIG_VERSION?: string; // public config version
      WEBUI_LOCKED_FIELDS?: string; // comma separated locked fields
      WEBUI_ALLOWED_MODELS?: string; // comma separated model@Provider list
      WEBUI_ANNOUNCEMENT_JSON?: string; // public update announcement shown after a new build

      VERCEL?: string;
      VERCEL_DEPLOYMENT_ID?: string;
      VERCEL_URL?: string;
      VERCEL_GIT_COMMIT_SHA?: string;
      BUILD_MODE?: "standalone" | "export";
      BUILD_APP?: string; // is building desktop app

      HIDE_USER_API_KEY?: string; // disable user's api key input
      HIDE_BALANCE_QUERY?: string; // hide balance query
      DISABLE_GPT4?: string; // allow user to use gpt-4 or not
      ENABLE_BALANCE_QUERY?: string; // allow user to query balance or not
      DISABLE_FAST_LINK?: string; // disallow parse settings from url or not
      CUSTOM_MODELS?: string; // to control custom models
      DEFAULT_MODEL?: string; // to control default model in every new chat window
      OPENAI_TEMPERATURE?: string; // to control default temperature in every new chat window

      // stability only
      STABILITY_URL?: string;
      STABILITY_API_KEY?: string;

      // azure only
      AZURE_URL?: string; // https://{azure-url}/openai/deployments/{deploy-name}
      AZURE_API_KEY?: string;
      AZURE_API_VERSION?: string;

      // google only
      GOOGLE_API_KEY?: string;
      GOOGLE_URL?: string;

      // google tag manager
      GTM_ID?: string;

      // anthropic only
      ANTHROPIC_URL?: string;
      ANTHROPIC_API_KEY?: string;
      ANTHROPIC_API_VERSION?: string;

      // baidu only
      BAIDU_URL?: string;
      BAIDU_API_KEY?: string;
      BAIDU_SECRET_KEY?: string;

      // bytedance only
      BYTEDANCE_URL?: string;
      BYTEDANCE_API_KEY?: string;

      // alibaba only
      ALIBABA_URL?: string;
      ALIBABA_API_KEY?: string;

      // tencent only
      TENCENT_URL?: string;
      TENCENT_SECRET_KEY?: string;
      TENCENT_SECRET_ID?: string;

      // moonshot only
      MOONSHOT_URL?: string;
      MOONSHOT_API_KEY?: string;

      // iflytek only
      IFLYTEK_URL?: string;
      IFLYTEK_API_KEY?: string;
      IFLYTEK_API_SECRET?: string;

      // xai only
      XAI_URL?: string;
      XAI_API_KEY?: string;

      // chatglm only
      CHATGLM_URL?: string;
      CHATGLM_API_KEY?: string;

      // custom template for preprocessing user input
      DEFAULT_INPUT_TEMPLATE?: string;

      ENABLE_MCP?: string; // enable mcp functionality
      JIMENG_MCP_TOKEN?: string; // Jimeng MCP bearer token
    }
  }
}

export function getAccessCodes(): Set<string> {
  try {
    return getAccessCodeHashes(buildAccessControlConfig(process.env));
  } catch (e) {
    return new Set();
  }
}

function getApiKey(keys?: string) {
  const apiKeyEnvVar = keys ?? "";
  const apiKeys = apiKeyEnvVar.split(",").map((v) => v.trim());
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  const apiKey = apiKeys[randomIndex];
  if (apiKey && process.env.DEBUG_SERVER_CONFIG === "1") {
    console.log(
      `[Server Config] using ${randomIndex + 1} of ${apiKeys.length} api key`,
    );
  }

  return apiKey;
}

export function parseDefaultTemperature(value?: string) {
  if (!value?.trim()) {
    return undefined;
  }

  const temperature = Number(value);
  if (!Number.isFinite(temperature)) {
    return undefined;
  }

  return Math.min(2, Math.max(0, temperature));
}

function parseEnvBoolean(value?: string) {
  if (!value?.trim()) {
    return false;
  }

  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

export const getServerSideConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  const disableGPT4 = !!process.env.DISABLE_GPT4;
  let customModels = process.env.CUSTOM_MODELS ?? "";
  let defaultModel =
    process.env.DEFAULT_MODEL?.trim() || OPENAI_RESPONSES_DEFAULT_MODEL;
  const defaultTemperature =
    parseDefaultTemperature(process.env.OPENAI_TEMPERATURE) ??
    OPENAI_RESPONSES_DEFAULT_TEMPERATURE;
  const openaiReasoningEffort = parseOpenAIResponsesReasoningEffort(
    process.env.OPENAI_REASONING_EFFORT,
  );
  const openaiMaxOutputTokens = parseOpenAIMaxOutputTokens(
    process.env.OPENAI_MAX_OUTPUT_TOKENS,
  );
  const openaiTextVerbosity = parseOpenAIResponsesTextVerbosity(
    process.env.OPENAI_TEXT_VERBOSITY,
  );
  const openaiCompressMessageLengthThreshold =
    parseOpenAICompressMessageLengthThreshold(
      process.env.OPENAI_COMPRESS_MESSAGE_LENGTH_THRESHOLD,
    ) ?? OPENAI_RESPONSES_DEFAULT_COMPRESS_MESSAGE_LENGTH_THRESHOLD;
  const openaiStoreResponses = parseEnvBoolean(
    process.env.OPENAI_STORE_RESPONSES,
  );
  const accessControl = buildAccessControlConfig(process.env);

  if (disableGPT4) {
    if (customModels) customModels += ",";
    customModels += DEFAULT_MODELS.filter(
      (m) =>
        (m.name.startsWith("gpt-4") ||
          m.name.startsWith("chatgpt-4o") ||
          m.name.startsWith("o1")) &&
        !m.name.startsWith("gpt-4o-mini"),
    )
      .map((m) => "-" + m.name)
      .join(",");
    if (
      (defaultModel.startsWith("gpt-4") ||
        defaultModel.startsWith("chatgpt-4o") ||
        defaultModel.startsWith("o1")) &&
      !defaultModel.startsWith("gpt-4o-mini")
    )
      defaultModel = "";
  }

  const isStability = !!process.env.STABILITY_API_KEY;

  const isAzure = !!process.env.AZURE_URL;
  const isGoogle = !!process.env.GOOGLE_API_KEY;
  const isAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const isTencent = !!process.env.TENCENT_API_KEY;

  const isBaidu = !!process.env.BAIDU_API_KEY;
  const isBytedance = !!process.env.BYTEDANCE_API_KEY;
  const isAlibaba = !!process.env.ALIBABA_API_KEY;
  const isMoonshot = !!process.env.MOONSHOT_API_KEY;
  const isIflytek = !!process.env.IFLYTEK_API_KEY;
  const isXAI = !!process.env.XAI_API_KEY;
  const isChatGLM = !!process.env.CHATGLM_API_KEY;
  // const apiKeyEnvVar = process.env.OPENAI_API_KEY ?? "";
  // const apiKeys = apiKeyEnvVar.split(",").map((v) => v.trim());
  // const randomIndex = Math.floor(Math.random() * apiKeys.length);
  // const apiKey = apiKeys[randomIndex];
  // console.log(
  //   `[Server Config] using ${randomIndex + 1} of ${apiKeys.length} api key`,
  // );

  const allowedWebDavEndpoints = (
    process.env.WHITE_WEBDAV_ENDPOINTS ?? ""
  ).split(",");

  const hideBalanceQuery = process.env.HIDE_BALANCE_QUERY
    ? parseEnvBoolean(process.env.HIDE_BALANCE_QUERY)
    : !parseEnvBoolean(process.env.ENABLE_BALANCE_QUERY);

  const enableMcp = process.env.ENABLE_MCP
    ? parseEnvBoolean(process.env.ENABLE_MCP)
    : !!process.env.JIMENG_MCP_TOKEN;

  return {
    baseUrl: process.env.BASE_URL,
    apiKey: getApiKey(process.env.OPENAI_API_KEY),
    openaiOrgId: process.env.OPENAI_ORG_ID,
    openaiImagesUrl: process.env.OPENAI_IMAGES_URL,
    openaiResponsesUrl: process.env.OPENAI_RESPONSES_URL,
    openaiStoreResponses,
    openaiReasoningEffort,
    openaiMaxOutputTokens,
    openaiTextVerbosity,
    openaiCompressMessageLengthThreshold,
    webuiConfigVersion: process.env.WEBUI_CONFIG_VERSION?.trim() || undefined,
    webuiLockedFields: process.env.WEBUI_LOCKED_FIELDS,
    webuiAllowedModels: process.env.WEBUI_ALLOWED_MODELS,

    isStability,
    stabilityUrl: process.env.STABILITY_URL,
    stabilityApiKey: getApiKey(process.env.STABILITY_API_KEY),

    isAzure,
    azureUrl: process.env.AZURE_URL,
    azureApiKey: getApiKey(process.env.AZURE_API_KEY),
    azureApiVersion: process.env.AZURE_API_VERSION,

    isGoogle,
    googleApiKey: getApiKey(process.env.GOOGLE_API_KEY),
    googleUrl: process.env.GOOGLE_URL,

    isAnthropic,
    anthropicApiKey: getApiKey(process.env.ANTHROPIC_API_KEY),
    anthropicApiVersion: process.env.ANTHROPIC_API_VERSION,
    anthropicUrl: process.env.ANTHROPIC_URL,

    isBaidu,
    baiduUrl: process.env.BAIDU_URL,
    baiduApiKey: getApiKey(process.env.BAIDU_API_KEY),
    baiduSecretKey: process.env.BAIDU_SECRET_KEY,

    isBytedance,
    bytedanceApiKey: getApiKey(process.env.BYTEDANCE_API_KEY),
    bytedanceUrl: process.env.BYTEDANCE_URL,

    isAlibaba,
    alibabaUrl: process.env.ALIBABA_URL,
    alibabaApiKey: getApiKey(process.env.ALIBABA_API_KEY),

    isTencent,
    tencentUrl: process.env.TENCENT_URL,
    tencentSecretKey: getApiKey(process.env.TENCENT_SECRET_KEY),
    tencentSecretId: process.env.TENCENT_SECRET_ID,

    isMoonshot,
    moonshotUrl: process.env.MOONSHOT_URL,
    moonshotApiKey: getApiKey(process.env.MOONSHOT_API_KEY),

    isIflytek,
    iflytekUrl: process.env.IFLYTEK_URL,
    iflytekApiKey: process.env.IFLYTEK_API_KEY,
    iflytekApiSecret: process.env.IFLYTEK_API_SECRET,

    isXAI,
    xaiUrl: process.env.XAI_URL,
    xaiApiKey: getApiKey(process.env.XAI_API_KEY),

    isChatGLM,
    chatglmUrl: process.env.CHATGLM_URL,
    chatglmApiKey: getApiKey(process.env.CHATGLM_API_KEY),

    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    cloudflareKVNamespaceId: process.env.CLOUDFLARE_KV_NAMESPACE_ID,
    cloudflareKVApiKey: getApiKey(process.env.CLOUDFLARE_KV_API_KEY),
    cloudflareKVTTL: process.env.CLOUDFLARE_KV_TTL,

    gtmId: process.env.GTM_ID,
    gaId: process.env.GA_ID || DEFAULT_GA_ID,

    needCode: accessControl.profiles.length > 0,
    codes: getAccessCodeHashes(accessControl),
    accessControl,

    proxyUrl: process.env.PROXY_URL,
    isVercel: !!process.env.VERCEL,

    hideUserApiKey: !!process.env.HIDE_USER_API_KEY,
    disableGPT4,
    hideBalanceQuery,
    disableFastLink: !!process.env.DISABLE_FAST_LINK,
    customModels,
    defaultModel,
    defaultTemperature,
    allowedWebDavEndpoints,
    enableMcp,
  };
};
