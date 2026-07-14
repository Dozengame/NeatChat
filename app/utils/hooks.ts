import { useMemo } from "react";
import { useAccessStore } from "../store/access";
import { useAppConfig } from "../store/config";
import { collectModelsWithDefaultModelAndPolicy } from "./model";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    const customModelsString = configStore.customModels
      ? configStore.customModels
      : accessStore.customModels || "";

    return collectModelsWithDefaultModelAndPolicy(
      configStore.models,
      customModelsString,
      accessStore.defaultModel,
      accessStore.allowedModels,
    );
  }, [
    accessStore.allowedModels,
    accessStore.customModels,
    accessStore.defaultModel,
    configStore.customModels,
    configStore.models,
  ]);

  return models;
}
