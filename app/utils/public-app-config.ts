import md5 from "spark-md5";

import { DEFAULT_MODELS, ServiceProvider } from "../constant";
import { collectModels, getModelProvider } from "./model";
import type {
  OpenAIResponsesInputImageDetail,
  OpenAIResponsesPromptCacheMode,
  OpenAIResponsesReasoningContext,
  OpenAIResponsesReasoningEffort,
  OpenAIResponsesReasoningEffortAllowlist,
  OpenAIResponsesReasoningMode,
  OpenAIResponsesTextVerbosity,
} from "./openai-responses";
import type { PublicUpdateAnnouncement } from "./update-announcement";

export type ConfigSource =
  | "server_default"
  | "user_override"
  | "conversation_override"
  | "admin_forced"
  | "fallback";

export type ConfigFieldMeta = {
  source: ConfigSource;
  updatedAt: number;
  configVersion?: string;
  configHash?: string;
  locked?: boolean;
};

export type ModelConfigMeta = Partial<Record<string, ConfigFieldMeta>>;

export type PublicAppConfig = {
  schemaVersion: number;
  configVersion: string;
  configHash: string;
  deploymentId?: string;
  updatedAt: string;
  updateAnnouncement?: PublicUpdateAnnouncement;
  defaults: {
    model?: string;
    providerName?: string;
    temperature?: number;
    top_p?: number;
    max_output_tokens?: number;
    reasoningEffort?: OpenAIResponsesReasoningEffort;
    reasoningMode?: OpenAIResponsesReasoningMode;
    reasoningContext?: OpenAIResponsesReasoningContext;
    inputImageDetail?: OpenAIResponsesInputImageDetail;
    promptCacheMode?: OpenAIResponsesPromptCacheMode;
    promptCacheKey?: string;
    reasoningSummary?: "auto" | "concise" | "detailed";
    textVerbosity?: OpenAIResponsesTextVerbosity;
    truncation?: "auto" | "disabled";
    store?: boolean;
    service_tier?: string;
    stream?: boolean;
    historyMessageCount?: number;
    compressMessageLengthThreshold?: number;
    sendMemory?: boolean;
    enableInjectSystemPrompts?: boolean;
    template?: string;
  };
  forced: {
    model?: string;
    providerName?: string;
    baseUrlLocked?: boolean;
    apiKeyLocked?: boolean;
    temperature?: number;
    reasoningEffort?: OpenAIResponsesReasoningEffort;
    reasoningMode?: OpenAIResponsesReasoningMode;
    reasoningContext?: OpenAIResponsesReasoningContext;
    inputImageDetail?: OpenAIResponsesInputImageDetail;
    promptCacheMode?: OpenAIResponsesPromptCacheMode;
    promptCacheKey?: string;
    textVerbosity?: OpenAIResponsesTextVerbosity;
    max_output_tokens?: number;
  };
  allowedModels: string[];
  reasoningEffortAllowlist?: OpenAIResponsesReasoningEffortAllowlist;
  lockedFields: string[];
  serverFlags: {
    needCode: boolean;
    hideUserApiKey: boolean;
    hideBalanceQuery: boolean;
    disableFastLink: boolean;
    disableGPT4: boolean;
    apiKeyConfigured?: boolean;
    accessCodeRequired?: boolean;
  };
  legacy: {
    customModels: string;
    defaultModel?: string;
    defaultTemperature?: number;
    openaiReasoningEffort?: string;
    openaiMaxOutputTokens?: number;
    openaiTextVerbosity?: string;
    compressMessageLengthThreshold?: number;
  };
};

export const PUBLIC_APP_CONFIG_SCHEMA_VERSION = 1;

const DEFAULT_WEBUI_LOCKED_FIELDS = [
  "customModels",
  "baseUrl",
  "apiKey",
  "temperature",
  "textVerbosity",
  "reasoningMode",
  "reasoningContext",
  "inputImageDetail",
  "promptCacheMode",
  "promptCacheKey",
];

