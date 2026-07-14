export async function getHeadersAsync(
  ignoreHeaders = false,
  providerName?: string,
) {
  const { getHeaders } = await import("./headers");
  return getHeaders(ignoreHeaders, providerName);
}
