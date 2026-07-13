jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  rename: jest.fn(),
  unlink: jest.fn(),
}));

let mockCookieValue: string | undefined;
let mockServerSideConfig: any = {
  enableMcp: true,
  needCode: false,
  accessControl: { profiles: [] },
};

jest.mock("next/headers", () => ({
  cookies: () => ({
    get: () => (mockCookieValue ? { value: mockCookieValue } : undefined),
  }),
}));

jest.mock("../app/mcp/client", () => ({
  createClient: jest.fn(async () => ({ id: "demo-client" })),
  executeRequest: jest.fn(),
  listTools: jest.fn(async () => ({ tools: [] })),
  removeClient: jest.fn(),
}));

jest.mock("../app/config/server", () => ({
  getServerSideConfig: jest.fn(() => mockServerSideConfig),
}));

jest.mock("../app/mcp/config", () => ({
  BUILTIN_MCP_CONFIG: { mcpServers: {} },
  mergeMcpConfig: (_builtin: unknown, config: unknown) => config,
}));

import fs from "fs/promises";
import {
  createClient,
  executeRequest,
  listTools,
  removeClient,
} from "../app/mcp/client";
import { JIMENG_MCP_SERVER_ID } from "../app/mcp/jimeng";
import { clientsMap, setInitializeMcpSystemPromise } from "../app/mcp/runtime";
import { hashWithSecret } from "../app/utils/hmac";

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

const pausedDemoConfig = JSON.stringify({
  mcpServers: {
    demo: {
      type: "stdio",
      command: "demo",
      args: [],
      status: "paused",
    },
  },
});

const twoActiveClientsConfig = JSON.stringify({
  mcpServers: {
    demo: {
      type: "stdio",
      command: "demo",
      args: [],
      status: "active",
    },
    second: {
      type: "stdio",
      command: "second",
      args: [],
      status: "active",
    },
  },
});

const activeJimengConfig = JSON.stringify({
  mcpServers: {
    [JIMENG_MCP_SERVER_ID]: {
      type: "streamable-http",
      url: "https://jimeng.example.test/mcp",
      status: "active",
    },
  },
});

const pausedJimengConfig = JSON.stringify({
  mcpServers: {
    [JIMENG_MCP_SERVER_ID]: {
      type: "streamable-http",
      url: "https://jimeng.example.test/mcp",
      status: "paused",
    },
  },
});

async function flushAsyncWork() {
  for (let i = 0; i < 25; i += 1) {
    await Promise.resolve();
  }
}

