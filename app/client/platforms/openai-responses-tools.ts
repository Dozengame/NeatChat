import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";

import type { ChatMessageTool } from "@/app/store";
import type { FunctionToolItem } from "@/app/store/plugin";
import { fetch as tauriFetch } from "@/app/utils/stream";
import { getAccessRestrictedPublicErrorMessage } from "@/app/utils/public-error";
import Locale from "@/app/locales";
import type { ResponsesRequestPayload } from "./openai-responses-builder";

export type ResponsesFunctionTool = {
  type: "function";
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
};

export type ResponsesFunctionCall = {
  id: string;
  type: "function_call";
  call_id: string;
  name: string;
  arguments: string;
};

export type ResponsesFunctionCallOutput = {
  type: "function_call_output";
  call_id: string;
  output: string;
};

export type PluginFunctionExecutor = (
  args: Record<string, unknown>,
  options?: { signal?: AbortSignal },
) => unknown | Promise<unknown>;

type CachedToolExecution = {
  signature: string;
  output: ResponsesFunctionCallOutput;
  outcome: "completed" | "unknown";
};

export type ResponsesRoundResult = {
  id?: string;
  output: Record<string, unknown>[];
  calls: ResponsesFunctionCall[];
  text: string;
  response?: Response;
};

type OpenAIResponsesTraceMetadata = {
  openaiResponseId?: string;
  openaiResponseStored?: boolean;
  openaiResponsesOutput?: unknown[];
  openaiResponsesRecoveryPending?: boolean;
};

type ToolCallbacks = {
  onUpdate?: (message: string, chunk: string) => void;
  onFinish?: (
    message: string,
    response: Response,
    metadata?: OpenAIResponsesTraceMetadata,
  ) => void;
  onError?: (error: Error, metadata?: OpenAIResponsesTraceMetadata) => void;
  onBeforeTool?: (tool: ChatMessageTool) => void;
  onAfterTool?: (tool: ChatMessageTool) => void;
};

const FUNCTION_NAME_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const DEFAULT_MAX_TOOL_ROUNDS = 4;
const DEFAULT_MAX_TOOL_CALLS = 8;
const TOOL_OUTCOME_UNKNOWN_MESSAGE =
  "Tool execution outcome is unknown; do not retry automatically.";

class ToolExecutionOutcomeUnknownError extends Error {
  constructor() {
    super(TOOL_OUTCOME_UNKNOWN_MESSAGE);
    this.name = "ToolExecutionOutcomeUnknownError";
  }
}

function cloneSchema(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return { type: "object", properties: {} };
  }

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function adaptPluginToolsForResponses(
  tools: FunctionToolItem[],
  funcs: Record<string, PluginFunctionExecutor>,
) {
  const names = new Set<string>();
  const responsesTools: ResponsesFunctionTool[] = [];
  const executors: Record<string, PluginFunctionExecutor> = {};

  for (const tool of tools) {
    if (tool?.type !== "function" || !tool.function) continue;
    const name = tool.function.name;
    if (!FUNCTION_NAME_PATTERN.test(name)) {
      throw new Error(`Invalid Plugin function name: ${name}`);
    }
    if (names.has(name)) {
      throw new Error(`Duplicate Plugin function name: ${name}`);
    }
    const executor = funcs[name];
    if (typeof executor !== "function") {
      throw new Error(`Missing executor for Plugin function: ${name}`);
    }

    names.add(name);
    responsesTools.push({
      type: "function",
      name,
      ...(tool.function.description
        ? { description: tool.function.description }
        : {}),
      parameters: cloneSchema(tool.function.parameters),
    });
    executors[name] = executor;
  }

  return { tools: responsesTools, executors };
}

export function hasPendingResponsesToolRecovery(
  messages: readonly { openaiResponsesRecoveryPending?: boolean }[],
) {
  return messages.some(
    (message) => message.openaiResponsesRecoveryPending === true,
  );
}

export function extractOpenAIResponsesText(response: any) {
  const outputText =
    typeof response?.output_text === "string"
      ? response.output_text
      : undefined;
  const parts: string[] = [];
  const citations = new Map<string, string>();
  for (const output of response?.output ?? []) {
    if (!Array.isArray(output?.content)) continue;
    for (const content of output.content) {
      if (content?.type === "refusal" && content.refusal) {
        parts.push(content.refusal);
        continue;
      }
      if (content?.type === "output_text" && content.text) {
        parts.push(content.text);
        for (const annotation of content.annotations ?? []) {
          if (annotation?.type === "url_citation" && annotation.url) {
            citations.set(annotation.url, annotation.title || annotation.url);
          }
        }
      }
    }
  }

  const text = parts.join("") || outputText || "";
  if (citations.size === 0) return text;

  const sources = Array.from(citations.entries())
    .map(([url, title]) => `- [${title}](${url})`)
    .join("\n");
  return `${text}\n\n${Locale.Chat.SourcesHeading}:\n${sources}`;
}

