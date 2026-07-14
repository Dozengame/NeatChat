import {
  clampOpenAIResponsesMaxOutputTokens,
  normalizeOpenAIResponsesReasoningEffort,
  parseOpenAIResponsesTextVerbosity,
  supportsOpenAIResponsesReasoning,
  supportsOpenAIResponsesTextVerbosity,
} from "./openai-responses";

export type OpenAIModelTestServerConfig = {
  openaiMaxOutputTokens?: number;
  openaiReasoningEffort?: string;
  openaiTextVerbosity?: string;
};

export function buildOpenAIModelTestRequest(
  model: string,
  serverConfig: OpenAIModelTestServerConfig,
) {
  const textVerbosity = supportsOpenAIResponsesTextVerbosity(model)
    ? parseOpenAIResponsesTextVerbosity(serverConfig.openaiTextVerbosity)
    : undefined;

  return {
    model,
    input: "Hello!",
    max_output_tokens: clampOpenAIResponsesMaxOutputTokens(
      serverConfig.openaiMaxOutputTokens ?? 16,
      model,
    ),
    ...(supportsOpenAIResponsesReasoning(model)
      ? {
          reasoning: {
            effort: normalizeOpenAIResponsesReasoningEffort(
              serverConfig.openaiReasoningEffort,
              model,
            ),
          },
        }
      : {}),
    ...(textVerbosity ? { text: { verbosity: textVerbosity } } : {}),
    stream: false,
  };
}
