"use server";
import {
  createClient,
  executeRequest,
  listTools,
  removeClient,
} from "./client";
import { MCPClientLogger } from "./logger";
import {
  McpConfigData,
  McpRequestMessage,
  ServerConfig,
  ServerStatusResponse,
} from "./types";
import fs from "fs/promises";
import path from "path";
import { getServerSideConfig } from "../config/server";
import { BUILTIN_MCP_CONFIG, mergeMcpConfig } from "./config";
import { JIMENG_MCP_SERVER_ID, normalizeJimengMcpRequest } from "./jimeng";
import { cookies } from "next/headers";
import {
  ACCESS_SESSION_COOKIE_NAME,
  validateAccessSessionCookieValue,
} from "../utils/access-session";
import {
  clientsMap,
  getInitializeMcpSystemPromise,
  runMcpConfigMutation,
  runMcpClientLifecycle,
  setInitializeMcpSystemPromise,
} from "./runtime";

const logger = new MCPClientLogger("MCP Actions");
const CONFIG_PATH = path.join(process.cwd(), "app/mcp/mcp_config.json");
let configWriteSequence = 0;
const MCP_INITIALIZATION_RETRY_DELAYS_MS = [500, 1500];
const RETRYABLE_MCP_INITIALIZATION_ERROR_CODES = new Set([
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_SOCKET",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EAI_AGAIN",
]);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatError(error: unknown) {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
}

function isRetryableMcpInitializationError(error: unknown): boolean {
  const pending = [error];
  const seen = new Set<unknown>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || seen.has(current)) {
      continue;
    }
    seen.add(current);

    if (current instanceof Error) {
      const message = current.message.toLowerCase();
      if (
        (current.name === "TypeError" && message.includes("fetch failed")) ||
        message.includes("connect timeout") ||
        message.includes("connection timeout") ||
        message.includes("timeout")
      ) {
        return true;
      }
      if (current.cause) {
        pending.push(current.cause);
      }
    }

    if (typeof current === "object") {
      const value = current as {
        cause?: unknown;
        code?: unknown;
        errno?: unknown;
      };
      for (const code of [value.code, value.errno]) {
        if (
          typeof code === "string" &&
          RETRYABLE_MCP_INITIALIZATION_ERROR_CODES.has(code)
        ) {
          return true;
        }
      }
      if (value.cause) {
        pending.push(value.cause);
      }
    }
  }

  return false;
}

async function createInitializedClientWithRetry(
  clientId: string,
  serverConfig: ServerConfig,
) {
  for (
    let attemptIndex = 0;
    attemptIndex <= MCP_INITIALIZATION_RETRY_DELAYS_MS.length;
    attemptIndex += 1
  ) {
    let client: Awaited<ReturnType<typeof createClient>> | null = null;
    try {
      client = await createClient(clientId, serverConfig);
      const tools = await listTools(client);
      return { client, tools };
    } catch (error) {
      if (client) {
        try {
          await removeClient(client);
        } catch (closeError) {
          logger.error(
            `Failed to close client [${clientId}] after initialization error: ${closeError}`,
          );
        }
      }

      const retryDelayMs = MCP_INITIALIZATION_RETRY_DELAYS_MS[attemptIndex];
      if (
        retryDelayMs === undefined ||
        !isRetryableMcpInitializationError(error)
      ) {
        throw error;
      }

      logger.info(
        `Retrying initialization for client [${clientId}] in ${retryDelayMs}ms after ${formatError(
          error,
        )} (attempt ${attemptIndex + 2}/${
          MCP_INITIALIZATION_RETRY_DELAYS_MS.length + 1
        })`,
      );
      await delay(retryDelayMs);
    }
  }

  throw new Error(`Failed to initialize client [${clientId}]`);
}

async function auth() {
  const serverConfig = getServerSideConfig();
  if (!serverConfig.enableMcp) {
    throw new Error("MCP is disabled");
  }

  if (!serverConfig.needCode) {
    return { authorized: true };
  }

  const sessionCookie = cookies().get(ACCESS_SESSION_COOKIE_NAME)?.value;
  if (!validateAccessSessionCookieValue(sessionCookie)) {
    throw new Error("Unauthorized MCP action");
  }

  return { authorized: true };
}

async function readMcpConfigFromFile(): Promise<McpConfigData> {
  try {
    const configStr = await fs.readFile(CONFIG_PATH, "utf-8");
    return mergeMcpConfig(BUILTIN_MCP_CONFIG, JSON.parse(configStr));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
      logger.error(`Failed to load MCP config, using default config: ${error}`);
    }
    return BUILTIN_MCP_CONFIG;
  }
}