function isResponsesFunctionCall(
  value: unknown,
): value is ResponsesFunctionCall {
  const item = value as Partial<ResponsesFunctionCall> | undefined;
  return (
    item?.type === "function_call" &&
    typeof item.id === "string" &&
    typeof item.call_id === "string" &&
    typeof item.name === "string" &&
    typeof item.arguments === "string"
  );
}

export function createResponsesRoundCollector() {
  const callItems = new Map<number, Partial<ResponsesFunctionCall>>();
  let completedResponse: any;
  let incompleteResponse: any;

  return {
    consume(event: any) {
      if (!event || typeof event !== "object") return undefined;

      if (event.type === "response.error" || event.type === "error") {
        const message =
          typeof event.error?.message === "string"
            ? event.error.message
            : typeof event.message === "string"
            ? event.message
            : "OpenAI Responses request failed";
        throw new Error(message);
      }
      if (event.type === "response.failed") {
        const message =
          typeof event.response?.error?.message === "string"
            ? event.response.error.message
            : "OpenAI Responses request failed";
        throw new Error(message);
      }

      if (
        event.type === "response.output_text.delta" ||
        event.type === "response.refusal.delta"
      ) {
        return typeof event.delta === "string"
          ? ({ kind: "text", delta: event.delta } as const)
          : undefined;
      }

      if (event.type === "response.reasoning_summary_text.delta") {
        return typeof event.delta === "string"
          ? ({ kind: "reasoning", delta: event.delta } as const)
          : undefined;
      }

      const outputIndex = Number(event.output_index);
      if (
        event.type === "response.output_item.added" &&
        Number.isInteger(outputIndex) &&
        event.item?.type === "function_call"
      ) {
        callItems.set(outputIndex, { ...event.item });
      } else if (
        event.type === "response.function_call_arguments.delta" &&
        Number.isInteger(outputIndex)
      ) {
        const current = callItems.get(outputIndex) ?? {};
        current.arguments = `${current.arguments ?? ""}${event.delta ?? ""}`;
        callItems.set(outputIndex, current);
      } else if (
        event.type === "response.function_call_arguments.done" &&
        Number.isInteger(outputIndex)
      ) {
        const current = callItems.get(outputIndex) ?? {};
        current.arguments = String(event.arguments ?? "");
        callItems.set(outputIndex, current);
      } else if (
        event.type === "response.output_item.done" &&
        Number.isInteger(outputIndex) &&
        event.item?.type === "function_call"
      ) {
        callItems.set(outputIndex, { ...event.item });
      } else if (event.type === "response.completed" && event.response) {
        completedResponse = event.response;
      } else if (event.type === "response.incomplete" && event.response) {
        incompleteResponse = event.response;
      }

      return undefined;
    },

    complete(): ResponsesRoundResult {
      if (incompleteResponse) {
        throw new Error("OpenAI Responses response was incomplete");
      }

      const rawOutput = Array.isArray(completedResponse?.output)
        ? (completedResponse.output as Record<string, unknown>[])
        : Array.from(callItems.entries())
            .sort(([left], [right]) => left - right)
            .map(([, item]) => item as Record<string, unknown>);
      const callSignatures = new Map<string, string>();
      const output = rawOutput.filter((item) => {
        if (!isResponsesFunctionCall(item)) return true;
        const signature = `${item.name}\n${item.arguments}`;
        const previous = callSignatures.get(item.call_id);
        if (previous === undefined) {
          callSignatures.set(item.call_id, signature);
          return true;
        }
        if (previous !== signature) {
          throw new Error(`Conflicting reuse of call_id ${item.call_id}`);
        }
        return false;
      });
      const completedCalls = output.filter(isResponsesFunctionCall);
      const fallbackCalls = Array.from(callItems.entries())
        .sort(([left], [right]) => left - right)
        .map(([, item]) => item)
        .filter(isResponsesFunctionCall);
      const calls = completedResponse ? completedCalls : fallbackCalls;

      return {
        id:
          typeof completedResponse?.id === "string"
            ? completedResponse.id
            : undefined,
        output,
        calls,
        text: extractOpenAIResponsesText(completedResponse),
      };
    },
  };
}

