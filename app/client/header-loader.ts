export async function getHeadersAsync(ignoreHeaders = false) {
  const { getHeaders } = await import("./headers");
  return getHeaders(ignoreHeaders);
}
