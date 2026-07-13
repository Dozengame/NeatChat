import fs from "node:fs";
import path from "node:path";

const readSource = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("frontend performance and compatibility contracts", () => {
  test("loads optional chat tools and provider discovery on demand", () => {
    const chat = readSource("app/components/chat.tsx");
    const home = readSource("app/components/home.tsx");
    const staticImports = chat.slice(0, chat.indexOf("const localStorage"));

    expect(staticImports).not.toMatch(/from "\.\/exporter"/);
    expect(staticImports).not.toMatch(/from "\.\/image-editor"/);
    expect(staticImports).not.toMatch(/from "\.\/realtime-chat"/);
    expect(staticImports).not.toMatch(/from "\.\.\/utils\/ms_edge_tts"/);
    expect(chat).toContain('import("./exporter")');
    expect(chat).toContain('import("./image-editor")');
    expect(chat).toContain('import("./realtime-chat")');
    expect(chat).toMatch(/import\(\s*"\.\.\/utils\/ms_edge_tts"\s*\)/);
    expect(home).not.toMatch(/import \{[^}]*getClientApi[^}]*\} from/);
    expect(home).toContain('await import("../client/api")');
  });

  test("keeps long-message windows anchored and indexed by absolute position", () => {
    const chat = readSource("app/components/chat.tsx");

    expect(chat).toContain("pendingMessageWindowAnchorRef");
    expect(chat).toContain(
      'querySelectorAll<HTMLElement>("[data-message-anchor]")',
    );
    expect(chat).toContain("getAnchoredScrollTop(");
    expect(chat).toContain(
      "const absoluteMessageIndex = messageRenderStartIndex + i",
    );
    expect(chat).toContain(
      "const isContext = absoluteMessageIndex < context.length",
    );
    expect(chat).toContain(
      "absoluteMessageIndex === clearContextAbsoluteIndex - 1",
    );
  });

  test("avoids stream-time listener churn and disabled preview projection work", () => {
    const chat = readSource("app/components/chat.tsx");
    const shortcutEffect = chat.slice(
      chat.indexOf("// 快捷键 shortcut keys"),
      chat.indexOf("const [showChatSidePanel"),
    );

    expect(chat).toContain(
      'const previewInput = config.sendPreviewBubble ? userInput : ""',
    );
    expect(chat).toContain("const shortcutMessagesRef = useRef(messages)");
    expect(shortcutEffect).not.toMatch(/\[\s*messages,/);
    expect(shortcutEffect).not.toMatch(/\bchatStore,\s*\n/);
    expect(chat).toContain("useChatStore((state) => {");
    expect(chat).toContain("}, shallow)");
  });

  test("defers history image loading and decoding on both render paths", () => {
    const gallery = readSource("app/components/message-image-gallery.tsx");
    const markdown = readSource("app/components/markdown.tsx");

    expect(gallery.match(/loading="lazy"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(gallery.match(/decoding="async"/g)?.length).toBeGreaterThanOrEqual(
      2,
    );
    expect(markdown.match(/loading="lazy"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(markdown.match(/decoding="async"/g)?.length).toBeGreaterThanOrEqual(
      2,
    );
    expect(gallery).toContain("props.images.map((image, index)");
    expect(gallery).toContain(
      'key={getAttachmentRenderKey("image", image, index)}',
    );
  });

  test("avoids duplicate Markdown listeners and permanent timing keys", () => {
    const markdown = readSource("app/components/markdown.tsx");
    const tableObserverStart = markdown.indexOf(
      "const tableResizeObserver = new ResizeObserver",
    );
    const tableObserverEnd = markdown.indexOf(
      "}, [syncTableScrollHint, tableIsExpanded]);",
      tableObserverStart,
    );
    const tableObserver = markdown.slice(tableObserverStart, tableObserverEnd);

    expect(markdown).not.toContain(
      'codeScroller.addEventListener("scroll", syncCodeScrollHint',
    );
    expect(markdown).toContain("onScroll={syncCodeScrollHint}");
    expect(tableObserver).not.toContain(
      'window.addEventListener("resize", syncTableScrollHint)',
    );
    expect(markdown).not.toContain("msg_start_");
    expect(markdown).not.toContain("onContentChange");
  });

  test("uses one semantic settings target and compositor drawer motion", () => {
    const sidebar = readSource("app/components/sidebar.tsx");
    const homeStyles = readSource("app/components/home.module.scss");
    const chatStyles = readSource("app/components/chat.module.scss");

    const mobileSettings = sidebar.slice(
      sidebar.indexOf('styles["sidebar-mobile-account-settings"]'),
      sidebar.indexOf(
        "</Link>",
        sidebar.indexOf('styles["sidebar-mobile-account-settings"]'),
      ),
    );
    expect(mobileSettings).not.toContain("<IconButton");
    expect(mobileSettings).toContain("<SettingsIcon />");
    const desktopSettingsStart = sidebar.indexOf(
      'styles["sidebar-settings-link"]',
    );
    const desktopSettings = sidebar.slice(
      desktopSettingsStart,
      sidebar.indexOf("</Link>", desktopSettingsStart),
    );
    expect(desktopSettings).not.toContain("<IconButton");
    expect(desktopSettings).toContain('styles["sidebar-settings-icon"]');
    expect(sidebar).not.toContain("isIOSMobile");
    expect(homeStyles).toMatch(/transform:\s*translate3d\(-100%, 0, 0\)/);
    expect(homeStyles).toMatch(/transition:\s*transform 0\.2s/);
    expect(homeStyles).toContain(
      "@media (prefers-reduced-transparency: reduce)",
    );
    expect(chatStyles).toMatch(
      /@media only screen and \(max-width: 358px\)[\s\S]*\.chat-input-model-button\s*\{[\s\S]*min-width:\s*64px;[\s\S]*max-width:\s*64px;[\s\S]*\.chat-input-panel-inner-with-model\s*\{[\s\S]*padding-right:\s*136px;/,
    );
  });

  test("keeps compact controls touch-safe and Safari glass compatible", () => {
    const chat = readSource("app/components/chat.tsx");
    const chatStyles = readSource("app/components/chat.module.scss");
    const markdownStyles = readSource("app/styles/markdown.scss");

    expect(chat).toContain(
      '"--chat-input-font-size": `${config.fontSize}px`',
    );
    expect(chat).not.toContain("fontSize: config.fontSize");
    expect(chatStyles).toContain(
      "font-size: max(16px, var(--chat-input-font-size, 16px))",
    );
    expect(chatStyles).toMatch(
      /\.chat-mobile-header-button[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/,
    );
    expect(chatStyles).toMatch(
      /\.chat-message-action-rail[\s\S]*\.chat-input-action\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/,
    );
    expect(markdownStyles).toContain("--markdown-code-action-size: 44px");
    expect(chatStyles).toMatch(
      /-webkit-backdrop-filter:\s*blur\(18px\);\s*backdrop-filter:\s*blur\(18px\);/,
    );
    expect(chatStyles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.chat-message-tail\s*\{[\s\S]*animation:\s*none !important;/,
    );
  });
});
