import { ServiceProvider } from "../constant";
import { getAccessRestrictedPublicErrorMessage } from "./public-error";
import type {
  DalleStyle,
  GptImageQuality,
  GptImageSize,
  OpenAIImageBackground,
  OpenAIImageModeration,
  OpenAIImageOutputFormat,
  OpenAIImageQuality,
  OpenAIImageSize,
} from "../typing";

export const VERCEL_HOBBY_MAX_DURATION_SECONDS = 300;
const GPT_IMAGE_2_MODEL = "gpt-image-2";
const DALLE_MODEL_PREFIX = "dall-e";
const GPT_IMAGE_MODEL_PREFIX = "gpt-image";

export const OPENAI_IMAGE_REQUEST_TIMEOUT_MS =
  VERCEL_HOBBY_MAX_DURATION_SECONDS * 1000;

export const DALLE3_IMAGE_SIZES = [
  "1024x1024",
  "1792x1024",
  "1024x1792",
] as const;
export const DALLE_IMAGE_COMPATIBLE_SIZES = ["1024x1024"] as const;

export const DALLE3_IMAGE_QUALITIES = ["standard", "hd"] as const;
export const DALLE3_IMAGE_STYLES = ["vivid", "natural"] as const;

export const GPT_IMAGE_2_SIZES = [
  "auto",
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "2048x2048",
  "2048x1152",
  "3840x2160",
  "2160x3840",
] as const;

export const GPT_IMAGE_2_QUALITIES = ["auto", "low", "medium", "high"] as const;

const GPT_IMAGE_2_DEFAULTS = {
  size: "auto" as GptImageSize,
  quality: "auto" as GptImageQuality,
  background: "auto" as OpenAIImageBackground,
  output_format: "png" as OpenAIImageOutputFormat,
  moderation: "auto" as OpenAIImageModeration,
};

const DALLE3_DEFAULTS = {
  size: "1024x1024" as OpenAIImageSize,
  quality: "standard" as OpenAIImageQuality,
  style: "vivid" as DalleStyle,
};

const DALLE_IMAGE_DEFAULTS = {
  size: "1024x1024" as OpenAIImageSize,
};

export interface DalleRequestPayload {
  model: string;
  prompt: string;
  response_format: "url" | "b64_json";
  n: number;
  size: OpenAIImageSize;
  quality?: OpenAIImageQuality;
  style?: DalleStyle;
}

export interface GptImage2RequestPayload {
  model: string;
  prompt: string;
  n: number;
  size: OpenAIImageSize;
  quality: OpenAIImageQuality;
  background: OpenAIImageBackground;
  output_format: OpenAIImageOutputFormat;
  output_compression?: number;
  moderation: OpenAIImageModeration;
}

export type OpenAIImageGenerationRequestPayload =
  | DalleRequestPayload
  | GptImage2RequestPayload;

export type OpenAIImageGenerationProgressCopy = {
  Model: (model: string) => string;
  Preparing: string;
  Generating: string;
  Saving: string;
};

export type OpenAIImageInputFile = {
  blob: Blob;
  filename?: string;
};

export type OpenAIImageGenerationConfig = Partial<{
  size: OpenAIImageSize;
  quality: OpenAIImageQuality;
  style: DalleStyle;
  background: OpenAIImageBackground;
  output_format: OpenAIImageOutputFormat;
  output_compression: number;
  moderation: OpenAIImageModeration;
}>;

function normalizeModel(model?: string) {
  return model?.trim().toLowerCase() ?? "";
}

function normalizeProvider(providerName?: string) {
  return providerName?.trim().toLowerCase() ?? "";
}

export function isDalle3(model?: string) {
  return normalizeModel(model) === "dall-e-3";
}

function isDalleImageGenerationModel(model?: string) {
  return normalizeModel(model).startsWith(DALLE_MODEL_PREFIX);
}

export function isGptImageGenerationModel(model?: string) {
  return normalizeModel(model).startsWith(GPT_IMAGE_MODEL_PREFIX);
}

export function isOpenAIImageGenerationModel(model?: string) {
  return isDalleImageGenerationModel(model) || isGptImageGenerationModel(model);
}

export function isOpenAIImageGenerationModelConfig(params: {
  model?: string;
  providerName?: string;
}) {
  const providerName = normalizeProvider(params.providerName);
  const isOpenAIProvider =
    !providerName || providerName === ServiceProvider.OpenAI.toLowerCase();

  if (isGptImageGenerationModel(params.model)) {
    return isOpenAIProvider;
  }

  if (isDalleImageGenerationModel(params.model)) {
    return (
      isOpenAIProvider || providerName === ServiceProvider.Azure.toLowerCase()
    );
  }

  return false;
}