const PROVIDER_NAMES = new Map(
  Object.values(ServiceProvider).map((name) => [name.toLowerCase(), name]),
);

function parseCsvList(value?: string) {
  return (value ?? "").split(",").flatMap((item) => {
    const trimmed = item.trim();
    return trimmed ? [trimmed] : [];
  });
}

function normalizeProviderName(providerName?: string) {
  if (!providerName?.trim()) {
    return ServiceProvider.OpenAI;
  }

  return (
    PROVIDER_NAMES.get(providerName.trim().toLowerCase()) ?? providerName.trim()
  );
}

export function normalizeModelRef(modelRef?: string) {
  if (!modelRef?.trim()) {
    return undefined;
  }

  const [model, providerName] = getModelProvider(modelRef.trim());
  return `${model}@${normalizeProviderName(providerName)}`;
}

export function splitModelRef(modelRef?: string) {
  const normalized = normalizeModelRef(modelRef);
  if (!normalized) {
    return [undefined, undefined] as const;
  }

  const [model, providerName] = getModelProvider(normalized);
  return [model, normalizeProviderName(providerName)] as const;
}

export function deriveAllowedModels(params: {
  webuiAllowedModels?: string;
  customModels?: string;
}) {
  const explicitAllowedModels = parseCsvList(params.webuiAllowedModels).flatMap(
    (modelRef) => {
      const normalized = normalizeModelRef(modelRef);
      return normalized ? [normalized] : [];
    },
  );

  if (explicitAllowedModels.length > 0) {
    return Array.from(new Set(explicitAllowedModels));
  }

  if (!params.customModels?.trim()) {
    return [];
  }

  const models = collectModels(DEFAULT_MODELS, params.customModels);
  const allowedModels = models.flatMap((model) => {
    if (!model.available) return [];
    const normalized = normalizeModelRef(
      `${model.name}@${model.provider?.providerName}`,
    );
    return normalized ? [normalized] : [];
  });

  return Array.from(new Set(allowedModels));
}

export function resolveLockedFields(params: {
  webuiLockedFields?: string;
  hasForcedMaxOutputTokens?: boolean;
}) {
  const fields = new Set([
    ...DEFAULT_WEBUI_LOCKED_FIELDS,
    ...parseCsvList(params.webuiLockedFields),
  ]);

  if (params.hasForcedMaxOutputTokens) {
    fields.add("max_output_tokens");
  }

  return Array.from(fields);
}

export function isPublicConfigFieldLocked(
  publicConfig: Pick<PublicAppConfig, "lockedFields"> | undefined,
  field: string,
) {
  return !!publicConfig?.lockedFields?.includes(field);
}

export function resolveAllowedModelRef(params: {
  model?: string;
  providerName?: string;
  allowedModels?: string[];
  fallbackModelRef?: string;
}) {
  const requested = normalizeModelRef(
    params.providerName
      ? `${params.model}@${params.providerName}`
      : params.model,
  );
  const allowedModels = params.allowedModels ?? [];

  if (!allowedModels.length) {
    return requested ?? normalizeModelRef(params.fallbackModelRef);
  }

  if (requested && allowedModels.includes(requested)) {
    return requested;
  }

  const fallback = normalizeModelRef(params.fallbackModelRef);
  if (fallback && allowedModels.includes(fallback)) {
    return fallback;
  }

  return allowedModels[0];
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function hashPublicConfig(value: unknown) {
  return md5.hash(stableStringify(value));
}

export function createConfigFieldMeta(params: {
  source: ConfigSource;
  publicConfig?: PublicAppConfig;
  locked?: boolean;
  updatedAt?: number;
}): ConfigFieldMeta {
  return {
    source: params.source,
    updatedAt: params.updatedAt ?? Date.now(),
    configVersion: params.publicConfig?.configVersion,
    configHash: params.publicConfig?.configHash,
    locked: params.locked,
  };
}
