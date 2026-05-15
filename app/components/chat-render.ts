import type { ChatMessage } from "../store";
import { getMessageTextContent } from "../utils";
import { isMcpJson } from "../mcp/utils";
import {
  formatJimengMcpRequestForChat,
  formatPendingMcpRequestForChat,
  hasJimengDisplayableImage,
  mergeJimengProgressWithResult,
  mergeJimengResultIntoReply,
} from "../mcp/display";

export type RenderMessage = ChatMessage & { preview?: boolean };

export function getVisibleChatMessages(messages: RenderMessage[]) {
  let pendingJimengResult: string | undefined;
  let pendingJimengProgressIndex: number | undefined;

  const visibleMessages = messages.reduce<RenderMessage[]>(
    (visibleMessages, message) => {
      const textContent = getMessageTextContent(message);

      if (message.isMcpResponse) {
        if (pendingJimengProgressIndex !== undefined) {
          visibleMessages[pendingJimengProgressIndex] = {
            ...visibleMessages[pendingJimengProgressIndex],
            content: mergeJimengProgressWithResult(
              getMessageTextContent(
                visibleMessages[pendingJimengProgressIndex],
              ),
              textContent,
              { includeImages: false },
            ),
          };
          pendingJimengResult = textContent;
          return visibleMessages;
        }

        if (hasJimengDisplayableImage(textContent)) {
          pendingJimengResult = textContent;
        }
        return visibleMessages;
      }

      if (message.role === "assistant" && isMcpJson(textContent)) {
        const jimengProgress = formatJimengMcpRequestForChat(textContent);
        if (jimengProgress) {
          pendingJimengProgressIndex = visibleMessages.length;
          visibleMessages.push({
            ...message,
            content: jimengProgress,
          });
        }
        return visibleMessages;
      }

      if (message.role === "assistant" && message.streaming) {
        const pendingMcpProgress = formatPendingMcpRequestForChat(textContent);
        if (pendingMcpProgress) {
          visibleMessages.push({
            ...message,
            content: pendingMcpProgress,
          });
          return visibleMessages;
        }
      }

      if (message.role === "assistant" && pendingJimengResult) {
        const mergedContent = mergeJimengResultIntoReply(
          textContent,
          pendingJimengResult,
        );
        pendingJimengResult = undefined;
        pendingJimengProgressIndex = undefined;

        if (mergedContent !== textContent) {
          visibleMessages.push({
            ...message,
            content: mergedContent,
          });
          return visibleMessages;
        }
      }

      visibleMessages.push(message);
      return visibleMessages;
    },
    [],
  );

  if (
    pendingJimengProgressIndex !== undefined &&
    pendingJimengResult !== undefined
  ) {
    visibleMessages[pendingJimengProgressIndex] = {
      ...visibleMessages[pendingJimengProgressIndex],
      content: mergeJimengProgressWithResult(
        getMessageTextContent(visibleMessages[pendingJimengProgressIndex]),
        pendingJimengResult,
        { includeImages: true },
      ),
    };
  }

  return visibleMessages;
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
