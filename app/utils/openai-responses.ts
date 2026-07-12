import { ATTACHMENT_WIRE_HEADER_PATTERN } from "./attachment-wire";

export const OPENAI_RESPONSES_DEFAULT_MODEL = "gpt-5.6-terra";
export const OPENAI_RESPONSES_DEFAULT_TEMPERATURE = 1;
export const OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT = "low";
export const OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY = "medium";
export const OPENAI_RESPONSES_DEFAULT_REASONING_MODE = "standard";
export const OPENAI_RESPONSES_DEFAULT_REASONING_CONTEXT = "auto";
export const OPENAI_RESPONSES_DEFAULT_INPUT_IMAGE_DETAIL = "high";
export const OPENAI_RESPONSES_DEFAULT_PROMPT_CACHE_MODE = "implicit";
export const OPENAI_RESPONSES_PROMPT_CACHE_TTL = "30m";
export const OPENAI_RESPONSES_DEFAULT_COMPRESS_MESSAGE_LENGTH_THRESHOLD = 1000;
export const OPENAI_GPT_56_MAX_OUTPUT_TOKENS = 128000;
const OPENAI_RESPONSES_FALLBACK_MAX_OUTPUT_TOKENS = 512000;
const OPENAI_RESPONSES_REASONING_MAX_OUTPUT_TOKENS = {
  none: 10000,
  low: 10000,
  medium: 20000,
  high: 30000,
  xhigh: 30000,
  max: 30000,
} as const;

