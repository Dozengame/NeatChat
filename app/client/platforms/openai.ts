"use client";
// azure and openai, using same models. so using same LLMApi.
import {
  ApiPath,
  OPENAI_BASE_URL,
  DEFAULT_MODELS,
  OpenaiPath,
  Azure,
  REQUEST_TIMEOUT_MS,
  ServiceProvider,
} from "@/app/constant";
import {
  ChatMessageTool,
  useAccessStore,
  useAppConfig,
  useChatStore,
  usePluginStore,
} from "@/app/store";
import { collectModelsWithDefaultModel } from "@/app/utils/model";
import {
  preProcessImageContent,
  uploadImage,
  base64Image2Blob,
  cacheImageToBase64Image,
  stream,
} from "@/app/utils/chat";
import { cloudflareAIGatewayUrl } from "@/app/utils/cloudflare";
import {
  shouldUseOpenAIResponses,
  shouldRequireOpenAIResponsesWebSearch,
  supportsOpenAIResponsesWebSearch,
} from "@/app/utils/openai-responses";
import {
  buildOpenAIResponsesPayload,
  ResponsesRequestPayload,
} from "./openai-responses-builder";

import {
  ChatOptions,
  getHeaders,
  LLMApi,
  LLMModel,
  LLMUsage,
  MultimodalContent,
  SpeechOptions,
} from "../api";
import Locale from "../../locales";
import { getClientConfig } from "@/app/config/client";
import type { OpenAIImageOutputFormat } from "@/app/typing";
import {
  getMessageImages,
  getMessageTextContent,
  isVisionModel,
  getMessageTextContentWithoutThinking,
} from "@/app/utils";
import { fetch } from "@/app/utils/stream";
import {
  buildOpenAIImageEditFormData,
  buildOpenAIImageGenerationPayload,
  getOpenAIImageGenerationProgressContent,
  getOpenAIImageOutputContentType,
  isGptImageGenerationModel,
  isOpenAIImageGenerationModelConfig,
  type OpenAIImageGenerationRequestPayload,
} from "@/app/utils/openai-image";

const OPENAI_RESPONSES_TIMEOUT_MS = REQUEST_TIMEOUT_MS * 10;

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export type RequestPayload = Record<string, any>;

function dataUrlToBlob(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.*)$/);
  if (!match) {
    throw new Error("invalid image data url");
  }
  return base64Image2Blob(match[2], match[1]);
}

function getImageFilename(index: number, blob: Blob) {
  const extension =
    blob.type === "image/jpeg"
      ? "jpg"
      : blob.type === "image/webp"
      ? "webp"
      : "png";
  return `image-${index}.${extension}`;
}

function normalizeOpenAIImageOutputFormat(
  value: FormDataEntryValue | OpenAIImageOutputFormat | null | undefined,
): OpenAIImageOutputFormat | undefined {
  if (value === "png" || value === "jpeg" || value === "webp") {
    return value;
  }
  return undefined;
}

async function loadOpenAIImageInput(imageUrl: string, index: number) {
  try {
    if (imageUrl.startsWith("data:image/")) {
      const blob = dataUrlToBlob(imageUrl);
      return { blob, filename: getImageFilename(index, blob) };
    }

    const response = await fetch(imageUrl, {
      method: "GET",
      mode: "cors",
      credentials: "include",
    });
    if (response.ok) {
      const blob = await response.blob();
      return { blob, filename: getImageFilename(index, blob) };
    }
  } catch (error) {
    console.warn("[OpenAI Image] failed to load image url directly", error);
  }

  const dataUrl = await cacheImageToBase64Image(imageUrl);
  const blob = dataUrlToBlob(dataUrl);
  return { blob, filename: getImageFilename(index, blob) };
}

