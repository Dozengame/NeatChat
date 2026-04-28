import { useMemo } from "react";
import { useAccessStore, useAppConfig } from "../store";
import { collectModelsWithDefaultModel } from "./model";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    const customModelsString = configStore.customModels
      ? configStore.customModels
      : accessStore.customModels || "";

    const allowedModels = new Set(accessStore.allowedModels ?? []);
    const models = collectModelsWithDefaultModel(
      configStore.models,
      customModelsString,
      accessStore.defaultModel,
    );

    if (allowedModels.size === 0) {
      return models;
    }

    return models.map((model) => ({
      ...model,
      available:
        model.available &&
        allowedModels.has(`${model.name}@${model.provider?.providerName}`),
    }));
  }, [
    accessStore.allowedModels,
    accessStore.customModels,
    accessStore.defaultModel,
    configStore.customModels,
    configStore.models,
  ]);

  return models;
}
