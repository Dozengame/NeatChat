import { getClientConfig } from "../config/client";
import { ACCESS_CODE_PREFIX, ServiceProvider } from "../constant";
import { useAccessStore } from "../store/access";
import { useAppConfig } from "../store/config";
import { getRegisteredChatStore } from "../store/chat-state-link";

export function getBearerToken(
  apiKey: string,
  noBearer: boolean = false,
): string {
  return validString(apiKey)
    ? `${noBearer ? "" : "Bearer "}${apiKey.trim()}`
    : "";
}

function validString(x: string): boolean {
  return x?.length > 0;
}

export function getHeaders(
  ignoreHeaders: boolean = false,
  providerName?: string,
) {
  const accessStore = useAccessStore.getState();
  const appConfig = useAppConfig.getState();
  let headers: Record<string, string> = {};
  if (!ignoreHeaders) {
    headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  const clientConfig = getClientConfig();

  function getConfig() {
    const effectiveProviderName =
      providerName ??
      getRegisteredChatStore()?.getState().currentSession?.().mask.modelConfig
        .providerName ??
      appConfig.modelConfig.providerName;
    const isGoogle = effectiveProviderName === ServiceProvider.Google;
    const isAzure = effectiveProviderName === ServiceProvider.Azure;
    const isAnthropic = effectiveProviderName === ServiceProvider.Anthropic;
    const isBaidu = effectiveProviderName == ServiceProvider.Baidu;
    const isByteDance = effectiveProviderName === ServiceProvider.ByteDance;
    const isAlibaba = effectiveProviderName === ServiceProvider.Alibaba;
    const isMoonshot = effectiveProviderName === ServiceProvider.Moonshot;
    const isIflytek = effectiveProviderName === ServiceProvider.Iflytek;
    const isXAI = effectiveProviderName === ServiceProvider.XAI;
    const isChatGLM = effectiveProviderName === ServiceProvider.ChatGLM;
    const isEnabledAccessControl = accessStore.enabledAccessControl();
    const apiKey = isGoogle
      ? accessStore.googleApiKey
      : isAzure
      ? accessStore.azureApiKey
      : isAnthropic
      ? accessStore.anthropicApiKey
      : isByteDance
      ? accessStore.bytedanceApiKey
      : isAlibaba
      ? accessStore.alibabaApiKey
      : isMoonshot
      ? accessStore.moonshotApiKey
      : isXAI
      ? accessStore.xaiApiKey
      : isChatGLM
      ? accessStore.chatglmApiKey
      : isIflytek
      ? accessStore.iflytekApiKey && accessStore.iflytekApiSecret
        ? accessStore.iflytekApiKey + ":" + accessStore.iflytekApiSecret
        : ""
      : accessStore.hideUserApiKey ||
        accessStore.lockedFields?.includes("apiKey")
      ? ""
      : accessStore.openaiApiKey;
    return {
      isGoogle,
      isAzure,
      isAnthropic,
      isBaidu,
      apiKey,
      isEnabledAccessControl,
    };
  }

  function getAuthHeader(): string {
    return isAzure
      ? "api-key"
      : isAnthropic
      ? "x-api-key"
      : isGoogle
      ? "x-goog-api-key"
      : "Authorization";
  }

  const {
    isGoogle,
    isAzure,
    isAnthropic,
    isBaidu,
    apiKey,
    isEnabledAccessControl,
  } = getConfig();

  if (isBaidu && clientConfig?.isApp) return headers;

  const authHeader = getAuthHeader();

  const bearerToken = getBearerToken(
    apiKey,
    isAzure || isAnthropic || isGoogle,
  );

  if (bearerToken) {
    headers[authHeader] = bearerToken;
  } else if (isEnabledAccessControl && validString(accessStore.accessCode)) {
    headers["Authorization"] = getBearerToken(
      ACCESS_CODE_PREFIX + accessStore.accessCode,
    );
  }

  return headers;
}
