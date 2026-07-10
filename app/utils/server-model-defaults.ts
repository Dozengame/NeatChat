import { DEFAULT_MODELS, ServiceProvider } from "../constant";
import { getModelProvider } from "./model";
import {
  getMaxOutputTokensForReasoningEffort,
  isOpenAIResponsesReasoningEffort,
  isOpenAIGpt5OrNewerModelConfig,
  normalizeOpenAIResponsesReasoningEffort,
  OpenAIChatReasoningEffort,
} from "./openai-responses";

export type ServerModelDefaults = {
  defaultModel?: string;
  defaultTemperature?: number;
  openaiReasoningEffort?: string;
  openaiMaxOutputTokens?: number;
};

function limitTemperature(value: number) {
  if (Number.isNaN(value)) {
    return undefined;
  }

  return Math.min(2, Math.max(0, value));
}

export function resolveServerModelConfig(config: ServerModelDefaults) {
  const modelConfig: {
    model?: string;
    providerName?: ServiceProvider;
    temperature?: number;
    reasoningEffort?: OpenAIChatReasoningEffort;
    max_output_tokens?: number;
  } = {};

  if (config.defaultModel) {
    const [model, providerName] = getModelProvider(config.defaultModel);
    const modelProvider =
      providerName ??
      DEFAULT_MODELS.find((item) => item.name === model)?.provider
        ?.providerName ??
      ServiceProvider.OpenAI;

    modelConfig.model = model;
    modelConfig.providerName = modelProvider as ServiceProvider;
  }

  if (typeof config.defaultTemperature === "number") {
    modelConfig.temperature = limitTemperature(config.defaultTemperature);
  }

  const reasoningEffort = config.openaiReasoningEffort as
    | OpenAIChatReasoningEffort
    | undefined;

  if (
    isOpenAIResponsesReasoningEffort(reasoningEffort) &&
    isOpenAIGpt5OrNewerModelConfig({
      model: modelConfig.model,
      providerName: modelConfig.providerName,
    })
  ) {
    const normalizedReasoningEffort = normalizeOpenAIResponsesReasoningEffort(
      reasoningEffort,
      modelConfig.model,
    );
    modelConfig.reasoningEffort = normalizedReasoningEffort;
    modelConfig.max_output_tokens =
      typeof config.openaiMaxOutputTokens === "number"
        ? config.openaiMaxOutputTokens
        : getMaxOutputTokensForReasoningEffort(normalizedReasoningEffort);
  }

  return modelConfig;
}
