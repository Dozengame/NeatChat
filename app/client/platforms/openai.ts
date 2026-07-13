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
import type { ModelConfig } from "@/app/store/config";
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
  shouldEnableOpenAIResponsesWebSearch,
  isOpenAIGpt56ModelConfig,
  supportsOpenAIResponsesWebSearch,
} from "@/app/utils/openai-responses";
import {
  buildOpenAIResponsesPayload,
  ResponsesRequestPayload,
} from "./openai-responses-builder";
import {
  adaptPluginToolsForResponses,
  extractOpenAIResponsesText,
  hasPendingResponsesToolRecovery,
  runOpenAIResponsesToolLoop,
  sendOpenAIResponsesSseRound,
  type PluginFunctionExecutor,
  type ResponsesFunctionTool,
} from "./openai-responses-tools";

import {
  ChatOptions,
  LLMApi,
  LLMModel,
  LLMUsage,
  MultimodalContent,
  SpeechOptions,
} from "../types";
import { getHeadersAsync } from "../header-loader";
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
import { withAbortTimeoutResponse } from "@/app/utils/request-timeout";
import { isAccessRestrictedPublicError } from "@/app/utils/public-error";
import { mergeLLMRequestConfig } from "../request-config";
import {
  OPENAI_IMAGE_REQUEST_TIMEOUT_MS,
  abortOpenAIImageRequest,
  buildOpenAIImageEditFormData,
  buildOpenAIImageGenerationPayload,
  getOpenAIImageGenerationProgressContent,
  getOpenAIImageErrorMessage,
  getOpenAIImageOutputContentType,
  isGptImageGenerationModel,
  isOpenAIImageGenerationModelConfig,
  parseOpenAIImageResponsePayload,
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
      if (isAccessRestrictedPublicError(res)) {
        return Locale.Error.AccessRestricted;
      }
      if (typeof res.msg === "string" && res.msg.trim()) {
        return res.msg;
      }
      return "```\n" + JSON.stringify(res, null, 4) + "\n```";
    }
    const responsesText = extractOpenAIResponsesText(res);
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
          base64Image2Blob(b64_json, options?.imageContentType ?? "image/png"),
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
        headers: await getHeadersAsync(),
      };

      const { body } = await withAbortTimeoutResponse({
        controller,
        timeoutMs: REQUEST_TIMEOUT_MS,
        operation: () => fetch(speechPath, speechPayload),
        consume: (response) => response.arrayBuffer(),
      });
      return body;
    } catch (e) {
      console.log("[Request] failed to make a speech request", e);
      throw e;
    }
  }

  async chat(options: ChatOptions) {
    const modelConfig = mergeLLMRequestConfig(
      useAppConfig.getState().modelConfig,
      useChatStore.getState().currentSession().mask.modelConfig,
      options.config,
    ) as ModelConfig;
    const accessStore = useAccessStore.getState();
    const isImageGeneration = isOpenAIImageGenerationModelConfig({
      model: options.config.model,
      providerName: options.config.providerName,
    });
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
    let responsesFunctionTools: ResponsesFunctionTool[] = [];
    let responsesFunctionExecutors: Record<string, PluginFunctionExecutor> = {};
    if (
      useResponses &&
      options.config.stream &&
      options.allowTools === true &&
      isOpenAIGpt56ModelConfig({
        model: modelConfig.model,
        providerName: modelConfig.providerName,
      })
    ) {
      const session = useChatStore.getState().currentSession();
      try {
        if (!hasPendingResponsesToolRecovery(session.messages)) {
          const [pluginTools, pluginExecutors] = usePluginStore
            .getState()
            .getAsTools(session.mask?.plugin || []);
          if (Array.isArray(pluginTools) && pluginTools.length > 0) {
            const adapted = adaptPluginToolsForResponses(
              pluginTools,
              pluginExecutors as Record<string, PluginFunctionExecutor>,
            );
            responsesFunctionTools = adapted.tools;
            responsesFunctionExecutors = adapted.executors;
          }
        }
      } catch (error) {
        options.onError?.(
          error instanceof Error ? error : new Error(String(error)),
        );
        return;
      }
    }
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
      const messages: ChatOptions["messages"] = await Promise.all(
        options.messages.map(async (v) => {
          const content =
            visionModel || Array.isArray(v.content)
              ? await preProcessImageContent(v.content)
              : v.role === "assistant" // 如果 role 是 assistant
              ? getMessageTextContentWithoutThinking(v) // 调用 getMessageTextContentWithoutThinking
              : getMessageTextContent(v); // 否则调用 getMessageTextContent
          return {
            role: v.role,
            content,
            ...(useResponses
              ? {
                  openaiResponseId: v.openaiResponseId,
                  openaiResponseStored: v.openaiResponseStored,
                  openaiResponsesOutput: v.openaiResponsesOutput,
                }
              : {}),
          };
        }),
      );

      if (useResponses) {
        const enableWebSearch =
          supportsOpenAIResponsesWebSearch({
            model: modelConfig.model,
            providerName: modelConfig.providerName || ServiceProvider.OpenAI,
          }) && options.allowTools === true;
        const latestUserText =
          messages.reduce<string | undefined>(
            (latest, message) =>
              message.role === "user"
                ? getMessageTextContent(message as any)
                : latest,
            undefined,
          ) ?? "";
        const shouldEnableWebSearch =
          enableWebSearch &&
          shouldEnableOpenAIResponsesWebSearch(latestUserText);
        const webSearchMode =
          shouldEnableWebSearch &&
          shouldRequireOpenAIResponsesWebSearch(latestUserText)
            ? "required"
            : undefined;
        if (webSearchMode === "required") {
          responsesFunctionTools = [];
          responsesFunctionExecutors = {};
        }

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
          enableWebSearch: shouldEnableWebSearch,
          webSearchMode,
          functionTools: responsesFunctionTools,
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
        if (useResponses) {
          const headers = await getHeadersAsync(
            false,
            modelConfig.providerName,
          );
          await runOpenAIResponsesToolLoop({
            initialPayload: requestPayload as ResponsesRequestPayload,
            executors: responsesFunctionExecutors,
            controller,
            sendRound: (payload) =>
              sendOpenAIResponsesSseRound({
                url: chatPath,
                headers,
                payload,
                controller,
                timeoutMs: OPENAI_RESPONSES_TIMEOUT_MS,
                onUpdate: options.onUpdate,
              }),
            callbacks: options,
            timeoutMs: OPENAI_RESPONSES_TIMEOUT_MS,
          });
          return;
        }

        let index = -1;
        let isInThinking = false;
        let hasResponsesOutput = false;
        const session = useChatStore.getState().currentSession();

        // 获取所有插件工具
        const [allTools, funcs] =
          options.allowTools === true
            ? usePluginStore.getState().getAsTools(session.mask?.plugin || [])
            : [[], {}];

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
        const useGoogleSearch =
          options.allowTools === true &&
          session.mask?.plugin?.includes("googleSearch");
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
          await getHeadersAsync(false, modelConfig.providerName),
          Array.isArray(tools) ? tools : [],
          funcs,
          controller,
          // parseSSE
          (text: string, runTools: ChatMessageTool[]) => {
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
          REQUEST_TIMEOUT_MS,
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
          headers: await getHeadersAsync(
            isMultipartRequest,
            modelConfig.providerName,
          ),
        };

        if (isImageGeneration) {
          options.onUpdate?.(
            getOpenAIImageGenerationProgressContent({
              model: modelConfig.model,
              phase: "generating",
              copy: Locale.Chat.ImageGeneration.Progress,
            }),
            "",
          );
        }

        // make a fetch request
        const requestTimeoutMs = useResponses
          ? OPENAI_RESPONSES_TIMEOUT_MS
          : isImageGeneration
          ? OPENAI_IMAGE_REQUEST_TIMEOUT_MS
          : REQUEST_TIMEOUT_MS;
        const { response: res, body: resJson } = await withAbortTimeoutResponse(
          {
            controller,
            timeoutMs: requestTimeoutMs,
            onTimeout: isImageGeneration
              ? () => abortOpenAIImageRequest(controller, requestTimeoutMs)
              : undefined,
            operation: () => fetch(chatPath, chatPayload),
            consume: async (response) =>
              isImageGeneration
                ? parseOpenAIImageResponsePayload({
                    status: response.status,
                    bodyText: await response.text(),
                  })
                : response.json(),
          },
        );
        if (isImageGeneration && (!res.ok || resJson?.error)) {
          throw new Error(
            getOpenAIImageErrorMessage({
              status: res.status,
              payload: resJson,
              accessRestrictedMessage: Locale.Error.AccessRestricted,
            }),
          );
        }
        if (isImageGeneration) {
          options.onUpdate?.(
            getOpenAIImageGenerationProgressContent({
              model: modelConfig.model,
              phase: "saving",
              copy: Locale.Chat.ImageGeneration.Progress,
            }),
            "",
          );
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
          headers: await getHeadersAsync(),
        },
      ),
      fetch(this.path(OpenaiPath.SubsPath), {
        method: "GET",
        headers: await getHeadersAsync(),
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
        ...(await getHeadersAsync()),
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
