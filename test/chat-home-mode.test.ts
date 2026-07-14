import { LLMModel } from "../app/client/types";
import { ServiceProvider } from "../app/constant";
import {
  getComposerModelMenuSection,
  getChatHomeModeForModel,
  getChatHomeModeModels,
  getImageComposerSummary,
  isChatHomeModeDisabled,
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
    model("dall-e-3", ServiceProvider.OpenAI),
    model("dall-e-3", ServiceProvider.Azure),
    model("gpt-image-disabled", ServiceProvider.OpenAI, false),
    model("gpt-4.1", ServiceProvider.OpenAI),
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
    expect(getChatHomeModeForModel("dall-e-3", ServiceProvider.Azure)).toBe(
      "image",
    );
    expect(
      getChatHomeModeForModel("gpt-5.6-terra", ServiceProvider.OpenAI),
    ).toBe("chat");
  });

  test("keeps supported image models separate from every chat model family", () => {
    expect(
      getChatHomeModeModels(models, "chat").map((item) => item.name),
    ).toEqual(["gpt-5.6-luna", "gpt-5.6-terra", "gpt-4.1", "claude-4"]);
    expect(
      getChatHomeModeModels(models, "image").map(
        (item) => `${item.name}@${item.provider?.providerName}`,
      ),
    ).toEqual([
      "gpt-image-3-preview@OpenAI",
      "gpt-image-2@OpenAI",
      "dall-e-3@OpenAI",
      "dall-e-3@Azure",
    ]);
  });

  test("prefers the product defaults and falls back only within the family", () => {
    expect(resolvePreferredChatHomeModel("chat", models)?.name).toBe(
      "gpt-5.6-terra",
    );
    expect(resolvePreferredChatHomeModel("image", models)?.name).toBe(
      "gpt-image-2",
    );
    expect(
      resolvePreferredChatHomeModel("chat", models, {
        name: "gpt-5.6-luna",
        providerName: ServiceProvider.OpenAI,
      })?.name,
    ).toBe("gpt-5.6-luna");
    expect(
      resolvePreferredChatHomeModel("chat", models, {
        name: "claude-4",
        providerName: ServiceProvider.Anthropic,
      })?.name,
    ).toBe("claude-4");
    expect(
      resolvePreferredChatHomeModel("image", models, {
        name: "dall-e-3",
        providerName: ServiceProvider.Azure,
      })?.provider?.providerName,
    ).toBe(ServiceProvider.Azure);
    expect(
      resolvePreferredChatHomeModel(
        "chat",
        [
          model("gpt-5.6-terra", ServiceProvider.OpenAI),
          model("gpt-5.6-luna", ServiceProvider.OpenAI),
        ],
        {
          name: "gpt-5.6-luna",
          providerName: ServiceProvider.Azure,
        },
      )?.name,
    ).toBe("gpt-5.6-terra");
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

  test("opens supported conversation models on their parameter page", () => {
    expect(
      getComposerModelMenuSection("gpt-5.6-terra", ServiceProvider.OpenAI),
    ).toBe("reasoning");
    expect(
      getComposerModelMenuSection("gpt-image-2", ServiceProvider.OpenAI),
    ).toBe("image-options");
    expect(
      getComposerModelMenuSection("gpt-image-2", ServiceProvider.Azure),
    ).toBeNull();
    expect(
      getComposerModelMenuSection("dall-e-3", ServiceProvider.OpenAI),
    ).toBe("image-options");
    expect(getComposerModelMenuSection("dall-e-3", ServiceProvider.Azure)).toBe(
      "image-options",
    );
    expect(
      getComposerModelMenuSection("claude-4", ServiceProvider.Anthropic),
    ).toBeNull();
    expect(
      getComposerModelMenuSection(
        "gpt-5.2-chat-latest",
        ServiceProvider.OpenAI,
      ),
    ).toBeNull();
    expect(getComposerModelMenuSection("o3", ServiceProvider.OpenAI)).toBe(
      "reasoning",
    );
  });

  test("collapses fully automatic image settings into one localized summary", () => {
    expect(
      getImageComposerSummary("auto", "auto", "自动", "自动", "自动"),
    ).toBe("自动");
    expect(
      getImageComposerSummary("1024x1024", "auto", "自动", "1024×1024", "自动"),
    ).toBe("1024×1024 · 自动");
    expect(
      getImageComposerSummary("auto", "high", "Auto", "Auto", "High"),
    ).toBe("Auto · High");
    expect(
      getImageComposerSummary("1024x1024", undefined, "Auto", "1024×1024"),
    ).toBe("1024×1024");
  });

  test("disables only unavailable or locked mode switches", () => {
    expect(
      isChatHomeModeDisabled({
        mode: "image",
        activeMode: "chat",
        availableModelCount: 0,
        modelLocked: false,
      }),
    ).toBe(true);
    expect(
      isChatHomeModeDisabled({
        mode: "image",
        activeMode: "chat",
        availableModelCount: 1,
        modelLocked: true,
      }),
    ).toBe(true);
    expect(
      isChatHomeModeDisabled({
        mode: "chat",
        activeMode: "chat",
        availableModelCount: 0,
        modelLocked: true,
      }),
    ).toBe(false);
  });
});
