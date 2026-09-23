import { buildOpenAIResponsesPayload } from "../app/client/platforms/openai-responses-builder";
import {
  enforceLockedOpenAIResponsesPolicy,
  type OpenAIResponsesAdminPolicy,
} from "../app/api/openai-responses-policy";
import { sanitizeOpenAIResponsesSafetyIdentifier } from "../app/api/openai-safety";
import { ServiceProvider } from "../app/constant";
import { DEFAULT_CONFIG } from "../app/store/config";
import {
  applyOpenAIResponsesPromptCachePolicy,
  getOpenAIResponsesMaxOutputTokensLimit,
  getOpenAIResponsesReasoningEfforts,
  getConfiguredOpenAIResponsesReasoningEffort,
  isGpt56Model,
  isGpt6Model,
  isOpenAIGpt5OrNewerModelConfig,
  isOpenAIResponsesAdvancedModelConfig,
  normalizeOpenAIResponsesReasoningEffort,
  OPENAI_RESPONSES_DEFAULT_MODEL,
  supportsOpenAIResponsesFunctionTools,
  supportsOpenAIResponsesSampling,
  supportsOpenAIResponsesWebSearch,
} from "../app/utils/openai-responses";

const models = ["gpt-6-astra", "gpt-6-sol", "gpt-6-luna"];
const policy: OpenAIResponsesAdminPolicy = {
  lockedFields: [],
  temperature: 0.8,
  textVerbosity: "medium",
  reasoningMode: "standard",
  reasoningContext: "auto",
  inputImageDetail: "high",
  promptCacheMode: "explicit",
};
const config = (model: string, overrides: Record<string, unknown> = {}) => ({
  ...DEFAULT_CONFIG.modelConfig,
  model: model as any,
  providerName: ServiceProvider.OpenAI,
  ...overrides,
});
const user = (text: string) => ({
  role: "user",
  content: [{ type: "input_text", text }],
});
const breakpoints = (input: unknown) =>
  JSON.stringify(input).match(/prompt_cache_breakpoint/g)?.length ?? 0;

