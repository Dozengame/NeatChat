import { webcrypto } from "crypto";

import {
  checkAccessUsage,
  createSignedAccessDeviceId,
  getVerifiedAccessDeviceId,
  markSystemAccessCodeRequest,
  resetAccessUsageForTests,
  usageErrorResponse,
  withUsageAccounting,
} from "../app/api/abuse-control";
import {
  buildAccessControlConfig,
  estimateTokenUsageFromRequestJson,
  extractTokenUsageFromJson,
  getEffectiveDailyTokenLimit,
  isIpWhitelisted,
  resolveAccessCodeProfile,
} from "../app/utils/access-control";

function makeRequest(
  accessCode: string,
  ip: string,
  options: {
    cookies?: Record<string, string | undefined>;
    deviceHeader?: string;
  } = {},
) {
  const headers = new Headers({
    Authorization: `Bearer nk-${accessCode}`,
    "x-forwarded-for": ip,
  });
  if (options.deviceHeader) {
    headers.set("x-neatchat-device-id", options.deviceHeader);
  }

  return {
    method: "POST",
    headers,
    cookies: {
      get: (name: string) => {
        const value = options.cookies?.[name];
        return value ? { name, value } : undefined;
      },
    },
    nextUrl: new URL("https://neatchat.test/api/openai/v1/responses"),
  } as any;
}

function makeJsonRequest(accessCode: string, ip: string, body: unknown) {
  return {
    ...makeRequest(accessCode, ip),
    headers: new Headers({
      Authorization: `Bearer nk-${accessCode}`,
      "content-type": "application/json",
      "x-forwarded-for": ip,
    }),
    clone: () => ({
      text: async () => JSON.stringify(body),
    }),
  } as any;
}

async function recordUsage(req: any, totalTokens: number) {
  const body = JSON.stringify({
    response: {
      usage: {
        total_tokens: totalTokens,
      },
    },
  });

  await withUsageAccounting(req, {
    status: 200,
    statusText: "OK",
    headers: new Headers({
      "content-type": "application/json",
    }),
    text: async () => body,
  } as any);
}

