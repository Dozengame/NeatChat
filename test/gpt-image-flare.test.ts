import { ServiceProvider } from "../app/constant";
import type { OpenAIImageGenerationConfig } from "../app/utils/openai-image";
import {
  GPT_IMAGE_2_SIZES,
  GPT_IMAGE_FLARE_QUALITIES,
  OPENAI_IMAGE_DEFAULT_MODEL,
  applyOpenAIImageGenerationDefaults,
  buildOpenAIImageEditFormData,
  buildOpenAIImageGenerationPayload,
  getOpenAIImageGenerationOptions,
  isGptImageFlare,
  isOpenAIImageGenerationModelConfig,
  normalizeOpenAIImageRequestParameters,
} from "../app/utils/openai-image";
import { resolveAllowedModelRef } from "../app/utils/public-app-config";

describe("GPT Image 2.5 Flare", () => {
  test.each([OPENAI_IMAGE_DEFAULT_MODEL, "gpt-image-2.5-flare-2026-09-22"])(
    "%s offers supported quality levels and 2K/4K presets",
    (model) => {
      expect(isGptImageFlare(model)).toBe(true);
      expect(getOpenAIImageGenerationOptions(model)).toEqual({
        sizes: GPT_IMAGE_2_SIZES,
        qualities: GPT_IMAGE_FLARE_QUALITIES,
        styles: [],
      });
      expect(
        isOpenAIImageGenerationModelConfig({
          model,
          providerName: ServiceProvider.OpenAI,
        }),
      ).toBe(true);
      expect(
        isOpenAIImageGenerationModelConfig({
          model,
          providerName: ServiceProvider.Azure,
        }),
      ).toBe(false);
    },
  );

  test.each(["gpt-image-2", "gpt-image-1.5", "gpt-image-2.5-flare-preview"])(
    "%s does not inherit Flare-only quality or background capabilities",
    (model) => {
      expect(isGptImageFlare(model)).toBe(false);
      expect(getOpenAIImageGenerationOptions(model).qualities).toEqual([
        "auto",
        "low",
        "medium",
        "high",
      ]);
      expect(
        normalizeOpenAIImageRequestParameters({
          model,
          config: { quality: "max", background: "transparent" },
        }),
      ).toMatchObject({ quality: "auto", background: "auto" });
    },
  );

  test("defaults new Flare requests to a single automatic PNG image", () => {
    expect(
      buildOpenAIImageGenerationPayload({
        model: OPENAI_IMAGE_DEFAULT_MODEL,
        prompt: "A blue circle",
      }),
    ).toEqual({
      model: OPENAI_IMAGE_DEFAULT_MODEL,
      prompt: "A blue circle",
      n: 1,
      size: "auto",
      quality: "auto",
      background: "auto",
      output_format: "png",
      moderation: "auto",
    });
    const config = applyOpenAIImageGenerationDefaults({
      model: OPENAI_IMAGE_DEFAULT_MODEL,
      providerName: ServiceProvider.OpenAI,
      style: "vivid" as const,
      quality: "hd" as const,
    });
    expect(config.quality).toBe("auto");
    expect(config.style).toBeUndefined();
  });

  test.each(["xhigh", "max"] as const)(
    "shares normalized %s parameters between generation and editing",
    (quality) => {
      const config: OpenAIImageGenerationConfig = {
        size: "3840x2160",
        quality,
        background: "transparent",
        output_format: "webp",
        output_compression: 88.9,
        moderation: "low",
        style: "vivid",
      };
      const generation = buildOpenAIImageGenerationPayload({
        model: OPENAI_IMAGE_DEFAULT_MODEL,
        prompt: "A blue circle",
        config,
      });
      const editing = buildOpenAIImageEditFormData({
        model: OPENAI_IMAGE_DEFAULT_MODEL,
        prompt: "A blue circle",
        config,
        images: [
          {
            blob: new Blob(["original-image-bytes"], { type: "image/png" }),
            filename: "original.png",
          },
        ],
      });
      expect(generation).toMatchObject({
        size: "3840x2160",
        quality,
        background: "transparent",
        output_format: "webp",
        output_compression: 88,
        moderation: "low",
      });
      for (const [key, value] of Object.entries(generation)) {
        expect(editing.get(key)).toBe(String(value));
      }
      expect(editing.getAll("image[]")).toHaveLength(1);
      const image = editing.get("image[]") as File;
      expect(image.name).toBe("original.png");
      expect(image.size).toBe("original-image-bytes".length);
      expect(image.type).toBe("image/png");
      expect(editing.has("response_format")).toBe(false);
      expect(editing.has("style")).toBe(false);
      expect(editing.has("input_fidelity")).toBe(false);
    },
  );

  test.each([
    ["png", "transparent"],
    ["webp", "transparent"],
    ["jpeg", "auto"],
  ] as const)("uses safe background for %s", (output_format, background) => {
    expect(
      normalizeOpenAIImageRequestParameters({
        model: OPENAI_IMAGE_DEFAULT_MODEL,
        config: { output_format, background: "transparent" },
      }),
    ).toMatchObject({ output_format, background });
  });

  test.each([
    ["jpeg", -1, 0],
    ["webp", 200, 100],
    ["jpeg", 72.7, 72],
    ["png", 80, undefined],
    ["webp", NaN, undefined],
    ["jpeg", Infinity, undefined],
  ] as const)(
    "normalizes %s compression %s to %s",
    (output_format, output_compression, expected) => {
      const result = normalizeOpenAIImageRequestParameters({
        model: OPENAI_IMAGE_DEFAULT_MODEL,
        config: { output_format, output_compression },
      });
      expect(
        "output_compression" in result ? result.output_compression : undefined,
      ).toBe(expected);
    },
  );

  test("discards invalid cross-model size, quality, and format", () => {
    expect(
      normalizeOpenAIImageRequestParameters({
        model: OPENAI_IMAGE_DEFAULT_MODEL,
        config: {
          size: "1792x1024",
          quality: "hd",
          output_format: "gif",
          moderation: "unknown",
        } as unknown as OpenAIImageGenerationConfig,
      }),
    ).toEqual({
      n: 1,
      size: "auto",
      quality: "auto",
      background: "auto",
      output_format: "png",
      moderation: "auto",
    });
  });
});

