jest.mock("nanoid", () => ({ nanoid: () => "mcp-recovery-id" }));

const chat = jest.fn<Promise<void>, [any]>(() => Promise.resolve());
const initializeMcpSystem = jest.fn<Promise<void>, []>();
const isMcpEnabled = jest.fn<Promise<boolean>, []>(() => Promise.resolve(true));
const getAllTools = jest.fn<Promise<any[]>, []>(() => Promise.resolve([]));
const getMcpChatServerStates = jest.fn<Promise<Record<string, any>>, []>(() =>
  Promise.resolve({}),
);
const executeMcpAction = jest.fn<Promise<unknown>, [string, unknown]>();
const showToast = jest.fn();

jest.mock("../app/client/api", () => ({
  getHeaders: () => ({}),
  getClientApi: jest.fn(() => ({ llm: { chat } })),
  ClientApi: jest.fn(),
}));

jest.mock("../app/mcp/actions", () => ({
  executeMcpAction: (...args: [string, unknown]) => executeMcpAction(...args),
  getAllTools: () => getAllTools(),
  getMcpChatServerStates: () => getMcpChatServerStates(),
  initializeMcpSystem: () => initializeMcpSystem(),
  isMcpEnabled: () => isMcpEnabled(),
}));

jest.mock("../app/components/ui-lib-actions", () => ({
  showToast: (...args: unknown[]) => showToast(...args),
}));

import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";
import { createMessage, useChatStore } from "../app/store/chat";
import Locale from "../app/locales";

describe("MCP chat recovery", () => {
  beforeEach(async () => {
    chat.mockReset();
    chat.mockResolvedValue(undefined);
    initializeMcpSystem.mockReset();
    getAllTools.mockReset();
    getAllTools.mockResolvedValue([]);
    getMcpChatServerStates.mockReset();
    getMcpChatServerStates.mockResolvedValue({});
    isMcpEnabled.mockReset();
    isMcpEnabled.mockResolvedValue(true);
    executeMcpAction.mockReset();
    showToast.mockReset();
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
      expect(getMcpChatServerStates).toHaveBeenCalledTimes(2);
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
    getMcpChatServerStates.mockResolvedValue({
      healthy: { status: "active", chatDefaultEnabled: true },
      broken: { status: "error", chatDefaultEnabled: true },
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

  test("settles a failed generic tool call in its original session", async () => {
    executeMcpAction.mockRejectedValueOnce(
      new Error("Authorization: Bearer private-upstream-token"),
    );
    await useChatStore.getState().resetMcpCache();
    const session = useChatStore.getState().currentSession();
    await useChatStore.getState().getMessagesWithMemory({ session });
    const message = createMessage({
      id: "generic-tool-message",
      role: "assistant",
      streaming: false,
      content: [
        "```json:mcp:demo",
        JSON.stringify({
          method: "tools/call",
          params: { name: "lookup", arguments: { query: "panda" } },
        }),
        "```",
      ].join("\n"),
    });
    session.messages = [message];

    useChatStore.getState().checkMcpJson(message, session);
    await Promise.resolve();
    await Promise.resolve();

    expect(message).toMatchObject({
      streaming: false,
      isError: true,
      content: expect.stringContaining(
        Locale.Chat.ImageGeneration.Display.ToolFailure,
      ),
    });
    expect(message.content).not.toContain("private-upstream-token");
    expect(message.content).not.toContain("Preparing to run the tool");
    expect(showToast).toHaveBeenCalledWith(
      Locale.Chat.ImageGeneration.Display.ToolFailure,
    );
  });
});
