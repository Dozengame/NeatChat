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
      modelConfig: { ...DEFAULT_CONFIG.modelConfig, sendMemory: false },
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
      now = 30_999;
      await useChatStore.getState().onUserInput("second");
      now = 31_000;
      await useChatStore.getState().onUserInput("third");
      expect(chat).toHaveBeenCalledTimes(3);
      expect(initializeMcpSystem).toHaveBeenCalledTimes(2);
    } finally {
      nowSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }
  });

  test("keeps healthy servers available when another server fails", async () => {
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
              description: "Search",
              inputSchema: { type: "object", properties: {} },
            },
          ],
        },
      },
    ]);
    getMcpChatServerStates.mockResolvedValue({
      healthy: { status: "active", chatDefaultEnabled: true },
      broken: { status: "error", chatDefaultEnabled: true },
    });
    await useChatStore.getState().resetMcpCache();
    try {
      await useChatStore.getState().onUserInput("first");
      expect(JSON.stringify(chat.mock.calls[0][0].messages)).toContain(
        "healthy_search",
      );
      expect(JSON.stringify(chat.mock.calls[0][0].messages)).not.toContain(
        "broken unavailable",
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  test("captures plugin and Responses recovery state before asynchronous preparation", async () => {
    const sourceSession = useChatStore.getState().currentSession();
    sourceSession.mask.plugin = ["source-plugin"];
    const recoveryMessage = createMessage({
      role: "assistant",
      content: "pending recovery",
    });
    recoveryMessage.openaiResponsesRecoveryPending = true;
    sourceSession.messages = [recoveryMessage];

    let resolveMessages!: (messages: any[]) => void;
    const preparedMessages = new Promise<any[]>((resolve) => {
      resolveMessages = resolve;
    });
    const originalGetMessagesWithMemory =
      useChatStore.getState().getMessagesWithMemory;
    useChatStore.setState({
      getMessagesWithMemory: jest.fn(() => preparedMessages),
    } as any);

    try {
      const request = useChatStore.getState().onUserInput("snapshot");
      await Promise.resolve();
      sourceSession.mask.plugin = ["changed-plugin"];
      recoveryMessage.openaiResponsesRecoveryPending = false;
      resolveMessages([]);
      await request;

      expect(chat).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginIds: ["source-plugin"],
          openaiResponsesRecoveryPending: true,
        }),
      );
    } finally {
      useChatStore.setState({
        getMessagesWithMemory: originalGetMessagesWithMemory,
      } as any);
    }
  });

  test("settles a failed generic tool call in its original session", async () => {
    executeMcpAction.mockRejectedValueOnce(
      new Error("private upstream detail"),
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
      content: expect.stringContaining(Locale.Mcp.Chat.ToolFailure),
    });
    expect(message.content).not.toContain("private upstream detail");
    expect(showToast).toHaveBeenCalledWith(Locale.Mcp.Chat.ToolFailure);
  });

  test("continues a successful generic tool result in its original session", async () => {
    let resolveTool!: (result: unknown) => void;
    executeMcpAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveTool = resolve;
        }),
    );
    await useChatStore.getState().resetMcpCache();

    const originalSession = useChatStore.getState().ensureCurrentSessionSaved();
    originalSession.id = "original-mcp-session";
    const toolMessage = createMessage({
      id: "successful-generic-tool-message",
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
    originalSession.messages = [toolMessage];

    useChatStore.getState().checkMcpJson(toolMessage, originalSession);
    useChatStore.getState().newSession();
    const unrelatedSession = useChatStore.getState().currentSession();

    resolveTool({ content: [{ type: "text", text: "tool result" }] });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const resultMessage = originalSession.messages.find(
      (message) => message.isMcpResponse,
    );
    expect(resultMessage?.content).toContain("```json:mcp-response:demo");
    expect(resultMessage?.content).toContain("tool result");
    expect(unrelatedSession.messages).toHaveLength(0);
  });
});