describe("MCP initialization", () => {
  const originalAccessSessionSecret = process.env.ACCESS_DEVICE_ID_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    clientsMap.clear();
    setInitializeMcpSystemPromise(null);
    (fs.readFile as jest.Mock).mockResolvedValue(activeDemoConfig);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.rename as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (createClient as jest.Mock).mockResolvedValue({ id: "demo-client" });
    (listTools as jest.Mock).mockResolvedValue({ tools: [] });
    (executeRequest as jest.Mock).mockResolvedValue({ result: {} });
    (removeClient as jest.Mock).mockResolvedValue(undefined);
    mockCookieValue = undefined;
    mockServerSideConfig = {
      enableMcp: true,
      needCode: false,
      accessControl: { profiles: [] },
    };
    process.env.ACCESS_DEVICE_ID_SECRET = "mcp-auth-test-secret";
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    if (originalAccessSessionSecret === undefined) {
      delete process.env.ACCESS_DEVICE_ID_SECRET;
    } else {
      process.env.ACCESS_DEVICE_ID_SECRET = originalAccessSessionSecret;
    }
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

  test("serializes activate and lazy execution through one client initialization", async () => {
    (fs.readFile as jest.Mock).mockResolvedValue(activeJimengConfig);
    let resolveClient!: (client: { id: string }) => void;
    (createClient as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveClient = resolve;
        }),
    );
    const { activateMcpClient, executeMcpAction } = await import(
      "../app/mcp/actions"
    );
    (listTools as jest.Mock).mockResolvedValueOnce({
      tools: [{ name: "demo-tool" }],
    });

    const activation = activateMcpClient(JIMENG_MCP_SERVER_ID);
    await flushAsyncWork();
    const execution = executeMcpAction(JIMENG_MCP_SERVER_ID, {
      jsonrpc: "2.0",
      id: "request-1",
      method: "tools/call",
      params: { name: "demo-tool", arguments: {} },
    });
    await flushAsyncWork();

    resolveClient({ id: "deferred-client" });
    const outcomes = await Promise.allSettled([activation, execution]);

    expect(outcomes.map((outcome) => outcome.status)).toEqual([
      "fulfilled",
      "fulfilled",
    ]);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(listTools).toHaveBeenCalledTimes(1);
    expect(executeRequest).toHaveBeenCalledTimes(1);
    expect(executeRequest).toHaveBeenCalledWith(
      { id: "deferred-client" },
      expect.objectContaining({ id: "request-1", method: "tools/call" }),
    );
  });

  test("temporarily activates the paused built-in Jimeng client for explicit execution", async () => {
    (fs.readFile as jest.Mock).mockResolvedValue(pausedJimengConfig);
    const {
      activateMcpClient,
      deactivateMcpClient,
      executeMcpAction,
    } = await import("../app/mcp/actions");
    (listTools as jest.Mock).mockResolvedValueOnce({
      tools: [{ name: "dreamina_text2image" }],
    });

    await activateMcpClient(JIMENG_MCP_SERVER_ID);
    await executeMcpAction(JIMENG_MCP_SERVER_ID, {
      jsonrpc: "2.0",
      id: "jimeng-request",
      method: "tools/call",
      params: { name: "dreamina_text2image", arguments: { poll: 60 } },
    });
    await deactivateMcpClient(JIMENG_MCP_SERVER_ID);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      JIMENG_MCP_SERVER_ID,
      expect.objectContaining({ status: "active" }),
    );
    expect(executeRequest).toHaveBeenCalledWith(
      { id: "demo-client" },
      expect.objectContaining({
        id: "jimeng-request",
        params: expect.objectContaining({
          arguments: expect.objectContaining({ poll: 0 }),
        }),
      }),
    );
    expect(removeClient).toHaveBeenCalledWith({ id: "demo-client" });
    expect(clientsMap.has(JIMENG_MCP_SERVER_ID)).toBe(false);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  test("applies deactivate after an in-flight activation completes", async () => {
    let resolveClient!: (client: { id: string }) => void;
    (createClient as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveClient = resolve;
        }),
    );
    const { activateMcpClient, deactivateMcpClient } = await import(
      "../app/mcp/actions"
    );

    const activation = activateMcpClient("demo");
    await flushAsyncWork();
    const deactivation = deactivateMcpClient("demo");
    await flushAsyncWork();

    resolveClient({ id: "deferred-client" });
    await Promise.all([activation, deactivation]);

    expect(removeClient).toHaveBeenCalledTimes(1);
    expect(removeClient).toHaveBeenCalledWith({ id: "deferred-client" });
    expect(clientsMap.has("demo")).toBe(false);
  });

  test("applies pause after an in-flight activation completes", async () => {
    let resolveClient!: (client: { id: string }) => void;
    (createClient as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveClient = resolve;
        }),
    );
    const { activateMcpClient, pauseMcpServer } = await import(
      "../app/mcp/actions"
    );

    const activation = activateMcpClient("demo");
    await flushAsyncWork();
    const pause = pauseMcpServer("demo");
    await flushAsyncWork();

    resolveClient({ id: "deferred-client" });
    await Promise.all([activation, pause]);

    expect(removeClient).toHaveBeenCalledTimes(1);
    expect(removeClient).toHaveBeenCalledWith({ id: "deferred-client" });
    expect(clientsMap.has("demo")).toBe(false);
  });

  test("does not reactivate a client from a stale snapshot after pause", async () => {
    let resolvePauseRead!: (config: string) => void;
    (fs.readFile as jest.Mock)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePauseRead = resolve;
          }),
      )
      .mockResolvedValue(pausedDemoConfig);
    const { activateMcpClient, pauseMcpServer } = await import(
      "../app/mcp/actions"
    );

    const pause = pauseMcpServer("demo");
    await flushAsyncWork();
    const activation = activateMcpClient("demo");
    await flushAsyncWork();

    resolvePauseRead(activeDemoConfig);
    await pause;
    await expect(activation).rejects.toThrow("Server demo is paused");

    expect(createClient).not.toHaveBeenCalled();
    expect(clientsMap.has("demo")).toBe(false);
  });

  test("serializes config mutations across different clients", async () => {
    let storedConfig = twoActiveClientsConfig;
    const temporaryFiles = new Map<string, string>();
    let releaseFirstWrite!: () => void;
    const firstWriteGate = new Promise<void>((resolve) => {
      releaseFirstWrite = resolve;
    });
    let writeCount = 0;
    (fs.readFile as jest.Mock).mockImplementation(async () => storedConfig);
    (fs.writeFile as jest.Mock).mockImplementation(
      async (filePath: string, value: string) => {
        writeCount += 1;
        if (writeCount === 1) await firstWriteGate;
        if (filePath.endsWith(".tmp")) {
          temporaryFiles.set(filePath, value);
        } else {
          storedConfig = value;
        }
      },
    );
    (fs.rename as jest.Mock).mockImplementation(
      async (from: string, _to: string) => {
        storedConfig = temporaryFiles.get(from) ?? storedConfig;
        temporaryFiles.delete(from);
      },
    );
    const { pauseMcpServer } = await import("../app/mcp/actions");

    const pauses = Promise.all([
      pauseMcpServer("demo"),
      pauseMcpServer("second"),
    ]);
    await flushAsyncWork();
    releaseFirstWrite();
    await pauses;

    expect(JSON.parse(storedConfig)).toMatchObject({
      mcpServers: {
        demo: { status: "paused" },
        second: { status: "paused" },
      },
    });
  });

  test("reuses an in-flight activation when the same client is resumed", async () => {
    let resolveClient!: (client: { id: string }) => void;
    (createClient as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveClient = resolve;
        }),
    );
    const { activateMcpClient, resumeMcpServer } = await import(
      "../app/mcp/actions"
    );

    const activation = activateMcpClient("demo");
    await flushAsyncWork();
    const resume = resumeMcpServer("demo");
    await flushAsyncWork();

    resolveClient({ id: "deferred-client" });
    await Promise.all([activation, resume]);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(clientsMap.get("demo")?.client).toEqual({ id: "deferred-client" });
  });

  test("restarts a client only after its in-flight activation settles", async () => {
    let resolveClient!: (client: { id: string }) => void;
    (createClient as jest.Mock)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveClient = resolve;
          }),
      )
      .mockResolvedValueOnce({ id: "restarted-client" });
    const { activateMcpClient, restartAllClients } = await import(
      "../app/mcp/actions"
    );

    const activation = activateMcpClient("demo");
    await flushAsyncWork();
    const restart = restartAllClients();
    await flushAsyncWork();

    resolveClient({ id: "deferred-client" });
    await Promise.all([activation, restart]);

    expect(removeClient).toHaveBeenCalledTimes(1);
    expect(removeClient).toHaveBeenCalledWith({ id: "deferred-client" });
    expect(createClient).toHaveBeenCalledTimes(2);
    expect(clientsMap.get("demo")?.client).toEqual({ id: "restarted-client" });
  });

  test("restart honors a pause that was already queued for the client", async () => {
    let resolvePauseRead!: (config: string) => void;
    (fs.readFile as jest.Mock)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePauseRead = resolve;
          }),
      )
      .mockResolvedValueOnce(activeDemoConfig)
      .mockResolvedValue(pausedDemoConfig);
    const { pauseMcpServer, restartAllClients } = await import(
      "../app/mcp/actions"
    );

    const pause = pauseMcpServer("demo");
    await flushAsyncWork();
    const restart = restartAllClients();
    await flushAsyncWork();

    resolvePauseRead(activeDemoConfig);
    await Promise.all([pause, restart]);

    expect(createClient).not.toHaveBeenCalled();
    expect(clientsMap.has("demo")).toBe(false);
  });

  test("waits for an in-flight tool request before deactivating the client", async () => {
    clientsMap.set("demo", {
      client: { id: "active-client" } as any,
      tools: { tools: [{ name: "side-effect" }] },
      errorMsg: null,
    });
    let resolveExecution!: (result: { result: object }) => void;
    (executeRequest as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveExecution = resolve;
        }),
    );
    const { deactivateMcpClient, executeMcpAction } = await import(
      "../app/mcp/actions"
    );

    const execution = executeMcpAction("demo", {
      jsonrpc: "2.0",
      id: "request-in-flight",
      method: "tools/call",
      params: { name: "side-effect", arguments: {} },
    });
    await flushAsyncWork();
    const deactivation = deactivateMcpClient("demo");
    await flushAsyncWork();

    expect(removeClient).not.toHaveBeenCalled();
    resolveExecution({ result: {} });
    await Promise.all([execution, deactivation]);

    expect(removeClient).toHaveBeenCalledWith({ id: "active-client" });
    expect(clientsMap.has("demo")).toBe(false);
  });

  test("only executes listed tools through the tools/call method", async () => {
    clientsMap.set("demo", {
      client: { id: "active-client" } as any,
      tools: { tools: [{ name: "allowed-tool" }] },
      errorMsg: null,
    });
    const { executeMcpAction } = await import("../app/mcp/actions");

    await expect(
      executeMcpAction(
        "demo",
        {
          method: "resources/read",
          params: { name: "allowed-tool", arguments: {} },
        } as any,
      ),
    ).rejects.toThrow("Invalid MCP tool request");
    await expect(
      executeMcpAction("demo", {
        method: "tools/call",
        params: { name: "unknown-tool", arguments: {} },
      }),
    ).rejects.toThrow("MCP tool is not available");
    await expect(
      executeMcpAction(
        "demo",
        {
          method: "tools/call",
          params: { name: "allowed-tool", arguments: [] },
        } as any,
      ),
    ).rejects.toThrow("Invalid MCP tool request");

    expect(executeRequest).not.toHaveBeenCalled();
  });

  test("separates normal MCP use from administrator management", async () => {
    const normalHash = "normal-profile-hash";
    const adminHash = "admin-profile-hash";
    const profiles = [
      {
        tier: "normal",
        label: "Normal",
        codeHash: normalHash,
        dailyTokenLimit: 1000,
      },
      {
        tier: "admin",
        label: "Admin",
        codeHash: adminHash,
        dailyTokenLimit: null,
      },
    ];
    mockServerSideConfig = {
      enableMcp: true,
      needCode: true,
      accessControl: { profiles },
    };
    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify({
        mcpServers: {
          demo: {
            type: "stdio",
            command: "/usr/bin/demo",
            args: ["--secret-path"],
            env: { DEMO_TOKEN: "secret" },
            url: "https://internal.example/mcp",
            headers: { Authorization: "Bearer secret" },
            status: "active",
            chatDefaultEnabled: true,
          },
        },
      }),
    );
    clientsMap.set("demo", {
      client: { id: "active-client" } as any,
      tools: { tools: [{ name: "allowed-tool" }] },
      errorMsg: null,
    });
    const actions = await import("../app/mcp/actions");
    const cookieFor = (codeHash: string) =>
      `${codeHash}.${hashWithSecret(codeHash, "mcp-auth-test-secret")}`;

    mockCookieValue = cookieFor(normalHash);
    await expect(actions.getAllTools()).resolves.toHaveLength(1);
    await expect(
      actions.executeMcpAction("demo", {
        method: "tools/call",
        params: { name: "allowed-tool", arguments: {} },
      }),
    ).resolves.toEqual({ result: {} });
    const chatState = await actions.getMcpChatServerStates();
    expect(chatState).toEqual({
      demo: { status: "active", chatDefaultEnabled: true },
    });
    expect(JSON.stringify(chatState)).not.toMatch(
      /command|args|env|url|headers|Authorization|errorMsg/,
    );
    await expect(actions.getMcpConfigFromFile()).rejects.toThrow(
      "Administrator access",
    );
    await expect(
      actions.addMcpServer("blocked", { command: "blocked" }),
    ).rejects.toThrow("Administrator access");
    await expect(actions.pauseMcpServer("demo")).rejects.toThrow(
      "Administrator access",
    );
    await expect(actions.restartAllClients()).rejects.toThrow(
      "Administrator access",
    );
    await expect(actions.activateMcpClient("demo")).rejects.toThrow(
      "Administrator access",
    );
    await expect(actions.deactivateMcpClient("demo")).rejects.toThrow(
      "Administrator access",
    );

    mockCookieValue = cookieFor(adminHash);
    await expect(actions.activateMcpClient("demo")).resolves.toBeUndefined();
    await expect(actions.getMcpConfigFromFile()).resolves.toMatchObject({
      mcpServers: { demo: { command: "/usr/bin/demo" } },
    });
    await expect(actions.getClientsStatus()).resolves.toMatchObject({
      demo: { status: "active" },
    });
    await expect(actions.deactivateMcpClient("demo")).resolves.toBeUndefined();

    mockCookieValue = `${normalHash}.forged-signature`;
    await expect(actions.getAllTools()).rejects.toThrow("Unauthorized");
    mockCookieValue = cookieFor("removed-profile-hash");
    await expect(actions.getAllTools()).rejects.toThrow("Unauthorized");
  });

  test("initializes every configured client when one client already exists", async () => {
    (fs.readFile as jest.Mock).mockResolvedValue(twoActiveClientsConfig);
    clientsMap.set("demo", {
      client: { id: "existing-client" } as any,
      tools: { tools: [] },
      errorMsg: null,
    });
    const { initializeMcpSystem } = await import("../app/mcp/actions");

    await initializeMcpSystem();

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      "second",
      expect.objectContaining({ command: "second", status: "active" }),
    );
    expect(clientsMap.get("demo")?.client).toEqual({ id: "existing-client" });
    expect(clientsMap.get("second")?.client).toEqual({ id: "demo-client" });
  });

  test("replaces an existing active client when its configuration is edited", async () => {
    clientsMap.set("demo", {
      client: { id: "old-client" } as any,
      tools: { tools: [] },
      errorMsg: null,
    });
    (createClient as jest.Mock).mockResolvedValueOnce({ id: "new-client" });
    const { addMcpServer } = await import("../app/mcp/actions");

    await addMcpServer("demo", {
      type: "stdio",
      command: "demo-v2",
      args: ["--fresh"],
      env: { DEMO_TOKEN: "rotated" },
    });

    expect(removeClient).toHaveBeenCalledWith({ id: "old-client" });
    expect(createClient).toHaveBeenCalledWith(
      "demo",
      expect.objectContaining({
        command: "demo-v2",
        args: ["--fresh"],
        env: { DEMO_TOKEN: "rotated" },
        status: "active",
      }),
    );
    expect(clientsMap.get("demo")?.client).toEqual({ id: "new-client" });
  });

  test.each([
    ["pause", "pauseMcpServer"],
    ["remove", "removeMcpServer"],
    ["deactivate", "deactivateMcpClient"],
  ])("detaches the client before a %s close rejection", async (_label, actionName) => {
    clientsMap.set("demo", {
      client: { id: "stale-client" } as any,
      tools: { tools: [] },
      errorMsg: null,
    });
    (removeClient as jest.Mock).mockRejectedValueOnce(
      new Error("transport already closed"),
    );
    const actions = await import("../app/mcp/actions");
    const action = actions[actionName as keyof typeof actions] as (
      clientId: string,
    ) => Promise<unknown>;

    await expect(action("demo")).rejects.toThrow("transport already closed");
    expect(clientsMap.has("demo")).toBe(false);
    expect(executeRequest).not.toHaveBeenCalled();
  });

  test("detaches before a restart close rejection", async () => {
    clientsMap.set("demo", {
      client: { id: "stale-client" } as any,
      tools: { tools: [] },
      errorMsg: null,
    });
    (removeClient as jest.Mock).mockRejectedValueOnce(
      new Error("transport already closed"),
    );
    const { restartAllClients } = await import("../app/mcp/actions");

    await expect(restartAllClients()).rejects.toThrow("transport already closed");
    expect(clientsMap.has("demo")).toBe(false);
  });

  test("rejects execution against a paused or removed server even when a stale client is present", async () => {
    clientsMap.set("demo", {
      client: { id: "stale-client" } as any,
      tools: { tools: [] },
      errorMsg: null,
    });
    (fs.readFile as jest.Mock).mockResolvedValueOnce(pausedDemoConfig);
    const { executeMcpAction } = await import("../app/mcp/actions");

    await expect(
      executeMcpAction("demo", {
        jsonrpc: "2.0",
        id: "paused-request",
        method: "tools/call",
        params: { name: "demo-tool", arguments: {} },
      }),
    ).rejects.toThrow("Server demo is paused");
    expect(executeRequest).not.toHaveBeenCalled();

    (fs.readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ mcpServers: {} }),
    );
    await expect(
      executeMcpAction("demo", {
        jsonrpc: "2.0",
        id: "removed-request",
        method: "tools/call",
        params: { name: "demo-tool", arguments: {} },
      }),
    ).rejects.toThrow("Server demo not found");
    expect(executeRequest).not.toHaveBeenCalled();
  });
});
