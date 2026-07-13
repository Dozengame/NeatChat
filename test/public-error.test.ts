import {
  getAccessRestrictedPublicErrorMessage,
  getPublicUpstreamErrorMessage,
  isAccessRestrictedPublicError,
} from "../app/utils/public-error";

describe("public API error localization", () => {
  test("identifies the stable access restriction code", () => {
    expect(
      isAccessRestrictedPublicError({
        error: true,
        code: "access_restricted",
      }),
    ).toBe(true);
    expect(isAccessRestrictedPublicError({ error: true, msg: "other" })).toBe(
      false,
    );
  });

  test("maps a restricted HTTP response to localized copy", () => {
    const response = { status: 429 } as Response;
    const payload = {
      code: "access_restricted",
      msg: "access_restricted",
    };

    expect(
      getAccessRestrictedPublicErrorMessage({
        response,
        payload,
        message: "localized access restriction",
      }),
    ).toBe("localized access restriction");
  });

  test("does not replace unrelated provider errors", () => {
    expect(
      getAccessRestrictedPublicErrorMessage({
        response: { status: 400 },
        payload: { error: { message: "invalid request" } },
        message: "localized access restriction",
      }),
    ).toBeUndefined();
  });

  test("keeps a short actionable detail and a safe request id", () => {
    expect(
      getPublicUpstreamErrorMessage({
        fallback: "Upstream request failed (400)",
        payload: {
          error: {
            message: "Invalid image size",
            request_id: "req_123-safe",
          },
        },
      }),
    ).toBe(
      "Upstream request failed (400): Invalid image size [request_id: req_123-safe]",
    );
  });

  test.each([
    "Authorization: Bearer upstream-secret",
    "Invalid API key provided: sk-proj-super-secret-value",
    "<html><body>proxy failure</body></html>",
    "connect ECONNREFUSED http://internal-gateway.local:8080/v1/responses",
    "connect ECONNREFUSED internal-gateway.local:8080",
    "Cookie: session=supersecret",
    "Set-Cookie: session_id=supersecret",
    "password=supersecret",
    "private-key: supersecret",
    "OPENAI_API_KEY=upstream-secret-value",
    "UPSTREAM_ACCESS_TOKEN=abc123",
    "AWS_SECRET_ACCESS_KEY=abc123",
    "Failed to load /Users/service/.config/private-provider.json",
    '{"error":"raw upstream response"}',
    "x".repeat(1000),
  ])("drops unsafe upstream detail from public errors", (message) => {
    const publicMessage = getPublicUpstreamErrorMessage({
      fallback: "Upstream request failed (502)",
      payload: {
        error: { message, request_id: "req_safe" },
      },
    });

    expect(publicMessage).toBe(
      "Upstream request failed (502) [request_id: req_safe]",
    );
    expect(publicMessage).not.toContain(message);
  });

  test("drops an unsafe request id instead of echoing it", () => {
    expect(
      getPublicUpstreamErrorMessage({
        fallback: "Upstream request failed",
        payload: {
          error: {
            message: "Invalid request",
            request_id: "req_123 Authorization: Bearer secret",
          },
        },
      }),
    ).toBe("Upstream request failed: Invalid request");
  });
});
