/** @jest-environment node */

import { NextRequest } from "next/server";

const mockAuth = jest.fn();
const mockGetServerSideConfig = jest.fn(() => ({
  apiKey: "server-secret",
  baseUrl: "https://api.example.test",
  openaiResponsesUrl: "https://api.example.test/v1/responses",
  openaiMaxOutputTokens: 128000,
}));

jest.mock("../app/api/auth", () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
  authErrorResponse: jest.fn(),
}));

jest.mock("../app/config/server", () => ({
  getServerSideConfig: () => mockGetServerSideConfig(),
}));

jest.mock("../app/api/abuse-control", () => ({
  checkCurrentRequestAccessUsage: jest.fn(async () => ({ allowed: true })),
  getVerifiedAccessDeviceId: jest.fn(async () => undefined),
  usageErrorResponse: jest.fn(),
  withUsageAccounting: jest.fn(async (_req, response) => response),
}));

jest.mock("../app/api/openai-safety", () => ({
  sanitizeOpenAIResponsesSafetyIdentifier: jest.fn((payload) => payload),
}));

import { POST } from "../app/api/model-test/route";
import {
  checkCurrentRequestAccessUsage,
  usageErrorResponse,
} from "../app/api/abuse-control";

function makeRequest(token: string, timeoutSeconds = 5) {
  return new NextRequest("http://localhost/api/model-test", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ models: ["gpt-5.6-terra"], timeoutSeconds }),
  });
}

describe("model-test authenticated credential routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ error: false });
    global.fetch = jest.fn(async () =>
      Response.json(
        { id: "resp_test", status: "completed", output_text: "Hello" },
        { status: 200 },
      ),
    ) as jest.Mock;
  });

  test("tests with the user's API key instead of the server key", async () => {
    const response = await POST(makeRequest("user-secret"));

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.test/v1/responses",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer user-secret",
        }),
      }),
    );
    expect(
      JSON.stringify((global.fetch as jest.Mock).mock.calls),
    ).not.toContain("server-secret");
    expect((await response.json()).results["gpt-5.6-terra"]).toMatchObject({
      success: true,
      message: expect.stringContaining("文本生成通过"),
    });
  });

  test("reserves the model maximum when the wire output limit is omitted", async () => {
    mockGetServerSideConfig.mockReturnValueOnce({
      apiKey: "server-secret",
      baseUrl: "https://api.example.test",
      openaiResponsesUrl: "https://api.example.test/v1/responses",
      openaiMaxOutputTokens: 0,
    });
    const response = await POST(makeRequest("user-secret"));
    expect(response.status).toBe(200);
    expect(checkCurrentRequestAccessUsage).toHaveBeenCalledWith(
      expect.anything(),
      { estimatedTokens: 128002 },
    );
    const request = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(request.max_output_tokens).toBeUndefined();
  });

  test("does not issue an unbounded probe when the quota preflight denies it", async () => {
    mockGetServerSideConfig.mockReturnValueOnce({
      apiKey: "server-secret",
      baseUrl: "https://api.example.test",
      openaiResponsesUrl: "https://api.example.test/v1/responses",
      openaiMaxOutputTokens: 0,
    });
    (checkCurrentRequestAccessUsage as jest.Mock).mockResolvedValueOnce({
      allowed: false,
    });
    (usageErrorResponse as jest.Mock).mockReturnValueOnce(
      Response.json({ error: "quota" }, { status: 429 }),
    );
    const response = await POST(makeRequest("user-secret"));
    expect(response.status).toBe(429);
    expect(checkCurrentRequestAccessUsage).toHaveBeenCalledWith(
      expect.anything(),
      { estimatedTokens: 128002 },
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("uses the system key injected by auth for an access-code request", async () => {
    mockAuth.mockImplementation(async (req: NextRequest) => {
      req.headers.set("Authorization", "Bearer server-secret");
      return { error: false };
    });

    const response = await POST(makeRequest("nk-user-code"));

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.test/v1/responses",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer server-secret",
        }),
      }),
    );
  });

  test("does not return upstream credentials or raw error objects", async () => {
    global.fetch = jest.fn(async () =>
      Response.json(
        {
          error: {
            message: "Authorization: Bearer upstream-secret",
            request_id: "req_model_test_123",
          },
          debug: { apiKey: "sk-upstream-secret" },
        },
        { status: 400 },
      ),
    ) as jest.Mock;

    const response = await POST(makeRequest("user-secret"));
    const body = await response.json();
    const result = body.results["gpt-5.6-terra"];
    const serialized = JSON.stringify(result);

    expect(result.message).toBe(
      "测试失败 (400) [request_id: req_model_test_123]",
    );
    expect(result.error).toEqual({ status: 400 });
    expect(serialized).not.toContain("upstream-secret");
    expect(serialized).not.toContain("Authorization");
    expect(serialized).not.toContain("debug");
  });

  test("sanitizes rejected request errors", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("Bearer transport-secret");
    }) as jest.Mock;

    const response = await POST(makeRequest("user-secret"));
    const body = await response.json();
    const result = body.results["gpt-5.6-terra"];
    const serialized = JSON.stringify(result);

    expect(result.message).toBe("测试出错");
    expect(serialized).not.toContain("transport-secret");
    expect(serialized).not.toContain("Bearer");
  });

  test.each([
    [
      {
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
      },
      "incomplete",
    ],
    [
      { status: "failed", error: { message: "Bearer failed-secret" } },
      "upstream_error",
    ],
    [{ status: "completed", output: [] }, "empty_output"],
    [{ id: "resp_only" }, "incomplete_response"],
  ])(
    "does not report HTTP 200 %j as generation success",
    async (payload, type) => {
      global.fetch = jest.fn(async () => Response.json(payload)) as jest.Mock;

      const response = await POST(makeRequest("user-secret"));
      const result = (await response.json()).results["gpt-5.6-terra"];

      expect(result).toMatchObject({ success: false, error: { type } });
      expect(JSON.stringify(result)).not.toMatch(/failed-secret|Bearer/);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    },
  );

  test("does not expose a non-JSON success body", async () => {
    global.fetch = jest.fn(
      async () => new Response("Bearer body-secret"),
    ) as jest.Mock;

    const response = await POST(makeRequest("user-secret"));
    const result = (await response.json()).results["gpt-5.6-terra"];

    expect(result).toMatchObject({
      success: false,
      error: { type: "invalid_response" },
    });
    expect(JSON.stringify(result)).not.toMatch(/body-secret|Bearer/);
  });

  test("keeps body consumption within the request timeout", async () => {
    jest.useFakeTimers();
    try {
      global.fetch = jest.fn(
        async () => new Response(new ReadableStream({ start() {} })),
      ) as jest.Mock;
      const pending = POST(makeRequest("user-secret", 1));

      await jest.advanceTimersByTimeAsync(1000);
      const response = await pending;
      const result = (await response.json()).results["gpt-5.6-terra"];

      expect(result).toMatchObject({
        success: false,
        message: "请求超时",
        timeout: true,
        error: { type: "timeout" },
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