describe("access control tiers", () => {
  const originalEnv = process.env;

  beforeAll(() => {
    if (!globalThis.crypto?.subtle) {
      Object.defineProperty(globalThis, "crypto", {
        value: webcrypto,
        configurable: true,
      });
    }

    if (typeof Response === "undefined") {
      (globalThis as any).Response = class {
        body: unknown;
        status: number;
        statusText: string;
        headers: Headers;

        constructor(body?: unknown, init?: ResponseInit) {
          this.body = body;
          this.status = init?.status ?? 200;
          this.statusText = init?.statusText ?? "";
          this.headers = new Headers(init?.headers);
        }

        async text() {
          return typeof this.body === "string" ? this.body : "";
        }
      };
    }

    if (typeof Response.json !== "function") {
      Object.defineProperty(Response, "json", {
        value: (body: unknown, init?: ResponseInit) =>
          new Response(JSON.stringify(body), {
            ...init,
            headers: {
              "content-type": "application/json",
              ...(init?.headers ?? {}),
            },
          }),
        configurable: true,
      });
    }
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CODE;
    delete process.env.ACCESS_CODE_ADMIN;
    delete process.env.ACCESS_CODE_ADVANCED;
    delete process.env.ACCESS_CODE_NORMAL;
    delete process.env.ACCESS_IP_WHITELIST;
    delete process.env.ACCESS_DEVICE_ID_ENABLED;
    delete process.env.ACCESS_DEVICE_ID_SECRET;
    delete process.env.ACCESS_DEVICE_ID_COOKIE_NAME;
    delete process.env.ACCESS_DEVICE_ID_MAX_AGE_DAYS;
    delete process.env.ACCESS_IP_BURST_GUARD_ENABLED;
    delete process.env.ACCESS_IP_BURST_TOKEN_LIMIT;
    delete process.env.ACCESS_IP_BURST_WINDOW_SECONDS;
    delete process.env.ACCESS_USAGE_REDIS_URL;
    delete process.env.ACCESS_USAGE_REDIS_TOKEN;
    delete process.env.ACCESS_USAGE_STATE_VERSION;
    delete process.env.NEATCHAT_REDIS_KV_REST_API_URL;
    delete process.env.NEATCHAT_REDIS_KV_REST_API_TOKEN;
    delete process.env.NEATCHAT_REDIS_KV_REST_API_READ_ONLY_TOKEN;
    delete process.env.NEATCHAT_REDIS_KV_URL;
    delete process.env.NEATCHAT_REDIS_REDIS_URL;
    delete process.env.NEATCHAT_REDIS_REST_API_URL;
    delete process.env.NEATCHAT_REDIS_REST_API_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.OPENAI_API_KEY = "test-system-key";
    resetAccessUsageForTests();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("maps env access codes to admin, advanced, and normal tiers", () => {
    process.env.ACCESS_CODE_ADMIN = "admin-key";
    process.env.ACCESS_CODE_ADVANCED = "advanced-key";
    process.env.ACCESS_CODE_NORMAL = "normal-key";

    const config = buildAccessControlConfig(process.env);

    expect(resolveAccessCodeProfile("admin-key", config)).toMatchObject({
      tier: "admin",
      dailyTokenLimit: null,
    });
    expect(resolveAccessCodeProfile("advanced-key", config)).toMatchObject({
      tier: "advanced",
      dailyTokenLimit: 500000,
    });
    expect(resolveAccessCodeProfile("normal-key", config)).toMatchObject({
      tier: "normal",
      dailyTokenLimit: 200000,
    });
  });

  test("keeps legacy CODE valid as a normal limited access code", () => {
    process.env.CODE = "legacy-key";

    const config = buildAccessControlConfig(process.env);
    expect(resolveAccessCodeProfile("legacy-key", config)).toMatchObject({
      tier: "legacy",
      dailyTokenLimit: 200000,
    });
  });

  test("does not treat an empty legacy CODE as a valid access code", () => {
    process.env.CODE = "";
    process.env.ACCESS_CODE_NORMAL = "normal-key";

    const config = buildAccessControlConfig(process.env);

    expect(config.profiles).toHaveLength(1);
    expect(resolveAccessCodeProfile("", config)).toBeUndefined();
    expect(resolveAccessCodeProfile("normal-key", config)).toMatchObject({
      tier: "normal",
    });
  });

  test("doubles daily tokens for whitelisted IPs", () => {
    process.env.ACCESS_CODE_ADVANCED = "advanced-key";
    process.env.ACCESS_IP_WHITELIST = "183.6.56.84,10.0.0.0/24";

    const config = buildAccessControlConfig(process.env);
    const profile = resolveAccessCodeProfile("advanced-key", config);

    expect(profile).toBeTruthy();
    expect(isIpWhitelisted("183.6.56.84", config.ipWhitelist)).toBe(true);
    expect(isIpWhitelisted("10.0.0.12", config.ipWhitelist)).toBe(true);
    expect(
      getEffectiveDailyTokenLimit({
        profile: profile!,
        ip: "183.6.56.84",
        config,
      }),
    ).toBe(1000000);
    expect(
      getEffectiveDailyTokenLimit({
        profile: profile!,
        ip: "8.8.8.8",
        config,
      }),
    ).toBe(500000);
  });

  test("counts same advanced key separately by IP and applies whitelist multiplier", async () => {
    process.env.ACCESS_CODE_ADVANCED = "advanced-key";
    process.env.ACCESS_IP_WHITELIST = "183.6.56.84";
    process.env.ACCESS_BURST_TOKEN_LIMIT = "9999999";
    const profile = resolveAccessCodeProfile(
      "advanced-key",
      buildAccessControlConfig(process.env),
    )!;

    const whitelistReq = makeRequest("advanced-key", "183.6.56.84");
    expect(await checkAccessUsage(whitelistReq, profile)).toEqual({
      allowed: true,
    });
    markSystemAccessCodeRequest(whitelistReq, profile);
    await recordUsage(whitelistReq, 600000);

    const whitelistReqAfterUsage = makeRequest("advanced-key", "183.6.56.84");
    expect(await checkAccessUsage(whitelistReqAfterUsage, profile)).toEqual({
      allowed: true,
    });

    const normalIpReq = makeRequest("advanced-key", "8.8.8.8");
    expect(await checkAccessUsage(normalIpReq, profile)).toEqual({
      allowed: true,
    });
    markSystemAccessCodeRequest(normalIpReq, profile);
    await recordUsage(normalIpReq, 500000);

    const sameNormalIpReq = makeRequest("advanced-key", "8.8.8.8");
    expect(await checkAccessUsage(sameNormalIpReq, profile)).toMatchObject({
      allowed: false,
      error: "daily_token_limit_exceeded",
      status: 429,
    });

    const anotherNormalIpReq = makeRequest("advanced-key", "9.9.9.9");
    expect(await checkAccessUsage(anotherNormalIpReq, profile)).toEqual({
      allowed: true,
    });
  });

  test("counts same access code and same IP separately by signed device ID", async () => {
    process.env.ACCESS_CODE_ADVANCED = "advanced-key";
    process.env.ACCESS_DEVICE_ID_ENABLED = "true";
    process.env.ACCESS_DEVICE_ID_SECRET = "test-device-secret";
    process.env.ACCESS_BURST_TOKEN_LIMIT = "9999999";
    const config = buildAccessControlConfig(process.env);
    const profile = resolveAccessCodeProfile("advanced-key", config)!;
    const deviceOne = await createSignedAccessDeviceId(
      config,
      "device-one-000001",
    );
    const deviceTwo = await createSignedAccessDeviceId(
      config,
      "device-two-000002",
    );

    const firstDeviceReq = makeRequest("advanced-key", "8.8.8.8", {
      cookies: { neatchat_device_id: deviceOne },
    });
    expect(await checkAccessUsage(firstDeviceReq, profile)).toEqual({
      allowed: true,
    });
    markSystemAccessCodeRequest(firstDeviceReq, profile);
    await recordUsage(firstDeviceReq, 500000);

    const secondDeviceReq = makeRequest("advanced-key", "8.8.8.8", {
      cookies: { neatchat_device_id: deviceTwo },
    });
    expect(await checkAccessUsage(secondDeviceReq, profile)).toEqual({
      allowed: true,
    });

    const firstDeviceRetryReq = makeRequest("advanced-key", "8.8.8.8", {
      cookies: { neatchat_device_id: deviceOne },
    });
    expect(await checkAccessUsage(firstDeviceRetryReq, profile)).toMatchObject({
      allowed: false,
      error: "daily_token_limit_exceeded",
      status: 429,
    });
  });

  test("returns only the verified raw access device ID", async () => {
    process.env.ACCESS_DEVICE_ID_ENABLED = "true";
    process.env.ACCESS_DEVICE_ID_SECRET = "test-device-secret";
    const config = buildAccessControlConfig(process.env);
    const rawDeviceId = "device-one-000001";
    const signedDeviceId = await createSignedAccessDeviceId(
      config,
      rawDeviceId,
    );

    expect(
      await getVerifiedAccessDeviceId(
        makeRequest("normal-key", "8.8.8.8", {
          cookies: { neatchat_device_id: signedDeviceId },
        }),
      ),
    ).toBe(rawDeviceId);
    expect(
      await getVerifiedAccessDeviceId(
        makeRequest("normal-key", "8.8.8.8", {
          cookies: { neatchat_device_id: `${signedDeviceId}tampered` },
        }),
      ),
    ).toBeUndefined();
    expect(
      await getVerifiedAccessDeviceId(
        makeRequest("normal-key", "8.8.8.8", {
          cookies: { neatchat_device_id: rawDeviceId },
        }),
      ),
    ).toBeUndefined();
  });

  test("keeps the same signed device ID scoped by IP", async () => {
    process.env.ACCESS_CODE_ADVANCED = "advanced-key";
    process.env.ACCESS_DEVICE_ID_ENABLED = "true";
    process.env.ACCESS_DEVICE_ID_SECRET = "test-device-secret";
    process.env.ACCESS_BURST_TOKEN_LIMIT = "9999999";
    const config = buildAccessControlConfig(process.env);
    const profile = resolveAccessCodeProfile("advanced-key", config)!;
    const deviceOne = await createSignedAccessDeviceId(
      config,
      "device-one-000001",
    );

    const firstIpReq = makeRequest("advanced-key", "8.8.8.8", {
      cookies: { neatchat_device_id: deviceOne },
    });
    markSystemAccessCodeRequest(firstIpReq, profile);
    await recordUsage(firstIpReq, 500000);

    const sameDeviceSameIpReq = makeRequest("advanced-key", "8.8.8.8", {
      cookies: { neatchat_device_id: deviceOne },
    });
    expect(await checkAccessUsage(sameDeviceSameIpReq, profile)).toMatchObject({
      allowed: false,
      error: "daily_token_limit_exceeded",
      status: 429,
    });

    const sameDeviceDifferentIpReq = makeRequest("advanced-key", "9.9.9.9", {
      cookies: { neatchat_device_id: deviceOne },
    });
    expect(await checkAccessUsage(sameDeviceDifferentIpReq, profile)).toEqual({
      allowed: true,
    });
  });

  test("cools down a device after short-window token burst", async () => {
    process.env.ACCESS_CODE_NORMAL = "normal-key";
    process.env.ACCESS_BURST_TOKEN_LIMIT = "100";
    process.env.ACCESS_BURST_COOLDOWN_SECONDS = "900";
    const profile = resolveAccessCodeProfile(
      "normal-key",
      buildAccessControlConfig(process.env),
    )!;

    const req = makeRequest("normal-key", "8.8.8.8");
    expect(await checkAccessUsage(req, profile)).toEqual({ allowed: true });
    markSystemAccessCodeRequest(req, profile);
    await recordUsage(req, 101);

    const retryReq = makeRequest("normal-key", "8.8.8.8");
    expect(await checkAccessUsage(retryReq, profile)).toMatchObject({
      allowed: false,
      error: "cooling_down",
      status: 429,
      retryAfterSeconds: expect.any(Number),
    });
  });

  test("ignores existing burst cooldown when burst limit is disabled", async () => {
    process.env.ACCESS_CODE_NORMAL = "normal-key";
    process.env.ACCESS_BURST_TOKEN_LIMIT = "100";
    process.env.ACCESS_BURST_COOLDOWN_SECONDS = "900";
    const profile = resolveAccessCodeProfile(
      "normal-key",
      buildAccessControlConfig(process.env),
    )!;

    const req = makeRequest("normal-key", "8.8.8.8");
    markSystemAccessCodeRequest(req, profile);
    await recordUsage(req, 101);

    const blockedReq = makeRequest("normal-key", "8.8.8.8");
    expect(await checkAccessUsage(blockedReq, profile)).toMatchObject({
      allowed: false,
      error: "cooling_down",
    });

    process.env.ACCESS_BURST_TOKEN_LIMIT = "0";

    const allowedReq = makeRequest("normal-key", "8.8.8.8");
    expect(await checkAccessUsage(allowedReq, profile)).toEqual({
      allowed: true,
    });
  });

  test("uses usage state version to isolate existing usage for the same cookie", async () => {
    process.env.ACCESS_CODE_NORMAL = "normal-key";
    process.env.ACCESS_DEVICE_ID_ENABLED = "true";
    process.env.ACCESS_DEVICE_ID_SECRET = "test-device-secret";
    process.env.ACCESS_BURST_TOKEN_LIMIT = "9999999";
    process.env.ACCESS_USAGE_STATE_VERSION = "before-reset";
    const config = buildAccessControlConfig(process.env);
    const profile = resolveAccessCodeProfile("normal-key", config)!;
    const device = await createSignedAccessDeviceId(
      config,
      "device-one-000001",
    );

    const req = makeRequest("normal-key", "8.8.8.8", {
      cookies: { neatchat_device_id: device },
    });
    markSystemAccessCodeRequest(req, profile);
    await recordUsage(req, 200000);

    const blockedReq = makeRequest("normal-key", "8.8.8.8", {
      cookies: { neatchat_device_id: device },
    });
    expect(await checkAccessUsage(blockedReq, profile)).toMatchObject({
      allowed: false,
      error: "daily_token_limit_exceeded",
    });

    process.env.ACCESS_USAGE_STATE_VERSION = "after-reset";

    const resetReq = makeRequest("normal-key", "8.8.8.8", {
      cookies: { neatchat_device_id: device },
    });
    expect(await checkAccessUsage(resetReq, profile)).toEqual({
      allowed: true,
    });
  });

  test("applies aggregate IP burst guard across different device IDs", async () => {
    process.env.ACCESS_CODE_NORMAL = "normal-key";
    process.env.ACCESS_DEVICE_ID_ENABLED = "true";
    process.env.ACCESS_DEVICE_ID_SECRET = "test-device-secret";
    process.env.ACCESS_BURST_TOKEN_LIMIT = "9999999";
    process.env.ACCESS_IP_BURST_GUARD_ENABLED = "true";
    process.env.ACCESS_IP_BURST_TOKEN_LIMIT = "100";
    process.env.ACCESS_IP_BURST_WINDOW_SECONDS = "600";
    const config = buildAccessControlConfig(process.env);
    const profile = resolveAccessCodeProfile("normal-key", config)!;
    const deviceOne = await createSignedAccessDeviceId(
      config,
      "device-one-000001",
    );
    const deviceTwo = await createSignedAccessDeviceId(
      config,
      "device-two-000002",
    );
    const deviceThree = await createSignedAccessDeviceId(
      config,
      "device-three-0003",
    );

    const firstDeviceReq = makeRequest("normal-key", "8.8.8.8", {
      cookies: { neatchat_device_id: deviceOne },
    });
    markSystemAccessCodeRequest(firstDeviceReq, profile);
    await recordUsage(firstDeviceReq, 60);

    const secondDeviceReq = makeRequest("normal-key", "8.8.8.8", {
      cookies: { neatchat_device_id: deviceTwo },
    });
    markSystemAccessCodeRequest(secondDeviceReq, profile);
    await recordUsage(secondDeviceReq, 50);

    const thirdDeviceReq = makeRequest("normal-key", "8.8.8.8", {
      cookies: { neatchat_device_id: deviceThree },
    });
    expect(await checkAccessUsage(thirdDeviceReq, profile)).toMatchObject({
      allowed: false,
      error: "ip_cooling_down",
      status: 429,
    });
  });

  test("returns a generic public message for usage restrictions", async () => {
    const response = usageErrorResponse({
      allowed: false,
      status: 429,
      error: "daily_token_limit_exceeded",
      retryAfterSeconds: 900,
    });
    const body = JSON.parse(await response.text());

    expect(response.status).toBe(429);
    expect(body.msg).toBe("当前访问暂时受限，请稍后再试。");
    expect(JSON.stringify(body)).not.toContain("daily_token_limit_exceeded");
  });

  test("rejects a request that is estimated to exceed the daily token limit", async () => {
    process.env.ACCESS_CODE_NORMAL = "normal-key";
    process.env.ACCESS_BURST_TOKEN_LIMIT = "9999999";
    const profile = resolveAccessCodeProfile(
      "normal-key",
      buildAccessControlConfig(process.env),
    )!;

    const usedReq = makeRequest("normal-key", "8.8.8.8");
    markSystemAccessCodeRequest(usedReq, profile);
    await recordUsage(usedReq, 199990);

    const retryReq = makeJsonRequest("normal-key", "8.8.8.8", {
      input: "12345678901234567890",
      max_output_tokens: 20,
    });
    expect(await checkAccessUsage(retryReq, profile)).toMatchObject({
      allowed: false,
      error: "daily_token_limit_exceeded",
      status: 429,
    });
  });

  test("extracts token usage from common provider response shapes", () => {
    expect(
      extractTokenUsageFromJson({
        response: { usage: { input_tokens: 10, output_tokens: 20 } },
      }),
    ).toBe(30);
    expect(
      extractTokenUsageFromJson({
        usageMetadata: { totalTokenCount: 42 },
      }),
    ).toBe(42);
    expect(
      extractTokenUsageFromJson({
        usage: { prompt_tokens: 3, completion_tokens: 4 },
      }),
    ).toBe(7);
  });

  test("estimates request token usage from input and output caps", () => {
    expect(
      estimateTokenUsageFromRequestJson({
        input: "12345678901234567890",
        max_output_tokens: 20,
      }),
    ).toBe(25);
    expect(
      estimateTokenUsageFromRequestJson({
        messages: [{ role: "user", content: "12345678" }],
        max_tokens: 10,
      }),
    ).toBe(12);
  });

  test("keeps zero token burst limit as disabled but rejects zero durations", () => {
    process.env.ACCESS_BURST_TOKEN_LIMIT = "0";
    process.env.ACCESS_BURST_WINDOW_SECONDS = "0";
    process.env.ACCESS_BURST_COOLDOWN_SECONDS = "0";

    const config = buildAccessControlConfig(process.env);

    expect(config.burstTokenLimit).toBe(0);
    expect(config.burstWindowSeconds).toBe(600);
    expect(config.burstCooldownSeconds).toBe(900);
  });

  test("parses device identity and aggregate IP guard config", () => {
    process.env.ACCESS_DEVICE_ID_ENABLED = "true";
    process.env.ACCESS_DEVICE_ID_SECRET = "test-device-secret";
    process.env.ACCESS_DEVICE_ID_COOKIE_NAME = "custom_device";
    process.env.ACCESS_DEVICE_ID_MAX_AGE_DAYS = "90";
    process.env.ACCESS_IP_BURST_GUARD_ENABLED = "true";
    process.env.ACCESS_IP_BURST_TOKEN_LIMIT = "1234";
    process.env.ACCESS_IP_BURST_WINDOW_SECONDS = "300";

    const config = buildAccessControlConfig(process.env);

    expect(config.deviceIdEnabled).toBe(true);
    expect(config.deviceIdSecret).toBe("test-device-secret");
    expect(config.deviceIdCookieName).toBe("custom_device");
    expect(config.deviceIdMaxAgeDays).toBe(90);
    expect(config.ipBurstGuardEnabled).toBe(true);
    expect(config.ipBurstTokenLimit).toBe(1234);
    expect(config.ipBurstWindowSeconds).toBe(300);
  });

  test("reads Vercel generated Upstash REST variables as Redis store fallback", () => {
    process.env.ACCESS_USAGE_REDIS_URL = "https://legacy.example.com";
    process.env.ACCESS_USAGE_REDIS_TOKEN = "legacy-token";
    process.env.NEATCHAT_REDIS_KV_REST_API_URL = "https://redis.example.com";
    process.env.NEATCHAT_REDIS_KV_REST_API_TOKEN = "write-token";

    const config = buildAccessControlConfig(process.env);

    expect(config.redisUrl).toBe("https://redis.example.com");
    expect(config.redisToken).toBe("write-token");
  });

  test("parses usage state version for usage key rotation", () => {
    process.env.ACCESS_USAGE_STATE_VERSION = "release-20260529";

    const config = buildAccessControlConfig(process.env);

    expect(config.usageStateVersion).toBe("release-20260529");
  });
});
