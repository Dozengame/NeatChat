import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
} from "../constant";

const COMPACT_MAX_WIDTH = 767;
// Keep enough room for desktop gutters, actions, and a readable composer textarea.
const MIN_DESKTOP_CHAT_WIDTH = 640;

function getEffectiveSidebarWidth(sidebarWidth: number) {
  const normalizedWidth = Number.isFinite(sidebarWidth)
    ? sidebarWidth
    : DEFAULT_SIDEBAR_WIDTH;

  if (normalizedWidth < MIN_SIDEBAR_WIDTH) {
    return NARROW_SIDEBAR_WIDTH;
  }

  return Math.min(MAX_SIDEBAR_WIDTH, normalizedWidth);
}

export function getAvailableChatWidth(
  viewportWidth: number,
  sidebarWidth = DEFAULT_SIDEBAR_WIDTH,
) {
  return Math.max(0, viewportWidth - getEffectiveSidebarWidth(sidebarWidth));
}

export function shouldUseCompactLayout(
  viewportWidth: number,
  sidebarWidth = DEFAULT_SIDEBAR_WIDTH,
) {
  if (viewportWidth <= COMPACT_MAX_WIDTH) {
    return true;
  }

  return (
    getAvailableChatWidth(viewportWidth, sidebarWidth) < MIN_DESKTOP_CHAT_WIDTH
  );
}
