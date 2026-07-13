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
import {
  JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT,
  JIMENG_MCP_SERVER_ID,
} from "../app/mcp/jimeng";

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

  test("injects the canonical Jimeng tool schema for an explicitly scoped image request", async () => {
    getAllTools.mockResolvedValue([
      {
        clientId: JIMENG_MCP_SERVER_ID,
        tools: {
          tools: [
            {
              name: "dreamina_text2image",
              description: "Generate an image from a text prompt",
              inputSchema: {
                type: "object",
                properties: { prompt: { type: "string" } },
              },
            },
          ],
        },
      },
    ]);
    getMcpChatServerStates.mockResolvedValue({
      [JIMENG_MCP_SERVER_ID]: {
        status: "active",
        chatDefaultEnabled: false,
      },
    });
    await useChatStore.getState().resetMcpCache();

    const messages = await useChatStore.getState().getMessagesWithMemory({
      mcpClientIds: [JIMENG_MCP_SERVER_ID],
      systemPrompt: JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT,
    });
    const promptMessages = messages
      .map((message) =>
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content),
      )
      .join("\n");

    expect(promptMessages).toContain(`json:mcp:${JIMENG_MCP_SERVER_ID}`);
    expect(promptMessages).toContain('method: "tools/call"');
    expect(promptMessages).toContain("dreamina_text2image");
    expect(promptMessages).toContain(JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT);
  });

  test("fails a Jimeng image request locally when its scoped schema is missing", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getAllTools.mockResolvedValue([
      {
        clientId: "demo",
        tools: {
          tools: [{ name: "unrelated_tool", inputSchema: { type: "object" } }],
        },
      },
    ]);
    getMcpChatServerStates.mockResolvedValue({
      demo: { status: "active", chatDefaultEnabled: true },
      [JIMENG_MCP_SERVER_ID]: {
        status: "active",
        chatDefaultEnabled: false,
      },
    });
    await useChatStore.getState().resetMcpCache();

    try {
      await useChatStore
        .getState()
        .onUserInput("Draw a world map", undefined, false, {
          mcpClientIds: ["demo", JIMENG_MCP_SERVER_ID],
          systemPrompt: JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT,
        });

      const messages = useChatStore.getState().currentSession().messages;
      const assistantMessage = messages.at(-1);
      expect(chat).not.toHaveBeenCalled();
      expect(assistantMessage).toMatchObject({
        role: "assistant",
        streaming: false,
        isError: true,
        content: expect.stringContaining(
          Locale.Chat.ImageGeneration.EnableFailed,
        ),
      });
    } finally {
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

  test("executes a Jimeng call whose final JSON omitted only an outer closing brace", async () => {
    executeMcpAction.mockResolvedValueOnce(
      "gen_status: failed\nerror_message: fixture stopped before provider",
    );
    await useChatStore.getState().resetMcpCache();
    const session = useChatStore.getState().currentSession();
    const message = createMessage({
      id: "truncated-jimeng-message",
      role: "assistant",
      streaming: false,
      content: [
        "```json:mcp:jimeng-mcp",
        '{"method":"tools/call","params":{"name":"dreamina_text2image","arguments":{"prompt":"sunrise","ratio":"16:9","poll":0}}',
        "```",
      ].join("\n"),
    });
    session.messages = [message];

    useChatStore.getState().checkMcpJson(message, session);
    await Promise.resolve();
    await Promise.resolve();

    expect(executeMcpAction).toHaveBeenCalledWith(JIMENG_MCP_SERVER_ID, {
      method: "tools/call",
      params: {
        name: "dreamina_text2image",
        arguments: { prompt: "sunrise", ratio: "16:9", poll: 0 },
      },
    });
    expect(executeMcpAction).toHaveBeenCalledTimes(1);
    expect(message.content).toContain("fixture stopped before provider");
    expect(message.content).not.toContain("```json:mcp");
  });

  test("settles malformed Jimeng JSON visibly without executing the tool", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await useChatStore.getState().resetMcpCache();
    const session = useChatStore.getState().currentSession();
    const message = createMessage({
      id: "invalid-jimeng-message",
      role: "assistant",
      streaming: false,
      content: [
        "```json:mcp:jimeng-mcp",
        '{"method":"tools/call" "params":{}}',
        "```",
      ].join("\n"),
    });
    session.messages = [message];

    try {
      useChatStore.getState().checkMcpJson(message, session);

      expect(executeMcpAction).not.toHaveBeenCalled();
      expect(message).toMatchObject({
        streaming: false,
        isError: true,
        content: expect.stringContaining(
          Locale.Chat.ImageGeneration.Display.ToolFailure,
        ),
      });
      expect(message.content).not.toContain("```json:mcp");
      expect(showToast).toHaveBeenCalledWith(
        Locale.Chat.ImageGeneration.Display.ToolFailure,
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  test("settles a final incomplete Jimeng fence without exposing or executing it", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await useChatStore.getState().resetMcpCache();
    const session = useChatStore.getState().currentSession();
    const message = createMessage({
      id: "incomplete-jimeng-message",
      role: "assistant",
      streaming: false,
      content: '```json:mcp:jimeng-mcp\n{"method":"tools/call"',
    });
    session.messages = [message];

    try {
      useChatStore.getState().checkMcpJson(message, session);

      expect(executeMcpAction).not.toHaveBeenCalled();
      expect(message).toMatchObject({
        streaming: false,
        isError: true,
        content: expect.stringContaining(
          Locale.Chat.ImageGeneration.Display.ToolFailure,
        ),
      });
      expect(message.content).not.toContain("json:mcp");
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
