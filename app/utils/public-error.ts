export const ACCESS_RESTRICTED_ERROR_CODE = "access_restricted";

const MAX_PUBLIC_ERROR_DETAIL_LENGTH = 240;
const MAX_PUBLIC_REQUEST_ID_LENGTH = 128;
const SAFE_PUBLIC_REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const SENSITIVE_PUBLIC_ERROR_PATTERNS = [
  /\bauthorization\b/i,
  /\bbearer\b/i,
  /\bapi[-_\s]?key\b/i,
  /\b(?:access|refresh)[-_\s]?token\b/i,
  /\bclient[-_\s]?secret\b/i,
  /\b(?:cookie|set-cookie)\s*:/i,
  /\b(?:session(?:[-_\s]?id)?|password|passwd|private[-_\s]?key|credential)\s*[:=]\s*\S+/i,
  /(?:^|[\s;,])(?:[A-Z][A-Z0-9]*_)*(?:API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|SECRET_ACCESS_KEY|SECRET_KEY|CLIENT_SECRET|PASSWORD|PRIVATE_KEY|SESSION_SECRET)\s*=\s*\S+/i,
  /\bsk-[A-Za-z0-9_-]{6,}\b/i,
  /\b(?:token|secret)\s*[:=]\s*\S+/i,
  /\b(?:econnrefused|econnreset|enotfound|ehostunreach|etimedout|getaddrinfo)\b/i,
  /\bhttps?:\/\//i,
  /\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?\b/i,
  /\b[A-Za-z0-9.-]+\.(?:local|internal|lan)(?::\d+)?\b/i,
  /(?:^|\s)(?:\/Users\/|\/home\/|[A-Za-z]:\\)/,
];

type PublicErrorHeaders = {
  get(name: string): string | null;
};

export async function readResponsePayload(
  response: Pick<Response, "text" | "json">,
) {
  if (typeof response.text !== "function") {
    try {
      return { payload: await response.json(), text: "", isJson: true };
    } catch {
      return { payload: undefined, text: "", isJson: false };
    }
  }

  const text = await response.text();
  if (!text.trim()) {
    return { payload: undefined, text, isJson: false };
  }
  try {
    return { payload: JSON.parse(text), text, isJson: true };
  } catch {
    return { payload: undefined, text, isJson: false };
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function getPublicErrorDetail(payload: unknown) {
  const value = asRecord(payload);
  const nestedError = asRecord(value?.error);
  const response = asRecord(value?.Response ?? value?.response);
  const responseError = asRecord(response?.Error ?? response?.error);
  const header = asRecord(value?.header ?? value?.Header);
  return (
    nestedError?.message ??
    nestedError?.Message ??
    responseError?.message ??
    responseError?.Message ??
    header?.message ??
    header?.Message ??
    value?.error_msg ??
    value?.message ??
    value?.Message ??
    value?.msg
  );
}

function isPresentUpstreamError(value: unknown) {
  if (value === undefined || value === null || value === false || value === 0) {
    return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized !== "" && normalized !== "0";
  }
  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return true;
}

export function hasUpstreamErrorPayload(payload: unknown) {
  const value = asRecord(payload);
  if (!value) return false;
  if (isPresentUpstreamError(value.error)) return true;
  if (isPresentUpstreamError(value.error_code)) return true;

  const response = asRecord(value.Response ?? value.response);
  if (
    isPresentUpstreamError(response?.Error) ||
    isPresentUpstreamError(response?.error)
  ) {
    return true;
  }

  const header = asRecord(value.header ?? value.Header);
  const headerCode = header?.code ?? header?.Code;
  return isPresentUpstreamError(headerCode);
}

function sanitizePublicErrorDetail(value: unknown) {
  if (typeof value !== "string") return undefined;

  const normalized = value.replace(/\s+/g, " ").trim();
  if (
    !normalized ||
    normalized.length > MAX_PUBLIC_ERROR_DETAIL_LENGTH ||
    /[<>{}]/.test(normalized) ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalized) ||
    SENSITIVE_PUBLIC_ERROR_PATTERNS.some((pattern) => pattern.test(normalized))
  ) {
    return undefined;
  }

  return normalized;
}

function sanitizePublicRequestId(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length <= MAX_PUBLIC_REQUEST_ID_LENGTH &&
    SAFE_PUBLIC_REQUEST_ID_PATTERN.test(normalized)
    ? normalized
    : undefined;
}

function getPublicErrorRequestId(
  payload: unknown,
  headers?: PublicErrorHeaders,
) {
  const headerRequestId = headers?.get("x-request-id");

  const value = asRecord(payload);
  const nestedError = asRecord(value?.error);
  const response = asRecord(value?.Response ?? value?.response);
  const responseError = asRecord(response?.Error ?? response?.error);
  const candidates = [
    headerRequestId,
    nestedError?.request_id,
    nestedError?.requestId,
    nestedError?.RequestId,
    responseError?.request_id,
    responseError?.requestId,
    responseError?.RequestId,
    response?.request_id,
    response?.requestId,
    response?.RequestId,
    value?.request_id,
    value?.requestId,
    value?.RequestId,
  ];
  for (const candidate of candidates) {
    const requestId = sanitizePublicRequestId(candidate);
    if (requestId) return requestId;
  }

  return undefined;
}

export function getPublicUpstreamErrorMessage({
  fallback,
  payload,
  detail,
  headers,
}: {
  fallback: string;
  payload?: unknown;
  detail?: unknown;
  headers?: PublicErrorHeaders;
}) {
  const safeDetail = sanitizePublicErrorDetail(
    detail ?? getPublicErrorDetail(payload),
  );
  const requestId = getPublicErrorRequestId(payload, headers);
  const comparableFallback = fallback
    .trim()
    .replace(/[.:：。]+$/, "")
    .toLocaleLowerCase();
  const comparableDetail = safeDetail?.trim().toLocaleLowerCase();
  const detailAlreadyContainsFallback =
    !!comparableDetail &&
    (comparableDetail === comparableFallback ||
      comparableDetail.startsWith(`${comparableFallback} (`) ||
      comparableDetail.startsWith(`${comparableFallback}（`) ||
      comparableDetail.startsWith(`${comparableFallback}:`) ||
      comparableDetail.startsWith(`${comparableFallback}：`));
  const publicMessage = detailAlreadyContainsFallback
    ? safeDetail
    : `${fallback}${safeDetail ? `: ${safeDetail}` : ""}`;
  return `${publicMessage}${requestId ? ` [request_id: ${requestId}]` : ""}`;
}

export function isAccessRestrictedPublicError(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const error = value as { code?: unknown; msg?: unknown };
  return (
    error.code === ACCESS_RESTRICTED_ERROR_CODE ||
    error.msg === ACCESS_RESTRICTED_ERROR_CODE
  );
}

export function getAccessRestrictedPublicErrorMessage({
  response,
  payload,
  message,
}: {
  response: Pick<Response, "status">;
  payload?: unknown;
  message: string;
}) {
  return isAccessRestrictedPublicError(payload) ? message : undefined;
}

export function getPublicHttpErrorMessage({
  response,
  payload,
  fallback,
  accessRestrictedMessage,
}: {
  response: Pick<Response, "status" | "headers">;
  payload?: unknown;
  fallback: string;
  accessRestrictedMessage: string;
}) {
  return (
    getAccessRestrictedPublicErrorMessage({
      response,
      payload,
      message: accessRestrictedMessage,
    }) ??
    getPublicUpstreamErrorMessage({
      fallback,
      payload,
      headers: response.headers,
    })
  );
}
