import type {
  McpConfigData,
  PresetServer,
  ServerConfig,
} from "../../mcp/types";

export interface ConfigProperty {
  type: string;
  description?: string;
  required?: boolean;
  minItems?: number;
  itemLabel?: string;
  addButtonText?: string;
}

export function getOperationStatusType(message: string) {
  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes("stopping")) return "stopping";
  if (normalizedMessage.includes("starting")) return "starting";
  if (normalizedMessage.includes("error")) return "error";
  return "default";
}

export function buildServerConfigFromPreset(
  preset: PresetServer,
): ServerConfig {
  if (preset.type === "streamable-http" || preset.url) {
    if (!preset.url) {
      throw new Error("Missing MCP server URL");
    }

    return {
      type: "streamable-http",
      url: preset.url,
      ...(preset.headers ? { headers: preset.headers } : {}),
      ...(preset.status ? { status: preset.status } : {}),
      ...(preset.chatDefaultEnabled !== undefined
        ? { chatDefaultEnabled: preset.chatDefaultEnabled }
        : {}),
    };
  }

  if (!preset.command) {
    throw new Error("Missing MCP server command");
  }

  return {
    type: "stdio",
    command: preset.command,
    args: [...(preset.baseArgs ?? [])],
  };
}

export function buildUserConfigFromServer(
  preset: PresetServer | undefined,
  config: McpConfigData | undefined,
  serverId: string,
) {
  const currentConfig = config?.mcpServers[serverId];
  if (!currentConfig || !preset?.configSchema) return {};

  return Object.entries(preset.argsMapping || {}).reduce<Record<string, any>>(
    (nextConfig, [key, mapping]) => {
      if (mapping.type === "spread") {
        const startPos = mapping.position ?? 0;
        return {
          ...nextConfig,
          [key]: (currentConfig.args ?? []).slice(startPos),
        };
      }

      if (mapping.type === "single") {
        return {
          ...nextConfig,
          [key]: (currentConfig.args ?? [])[mapping.position ?? 0],
        };
      }

      if (mapping.type === "env" && mapping.key && currentConfig.env) {
        return {
          ...nextConfig,
          [key]: currentConfig.env[mapping.key],
        };
      }

      return nextConfig;
    },
    {},
  );
}

function insertArgs(baseArgs: string[], position: number, values: string[]) {
  return [
    ...baseArgs.slice(0, position),
    ...values,
    ...baseArgs.slice(position),
  ];
}

export function buildConfiguredServerConfig(
  preset: PresetServer,
  userConfig: Record<string, any>,
): ServerConfig {
  const env: Record<string, string> = {};
  const args = Object.entries(preset.argsMapping || {}).reduce<string[]>(
    (nextArgs, [key, mapping]) => {
      const value = userConfig[key];

      if (mapping.type === "spread" && Array.isArray(value)) {
        return insertArgs(nextArgs, mapping.position ?? 0, value);
      }

      if (mapping.type === "single" && mapping.position !== undefined) {
        return nextArgs.map((arg, index) =>
          index === mapping.position ? value : arg,
        );
      }

      if (mapping.type === "env" && mapping.key && typeof value === "string") {
        env[mapping.key] = value;
      }

      return nextArgs;
    },
    [...(preset.baseArgs ?? [])],
  );

  return {
    type: preset.type ?? "stdio",
    command: preset.command,
    args,
    ...(preset.url ? { url: preset.url } : {}),
    ...(preset.headers ? { headers: preset.headers } : {}),
    ...(preset.chatDefaultEnabled !== undefined
      ? { chatDefaultEnabled: preset.chatDefaultEnabled }
      : {}),
    ...(Object.keys(env).length > 0 ? { env } : {}),
  };
}
