"use client";
import {
  ApiPath,
  ByteDance,
  BYTEDANCE_BASE_URL,
  REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import { useAccessStore, useAppConfig } from "@/app/store";

import {
  ChatOptions,
  LLMApi,
  LLMModel,
  MultimodalContent,
  SpeechOptions,
} from "../types";
import { getHeadersAsync } from "../header-loader";
import Locale from "../../locales";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { getClientConfig } from "@/app/config/client";
import { getMessageTextContent } from "@/app/utils";
import { fetch } from "@/app/utils/stream";
import {
  createStreamingRequestLifecycle,
  withAbortTimeoutResponse,
} from "@/app/utils/request-timeout";
import {
  getAccessRestrictedPublicErrorMessage,
  getPublicHttpErrorMessage,
  hasUpstreamErrorPayload,
  readResponsePayload,
} from "@/app/utils/public-error";
import { mergeLLMRequestConfig } from "../request-config";

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

interface RequestPayload {
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
}

export class DoubaoApi implements LLMApi {
  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    if (accessStore.useCustomConfig) {
      baseUrl = accessStore.bytedanceUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      baseUrl = isApp ? BYTEDANCE_BASE_URL : ApiPath.ByteDance;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (!baseUrl.startsWith("http") && !baseUrl.startsWith(ApiPath.ByteDance)) {
      baseUrl = "https://" + baseUrl;
    }

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res.choices?.at(0)?.message?.content ?? "";
  }

  speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }

  async chat(options: ChatOptions) {
    const messages = options.messages.map((v) => ({
      role: v.role,
      content: getMessageTextContent(v),
    }));

    const modelConfig = mergeLLMRequestConfig(
      useAppConfig.getState().modelConfig,
      useAppConfig.getState().modelConfig,
      options.config,
    );

    const shouldStream = !!options.config.stream;
    const requestPayload: RequestPayload = {
      messages,
      stream: shouldStream,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      presence_penalty: modelConfig.presence_penalty,
      frequency_penalty: modelConfig.frequency_penalty,
      top_p: modelConfig.top_p,
    };

    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(ByteDance.ChatPath);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: await getHeadersAsync(false, modelConfig.providerName),
      };

      if (shouldStream) {
        let responseText = "";
        let remainText = "";
        let responseRes: Response;
        const lifecycle = createStreamingRequestLifecycle({
          controller,
          timeoutMs: REQUEST_TIMEOUT_MS,
          getMessage: () => responseText + remainText,
          getResponse: () => responseRes,
          onFinish: options.onFinish,
          onError: options.onError,
        });

        // animate response to make it looks smooth
        function animateResponseText() {
          if (lifecycle.isSettled() || controller.signal.aborted) {
            responseText += remainText;
            remainText = "";
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

        // start animaion
        animateResponseText();

        void fetchEventSource(chatPath, {
          fetch: fetch as any,
          ...chatPayload,
          async onopen(res) {
            lifecycle.refresh();
            const contentType = res.headers.get("content-type");
            console.log(
              "[ByteDance] request response content type: ",
              contentType,
            );
            responseRes = res;
            if (
              !res.ok ||
              (!contentType?.startsWith("text/plain") &&
                (!contentType?.startsWith(EventStreamContentType) ||
                  res.status !== 200))
            ) {
              let responsePayload: unknown;
              try {
                responsePayload = await res.clone().json();
              } catch {
                responsePayload = { message: await res.clone().text() };
              }

              lifecycle.fail(
                new Error(
                  getPublicHttpErrorMessage({
                    response: res,
                    payload: responsePayload,
                    fallback:
                      res.status === 401
                        ? Locale.Error.Unauthorized
                        : Locale.Error.RequestFailed(
                            res.ok ? undefined : res.status,
                          ),
                    accessRestrictedMessage: Locale.Error.AccessRestricted,
                  }),
                ),
              );
              return;
            }
            if (contentType?.startsWith("text/plain")) {
              responseText = await res.clone().text();
              return lifecycle.finish();
            }
          },
          onmessage(msg) {
            lifecycle.refresh();
            if (msg.data === "[DONE]" || lifecycle.isSettled()) {
              return lifecycle.finish();
            }
            const text = msg.data;
            try {
              const json = JSON.parse(text);
              if (hasUpstreamErrorPayload(json)) {
                lifecycle.fail(
                  new Error(
                    getPublicHttpErrorMessage({
                      response: responseRes,
                      payload: json,
                      fallback: Locale.Error.RequestFailed(),
                      accessRestrictedMessage: Locale.Error.AccessRestricted,
                    }),
                  ),
                );
                return;
              }
              const choices = json.choices as Array<{
                delta: { content: string };
              }>;
              const delta = choices[0]?.delta?.content;
              if (delta) {
                remainText += delta;
              }
            } catch {
              console.error("[Request] failed to parse a streaming event");
            }
          },
          onclose() {
            lifecycle.finish();
          },
          onerror(e) {
            throw e;
          },
          openWhenHidden: true,
        })
          .catch(lifecycle.fail)
          .finally(lifecycle.cancel);
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

        const message =
          getAccessRestrictedPublicErrorMessage({
            response: res,
            payload: resJson,
            message: Locale.Error.AccessRestricted,
          }) ?? this.extractMessage(resJson);
        if (!message) {
          throw new Error(Locale.Error.RequestFailed());
        }
        options.onFinish(message, res);
      }
    } catch (e) {
      console.error("[ByteDance] chat request failed");
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
