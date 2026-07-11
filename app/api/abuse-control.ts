import type { NextRequest, NextResponse } from "next/server";

import { getServerSideConfig } from "@/app/config/server";
import {
  extractTokenUsageFromJson,
  estimateTokenUsageFromRequestJson,
  formatDateInTimeZone,
  getEffectiveDailyTokenLimit,
  type AccessCodeProfile,
  type AccessControlConfig,
} from "@/app/utils/access-control";
import { ACCESS_RESTRICTED_ERROR_CODE } from "@/app/utils/public-error";

const ACCESS_CODE_HASH_HEADER = "x-neatchat-access-code-hash";
const ACCESS_CODE_TIER_HEADER = "x-neatchat-access-code-tier";
const ACCESS_SYSTEM_KEY_HEADER = "x-neatchat-system-key-auth";
const ACCESS_DEVICE_ID_HEADER = "x-neatchat-device-id";
const systemAccessProfiles = new WeakMap<NextRequest, AccessCodeProfile>();

type UsageRecord = {
  dayKey: string;
  dailyTokens: number;
  burstWindowKey: number;
  burstTokens: number;
  cooldownUntil: number;
};

type UsageCheckResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      status: number;
      error: string;
      retryAfterSeconds?: number;
    };

type UsageRecordResult = {
  dailyTokens: number;
  burstTokens: number;
};

const globalUsageStore = globalThis as typeof globalThis & {
  __NEATCHAT_ACCESS_USAGE__?: Map<string, UsageRecord>;
};

function getMemoryStore() {
  if (!globalUsageStore.__NEATCHAT_ACCESS_USAGE__) {
    globalUsageStore.__NEATCHAT_ACCESS_USAGE__ = new Map();
  }

  return globalUsageStore.__NEATCHAT_ACCESS_USAGE__;
}

export function markSystemAccessCodeRequest(
  req: NextRequest,
  profile: AccessCodeProfile,
) {
  systemAccessProfiles.set(req, profile);

  try {
    req.headers.set(ACCESS_CODE_HASH_HEADER, profile.codeHash);
    req.headers.set(ACCESS_CODE_TIER_HEADER, profile.tier);
    req.headers.set(ACCESS_SYSTEM_KEY_HEADER, "1");
  } catch {
    // Some runtimes expose incoming request headers as immutable.
  }
}

export function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",").at(0)?.trim();

  return (
    req.headers.get("x-vercel-forwarded-for")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    forwardedIp ||
    req.ip ||
    "unknown"
  );
}

function isDeviceIdConfigured(config: AccessControlConfig) {
  return config.deviceIdEnabled && !!config.deviceIdSecret;
}

function bytesToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return diff === 0;
}

async function hmacSha256Hex(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );
  return bytesToHex(signature);
}

function createDeviceId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes.buffer);
}

export async function createSignedAccessDeviceId(
  config: AccessControlConfig,
  deviceId = createDeviceId(),
) {
  if (!isDeviceIdConfigured(config)) return undefined;

  const signature = await hmacSha256Hex(deviceId, config.deviceIdSecret!);
  return `${deviceId}.${signature}`;
}

async function verifySignedAccessDeviceId(
  value: string | undefined,
  config: AccessControlConfig,
) {
  if (!value || !isDeviceIdConfigured(config)) return undefined;

  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex <= 0) return undefined;

  const deviceId = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  if (
    !/^[a-zA-Z0-9-]{16,80}$/.test(deviceId) ||
    !/^[a-f0-9]{64}$/.test(signature)
  ) {
    return undefined;
  }

  const expectedSignature = await hmacSha256Hex(
    deviceId,
    config.deviceIdSecret!,
  );
  return safeEqual(signature, expectedSignature) ? deviceId : undefined;
}

async function getAccessDeviceId(
  req: NextRequest,
  config: AccessControlConfig,
) {
  if (!isDeviceIdConfigured(config)) return undefined;

  const headerDeviceId = req.headers.get(ACCESS_DEVICE_ID_HEADER)?.trim();
  const cookieDeviceId = req.cookies?.get(config.deviceIdCookieName)?.value;

  return verifySignedAccessDeviceId(headerDeviceId || cookieDeviceId, config);
}