// 获取客户端状态
export async function getClientsStatus(): Promise<
  Record<string, ServerStatusResponse>
> {
  await auth();
  const config = await readMcpConfigFromFile();
  const result: Record<string, ServerStatusResponse> = {};

  for (const clientId of Object.keys(config.mcpServers)) {
    const status = clientsMap.get(clientId);
    const serverConfig = config.mcpServers[clientId];

    if (!serverConfig) {
      result[clientId] = { status: "undefined", errorMsg: null };
      continue;
    }

    if (!status) {
      if (serverConfig.status === "paused") {
        result[clientId] = { status: "paused", errorMsg: null };
        continue;
      }

      result[clientId] = { status: "undefined", errorMsg: null };
      continue;
    }

    if (
      status.client === null &&
      status.tools === null &&
      status.errorMsg === null
    ) {
      result[clientId] = { status: "initializing", errorMsg: null };
      continue;
    }

    if (status.errorMsg) {
      result[clientId] = { status: "error", errorMsg: status.errorMsg };
      continue;
    }

    if (status.client) {
      result[clientId] = { status: "active", errorMsg: null };
      continue;
    }

    result[clientId] = { status: "error", errorMsg: "Client not found" };
  }

  return result;
}

// 获取客户端工具
export async function getClientTools(clientId: string) {
  const session = await auth();
  return clientsMap.get(clientId)?.tools ?? null;
}

// 获取可用客户端数量
export async function getAvailableClientsCount() {
  const session = await auth();
  let count = 0;
  clientsMap.forEach((map) => !map.errorMsg && count++);
  return count;
}

// 获取所有客户端工具
export async function getAllTools() {
  const session = await auth();
  const result = [];
  for (const [clientId, status] of clientsMap.entries()) {
    result.push({
      clientId,
      tools: status.tools,
    });
  }
  return result;
}

// 初始化单个客户端
async function initializeSingleClientLocked(
  clientId: string,
  serverConfig: ServerConfig,
) {
  // 如果服务器状态是暂停，则不初始化
  if (serverConfig.status === "paused") {
    logger.info(`Skipping initialization for paused client [${clientId}]`);
    return;
  }

  const currentClient = clientsMap.get(clientId);
  if (currentClient?.client && !currentClient.errorMsg) {
    return;
  }

  logger.info(`Initializing client [${clientId}]...`);

  // 先设置初始化状态
  clientsMap.set(clientId, {
    client: null,
    tools: null,
    errorMsg: null, // null 表示正在初始化
  });

  try {
    const { client, tools } = await createInitializedClientWithRetry(
      clientId,
      serverConfig,
    );
    logger.info(
      `Supported tools for [${clientId}]: ${JSON.stringify(tools, null, 2)}`,
    );
    clientsMap.set(clientId, { client, tools, errorMsg: null });
    logger.success(`Client [${clientId}] initialized successfully`);
  } catch (error) {
    clientsMap.set(clientId, {
      client: null,
      tools: null,
      errorMsg: error instanceof Error ? error.message : String(error),
    });
    logger.error(`Failed to initialize client [${clientId}]: ${error}`);
    throw error;
  }
}

async function initializeSingleClient(clientId: string) {
  return runMcpClientLifecycle(clientId, async () => {
    const currentConfig = await readMcpConfigFromFile();
    const serverConfig = currentConfig.mcpServers[clientId];
    if (!serverConfig) {
      throw new Error(`Server ${clientId} not found`);
    }
    return initializeSingleClientLocked(clientId, serverConfig);
  });
}

/**
 * Remove a client from the executable registry before closing its transport.
 * A transport close can reject (for example when the child process has already
 * exited), but no caller should be able to execute against that stale client
 * while the close is pending or after it fails.
 */
async function detachClient(clientId: string) {
  const current = clientsMap.get(clientId);
  clientsMap.delete(clientId);
  if (current?.client) {
    await removeClient(current.client);
  }
}

