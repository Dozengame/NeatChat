import md5 from "spark-md5";

export type AccessCodeTier = "admin" | "advanced" | "normal" | "legacy";

export interface AccessCodeProfile {
  tier: AccessCodeTier;
  label: string;
  codeHash: string;
  dailyTokenLimit: number | null;
}

export interface AccessControlConfig {
  profiles: AccessCodeProfile[];
  ipWhitelist: string[];
  whitelistTokenMultiplier: number;
  burstWindowSeconds: number;
  burstTokenLimit: number;
  burstCooldownSeconds: number;
  deviceIdEnabled: boolean;
  deviceIdSecret?: string;
  deviceIdCookieName: string;
  deviceIdMaxAgeDays: number;
  ipBurstGuardEnabled: boolean;
  ipBurstTokenLimit: number;
  ipBurstWindowSeconds: number;
  quotaTimeZone: string;
  redisUrl?: string;
  redisToken?: string;
  redisPrefix: string;
  usageStateVersion: string;
}

const DEFAULT_ADVANCED_DAILY_TOKENS = 500_000;
const DEFAULT_NORMAL_DAILY_TOKENS = 200_000;
const DEFAULT_WHITELIST_MULTIPLIER = 2;
const DEFAULT_BURST_WINDOW_SECONDS = 10 * 60;
const DEFAULT_BURST_TOKEN_LIMIT = 100_000;
const DEFAULT_BURST_COOLDOWN_SECONDS = 15 * 60;
const DEFAULT_DEVICE_ID_COOKIE_NAME = "neatchat_device_id";
const DEFAULT_DEVICE_ID_MAX_AGE_DAYS = 180;
const DEFAULT_IP_BURST_TOKEN_LIMIT = 2_000_000;
const DEFAULT_IP_BURST_WINDOW_SECONDS = 10 * 60;
const DEFAULT_QUOTA_TIME_ZONE = "Asia/Shanghai";
const DEFAULT_REDIS_PREFIX = "neatchat:access-usage";

function splitEnvList(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstEnvValue(env: Partial<NodeJS.ProcessEnv>, names: string[]) {
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }

  return undefined;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value?.trim()) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;

  return Math.floor(parsed);
}

function parseNonNegativeInteger(value: string | undefined, fallback: number) {
  if (!value?.trim()) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;

  return Math.floor(parsed);
}

function parseOptionalTokenLimit(
  value: string | undefined,
  fallback: number | null,
) {
  if (!value?.trim()) return fallback;

  const normalized = value.trim().toLowerCase();
  if (["none", "null", "unlimited", "infinite"].includes(normalized)) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;

  return Math.floor(parsed);
}

function parseMultiplier(value: string | undefined, fallback: number) {
  if (!value?.trim()) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;

  return parsed;
}

