jest.mock("nanoid", () => ({ nanoid: () => "mcp-recovery-id" }));

const chat = jest.fn<Promise<void>, [any]>(() => Promise.resolve());
const initializeMcpSystem = jest.fn<Promise<void>, []>();
const isMcpEnabled = jest.fn<Promise<boolean>, []>(() => Promise.resolve(true));
const getAllTools = jest.fn<Promise<any[]>, []>(() => Promise.resolve([]));
const getClientsStatus = jest.fn<Promise<Record<string, any>>, []>(() =>
  Promise.resolve({}),
);
const getMcpConfigFromFile = jest.fn<Promise<any>, []>(() =>
  Promise.resolve({ mcpServers: {} }),
);

jest.mock("../app/client/api", () => ({
  getHeaders: () => ({}),
  getClientApi: jest.fn(() => ({ llm: { chat } })),
  ClientApi: jest.fn(),
}));

jest.mock("../app/mcp/actions", () => ({
  executeMcpAction: jest.fn(),
  getAllTools: () => getAllTools(),
  getClientsStatus: () => getClientsStatus(),
  getMcpConfigFromFile: () => getMcpConfigFromFile(),
  initializeMcpSystem: () => initializeMcpSystem(),
  isMcpEnabled: () => isMcpEnabled(),
}));

import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";
import { useChatStore } from "../app/store/chat";

describe("MCP chat recovery", () => {
  beforeEach(async () => {
    chat.mockReset();
    chat.mockResolvedValue(undefined);
    initializeMcpSystem.mockReset();
    getAllTools.mockReset();
    getAllTools.mockResolvedValue([]);
    getClientsStatus.mockReset();
    getClientsStatus.mockResolvedValue({});
    getMcpConfigFromFile.mockReset();
    getMcpConfigFromFile.mockResolvedValue({ mcpServers: {} });
    isMcpEnabled.mockReset();
    isMcpEnabled.mockResolvedValue(true);
    useAppConfig.setState({
      ...DEFAULT_CONFIG,
      enableAutoGenerateTitle: false,
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        sendMemory: false,
      },
    });
    useChatStore.setState({
      sessions: [],
      temporarySession: undefined,
      currentSessionIndex: -1,
      lastInput: "",
    } as any);
  });

  test("keeps chat usable and retries initialization after the cooldown", async () => {
    let now = 1_000;
    const nowSpy = jest.spyOn(Date, "now").mockImplementation(() => now);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    initializeMcpSystem
      .mockRejectedValueOnce(new Error("MCP unavailable"))
      .mockResolvedValue(undefined);
    await useChatStore.getState().resetMcpCache();
    try {
      await useChatStore.getState().onUserInput("first");
      expect(chat).toHaveBeenCalledTimes(1);
      expect(initializeMcpSystem).toHaveBeenCalledTimes(1);

      now = 30_999;
      await useChatStore.getState().onUserInput("second");
      expect(chat).toHaveBeenCalledTimes(2);
      expect(initializeMcpSystem).toHaveBeenCalledTimes(1);

      now = 31_000;
      await useChatStore.getState().onUserInput("third");
      expect(chat).toHaveBeenCalledTimes(3);
      expect(initializeMcpSystem).toHaveBeenCalledTimes(2);
      expect(getAllTools).toHaveBeenCalledTimes(2);
      expect(getClientsStatus).toHaveBeenCalledTimes(2);
      expect(getMcpConfigFromFile).toHaveBeenCalledTimes(2);
    } finally {
      nowSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }
  });

  test("keeps healthy servers available when another server repeatedly fails", async () => {
    let now = 1_000;
    const nowSpy = jest.spyOn(Date, "now").mockImplementation(() => now);
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    initializeMcpSystem.mockRejectedValue(new Error("broken unavailable"));
    getAllTools.mockResolvedValue([
      {
        clientId: "healthy",
        tools: {
          tools: [
            {
              name: "healthy_search",
              description: "Search the healthy server",
              inputSchema: { type: "object", properties: {} },
            },
          ],
        },
      },
      { clientId: "broken", tools: null },
    ]);
    getClientsStatus.mockResolvedValue({
      healthy: { status: "active", errorMsg: null },
      broken: { status: "error", errorMsg: "unavailable" },
    });
    getMcpConfigFromFile.mockResolvedValue({
      mcpServers: {
        healthy: { chatDefaultEnabled: true },
        broken: { chatDefaultEnabled: true },
      },
    });
    await useChatStore.getState().resetMcpCache();

    try {
      await useChatStore.getState().onUserInput("first");
      expect(chat).toHaveBeenCalledTimes(1);
      expect(initializeMcpSystem).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(chat.mock.calls[0][0].messages)).toContain(
        "healthy_search",
      );
      expect(JSON.stringify(chat.mock.calls[0][0].messages)).not.toContain(
        "broken unavailable",
      );

      now = 31_000;
      await useChatStore.getState().onUserInput("second");
      expect(chat).toHaveBeenCalledTimes(2);
      expect(initializeMcpSystem).toHaveBeenCalledTimes(2);
      expect(JSON.stringify(chat.mock.calls[1][0].messages)).toContain(
        "healthy_search",
      );
    } finally {
      nowSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }
  });
});