export async function getVerifiedAccessDeviceId(req: NextRequest) {
  return getAccessDeviceId(req, getServerSideConfig().accessControl);
}

export async function ensureAccessDeviceCookie<T extends NextResponse>(
  req: NextRequest,
  response: T,
) {
  const serverConfig = getServerSideConfig();
  const config = serverConfig.accessControl;
  if (!isDeviceIdConfigured(config)) return response;

  const currentValue = req.cookies?.get(config.deviceIdCookieName)?.value;
  const currentDeviceId = await verifySignedAccessDeviceId(
    currentValue,
    config,
  );
  const nextValue =
    currentDeviceId && currentValue
      ? currentValue
      : await createSignedAccessDeviceId(config);

  if (nextValue) {
    response.cookies.set(config.deviceIdCookieName, nextValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
      path: "/",
      maxAge: config.deviceIdMaxAgeDays * 24 * 60 * 60,
    });
  }

  return response;
}

async function estimateRequestTokenUsage(req: NextRequest) {
  if (req.method !== "POST" || typeof req.clone !== "function") return 0;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType && !contentType.includes("json")) return 0;

  try {
    const bodyText = await req.clone().text();
    if (!bodyText || bodyText.length > 1_000_000) return 0;

    return estimateTokenUsageFromRequestJson(JSON.parse(bodyText));
  } catch {
    return 0;
  }
}

function isSystemAccessCodeRequest(req: NextRequest) {
  return (
    systemAccessProfiles.has(req) ||
    req.headers.get(ACCESS_SYSTEM_KEY_HEADER) === "1"
  );
}

function getRequestProfile(req: NextRequest) {
  const systemProfile = systemAccessProfiles.get(req);
  if (systemProfile) return systemProfile;

  if (!isSystemAccessCodeRequest(req)) return undefined;

  const codeHash = req.headers.get(ACCESS_CODE_HASH_HEADER);
  if (!codeHash) return undefined;

  const serverConfig = getServerSideConfig();
  return serverConfig.accessControl.profiles.find(
    (profile) => profile.codeHash === codeHash,
  );
}

function getUsageIdentity(params: {
  req: NextRequest;
  profile: AccessCodeProfile;
  config: AccessControlConfig;
}) {
  const ip = getClientIp(params.req);
  const ipKey = `${params.profile.codeHash}:ip:${ip}`;

  return getAccessDeviceId(params.req, params.config).then((deviceId) => {
    const scope = deviceId ? `ip:${ip}:device:${deviceId}` : `ip:${ip}`;
    return {
      ip,
      deviceId,
      key: `${params.profile.codeHash}:${scope}`,
      ipKey,
    };
  });
}

function isDifferentIpGuardKey(identity: { key: string; ipKey: string }) {
  return identity.key !== identity.ipKey;
}

function getUsageBurstWindowSeconds(params: {
  config: AccessControlConfig;
  burstWindowSeconds?: number;
}) {
  return params.burstWindowSeconds ?? params.config.burstWindowSeconds;
}

function getIpBurstGuardKey(identity: { ipKey: string }) {
  return {
    key: `${identity.ipKey}:burst-guard`,
  };
}

function getUsageStatePrefix(config: AccessControlConfig) {
  return config.usageStateVersion
    ? `${config.redisPrefix}:v:${config.usageStateVersion}`
    : config.redisPrefix;
}

function getUsageStateIdentityKey(
  config: AccessControlConfig,
  identityKey: string,
) {
  return config.usageStateVersion
    ? `${config.usageStateVersion}:${identityKey}`
    : identityKey;
}

