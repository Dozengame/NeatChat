import type { McpConfigData } from "./types";

export function mergeMcpConfig(
  defaultConfig: McpConfigData,
  runtimeConfig: McpConfigData,
): McpConfigData {
  return {
    ...defaultConfig,
    ...runtimeConfig,
    mcpServers: {
      ...defaultConfig.mcpServers,
      ...runtimeConfig.mcpServers,
    },
  };
}

function resolveEnvTemplate(value: string, clientId: string) {
  return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_, name: string) => {
    const envValue = process.env[name];
    if (!envValue) {
      throw new Error(
        `Missing environment variable ${name} for MCP client [${clientId}]`,
      );
    }
    return envValue;
  });
}

export function resolveConfigHeaders(
  headers: Record<string, string> | undefined,
  clientId: string,
) {
  return Object.fromEntries(
    Object.entries(headers ?? {}).map(([key, value]) => [
      key,
      resolveEnvTemplate(value, clientId),
    ]),
  );
}