// 初始化系统
export async function initializeMcpSystem() {
  const authResult = await auth();
  if (!authResult.authorized) {
    throw new Error("Unauthorized MCP action");
  }
  const pendingInitializeMcpSystemPromise = getInitializeMcpSystemPromise();
  if (pendingInitializeMcpSystemPromise) {
    logger.info("MCP system initialization already in progress, reusing...");
    return pendingInitializeMcpSystemPromise;
  }

  const initializeMcpSystemPromise = (async () => {
    logger.info("MCP Actions starting...");
    try {
      const config = await readMcpConfigFromFile();
      // 初始化所有客户端
      await Promise.all(
        Object.keys(config.mcpServers).map((clientId) =>
          initializeSingleClient(clientId),
        ),
      );
      return config;
    } catch (error) {
      logger.error(`Failed to initialize MCP system: ${error}`);
      throw error;
    } finally {
      setInitializeMcpSystemPromise(null);
    }
  })();

  setInitializeMcpSystemPromise(initializeMcpSystemPromise);
  return initializeMcpSystemPromise;
}

// 添加服务器
export async function addMcpServer(clientId: string, config: ServerConfig) {
  await auth();
  try {
    return await runMcpClientLifecycle(clientId, async () => {
      let shouldInitialize = false;
      const newConfig = await mutateMcpConfig((currentConfig) => {
        const existingConfig = currentConfig.mcpServers[clientId];
        const status = config.status ?? existingConfig?.status ?? "active";
        const nextServerConfig: ServerConfig = {
          ...config,
          status,
        };
        // Any non-paused edit replaces the runtime client so credentials,
        // headers, args, URL, and env are never served from an old snapshot.
        shouldInitialize = nextServerConfig.status !== "paused";
        return {
          ...currentConfig,
          mcpServers: {
            ...currentConfig.mcpServers,
            [clientId]: nextServerConfig,
          },
        };
      });

      const serverConfig = newConfig.mcpServers[clientId];
      if (serverConfig) {
        await detachClient(clientId);
        if (shouldInitialize) {
          await initializeSingleClientLocked(clientId, serverConfig);
        }
      }
      return newConfig;
    });
  } catch (error) {
    logger.error(`Failed to add server [${clientId}]: ${error}`);
    throw error;
  }
}

export async function activateMcpClient(clientId: string) {
  await auth();
  await runMcpClientLifecycle(clientId, async () => {
    const currentConfig = await readMcpConfigFromFile();
    const serverConfig = currentConfig.mcpServers[clientId];
    if (!serverConfig) {
      throw new Error(`Server ${clientId} not found`);
    }
    if (serverConfig.status === "paused") {
      throw new Error(`Server ${clientId} is paused`);
    }
    await initializeSingleClientLocked(clientId, serverConfig);
  });

  return getClientsStatus();
}

export async function deactivateMcpClient(clientId: string) {
  const session = await auth();
  await runMcpClientLifecycle(clientId, async () => {
    await detachClient(clientId);
  });
  return getClientsStatus();
}

// 暂停服务器
export async function pauseMcpServer(clientId: string) {
  await auth();
  try {
    return await runMcpClientLifecycle(clientId, async () => {
      const newConfig = await mutateMcpConfig((currentConfig) => {
        const serverConfig = currentConfig.mcpServers[clientId];
        if (!serverConfig) {
          throw new Error(`Server ${clientId} not found`);
        }
        return {
          ...currentConfig,
          mcpServers: {
            ...currentConfig.mcpServers,
            [clientId]: {
              ...serverConfig,
              status: "paused",
            },
          },
        };
      });

      await detachClient(clientId);
      return newConfig;
    });
  } catch (error) {
    logger.error(`Failed to pause server [${clientId}]: ${error}`);
    throw error;
  }
}

// 恢复服务器
export async function resumeMcpServer(clientId: string): Promise<void> {
  await auth();
  try {
    await runMcpClientLifecycle(clientId, async () => {
      const currentConfig = await readMcpConfigFromFile();
      const serverConfig = currentConfig.mcpServers[clientId];
      if (!serverConfig) {
        throw new Error(`Server ${clientId} not found`);
      }

      logger.info(`Trying to initialize client [${clientId}]...`);
      try {
        await initializeSingleClientLocked(clientId, {
          ...serverConfig,
          status: "active",
        });
        await mutateMcpConfig((latestConfig) => {
          const latestServerConfig = latestConfig.mcpServers[clientId];
          if (!latestServerConfig) {
            throw new Error(`Server ${clientId} not found`);
          }
          return {
            ...latestConfig,
            mcpServers: {
              ...latestConfig.mcpServers,
              [clientId]: {
                ...latestServerConfig,
                status: "active" as const,
              },
            },
          };
        });
      } catch (error) {
        await mutateMcpConfig((failedConfig) => {
          const failedServerConfig = failedConfig.mcpServers[clientId];
          if (!failedServerConfig) return failedConfig;
          return {
            ...failedConfig,
            mcpServers: {
              ...failedConfig.mcpServers,
              [clientId]: {
                ...failedServerConfig,
                status: "error" as const,
              },
            },
          };
        });

        clientsMap.set(clientId, {
          client: null,
          tools: null,
          errorMsg: error instanceof Error ? error.message : String(error),
        });
        logger.error(`Failed to initialize client [${clientId}]: ${error}`);
        throw error;
      }
    });
  } catch (error) {
    logger.error(`Failed to resume server [${clientId}]: ${error}`);
    throw error;
  }
}

