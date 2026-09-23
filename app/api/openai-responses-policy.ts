import {
  applyOpenAIResponsesPromptCachePolicy,
  clampOpenAIResponsesMaxOutputTokens,
  cloneOpenAIResponsesInput,
  isGpt6Model,
  normalizeOpenAIResponsesReasoningEffort,
  supportsOpenAIResponsesAdvancedFeatures,
  supportsOpenAIResponsesSampling,
  visitOpenAIResponsesInputParts,
  type OpenAIResponsesInputImageDetail,
  type OpenAIResponsesPromptCacheMode,
  type OpenAIResponsesReasoningContext,
  type OpenAIResponsesReasoningMode,
  type OpenAIResponsesTextVerbosity,
} from "../utils/openai-responses";

export type OpenAIResponsesAdminPolicy = {
  lockedFields: readonly string[];
  temperature?: number;
  textVerbosity: OpenAIResponsesTextVerbosity;
  maxOutputTokens?: number;
  reasoningMode: OpenAIResponsesReasoningMode;
  reasoningContext: OpenAIResponsesReasoningContext;
  inputImageDetail: OpenAIResponsesInputImageDetail;
  promptCacheMode: OpenAIResponsesPromptCacheMode;
  promptCacheKey?: string;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function enforceLockedOpenAIResponsesPolicy<T extends JsonRecord>(
  body: T,
  policy: OpenAIResponsesAdminPolicy,
): JsonRecord {
  const model = typeof body.model === "string" ? body.model : undefined;
  if (!supportsOpenAIResponsesAdvancedFeatures(model)) return body;

  const lockedFields = new Set(policy.lockedFields);
  let result: JsonRecord = { ...body };
  if (isGpt6Model(model)) {
    const reasoning = isRecord(body.reasoning) ? { ...body.reasoning } : {};
    reasoning.effort = normalizeOpenAIResponsesReasoningEffort(
      typeof reasoning.effort === "string" ? reasoning.effort : undefined,
      model,
    );
    result.reasoning = reasoning;
    if (!supportsOpenAIResponsesSampling(model, String(reasoning.effort))) {
      for (const field of [
        "temperature",
        "top_p",
        "logprobs",
        "top_logprobs",
      ]) {
        delete result[field];
      }
      if (Array.isArray(body.include)) {
        const include = body.include.filter(
          (field) =>
            typeof field !== "string" || !field.split(".").includes("logprobs"),
        );
        if (include.length > 0) result.include = include;
        else delete result.include;
      }
    }
    if (
      typeof result.max_output_tokens === "number" &&
      Number.isFinite(result.max_output_tokens)
    ) {
      result.max_output_tokens = clampOpenAIResponsesMaxOutputTokens(
        result.max_output_tokens,
        model,
      );
    }
  }

  if (lockedFields.has("temperature")) {
    if (
      supportsOpenAIResponsesSampling(
        model,
        isRecord(result.reasoning)
          ? String(result.reasoning.effort)
          : undefined,
      ) &&
      typeof policy.temperature === "number" &&
      Number.isFinite(policy.temperature)
    ) {
      result.temperature = policy.temperature;
    } else {
      delete result.temperature;
    }
  }

  if (lockedFields.has("textVerbosity")) {
    const text = isRecord(body.text) ? { ...body.text } : {};
    text.verbosity = policy.textVerbosity;
    result.text = text;
  }

  if (lockedFields.has("max_output_tokens")) {
    if (
      typeof policy.maxOutputTokens === "number" &&
      Number.isFinite(policy.maxOutputTokens)
    ) {
      result.max_output_tokens = clampOpenAIResponsesMaxOutputTokens(
        policy.maxOutputTokens,
        model,
      );
    } else {
      delete result.max_output_tokens;
    }
  }

  if (
    lockedFields.has("reasoningMode") ||
    lockedFields.has("reasoningContext")
  ) {
    const reasoning = isRecord(result.reasoning) ? { ...result.reasoning } : {};
    if (lockedFields.has("reasoningMode")) {
      reasoning.mode = policy.reasoningMode;
    }
    if (lockedFields.has("reasoningContext")) {
      reasoning.context = policy.reasoningContext;
    }
    result.reasoning = reasoning;
  }

  if (lockedFields.has("inputImageDetail")) {
    result.input = cloneOpenAIResponsesInput(body.input);
    visitOpenAIResponsesInputParts(result.input, (part) => {
      if (part.type === "input_image") {
        part.detail = policy.inputImageDetail;
      }
    });
  }

  const cacheModeLocked = lockedFields.has("promptCacheMode");
  if (cacheModeLocked) {
    result = applyOpenAIResponsesPromptCachePolicy(result, {
      mode: policy.promptCacheMode,
      key:
        typeof result.prompt_cache_key === "string"
          ? result.prompt_cache_key
          : undefined,
    });
  }

  if (
    lockedFields.has("promptCacheKey") &&
    !(cacheModeLocked && policy.promptCacheMode === "disabled")
  ) {
    const promptCacheKey = policy.promptCacheKey?.trim();
    if (promptCacheKey) {
      result.prompt_cache_key = promptCacheKey;
    } else {
      delete result.prompt_cache_key;
    }
  }

  return result;
}
