import { ApiPath, Google, REQUEST_TIMEOUT_MS } from "@/app/constant";
import {
  ChatOptions,
  LLMApi,
  LLMModel,
  LLMUsage,
  SpeechOptions,
} from "../types";
import { getHeadersAsync } from "../header-loader";
import {
  useAccessStore,
  useAppConfig,
  usePluginStore,
  ChatMessageTool,
} from "@/app/store";
import { stream } from "@/app/utils/chat";
import { getClientConfig } from "@/app/config/client";
import { GEMINI_BASE_URL } from "@/app/constant";

import {
  getMessageTextContent,
  getMessageImages,
  isVisionModel,
} from "@/app/utils";
import { preProcessImageContent } from "@/app/utils/chat";
import { nanoid } from "nanoid";
import { RequestPayload } from "./openai";
import { fetch } from "@/app/utils/stream";
import { withAbortTimeoutResponse } from "@/app/utils/request-timeout";
import {
  getPublicHttpErrorMessage,
  getPublicUpstreamErrorMessage,
  hasUpstreamErrorPayload,
  readResponsePayload,
} from "@/app/utils/public-error";
import Locale from "../../locales";
import { mergeLLMRequestConfig } from "../request-config";

export class GeminiProApi implements LLMApi {
  path(path: string, shouldStream = false): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";
    if (accessStore.useCustomConfig) {
      baseUrl = accessStore.googleUrl;
    }

    const isApp = !!getClientConfig()?.isApp;
    if (baseUrl.length === 0) {
      baseUrl = isApp ? GEMINI_BASE_URL : ApiPath.Google;
    }
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (!baseUrl.startsWith("http") && !baseUrl.startsWith(ApiPath.Google)) {
      baseUrl = "https://" + baseUrl;
    }

    let chatPath = [baseUrl, path].join("/");
    if (shouldStream) {
      chatPath += chatPath.includes("?") ? "&alt=sse" : "?alt=sse";
    }

