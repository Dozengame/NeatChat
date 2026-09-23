jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("../app/mcp/actions", () => ({
  executeMcpAction: jest.fn(),
  getAllTools: jest.fn(() => Promise.resolve([])),
  getClientsStatus: jest.fn(() => Promise.resolve({})),
  getMcpChatServerStates: jest.fn(() => Promise.resolve({})),
  initializeMcpSystem: jest.fn(() => Promise.resolve()),
  isMcpEnabled: jest.fn(() => Promise.resolve(false)),
}));
jest.mock("../app/client/api", () => ({
  getHeaders: () => ({}),
  getClientApi: jest.fn(),
  ClientApi: jest.fn(),
}));

import { buildOpenAIResponsesPayload } from "../app/client/platforms/openai-responses-builder";
import { getClientApi } from "../app/client/api";
import { ServiceProvider } from "../app/constant";
import { useChatStore } from "../app/store/chat";
import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";
import {
  executeMcpAction,
  getAllTools,
  getMcpChatServerStates,
  isMcpEnabled,
} from "../app/mcp/actions";

const message = (index: number, role: "user" | "assistant") => ({
  id: `m_${index}`,
  date: "",
  role,
  content: `${role}-${index}`,
  ...(role === "assistant"
    ? {
        openaiResponseId: `resp_${index}`,
        openaiResponseStored: true,
        openaiResponsesOutput: [
          {
            id: `rs_${index}`,
            type: "reasoning",
            encrypted_content: `encrypted_${index}`,
            summary: [],
          },
          {
            id: `out_${index}`,
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: `${role}-${index}` }],
          },
        ],
      }
    : {}),
});

const recoveryTrace = (suffix: string) => [
  {
    id: `fc_${suffix}`,
    type: "function_call",
    call_id: `call_${suffix}`,
    name: "side_effect",
    arguments: "{}",
  },
  {
    type: "function_call_output",
    call_id: `call_${suffix}`,
    output: `completed_${suffix}`,
  },
];

const GPT_56_CONTEXT_WINDOW_TOKENS = 1_050_000;
const GPT_56_MAX_OUTPUT_TOKENS = 128_000;
const GPT_56_INPUT_SAFETY_MARGIN_TOKENS = 64_000;
const GPT_56_MAX_HISTORY_TOKENS =
  GPT_56_CONTEXT_WINDOW_TOKENS -
  GPT_56_MAX_OUTPUT_TOKENS -
  GPT_56_INPUT_SAFETY_MARGIN_TOKENS;

function asciiTextWithEstimatedTokens(tokenCount: number, character = "x") {
  return character.repeat(Math.ceil(tokenCount * 4));
}

const TOOL_MODELS = ["gpt-5.6-terra", "gpt-6-astra", "gpt-6-sol", "gpt-6-luna"];

