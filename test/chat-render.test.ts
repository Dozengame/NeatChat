import {
  createPinnedContextMessage,
  createVisibleChatMessagesProjector,
  findMessageForRenderSource,
  getMessageRenderIdentity,
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
  test("keeps message identities stable within their render source", () => {
    const sharedId = message({ id: "shared" });

    expect(getMessageRenderIdentity(sharedId, 0, 2)).toBe("context:shared");
    expect(getMessageRenderIdentity(sharedId, 1, 2)).toBe("context:shared");
    expect(getMessageRenderIdentity(sharedId, 2, 2)).toBe("session:shared");
    expect(getMessageRenderIdentity(sharedId, 8, 2)).toBe("session:shared");
  });

  test("uses the absolute index only when legacy data has no message id", () => {
    const withoutId = {
      ...message({}),
      id: undefined,
    } as unknown as RenderMessage;

    expect(getMessageRenderIdentity(withoutId, 3, 2)).toBe("session:3");
  });

  test("pins a detached message snapshot with a fresh identity", () => {
    const original = message({
      id: "original",
      content: [
        { type: "text", text: "hello" },
        { type: "image_url", image_url: { url: "data:image/png;base64,a" } },
      ],
    });
    const pinned = createPinnedContextMessage(original, "pinned");

    expect(pinned).not.toBe(original);
    expect(pinned.id).toBe("pinned");
    expect(pinned.content).toEqual(original.content);
    expect(pinned.content).not.toBe(original.content);
  });

  test("edits only the rendered message source when old data shares an id", () => {
    const contextMessage = message({ id: "shared", content: "context" });
    const sessionMessage = message({ id: "shared", content: "session" });

    const selected = findMessageForRenderSource(
      [contextMessage],
      [sessionMessage],
      "shared",
      false,
    );
    selected!.content = "edited";

    expect(contextMessage.content).toBe("context");
    expect(sessionMessage.content).toBe("edited");
  });

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

  test("keeps a malformed Jimeng tool call visible as a terminal failure", () => {
    const visibleMessages = getVisibleChatMessages([
      message({
        id: "malformed-jimeng",
        role: "assistant",
        content: [
          "```json:mcp:jimeng-mcp",
          '{"method":"tools/call" "params":{}}',
          "```",
        ].join("\n"),
        streaming: false,
      }),
    ]);

    expect(visibleMessages).toHaveLength(1);
    expect(visibleMessages[0]).toMatchObject({
      id: "malformed-jimeng",
      streaming: false,
      isError: true,
      content: expect.stringContaining("Tool call failed"),
    });
    expect(visibleMessages[0].content).not.toContain("```json:mcp");
  });

  test("keeps a historical malformed generic MCP call visible as a terminal failure", () => {
    const visibleMessages = getVisibleChatMessages([
      message({
        id: "malformed-generic-mcp",
        role: "assistant",
        content: [
          "```json:mcp:demo",
          '{"method":"tools/call" "params":{}}',
          "```",
        ].join("\n"),
        streaming: false,
      }),
    ]);

    expect(visibleMessages).toHaveLength(1);
    expect(visibleMessages[0]).toMatchObject({
      streaming: false,
      isError: true,
      content: expect.stringContaining("Tool call failed"),
    });
    expect(visibleMessages[0].content).not.toContain("json:mcp");
  });

  test("keeps the deployed Jimeng EOF truncation visible as generation progress", () => {
    const visibleMessages = getVisibleChatMessages([
      message({
        id: "recoverable-jimeng",
        role: "assistant",
        content: [
          "我先优化生成提示词。",
          "```json:mcp:jimeng-mcp",
          '{"method":"tools/call","params":{"name":"dreamina_text2image","arguments":{"prompt":"sunrise over a lake","ratio":"16:9","poll":0}}',
          "```",
          "正在提交。",
        ].join("\n"),
        streaming: false,
      }),
    ]);

    expect(visibleMessages).toHaveLength(1);
    expect(visibleMessages[0].content).toContain("Image generation task");
    expect(visibleMessages[0].content).toContain("sunrise over a lake");
    expect(visibleMessages[0].content).not.toContain("```json:mcp");
  });

  test("does not expose an incomplete final MCP protocol message", () => {
    const visibleMessages = getVisibleChatMessages([
      message({
        id: "incomplete-mcp",
        role: "assistant",
        content: '```json:mcp:jimeng-mcp\n{"method":"tools/call"',
        streaming: false,
      }),
    ]);

    expect(visibleMessages).toHaveLength(1);
    expect(visibleMessages[0]).toMatchObject({
      streaming: false,
      isError: true,
      content: expect.stringContaining("Tool call failed"),
    });
    expect(visibleMessages[0].content).not.toContain("json:mcp");
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
