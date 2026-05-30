import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "@/app/config/server";
import { ModelProvider, OPENAI_BASE_URL } from "@/app/constant";
import { auth, authErrorResponse } from "@/app/api/auth";

export const runtime = "edge";

function normalizeBaseUrl(url: string) {
  const normalized = url.startsWith("http") ? url : `https://${url}`;
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function isAllowedTarget(url: URL, allowedBaseUrls: string[]) {
  return allowedBaseUrls.some((baseUrl) => {
    const allowed = new URL(normalizeBaseUrl(baseUrl));
    return url.origin === allowed.origin && url.pathname.startsWith("/v1/");
  });
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await auth(req, ModelProvider.GPT);
    if (authResult.error) {
      return authErrorResponse(authResult);
    }

    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const serverConfig = getServerSideConfig();
    const allowedBaseUrls = [
      serverConfig.openaiResponsesUrl || "",
      serverConfig.baseUrl || "",
      OPENAI_BASE_URL,
    ].filter(Boolean);
    if (!isAllowedTarget(targetUrl, allowedBaseUrls)) {
      return NextResponse.json(
        { error: "URL is not allowed" },
        { status: 403 },
      );
    }

    // 使用服务端的API密钥
    const apiKey = serverConfig.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server API key not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
