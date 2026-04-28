export const OPENAI_RESPONSES_DEFAULT_MODEL = "gpt-5.5";
export const OPENAI_RESPONSES_DEFAULT_TEMPERATURE = 1;
export const OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT = "low";
export const OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY = "medium";
export const OPENAI_RESPONSES_DEFAULT_COMPRESS_MESSAGE_LENGTH_THRESHOLD = 1000;
export const OPENAI_RESPONSES_REASONING_MAX_OUTPUT_TOKENS = {
  none: 10000,
  low: 10000,
  medium: 20000,
  high: 30000,
  xhigh: 30000,
} as const;

export type OpenAIResponsesReasoningEffort =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export type OpenAIChatReasoningEffort = Extract<
  OpenAIResponsesReasoningEffort,
  "low" | "medium" | "high"
>;

export type OpenAIResponsesTextVerbosity = "low" | "medium" | "high";

const REASONING_EFFORTS = new Set(["none", "low", "medium", "high", "xhigh"]);

const TEXT_VERBOSITIES = new Set(["low", "medium", "high"]);

const OPENAI_PROVIDER_NAMES = new Set(["openai", "chatgpt"]);

export function parseOpenAIMaxOutputTokens(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  const maxOutputTokens = Number(normalized);
  if (!Number.isFinite(maxOutputTokens)) {
    return undefined;
  }

  return Math.floor(Math.min(512000, Math.max(0, maxOutputTokens)));
}

export function parseOpenAIResponsesReasoningEffort(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (normalized && REASONING_EFFORTS.has(normalized)) {
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
