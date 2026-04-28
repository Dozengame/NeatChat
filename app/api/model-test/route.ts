import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "@/app/config/server";
import { OPENAI_BASE_URL, OpenaiPath } from "@/app/constant";
import { ModelTestResult } from "@/app/utils/model-test";

// 测试单个模型
async function testModel(
  model: string,
  serverConfig: ReturnType<typeof getServerSideConfig>,
  apiKey: string,
  timeoutSeconds: number = 5,
): Promise<ModelTestResult> {
  const startTime = Date.now();

  try {
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeoutSeconds * 1000,
    );

    let baseUrl =
      serverConfig.openaiResponsesUrl || serverConfig.baseUrl || OPENAI_BASE_URL;
    if (!baseUrl.startsWith("http")) {
      baseUrl = `https://${baseUrl}`;
    }
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    const url =
      baseUrl.toLowerCase().endsWith(`/${OpenaiPath.ResponsesPath}`)
        ? baseUrl
        : `${baseUrl}/${OpenaiPath.ResponsesPath}`;

    // 构建请求体
    const requestBody = {
      model,
      input: "Hello!",
      max_output_tokens: serverConfig.openaiMaxOutputTokens ?? 16,
      reasoning: {
        effort: serverConfig.openaiReasoningEffort,
      },
      text: {
        verbosity: serverConfig.openaiTextVerbosity,
      },
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

    return {
      success: true,
      message: `测试成功! 响应时间: ${(responseTime / 1000).toFixed(2)}s`,
      responseTime,
      timeout: false,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const isTimeout = error.name === "AbortError";

    return {
      success: false,
      message: isTimeout ? "请求超时" : `测试出错: ${error.message}`,
      responseTime,
      error: error.toString(),
      timeout: isTimeout,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { models, timeoutSeconds = 5 } = body;

    if (!Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: "请提供要测试的模型列表" },
        { status: 400 },
      );
    }

    // 获取服务端配置
    const serverConfig = getServerSideConfig();
    const apiKey = serverConfig.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "服务端未配置API密钥" },
        { status: 500 },
      );
    }

    // 测试结果
    const results: Record<string, ModelTestResult> = {};

    // 逐个测试模型
    for (const model of models) {
      results[model] = await testModel(
        model,
        serverConfig,
        apiKey,
        timeoutSeconds,
      );
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("测试模型时出错:", error);
    return NextResponse.json({ error: "测试模型时出错" }, { status: 500 });
  }
}
