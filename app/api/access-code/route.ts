import { NextRequest, NextResponse } from "next/server";

import { publicConfigHeaders } from "@/app/config/public";
import { getServerSideConfig } from "@/app/config/server";
import { validateAccessCode } from "@/app/api/auth";

const ACCESS_CODE_MAX_FAILED_ATTEMPTS = 5;
const ACCESS_CODE_ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const ACCESS_CODE_LOCK_MS = 15 * 60 * 1000;
const ACCESS_CODE_ATTEMPT_LIMIT = 10000;

type AccessCodeAttempt = {
  failedCount: number;
  firstFailedAt: number;
  lockedUntil: number;
};

const accessCodeAttempts = new Map<string, AccessCodeAttempt>();

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",").at(0)?.trim();
  return (
    forwardedIp ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-vercel-forwarded-for") ||
    req.ip ||
    "unknown"
  );
}

function getAttemptKey(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  return `${ip}:${userAgent.slice(0, 120)}`;
}

function pruneAttempts(now: number) {
  if (accessCodeAttempts.size < ACCESS_CODE_ATTEMPT_LIMIT) return;

  for (const [key, attempt] of accessCodeAttempts) {
    const windowExpired =
      now - attempt.firstFailedAt > ACCESS_CODE_ATTEMPT_WINDOW_MS;
    const lockExpired = attempt.lockedUntil <= now;
    if (windowExpired && lockExpired) {
      accessCodeAttempts.delete(key);
    }
  }
}

function getAttempt(req: NextRequest, now: number) {
  pruneAttempts(now);
  const key = getAttemptKey(req);
  const current = accessCodeAttempts.get(key);

  if (
    !current ||
    (now - current.firstFailedAt > ACCESS_CODE_ATTEMPT_WINDOW_MS &&
      current.lockedUntil <= now)
  ) {
    const next = { failedCount: 0, firstFailedAt: now, lockedUntil: 0 };
    accessCodeAttempts.set(key, next);
    return { key, attempt: next };
  }

  return { key, attempt: current };
}

function recordFailedAttempt(
  key: string,
  attempt: AccessCodeAttempt,
  now: number,
) {
  const nextFailedCount = attempt.failedCount + 1;
  accessCodeAttempts.set(key, {
    failedCount: nextFailedCount,
    firstFailedAt: attempt.firstFailedAt,
    lockedUntil:
      nextFailedCount >= ACCESS_CODE_MAX_FAILED_ATTEMPTS
        ? now + ACCESS_CODE_LOCK_MS
        : attempt.lockedUntil,
  });
}

function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      ok: false,
      error: "rate_limited",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        ...publicConfigHeaders(),
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

async function handle(req: NextRequest) {
  const serverConfig = getServerSideConfig();

  if (!serverConfig.needCode) {
    return NextResponse.json(
      { ok: true },
      {
        headers: publicConfigHeaders(),
      },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    accessCode?: string;
  };
  const accessCode = body.accessCode?.trim() ?? "";
  const now = Date.now();
  const { key, attempt } = getAttempt(req, now);

  if (attempt.lockedUntil > now) {
    return rateLimitedResponse(Math.ceil((attempt.lockedUntil - now) / 1000));
  }

  const ok = accessCode.length > 0 && validateAccessCode(accessCode);

  if (ok) {
    accessCodeAttempts.delete(key);
  } else {
    recordFailedAttempt(key, attempt, now);
  }

  return NextResponse.json(
    { ok },
    {
      status: ok ? 200 : 401,
      headers: publicConfigHeaders(),
    },
  );
}

export const POST = handle;

export const runtime = "edge";