function getOpenAIErrorMessage(resJson: any, status: number) {
  const detail =
    typeof resJson?.error?.message === "string"
      ? resJson.error.message
      : typeof resJson?.message === "string"
      ? resJson.message
      : typeof resJson?.msg === "string"
      ? resJson.msg
      : "";
  const code =
    typeof resJson?.error?.code === "string"
      ? resJson.error.code
      : typeof resJson?.code === "string"
      ? resJson.code
      : String(status);
  return detail
    ? `OpenAI image generation failed (${code}): ${detail}`
    : `OpenAI image generation failed (${code})`;
}

export interface AzureChatRequestPayload {
  messages: {
    role: "system" | "user" | "assistant";
    content: string | MultimodalContent[];
  }[];
  stream?: boolean;
  model: string;
  temperature: number;
  presence_penalty: number;
  frequency_penalty: number;
  top_p: number;
}


export function extractResponsesText(res: any) {
  const outputText =
    typeof res?.output_text === "string" ? res.output_text : undefined;
  const parts: string[] = [];
  const citations = new Map<string, string>();
  for (const output of res?.output ?? []) {
    if (Array.isArray(output?.content)) {
      for (const content of output.content) {
        if (content?.type === "output_text" && content.text) {
          parts.push(content.text);
          for (const annotation of content.annotations ?? []) {
            if (annotation?.type === "url_citation" && annotation.url) {
              citations.set(annotation.url, annotation.title || annotation.url);
            }
          }
        }
      }
    }
  }

  const text = parts.join("") || outputText || "";
  if (citations.size === 0) {
    return text;
  }

  const sources = Array.from(citations.entries())
    .map(([url, title]) => `- [${title}](${url})`)
    .join("\n");

  return `${text}\n\n来源：\n${sources}`;
}

export function parseResponsesSSE(text: string) {
  const json = JSON.parse(text);

  if (
    json.type === "response.output_text.delta" ||
    json.type === "response.refusal.delta"
  ) {
    return json.delta as string | undefined;
  }

  if (json.type === "response.reasoning_summary_text.delta") {
    return json.delta as string | undefined;
  }

  if (
    json.type === "response.created" ||
    json.type === "response.queued" ||
    json.type === "response.in_progress" ||
    json.type === "response.reasoning_summary_part.added"
  ) {
    return "<think>\n正在推理...";
  }

  if (json.type === "response.error" && json.error) {
    return "```\n" + JSON.stringify(json.error, null, 4) + "\n```";
  }
}

export class ChatGPTApi implements LLMApi {
  private disableListModels = true;

  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    const isAzure = path.includes("deployments");
    const openAIEndpointLocked =
      !isAzure &&
      (accessStore.hideUserApiKey ||
        accessStore.lockedFields?.includes("baseUrl"));
    if (accessStore.useCustomConfig && !openAIEndpointLocked) {
      if (isAzure && !accessStore.isValidAzure()) {
        throw Error(
          "incomplete azure config, please check it in your settings page",
        );
      }

      baseUrl = isAzure ? accessStore.azureUrl : accessStore.openaiUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      const apiPath = isAzure ? ApiPath.Azure : ApiPath.OpenAI;
      baseUrl = isApp ? OPENAI_BASE_URL : apiPath;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (
      !baseUrl.startsWith("http") &&
      !isAzure &&
      !baseUrl.startsWith(ApiPath.OpenAI)
    ) {
      baseUrl = "https://" + baseUrl;
    }

    console.log("[Proxy Endpoint] ", baseUrl, path);

    // try rebuild url, when using cloudflare ai gateway in client
    return cloudflareAIGatewayUrl([baseUrl, path].join("/"));
  }

  async extractMessage(
    res: any,
    options?: {
      imageContentType?: string;
    },
  ) {
    if (res.error) {
      if (typeof res.msg === "string" && res.msg.trim()) {
        return res.msg;
      }
      return "```\n" + JSON.stringify(res, null, 4) + "\n```";
    }
    const responsesText = extractResponsesText(res);
    if (responsesText) {
      return responsesText;
    }
    // dalle3 model return url, using url create image message
    if (res.data) {
      let url = res.data?.at(0)?.url ?? "";
      const b64_json = res.data?.at(0)?.b64_json ?? "";
      if (!url && b64_json) {
        // uploadImage
        url = await uploadImage(
          base64Image2Blob(
            b64_json,
            options?.imageContentType ?? "image/png",
          ),
        );
      }
      return [
        {
          type: "image_url",
          image_url: {
            url,
          },
        },
      ];
    }
    return res.choices?.at(0)?.message?.content ?? res;
  }