// 移除服务器
export async function removeMcpServer(clientId: string) {
  await auth();
  try {
    return await runMcpClientLifecycle(clientId, async () => {
      const newConfig = await mutateMcpConfig((currentConfig) => {
        const { [clientId]: _, ...rest } = currentConfig.mcpServers;
        return {
          ...currentConfig,
          mcpServers: rest,
        };
      });

      await detachClient(clientId);
      return newConfig;
    });
  } catch (error) {
    logger.error(`Failed to remove server [${clientId}]: ${error}`);
    throw error;
  }
}

// 重启所有客户端
export async function restartAllClients() {
  await auth();
  logger.info("Restarting all clients...");
  try {
    const configBeforeRestart = await readMcpConfigFromFile();
    const clientIds = new Set([
      ...clientsMap.keys(),
      ...Object.keys(configBeforeRestart.mcpServers),
    ]);

    await Promise.all(
      Array.from(clientIds, (clientId) =>
        runMcpClientLifecycle(clientId, async () => {
          await detachClient(clientId);

          const latestConfig = await readMcpConfigFromFile();
          const latestServerConfig = latestConfig.mcpServers[clientId];
          if (latestServerConfig) {
            await initializeSingleClientLocked(clientId, latestServerConfig);
          }
        }),
      ),
    );
    return readMcpConfigFromFile();
  } catch (error) {
    logger.error(`Failed to restart clients: ${error}`);
    throw error;
  }
}

// 执行 MCP 请求
export async function executeMcpAction(
  clientId: string,
  request: McpRequestMessage,
) {
  await auth();
  try {
    return await runMcpClientLifecycle(clientId, async () => {
      const currentConfig = await readMcpConfigFromFile();
      const serverConfig = currentConfig.mcpServers[clientId];
      if (!serverConfig) {
        throw new Error(`Server ${clientId} not found`);
      }
      if (serverConfig.status === "paused") {
        throw new Error(`Server ${clientId} is paused`);
      }

      let client = clientsMap.get(clientId);
      if (!client?.client) {
        if (
          clientId === JIMENG_MCP_SERVER_ID &&
          getServerSideConfig().enableMcp &&
          serverConfig
        ) {
          await initializeSingleClientLocked(clientId, serverConfig);
          client = clientsMap.get(clientId);
        }
      }

      if (!client?.client) {
        throw new Error(`Client ${clientId} not found`);
      }
      logger.info(`Executing request for [${clientId}]`);
      const requestToExecute =
        clientId === JIMENG_MCP_SERVER_ID
          ? normalizeJimengMcpRequest(request)
          : request;
      return executeRequest(client.client, requestToExecute);
    });
  } catch (error) {
    logger.error(`Failed to execute request for [${clientId}]: ${error}`);
    throw error;
  }
}

// 获取 MCP 配置文件
export async function getMcpConfigFromFile(): Promise<McpConfigData> {
  const session = await auth();
  return readMcpConfigFromFile();
}

async function mutateMcpConfig(
  mutate: (currentConfig: McpConfigData) => McpConfigData,
): Promise<McpConfigData> {
  return runMcpConfigMutation(async () => {
    const currentConfig = await readMcpConfigFromFile();
    const nextConfig = mutate(currentConfig);
    await updateMcpConfig(nextConfig);
    return nextConfig;
  });
}

// 更新 MCP 配置文件
async function updateMcpConfig(config: McpConfigData): Promise<void> {
  const temporaryPath = `${CONFIG_PATH}.${
    process.pid
  }.${Date.now()}-${configWriteSequence++}.tmp`;
  try {
    // 确保目录存在
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.writeFile(temporaryPath, JSON.stringify(config, null, 2));
    await fs.rename(temporaryPath, CONFIG_PATH);
  } catch (error) {
    await fs.unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

// 检查 MCP 是否启用
export async function isMcpEnabled() {
  const session = await auth();
  try {
    const serverConfig = getServerSideConfig();
    return serverConfig.enableMcp;
  } catch (error) {
    logger.error(`Failed to check MCP status: ${error}`);
    return false;
  }
}
