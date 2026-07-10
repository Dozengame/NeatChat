import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "@/app/config/server";
import { ModelProvider, OPENAI_BASE_URL, OpenaiPath } from "@/app/constant";
import { ModelTestResult } from "@/app/utils/model-test";
import { buildOpenAIModelTestRequest } from "@/app/utils/openai-model-test";
import {
  checkCurrentRequestAccessUsage,
  getVerifiedAccessDeviceId,
  usageErrorResponse,
  withUsageAccounting,
} from "@/app/api/abuse-control";
import { auth, authErrorResponse } from "@/app/api/auth";
import { sanitizeOpenAIResponsesSafetyIdentifier } from "@/app/api/openai-safety";

const MODEL_TEST_MAX_MODELS = 1;

// 测试单个模型
async function testModel(
  req: NextRequest,
  requestBody: ReturnType<typeof buildOpenAIModelTestRequest>,
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
      serverConfig.openaiResponsesUrl ||
      serverConfig.baseUrl ||
      OPENAI_BASE_URL;
    if (!baseUrl.startsWith("http")) {
      baseUrl = `https://${baseUrl}`;
    }
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    const url = baseUrl.toLowerCase().endsWith(`/${OpenaiPath.ResponsesPath}`)
      ? baseUrl
      : `${baseUrl}/${OpenaiPath.ResponsesPath}`;

    // 发送请求
    const response = await withUsageAccounting(
      req,
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        cache: "no-store",
      }),
    );

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
    const authResult = await auth(req, ModelProvider.GPT);
    if (authResult.error) {
      return authErrorResponse(authResult);
    }

    const body = await req.json();
    const { models, timeoutSeconds = 5 } = body;

    if (!Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: "请提供要测试的模型列表" },
        { status: 400 },
      );
    }

    if (models.length > MODEL_TEST_MAX_MODELS) {
      return NextResponse.json(
        { error: "每次最多测试 1 个模型" },
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

    const verifiedDeviceId = await getVerifiedAccessDeviceId(req);
    const modelRequests = models.map((model) =>
      sanitizeOpenAIResponsesSafetyIdentifier(
        buildOpenAIModelTestRequest(String(model), serverConfig),
        verifiedDeviceId,
      ),
    );
    const usageCheck = await checkCurrentRequestAccessUsage(req, {
      estimatedTokens:
        Math.max(...modelRequests.map((request) => request.max_output_tokens)) +
        2,
    });
    if (!usageCheck.allowed) {
      return usageErrorResponse(usageCheck);
    }

    const testEntries = await Promise.all(
      modelRequests.map(async (requestBody) => [
        requestBody.model,
        await testModel(req, requestBody, serverConfig, apiKey, timeoutSeconds),
      ]),
    );
    const results = Object.fromEntries(testEntries) as Record<
      string,
      ModelTestResult
    >;

    return NextResponse.json({ results });
  } catch (error) {
    console.error("测试模型时出错:", error);
    return NextResponse.json({ error: "测试模型时出错" }, { status: 500 });
  }
}
