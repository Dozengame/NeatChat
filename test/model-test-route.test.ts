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

jest.mock("../app/utils/request-timeout", () => ({
  withAbortTimeout: jest.fn(async ({ operation }) => operation()),
}));

import { POST } from "../app/api/model-test/route";

function makeRequest(token: string) {
  return new NextRequest("http://localhost/api/model-test", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ models: ["gpt-5.6-terra"] }),
  });
}

describe("model-test authenticated credential routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ error: false });
    global.fetch = jest.fn(async () =>
      Response.json({ id: "resp_test" }, { status: 200 }),
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
    expect(JSON.stringify((global.fetch as jest.Mock).mock.calls)).not.toContain(
      "server-secret",
    );
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
});
