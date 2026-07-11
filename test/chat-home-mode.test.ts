import { LLMModel } from "../app/client/types";
import { ServiceProvider } from "../app/constant";
import {
  getChatHomeModeForModel,
  getChatHomeModeModels,
  resolvePreferredChatHomeModel,
} from "../app/components/chat-home-mode";

const model = (
  name: string,
  providerName: string,
  available = true,
): LLMModel => ({
  name,
  displayName: name,
  available,
  sorted: 1,
  provider: {
    id: providerName.toLowerCase(),
    providerName,
    providerType: providerName.toLowerCase(),
    sorted: 1,
  },
});

describe("new chat home modes", () => {
  const models = [
    model("gpt-5.6-luna", ServiceProvider.OpenAI),
    model("gpt-5.6-terra", ServiceProvider.OpenAI),
    model("gpt-image-3-preview", ServiceProvider.OpenAI),
    model("gpt-image-2", ServiceProvider.OpenAI),
    model("gpt-image-2", ServiceProvider.Azure),
    model("gpt-image-disabled", ServiceProvider.OpenAI, false),
    model("claude-4", ServiceProvider.Anthropic),
  ];

  test("projects the visible mode from the real model and provider", () => {
    expect(getChatHomeModeForModel("gpt-image-2", ServiceProvider.OpenAI)).toBe(
      "image",
    );
    expect(getChatHomeModeForModel("gpt-image-2", "openai")).toBe("image");
    expect(getChatHomeModeForModel("gpt-image-2", ServiceProvider.Azure)).toBe(
      "chat",
    );
    expect(
      getChatHomeModeForModel("gpt-5.6-terra", ServiceProvider.OpenAI),
    ).toBe("chat");
  });

  test("keeps each mode inside its available OpenAI model family", () => {
    expect(
      getChatHomeModeModels(models, "chat").map((item) => item.name),
    ).toEqual(["gpt-5.6-luna", "gpt-5.6-terra"]);
    expect(
      getChatHomeModeModels(models, "image").map((item) => item.name),
    ).toEqual(["gpt-image-3-preview", "gpt-image-2"]);
  });

  test("prefers the product defaults and falls back only within the family", () => {
    expect(resolvePreferredChatHomeModel("chat", models)?.name).toBe(
      "gpt-5.6-terra",
    );
    expect(resolvePreferredChatHomeModel("image", models)?.name).toBe(
      "gpt-image-2",
    );
    expect(
      resolvePreferredChatHomeModel("image", [
        model("gpt-image-3-preview", ServiceProvider.OpenAI),
      ])?.name,
    ).toBe("gpt-image-3-preview");
    expect(
      resolvePreferredChatHomeModel("image", [
        model("gpt-image-2", ServiceProvider.Azure),
      ]),
    ).toBeUndefined();
  });
});
