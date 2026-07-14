import {
  MARKDOWN_NORMAL_TARGET_PX,
  MARKDOWN_WIDE_EPSILON_PX,
  MARKDOWN_WIDE_TARGET_PX,
  shouldPromoteMarkdownSurface,
} from "../app/utils/markdown-surface-width";

describe("Markdown surface width policy", () => {
  test("keeps the prose and data rails aligned with the visual contract", () => {
    expect(MARKDOWN_NORMAL_TARGET_PX).toBe(780);
    expect(MARKDOWN_WIDE_TARGET_PX).toBe(920);
    expect(MARKDOWN_WIDE_EPSILON_PX).toBe(12);
  });

  test("promotes only measured overflow on a complete prose track", () => {
    expect(shouldPromoteMarkdownSurface(792, 780)).toBe(false);
    expect(shouldPromoteMarkdownSurface(793, 780)).toBe(true);
    expect(shouldPromoteMarkdownSurface(920, 760)).toBe(false);
    expect(shouldPromoteMarkdownSurface(Number.NaN, 780)).toBe(false);
  });
});
