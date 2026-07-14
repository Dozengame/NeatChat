// @ts-nocheck
import {
  getMessageTextContent,
  trimTopic,
  getMessageTextContentWithoutThinking,
  safeLocalStorage,
} from "../utils";
import {
  getOpenAIImageGenerationProgressContent,
  isOpenAIImageGenerationModelConfig,
} from "../utils/openai-image";

import {
  indexedDBStorage,
  rawIndexedDBStorage,
} from "@/app/utils/indexedDB-storage";
import { nanoid } from "nanoid";
import type { MultimodalContent } from "../client/types";
import type { ClientApi } from "../client/api";
import {
  DEFAULT_TOPIC,
  type ChatMessage,
  type ChatMessageTool,
} from "./chat-types";
export {
  DEFAULT_TOPIC,
  type ChatMessage,
  type ChatMessageTool,
} from "./chat-types";
import { ChatControllerPool } from "../client/controller";
import { showToast } from "../components/ui-lib-actions";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_TEMPLATE,
  KnowledgeCutOffDate,
  StoreKey,
  ServiceProvider,
  MCP_SYSTEM_TEMPLATE,
  MCP_TOOLS_TEMPLATE,
} from "../constant";
import Locale, { getLang } from "../locales";
import { prettyObject } from "../utils/format";
import { createPersistStore } from "../utils/store";
import { estimateTokenLength } from "../utils/token";
import {
  getEnabledCustomInstructions,
  ModelConfig,
  useAppConfig,
} from "./config";
import { createEmptyMask, Mask } from "./mask";
import {
  executeMcpAction,
  getAllTools,
  getMcpChatServerStates,
  initializeMcpSystem,
  isMcpEnabled,
} from "../mcp/actions";
import { extractMcpJson, hasMcpJsonStart, isMcpJson } from "../mcp/utils";
import {
  formatFailedMcpRequestForChat,
  formatMcpToolResultForChat,
} from "../mcp/display";
import { registerChatStore } from "./chat-state-link";
import { isOpenAIGpt56ModelConfig } from "../utils/openai-responses";
import { selectOpenAIAllTurnsHistory } from "../utils/openai-history";
import { createTrailingThrottledJSONStorage } from "../utils/chat-persist-storage";
import {
  createStreamUpdateCoalescer,
  getStreamUpdateInterval,
} from "../utils/stream-update-coalescer";
import { resolveSummaryRequestConfig } from "../utils/summary-request";
import { useAccessStore } from "./access";
import { collectModelsWithDefaultModelAndPolicy } from "../utils/model";
import { getPublicUpstreamErrorMessage } from "../utils/public-error";
import { migrateLegacyBuiltinMask } from "../masks/migration";

const localStorage = safeLocalStorage();
const chatPersistStorage = createTrailingThrottledJSONStorage<any>(
  rawIndexedDBStorage,
  {
    intervalMs: 1000,
    shouldPersist: (value) => value.state?._hasHydrated === true,
    onError: () => {
      console.error("[Chat] failed to persist conversation state");
      showToast(Locale.Chat.PersistenceFailed);
    },
  },
);
const CHAT_PERSIST_SEMANTIC_DEADLINE_MS = 250;
const MCP_REINITIALIZATION_COOLDOWN_MS = 30_000;

function flushChatPersistence() {
  chatPersistStorage.scheduleFlush(
    StoreKey.Chat,
    CHAT_PERSIST_SEMANTIC_DEADLINE_MS,
  );
}

function flushChatPersistenceNow() {
  void chatPersistStorage.flushNow(StoreKey.Chat).catch(() => {
    console.error("[Chat] failed to flush persisted state");
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushChatPersistenceNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushChatPersistenceNow();
    }
  });
}

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    role: "user",
    content: "",
    ...override,
  };
}

export function hasClosedResponsesFunctionTrace(message: ChatMessage) {
  const output = message.openaiResponsesOutput;
  if (!Array.isArray(output)) return false;
  const callIds = new Set(
    output.flatMap((item: any) =>
      item?.type === "function_call" && typeof item.call_id === "string"
        ? [item.call_id]
        : [],
    ),
  );
  if (callIds.size === 0) return false;
  const outputIds = new Set(
    output.flatMap((item: any) =>
      item?.type === "function_call_output" && typeof item.call_id === "string"
        ? [item.call_id]
        : [],
    ),
  );
  return Array.from(callIds).every((callId) => outputIds.has(callId));
}

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: string;
  topic: string;

  memoryPrompt: string;
  customInstructions?: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;

  mask: Mask;
}

export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});

function getCurrentCustomInstructions() {
  return getEnabledCustomInstructions(useAppConfig.getState()) || undefined;
}

function refreshEmptySessionCustomInstructions(session: ChatSession) {
  if (session.messages.length === 0) {
    session.customInstructions = getCurrentCustomInstructions();
  }
}

function createEmptySession(): ChatSession {
  return {
    id: nanoid(),
    topic: DEFAULT_TOPIC,
    memoryPrompt: "",
    customInstructions: getCurrentCustomInstructions(),
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,

    mask: createEmptyMask(),
  };
}

const TEMPORARY_SESSION_INDEX = -1;

function isSavedSession(session: ChatSession) {
  return session.messages.length > 0;
}

function pruneEmptySessions(sessions: ChatSession[]) {
  return sessions.filter(isSavedSession);
}

function createSession(mask?: Mask): ChatSession {
  const session = createEmptySession();

  if (mask) {
    const config = useAppConfig.getState();
    const globalModelConfig = config.modelConfig;

    session.mask = {
      ...mask,
      modelConfig: {
        ...globalModelConfig,
        ...mask.modelConfig,
      },
      modelConfigMeta: {
        ...(config.modelConfigMeta ?? {}),
        ...(mask.modelConfigMeta ?? {}),
      },
    };
    session.topic = mask.name;
  }

  return session;
}

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce(
    (pre, cur) => pre + estimateTokenLength(getMessageTextContent(cur)),
    0,
  );
}

