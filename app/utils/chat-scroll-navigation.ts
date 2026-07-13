export type ChatScrollTarget = "top" | "bottom";

export const CHAT_SCROLL_DIRECTION_THRESHOLD = 12;

export function getAnchoredScrollTop(
  currentScrollTop: number,
  nextAnchorTop: number,
  previousAnchorTop: number,
) {
  return currentScrollTop + nextAnchorTop - previousAnchorTop;
}

export function followChatTailAfterResize(
  container: Pick<HTMLElement, "scrollHeight" | "scrollTo">,
  shouldFollowTail: boolean,
) {
  if (!shouldFollowTail) return false;

  container.scrollTo(0, container.scrollHeight);
  return true;
}

export function getUnderfilledChatWindowStart(
  currentStart: number,
  minimumStart: number,
  contentHeight: number,
  viewportHeight: number,
  pageSize: number,
) {
  if (
    currentStart <= minimumStart ||
    contentHeight > viewportHeight + 1 ||
    pageSize <= 0
  ) {
    return currentStart;
  }

  return Math.max(minimumStart, currentStart - pageSize);
}

export function isMessageIndexRetainedInWindow(
  messageIndex: number,
  windowStart: number,
  maxRenderCount: number,
) {
  return (
    Number.isInteger(messageIndex) &&
    maxRenderCount > 0 &&
    messageIndex >= windowStart &&
    messageIndex < windowStart + maxRenderCount
  );
}

export function isRetainedVisibleMessageAnchor(
  messageIndex: number,
  messageTop: number,
  messageBottom: number,
  windowStart: number,
  maxRenderCount: number,
  viewportTop: number,
  viewportBottom: number,
) {
  return (
    isMessageIndexRetainedInWindow(messageIndex, windowStart, maxRenderCount) &&
    messageBottom >= viewportTop &&
    messageTop <= viewportBottom
  );
}

export function accumulateChatScrollDirection(
  accumulatedDelta: number,
  scrollDelta: number,
  threshold = CHAT_SCROLL_DIRECTION_THRESHOLD,
) {
  if (!Number.isFinite(scrollDelta) || scrollDelta === 0) {
    return { accumulatedDelta, target: null as ChatScrollTarget | null };
  }

  const nextAccumulatedDelta =
    accumulatedDelta === 0 ||
    Math.sign(accumulatedDelta) === Math.sign(scrollDelta)
      ? accumulatedDelta + scrollDelta
      : scrollDelta;

  if (Math.abs(nextAccumulatedDelta) < threshold) {
    return {
      accumulatedDelta: nextAccumulatedDelta,
      target: null as ChatScrollTarget | null,
    };
  }

  return {
    accumulatedDelta: 0,
    target: (nextAccumulatedDelta < 0 ? "top" : "bottom") as ChatScrollTarget,
  };
}