describe.each(TOOL_MODELS)("%s all_turns history", (model) => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (isMcpEnabled as jest.Mock).mockResolvedValue(false);
    (getAllTools as jest.Mock).mockResolvedValue([]);
    (getMcpChatServerStates as jest.Mock).mockResolvedValue({});
    await useChatStore.getState().resetMcpCache();
    useAppConfig.setState({
      ...DEFAULT_CONFIG,
      enableCustomInstructions: false,
      enableAutoGenerateTitle: false,
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model: model as any,
        providerName: ServiceProvider.OpenAI,
        reasoningContext: "all_turns",
        historyMessageCount: 1,
        max_output_tokens: 1,
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

  test("includes scoped MCP capabilities and continues the mocked result once", async () => {
    (isMcpEnabled as jest.Mock).mockResolvedValue(true);
    (getAllTools as jest.Mock).mockResolvedValue([
      {
        clientId: "notes",
        tools: {
          tools: [
            {
              name: "save_note",
              description: "Save a note",
              inputSchema: {
                type: "object",
                properties: { text: { type: "string" } },
              },
            },
          ],
        },
      },
    ]);
    (getMcpChatServerStates as jest.Mock).mockResolvedValue({
      notes: { status: "active", chatDefaultEnabled: true },
    });
    (executeMcpAction as jest.Mock).mockResolvedValue({
      content: [{ type: "text", text: "saved-once" }],
    });
    await useChatStore.getState().resetMcpCache();
    const request = {
      method: "tools/call",
      params: { name: "save_note", arguments: { text: "hello" } },
    };
    const chat = jest
      .fn()
      .mockImplementationOnce(async (options) => {
        options.onFinish(
          ["```json:mcp:notes", JSON.stringify(request), "```"].join("\n"),
        );
      })
      .mockImplementationOnce(async (options) => options.onFinish("Saved"));
    (getClientApi as jest.Mock).mockReturnValue({ llm: { chat } });
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});
    try {
      await useChatStore.getState().onUserInput("Save hello", [], false, {
        mcpClientIds: ["notes"],
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(chat).toHaveBeenCalledTimes(2);
      const firstRequest = chat.mock.calls[0][0];
      expect(firstRequest.config.model).toBe(model);
      expect(firstRequest.allowTools).toBe(true);
      expect(firstRequest.messages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining('"name": "save_note"'),
          }),
        ]),
      );
      expect(executeMcpAction).toHaveBeenCalledTimes(1);
      expect(executeMcpAction).toHaveBeenCalledWith("notes", request);
      expect(chat.mock.calls[1][0].messages.at(-1)).toMatchObject({
        role: "user",
        isMcpResponse: true,
        content: expect.stringContaining("saved-once"),
      });
    } finally {
      consoleLogSpy.mockRestore();
    }
  });

  test("keeps every raw turn after clear-context when it fits the input budget", async () => {
    const session = useChatStore.getState().currentSession();
    session.mask.modelConfig = {
      ...useAppConfig.getState().modelConfig,
    };
    session.clearContextIndex = 1;
    session.messages = Array.from({ length: 6 }, (_, index) =>
      message(index, index % 2 === 0 ? "user" : "assistant"),
    ) as any;

    const recent = await useChatStore
      .getState()
      .getMessagesWithMemory({ session });

    expect(recent.map((item) => item.content)).toEqual([
      "assistant-1",
      "user-2",
      "assistant-3",
      "user-4",
      "assistant-5",
    ]);
    expect(recent.at(-1)).toMatchObject({
      openaiResponseId: "resp_5",
      openaiResponsesOutput: expect.any(Array),
    });
  });

  test("counts encrypted reasoning and drops the complete oldest turn at the hard budget", async () => {
    const session = useChatStore.getState().currentSession();
    session.mask.modelConfig = {
      ...useAppConfig.getState().modelConfig,
      max_output_tokens: GPT_56_MAX_OUTPUT_TOKENS,
    };
    session.messages = [
      {
        ...message(0, "user"),
        content: "old-user",
      },
      {
        ...message(1, "assistant"),
        content: "old-assistant",
        openaiResponsesOutput: [
          {
            id: "old-reasoning",
            type: "reasoning",
            encrypted_content: "A".repeat(GPT_56_MAX_HISTORY_TOKENS + 10_000),
            summary: [],
          },
        ],
      },
      {
        ...message(2, "user"),
        content: "recent-user",
      },
      {
        ...message(3, "assistant"),
        content: "recent-assistant",
      },
    ] as any;

    const recent = await useChatStore
      .getState()
      .getMessagesWithMemory({ session });

    expect(recent.map((item) => item.content)).toEqual([
      "recent-user",
      "recent-assistant",
    ]);
  });

  test("subtracts the pending user input from the all-turns history budget", async () => {
    const session = useChatStore.getState().currentSession();
    session.mask.modelConfig = {
      ...useAppConfig.getState().modelConfig,
      max_output_tokens: GPT_56_MAX_OUTPUT_TOKENS,
    };
    session.messages = [
      {
        ...message(0, "user"),
        content: asciiTextWithEstimatedTokens(100_000, "h"),
      },
      {
        ...message(1, "assistant"),
        content: "history-answer",
        openaiResponsesOutput: undefined,
      },
    ] as any;
    const pendingUserMessage = {
      id: "pending-user",
      date: "",
      role: "user" as const,
      content: asciiTextWithEstimatedTokens(800_000, "p"),
    };

    const recent = await useChatStore.getState().getMessagesWithMemory({
      session,
      pendingUserMessage,
    });

    expect(recent).toEqual([]);
  });

  test("fails locally when fixed input alone exceeds the hard budget", async () => {
    const session = useChatStore.getState().currentSession();
    session.mask.modelConfig = {
      ...useAppConfig.getState().modelConfig,
      max_output_tokens: GPT_56_MAX_OUTPUT_TOKENS,
    };
    const pendingUserMessage = {
      id: "oversized-pending-user",
      date: "",
      role: "user" as const,
      content: asciiTextWithEstimatedTokens(
        GPT_56_MAX_HISTORY_TOKENS + 10_000,
        "p",
      ),
    };

    await expect(
      useChatStore.getState().getMessagesWithMemory({
        session,
        pendingUserMessage,
      }),
    ).rejects.toThrow(
      "OpenAI Responses fixed input exceeds the input context budget",
    );
  });

  test("fails safely when pinned recovery traces exceed the hard budget", async () => {
    const session = useChatStore.getState().currentSession();
    session.mask.modelConfig = {
      ...useAppConfig.getState().modelConfig,
      max_output_tokens: GPT_56_MAX_OUTPUT_TOKENS,
    };
    session.messages = [
      {
        ...message(0, "user"),
        content: "run side effect",
        isError: true,
      },
      {
        ...message(1, "assistant"),
        content: "continuation failed",
        isError: true,
        openaiResponsesRecoveryPending: true,
        openaiResponsesOutput: [
          {
            id: "fc_oversized",
            type: "function_call",
            call_id: "call_oversized",
            name: "side_effect",
            arguments: "{}",
          },
          {
            type: "function_call_output",
            call_id: "call_oversized",
            output: asciiTextWithEstimatedTokens(
              GPT_56_MAX_HISTORY_TOKENS + 10_000,
            ),
          },
        ],
      },
    ] as any;

    await expect(
      useChatStore.getState().getMessagesWithMemory({ session }),
    ).rejects.toThrow(
      "OpenAI Responses recovery trace exceeds the input context budget",
    );
  });

  test("builds stateful and stateless continuations from the complete retained trace", async () => {
    const session = useChatStore.getState().currentSession();
    session.mask.modelConfig = {
      ...useAppConfig.getState().modelConfig,
    };
    session.messages = Array.from({ length: 6 }, (_, index) =>
      message(index, index % 2 === 0 ? "user" : "assistant"),
    ) as any;

    const recent = await useChatStore
      .getState()
      .getMessagesWithMemory({ session });
    const messages = [
      ...recent,
      { role: "user" as const, content: "latest-user" },
    ];
    const stateful = buildOpenAIResponsesPayload({
      messages,
      modelConfig: session.mask.modelConfig,
      store: true,
    }) as any;
    const stateless = buildOpenAIResponsesPayload({
      messages,
      modelConfig: session.mask.modelConfig,
      store: false,
    }) as any;

    expect(stateful.previous_response_id).toBe("resp_5");
    expect(stateful.input).toEqual([
      {
        role: "user",
        content: [{ type: "input_text", text: "latest-user" }],
      },
    ]);
    expect(stateless.previous_response_id).toBeUndefined();
    expect(
      stateless.input.filter((item: any) => item.type === "reasoning"),
    ).toHaveLength(3);
    expect(stateless.include).toEqual(["reasoning.encrypted_content"]);
  });

  test.each(["auto", "current_turn", "all_turns"] as const)(
    "retains the error user turn paired with a replayable tool trace in %s context",
    async (reasoningContext) => {
      useAppConfig.setState({
        modelConfig: {
          ...useAppConfig.getState().modelConfig,
          reasoningContext,
          historyMessageCount: 0,
        },
      });
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const trace = [
        {
          id: "fc_error",
          type: "function_call",
          call_id: "call_error",
          name: "side_effect",
          arguments: "{}",
        },
        {
          type: "function_call_output",
          call_id: "call_error",
          output: "completed",
        },
      ];
      (getClientApi as jest.Mock).mockReturnValue({
        llm: {
          chat: jest.fn(async (options) => {
            options.onError(new Error("continuation failed"), {
              openaiResponseStored: false,
              openaiResponsesOutput: trace,
              openaiResponsesRecoveryPending: true,
            });
          }),
        },
      });

      await useChatStore.getState().onUserInput("run side effect");
      consoleErrorSpy.mockRestore();

      const session = useChatStore.getState().currentSession();
      expect(session.messages).toEqual([
        expect.objectContaining({
          role: "user",
          content: "run side effect",
          isError: true,
        }),
        expect.objectContaining({
          role: "assistant",
          isError: true,
          openaiResponseStored: false,
          openaiResponsesOutput: trace,
          openaiResponsesRecoveryPending: true,
        }),
      ]);

      const recent = await useChatStore
        .getState()
        .getMessagesWithMemory({ session });
      expect(recent.map((item) => item.role)).toEqual(["user", "assistant"]);

      for (const store of [false, true]) {
        const payload = buildOpenAIResponsesPayload({
          messages: [...recent, { role: "user", content: "continue safely" }],
          modelConfig: session.mask.modelConfig,
          store,
        }) as any;
        expect(payload.previous_response_id).toBeUndefined();
        expect(payload.input).toEqual([
          {
            role: "user",
            content: [{ type: "input_text", text: "run side effect" }],
          },
          ...trace,
          {
            role: "user",
            content: [{ type: "input_text", text: "continue safely" }],
          },
        ]);
      }

      session.mask.modelConfig = {
        ...session.mask.modelConfig,
        model: "claude-3-5-sonnet" as any,
        providerName: ServiceProvider.Anthropic,
        historyMessageCount: 0,
      };
      expect(
        await useChatStore.getState().getMessagesWithMemory({ session }),
      ).toEqual([]);
    },
  );

  test("unpins a recovery trace after a successful Responses reply", async () => {
    useAppConfig.setState({
      modelConfig: {
        ...useAppConfig.getState().modelConfig,
        reasoningContext: "auto",
        historyMessageCount: 0,
      },
    });
    const trace = [
      {
        id: "fc_error",
        type: "function_call",
        call_id: "call_error",
        name: "side_effect",
        arguments: "{}",
      },
      {
        type: "function_call_output",
        call_id: "call_error",
        output: "completed",
      },
    ];
    const chat = jest
      .fn()
      .mockImplementationOnce(async (options) => {
        options.onError(new Error("continuation failed"), {
          openaiResponseStored: false,
          openaiResponsesOutput: trace,
          openaiResponsesRecoveryPending: true,
        });
      })
      .mockImplementationOnce(async (options) => {
        options.onFinish("Recovered", undefined, {
          openaiResponseId: "resp_recovered",
          openaiResponseStored: false,
          openaiResponsesOutput: [
            {
              id: "msg_recovered",
              type: "message",
              role: "assistant",
              content: [{ type: "output_text", text: "Recovered" }],
            },
          ],
        });
      });
    (getClientApi as jest.Mock).mockReturnValue({ llm: { chat } });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    await useChatStore.getState().onUserInput("run side effect");
    await useChatStore.getState().onUserInput("continue");
    await new Promise((resolve) => setTimeout(resolve, 0));
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();

    const session = useChatStore.getState().currentSession();
    expect(session.messages[1]).toMatchObject({
      openaiResponsesRecoveryPending: false,
    });
    session.mask.modelConfig.historyMessageCount = 0;
    expect(
      await useChatStore.getState().getMessagesWithMemory({ session }),
    ).toEqual([]);
  });

  test("keeps every consecutive recovery segment until a success consumes them", async () => {
    useAppConfig.setState({
      modelConfig: {
        ...useAppConfig.getState().modelConfig,
        reasoningContext: "auto",
        historyMessageCount: 0,
      },
    });
    const firstTrace = recoveryTrace("first");
    const secondTrace = recoveryTrace("second");
    const chat = jest
      .fn()
      .mockImplementationOnce(async (options) => {
        options.onError(new Error("first continuation failed"), {
          openaiResponseStored: false,
          openaiResponsesOutput: firstTrace,
          openaiResponsesRecoveryPending: true,
        });
      })
      .mockImplementationOnce(async (options) => {
        options.onError(new Error("second continuation failed"), {
          openaiResponseStored: false,
          openaiResponsesOutput: secondTrace,
          openaiResponsesRecoveryPending: true,
        });
      })
      .mockImplementationOnce(async (options) => {
        options.onFinish("Recovered", undefined, {
          openaiResponseId: "resp_recovered",
          openaiResponseStored: false,
          openaiResponsesOutput: [
            {
              id: "msg_recovered",
              type: "message",
              role: "assistant",
              content: [{ type: "output_text", text: "Recovered" }],
            },
          ],
        });
      });
    (getClientApi as jest.Mock).mockReturnValue({ llm: { chat } });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});

    await useChatStore.getState().onUserInput("first side effect");
    await useChatStore.getState().onUserInput("second side effect");

    const session = useChatStore.getState().currentSession();
    const pendingHistory = await useChatStore
      .getState()
      .getMessagesWithMemory({ session });
    expect(pendingHistory.map((item) => item.content)).toEqual([
      "first side effect",
      expect.any(String),
      "second side effect",
      expect.any(String),
    ]);
    const recoveryPayload = buildOpenAIResponsesPayload({
      messages: [
        ...pendingHistory,
        { role: "user", content: "finish recovery" },
      ],
      modelConfig: session.mask.modelConfig,
      store: false,
    }) as any;
    expect(
      recoveryPayload.input.filter(
        (item: any) => item.type === "function_call",
      ),
    ).toEqual([firstTrace[0], secondTrace[0]]);
    expect(
      recoveryPayload.input.filter(
        (item: any) => item.type === "function_call_output",
      ),
    ).toEqual([firstTrace[1], secondTrace[1]]);

    await useChatStore.getState().onUserInput("finish recovery");

    const thirdRequestMessages = chat.mock.calls[2][0].messages;
    expect(thirdRequestMessages.map((item: any) => item.content)).toEqual([
      "first side effect",
      expect.any(String),
      "second side effect",
      expect.any(String),
      "finish recovery",
    ]);
    expect(
      session.messages
        .filter((item) => item.openaiResponsesOutput)
        .every((item) => !item.openaiResponsesRecoveryPending),
    ).toBe(true);
    expect(
      await useChatStore.getState().getMessagesWithMemory({ session }),
    ).toEqual([]);

    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});

