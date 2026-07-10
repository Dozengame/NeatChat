import { buildOpenAIModelTestRequest } from "../app/utils/openai-model-test";

describe("buildOpenAIModelTestRequest", () => {
  test("normalizes a Terra max effort when testing GPT-5.5", () => {
    expect(
      buildOpenAIModelTestRequest("gpt-5.5", {
        openaiMaxOutputTokens: 128000,
        openaiReasoningEffort: "max",
        openaiTextVerbosity: "medium",
      }),
    ).toMatchObject({
      model: "gpt-5.5",
      max_output_tokens: 128000,
      reasoning: { effort: "low" },
    });
  });

  test("clamps a legacy 512K limit when testing GPT-5.6 Terra", () => {
    expect(
      buildOpenAIModelTestRequest("gpt-5.6-terra", {
        openaiMaxOutputTokens: 512000,
        openaiReasoningEffort: "high",
        openaiTextVerbosity: "high",
      }),
    ).toEqual({
      model: "gpt-5.6-terra",
      input: "Hello!",
      max_output_tokens: 128000,
      reasoning: { effort: "high" },
      text: { verbosity: "high" },
      stream: false,
    });
  });

  test("uses the probe-sized fallback when no server limit is configured", () => {
    expect(
      buildOpenAIModelTestRequest("gpt-5.6-luna", {
        openaiReasoningEffort: "none",
        openaiTextVerbosity: "low",
      }).max_output_tokens,
    ).toBe(16);
  });
});
