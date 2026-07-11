export const MARKDOWN_NORMAL_TARGET_PX = 780;
export const MARKDOWN_WIDE_TARGET_PX = 920;
export const MARKDOWN_WIDE_EPSILON_PX = 12;

export type MarkdownSurfaceWidth = "normal" | "wide";

/**
 * Wide mode is intentionally one-way. Callers keep the promoted state and only
 * use this predicate while the surface still occupies the complete prose track.
 */
export function shouldPromoteMarkdownSurface(
  requiredWidth: number,
  availableWidth: number,
) {
  return (
    Number.isFinite(requiredWidth) &&
    Number.isFinite(availableWidth) &&
    availableWidth >= MARKDOWN_NORMAL_TARGET_PX - 2 &&
    requiredWidth > MARKDOWN_NORMAL_TARGET_PX + MARKDOWN_WIDE_EPSILON_PX
  );
}
