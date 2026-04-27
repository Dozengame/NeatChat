import { DEFAULT_MODELS, ServiceProvider } from "../constant";
import { getModelProvider } from "./model";

export type ServerModelDefaults = {
  defaultModel?: string;
  defaultTemperature?: number;
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

  return modelConfig;
}
