import {
  getServerSideConfig,
  parseDefaultTemperature,
} from "../app/config/server";
import {
  getMaxOutputTokensForReasoningEffort,
  isOpenAIGpt5OrNewerModelConfig,
  isGpt5OrNewerModel,
  parseOpenAICompressMessageLengthThreshold,
  parseOpenAIMaxOutputTokens,
  parseOpenAIResponsesReasoningEffort,
  parseOpenAIResponsesTextVerbosity,
  shouldEnableOpenAIResponsesWebSearch,
  shouldRequireOpenAIResponsesWebSearch,
  shouldUseOpenAIResponses,
  supportsOpenAIResponsesWebSearch,
} from "../app/utils/openai-responses";
import {
  buildPublicAppConfig,
  publicConfigHeaders,
} from "../app/config/public";
import { deriveAllowedModels } from "../app/utils/public-app-config";
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

    expect(
      shouldRequireOpenAIResponsesWebSearch(pastedAttachmentText),
    ).toBe(false);
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
    expect(parseOpenAIResponsesReasoningEffort("xhigh")).toBe("xhigh");
    expect(parseOpenAIResponsesReasoningEffort("bad")).toBe("low");
    expect(parseOpenAIResponsesTextVerbosity("low")).toBe("low");
    expect(parseOpenAIResponsesTextVerbosity("bad")).toBe("medium");
  });

  test("maps reasoning effort to enough output budget", () => {
    expect(getMaxOutputTokensForReasoningEffort("low")).toBe(10000);
    expect(getMaxOutputTokensForReasoningEffort("medium")).toBe(20000);
    expect(getMaxOutputTokensForReasoningEffort("high")).toBe(30000);
  });

  test("parses max_output_tokens overrides", () => {
    expect(parseOpenAIMaxOutputTokens()).toBeUndefined();
    expect(parseOpenAIMaxOutputTokens("abc")).toBeUndefined();
    expect(parseOpenAIMaxOutputTokens("20000")).toBe(20000);
    expect(parseOpenAIMaxOutputTokens("-1")).toBe(0);
  });

  test("parses compression threshold overrides", () => {
    expect(parseOpenAICompressMessageLengthThreshold()).toBeUndefined();
    expect(parseOpenAICompressMessageLengthThreshold("abc")).toBeUndefined();
    expect(parseOpenAICompressMessageLengthThreshold("1200")).toBe(1200);
    expect(parseOpenAICompressMessageLengthThreshold("10")).toBe(500);
    expect(parseOpenAICompressMessageLengthThreshold("9999")).toBe(4000);
  });

  test("uses GPT-5.5 Responses defaults", () => {
    process.env.DEFAULT_MODEL = "";
    process.env.OPENAI_TEMPERATURE = "";
    process.env.OPENAI_REASONING_EFFORT = "";
    process.env.OPENAI_MAX_OUTPUT_TOKENS = "";
    process.env.OPENAI_TEXT_VERBOSITY = "";
    process.env.OPENAI_STORE_RESPONSES = "";

    const config = getServerSideConfig();

    expect(config.defaultModel).toBe("gpt-5.5");
    expect(config.defaultTemperature).toBe(1);
    expect(config.openaiReasoningEffort).toBe("low");
    expect(config.openaiMaxOutputTokens).toBeUndefined();
    expect(config.openaiTextVerbosity).toBe("medium");
    expect(config.openaiStoreResponses).toBe(false);
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
  });
});
