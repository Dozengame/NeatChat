import { ServiceProvider } from "../app/constant";
import { DEFAULT_CONFIG } from "../app/store/config";
import { resolveSummaryRequestConfig } from "../app/utils/summary-request";
import type { PublicAppConfig } from "../app/utils/public-app-config";

function publicConfig(
  overrides: Partial<PublicAppConfig> = {},
): PublicAppConfig {
  const base: PublicAppConfig = {
    schemaVersion: 1,
    configVersion: "summary-test",
    configHash: "summary-hash",
    updatedAt: "2026-07-13T00:00:00.000Z",
    defaults: {
      model: "gpt-5.6-luna",
      providerName: ServiceProvider.OpenAI,
      reasoningEffort: "xhigh",
      max_output_tokens: 30000,
    },
    forced: {
      model: "gpt-5.6-luna",
      providerName: ServiceProvider.OpenAI,
    },
    allowedModels: [
      "gpt-5.6-luna@OpenAI",
      "gpt-5.6-terra@OpenAI",
      "claude-sonnet-4-5@Anthropic",
    ],
    reasoningEffortDefaults: {
      default: "medium",
      models: {
        "gpt-5.6-luna": "xhigh",
        "gpt-5.6-terra": "high",
      },
    },
    lockedFields: [],
    serverFlags: {
      needCode: false,
      hideUserApiKey: false,
      hideBalanceQuery: false,
      disableFastLink: false,
      disableGPT4: false,
    },
    legacy: {
      customModels: "",
      defaultModel: "gpt-5.6-luna",
      openaiReasoningEffort: "*=medium;gpt-5.6-luna=xhigh;gpt-5.6-terra=high",
    },
  };

  return {
    ...base,
    ...overrides,
    defaults: { ...base.defaults, ...(overrides.defaults ?? {}) },
    forced: { ...base.forced, ...(overrides.forced ?? {}) },
    serverFlags: { ...base.serverFlags, ...(overrides.serverFlags ?? {}) },
    legacy: { ...base.legacy, ...(overrides.legacy ?? {}) },
  };
}

function targetModelConfig(
  overrides: Partial<typeof DEFAULT_CONFIG.modelConfig> = {},
) {
  return {
    ...DEFAULT_CONFIG.modelConfig,
    model: "gpt-5.6-terra" as any,
    providerName: ServiceProvider.OpenAI,
    reasoningEffort: "high" as const,
    max_output_tokens: 30000,
    ...overrides,
  };
}

