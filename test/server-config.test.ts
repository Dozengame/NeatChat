import {
  getServerSideConfig,
  parseDefaultTemperature,
} from "../app/config/server";
import {
  applyOpenAIResponsesModelConstraints,
  applyConfiguredOpenAIResponsesReasoningEffortDefault,
  filterOpenAIResponsesReasoningEfforts,
  getMaxOutputTokensForReasoningEffort,
  getOpenAIResponsesMaxOutputTokensLimit,
  getConfiguredOpenAIResponsesReasoningEffort,
  getOpenAIResponsesReasoningEfforts,
  includeCurrentOpenAIResponsesReasoningEffort,
  isGpt56Model,
  isOpenAIGpt5OrNewerModelConfig,
  isGpt5OrNewerModel,
  parseOpenAICompressMessageLengthThreshold,
  parseOpenAIMaxOutputTokens,
  parseOpenAIResponsesInputImageDetail,
  parseOpenAIResponsesPromptCacheKey,
  parseOpenAIResponsesPromptCacheMode,
  parseOpenAIResponsesReasoningContext,
  parseOpenAIResponsesReasoningEffort,
  parseOpenAIResponsesReasoningEffortAllowlist,
  parseOpenAIResponsesReasoningEffortDefaults,
  parseOpenAIResponsesReasoningMode,
  parseOpenAIResponsesTextVerbosity,
  shouldEnableOpenAIResponsesWebSearch,
  shouldRequireOpenAIResponsesWebSearch,
  shouldUseOpenAIResponses,
  supportsOpenAIResponsesStreaming,
  supportsOpenAIResponsesWebSearch,
} from "../app/utils/openai-responses";
import { OPENAI_GPT_56_MODELS } from "../app/constant";
import {
  buildPublicAppConfig,
  publicConfigHeaders,
} from "../app/config/public";
import {
  deriveAllowedModels,
  resolveLockedFields,
} from "../app/utils/public-app-config";
import { resolveServerModelConfig } from "../app/utils/server-model-defaults";
import { parseUpdateAnnouncementJson } from "../app/utils/update-announcement";

describe("parseDefaultTemperature", () => {
  test("returns undefined when OPENAI_TEMPERATURE is empty or invalid", () => {
    expect(parseDefaultTemperature()).toBeUndefined();
    expect(parseDefaultTemperature("")).toBeUndefined();
    expect(parseDefaultTemperature("abc")).toBeUndefined();
  });

  test("parses valid OPENAI_TEMPERATURE values", () => {
    expect(parseDefaultTemperature("1")).toBe(1);
    expect(parseDefaultTemperature("0.7")).toBe(0.7);
  });

  test("keeps OPENAI_TEMPERATURE inside the supported range", () => {
    expect(parseDefaultTemperature("-1")).toBe(0);
    expect(parseDefaultTemperature("3")).toBe(2);
  });
});

