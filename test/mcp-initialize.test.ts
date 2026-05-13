jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock("../app/mcp/client", () => ({
  createClient: jest.fn(async () => ({ id: "demo-client" })),
  executeRequest: jest.fn(),
  listTools: jest.fn(async () => ({ tools: [] })),
  removeClient: jest.fn(),
}));

jest.mock("../app/config/server", () => ({
  getServerSideConfig: jest.fn(() => ({ enableMcp: true })),
}));

jest.mock("../app/mcp/config", () => ({
  BUILTIN_MCP_CONFIG: { mcpServers: {} },
  mergeMcpConfig: (_builtin: unknown, config: unknown) => config,
}));

import fs from "fs/promises";
import { createClient, listTools } from "../app/mcp/client";

describe("MCP initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          demo: {
            type: "stdio",
            command: "demo",
            args: [],
            status: "active",
          },
        },
      }),
    );
  });

  test("reuses the same in-flight initialization", async () => {
    const { initializeMcpSystem } = await import("../app/mcp/actions");

    await Promise.all([initializeMcpSystem(), initializeMcpSystem()]);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(listTools).toHaveBeenCalledTimes(1);
  });
});
