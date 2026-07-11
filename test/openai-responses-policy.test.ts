import { enforceLockedOpenAIResponsesPolicy } from "../app/api/openai-responses-policy";

const GPT56_LOCKED_FIELDS = [
  "temperature",
  "textVerbosity",
  "max_output_tokens",
  "reasoningMode",
  "reasoningContext",
  "inputImageDetail",
  "promptCacheMode",
  "promptCacheKey",
];

function policy(
  overrides: Partial<
    Parameters<typeof enforceLockedOpenAIResponsesPolicy>[1]
  > = {},
) {
  return {
    lockedFields: GPT56_LOCKED_FIELDS,
    temperature: 0.4,
    textVerbosity: "low" as const,
    maxOutputTokens: 30_000,
    reasoningMode: "pro" as const,
    reasoningContext: "current_turn" as const,
    inputImageDetail: "original" as const,
    promptCacheMode: "implicit" as const,
    promptCacheKey: "admin-cache-key",
    ...overrides,
  };
}

describe("OpenAI Responses administrator policy", () => {
  test("enforces all locked GPT-5.6 fields without mutating the input", () => {
    const body = {
      model: "gpt-5.6-terra",
      reasoning: {
        effort: "high",
        summary: "auto",
        mode: "standard",
        context: "all_turns",
      },
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "hello",
              prompt_cache_breakpoint: { mode: "explicit" },
            },
            {
              type: "input_image",
              image_url: "data:image/png;base64,AA",
              detail: "low",
              prompt_cache_breakpoint: { mode: "explicit" },
            },
          ],
        },
      ],
      prompt_cache_options: { mode: "explicit", ttl: "1h" },
      prompt_cache_key: "attacker-key",
      temperature: 2,
      text: {
        verbosity: "high",
        format: { type: "text" },
      },
      max_output_tokens: 128_000,
    };
    const snapshot = JSON.stringify(body);

    const result = enforceLockedOpenAIResponsesPolicy(body, policy());

    expect(result.reasoning).toEqual({
      effort: "high",
      summary: "auto",
      mode: "pro",
      context: "current_turn",
    });
    expect((result.input as any)[0].content[1].detail).toBe("original");
    expect(JSON.stringify(result.input)).not.toContain(
      "prompt_cache_breakpoint",
    );
    expect(result.prompt_cache_options).toEqual({
      mode: "implicit",
      ttl: "30m",
    });
    expect(result.prompt_cache_key).toBe("admin-cache-key");
    expect(result.temperature).toBeUndefined();
    expect(result.text).toEqual({
      verbosity: "low",
      format: { type: "text" },
    });
    expect(result.max_output_tokens).toBe(30_000);
    expect(JSON.stringify(body)).toBe(snapshot);
  });

  test("leaves unlocked sampling, verbosity, and output fields unchanged", () => {
    const body = {
      model: "gpt-5.6-terra",
      temperature: 1.7,
      text: { verbosity: "high", format: { type: "text" } },
      max_output_tokens: 120_000,
    };

    expect(
      enforceLockedOpenAIResponsesPolicy(
        body,
        policy({ lockedFields: ["reasoningMode"] }),
      ),
    ).toEqual({
      ...body,
      reasoning: { mode: "pro" },
    });
  });

  test("leaves older models and unlocked fields unchanged", () => {
    const olderBody = {
      model: "gpt-5.5",
      reasoning: { mode: "standard", context: "all_turns" },
      prompt_cache_key: "client-key",
    };
    expect(enforceLockedOpenAIResponsesPolicy(olderBody, policy())).toEqual(
      olderBody,
    );

    const unlockedBody = {
      model: "gpt-5.6-terra",
      reasoning: { mode: "standard", context: "all_turns" },
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: "https://example.com/image.png",
              detail: "low",
            },
          ],
        },
      ],
      prompt_cache_options: { mode: "explicit", ttl: "1h" },
      prompt_cache_key: "client-key",
    };
    expect(
      enforceLockedOpenAIResponsesPolicy(
        unlockedBody,
        policy({ lockedFields: ["reasoningMode"] }),
      ),
    ).toEqual({
      ...unlockedBody,
      reasoning: { mode: "pro", context: "all_turns" },
    });
  });

  test("maps disabled cache mode to explicit-without-breakpoint and drops the key", () => {
    const result = enforceLockedOpenAIResponsesPolicy(
      {
        model: "gpt-5.6-terra",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "hello",
                prompt_cache_breakpoint: { mode: "explicit" },
              },
            ],
          },
          {
            type: "function_call_output",
            call_id: "call_1",
            output: "ok",
            prompt_cache_breakpoint: { mode: "explicit" },
          },
        ],
        prompt_cache_options: { mode: "implicit", ttl: "1h" },
        prompt_cache_key: "attacker-key",
      },
      policy({
        lockedFields: ["promptCacheMode"],
        promptCacheMode: "disabled",
      }),
    );

    expect(result.prompt_cache_options).toEqual({
      mode: "explicit",
      ttl: "30m",
    });
    expect(result.prompt_cache_key).toBeUndefined();
    expect(JSON.stringify(result.input)).not.toContain(
      "prompt_cache_breakpoint",
    );
  });

  test("normalizes explicit mode to the latest user content breakpoint", () => {
    const result = enforceLockedOpenAIResponsesPolicy(
      {
        model: "gpt-5.6-sol",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "old",
                prompt_cache_breakpoint: { mode: "explicit" },
              },
            ],
          },
          { type: "function_call_output", call_id: "call_1", output: "ok" },
          {
            role: "user",
            content: [
              { type: "input_text", text: "latest" },
              {
                type: "input_image",
                image_url: "https://example.com/latest.png",
              },
            ],
          },
        ],
        prompt_cache_options: { mode: "implicit", ttl: "1h" },
      },
      policy({
        lockedFields: ["promptCacheMode", "promptCacheKey"],
        promptCacheMode: "explicit",
      }),
    );

    expect(result.prompt_cache_options).toEqual({
      mode: "explicit",
      ttl: "30m",
    });
    const input = result.input as any[];
    expect(input[0].content[0].prompt_cache_breakpoint).toBeUndefined();
    expect(input[2].content[0].prompt_cache_breakpoint).toBeUndefined();
    expect(input[2].content[1].prompt_cache_breakpoint).toEqual({
      mode: "explicit",
    });
    expect(result.prompt_cache_key).toBe("admin-cache-key");
  });

  test("keeps explicit mode for stored continuations and falls back otherwise", () => {
    const stored = enforceLockedOpenAIResponsesPolicy(
      {
        model: "gpt-5.6-terra",
        previous_response_id: "resp_1",
        input: [
          { type: "function_call_output", call_id: "call_1", output: "ok" },
        ],
      },
      policy({
        lockedFields: ["promptCacheMode"],
        promptCacheMode: "explicit",
      }),
    );
    expect(stored.prompt_cache_options).toEqual({
      mode: "explicit",
      ttl: "30m",
    });
    expect(JSON.stringify(stored.input)).not.toContain(
      "prompt_cache_breakpoint",
    );

    const stateless = enforceLockedOpenAIResponsesPolicy(
      {
        model: "gpt-5.6-terra",
        input: [
          { type: "function_call_output", call_id: "call_1", output: "ok" },
        ],
      },
      policy({
        lockedFields: ["promptCacheMode"],
        promptCacheMode: "explicit",
      }),
    );
    expect(stateless.prompt_cache_options).toEqual({
      mode: "implicit",
      ttl: "30m",
    });
  });

  test("enforces an independently locked cache key, including an empty key", () => {
    const body = {
      model: "gpt-5.6-terra",
      input: "hello",
      prompt_cache_options: { mode: "implicit", ttl: "1h" },
      prompt_cache_key: "attacker-key",
    };
    expect(
      enforceLockedOpenAIResponsesPolicy(
        body,
        policy({ lockedFields: ["promptCacheKey"] }),
      ).prompt_cache_key,
    ).toBe("admin-cache-key");
    expect(
      enforceLockedOpenAIResponsesPolicy(
        body,
        policy({ lockedFields: ["promptCacheKey"], promptCacheKey: undefined }),
      ).prompt_cache_key,
    ).toBeUndefined();
  });
});