describe("image model allowlist migration", () => {
  const allowedModels = [
    "gpt-6-luna@OpenAI",
    `${OPENAI_IMAGE_DEFAULT_MODEL}@OpenAI`,
  ];
  const fallbackModelRef = "gpt-6-luna@OpenAI";

  test.each(["gpt-image-2", "gpt-image-2-2026-04-21"])(
    "migrates removed OpenAI %s to Flare before the chat default",
    (model) => {
      expect(
        resolveAllowedModelRef({
          model,
          providerName: "openai",
          allowedModels,
          fallbackModelRef,
        }),
      ).toBe(`${OPENAI_IMAGE_DEFAULT_MODEL}@OpenAI`);
    },
  );

  test("keeps an explicitly allowed older image model unchanged", () => {
    expect(
      resolveAllowedModelRef({
        model: "gpt-image-2",
        allowedModels: [...allowedModels, "gpt-image-2@OpenAI"],
        fallbackModelRef,
      }),
    ).toBe("gpt-image-2@OpenAI");
  });

  test.each([
    ["gpt-5.6-terra", "OpenAI", allowedModels],
    ["gpt-image-2", "Azure", allowedModels],
    ["gpt-image-2", "OpenAI", ["gpt-6-luna@OpenAI"]],
  ])(
    "preserves ordinary fallback for %s@%s",
    (model, providerName, allowed) => {
      expect(
        resolveAllowedModelRef({
          model: model as string,
          providerName: providerName as string,
          allowedModels: allowed as string[],
          fallbackModelRef,
        }),
      ).toBe(fallbackModelRef);
    },
  );
});