function getUsageKeys(params: {
  identityKey: string;
  now: number;
  config: AccessControlConfig;
  burstWindowSeconds?: number;
}) {
  const { identityKey, now, config } = params;
  const burstWindowSeconds = getUsageBurstWindowSeconds(params);
  const dayKey = formatDateInTimeZone(new Date(now), config.quotaTimeZone);
  const burstWindowKey = Math.floor(now / (burstWindowSeconds * 1000));
  const usagePrefix = getUsageStatePrefix(config);

  return {
    dayKey,
    burstWindowKey,
    dailyKey: `${usagePrefix}:daily:${dayKey}:${identityKey}`,
    burstKey: `${usagePrefix}:burst:${burstWindowKey}:${identityKey}`,
    cooldownKey: `${usagePrefix}:cooldown:${identityKey}`,
  };
}

function getMemoryRecord(params: {
  identityKey: string;
  now: number;
  config: AccessControlConfig;
  burstWindowSeconds?: number;
}) {
  const store = getMemoryStore();
  const keys = getUsageKeys(params);
  const stateIdentityKey = getUsageStateIdentityKey(
    params.config,
    params.identityKey,
  );
  const current = store.get(stateIdentityKey);

  if (!current || current.dayKey !== keys.dayKey) {
    const next: UsageRecord = {
      dayKey: keys.dayKey,
      dailyTokens: 0,
      burstWindowKey: keys.burstWindowKey,
      burstTokens: 0,
      cooldownUntil: current?.cooldownUntil ?? 0,
    };
    store.set(stateIdentityKey, next);
    return next;
  }

  if (current.burstWindowKey !== keys.burstWindowKey) {
    current.burstWindowKey = keys.burstWindowKey;
    current.burstTokens = 0;
  }

  return current;
}

function hasRedisStore(config: AccessControlConfig) {
  return !!config.redisUrl && !!config.redisToken;
}