describe("GPT-6 Responses compatibility", () => {
  test("uses Luna as the default without assuming unknown model capabilities", () => {
    expect(OPENAI_RESPONSES_DEFAULT_MODEL).toBe("gpt-6-luna");
    for (const model of ["gpt-6", "gpt-6-preview", "gpt-6-luna-custom"]) {
      expect(isGpt6Model(model)).toBe(false);
      expect(supportsOpenAIResponsesFunctionTools({ model })).toBe(false);
    }
  });

  test.each(models)(
    "recognizes %s and snapshots with provider boundaries",
    (model) => {
      for (const name of [
        model,
        `${model}-2026-09-23`,
        ` ${model.toUpperCase()}@OpenAI `,
      ]) {
        expect(isGpt6Model(name)).toBe(true);
        expect(isGpt56Model(name)).toBe(false);
        expect(getOpenAIResponsesMaxOutputTokensLimit(name)).toBe(128000);
        expect(
          isOpenAIGpt5OrNewerModelConfig({
            model: name,
            providerName: "OpenAI",
          }),
        ).toBe(true);
        expect(
          isOpenAIResponsesAdvancedModelConfig({
            model: name,
            providerName: "ChatGPT",
          }),
        ).toBe(true);
        expect(
          supportsOpenAIResponsesFunctionTools({
            model: name,
            providerName: "OpenAI",
          }),
        ).toBe(true);
        expect(
          supportsOpenAIResponsesWebSearch({
            model: name,
            providerName: "OpenAI",
          }),
        ).toBe(true);
        expect(
          isOpenAIResponsesAdvancedModelConfig({
            model: name,
            providerName: "Azure",
          }),
        ).toBe(false);
      }
    },
  );

  test("normalizes model-scoped legacy efforts and applies family defaults to snapshots", () => {
    const defaults = {
      default: "high" as const,
      models: {
        "gpt-6-astra": "none" as const,
        "gpt-6-luna": "minimal" as const,
      },
    };
    expect(
      getConfiguredOpenAIResponsesReasoningEffort("gpt-6-astra", defaults),
    ).toBe("low");
    expect(
      getConfiguredOpenAIResponsesReasoningEffort(
        "gpt-6-luna-2026-09-23",
        defaults,
      ),
    ).toBe("low");
  });

  test.each(models)(
    "normalizes supported reasoning and sampling for %s",
    (model) => {
      const expected = ["low", "medium", "high", "xhigh", "max"];
      expect(getOpenAIResponsesReasoningEfforts(model)).toEqual(
        model === "gpt-6-astra" ? expected : ["none", ...expected],
      );
      expect(normalizeOpenAIResponsesReasoningEffort("minimal", model)).toBe(
        "low",
      );
      expect(normalizeOpenAIResponsesReasoningEffort("none", model)).toBe(
        model === "gpt-6-astra" ? "low" : "none",
      );
      for (const effort of [undefined, "minimal", ...expected]) {
        expect(supportsOpenAIResponsesSampling(model, effort)).toBe(false);
      }
      expect(supportsOpenAIResponsesSampling(model, "none")).toBe(
        model !== "gpt-6-astra",
      );
    },
  );

  test.each(models)("builds the full advanced payload for %s", (model) => {
    const result = buildOpenAIResponsesPayload({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,AA" },
            },
          ],
        },
      ],
      modelConfig: config(model, {
        reasoningEffort: "max",
        reasoningMode: "pro",
        reasoningContext: "all_turns",
        inputImageDetail: "original",
        max_output_tokens: 999999,
        temperature: 0.6,
        top_p: 0.7,
        promptCacheMode: "explicit",
        promptCacheKey: "project",
      }),
      store: false,
      stream: true,
      reasoningSummary: "auto",
      functionTools: [
        {
          type: "function",
          name: "lookup",
          parameters: { type: "object", properties: {} },
        },
      ],
    });
    expect(result.reasoning).toEqual({
      effort: "max",
      mode: "pro",
      context: "all_turns",
      summary: "auto",
    });
    expect(result.include).toEqual(["reasoning.encrypted_content"]);
    expect(result.max_output_tokens).toBe(128000);
    expect(result.temperature).toBeUndefined();
    expect(result.top_p).toBeUndefined();
    expect(result.stream).toBe(true);
    expect(result.text?.verbosity).toBe("medium");
    expect((result.input as any)[0].content[0]).toMatchObject({
      detail: "original",
      prompt_cache_breakpoint: { mode: "explicit" },
    });
    expect(result.prompt_cache_key).toBe("project");
    expect(result.tools?.[0]).toMatchObject({
      type: "function",
      name: "lookup",
    });
  });

  test.each(["gpt-6-sol", "gpt-6-luna"])(
    "preserves sampling only with none for %s",
    (model) => {
      const result = buildOpenAIResponsesPayload({
        messages: [{ role: "user", content: "hello" }],
        modelConfig: config(model, {
          reasoningEffort: "none",
          temperature: 0.7,
          top_p: 0.6,
        }),
      });
      expect(result.reasoning?.effort).toBe("none");
      expect(result.temperature).toBe(0.7);
      expect(result.top_p).toBe(0.6);
    },
  );

  test.each(models)(
    "enforces incompatible parameters server-side for %s even when unlocked",
    (model) => {
      const body = {
        model,
        reasoning: { effort: "minimal", summary: "auto" },
        temperature: 2,
        top_p: 0.9,
        logprobs: true,
        top_logprobs: 5,
        include: [
          "message.output_text.logprobs",
          "reasoning.encrypted_content",
        ],
        max_output_tokens: 500000,
      };
      const original = JSON.stringify(body);
      const result = enforceLockedOpenAIResponsesPolicy(body, policy);
      expect(result.reasoning).toEqual({ effort: "low", summary: "auto" });
      for (const field of ["temperature", "top_p", "logprobs", "top_logprobs"])
        expect(result[field]).toBeUndefined();
      expect(result.include).toEqual(["reasoning.encrypted_content"]);
      expect(result.max_output_tokens).toBe(128000);
      expect(JSON.stringify(body)).toBe(original);
    },
  );

  test("normalizes Astra none before locked policy can reintroduce sampling", () => {
    const result = enforceLockedOpenAIResponsesPolicy(
      {
        model: "gpt-6-astra",
        reasoning: { effort: "none" },
        temperature: 1,
        include: ["message.output_text.logprobs"],
      },
      { ...policy, lockedFields: ["temperature", "reasoningMode"] },
    );
    expect(result.reasoning).toEqual({ effort: "low", mode: "standard" });
    expect(result.temperature).toBeUndefined();
    expect(result.include).toBeUndefined();
  });

  test.each(["gpt-6-sol", "gpt-6-luna"])(
    "keeps legal none sampling and logprobs for %s",
    (model) => {
      const body = {
        model,
        reasoning: { effort: "none" },
        temperature: 0.7,
        top_p: 0.6,
        logprobs: true,
        top_logprobs: 3,
        include: ["message.output_text.logprobs"],
      };
      expect(enforceLockedOpenAIResponsesPolicy(body, policy)).toEqual(body);
      expect(
        enforceLockedOpenAIResponsesPolicy(body, {
          ...policy,
          lockedFields: ["temperature"],
        }).temperature,
      ).toBe(0.8);
    },
  );

  test("shares immutable two-turn cache boundaries between client and server", () => {
    const body = {
      model: "gpt-6-luna",
      input: [
        user("first"),
        user("second"),
        {
          role: "assistant",
          content: [
            {
              type: "output_text",
              text: "answer",
              prompt_cache_breakpoint: { mode: "explicit" },
            },
          ],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "third" },
            { type: "input_image", image_url: "data:image/png;base64,AA" },
          ],
        },
      ],
      prompt_cache_key: "keep-key",
    };
    const original = JSON.stringify(body);
    const result = applyOpenAIResponsesPromptCachePolicy(body, {
      mode: "explicit",
      key: body.prompt_cache_key,
    }) as any;
    expect(breakpoints(result.input)).toBe(2);
    expect(breakpoints(result.input[0])).toBe(0);
    expect(breakpoints(result.input[1])).toBe(1);
    expect(breakpoints(result.input[2])).toBe(0);
    expect(result.input[3].content[1].prompt_cache_breakpoint).toEqual({
      mode: "explicit",
    });
    const server = enforceLockedOpenAIResponsesPolicy(body, {
      ...policy,
      lockedFields: ["promptCacheMode"],
    });
    expect(server.input).toEqual(result.input);
    expect(server.prompt_cache_options).toEqual(result.prompt_cache_options);
    expect(server.prompt_cache_key).toBe("keep-key");
    expect(JSON.stringify(body)).toBe(original);
  });

  test("removes disabled cache keys and boundaries; handles stored and stateless continuations", () => {
    const payload = applyOpenAIResponsesPromptCachePolicy(
      { input: [user("hello")], prompt_cache_key: "key" },
      { mode: "explicit", key: "key" },
    );
    const disabled = applyOpenAIResponsesPromptCachePolicy(payload, {
      mode: "disabled",
      key: "key",
    }) as any;
    expect(disabled.prompt_cache_options).toEqual({
      mode: "explicit",
      ttl: "30m",
    });
    expect(disabled.prompt_cache_key).toBeUndefined();
    expect(breakpoints(disabled.input)).toBe(0);
    expect(breakpoints(payload.input)).toBe(1);
    expect(
      (
        applyOpenAIResponsesPromptCachePolicy(
          {
            input: [
              { type: "function_call_output", call_id: "call", output: "ok" },
            ],
            previous_response_id: "resp_1",
          },
          { mode: "explicit" },
        ) as any
      ).prompt_cache_options.mode,
    ).toBe("explicit");
    expect(
      (
        applyOpenAIResponsesPromptCachePolicy(
          { input: [] },
          { mode: "explicit" },
        ) as any
      ).prompt_cache_options.mode,
    ).toBe("implicit");
  });

  test.each([true, false])(
    "does not replay incompatible history with store=%s",
    (store) => {
      const result = buildOpenAIResponsesPayload({
        messages: [
          {
            role: "assistant",
            model: "gpt-5.6-luna",
            content: "visible old answer",
            openaiResponseId: "resp_old",
            openaiResponseStored: true,
            openaiResponsesOutput: [
              { type: "reasoning", encrypted_content: "old-secret" },
              {
                type: "function_call",
                call_id: "call_old",
                name: "old",
                arguments: "{}",
              },
            ],
          },
          { role: "user", content: "continue" },
        ],
        modelConfig: config("gpt-6-luna"),
        store,
      });
      expect(result.previous_response_id).toBeUndefined();
      expect(JSON.stringify(result.input)).not.toContain("old-secret");
      expect(JSON.stringify(result.input)).not.toContain("call_old");
      expect(JSON.stringify(result.input)).toContain("visible old answer");
    },
  );

  test("reuses compatible dated snapshots while blocking an older stored chain after a model switch", () => {
    const old = {
      role: "assistant" as const,
      model: "gpt-6-luna-2026-09-23",
      content: "answer",
      openaiResponseId: "resp_ok",
      openaiResponseStored: true,
      openaiResponsesOutput: [
        { type: "reasoning", encrypted_content: "same-family" },
      ],
    };
    const result = buildOpenAIResponsesPayload({
      messages: [old, { role: "user", content: "continue" }],
      modelConfig: config("gpt-6-luna"),
      store: true,
    });
    expect(result.previous_response_id).toBe("resp_ok");
    const switched = buildOpenAIResponsesPayload({
      messages: [
        old,
        { role: "assistant", model: "gpt-6-sol", content: "changed model" },
        { role: "user", content: "continue" },
      ],
      modelConfig: config("gpt-6-luna"),
      store: true,
    });
    expect(switched.previous_response_id).toBeUndefined();
  });

  test.each([true, false])(
    "preserves paired cross-model tool results only as historical text with store=%s",
    (store) => {
      const previous = {
        role: "assistant" as const,
        model: "gpt-5.6-luna",
        content: "visible prior answer",
        openaiResponseId: "resp_old",
        openaiResponseStored: true,
        openaiResponsesOutput: [
          { type: "reasoning", encrypted_content: "do-not-replay" },
          {
            type: "function_call",
            call_id: "completed",
            name: "save_note",
            arguments: '{"token":"private-argument"}',
          },
          {
            type: "function_call_output",
            call_id: "completed",
            output: '{"record_id":"record_42","status":"saved"}',
          },
          {
            type: "function_call",
            call_id: "unknown",
            name: "update_note",
            arguments: "{}",
          },
          {
            type: "function_call_output",
            call_id: "unknown",
            output: '{"error":{"type":"tool_outcome_unknown"}}',
          },
          {
            type: "function_call",
            call_id: "unpaired-call",
            name: "never_completed",
            arguments: "{}",
          },
          {
            type: "function_call_output",
            call_id: "unpaired-output",
            output: "orphan-output",
          },
        ],
      };
      const snapshot = JSON.stringify(previous);
      const result = buildOpenAIResponsesPayload({
        messages: [previous, { role: "user", content: "continue" }],
        modelConfig: config("gpt-6-luna"),
        store,
      });
      expect(result.previous_response_id).toBeUndefined();
      const input = result.input as any[];
      expect(input[0].role).toBe("assistant");
      expect(input[0].content).toHaveLength(1);
      expect(input[0].content[0].type).toBe("output_text");
      const text = input[0].content[0].text;
      for (const expected of [
        "visible prior answer",
        "来自前模型 gpt-5.6-luna",
        "save_note",
        "record_42",
        "tool_outcome_unknown",
        "不要重复执行",
      ])
        expect(text).toContain(expected);
      for (const omitted of [
        "do-not-replay",
        "private-argument",
        "never_completed",
        "orphan-output",
      ])
        expect(text).not.toContain(omitted);
      expect(
        input.every(
          (item) =>
            item.type !== "function_call" &&
            item.type !== "function_call_output" &&
            item.type !== "reasoning",
        ),
      ).toBe(true);
      expect(JSON.stringify(previous)).toBe(snapshot);
    },
  );

  test("does not summarize ambiguous duplicate calls or orphan tool results", () => {
    const result = buildOpenAIResponsesPayload({
      messages: [
        {
          role: "assistant",
          model: "gpt-6-sol",
          content: "visible",
          openaiResponsesOutput: [
            {
              type: "function_call",
              call_id: "duplicate",
              name: "first_tool",
              arguments: "{}",
            },
            {
              type: "function_call",
              call_id: "duplicate",
              name: "second_tool",
              arguments: "{}",
            },
            {
              type: "function_call_output",
              call_id: "duplicate",
              output: "ambiguous-output",
            },
            {
              type: "function_call_output",
              call_id: "orphan",
              output: "orphan-output",
            },
          ],
        },
      ],
      modelConfig: config("gpt-6-luna"),
      store: false,
    });
    expect(result.input).toEqual([
      {
        role: "assistant",
        content: [{ type: "output_text", text: "visible" }],
      },
    ]);
  });

  test("keeps same-family paired tools in the Responses protocol rather than summarizing them", () => {
    const trace = [
      { type: "reasoning", encrypted_content: "same-family" },
      {
        type: "function_call",
        call_id: "call",
        name: "save_note",
        arguments: "{}",
      },
      { type: "function_call_output", call_id: "call", output: "saved" },
    ];
    const result = buildOpenAIResponsesPayload({
      messages: [
        {
          role: "assistant",
          model: "gpt-6-luna",
          content: "visible",
          openaiResponsesOutput: trace,
        },
      ],
      modelConfig: config("gpt-6-luna"),
      store: false,
    });
    expect(result.input).toEqual(trace);
  });

  test.each(models)(
    "injects only a verified safety identifier for %s",
    (model) => {
      expect(
        sanitizeOpenAIResponsesSafetyIdentifier(
          { model, safety_identifier: "untrusted" },
          "verified-device",
        ),
      ).toEqual({ model, safety_identifier: "verified-device" });
      expect(
        sanitizeOpenAIResponsesSafetyIdentifier({
          model,
          safety_identifier: "untrusted",
        }),
      ).toEqual({ model });
    },
  );
});
