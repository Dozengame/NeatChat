import {
  buildOpenAIModelTestRequest,
  getOpenAIModelTestResult,
} from "../app/utils/openai-model-test";

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

  test("omits an explicitly unspecified output budget", () => {
    expect(
      buildOpenAIModelTestRequest("gpt-6.1-sol", {
        openaiMaxOutputTokens: 0,
      }).max_output_tokens,
    ).toBeUndefined();
  });

  test.each([
    ["gpt-6.1-sol", "high"],
    ["gpt-6.1-sol-2026-10-01", "high"],
    ["gpt-6.1-terra", "none"],
  ])(
    "uses %s model-level effort instead of the default model's scalar",
    (model, effort) => {
      expect(
        buildOpenAIModelTestRequest(model, {
          openaiReasoningEffort: "max",
          openaiReasoningEffortDefaults: {
            default: "medium",
            models: { "gpt-6.1-sol": "high", "gpt-6.1-terra": "none" },
          },
          openaiMaxOutputTokens: 512000,
        }),
      ).toMatchObject({
        reasoning: { effort },
        max_output_tokens: 128000,
      });
    },
  );

  test("uses the wildcard effort before the default model's scalar", () => {
    expect(
      buildOpenAIModelTestRequest("gpt-6.1-sol", {
        openaiReasoningEffort: "max",
        openaiReasoningEffortDefaults: { default: "medium", models: {} },
      }).reasoning?.effort,
    ).toBe("medium");
  });

  test("preserves scalar configuration when no model map is available", () => {
    expect(
      buildOpenAIModelTestRequest("gpt-6.1-sol", {
        openaiReasoningEffort: "high",
      }).reasoning?.effort,
    ).toBe("high");
  });

  test("omits unverified capabilities for an unknown GPT-5-compatible model", () => {
    expect(
      buildOpenAIModelTestRequest("gpt-5.6-custom-local", {
        openaiMaxOutputTokens: 512000,
        openaiReasoningEffort: "max",
        openaiTextVerbosity: "high",
      }),
    ).toEqual({
      model: "gpt-5.6-custom-local",
      input: "Hello!",
      max_output_tokens: 512000,
      stream: false,
    });
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

describe("getOpenAIModelTestResult", () => {
  const response = {
    ok: true,
    status: 200,
    headers: new Headers(),
  };
  const evaluate = (payload: unknown, isJson = true) =>
    getOpenAIModelTestResult({ response, payload, isJson, responseTime: 150 });
  const output = [
    { type: "message", content: [{ type: "output_text", text: "Hello" }] },
  ];

  test("requires completed status and visible output", () => {
    expect(evaluate({ status: "completed", output })).toMatchObject({
      success: true,
      message: "文本生成通过，响应时间: 0.15s",
      responseTime: 150,
      timeout: false,
    });
    expect(
      evaluate({ status: "completed", output_text: "Hello" }).success,
    ).toBe(true);
  });

  test.each([
    [
      {
        status: "incomplete",
        output,
        incomplete_details: { reason: "max_output_tokens" },
      },
      "incomplete",
      "接口已响应，生成未完成（达到输出 token 上限）",
    ],
    [
      {
        status: "incomplete",
        incomplete_details: { reason: "content_filter" },
      },
      "incomplete",
      "接口已响应，生成未完成（内容过滤）",
    ],
    [
      {
        status: "incomplete",
        incomplete_details: { reason: "Bearer reason-secret" },
      },
      "incomplete",
      "接口已响应，生成未完成",
    ],
    [
      { status: "completed", output: [] },
      "empty_output",
      "接口已响应，但未生成可见文本",
    ],
    [
      { status: "completed", output_text: "  " },
      "empty_output",
      "接口已响应，但未生成可见文本",
    ],
    [
      { status: "completed", output: [{ type: "function_call" }] },
      "empty_output",
      "接口已响应，但未生成可见文本",
    ],
    [{ output }, "incomplete_response", "接口已响应，但未返回完成的生成结果"],
    [null, "invalid_response", "接口已响应，但未返回有效 JSON 生成结果"],
  ])("does not treat %j as generation success", (payload, type, message) => {
    expect(evaluate(payload)).toMatchObject({
      success: false,
      error: { type },
      message,
      timeout: false,
    });
  });

  test("rejects invalid JSON without returning raw body contents", () => {
    expect(evaluate(undefined, false)).toMatchObject({
      success: false,
      error: { type: "invalid_response" },
    });
  });

  test.each(["failed", "completed"])(
    "sanitizes errors even when status is %s",
    (status) => {
      const result = evaluate({
        status,
        output,
        error: { message: "Bearer upstream-secret", request_id: "req_test" },
        debug: { apiKey: "sk-debug-secret" },
      });
      expect(result).toMatchObject({
        success: false,
        message: "文本生成失败 [request_id: req_test]",
        error: { type: "upstream_error" },
      });
      expect(JSON.stringify(result)).not.toMatch(/secret|Bearer|debug/);
    },
  );
});