function fillTemplateWith(input: string, modelConfig: ModelConfig) {
  const cutoff =
    KnowledgeCutOffDate[modelConfig.model] ?? KnowledgeCutOffDate.default;
  // Find the model in the DEFAULT_MODELS array that matches the modelConfig.model
  const modelInfo = DEFAULT_MODELS.find((m) => m.name === modelConfig.model);

  var serviceProvider = "OpenAI";
  if (modelInfo) {
    // TODO: auto detect the providerName from the modelConfig.model

    // Directly use the providerName from the modelInfo
    serviceProvider = modelInfo.provider.providerName;
  }

  const vars = {
    ServiceProvider: serviceProvider,
    cutoff,
    model: modelConfig.model,
    time: new Date().toString(),
    lang: getLang(),
    input: input,
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

  // remove duplicate
  if (input.startsWith(output)) {
    output = "";
  }

  // must contains {{input}}
  const inputVar = "{{input}}";
  if (!output.includes(inputVar)) {
    output += "\n" + inputVar;
  }

  Object.entries(vars).forEach(([name, value]) => {
    const regex = new RegExp(`{{${name}}}`, "g");
    output = output.replace(regex, value.toString()); // Ensure value is a string
  });

  return output;
}

// 添加一个缓存变量来存储MCP状态和系统提示
let mcpCache: {
  enabled: boolean | null;
  initialized: boolean;
  retryAfter: number;
  systemPrompt: string;
  systemPromptLoaded: boolean;
  scopedSystemPrompts: Record<string, string>;
} = {
  enabled: null,
  initialized: false,
  retryAfter: 0,
  systemPrompt: "",
  systemPromptLoaded: false,
  scopedSystemPrompts: {},
};

// 修改getMcpSystemPrompt函数，只包含活跃状态的工具
async function getMcpSystemPrompt(
  forceRefresh = false,
  clientIds?: string[],
): Promise<string> {
  const scopedClientIds = clientIds?.filter(Boolean).sort() ?? [];
  const scopedKey = scopedClientIds.join(",");
  // 如果已有缓存且不强制刷新，直接返回
  if (!scopedKey && mcpCache.systemPromptLoaded && !forceRefresh) {
    return mcpCache.systemPrompt;
  }
  if (
    scopedKey &&
    Object.prototype.hasOwnProperty.call(
      mcpCache.scopedSystemPrompts,
      scopedKey,
    ) &&
    !forceRefresh
  ) {
    return mcpCache.scopedSystemPrompts[scopedKey];
  }

  const [tools, serverStates] = await Promise.all([
    getAllTools(),
    getMcpChatServerStates(),
  ]);
  const allowedClientIds =
    scopedClientIds.length > 0 ? new Set(scopedClientIds) : undefined;

  let toolsStr = "";
  let hasActiveTools = false;

  tools.forEach((i) => {
    // 跳过没有工具的客户端
    if (!i.tools) return;
    if (allowedClientIds && !allowedClientIds.has(i.clientId)) return;

    // 检查客户端状态，只包含活跃状态的客户端
    const serverState = serverStates[i.clientId];
    if (serverState && serverState.status === "active") {
      if (!allowedClientIds && serverState.chatDefaultEnabled === false) {
        return;
      }

      hasActiveTools = true;
      toolsStr += MCP_TOOLS_TEMPLATE.replace(
        "{{ clientId }}",
        i.clientId,
      ).replace(
        "{{ tools }}",
        i.tools.tools.map((p: object) => JSON.stringify(p, null, 2)).join("\n"),
      );
    }
  });

  // 如果没有活跃的工具，返回空字符串
  let prompt = hasActiveTools
    ? MCP_SYSTEM_TEMPLATE.replace("{{ MCP_TOOLS }}", toolsStr)
    : "";
  if (prompt && scopedClientIds.length === 1) {
    prompt = prompt.replaceAll("{clientId}", scopedClientIds[0]);
  }

  // 更新缓存
  if (scopedKey) {
    mcpCache.scopedSystemPrompts[scopedKey] = prompt;
  } else {
    mcpCache.systemPrompt = prompt;
    mcpCache.systemPromptLoaded = true;
  }
  return prompt;
}

async function checkMcpEnabledAndPreloadPrompt(): Promise<boolean> {
  if (mcpCache.enabled === null) {
    try {
      mcpCache.enabled = await isMcpEnabled();
    } catch {
      console.error("[MCP] failed to check availability");
      return false;
    }
  }

  if (!mcpCache.enabled) {
    return false;
  }

  if (!mcpCache.initialized && Date.now() >= mcpCache.retryAfter) {
    try {
      await initializeMcpSystem();
      mcpCache.initialized = true;
      mcpCache.retryAfter = 0;
    } catch {
      mcpCache.initialized = false;
      mcpCache.retryAfter = Date.now() + MCP_REINITIALIZATION_COOLDOWN_MS;
      console.error("[MCP] failed to initialize chat tools");
    }

    try {
      // A failed server must not hide tools from other clients that initialized.
      await getMcpSystemPrompt(true);
    } catch {
      console.error("[MCP] failed to load available chat tools");
    }
  }

  return true;
}

// 添加一个函数来重置MCP缓存（当配置变更时使用）
function resetMcpCache() {
  mcpCache = {
    enabled: null,
    initialized: false,
    retryAfter: 0,
    systemPrompt: "",
    systemPromptLoaded: false,
    scopedSystemPrompts: {},
  };
  // 立即开始预加载新的系统提示
  return checkMcpEnabledAndPreloadPrompt().catch(() => {
    console.error("[MCP] failed to reset the chat tool cache");
    return false;
  });
}

const DEFAULT_CHAT_STATE = {
  sessions: [] as ChatSession[],
  temporarySession: createEmptySession() as ChatSession | undefined,
  currentSessionIndex: TEMPORARY_SESSION_INDEX,
  lastInput: "",
  sessionListRevision: 0,
  messageProjectionRevision: 0,
};

function getSessionListSnapshot(session: ChatSession) {
  return {
    id: session.id,
    topic: session.topic,
    lastUpdate: session.lastUpdate,
    messageCount: session.messages.length,
    avatar: session.mask.avatar,
    model: session.mask.modelConfig.model,
  };
}

function hasSessionListSnapshotChanged(
  previous: ReturnType<typeof getSessionListSnapshot>,
  next: ReturnType<typeof getSessionListSnapshot>,
) {
  return Object.keys(previous).some(
    (key) =>
      previous[key as keyof typeof previous] !== next[key as keyof typeof next],
  );
}

export const useChatStore = createPersistStore(
  DEFAULT_CHAT_STATE,
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }

    const methods = {
      forkSession() {
        // 获取当前会话
        const currentSession = get().currentSession();
        if (!currentSession) return;
        if (currentSession.messages.length === 0) {
          get().newSession(currentSession.mask);
          return;
        }

        const newSession = createEmptySession();

        newSession.topic = currentSession.topic;
        newSession.customInstructions = currentSession.customInstructions;
        // 深拷贝消息
        newSession.messages = currentSession.messages.map((msg) => ({
          ...msg,
          id: nanoid(), // 生成新的消息 ID
        }));
        newSession.mask = {
          ...currentSession.mask,
          modelConfig: {
            ...currentSession.mask.modelConfig,
          },
          modelConfigMeta: {
            ...(currentSession.mask.modelConfigMeta ?? {}),
          },
        };

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [newSession, ...state.sessions],
          sessionListRevision: (state.sessionListRevision ?? 0) + 1,
          messageProjectionRevision: (state.messageProjectionRevision ?? 0) + 1,
        }));
      },

      clearSessions() {
        set(() => ({
          sessions: [],
          temporarySession: createEmptySession(),
          currentSessionIndex: TEMPORARY_SESSION_INDEX,
          sessionListRevision: (get().sessionListRevision ?? 0) + 1,
          messageProjectionRevision: (get().messageProjectionRevision ?? 0) + 1,
        }));
      },

      selectSession(index: number) {
        set({
          currentSessionIndex: index,
          temporarySession: undefined,
        });
      },

      moveSession(from: number, to: number) {
        set((state) => {
          const { sessions, currentSessionIndex: oldIndex } = state;

          // move the session
          const newSessions = [...sessions];
          const session = newSessions[from];
          newSessions.splice(from, 1);
          newSessions.splice(to, 0, session);

          // modify current session id
          let newIndex = oldIndex === from ? to : oldIndex;
          if (oldIndex > from && oldIndex <= to) {
            newIndex -= 1;
          } else if (oldIndex < from && oldIndex >= to) {
            newIndex += 1;
          }

          return {
            currentSessionIndex: newIndex,
            sessions: newSessions,
            sessionListRevision: (state.sessionListRevision ?? 0) + 1,
          };
        });
      },

      newSession(mask?: Mask) {
        const session = createSession(mask);
        set((state) => ({
          currentSessionIndex: TEMPORARY_SESSION_INDEX,
          temporarySession: session,
          sessions: pruneEmptySessions(state.sessions),
          sessionListRevision: (state.sessionListRevision ?? 0) + 1,
          messageProjectionRevision: (state.messageProjectionRevision ?? 0) + 1,
        }));
      },

      nextSession(delta: number) {
        const n = get().sessions.length;
        if (n === 0) {
          get().newSession();
          return;
        }
        const limit = (x: number) => (x + n) % n;
        const i =
          get().currentSessionIndex === TEMPORARY_SESSION_INDEX
            ? 0
            : get().currentSessionIndex;
        get().selectSession(limit(i + delta));
      },

      deleteSession(index: number) {
        if (index === TEMPORARY_SESSION_INDEX) {
          get().newSession();
          return;
        }

        const deletingLastSession = get().sessions.length === 1;
        const deletedSession = get().sessions.at(index);

        if (!deletedSession) return;

        const sessions = get().sessions.slice();
        sessions.splice(index, 1);

        const currentIndex = get().currentSessionIndex;
        let nextIndex = Math.min(
          currentIndex - Number(index < currentIndex),
          sessions.length - 1,
        );

        if (deletingLastSession) {
          nextIndex = TEMPORARY_SESSION_INDEX;
        }

        // for undo delete action
        const restoreState = {
          currentSessionIndex: get().currentSessionIndex,
          sessions: get().sessions.slice(),
        };

        set(() => ({
          currentSessionIndex: nextIndex,
          temporarySession: deletingLastSession
            ? createEmptySession()
            : get().temporarySession,
          sessions,
          sessionListRevision: (get().sessionListRevision ?? 0) + 1,
          messageProjectionRevision: (get().messageProjectionRevision ?? 0) + 1,
        }));

        showToast(
          Locale.Home.DeleteToast,
          {
            text: Locale.Home.Revert,
            onClick() {
              set((state) => ({
                ...restoreState,
                sessionListRevision: (state.sessionListRevision ?? 0) + 1,
                messageProjectionRevision:
                  (state.messageProjectionRevision ?? 0) + 1,
              }));
            },
          },
          5000,
        );
      },

      currentSession() {
        let index = get().currentSessionIndex;
        const sessions = get().sessions;

        if (index === TEMPORARY_SESSION_INDEX) {
          let session = get().temporarySession;
          if (!session) {
            session = createEmptySession();
            set(() => ({ temporarySession: session }));
          }
          return session;
        }

        if (sessions.length === 0) {
          const session = createEmptySession();
          set(() => ({
            currentSessionIndex: TEMPORARY_SESSION_INDEX,
            temporarySession: session,
          }));
          return session;
        }

        if (index < 0 || index >= sessions.length) {
          index = Math.min(sessions.length - 1, Math.max(0, index));
          set(() => ({ currentSessionIndex: index }));
        }

        const session = sessions[index];

        return session;
      },

      ensureCurrentSessionSaved() {
        const session = get().currentSession();
        refreshEmptySessionCustomInstructions(session);

        if (get().currentSessionIndex !== TEMPORARY_SESSION_INDEX) {
          return session;
        }

        set((state) => ({
          currentSessionIndex: 0,
          temporarySession: undefined,
          sessions: [session, ...pruneEmptySessions(state.sessions)],
          sessionListRevision: (state.sessionListRevision ?? 0) + 1,
          messageProjectionRevision: (state.messageProjectionRevision ?? 0) + 1,
        }));

        return session;
      },

      onNewMessage(message: ChatMessage, targetSession: ChatSession) {
        get().updateTargetSession(targetSession, (session) => {
          session.messages = session.messages.concat();
          session.lastUpdate = Date.now();
        });

        get().updateStat(message, targetSession);

        // 使用缓存的MCP状态进行检查
        if (mcpCache.enabled) {
          get().checkMcpJson(message, targetSession);
        }

        get().summarizeSession(false, targetSession);
      },

      async onUserInput(
        content: string,
        attachImages?: string[],
        isMcpResponse?: boolean,
        options?: {
          mcpClientIds?: string[];
          systemPrompt?: string;
          targetSession?: ChatSession;
        },
      ) {
        const session =
          options?.targetSession ?? get().ensureCurrentSessionSaved();
        const modelConfig = { ...session.mask.modelConfig };
        const requestPluginIds = [...(session.mask.plugin ?? [])];
        const openaiResponsesRecoveryPending = session.messages.some(
          (message) => message.openaiResponsesRecoveryPending === true,
        );
        const isOpenAIImageGeneration = isOpenAIImageGenerationModelConfig({
          model: modelConfig.model,
          providerName: modelConfig.providerName,
        });

        // MCP Response no need to fill template
        let mContent: string | MultimodalContent[] = isMcpResponse
          ? content
          : fillTemplateWith(content, modelConfig);

        if (!isMcpResponse && attachImages && attachImages.length > 0) {
          mContent = [
            ...(content ? [{ type: "text" as const, text: content }] : []),
            ...attachImages.map((url) => ({
              type: "image_url" as const,
              image_url: { url },
            })),
          ];
        }

        let userMessage: ChatMessage = createMessage({
          role: "user",
          content: mContent,
          isMcpResponse,
        });

        const botMessage: ChatMessage = createMessage({
          role: "assistant",
          content: isOpenAIImageGeneration
            ? getOpenAIImageGenerationProgressContent({
                model: modelConfig.model,
                phase: "preparing",
                copy: Locale.Chat.ImageGeneration.Progress,
              })
            : "",
          streaming: true,
          model: modelConfig.model,
        });

        const promptSession = {
          ...session,
          messages: session.messages.slice(),
          mask: {
            ...session.mask,
            context: session.mask.context.slice(),
            modelConfig: { ...modelConfig },
          },
        };
        const messageIndex = session.messages.length + 1;

        // save user's and bot's message
        get().updateTargetSession(session, (session) => {
          const savedUserMessage = {
            ...userMessage,
            content: mContent,
          };
          session.messages = session.messages.concat([
            savedUserMessage,
            botMessage,
          ]);
        });
        flushChatPersistence();

        const requestMessageId = botMessage.id ?? String(messageIndex);
        const preflightController = new AbortController();
        let activeController: AbortController | undefined;
        let activeAbortHandler: (() => void) | undefined;
        let activeAbortFallback: ReturnType<typeof setTimeout> | undefined;
        let requestSettled = false;
        let requestTerminal: "success" | "user-abort" | "error" | undefined;
        let streamUpdateCoalescer:
          | ReturnType<typeof createStreamUpdateCoalescer>
          | undefined;

        const cleanupRequest = () => {
          if (activeAbortFallback !== undefined) {
            clearTimeout(activeAbortFallback);
            activeAbortFallback = undefined;
          }
          preflightController.signal.removeEventListener(
            "abort",
            handlePreflightAbort,
          );
          if (activeController && activeAbortHandler) {
            activeController.signal.removeEventListener(
              "abort",
              activeAbortHandler,
            );
          }
          ChatControllerPool.remove(session.id, requestMessageId);
        };

        const notifyRequestMutation = () => {
          get().updateTargetSession(session, (session) => {
            session.messages = session.messages.concat();
          });
          flushChatPersistence();
        };

        const applyResponseMetadata = (metadata?: any) => {
          if (!metadata) return false;
          let changed = false;
          for (const field of [
            "openaiResponseId",
            "openaiResponseStored",
            "openaiResponsesOutput",
            "openaiResponsesRecoveryPending",
          ] as const) {
            if (Object.prototype.hasOwnProperty.call(metadata, field)) {
              botMessage[field] = metadata[field];
              changed = true;
            }
          }
          return changed;
        };

        const settleRequestFailure = (
          error: unknown,
          metadata?: any,
          userAborted = false,
        ) => {
          const metadataChanged = applyResponseMetadata(metadata);
          if (requestSettled) {
            if (metadataChanged) notifyRequestMutation();
            return;
          }
          requestSettled = true;
          requestTerminal = userAborted ? "user-abort" : "error";
          streamUpdateCoalescer?.cancel();
          cleanupRequest();

          if (!userAborted) {
            const detail = error instanceof Error ? error.message : undefined;
            const publicMessage = getPublicUpstreamErrorMessage({
              fallback: Locale.Error.RequestFailed(),
              detail,
            });
            botMessage.content +=
              "\n\n" +
              prettyObject({
                error: true,
                message: publicMessage,
              });
          } else if (isOpenAIImageGeneration) {
            botMessage.content = Locale.Chat.ImageGeneration.Progress.Cancelled;
          }
          botMessage.streaming = false;
          userMessage.isError = !userAborted;
          botMessage.isError = !userAborted;
          get().updateTargetSession(session, (session) => {
            const savedUserMessage = session.messages.find(
              (message) => message.id === userMessage.id,
            );
            if (savedUserMessage) {
              savedUserMessage.isError = !userAborted;
            }
            session.messages = session.messages.concat();
          });
          flushChatPersistence();
        };

        function handlePreflightAbort() {
          const reason = preflightController.signal.reason;
          settleRequestFailure(
            reason instanceof Error
              ? reason
              : new DOMException("The request was aborted", "AbortError"),
            undefined,
            true,
          );
        }

        preflightController.signal.addEventListener(
          "abort",
          handlePreflightAbort,
          { once: true },
        );
        ChatControllerPool.addController(
          session.id,
          requestMessageId,
          preflightController,
        );

        // get recent messages after the visible messages are queued
        let recentMessages: ChatMessage[];
        try {
          recentMessages = await get().getMessagesWithMemory({
            ...options,
            session: promptSession,
            pendingUserMessage: userMessage,
          });
        } catch (error) {
          settleRequestFailure(error);
          console.error("[Chat] failed to prepare messages");
          return;
        }
        if (requestSettled || preflightController.signal.aborted) return;
        const sendMessages = recentMessages.concat(userMessage);

        try {
          const { getClientApi } = await import("../client/api");
          if (requestSettled || preflightController.signal.aborted) return;
          const api: ClientApi = getClientApi(modelConfig.providerName);
          streamUpdateCoalescer = createStreamUpdateCoalescer(
            () => {
              get().updateTargetSession(
                session,
                (session) => {
                  session.messages = session.messages.concat();
                },
                { renderScope: "tail", tailMessageId: requestMessageId },
              );
            },
            () => getStreamUpdateInterval(botMessage.content.length),
          );
          const request = api.llm.chat({
            messages: sendMessages,
            config: { ...modelConfig, stream: true },
            allowTools: true,
            pluginIds: requestPluginIds,
            openaiResponsesRecoveryPending,
            onUpdate(message) {
              if (requestSettled) return;
              botMessage.streaming = true;
              if (message) {
                botMessage.content = message;
              }
              streamUpdateCoalescer.schedule();
            },
            onFinish(message, _responseRes, metadata) {
              if (requestSettled) {
                const metadataChanged = applyResponseMetadata(metadata);
                if (requestTerminal === "user-abort") {
                  streamUpdateCoalescer?.cancel();
                  if (message) botMessage.content = message;
                  botMessage.streaming = false;
                  botMessage.date = new Date().toLocaleString();
                  notifyRequestMutation();
                } else if (metadataChanged) {
                  notifyRequestMutation();
                }
                cleanupRequest();
                return;
              }
              requestSettled = true;
              requestTerminal = "success";
              streamUpdateCoalescer.cancel();
              botMessage.streaming = false;
              try {
                const isRecoveryPending =
                  metadata?.openaiResponsesRecoveryPending === true;
                if (
                  !isRecoveryPending &&
                  Array.isArray(metadata?.openaiResponsesOutput) &&
                  isOpenAIGpt56ModelConfig(modelConfig)
                ) {
                  get().updateTargetSession(session, (session) => {
                    session.messages.forEach((message) => {
                      if (message.openaiResponsesRecoveryPending) {
                        message.openaiResponsesRecoveryPending = false;
                      }
                    });
                  });
                }
                if (message || metadata?.openaiResponsesOutput?.length) {
                  botMessage.content = message;
                  applyResponseMetadata(metadata);
                  botMessage.date = new Date().toLocaleString();
                  get().onNewMessage(botMessage, session);
                } else {
                  get().updateTargetSession(session, (session) => {
                    session.messages = session.messages.concat();
                  });
                }
              } finally {
                cleanupRequest();
                flushChatPersistence();
              }
            },
            onBeforeTool(tool: ChatMessageTool) {
              if (requestSettled) return;
              streamUpdateCoalescer.cancel();
              (botMessage.tools = botMessage?.tools || []).push(tool);
              get().updateTargetSession(session, (session) => {
                session.messages = session.messages.concat();
              });
              flushChatPersistence();
            },
            onAfterTool(tool: ChatMessageTool) {
              if (requestSettled) return;
              streamUpdateCoalescer.cancel();
              botMessage?.tools?.forEach((t, i, tools) => {
                if (tool.id == t.id) {
                  tools[i] = { ...tool };
                }
              });
              get().updateTargetSession(session, (session) => {
                session.messages = session.messages.concat();
              });
              flushChatPersistence();
            },
            onError(error, metadata) {
              const reason = activeController?.signal.reason;
              const controllerHasAbortReason =
                activeController?.signal.aborted === true;
              const isAborted = controllerHasAbortReason
                ? !(reason instanceof Error) || reason.name === "AbortError"
                : error?.name === "AbortError";
              settleRequestFailure(error, metadata, isAborted);
              if (!isAborted) {
                console.error("[Chat] request failed");
              }
            },
            onController(controller) {
              if (requestSettled || preflightController.signal.aborted) {
                controller.abort(
                  preflightController.signal.reason ??
                    new DOMException("The request was aborted", "AbortError"),
                );
                return;
              }
              preflightController.signal.removeEventListener(
                "abort",
                handlePreflightAbort,
              );
              activeController = controller;
              activeAbortHandler = () => {
                if (activeAbortFallback !== undefined) {
                  clearTimeout(activeAbortFallback);
                }
                const reason = controller.signal.reason;
                activeAbortFallback = setTimeout(() => {
                  activeAbortFallback = undefined;
                  const userAborted =
                    !(reason instanceof Error) || reason.name === "AbortError";
                  settleRequestFailure(
                    reason instanceof Error
                      ? reason
                      : new DOMException(
                          "The request was aborted",
                          "AbortError",
                        ),
                    undefined,
                    userAborted,
                  );
                }, 0);
              };
              controller.signal.addEventListener("abort", activeAbortHandler, {
                once: true,
              });
              if (controller.signal.aborted) {
                activeAbortHandler();
                return;
              }
              ChatControllerPool.addController(
                session.id,
                requestMessageId,
                controller,
              );
            },
          });
          void Promise.resolve(request).catch((error) => {
            settleRequestFailure(error);
          });
        } catch (error) {
          settleRequestFailure(error);
        }
      },

      getMemoryPrompt(targetSession?: ChatSession) {
        const session = targetSession ?? get().currentSession();

        if (session.memoryPrompt.length) {
          return {
            role: "system",
            content: Locale.Store.Prompt.History(session.memoryPrompt),
            date: "",
          } as ChatMessage;
        }
      },

      async getMessagesWithMemory(options?: {
        mcpClientIds?: string[];
        systemPrompt?: string;
        session?: ChatSession;
        pendingUserMessage?: ChatMessage;
      }) {
        // 每次发送都允许已失败的 MCP 在冷却后恢复，同时保持聊天可用。
        await checkMcpEnabledAndPreloadPrompt();

        const session = options?.session ?? get().currentSession();
        const modelConfig = session.mask.modelConfig;
        const isOpenAIGpt56 = isOpenAIGpt56ModelConfig({
          model: modelConfig.model,
          providerName: modelConfig.providerName,
        });
        const preserveAllReasoningTurns =
          isOpenAIGpt56 && modelConfig.reasoningContext === "all_turns";
        const clearContextIndex = session.clearContextIndex ?? 0;
        const messages = session.messages.slice();
        const totalMessageCount = session.messages.length;

        // in-context prompts
        const contextPrompts = session.mask.context.slice();

        // system prompts, to get close to OpenAI Web ChatGPT
        const shouldInjectSystemPrompts =
          modelConfig.enableInjectSystemPrompts &&
          (session.mask.modelConfig.model.startsWith("gpt-") ||
            session.mask.modelConfig.model.startsWith("chatgpt-"));

        let mcpSystemPrompt = "";
        if (mcpCache.enabled) {
          try {
            mcpSystemPrompt = await getMcpSystemPrompt(
              false,
              options?.mcpClientIds,
            );
          } catch {
            console.error("[MCP] failed to resolve chat tools");
          }
        }
        const extraSystemPrompt = options?.systemPrompt?.trim() ?? "";
        const composedMcpSystemPrompt = [mcpSystemPrompt, extraSystemPrompt]
          .filter(Boolean)
          .join("\n\n");
        const customInstructions = session.customInstructions?.trim() ?? "";

        var systemPrompts: ChatMessage[] = [];

        // 修改这部分逻辑，确保不会发送空的系统提示词
        if (shouldInjectSystemPrompts) {
          const defaultSystemPrompt = fillTemplateWith("", {
            ...modelConfig,
            template: DEFAULT_SYSTEM_TEMPLATE,
          });

          // 只有当有默认系统提示词或MCP系统提示词时才添加系统消息
          if (defaultSystemPrompt || composedMcpSystemPrompt) {
            systemPrompts = [
              createMessage({
                role: "system",
                content: defaultSystemPrompt + composedMcpSystemPrompt,
              }),
            ];
          }
        } else if (composedMcpSystemPrompt) {
          // 只有当MCP启用且有MCP系统提示词时才添加系统消息
          systemPrompts = [
            createMessage({
              role: "system",
              content: composedMcpSystemPrompt,
            }),
          ];
        }

        const customInstructionPrompts = customInstructions
          ? [
              createMessage({
                role: "system",
                content: customInstructions,
              }),
            ]
          : [];

        const memoryPrompt = session.memoryPrompt.length
          ? ({
              role: "system",
              content: Locale.Store.Prompt.History(session.memoryPrompt),
              date: "",
            } as ChatMessage)
          : undefined;
        // long term memory
        const shouldSendLongTermMemory =
          modelConfig.sendMemory &&
          session.memoryPrompt &&
          session.memoryPrompt.length > 0 &&
          session.lastSummarizeIndex > clearContextIndex;
        const longTermMemoryPrompts =
          !preserveAllReasoningTurns && shouldSendLongTermMemory && memoryPrompt
            ? [memoryPrompt]
            : [];
        const longTermMemoryStartIndex = session.lastSummarizeIndex;

        // short term memory
        const shortTermMemoryStartIndex = Math.max(
          0,
          totalMessageCount - modelConfig.historyMessageCount,
        );

        // lets concat send messages, including 4 parts:
        // 0. system prompt: to get close to OpenAI Web ChatGPT
        // 1. long term memory: summarized memory messages
        // 2. pre-defined in-context prompts
        // 3. short term memory: latest n messages
        // 4. newest input message
        const memoryStartIndex = shouldSendLongTermMemory
          ? Math.min(longTermMemoryStartIndex, shortTermMemoryStartIndex)
          : shortTermMemoryStartIndex;
        // and if user has cleared history messages, we should exclude the memory too.
        const contextStartIndex = preserveAllReasoningTurns
          ? clearContextIndex
          : Math.max(clearContextIndex, memoryStartIndex);
        const maxTokenThreshold = modelConfig.max_output_tokens;
        const requiredReplayMessageIndexes = new Set<number>();
        for (
          let i = totalMessageCount - 1;
          isOpenAIGpt56 && i >= clearContextIndex;
          i -= 1
        ) {
          const message = messages[i];
          if (
            message?.role !== "assistant" ||
            !message.openaiResponsesRecoveryPending ||
            !hasClosedResponsesFunctionTrace(message)
          ) {
            continue;
          }
          requiredReplayMessageIndexes.add(i);
          if (i - 1 >= clearContextIndex && messages[i - 1]?.role === "user") {
            requiredReplayMessageIndexes.add(i - 1);
          }
        }

        const isEligibleHistoryMessage = (i: number) => {
          const msg = messages[i];
          const isReplayableErrorUser =
            preserveAllReasoningTurns &&
            msg?.isError &&
            msg.role === "user" &&
            messages[i + 1]?.role === "assistant" &&
            messages[i + 1]?.isError &&
            !!messages[i + 1]?.openaiResponsesOutput?.length;
          const isRequiredReplayMessage = requiredReplayMessageIndexes.has(i);
          if (
            !msg ||
            (msg.isError &&
              !(
                preserveAllReasoningTurns && msg.openaiResponsesOutput?.length
              ) &&
              !isReplayableErrorUser &&
              !isRequiredReplayMessage)
          ) {
            return false;
          }
          return true;
        };

        let recentHistoryMessages: ChatMessage[];
        if (preserveAllReasoningTurns) {
          const segments: Array<{
            messages: ChatMessage[];
            pinned: boolean;
          }> = [];
          let currentSegment:
            | { messages: ChatMessage[]; pinned: boolean }
            | undefined;
          for (let i = contextStartIndex; i < totalMessageCount; i += 1) {
            const msg = messages[i];
            if (msg?.role === "user" || !currentSegment) {
              currentSegment = { messages: [], pinned: false };
              segments.push(currentSegment);
            }
            if (!isEligibleHistoryMessage(i)) continue;
            currentSegment.messages.push(msg);
            currentSegment.pinned ||= requiredReplayMessageIndexes.has(i);
          }

          recentHistoryMessages = selectOpenAIAllTurnsHistory({
            model: modelConfig.model,
            maxOutputTokens: modelConfig.max_output_tokens,
            fixedMessages: [
              ...systemPrompts,
              ...customInstructionPrompts,
              ...contextPrompts,
              ...(options?.pendingUserMessage
                ? [options.pendingUserMessage]
                : []),
            ],
            segments: segments.filter((segment) => segment.messages.length > 0),
          });
        } else {
          // get recent messages as much as possible
          const selectedMessageIndexes = new Set<number>();
          for (
            let i = totalMessageCount - 1, tokenCount = 0;
            i >= contextStartIndex && tokenCount < maxTokenThreshold;
            i -= 1
          ) {
            if (!isEligibleHistoryMessage(i)) continue;
            const msg = messages[i];
            tokenCount += estimateTokenLength(getMessageTextContent(msg));
            selectedMessageIndexes.add(i);
          }
          requiredReplayMessageIndexes.forEach((index) =>
            selectedMessageIndexes.add(index),
          );
          recentHistoryMessages = Array.from(selectedMessageIndexes)
            .sort((left, right) => left - right)
            .map((index) => messages[index]);
        }
        // concat all messages
        const recentMessages = [
          ...systemPrompts,
          ...customInstructionPrompts,
          ...longTermMemoryPrompts,
          ...contextPrompts,
          ...recentHistoryMessages,
        ];

        return recentMessages;
      },

      updateMessage(
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: ChatMessage) => void,
      ) {
        const sessions = get().sessions;
        const session = sessions.at(sessionIndex);
        const messages = session?.messages;
        updater(messages?.at(messageIndex));
        set((state) => ({
          sessions,
          messageProjectionRevision: (state.messageProjectionRevision ?? 0) + 1,
        }));
      },

      resetSession(session: ChatSession) {
        get().updateTargetSession(session, (session) => {
          session.messages = [];
          session.memoryPrompt = "";
        });
      },

      async summarizeSession(
        refreshTitle: boolean = false,
        targetSession: ChatSession,
      ) {
        const config = useAppConfig.getState();
        const session = targetSession;
        const modelConfig = session.mask.modelConfig;
        // Image generation prompts should not be summarized as text chat.
        if (
          isOpenAIImageGenerationModelConfig({
            model: modelConfig.model,
            providerName: modelConfig.providerName,
          })
        ) {
          return;
        }

        const accessConfig = useAccessStore.getState();
        const summaryModelCatalog = collectModelsWithDefaultModelAndPolicy(
          config.models,
          config.customModels || accessConfig.customModels || "",
          accessConfig.defaultModel,
          accessConfig.allowedModels,
        );
        const availableSummaryModelRefs = new Set(
          summaryModelCatalog
            .filter((model) => model.available)
            .map((model) => `${model.name}@${model.provider?.providerName}`),
        );
        const summaryRequestConfig = resolveSummaryRequestConfig({
          targetModelConfig: modelConfig,
          fallbackModelConfig: config.modelConfig,
          publicConfig: config.serverConfigSnapshot,
          availableModelRefs: availableSummaryModelRefs,
        });
        const { model, providerName, reasoningEffort, max_output_tokens } =
          summaryRequestConfig;
        const summaryModelConfig = {
          ...modelConfig,
          model,
          providerName,
          reasoningEffort,
          max_output_tokens,
        };
        const { getClientApi } = await import("../client/api");
        const api: ClientApi = getClientApi(providerName as ServiceProvider);

        // remove error messages if any
        // const messages = session.messages;
        const messages = session.messages.map((v) => ({
          ...v,
          content:
            v.role === "assistant"
              ? getMessageTextContentWithoutThinking(v)
              : getMessageTextContent(v),
        }));

        // should summarize topic after chating more than 50 words
        const SUMMARIZE_MIN_LEN = 50;
        if (
          (config.enableAutoGenerateTitle &&
            session.topic === DEFAULT_TOPIC &&
            countMessages(messages) >= SUMMARIZE_MIN_LEN) ||
          refreshTitle
        ) {
          const startIndex = Math.max(
            0,
            messages.length - modelConfig.historyMessageCount,
          );
          const topicMessages = messages
            .slice(
              startIndex < messages.length ? startIndex : messages.length - 1,
              messages.length,
            )
            .concat(
              createMessage({
                role: "user",
                content: Locale.Store.Prompt.Topic,
              }),
            );
          api.llm.chat({
            messages: topicMessages,
            config: {
              ...summaryModelConfig,
              stream: false,
            },
            onFinish(message, responseRes) {
              if (responseRes?.status === 200) {
                get().updateTargetSession(
                  session,
                  (session) =>
                    (session.topic =
                      message.length > 0 ? trimTopic(message) : DEFAULT_TOPIC),
                );
              }
            },
          });
        }
        const summarizeIndex = Math.max(
          session.lastSummarizeIndex,
          session.clearContextIndex ?? 0,
        );
        let toBeSummarizedMsgs = messages
          .filter((msg) => !msg.isError)
          .slice(summarizeIndex);

        const historyMsgLength = countMessages(toBeSummarizedMsgs);
        const summaryOutputBudget =
          typeof summaryModelConfig.max_output_tokens === "number" &&
          summaryModelConfig.max_output_tokens > 0
            ? summaryModelConfig.max_output_tokens
            : 4000;

        if (historyMsgLength > summaryOutputBudget) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - modelConfig.historyMessageCount),
          );
        }
        const memoryPrompt = get().getMemoryPrompt(session);
        if (memoryPrompt) {
          // add memory prompt
          toBeSummarizedMsgs.unshift(memoryPrompt);
        }

        const lastSummarizeIndex = session.messages.length;

        if (
          historyMsgLength > modelConfig.compressMessageLengthThreshold &&
          modelConfig.sendMemory
        ) {
          api.llm.chat({
            messages: toBeSummarizedMsgs.concat(
              createMessage({
                role: "system",
                content: Locale.Store.Prompt.Summarize,
                date: "",
              }),
            ),
            config: {
              ...summaryModelConfig,
              stream: true,
            },
            onUpdate(message) {
              session.memoryPrompt = message;
            },
            onFinish(message, responseRes) {
              if (responseRes?.status === 200) {
                get().updateTargetSession(session, (session) => {
                  session.lastSummarizeIndex = lastSummarizeIndex;
                  session.memoryPrompt = message; // Update the memory prompt for stored it in local storage
                });
              }
            },
            onError() {
              console.error("[Summarize] request failed");
            },
          });
        }
      },

      updateStat(message: ChatMessage, session: ChatSession) {
        get().updateTargetSession(session, (session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },
      updateTargetSession(
        targetSession: ChatSession,
        updater: (session: ChatSession) => void,
        options?: { renderScope?: "tail"; tailMessageId?: string },
      ) {
        const temporarySession = get().temporarySession;
        if (temporarySession?.id === targetSession.id) {
          updater(temporarySession);
          const isVerifiedTailUpdate =
            options?.renderScope === "tail" &&
            options.tailMessageId !== undefined &&
            temporarySession.messages.at(-1)?.id === options.tailMessageId;
          set((state) => ({
            temporarySession,
            messageProjectionRevision: isVerifiedTailUpdate
              ? state.messageProjectionRevision
              : (state.messageProjectionRevision ?? 0) + 1,
          }));
          return;
        }

        const sessions = get().sessions;
        const index = sessions.findIndex((s) => s.id === targetSession.id);
        if (index < 0) return;
        const previousListSnapshot = getSessionListSnapshot(sessions[index]);
        updater(sessions[index]);
        const isVerifiedTailUpdate =
          options?.renderScope === "tail" &&
          options.tailMessageId !== undefined &&
          sessions[index].messages.at(-1)?.id === options.tailMessageId;
        const listMetadataChanged = hasSessionListSnapshotChanged(
          previousListSnapshot,
          getSessionListSnapshot(sessions[index]),
        );
        set((state) => ({
          sessions,
          sessionListRevision: listMetadataChanged
            ? (state.sessionListRevision ?? 0) + 1
            : state.sessionListRevision,
          messageProjectionRevision: isVerifiedTailUpdate
            ? state.messageProjectionRevision
            : (state.messageProjectionRevision ?? 0) + 1,
        }));
      },
      async clearAllData() {
        chatPersistStorage.suspendWrites(StoreKey.Chat);
        ChatControllerPool.stopAll();
        await chatPersistStorage.removeItem(StoreKey.Chat);
        await indexedDBStorage.clear();
        localStorage.clear();
        location.reload();
      },
      setLastInput(lastInput: string) {
        set({
          lastInput,
        });
      },
      /** check if the message contains MCP JSON and execute the MCP action */
      checkMcpJson(message: ChatMessage, targetSession?: ChatSession) {
        // 直接使用缓存的MCP状态
        if (!mcpCache.enabled) return;

        const content = getMessageTextContent(message);
        if (hasMcpJsonStart(content)) {
          const actionSession = targetSession ?? get().currentSession();
          const settleMcpRequestFailure = () => {
            const failureMessage = formatFailedMcpRequestForChat();
            get().updateTargetSession(actionSession, (session) => {
              const targetMessage = session.messages.find(
                (item) => item.id === message.id,
              );
              if (targetMessage) {
                targetMessage.content = failureMessage;
                targetMessage.streaming = false;
                targetMessage.isError = true;
                targetMessage.date = new Date().toLocaleString();
              }
              session.messages = session.messages.concat();
              session.lastUpdate = Date.now();
            });
            flushChatPersistence();
            showToast(Locale.Mcp.Chat.ToolFailure);
          };

          if (!isMcpJson(content)) {
            console.error("[MCP] received an incomplete tool message");
            settleMcpRequestFailure();
            return;
          }

          try {
            const mcpRequest = extractMcpJson(content);
            if (mcpRequest) {
              executeMcpAction(mcpRequest.clientId, mcpRequest.mcp)
                .then(async (result) => {
                  const formattedResult = formatMcpToolResultForChat(
                    mcpRequest.clientId,
                    result,
                  );
                  get().onUserInput(formattedResult, [], true, {
                    targetSession: actionSession,
                  });
                })
                .catch(() => {
                  settleMcpRequestFailure();
                });
            }
          } catch {
            console.error("[MCP] failed to process a tool message");
            settleMcpRequestFailure();
          }
        }
      },
      // 在应用初始化时检查MCP状态
      async initMcp() {
        return await checkMcpEnabledAndPreloadPrompt();
      },
      // 添加一个方法用于在MCP配置变更时重置缓存
      resetMcpCache() {
        return resetMcpCache();
      },
    };

    return methods;
  },
  {
    name: StoreKey.Chat,
    storage: chatPersistStorage,
    version: 3.6,
    partialize(state) {
      const {
        temporarySession,
        sessionListRevision,
        messageProjectionRevision,
        ...persistedState
      } = state as any;
      const sessions = pruneEmptySessions(persistedState.sessions ?? []);
      const currentSessionIndex =
        typeof persistedState.currentSessionIndex === "number"
          ? persistedState.currentSessionIndex
          : 0;
      return {
        ...persistedState,
        currentSessionIndex:
          currentSessionIndex === TEMPORARY_SESSION_INDEX ||
          sessions.length === 0
            ? 0
            : Math.min(currentSessionIndex, sessions.length - 1),
        sessions,
      };
    },
    migrate(persistedState, version) {
      const state = persistedState as any;
      const newState = JSON.parse(
        JSON.stringify(state),
      ) as typeof DEFAULT_CHAT_STATE;

      if (version < 2) {
        newState.sessions = [];

        const oldSessions = state.sessions;
        for (const oldSession of oldSessions) {
          const newSession = createEmptySession();
          newSession.topic = oldSession.topic;
          newSession.messages = [...oldSession.messages];
          newSession.mask.modelConfig.sendMemory = true;
          newSession.mask.modelConfig.historyMessageCount = 4;
          newSession.mask.modelConfig.compressMessageLengthThreshold = 1000;
          newState.sessions.push(newSession);
        }
      }

      if (version < 3) {
        // migrate id to nanoid
        newState.sessions.forEach((s) => {
          s.id = nanoid();
          s.messages.forEach((m) => (m.id = nanoid()));
        });
      }

      // Enable `enableInjectSystemPrompts` attribute for old sessions.
      // Resolve issue of old sessions not automatically enabling.
      if (version < 3.1) {
        newState.sessions.forEach((s) => {
          if (
            // Exclude those already set by user
            !s.mask.modelConfig.hasOwnProperty("enableInjectSystemPrompts")
          ) {
            // Because users may have changed this configuration,
            // the user's current configuration is used instead of the default
            const config = useAppConfig.getState();
            s.mask.modelConfig.enableInjectSystemPrompts =
              config.modelConfig.enableInjectSystemPrompts;
          }
        });
      }

      // add default summarize model for every session
      if (version < 3.2) {
        newState.sessions.forEach((s) => {
          const config = useAppConfig.getState();
          s.mask.modelConfig.compressModel = config.modelConfig.compressModel;
          s.mask.modelConfig.compressProviderName =
            config.modelConfig.compressProviderName;
        });
      }
      // revert default summarize model for every session
      if (version < 3.3) {
        newState.sessions.forEach((s) => {
          const config = useAppConfig.getState();
          s.mask.modelConfig.compressModel = "";
          s.mask.modelConfig.compressProviderName = "";
        });
      }

      if (version < 3.4) {
        newState.sessions = pruneEmptySessions(newState.sessions);
        if (newState.sessions.length === 0) {
          newState.currentSessionIndex = TEMPORARY_SESSION_INDEX;
          newState.temporarySession = createEmptySession();
        } else {
          newState.currentSessionIndex = Math.min(
            Math.max(0, newState.currentSessionIndex ?? 0),
            newState.sessions.length - 1,
          );
          newState.temporarySession = undefined;
        }
      }

      if (version < 3.5) {
        newState.sessions.forEach((session) => {
          const modelConfig = session.mask?.modelConfig as
            | (ModelConfig & { max_tokens?: number })
            | undefined;
          if (!modelConfig) return;
          if (typeof modelConfig.max_output_tokens !== "number") {
            modelConfig.max_output_tokens =
              typeof modelConfig.max_tokens === "number"
                ? modelConfig.max_tokens
                : useAppConfig.getState().modelConfig.max_output_tokens;
          }
          delete modelConfig.max_tokens;
        });
      }

      if (version < 3.6) {
        const config = useAppConfig.getState();
        newState.sessions.forEach((session) => {
          session.mask = migrateLegacyBuiltinMask(
            session.mask,
            config.modelConfig,
            config.modelConfigMeta,
          );
        });
      }

      return newState as any;
    },
  },
);

registerChatStore(useChatStore);
