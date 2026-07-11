import { estimateTokenLength } from "./token";
import {
  clampOpenAIResponsesMaxOutputTokens,
  OPENAI_GPT_56_MAX_OUTPUT_TOKENS,
} from "./openai-responses";

export const OPENAI_GPT_56_CONTEXT_WINDOW_TOKENS = 1_050_000;
export const OPENAI_GPT_56_INPUT_SAFETY_MARGIN_TOKENS = 64_000;

type OpenAIHistoryMessage = {
  role?: string;
  content: unknown;
  openaiResponsesOutput?: unknown[];
};

export type OpenAIHistorySegment<T extends OpenAIHistoryMessage> = {
  messages: T[];
  pinned: boolean;
};

export class OpenAIResponsesRecoveryContextLimitError extends Error {
  constructor() {
    super("OpenAI Responses recovery trace exceeds the input context budget");
    this.name = "OpenAIResponsesRecoveryContextLimitError";
  }
}

export class OpenAIResponsesFixedInputContextLimitError extends Error {
  constructor() {
    super("OpenAI Responses fixed input exceeds the input context budget");
    this.name = "OpenAIResponsesFixedInputContextLimitError";
  }
}

export function estimateOpenAIResponsesInputTokens(
  message: OpenAIHistoryMessage,
) {
  let serializedContent: string;
  try {
    serializedContent = JSON.stringify({
      role: message.role,
      content: message.content,
    });
  } catch {
    serializedContent = String(message.content ?? "");
  }
  const contentTokens = Math.ceil(estimateTokenLength(serializedContent));

  let replayTokens = 0;
  if (message.openaiResponsesOutput?.length) {
    let serializedReplay: string;
    try {
      serializedReplay = JSON.stringify(message.openaiResponsesOutput);
    } catch {
      serializedReplay = String(message.openaiResponsesOutput);
    }
    // Encrypted reasoning and tool replay data are opaque/high-entropy. UTF-8
    // bytes are a conservative ceiling; natural-language token heuristics can
    // undercount base64 by several times.
    replayTokens = new TextEncoder().encode(serializedReplay).byteLength;
  }

  return Math.max(1, contentTokens + replayTokens);
}

function getReservedOutputTokens(model: string, maxOutputTokens: number) {
  if (!Number.isFinite(maxOutputTokens) || maxOutputTokens <= 0) {
    return OPENAI_GPT_56_MAX_OUTPUT_TOKENS;
  }
  return clampOpenAIResponsesMaxOutputTokens(maxOutputTokens, model);
}

export function getOpenAIAllTurnsHistoryTokenBudget(params: {
  model: string;
  maxOutputTokens: number;
  fixedMessages: OpenAIHistoryMessage[];
}) {
  const fixedInputTokens = params.fixedMessages.reduce(
    (total, message) => total + estimateOpenAIResponsesInputTokens(message),
    0,
  );
  const remainingBudget =
    OPENAI_GPT_56_CONTEXT_WINDOW_TOKENS -
    getReservedOutputTokens(params.model, params.maxOutputTokens) -
    OPENAI_GPT_56_INPUT_SAFETY_MARGIN_TOKENS -
    fixedInputTokens;
  if (remainingBudget < 0) {
    throw new OpenAIResponsesFixedInputContextLimitError();
  }
  return remainingBudget;
}

export function selectOpenAIAllTurnsHistory<
  T extends OpenAIHistoryMessage,
>(params: {
  model: string;
  maxOutputTokens: number;
  fixedMessages: OpenAIHistoryMessage[];
  segments: OpenAIHistorySegment<T>[];
}) {
  const budget = getOpenAIAllTurnsHistoryTokenBudget(params);
  const segmentCosts = params.segments.map((segment) =>
    segment.messages.reduce(
      (total, message) => total + estimateOpenAIResponsesInputTokens(message),
      0,
    ),
  );
  const selected = new Set<number>();
  let remainingBudget = budget;

  for (let index = 0; index < params.segments.length; index += 1) {
    if (!params.segments[index].pinned) continue;
    remainingBudget -= segmentCosts[index];
    selected.add(index);
  }

  if (remainingBudget < 0) {
    throw new OpenAIResponsesRecoveryContextLimitError();
  }

  for (let index = params.segments.length - 1; index >= 0; index -= 1) {
    if (selected.has(index)) continue;
    const segmentCost = segmentCosts[index];
    if (segmentCost > remainingBudget) break;
    remainingBudget -= segmentCost;
    selected.add(index);
  }

  return params.segments.flatMap((segment, index) =>
    selected.has(index) ? segment.messages : [],
  );
}
