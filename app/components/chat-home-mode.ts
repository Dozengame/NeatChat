import { LLMModel } from "../client/types";
import { ServiceProvider } from "../constant";
import { isGptImageGenerationModel } from "../utils/openai-image";
import {
  isOpenAIGpt5OrNewerModelConfig,
  OPENAI_RESPONSES_DEFAULT_MODEL,
} from "../utils/openai-responses";

export type ChatHomeMode = "chat" | "image";
export type ChatHomeModel = Omit<LLMModel, "provider"> & {
  provider?: LLMModel["provider"];
};

export function getChatHomeModeForModel(
  model?: string,
  providerName?: string,
): ChatHomeMode {
  return providerName?.trim().toLowerCase() ===
    ServiceProvider.OpenAI.toLowerCase() && isGptImageGenerationModel(model)
    ? "image"
    : "chat";
}

export function isModelEligibleForChatHomeMode(
  model: ChatHomeModel,
  mode: ChatHomeMode,
) {
  if (!model.available) return false;

  const providerName = model.provider?.providerName;
  if (mode === "image") {
    return (
      providerName?.trim().toLowerCase() ===
        ServiceProvider.OpenAI.toLowerCase() &&
      isGptImageGenerationModel(model.name)
    );
  }

  return isOpenAIGpt5OrNewerModelConfig({
    model: model.name,
    providerName,
  });
}

export function getChatHomeModeModels(
  models: readonly ChatHomeModel[],
  mode: ChatHomeMode,
) {
  return models.filter((model) => isModelEligibleForChatHomeMode(model, mode));
}

export function resolvePreferredChatHomeModel(
  mode: ChatHomeMode,
  models: readonly ChatHomeModel[],
) {
  const eligibleModels = getChatHomeModeModels(models, mode);
  const preferredName =
    mode === "image" ? "gpt-image-2" : OPENAI_RESPONSES_DEFAULT_MODEL;

  return (
    eligibleModels.find(
      (model) =>
        model.name === preferredName &&
        model.provider?.providerName?.trim().toLowerCase() ===
          ServiceProvider.OpenAI.toLowerCase(),
    ) ?? eligibleModels[0]
  );
}
