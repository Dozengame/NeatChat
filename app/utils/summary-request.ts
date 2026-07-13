import { ServiceProvider } from "../constant";
import type { ModelConfig } from "../store/config";
import {
  clampOpenAIResponsesMaxOutputTokens,
  getMaxOutputTokensForReasoningEffort,
  isOpenAIResponsesReasoningModelConfig,
  normalizeOpenAIResponsesReasoningEffort,
  OPENAI_RESPONSES_DEFAULT_MODEL,
  resolveOpenAIResponsesReasoningEffortDefault,
} from "./openai-responses";
import {
  normalizeModelRef,
  resolveAllowedModelRef,
  splitModelRef,
  type PublicAppConfig,
} from "./public-app-config";

export type SummaryRequestConfig = {
  model: string;
  providerName: string;
  reasoningEffort: ModelConfig["reasoningEffort"] | undefined;
  max_output_tokens: number | undefined;
  source: "summary_override" | "server_default" | "fallback";
  followsDefault: boolean;
  defaultModelRef: string;
};

type SummaryResolverModelConfig = Pick<
  ModelConfig,
  | "model"
  | "providerName"
  | "compressModel"
  | "compressProviderName"
  | "reasoningEffort"
  | "max_output_tokens"
>;

function modelRef(model?: string, providerName?: string) {
  return normalizeModelRef(providerName ? `${model}@${providerName}` : model);
}

export function resolveSummaryRequestConfig(params: {
  targetModelConfig: SummaryResolverModelConfig;
  fallbackModelConfig: SummaryResolverModelConfig;
  publicConfig?: PublicAppConfig;
  availableModelRefs?: ReadonlySet<string> | readonly string[];
}): SummaryRequestConfig {
  const {
    targetModelConfig,
    fallbackModelConfig,
    publicConfig,
    availableModelRefs,
  } = params;
  const allowedModels = publicConfig?.allowedModels ?? [];
  const availableModels =
    availableModelRefs === undefined
      ? undefined
      : availableModelRefs instanceof Set
      ? availableModelRefs
      : new Set(availableModelRefs);
  const fallbackRef =
    resolveAllowedModelRef({
      model: fallbackModelConfig.model,
      providerName: fallbackModelConfig.providerName,
      allowedModels,
    }) ??
    modelRef(fallbackModelConfig.model, fallbackModelConfig.providerName) ??
    `${OPENAI_RESPONSES_DEFAULT_MODEL}@OpenAI`;
  const configuredDefaultRef = resolveAllowedModelRef({
    model: publicConfig?.forced.model ?? publicConfig?.defaults.model,
    providerName:
      publicConfig?.forced.providerName ?? publicConfig?.defaults.providerName,
    allowedModels,
    fallbackModelRef: fallbackRef,
  });
  const defaultModelRef = configuredDefaultRef ?? fallbackRef;
  const modelSelectionLocked =
    publicConfig?.lockedFields.includes("model") ||
    publicConfig?.lockedFields.includes("providerName");
  const hasSummaryOverride =
    !modelSelectionLocked &&
    !!targetModelConfig.compressModel?.trim() &&
    !!targetModelConfig.compressProviderName?.trim();
  const summaryOverrideRef = hasSummaryOverride
    ? modelRef(
        targetModelConfig.compressModel,
        targetModelConfig.compressProviderName,
      )
    : undefined;
  const summaryOverrideAvailable =
    !!summaryOverrideRef &&
    (availableModels === undefined || availableModels.has(summaryOverrideRef));
  const requestedRef = summaryOverrideAvailable
    ? summaryOverrideRef
    : defaultModelRef;
  const effectiveRef =
    resolveAllowedModelRef({
      model: requestedRef,
      allowedModels,
      fallbackModelRef: defaultModelRef,
    }) ?? defaultModelRef;
  const [resolvedModel, resolvedProviderName] = splitModelRef(effectiveRef);
  const model = resolvedModel ?? fallbackModelConfig.model;
  const providerName =
    resolvedProviderName ??
    fallbackModelConfig.providerName ??
    ServiceProvider.OpenAI;
  const overrideWasApplied =
    hasSummaryOverride &&
    summaryOverrideAvailable &&
    requestedRef === effectiveRef;
  const supportsReasoning = isOpenAIResponsesReasoningModelConfig({
    model,
    providerName,
  });

  let reasoningEffort: ModelConfig["reasoningEffort"] | undefined;
  let maxOutputTokens = publicConfig?.forced.max_output_tokens;
  if (supportsReasoning) {
    const configuredEffort = resolveOpenAIResponsesReasoningEffortDefault({
      model,
      providerName,
      defaults: publicConfig?.reasoningEffortDefaults,
    });
    const lockedEffort = publicConfig?.lockedFields.includes("reasoningEffort")
      ? publicConfig.forced.reasoningEffort
      : undefined;
    const isEffectiveDefault = effectiveRef === defaultModelRef;
    const scalarDefault = isEffectiveDefault
      ? publicConfig?.forced.reasoningEffort ??
        publicConfig?.defaults.reasoningEffort
      : undefined;
    reasoningEffort = lockedEffort
      ? normalizeOpenAIResponsesReasoningEffort(lockedEffort, model)
      : configuredEffort ??
        normalizeOpenAIResponsesReasoningEffort(scalarDefault, model);
    maxOutputTokens = clampOpenAIResponsesMaxOutputTokens(
      typeof maxOutputTokens === "number"
        ? maxOutputTokens
        : getMaxOutputTokensForReasoningEffort(reasoningEffort),
      model,
    );
  } else if (typeof maxOutputTokens !== "number") {
    maxOutputTokens = overrideWasApplied
      ? targetModelConfig.max_output_tokens
      : fallbackModelConfig.max_output_tokens;
  }

  return {
    model,
    providerName,
    reasoningEffort,
    max_output_tokens: maxOutputTokens,
    source: overrideWasApplied
      ? "summary_override"
      : publicConfig
      ? "server_default"
      : "fallback",
    followsDefault: !overrideWasApplied,
    defaultModelRef,
  };
}
