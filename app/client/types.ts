import type { ChatMessageTool } from "../store/chat";
import type { ModelType } from "../store/config";
import type { OpenAIChatReasoningEffort } from "../utils/openai-responses";
import type {
  DalleStyle,
  OpenAIImageBackground,
  OpenAIImageModeration,
  OpenAIImageOutputFormat,
  OpenAIImageQuality,
  OpenAIImageSize,
} from "../typing";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
const TTSModels = ["tts-1", "tts-1-hd"] as const;
export type ChatModel = ModelType;

export interface MultimodalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
  openaiResponseId?: string;
  openaiResponseStored?: boolean;
  openaiResponsesOutput?: unknown[];
}

export interface LLMConfig {
  model: string;
  providerName?: string;
  temperature?: number;
  top_p?: number;
  store?: boolean;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
  reasoningEffort?: OpenAIChatReasoningEffort;
  max_output_tokens?: number;
  size?: OpenAIImageSize;
  quality?: OpenAIImageQuality;
  style?: DalleStyle;
  background?: OpenAIImageBackground;
  output_format?: OpenAIImageOutputFormat;
  output_compression?: number;
  moderation?: OpenAIImageModeration;
}

export interface SpeechOptions {
  model: string;
  input: string;
  voice: string;
  response_format?: string;
  speed?: number;
  onController?: (controller: AbortController) => void;
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;
  allowTools?: boolean;

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (
    message: string,
    responseRes: Response,
    metadata?: {
      openaiResponseId?: string;
      openaiResponseStored?: boolean;
      openaiResponsesOutput?: unknown[];
      openaiResponsesRecoveryPending?: boolean;
    },
  ) => void;
  onError?: (
    err: Error,
    metadata?: {
      openaiResponseId?: string;
      openaiResponseStored?: boolean;
      openaiResponsesOutput?: unknown[];
      openaiResponsesRecoveryPending?: boolean;
    },
  ) => void;
  onController?: (controller: AbortController) => void;
  onBeforeTool?: (tool: ChatMessageTool) => void;
  onAfterTool?: (tool: ChatMessageTool) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  displayName?: string;
  available: boolean;
  provider: LLMModelProvider;
  sorted: number;
}

export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerType: string;
  sorted: number;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract speech(options: SpeechOptions): Promise<ArrayBuffer>;
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
}
