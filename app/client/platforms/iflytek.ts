"use client";
import {
  ApiPath,
  IFLYTEK_BASE_URL,
  Iflytek,
  REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import { useAccessStore, useAppConfig, useChatStore } from "@/app/store";

import { ChatOptions, LLMApi, LLMModel, SpeechOptions } from "../types";
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

import { RequestPayload } from "./openai";
import { mergeLLMRequestConfig } from "../request-config";

export class SparkApi implements LLMApi {
  private disableListModels = true;

  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    if (accessStore.useCustomConfig) {
      baseUrl = accessStore.iflytekUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      const apiPath = ApiPath.Iflytek;
      baseUrl = isApp ? IFLYTEK_BASE_URL : apiPath;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (!baseUrl.startsWith("http") && !baseUrl.startsWith(ApiPath.Iflytek)) {
      baseUrl = "https://" + baseUrl;
    }

    console.log("[Proxy Endpoint] ", baseUrl, path);

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res.choices?.at(0)?.message?.content ?? "";
  }

  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  async chat(options: ChatOptions) {
    const messages: ChatOptions["messages"] = [];
    for (const v of options.messages) {
      const content = getMessageTextContent(v);
      messages.push({ role: v.role, content });
    }

    const modelConfig = mergeLLMRequestConfig(
      useAppConfig.getState().modelConfig,
      useChatStore.getState().currentSession().mask.modelConfig,
      options.config,
    );

    const requestPayload: RequestPayload = {
      messages,
      stream: options.config.stream,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      presence_penalty: modelConfig.presence_penalty,
      frequency_penalty: modelConfig.frequency_penalty,
      top_p: modelConfig.top_p,
      // Provider-specific output limits are intentionally not sent here.
    };

    console.log("[Request] Spark payload: ", requestPayload);

    const shouldStream = !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(Iflytek.ChatPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: await getHeadersAsync(false, modelConfig.providerName),
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

        // Animate response text to make it look smooth
        function animateResponseText() {
          if (finished || controller.signal.aborted) {
            responseText += remainText;
            console.log("[Response Animation] finished");
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

        // Start animation
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
            console.log("[Spark] request response content type: ", contentType);
            responseRes = res;
            if (contentType?.startsWith("text/plain")) {
              responseText = await res.clone().text();
              return finish();
            }

            // Handle different error scenarios
            if (
              !res.ok ||
              !res.headers
                .get("content-type")
                ?.startsWith(EventStreamContentType) ||
              res.status !== 200
            ) {
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
                extraInfo = accessRestrictedMessage;
              } else if (res.status === 401) {
                extraInfo = Locale.Error.Unauthorized;
              }

              options.onError?.(
                new Error(
                  `Request failed with status ${res.status}: ${extraInfo}`,
                ),
              );
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
              const choices = json.choices as Array<{
                delta: { content: string };
              }>;
              const delta = choices[0]?.delta?.content;

              if (delta) {
                remainText += delta;
              }
            } catch (e) {
              console.error("[Request] parse error", text);
              options.onError?.(new Error(`Failed to parse response: ${text}`));
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
        const { response: res, body: responseBody } =
          await withAbortTimeoutResponse({
            controller,
            timeoutMs: REQUEST_TIMEOUT_MS,
            operation: () => fetch(chatPath, chatPayload),
            consume: async (response) => {
              const text = await response.text();
              let payload: unknown;
              try {
                payload = JSON.parse(text);
              } catch {}
              return { text, payload };
            },
          });

        if (!res.ok) {
          const errorText =
            getAccessRestrictedPublicErrorMessage({
              response: res,
              payload: responseBody.payload,
              message: Locale.Error.AccessRestricted,
            }) ?? responseBody.text;
          options.onError?.(
            new Error(`Request failed with status ${res.status}: ${errorText}`),
          );
          return;
        }

        const resJson = responseBody.payload;
        const message = this.extractMessage(resJson);
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
