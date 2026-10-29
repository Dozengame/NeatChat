import {
  DEFAULT_MODELS,
  KnowledgeCutOffDate,
  ServiceProvider,
} from "../app/constant";
import { DEFAULT_CONFIG } from "../app/store/config";
import {
  isVisionModel,
  canSwitchToModelWithImageAttachments,
} from "../app/utils";
import {
  OPENAI_GPT_61_MODELS,
  applyConfiguredOpenAIResponsesReasoningEffortDefault,
  applyOpenAIResponsesModelConstraints,
  canReuseOpenAIResponsesHistory,
  getConfiguredOpenAIResponsesReasoningEffort,
  getOpenAIResponsesMaxOutputTokensLimit,
  getOpenAIResponsesReasoningContexts,
  getOpenAIResponsesReasoningEfforts,
  isGpt6Model,
  normalizeOpenAIResponsesReasoningEffort,
  supportsOpenAIResponsesAdvancedFeatures,
  supportsOpenAIResponsesFunctionTools,
  supportsOpenAIResponsesSampling,
  supportsOpenAIResponsesWebSearch,
} from "../app/utils/openai-responses";
import { buildOpenAIResponsesPayload } from "../app/client/platforms/openai-responses-builder";
import {
  enforceLockedOpenAIResponsesPolicy,
  OpenAIResponsesAdminPolicy,
} from "../app/api/openai-responses-policy";
import { sanitizeOpenAIResponsesSafetyIdentifier } from "../app/api/openai-safety";
import { getOpenAIAllTurnsHistoryTokenBudget } from "../app/utils/openai-history";

const policy: OpenAIResponsesAdminPolicy = {
  lockedFields: [],
  temperature: 0.4,
  textVerbosity: "low",
  reasoningMode: "standard",
  reasoningContext: "auto",
  inputImageDetail: "high",
  promptCacheMode: "explicit",
};