    return chatPath;
  }
  extractMessage(res: any) {
    // 处理数组形式的响应（多个块）
    if (Array.isArray(res)) {
      // 合并所有文本块
      let fullText = "";
      for (const chunk of res) {
        const textPart = chunk?.candidates?.at(0)?.content?.parts?.at(0)?.text;
        if (textPart) {
          fullText += textPart;
        }
      }
      return fullText || "";
    }

    // 处理单个响应对象
    return (
      res?.candidates?.at(0)?.content?.parts.at(0)?.text ||
      res?.at(0)?.candidates?.at(0)?.content?.parts.at(0)?.text ||
      res?.error?.message ||
      ""
    );
  }
  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  async chat(options: ChatOptions): Promise<void> {
    const apiClient = this;
    let multimodal = false;

    // 添加联网状态日志
    console.log(
      "[Chat] Web Access:",
      options.pluginIds?.includes("googleSearch") ? "Enabled" : "Disabled",
    );

    // try get base64image from local cache image_url
    const _messages: ChatOptions["messages"] = await Promise.all(
      options.messages.map(async (v) => ({
        role: v.role,
        content: await preProcessImageContent(v.content),
      })),
    );

    // 只有当用户选择了 googleSearch 时才创建 tools
    const tools =
      options.allowTools === true && options.pluginIds?.includes("googleSearch")
        ? [
            {
              googleSearch: {},
            },
          ]
        : undefined;

    const messages = _messages.map((v) => {
      let parts: any[] = [{ text: getMessageTextContent(v) }];
      if (isVisionModel(options.config.model)) {
        const images = getMessageImages(v);
        if (images.length > 0) {
          multimodal = true;
          parts = parts.concat(
            images.map((image) => {
              const imageType = image.split(";")[0].split(":")[1];
              const imageData = image.split(",")[1];
              return {
                inline_data: {
                  mime_type: imageType,
                  data: imageData,
                },
              };
            }),
          );
        }
      }
      return {
        role: v.role.replace("assistant", "model").replace("system", "user"),
        parts: parts,
      };
    });

    // google requires that role in neighboring messages must not be the same
    for (let i = 0; i < messages.length - 1; ) {
      // Check if current and next item both have the role "model"
      if (messages[i].role === messages[i + 1].role) {
        // Concatenate the 'parts' of the current and next item
        messages[i].parts = messages[i].parts.concat(messages[i + 1].parts);
        // Remove the next item
        messages.splice(i + 1, 1);
      } else {
        // Move to the next item
        i++;
      }
    }
    // if (visionModel && messages.length > 1) {
    //   options.onError?.(new Error("Multiturn chat is not enabled for models/gemini-pro-vision"));
    // }

    const accessStore = useAccessStore.getState();

    const modelConfig = mergeLLMRequestConfig(
      useAppConfig.getState().modelConfig,
      useAppConfig.getState().modelConfig,
      options.config,
    );
    const requestPayload = {
      contents: messages,
      ...(tools ? { tools } : {}),
      generationConfig: {
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.max_output_tokens,
        topP: modelConfig.top_p,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: accessStore.googleSafetySettings,
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: accessStore.googleSafetySettings,
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: accessStore.googleSafetySettings,
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: accessStore.googleSafetySettings,
        },
      ],
    };

    let shouldStream = !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);
    try {
      // https://github.com/google-gemini/cookbook/blob/main/quickstarts/rest/Streaming_REST.ipynb
      const chatPath = this.path(
        Google.ChatPath(modelConfig.model),
        shouldStream,
      );

      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: await getHeadersAsync(false, modelConfig.providerName),
      };

      if (shouldStream) {
        const [, funcs] =
          options.allowTools === true
            ? usePluginStore.getState().getAsTools(options.pluginIds ?? [])
            : [[], {}];
        return stream(
          chatPath,
          requestPayload,
          await getHeadersAsync(false, modelConfig.providerName),
          tools || [], // 如果 tools 未定义，传入空数组
          funcs,
          controller,
          // parseSSE
          (text: string, runTools: ChatMessageTool[]) => {
            // console.log("parseSSE", text, runTools);
            const chunkJson = JSON.parse(text);

            // 处理函数调用
            const functionCall = chunkJson?.candidates
              ?.at(0)
              ?.content.parts.at(0)?.functionCall;
            if (functionCall) {
              const { name, args } = functionCall;
              runTools.push({
                id: nanoid(),
                type: "function",
                function: {
                  name,
                  arguments: JSON.stringify(args), // utils.chat call function, using JSON.parse
                },
              });
            }

            // 处理图像数据
            const part = chunkJson?.candidates?.at(0)?.content?.parts?.at(0);
            if (part?.inlineData) {
              // 检查是否有多个部分
              const parts = chunkJson?.candidates?.at(0)?.content?.parts;
              let textContent = "";

              // 查找其他部分中的文本内容
              if (parts && parts.length > 1) {
                for (let i = 1; i < parts.length; i++) {
                  if (parts[i].text) {
                    textContent += parts[i].text;
                  }
                }
              }

              // 返回图像数据和文本内容
              return JSON.stringify({
                data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                type: "base64_image",
                text: textContent,
              });
            }

            return chunkJson?.candidates?.at(0)?.content.parts.at(0)?.text;
          },
          // processToolMessage, include tool_calls message and tool call results
          (
            requestPayload: RequestPayload,
            toolCallMessage: any,
            toolCallResult: any[],
          ) => {
            // @ts-ignore
            requestPayload?.contents?.splice(
              // @ts-ignore
              requestPayload?.contents?.length,
              0,
              {
                role: "model",
                parts: toolCallMessage.tool_calls.map(
                  (tool: ChatMessageTool) => ({
                    functionCall: {
                      name: tool?.function?.name,
                      args: JSON.parse(tool?.function?.arguments as string),
                    },
                  }),
                ),
              },
              // @ts-ignore
              ...toolCallResult.map((result) => ({
                role: "function",
                parts: [
                  {
                    functionResponse: {
                      name: result.name,
                      response: {
                        name: result.name,
                        content: result.content, // TODO just text content...
                      },
                    },
                  },
                ],
              })),
            );
          },
          options,
        );
      } else {
        const { response: res, body: responseBody } =
          await withAbortTimeoutResponse({
            controller,
            timeoutMs: REQUEST_TIMEOUT_MS,
            operation: () => fetch(chatPath, chatPayload),
            consume: readResponsePayload,
          });
        const resJson = responseBody.payload as any;
        if (
          !res.ok ||
          !responseBody.isJson ||
          hasUpstreamErrorPayload(resJson)
        ) {
          throw new Error(
            getPublicHttpErrorMessage({
              response: res,
              payload: resJson ?? { message: responseBody.text },
              fallback:
                res.status === 401
                  ? Locale.Error.Unauthorized
                  : Locale.Error.RequestFailed(res.ok ? undefined : res.status),
              accessRestrictedMessage: Locale.Error.AccessRestricted,
            }),
          );
        }
        if (resJson?.promptFeedback?.blockReason) {
          throw new Error(
            getPublicUpstreamErrorMessage({
              fallback: Locale.Error.RequestFailed(),
              detail: resJson.promptFeedback.blockReason,
            }),
          );
        }
        const message = apiClient.extractMessage(resJson);
        if (!message) {
          throw new Error(Locale.Error.RequestFailed());
        }
        options.onFinish(message, res);
      }
    } catch (e) {
      console.error("[Google] chat request failed");
      options.onError?.(e as Error);
    }
  }
  usage(): Promise<LLMUsage> {
    throw new Error("Method not implemented.");
  }
  async models(): Promise<LLMModel[]> {
    return [];
  }
}
