import fs from "node:fs";
import path from "node:path";

describe("chat scroll performance contract", () => {
  test("uses event-driven scroll state instead of forcing layout during render", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat.tsx"),
      "utf8",
    );
    const chatInnerStart = source.indexOf("function useChatInnerView()");
    const chatInnerEnd = source.indexOf("function ChatInner()", chatInnerStart);
    const chatInner = source.slice(chatInnerStart, chatInnerEnd);

    expect(chatInner).not.toContain("const isScrolledToBottom =");
    expect(chatInner).not.toContain("const isAttachWithTop = (() =>");
    expect(chatInner).toContain("attachWithTopRef.current");
    expect(chatInner).toContain("const shouldFollowLatestMessage =");
    expect(chatInner).toMatch(
      /getMessageTextContent\(lastSessionMessage\)\.length/,
    );
  });

  test("follows streaming growth only while the user is still following the tail", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat.tsx"),
      "utf8",
    );
    const hookStart = source.indexOf("function useScrollToBottom(");
    const hookEnd = source.indexOf("type ChatActionsProps", hookStart);
    const hook = source.slice(hookStart, hookEnd);

    expect(hook).toContain("shouldAutoScroll: boolean = true");
    expect(hook).toContain("if (autoScroll && shouldAutoScroll)");
    expect(hook).toContain('typeof ResizeObserver !== "undefined"');
    expect(hook).toContain("cancelAnimationFrame(scrollFrameRef.current)");
    expect(hook).not.toContain("autoScroll && !detach");
  });

  test("backfills only when the initial page does not fill the viewport", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat.tsx"),
      "utf8",
    );

    expect(source).toContain(
      "Math.max(0, renderMessages.length - CHAT_PAGE_SIZE)",
    );
    expect(source).toContain("getUnderfilledChatWindowStart(");
    expect(source).toContain(
      "Math.max(0, renderMessages.length - MAX_RENDER_MSG_COUNT)",
    );
    expect(source).toContain("previousQaMessageWindowKeyRef");
    expect(source).toContain("data-message-index={absoluteMessageIndex}");
    expect(source).toContain("preserveMessageWindowAnchor(targetIndex)");
    expect(source).toContain(
      "setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE)",
    );
  });

  test("keeps quick-jump direction transient and reaches global message edges", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat.tsx"),
      "utf8",
    );
    const chatInner = source.slice(
      source.indexOf("function useChatInnerView()"),
      source.indexOf("function ChatInner()"),
    );

    expect(chatInner).toContain("accumulateChatScrollDirection(");
    expect(chatInner).toContain("scrollDirectionAccumulatorRef.current");
    expect(chatInner).toContain("pendingQuickJumpTargetRef.current");
    expect(chatInner).toMatch(
      /useLayoutEffect\(\(\) => \{[\s\S]*lastObservedScrollTopRef\.current = scrollRef\.current\?\.scrollTop \?\? 0;[\s\S]*scrollDirectionAccumulatorRef\.current = 0;[\s\S]*\}, \[session\.id, scrollRef\]\);/,
    );
    expect(chatInner).toMatch(
      /const scrollToTop = useCallback\(\(\) => \{[\s\S]*setAutoScroll\(false\);[\s\S]*setMsgRenderIndex\(0\);[\s\S]*requestAnimationFrame\(\(\) => \{[\s\S]*scrollRef\.current\?\.scrollTo\(0, 0\);/,
    );
    expect(chatInner).toMatch(
      /const scrollToBottom = useCallback\(\(\) => \{[\s\S]*setMsgRenderIndex\(renderMessages\.length - CHAT_PAGE_SIZE\);[\s\S]*scrollDomToBottom\(\);/,
    );
    expect(chatInner).toMatch(
      /pendingQuickJumpTarget === null[\s\S]*pendingQuickJumpTarget === "bottom"[\s\S]*msgRenderIndex === maxRenderIndex[\s\S]*isHitBottom/,
    );
    expect(chatInner).toMatch(
      /lastObservedScrollTopRef\.current = nextScrollTop;[\s\S]*scrollDirectionAccumulatorRef\.current = 0;[\s\S]*scrollDom\.scrollTop = nextScrollTop;/,
    );
  });

  test("does not keep hidden chat tools or wrapper subscriptions on the stream render path", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat.tsx"),
      "utf8",
    );
    const promptToast = source.slice(
      source.indexOf("function PromptToast"),
      source.indexOf("const ClearContextDivider"),
    );
    const clearDivider = source.slice(
      source.indexOf("const ClearContextDivider"),
      source.indexOf("type ChatActionsProps"),
    );
    const chatRoot = source.slice(source.indexOf("export function Chat()"));

    expect(promptToast).not.toContain("useChatStore()");
    expect(clearDivider).not.toContain("useChatStore()");
    expect(chatRoot).not.toContain("useChatStore()");
    expect(source).toMatch(/showChatActionMenu\s*&&\s*\(\s*<ChatActions/);
  });

  test("keeps the content ResizeObserver stable during streaming", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat.tsx"),
      "utf8",
    );
    const resizeEffects = source.slice(
      source.indexOf("let resizeFrame = 0"),
      source.indexOf("// prompt hints"),
    );

    expect(resizeEffects).toMatch(
      /contentResizeObserver\?\.disconnect\(\);[\s\S]*?\}, \[scrollRef, session\.id, syncHitBottomState\]\);/,
    );
    expect(resizeEffects).toMatch(
      /if \(typeof ResizeObserver !== "undefined"\) return;[\s\S]*?\}, \[messageScrollSignal, session\.id, syncHitBottomState\]\);/,
    );
  });
});
