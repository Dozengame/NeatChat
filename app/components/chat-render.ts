import type { ChatMessage } from "../store";
import { getMessageTextContent } from "../utils";
import { deepClone } from "../utils/clone";
import { hasMcpJsonStart, isMcpJson, tryExtractMcpJson } from "../mcp/utils";
import {
  formatFailedMcpRequestForChat,
  formatJimengMcpRequestForChat,
  formatPendingMcpRequestForChat,
  hasJimengDisplayableMedia,
  mergeJimengProgressWithResult,
  mergeJimengResultIntoReply,
} from "../mcp/display";

export type RenderMessage = ChatMessage & { preview?: boolean };

export function createPinnedContextMessage(
  message: ChatMessage,
  nextId: string,
): ChatMessage {
  return {
    ...deepClone(message),
    id: nextId,
  };
}

export function getMessageRenderIdentity(
  message: RenderMessage,
  absoluteIndex: number,
  contextLength: number,
) {
  const source = absoluteIndex < contextLength ? "context" : "session";
  return `${source}:${message.id ?? absoluteIndex}`;
}

export function findMessageForRenderSource(
  contextMessages: ChatMessage[],
  sessionMessages: ChatMessage[],
  messageId: string,
  isContext: boolean,
) {
  return (isContext ? contextMessages : sessionMessages).find(
    (message) => message.id === messageId,
  );
}

type VisibleMessageProjectionState = {
  visibleMessages: RenderMessage[];
  pendingJimengResult?: string;
  pendingJimengProgressIndex?: number;
};

function createProjectionState(): VisibleMessageProjectionState {
  return { visibleMessages: [] };
}

function cloneProjectionState(
  state: VisibleMessageProjectionState,
): VisibleMessageProjectionState {
  return {
    ...state,
    visibleMessages: state.visibleMessages.slice(),
  };
}

function projectMessage(
  state: VisibleMessageProjectionState,
  message: RenderMessage,
) {
  const textContent = getMessageTextContent(message);

  if (message.isMcpResponse) {
    if (state.pendingJimengProgressIndex !== undefined) {
      state.visibleMessages[state.pendingJimengProgressIndex] = {
        ...state.visibleMessages[state.pendingJimengProgressIndex],
        content: mergeJimengProgressWithResult(
          getMessageTextContent(
            state.visibleMessages[state.pendingJimengProgressIndex],
          ),
          textContent,
          { includeMedia: false },
        ),
      };
      state.pendingJimengResult = textContent;
      return;
    }

    if (hasJimengDisplayableMedia(textContent)) {
      state.pendingJimengResult = textContent;
    }
    return;
  }

  if (message.role === "assistant" && isMcpJson(textContent)) {
    const jimengProgress = formatJimengMcpRequestForChat(textContent);
    if (jimengProgress) {
      state.pendingJimengProgressIndex = state.visibleMessages.length;
      state.visibleMessages.push({
        ...message,
        content: jimengProgress,
      });
    } else if (!tryExtractMcpJson(textContent)) {
      state.visibleMessages.push({
        ...message,
        content: formatFailedMcpRequestForChat(),
        streaming: false,
        isError: true,
      });
    }
    return;
  }

  if (message.role === "assistant" && message.streaming) {
    const pendingMcpProgress = formatPendingMcpRequestForChat(textContent);
    if (pendingMcpProgress) {
      state.visibleMessages.push({
        ...message,
        content: pendingMcpProgress,
      });
      return;
    }
  }

  if (
    message.role === "assistant" &&
    !message.streaming &&
    hasMcpJsonStart(textContent)
  ) {
    state.visibleMessages.push({
      ...message,
      content: formatFailedMcpRequestForChat(),
      streaming: false,
      isError: true,
    });
    return;
  }

  if (message.role === "assistant" && state.pendingJimengResult) {
    const mergedContent = mergeJimengResultIntoReply(
      textContent,
      state.pendingJimengResult,
    );
    state.pendingJimengResult = undefined;
    state.pendingJimengProgressIndex = undefined;

    if (mergedContent !== textContent) {
      state.visibleMessages.push({
        ...message,
        content: mergedContent,
      });
      return;
    }
  }

  state.visibleMessages.push(message);
}

function finalizeProjection(state: VisibleMessageProjectionState) {
  const visibleMessages = state.visibleMessages;

  if (
    state.pendingJimengProgressIndex !== undefined &&
    state.pendingJimengResult !== undefined
  ) {
    visibleMessages[state.pendingJimengProgressIndex] = {
      ...visibleMessages[state.pendingJimengProgressIndex],
      content: mergeJimengProgressWithResult(
        getMessageTextContent(
          visibleMessages[state.pendingJimengProgressIndex],
        ),
        state.pendingJimengResult,
        { includeMedia: true },
      ),
    };
  }

  return visibleMessages;
}

export function getVisibleChatMessages(messages: RenderMessage[]) {
  const state = createProjectionState();
  messages.forEach((message) => projectMessage(state, message));
  return finalizeProjection(state);
}

export function createVisibleChatMessagesProjector() {
  let cachedRevision: number | undefined;
  let cachedMessageCount = -1;
  let cachedFirstMessage: RenderMessage | undefined;
  let cachedPrefixLastMessage: RenderMessage | undefined;
  let cachedPrefixState = createProjectionState();

  return (messages: RenderMessage[], revision: number) => {
    const prefixLength = Math.max(0, messages.length - 1);
    const canReusePrefix =
      revision === cachedRevision &&
      messages.length === cachedMessageCount &&
      (prefixLength === 0 ||
        (messages[0] === cachedFirstMessage &&
          messages[prefixLength - 1] === cachedPrefixLastMessage));

    if (!canReusePrefix) {
      cachedPrefixState = createProjectionState();
      for (let index = 0; index < prefixLength; index += 1) {
        projectMessage(cachedPrefixState, messages[index]);
      }
      cachedRevision = revision;
      cachedMessageCount = messages.length;
      cachedFirstMessage = messages[0];
      cachedPrefixLastMessage = messages[prefixLength - 1];
    }

    const state = cloneProjectionState(cachedPrefixState);
    const tailMessage = messages.at(-1);
    if (tailMessage) {
      projectMessage(state, tailMessage);
    }
    return finalizeProjection(state);
  };
}

export function shouldRenderLoadingPreview(
  messages: RenderMessage[],
  isLoading: boolean,
) {
  if (!isLoading) {
    return false;
  }

  return !messages.some(
    (message) =>
      message.role === "assistant" && message.streaming && !message.preview,
  );
}