export function getOpenAIImageOutputContentType(
  outputFormat?: OpenAIImageOutputFormat,
) {
  switch (outputFormat) {
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "png":
    default:
      return "image/png";
  }
}

export function getOpenAIImageGenerationProgressContent(params: {
  model?: string;
  phase?: "preparing" | "generating" | "saving";
  copy: OpenAIImageGenerationProgressCopy;
}) {
  const modelLine = params.copy.Model(params.model?.trim() ?? "");

  switch (params.phase) {
    case "saving":
      return `${params.copy.Saving}${modelLine}`;
    case "generating":
      return `${params.copy.Generating}${modelLine}`;
    case "preparing":
    default:
      return `${params.copy.Preparing}${modelLine}`;
  }
}

export function createOpenAIImageTimeoutError(
  timeoutMs = OPENAI_IMAGE_REQUEST_TIMEOUT_MS,
) {
  return new Error(
    `OpenAI image generation timed out after ${Math.round(
      timeoutMs / 1000,
    )} seconds`,
  );
}

export function abortOpenAIImageRequest(
  controller: AbortController,
  timeoutMs = OPENAI_IMAGE_REQUEST_TIMEOUT_MS,
) {
  controller.abort(createOpenAIImageTimeoutError(timeoutMs));
}

export function parseOpenAIImageResponsePayload(params: {
  status: number;
  bodyText: string;
}) {
  if (!params.bodyText.trim()) {
    return {};
  }

  try {
    return JSON.parse(params.bodyText);
  } catch {
    return {
      error: {
        code: String(params.status),
        message: params.bodyText,
      },
    };
  }
}

export function getOpenAIImageErrorMessage(params: {
  status: number;
  payload: unknown;
  accessRestrictedMessage: string;
}) {
  const localizedAccessError = getAccessRestrictedPublicErrorMessage({
    response: { status: params.status },
    payload: params.payload,
    message: params.accessRestrictedMessage,
  });
  if (localizedAccessError) return localizedAccessError;

  const payload = params.payload as
    | {
        error?: { message?: unknown; code?: unknown };
        message?: unknown;
        msg?: unknown;
        code?: unknown;
      }
    | undefined;
  const detail =
    typeof payload?.error?.message === "string"
      ? payload.error.message
      : typeof payload?.message === "string"
      ? payload.message
      : typeof payload?.msg === "string"
      ? payload.msg
      : "";
  const code =
    typeof payload?.error?.code === "string"
      ? payload.error.code
      : typeof payload?.code === "string"
      ? payload.code
      : String(params.status);
  return detail
    ? `OpenAI image generation failed (${code}): ${detail}`
    : `OpenAI image generation failed (${code})`;
}

export function applyOpenAIImageGenerationDefaults<
  T extends {
    model?: string;
    providerName?: string;
    size?: OpenAIImageSize;
    quality?: OpenAIImageQuality;
    style?: DalleStyle;
    background?: OpenAIImageBackground;
    output_format?: OpenAIImageOutputFormat;
    output_compression?: number;
    moderation?: OpenAIImageModeration;
  },
>(config: T) {
  if (!isOpenAIImageGenerationModelConfig(config)) {
    return config;
  }

  if (isGptImageGenerationModel(config.model)) {
    config.size = GPT_IMAGE_2_DEFAULTS.size;
    config.quality = GPT_IMAGE_2_DEFAULTS.quality;
    config.background = GPT_IMAGE_2_DEFAULTS.background;
    config.output_format = GPT_IMAGE_2_DEFAULTS.output_format;
    config.moderation = GPT_IMAGE_2_DEFAULTS.moderation;
    config.output_compression = undefined;
    config.style = undefined;
    return config;
  }

  if (isDalle3(config.model)) {
    config.size = DALLE3_DEFAULTS.size;
    config.quality = DALLE3_DEFAULTS.quality;
    config.style = DALLE3_DEFAULTS.style;
  } else {
    config.size = DALLE_IMAGE_DEFAULTS.size;
    config.quality = undefined;
    config.style = undefined;
  }
  config.background = undefined;
  config.output_format = undefined;
  config.output_compression = undefined;
  config.moderation = undefined;
  return config;
}

