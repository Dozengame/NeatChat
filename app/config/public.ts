import { getServerSideConfig } from "./server";
import { DEFAULT_INPUT_TEMPLATE, ServiceProvider } from "../constant";
import {
  getMaxOutputTokensForReasoningEffort,
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

export function publicConfigHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

export function buildPublicAppConfig(now = new Date()): PublicAppConfig {
  const serverConfig = getServerSideConfig();
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
    serverConfig.defaultModel || "gpt-5.5@OpenAI",
  );
  const forcedModelRef = resolveAllowedModelRef({
    model: requestedModel,
    providerName: requestedProviderName || ServiceProvider.OpenAI,
    allowedModels,
    fallbackModelRef: "gpt-5.5@OpenAI",
  });
  const [model, providerName] = splitModelRef(forcedModelRef);
  const reasoningEffort =
    serverConfig.openaiReasoningEffort as OpenAIResponsesReasoningEffort;
  const defaultMaxOutputTokens =
    typeof serverConfig.openaiMaxOutputTokens === "number"
      ? serverConfig.openaiMaxOutputTokens
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
      store: false,
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
      ...(typeof serverConfig.openaiMaxOutputTokens === "number"
        ? { max_output_tokens: serverConfig.openaiMaxOutputTokens }
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
      openaiMaxOutputTokens: serverConfig.openaiMaxOutputTokens,
      openaiTextVerbosity: serverConfig.openaiTextVerbosity,
      compressMessageLengthThreshold:
        serverConfig.openaiCompressMessageLengthThreshold,
    },
  };
  const configHash = hashPublicConfig(hashInput);

  return {
    configVersion: serverConfig.webuiConfigVersion || configHash,
    configHash,
    deploymentId: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_URL,
    updatedAt: now.toISOString(),
    ...hashInput,
  };
}