function abortError() {
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}

function getAbortReason(signal: AbortSignal) {
  return signal.reason instanceof Error ? signal.reason : abortError();
}

async function executeWithAbort<T>(
  operation: () => T | Promise<T>,
  signal: AbortSignal,
) {
  if (signal.aborted) throw getAbortReason(signal);

  let removeAbortListener: () => void = () => undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    const rejectAborted = () => reject(getAbortReason(signal));
    signal.addEventListener("abort", rejectAborted, { once: true });
    removeAbortListener = () =>
      signal.removeEventListener("abort", rejectAborted);
  });

  try {
    return await Promise.race([Promise.resolve().then(operation), aborted]);
  } finally {
    removeAbortListener();
  }
}

function callSafely<T extends unknown[]>(
  callback: ((...args: T) => void) | undefined,
  ...args: T
) {
  try {
    callback?.(...args);
  } catch {
    // UI callback failures must not re-settle or replay tool side effects.
  }
}

function stringifyToolResult(value: unknown) {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  return JSON.stringify(value);
}

function toUiTool(call: ResponsesFunctionCall): ChatMessageTool {
  return {
    id: call.call_id,
    type: "function",
    function: {
      name: call.name,
      arguments: call.arguments,
    },
  };
}

function toolErrorOutput(type: string, message: string) {
  return JSON.stringify({ error: { type, message } });
}