describe.each(OPENAI_GPT_61_MODELS)("%s compatibility", (model) => {
  const sol = model === "gpt-6.1-sol";
  const build = (overrides: Record<string, unknown> = {}) =>
    buildOpenAIResponsesPayload({
      messages: [{ role: "user", content: "hello" }],
      modelConfig: { ...DEFAULT_CONFIG.modelConfig, model, ...overrides },
      store: false,
      stream: true,
      textFormat: { type: "json_object" },
      enableWebSearch: true,
    });

  test("registers exact models, snapshots, metadata and provider boundaries", () => {
    expect(DEFAULT_CONFIG.modelConfig.model).toBe("gpt-6-luna");
    expect(DEFAULT_CONFIG.modelConfig.reasoningEffort).toBe("low");
    expect(
      DEFAULT_MODELS.filter((entry) => entry.name === model).map(
        (entry) => entry.provider.providerName,
      ),
    ).toEqual([ServiceProvider.OpenAI]);
    expect(KnowledgeCutOffDate[model]).toBe(sol ? "2026-04-30" : "2026-06-01");
    for (const name of [
      model,
      `${model}-2026-10-29`,
      ` ${model.toUpperCase()}@OpenAI `,
    ]) {
      expect(isGpt6Model(name)).toBe(true);
      expect(isVisionModel(name)).toBe(true);
      expect(canSwitchToModelWithImageAttachments(name, 1)).toBe(true);
      expect(getOpenAIResponsesMaxOutputTokensLimit(name)).toBe(128000);
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
        supportsOpenAIResponsesFunctionTools({
          model: name,
          providerName: "Azure",
        }),
      ).toBe(false);
    }
    expect(supportsOpenAIResponsesAdvancedFeatures(`${model}-custom`)).toBe(
      false,
    );
    expect(getOpenAIResponsesReasoningEfforts(model)).toEqual([
      ...(sol ? [] : ["none"]),
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
    ]);
    expect(normalizeOpenAIResponsesReasoningEffort("none", model)).toBe(
      sol ? "low" : "none",
    );
    expect(normalizeOpenAIResponsesReasoningEffort("minimal", model)).toBe(
      "low",
    );
    expect(
      getConfiguredOpenAIResponsesReasoningEffort(`${model}-2026-10-29`, {
        default: "low",
        models: { [model]: "xhigh" },
      }),
    ).toBe("xhigh");
  });

  test.each(["none", "minimal", "low", "medium", "high", "xhigh", "max"])(
    "normalizes %s before deciding sampling on both sides",
    (effort) => {
      const payload = build({
        reasoningEffort: effort,
        temperature: 0.6,
        top_p: 0.8,
        max_output_tokens: 512000,
      });
      const sampling = !sol && effort === "none";
      expect(supportsOpenAIResponsesSampling(model, effort)).toBe(sampling);
      expect(payload.max_output_tokens).toBe(128000);
      expect(payload.reasoning?.effort).toBe(
        normalizeOpenAIResponsesReasoningEffort(effort, model),
      );
      expect(payload.temperature).toBe(sampling ? 0.6 : undefined);
      expect(payload.top_p).toBe(sampling ? 0.8 : undefined);
      expect(payload.text?.format).toEqual({ type: "json_object" });
      expect(payload.tools).toContainEqual({ type: "web_search" });
      expect(payload.include).toContain("reasoning.encrypted_content");
      const outbound = enforceLockedOpenAIResponsesPolicy(
        {
          ...payload,
          reasoning: { effort },
          temperature: 0.6,
          top_p: 0.8,
          logprobs: true,
          top_logprobs: 3,
          include: [
            "reasoning.encrypted_content",
            "message.output_text.logprobs",
          ],
        },
        policy,
      );
      expect(outbound.temperature).toBe(sampling ? 0.6 : undefined);
      expect(outbound.top_p).toBe(sampling ? 0.8 : undefined);
      expect(outbound.logprobs).toBe(sampling ? true : undefined);
      expect(outbound.include).toEqual(
        sampling
          ? ["reasoning.encrypted_content", "message.output_text.logprobs"]
          : ["reasoning.encrypted_content"],
      );
    },
  );

  test.each([false, true])(
    "omits zero budget after policy lock=%s",
    (locked) => {
      const lockedFields = locked ? ["max_output_tokens"] : [];
      expect(build({ max_output_tokens: 0 }).max_output_tokens).toBeUndefined();
      expect(
        enforceLockedOpenAIResponsesPolicy(
          { model, max_output_tokens: 0 },
          {
            ...policy,
            lockedFields,
            maxOutputTokens: 0,
          },
        ).max_output_tokens,
      ).toBeUndefined();
      expect(
        enforceLockedOpenAIResponsesPolicy(
          { model, max_output_tokens: 512000 },
          {
            ...policy,
            lockedFields,
            maxOutputTokens: 512000,
          },
        ).max_output_tokens,
      ).toBe(128000);
    },
  );

  test("applies image detail, safe identifiers and immutable cache policies", () => {
    const messages = [
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: "read image" },
          {
            type: "image_url" as const,
            image_url: { url: "https://example.test/image.png" },
          },
        ],
      },
    ];
    const before = JSON.stringify(messages);
    const payload = buildOpenAIResponsesPayload({
      messages,
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model,
        promptCacheMode: "explicit",
        promptCacheKey: "test-scope",
      },
      store: false,
    });
    expect(JSON.stringify(payload.input)).toContain('"detail":"high"');
    expect(payload.prompt_cache_options).toEqual({
      mode: "explicit",
      ttl: "30m",
    });
    expect(payload.prompt_cache_key).toBe("test-scope");
    expect(JSON.stringify(messages)).toBe(before);
    expect(
      sanitizeOpenAIResponsesSafetyIdentifier(
        { model, safety_identifier: "forged" },
        "verified",
      ).safety_identifier,
    ).toBe("verified");
    expect(
      sanitizeOpenAIResponsesSafetyIdentifier({
        model,
        safety_identifier: "forged",
      }).safety_identifier,
    ).toBeUndefined();
    const disabled = build({
      promptCacheMode: "disabled",
      promptCacheKey: "remove",
    });
    expect(disabled.prompt_cache_options).toEqual({
      mode: "explicit",
      ttl: "30m",
    });
    expect(disabled.prompt_cache_key).toBeUndefined();
    expect(JSON.stringify(disabled.input)).not.toContain(
      "prompt_cache_breakpoint",
    );
  });

  test("keeps context policy separate from advanced capabilities", () => {
    expect(getOpenAIResponsesReasoningContexts(model)).toEqual(
      sol ? ["auto", "current_turn", "all_turns"] : ["auto"],
    );
    expect(build().reasoning?.context).toBe(sol ? "auto" : undefined);
    for (const context of ["current_turn", "all_turns"]) {
      const config = {
        model,
        providerName: ServiceProvider.OpenAI,
        reasoningContext: context as "all_turns",
      };
      applyOpenAIResponsesModelConstraints(config);
      expect(config.reasoningContext).toBe(context);
      if (sol) {
        expect(build({ reasoningContext: context }).reasoning?.context).toBe(
          context,
        );
      } else {
        expect(() => build({ reasoningContext: context })).toThrow(
          /not been verified/,
        );
        expect(() =>
          enforceLockedOpenAIResponsesPolicy(
            { model, reasoning: { context } },
            policy,
          ),
        ).toThrow(/not been verified/);
      }
    }
    expect(
      (
        enforceLockedOpenAIResponsesPolicy(
          { model },
          {
            ...policy,
            lockedFields: ["reasoningContext"],
          },
        ).reasoning as any
      ).context,
    ).toBe(sol ? "auto" : undefined);
  });

  test("caps history input independently from the output reserve", () => {
    for (const maxOutputTokens of [0, 1000, 128000]) {
      expect(
        getOpenAIAllTurnsHistoryTokenBudget({
          model,
          maxOutputTokens,
          fixedMessages: [],
        }),
      ).toBe(858000);
    }
  });

  test("does not reuse response IDs or encrypted reasoning across models", () => {
    expect(canReuseOpenAIResponsesHistory(`${model}-2026-10-29`, model)).toBe(
      true,
    );
    for (const previousModel of [
      "gpt-6-luna",
      sol ? "gpt-6.1-terra" : "gpt-6.1-sol",
    ]) {
      const payload = buildOpenAIResponsesPayload({
        messages: [
          {
            role: "assistant",
            model: previousModel,
            content: "visible history",
            openaiResponseId: "old",
            openaiResponseStored: true,
            openaiResponsesOutput: [
              { type: "reasoning", encrypted_content: "private-old-reasoning" },
            ],
          },
        ],
        modelConfig: { ...DEFAULT_CONFIG.modelConfig, model },
        store: true,
      });
      expect(payload.previous_response_id).toBeUndefined();
      expect(JSON.stringify(payload)).not.toContain("private-old-reasoning");
      expect(JSON.stringify(payload)).toContain("visible history");
    }
  });
});

