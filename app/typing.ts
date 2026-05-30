export type Updater<T> = (updater: (value: T) => void) => void;

const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export interface RequestMessage {
  role: MessageRole;
  content: string;
}

export type DalleSize = "1024x1024" | "1792x1024" | "1024x1792";
export type GptImageSize =
  | "auto"
  | "1024x1024"
  | "1536x1024"
  | "1024x1536"
  | "2048x2048"
  | "2048x1152"
  | "3840x2160"
  | "2160x3840";
export type OpenAIImageSize = DalleSize | GptImageSize;

export type DalleQuality = "standard" | "hd";
export type GptImageQuality = "auto" | "low" | "medium" | "high";
export type OpenAIImageQuality = DalleQuality | GptImageQuality;

export type DalleStyle = "vivid" | "natural";
export type OpenAIImageBackground = "auto" | "opaque";
export type OpenAIImageOutputFormat = "png" | "jpeg" | "webp";
export type OpenAIImageModeration = "auto" | "low";
