import type { ChatOptions, MultimodalContent } from "../types";
import type { ModelConfig } from "@/app/store";
import {
  isOpenAIGpt5OrNewerModelConfig,
  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
  OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY,
  supportsOpenAIResponsesSampling,
  type OpenAIResponsesReasoningEffort,
  type OpenAIResponsesTextVerbosity,
  type OpenAIResponsesWebSearchMode,
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

export type ResponsesOutputContent =
  | {
      type: "output_text";
      text: string;
    }
  | {
      type: "refusal";
      refusal: string;
    };

export type ResponsesMessageContent =
  | ResponsesInputContent
  | ResponsesOutputContent;

export type ResponsesInputItem =
  | {
      role: "user" | "assistant";
      content: ResponsesMessageContent[];
    }
  | Record<string, unknown>;

export type ResponsesTool = {
  type: "web_search";
};

export interface ResponsesRequestPayload {
  input: string | ResponsesInputItem[];
  instructions?: string;
  stream?: boolean;
  model: string;
  previous_response_id?: string;
  include?: string[];
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
  tools?: ResponsesTool[];
  tool_choice?: "auto" | "required";
}

function contentToText(content: string | MultimodalContent[]) {
  if (typeof content === "string") {
    return content;
  }

  return content
    .flatMap((part) => (part.type === "text" && part.text ? [part.text] : []))
    .join("\n");
}

function toResponsesInputContent(content: string | MultimodalContent[]) {
  if (typeof content === "string") {
    return [
      {
        type: "input_text" as const,
        text: content,
      },
    ];
  }

  return content.flatMap<ResponsesInputContent>((part) => {
    if (part.type === "text") {
      return part.text
        ? [
            {
              type: "input_text" as const,
              text: part.text,
            },
          ]
        : [];
    }

    if (part.type === "image_url" && part.image_url?.url) {
      return [
        {
          type: "input_image" as const,
          image_url: part.image_url.url,
        },
      ];
    }

    return [];
  }) as ResponsesInputContent[];
}

function toResponsesOutputContent(content: string | MultimodalContent[]) {
  const text = contentToText(content);
  if (!text) {
    return [];
  }

  return [
    {
      type: "output_text" as const,
      text,
    },
  ];
}

function toResponsesInput(messages: ChatOptions["messages"], store?: boolean) {
  const instructions = messages
    .flatMap((message) => {
      if (message.role !== "system") return [];
      const text = contentToText(message.content);
      return text ? [text] : [];
    })
    .join("\n\n");

  const conversationMessages = messages.filter(
    (message) => message.role !== "system",
  );
  const input: ResponsesInputItem[] = [];

  const previousResponseIndex =
    store === true
      ? (() => {
          for (let i = conversationMessages.length - 1; i >= 0; i -= 1) {
            const message = conversationMessages[i];
            if (
              message?.role === "assistant" &&
              message.openaiResponseStored === true &&
              typeof message.openaiResponseId === "string" &&
              message.openaiResponseId.trim()
            ) {
              return i;
            }
          }
          return -1;
        })()
      : -1;

  const previousResponseId =
    previousResponseIndex >= 0
      ? conversationMessages[previousResponseIndex].openaiResponseId
      : undefined;
  const messagesToSend =
    previousResponseIndex >= 0
      ? conversationMessages.slice(previousResponseIndex + 1)
      : conversationMessages;

  for (const message of messagesToSend) {
    if (
      message.role === "assistant" &&
      Array.isArray(message.openaiResponsesOutput) &&
      message.openaiResponsesOutput.length > 0
    ) {
      input.push(...(message.openaiResponsesOutput as ResponsesInputItem[]));
      continue;
    }

    const content =
      message.role === "assistant"
        ? toResponsesOutputContent(message.content)
        : toResponsesInputContent(message.content);
    if (content.length > 0) {
      input.push({
        role: message.role as "user" | "assistant",
        content,
      });
    }
  }

  return {
    instructions: instructions || undefined,
    input: input.length > 0 ? input : "",
    previousResponseId,
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
  enableWebSearch?: boolean;
  webSearchMode?: OpenAIResponsesWebSearchMode;
}): ResponsesRequestPayload {
  const { instructions, input, previousResponseId } = toResponsesInput(
    params.messages,
    params.store,
  );
  const payload: ResponsesRequestPayload = {
    input,
    instructions,
    stream: params.stream,
    model: params.modelConfig.model,
  };

  if (previousResponseId) {
    payload.previous_response_id = previousResponseId;
  }

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
    if (params.store === false) {
      payload.include = ["reasoning.encrypted_content"];
    }
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

  if (params.enableWebSearch) {
    payload.tools = [{ type: "web_search" }];
    if (params.webSearchMode === "required") {
      payload.tool_choice = "required";
    }
  }

  if (supportsOpenAIResponsesSampling(params.modelConfig.model)) {
    payload.temperature = params.modelConfig.temperature;
    if (params.modelConfig.top_p !== 1) {
      payload.top_p = params.modelConfig.top_p;
    }
  }

  return payload;
}