export async function executeResponsesFunctionCalls(params: {
  calls: ResponsesFunctionCall[];
  executors: Record<string, PluginFunctionExecutor>;
  signal: AbortSignal;
  executedCalls: Map<string, CachedToolExecution>;
  onBeforeTool?: ToolCallbacks["onBeforeTool"];
  onAfterTool?: ToolCallbacks["onAfterTool"];
}) {
  const batchSignatures = new Map<string, string>();
  const calls = params.calls.filter((call) => {
    const signature = `${call.name}\n${call.arguments}`;
    const previous = batchSignatures.get(call.call_id);
    if (previous === undefined) {
      batchSignatures.set(call.call_id, signature);
      return true;
    }
    if (previous !== signature) {
      throw new Error(`Conflicting reuse of call_id ${call.call_id}`);
    }
    return false;
  });
  const pendingCalls = new Map<
    string,
    { signature: string; promise: Promise<ResponsesFunctionCallOutput> }
  >();

  const executeOne = async (call: ResponsesFunctionCall) => {
    const signature = `${call.name}\n${call.arguments}`;
    const cached = params.executedCalls.get(call.call_id);
    if (cached) {
      if (cached.signature !== signature) {
        throw new Error(`Conflicting reuse of call_id ${call.call_id}`);
      }
      if (cached.outcome === "unknown") {
        throw new ToolExecutionOutcomeUnknownError();
      }
      return cached.output;
    }
    const pending = pendingCalls.get(call.call_id);
    if (pending) {
      if (pending.signature !== signature) {
        throw new Error(`Conflicting reuse of call_id ${call.call_id}`);
      }
      return pending.promise;
    }

    const execution = (async () => {
      if (params.signal.aborted) throw getAbortReason(params.signal);
      const uiTool = toUiTool(call);
      callSafely(params.onBeforeTool, uiTool);

      let args: Record<string, unknown>;
      try {
        const parsed = call.arguments ? JSON.parse(call.arguments) : {};
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Function arguments must be a JSON object.");
        }
        args = parsed as Record<string, unknown>;
      } catch {
        const message = "Function arguments are not valid JSON.";
        const output = {
          type: "function_call_output" as const,
          call_id: call.call_id,
          output: toolErrorOutput("invalid_arguments", message),
        };
        callSafely(params.onAfterTool, {
          ...uiTool,
          isError: true,
          errorMsg: message,
        });
        params.executedCalls.set(call.call_id, {
          signature,
          output,
          outcome: "completed",
        });
        return output;
      }

      const executor = params.executors[call.name];
      if (typeof executor !== "function") {
        const message = `Unknown function: ${call.name}`;
        const output = {
          type: "function_call_output" as const,
          call_id: call.call_id,
          output: toolErrorOutput("unknown_function", message),
        };
        callSafely(params.onAfterTool, {
          ...uiTool,
          isError: true,
          errorMsg: message,
        });
        params.executedCalls.set(call.call_id, {
          signature,
          output,
          outcome: "completed",
        });
        return output;
      }

      try {
        const result = await executeWithAbort(
          () => executor({ ...args }, { signal: params.signal }),
          params.signal,
        );
        if (params.signal.aborted) throw getAbortReason(params.signal);
        const responseLike = result as {
          status?: number;
          statusText?: string;
          data?: unknown;
        };
        if (
          typeof responseLike?.status === "number" &&
          (responseLike.status <= 0 || responseLike.status >= 500)
        ) {
          throw new ToolExecutionOutcomeUnknownError();
        }
        if (
          typeof responseLike?.status === "number" &&
          responseLike.status >= 300
        ) {
          const message = `Tool request failed (HTTP ${responseLike.status}).`;
          const output = {
            type: "function_call_output" as const,
            call_id: call.call_id,
            output: toolErrorOutput("tool_error", message),
          };
          callSafely(params.onAfterTool, {
            ...uiTool,
            isError: true,
            errorMsg: message,
          });
          params.executedCalls.set(call.call_id, {
            signature,
            output,
            outcome: "completed",
          });
          return output;
        }
        const content = stringifyToolResult(
          typeof responseLike?.status === "number"
            ? responseLike.data ?? responseLike.statusText
            : result,
        );
        const output = {
          type: "function_call_output" as const,
          call_id: call.call_id,
          output: content,
        };
        callSafely(params.onAfterTool, {
          ...uiTool,
          content,
          isError: false,
        });
        params.executedCalls.set(call.call_id, {
          signature,
          output,
          outcome: "completed",
        });
        return output;
      } catch (error) {
        if (params.signal.aborted) {
          throw getAbortReason(params.signal);
        }
        const output = {
          type: "function_call_output" as const,
          call_id: call.call_id,
          output: toolErrorOutput(
            "tool_outcome_unknown",
            TOOL_OUTCOME_UNKNOWN_MESSAGE,
          ),
        };
        callSafely(params.onAfterTool, {
          ...uiTool,
          isError: true,
          errorMsg: TOOL_OUTCOME_UNKNOWN_MESSAGE,
        });
        params.executedCalls.set(call.call_id, {
          signature,
          output,
          outcome: "unknown",
        });
        throw new ToolExecutionOutcomeUnknownError();
      }
    })();

    pendingCalls.set(call.call_id, { signature, promise: execution });
    return execution;
  };

  const settled = await Promise.all(
    calls.map(async (call) => {
      try {
        return { output: await executeOne(call) } as const;
      } catch (error) {
        return { error } as const;
      }
    }),
  );
  const outputs: ResponsesFunctionCallOutput[] = [];
  let hasError = false;
  let firstError: unknown;
  let outcomeUnknownError: ToolExecutionOutcomeUnknownError | undefined;
  for (const result of settled) {
    if ("error" in result) {
      if (!hasError) firstError = result.error;
      if (result.error instanceof ToolExecutionOutcomeUnknownError) {
        outcomeUnknownError = result.error;
      }
      hasError = true;
    } else {
      outputs.push(result.output);
    }
  }
  if (hasError) throw outcomeUnknownError ?? firstError;
  return outputs;
}

function normalizeInputToArray(input: ResponsesRequestPayload["input"]) {
  if (Array.isArray(input)) return [...input];
  if (!input) return [];
  return [
    {
      role: "user" as const,
      content: [{ type: "input_text" as const, text: input }],
    },
  ];
}