export function buildOpenAIImageGenerationPayload(params: {
  model: string;
  prompt: string;
  config?: OpenAIImageGenerationConfig;
}): OpenAIImageGenerationRequestPayload {
  if (isGptImageGenerationModel(params.model)) {
    const size = GPT_IMAGE_2_SIZES.includes(params.config?.size as any)
      ? params.config?.size
      : GPT_IMAGE_2_DEFAULTS.size;
    const quality = GPT_IMAGE_2_QUALITIES.includes(
      params.config?.quality as any,
    )
      ? params.config?.quality
      : GPT_IMAGE_2_DEFAULTS.quality;
    const background =
      params.config?.background === "opaque" ||
      params.config?.background === "auto"
        ? params.config.background
        : GPT_IMAGE_2_DEFAULTS.background;
    const outputFormat =
      params.config?.output_format === "png" ||
      params.config?.output_format === "jpeg" ||
      params.config?.output_format === "webp"
        ? params.config.output_format
        : GPT_IMAGE_2_DEFAULTS.output_format;
    const moderation =
      params.config?.moderation === "low" ||
      params.config?.moderation === "auto"
        ? params.config.moderation
        : GPT_IMAGE_2_DEFAULTS.moderation;

    const payload: GptImage2RequestPayload = {
      model: params.model,
      prompt: params.prompt,
      n: 1,
      size: size ?? "auto",
      quality: quality ?? "auto",
      background: background ?? "auto",
      output_format: outputFormat ?? "png",
      moderation: moderation ?? "auto",
    };

    if (
      typeof params.config?.output_compression === "number" &&
      (payload.output_format === "jpeg" || payload.output_format === "webp")
    ) {
      payload.output_compression = Math.floor(
        Math.min(100, Math.max(0, params.config.output_compression)),
      );
    }

    return payload;
  }

  const dalleSizeOptions = isDalle3(params.model)
    ? DALLE3_IMAGE_SIZES
    : DALLE_IMAGE_COMPATIBLE_SIZES;
  const size = dalleSizeOptions.includes(params.config?.size as any)
    ? params.config?.size
    : DALLE3_DEFAULTS.size;
  const payload: DalleRequestPayload = {
    model: params.model,
    prompt: params.prompt,
    response_format: "b64_json",
    n: 1,
    size: size ?? "1024x1024",
  };

  if (isDalle3(params.model)) {
    const quality = DALLE3_IMAGE_QUALITIES.includes(
      params.config?.quality as any,
    )
      ? params.config?.quality
      : DALLE3_DEFAULTS.quality;
    const style = DALLE3_IMAGE_STYLES.includes(params.config?.style as any)
      ? params.config?.style
      : DALLE3_DEFAULTS.style;
    payload.quality = quality ?? "standard";
    payload.style = style ?? "vivid";
  }

  return payload;
}

export function buildOpenAIImageEditFormData(params: {
  model: string;
  prompt: string;
  config?: OpenAIImageGenerationConfig;
  images: OpenAIImageInputFile[];
}) {
  const outputFormat =
    params.config?.output_format === "png" ||
    params.config?.output_format === "jpeg" ||
    params.config?.output_format === "webp"
      ? params.config.output_format
      : GPT_IMAGE_2_DEFAULTS.output_format;
  const formData = new FormData();
  formData.append("model", params.model);
  formData.append("prompt", params.prompt);
  formData.append("n", "1");
  formData.append(
    "size",
    GPT_IMAGE_2_SIZES.includes(params.config?.size as any)
      ? params.config?.size ?? GPT_IMAGE_2_DEFAULTS.size
      : GPT_IMAGE_2_DEFAULTS.size,
  );
  formData.append(
    "quality",
    GPT_IMAGE_2_QUALITIES.includes(params.config?.quality as any)
      ? params.config?.quality ?? GPT_IMAGE_2_DEFAULTS.quality
      : GPT_IMAGE_2_DEFAULTS.quality,
  );
  formData.append(
    "background",
    params.config?.background === "opaque" ||
      params.config?.background === "auto"
      ? params.config.background
      : GPT_IMAGE_2_DEFAULTS.background,
  );
  formData.append("output_format", outputFormat);

  if (
    typeof params.config?.output_compression === "number" &&
    (outputFormat === "jpeg" || outputFormat === "webp")
  ) {
    formData.append(
      "output_compression",
      String(
        Math.floor(
          Math.min(100, Math.max(0, params.config.output_compression)),
        ),
      ),
    );
  }

  if (
    params.config?.moderation === "low" ||
    params.config?.moderation === "auto"
  ) {
    formData.append("moderation", params.config.moderation);
  } else {
    formData.append("moderation", GPT_IMAGE_2_DEFAULTS.moderation);
  }

  params.images.forEach((image, index) => {
    formData.append("image[]", image.blob, image.filename ?? `image-${index}`);
  });

  return formData;
}
