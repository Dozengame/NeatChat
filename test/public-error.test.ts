import {
  getAccessRestrictedPublicErrorMessage,
  hasUpstreamErrorPayload,
  getPublicUpstreamErrorMessage,
  isAccessRestrictedPublicError,
  readResponsePayload,
} from "../app/utils/public-error";

describe("public API error localization", () => {
  test("reads JSON safely without throwing on a proxy HTML response", async () => {
    await expect(
      readResponsePayload({
        text: async () => "<html>bad gateway</html>",
        json: async () => {
          throw new Error("should not run");
        },
      } as any),
    ).resolves.toEqual({
      payload: undefined,
      text: "<html>bad gateway</html>",
      isJson: false,
    });
  });

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

  test("does not confuse an upstream 429 rate limit with access control", () => {
    expect(
      getAccessRestrictedPublicErrorMessage({
        response: { status: 429 },
        payload: { error: { message: "rate limit exceeded" } },
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
    ["Request failed.", "Request failed (500)."],
    ["请求失败。", "请求失败（500）。"],
  ])(
    "does not repeat a localized fallback already present in safe detail",
    (fallback, detail) => {
      expect(
        getPublicUpstreamErrorMessage({
          fallback,
          detail,
          payload: { request_id: "req_safe" },
        }),
      ).toBe(`${detail} [request_id: req_safe]`);
    },
  );

  test.each([
    [{ error: { message: "failed" } }, "failed"],
    [
      { error_code: 336006, error_msg: "invalid message order" },
      "invalid message order",
    ],
    [
      {
        Response: {
          Error: { Code: "InvalidParameter", Message: "invalid model" },
          RequestId: "req-tencent-1",
        },
      },
      "invalid model [request_id: req-tencent-1]",
    ],
    [
      { header: { code: 10013, message: "invalid request" } },
      "invalid request",
    ],
  ])("detects supported provider-native error envelopes", (payload, detail) => {
    expect(hasUpstreamErrorPayload(payload)).toBe(true);
    expect(
      getPublicUpstreamErrorMessage({ fallback: "Request failed", payload }),
    ).toBe(`Request failed${detail ? `: ${detail}` : ""}`);
  });

  test.each([
    { error: false },
    { error: "" },
    { error_code: 0 },
    { error_code: "0" },
    { Response: { Error: null } },
    { Response: { Error: {} } },
    { header: { code: 0 } },
  ])("does not flag a successful provider envelope", (payload) => {
    expect(hasUpstreamErrorPayload(payload)).toBe(false);
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
