import {
  createVisibleChatMessagesProjector,
  getVisibleChatMessages,
  RenderMessage,
  shouldRenderLoadingPreview,
} from "../app/components/chat-render";

function message(override: Partial<RenderMessage>): RenderMessage {
  return {
    id: override.id ?? Math.random().toString(36),
    date: new Date(0).toISOString(),
    role: "user",
    content: "",
    ...override,
  } as RenderMessage;
}

describe("chat render messages", () => {
  test("does not add a loading preview when a real assistant stream is visible", () => {
    const visibleMessages = getVisibleChatMessages([
      message({ id: "user-1", role: "user", content: "hello" }),
      message({
        id: "assistant-1",
        role: "assistant",
        content: "",
        streaming: true,
      }),
    ]);

    expect(shouldRenderLoadingPreview(visibleMessages, true)).toBe(false);
  });

  test("keeps the loading preview before the assistant placeholder exists", () => {
    const visibleMessages = getVisibleChatMessages([
      message({ id: "user-1", role: "user", content: "hello" }),
    ]);

    expect(shouldRenderLoadingPreview(visibleMessages, true)).toBe(true);
  });

  test("does not render a loading preview when the chat is not loading", () => {
    const visibleMessages = getVisibleChatMessages([
      message({ id: "user-1", role: "user", content: "hello" }),
    ]);

    expect(shouldRenderLoadingPreview(visibleMessages, false)).toBe(false);
  });

  test("reprocesses only the mutable tail during streaming updates", () => {
    let contentReads = 0;
    let tailContent = "stream-0";
    const messages = Array.from({ length: 3000 }, (_, index) => {
      const nextMessage = message({
        id: `message-${index}`,
        role: index % 2 === 0 ? "user" : "assistant",
      });
      Object.defineProperty(nextMessage, "content", {
        configurable: true,
        enumerable: true,
        get() {
          contentReads += 1;
          return index === 2999 ? tailContent : `content-${index}`;
        },
      });
      return nextMessage;
    });
    const project = createVisibleChatMessagesProjector();

    expect(project(messages, 1)).toHaveLength(messages.length);
    expect(contentReads).toBeGreaterThanOrEqual(messages.length);

    contentReads = 0;
    tailContent = "stream-1";
    const projected = project(messages.slice(), 1);

    expect(contentReads).toBeLessThan(20);
    expect(projected.at(-1)?.content).toBe("stream-1");

    contentReads = 0;
    project(messages.slice(), 2);
    expect(contentReads).toBeGreaterThanOrEqual(messages.length);
  });
});
