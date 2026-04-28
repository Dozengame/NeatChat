import type { ChatOptions, MultimodalContent } from "../api";
import type { ModelConfig } from "@/app/store";
import {
  isOpenAIGpt5OrNewerModelConfig,
  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
  OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY,
  supportsOpenAIResponsesSampling,
  type OpenAIResponsesReasoningEffort,
  type OpenAIResponsesTextVerbosity,
} from "@/app/utils/openai-responses";

export type ResponsesInputContent =
  | {
      type: "input_text";
      text: string;
    }
  | {
      type: "input_image";
      image_url: string;
    };

export interface ResponsesRequestPayload {
  input:
    | string
    | {
        role: "user" | "assistant";
        content: ResponsesInputContent[];
      }[];
  instructions?: string;
  stream?: boolean;
  model: string;
  max_output_tokens?: number;
  reasoning?: {
    effort: OpenAIResponsesReasoningEffort;
    summary?: "auto" | "concise" | "detailed";
  };
  text?: {
    verbosity?: OpenAIResponsesTextVerbosity;
    format?: Record<string, unknown>;
  };
  truncation?: "auto" | "disabled";
  store?: boolean;
  service_tier?: string;
  temperature?: number;
  top_p?: number;
}

function contentToText(content: string | MultimodalContent[]) {
  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part) => (part.type === "text" ? part.text ?? "" : ""))
    .filter(Boolean)
    .join("\n");
}

function toResponsesContent(content: string | MultimodalContent[]) {
  if (typeof content === "string") {
    return [
      {
        type: "input_text" as const,
        text: content,
      },
    ];
  }

  return content
    .map((part) => {
      if (part.type === "text") {
        return {
          type: "input_text" as const,
          text: part.text ?? "",
        };
      }

      if (part.type === "image_url" && part.image_url?.url) {
        return {
          type: "input_image" as const,
          image_url: part.image_url.url,
        };
      }

      return undefined;
    })
    .filter(Boolean) as ResponsesInputContent[];
}

function toResponsesInput(messages: ChatOptions["messages"]) {
  const instructions = messages
    .filter((message) => message.role === "system")
    .map((message) => contentToText(message.content))
    .filter(Boolean)
    .join("\n\n");

  const input = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: toResponsesContent(message.content),
    }))
    .filter((message) => message.content.length > 0);

  return {
    instructions: instructions || undefined,
    input: input.length > 0 ? input : "",
  };
}

export function buildOpenAIResponsesPayload(params: {
  messages: ChatOptions["messages"];
  modelConfig: ModelConfig;
  stream?: boolean;
  textVerbosity?: OpenAIResponsesTextVerbosity;
  reasoningSummary?: "auto" | "concise" | "detailed";
  textFormat?: Record<string, unknown>;
  truncation?: "auto" | "disabled";
  store?: boolean;
  serviceTier?: string;
}): ResponsesRequestPayload {
  const { instructions, input } = toResponsesInput(params.messages);
  const payload: ResponsesRequestPayload = {
    input,
    instructions,
    stream: params.stream,
    model: params.modelConfig.model,
  };

  if (params.modelConfig.max_output_tokens > 0) {
    payload.max_output_tokens = params.modelConfig.max_output_tokens;
  }

  if (
    isOpenAIGpt5OrNewerModelConfig({
      model: params.modelConfig.model,
      providerName: params.modelConfig.providerName,
    })
  ) {
    payload.reasoning = {
      effort: (params.modelConfig.reasoningEffort ||
        OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT) as OpenAIResponsesReasoningEffort,
      summary: params.reasoningSummary,
    };
  }

  const verbosity =
    params.textVerbosity ??
    params.modelConfig.textVerbosity ??
    OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY;
  if (verbosity || params.textFormat) {
    payload.text = {
      ...(verbosity ? { verbosity } : {}),
      ...(params.textFormat ? { format: params.textFormat } : {}),
    };
  }

  if (params.truncation) {
    payload.truncation = params.truncation;
  }

  if (typeof params.store === "boolean") {
    payload.store = params.store;
  }

  if (params.serviceTier) {
    payload.service_tier = params.serviceTier;
  }

  if (supportsOpenAIResponsesSampling(params.modelConfig.model)) {
    payload.temperature = params.modelConfig.temperature;
    if (params.modelConfig.top_p !== 1) {
      payload.top_p = params.modelConfig.top_p;
    }
  }

  return payload;
}