test.each(["gpt-6.1", "gpt-6.1-luna", "gpt-6.1-astra", "gpt-6.1-sol-custom"])(
  "does not infer %s capabilities",
  (model) => {
    expect(isGpt6Model(model)).toBe(false);
  },
);

describe.each([
  ["gpt-6.1-sol", "none"],
  ["gpt-6.1-sol", "minimal"],
  ["gpt-6.1-terra", "minimal"],
] as const)("%s legacy %s override", (model, reasoningEffort) => {
  test.each(["user_override", "conversation_override"] as const)(
    "migrates to low while preserving %s budgets and provenance across reloads",
    (source) => {
      for (const max_output_tokens of [0, 10000, 64000]) {
        const config = {
          model,
          providerName: ServiceProvider.OpenAI,
          reasoningEffort: reasoningEffort as "none" | "minimal" | "low",
          max_output_tokens,
        };
        const configMeta = {
          reasoningEffort: { source },
          max_output_tokens: { source },
        };
        for (let load = 0; load < 3; load++) {
          applyConfiguredOpenAIResponsesReasoningEffortDefault({
            config,
            configMeta,
            defaults: { default: "medium", models: { [model]: "medium" } },
          });
          expect(config).toMatchObject({
            reasoningEffort: "low",
            max_output_tokens,
          });
          expect(configMeta).toEqual({
            reasoningEffort: { source },
            max_output_tokens: { source },
          });
        }
      }
    },
  );
});
