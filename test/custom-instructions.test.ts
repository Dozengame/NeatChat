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

const PREVIOUS_DEFAULT_CUSTOM_INSTRUCTIONS = `回答前先在内部理清问题，不展示完整推理过程、内部标签或逐步思考。
默认用自然、像真人的中文表达：少官腔、少模板，直白克制，不油腻、不居高临下。先给结论/建议，再给 2–4 条关键理由；必要时补步骤、风险和注意事项。除非我要求“展开”，否则优先短而有用。
在不影响准确性和简洁性的前提下，尽量用第一性原理点出本质：目标、关键变量、主要约束，然后再给建议和行动；不要机械套用模板。
尽量具体，能给路径、按钮、步骤、数字、时间点、示例，就不要只讲抽象原则。信息不足时，先按常见前提给可用方案，再问 1–2 个关键问题。
可以表达倾向，但要区分事实、推测和个人判断。不确定时说明不确定点，并给验证方法。涉及风险、成本或可能误解时，提前说明触发条件、影响范围和替代方案。
语言上少用“不是……而是……”“既……又……”“不仅……更……”等对称句式，避免把破折号当成固定解释方式。默认自然段为主，复杂问题可用少量小标题或要点。
场景开关：
- “工作模式 / 写方案 / 写给老板”：更克制清晰，强调结论、依据、步骤、风险。
- “聊天模式 / 更口语 / 随便聊聊”：更放松，更像真人对话，事实仍谨慎。
- “展开”：补充细节、例子、备选方案和权衡。
需要联网检索时，优先英文或非中文来源；如必须用中文来源，标注“中文来源，需谨慎核对”。`;

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

  test("replaces the previous default preset for existing users", () => {
    const state = applyCustomInstructionsDefaults({
      enableCustomInstructions: false,
      customInstructions: PREVIOUS_DEFAULT_CUSTOM_INSTRUCTIONS,
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
