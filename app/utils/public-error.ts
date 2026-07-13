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

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function getPublicErrorDetail(payload: unknown) {
  const value = asRecord(payload);
  const nestedError = asRecord(value?.error);
  return nestedError?.message ?? value?.message ?? value?.msg;
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
  const candidates = [
    headerRequestId,
    nestedError?.request_id,
    nestedError?.requestId,
    value?.request_id,
    value?.requestId,
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
  return `${fallback}${safeDetail ? `: ${safeDetail}` : ""}${
    requestId ? ` [request_id: ${requestId}]` : ""
  }`;
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
  return response.status === 429 || isAccessRestrictedPublicError(payload)
    ? message
    : undefined;
}
