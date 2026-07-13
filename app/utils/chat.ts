import {
  CACHE_URL_PREFIX,
  UPLOAD_URL,
  REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import { MultimodalContent, RequestMessage } from "@/app/client/types";
import Locale from "@/app/locales";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { fetch as tauriFetch } from "./stream";
import { createAbortTimeout } from "./request-timeout";
import {
  getPublicHttpErrorMessage,
  getPublicUpstreamErrorMessage,
  hasUpstreamErrorPayload,
} from "./public-error";

function compressImage(file: Blob, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const readAsDataUrl = (blob: Blob) => reader.readAsDataURL(blob);

    reader.onload = (readerEvent: any) => {
      const image = new Image();
      image.onload = () => {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        let width = image.width;
        let height = image.height;
        let quality = 0.9;
        let dataUrl;

        do {
          canvas.width = width;
          canvas.height = height;
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(image, 0, 0, width, height);
          dataUrl = canvas.toDataURL("image/jpeg", quality);

          if (dataUrl.length < maxSize) break;

          if (quality > 0.5) {
            // Prioritize quality reduction
            quality -= 0.1;
          } else {
            // Then reduce the size
            width *= 0.9;
            height *= 0.9;
          }
        } while (dataUrl.length > maxSize);

        resolve(dataUrl);
      };
      image.onerror = reject;
      image.src = readerEvent.target.result;
    };
    reader.onerror = reject;

    if (file.type.includes("heic") || file.type.includes("heif")) {
      import("heic2any")
        .then((mod) => {
          const heic2any = mod.default ?? mod;
          return heic2any({ blob: file, toType: "image/jpeg" });
        })
        .then((blob) => readAsDataUrl(Array.isArray(blob) ? blob[0] : blob))
        .catch(reject);
      return;
    }

    readAsDataUrl(file);
  });
}

export async function preProcessImageContent(
  content: RequestMessage["content"],
): Promise<RequestMessage["content"]> {
  if (typeof content === "string") {
    return content;
  }
  const result = await Promise.all(
    content.map(async (part): Promise<MultimodalContent | null> => {
      if (part?.type != "image_url" || !part?.image_url?.url) {
        return { ...part };
      }

      try {
        const url = await cacheImageToBase64Image(part?.image_url?.url);
        return { type: part.type, image_url: { url } };
      } catch (error) {
        console.error("[Image] failed to process image URL");
        return null;
      }
    }),
  );
  return result.filter((part): part is MultimodalContent => part !== null);
}

const imageCaches: Record<string, string> = {};
export function cacheImageToBase64Image(imageUrl: string) {
  if (imageUrl.includes(CACHE_URL_PREFIX)) {
    if (!imageCaches[imageUrl]) {
      const reader = new FileReader();
      return fetch(imageUrl, {
        method: "GET",
        mode: "cors",
        credentials: "include",
      })
        .then((res) => res.blob())
        .then(
          async (blob) =>
            (imageCaches[imageUrl] = await compressImage(blob, 256 * 1024)),
        ); // compressImage
    }
    return Promise.resolve(imageCaches[imageUrl]);
  }
  return Promise.resolve(imageUrl);
}