describe("OpenAI Responses config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("detects GPT-5 and newer model names", () => {
    expect(isGpt5OrNewerModel("gpt-5")).toBe(true);
    expect(isGpt5OrNewerModel("gpt-5.5")).toBe(true);
    expect(isGpt5OrNewerModel("gpt-6")).toBe(true);
    expect(isGpt5OrNewerModel("gpt-4o")).toBe(false);
    expect(isGpt5OrNewerModel("o1-preview")).toBe(false);
  });

  test.each(OPENAI_GPT_56_MODELS)("detects %s as GPT-5.6", (model) => {
    expect(isGpt56Model(model)).toBe(true);
    expect(getOpenAIResponsesReasoningEfforts(model)).toEqual([
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
    ]);
  });

  test("uses the official reasoning effort matrix for GPT-5 families", () => {
    expect(getOpenAIResponsesReasoningEfforts("gpt-5")).toEqual([
      "minimal",
      "low",
      "medium",
      "high",
    ]);
    expect(getOpenAIResponsesReasoningEfforts("gpt-5.1")).toEqual([
      "none",
      "low",
      "medium",
      "high",
    ]);
    for (const model of [
      "gpt-5.2",
      "gpt-5.4",
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-5.5",
    ]) {
      expect(getOpenAIResponsesReasoningEfforts(model)).toEqual([
        "none",
        "low",
        "medium",
        "high",
        "xhigh",
      ]);
    }
    expect(getOpenAIResponsesReasoningEfforts("gpt-5.4-pro")).toEqual([
      "medium",
      "high",
      "xhigh",
    ]);
    expect(getOpenAIResponsesReasoningEfforts("gpt-5-pro")).toEqual(["high"]);
  });

  test("parses a canonical reasoning effort UI allowlist", () => {
    expect(parseOpenAIResponsesReasoningEffortAllowlist()).toBeUndefined();
    expect(parseOpenAIResponsesReasoningEffortAllowlist("   ")).toBeUndefined();
    expect(
      parseOpenAIResponsesReasoningEffortAllowlist(
        " MAX, medium,invalid,medium, HIGH ",
      ),
    ).toEqual({ default: ["medium", "high", "max"], models: {} });
    expect(
      parseOpenAIResponsesReasoningEffortAllowlist("invalid,unknown"),
    ).toEqual({ default: [], models: {} });
    expect(
      parseOpenAIResponsesReasoningEffortAllowlist(
        "*=low,medium;gpt-5.6=medium,high,xhigh,max;gpt-5.6-terra=none,low;gpt-5.6-luna=low,bad",
      ),
    ).toEqual({
      default: ["low", "medium"],
      models: {
        "gpt-5.6-sol": ["medium", "high", "xhigh", "max"],
        "gpt-5.6-terra": ["none", "low"],
        "gpt-5.6-luna": ["low"],
      },
    });
  });

  test("intersects the reasoning effort UI allowlist with model support", () => {
    const allowed = ["none", "high", "max"] as const;

    expect(
      filterOpenAIResponsesReasoningEfforts("gpt-5.6-terra", allowed),
    ).toEqual(["none", "high", "max"]);
    expect(filterOpenAIResponsesReasoningEfforts("gpt-5.5", allowed)).toEqual([
      "none",
      "high",
    ]);
    expect(filterOpenAIResponsesReasoningEfforts("gpt-5.5")).toEqual([
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
    ]);
    expect(
      includeCurrentOpenAIResponsesReasoningEffort(["medium"], "high"),
    ).toEqual(["high", "medium"]);

    const scoped = parseOpenAIResponsesReasoningEffortAllowlist(
      "*=low,medium;gpt-5.6-sol=high,xhigh,max;gpt-5.6-terra=none,low",
    );
    expect(filterOpenAIResponsesReasoningEfforts("gpt-5.6", scoped)).toEqual([
      "high",
      "xhigh",
      "max",
    ]);
    expect(
      filterOpenAIResponsesReasoningEfforts("gpt-5.6-sol", scoped),
    ).toEqual(["high", "xhigh", "max"]);
    expect(
      filterOpenAIResponsesReasoningEfforts("gpt-5.6-terra", scoped),
    ).toEqual(["none", "low"]);
    expect(
      filterOpenAIResponsesReasoningEfforts("gpt-5.6-luna", scoped),
    ).toEqual(["low", "medium"]);
  });

  test("parses and resolves model-specific reasoning effort defaults", () => {
    expect(parseOpenAIResponsesReasoningEffortDefaults()).toBeUndefined();
    expect(parseOpenAIResponsesReasoningEffortDefaults("bad")).toBeUndefined();
    expect(parseOpenAIResponsesReasoningEffortDefaults("medium")).toEqual({
      default: "medium",
      models: {},
    });

    const defaults = parseOpenAIResponsesReasoningEffortDefaults(
      " *=medium ; gpt-5.6=medium ; gpt-5.6-terra=HIGH ; gpt-5.6-luna=bad ; gpt-5.6-luna=xhigh ",
    );
    expect(defaults).toEqual({
      default: "medium",
      models: {
        "gpt-5.6-sol": "medium",
        "gpt-5.6-terra": "high",
        "gpt-5.6-luna": "xhigh",
      },
    });
    expect(
      getConfiguredOpenAIResponsesReasoningEffort("gpt-5.6", defaults),
    ).toBe("medium");
    expect(
      getConfiguredOpenAIResponsesReasoningEffort(
        "gpt-5.6-terra@OpenAI",
        defaults,
      ),
    ).toBe("high");
    expect(
      getConfiguredOpenAIResponsesReasoningEffort("gpt-5.6-luna", defaults),
    ).toBe("xhigh");
    expect(
      getConfiguredOpenAIResponsesReasoningEffort("gpt-5.6-unknown", defaults),
    ).toBe("medium");

    const unsupportedExact = parseOpenAIResponsesReasoningEffortDefaults(
      "*=medium;gpt-5=none",
    );
    expect(
      getConfiguredOpenAIResponsesReasoningEffort("gpt-5", unsupportedExact),
    ).toBe("medium");

    const noFallback =
      parseOpenAIResponsesReasoningEffortDefaults("gpt-5.6-terra=high");
    expect(
      getConfiguredOpenAIResponsesReasoningEffort("gpt-5.6-luna", noFallback),
    ).toBe("low");
  });

  test("applies model defaults without replacing explicit overrides", () => {
    const defaults = parseOpenAIResponsesReasoningEffortDefaults(
      "*=medium;gpt-5.6-terra=high;gpt-5.6-luna=xhigh",
    );
    const config = {
      model: "gpt-5.6-terra",
      providerName: "OpenAI",
      reasoningEffort: "medium" as const,
      max_output_tokens: 20000,
    };
    expect(
      applyConfiguredOpenAIResponsesReasoningEffortDefault({
        config,
        defaults,
        configMeta: {
          reasoningEffort: { source: "server_default" },
          max_output_tokens: { source: "server_default" },
        },
      }),
    ).toEqual({
      reasoningEffortChanged: true,
      maxOutputTokensChanged: true,
    });
    expect(config).toMatchObject({
      reasoningEffort: "high",
      max_output_tokens: 30000,
    });

    config.model = "gpt-5.6-luna";
    applyConfiguredOpenAIResponsesReasoningEffortDefault({
      config,
      defaults,
      configMeta: {
        reasoningEffort: { source: "conversation_override" },
        max_output_tokens: { source: "conversation_override" },
      },
    });
    expect(config).toMatchObject({
      reasoningEffort: "high",
      max_output_tokens: 30000,
    });

    const lockedConfig = {
      model: "gpt-5.6-luna",
      providerName: "OpenAI",
      reasoningEffort: "medium" as const,
      max_output_tokens: 20000,
    };
    applyConfiguredOpenAIResponsesReasoningEffortDefault({
      config: lockedConfig,
      defaults,
      configMeta: {
        reasoningEffort: { source: "admin_forced", locked: true },
        max_output_tokens: { source: "admin_forced", locked: true },
      },
    });
    expect(lockedConfig).toMatchObject({
      reasoningEffort: "medium",
      max_output_tokens: 20000,
    });

    config.providerName = "Azure";
    applyConfiguredOpenAIResponsesReasoningEffortDefault({ config, defaults });
    expect(config.reasoningEffort).toBe("high");
  });

  test("uses current pre-5.6 model constraints when switching away from GPT-5.6", () => {
    const modelConfig = {
      model: "gpt-5.5",
      providerName: "OpenAI",
      reasoningEffort: "max" as const,
      max_output_tokens: 512000,
    };

    applyOpenAIResponsesModelConstraints(modelConfig);

    expect(getOpenAIResponsesReasoningEfforts(modelConfig.model)).toEqual([
      "none",
      "low",
      "medium",
      "high",
      "xhigh",
    ]);
    expect(modelConfig.reasoningEffort).toBe("low");
    expect(modelConfig.max_output_tokens).toBe(128000);
  });

  test("resets an unsupported cross-model override and its derived token budget", () => {
    const defaults = parseOpenAIResponsesReasoningEffortDefaults(
      "gpt-5.1=high;gpt-5.6-luna=xhigh",
    );
    const config = {
      model: "gpt-5.1",
      providerName: "OpenAI",
      reasoningEffort: "xhigh" as const,
      max_output_tokens: 30000,
    };
    const configMeta = {
      reasoningEffort: { source: "conversation_override" as const },
      max_output_tokens: { source: "conversation_override" as const },
    };

    expect(
      applyConfiguredOpenAIResponsesReasoningEffortDefault({
        config,
        configMeta,
        defaults,
      }),
    ).toEqual({
      reasoningEffortChanged: true,
      maxOutputTokensChanged: false,
    });
    expect(config).toEqual({
      model: "gpt-5.1",
      providerName: "OpenAI",
      reasoningEffort: "high",
      max_output_tokens: 30000,
    });
    expect(configMeta).toMatchObject({
      reasoningEffort: { source: "server_default" },
      max_output_tokens: { source: "server_default" },
    });

    config.model = "gpt-5.6-luna";
    applyConfiguredOpenAIResponsesReasoningEffortDefault({
      config,
      configMeta,
      defaults,
    });
    expect(config.reasoningEffort).toBe("xhigh");
    expect(configMeta.reasoningEffort.source).toBe("server_default");
  });

  test.each([
    ["claude-4", "Anthropic"],
    ["gpt-5.6-terra", "Azure"],
  ])(
    "does not reconcile OpenAI reasoning metadata for %s@%s",
    (model, providerName) => {
      const config = {
        model,
        providerName,
        reasoningEffort: "max" as const,
        max_output_tokens: 30000,
      };
      const configMeta = {
        reasoningEffort: { source: "conversation_override" as const },
        max_output_tokens: { source: "conversation_override" as const },
      };

      expect(
        applyConfiguredOpenAIResponsesReasoningEffortDefault({
          config,
          configMeta,
          defaults: parseOpenAIResponsesReasoningEffortDefaults("*=medium"),
        }),
      ).toEqual({
        reasoningEffortChanged: false,
        maxOutputTokensChanged: false,
      });
      expect(config).toMatchObject({
        reasoningEffort: "max",
        max_output_tokens: 30000,
      });
      expect(configMeta).toMatchObject({
        reasoningEffort: { source: "conversation_override" },
        max_output_tokens: { source: "conversation_override" },
      });
    },
  );

  test("uses Responses for OpenAI and keeps Azure separate", () => {
    expect(
      shouldUseOpenAIResponses({
        model: "gpt-5.5",
        providerName: "OpenAI",
      }),
    ).toBe(true);
    expect(
      shouldUseOpenAIResponses({
        model: "gpt-5.5",
        providerName: "Azure",
      }),
    ).toBe(false);
    expect(
      shouldUseOpenAIResponses({
        model: "gpt-4o",
        providerName: "OpenAI",
      }),
    ).toBe(true);
  });

  test("enables hosted web search only for supported OpenAI models", () => {
    expect(
      supportsOpenAIResponsesWebSearch({
        model: "gpt-5.5",
        providerName: "OpenAI",
      }),
    ).toBe(true);
    expect(
      supportsOpenAIResponsesWebSearch({
        model: "gpt-5.4",
        providerName: "OpenAI",
      }),
    ).toBe(true);
    expect(
      supportsOpenAIResponsesWebSearch({
        model: "gpt-4.1",
        providerName: "OpenAI",
      }),
    ).toBe(true);
    expect(
      supportsOpenAIResponsesWebSearch({
        model: "gpt-5.5",
        providerName: "Azure",
      }),
    ).toBe(false);
    expect(
      supportsOpenAIResponsesWebSearch({
        model: "gpt-4o",
        providerName: "OpenAI",
      }),
    ).toBe(false);
  });

  test.each(OPENAI_GPT_56_MODELS)(
    "enables hosted web search for %s only on OpenAI",
    (model) => {
      expect(
        supportsOpenAIResponsesWebSearch({
          model,
          providerName: "OpenAI",
        }),
      ).toBe(true);
      expect(
        supportsOpenAIResponsesWebSearch({
          model,
          providerName: "Azure",
        }),
      ).toBe(false);
    },
  );

  test("requires web search for time-sensitive user requests", () => {
    expect(shouldRequireOpenAIResponsesWebSearch("今天有什么大新闻")).toBe(
      true,
    );
    expect(shouldRequireOpenAIResponsesWebSearch("latest OpenAI news")).toBe(
      true,
    );
    expect(shouldRequireOpenAIResponsesWebSearch("解释一下递归")).toBe(false);
  });

  test("does not force web search from pasted attachment body text", () => {
    const pastedAttachmentText = [
      "文件名: 粘贴的文本.txt",
      "类型: text/plain",
      "大小: 1.91 KB",
      "",
      "当前这段长文本只是用户粘贴的附件正文，不是实时搜索请求。",
    ].join("\n");
    const explicitSearchWithAttachment = [
      "请查一下今天新闻，并参考附件",
      "",
      "文件名: 粘贴的文本.txt",
      "类型: text/plain",
      "大小: 1.91 KB",
      "",
      "这段附件内容本身不决定是否搜索。",
    ].join("\n");

    expect(shouldRequireOpenAIResponsesWebSearch(pastedAttachmentText)).toBe(
      false,
    );
    expect(shouldEnableOpenAIResponsesWebSearch(pastedAttachmentText)).toBe(
      false,
    );
    expect(
      shouldRequireOpenAIResponsesWebSearch(explicitSearchWithAttachment),
    ).toBe(true);
    expect(
      shouldEnableOpenAIResponsesWebSearch(explicitSearchWithAttachment),
    ).toBe(true);
  });

  test("detects OpenAI GPT-5 and newer model configs for settings controls", () => {
    expect(
      isOpenAIGpt5OrNewerModelConfig({
        model: "gpt-5.5",
        providerName: "OpenAI",
      }),
    ).toBe(true);
    expect(
      isOpenAIGpt5OrNewerModelConfig({
        model: "gpt-5.5",
        providerName: "ChatGPT",
      }),
    ).toBe(true);
    expect(
      isOpenAIGpt5OrNewerModelConfig({
        model: "gpt-4.1",
        providerName: "OpenAI",
      }),
    ).toBe(false);
    expect(
      isOpenAIGpt5OrNewerModelConfig({
        model: "gpt-5.5",
        providerName: "Azure",
      }),
    ).toBe(false);
  });

  test("falls back to recommended Responses settings", () => {
    expect(parseOpenAIResponsesReasoningEffort("none")).toBe("none");
    expect(parseOpenAIResponsesReasoningEffort("xhigh")).toBe("xhigh");
    expect(parseOpenAIResponsesReasoningEffort("max")).toBe("max");
    expect(parseOpenAIResponsesReasoningEffort("max", "gpt-5.5")).toBe("low");
    expect(parseOpenAIResponsesReasoningEffort("max", "gpt-5.6-terra")).toBe(
      "max",
    );
    expect(parseOpenAIResponsesReasoningEffort("bad")).toBe("low");
    expect(parseOpenAIResponsesTextVerbosity("low")).toBe("low");
    expect(parseOpenAIResponsesTextVerbosity("bad")).toBe("medium");
    expect(parseOpenAIResponsesReasoningMode("pro")).toBe("pro");
    expect(parseOpenAIResponsesReasoningMode("bad")).toBe("standard");
    expect(parseOpenAIResponsesReasoningContext("all_turns")).toBe("all_turns");
    expect(parseOpenAIResponsesReasoningContext("bad")).toBe("auto");
    expect(parseOpenAIResponsesInputImageDetail("original")).toBe("original");
    expect(parseOpenAIResponsesInputImageDetail("bad")).toBe("high");
    expect(parseOpenAIResponsesPromptCacheMode("disabled")).toBe("disabled");
    expect(parseOpenAIResponsesPromptCacheMode("explicit")).toBe("explicit");
    expect(parseOpenAIResponsesPromptCacheMode("bad")).toBe("implicit");
    expect(parseOpenAIResponsesPromptCacheKey("  project-neatchat  ")).toBe(
      "project-neatchat",
    );
    expect(parseOpenAIResponsesPromptCacheKey("   ")).toBeUndefined();
  });

  test("maps reasoning effort to enough output budget", () => {
    expect(getMaxOutputTokensForReasoningEffort("none")).toBe(10000);
    expect(getMaxOutputTokensForReasoningEffort("low")).toBe(10000);
    expect(getMaxOutputTokensForReasoningEffort("medium")).toBe(20000);
    expect(getMaxOutputTokensForReasoningEffort("high")).toBe(30000);
    expect(getMaxOutputTokensForReasoningEffort("xhigh")).toBe(30000);
    expect(getMaxOutputTokensForReasoningEffort("max")).toBe(30000);
  });

  test("parses max_output_tokens overrides", () => {
    expect(parseOpenAIMaxOutputTokens()).toBeUndefined();
    expect(parseOpenAIMaxOutputTokens("abc")).toBeUndefined();
    expect(parseOpenAIMaxOutputTokens("20000")).toBe(20000);
    for (const model of [
      ...OPENAI_GPT_56_MODELS,
      "gpt-5",
      "gpt-5.1",
      "gpt-5.2",
      "gpt-5.4",
      "gpt-5.4-mini",
      "gpt-5.5",
      "gpt-5.5-pro",
    ]) {
      expect(parseOpenAIMaxOutputTokens("512000", model)).toBe(128000);
    }
    expect(parseOpenAIMaxOutputTokens("512000", "gpt-5-pro")).toBe(272000);
    for (const model of [
      "gpt-5-chat-latest",
      "gpt-5.1-chat-latest",
      "gpt-5.2-chat-latest",
    ]) {
      expect(parseOpenAIMaxOutputTokens("512000", model)).toBe(16384);
    }
    expect(parseOpenAIMaxOutputTokens("512000", "gpt-4.1")).toBe(32768);
    expect(parseOpenAIMaxOutputTokens("-1")).toBe(0);
  });

  test("parses compression threshold overrides", () => {
    expect(parseOpenAICompressMessageLengthThreshold()).toBeUndefined();
    expect(parseOpenAICompressMessageLengthThreshold("abc")).toBeUndefined();
    expect(parseOpenAICompressMessageLengthThreshold("1200")).toBe(1200);
    expect(parseOpenAICompressMessageLengthThreshold("10")).toBe(500);
    expect(parseOpenAICompressMessageLengthThreshold("9999")).toBe(4000);
  });

  test("uses GPT-5.6 Terra Responses defaults", () => {
    process.env.DEFAULT_MODEL = "";
    process.env.OPENAI_TEMPERATURE = "";
    process.env.OPENAI_REASONING_EFFORT = "";
    process.env.OPENAI_MAX_OUTPUT_TOKENS = "";
    process.env.OPENAI_TEXT_VERBOSITY = "";
    process.env.OPENAI_STORE_RESPONSES = "";
    process.env.OPENAI_REASONING_MODE = "";
    process.env.OPENAI_REASONING_CONTEXT = "";
    process.env.OPENAI_INPUT_IMAGE_DETAIL = "";
    process.env.OPENAI_PROMPT_CACHE_MODE = "";
    process.env.OPENAI_PROMPT_CACHE_KEY = "";

    const config = getServerSideConfig();

    expect(config.defaultModel).toBe("gpt-5.6-terra");
    expect(config.defaultTemperature).toBe(1);
    expect(config.openaiReasoningEffort).toBe("low");
    expect(config.openaiMaxOutputTokens).toBeUndefined();
    expect(config.openaiTextVerbosity).toBe("medium");
    expect(config.openaiStoreResponses).toBe(false);
    expect(config.openaiReasoningMode).toBe("standard");
    expect(config.openaiReasoningContext).toBe("auto");
    expect(config.openaiInputImageDetail).toBe("high");
    expect(config.openaiPromptCacheMode).toBe("implicit");
    expect(config.openaiPromptCacheKey).toBeUndefined();
  });

  test("publishes configured GPT-5.6 capability defaults without secrets", () => {
    process.env.CUSTOM_MODELS = "-all,gpt-5.6-terra@openai";
    process.env.DEFAULT_MODEL = "gpt-5.6-terra";
    process.env.OPENAI_REASONING_MODE = "pro";
    process.env.OPENAI_REASONING_CONTEXT = "current_turn";
    process.env.OPENAI_INPUT_IMAGE_DETAIL = "original";
    process.env.OPENAI_PROMPT_CACHE_MODE = "explicit";
    process.env.OPENAI_PROMPT_CACHE_KEY = "project-neatchat";
    process.env.WEBUI_LOCKED_FIELDS = [
      "reasoningMode",
      "reasoningContext",
      "inputImageDetail",
      "promptCacheMode",
      "promptCacheKey",
    ].join(",");

    const publicConfig = buildPublicAppConfig(
      new Date("2026-07-10T00:00:00.000Z"),
    );

    expect(publicConfig.defaults).toMatchObject({
      reasoningMode: "pro",
      reasoningContext: "current_turn",
      inputImageDetail: "original",
      promptCacheMode: "explicit",
      promptCacheKey: "project-neatchat",
    });
    expect(publicConfig.forced).toMatchObject({
      reasoningMode: "pro",
      reasoningContext: "current_turn",
      inputImageDetail: "original",
      promptCacheMode: "explicit",
      promptCacheKey: "project-neatchat",
    });
  });

  test("publishes a reasoning effort UI allowlist and keeps the default visible", () => {
    process.env.CUSTOM_MODELS = "-all,gpt-5.6-terra@openai";
    process.env.DEFAULT_MODEL = "gpt-5.6-terra";
    process.env.OPENAI_REASONING_EFFORT = "medium";
    process.env.WEBUI_ALLOWED_REASONING_EFFORTS = "max,medium,bad,max";

    const configured = buildPublicAppConfig(
      new Date("2026-07-11T00:00:00.000Z"),
    );
    const configuredHash = configured.configHash;

    expect(configured.reasoningEffortAllowlist).toEqual({
      default: ["medium", "max"],
      models: {},
    });
    expect(configured.lockedFields).not.toContain("reasoningEffort");

    process.env.WEBUI_ALLOWED_REASONING_EFFORTS = "high";
    const changed = buildPublicAppConfig(new Date("2026-07-11T00:00:00.000Z"));
    expect(changed.reasoningEffortAllowlist).toEqual({
      default: ["medium", "high"],
      models: { "gpt-5.6-terra": ["medium", "high"] },
    });
    expect(changed.configHash).not.toBe(configuredHash);

    process.env.WEBUI_ALLOWED_REASONING_EFFORTS = "";
    expect(
      buildPublicAppConfig(new Date("2026-07-11T00:00:00.000Z"))
        .reasoningEffortAllowlist,
    ).toBeUndefined();
  });

  test("publishes per-model reasoning effort defaults with scalar compatibility", () => {
    process.env.CUSTOM_MODELS =
      "-all,gpt-5.6-sol@openai,gpt-5.6-terra@openai,gpt-5.6-luna@openai";
    process.env.DEFAULT_MODEL = "gpt-5.6-terra";
    process.env.OPENAI_REASONING_EFFORT =
      "*=medium;gpt-5.6-sol=medium;gpt-5.6-terra=high;gpt-5.6-luna=xhigh";
    process.env.WEBUI_ALLOWED_REASONING_EFFORTS = "*=low;gpt-5.6-terra=low";

    const terra = buildPublicAppConfig(new Date("2026-07-12T00:00:00.000Z"));
    expect(terra.defaults.reasoningEffort).toBe("high");
    expect(terra.legacy.openaiReasoningEffort).toBe("high");
    expect(terra.reasoningEffortDefaults).toEqual({
      default: "medium",
      models: {
        "gpt-5.6-sol": "medium",
        "gpt-5.6-terra": "high",
        "gpt-5.6-luna": "xhigh",
      },
    });
    expect(terra.reasoningEffortAllowlist).toEqual({
      default: ["low", "medium"],
      models: {
        "gpt-5.6-sol": ["low", "medium"],
        "gpt-5.6-terra": ["low", "high"],
        "gpt-5.6-luna": ["low", "medium", "xhigh"],
      },
    });

    process.env.DEFAULT_MODEL = "gpt-5.6-luna";
    const luna = buildPublicAppConfig(new Date("2026-07-12T00:00:00.000Z"));
    expect(luna.defaults).toMatchObject({
      model: "gpt-5.6-luna",
      providerName: "OpenAI",
    });
    expect(luna.forced).toMatchObject({
      model: "gpt-5.6-luna",
      providerName: "OpenAI",
    });
    expect(luna.defaults.reasoningEffort).toBe("xhigh");
    expect(luna.legacy.openaiReasoningEffort).toBe("xhigh");
  });

  test("does not turn model defaults into a global reasoning allowlist", () => {
    process.env.CUSTOM_MODELS =
      "-all,gpt-5.6-sol@openai,gpt-5.6-terra@openai,gpt-5.6-luna@openai";
    process.env.DEFAULT_MODEL = "gpt-5.6-terra";
    process.env.OPENAI_REASONING_EFFORT =
      "*=medium;gpt-5.6-terra=high;gpt-5.6-luna=xhigh";
    process.env.WEBUI_ALLOWED_REASONING_EFFORTS = "gpt-5.6-terra=low,high";

    const config = buildPublicAppConfig(new Date("2026-07-12T00:00:00.000Z"));
    expect(config.reasoningEffortAllowlist).toEqual({
      models: { "gpt-5.6-terra": ["low", "high"] },
    });
    expect(
      filterOpenAIResponsesReasoningEfforts(
        "gpt-5.6-sol",
        config.reasoningEffortAllowlist,
      ),
    ).toEqual(["none", "low", "medium", "high", "xhigh", "max"]);
  });

  test("does not apply OpenAI model defaults to an Azure model ref", () => {
    process.env.CUSTOM_MODELS = "-all,gpt-5.6-terra@azure";
    process.env.DEFAULT_MODEL = "gpt-5.6-terra@Azure";
    process.env.OPENAI_REASONING_EFFORT = "*=medium;gpt-5.6-terra=high";
    process.env.WEBUI_ALLOWED_REASONING_EFFORTS = "";

    const config = buildPublicAppConfig(new Date("2026-07-12T00:00:00.000Z"));
    expect(config.defaults.providerName).toBe("Azure");
    expect(config.defaults.reasoningEffort).toBe("low");
    expect(config.legacy.openaiReasoningEffort).toBe("low");
  });

  test("changes the public config hash when a non-default model effort changes", () => {
    process.env.CUSTOM_MODELS = "-all,gpt-5.6-terra@openai,gpt-5.6-luna@openai";
    process.env.DEFAULT_MODEL = "gpt-5.6-terra";
    process.env.WEBUI_ALLOWED_REASONING_EFFORTS = "";
    process.env.OPENAI_REASONING_EFFORT =
      "*=medium;gpt-5.6-terra=high;gpt-5.6-luna=xhigh";
    const first = buildPublicAppConfig(new Date("2026-07-12T00:00:00.000Z"));

    process.env.OPENAI_REASONING_EFFORT =
      "*=medium;gpt-5.6-terra=high;gpt-5.6-luna=high";
    const second = buildPublicAppConfig(new Date("2026-07-12T00:00:00.000Z"));

    expect(first.defaults.reasoningEffort).toBe("high");
    expect(second.defaults.reasoningEffort).toBe("high");
    expect(first.configHash).not.toBe(second.configHash);
  });

  test("publishes model-specific reasoning effort UI restrictions", () => {
    process.env.CUSTOM_MODELS =
      "-all,gpt-5.6-sol@openai,gpt-5.6-terra@openai,gpt-5.6-luna@openai";
    process.env.DEFAULT_MODEL = "gpt-5.6-terra";
    process.env.OPENAI_REASONING_EFFORT = "medium";
    process.env.WEBUI_ALLOWED_REASONING_EFFORTS =
      "*=low;gpt-5.6=high,xhigh,max;gpt-5.6-terra=none,low;gpt-5.6-luna=low,medium";

    const publicConfig = buildPublicAppConfig(
      new Date("2026-07-11T00:00:00.000Z"),
    );

    expect(publicConfig.reasoningEffortAllowlist).toEqual({
      default: ["low", "medium"],
      models: {
        "gpt-5.6-sol": ["high", "xhigh", "max"],
        "gpt-5.6-terra": ["none", "low", "medium"],
        "gpt-5.6-luna": ["low", "medium"],
      },
    });
  });

  test("locks the five GPT-5.6 capability fields but not reasoning effort by default", () => {
    process.env.CUSTOM_MODELS = "-all,gpt-5.6-terra@openai";
    process.env.DEFAULT_MODEL = "gpt-5.6-terra";
    process.env.OPENAI_REASONING_MODE = "pro";
    process.env.OPENAI_REASONING_CONTEXT = "current_turn";
    process.env.OPENAI_INPUT_IMAGE_DETAIL = "original";
    process.env.OPENAI_PROMPT_CACHE_MODE = "explicit";
    process.env.OPENAI_PROMPT_CACHE_KEY = "project-neatchat";
    process.env.WEBUI_LOCKED_FIELDS = "";

    const capabilityFields = [
      "reasoningMode",
      "reasoningContext",
      "inputImageDetail",
      "promptCacheMode",
      "promptCacheKey",
    ];
    const publicConfig = buildPublicAppConfig(
      new Date("2026-07-10T00:00:00.000Z"),
    );

    expect(resolveLockedFields({ webuiLockedFields: "" })).toEqual(
      expect.arrayContaining(capabilityFields),
    );
    expect(publicConfig.lockedFields).toEqual(
      expect.arrayContaining(capabilityFields),
    );
    expect(publicConfig.lockedFields).not.toContain("reasoningEffort");
    expect(publicConfig.forced).toMatchObject({
      reasoningMode: "pro",
      reasoningContext: "current_turn",
      inputImageDetail: "original",
      promptCacheMode: "explicit",
      promptCacheKey: "project-neatchat",
    });
  });

  test("publishes a disabled GPT-5.6 Prompt Cache default", () => {
    process.env.CUSTOM_MODELS = "-all,gpt-5.6-terra@openai";
    process.env.DEFAULT_MODEL = "gpt-5.6-terra";
    process.env.OPENAI_PROMPT_CACHE_MODE = "disabled";
    process.env.OPENAI_PROMPT_CACHE_KEY = "";

    const serverConfig = getServerSideConfig();
    const publicConfig = buildPublicAppConfig(
      new Date("2026-07-10T00:00:00.000Z"),
    );

    expect(serverConfig.openaiPromptCacheMode).toBe("disabled");
    expect(publicConfig.defaults.promptCacheMode).toBe("disabled");
    expect(publicConfig.defaults.promptCacheKey).toBe("");
  });

  test("enables stored OpenAI Responses only when explicitly configured", () => {
    process.env.OPENAI_STORE_RESPONSES = "";
    expect(getServerSideConfig().openaiStoreResponses).toBe(false);

    process.env.OPENAI_STORE_RESPONSES = "1";
    expect(getServerSideConfig().openaiStoreResponses).toBe(true);

    process.env.OPENAI_STORE_RESPONSES = "false";
    expect(getServerSideConfig().openaiStoreResponses).toBe(false);
  });

  test("supports hide balance and hide user api key env flags", () => {
    process.env.HIDE_BALANCE_QUERY = "1";
    process.env.HIDE_USER_API_KEY = "1";

    const config = getServerSideConfig();

    expect(config.hideBalanceQuery).toBe(true);
    expect(config.hideUserApiKey).toBe(true);
  });

  test("enables MCP when Jimeng token is configured", () => {
    delete process.env.ENABLE_MCP;
    process.env.JIMENG_MCP_TOKEN = "test-jimeng-token";

    expect(getServerSideConfig().enableMcp).toBe(true);

    process.env.ENABLE_MCP = "false";
    expect(getServerSideConfig().enableMcp).toBe(false);
  });

  test("keeps ENABLE_BALANCE_QUERY compatibility", () => {
    delete process.env.HIDE_BALANCE_QUERY;
    process.env.ENABLE_BALANCE_QUERY = "1";

    expect(getServerSideConfig().hideBalanceQuery).toBe(false);
  });

  test("derives allowed models from CUSTOM_MODELS", () => {
    expect(
      deriveAllowedModels({
        customModels: "-all,gpt-5.5@openai",
      }),
    ).toEqual(["gpt-5.5@OpenAI"]);

    const allowedModels = deriveAllowedModels({
      customModels: "-all,gpt-5.4@openai,gpt-image-2@openai",
    });
    expect(allowedModels).toHaveLength(2);
    expect(allowedModels).toEqual(
      expect.arrayContaining(["gpt-5.4@OpenAI", "gpt-image-2@OpenAI"]),
    );

    expect(
      deriveAllowedModels({
        customModels:
          "-all,gpt-5.6@openai,gpt-5.6-sol@openai,gpt-5.6-terra@openai,gpt-5.6-luna@openai,gpt-image-2@openai",
      }),
    ).toEqual([
      "gpt-5.6@OpenAI",
      "gpt-5.6-sol@OpenAI",
      "gpt-5.6-terra@OpenAI",
      "gpt-5.6-luna@OpenAI",
      "gpt-image-2@OpenAI",
    ]);
  });

  test("builds public config without secrets and no-store headers", async () => {
    process.env.CUSTOM_MODELS = "-all,gpt-5.5@openai";
    process.env.DEFAULT_MODEL = "gpt-5.5";
    process.env.OPENAI_API_KEY = "test-api-key-value";
    process.env.CODE = "test-access-code";
    process.env.HIDE_USER_API_KEY = "1";
    process.env.HIDE_BALANCE_QUERY = "1";
    process.env.OPENAI_TEMPERATURE = "1";
    process.env.OPENAI_MAX_OUTPUT_TOKENS = "30000";
    process.env.OPENAI_REASONING_EFFORT = "low";
    process.env.OPENAI_TEXT_VERBOSITY = "low";
    process.env.OPENAI_COMPRESS_MESSAGE_LENGTH_THRESHOLD = "1200";
    process.env.OPENAI_STORE_RESPONSES = "1";

    const publicConfig = buildPublicAppConfig(
      new Date("2026-04-28T00:00:00.000Z"),
    );

    expect(publicConfig.configHash).toBeTruthy();
    expect(publicConfig.configVersion).toBeTruthy();
    expect(publicConfig.allowedModels).toEqual(["gpt-5.5@OpenAI"]);
    expect(publicConfig.lockedFields).not.toContain("model");
    expect(publicConfig.lockedFields).not.toContain("providerName");
    expect(publicConfig.lockedFields).toContain("max_output_tokens");
    expect(publicConfig.lockedFields).not.toContain("reasoningEffort");
    expect(publicConfig.serverFlags.hideUserApiKey).toBe(true);
    expect(publicConfig.serverFlags.hideBalanceQuery).toBe(true);
    expect(publicConfig.defaults.store).toBe(true);
    expect(JSON.stringify(publicConfig)).not.toContain("test-api-key-value");
    expect(JSON.stringify(publicConfig)).not.toContain("test-access-code");

    const headers = publicConfigHeaders();
    expect(headers["Cache-Control"]).toContain("no-store");
    expect(headers.Pragma).toBe("no-cache");
    expect(headers.Expires).toBe("0");
  });

  test("reclamps max_output_tokens after the allowlist falls back to Terra", () => {
    process.env.CUSTOM_MODELS = "-all,gpt-5.6-terra@openai";
    process.env.DEFAULT_MODEL = "gpt-5.4";
    process.env.OPENAI_MAX_OUTPUT_TOKENS = "512000";

    const publicConfig = buildPublicAppConfig(
      new Date("2026-07-10T00:00:00.000Z"),
    );

    expect(publicConfig.defaults.model).toBe("gpt-5.6-terra");
    expect(publicConfig.defaults.max_output_tokens).toBe(128000);
    expect(publicConfig.forced.max_output_tokens).toBe(128000);
    expect(publicConfig.legacy.openaiMaxOutputTokens).toBe(128000);
  });

  test("uses Vercel deployment id before git commit for public config identity", async () => {
    process.env.VERCEL_DEPLOYMENT_ID = "dpl_new";
    process.env.VERCEL_URL = "new-deployment.vercel.app";
    process.env.VERCEL_GIT_COMMIT_SHA = "same-commit-sha";

    const publicConfig = buildPublicAppConfig(
      new Date("2026-04-28T00:00:00.000Z"),
    );

    expect(publicConfig.deploymentId).toBe("dpl_new");
  });

  test("parses update announcement json for public config", async () => {
    process.env.WEBUI_ANNOUNCEMENT_JSON = JSON.stringify({
      date: "2026.05.20",
      sections: [
        {
          title: "新增",
          items: ["增加更新内容弹框", "支持按构建 ID 去重"],
        },
        {
          title: "优化",
          items: ["公告配置改为单一 JSON"],
        },
      ],
      note: "仅展示给当前构建未确认过的用户。",
    });

    const publicConfig = buildPublicAppConfig(
      new Date("2026-05-20T00:00:00.000Z"),
    );

    expect(publicConfig.updateAnnouncement).toMatchObject({
      date: "2026.05.20",
      hash: expect.any(String),
      sections: [
        {
          title: "新增",
          items: ["增加更新内容弹框", "支持按构建 ID 去重"],
        },
        {
          title: "优化",
          items: ["公告配置改为单一 JSON"],
        },
      ],
      note: "仅展示给当前构建未确认过的用户。",
    });
    expect(publicConfig.configHash).toBeTruthy();
  });

  test("does not include update announcement content in config hash", async () => {
    process.env.WEBUI_ANNOUNCEMENT_JSON = JSON.stringify({
      date: "2026.05.20",
      sections: [{ title: "新增", items: ["第一版公告"] }],
    });
    const firstConfig = buildPublicAppConfig(
      new Date("2026-05-20T00:00:00.000Z"),
    );

    process.env.WEBUI_ANNOUNCEMENT_JSON = JSON.stringify({
      date: "2026.05.20",
      sections: [{ title: "新增", items: ["第二版公告"] }],
    });
    const secondConfig = buildPublicAppConfig(
      new Date("2026-05-20T00:00:00.000Z"),
    );

    expect(firstConfig.configHash).toBe(secondConfig.configHash);
    expect(firstConfig.updateAnnouncement?.hash).not.toBe(
      secondConfig.updateAnnouncement?.hash,
    );
  });

  test("ignores invalid or empty update announcement json", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    try {
      expect(parseUpdateAnnouncementJson("{bad-json")).toBeUndefined();
      expect(
        parseUpdateAnnouncementJson(
          JSON.stringify({
            date: "2026.05.20",
            sections: [{ title: "新增", items: [] }],
          }),
        ),
      ).toBeUndefined();
      expect(
        parseUpdateAnnouncementJson(
          JSON.stringify({
            enabled: false,
            items: ["不会展示"],
          }),
        ),
      ).toBeUndefined();
    } finally {
      warnSpy.mockRestore();
    }
  });

  test("forces provider together with server default model", () => {
    expect(
      resolveServerModelConfig({
        defaultModel: "gpt-5.5",
      }),
    ).toMatchObject({
      model: "gpt-5.5",
      providerName: "OpenAI",
    });
    expect(
      resolveServerModelConfig({
        defaultModel: "gemini-2.0-flash-exp",
      }),
    ).toMatchObject({
      model: "gemini-2.0-flash-exp",
      providerName: "Google",
    });
    expect(
      resolveServerModelConfig({
        defaultModel: "custom-model@Moonshot",
      }),
    ).toMatchObject({
      model: "custom-model",
      providerName: "Moonshot",
    });
    expect(
      resolveServerModelConfig({
        defaultModel: "gpt-5.5",
        openaiReasoningEffort: "high",
      }),
    ).toMatchObject({
      model: "gpt-5.5",
      providerName: "OpenAI",
      reasoningEffort: "high",
      max_output_tokens: 30000,
    });
    expect(
      resolveServerModelConfig({
        defaultModel: "gpt-5.5",
        openaiReasoningEffort: "medium",
        openaiMaxOutputTokens: 12000,
      }),
    ).toMatchObject({
      model: "gpt-5.5",
      providerName: "OpenAI",
      reasoningEffort: "medium",
      max_output_tokens: 12000,
    });

    expect(
      resolveServerModelConfig({
        defaultModel: "gpt-5.2-chat-latest",
        openaiReasoningEffort: "high",
      }),
    ).toEqual({
      model: "gpt-5.2-chat-latest",
      providerName: "OpenAI",
    });
  });

  test.each([
    ["o3", 100000],
    ["o3-mini-2025-01-31", 100000],
    ["o3-pro-2025-06-10", 100000],
    ["o4-mini", 100000],
    ["o1", 100000],
    ["o1-pro-2025-03-19", 100000],
    ["o1-mini", 65536],
    ["o1-preview-2024-09-12", 32768],
  ])("uses the documented output limit for %s", (model, expected) => {
    expect(getOpenAIResponsesMaxOutputTokensLimit(model)).toBe(expected);
  });

  test("keeps unknown o-series compatible while disabling stream for known pro models", () => {
    expect(getOpenAIResponsesMaxOutputTokensLimit("o9-custom")).toBe(512000);
    expect(getOpenAIResponsesMaxOutputTokensLimit("o3-custom")).toBe(512000);
    expect(supportsOpenAIResponsesStreaming("o1-pro")).toBe(false);
    expect(supportsOpenAIResponsesStreaming("o3-pro-2025-06-10")).toBe(false);
    expect(supportsOpenAIResponsesStreaming("o3")).toBe(true);
    expect(supportsOpenAIResponsesStreaming("o9-custom")).toBe(true);
    expect(supportsOpenAIResponsesStreaming("o3-pro-custom")).toBe(true);
  });

  test.each(["none", "xhigh", "max"] as const)(
    "preserves GPT-5.6 reasoning effort %s in server model defaults",
    (reasoningEffort) => {
      expect(
        resolveServerModelConfig({
          defaultModel: "gpt-5.6-terra",
          openaiReasoningEffort: reasoningEffort,
        }),
      ).toMatchObject({
        model: "gpt-5.6-terra",
        providerName: "OpenAI",
        reasoningEffort,
      });
    },
  );

  test("keeps GPT-5.5 on the legacy reasoning effort set", () => {
    expect(
      resolveServerModelConfig({
        defaultModel: "gpt-5.5",
        openaiReasoningEffort: "max",
      }),
    ).toMatchObject({
      model: "gpt-5.5",
      providerName: "OpenAI",
      reasoningEffort: "low",
    });
  });
});
