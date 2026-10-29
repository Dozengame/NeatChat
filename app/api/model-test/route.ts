import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "@/app/config/server";
import {
  ACCESS_CODE_PREFIX,
  ModelProvider,
  OPENAI_BASE_URL,
  OpenaiPath,
} from "@/app/constant";
import { ModelTestResult } from "@/app/utils/model-test";
import {
  buildOpenAIModelTestRequest,
  getOpenAIModelTestResult,
} from "@/app/utils/openai-model-test";
import {
  checkCurrentRequestAccessUsage,
  getVerifiedAccessDeviceId,
  usageErrorResponse,
  withUsageAccounting,
} from "@/app/api/abuse-control";
import { auth, authErrorResponse } from "@/app/api/auth";
import { sanitizeOpenAIResponsesSafetyIdentifier } from "@/app/api/openai-safety";
import { withAbortTimeout } from "@/app/utils/request-timeout";
import { getOpenAIResponsesMaxOutputTokensLimit } from "@/app/utils/openai-responses";
import {
  getPublicUpstreamErrorMessage,
  readResponsePayload,
} from "@/app/utils/public-error";

const MODEL_TEST_MAX_MODELS = 1;

function getAuthenticatedApiKey(req: NextRequest) {
  const authorization = req.headers.get("Authorization")?.trim() ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token || token.startsWith(ACCESS_CODE_PREFIX)) return undefined;
  return token;
}

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
    const controller = new AbortController();

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
    const { response, payload, isJson } = await withAbortTimeout({
      controller,
      timeoutMs: timeoutSeconds * 1000,
      operation: async () => {
        const upstreamResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
          cache: "no-store",
        });
        const response = await withUsageAccounting(req, upstreamResponse);
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
    const apiKey = getAuthenticatedApiKey(req);

    if (!apiKey) {
      return NextResponse.json(
        { error: "未配置可用的API密钥" },
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
        Math.max(
          ...modelRequests.map(
            (request) =>
              request.max_output_tokens ??
              getOpenAIResponsesMaxOutputTokensLimit(request.model),
          ),
        ) + 2,
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
