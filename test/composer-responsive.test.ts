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

  test("uses one grid shell across empty, conversation, and compact layouts", () => {
    const styles = read("app/components/chat.module.scss");

    expect(styles).toContain("container-name: chat-composer");
    expect(styles).toContain("container-type: inline-size");
    expect(styles).toContain("display: grid");
    expect(styles).toContain('"leading input model send"');
    expect(styles).toContain('"input input input input"');
    expect(styles).toContain(
      '"attachments attachments attachments attachments"',
    );
    expect(styles).toContain('"leading status model send"');
    expect(styles).toContain("min-height: 64px");
    expect(styles).toContain("height: 64px");
    expect(styles).toMatch(
      /\.chat-input-panel \.chat-input-row\s*\{[\s\S]*?--composer-compact-inline-padding:\s*8px;[\s\S]*?--composer-compact-column-gap:\s*6px;[\s\S]*?--composer-expanded-inline-padding:\s*10px;[\s\S]*?column-gap:\s*var\(--composer-compact-column-gap\);[\s\S]*?padding:\s*0 var\(--composer-compact-inline-padding\);/,
    );
    expect(styles).toMatch(
      /@container chat-composer \(max-width: 599px\)[\s\S]*?--composer-compact-column-gap:\s*4px;[\s\S]*?--composer-expanded-inline-padding:\s*8px;/,
    );
  });

  test("keeps long-draft textarea height consistent across composer states", () => {
    const styles = read("app/components/chat.module.scss");

    expect(styles.match(/--chat-input-max-height:/g) ?? []).toHaveLength(1);
    expect(styles).toContain("--chat-input-max-height: min(174px, 24dvh);");
    expect(styles).toContain("max-height: var(--chat-input-max-height);");
    expect(styles).toContain('data-composer-scroll="true"');
    expect(styles).not.toContain("max-height: 120px;");
    expect(styles).not.toContain("max-height: 30vh;");
  });

  test("bottom-anchors the empty composer after a short landscape resize", () => {
    const styles = read("app/components/chat.module.scss");

    expect(styles).toMatch(
      /@media only screen and \(max-width: 600px\)[\s\S]*?\.chat-input-panel\.chat-input-panel-empty\s*\{[\s\S]*?top:\s*auto;[\s\S]*?bottom:\s*calc\([\s\S]*?--chat-composer-viewport-bottom-inset/,
    );
    expect(styles).toMatch(
      /@media only screen and \(min-width: 601px\) and \(max-height: 560px\)\s*\{[\s\S]*?\.chat-input-panel\.chat-input-panel-empty:not\(\s*\[data-composer-segment-axis="vertical"\]\s*\):not\(\[data-composer-segment-axis="both"\]\)\s*\{[\s\S]*?top:\s*auto;[\s\S]*?bottom:\s*calc\([\s\S]*?--chat-composer-viewport-bottom-inset[\s\S]*?transform:\s*translateX\(-50%\);/,
    );
    expect(
      styles.match(/--chat-composer-viewport-bottom-inset\) \+ 12px/g),
    ).toHaveLength(2);
  });

  test("resolves textarea line height from the configured font size", () => {
    const styles = read("app/components/chat.module.scss");
    const composerStyles = styles.slice(
      styles.lastIndexOf(".chat-input-panel .chat-input-row .chat-input"),
    );

    expect(composerStyles).toContain("height: max(24px, 1.5em);");
    expect(composerStyles).toContain("min-height: max(24px, 1.5em);");
    expect(composerStyles).toContain("line-height: max(24px, 1.5em);");
    expect(composerStyles).not.toContain("line-height: 24px;");
  });

  test("remeasures after attachment state changes reallocate input width", () => {
    const source = read("app/components/chat.tsx");
    const measurementEffectStart = source.indexOf(
      "useLayoutEffect(() => {\n    const measureFrame",
    );
    const measurementEffectEnd = source.indexOf("]);", measurementEffectStart);
    const measurementEffect = source.slice(
      measurementEffectStart,
      measurementEffectEnd,
    );

    expect(measurementEffectStart).toBeGreaterThan(-1);
    expect(measurementEffect).toContain("attachImages.length");
    expect(measurementEffect).toContain("attachedFiles.length");
  });

  test("keeps textarea and controls in normal grid flow", () => {
    const styles = read("app/components/chat.module.scss");
    const modelStart = styles.indexOf("\n.chat-input-model-button {") + 1;
    const modelStyles = styles.slice(
      modelStart,
      styles.indexOf("\n}", modelStart),
    );

    expect(modelStyles).toContain("position: relative");
    expect(modelStyles).not.toMatch(/\b(?:right|bottom):/);
    expect(styles).toMatch(/\.chat-input-send\s*\{[\s\S]*?position:\s*static;/);
    expect(styles).not.toMatch(
      /padding-right:\s*(?:136|154|176|184|202|204|206|218|300|366)px/,
    );
    const modelOpenStart = styles.indexOf(".chat-input-panel-model-open");
    const modelOpenStyles = styles.slice(
      modelOpenStart,
      styles.indexOf("\n}", modelOpenStart) + 2,
    );
    expect(modelOpenStyles).not.toContain("filter: blur");
  });

  test("uses semantic composer markup without a label wrapping controls", () => {
    const source = read("app/components/chat.tsx");
    const composerStart = source.indexOf('data-composer-shell="true"');
    const composerEnd = source.indexOf("</div>", composerStart);
    const composerSource = source.slice(composerStart, composerEnd);

    expect(composerStart).toBeGreaterThan(-1);
    expect(composerSource).not.toContain("<label");
    expect(source).not.toContain("autoGrowTextArea(inputRef.current)");
    expect(source).toContain("expansionScrollHeight = textarea.scrollHeight");
    expect(source).toContain("displayScrollHeight = textarea.scrollHeight");
    expect(source).toContain("getComposerTextareaProbeWidths({");
    expect(source).toContain("new ResizeObserver");
    expect(source).not.toContain("onPointerDown={expandInput}");
    expect(source).not.toContain("onClick={expandInput}");
  });
});
