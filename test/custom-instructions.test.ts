jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("../app/mcp/actions", () => ({
  executeMcpAction: jest.fn(),
  getAllTools: jest.fn(() => Promise.resolve([])),
  getClientsStatus: jest.fn(() => Promise.resolve({})),
  initializeMcpSystem: jest.fn(() => Promise.resolve()),
  isMcpEnabled: jest.fn(() => Promise.resolve(false)),
}));
jest.mock("../app/client/api", () => ({
  getHeaders: () => ({}),
  getClientApi: jest.fn(),
  ClientApi: jest.fn(),
}));

import { getClientApi } from "../app/client/api";
import { isMcpEnabled } from "../app/mcp/actions";
import {
  applyCustomInstructionsDefaults,
  DEFAULT_CONFIG,
  DEFAULT_CUSTOM_INSTRUCTIONS,
  useAppConfig,
} from "../app/store/config";
import { useChatStore } from "../app/store/chat";

describe("custom instructions", () => {
  const chatMock = jest.fn(() => Promise.resolve());

  function getSentMessages() {
    expect(chatMock).toHaveBeenCalled();
    return (chatMock.mock.calls[0] as any[])[0].messages as any[];
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (isMcpEnabled as jest.Mock).mockResolvedValue(false);
    (getClientApi as jest.Mock).mockReturnValue({
      llm: {
        chat: chatMock,
      },
    });

    useAppConfig.setState({
      ...DEFAULT_CONFIG,
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        enableInjectSystemPrompts: false,
      },
    });
    useChatStore.setState({
      sessions: [],
      temporarySession: undefined,
      currentSessionIndex: -1,
      lastInput: "",
    } as any);
  });

  test("does not send saved instructions when disabled", async () => {
    useAppConfig.setState({
      enableCustomInstructions: false,
      customInstructions: "Do not include this.",
    });

    await useChatStore.getState().onUserInput("Hello");

    const messages = getSentMessages();
    expect(messages.some((m: any) => m.content === "Do not include this.")).toBe(
      false,
    );
  });

  test("queues visible messages before async prompt preparation finishes", async () => {
    const pendingInput = useChatStore.getState().onUserInput("Hello");

    const session = useChatStore.getState().currentSession();
    expect(session.messages).toEqual([
      expect.objectContaining({
        role: "user",
        content: "Hello",
      }),
      expect.objectContaining({
        role: "assistant",
        streaming: true,
      }),
    ]);

    await pendingInput;
  });

  test("stops queued assistant message when prompt preparation fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      await useChatStore.getState().onUserInput("Hello", undefined, false, {
        systemPrompt: {
          trim() {
            throw new Error("MCP config unavailable");
          },
        } as any,
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }

    const session = useChatStore.getState().currentSession();
    expect(chatMock).not.toHaveBeenCalled();
    expect(session.messages).toEqual([
      expect.objectContaining({
        role: "user",
        content: "Hello",
        isError: true,
      }),
      expect.objectContaining({
        role: "assistant",
        streaming: false,
        isError: true,
      }),
    ]);
    expect(session.messages[1].content).toContain("MCP config unavailable");
  });

  test("sends the default preset with a new chat", async () => {
    await useChatStore.getState().onUserInput("Hello");

    const messages = getSentMessages();
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "system",
          content: DEFAULT_CUSTOM_INSTRUCTIONS,
        }),
      ]),
    );
  });

  test("sends enabled instructions with a new chat", async () => {
    useAppConfig.setState({
      enableCustomInstructions: true,
      customInstructions: "Always answer with concise bullet points.",
    });

    await useChatStore.getState().onUserInput("Hello");

    const messages = getSentMessages();
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "system",
          content: "Always answer with concise bullet points.",
        }),
      ]),
    );
  });
});

describe("custom instructions defaults", () => {
  test("upgrades the old blank default to the enabled preset", () => {
    const state = applyCustomInstructionsDefaults({
      enableCustomInstructions: false,
      customInstructions: "",
    });

    expect(state).toMatchObject({
      enableCustomInstructions: true,
      customInstructions: DEFAULT_CUSTOM_INSTRUCTIONS,
    });
  });

  test("keeps user-provided instructions and their disabled state", () => {
    const state = applyCustomInstructionsDefaults({
      enableCustomInstructions: false,
      customInstructions: "Use a terse tone.",
    });

    expect(state).toMatchObject({
      enableCustomInstructions: false,
      customInstructions: "Use a terse tone.",
    });
  });
});
