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
import { clientsMap, setInitializeMcpSystemPromise } from "../app/mcp/runtime";

const activeDemoConfig = JSON.stringify({
  mcpServers: {
    demo: {
      type: "stdio",
      command: "demo",
      args: [],
      status: "active",
    },
  },
});

async function flushAsyncWork() {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

describe("MCP initialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clientsMap.clear();
    setInitializeMcpSystemPromise(null);
    (fs.readFile as jest.Mock).mockResolvedValue(activeDemoConfig);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("reuses the same in-flight initialization", async () => {
    const { initializeMcpSystem } = await import("../app/mcp/actions");

    await Promise.all([initializeMcpSystem(), initializeMcpSystem()]);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(listTools).toHaveBeenCalledTimes(1);
  });

  test("retries transient client initialization failures before marking the client failed", async () => {
    jest.useFakeTimers();
    const transientError = new TypeError("fetch failed", {
      cause: Object.assign(new Error("Connect Timeout Error"), {
        code: "UND_ERR_CONNECT_TIMEOUT",
      }),
    });
    (createClient as jest.Mock)
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce({ id: "demo-client-after-retry" });

    const { initializeMcpSystem } = await import("../app/mcp/actions");
    const initialization = initializeMcpSystem();

    await flushAsyncWork();
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(clientsMap.get("demo")).toEqual({
      client: null,
      tools: null,
      errorMsg: null,
    });

    await jest.runOnlyPendingTimersAsync();
    await initialization;

    expect(createClient).toHaveBeenCalledTimes(2);
    expect(listTools).toHaveBeenCalledTimes(1);
    expect(clientsMap.get("demo")).toEqual({
      client: { id: "demo-client-after-retry" },
      tools: { tools: [] },
      errorMsg: null,
    });
  });
});
