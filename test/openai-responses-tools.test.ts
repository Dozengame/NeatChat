import {
  adaptPluginToolsForResponses,
  createResponsesRoundCollector,
  executeResponsesFunctionCalls,
  extractOpenAIResponsesText,
  getOpenAIResponsesStreamError,
  hasPendingResponsesToolRecovery,
  runOpenAIResponsesToolLoop,
  type ResponsesRoundResult,
} from "../app/client/platforms/openai-responses-tools";
import fs from "fs";
import path from "path";
import Locale from "../app/locales";

const pluginTool = (name: string) => ({
  type: "function",
  function: {
    name,
    description: `${name} description`,
    parameters: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
    },
  },
});

const functionCall = (
  callId: string,
  name: string,
  args = '{"city":"Singapore"}',
) => ({
  id: `fc_${callId}`,
  type: "function_call" as const,
  call_id: callId,
  name,
  arguments: args,
});

describe("OpenAI Responses function tools", () => {
  test("blocks direct function tools during a pending recovery turn", () => {
    expect(
      hasPendingResponsesToolRecovery([
        { openaiResponsesRecoveryPending: true },
      ]),
    ).toBe(true);
    expect(
      hasPendingResponsesToolRecovery([
        { openaiResponsesRecoveryPending: false },
        {},
      ]),
    ).toBe(false);
  });
  test("localizes access-restricted Responses stream errors", async () => {
    const response = {
      status: 429,
      clone: () => ({
        json: async () => ({
          code: "access_restricted",
          msg: "access_restricted",
        }),
      }),
    } as unknown as Response;

    await expect(
      getOpenAIResponsesStreamError(response),
    ).resolves.toMatchObject({ message: Locale.Error.AccessRestricted });
  });

  test("routes Responses streaming through the terminal-aware runner", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/client/platforms/openai.ts"),
      "utf8",
    );
    const chatSource = fs.readFileSync(
      path.join(process.cwd(), "app/store/chat.ts"),
      "utf8",
    );
    const chatComponentSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat.tsx"),
      "utf8",
    );

    expect(source).toContain("isOpenAIGpt56ModelConfig");
    expect(source).toContain("adaptPluginToolsForResponses");
    expect(source).toContain("functionTools: responsesFunctionTools");
    expect(source).toContain("runOpenAIResponsesToolLoop");
    expect(source).toContain("sendOpenAIResponsesSseRound");
    expect(source).toContain("if (useResponses)");
    expect(source).toContain("hasPendingResponsesToolRecovery");
    expect(source).toContain("options.allowTools === true");
    expect(source).toContain("openaiResponseId: v.openaiResponseId");
    expect(source).toContain("openaiResponsesOutput: v.openaiResponsesOutput");
    expect(chatSource.match(/allowTools:\s*true/g)).toHaveLength(1);
    expect(chatComponentSource).toContain(
      "hasClosedResponsesFunctionTrace(botMessage)",
    );
    expect(chatComponentSource).toContain("RetryToolTraceBlocked");
  });

  test("extracts final refusal content for persistence", () => {
    expect(
      extractOpenAIResponsesText({
        output: [
          {
            type: "message",
            content: [{ type: "refusal", refusal: "I cannot help with that." }],
          },
        ],
      }),
    ).toBe("I cannot help with that.");
  });

  test("adapts nested Plugin definitions without mutating their schemas", () => {
    const source = pluginTool("get_weather");
    const snapshot = JSON.stringify(source);
    const executor = jest.fn();

    expect(
      adaptPluginToolsForResponses([source], { get_weather: executor }),
    ).toEqual({
      tools: [
        {
          type: "function",
          name: "get_weather",
          description: "get_weather description",
          parameters: source.function.parameters,
        },
      ],
      executors: { get_weather: executor },
    });
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  test("rejects duplicate, invalid, and unimplemented function names", () => {
    expect(() =>
      adaptPluginToolsForResponses([pluginTool("same"), pluginTool("same")], {
        same: jest.fn(),
      }),
    ).toThrow(/duplicate/i);
    expect(() =>
      adaptPluginToolsForResponses([pluginTool("bad name")], {
        "bad name": jest.fn(),
      }),
    ).toThrow(/invalid/i);
    expect(() =>
      adaptPluginToolsForResponses([pluginTool("missing")], {}),
    ).toThrow(/executor/i);
  });

  test("collects parallel function calls from interleaved SSE events once", () => {
    const collector = createResponsesRoundCollector();
    collector.consume({
      type: "response.output_item.added",
      output_index: 1,
      item: functionCall("call_b", "second", ""),
    });
    collector.consume({
      type: "response.output_item.added",
      output_index: 0,
      item: functionCall("call_a", "first", ""),
    });
    collector.consume({
      type: "response.function_call_arguments.delta",
      output_index: 1,
      delta: '{"city":',
    });
    collector.consume({
      type: "response.function_call_arguments.delta",
      output_index: 0,
      delta: '{"city":"Tokyo"}',
    });
    collector.consume({
      type: "response.function_call_arguments.done",
      output_index: 1,
      arguments: '{"city":"Singapore"}',
    });
    collector.consume({
      type: "response.completed",
      response: {
        id: "resp_1",
        output: [
          functionCall("call_a", "first", '{"city":"Tokyo"}'),
          functionCall("call_b", "second"),
        ],
      },
    });

    expect(collector.complete()).toMatchObject({
      id: "resp_1",
      calls: [
        functionCall("call_a", "first", '{"city":"Tokyo"}'),
        functionCall("call_b", "second"),
      ],
    });
  });

  test("rejects incomplete responses before any function can execute", () => {
    const collector = createResponsesRoundCollector();
    collector.consume({
      type: "response.incomplete",
      response: {
        id: "resp_incomplete",
        output: [functionCall("call_partial", "tool")],
      },
    });

    expect(() => collector.complete()).toThrow(/incomplete/i);
  });

  test("uses the official top-level error event message", () => {
    const collector = createResponsesRoundCollector();
    expect(() =>
      collector.consume({ type: "error", message: "rate limited" }),
    ).toThrow("rate limited");
  });

  test.each([
    {
      label: "error",
      event: { type: "response.error", error: { message: "bad request" } },
    },
    {
      label: "failed",
      event: {
        type: "response.failed",
        response: { id: "resp_failed", error: { message: "failed" } },
      },
    },
    {
      label: "incomplete",
      event: {
        type: "response.incomplete",
        response: { id: "resp_incomplete", output: [] },
      },
    },
  ])("settles a no-tool $label terminal as an error", async ({ event }) => {
    const onFinish = jest.fn();
    const onError = jest.fn();

    await runOpenAIResponsesToolLoop({
      initialPayload: { model: "gpt-5.6-terra", input: "Hi" } as any,
      executors: {},
      controller: new AbortController(),
      sendRound: async () => {
        const collector = createResponsesRoundCollector();
        collector.consume(event);
        return collector.complete();
      },
      callbacks: { onFinish, onError },
    });

    expect(onFinish).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][1]).toBeUndefined();
  });

  test("rejects conflicting call IDs in one completed response", () => {
    const collector = createResponsesRoundCollector();
    collector.consume({
      type: "response.completed",
      response: {
        id: "resp_conflict",
        output: [
          functionCall("call_same", "first"),
          functionCall("call_same", "second"),
        ],
      },
    });

    expect(() => collector.complete()).toThrow(/call_id/i);
  });

  test("executes parallel calls in response order and deduplicates call IDs", async () => {
    const starts: string[] = [];
    const executors = {
      first: jest.fn(async () => {
        starts.push("first");
        await Promise.resolve();
        return { status: 200, data: "one" };
      }),
      second: jest.fn(async () => {
        starts.push("second");
        return { status: 200, data: { value: 2 } };
      }),
    };
    const executedCalls = new Map();
    const calls = [
      functionCall("call_a", "first"),
      functionCall("call_b", "second"),
    ];

    const firstRun = await executeResponsesFunctionCalls({
      calls,
      executors,
      signal: new AbortController().signal,
      executedCalls,
    });
    const secondRun = await executeResponsesFunctionCalls({
      calls,
      executors,
      signal: new AbortController().signal,
      executedCalls,
    });

    expect(starts).toEqual(["first", "second"]);
    expect(firstRun).toEqual([
      { type: "function_call_output", call_id: "call_a", output: "one" },
      {
        type: "function_call_output",
        call_id: "call_b",
        output: '{"value":2}',
      },
    ]);
    expect(secondRun).toEqual(firstRun);
    expect(executors.first).toHaveBeenCalledTimes(1);
    expect(executors.second).toHaveBeenCalledTimes(1);
  });

  test("turns malformed arguments and known tool failures into safe outputs", async () => {
    const onAfterTool = jest.fn();
    const outputs = await executeResponsesFunctionCalls({
      calls: [
        functionCall("call_bad", "tool", "{"),
        functionCall("call_missing", "unknown"),
      ],
      executors: { tool: jest.fn() },
      signal: new AbortController().signal,
      executedCalls: new Map(),
      onAfterTool,
    });

    expect(outputs).toHaveLength(2);
    expect(outputs[0].output).toContain("invalid_arguments");
    expect(outputs[1].output).toContain("unknown_function");
    expect(onAfterTool).toHaveBeenCalledTimes(2);
  });

  test("treats a rejected executor as an unknown outcome without leaking details", async () => {
    const onAfterTool = jest.fn();
    const executedCalls = new Map();
    const secretError = Object.assign(new Error("Bearer secret-from-message"), {
      config: { headers: { Authorization: "secret-token" } },
    });

    await expect(
      executeResponsesFunctionCalls({
        calls: [functionCall("call_unknown", "tool")],
        executors: { tool: jest.fn().mockRejectedValue(secretError) },
        signal: new AbortController().signal,
        executedCalls,
        onAfterTool,
      }),
    ).rejects.toThrow(/outcome is unknown/i);

    expect(onAfterTool).toHaveBeenCalledTimes(1);
    expect(onAfterTool).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "call_unknown",
        isError: true,
        errorMsg: expect.stringMatching(/outcome is unknown/i),
      }),
    );
    expect(JSON.stringify(onAfterTool.mock.calls)).not.toContain(
      "secret-token",
    );
    expect(JSON.stringify(onAfterTool.mock.calls)).not.toContain(
      "secret-from-message",
    );
  });

  test("keeps deterministic HTTP 4xx tool failures as safe outputs", async () => {
    const onAfterTool = jest.fn();
    const outputs = await executeResponsesFunctionCalls({
      calls: [functionCall("call_http", "tool")],
      executors: {
        tool: jest.fn(() => ({
          status: 400,
          statusText: "Bearer status-secret",
          data: { token: "body-secret" },
        })),
      },
      signal: new AbortController().signal,
      executedCalls: new Map(),
      onAfterTool,
    });

    expect(outputs[0].output).toContain("HTTP 400");
    expect(JSON.stringify(outputs)).not.toContain("status-secret");
    expect(JSON.stringify(outputs)).not.toContain("body-secret");
    expect(JSON.stringify(onAfterTool.mock.calls)).not.toContain("secret");
  });

  test.each([0, 500, 502, 504])(
    "treats uncertain HTTP status %s as an unknown outcome",
    async (status) => {
      const onAfterTool = jest.fn();
      const executedCalls = new Map();

      await expect(
        executeResponsesFunctionCalls({
          calls: [functionCall("call_http_unknown", "tool")],
          executors: {
            tool: jest.fn(() => ({
              status,
              statusText: "Bearer status-secret",
              data: { token: "body-secret" },
            })),
          },
          signal: new AbortController().signal,
          executedCalls,
          onAfterTool,
        }),
      ).rejects.toThrow(/outcome is unknown/i);

      expect(onAfterTool).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "call_http_unknown",
          isError: true,
          errorMsg: expect.stringMatching(/outcome is unknown/i),
        }),
      );
      expect(JSON.stringify(onAfterTool.mock.calls)).not.toContain("secret");
    },
  );

  test("preflights conflicting call IDs before starting any executor", async () => {
    const first = jest.fn(() => "first");
    const second = jest.fn(() => "second");

    await expect(
      executeResponsesFunctionCalls({
        calls: [
          functionCall("call_same", "first"),
          functionCall("call_same", "second"),
        ],
        executors: { first, second },
        signal: new AbortController().signal,
        executedCalls: new Map(),
      }),
    ).rejects.toThrow(/call_id/i);
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  test("rejects conflicting reuse of a call ID", async () => {
    const executedCalls = new Map();
    await executeResponsesFunctionCalls({
      calls: [functionCall("call_a", "first")],
      executors: { first: jest.fn(() => "ok"), second: jest.fn(() => "bad") },
      signal: new AbortController().signal,
      executedCalls,
    });

    await expect(
      executeResponsesFunctionCalls({
        calls: [functionCall("call_a", "second")],
        executors: {
          first: jest.fn(() => "ok"),
          second: jest.fn(() => "bad"),
        },
        signal: new AbortController().signal,
        executedCalls,
      }),
    ).rejects.toThrow(/call_id/i);
  });

  test("continues stateless rounds with the complete ordered tool trace", async () => {
    const sentPayloads: any[] = [];
    const rounds: ResponsesRoundResult[] = [
      {
        id: "resp_1",
        output: [
          { id: "rs_1", type: "reasoning", encrypted_content: "encrypted" },
          functionCall("call_a", "tool"),
        ],
        calls: [functionCall("call_a", "tool")],
        text: "",
      },
      {
        id: "resp_2",
        output: [
          {
            id: "msg_2",
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "Done" }],
          },
        ],
        calls: [],
        text: "Done",
      },
    ];
    const onFinish = jest.fn();

    await runOpenAIResponsesToolLoop({
      initialPayload: {
        model: "gpt-5.6-terra",
        input: [
          { role: "user", content: [{ type: "input_text", text: "Hi" }] },
        ],
        store: false,
        include: ["reasoning.encrypted_content"],
      } as any,
      executors: { tool: jest.fn(() => ({ status: 200, data: "result" })) },
      controller: new AbortController(),
      sendRound: async (payload) => {
        sentPayloads.push(payload);
        return rounds.shift()!;
      },
      callbacks: { onFinish },
    });

    expect(sentPayloads[1].previous_response_id).toBeUndefined();
    expect(sentPayloads[1].include).toEqual(["reasoning.encrypted_content"]);
    expect(sentPayloads[1].input).toEqual([
      ...sentPayloads[0].input,
      { id: "rs_1", type: "reasoning", encrypted_content: "encrypted" },
      functionCall("call_a", "tool"),
      {
        type: "function_call_output",
        call_id: "call_a",
        output: "result",
      },
    ]);
    expect(onFinish).toHaveBeenCalledWith(
      "Done",
      undefined,
      expect.objectContaining({
        openaiResponseId: "resp_2",
        openaiResponseStored: false,
        openaiResponsesOutput: [
          { id: "rs_1", type: "reasoning", encrypted_content: "encrypted" },
          functionCall("call_a", "tool"),
          {
            type: "function_call_output",
            call_id: "call_a",
            output: "result",
          },
          {
            id: "msg_2",
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "Done" }],
          },
        ],
      }),
    );
  });

  test("continues stored rounds with the latest response ID", async () => {
    const sentPayloads: any[] = [];
    const rounds: ResponsesRoundResult[] = [
      {
        id: "resp_1",
        output: [functionCall("call_a", "tool")],
        calls: [functionCall("call_a", "tool")],
        text: "",
      },
      { id: "resp_2", output: [], calls: [], text: "Done" },
    ];
    const onFinish = jest.fn();

    await runOpenAIResponsesToolLoop({
      initialPayload: {
        model: "gpt-5.6-terra",
        input: "Hi",
        store: true,
        prompt_cache_options: { mode: "explicit", ttl: "30m" },
      } as any,
      executors: { tool: jest.fn(() => "result") },
      controller: new AbortController(),
      sendRound: async (payload) => {
        sentPayloads.push(payload);
        return rounds.shift()!;
      },
      callbacks: { onFinish },
    });

    expect(sentPayloads[1].previous_response_id).toBe("resp_1");
    expect(sentPayloads[1].prompt_cache_options).toEqual({
      mode: "explicit",
      ttl: "30m",
    });
    expect(sentPayloads[1].input).toEqual([
      {
        type: "function_call_output",
        call_id: "call_a",
        output: "result",
      },
    ]);
    expect(onFinish).toHaveBeenCalledWith(
      "Done",
      undefined,
      expect.objectContaining({
        openaiResponseId: "resp_2",
        openaiResponseStored: true,
      }),
    );
  });

  test("stops before executing a batch that exceeds the call limit", async () => {
    const executor = jest.fn();
    const onError = jest.fn();

    await runOpenAIResponsesToolLoop({
      initialPayload: { model: "gpt-5.6-terra", input: "Hi" } as any,
      executors: { tool: executor },
      controller: new AbortController(),
      sendRound: async () => ({
        id: "resp_1",
        output: Array.from({ length: 3 }, (_, index) =>
          functionCall(`call_${index}`, "tool"),
        ),
        calls: Array.from({ length: 3 }, (_, index) =>
          functionCall(`call_${index}`, "tool"),
        ),
        text: "",
      }),
      callbacks: { onError },
      maxToolCalls: 2,
    });

    expect(executor).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ openaiResponseStored: false }),
    );
  });

  test("stops before executing a tool round beyond the round limit", async () => {
    const executor = jest.fn(() => "result");
    const onError = jest.fn();
    let round = 0;

    await runOpenAIResponsesToolLoop({
      initialPayload: { model: "gpt-5.6-terra", input: "Hi" } as any,
      executors: { tool: executor },
      controller: new AbortController(),
      sendRound: async () => {
        round += 1;
        const call = functionCall(`call_${round}`, "tool");
        return {
          id: `resp_${round}`,
          output: [call],
          calls: [call],
          text: "",
        };
      },
      callbacks: { onError },
      maxToolRounds: 1,
    });

    expect(executor).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ openaiResponseStored: false }),
    );
  });

  test("propagates abort to Plugin executors and sends no continuation", async () => {
    const controller = new AbortController();
    const onFinish = jest.fn();
    const onError = jest.fn();
    const sendRound = jest.fn(async () => {
      const call = functionCall("call_abort", "tool");
      return {
        id: "resp_1",
        output: [call],
        calls: [call],
        text: "",
      };
    });
    const executor = jest.fn(
      async (
        _args: Record<string, unknown>,
        options?: { signal?: AbortSignal },
      ) => {
        expect(options?.signal).toBe(controller.signal);
        controller.abort();
        throw Object.assign(new Error("aborted"), { name: "AbortError" });
      },
    );

    await runOpenAIResponsesToolLoop({
      initialPayload: { model: "gpt-5.6-terra", input: "Hi" } as any,
      executors: { tool: executor },
      controller,
      sendRound,
      callbacks: { onFinish, onError },
    });

    expect(sendRound).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(
      "",
      undefined,
      expect.objectContaining({
        openaiResponseStored: false,
        openaiResponsesRecoveryPending: true,
        openaiResponsesOutput: expect.arrayContaining([
          functionCall("call_abort", "tool"),
          expect.objectContaining({
            type: "function_call_output",
            call_id: "call_abort",
          }),
        ]),
      }),
    );
    expect(onError).not.toHaveBeenCalled();
  });

  test("stops the loop after an unknown mutation outcome instead of retrying with a new call ID", async () => {
    const executor = jest
      .fn()
      .mockRejectedValue(
        new Error("Bearer mutation-committed-but-transport-lost"),
      );
    const onFinish = jest.fn();
    const onError = jest.fn();
    let round = 0;
    const sendRound = jest.fn(async () => {
      round += 1;
      if (round <= 2) {
        const call = functionCall(`call_${round}`, "mutate");
        return {
          id: `resp_${round}`,
          output: [call],
          calls: [call],
          text: "",
        };
      }
      return { id: "resp_done", output: [], calls: [], text: "done" };
    });

    await runOpenAIResponsesToolLoop({
      initialPayload: { model: "gpt-5.6-terra", input: "mutate" } as any,
      executors: { mutate: executor },
      controller: new AbortController(),
      sendRound,
      callbacks: { onFinish, onError },
    });

    expect(sendRound).toHaveBeenCalledTimes(1);
    expect(executor).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/outcome is unknown/i),
      }),
      expect.objectContaining({
        openaiResponseStored: false,
        openaiResponsesRecoveryPending: true,
        openaiResponsesOutput: [
          functionCall("call_1", "mutate"),
          expect.objectContaining({
            type: "function_call_output",
            call_id: "call_1",
            output: expect.stringContaining("tool_outcome_unknown"),
          }),
        ],
      }),
    );
    expect(JSON.stringify(onError.mock.calls)).not.toContain(
      "mutation-committed-but-transport-lost",
    );
  });

  test("times out an executor that ignores abort and records an unknown outcome", async () => {
    jest.useFakeTimers();
    try {
      const call = functionCall("call_hung", "mutate");
      const onError = jest.fn();
      const running = runOpenAIResponsesToolLoop({
        initialPayload: { model: "gpt-5.6-terra", input: "mutate" } as any,
        executors: { mutate: jest.fn(() => new Promise(() => undefined)) },
        controller: new AbortController(),
        sendRound: jest.fn(async () => ({
          id: "resp_hung",
          output: [call],
          calls: [call],
          text: "",
        })),
        callbacks: { onError },
        timeoutMs: 100,
      });

      await Promise.resolve();
      await jest.advanceTimersByTimeAsync(100);
      await running;

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ name: "TimeoutError" }),
        expect.objectContaining({
          openaiResponsesRecoveryPending: true,
          openaiResponsesOutput: expect.arrayContaining([
            expect.objectContaining({
              call_id: "call_hung",
              output: expect.stringContaining("tool_outcome_unknown"),
            }),
          ]),
        }),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  test("stops the loop after an uncertain HTTP tool response", async () => {
    const executor = jest.fn(() => ({ status: 502, data: "gateway failed" }));
    const onFinish = jest.fn();
    const onError = jest.fn();
    const sendRound = jest.fn(async () => {
      const call = functionCall("call_http_unknown", "mutate");
      return {
        id: "resp_http_unknown",
        output: [call],
        calls: [call],
        text: "",
      };
    });

    await runOpenAIResponsesToolLoop({
      initialPayload: { model: "gpt-5.6-terra", input: "mutate" } as any,
      executors: { mutate: executor },
      controller: new AbortController(),
      sendRound,
      callbacks: { onFinish, onError },
    });

    expect(sendRound).toHaveBeenCalledTimes(1);
    expect(executor).toHaveBeenCalledTimes(1);
    expect(onFinish).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/unknown/i) }),
      expect.objectContaining({
        openaiResponsesRecoveryPending: true,
        openaiResponsesOutput: expect.arrayContaining([
          expect.objectContaining({
            type: "function_call_output",
            call_id: "call_http_unknown",
            output: expect.stringContaining("tool_outcome_unknown"),
          }),
        ]),
      }),
    );
  });

  test("waits for every started parallel executor before reporting an unknown outcome", async () => {
    const events: string[] = [];
    const callUnknown = functionCall("call_unknown", "unknown_tool");
    const callSuccess = functionCall("call_success", "slow_tool");
    const sendRound = jest.fn(async () => ({
      id: "resp_parallel",
      output: [callUnknown, callSuccess],
      calls: [callUnknown, callSuccess],
      text: "",
    }));
    const onError = jest.fn(() => events.push("error"));

    await runOpenAIResponsesToolLoop({
      initialPayload: { model: "gpt-5.6-terra", input: "run" } as any,
      executors: {
        unknown_tool: jest.fn(async () => {
          events.push("unknown-started");
          throw new Error("transport lost");
        }),
        slow_tool: jest.fn(async () => {
          events.push("slow-started");
          await Promise.resolve();
          events.push("slow-finished");
          return "completed";
        }),
      },
      controller: new AbortController(),
      sendRound,
      callbacks: { onError },
    });

    expect(sendRound).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      "unknown-started",
      "slow-started",
      "slow-finished",
      "error",
    ]);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/unknown/i) }),
      expect.objectContaining({
        openaiResponsesOutput: [
          callUnknown,
          callSuccess,
          expect.objectContaining({ call_id: "call_unknown" }),
          expect.objectContaining({
            call_id: "call_success",
            output: "completed",
          }),
        ],
      }),
    );
  });

  test("persists a stateless-safe trace when a later round fails", async () => {
    const onError = jest.fn();
    const call = functionCall("call_side_effect", "tool");
    let round = 0;

    await runOpenAIResponsesToolLoop({
      initialPayload: {
        model: "gpt-5.6-terra",
        input: "Hi",
        store: true,
      } as any,
      executors: { tool: jest.fn(() => "side effect complete") },
      controller: new AbortController(),
      sendRound: async () => {
        round += 1;
        if (round === 1) {
          return {
            id: "resp_1",
            output: [call],
            calls: [call],
            text: "",
          };
        }
        throw new Error("continuation failed");
      },
      callbacks: { onError },
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "continuation failed" }),
      expect.objectContaining({
        openaiResponseId: undefined,
        openaiResponseStored: false,
        openaiResponsesRecoveryPending: true,
        openaiResponsesOutput: [
          call,
          {
            type: "function_call_output",
            call_id: "call_side_effect",
            output: "side effect complete",
          },
        ],
      }),
    );
  });

  test("rejects a conflicting call ID across rounds without rerunning it", async () => {
    const executor = jest.fn(() => "first result");
    const onError = jest.fn();
    let round = 0;

    await runOpenAIResponsesToolLoop({
      initialPayload: { model: "gpt-5.6-terra", input: "Hi" } as any,
      executors: { first: executor, second: executor },
      controller: new AbortController(),
      sendRound: async () => {
        round += 1;
        const call = functionCall(
          "call_same",
          round === 1 ? "first" : "second",
        );
        return {
          id: `resp_${round}`,
          output: [call],
          calls: [call],
          text: "",
        };
      },
      callbacks: { onError },
    });

    expect(executor).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/call_id/i) }),
      expect.objectContaining({
        openaiResponsesOutput: [
          functionCall("call_same", "first"),
          {
            type: "function_call_output",
            call_id: "call_same",
            output: "first result",
          },
        ],
      }),
    );
  });

  test("rejects an identical call ID replay across rounds", async () => {
    const executor = jest.fn(() => "result");
    const onError = jest.fn();
    const call = functionCall("call_repeat", "tool");
    let round = 0;

    await runOpenAIResponsesToolLoop({
      initialPayload: { model: "gpt-5.6-terra", input: "Hi" } as any,
      executors: { tool: executor },
      controller: new AbortController(),
      sendRound: async () => {
        round += 1;
        return {
          id: `resp_${round}`,
          output: [call],
          calls: [call],
          text: "",
        };
      },
      callbacks: { onError },
    });

    expect(executor).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/call_id/i) }),
      expect.objectContaining({
        openaiResponsesOutput: [
          call,
          {
            type: "function_call_output",
            call_id: "call_repeat",
            output: "result",
          },
        ],
      }),
    );
  });

  test("reports timeout aborts as errors instead of user stops", async () => {
    const controller = new AbortController();
    const onFinish = jest.fn();
    const onError = jest.fn();

    await runOpenAIResponsesToolLoop({
      initialPayload: { model: "gpt-5.6-terra", input: "Hi" } as any,
      executors: {},
      controller,
      sendRound: async () => {
        const timeout = new Error("OpenAI Responses request timed out");
        timeout.name = "TimeoutError";
        controller.abort(timeout);
        throw timeout;
      },
      callbacks: { onFinish, onError },
    });

    expect(onFinish).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "TimeoutError" }),
      undefined,
    );
  });

  test("settles callbacks at most once even when a callback throws", async () => {
    const onFinish = jest.fn(() => {
      throw new Error("finish callback failed");
    });
    const onError = jest.fn();

    await expect(
      runOpenAIResponsesToolLoop({
        initialPayload: { model: "gpt-5.6-terra", input: "Hi" } as any,
        executors: {},
        controller: new AbortController(),
        sendRound: async () => ({
          id: "resp_done",
          output: [],
          calls: [],
          text: "Done",
        }),
        callbacks: { onFinish, onError },
      }),
    ).resolves.toBeUndefined();

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  test("isolates a throwing error callback from outer retry logic", async () => {
    const onError = jest.fn(() => {
      throw new Error("error callback failed");
    });

    await expect(
      runOpenAIResponsesToolLoop({
        initialPayload: { model: "gpt-5.6-terra", input: "Hi" } as any,
        executors: {},
        controller: new AbortController(),
        sendRound: async () => {
          throw new Error("request failed");
        },
        callbacks: { onError },
      }),
    ).resolves.toBeUndefined();

    expect(onError).toHaveBeenCalledTimes(1);
  });
});