function parseBoolean(value: string | undefined, fallback = false) {
  if (!value?.trim()) return fallback;

  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

export function hashAccessCode(accessCode: string) {
  return md5.hash(accessCode ?? "").trim();
}

function addProfiles(
  profiles: AccessCodeProfile[],
  existingHashes: Set<string>,
  codes: string[],
  profile: Omit<AccessCodeProfile, "codeHash">,
) {
  for (const code of codes) {
    const codeHash = hashAccessCode(code);
    if (!codeHash || existingHashes.has(codeHash)) continue;

    existingHashes.add(codeHash);
    profiles.push({
      ...profile,
      codeHash,
    });
  }
}

export function buildAccessControlConfig(
  env: Partial<NodeJS.ProcessEnv>,
): AccessControlConfig {
  const profiles: AccessCodeProfile[] = [];
  const existingHashes = new Set<string>();
  const advancedDailyTokenLimit = parseOptionalTokenLimit(
    env.ACCESS_ADVANCED_DAILY_TOKENS,
    DEFAULT_ADVANCED_DAILY_TOKENS,
  );
  const normalDailyTokenLimit = parseOptionalTokenLimit(
    env.ACCESS_NORMAL_DAILY_TOKENS,
    DEFAULT_NORMAL_DAILY_TOKENS,
  );

  addProfiles(
    profiles,
    existingHashes,
    splitEnvList(env.ACCESS_CODE_ADMIN || env.ADMIN_ACCESS_CODE),
    {
      tier: "admin",
      label: "Admin",
      dailyTokenLimit: parseOptionalTokenLimit(
        env.ACCESS_ADMIN_DAILY_TOKENS,
        null,
      ),
    },
  );
  addProfiles(
    profiles,
    existingHashes,
    splitEnvList(env.ACCESS_CODE_ADVANCED || env.ADVANCED_ACCESS_CODE),
    {
      tier: "advanced",
      label: "Advanced",
      dailyTokenLimit: advancedDailyTokenLimit,
    },
  );
  addProfiles(
    profiles,
    existingHashes,
    splitEnvList(env.ACCESS_CODE_NORMAL || env.NORMAL_ACCESS_CODE),
    {
      tier: "normal",
      label: "Normal",
      dailyTokenLimit: normalDailyTokenLimit,
    },
  );

  addProfiles(profiles, existingHashes, splitEnvList(env.CODE), {
    tier: "legacy",
    label: "Legacy",
    dailyTokenLimit: normalDailyTokenLimit,
  });

  return {
    profiles,
    ipWhitelist: splitEnvList(env.ACCESS_IP_WHITELIST || env.IP_WHITELIST),
    whitelistTokenMultiplier: parseMultiplier(
      env.ACCESS_WHITELIST_TOKEN_MULTIPLIER,
      DEFAULT_WHITELIST_MULTIPLIER,
    ),
    burstWindowSeconds: parsePositiveInteger(
      env.ACCESS_BURST_WINDOW_SECONDS,
      DEFAULT_BURST_WINDOW_SECONDS,
    ),
    burstTokenLimit: parseNonNegativeInteger(
      env.ACCESS_BURST_TOKEN_LIMIT,
      DEFAULT_BURST_TOKEN_LIMIT,
    ),
    burstCooldownSeconds: parsePositiveInteger(
      env.ACCESS_BURST_COOLDOWN_SECONDS,
      DEFAULT_BURST_COOLDOWN_SECONDS,
    ),
    deviceIdEnabled: parseBoolean(env.ACCESS_DEVICE_ID_ENABLED),
    deviceIdSecret: env.ACCESS_DEVICE_ID_SECRET?.trim() || undefined,
    deviceIdCookieName:
      env.ACCESS_DEVICE_ID_COOKIE_NAME?.trim() || DEFAULT_DEVICE_ID_COOKIE_NAME,
    deviceIdMaxAgeDays: parsePositiveInteger(
      env.ACCESS_DEVICE_ID_MAX_AGE_DAYS,
      DEFAULT_DEVICE_ID_MAX_AGE_DAYS,
    ),
    ipBurstGuardEnabled: parseBoolean(env.ACCESS_IP_BURST_GUARD_ENABLED),
    ipBurstTokenLimit: parseNonNegativeInteger(
      env.ACCESS_IP_BURST_TOKEN_LIMIT,
      DEFAULT_IP_BURST_TOKEN_LIMIT,
    ),
    ipBurstWindowSeconds: parsePositiveInteger(
      env.ACCESS_IP_BURST_WINDOW_SECONDS,
      DEFAULT_IP_BURST_WINDOW_SECONDS,
    ),
    quotaTimeZone:
      env.ACCESS_QUOTA_TIME_ZONE?.trim() || DEFAULT_QUOTA_TIME_ZONE,
    redisUrl: firstEnvValue(env, [
      "NEATCHAT_REDIS_KV_REST_API_URL",
      "NEATCHAT_REDIS_REST_API_URL",
      "KV_REST_API_URL",
      "UPSTASH_REDIS_REST_URL",
      "ACCESS_USAGE_REDIS_URL",
    ]),
    redisToken: firstEnvValue(env, [
      "NEATCHAT_REDIS_KV_REST_API_TOKEN",
      "NEATCHAT_REDIS_REST_API_TOKEN",
      "KV_REST_API_TOKEN",
      "UPSTASH_REDIS_REST_TOKEN",
      "ACCESS_USAGE_REDIS_TOKEN",
    ]),
    redisPrefix: env.ACCESS_USAGE_REDIS_PREFIX?.trim() || DEFAULT_REDIS_PREFIX,
    usageStateVersion: env.ACCESS_USAGE_STATE_VERSION?.trim() || "",
  };
}

export function getAccessCodeHashes(config: AccessControlConfig) {
  return new Set(config.profiles.map((profile) => profile.codeHash));
}

export function resolveAccessCodeProfile(
  accessCode: string,
  config: AccessControlConfig,
) {
  const codeHash = hashAccessCode(accessCode);
  return config.profiles.find((profile) => profile.codeHash === codeHash);
}

function ipv4ToNumber(ip: string) {
  const parts = ip.split(".");
  if (parts.length !== 4) return undefined;

  const bytes = parts.map((part) => {
    if (!/^\d+$/.test(part)) return undefined;
    const byte = Number(part);
    return byte >= 0 && byte <= 255 ? byte : undefined;
  });

  if (bytes.some((byte) => typeof byte !== "number")) return undefined;

  return (
    (((bytes[0] as number) << 24) >>> 0) +
    ((bytes[1] as number) << 16) +
    ((bytes[2] as number) << 8) +
    (bytes[3] as number)
  );
}

function matchesIpv4Cidr(ip: string, cidr: string) {
  const [rangeIp, bitsText] = cidr.split("/");
  const bits = Number(bitsText);

  if (!rangeIp || !Number.isInteger(bits) || bits < 0 || bits > 32) {
    return false;
  }

  const ipNumber = ipv4ToNumber(ip);
  const rangeNumber = ipv4ToNumber(rangeIp);

  if (typeof ipNumber !== "number" || typeof rangeNumber !== "number") {
    return false;
  }

  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipNumber & mask) === (rangeNumber & mask);
}

