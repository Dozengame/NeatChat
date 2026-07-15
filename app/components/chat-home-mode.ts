import { LLMModel } from "../client/types";
import { ServiceProvider } from "../constant";
import {
  getOpenAIImageGenerationOptions,
  isOpenAIImageGenerationModel,
  isOpenAIImageGenerationModelConfig,
} from "../utils/openai-image";
import {
  isOpenAIResponsesReasoningModelConfig,
  OPENAI_RESPONSES_DEFAULT_MODEL,
} from "../utils/openai-responses";

export type ChatHomeMode = "chat" | "image";
export type ComposerModelMenuSection = "reasoning" | "image-options";
export type ComposerModelMenuLayer =
  | "closed"
  | "models"
  | ComposerModelMenuSection;
export type ChatHomeModel = Omit<LLMModel, "provider"> & {
  provider?: LLMModel["provider"];
};

export function getChatHomeModeForModel(
  model?: string,
  providerName?: string,
): ChatHomeMode {
  return isOpenAIImageGenerationModelConfig({ model, providerName })
    ? "image"
    : "chat";
}

export function getComposerModelMenuSection(
  model?: string,
  providerName?: string,
): ComposerModelMenuSection | null {
  if (isOpenAIImageGenerationModelConfig({ model, providerName })) {
    const options = getOpenAIImageGenerationOptions(model);
    return options.sizes.length > 1 || options.qualities.length > 1
      ? "image-options"
      : null;
  }

  return isOpenAIResponsesReasoningModelConfig({ model, providerName })
    ? "reasoning"
    : null;
}

export function getComposerModelMenuLayer(
  open: boolean,
  section: ComposerModelMenuSection | null,
): ComposerModelMenuLayer {
  if (!open) return "closed";
  return section ?? "models";
}

export function getComposerModelMenuEscapeLayer(
  layer: ComposerModelMenuLayer,
  currentSection: ComposerModelMenuSection | null,
): ComposerModelMenuSection | "closed" {
  if (layer === "models") return currentSection ?? "closed";
  return "closed";
}

export function getImageComposerSummary(
  size: string,
  quality: string | undefined,
  autoLabel: string,
  sizeLabel = size,
  qualityLabel = quality,
) {
  const displayedSize = size === "auto" ? autoLabel : sizeLabel;
  if (!quality) return displayedSize;
  if (size === "auto" && quality === "auto") return autoLabel;
  return [displayedSize, quality === "auto" ? autoLabel : qualityLabel].join(
    " · ",
  );
}

export function isModelEligibleForChatHomeMode(
  model: ChatHomeModel,
  mode: ChatHomeMode,
) {
  if (!model.available) return false;

  const providerName = model.provider?.providerName;
  if (mode === "image") {
    return isOpenAIImageGenerationModelConfig({
      model: model.name,
      providerName,
    });
  }

  return !isOpenAIImageGenerationModel(model.name);
}

export function getChatHomeModeModels(
  models: readonly ChatHomeModel[],
  mode: ChatHomeMode,
) {
  return models.filter((model) => isModelEligibleForChatHomeMode(model, mode));
}

export function isChatHomeModeDisabled(options: {
  mode: ChatHomeMode;
  activeMode: ChatHomeMode;
  availableModelCount: number;
  modelLocked: boolean;
}) {
  return (
    options.mode !== options.activeMode &&
    (options.modelLocked || options.availableModelCount === 0)
  );
}

export function resolvePreferredChatHomeModel(
  mode: ChatHomeMode,
  models: readonly ChatHomeModel[],
  configuredDefault?: { name?: string; providerName?: string },
) {
  const eligibleModels = getChatHomeModeModels(models, mode);
  const configuredModel = configuredDefault?.name
    ? eligibleModels.find(
        (model) =>
          model.name === configuredDefault.name &&
          model.provider?.providerName?.trim().toLowerCase() ===
            (configuredDefault.providerName ?? ServiceProvider.OpenAI)
              .trim()
              .toLowerCase(),
      )
    : undefined;
  const preferredName =
    mode === "image" ? "gpt-image-2" : OPENAI_RESPONSES_DEFAULT_MODEL;

  return (
    configuredModel ??
    eligibleModels.find(
      (model) =>
        model.name === preferredName &&
        model.provider?.providerName?.trim().toLowerCase() ===
          ServiceProvider.OpenAI.toLowerCase(),
    ) ??
    eligibleModels[0]
  );
}
