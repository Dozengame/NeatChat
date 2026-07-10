import {
  collectModelTable,
  getModelProvider,
  isModelAvailableInServer,
} from "../app/utils/model";
import {
  DEFAULT_MODELS,
  KnowledgeCutOffDate,
  OPENAI_GPT_56_MODELS,
  ServiceProvider,
} from "../app/constant";

describe("getModelProvider", () => {
  test("should return model and provider when input contains '@'", () => {
    const input = "model@provider";
    const [model, provider] = getModelProvider(input);
    expect(model).toBe("model");
    expect(provider).toBe("provider");
  });

  test("should return model and undefined provider when input does not contain '@'", () => {
    const input = "model";
    const [model, provider] = getModelProvider(input);
    expect(model).toBe("model");
    expect(provider).toBeUndefined();
  });

  test("should handle multiple '@' characters correctly", () => {
    const input = "model@provider@extra";
    const [model, provider] = getModelProvider(input);
    expect(model).toBe("model@provider");
    expect(provider).toBe("extra");
  });

  test("should return empty strings when input is empty", () => {
    const input = "";
    const [model, provider] = getModelProvider(input);
    expect(model).toBe("");
    expect(provider).toBeUndefined();
  });
});

describe("custom model availability", () => {
  test.each(OPENAI_GPT_56_MODELS)(
    "registers %s for OpenAI without exposing it through Azure",
    (model) => {
      const matchingModels = DEFAULT_MODELS.filter(
        (item) => item.name === model,
      );

      expect(matchingModels).toHaveLength(1);
      expect(matchingModels[0]?.provider?.providerName).toBe(
        ServiceProvider.OpenAI,
      );
      expect(KnowledgeCutOffDate[model]).toBe("2026-02-16");
    },
  );

  test.each(OPENAI_GPT_56_MODELS)(
    "allows explicit OpenAI access to %s and keeps Azure disabled",
    (model) => {
      const customModels = `-all,${model}@openai`;

      expect(
        isModelAvailableInServer(customModels, model, ServiceProvider.OpenAI),
      ).toBe(false);
      expect(
        isModelAvailableInServer(customModels, model, ServiceProvider.Azure),
      ).toBe(true);
    },
  );

  test("matches provider names case-insensitively", () => {
    const table = collectModelTable(DEFAULT_MODELS, "-all,gpt-5.5@openai");
    const openAIModel = table["gpt-5.5@openai"];

    expect(openAIModel?.available).toBe(true);
  });

  test("does not block a lowercase CUSTOM_MODELS OpenAI provider", () => {
    expect(
      isModelAvailableInServer(
        "-all,gpt-5.5@openai",
        "gpt-5.5",
        ServiceProvider.OpenAI,
      ),
    ).toBe(false);
  });

  test("normalizes known provider names for new custom models", () => {
    const table = collectModelTable(DEFAULT_MODELS, "-all,gpt-image-2@openai");

    expect(table["gpt-image-2@openai"]?.provider?.providerName).toBe(
      ServiceProvider.OpenAI,
    );
  });

  test("keeps Azure disabled when only OpenAI is allowed", () => {
    expect(
      isModelAvailableInServer(
        "-all,gpt-5.5@openai",
        "gpt-5.5",
        ServiceProvider.Azure,
      ),
    ).toBe(true);
  });
});
