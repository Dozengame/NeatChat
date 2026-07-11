export const ACCESS_RESTRICTED_ERROR_CODE = "access_restricted";

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
