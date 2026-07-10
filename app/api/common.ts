import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../config/server";
import { OPENAI_BASE_URL, OpenaiPath, ServiceProvider } from "../constant";
import { cloudflareAIGatewayUrl } from "../utils/cloudflare";
import { getModelProvider, isModelAvailableInServer } from "../utils/model";
import {
  applyOpenAISafetyIdentifier,
  sanitizeOpenAIResponsesSafetyIdentifier,
} from "./openai-safety";

const serverConfig = getServerSideConfig();
const OPENAI_PROXY_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;

function isOpenAIImagePath(path: string) {
  return path === OpenaiPath.ImagePath || path === OpenaiPath.ImageEditPath;
}

export async function requestOpenai(req: NextRequest) {
  const controller = new AbortController();

  const isAzure = req.nextUrl.pathname.includes("azure/deployments");
  const requestContentType = req.headers.get("content-type") ?? "";
  const isMultipartRequest = requestContentType
    .toLowerCase()
    .includes("multipart/form-data");

  var authValue,
    authHeaderName = "";
  if (isAzure) {
    authValue =
      req.headers
        .get("Authorization")
        ?.trim()
        .replaceAll("Bearer ", "")
        .trim() ?? "";

    authHeaderName = "api-key";
  } else {
    authValue = req.headers.get("Authorization") ?? "";
    authHeaderName = "Authorization";
  }

  let path = `${req.nextUrl.pathname}`.replaceAll("/api/openai/", "");

  let baseUrl =
    (isAzure
      ? serverConfig.azureUrl
      : path === OpenaiPath.ResponsesPath
      ? serverConfig.openaiResponsesUrl || serverConfig.baseUrl
      : isOpenAIImagePath(path)
      ? serverConfig.openaiImagesUrl || serverConfig.baseUrl
      : serverConfig.baseUrl) || OPENAI_BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  console.log("[Proxy] ", path);
  console.log("[Base Url]", baseUrl);

  const timeoutId = setTimeout(() => {
    controller.abort(
      new Error(
        `OpenAI proxy request timed out after ${Math.round(
          OPENAI_PROXY_REQUEST_TIMEOUT_MS / 1000,
        )} seconds`,
      ),
    );
  }, OPENAI_PROXY_REQUEST_TIMEOUT_MS);

  if (isAzure) {
    const azureApiVersion =
      req?.nextUrl?.searchParams?.get("api-version") ||
      serverConfig.azureApiVersion;
    baseUrl = baseUrl.split("/deployments").shift() as string;
    path = `${req.nextUrl.pathname.replaceAll(
      "/api/azure/",
      "",
    )}?api-version=${azureApiVersion}`;

    // Forward compatibility:
    // if display_name(deployment_name) not set, and '{deploy-id}' in AZURE_URL
    // then using default '{deploy-id}'
    if (serverConfig.customModels && serverConfig.azureUrl) {
      const modelName = path.split("/")[1];
      let realDeployName = "";
      serverConfig.customModels
        .split(",")
        .filter((v) => !!v && !v.startsWith("-") && v.includes(modelName))
        .forEach((m) => {
          const [fullName, displayName] = m.split("=");
          const [_, providerName] = getModelProvider(fullName);
          if (providerName === "azure" && !displayName) {
            const [_, deployId] = (serverConfig?.azureUrl ?? "").split(
              "deployments/",
            );
            if (deployId) {
              realDeployName = deployId;
            }
          }
        });
      if (realDeployName) {
        console.log("[Replace with DeployId", realDeployName);
        path = path.replaceAll(modelName, realDeployName);
      }
    }
  }

  const fetchUrl =
    path === OpenaiPath.ResponsesPath &&
    baseUrl.toLowerCase().endsWith(`/${OpenaiPath.ResponsesPath}`)
      ? cloudflareAIGatewayUrl(baseUrl)
      : cloudflareAIGatewayUrl(`${baseUrl}/${path}`);
  console.log("fetchUrl", fetchUrl);
  const fetchHeaders: Record<string, string> = {
    "Content-Type": isMultipartRequest
      ? requestContentType
      : "application/json",
    "Cache-Control": "no-store",
    [authHeaderName]: authValue,
    ...(serverConfig.openaiOrgId && {
      "OpenAI-Organization": serverConfig.openaiOrgId,
    }),
  };
  const fetchOptions: RequestInit = {
    headers: fetchHeaders,
    method: req.method,
    body: req.body,
    // to fix #2485: https://stackoverflow.com/questions/55920957/cloudflare-worker-typeerror-one-time-use-body
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  const shouldInspectRequestBody =
    !!req.body &&
    (!!serverConfig.customModels || path === OpenaiPath.ResponsesPath);
  if (shouldInspectRequestBody) {
    try {
      let requestModel = "";
      if (isMultipartRequest) {
        const formData = await req.formData();
        requestModel = String(formData.get("model") ?? "");
        fetchOptions.body = formData;
        delete fetchHeaders["Content-Type"];
      } else {
        const clonedBody = await req.text();
        fetchOptions.body = clonedBody;

        let jsonBody = JSON.parse(clonedBody) as Record<string, unknown>;
        if (path === OpenaiPath.ResponsesPath) {
          jsonBody = sanitizeOpenAIResponsesSafetyIdentifier(jsonBody);
          fetchOptions.body = JSON.stringify(jsonBody);
          try {
            jsonBody = await applyOpenAISafetyIdentifier(req, jsonBody);
            fetchOptions.body = JSON.stringify(jsonBody);
          } catch (error) {
            console.error("[OpenAI] safety identifier injection failed", error);
          }
        }
        requestModel = typeof jsonBody.model === "string" ? jsonBody.model : "";
      }

      if (
        serverConfig.customModels &&
        isModelAvailableInServer(
          serverConfig.customModels,
          String(requestModel),
          (isAzure ? ServiceProvider.Azure : ServiceProvider.OpenAI) as string,
        )
      ) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          {
            error: true,
            message: `you are not allowed to use ${requestModel} model`,
          },
          {
            status: 403,
          },
        );
      }
    } catch (e) {
      console.error("[OpenAI] request body preprocessing failed", e);
    }
  }

  try {
    const res = await fetch(fetchUrl, fetchOptions);

    // Extract the OpenAI-Organization header from the response
    const openaiOrganizationHeader = res.headers.get("OpenAI-Organization");

    // Check if serverConfig.openaiOrgId is defined and not an empty string
    if (serverConfig.openaiOrgId && serverConfig.openaiOrgId.trim() !== "") {
      // If openaiOrganizationHeader is present, log it; otherwise, log that the header is not present
      console.log("[Org ID]", openaiOrganizationHeader);
    } else {
      console.log("[Org ID] is not set up.");
    }

    // to prevent browser prompt for credentials
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    // to disable nginx buffering
    newHeaders.set("X-Accel-Buffering", "no");

    // Conditionally delete the OpenAI-Organization header from the response if [Org ID] is undefined or empty (not setup in ENV)
    // Also, this is to prevent the header from being sent to the client
    if (!serverConfig.openaiOrgId || serverConfig.openaiOrgId.trim() === "") {
      newHeaders.delete("OpenAI-Organization");
    }

    // The latest version of the OpenAI API forced the content-encoding to be "br" in json response
    // So if the streaming is disabled, we need to remove the content-encoding header
    // Because Vercel uses gzip to compress the response, if we don't remove the content-encoding header
    // The browser will try to decode the response with brotli and fail
    newHeaders.delete("content-encoding");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
