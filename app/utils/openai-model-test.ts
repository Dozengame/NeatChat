import {
  clampOpenAIResponsesMaxOutputTokens,
  normalizeOpenAIResponsesReasoningEffort,
  parseOpenAIResponsesTextVerbosity,
  resolveOpenAIResponsesReasoningEffortDefault,
  supportsOpenAIResponsesReasoning,
  supportsOpenAIResponsesTextVerbosity,
  type OpenAIResponsesReasoningEffortDefaults,
} from "./openai-responses";
import {
  getPublicUpstreamErrorMessage,
  hasUpstreamErrorPayload,
} from "./public-error";
import type { ModelTestResult } from "./model-test";

export type OpenAIModelTestServerConfig = {
  openaiMaxOutputTokens?: number;
  openaiReasoningEffort?: string;
  openaiReasoningEffortDefaults?: OpenAIResponsesReasoningEffortDefaults;
  openaiTextVerbosity?: string;
};

export function buildOpenAIModelTestRequest(
  model: string,
  serverConfig: OpenAIModelTestServerConfig,
) {
  const textVerbosity = supportsOpenAIResponsesTextVerbosity(model)
    ? parseOpenAIResponsesTextVerbosity(serverConfig.openaiTextVerbosity)
    : undefined;
  const maxOutputTokens = clampOpenAIResponsesMaxOutputTokens(
    serverConfig.openaiMaxOutputTokens ?? 16,
    model,
  );

  return {
    model,
    input: "Hello!",
    ...(maxOutputTokens > 0 ? { max_output_tokens: maxOutputTokens } : {}),
    ...(supportsOpenAIResponsesReasoning(model)
      ? {
          reasoning: {
            effort:
              resolveOpenAIResponsesReasoningEffortDefault({
                model,
                defaults: serverConfig.openaiReasoningEffortDefaults,
              }) ??
              normalizeOpenAIResponsesReasoningEffort(
                serverConfig.openaiReasoningEffort,
                model,
              ),
          },
        }
      : {}),
    ...(textVerbosity ? { text: { verbosity: textVerbosity } } : {}),
    stream: false,
  };
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function hasVisibleOutput(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return true;
  }
  return (
    Array.isArray(payload.output) &&
    payload.output.some((item) => {
      const message = asRecord(item);
      return (
        message?.type === "message" &&
        Array.isArray(message.content) &&
        message.content.some((part) => {
          const content = asRecord(part);
          return (
            content?.type === "output_text" &&
            typeof content.text === "string" &&
            content.text.trim().length > 0
          );
        })
      );
    })
  );
}

export function getOpenAIModelTestResult({
  response,
  payload,
  isJson,
  responseTime,
}: {
  response: Pick<Response, "ok" | "status" | "headers">;
  payload: unknown;
  isJson: boolean;
  responseTime: number;
}): ModelTestResult {
  const base = { success: false, responseTime, timeout: false };
  if (!response.ok) {
    return {
      ...base,
      message: getPublicUpstreamErrorMessage({
        fallback: `测试失败 (${response.status})`,
        payload,
        headers: response.headers,
      }),
      error: { status: response.status },
    };
  }

  const result = asRecord(payload);
  if (!isJson || !result) {
    return {
      ...base,
      message: "接口已响应，但未返回有效 JSON 生成结果",
      error: { type: "invalid_response" },
    };
  }
  if (hasUpstreamErrorPayload(result) || result.status === "failed") {
    return {
      ...base,
      message: getPublicUpstreamErrorMessage({
        fallback: "文本生成失败",
        payload: result,
        headers: response.headers,
      }),
      error: { type: "upstream_error" },
    };
  }
  if (result.status === "incomplete") {
    const reason = asRecord(result.incomplete_details)?.reason;
    const description =
      reason === "max_output_tokens"
        ? "（达到输出 token 上限）"
        : reason === "content_filter"
        ? "（内容过滤）"
        : "";
    return {
      ...base,
      message: `接口已响应，生成未完成${description}`,
      error: { type: "incomplete" },
    };
  }
  if (result.status !== "completed") {
    return {
      ...base,
      message: "接口已响应，但未返回完成的生成结果",
      error: { type: "incomplete_response" },
    };
  }
  if (!hasVisibleOutput(result)) {
    return {
      ...base,
      message: "接口已响应，但未生成可见文本",
      error: { type: "empty_output" },
    };
  }
  return {
    success: true,
    message: `文本生成通过，响应时间: ${(responseTime / 1000).toFixed(2)}s`,
    responseTime,
    timeout: false,
  };
}
