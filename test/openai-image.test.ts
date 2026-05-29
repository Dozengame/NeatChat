import { DEFAULT_MODELS, ServiceProvider } from "../app/constant";
import {
  applyOpenAIImageGenerationDefaults,
  buildOpenAIImageEditFormData,
  buildOpenAIImageGenerationPayload,
  getOpenAIImageGenerationProgressContent,
  getOpenAIImageOutputContentType,
  isOpenAIImageGenerationModelConfig,
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

  test("builds gpt-image-2 Images API payload without DALL-E 3 fields", () => {
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
    expect(
      getOpenAIImageGenerationProgressContent({
        model: "gpt-image-2",
        phase: "preparing",
      }),
    ).toContain("正在准备图片生成请求");
    expect(
      getOpenAIImageGenerationProgressContent({
        model: "gpt-image-2",
        phase: "generating",
      }),
    ).toContain("正在生成图片");
    expect(
      getOpenAIImageGenerationProgressContent({
        model: "gpt-image-2",
        phase: "saving",
      }),
    ).toContain("正在保存图片");
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
