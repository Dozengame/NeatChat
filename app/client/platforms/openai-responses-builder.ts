import type { ChatOptions, MultimodalContent } from "../types";
import type { ModelConfig } from "@/app/store";
import type { ResponsesFunctionTool } from "./openai-responses-tools";
import {
  clampOpenAIResponsesMaxOutputTokens,
  isOpenAIGpt56ModelConfig,
  isOpenAIResponsesReasoningModelConfig,
  isOpenAIResponsesTextVerbosityModelConfig,
  normalizeOpenAIResponsesReasoningEffort,
  parseOpenAIResponsesInputImageDetail,
  parseOpenAIResponsesPromptCacheKey,
  parseOpenAIResponsesPromptCacheMode,
  parseOpenAIResponsesReasoningContext,
  parseOpenAIResponsesReasoningMode,
  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
  OPENAI_RESPONSES_PROMPT_CACHE_TTL,
  OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY,
  supportsOpenAIResponsesSampling,
  supportsOpenAIResponsesStreaming,
  type OpenAIResponsesReasoningEffort,
  type OpenAIResponsesInputImageDetail,
  type OpenAIResponsesPromptCacheMode,
  type OpenAIResponsesReasoningContext,
  type OpenAIResponsesReasoningMode,
  type OpenAIResponsesTextVerbosity,
  type OpenAIResponsesWebSearchMode,
} from "@/app/utils/openai-responses";

export type ResponsesInputContent =
  | {
      type: "input_text";
      text: string;
      prompt_cache_breakpoint?: { mode: "explicit" };
    }
  | {
      type: "input_image";
      image_url: string;
      detail?: OpenAIResponsesInputImageDetail;
      prompt_cache_breakpoint?: { mode: "explicit" };
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

export type ResponsesTool = { type: "web_search" } | ResponsesFunctionTool;

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
    mode?: OpenAIResponsesReasoningMode;
    context?: OpenAIResponsesReasoningContext;
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
  prompt_cache_key?: string;
  prompt_cache_options?: {
    mode: Exclude<OpenAIResponsesPromptCacheMode, "disabled">;
    ttl: typeof OPENAI_RESPONSES_PROMPT_CACHE_TTL;
  };
}

function contentToText(content: string | MultimodalContent[]) {
  if (typeof content === "string") {
    return content;
  }

  return content
    .flatMap((part) => (part.type === "text" && part.text ? [part.text] : []))
    .join("\n");
}

function toResponsesInputContent(
  content: string | MultimodalContent[],
  imageDetail?: OpenAIResponsesInputImageDetail,
) {
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
          ...(imageDetail ? { detail: imageDetail } : {}),
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

function toResponsesInput(
  messages: ChatOptions["messages"],
  store?: boolean,
  imageDetail?: OpenAIResponsesInputImageDetail,
) {
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
        : toResponsesInputContent(message.content, imageDetail);
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

function addExplicitPromptCacheBreakpoint(input: ResponsesInputItem[]) {
  for (let itemIndex = input.length - 1; itemIndex >= 0; itemIndex -= 1) {
    const item = input[itemIndex] as {
      role?: string;
      content?: ResponsesMessageContent[];
    };
    if (item.role !== "user" || !Array.isArray(item.content)) continue;

    for (
      let contentIndex = item.content.length - 1;
      contentIndex >= 0;
      contentIndex -= 1
    ) {
      const content = item.content[contentIndex];
      if (content.type !== "input_text" && content.type !== "input_image") {
        continue;
      }
      content.prompt_cache_breakpoint = { mode: "explicit" };
      return true;
    }
  }

  return false;
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
  functionTools?: ResponsesFunctionTool[];
}): ResponsesRequestPayload {
  const isGpt56 = isOpenAIGpt56ModelConfig({
    model: params.modelConfig.model,
    providerName: params.modelConfig.providerName,
  });
  const supportsReasoning = isOpenAIResponsesReasoningModelConfig({
    model: params.modelConfig.model,
    providerName: params.modelConfig.providerName,
  });
  const supportsTextVerbosity = isOpenAIResponsesTextVerbosityModelConfig({
    model: params.modelConfig.model,
    providerName: params.modelConfig.providerName,
  });
  const inputImageDetail = isGpt56
    ? parseOpenAIResponsesInputImageDetail(params.modelConfig.inputImageDetail)
    : undefined;
  const { instructions, input, previousResponseId } = toResponsesInput(
    params.messages,
    params.store,
    inputImageDetail,
  );
  const payload: ResponsesRequestPayload = {
    input,
    instructions,
    stream:
      params.stream &&
      supportsOpenAIResponsesStreaming(params.modelConfig.model),
    model: params.modelConfig.model,
  };

  if (previousResponseId) {
    payload.previous_response_id = previousResponseId;
  }

  if (params.modelConfig.max_output_tokens > 0) {
    payload.max_output_tokens = clampOpenAIResponsesMaxOutputTokens(
      params.modelConfig.max_output_tokens,
      params.modelConfig.model,
    );
  }

  if (supportsReasoning) {
    payload.reasoning = {
      effort: normalizeOpenAIResponsesReasoningEffort(
        params.modelConfig.reasoningEffort ||
          OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
        params.modelConfig.model,
      ) as OpenAIResponsesReasoningEffort,
      summary: params.reasoningSummary,
      ...(isGpt56
        ? {
            mode: parseOpenAIResponsesReasoningMode(
              params.modelConfig.reasoningMode,
            ),
            context: parseOpenAIResponsesReasoningContext(
              params.modelConfig.reasoningContext,
            ),
          }
        : {}),
    };
    if (isGpt56 || params.store === false) {
      payload.include = ["reasoning.encrypted_content"];
    }
  }

  if (isGpt56) {
    const configuredCacheMode = parseOpenAIResponsesPromptCacheMode(
      params.modelConfig.promptCacheMode,
    );
    if (configuredCacheMode === "disabled") {
      payload.prompt_cache_options = {
        mode: "explicit",
        ttl: OPENAI_RESPONSES_PROMPT_CACHE_TTL,
      };
    } else {
      const hasExplicitBreakpoint =
        configuredCacheMode === "explicit" &&
        Array.isArray(payload.input) &&
        addExplicitPromptCacheBreakpoint(payload.input);
      const cacheMode = hasExplicitBreakpoint ? "explicit" : "implicit";
      payload.prompt_cache_options = {
        mode: cacheMode,
        ttl: OPENAI_RESPONSES_PROMPT_CACHE_TTL,
      };
      const promptCacheKey = parseOpenAIResponsesPromptCacheKey(
        params.modelConfig.promptCacheKey,
      );
      if (promptCacheKey) {
        payload.prompt_cache_key = promptCacheKey;
      }
    }
  }

  const verbosity = supportsTextVerbosity
    ? params.textVerbosity ??
      params.modelConfig.textVerbosity ??
      OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY
    : undefined;
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

  const functionTools =
    params.webSearchMode === "required" ? [] : params.functionTools ?? [];
  const tools: ResponsesTool[] = [
    ...(params.enableWebSearch ? [{ type: "web_search" as const }] : []),
    ...functionTools,
  ];
  if (tools.length > 0) {
    payload.tools = tools;
  }
  if (params.enableWebSearch) {
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
