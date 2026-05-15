import {
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
});
