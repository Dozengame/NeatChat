jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("../app/mcp/actions", () => ({
  executeMcpAction: jest.fn(),
  getAllTools: jest.fn(() => Promise.resolve([])),
  getClientsStatus: jest.fn(() => Promise.resolve({})),
  isMcpEnabled: jest.fn(() => Promise.resolve(false)),
}));
jest.mock("../app/client/api", () => ({
  getHeaders: () => ({}),
  getClientApi: jest.fn(),
  ClientApi: jest.fn(),
}));

import { getClientApi } from "../app/client/api";
import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";
import { useChatStore } from "../app/store/chat";

describe("custom instructions", () => {
  const chatMock = jest.fn(() => Promise.resolve());

  function getSentMessages() {
    expect(chatMock).toHaveBeenCalled();
    return (chatMock.mock.calls[0] as any[])[0].messages as any[];
  }

  beforeEach(() => {
    jest.clearAllMocks();
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
