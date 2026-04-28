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
  stream,
} from "@/app/utils/chat";
import { cloudflareAIGatewayUrl } from "@/app/utils/cloudflare";
import { DalleSize, DalleQuality, DalleStyle } from "@/app/typing";
import {
  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
  OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY,
  OpenAIResponsesReasoningEffort,
  OpenAIResponsesTextVerbosity,
  shouldUseOpenAIResponses,
} from "@/app/utils/openai-responses";

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
import {
  getMessageTextContent,
  isVisionModel,
  isDalle3 as _isDalle3,
  getMessageTextContentWithoutThinking,
} from "@/app/utils";
import { fetch } from "@/app/utils/stream";

const OPENAI_RESPONSES_TIMEOUT_MS = REQUEST_TIMEOUT_MS * 10;

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export interface RequestPayload {
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
  max_tokens?: number;
  max_completion_tokens?: number;
}

export interface DalleRequestPayload {
  model: string;
  prompt: string;
  response_format: "url" | "b64_json";
  n: number;
  size: DalleSize;
  quality: DalleQuality;
  style: DalleStyle;
}

type ResponsesInputContent =
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
        content: string | ResponsesInputContent[];
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
    verbosity: OpenAIResponsesTextVerbosity;
  };
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
    return content;
  }

  const parts = content
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

  return parts.length > 0 ? parts : "";
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
    }));

  return {
    instructions: instructions || undefined,
    input: input.length > 0 ? input : "",
  };
}

export function extractResponsesText(res: any) {
  if (typeof res?.output_text === "string") {
    return res.output_text;
  }

  const parts: string[] = [];
  for (const output of res?.output ?? []) {
    if (Array.isArray(output?.content)) {
      for (const content of output.content) {
        if (content?.type === "output_text" && content.text) {
          parts.push(content.text);
        }
      }
    }
  }

  return parts.join("");
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
    if (accessStore.useCustomConfig) {
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

  async extractMessage(res: any) {
    if (res.error) {
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
        url = await uploadImage(base64Image2Blob(b64_json, "image/png"));
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
    const useResponses = shouldUseOpenAIResponses({
      enabled: accessStore.openaiResponsesMode,
      model: modelConfig.model,
      providerName: modelConfig.providerName,
    });

    let requestPayload:
      | RequestPayload
      | ResponsesRequestPayload
      | DalleRequestPayload;

    const isDalle3 = _isDalle3(options.config.model);
    const isO1 = options.config.model.startsWith("o1");
    if (isDalle3) {
      const prompt = getMessageTextContent(
        options.messages.slice(-1)?.pop() as any,
      );
      requestPayload = {
        model: options.config.model,
        prompt,
        // URLs are only valid for 60 minutes after the image has been generated.
        response_format: "b64_json", // using b64_json, and save image in CacheStorage
        n: 1,
        size: options.config?.size ?? "1024x1024",
        quality: options.config?.quality ?? "standard",
        style: options.config?.style ?? "vivid",
      };
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
        if (!(isO1 && v.role === "system"))
          messages.push({ role: v.role, content });
      }

      if (useResponses) {
        const responsesInput = toResponsesInput(messages);
        requestPayload = {
          ...responsesInput,
          stream: options.config.stream,
          model: modelConfig.model,
          max_output_tokens:
            modelConfig.max_tokens > 0 ? modelConfig.max_tokens : undefined,
          reasoning: {
            effort: (modelConfig.reasoningEffort ||
              OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT) as OpenAIResponsesReasoningEffort,
            summary: "auto",
          },
          text: {
            verbosity: (accessStore.openaiTextVerbosity ||
              OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY) as OpenAIResponsesTextVerbosity,
          },
        };
      } else {
        // O1 not support image, tools (plugin in ChatGPTNextWeb) and system, stream, logprobs, temperature, top_p, n, presence_penalty, frequency_penalty yet.
        requestPayload = {
          messages,
          stream: options.config.stream,
          model: modelConfig.model,
          temperature: !isO1 ? modelConfig.temperature : 1,
          presence_penalty: !isO1 ? modelConfig.presence_penalty : 0,
          frequency_penalty: !isO1 ? modelConfig.frequency_penalty : 0,
          top_p: !isO1 ? modelConfig.top_p : 1,
          // max_tokens: Math.max(modelConfig.max_tokens, 1024),
          // Please do not ask me why not send max_tokens, no reason, this param is just shit, I dont want to explain anymore.
        };
      }

      // O1 使用 max_completion_tokens 控制token数 (https://platform.openai.com/docs/guides/reasoning#controlling-costs)
      if (!useResponses && isO1) {
        (requestPayload as RequestPayload).max_completion_tokens =
          modelConfig.max_tokens;
      }

      // add max_tokens to vision model
      if (!useResponses && visionModel) {
        (requestPayload as RequestPayload).max_tokens = Math.max(
          modelConfig.max_tokens,
          4000,
        );
      }
    }

    console.log(
      useResponses
        ? "[Request] openai responses payload: "
        : "[Request] openai payload: ",
      requestPayload,
    );

    const shouldStream = !isDalle3 && !!options.config.stream;
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
          (isDalle3 ? Azure.ImagePath : Azure.ChatPath)(
            (model?.displayName ?? model?.name) as string,
            useCustomConfig ? useAccessStore.getState().azureApiVersion : "",
          ),
        );
      } else {
        chatPath = this.path(
          isDalle3
            ? OpenaiPath.ImagePath
            : useResponses
            ? OpenaiPath.ResponsesPath
            : OpenaiPath.ChatPath,
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

        // 添加联网状态日志
        console.log(
          "[Chat] Web Access:",
          session.mask?.plugin?.includes("googleSearch")
            ? "Enabled"
            : "Disabled",
        );

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
            requestPayload: RequestPayload,
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
        );
      } else {
        const chatPayload = {
          method: "POST",
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
          headers: getHeaders(),
        };

        // make a fetch request
        const requestTimeoutId = setTimeout(
          () => controller.abort(),
          useResponses
            ? OPENAI_RESPONSES_TIMEOUT_MS
            : isDalle3 || isO1
            ? REQUEST_TIMEOUT_MS * 4
            : REQUEST_TIMEOUT_MS, // dalle3 using b64_json is slow.
        );

        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = await this.extractMessage(resJson);
        options.onFinish(message, res);
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