export const OPENAI_RESPONSES_REASONING_EFFORTS = [
  "none",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

const OPENAI_RESPONSES_LEGACY_REASONING_EFFORTS = [
  "low",
  "medium",
  "high",
] as const;

export type OpenAIResponsesReasoningEffort =
  (typeof OPENAI_RESPONSES_REASONING_EFFORTS)[number];

export type OpenAIResponsesReasoningEffortAllowlist = {
  default?: OpenAIResponsesReasoningEffort[];
  models: Record<string, OpenAIResponsesReasoningEffort[]>;
};

export type OpenAIResponsesReasoningEffortDefaults = {
  default?: OpenAIResponsesReasoningEffort;
  models: Record<string, OpenAIResponsesReasoningEffort>;
};

export type OpenAIChatReasoningEffort = OpenAIResponsesReasoningEffort;

export type OpenAIResponsesTextVerbosity = "low" | "medium" | "high";
export type OpenAIResponsesWebSearchMode = "auto" | "required";
export type OpenAIResponsesReasoningMode = "standard" | "pro";
export type OpenAIResponsesReasoningContext =
  | "auto"
  | "current_turn"
  | "all_turns";
export type OpenAIResponsesInputImageDetail =
  | "low"
  | "high"
  | "original"
  | "auto";
export type OpenAIResponsesPromptCacheMode =
  | "disabled"
  | "implicit"
  | "explicit";

const REASONING_EFFORTS = new Set<string>(OPENAI_RESPONSES_REASONING_EFFORTS);

const TEXT_VERBOSITIES = new Set(["low", "medium", "high"]);
const REASONING_MODES = new Set(["standard", "pro"]);
const REASONING_CONTEXTS = new Set(["auto", "current_turn", "all_turns"]);
const INPUT_IMAGE_DETAILS = new Set(["low", "high", "original", "auto"]);
const PROMPT_CACHE_MODES = new Set(["disabled", "implicit", "explicit"]);

const OPENAI_PROVIDER_NAMES = new Set(["openai", "chatgpt"]);

export function isGpt56Model(model?: string) {
  return /^gpt-5\.6(?:[-.]|$)/.test(model?.trim().toLowerCase() ?? "");
}

export function getOpenAIResponsesMaxOutputTokensLimit(model?: string) {
  return isGpt56Model(model)
    ? OPENAI_GPT_56_MAX_OUTPUT_TOKENS
    : OPENAI_RESPONSES_FALLBACK_MAX_OUTPUT_TOKENS;
}

export function clampOpenAIResponsesMaxOutputTokens(
  value: number,
  model?: string,
) {
  const limit = getOpenAIResponsesMaxOutputTokensLimit(model);
  return Math.floor(Math.min(limit, Math.max(0, value)));
}

export function parseOpenAIMaxOutputTokens(value?: string, model?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  const maxOutputTokens = Number(normalized);
  if (!Number.isFinite(maxOutputTokens)) {
    return undefined;
  }

  return clampOpenAIResponsesMaxOutputTokens(maxOutputTokens, model);
}

export function isOpenAIResponsesReasoningEffort(
  value?: string,
): value is OpenAIResponsesReasoningEffort {
  return !!value && REASONING_EFFORTS.has(value);
}

export function getOpenAIResponsesReasoningEfforts(model?: string) {
  return isGpt56Model(model)
    ? OPENAI_RESPONSES_REASONING_EFFORTS
    : OPENAI_RESPONSES_LEGACY_REASONING_EFFORTS;
}

function parseOpenAIResponsesReasoningEffortList(value: string) {
  const requestedEfforts = new Set(
    value
      .split(",")
      .map((effort) => effort.trim().toLowerCase())
      .filter(isOpenAIResponsesReasoningEffort),
  );
  const allowedEfforts = OPENAI_RESPONSES_REASONING_EFFORTS.filter((effort) =>
    requestedEfforts.has(effort),
  );

  return allowedEfforts;
}

export function normalizeReasoningEffortModelKey(model?: string) {
  const normalized = model?.trim().toLowerCase().split("@")[0];
  return normalized === "gpt-5.6" ? "gpt-5.6-sol" : normalized;
}

export function parseOpenAIResponsesReasoningEffortAllowlist(
  value?: string,
): OpenAIResponsesReasoningEffortAllowlist | undefined {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  if (!normalized.includes("=")) {
    return {
      default: parseOpenAIResponsesReasoningEffortList(normalized),
      models: {},
    };
  }

  const allowlist: OpenAIResponsesReasoningEffortAllowlist = { models: {} };
  let parsedClause = false;

  for (const clause of normalized.split(";")) {
    const separatorIndex = clause.indexOf("=");
    if (separatorIndex <= 0) continue;

    const rawModel = clause.slice(0, separatorIndex).trim().toLowerCase();
    const efforts = parseOpenAIResponsesReasoningEffortList(
      clause.slice(separatorIndex + 1),
    );
    if (rawModel === "*" || rawModel === "default") {
      allowlist.default = efforts;
      parsedClause = true;
      continue;
    }

    const model = normalizeReasoningEffortModelKey(rawModel);
    if (!model) continue;
    allowlist.models[model] = efforts;
    parsedClause = true;
  }

  return parsedClause ? allowlist : { default: [], models: {} };
}

export function parseOpenAIResponsesReasoningEffortDefaults(
  value?: string,
): OpenAIResponsesReasoningEffortDefaults | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;

  if (!normalized.includes("=")) {
    const effort = normalized.toLowerCase();
    return isOpenAIResponsesReasoningEffort(effort)
      ? { default: effort, models: {} }
      : undefined;
  }

  const defaults: OpenAIResponsesReasoningEffortDefaults = { models: {} };
  let parsedClause = false;

  for (const clause of normalized.split(";")) {
    const separatorIndex = clause.indexOf("=");
    if (separatorIndex <= 0) continue;

    const rawModel = clause.slice(0, separatorIndex).trim().toLowerCase();
    const effort = clause
      .slice(separatorIndex + 1)
      .trim()
      .toLowerCase();
    if (!isOpenAIResponsesReasoningEffort(effort)) continue;

    if (rawModel === "*" || rawModel === "default") {
      defaults.default = effort;
      parsedClause = true;
      continue;
    }

    const model = normalizeReasoningEffortModelKey(rawModel);
    if (!model) continue;
    defaults.models[model] = effort;
    parsedClause = true;
  }

  return parsedClause ? defaults : undefined;
}

