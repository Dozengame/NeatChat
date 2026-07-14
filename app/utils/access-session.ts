import { getServerSideConfig } from "../config/server";
import { resolveAccessCodeProfile } from "./access-control";
import { hashWithSecret } from "./hmac";

export const ACCESS_SESSION_COOKIE_NAME = "neatchat_access_session";
const ACCESS_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getAccessSessionSecret() {
  const serverConfig = getServerSideConfig();
  return (
    process.env.ACCESS_DEVICE_ID_SECRET?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.CODE?.trim() ||
    serverConfig.accessControl.profiles
      .map((profile) => profile.codeHash)
      .sort()
      .join(":")
  );
}

function signAccessSession(codeHash: string) {
  return hashWithSecret(codeHash, getAccessSessionSecret());
}

export function createAccessSessionCookieValue(accessCode: string) {
  const serverConfig = getServerSideConfig();
  const accessProfile = resolveAccessCodeProfile(
    accessCode,
    serverConfig.accessControl,
  );

  if (!accessProfile) return undefined;

  const codeHash = accessProfile.codeHash;
  return `${codeHash}.${signAccessSession(codeHash)}`;
}

export function resolveAccessSessionCookieValue(value?: string) {
  if (!value) return undefined;

  const [codeHash, signature] = value.split(".");
  if (!codeHash || !signature) return undefined;

  const serverConfig = getServerSideConfig();
  const profile = serverConfig.accessControl.profiles.find(
    (profile) => profile.codeHash === codeHash,
  );
  if (!profile) return undefined;

  return signature === signAccessSession(codeHash) ? profile : undefined;
}

export function validateAccessSessionCookieValue(value?: string) {
  return !!resolveAccessSessionCookieValue(value);
}

export const accessSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ACCESS_SESSION_MAX_AGE_SECONDS,
};