export function base64Image2Blob(base64Data: string, contentType: string) {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

export function uploadImage(file: Blob): Promise<string> {
  if (!window._SW_ENABLED) {
    // if serviceWorker register error, using compressImage
    return compressImage(file, 256 * 1024);
  }
  const body = new FormData();
  body.append("file", file);
  return fetch(UPLOAD_URL, {
    method: "post",
    body,
    mode: "cors",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((res) => {
      // console.log("res", res);
      if (res?.code == 0 && res?.data) {
        return res?.data;
      }
      throw Error(`upload Error: ${res?.msg}`);
    });
}

export function removeImage(imageUrl: string) {
  return fetch(imageUrl, {
    method: "DELETE",
    mode: "cors",
    credentials: "include",
  });
}

export function buildChatRequestPayload(requestPayload: any, tools: any[]) {
  return {
    ...requestPayload,
    ...(tools && tools.length ? { tools } : {}),
  };
}

export function stream(
  chatPath: string,
  requestPayload: any,
  headers: any,
  tools: any[],
  funcs: Record<string, Function>,
  controller: AbortController,
  parseSSE: (
    text: string,
    runTools: any[],
  ) => string | { content: string; replace?: boolean } | undefined,
  processToolMessage: (
    requestPayload: any,
    toolCallMessage: any,
    toolCallResult: any[],
  ) => void,
  options: any,
  timeoutMs = REQUEST_TIMEOUT_MS,
  responseMetadata?: {
    getMetadata?: () => Record<string, unknown> | undefined;
  },
) {
  let responseText = "";
  let remainText = "";
  let finished = false;
  let running = false;
  let runTools: any[] = [];
  let responseRes: Response;
  let animationFrameId: number | undefined;
  let cancelActiveRequestTimeout: () => void = () => undefined;

  // animate response to make it looks smooth
  function animateResponseText() {
    if (finished || controller.signal.aborted) {
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

    animationFrameId = requestAnimationFrame(animateResponseText);
  }

  // start animaion
  animateResponseText();

  const stopAnimation = () => {
    if (animationFrameId !== undefined) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = undefined;
    }
    responseText += remainText;
    remainText = "";
  };

  const fail = (error: Error) => {
    if (finished) return;
    finished = true;
    stopAnimation();
    if (!controller.signal.aborted) controller.abort(error);
    options.onError?.(error);
  };

  const finish = ({
    allowTools = true,
    allowEmpty = false,
  }: { allowTools?: boolean; allowEmpty?: boolean } = {}) => {
    if (!finished) {
      if (allowTools && !running && runTools.length > 0) {
        const toolCallMessage = {
          role: "assistant",
          tool_calls: [...runTools],
        };
        running = true;
        runTools.splice(0, runTools.length); // empty runTools
        return Promise.all(
          toolCallMessage.tool_calls.map((tool) => {
            options?.onBeforeTool?.(tool);
            return Promise.resolve(
              // @ts-ignore
              funcs[tool.function.name](
                // @ts-ignore
                tool?.function?.arguments
                  ? JSON.parse(tool?.function?.arguments)
                  : {},
              ),
            )
              .then((res) => {
                let content = res.data || res?.statusText;
                // hotfix #5614
                content =
                  typeof content === "string"
                    ? content
                    : JSON.stringify(content);
                if (res.status >= 300) {
                  return Promise.reject(content);
                }
                return content;
              })
              .then((content) => {
                options?.onAfterTool?.({
                  ...tool,
                  content,
                  isError: false,
                });
                return content;
              })
              .catch((e) => {
                const publicError = getPublicUpstreamErrorMessage({
                  fallback: Locale.Error.RequestFailed(),
                  detail: e instanceof Error ? e.message : String(e),
                });
                options?.onAfterTool?.({
                  ...tool,
                  isError: true,
                  errorMsg: publicError,
                });
                return publicError;
              })
              .then((content) => ({
                name: tool.function.name,
                role: "tool",
                content,
                tool_call_id: tool.id,
              }));
          }),
        ).then((toolCallResult) => {
          if (finished || controller.signal.aborted) return;
          processToolMessage(requestPayload, toolCallMessage, toolCallResult);
          setTimeout(() => {
            if (finished || controller.signal.aborted) return;
            // call again
            console.debug("[ChatAPI] restart");
            running = false;
            chatApi(chatPath, headers, requestPayload, tools); // call fetchEventSource
          }, 60);
        });
        return;
      }
      if (allowTools && running) {
        return;
      }
      console.debug("[ChatAPI] end");
      stopAnimation();
      const finalMessage = responseText + remainText;
      if (!allowEmpty && finalMessage.length === 0) {
        fail(new Error("empty response from server"));
        return;
      }
      finished = true;
      options.onFinish(
        finalMessage,
        responseRes,
        responseMetadata?.getMetadata?.(),
      ); // 将res传递给onFinish
    }
  };

  controller.signal.addEventListener(
    "abort",
    () => {
      cancelActiveRequestTimeout();
      const reason = controller.signal.reason;
      if (reason instanceof Error && reason.name === "TimeoutError") {
        fail(reason);
        return;
      }
      finish({ allowTools: false, allowEmpty: true });
    },
    { once: true },
  );

  function chatApi(
    chatPath: string,
    headers: any,
    requestPayload: any,
    tools: any,
  ) {
    const chatPayload = {
      method: "POST",
      body: JSON.stringify(buildChatRequestPayload(requestPayload, tools)),
      signal: controller.signal,
      headers,
    };
    let cancelRequestTimeout: () => void = () => undefined;
    const cancelThisRequestTimeout = () => cancelRequestTimeout();
    cancelActiveRequestTimeout = cancelThisRequestTimeout;
    const refreshRequestTimeout = () => {
      cancelRequestTimeout();
      cancelRequestTimeout = createAbortTimeout({
        controller,
        timeoutMs,
        onTimeout: () => {
          if (controller.signal.aborted) return;
          const error = new Error("Chat stream request timed out");
          error.name = "TimeoutError";
          controller.abort(error);
        },
      });
    };
    refreshRequestTimeout();
    void fetchEventSource(chatPath, {
      fetch: tauriFetch as any,
      ...chatPayload,
      async onopen(res) {
        refreshRequestTimeout();
        const contentType = res.headers.get("content-type");
        console.log("[Request] response content type: ", contentType);
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

          fail(
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
          return finish();
        }
      },
      onmessage(msg) {
        refreshRequestTimeout();
        if (msg.data === "[DONE]" || finished) {
          return finish();
        }
        const text = msg.data;
        try {
          let eventPayload: unknown;
          try {
            eventPayload = JSON.parse(text);
          } catch {}
          if (hasUpstreamErrorPayload(eventPayload)) {
            fail(
              new Error(
                getPublicHttpErrorMessage({
                  response: responseRes,
                  payload: eventPayload,
                  fallback: Locale.Error.RequestFailed(),
                  accessRestrictedMessage: Locale.Error.AccessRestricted,
                }),
              ),
            );
            return;
          }
          const chunk = parseSSE(msg.data, runTools);
          if (chunk) {
            if (typeof chunk === "string") {
              remainText += chunk;
            } else {
              if (chunk.replace) {
                responseText = "";
                remainText = "";
              }
              remainText += chunk.content;
            }
          }
        } catch (e) {
          console.error("[Request] failed to parse a streaming event");
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
          fail(error instanceof Error ? error : new Error(String(error)));
        }
      })
      .finally(() => {
        cancelThisRequestTimeout();
        if (cancelActiveRequestTimeout === cancelThisRequestTimeout) {
          cancelActiveRequestTimeout = () => undefined;
        }
      });
  }
  console.debug("[ChatAPI] start");
  chatApi(chatPath, headers, requestPayload, tools); // call fetchEventSource
}
