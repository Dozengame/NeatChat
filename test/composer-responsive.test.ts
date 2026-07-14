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
    expect(mobileStyles).toMatch(
      /\.chat-input-panel\.chat-input-panel-empty\s*\{[\s\S]*?width:\s*calc\(100% - 20px\);[\s\S]*?max-width:\s*calc\(100% - 20px\);/,
    );
    expect(mobileStyles).not.toContain("min(376px");
    expect(mobileStyles).toMatch(
      /\.chat-input-panel\.chat-input-panel-empty\s*\n\s*\.chat-input-panel-inner-home-image\s*\{[\s\S]*?padding-right:\s*184px;/,
    );
    expect(mobileStyles).toMatch(
      /\.chat-input-panel\.chat-input-panel-empty\s*\n\s*\.chat-input-panel-inner-home-chat,[\s\S]*?padding-right:\s*154px;/,
    );
  });

  test("keeps long-draft textarea height consistent across composer states", () => {
    const styles = read("app/components/chat.module.scss");

    expect(styles.match(/--chat-input-max-height:/g) ?? []).toHaveLength(1);
    expect(styles).toContain("--chat-input-max-height: min(120px, 30dvh);");
    expect(styles).toContain("max-height: var(--chat-input-max-height);");
    expect(styles).toContain("overflow-y: auto;");
    expect(styles).not.toContain("max-height: 120px;");
    expect(styles).not.toContain("max-height: 30vh;");
  });

  test("gives expanded drafts full-width text above a dedicated controls row", () => {
    const styles = read("app/components/chat.module.scss");

    expect(styles).toMatch(
      /\.chat-input-panel\s+\.chat-input-panel-inner:not\(\.chat-input-panel-inner-collapsed\)\s*\{[\s\S]*?padding-right:\s*18px;[\s\S]*?padding-bottom:\s*66px;/,
    );
    expect(styles).toMatch(
      /@media screen and \(max-width: 600px\)\s*\{[\s\S]*?\.chat-input-panel:not\(\.chat-input-panel-collapsed\)\s*\{[\s\S]*?\.chat-input-panel-inner:not\(\.chat-input-panel-inner-collapsed\)\s*\{[\s\S]*?padding-left:\s*6px;[\s\S]*?padding-right:\s*6px;/,
    );
  });

  test("keeps compact expanded composers on one balanced visual surface", () => {
    const styles = read("app/components/chat.module.scss");
    const compactExpandedStart = styles.lastIndexOf(
      "@media only screen and (max-width: 900px)",
    );
    const compactExpandedStyles = styles.slice(compactExpandedStart);

    expect(compactExpandedStyles).toMatch(
      /\.chat-input-panel:not\(\.chat-input-panel-collapsed\)\s*\{[\s\S]*?\.chat-input-row\s*\{[\s\S]*?position:\s*relative;/,
    );
    expect(compactExpandedStyles).toMatch(
      /\.chat-input-menu-button\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?left:\s*7px;[\s\S]*?bottom:\s*7px;[\s\S]*?margin:\s*0;/,
    );
    expect(compactExpandedStyles).toMatch(
      /\.chat-input-panel-inner:not\(\.chat-input-panel-inner-collapsed\)\s*\{[\s\S]*?width:\s*100%;[\s\S]*?padding-left:\s*18px;[\s\S]*?padding-right:\s*18px;[\s\S]*?border:\s*0;[\s\S]*?border-radius:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none;/,
    );
    expect(compactExpandedStyles).toMatch(
      /\.chat-input-panel\.chat-input-panel-empty:not\(\.chat-input-panel-collapsed\)\s+\.chat-input-panel-inner:not\(\.chat-input-panel-inner-collapsed\)\s*\{[\s\S]*?border-radius:\s*0;/,
    );
  });
});