  async speech(options: SpeechOptions): Promise<ArrayBuffer> {
    const requestPayload = {
      model: options.model,
      input: options.input,
      voice: options.voice,
      response_format: options.response_format,
      speed: options.speed,
    };

    console.log("[Request] openai speech payload: ", requestPayload);

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const speechPath = this.path(OpenaiPath.SpeechPath);
      const speechPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: getHeaders(),
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      const res = await fetch(speechPath, speechPayload);
      clearTimeout(requestTimeoutId);
      return await res.arrayBuffer();
    } catch (e) {
      console.log("[Request] failed to make a speech request", e);
      throw e;
    }
  }

  async chat(options: ChatOptions) {
    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
        providerName: options.config.providerName,
      },
    };
    const accessStore = useAccessStore.getState();
    const isImageGeneration = isOpenAIImageGenerationModelConfig({
      model: options.config.model,
      providerName: options.config.providerName,
    });
    let openaiResponseId: string | undefined;
    let openaiResponsesOutput: unknown[] | undefined;
    const useResponses =
      !isImageGeneration &&
      shouldUseOpenAIResponses({
        model: modelConfig.model,
        providerName: modelConfig.providerName,
      });
    const storeResponses =
      modelConfig.store ??
      accessStore.serverConfigSnapshot?.defaults.store ??
      false;
    let requestPayload:
      | AzureChatRequestPayload
      | ResponsesRequestPayload
      | OpenAIImageGenerationRequestPayload
      | FormData;

    if (isImageGeneration) {
      const latestMessage = options.messages.slice(-1)?.pop() as any;
      const prompt = getMessageTextContent(latestMessage);
      const imageUrls = getMessageImages(latestMessage);
      if (
        imageUrls.length > 0 &&
        isGptImageGenerationModel(modelConfig.model)
      ) {
        const images = await Promise.all(
          imageUrls.map((url, index) => loadOpenAIImageInput(url, index)),
        );
        requestPayload = buildOpenAIImageEditFormData({
          model: modelConfig.model,
          prompt,
          config: modelConfig,
          images,
        });
      } else {
        requestPayload = buildOpenAIImageGenerationPayload({
          model: modelConfig.model,
          prompt,
          config: modelConfig,
        });
      }
    } else {
      const visionModel = isVisionModel(options.config.model);
      const messages: ChatOptions["messages"] = [];
      for (const v of options.messages) {
        const content =
          visionModel || Array.isArray(v.content)
            ? await preProcessImageContent(v.content)
            : v.role === "assistant" // 如果 role 是 assistant
            ? getMessageTextContentWithoutThinking(v) // 调用 getMessageTextContentWithoutThinking
            : getMessageTextContent(v); // 否则调用 getMessageTextContent
        messages.push({ role: v.role, content });
      }

      if (useResponses) {
        const enableWebSearch = supportsOpenAIResponsesWebSearch({
          model: modelConfig.model,
          providerName: modelConfig.providerName || ServiceProvider.OpenAI,
        });
        const latestUserText =
          messages
            .filter((message) => message.role === "user")
            .map((message) => getMessageTextContent(message as any))
            .at(-1) ?? "";
        const webSearchMode =
          enableWebSearch &&
          shouldRequireOpenAIResponsesWebSearch(latestUserText)
            ? "required"
            : "auto";

        requestPayload = buildOpenAIResponsesPayload({
          messages,
          modelConfig: {
            ...modelConfig,
            providerName: (modelConfig.providerName ||
              ServiceProvider.OpenAI) as ServiceProvider,
            max_output_tokens:
              accessStore.openaiMaxOutputTokens ??
              modelConfig.max_output_tokens,
            textVerbosity:
              modelConfig.textVerbosity ??
              (accessStore.openaiTextVerbosity as any),
          },
          stream: options.config.stream,
          reasoningSummary: "auto",
          truncation: "disabled",
          store: storeResponses,
          enableWebSearch,
          webSearchMode,
        });
      } else {
        requestPayload = {
          messages,
          stream: options.config.stream,
          model: modelConfig.model,
          temperature: modelConfig.temperature,
          presence_penalty: modelConfig.presence_penalty,
          frequency_penalty: modelConfig.frequency_penalty,
          top_p: modelConfig.top_p,
        };
      }
    }

    console.log(
      useResponses
        ? "[Request] openai responses payload: "
        : "[Request] openai payload: ",
      requestPayload,
    );

    const shouldStream = !isImageGeneration && !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      let chatPath = "";
      if (modelConfig.providerName === ServiceProvider.Azure) {
        // find model, and get displayName as deployName
        const { models: configModels, customModels: configCustomModels } =
          useAppConfig.getState();
        const {
          defaultModel,
          customModels: accessCustomModels,
          useCustomConfig,
        } = useAccessStore.getState();
        const models = collectModelsWithDefaultModel(
          configModels,
          [configCustomModels, accessCustomModels].join(","),
          defaultModel,
        );
        const model = models.find(
          (model) =>
            model.name === modelConfig.model &&
            model?.provider?.providerName === ServiceProvider.Azure,
        );
        chatPath = this.path(
          (isImageGeneration ? Azure.ImagePath : Azure.ChatPath)(
            (model?.displayName ?? model?.name) as string,
            useCustomConfig ? useAccessStore.getState().azureApiVersion : "",
          ),
        );
      } else {
        chatPath = this.path(
          isImageGeneration
            ? requestPayload instanceof FormData
              ? OpenaiPath.ImageEditPath
              : OpenaiPath.ImagePath
            : OpenaiPath.ResponsesPath,
        );
      }
      if (shouldStream) {
        let index = -1;
        let isInThinking = false;
        let hasResponsesOutput = false;
        const session = useChatStore.getState().currentSession();

        // 获取所有插件工具
        const [allTools, funcs] = usePluginStore
          .getState()
          .getAsTools(session.mask?.plugin || []);

        const webAccessState = useResponses
          ? supportsOpenAIResponsesWebSearch({
              model: modelConfig.model,
              providerName: modelConfig.providerName || ServiceProvider.OpenAI,
            })
            ? "Auto"
            : "Unsupported"
          : session.mask?.plugin?.includes("googleSearch")
          ? "Enabled"
          : "Disabled";

        // 添加联网状态日志
        console.log("[Chat] Web Access:", webAccessState);

        // 特殊处理gemini模型的联网功能
        // 如果是gemini-2.0-flash-exp且用户选择了googleSearch，使用特定的tools
        // 否则使用常规插件tools
        const useGoogleSearch = session.mask?.plugin?.includes("googleSearch");
        const isGeminiFlash = modelConfig.model === "gemini-2.0-flash-exp";

        const tools = useResponses
          ? []
          : isGeminiFlash && useGoogleSearch
          ? [
              {
                type: "function",
                function: {
                  name: "googleSearch",
                },
              },
            ]
          : Array.isArray(allTools)
          ? allTools
          : [];

        stream(
          chatPath,
          {
            ...requestPayload,
            ...(Array.isArray(tools) && tools.length > 0 ? { tools } : {}),
          },
          getHeaders(),
          Array.isArray(tools) ? tools : [],
          funcs,
          controller,
          // parseSSE
          (text: string, runTools: ChatMessageTool[]) => {
            if (useResponses) {
              const json = JSON.parse(text);
              if (typeof json.response?.id === "string") {
                openaiResponseId = json.response.id;
              }
              if (Array.isArray(json.response?.output)) {
                openaiResponsesOutput = json.response.output;
              }
              if (
                json.type === "response.output_text.delta" ||
                json.type === "response.refusal.delta"
              ) {
                const chunk = json.delta as string | undefined;
                if (!chunk) return;
                const replace = !hasResponsesOutput;
                hasResponsesOutput = true;
                isInThinking = false;
                return { content: chunk, replace };
              }

              if (json.type === "response.reasoning_summary_text.delta") {
                const reasoning = json.delta as string | undefined;
                if (!reasoning) return;
                if (!isInThinking) {
                  isInThinking = true;
                  return "<think>\n" + reasoning;
                }
                return reasoning;
              }

              if (
                !hasResponsesOutput &&
                (json.type === "response.created" ||
                  json.type === "response.queued" ||
                  json.type === "response.in_progress" ||
                  json.type === "response.reasoning_summary_part.added")
              ) {
                if (!isInThinking) {
                  isInThinking = true;
                  return "<think>\n正在推理...";
                }
                return;
              }

              if (json.type === "response.completed" && json.response) {
                const finalText = extractResponsesText(json.response);
                if (finalText) {
                  return {
                    content: finalText,
                    replace: true,
                  };
                }
              }

              if (json.type === "response.error" && json.error) {
                return {
                  content:
                    "```\n" + JSON.stringify(json.error, null, 4) + "\n```",
                  replace: true,
                };
              }

              return parseResponsesSSE(text);
            }

            // console.log("parseSSE", text, runTools);
            const json = JSON.parse(text);
            const choices = json.choices as Array<{
              delta: {
                content: string | undefined;
                tool_calls: ChatMessageTool[];
                reasoning_content: string | undefined;
              };
            }>;
            const tool_calls = choices[0]?.delta?.tool_calls;
            if (tool_calls?.length > 0) {
              const id = tool_calls[0]?.id;
              let args = tool_calls[0]?.function?.arguments;
              // @ts-ignore
              if (!(args.length > 0)) {
                args = "";
              }
              if (id) {
                index += 1;
                runTools.push({
                  id,
                  type: tool_calls[0]?.type,
                  function: {
                    name: tool_calls[0]?.function?.name as string,
                    arguments: args,
                  },
                });
              } else {
                // @ts-ignore
                runTools[index]["function"]["arguments"] += args;
              }
            }
            const reasoning = choices[0]?.delta?.reasoning_content;
            const content = choices[0]?.delta?.content;

            if (reasoning && reasoning.length > 0) {
              if (!isInThinking) {
                isInThinking = true;
                return "<think>\n" + reasoning;
              } else {
                return reasoning;
              }
            }

            if (content && content.length > 0) {
              if (isInThinking) {
                isInThinking = false;
                return "\n</think>\n\n" + content;
              } else {
                return content;
              }
            }
            return choices[0]?.delta?.content;
          },
          // processToolMessage, include tool_calls message and tool call results
          (
            requestPayload: AzureChatRequestPayload,
            toolCallMessage: any,
            toolCallResult: any[],
          ) => {
            // reset index value
            index = -1;
            // @ts-ignore
            requestPayload?.messages?.splice(
              // @ts-ignore
              requestPayload?.messages?.length,
              0,
              toolCallMessage,
              ...toolCallResult,
            );
          },
          options,
          useResponses ? OPENAI_RESPONSES_TIMEOUT_MS : REQUEST_TIMEOUT_MS,
          {
            getMetadata: () => ({
              openaiResponseId,
              openaiResponseStored: storeResponses,
              openaiResponsesOutput,
            }),
          },
        );
      } else {
        const multipartPayload =
          requestPayload instanceof FormData ? requestPayload : undefined;
        const isMultipartRequest = !!multipartPayload;
        const imageOutputFormat = normalizeOpenAIImageOutputFormat(
          multipartPayload
            ? multipartPayload.get("output_format")
            : "output_format" in requestPayload
            ? requestPayload.output_format
            : undefined,
        );
        const chatPayload: RequestInit = {
          method: "POST",
          body: multipartPayload ?? JSON.stringify(requestPayload),
          signal: controller.signal,
          headers: getHeaders(isMultipartRequest),
        };

        if (isImageGeneration) {
          options.onUpdate?.(
            getOpenAIImageGenerationProgressContent({
              model: modelConfig.model,
              phase: "generating",
            }),
            "",
          );
        }

        // make a fetch request
        const requestTimeoutId = setTimeout(
          () => controller.abort(),
          useResponses
            ? OPENAI_RESPONSES_TIMEOUT_MS
            : isImageGeneration
            ? REQUEST_TIMEOUT_MS * 4
            : REQUEST_TIMEOUT_MS, // dalle3 using b64_json is slow.
        );

        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        if (isImageGeneration) {
          options.onUpdate?.(
            getOpenAIImageGenerationProgressContent({
              model: modelConfig.model,
              phase: "saving",
            }),
            "",
          );
        }
        if (isImageGeneration && (!res.ok || resJson?.error)) {
          throw new Error(getOpenAIErrorMessage(resJson, res.status));
        }
        const message = await this.extractMessage(resJson, {
          imageContentType:
            isImageGeneration && imageOutputFormat
              ? getOpenAIImageOutputContentType(imageOutputFormat)
              : undefined,
        });
        options.onFinish(
          message,
          res,
          useResponses
            ? {
                openaiResponseId:
                  typeof resJson?.id === "string" ? resJson.id : undefined,
                openaiResponseStored: storeResponses,
                openaiResponsesOutput: Array.isArray(resJson?.output)
                  ? resJson.output
                  : undefined,
              }
            : undefined,
        );
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }
  async usage() {
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
    const ONE_DAY = 1 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = formatDate(startOfMonth);
    const endDate = formatDate(new Date(Date.now() + ONE_DAY));

    const [used, subs] = await Promise.all([
      fetch(
        this.path(
          `${OpenaiPath.UsagePath}?start_date=${startDate}&end_date=${endDate}`,
        ),
        {
          method: "GET",
          headers: getHeaders(),
        },
      ),
      fetch(this.path(OpenaiPath.SubsPath), {
        method: "GET",
        headers: getHeaders(),
      }),
    ]);

    if (used.status === 401) {
      throw new Error(Locale.Error.Unauthorized);
    }

    if (!used.ok || !subs.ok) {
      throw new Error("Failed to query usage from openai");
    }

    const response = (await used.json()) as {
      total_usage?: number;
      error?: {
        type: string;
        message: string;
      };
    };

    const total = (await subs.json()) as {
      hard_limit_usd?: number;
    };

    if (response.error && response.error.type) {
      throw Error(response.error.message);
    }

    if (response.total_usage) {
      response.total_usage = Math.round(response.total_usage) / 100;
    }

    if (total.hard_limit_usd) {
      total.hard_limit_usd = Math.round(total.hard_limit_usd * 100) / 100;
    }

    return {
      used: response.total_usage,
      total: total.hard_limit_usd,
    } as LLMUsage;
  }

  async models(): Promise<LLMModel[]> {
    if (this.disableListModels) {
      return DEFAULT_MODELS.slice();
    }

    const res = await fetch(this.path(OpenaiPath.ListModelPath), {
      method: "GET",
      headers: {
        ...getHeaders(),
      },
    });

    const resJson = (await res.json()) as OpenAIListModelResponse;
    const chatModels = resJson.data?.filter(
      (m) => m.id.startsWith("gpt-") || m.id.startsWith("chatgpt-"),
    );
    console.log("[Models]", chatModels);

    if (!chatModels) {
      return [];
    }

    //由于目前 OpenAI 的 disableListModels 默认为 true，所以当前实际不会运行到这场
    let seq = 1000; //同 Constant.ts 中的排序保持一致
    return chatModels.map((m) => ({
      name: m.id,
      available: true,
      sorted: seq++,
      provider: {
        id: "openai",
        providerName: "OpenAI",
        providerType: "openai",
        sorted: 1,
      },
    }));
  }
}
export { OpenaiPath };
