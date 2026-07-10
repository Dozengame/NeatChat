import {
  clampOpenAIResponsesMaxOutputTokens,
  normalizeOpenAIResponsesReasoningEffort,
  parseOpenAIResponsesTextVerbosity,
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
  return {
    model,
    input: "Hello!",
    max_output_tokens: clampOpenAIResponsesMaxOutputTokens(
      serverConfig.openaiMaxOutputTokens ?? 16,
      model,
    ),
    reasoning: {
      effort: normalizeOpenAIResponsesReasoningEffort(
        serverConfig.openaiReasoningEffort,
        model,
      ),
    },
    text: {
      verbosity: parseOpenAIResponsesTextVerbosity(
        serverConfig.openaiTextVerbosity,
      ),
    },
    stream: false,
  };
}
