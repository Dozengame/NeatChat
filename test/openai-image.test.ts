import { readFileSync } from "fs";

import { DEFAULT_MODELS, ServiceProvider } from "../app/constant";
import Locale from "../app/locales";
import cn from "../app/locales/cn";
import en from "../app/locales/en";
import {
  OPENAI_IMAGE_REQUEST_TIMEOUT_MS,
  VERCEL_HOBBY_MAX_DURATION_SECONDS,
  abortOpenAIImageRequest,
  applyOpenAIImageGenerationDefaults,
  buildOpenAIImageEditFormData,
  buildOpenAIImageGenerationPayload,
  createOpenAIImageTimeoutError,
  getOpenAIImageGenerationProgressContent,
  getOpenAIImageGenerationOptions,
  getOpenAIImageErrorMessage,
  getOpenAIImageOutputContentType,
  isGptImage2,
  isOpenAIImageGenerationModelConfig,
  normalizeOpenAIImageQuality,
  normalizeOpenAIImageSize,
  parseOpenAIImageResponsePayload,
} from "../app/utils/openai-image";

describe("OpenAI image generation models", () => {
  test("exposes gpt-image-2 as an OpenAI-only model", () => {
    expect(
      DEFAULT_MODELS.some(
        (model) =>
          model.name === "gpt-image-2" &&
          model.provider?.providerName === ServiceProvider.OpenAI,
      ),
    ).toBe(true);

    expect(
      DEFAULT_MODELS.some(
        (model) =>
          model.name === "gpt-image-2" &&
          model.provider?.providerName === ServiceProvider.Azure,
      ),
    ).toBe(false);
  });

  test("recognizes only supported provider/model pairs", () => {
    expect(
      isOpenAIImageGenerationModelConfig({
        model: "gpt-image-2",
        providerName: ServiceProvider.OpenAI,
      }),
    ).toBe(true);

    expect(
      isOpenAIImageGenerationModelConfig({
        model: "gpt-image-2",
        providerName: ServiceProvider.Azure,
      }),
    ).toBe(false);

    expect(
      isOpenAIImageGenerationModelConfig({
        model: "dall-e-3",
        providerName: ServiceProvider.Azure,
      }),
    ).toBe(true);

    expect(
      isOpenAIImageGenerationModelConfig({
        model: "gpt-image-3-preview",
        providerName: ServiceProvider.OpenAI,
      }),
    ).toBe(true);

    expect(
      isOpenAIImageGenerationModelConfig({
        model: "gpt-image-3-preview",
        providerName: ServiceProvider.Azure,
      }),
    ).toBe(false);

    expect(
      isOpenAIImageGenerationModelConfig({
        model: "dall-e-next",
        providerName: ServiceProvider.OpenAI,
      }),
    ).toBe(true);
  });

  test("applies gpt-image-2 defaults and removes DALL-E 3 style", () => {
    const config = applyOpenAIImageGenerationDefaults({
      model: "gpt-image-2",
      providerName: ServiceProvider.OpenAI,
      size: "1024x1024" as const,
      quality: "hd" as const,
      style: "vivid" as const,
    });

    expect(config).toMatchObject({
      size: "auto",
      quality: "auto",
      background: "auto",
      output_format: "png",
      moderation: "auto",
    });
    expect(config.style).toBeUndefined();
  });

  test("resolves size and quality capabilities per image model", () => {
    expect(isGptImage2("gpt-image-2")).toBe(true);
    expect(isGptImage2("gpt-image-2-2026-04-21")).toBe(true);
    expect(isGptImage2("gpt-image-2-custom")).toBe(false);
    expect(getOpenAIImageGenerationOptions("gpt-image-2")).toMatchObject({
      sizes: expect.arrayContaining(["auto", "2048x2048", "3840x2160"]),
      qualities: ["auto", "low", "medium", "high"],
    });
    expect(getOpenAIImageGenerationOptions("gpt-image-1.5")).toMatchObject({
      sizes: ["auto", "1024x1024", "1536x1024", "1024x1536"],
      qualities: ["auto", "low", "medium", "high"],
    });
    expect(
      getOpenAIImageGenerationOptions("gpt-image-1.5").sizes,
    ).not.toContain("3840x2160");
    expect(
      getOpenAIImageGenerationOptions("gpt-image-1.5-2025-12-16").sizes,
    ).not.toContain("3840x2160");
    expect(
      getOpenAIImageGenerationOptions("gpt-image-3-preview").sizes,
    ).toContain("3840x2160");
    expect(getOpenAIImageGenerationOptions("dall-e-3")).toMatchObject({
      sizes: ["1024x1024", "1792x1024", "1024x1792"],
      qualities: ["standard", "hd"],
    });
    expect(getOpenAIImageGenerationOptions("dall-e-2")).toMatchObject({
      sizes: ["1024x1024"],
      qualities: [],
    });
  });

  test("normalizes stale cross-model values before rendering or sending", () => {
    expect(normalizeOpenAIImageQuality("gpt-image-2", "standard")).toBe(
      "auto",
    );
    expect(normalizeOpenAIImageQuality("dall-e-3", "high")).toBe(
      "standard",
    );
    expect(normalizeOpenAIImageSize("gpt-image-2", "1792x1024")).toBe(
      "auto",
    );
    expect(normalizeOpenAIImageSize("dall-e-3", "3840x2160")).toBe(
      "1024x1024",
    );

    const chatSource = readFileSync("app/components/chat.tsx", "utf8");
    const modelConfigSource = readFileSync(
      "app/components/model-config.tsx",
      "utf8",
    );
    expect(chatSource).toContain("value={headerCurrentQuality}");
    expect(chatSource).toContain("value={headerCurrentSize}");
    expect(modelConfigSource).toContain("value={currentImageQuality}");
    expect(modelConfigSource).toContain("value={currentImageSize}");
    expect(modelConfigSource).toContain(
      "Locale.Settings.ImageGeneration.SizeOption(size)",
    );
  });

  test.each([
    ["auto", "Auto", "自动"],
    ["1024x1024", "Square", "方形 · 1K"],
    ["1536x1024", "Landscape", "横向 · 1.5K"],
    ["1024x1536", "Portrait", "纵向 · 1.5K"],
    ["2048x2048", "2K Square", "方形 · 2K"],
    ["2048x1152", "2K Landscape", "横向 · 2K"],
    ["3840x2160", "4K Landscape", "横向 · 4K"],
    ["2160x3840", "4K Portrait", "纵向 · 4K"],
  ])(
    "localizes gpt-image-2 size %s without changing its API value",
    (size, englishLabel, chineseLabel) => {
      expect(en.Settings.ImageGeneration.SizeLabel(size)).toBe(englishLabel);
      expect(cn.Settings.ImageGeneration.SizeLabel(size)).toBe(chineseLabel);
      if (size !== "auto") {
        expect(en.Settings.ImageGeneration.SizeOption(size)).toContain(size);
        expect(cn.Settings.ImageGeneration.SizeOption(size)).toContain(size);
      }
    },
  );

  test("falls back to the exact API value for unknown dimensions", () => {
    expect(en.Settings.ImageGeneration.SizeLabel("1600x900")).toBe(
      "1600x900",
    );
    expect(cn.Settings.ImageGeneration.SizeLabel("1600x900")).toBe(
      "1600x900",
    );
  });

  test("applies conservative defaults for non-DALL-E 3 DALL-E models", () => {
    const config = applyOpenAIImageGenerationDefaults({
      model: "dall-e-next",
      providerName: ServiceProvider.OpenAI,
      size: "1792x1024" as const,
      quality: "hd" as const,
      style: "vivid" as const,
    });

    expect(config.size).toBe("1024x1024");
    expect(config.quality).toBeUndefined();
    expect(config.style).toBeUndefined();
  });

  test("builds an unknown gpt-image payload without DALL-E 3 fields", () => {
    const payload = buildOpenAIImageGenerationPayload({
      model: "gpt-image-3-preview",
      prompt: "Draw a clean app icon",
    }) as any;

    expect(payload).toEqual({
      model: "gpt-image-3-preview",
      prompt: "Draw a clean app icon",
      n: 1,
      size: "auto",
      quality: "auto",
      background: "auto",
      output_format: "png",
      moderation: "auto",
    });
    expect(payload.response_format).toBeUndefined();
    expect(payload.style).toBeUndefined();
  });

  test("preserves existing size semantics for unknown gpt-image models", () => {
    const payload = buildOpenAIImageGenerationPayload({
      model: "gpt-image-custom",
      prompt: "Draw a wide banner",
      config: { size: "3840x2160", quality: "high" },
    }) as any;

    expect(payload).toMatchObject({
      size: "3840x2160",
      quality: "high",
    });

    const legacyPayload = buildOpenAIImageGenerationPayload({
      model: "gpt-image-1.5",
      prompt: "Draw a wide banner",
      config: { size: "3840x2160", quality: "high" },
    }) as any;
    expect(legacyPayload).toMatchObject({ size: "auto", quality: "high" });
  });

  test("keeps valid gpt-image-2 image settings in the request payload", () => {
    const payload = buildOpenAIImageGenerationPayload({
      model: "gpt-image-2",
      prompt: "Draw a clean app icon",
      config: {
        size: "1024x1024",
        quality: "high",
        output_format: "jpeg",
        output_compression: 50,
      },
    }) as any;

    expect(payload).toMatchObject({
      size: "1024x1024",
      quality: "high",
      output_format: "jpeg",
      output_compression: 50,
    });
    expect(payload.style).toBeUndefined();
  });

  test("builds gpt-image edit multipart payload for image-to-image", () => {
    const image = new Blob(["image"], { type: "image/png" });
    const formData = buildOpenAIImageEditFormData({
      model: "gpt-image-2",
      prompt: "Use this image as reference",
      images: [{ blob: image, filename: "reference.png" }],
      config: {
        size: "1024x1024",
        quality: "high",
        output_format: "webp",
        output_compression: 80,
      },
    });

    expect(formData.get("model")).toBe("gpt-image-2");
    expect(formData.get("prompt")).toBe("Use this image as reference");
    expect(formData.get("size")).toBe("1024x1024");
    expect(formData.get("quality")).toBe("high");
    expect(formData.get("output_format")).toBe("webp");
    expect(formData.get("output_compression")).toBe("80");
    expect(formData.getAll("image[]")).toHaveLength(1);
  });

  test("maps gpt-image output formats to cache content types", () => {
    expect(getOpenAIImageOutputContentType("png")).toBe("image/png");
    expect(getOpenAIImageOutputContentType("jpeg")).toBe("image/jpeg");
    expect(getOpenAIImageOutputContentType("webp")).toBe("image/webp");
    expect(getOpenAIImageOutputContentType()).toBe("image/png");
  });

  test("describes image generation progress phases", () => {
    const progressCopy = Locale.Chat.ImageGeneration.Progress;
    expect(
      getOpenAIImageGenerationProgressContent({
        model: "gpt-image-2",
        phase: "preparing",
        copy: progressCopy,
      }),
    ).toContain(progressCopy.Preparing);
    expect(
      getOpenAIImageGenerationProgressContent({
        model: "gpt-image-2",
        phase: "generating",
        copy: progressCopy,
      }),
    ).toContain(progressCopy.Generating);
    expect(
      getOpenAIImageGenerationProgressContent({
        model: "gpt-image-2",
        phase: "saving",
        copy: progressCopy,
      }),
    ).toContain(progressCopy.Saving);
  });

  test("uses the caller-provided progress copy", () => {
    const copy = {
      Model: (model: string) => ` model=${model}`,
      Preparing: "prepare",
      Generating: "generate",
      Saving: "save",
    };

    expect(
      getOpenAIImageGenerationProgressContent({
        model: "gpt-image-2",
        phase: "saving",
        copy,
      }),
    ).toBe("save model=gpt-image-2");
  });

  test("uses a Vercel Hobby-compatible timeout for image generation requests", () => {
    expect(VERCEL_HOBBY_MAX_DURATION_SECONDS).toBe(300);
    expect(OPENAI_IMAGE_REQUEST_TIMEOUT_MS).toBe(5 * 60 * 1000);

    const routeSource = readFileSync(
      "app/api/openai/v1/images/[action]/route.ts",
      "utf8",
    );
    expect(routeSource).toContain("export const maxDuration = 300;");
    expect(routeSource).not.toContain("export const maxDuration = 600;");

    const timeoutError = createOpenAIImageTimeoutError(123_000);
    expect(timeoutError.message).toBe(
      "OpenAI image generation timed out after 123 seconds",
    );

    const controller = new AbortController();
    abortOpenAIImageRequest(controller, 123_000);

    expect(controller.signal.aborted).toBe(true);
    expect(controller.signal.reason).toBeInstanceOf(Error);
    expect((controller.signal.reason as Error).message).toBe(
      "OpenAI image generation timed out after 123 seconds",
    );
  });

  test("wraps non-json image responses as OpenAI errors", () => {
    expect(
      parseOpenAIImageResponsePayload({
        status: 504,
        bodyText: "An error occurred with your deployment",
      }),
    ).toEqual({
      error: {
        code: "504",
        message: "An error occurred with your deployment",
      },
    });
  });

  test("localizes access-restricted image errors without exposing machine codes", () => {
    expect(
      getOpenAIImageErrorMessage({
        status: 429,
        payload: {
          code: "access_restricted",
          msg: "access_restricted",
        },
        accessRestrictedMessage: Locale.Error.AccessRestricted,
      }),
    ).toBe(Locale.Error.AccessRestricted);
  });

  test("keeps DALL-E 3 payload compatible with the existing image path", () => {
    const payload = buildOpenAIImageGenerationPayload({
      model: "dall-e-3",
      prompt: "Draw a clean app icon",
    }) as any;

    expect(payload).toEqual({
      model: "dall-e-3",
      prompt: "Draw a clean app icon",
      response_format: "b64_json",
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });
  });

  test("builds non-DALL-E 3 image payload without DALL-E 3-only fields", () => {
    const payload = buildOpenAIImageGenerationPayload({
      model: "dall-e-next",
      prompt: "Draw a clean app icon",
      config: {
        size: "1792x1024",
        quality: "hd",
        style: "vivid",
      },
    }) as any;

    expect(payload).toEqual({
      model: "dall-e-next",
      prompt: "Draw a clean app icon",
      response_format: "b64_json",
      n: 1,
      size: "1024x1024",
    });
    expect(payload.quality).toBeUndefined();
    expect(payload.style).toBeUndefined();
  });
});