describe("resolveSummaryRequestConfig", () => {
  test("binds the empty sentinel to the effective DEFAULT_MODEL and its effort", () => {
    const result = resolveSummaryRequestConfig({
      targetModelConfig: targetModelConfig({
        compressModel: "",
        compressProviderName: "",
        reasoningEffort: "low",
      }),
      fallbackModelConfig: targetModelConfig({
        model: "gpt-5.6-sol" as any,
        reasoningEffort: "medium",
      }),
      publicConfig: publicConfig(),
    });

    expect(result).toMatchObject({
      model: "gpt-5.6-luna",
      providerName: ServiceProvider.OpenAI,
      reasoningEffort: "xhigh",
      max_output_tokens: 30000,
      source: "server_default",
      followsDefault: true,
      defaultModelRef: "gpt-5.6-luna@OpenAI",
    });
  });

  test("resolves a valid explicit Summary override with that model's effort", () => {
    const result = resolveSummaryRequestConfig({
      targetModelConfig: targetModelConfig({
        compressModel: "gpt-5.6-terra",
        compressProviderName: ServiceProvider.OpenAI,
        reasoningEffort: "xhigh",
      }),
      fallbackModelConfig: targetModelConfig(),
      publicConfig: publicConfig(),
    });

    expect(result).toMatchObject({
      model: "gpt-5.6-terra",
      providerName: ServiceProvider.OpenAI,
      reasoningEffort: "high",
      max_output_tokens: 30000,
      source: "summary_override",
      followsDefault: false,
    });
  });

  test("falls back without mutating a persisted override that is no longer allowed", () => {
    const result = resolveSummaryRequestConfig({
      targetModelConfig: targetModelConfig({
        compressModel: "gpt-5.6-sol",
        compressProviderName: ServiceProvider.OpenAI,
      }),
      fallbackModelConfig: targetModelConfig(),
      publicConfig: publicConfig(),
    });

    expect(result).toMatchObject({
      model: "gpt-5.6-luna",
      providerName: ServiceProvider.OpenAI,
      reasoningEffort: "xhigh",
      source: "server_default",
      followsDefault: true,
    });
  });

  test("falls back when an allowed Summary override is unavailable in the catalog", () => {
    const result = resolveSummaryRequestConfig({
      targetModelConfig: targetModelConfig({
        compressModel: "gpt-5.6-sol",
        compressProviderName: ServiceProvider.OpenAI,
      }),
      fallbackModelConfig: targetModelConfig(),
      publicConfig: publicConfig({
        allowedModels: [
          "gpt-5.6-luna@OpenAI",
          "gpt-5.6-terra@OpenAI",
          "gpt-5.6-sol@OpenAI",
        ],
      }),
      availableModelRefs: new Set([
        "gpt-5.6-luna@OpenAI",
        "gpt-5.6-terra@OpenAI",
      ]),
    });

    expect(result).toMatchObject({
      model: "gpt-5.6-luna",
      providerName: ServiceProvider.OpenAI,
      source: "server_default",
      followsDefault: true,
    });
  });

  test("falls back when an unlisted persisted override is missing from an unrestricted catalog", () => {
    const result = resolveSummaryRequestConfig({
      targetModelConfig: targetModelConfig({
        compressModel: "retired-summary-model",
        compressProviderName: ServiceProvider.OpenAI,
      }),
      fallbackModelConfig: targetModelConfig(),
      publicConfig: publicConfig({ allowedModels: [] }),
      availableModelRefs: ["gpt-5.6-luna@OpenAI"],
    });

    expect(result).toMatchObject({
      model: "gpt-5.6-luna",
      providerName: ServiceProvider.OpenAI,
      source: "server_default",
      followsDefault: true,
    });
  });

  test("does not attach OpenAI reasoning fields to a non-OpenAI Summary model", () => {
    const result = resolveSummaryRequestConfig({
      targetModelConfig: targetModelConfig({
        compressModel: "claude-sonnet-4-5",
        compressProviderName: ServiceProvider.Anthropic,
      }),
      fallbackModelConfig: targetModelConfig(),
      publicConfig: publicConfig(),
    });

    expect(result).toMatchObject({
      model: "claude-sonnet-4-5",
      providerName: ServiceProvider.Anthropic,
      source: "summary_override",
      followsDefault: false,
    });
    expect(result.reasoningEffort).toBeUndefined();
    expect(result.max_output_tokens).toBe(30000);
  });

  test("uses the fallback output budget for a non-OpenAI default", () => {
    const result = resolveSummaryRequestConfig({
      targetModelConfig: targetModelConfig({
        compressModel: "",
        compressProviderName: "",
        max_output_tokens: 1234,
      }),
      fallbackModelConfig: targetModelConfig({
        model: "claude-sonnet-4-5" as any,
        providerName: ServiceProvider.Anthropic,
        max_output_tokens: 5678,
      }),
      publicConfig: publicConfig({
        defaults: {
          model: "claude-sonnet-4-5",
          providerName: ServiceProvider.Anthropic,
        },
        forced: {
          model: "claude-sonnet-4-5",
          providerName: ServiceProvider.Anthropic,
        },
      }),
    });

    expect(result).toMatchObject({
      model: "claude-sonnet-4-5",
      providerName: ServiceProvider.Anthropic,
      reasoningEffort: undefined,
      max_output_tokens: 5678,
      followsDefault: true,
    });
  });

  test("keeps a forced output budget for a non-OpenAI model", () => {
    const result = resolveSummaryRequestConfig({
      targetModelConfig: targetModelConfig({
        compressModel: "claude-sonnet-4-5",
        compressProviderName: ServiceProvider.Anthropic,
        max_output_tokens: 1234,
      }),
      fallbackModelConfig: targetModelConfig(),
      publicConfig: publicConfig({ forced: { max_output_tokens: 8765 } }),
    });

    expect(result.max_output_tokens).toBe(8765);
  });

  test("keeps administrator max output tokens above the effort-derived value", () => {
    const result = resolveSummaryRequestConfig({
      targetModelConfig: targetModelConfig(),
      fallbackModelConfig: targetModelConfig(),
      publicConfig: publicConfig({
        forced: { max_output_tokens: 12345 },
      }),
    });

    expect(result.max_output_tokens).toBe(12345);
  });

  test("keeps a locked administrator effort above per-model defaults", () => {
    const result = resolveSummaryRequestConfig({
      targetModelConfig: targetModelConfig({
        compressModel: "gpt-5.6-terra",
        compressProviderName: ServiceProvider.OpenAI,
      }),
      fallbackModelConfig: targetModelConfig(),
      publicConfig: publicConfig({
        forced: { reasoningEffort: "medium" },
        lockedFields: ["reasoningEffort"],
      }),
    });

    expect(result.reasoningEffort).toBe("medium");
  });
});
