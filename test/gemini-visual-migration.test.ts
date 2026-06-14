import fs from "fs";
import path from "path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function readCssBlock(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const selectorMatch = new RegExp(`${escapedSelector}\\s*\\{`).exec(source);
  if (!selectorMatch) return "";
  const selectorIndex = selectorMatch.index;

  const openIndex = source.indexOf("{", selectorIndex);
  if (openIndex < 0) return "";

  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === "{") {
      depth += 1;
    } else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex + 1, i);
      }
    }
  }

  return "";
}

function readRootDeclarations(block: string) {
  const nestedIndex = block.search(/\n\s+[.&:#][^{]+\{/);
  return nestedIndex < 0 ? block : block.slice(0, nestedIndex);
}

function readFunctionBlock(source: string, signature: string) {
  const signatureIndex = source.indexOf(signature);
  if (signatureIndex < 0) return "";

  const openIndex = source.indexOf("{", signatureIndex);
  if (openIndex < 0) return "";

  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === "{") {
      depth += 1;
    } else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex + 1, i);
      }
    }
  }

  return "";
}

describe("Gemini visual migration shell", () => {
  test("keeps the Gemini-style empty state hooks and the existing tool menu entry points", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const homeStyles = read("app/components/home.module.scss");
    const globalStyles = read("app/styles/globals.scss");
    const constants = read("app/constant.ts");
    const cnLocale = read("app/locales/cn.ts");
    const enLocale = read("app/locales/en.ts");
    const qaNotes = read("design-qa.md");
    const gitignore = read(".gitignore");
    const emptyInputPanelBlock = readCssBlock(
      chatStyles,
      ".chat-input-panel.chat-input-panel-empty",
    );
    const mobileStyles = chatStyles.slice(
      chatStyles.lastIndexOf("@media only screen and (max-width: 600px)"),
    );
    const mobileEmptyInputPanelBlock = readCssBlock(
      mobileStyles,
      ".chat-input-panel.chat-input-panel-empty",
    );
    const actionMenuBlock = readCssBlock(chatStyles, ".chat-input-action-menu");
    const actionMenuRootDeclarations = readRootDeclarations(actionMenuBlock);
    const onInputBlock = readFunctionBlock(
      chat,
      "const onInput = (text: string) =>",
    );

    expect(chat).toContain('styles["chat-empty-state"]');
    expect(chat).toContain('styles["chat-empty-title"]');
    expect(chat).toContain('styles["chat-empty-halo"]');
    expect(chat).toMatch(
      /const showEmptyHero\s*=\s*showEmptyState\s*&&\s*!hasActiveInputContent\s*&&\s*!showChatActionMenu;/,
    );
    expect(chat).toContain('[styles["chat-body-empty"]]: showEmptyHero');
    expect(chat).toContain("{showEmptyHero && (");
    expect(chat).toContain("Locale.Chat.EmptyTitle");
    expect(chat).not.toContain("你好！想聊点什么？");
    expect(chat).toContain("<ChatActions");
    expect(chat).toContain("handleUploadAttachments");
    expect(chat).toContain("setImageGenerationEnabled");
    expect(chat).toContain('styles["chat-desktop-title-stack"]');
    expect(chat).toContain('styles["chat-desktop-model-title"]');
    expect(chat).toContain('styles["chat-desktop-model-menu"]');
    expect(chat).toMatch(/showMobileModelSelector\s*&&\s*\(/);
    expect(chat).toContain('styles["chat-mobile-model-menu"]');

    expect(chatStyles).toContain(".chat-empty-state");
    expect(chatStyles).toContain(".chat-empty-title");
    expect(chatStyles).toContain(".chat-empty-halo");
    expect(chatStyles).toContain(".chat-desktop-title-stack");
    expect(chatStyles).toContain(".chat-desktop-model-title");
    expect(chatStyles).toContain(".chat-desktop-model-menu");
    expect(chatStyles).toMatch(/@media only screen and \(min-width: 901px\)/);
    expect(chatStyles).toContain(".chat-input-action-menu");
    expect(actionMenuRootDeclarations).toMatch(/box-sizing:\s*border-box;/);
    expect(onInputBlock).toMatch(/setShowChatActionMenu\(false\);/);
    expect(chatStyles).toContain(
      ".chat-input-panel-inner-reasoning:not(.chat-input-panel-inner-collapsed)",
    );
    expect(emptyInputPanelBlock).toMatch(
      /\.chat-input-panel-inner-attach\s*\{[\s\S]*?min-height:\s*150px;/,
    );
    expect(mobileEmptyInputPanelBlock).toMatch(
      /\.chat-input-panel-inner-attach\s*\{[\s\S]*?min-height:\s*146px;/,
    );
    expect(chatStyles).not.toMatch(
      /\.chat-input-panel\.chat-input-panel-empty[\s\S]*?\.chat-input-menu-button\s*\{\s*display:\s*none;/,
    );
    expect(chatStyles).toContain("radial-gradient");

    expect(globalStyles).toContain("--window-width: 100vw");
    expect(globalStyles).toContain("--window-height: var(--full-height)");
    expect(globalStyles).toContain("--sidebar-width: 268px");
    expect(constants).toContain("DEFAULT_SIDEBAR_WIDTH = 268");
    expect(homeStyles).toContain("rgba(249, 251, 253");
    expect(cnLocale).toContain('EmptyTitle: "你好！想聊点什么？"');
    expect(enLocale).toContain(
      'EmptyTitle: "Hello! What would you like to discuss?"',
    );
    expect(qaNotes).not.toContain("console `warn/error` logs empty");
    expect(qaNotes).toContain("known React dev warning");
    expect(gitignore).toContain("design-prototypes/");
    expect(gitignore).toContain(".DS_Store");
  });
});
