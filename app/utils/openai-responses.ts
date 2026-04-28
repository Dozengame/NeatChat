export const OPENAI_RESPONSES_DEFAULT_MODEL = "gpt-5.5";
export const OPENAI_RESPONSES_DEFAULT_TEMPERATURE = 1;
export const OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT = "low";
export const OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY = "medium";

export type OpenAIResponsesReasoningEffort =
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export type OpenAIChatReasoningEffort = Extract<
  OpenAIResponsesReasoningEffort,
  "low" | "medium" | "high"
>;

export type OpenAIResponsesTextVerbosity = "low" | "medium" | "high";

const REASONING_EFFORTS = new Set(["low", "medium", "high", "xhigh"]);

const TEXT_VERBOSITIES = new Set(["low", "medium", "high"]);

export function parseOpenAIResponsesMode(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
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
  return params.providerName === "OpenAI" && isGpt5OrNewerModel(params.model);
}

export function shouldUseOpenAIResponses(params: {
  enabled?: boolean;
  model?: string;
  providerName?: string;
}) {
  return (
    !!params.enabled &&
    params.providerName !== "Azure" &&
    isGpt5OrNewerModel(params.model)
  );
}