describe("Responses family recovery and stable default instructions", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (isMcpEnabled as jest.Mock).mockResolvedValue(false);
    (getAllTools as jest.Mock).mockResolvedValue([]);
    (getMcpChatServerStates as jest.Mock).mockResolvedValue({});
    await useChatStore.getState().resetMcpCache();
    useAppConfig.setState({
      ...DEFAULT_CONFIG,
      enableCustomInstructions: false,
      enableAutoGenerateTitle: false,
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "gpt-6-luna" as any,
        providerName: ServiceProvider.OpenAI,
        reasoningContext: "auto",
        historyMessageCount: 0,
        max_output_tokens: 1000,
        enableInjectSystemPrompts: false,
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

  test.each([
    ["gpt-5.6-terra", false],
    ["gpt-6-luna", true],
    ["gpt-6-luna-2026-09-22", true],
  ] as const)(
    "isolates %s pending recovery while allowing only compatible traces to block tools",
    async (previousModel, compatible) => {
      const session = useChatStore.getState().ensureCurrentSessionSaved();
      const trace = recoveryTrace("previous_family");
      session.messages = [
        {
          ...message(0, "user"),
          content: "previous tool action",
          isError: true,
        },
        {
          ...message(1, "assistant"),
          model: previousModel,
          content: "continuation interrupted",
          isError: true,
          openaiResponseStored: false,
          openaiResponsesOutput: trace,
          openaiResponsesRecoveryPending: true,
        },
      ] as any;
      session.mask.plugin = ["notes-plugin"];
      const chat = jest.fn(async (options) => {
        options.onFinish("Done", undefined, {
          openaiResponseStored: false,
          openaiResponsesOutput: [
            {
              type: "message",
              role: "assistant",
              content: [{ type: "output_text", text: "Done" }],
            },
          ],
        });
      });
      (getClientApi as jest.Mock).mockReturnValue({ llm: { chat } });
      const consoleLogSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      try {
        await useChatStore.getState().onUserInput("continue with Luna");

        expect(chat).toHaveBeenCalledTimes(1);
        const request = chat.mock.calls[0][0];
        expect(request.allowTools).toBe(true);
        expect(request.pluginIds).toEqual(["notes-plugin"]);
        expect(request.openaiResponsesRecoveryPending).toBe(compatible);
        expect(request.messages.map((item: any) => item.content)).toEqual([
          "previous tool action",
          "continuation interrupted",
          "continue with Luna",
        ]);
        expect(session.messages[1].openaiResponsesRecoveryPending).toBe(
          !compatible,
        );

        const payload = buildOpenAIResponsesPayload({
          messages: request.messages,
          modelConfig: session.mask.modelConfig,
          store: false,
        }) as any;
        if (compatible) {
          expect(payload.input).toEqual(expect.arrayContaining(trace));
        } else {
          expect(
            payload.input.some((item: any) =>
              ["function_call", "function_call_output", "reasoning"].includes(
                item.type,
              ),
            ),
          ).toBe(false);
          expect(JSON.stringify(payload.input)).toContain(
            "completed_previous_family",
          );
        }
      } finally {
        consoleLogSpy.mockRestore();
      }
    },
  );

  test("keeps default instructions stable within a local day and changes them the next day", async () => {
    const session = useChatStore.getState().currentSession();
    session.mask.modelConfig.enableInjectSystemPrompts = true;
    const instructionsAt = async (date: Date) => {
      jest.setSystemTime(date);
      const messages = await useChatStore
        .getState()
        .getMessagesWithMemory({ session });
      return buildOpenAIResponsesPayload({
        messages,
        modelConfig: session.mask.modelConfig,
        store: false,
      }).instructions;
    };
    jest.useFakeTimers();
    try {
      const first = await instructionsAt(new Date(2026, 8, 23, 10, 0, 1));
      const later = await instructionsAt(new Date(2026, 8, 23, 10, 0, 59));
      const nextDay = await instructionsAt(new Date(2026, 8, 24, 10, 0, 1));
      expect(first).toBeTruthy();
      expect(later).toBe(first);
      expect(nextDay).not.toBe(first);
      expect(first).toContain("2026-09-23");
      expect(nextDay).toContain("2026-09-24");
      expect(first).toMatch(
        /(?:UTC|GMT)[+-]\d{2}:?\d{2}|[A-Za-z_]+\/[A-Za-z_]+|\bUTC\b/,
      );
    } finally {
      jest.useRealTimers();
    }
  });

  test("preserves the full changing time in a user-supplied input template", async () => {
    useAppConfig.setState({
      modelConfig: {
        ...useAppConfig.getState().modelConfig,
        template: "{{time}} | {{input}}",
      },
    });
    const chat = jest.fn(async (options) => options.onFinish("Done"));
    (getClientApi as jest.Mock).mockReturnValue({ llm: { chat } });
    const consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => {});
    const first = new Date(2026, 8, 23, 10, 0, 1);
    const later = new Date(2026, 8, 23, 10, 0, 59);
    jest.useFakeTimers();
    try {
      jest.setSystemTime(first);
      await useChatStore.getState().onUserInput("first");
      jest.setSystemTime(later);
      await useChatStore.getState().onUserInput("later");
      expect(chat.mock.calls[0][0].messages.at(-1).content).toBe(
        `${first.toString()} | first`,
      );
      expect(chat.mock.calls[1][0].messages.at(-1).content).toBe(
        `${later.toString()} | later`,
      );
    } finally {
      jest.useRealTimers();
      consoleLogSpy.mockRestore();
    }
  });
});
