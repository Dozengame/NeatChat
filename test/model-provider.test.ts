import {
  collectModelTable,
  getModelProvider,
  isModelAvailableInServer,
} from "../app/utils/model";
import { DEFAULT_MODELS, ServiceProvider } from "../app/constant";

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
  test("matches provider names case-insensitively", () => {
    const table = collectModelTable(
      DEFAULT_MODELS,
      "-all,gpt-5.5@openai",
    );
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
