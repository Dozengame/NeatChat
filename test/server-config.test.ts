import {
  getServerSideConfig,
  parseDefaultTemperature,
} from "../app/config/server";
import {
  getMaxOutputTokensForReasoningEffort,
  isOpenAIGpt5OrNewerModelConfig,
  isGpt5OrNewerModel,
  parseOpenAIMaxOutputTokens,
  parseOpenAIResponsesReasoningEffort,
  parseOpenAIResponsesTextVerbosity,
  shouldUseOpenAIResponses,
} from "../app/utils/openai-responses";
import { resolveServerModelConfig } from "../app/utils/server-model-defaults";

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

  test("uses GPT-5.5 Responses defaults", () => {
    process.env.DEFAULT_MODEL = "";
    process.env.OPENAI_TEMPERATURE = "";
    process.env.OPENAI_REASONING_EFFORT = "";
    process.env.OPENAI_MAX_OUTPUT_TOKENS = "";
    process.env.OPENAI_TEXT_VERBOSITY = "";

    const config = getServerSideConfig();

    expect(config.defaultModel).toBe("gpt-5.5");
    expect(config.defaultTemperature).toBe(1);
    expect(config.openaiReasoningEffort).toBe("low");
    expect(config.openaiMaxOutputTokens).toBeUndefined();
    expect(config.openaiTextVerbosity).toBe("medium");
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
