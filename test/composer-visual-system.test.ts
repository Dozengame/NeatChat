import fs from "fs";
import path from "path";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("composer visual system", () => {
  const composerTokens = [
    "--composer-surface",
    "--composer-surface-elevated",
    "--composer-surface-soft",
    "--composer-text",
    "--composer-muted",
    "--composer-border",
    "--composer-border-focus",
    "--composer-shadow",
    "--composer-shadow-focus",
    "--composer-control-surface",
    "--composer-control-hover",
    "--composer-control-active",
    "--composer-control-disabled",
    "--composer-chip-surface",
    "--composer-chip-open-surface",
    "--composer-panel-surface",
    "--composer-panel-border",
    "--composer-panel-shadow",
    "--composer-selected-surface",
    "--composer-selected-border",
    "--composer-aura-blue",
    "--composer-aura-cyan",
    "--composer-aura-violet",
  ];

  test("defines one complete light and dark semantic token set", () => {
    const globals = read("app/styles/globals.scss");
    const light = globals.slice(globals.indexOf("@mixin light"), globals.indexOf("@mixin dark"));
    const dark = globals.slice(globals.indexOf("@mixin dark"), globals.indexOf(".light"));

    for (const token of composerTokens) {
      expect(light).toContain(token);
      expect(dark).toContain(token);
    }
  });

  test("keeps Aura local, state-driven, and transform-opacity only", () => {
    const styles = read("app/components/chat.module.scss");
    const auraStart = styles.indexOf(".chat-input-row::after");
    const auraEnd = styles.indexOf("@container chat-composer", auraStart);
    const aura = styles.slice(auraStart, auraEnd);

    expect(auraStart).toBeGreaterThan(-1);
    expect(aura).toContain("pointer-events: none");
    expect(aura).toContain("radial-gradient");
    expect(aura).toContain('data-composer-submit-state="send"');
    expect(aura).toContain('data-composer-submit-state="stop"');
    expect(aura).toContain("composer-aura-pulse");
    const keyframes = aura.slice(aura.indexOf("@keyframes composer-aura-pulse"));
    const keyframesEnd = keyframes.indexOf("\n}\n", keyframes.indexOf("100%"));
    const auraPulse = keyframes.slice(0, keyframesEnd + 3);
    expect(auraPulse).not.toMatch(/(?:filter|box-shadow|background-position):/);
  });

  test("uses real container breakpoints without a composer JS breakpoint", () => {
    const styles = read("app/components/chat.module.scss");
    const source = read("app/components/chat.tsx");

    expect(styles).toContain("container-name: chat-composer");
    expect(styles).toContain("@container chat-composer (max-width: 599px)");
    expect(styles).toContain(
      "@container chat-composer (min-width: 600px) and (max-width: 839px)",
    );
    expect(styles).toContain("@container chat-composer (min-width: 840px)");
    expect(source).not.toContain("getComposerWidthCategory");
  });

  test("includes soft-keyboard, segment, and accessibility fallbacks", () => {
    const styles = read("app/components/chat.module.scss");
    const source = read("app/components/chat.tsx");

    expect(styles).toContain("horizontal-viewport-segments: 2");
    expect(styles).toContain("vertical-viewport-segments: 2");
    expect(styles).toContain('data-qa-posture="book"');
    expect(styles).toContain('data-qa-posture="tabletop"');
    expect(styles).toContain('data-qa-posture="split"');
    expect(styles).toContain('data-qa-posture="fold-outer"');
    expect(styles).toContain('data-qa-posture="fold-inner"');
    expect(styles).toContain("--chat-composer-viewport-bottom-inset");
    expect(styles).toContain('data-composer-segment-axis="vertical"');
    expect(source).toContain("--chat-composer-segment-bottom-inset");
    expect(styles).toContain("@media (prefers-reduced-transparency: reduce)");
    expect(styles).toContain("@media (prefers-contrast: more)");
    expect(styles).toContain("@media (forced-colors: active)");
    expect(source).toContain('window.visualViewport?.addEventListener("scroll"');
    expect(source).toContain("composerViewportSegmentRef");
    const viewportEffectStart = source.indexOf("composerViewportSegmentRef.current");
    const viewportEffectEnd = source.indexOf("}, []);", viewportEffectStart);
    const viewportEffect = source.slice(viewportEffectStart, viewportEffectEnd);
    expect(viewportEffect).not.toMatch(
      /navigator\.userAgent|devicePixelRatio\s*[<>=]/,
    );
  });

  test("feeds shell states without duplicating business state", () => {
    const source = read("app/components/chat.tsx");

    expect(source).toContain(
      "data-composer-submit-state={displayedComposerSubmitState}",
    );
    expect(source).toContain('data-composer-uploading={uploading ? "true" : "false"}');
    expect(source).toContain('data-composer-panel="true"');
  });

  test("routes leading and tool controls through semantic composer tokens", () => {
    const styles = read("app/components/chat.module.scss");
    const leadingEnd = styles.indexOf(".chat-input-action-menu-backdrop");
    const leadingStart = styles.lastIndexOf(
      ".chat-input-menu-button {",
      leadingEnd,
    );
    const leading = styles.slice(leadingStart, leadingEnd);
    const toolsStart = styles.indexOf(".chat-input-action-menu {");
    const toolsEnd = styles.indexOf(".chat-prompt-library {", toolsStart);
    const tools = styles.slice(toolsStart, toolsEnd);

    expect(leading).toContain("var(--composer-control-surface)");
    expect(leading).toContain("var(--composer-control-active)");
    expect(leading).not.toContain(":global(.dark)");
    expect(tools).toContain("var(--composer-panel-surface)");
    expect(tools).toContain("var(--composer-control-hover)");
    expect(tools).not.toContain(":global(.dark)");
  });

  test("routes the reasoning panel through composer tokens", () => {
    const styles = read("app/components/reasoning-effort-rail.module.scss");

    expect(styles).toContain("--reasoning-rail-card: var(--composer-panel-surface)");
    expect(styles).toContain("--reasoning-rail-border: var(--composer-panel-border)");
    expect(styles).toContain("background: var(--composer-rail-thumb-surface)");
    expect(styles).not.toContain("background: #fff");
  });
});
