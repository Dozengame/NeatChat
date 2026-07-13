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