export function isIpWhitelisted(ip: string, whitelist: string[]) {
  const normalizedIp = ip.trim().toLowerCase();
  if (!normalizedIp || normalizedIp === "unknown") return false;

  return whitelist.some((entry) => {
    const normalizedEntry = entry.trim().toLowerCase();
    if (!normalizedEntry) return false;

    if (normalizedEntry.includes("/")) {
      return matchesIpv4Cidr(normalizedIp, normalizedEntry);
    }

    return normalizedEntry === normalizedIp;
  });
}

export function getEffectiveDailyTokenLimit(params: {
  profile: AccessCodeProfile;
  ip: string;
  config: AccessControlConfig;
}) {
  const { profile, ip, config } = params;
  if (profile.dailyTokenLimit === null) return null;

  const multiplier = isIpWhitelisted(ip, config.ipWhitelist)
    ? config.whitelistTokenMultiplier
    : 1;

  return Math.floor(profile.dailyTokenLimit * multiplier);
}

export function formatDateInTimeZone(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const byType = new Map(parts.map((part) => [part.type, part.value]));

  return `${byType.get("year")}-${byType.get("month")}-${byType.get("day")}`;
}

export function extractTokenUsageFromJson(value: unknown): number {
  const seen = new WeakSet<object>();

  function numberValue(input: unknown) {
    return typeof input === "number" && Number.isFinite(input)
      ? Math.max(0, Math.floor(input))
      : 0;
  }

  function fromObject(input: Record<string, unknown>, depth: number): number {
    const total =
      numberValue(input.total_tokens) ||
      numberValue(input.totalTokens) ||
      numberValue(input.totalTokenCount);
    if (total > 0) return total;

    const inputTokens =
      numberValue(input.input_tokens) ||
      numberValue(input.prompt_tokens) ||
      numberValue(input.inputTokenCount) ||
      numberValue(input.promptTokenCount);
    const outputTokens =
      numberValue(input.output_tokens) ||
      numberValue(input.completion_tokens) ||
      numberValue(input.outputTokenCount) ||
      numberValue(input.completionTokenCount);
    if (inputTokens + outputTokens > 0) return inputTokens + outputTokens;

    const priorityKeys = ["usage", "usageMetadata", "response"];
    for (const key of priorityKeys) {
      const nested = input[key];
      if (nested && typeof nested === "object") {
        const nestedTokens = visit(nested, depth + 1);
        if (nestedTokens > 0) return nestedTokens;
      }
    }

    for (const nested of Object.values(input)) {
      if (nested && typeof nested === "object") {
        const nestedTokens = visit(nested, depth + 1);
        if (nestedTokens > 0) return nestedTokens;
      }
    }

    return 0;
  }

  function visit(input: unknown, depth: number): number {
    if (!input || typeof input !== "object" || depth > 8) return 0;
    if (seen.has(input)) return 0;
    seen.add(input);

    if (Array.isArray(input)) {
      for (const item of input) {
        const tokens = visit(item, depth + 1);
        if (tokens > 0) return tokens;
      }
      return 0;
    }

    return fromObject(input as Record<string, unknown>, depth);
  }

  return visit(value, 0);
}

function estimateStringTokens(value: string) {
  return Math.ceil(value.length / 4);
}

function estimateContentTokens(value: unknown): number {
  if (typeof value === "string") return estimateStringTokens(value);

  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + estimateContentTokens(item), 0);
  }

  if (!value || typeof value !== "object") return 0;

  const record = value as Record<string, unknown>;
  if (typeof record.text === "string") {
    return estimateStringTokens(record.text);
  }

  if (typeof record.content === "string" || Array.isArray(record.content)) {
    return estimateContentTokens(record.content);
  }

  return Object.values(record).reduce<number>(
    (sum, item) => sum + estimateContentTokens(item),
    0,
  );
}

function numberValue(input: unknown) {
  return typeof input === "number" && Number.isFinite(input)
    ? Math.max(0, Math.floor(input))
    : 0;
}

export function estimateTokenUsageFromRequestJson(value: unknown): number {
  if (!value || typeof value !== "object") return 0;

  const record = value as Record<string, unknown>;
  const outputLimit =
    numberValue(record.max_output_tokens) ||
    numberValue(record.max_tokens) ||
    numberValue(record.max_completion_tokens);

  const inputEstimate =
    estimateContentTokens(record.input) ||
    estimateContentTokens(record.messages) ||
    estimateContentTokens(record.contents);

  return outputLimit + inputEstimate;
}
