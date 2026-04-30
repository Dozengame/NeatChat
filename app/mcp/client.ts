import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { MCPClientLogger } from "./logger";
import { ListToolsResponse, McpRequestMessage, ServerConfig } from "./types";
import { z } from "zod";
import { resolveConfigHeaders } from "./config";

const logger = new MCPClientLogger();

async function createTransport(id: string, config: ServerConfig) {
  if (config.type === "streamable-http" || config.url) {
    if (!config.url) {
      throw new Error(`Missing remote URL for MCP client [${id}]`);
    }

    const { StreamableHTTPClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/streamableHttp.js"
    );

    return new StreamableHTTPClientTransport(new URL(config.url), {
      requestInit: {
        headers: resolveConfigHeaders(config.headers, id),
      },
    });
  }

  if (!config.command) {
    throw new Error(`Missing command for MCP client [${id}]`);
  }

  return new StdioClientTransport({
    command: config.command,
    args: config.args ?? [],
    env: {
      ...Object.fromEntries(
        Object.entries(process.env)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, v as string]),
      ),
      ...(config.env || {}),
    },
  });
}

export async function createClient(
  id: string,
  config: ServerConfig,
): Promise<Client> {
  logger.info(`Creating client for ${id}...`);

  const transport = await createTransport(id, config);

  const client = new Client(
    {
      name: `nextchat-mcp-client-${id}`,
      version: "1.0.0",
    },
    {
      capabilities: {},
    },
  );
  await client.connect(transport);
  return client;
}

export async function removeClient(client: Client) {
  logger.info(`Removing client...`);
  await client.close();
}

export async function listTools(client: Client): Promise<ListToolsResponse> {
  return client.listTools();
}

export async function executeRequest(
  client: Client,
  request: McpRequestMessage,
) {
  return client.request(request, z.any());
}
