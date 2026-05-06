import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../config/server";
import { ACCESS_CODE_PREFIX, ModelProvider } from "../constant";
import {
  checkAccessUsage,
  getClientIp,
  markSystemAccessCodeRequest,
} from "./abuse-control";
import { resolveAccessCodeProfile } from "../utils/access-control";

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isApiKey = !token.startsWith(ACCESS_CODE_PREFIX);

  return {
    accessCode: isApiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isApiKey ? token : "",
  };
}

export function validateAccessCode(accessCode: string) {
  const serverConfig = getServerSideConfig();
  if (!serverConfig.needCode) return true;

  return !!resolveAccessCodeProfile(accessCode, serverConfig.accessControl);
}

export type AuthResult =
  | {
      error: false;
    }
  | {
      error: true;
      msg: string;
      status?: number;
      retryAfterSeconds?: number;
    };

export function authErrorResponse(authResult: AuthResult) {
  if (!authResult.error) {
    return NextResponse.json({ error: false });
  }

  const publicMessage =
    authResult.status === 429
      ? "当前访问暂时受限，请稍后再试。"
      : authResult.msg;
  const headers =
    authResult.status === 429 && authResult.retryAfterSeconds
      ? { "Retry-After": String(authResult.retryAfterSeconds) }
      : undefined;

  return NextResponse.json(
    {
      error: true,
      msg: publicMessage,
      retryAfterSeconds: authResult.retryAfterSeconds,
    },
    {
      status: authResult.status ?? 401,
      headers,
    },
  );
}

export async function auth(
  req: NextRequest,
  modelProvider: ModelProvider,
): Promise<AuthResult> {
  const authToken = req.headers.get("Authorization") ?? "";

  // check if it is openai api key or user token
  const { accessCode, apiKey } = parseApiKey(authToken);

  const serverConfig = getServerSideConfig();
  const accessProfile = accessCode
    ? resolveAccessCodeProfile(accessCode, serverConfig.accessControl)
    : undefined;
  console.log("[Auth] access tier:", accessProfile?.tier ?? "none");
  console.log("[User IP] ", getClientIp(req));
  console.log("[Time] ", new Date().toLocaleString());

  if (serverConfig.needCode && !accessProfile && !apiKey) {
    return {
      error: true,
      msg: !accessCode ? "empty access code" : "wrong access code",
    };
  }

  if (serverConfig.hideUserApiKey && !!apiKey) {
    return {
      error: true,
      msg: "you are not allowed to access with your own api key",
    };
  }

  // if user does not provide an api key, inject system api key
  if (!apiKey) {
    const serverConfig = getServerSideConfig();

    // const systemApiKey =
    //   modelProvider === ModelProvider.GeminiPro
    //     ? serverConfig.googleApiKey
    //     : serverConfig.isAzure
    //     ? serverConfig.azureApiKey
    //     : serverConfig.apiKey;

    let systemApiKey: string | undefined;

    switch (modelProvider) {
      case ModelProvider.Stability:
        systemApiKey = serverConfig.stabilityApiKey;
        break;
      case ModelProvider.GeminiPro:
        systemApiKey = serverConfig.googleApiKey;
        break;
      case ModelProvider.Claude:
        systemApiKey = serverConfig.anthropicApiKey;
        break;
      case ModelProvider.Doubao:
        systemApiKey = serverConfig.bytedanceApiKey;
        break;
      case ModelProvider.Ernie:
        systemApiKey = serverConfig.baiduApiKey;
        break;
      case ModelProvider.Qwen:
        systemApiKey = serverConfig.alibabaApiKey;
        break;
      case ModelProvider.Moonshot:
        systemApiKey = serverConfig.moonshotApiKey;
        break;
      case ModelProvider.Iflytek:
        systemApiKey =
          serverConfig.iflytekApiKey + ":" + serverConfig.iflytekApiSecret;
        break;
      case ModelProvider.XAI:
        systemApiKey = serverConfig.xaiApiKey;
        break;
      case ModelProvider.ChatGLM:
        systemApiKey = serverConfig.chatglmApiKey;
        break;
      case ModelProvider.GPT:
      default:
        if (req.nextUrl.pathname.includes("azure/deployments")) {
          systemApiKey = serverConfig.azureApiKey;
        } else {
          systemApiKey = serverConfig.apiKey;
        }
    }

    if (systemApiKey) {
      if (accessProfile) {
        const usageCheck = await checkAccessUsage(req, accessProfile);
        if (!usageCheck.allowed) {
          return {
            error: true,
            msg: usageCheck.error,
            status: usageCheck.status,
            retryAfterSeconds: usageCheck.retryAfterSeconds,
          };
        }

        markSystemAccessCodeRequest(req, accessProfile);
      }

      console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${systemApiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
  };
}