async function redisPipeline(
  config: AccessControlConfig,
  commands: unknown[][],
) {
  const baseUrl = config.redisUrl?.replace(/\/$/, "");
  if (!baseUrl || !config.redisToken) {
    throw new Error("Redis usage store is not configured");
  }

  const res = await fetch(`${baseUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    throw new Error(`Redis usage store failed with status ${res.status}`);
  }

  return (await res.json()) as { result?: unknown; error?: string }[];
}

async function readRedisUsage(params: {
  identityKey: string;
  now: number;
  config: AccessControlConfig;
  burstWindowSeconds?: number;
}) {
  const keys = getUsageKeys(params);
  const result = await redisPipeline(params.config, [
    ["GET", keys.dailyKey],
    ["GET", keys.cooldownKey],
  ]);

  return {
    dailyTokens: Number(result[0]?.result ?? 0) || 0,
    cooldownUntil: Number(result[1]?.result ?? 0) || 0,
  };
}

async function recordRedisUsage(params: {
  identityKey: string;
  tokens: number;
  now: number;
  config: AccessControlConfig;
  burstWindowSeconds?: number;
}) {
  const keys = getUsageKeys(params);
  const burstWindowSeconds = getUsageBurstWindowSeconds(params);
  const ttlSeconds = Math.max(
    2 * 24 * 60 * 60,
    params.config.burstCooldownSeconds,
  );
  const burstTtlSeconds = Math.max(
    burstWindowSeconds + params.config.burstCooldownSeconds,
    60,
  );
  const result = await redisPipeline(params.config, [
    ["INCRBY", keys.dailyKey, params.tokens],
    ["EXPIRE", keys.dailyKey, ttlSeconds],
    ["INCRBY", keys.burstKey, params.tokens],
    ["EXPIRE", keys.burstKey, burstTtlSeconds],
  ]);

  return {
    dailyTokens: Number(result[0]?.result ?? 0) || 0,
    burstTokens: Number(result[2]?.result ?? 0) || 0,
  };
}

async function setRedisCooldown(params: {
  identityKey: string;
  cooldownUntil: number;
  now: number;
  config: AccessControlConfig;
}) {
  const keys = getUsageKeys(params);
  await redisPipeline(params.config, [
    [
      "SET",
      keys.cooldownKey,
      String(params.cooldownUntil),
      "EX",
      params.config.burstCooldownSeconds,
    ],
  ]);
}

async function readUsage(params: {
  identityKey: string;
  now: number;
  config: AccessControlConfig;
  burstWindowSeconds?: number;
}) {
  if (hasRedisStore(params.config)) {
    try {
      return await readRedisUsage(params);
    } catch (error) {
      console.error("[Access Control] Redis read failed", error);
    }
  }

  const record = getMemoryRecord(params);
  return {
    dailyTokens: record.dailyTokens,
    cooldownUntil: record.cooldownUntil,
  };
}

async function recordUsage(params: {
  identityKey: string;
  tokens: number;
  now: number;
  config: AccessControlConfig;
  burstWindowSeconds?: number;
}): Promise<UsageRecordResult> {
  if (hasRedisStore(params.config)) {
    try {
      return await recordRedisUsage(params);
    } catch (error) {
      console.error("[Access Control] Redis write failed", error);
    }
  }

  const record = getMemoryRecord(params);
  record.dailyTokens += params.tokens;
  record.burstTokens += params.tokens;

  return {
    dailyTokens: record.dailyTokens,
    burstTokens: record.burstTokens,
  };
}

async function setCooldown(params: {
  identityKey: string;
  cooldownUntil: number;
  now: number;
  config: AccessControlConfig;
}) {
  if (hasRedisStore(params.config)) {
    try {
      await setRedisCooldown(params);
      return;
    } catch (error) {
      console.error("[Access Control] Redis cooldown write failed", error);
    }
  }

  const record = getMemoryRecord(params);
  record.cooldownUntil = params.cooldownUntil;
}

export async function checkAccessUsage(
  req: NextRequest,
  profile: AccessCodeProfile,
  options: { estimatedTokens?: number } = {},
): Promise<UsageCheckResult> {
  const serverConfig = getServerSideConfig();
  const config = serverConfig.accessControl;
  const now = Date.now();
  const identity = await getUsageIdentity({ req, profile, config });
  const ipGuardKey = getIpBurstGuardKey(identity);
  if (
    config.ipBurstGuardEnabled &&
    isDifferentIpGuardKey({ key: identity.key, ipKey: ipGuardKey.key })
  ) {
    const ipGuardUsage = await readUsage({
      identityKey: ipGuardKey.key,
      now,
      config,
      burstWindowSeconds: config.ipBurstWindowSeconds,
    });
    if (ipGuardUsage.cooldownUntil > now) {
      return {
        allowed: false,
        status: 429,
        error: "ip_cooling_down",
        retryAfterSeconds: Math.ceil((ipGuardUsage.cooldownUntil - now) / 1000),
      };
    }
  }

  const usage = await readUsage({
    identityKey: identity.key,
    now,
    config,
  });

  if (config.burstTokenLimit > 0 && usage.cooldownUntil > now) {
    return {
      allowed: false,
      status: 429,
      error: "cooling_down",
      retryAfterSeconds: Math.ceil((usage.cooldownUntil - now) / 1000),
    };
  }

  const dailyTokenLimit = getEffectiveDailyTokenLimit({
    profile,
    ip: identity.ip,
    config,
  });

  if (dailyTokenLimit !== null && usage.dailyTokens >= dailyTokenLimit) {
    return {
      allowed: false,
      status: 429,
      error: "daily_token_limit_exceeded",
      retryAfterSeconds: 24 * 60 * 60,
    };
  }

  const estimatedTokens =
    options.estimatedTokens ?? (await estimateRequestTokenUsage(req));
  if (
    dailyTokenLimit !== null &&
    estimatedTokens > 0 &&
    usage.dailyTokens + estimatedTokens > dailyTokenLimit
  ) {
    return {
      allowed: false,
      status: 429,
      error: "daily_token_limit_exceeded",
      retryAfterSeconds: 24 * 60 * 60,
    };
  }

  return { allowed: true };
}

export async function checkCurrentRequestAccessUsage(
  req: NextRequest,
  options: { estimatedTokens?: number } = {},
) {
  const profile = getRequestProfile(req);
  if (!profile) return { allowed: true } as UsageCheckResult;

  return checkAccessUsage(req, profile, options);
}

export function usageErrorResponse(result: UsageCheckResult) {
  if (result.allowed) {
    return new Response(null, { status: 204 });
  }

  return new Response(
    JSON.stringify({
      error: true,
      code: ACCESS_RESTRICTED_ERROR_CODE,
      msg: ACCESS_RESTRICTED_ERROR_CODE,
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: result.status,
      headers: {
        "content-type": "application/json",
        ...(result.status === 429 && result.retryAfterSeconds
          ? { "Retry-After": String(result.retryAfterSeconds) }
          : {}),
      },
    },
  );
}

async function recordTokenUsage(req: NextRequest, tokens: number) {
  const profile = getRequestProfile(req);
  if (!profile || tokens <= 0) return;

  const serverConfig = getServerSideConfig();
  const config = serverConfig.accessControl;
  const now = Date.now();
  const identity = await getUsageIdentity({ req, profile, config });
  const usage = await recordUsage({
    identityKey: identity.key,
    tokens,
    now,
    config,
  });

  if (
    config.burstTokenLimit > 0 &&
    usage.burstTokens > config.burstTokenLimit
  ) {
    await setCooldown({
      identityKey: identity.key,
      cooldownUntil: now + config.burstCooldownSeconds * 1000,
      now,
      config,
    });
  }

  const ipGuardKey = getIpBurstGuardKey(identity);
  if (
    config.ipBurstGuardEnabled &&
    config.ipBurstTokenLimit > 0 &&
    isDifferentIpGuardKey({ key: identity.key, ipKey: ipGuardKey.key })
  ) {
    const ipUsage = await recordUsage({
      identityKey: ipGuardKey.key,
      tokens,
      now,
      config,
      burstWindowSeconds: config.ipBurstWindowSeconds,
    });
    if (ipUsage.burstTokens > config.ipBurstTokenLimit) {
      await setCooldown({
        identityKey: ipGuardKey.key,
        cooldownUntil: now + config.burstCooldownSeconds * 1000,
        now,
        config,
      });
    }
  }
}

function cloneResponseHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  return headers;
}

function isTrackableResponse(req: NextRequest, response: Response) {
  if (!getRequestProfile(req)) return false;
  if (req.method !== "POST") return false;
  if (response.status < 200 || response.status >= 300) return false;

  const pathname = req.nextUrl.pathname.toLowerCase();
  if (
    pathname.includes("/images/") ||
    pathname.includes("/audio/") ||
    pathname.includes("/api/stability/")
  ) {
    return false;
  }

  return true;
}

function extractTokenUsageFromSseEvent(eventText: string) {
  const data = eventText
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("\n");

  if (!data || data === "[DONE]") return 0;

  try {
    return extractTokenUsageFromJson(JSON.parse(data));
  } catch {
    return 0;
  }
}

function wrapSseBody(req: NextRequest, body: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  let buffer = "";
  let observedTokens = 0;

  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        buffer += text;

        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? "";

        for (const event of events) {
          observedTokens = Math.max(
            observedTokens,
            extractTokenUsageFromSseEvent(event),
          );
        }

        controller.enqueue(chunk);
      },
      async flush(controller) {
        const tail = decoder.decode();
        if (tail) {
          buffer += tail;
        }

        if (buffer) {
          observedTokens = Math.max(
            observedTokens,
            extractTokenUsageFromSseEvent(buffer),
          );
        }

        await recordTokenUsage(req, observedTokens);
      },
    }),
  );
}

export async function withUsageAccounting(
  req: NextRequest,
  response: Response,
) {
  if (!isTrackableResponse(req, response)) return response;

  const contentType = response.headers.get("content-type") ?? "";
  const headers = cloneResponseHeaders(response);

  if (contentType.includes("text/event-stream") && response.body) {
    return new Response(wrapSseBody(req, response.body), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  if (!contentType.includes("json")) return response;
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 2_000_000) {
    return response;
  }

  const bodyText = await response.text();

  try {
    await recordTokenUsage(
      req,
      extractTokenUsageFromJson(JSON.parse(bodyText)),
    );
  } catch {
    await recordTokenUsage(req, 0);
  }

  return new Response(bodyText, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function resetAccessUsageForTests() {
  getMemoryStore().clear();
}
