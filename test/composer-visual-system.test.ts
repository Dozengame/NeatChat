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
    "--composer-hero-cyan",
    "--composer-aura-idle-opacity",
    "--composer-aura-focus-opacity",
    "--composer-aura-ready-opacity",
  ];

  test("defines one complete light and dark semantic token set", () => {
    const globals = read("app/styles/globals.scss");
    const light = globals.slice(
      globals.indexOf("@mixin light"),
      globals.indexOf("@mixin dark"),
    );
    const dark = globals.slice(
      globals.indexOf("@mixin dark"),
      globals.indexOf(".light"),
    );

    for (const token of composerTokens) {
      expect(light).toContain(token);
      expect(dark).toContain(token);
    }
  });

  test("renders three local Aura blobs with state-driven transform-opacity motion", () => {
    const styles = read("app/components/chat.module.scss");
    const source = read("app/components/chat.tsx");
    const auraStart = styles.indexOf(".chat-composer-aura {");
    const auraEnd = styles.indexOf("@container chat-composer", auraStart);
    const aura = styles.slice(auraStart, auraEnd);

    expect(auraStart).toBeGreaterThan(-1);
    expect(source).toContain('className={styles["chat-composer-aura"]}');
    expect(source.match(/styles\["chat-composer-aura-blob"\]/g)).toHaveLength(
      3,
    );
    expect(source).toContain('styles["chat-composer-aura-blob-blue"]');
    expect(source).toContain('styles["chat-composer-aura-blob-cyan"]');
    expect(source).toContain('styles["chat-composer-aura-blob-violet"]');
    expect(source).toMatch(/chat-composer-aura[^>]*aria-hidden="true"/s);
    expect(aura).toContain("pointer-events: none");
    expect(aura).toContain("radial-gradient");
    expect(aura).toContain('data-composer-submit-state="send"');
    expect(aura).toContain('data-composer-submit-state="stop"');
    expect(aura).toContain("composer-aura-pulse");
    expect(aura).toMatch(/8\.8s[\s\S]*10\.4s[\s\S]*9\.6s/);
    const keyframes = aura.slice(
      aura.indexOf("@keyframes composer-aura-pulse"),
    );
    expect(keyframes).not.toMatch(/(?:filter|box-shadow|background-position):/);
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
    expect(source).toContain(
      'window.visualViewport?.addEventListener("scroll"',
    );
    expect(source).toContain("composerViewportSegmentRef");
    const viewportEffectStart = source.indexOf(
      "composerViewportSegmentRef.current",
    );
    const viewportEffectEnd = source.indexOf("}, []);", viewportEffectStart);
    const viewportEffect = source.slice(viewportEffectStart, viewportEffectEnd);
    expect(viewportEffect).not.toMatch(
      /navigator\.userAgent|devicePixelRatio\s*[<>=]/,
    );
  });

  test("coalesces safe-area layout reads into one cancellable animation frame", () => {
    const source = read("app/components/chat.tsx");

    expect(source).toContain("const scheduleChatBodyBottomSafeArea = () =>");
    expect(source).toContain("if (safeAreaFrame) return");
    expect(source).toContain("safeAreaFrame = requestAnimationFrame(() =>");
    expect(source).toContain(
      "new ResizeObserver(scheduleChatBodyBottomSafeArea)",
    );
    expect(source).toContain(
      'window.addEventListener("resize", scheduleChatBodyBottomSafeArea)',
    );
    expect(source).toContain("cancelAnimationFrame(safeAreaFrame)");
  });

  test("keeps one visible shell boundary and normal-flow 44px controls", () => {
    const styles = read("app/components/chat.module.scss");
    const shellStart = styles.indexOf(
      "// Composer shell geometry shared by compact, expanded, and scrolling states.",
    );
    const shellEnd = styles.indexOf(
      "// Viewport, segment, and container-query boundaries.",
      shellStart,
    );
    const shell = styles.slice(shellStart, shellEnd);
    const modelStart = styles.indexOf("\n.chat-input-model-button {") + 1;
    const model = styles.slice(modelStart, styles.indexOf("\n}", modelStart));

    expect(shell).toMatch(
      /\.chat-input-row::before\s*\{[\s\S]*position:\s*absolute;[\s\S]*inset:\s*0;[\s\S]*border-radius:\s*32px;/,
    );
    expect(shell).not.toContain("inset: 0 0 0 50px");
    expect(shell).toContain("min-height: 170px");
    expect(shell).toContain('grid-template-areas: "leading input model send"');
    expect(shell).toContain('"leading status model send"');
    expect(model).toContain("grid-area: model");
    expect(model).toContain("height: 44px");
    expect(model).toContain("overflow: hidden");
    for (const [selector, from] of [
      [".chat-input-menu-button", styles.indexOf(".chat-input-send {")],
      [".chat-input-voice", styles.indexOf(".chat-input-send {")],
      [".chat-input-send", styles.indexOf(".chat-input:focus")],
    ] as const) {
      const start = styles.indexOf(`${selector} {`, from);
      const end = styles.indexOf("\n}", start);
      expect(styles.slice(start, end)).toContain("44px");
    }
  });

  test("truncates only the model name while keeping the detail fixed", () => {
    const styles = read("app/components/chat.module.scss");
    const name = styles.slice(
      styles.indexOf(".chat-input-model-name {"),
      styles.indexOf("@keyframes chat-model-name-reveal"),
    );
    const firstDetailStart = styles.indexOf(".chat-input-model-detail {");
    const detailStart = styles.indexOf(
      ".chat-input-model-detail {",
      firstDetailStart + 1,
    );
    const detail = styles.slice(
      detailStart,
      styles.indexOf("\n}", detailStart),
    );

    expect(name).toContain("flex: 1 1 auto");
    expect(name).toContain("text-overflow: ellipsis");
    expect(detail).toContain("flex: 0 0 auto");
    expect(detail).not.toMatch(/overflow:\s*hidden|text-overflow:\s*ellipsis/);
    expect(styles).not.toMatch(
      /\.chat-input-model-button-open\s*\{[\s\S]{0,500}\.chat-input-model-detail\s*\{[\s\S]{0,100}display:\s*none/,
    );
  });

  test("feeds shell states without duplicating business state", () => {
    const source = read("app/components/chat.tsx");

    expect(source).toContain(
      "data-composer-submit-state={displayedComposerSubmitState}",
    );
    expect(source).toContain(
      'data-composer-uploading={uploading ? "true" : "false"}',
    );
    expect(source).toContain('data-composer-panel="true"');
    expect(source).toContain("composerTextareaExpandedRef.current = false");
    expect(source).toContain("setIsTextareaExpanded(false)");
    expect(source).toContain("setIsTextareaScrolling(false)");
    expect(source).toContain('inputRef.current.style.height = ""');
    expect(source).toContain('inputRef.current.style.overflowY = "hidden"');
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

    expect(leading).toContain("var(--composer-control-active)");
    expect(leading).toContain("var(--primary)");
    expect(leading).toContain("var(--composer-control-active)");
    expect(leading).not.toContain(":global(.dark)");
    expect(tools).toContain("var(--composer-panel-surface)");
    expect(tools).toContain("var(--composer-control-hover)");
    expect(tools).toMatch(
      /\.chat-input-action\s*\{[\s\S]*border:\s*1px solid transparent;[\s\S]*background:\s*transparent;/,
    );
    expect(tools).not.toMatch(/box-shadow:\s*0 6px 18px/);
    expect(tools).not.toContain(":global(.dark)");
  });

  test("keeps the parameter header flat and the outer panel elevated", () => {
    const styles = read("app/components/chat.module.scss");
    const headerStart = styles.indexOf(".chat-model-menu-header {");
    const header = styles.slice(
      headerStart,
      styles.indexOf("\n}", headerStart),
    );
    const panelStart = styles.indexOf(".chat-desktop-model-menu {");
    const panel = styles.slice(panelStart, styles.indexOf("\n}", panelStart));

    expect(header).toContain(
      "border-bottom: 1px solid var(--composer-panel-border)",
    );
    expect(header).toContain("box-sizing: border-box");
    expect(header).toContain("background: transparent");
    expect(header).toContain("box-shadow: none");
    expect(panel).toContain("--chat-model-menu-radius: 22px");
    expect(panel).toContain("box-shadow: var(--chat-model-menu-shadow)");
    expect(styles).toContain("top: var(--chat-composer-popover-top, 50vh)");
    expect(styles).toContain(
      "bottom: var(--chat-composer-popover-bottom, auto)",
    );
  });

  test("keeps tools backdrop transparent on desktop and lightly tinted on mobile", () => {
    const styles = read("app/components/chat.module.scss");
    const backdropStart = styles.indexOf(".chat-input-action-menu-backdrop {");
    const backdrop = styles.slice(
      backdropStart,
      styles.indexOf(".chat-input-action-menu {", backdropStart),
    );

    expect(backdrop).toContain(
      "--chat-input-action-menu-backdrop-background: transparent",
    );
    expect(backdrop).not.toContain("backdrop-filter: blur");
    expect(styles).toMatch(
      /@media only screen and \(max-width: 600px\)[\s\S]*\.chat-input-action-menu-backdrop-open\s*\{[\s\S]*8%/,
    );
  });

  test("uses a static system-font Hero with responsive target typography", () => {
    const styles = read("app/components/chat.module.scss");
    const heroStart = styles.indexOf(".chat-empty-title {");
    const hero = styles.slice(heroStart, styles.indexOf("\n}", heroStart));

    expect(hero).toContain(
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI"',
    );
    expect(hero).toContain("font-size: clamp(44px, 4vw, 54px)");
    expect(hero).toContain("font-weight: 710");
    expect(hero).toContain("letter-spacing: -0.04em");
    expect(hero).toContain("line-height: 1.08");
    expect(hero).not.toContain("animation:");
    expect(styles).not.toContain("chat-empty-title-shimmer");
    expect(styles).not.toContain('font-family: "Outfit"');
  });

  test("keeps core Composer geometry selectors authoritative", () => {
    const styles = read("app/components/chat.module.scss");
    const modelStart = styles.indexOf("\n.chat-input-model-button {") + 1;
    const model = styles.slice(modelStart, styles.indexOf("\n}", modelStart));
    const sendStart = styles.indexOf("\n.chat-input-send {") + 1;
    const send = styles.slice(sendStart, styles.indexOf("\n}", sendStart));

    expect(styles.match(/^\.chat-input-row::before\s*\{/gm)).toHaveLength(1);
    expect(styles.match(/^\.chat-input-panel-inner\s*\{/gm)).toHaveLength(1);
    expect(styles.match(/^\.chat-input-model-button\s*\{/gm)).toHaveLength(1);
    expect(styles.match(/^\.chat-input-send\s*\{/gm)).toHaveLength(1);
    expect(
      styles.match(
        /^\.chat-mobile-model-menu,\n\.chat-desktop-model-menu\s*\{/gm,
      ),
    ).toHaveLength(1);
    expect(model).toContain("width: clamp(92px, 18cqw, 132px)");
    expect(model).not.toMatch(/\b(?:right|bottom):/);
    expect(model).not.toContain("width: fit-content");
    expect(send).not.toMatch(/\b(?:right|bottom):/);
    expect(styles).not.toContain("calc(100% - 280px)");
    expect(styles).not.toMatch(
      /:global\(\.dark\) \.chat-(?:mobile|desktop)-model-menu\s*\{/,
    );
    expect(styles).not.toMatch(
      /:global\(body:not\(\.light\)\) \.chat-(?:mobile|desktop)-model-menu\s*\{/,
    );
    expect(styles).not.toMatch(/padding:\s*[^;]*(?:148|204|210)px/);
  });

  test("keeps model chip copy on semantic Composer tokens", () => {
    const styles = read("app/components/chat.module.scss");
    const modeChipStart = styles.indexOf(".chat-input-mode-chip {");
    const start = styles.indexOf(".chat-input-model-button {", modeChipStart);
    const end = styles.indexOf(".chat-model-menu-header {", start);
    const chip = styles.slice(start, end);

    expect(chip).toContain("var(--composer-text)");
    expect(chip).toContain("var(--composer-muted)");
    expect(chip).not.toContain("var(--black)");
    expect(chip).not.toContain("var(--black-50)");
  });

  test("routes the reasoning panel through composer tokens", () => {
    const styles = read("app/components/reasoning-effort-rail.module.scss");

    expect(styles).toContain("--reasoning-rail-card: transparent");
    expect(styles).toContain("--reasoning-rail-border: transparent");
    expect(styles).toContain("border-radius: 18px");
    expect(styles).toContain("box-shadow: none");
    expect(styles).toContain("background: var(--composer-rail-thumb-surface)");
    expect(styles).not.toContain("background: #fff");
  });
});
