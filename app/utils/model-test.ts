// 模型测试服务

import { showToast } from "../components/ui-lib-actions";
import {
  buildOpenAIModelTestRequest,
  getOpenAIModelTestResult,
} from "./openai-model-test";
import {
  getPublicUpstreamErrorMessage,
  readResponsePayload,
} from "./public-error";
import { withAbortTimeout } from "./request-timeout";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 测试结果接口
export interface ModelTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: any;
  timeout?: boolean;
  cancelled?: boolean;
}

// 测试模型可用性
async function testModel(
  model: string,
  apiKey: string,
  baseUrl: string = "https://api.openai.com",
  timeoutSeconds: number = 5,
  signal?: AbortSignal,
): Promise<ModelTestResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const handleAbort = () => controller.abort(signal?.reason);

  try {
    signal?.addEventListener("abort", handleAbort, { once: true });
    if (signal?.aborted) handleAbort();

    // 构建请求URL
    const normalizedBaseUrl = baseUrl.endsWith("/")
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const url = normalizedBaseUrl.toLowerCase().endsWith("/v1/responses")
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/v1/responses`;

    // 构建请求体
    const requestBody = buildOpenAIModelTestRequest(model, {});

    // 发送请求
    const { response, payload, isJson } = await withAbortTimeout({
      controller,
      timeoutMs: timeoutSeconds * 1000,
      operation: async () => {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        const { payload, isJson } = await readResponsePayload(response);
        return { response, payload, isJson };
      },
    });

    const responseTime = Date.now() - startTime;

    return getOpenAIModelTestResult({
      response,
      payload,
      isJson,
      responseTime,
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const isTimeout =
      error?.name === "AbortError" || error?.name === "TimeoutError";

    // 如果是外部中止，则返回特殊标记
    if (signal?.aborted) {
      return {
        success: false,
        message: "测试已取消",
        responseTime,
        error: { type: "cancelled" },
        timeout: false,
        cancelled: true,
      };
    }

    return {
      success: false,
      message: isTimeout
        ? "请求超时"
        : getPublicUpstreamErrorMessage({
            fallback: "测试出错",
            detail: error?.message,
          }),
      responseTime,
      error: { type: isTimeout ? "timeout" : "request_error" },
      timeout: isTimeout,
    };
  } finally {
    signal?.removeEventListener("abort", handleAbort);
  }
}

// 批量测试多个模型
async function testModels(
  models: string[],
  apiKey: string,
  baseUrl: string = "https://api.openai.com",
  timeoutSeconds: number = 5,
  showStartToast: boolean = true,
  signal?: AbortSignal,
  onModelTested?: (
    modelId: string,
    result: ModelTestResult,
    allResults?: Record<string, ModelTestResult>,
  ) => void,
): Promise<Record<string, ModelTestResult>> {
  const results: Record<string, ModelTestResult> = {};

  // 仅在showStartToast为true时显示开始测试的提示
  if (showStartToast) {
    showToast(`开始测试 ${models.length} 个模型...`);
  }

  const testEntries = await Promise.all(
    models.map(async (model): Promise<[string, ModelTestResult] | null> => {
      if (signal?.aborted) {
        return null;
      }

      const result = await testModel(
        model,
        apiKey,
        baseUrl,
        timeoutSeconds,
        signal,
      );
      results[model] = result;

      // 调用单个模型测试完成的回调，传递累积的测试结果
      if (onModelTested && !signal?.aborted) {
        onModelTested(model, result, { ...results });
      }

      // 显示每个模型的测试结果
      if (!signal?.aborted) {
        if (result.success) {
          showToast(
            `${model}: 文本生成通过 (${(
              (result.responseTime || 0) / 1000
            ).toFixed(2)}s)`,
          );
        } else if (result.timeout) {
          showToast(`${model}: 超时`);
        } else {
          const errorMessage = result.message || "测试失败";
          showToast(`${model}: ${errorMessage}`);
        }
      }

      if (!signal?.aborted) {
        await sleep(10);
      }

      return [model, result];
    }),
  );

  Object.assign(
    results,
    Object.fromEntries(
      testEntries.filter((entry): entry is [string, ModelTestResult] =>
        Boolean(entry),
      ),
    ),
  );

  return results;
}
