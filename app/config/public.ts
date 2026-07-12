import { getServerSideConfig } from "./server";
import { DEFAULT_INPUT_TEMPLATE, ServiceProvider } from "../constant";
import {
  clampOpenAIResponsesMaxOutputTokens,
  getConfiguredOpenAIResponsesReasoningEffort,
  getConfiguredOpenAIResponsesReasoningEfforts,
  getMaxOutputTokensForReasoningEffort,
  normalizeOpenAIResponsesReasoningEffort,
  normalizeReasoningEffortModelKey,
  OPENAI_RESPONSES_REASONING_EFFORTS,
  OPENAI_RESPONSES_DEFAULT_MODEL,
  parseOpenAIResponsesReasoningEffortAllowlist,
  resolveOpenAIResponsesReasoningEffortDefault,
  type OpenAIResponsesReasoningEffort,
} from "../utils/openai-responses";
import {
  deriveAllowedModels,
  hashPublicConfig,
  PUBLIC_APP_CONFIG_SCHEMA_VERSION,
  resolveAllowedModelRef,
  resolveLockedFields,
  splitModelRef,
  type PublicAppConfig,
} from "../utils/public-app-config";
import { parseUpdateAnnouncementJson } from "../utils/update-announcement";

export function publicConfigHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

export function buildPublicAppConfig(now = new Date()): PublicAppConfig {
  const serverConfig = getServerSideConfig();
  const updateAnnouncementInput = parseUpdateAnnouncementJson(
    process.env.WEBUI_ANNOUNCEMENT_JSON,
    now,
  );
  const updateAnnouncement = updateAnnouncementInput
    ? {
        ...updateAnnouncementInput,
        hash: hashPublicConfig(updateAnnouncementInput),
      }
    : undefined;
  const allowedModels = deriveAllowedModels({
    webuiAllowedModels: serverConfig.webuiAllowedModels,
    customModels: serverConfig.customModels || process.env.CUSTOM_MODELS || "",
  });
  const lockedFields = resolveLockedFields({
    webuiLockedFields: serverConfig.webuiLockedFields,
    hasForcedMaxOutputTokens:
      typeof serverConfig.openaiMaxOutputTokens === "number",
  });
  const [requestedModel, requestedProviderName] = splitModelRef(
    serverConfig.defaultModel || `${OPENAI_RESPONSES_DEFAULT_MODEL}@OpenAI`,
  );
  const forcedModelRef = resolveAllowedModelRef({
    model: requestedModel,
    providerName: requestedProviderName || ServiceProvider.OpenAI,
    allowedModels,
    fallbackModelRef: `${OPENAI_RESPONSES_DEFAULT_MODEL}@OpenAI`,
  });
  const [model, providerName] = splitModelRef(forcedModelRef);
  const reasoningEffort = (resolveOpenAIResponsesReasoningEffortDefault({
    model,
    providerName,
    defaults: serverConfig.openaiReasoningEffortDefaults,
  }) ??
    normalizeOpenAIResponsesReasoningEffort(
      serverConfig.openaiReasoningEffort,
      model,
    )) as OpenAIResponsesReasoningEffort;
  const configuredReasoningEfforts =
    parseOpenAIResponsesReasoningEffortAllowlist(
      serverConfig.webuiAllowedReasoningEfforts,
    );
  const configuredDefaultModelEfforts =
    getConfiguredOpenAIResponsesReasoningEfforts(
      model,
      configuredReasoningEfforts,
    );
  if (
    configuredReasoningEfforts &&
    configuredDefaultModelEfforts &&
    !configuredDefaultModelEfforts.some((effort) => effort === reasoningEffort)
  ) {
    const defaultModelKey = normalizeReasoningEffortModelKey(model);
    const mergedEfforts = OPENAI_RESPONSES_REASONING_EFFORTS.filter(
      (effort) =>
        effort === reasoningEffort ||
        configuredDefaultModelEfforts.some(
          (configuredEffort) => configuredEffort === effort,
        ),
    );
    if (defaultModelKey) {
      configuredReasoningEfforts.models[defaultModelKey] = mergedEfforts;
    }
  }
  if (
    configuredReasoningEfforts &&
    serverConfig.openaiReasoningEffortDefaults
  ) {
    const configuredDefault =
      serverConfig.openaiReasoningEffortDefaults.default;
    if (configuredDefault) {
      configuredReasoningEfforts.default =
        OPENAI_RESPONSES_REASONING_EFFORTS.filter(
          (effort) =>
            effort === configuredDefault ||
            configuredReasoningEfforts.default?.includes(effort),
        );
    }

    for (const modelKey of Object.keys(
      serverConfig.openaiReasoningEffortDefaults.models,
    )) {
      const modelDefault = getConfiguredOpenAIResponsesReasoningEffort(
        modelKey,
        serverConfig.openaiReasoningEffortDefaults,
      );
      const configuredModelEfforts =
        getConfiguredOpenAIResponsesReasoningEfforts(
          modelKey,
          configuredReasoningEfforts,
        ) ?? [];
      configuredReasoningEfforts.models[modelKey] =
        OPENAI_RESPONSES_REASONING_EFFORTS.filter(
          (effort) =>
            effort === modelDefault || configuredModelEfforts.includes(effort),
        );
    }
  }
  const effectiveMaxOutputTokens =
    typeof serverConfig.openaiMaxOutputTokens === "number"
      ? clampOpenAIResponsesMaxOutputTokens(
          serverConfig.openaiMaxOutputTokens,
          model,
        )
      : undefined;
  const defaultMaxOutputTokens =
    typeof effectiveMaxOutputTokens === "number"
      ? effectiveMaxOutputTokens
      : getMaxOutputTokensForReasoningEffort(reasoningEffort);

  const hashInput = {
    schemaVersion: PUBLIC_APP_CONFIG_SCHEMA_VERSION,
    defaults: {
      model,
      providerName,
      temperature: serverConfig.defaultTemperature,
      max_output_tokens: defaultMaxOutputTokens,
      reasoningEffort,
      reasoningMode: serverConfig.openaiReasoningMode,
      reasoningContext: serverConfig.openaiReasoningContext,
      inputImageDetail: serverConfig.openaiInputImageDetail,
      promptCacheMode: serverConfig.openaiPromptCacheMode,
      promptCacheKey: serverConfig.openaiPromptCacheKey ?? "",
      reasoningSummary: "auto" as const,
      textVerbosity: serverConfig.openaiTextVerbosity,
      truncation: "disabled" as const,
      store: serverConfig.openaiStoreResponses,
      stream: true,
      historyMessageCount: 4,
      compressMessageLengthThreshold:
        serverConfig.openaiCompressMessageLengthThreshold,
      sendMemory: true,
      enableInjectSystemPrompts: true,
      template: process.env.DEFAULT_INPUT_TEMPLATE || DEFAULT_INPUT_TEMPLATE,
    },
    forced: {
      model,
      providerName,
      baseUrlLocked: lockedFields.includes("baseUrl"),
      apiKeyLocked: lockedFields.includes("apiKey"),
      temperature: serverConfig.defaultTemperature,
      ...(lockedFields.includes("reasoningEffort") ? { reasoningEffort } : {}),
      ...(lockedFields.includes("reasoningMode")
        ? { reasoningMode: serverConfig.openaiReasoningMode }
        : {}),
      ...(lockedFields.includes("reasoningContext")
        ? { reasoningContext: serverConfig.openaiReasoningContext }
        : {}),
      ...(lockedFields.includes("inputImageDetail")
        ? { inputImageDetail: serverConfig.openaiInputImageDetail }
        : {}),
      ...(lockedFields.includes("promptCacheMode")
        ? { promptCacheMode: serverConfig.openaiPromptCacheMode }
        : {}),
      ...(lockedFields.includes("promptCacheKey")
        ? { promptCacheKey: serverConfig.openaiPromptCacheKey ?? "" }
        : {}),
      textVerbosity: serverConfig.openaiTextVerbosity,
      ...(typeof effectiveMaxOutputTokens === "number"
        ? { max_output_tokens: effectiveMaxOutputTokens }
        : {}),
    },
    allowedModels,
    reasoningEffortAllowlist: configuredReasoningEfforts,
    reasoningEffortDefaults: serverConfig.openaiReasoningEffortDefaults,
    lockedFields,
    serverFlags: {
      needCode: serverConfig.needCode,
      hideUserApiKey: serverConfig.hideUserApiKey,
      hideBalanceQuery: serverConfig.hideBalanceQuery,
      disableFastLink: serverConfig.disableFastLink,
      disableGPT4: serverConfig.disableGPT4,
      apiKeyConfigured: !!process.env.OPENAI_API_KEY,
      accessCodeRequired: serverConfig.needCode,
    },
    legacy: {
      customModels:
        serverConfig.customModels || process.env.CUSTOM_MODELS || "",
      defaultModel: serverConfig.defaultModel,
      defaultTemperature: serverConfig.defaultTemperature,
      openaiReasoningEffort: serverConfig.openaiReasoningEffort,
      openaiMaxOutputTokens: effectiveMaxOutputTokens,
      openaiTextVerbosity: serverConfig.openaiTextVerbosity,
      compressMessageLengthThreshold:
        serverConfig.openaiCompressMessageLengthThreshold,
    },
  };
  const configHash = hashPublicConfig(hashInput);

  return {
    configVersion: serverConfig.webuiConfigVersion || configHash,
    configHash,
    updateAnnouncement,
    deploymentId:
      process.env.VERCEL_DEPLOYMENT_ID ||
      process.env.VERCEL_URL ||
      process.env.VERCEL_GIT_COMMIT_SHA,
    updatedAt: now.toISOString(),
    ...hashInput,
  };
}
