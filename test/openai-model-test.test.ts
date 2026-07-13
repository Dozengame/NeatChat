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

  test.each([
    ["gpt-4o", 16384],
    ["gpt-4o-mini", 16384],
    ["gpt-4.1", 32768],
    ["gpt-4.1-mini-2025-04-14", 32768],
  ])("clamps %s to its documented output limit", (model, limit) => {
    expect(
      buildOpenAIModelTestRequest(model, {
        openaiMaxOutputTokens: 128000,
        openaiReasoningEffort: "high",
        openaiTextVerbosity: "high",
      }),
    ).toEqual({
      model,
      input: "Hello!",
      max_output_tokens: limit,
      stream: false,
    });
  });

  test("keeps reasoning for supported o-series probes without verbosity", () => {
    expect(
      buildOpenAIModelTestRequest("o3", {
        openaiMaxOutputTokens: 10000,
        openaiReasoningEffort: "high",
        openaiTextVerbosity: "high",
      }),
    ).toEqual({
      model: "o3",
      input: "Hello!",
      max_output_tokens: 10000,
      reasoning: { effort: "high" },
      stream: false,
    });
  });

  test.each([
    "gpt-5-chat-latest",
    "gpt-5.1-chat-latest",
    "gpt-5.2-chat-latest",
  ])(
    "omits reasoning-only fields for the non-reasoning Chat model %s",
    (model) => {
      expect(
        buildOpenAIModelTestRequest(model, {
          openaiMaxOutputTokens: 128000,
          openaiReasoningEffort: "high",
          openaiTextVerbosity: "high",
        }),
      ).toEqual({
        model,
        input: "Hello!",
        max_output_tokens: 16384,
        stream: false,
      });
    },
  );

  test.each(["gpt-custom-local", "gpt-6-preview"])(
    "does not invent capability fields or narrow output for unknown model %s",
    (model) => {
      expect(
        buildOpenAIModelTestRequest(model, {
          openaiMaxOutputTokens: 128000,
          openaiReasoningEffort: "high",
          openaiTextVerbosity: "high",
        }),
      ).toEqual({
        model,
        input: "Hello!",
        max_output_tokens: 128000,
        stream: false,
      });
    },
  );
});
