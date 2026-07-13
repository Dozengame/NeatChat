import fs from "fs";
import path from "path";

import {
  getAvailableChatWidth,
  shouldUseCompactLayout,
} from "../app/utils/responsive-layout";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("composer responsive layout", () => {
  test("switches to compact layout when the persisted sidebar leaves too little chat space", () => {
    expect(getAvailableChatWidth(800, 268)).toBe(532);
    expect(shouldUseCompactLayout(800, 268)).toBe(true);

    expect(getAvailableChatWidth(820, 100)).toBe(720);
    expect(shouldUseCompactLayout(820, 100)).toBe(false);

    expect(getAvailableChatWidth(1056, 500)).toBe(556);
    expect(shouldUseCompactLayout(1056, 500)).toBe(true);

    expect(getAvailableChatWidth(1024, 268)).toBe(756);
    expect(shouldUseCompactLayout(1024, 268)).toBe(false);
  });

  test("keeps the hard mobile boundary independent of sidebar width", () => {
    expect(shouldUseCompactLayout(767, 100)).toBe(true);
    expect(shouldUseCompactLayout(767, 500)).toBe(true);
  });

  test("normalizes persisted sidebar widths before calculating available space", () => {
    expect(getAvailableChatWidth(800, 0)).toBe(700);
    expect(getAvailableChatWidth(800, 229)).toBe(700);
    expect(getAvailableChatWidth(800, 230)).toBe(570);
    expect(getAvailableChatWidth(1056, 999)).toBe(556);
    expect(getAvailableChatWidth(900, Number.NaN)).toBe(632);
  });

  test("keeps the exact desktop chat-width boundary in desktop mode", () => {
    expect(getAvailableChatWidth(870, 230)).toBe(640);
    expect(shouldUseCompactLayout(870, 230)).toBe(false);
    expect(shouldUseCompactLayout(869, 230)).toBe(true);
  });

  test("expanded mobile and tablet composers use expansion state instead of empty-state styling", () => {
    const styles = read("app/components/chat.module.scss");
    const mobileStart = styles.lastIndexOf(
      "@media only screen and (max-width: 600px)",
    );
    const tabletStart = styles.indexOf(
      "@media only screen and (min-width: 601px) and (max-width: 900px)",
      mobileStart,
    );
    const mobileStyles = styles.slice(mobileStart, tabletStart);
    const tabletStyles = styles.slice(tabletStart);
    const expandedSelector =
      ".chat-input-panel:not(.chat-input-panel-collapsed)";

    for (const responsiveStyles of [mobileStyles, tabletStyles]) {
      expect(responsiveStyles).toContain(expandedSelector);
      expect(responsiveStyles).toMatch(
        /\.chat-input-panel:not\(\.chat-input-panel-collapsed\)\s*\{[\s\S]*?\.chat-input-row\s*\{[\s\S]*?align-items:\s*flex-end;[\s\S]*?border-radius:\s*24px;/,
      );
    }

    expect(mobileStyles).not.toContain(
      ".chat-input-panel.chat-input-panel-empty:not(.chat-input-panel-collapsed)",
    );
  });
});
