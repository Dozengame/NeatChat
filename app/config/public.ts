import { getServerSideConfig } from "./server";
import { DEFAULT_INPUT_TEMPLATE, ServiceProvider } from "../constant";
import {
  clampOpenAIResponsesMaxOutputTokens,
  getMaxOutputTokensForReasoningEffort,
  normalizeOpenAIResponsesReasoningEffort,
  OPENAI_RESPONSES_DEFAULT_MODEL,
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
  const reasoningEffort = normalizeOpenAIResponsesReasoningEffort(
    serverConfig.openaiReasoningEffort,
    model,
  ) as OpenAIResponsesReasoningEffort;
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
      textVerbosity: serverConfig.openaiTextVerbosity,
      ...(typeof effectiveMaxOutputTokens === "number"
        ? { max_output_tokens: effectiveMaxOutputTokens }
        : {}),
    },
    allowedModels,
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
