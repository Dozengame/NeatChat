import {
  clampOpenAIResponsesMaxOutputTokens,
  isGpt56Model,
  OPENAI_RESPONSES_PROMPT_CACHE_TTL,
  supportsOpenAIResponsesSampling,
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

function cloneResponsesInput(input: unknown) {
  if (!Array.isArray(input)) return input;

  return input.map((item) => {
    if (!isRecord(item)) return item;
    const clonedItem: JsonRecord = { ...item };
    if (Array.isArray(item.content)) {
      clonedItem.content = item.content.map((part) =>
        isRecord(part) ? { ...part } : part,
      );
    }
    return clonedItem;
  });
}

function visitInputParts(input: unknown, callback: (part: JsonRecord) => void) {
  if (!Array.isArray(input)) return;

  for (const item of input) {
    if (!isRecord(item)) continue;
    callback(item);
    if (!Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (isRecord(part)) callback(part);
    }
  }
}

function removePromptCacheBreakpoints(input: unknown) {
  visitInputParts(input, (part) => {
    delete part.prompt_cache_breakpoint;
  });
}

function addLatestUserPromptCacheBreakpoint(input: unknown) {
  if (!Array.isArray(input)) return false;

  for (let itemIndex = input.length - 1; itemIndex >= 0; itemIndex -= 1) {
    const item = input[itemIndex];
    if (
      !isRecord(item) ||
      item.role !== "user" ||
      !Array.isArray(item.content)
    ) {
      continue;
    }

    for (
      let contentIndex = item.content.length - 1;
      contentIndex >= 0;
      contentIndex -= 1
    ) {
      const part = item.content[contentIndex];
      if (
        !isRecord(part) ||
        (part.type !== "input_text" && part.type !== "input_image")
      ) {
        continue;
      }
      part.prompt_cache_breakpoint = { mode: "explicit" };
      return true;
    }
  }

  return false;
}

export function enforceLockedOpenAIResponsesPolicy<T extends JsonRecord>(
  body: T,
  policy: OpenAIResponsesAdminPolicy,
): JsonRecord {
  const model = typeof body.model === "string" ? body.model : undefined;
  if (!isGpt56Model(model)) return body;

  const lockedFields = new Set(policy.lockedFields);
  const result: JsonRecord = { ...body };

  if (lockedFields.has("temperature")) {
    if (
      supportsOpenAIResponsesSampling(model) &&
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
    const reasoning = isRecord(body.reasoning) ? { ...body.reasoning } : {};
    if (lockedFields.has("reasoningMode")) {
      reasoning.mode = policy.reasoningMode;
    }
    if (lockedFields.has("reasoningContext")) {
      reasoning.context = policy.reasoningContext;
    }
    result.reasoning = reasoning;
  }

  const shouldCloneInput =
    lockedFields.has("inputImageDetail") || lockedFields.has("promptCacheMode");
  if (shouldCloneInput) {
    result.input = cloneResponsesInput(body.input);
  }

  if (lockedFields.has("inputImageDetail")) {
    visitInputParts(result.input, (part) => {
      if (part.type === "input_image") {
        part.detail = policy.inputImageDetail;
      }
    });
  }

  const cacheModeLocked = lockedFields.has("promptCacheMode");
  if (cacheModeLocked) {
    removePromptCacheBreakpoints(result.input);

    if (policy.promptCacheMode === "disabled") {
      result.prompt_cache_options = {
        mode: "explicit",
        ttl: OPENAI_RESPONSES_PROMPT_CACHE_TTL,
      };
      delete result.prompt_cache_key;
    } else if (policy.promptCacheMode === "implicit") {
      result.prompt_cache_options = {
        mode: "implicit",
        ttl: OPENAI_RESPONSES_PROMPT_CACHE_TTL,
      };
    } else {
      const isStoredContinuation =
        typeof result.previous_response_id === "string" &&
        !!result.previous_response_id.trim();
      const hasBreakpoint =
        isStoredContinuation ||
        addLatestUserPromptCacheBreakpoint(result.input);
      result.prompt_cache_options = {
        mode: hasBreakpoint ? "explicit" : "implicit",
        ttl: OPENAI_RESPONSES_PROMPT_CACHE_TTL,
      };
    }
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
