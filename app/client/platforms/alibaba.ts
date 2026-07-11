"use client";
import {
  ApiPath,
  Alibaba,
  ALIBABA_BASE_URL,
  REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import { useAccessStore, useAppConfig, useChatStore } from "@/app/store";

import {
  ChatOptions,
  LLMApi,
  LLMModel,
  SpeechOptions,
  MultimodalContent,
} from "../types";
import { getHeadersAsync } from "../header-loader";
import Locale from "../../locales";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { prettyObject } from "@/app/utils/format";
import { getClientConfig } from "@/app/config/client";
import { getMessageTextContent } from "@/app/utils";
import { fetch } from "@/app/utils/stream";
import {
  createAbortTimeout,
  withAbortTimeoutResponse,
} from "@/app/utils/request-timeout";
import { getAccessRestrictedPublicErrorMessage } from "@/app/utils/public-error";

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

interface RequestInput {
  messages: {
    role: "system" | "user" | "assistant";
    content: string | MultimodalContent[];
  }[];
}
interface RequestParam {
  result_format: string;
  incremental_output?: boolean;
  temperature: number;
  repetition_penalty?: number;
  top_p: number;
  max_tokens?: number;
}
interface RequestPayload {
  model: string;
  input: RequestInput;
  parameters: RequestParam;
}

export class QwenApi implements LLMApi {
  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    if (accessStore.useCustomConfig) {
      baseUrl = accessStore.alibabaUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      baseUrl = isApp ? ALIBABA_BASE_URL : ApiPath.Alibaba;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (!baseUrl.startsWith("http") && !baseUrl.startsWith(ApiPath.Alibaba)) {
      baseUrl = "https://" + baseUrl;
    }

    console.log("[Proxy Endpoint] ", baseUrl, path);

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res?.output?.choices?.at(0)?.message?.content ?? "";
  }

  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  async chat(options: ChatOptions) {
    const messages = options.messages.map((v) => ({
      role: v.role,
      content: getMessageTextContent(v),
    }));

    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
      },
    };

    const shouldStream = !!options.config.stream;
    const requestPayload: RequestPayload = {
      model: modelConfig.model,
      input: {
        messages,
      },
      parameters: {
        result_format: "message",
        incremental_output: shouldStream,
        temperature: modelConfig.temperature,
        // Provider-specific output limits are intentionally not sent here.
        top_p: modelConfig.top_p === 1 ? 0.99 : modelConfig.top_p, // qwen top_p is should be < 1
      },
    };

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(Alibaba.ChatPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: {
          ...(await getHeadersAsync()),
          "X-DashScope-SSE": shouldStream ? "enable" : "disable",
        },
      };

      if (shouldStream) {
        const cancelRequestTimeout = createAbortTimeout({
          controller,
          timeoutMs: REQUEST_TIMEOUT_MS,
        });
        let responseText = "";
        let remainText = "";
        let finished = false;
        let responseRes: Response;

        // animate response to make it looks smooth
        function animateResponseText() {
          if (finished || controller.signal.aborted) {
            responseText += remainText;
            console.log("[Response Animation] finished");
            if (responseText?.length === 0) {
              options.onError?.(new Error("empty response from server"));
            }
            return;
          }

          if (remainText.length > 0) {
            const fetchCount = Math.max(1, Math.round(remainText.length / 60));
            const fetchText = remainText.slice(0, fetchCount);
            responseText += fetchText;
            remainText = remainText.slice(fetchCount);
            options.onUpdate?.(responseText, fetchText);
          }

          requestAnimationFrame(animateResponseText);
        }

        // start animaion
        animateResponseText();

        const finish = () => {
          if (!finished) {
            finished = true;
            options.onFinish(responseText + remainText, responseRes);
          }
        };

        controller.signal.onabort = finish;

        void fetchEventSource(chatPath, {
          fetch: fetch as any,
          ...chatPayload,
          async onopen(res) {
            cancelRequestTimeout();
            const contentType = res.headers.get("content-type");
            console.log(
              "[Alibaba] request response content type: ",
              contentType,
            );
            responseRes = res;

            if (contentType?.startsWith("text/plain")) {
              responseText = await res.clone().text();
              return finish();
            }

            if (
              !res.ok ||
              !res.headers
                .get("content-type")
                ?.startsWith(EventStreamContentType) ||
              res.status !== 200
            ) {
              const responseTexts = [responseText];
              let extraInfo = await res.clone().text();
              let responsePayload: unknown;
              try {
                responsePayload = await res.clone().json();
                extraInfo = prettyObject(responsePayload);
              } catch {}

              const accessRestrictedMessage =
                getAccessRestrictedPublicErrorMessage({
                  response: res,
                  payload: responsePayload,
                  message: Locale.Error.AccessRestricted,
                });
              if (accessRestrictedMessage) {
                responseTexts.push(accessRestrictedMessage);
                extraInfo = "";
              } else if (res.status === 401) {
                responseTexts.push(Locale.Error.Unauthorized);
              }

              if (extraInfo) {
                responseTexts.push(extraInfo);
              }

              responseText = responseTexts.join("\n\n");

              return finish();
            }
          },
          onmessage(msg) {
            if (msg.data === "[DONE]" || finished) {
              return finish();
            }
            const text = msg.data;
            try {
              const json = JSON.parse(text);
              const choices = json.output.choices as Array<{
                message: { content: string };
              }>;
              const delta = choices[0]?.message?.content;
              if (delta) {
                remainText += delta;
              }
            } catch (e) {
              console.error("[Request] parse error", text, msg);
            }
          },
          onclose() {
            finish();
          },
          onerror(e) {
            throw e;
          },
          openWhenHidden: true,
        })
          .catch((error) => {
            if (!finished) {
              finished = true;
              options.onError?.(error);
            }
          })
          .finally(cancelRequestTimeout);
      } else {
        const { response: res, body: resJson } = await withAbortTimeoutResponse(
          {
            controller,
            timeoutMs: REQUEST_TIMEOUT_MS,
            operation: () => fetch(chatPath, chatPayload),
            consume: (response) => response.json(),
          },
        );

        const message =
          getAccessRestrictedPublicErrorMessage({
            response: res,
            payload: resJson,
            message: Locale.Error.AccessRestricted,
          }) ?? this.extractMessage(resJson);
        options.onFinish(message, res);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }
  async usage() {
    return {
      used: 0,
      total: 0,
    };
  }

  async models(): Promise<LLMModel[]> {
    return [];
  }
}