export function getConfiguredOpenAIResponsesReasoningEffort(
  model: string | undefined,
  defaults?: OpenAIResponsesReasoningEffortDefaults,
) {
  const modelKey = normalizeReasoningEffortModelKey(model);
  const configured =
    modelKey &&
    defaults &&
    Object.prototype.hasOwnProperty.call(defaults.models, modelKey)
      ? defaults?.models[modelKey]
      : defaults?.default;

  return normalizeOpenAIResponsesReasoningEffort(configured, model);
}

export function resolveOpenAIResponsesReasoningEffortDefault(params: {
  model?: string;
  providerName?: string;
  defaults?: OpenAIResponsesReasoningEffortDefaults;
}) {
  if (!params.defaults || !isOpenAIGpt5OrNewerModelConfig(params)) {
    return undefined;
  }

  return getConfiguredOpenAIResponsesReasoningEffort(
    params.model,
    params.defaults,
  );
}

type ReasoningDefaultConfigSource =
  | "server_default"
  | "user_override"
  | "conversation_override"
  | "admin_forced"
  | "fallback";

type ReasoningDefaultFieldMeta = {
  source?: ReasoningDefaultConfigSource;
  locked?: boolean;
};

export function applyConfiguredOpenAIResponsesReasoningEffortDefault(params: {
  config: {
    model?: string;
    providerName?: string;
    reasoningEffort?: OpenAIResponsesReasoningEffort;
    max_output_tokens?: number;
  };
  configMeta?: Record<string, ReasoningDefaultFieldMeta | undefined>;
  defaults?: OpenAIResponsesReasoningEffortDefaults;
}) {
  const reasoningEffort = resolveOpenAIResponsesReasoningEffortDefault({
    ...params.config,
    defaults: params.defaults,
  });
  if (!reasoningEffort) {
    return { reasoningEffortChanged: false, maxOutputTokensChanged: false };
  }

  const reasoningMeta = params.configMeta?.reasoningEffort;
  const reasoningSource = reasoningMeta?.source;
  if (
    reasoningMeta?.locked ||
    reasoningSource === "admin_forced" ||
    reasoningSource === "user_override" ||
    reasoningSource === "conversation_override"
  ) {
    return { reasoningEffortChanged: false, maxOutputTokensChanged: false };
  }

  const reasoningEffortChanged =
    params.config.reasoningEffort !== reasoningEffort;
  params.config.reasoningEffort = reasoningEffort;

  const maxOutputMeta = params.configMeta?.max_output_tokens;
  const maxOutputSource = maxOutputMeta?.source;
  const canUpdateMaxOutputTokens =
    !maxOutputMeta?.locked &&
    maxOutputSource !== "admin_forced" &&
    maxOutputSource !== "user_override" &&
    maxOutputSource !== "conversation_override";
  if (!canUpdateMaxOutputTokens) {
    return { reasoningEffortChanged, maxOutputTokensChanged: false };
  }

  const maxOutputTokens = getMaxOutputTokensForReasoningEffort(reasoningEffort);
  const maxOutputTokensChanged =
    params.config.max_output_tokens !== maxOutputTokens;
  params.config.max_output_tokens = maxOutputTokens;
  return { reasoningEffortChanged, maxOutputTokensChanged };
}

export function getConfiguredOpenAIResponsesReasoningEfforts(
  model: string | undefined,
  allowlist?: OpenAIResponsesReasoningEffortAllowlist,
) {
  if (!allowlist) return undefined;

  const modelKey = normalizeReasoningEffortModelKey(model);
  return modelKey &&
    Object.prototype.hasOwnProperty.call(allowlist.models, modelKey)
    ? allowlist.models[modelKey]
    : allowlist.default;
}

export function filterOpenAIResponsesReasoningEfforts(
  model: string | undefined,
  allowlist?:
    | OpenAIResponsesReasoningEffortAllowlist
    | readonly OpenAIResponsesReasoningEffort[],
) {
  const supportedEfforts = getOpenAIResponsesReasoningEfforts(model);
  const allowedEfforts = !allowlist
    ? undefined
    : "models" in allowlist
    ? getConfiguredOpenAIResponsesReasoningEfforts(model, allowlist)
    : allowlist;
  if (!allowedEfforts) {
    return supportedEfforts;
  }

  return supportedEfforts.filter((effort) =>
    allowedEfforts.some((allowedEffort) => allowedEffort === effort),
  );
}

