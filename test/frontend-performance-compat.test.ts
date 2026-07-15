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
    const settingsIcon = readSource("app/icons/settings.svg");

    const settingsStart = sidebar.indexOf('styles["sidebar-settings-link"]');
    const settings = sidebar.slice(
      settingsStart,
      sidebar.indexOf("</Link>", settingsStart),
    );
    expect(settings).not.toContain("<IconButton");
    expect(settings).toContain('styles["sidebar-settings-icon"]');
    expect(settings).toContain("<SettingsIcon />");
    expect(settingsIcon).toContain("stroke:currentColor");
    expect(settingsIcon).not.toContain("stroke:#333");
    expect(sidebar).not.toContain("sidebar-mobile-account");
    expect(sidebar).not.toContain("isIOSMobile");
    expect(homeStyles).toMatch(/transform:\s*translate3d\(-100%, 0, 0\)/);
    expect(homeStyles).toMatch(/transition:\s*transform 0\.2s/);
    expect(homeStyles).toContain(
      "@media (prefers-reduced-transparency: reduce)",
    );
    expect(chatStyles).toContain("container-type: inline-size;");
    expect(chatStyles).toMatch(
      /\.chat-input-row \.chat-input-model-button,[\s\S]*width:\s*clamp\(92px, 18cqw, 132px\);[\s\S]*min-width:\s*0;/,
    );
    expect(chatStyles).not.toContain("padding-right: 136px;");
  });

  test("keeps compact controls touch-safe and Safari glass compatible", () => {
    const chat = readSource("app/components/chat.tsx");
    const chatStyles = readSource("app/components/chat.module.scss");
    const markdownStyles = readSource("app/styles/markdown.scss");

    expect(chat).toContain('"--chat-input-font-size": `${config.fontSize}px`');
    expect(chat).not.toContain("fontSize: config.fontSize");
    expect(chatStyles).toContain(
      "font-size: max(16px, var(--chat-input-font-size, 16px))",
    );
    expect(chatStyles).toMatch(
      /\.chat-mobile-header-button[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/,
    );
    expect(chatStyles).toMatch(
      /@media only screen and \(max-width:\s*600px\)[\s\S]*\.chat-message-action-rail\s*\{[\s\S]*\.chat-input-action\s*\{[\s\S]*width:\s*44px;[\s\S]*height:\s*44px;/,
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