export async function runOpenAIResponsesToolLoop(params: {
  initialPayload: ResponsesRequestPayload;
  executors: Record<string, PluginFunctionExecutor>;
  controller: AbortController;
  sendRound: (
    payload: ResponsesRequestPayload,
    signal: AbortSignal,
  ) => Promise<ResponsesRoundResult>;
  callbacks: ToolCallbacks;
  maxToolRounds?: number;
  maxToolCalls?: number;
  timeoutMs?: number;
}) {
  const maxToolRounds = params.maxToolRounds ?? DEFAULT_MAX_TOOL_ROUNDS;
  const maxToolCalls = params.maxToolCalls ?? DEFAULT_MAX_TOOL_CALLS;
  const executedCalls = new Map<string, CachedToolExecution>();
  const uniqueCallIds = new Set<string>();
  const callSignatures = new Map<string, string>();
  const trace: Record<string, unknown>[] = [];
  const statelessHistory = normalizeInputToArray(params.initialPayload.input);
  let payload: ResponsesRequestPayload = {
    ...params.initialPayload,
    input: Array.isArray(params.initialPayload.input)
      ? [...params.initialPayload.input]
      : params.initialPayload.input,
  };
  let toolRounds = 0;
  let response: Response | undefined;
  let visibleText = "";
  let activeCalls: ResponsesFunctionCall[] = [];
  let settled = false;
  const timeoutId =
    typeof params.timeoutMs === "number" && params.timeoutMs > 0
      ? setTimeout(() => {
          if (params.controller.signal.aborted) return;
          const error = new Error("OpenAI Responses tool loop timed out");
          error.name = "TimeoutError";
          params.controller.abort(error);
        }, params.timeoutMs)
      : undefined;

  const finish = (message: string, metadata?: OpenAIResponsesTraceMetadata) => {
    if (settled) return;
    settled = true;
    callSafely(
      params.callbacks.onFinish,
      message,
      response as Response,
      metadata,
    );
  };
  const fail = (error: Error, metadata?: OpenAIResponsesTraceMetadata) => {
    if (settled) return;
    settled = true;
    callSafely(params.callbacks.onError, error, metadata);
  };
  const safeTraceMetadata = (): OpenAIResponsesTraceMetadata | undefined =>
    trace.length > 0
      ? {
          openaiResponseId: undefined,
          openaiResponseStored: false,
          openaiResponsesOutput: [...trace],
          openaiResponsesRecoveryPending: true,
        }
      : undefined;
  const closeActiveCalls = (message: string, outcomeUnknown = false) => {
    if (activeCalls.length === 0) return;
    const outputCallIds = new Set(
      trace.flatMap((item) =>
        item.type === "function_call_output" && typeof item.call_id === "string"
          ? [item.call_id]
          : [],
      ),
    );
    const closedCallIds = new Set<string>();
    for (const call of activeCalls) {
      if (closedCallIds.has(call.call_id) || outputCallIds.has(call.call_id)) {
        continue;
      }
      closedCallIds.add(call.call_id);
      const cached = executedCalls.get(call.call_id);
      const output =
        cached?.output ??
        ({
          type: "function_call_output" as const,
          call_id: call.call_id,
          output: toolErrorOutput(
            outcomeUnknown ? "tool_outcome_unknown" : "tool_interrupted",
            message,
          ),
        } satisfies ResponsesFunctionCallOutput);
      trace.push(output);
      if (!cached) {
        callSafely(params.callbacks.onAfterTool, {
          ...toUiTool(call),
          isError: true,
          errorMsg: message,
        });
      }
    }
    activeCalls = [];
  };

  try {
    while (true) {
      if (params.controller.signal.aborted) {
        throw getAbortReason(params.controller.signal);
      }
      const round = await params.sendRound(payload, params.controller.signal);
      if (params.controller.signal.aborted) {
        throw getAbortReason(params.controller.signal);
      }
      for (const call of round.calls) {
        const signature = `${call.name}\n${call.arguments}`;
        const previous = callSignatures.get(call.call_id);
        if (previous !== undefined) {
          if (previous !== signature) {
            throw new Error(`Conflicting reuse of call_id ${call.call_id}`);
          }
          throw new Error(`Repeated reuse of call_id ${call.call_id}`);
        }
        callSignatures.set(call.call_id, signature);
      }
      response = round.response ?? response;
      visibleText = round.text || visibleText;
      trace.push(...round.output);

      if (round.calls.length === 0) {
        activeCalls = [];
        if (params.initialPayload.store === true && !round.id) {
          throw new Error("Stored Responses completion is missing an ID");
        }
        finish(round.text || visibleText, {
          openaiResponseId: round.id,
          openaiResponseStored: params.initialPayload.store === true,
          openaiResponsesOutput: trace,
        });
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        return;
      }

      activeCalls = round.calls;
      toolRounds += 1;
      if (toolRounds > maxToolRounds) {
        throw new Error(
          `OpenAI Responses exceeded ${maxToolRounds} tool rounds`,
        );
      }

      const nextUniqueCallIds = new Set(
        round.calls
          .map((call) => call.call_id)
          .filter((callId) => !uniqueCallIds.has(callId)),
      );
      if (uniqueCallIds.size + nextUniqueCallIds.size > maxToolCalls) {
        throw new Error(`OpenAI Responses exceeded ${maxToolCalls} tool calls`);
      }
      nextUniqueCallIds.forEach((callId) => uniqueCallIds.add(callId));

      const outputs = await executeResponsesFunctionCalls({
        calls: round.calls,
        executors: params.executors,
        signal: params.controller.signal,
        executedCalls,
        onBeforeTool: params.callbacks.onBeforeTool,
        onAfterTool: params.callbacks.onAfterTool,
      });
      trace.push(...outputs);
      activeCalls = [];

      if (params.initialPayload.store === true) {
        if (!round.id) {
          throw new Error(
            "Stored Responses tool continuation is missing an ID",
          );
        }
        payload = {
          ...params.initialPayload,
          previous_response_id: round.id,
          input: outputs,
        };
      } else {
        statelessHistory.push(...round.output, ...outputs);
        payload = {
          ...params.initialPayload,
          input: [...statelessHistory],
        };
        delete payload.previous_response_id;
      }
    }
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    const wasAborted = params.controller.signal.aborted;
    const outcomeUnknown =
      normalizedError instanceof ToolExecutionOutcomeUnknownError;
    closeActiveCalls(
      wasAborted || outcomeUnknown
        ? TOOL_OUTCOME_UNKNOWN_MESSAGE
        : "Tool call was not completed.",
      wasAborted || outcomeUnknown,
    );
    const metadata = safeTraceMetadata();
    const abortReason = wasAborted
      ? getAbortReason(params.controller.signal)
      : normalizedError;
    if (wasAborted && abortReason.name !== "TimeoutError") {
      finish(visibleText, metadata);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      return;
    }
    fail(abortReason, metadata);
  }
  if (timeoutId !== undefined) clearTimeout(timeoutId);
}

