import {
  getServerSideConfig,
  parseDefaultTemperature,
} from "../app/config/server";
import {
  isGpt5OrNewerModel,
  parseOpenAIResponsesMode,
  parseOpenAIResponsesReasoningEffort,
  parseOpenAIResponsesTextVerbosity,
  shouldUseOpenAIResponses,
} from "../app/utils/openai-responses";

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

  test("parses Responses mode flags", () => {
    expect(parseOpenAIResponsesMode("1")).toBe(true);
    expect(parseOpenAIResponsesMode("true")).toBe(true);
    expect(parseOpenAIResponsesMode("0")).toBe(false);
    expect(parseOpenAIResponsesMode("")).toBe(false);
  });

  test("detects GPT-5 and newer model names", () => {
    expect(isGpt5OrNewerModel("gpt-5")).toBe(true);
    expect(isGpt5OrNewerModel("gpt-5.5")).toBe(true);
    expect(isGpt5OrNewerModel("gpt-6")).toBe(true);
    expect(isGpt5OrNewerModel("gpt-4o")).toBe(false);
    expect(isGpt5OrNewerModel("o1-preview")).toBe(false);
  });

  test("uses Responses only for enabled OpenAI GPT-5+ models", () => {
    expect(
      shouldUseOpenAIResponses({
        enabled: true,
        model: "gpt-5.5",
        providerName: "OpenAI",
      }),
    ).toBe(true);
    expect(
      shouldUseOpenAIResponses({
        enabled: true,
        model: "gpt-5.5",
        providerName: "Azure",
      }),
    ).toBe(false);
    expect(
      shouldUseOpenAIResponses({
        enabled: false,
        model: "gpt-5.5",
        providerName: "OpenAI",
      }),
    ).toBe(false);
  });

  test("falls back to recommended Responses settings", () => {
    expect(parseOpenAIResponsesReasoningEffort("xhigh")).toBe("xhigh");
    expect(parseOpenAIResponsesReasoningEffort("bad")).toBe("medium");
    expect(parseOpenAIResponsesTextVerbosity("low")).toBe("low");
    expect(parseOpenAIResponsesTextVerbosity("bad")).toBe("medium");
  });

  test("uses GPT-5.5 defaults when Responses mode is enabled", () => {
    process.env.OPENAI_RESPONSES_MODE = "1";
    process.env.DEFAULT_MODEL = "";
    process.env.OPENAI_TEMPERATURE = "";
    process.env.OPENAI_REASONING_EFFORT = "";
    process.env.OPENAI_TEXT_VERBOSITY = "";

    const config = getServerSideConfig();

    expect(config.openaiResponsesMode).toBe(true);
    expect(config.defaultModel).toBe("gpt-5.5");
    expect(config.defaultTemperature).toBe(1);
    expect(config.openaiReasoningEffort).toBe("medium");
    expect(config.openaiTextVerbosity).toBe("medium");
  });
});
