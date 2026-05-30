// 模型测试服务

import { showToast } from "../components/ui-lib-actions";

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

  try {
    // 创建AbortController用于超时控制
    const controller = new AbortController();

    // 合并外部信号和超时信号
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeoutSeconds * 1000,
    );

    // 如果外部信号被触发，也要中止请求
    if (signal) {
      signal.addEventListener("abort", () => {
        controller.abort();
        clearTimeout(timeoutId);
      });
    }

    // 构建请求URL
    const normalizedBaseUrl = baseUrl.endsWith("/")
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const url = normalizedBaseUrl.toLowerCase().endsWith("/v1/responses")
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/v1/responses`;

    // 构建请求体
    const requestBody = {
      model: model,
      input: "Hello!",
      max_output_tokens: 16,
      stream: false,
    };

    // 发送请求
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    // 清除超时计时器
    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    // 检查响应
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: `测试失败: ${errorData.error?.message || response.statusText}`,
        responseTime,
        error: errorData,
        timeout: false,
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: `测试成功! 响应时间: ${(responseTime / 1000).toFixed(2)}s`,
      responseTime,
      timeout: false,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const isTimeout = error.name === "AbortError";

    // 如果是外部中止，则返回特殊标记
    if (signal?.aborted) {
      return {
        success: false,
        message: "测试已取消",
        responseTime,
        error,
        timeout: false,
        cancelled: true,
      };
    }

    return {
      success: false,
      message: isTimeout ? "请求超时" : `测试出错: ${error.message}`,
      responseTime,
      error,
      timeout: isTimeout,
    };
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
            `${model}: 测试成功 (${((result.responseTime || 0) / 1000).toFixed(
              2,
            )}s)`,
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