export async function sendOpenAIResponsesSseRound(params: {
  url: string;
  headers: Record<string, string>;
  payload: ResponsesRequestPayload;
  controller: AbortController;
  timeoutMs: number;
  onUpdate?: ToolCallbacks["onUpdate"];
}) {
  const collector = createResponsesRoundCollector();
  let response: Response | undefined;
  let visibleText = "";
  let hasOutputText = false;
  let isThinking = false;
  const timeoutId = setTimeout(() => {
    if (params.controller.signal.aborted) return;
    const error = new Error("OpenAI Responses request timed out");
    error.name = "TimeoutError";
    params.controller.abort(error);
  }, params.timeoutMs);

  try {
    await fetchEventSource(params.url, {
      fetch: tauriFetch as any,
      method: "POST",
      headers: params.headers,
      body: JSON.stringify(params.payload),
      signal: params.controller.signal,
      openWhenHidden: true,
      async onopen(res) {
        response = res;
        const contentType = res.headers.get("content-type") ?? "";
        if (!res.ok || !contentType.startsWith(EventStreamContentType)) {
          throw await getOpenAIResponsesStreamError(res);
        }
      },
      onmessage(message) {
        if (!message.data || message.data === "[DONE]") return;
        const display = collector.consume(JSON.parse(message.data));
        if (!display) return;
        if (display.kind === "reasoning") {
          if (!isThinking) {
            isThinking = true;
            visibleText += "<think>\n";
          }
          visibleText += display.delta;
          params.onUpdate?.(visibleText, display.delta);
          return;
        }

        if (!hasOutputText) {
          hasOutputText = true;
          isThinking = false;
          visibleText = display.delta;
        } else {
          visibleText += display.delta;
        }
        params.onUpdate?.(visibleText, display.delta);
      },
      onclose() {},
      onerror(error) {
        throw error;
      },
    });

    const round = collector.complete();
    if (!round.id) {
      throw new Error("OpenAI Responses stream ended without a completion");
    }
    if (round.text && round.text !== visibleText) {
      visibleText = round.text;
      params.onUpdate?.(visibleText, round.text);
    }
    return { ...round, response };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getOpenAIResponsesStreamError(response: Response) {
  const statusMessage = getAccessRestrictedPublicErrorMessage({
    response,
    message: Locale.Error.AccessRestricted,
  });
  if (statusMessage) return new Error(statusMessage);

  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {}
  const accessRestrictedMessage = getAccessRestrictedPublicErrorMessage({
    response,
    payload,
    message: Locale.Error.AccessRestricted,
  });
  return new Error(
    accessRestrictedMessage ??
      `OpenAI Responses stream failed (${response.status})`,
  );
}
