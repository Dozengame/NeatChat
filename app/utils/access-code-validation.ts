import type { PublicAppConfig } from "./public-app-config";

type AccessCodeValidationServerConfig = Pick<
  PublicAppConfig,
  "configHash" | "configVersion" | "deploymentId"
>;

function toLocalDayKey(time: number) {
  if (!Number.isFinite(time) || time <= 0) return "";

  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isAccessCodeValidatedToday(
  validatedAt: number,
  now = Date.now(),
) {
  return toLocalDayKey(validatedAt) === toLocalDayKey(now);
}

export function getAccessCodeValidationServerId(
  config?: AccessCodeValidationServerConfig,
) {
  return [config?.deploymentId, config?.configVersion, config?.configHash]
    .filter(Boolean)
    .join("|");
}

export function isAccessCodeValidationCurrent(params: {
  accessCode: string;
  validatedAccessCode: string;
  accessCodeValidatedAt: number;
  accessCodeValidatedServerId: string;
  serverConfig?: AccessCodeValidationServerConfig;
  now?: number;
}) {
  const currentServerId = getAccessCodeValidationServerId(params.serverConfig);

  return (
    params.accessCode.length > 0 &&
    params.validatedAccessCode === params.accessCode &&
    currentServerId.length > 0 &&
    params.accessCodeValidatedServerId === currentServerId &&
    isAccessCodeValidatedToday(params.accessCodeValidatedAt, params.now)
  );
}
