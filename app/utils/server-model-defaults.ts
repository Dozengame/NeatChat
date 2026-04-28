import { DEFAULT_MODELS, ServiceProvider } from "../constant";
import { getModelProvider } from "./model";
import {
  getMaxOutputTokensForReasoningEffort,
  isOpenAIGpt5OrNewerModelConfig,
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
    reasoningEffort &&
    ["low", "medium", "high"].includes(reasoningEffort) &&
    isOpenAIGpt5OrNewerModelConfig({
      model: modelConfig.model,
      providerName: modelConfig.providerName,
    })
  ) {
    modelConfig.reasoningEffort = reasoningEffort;
    modelConfig.max_output_tokens =
      typeof config.openaiMaxOutputTokens === "number"
        ? config.openaiMaxOutputTokens
        : getMaxOutputTokensForReasoningEffort(reasoningEffort);
  }

  return modelConfig;
}
