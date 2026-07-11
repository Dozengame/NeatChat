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