export function includeCurrentOpenAIResponsesReasoningEffort(
  allowedEfforts: readonly OpenAIResponsesReasoningEffort[],
  currentEffort: OpenAIResponsesReasoningEffort,
) {
  return allowedEfforts.some((effort) => effort === currentEffort)
    ? allowedEfforts
    : [currentEffort, ...allowedEfforts];
}

export function isOpenAIResponsesReasoningEffortForModel(
  value: string | undefined,
  model?: string,
): value is OpenAIResponsesReasoningEffort {
  return (
    isOpenAIResponsesReasoningEffort(value) &&
    getOpenAIResponsesReasoningEfforts(model).some(
      (supportedEffort) => supportedEffort === value,
    )
  );
}

export function normalizeOpenAIResponsesReasoningEffort(
  value: string | undefined,
  model?: string,
) {
  return isOpenAIResponsesReasoningEffortForModel(value, model)
    ? value
    : OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT;
}

export function parseOpenAIResponsesReasoningEffort(
  value?: string,
  model?: string,
) {
  const normalized = value?.trim().toLowerCase();
  if (
    model
      ? isOpenAIResponsesReasoningEffortForModel(normalized, model)
      : isOpenAIResponsesReasoningEffort(normalized)
  ) {
    return normalized as OpenAIResponsesReasoningEffort;
  }

  return OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT;
}

export function parseOpenAIResponsesTextVerbosity(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (normalized && TEXT_VERBOSITIES.has(normalized)) {
    return normalized as OpenAIResponsesTextVerbosity;
  }

  return OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY;
}

export function parseOpenAIResponsesReasoningMode(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return REASONING_MODES.has(normalized ?? "")
    ? (normalized as OpenAIResponsesReasoningMode)
    : OPENAI_RESPONSES_DEFAULT_REASONING_MODE;
}

export function parseOpenAIResponsesReasoningContext(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return REASONING_CONTEXTS.has(normalized ?? "")
    ? (normalized as OpenAIResponsesReasoningContext)
    : OPENAI_RESPONSES_DEFAULT_REASONING_CONTEXT;
}

export function parseOpenAIResponsesInputImageDetail(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return INPUT_IMAGE_DETAILS.has(normalized ?? "")
    ? (normalized as OpenAIResponsesInputImageDetail)
    : OPENAI_RESPONSES_DEFAULT_INPUT_IMAGE_DETAIL;
}

export function parseOpenAIResponsesPromptCacheMode(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return PROMPT_CACHE_MODES.has(normalized ?? "")
    ? (normalized as OpenAIResponsesPromptCacheMode)
    : OPENAI_RESPONSES_DEFAULT_PROMPT_CACHE_MODE;
}

export function parseOpenAIResponsesPromptCacheKey(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function parseOpenAICompressMessageLengthThreshold(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  const threshold = Number(normalized);
  if (!Number.isFinite(threshold)) {
    return undefined;
  }

  return Math.floor(Math.min(4000, Math.max(500, threshold)));
}

export function getMaxOutputTokensForReasoningEffort(
  effort?: OpenAIResponsesReasoningEffort,
) {
  return (
    OPENAI_RESPONSES_REASONING_MAX_OUTPUT_TOKENS[
      effort ?? OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT
    ] ?? OPENAI_RESPONSES_REASONING_MAX_OUTPUT_TOKENS.low
  );
}

export function isGpt5OrNewerModel(model?: string) {
  const match = model
    ?.trim()
    .toLowerCase()
    .match(/^gpt-(\d+)(?:[.-]|$)/);
  if (!match) {
    return false;
  }

  return Number(match[1]) >= 5;
}

export function isOpenAIGpt5OrNewerModelConfig(params: {
  model?: string;
  providerName?: string;
}) {
  const providerName = params.providerName?.trim().toLowerCase();
  return (
    (!providerName || OPENAI_PROVIDER_NAMES.has(providerName)) &&
    isGpt5OrNewerModel(params.model)
  );
}

export function isOpenAIGpt56ModelConfig(params: {
  model?: string;
  providerName?: string;
}) {
  const providerName = params.providerName?.trim().toLowerCase();
  return (
    (!providerName || OPENAI_PROVIDER_NAMES.has(providerName)) &&
    isGpt56Model(params.model)
  );
}

export function applyOpenAIResponsesModelConstraints(config: {
  model?: string;
  providerName?: string;
  reasoningEffort?: OpenAIResponsesReasoningEffort;
  max_output_tokens?: number;
  reasoningMode?: OpenAIResponsesReasoningMode;
  reasoningContext?: OpenAIResponsesReasoningContext;
  inputImageDetail?: OpenAIResponsesInputImageDetail;
  promptCacheMode?: OpenAIResponsesPromptCacheMode;
  promptCacheKey?: string;
}) {
  if (typeof config.max_output_tokens === "number") {
    config.max_output_tokens = clampOpenAIResponsesMaxOutputTokens(
      config.max_output_tokens,
      config.model,
    );
  }

  if (isOpenAIGpt5OrNewerModelConfig(config)) {
    config.reasoningEffort = normalizeOpenAIResponsesReasoningEffort(
      config.reasoningEffort,
      config.model,
    );
  }

  if (isOpenAIGpt56ModelConfig(config)) {
    config.reasoningMode = parseOpenAIResponsesReasoningMode(
      config.reasoningMode,
    );
    config.reasoningContext = parseOpenAIResponsesReasoningContext(
      config.reasoningContext,
    );
    config.inputImageDetail = parseOpenAIResponsesInputImageDetail(
      config.inputImageDetail,
    );
    config.promptCacheMode = parseOpenAIResponsesPromptCacheMode(
      config.promptCacheMode,
    );
    config.promptCacheKey = parseOpenAIResponsesPromptCacheKey(
      config.promptCacheKey,
    );
  }
}

export function shouldUseOpenAIResponses(params: {
  enabled?: boolean;
  model?: string;
  providerName?: string;
}) {
  return params.providerName !== "Azure";
}

export function supportsOpenAIResponsesSampling(model?: string) {
  const normalized = model?.trim().toLowerCase() ?? "";

  if (/^o\d/.test(normalized)) {
    return false;
  }

  if (
    /^gpt-5($|[-.])/.test(normalized) &&
    !/^gpt-5\.(4|5)($|[-.])/.test(normalized)
  ) {
    return false;
  }

  return true;
}

export function supportsOpenAIResponsesWebSearch(params: {
  model?: string;
  providerName?: string;
}) {
  const providerName = params.providerName?.trim().toLowerCase();
  const normalizedModel = params.model?.trim().toLowerCase() ?? "";

  return (
    (!providerName || OPENAI_PROVIDER_NAMES.has(providerName)) &&
    (/^gpt-5\.(4|5|6)(?:[-.]|$)/.test(normalizedModel) ||
      /^gpt-4\.1(?:[-.]|$)/.test(normalizedModel))
  );
}

function getSearchIntentText(input?: string) {
  const text = input?.trim();
  if (!text) {
    return "";
  }

  const attachmentStart = text.search(ATTACHMENT_WIRE_HEADER_PATTERN);

  if (attachmentStart < 0) {
    return text;
  }

  return text.slice(0, attachmentStart).trim();
}

export function shouldRequireOpenAIResponsesWebSearch(input?: string) {
  const normalized = getSearchIntentText(input).toLowerCase();
  if (!normalized) {
    return false;
  }

  return /(?:今天|今日|昨天|昨晚|明天|本周|本月|今年|现在|当前|实时|最新|最近|刚刚|新闻|大新闻|热搜|热点|发生了什么|价格|股价|汇率|天气|赛程|比分|结果|发布|更新|today|yesterday|tomorrow|this\s+(?:week|month|year)|latest|recent|current|currently|right\s+now|real[-\s]?time|live|news|headline|price|stock|exchange\s+rate|weather|schedule|score|release|released|update|updated)/i.test(
    normalized,
  );
}

export function shouldEnableOpenAIResponsesWebSearch(input?: string) {
  return shouldRequireOpenAIResponsesWebSearch(input);
}
