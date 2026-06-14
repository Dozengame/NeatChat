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
    const home = read("app/components/home.tsx");
    const sidebar = read("app/components/sidebar.tsx");
    const chatList = read("app/components/chat-list.tsx");
    const homeStyles = read("app/components/home.module.scss");
    const buttonStyles = read("app/components/button.module.scss");
    const globalStyles = read("app/styles/globals.scss");
    const constants = read("app/constant.ts");
    const cnLocale = read("app/locales/cn.ts");
    const enLocale = read("app/locales/en.ts");
    const qaNotes = read("design-qa.md");
    const gitignore = read(".gitignore");
    const chatRootDeclarations = readRootDeclarations(
      readCssBlock(chatStyles, ".chat"),
    );
    const emptyInputPanelBlock = readCssBlock(
      chatStyles,
      ".chat-input-panel.chat-input-panel-empty",
    );
    const inputPanelFocusMenuButtonBlock = readCssBlock(
      chatStyles,
      ".chat-input-panel:focus-within .chat-input-menu-button",
    );
    const emptyInputPanelFocusMenuButtonBlock = readCssBlock(
      chatStyles,
      ".chat-input-panel.chat-input-panel-empty:focus-within .chat-input-menu-button",
    );
    const mobileStyles = chatStyles.slice(
      chatStyles.lastIndexOf("@media only screen and (max-width: 600px)"),
    );
    const desktopStyles = chatStyles.slice(
      chatStyles.indexOf("@media only screen and (min-width: 901px)"),
    );
    const desktopChatRootDeclarations = readRootDeclarations(
      readCssBlock(desktopStyles, ".chat"),
    );
    const mobileEmptyInputPanelBlock = readCssBlock(
      mobileStyles,
      ".chat-input-panel.chat-input-panel-empty",
    );
    const actionMenuBlock = readCssBlock(chatStyles, ".chat-input-action-menu");
    const emptyStateBlock = readCssBlock(chatStyles, ".chat-empty-state");
    const actionMenuRootDeclarations = readRootDeclarations(actionMenuBlock);
    const actionMenuActiveActionBlock = readCssBlock(
      chatStyles,
      ".chat-input-action-menu .chat-input-action-active",
    );
    const mobileActionMenuBlock = readCssBlock(
      mobileStyles,
      ".chat-input-action-menu",
    );
    const mobileStatusRowBlock = readCssBlock(
      mobileStyles,
      ".chat-input-status-row",
    );
    const inputStatusBlock = readCssBlock(
      chatStyles,
      ".chat-input-panel-inner-status",
    );
    const mobileMessageActionsBlock = readCssBlock(
      mobileStyles,
      ".chat-message-actions",
    );
    const mobileHeaderButtonBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-header-button",
    );
    const mobileModelMenuBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-model-menu",
    );
    const mobileModelListBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-model-list",
    );
    const mobileModelOptionBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-model-option",
    );
    const mobileModelOptionSelectedBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-model-option-selected",
    );
    const mobileMenuCheckBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-menu-check",
    );
    const mobileReasoningHeadBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-reasoning-head",
    );
    const mobileReasoningListBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-reasoning-list",
    );
    const mobileReasoningOptionBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-reasoning-option",
    );
    const multimodalTrayBlock = readCssBlock(
      chatStyles,
      ".chat-multimodal-tray",
    );
    const multimodalPrimaryBlock = readCssBlock(
      chatStyles,
      ".chat-multimodal-section-primary",
    );
    const multimodalHeaderBlock = readCssBlock(
      chatStyles,
      ".chat-multimodal-section-header",
    );
    const multimodalTitleBlock = readCssBlock(
      chatStyles,
      ".chat-multimodal-section-title",
    );
    const multimodalSubtitleBlock = readCssBlock(
      chatStyles,
      ".chat-multimodal-section-subtitle",
    );
    const messageRowUserBlock = readCssBlock(
      chatStyles,
      ".chat-message-row-user",
    );
    const messageRowUserOverrideBlock = readCssBlock(
      chatStyles,
      ".chat-reading-surface > .chat-message-row-user",
    );
    const messageContainerBlock = readCssBlock(
      chatStyles,
      ".chat-message-container",
    );
    const chatMessageItemBlock = readCssBlock(
      chatStyles,
      ".chat-message-item",
    );
    const messageActionsBlock = readCssBlock(
      chatStyles,
      ".chat-message-actions",
    );
    const desktopHeaderActionsBlock = readCssBlock(
      chatStyles,
      ".chat-desktop-header-actions",
    );
    const desktopHeaderActionBlock = readCssBlock(
      chatStyles,
      ".chat-desktop-header-action",
    );
    const messageActionRailBlock = readCssBlock(
      chatStyles,
      ".chat-message-action-rail",
    );
    const inputStatusRowBlock = readCssBlock(
      chatStyles.slice(chatStyles.indexOf("\n.chat-input-status-row {")),
      ".chat-input-status-row",
    );
    const inputModeChipBlock = readCssBlock(
      chatStyles,
      ".chat-input-mode-chip",
    );
    const attachmentsContainerBlock = readCssBlock(
      chatStyles,
      ".attachments-container",
    );
    const attachItemBlock = readCssBlock(chatStyles, ".attach-item");
    const attachImageItemBlock = readCssBlock(
      chatStyles,
      ".attach-image-item",
    );
    const attachFileItemBlock = readCssBlock(
      chatStyles,
      ".attach-file-item",
    );
    const attachImageBlock = readCssBlock(chatStyles, ".attach-image");
    const attachFileBlock = readCssBlock(
      chatStyles.slice(chatStyles.lastIndexOf("\n.attach-file {")),
      ".attach-file",
    );
    const mobileAttachImageBlock = readCssBlock(mobileStyles, ".attach-image");
    const mobileAttachFileBlock = readCssBlock(mobileStyles, ".attach-file");
    const finalMobileAttachmentStyles = chatStyles.slice(
      chatStyles.lastIndexOf("@media screen and (max-width: 600px)"),
    );
    const finalMobileAttachmentsContainerBlock = readCssBlock(
      finalMobileAttachmentStyles,
      ".attachments-container",
    );
    const finalMobileAttachFileBlock = readCssBlock(
      finalMobileAttachmentStyles,
      ".attach-file",
    );
    const chatItemBlock = readCssBlock(homeStyles, ".chat-item");
    const chatItemSelectedBlock = readCssBlock(
      homeStyles,
      ".chat-item-selected",
    );
    const chatItemTitleBlock = readCssBlock(homeStyles, ".chat-item-title");
    const chatItemDeleteBlock = readCssBlock(
      homeStyles.slice(homeStyles.indexOf("\n.chat-item-delete {")),
      ".chat-item-delete",
    );
    const chatItemHoverDeleteBlock = readCssBlock(
      homeStyles,
      ".chat-item:hover > .chat-item-delete",
    );
    const mobileChatItemDeleteBlock = readCssBlock(
      homeStyles.slice(homeStyles.lastIndexOf("\n  .chat-item-delete {")),
      ".chat-item-delete",
    );
    const narrowSidebarBlock = readCssBlock(homeStyles, ".narrow-sidebar");
    const onInputBlock = readFunctionBlock(
      chat,
      "const onInput = (text: string) =>",
    );
    const setImageGenerationModeBlock = readFunctionBlock(
      chat,
      "const setImageGenerationMode = async (enabled: boolean) =>",
    );
    const doSubmitBlock = readFunctionBlock(
      chat,
      "const doSubmit = (userInput: string) =>",
    );

    expect(chat).toContain('styles["chat-empty-state"]');
    expect(chat).toContain('styles["chat-empty-title"]');
    expect(chat).not.toContain('styles["chat-empty-halo"]');
    expect(chat).toContain("Locale.Chat.EmptySuggestions");
    expect(chat).toContain('styles["chat-empty-suggestions"]');
    expect(chat).toMatch(
      /<ul[\s\S]*className=\{styles\["chat-empty-suggestions"\]\}[\s\S]*aria-label="建议问题"[\s\S]*>\s*\{Locale\.Chat\.EmptySuggestions\.map/,
    );
    expect(chat).toContain('styles["chat-empty-suggestion-item"]');
    expect(chat).toContain('styles["chat-empty-suggestion"]');
    expect(chat).toMatch(
      /<li[\s\S]*className=\{styles\["chat-empty-suggestion-item"\]\}[\s\S]*>\s*<button[\s\S]*type="button"[\s\S]*className=\{styles\["chat-empty-suggestion"\]\}/,
    );
    expect(chat).toMatch(/onClick=\{\(\) => applyEmptySuggestion\(suggestion\)\}/);
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
    expect(chat).toContain('styles["chat-input-status-row"]');
    expect(chat).toContain('styles["chat-input-mode-chip"]');
    expect(chat).toContain('styles["chat-input-image-mode-chip"]');
    expect(chat).toContain('aria-label="当前输入模式"');
    expect(chat).toContain('aria-label="图片生成模式已开启"');
    expect(chat).toContain("{imageGenerationEnabled && (");
    expect(chat).toContain('styles["chat-multimodal-tray"]');
    expect(chat).toContain('styles["chat-multimodal-section"]');
    expect(chat).toContain('role="dialog"');
    expect(chat).toContain('aria-label="对话工具菜单"');
    expect(chat).toContain('role="group"');
    expect(chat).toContain('aria-label="多模态工具"');
    expect(chat).toContain('styles["chat-multimodal-section-header"]');
    expect(chat).toContain('styles["chat-multimodal-section-title"]');
    expect(chat).toContain('styles["chat-multimodal-section-subtitle"]');
    expect(chat).toContain("<span>添加内容</span>");
    expect(chat).toContain("<span>文件和图片</span>");
    expect(chat).toContain('aria-label="会话工具"');
    expect(chat).toContain("ariaPressed={props.imageGenerationEnabled}");
    expect(chat).toContain("aria-pressed={props.ariaPressed}");
    expect(chat).toContain("const hasSessionActions =");
    expect(chat).toContain('styles["chat-multimodal-section-primary"]');
    expect(chat).toContain('styles["chat-multimodal-section-session"]');
    expect(chat).toContain("isMcpEnabled()");
    expect(chat).toContain("activateMcpClient(JIMENG_MCP_SERVER_ID)");
    expect(chat).toContain("deactivateMcpClient(JIMENG_MCP_SERVER_ID)");
    expect(chat).toContain("JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT");
    expect(chat).toContain("uploadAttachments(");
    expect(chat).toContain('styles["attachments-container"]');
    expect(chat).toContain('aria-label="附件预览"');
    expect(chat).toContain('role="list"');
    expect(chat).toContain('role="listitem"');
    expect(chat).toContain('styles["attach-image-item"]');
    expect(chat).toContain('styles["attach-file-item"]');
    expect(chat).toContain('styles["attach-image"]');
    expect(chat).toContain('aria-label="编辑图片附件"');
    expect(chat).toContain('styles["attach-file"]');
    expect(chat).toContain('styles["chat-desktop-title-stack"]');
    expect(chat).toContain('styles["chat-desktop-model-title"]');
    expect(chat).toContain('styles["chat-desktop-model-menu"]');
    expect(chat).toContain('styles["chat-desktop-header-actions"]');
    expect(chat).toContain('styles["chat-desktop-header-action"]');
    expect(chat).toMatch(/showMobileModelSelector\s*&&\s*\(/);
    expect(chat).toContain('styles["chat-mobile-model-menu"]');
    expect(chat).toContain('aria-controls="mobile-sidebar-drawer"');
    expect(chat).toContain("const isMobileSidebarOpen =");
    expect(chat).toContain("aria-expanded={isMobileSidebarOpen}");
    expect(chat).toContain("data-mobile-sidebar-trigger");
    expect(chat).toContain("onClick={() => navigate(Path.Home)}");
    expect(chat).toContain('aria-label="选择模型"');
    expect(chat).toContain(
      "const modelSelectorButtonRef = useRef<HTMLButtonElement>(null);",
    );
    expect(chat).toContain("ref={modelSelectorButtonRef}");
    expect(chat).toContain("aria-expanded={showMobileModelSelector}");
    expect(chat).toContain('aria-controls="chat-model-menu"');
    expect(chat).toContain('aria-label="关闭模型选择"');
    expect(chat).toContain('id="chat-model-menu"');
    expect(chat).toContain('role="dialog"');
    expect(chat).toMatch(
      /id="chat-model-menu"[\s\S]*role="dialog"[\s\S]*aria-modal="true"[\s\S]*aria-label="模型和思考等级"/,
    );
    expect(chat).toContain('aria-label="模型和思考等级"');
    expect(chat).toMatch(
      /if \(!showMobileModelSelector\) return;[\s\S]*const closeModelSelectorOnEscape = \(event: KeyboardEvent\) =>[\s\S]*event\.key === "Escape"[\s\S]*closeMobileModelSelector\(\);[\s\S]*window\.addEventListener\("keydown", closeModelSelectorOnEscape\);[\s\S]*window\.removeEventListener\("keydown", closeModelSelectorOnEscape\);/,
    );
    expect(chat).toContain(
      "requestAnimationFrame(() => modelSelectorButtonRef.current?.focus());",
    );
    expect(chat).toContain('role="listbox"');
    expect(chat).toContain('aria-label="可选模型"');
    expect(chat).toContain('aria-label="思考等级选项"');
    expect(chat).toContain('aria-label="图片尺寸选项"');
    expect(chat).toContain('aria-label="图片清晰度选项"');
    expect(chat).toContain('role="option"');
    expect(chat).toContain("aria-selected={selected}");
    expect(chat).toContain('"打开对话工具"');
    expect(chat).toMatch(
      /aria-label=\{\s*showChatActionMenu\s*\?\s*"关闭对话工具"\s*:\s*"打开对话工具"\s*\}/,
    );
    expect(chat).toContain('aria-controls="chat-input-action-menu"');
    expect(chat).toContain("aria-expanded={showChatActionMenu}");
    expect(chat).toContain(
      "const chatInputMenuButtonRef = useRef<HTMLButtonElement>(null);",
    );
    expect(chat).toContain("ref={chatInputMenuButtonRef}");
    expect(chat).toContain('aria-label="关闭对话工具"');
    expect(chat).toMatch(
      /id="chat-input-action-menu"[\s\S]*className=\{styles\["chat-input-action-menu"\]\}[\s\S]*role="dialog"[\s\S]*aria-label="对话工具菜单"/,
    );
    expect(chat).toMatch(
      /if \(!showChatActionMenu\) return;[\s\S]*const closeChatActionMenuOnEscape = \(event: KeyboardEvent\) =>[\s\S]*event\.key === "Escape"[\s\S]*setShowChatActionMenu\(false\);[\s\S]*window\.addEventListener\("keydown", closeChatActionMenuOnEscape\);[\s\S]*window\.removeEventListener\("keydown", closeChatActionMenuOnEscape\);/,
    );
    expect(chat).toContain(
      "requestAnimationFrame(() => chatInputMenuButtonRef.current?.focus());",
    );
    expect(chat).toContain("setShowChatActionMenu(false)");
    expect(chat).toContain('id="chat-input"');
    expect(chat).toContain("Locale.Chat.MobileInput");
    expect(chat).toContain("rows={isCompactScreen ? 1 : inputRows}");
    expect(chat).toMatch(
      /className=\{styles\["chat-input"\]\}[\s\S]*aria-label=\{\s*isCompactScreen\s*\?\s*Locale\.Chat\.MobileInput\s*:\s*Locale\.Chat\.Input\(submitKey\)\s*\}/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-input-send"\]\}[\s\S]*aria=\{Locale\.Chat\.Send\}/,
    );
    expect(inputStatusBlock).toContain(".chat-input");
    expect(inputStatusBlock).toContain("width: calc(100% - 96px)");
    expect(chat).toContain('styles["chat-reading-surface"]');
    expect(chat).toMatch(
      /className=\{styles\["chat-reading-surface"\]\}[\s\S]*role="list"[\s\S]*aria-label="会话消息列表"/,
    );
    expect(chat).toContain('styles["chat-message-row"]');
    expect(chat).toContain('styles["chat-message-row-user"]');
    expect(chat).toContain('styles["chat-message-row-assistant"]');
    expect(chat).toMatch(
      /className=\{clsx\([\s\S]*styles\["chat-message-row"\][\s\S]*\)\}[\s\S]*role="listitem"[\s\S]*aria-label=\{`\$\{isUser \? "用户消息" : "助手消息"\} \$\{\s*i \+ 1\s*\}`\}[\s\S]*aria-busy=\{showTyping \? true : undefined\}/,
    );
    expect(chat).toContain('aria-label="消息操作"');
    expect(chat).toContain('styles["chat-message-action-rail"]');
    expect(chat).toContain("aria-label={props.text}");
    expect(chat).not.toContain('style={{ marginTop: "8px" }}');
    expect(sidebar).toContain('styles["sidebar-primary-nav"]');
    expect(sidebar).toContain('styles["sidebar-content-nav"]');
    expect(sidebar).toContain("Locale.Home.PrimarySection");
    expect(sidebar).toContain("Locale.Home.ContentSection");
    expect(sidebar).toContain("Locale.Home.LocalContent");
    expect(sidebar).toContain("Locale.SearchChat.Name");
    expect(sidebar).toContain("Locale.Mask.Name");
    expect(sidebar).toContain("Locale.Discovery.Name");
    expect(sidebar).toContain("Path.NewChat");
    expect(sidebar).toContain("Path.SearchChat");
    expect(sidebar).toContain("Path.Masks");
    expect(sidebar).toContain("Path.Plugins");
    expect(sidebar).toContain("Path.McpMarket");
    expect(sidebar).toContain("Path.Settings");
    expect(sidebar).toContain("Path.Home");
    expect(sidebar).toContain('id="mobile-sidebar-drawer"');
    expect(sidebar).toContain("<ChatList narrow={shouldNarrow}");
    expect(sidebar).toContain("SimpleSelector");
    expect(chatList).toContain('role="list"');
    expect(chatList).toContain("aria-label={Locale.SearchChat.Page.Recent}");
    expect(chatList).toMatch(
      /\{\.\.\.provided\.droppableProps\}[\s\S]*role="list"[\s\S]*aria-label=\{Locale\.SearchChat\.Page\.Recent\}/,
    );
    expect(chatList).toContain('role="listitem"');
    expect(chatList).toContain('aria-current={isCurrentChatItem ? "page" : undefined}');
    expect(chatList).toMatch(
      /\{\.\.\.provided\.draggableProps\}[\s\S]*role="listitem"[\s\S]*aria-current=\{isCurrentChatItem \? "page" : undefined\}/,
    );
    expect(chatList).toMatch(
      /aria-label=\{`\$\{props\.title\}, \$\{Locale\.ChatItem\.ChatItemCount\(\s*props\.count,\s*\)\}`\}/,
    );
    expect(chatList).toMatch(
      /\{\.\.\.dragHandleProps\}[\s\S]*aria-label=\{`\$\{props\.title\}, \$\{Locale\.ChatItem\.ChatItemCount\(\s*props\.count,\s*\)\}`\}/,
    );
    expect(chatList).toContain('aria-label={Locale.Home.DeleteChat}');
    expect(chatList).toContain('styles["chat-item-delete"]');
    expect(chatList).not.toContain('style={{');
    expect(home).toContain('[styles["sidebar-show"]]: isHome');
    expect(home).toContain("isCompactScreen && isHome");
    expect(home).toContain('styles["sidebar-backdrop"]');
    expect(home).toContain('aria-label="关闭侧边栏"');
    expect(home).toContain('aria-controls="mobile-sidebar-drawer"');
    expect(home).toContain('aria-expanded={isHome}');
    expect(home).toContain("navigate(Path.Chat)");

    expect(chatStyles).toContain(".chat-empty-state");
    expect(chatStyles).toContain(".chat-empty-title");
    expect(chatStyles).not.toContain(".chat-empty-halo");
    expect(emptyStateBlock).toMatch(/pointer-events:\s*none;/);
    expect(chatStyles).toContain(".chat-empty-suggestions");
    expect(chatStyles).toContain(".chat-empty-suggestion-item");
    expect(chatStyles).toContain(".chat-empty-suggestion");
    expect(chatStyles).toContain(".chat-reading-surface");
    expect(chatStyles).toContain(".chat-message-row");
    expect(chatStyles).toContain(".chat-message-row-user");
    expect(chatStyles).toContain(".chat-message-row-assistant");
    expect(chatStyles).toContain(".chat-message-action-rail");
    expect(chatStyles).toContain(".attach-image-item");
    expect(chatStyles).toContain(".attach-file-item");
    expect(attachmentsContainerBlock).toMatch(/align-items:\s*center;/);
    expect(attachmentsContainerBlock).toMatch(/gap:\s*8px;/);
    expect(attachmentsContainerBlock).toMatch(/padding:\s*2px 58px 4px 0;/);
    expect(attachmentsContainerBlock).toMatch(/scroll-padding-right:\s*58px;/);
    expect(attachmentsContainerBlock).toMatch(/min-width:\s*0;/);
    expect(attachmentsContainerBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(attachItemBlock).toMatch(/flex:\s*0 0 auto;/);
    expect(attachItemBlock).toMatch(/height:\s*64px;/);
    expect(attachImageItemBlock).toMatch(/width:\s*64px;/);
    expect(attachFileItemBlock).toMatch(/max-width:\s*min\(220px,\s*68vw\);/);
    expect(attachImageBlock).toMatch(/width:\s*64px;/);
    expect(attachImageBlock).toMatch(/height:\s*64px;/);
    expect(attachFileBlock).toMatch(/height:\s*64px;/);
    expect(attachFileBlock).toMatch(/min-width:\s*176px;/);
    expect(mobileAttachImageBlock).toMatch(/width:\s*58px;/);
    expect(mobileAttachImageBlock).toMatch(/height:\s*58px;/);
    expect(mobileAttachFileBlock).toMatch(/height:\s*58px;/);
    expect(finalMobileAttachmentsContainerBlock).toMatch(
      /padding:\s*2px 50px 4px 0;/,
    );
    expect(finalMobileAttachFileBlock).toMatch(/width:\s*min\(170px,\s*55vw\);/);
    expect(messageActionsBlock).toMatch(/margin-top:\s*8px;/);
    expect(messageActionsBlock).toMatch(/transform:\s*translateY\(4px\);/);
    expect(messageActionsBlock).toMatch(/pointer-events:\s*none;/);
    expect(messageActionRailBlock).toMatch(/display:\s*inline-flex;/);
    expect(messageActionRailBlock).toMatch(/flex-wrap:\s*wrap;/);
    expect(messageActionRailBlock).toMatch(/border-radius:\s*999px;/);
    expect(messageActionRailBlock).toMatch(/max-width:\s*100%;/);
    expect(messageActionRailBlock).toMatch(/\.chat-input-action[\s\S]*height:\s*30px;/);
    expect(messageActionRailBlock).toMatch(/\.text[\s\S]*display:\s*none;/);
    expect(mobileMessageActionsBlock).toMatch(/opacity:\s*1\s*!important;/);
    expect(mobileMessageActionsBlock).toMatch(/pointer-events:\s*auto\s*!important;/);
    expect(mobileMessageActionsBlock).toMatch(/transform:\s*none\s*!important;/);
    expect(mobileMessageActionsBlock).toMatch(/transition:\s*none\s*!important;/);
    expect(messageRowUserBlock).toMatch(/flex-direction:\s*row;/);
    expect(messageRowUserBlock).toMatch(/justify-content:\s*flex-end;/);
    expect(messageRowUserOverrideBlock).toMatch(/flex-direction:\s*row;/);
    expect(messageRowUserOverrideBlock).toMatch(/justify-content:\s*flex-end;/);
    expect(messageContainerBlock).toMatch(/min-width:\s*0;/);
    expect(chatMessageItemBlock).toMatch(/overflow-wrap:\s*anywhere;/);
    expect(chatStyles.indexOf(".chat-reading-surface > .chat-message-row-user")).toBeGreaterThan(
      chatStyles.indexOf(".chat-message-user"),
    );
    expect(chatStyles).toMatch(/--conversation-max-width:\s*min\(920px,\s*100%\);/);
    expect(chatStyles).toMatch(/--assistant-message-max-width:\s*min\(760px,\s*100%\);/);
    expect(chatStyles).toMatch(/--user-message-max-width:\s*min\(660px,\s*100%\);/);
    expect(chatStyles).toContain(".chat-desktop-title-stack");
    expect(chatStyles).toContain(".chat-desktop-model-title");
    expect(chatStyles).toContain(".chat-desktop-model-menu");
    expect(chatStyles).toContain(".chat-desktop-header-actions");
    expect(chatStyles).toContain(".chat-desktop-header-action");
    expect(desktopHeaderActionsBlock).toMatch(/display:\s*inline-flex;/);
    expect(desktopHeaderActionsBlock).toMatch(/align-items:\s*center;/);
    expect(desktopHeaderActionsBlock).toMatch(/gap:\s*4px\s*!important;/);
    expect(desktopHeaderActionsBlock).toMatch(/padding:\s*3px;/);
    expect(desktopHeaderActionsBlock).toMatch(/border-radius:\s*999px;/);
    expect(desktopHeaderActionsBlock).toMatch(/max-width:\s*min\(240px,\s*28vw\);/);
    expect(desktopHeaderActionBlock).toMatch(/flex:\s*0 0 auto;/);
    expect(desktopHeaderActionBlock).toMatch(/:global\(button\)[\s\S]*width:\s*34px;/);
    expect(desktopHeaderActionBlock).toMatch(/:global\(button\)[\s\S]*height:\s*34px;/);
    expect(desktopHeaderActionBlock).toMatch(/:global\(button\)[\s\S]*border-radius:\s*999px;/);
    expect(desktopHeaderActionBlock).toMatch(/:global\(button\)[\s\S]*padding:\s*0;/);
    expect(chatStyles).toContain(".chat-mobile-header");
    expect(chatStyles).toContain(".chat-mobile-header-button");
    expect(chatStyles).toMatch(/@media only screen and \(min-width: 901px\)/);
    expect(chatStyles).toContain(".chat-input-action-menu");
    expect(chatStyles).toContain(".chat-input-action-menu-backdrop");
    expect(chatStyles).toContain(".chat-mobile-model-title[aria-expanded");
    expect(chatStyles).toContain(".chat-mobile-model-menu-backdrop");
    expect(chatStyles).toContain(".chat-mobile-model-menu");
    expect(mobileModelMenuBlock).toMatch(
      /width:\s*min\(320px,\s*calc\(100vw - 48px\)\);/,
    );
    expect(mobileModelMenuBlock).toMatch(
      /max-height:\s*min\(640px,\s*calc\(100vh - 96px\)\);/,
    );
    expect(mobileModelMenuBlock).toMatch(/padding:\s*12px;/);
    expect(mobileModelMenuBlock).toMatch(/border-radius:\s*24px;/);
    expect(mobileModelListBlock).toMatch(/max-height:\s*min\(260px,\s*34vh\);/);
    expect(mobileModelListBlock).toMatch(/padding-right:\s*2px;/);
    expect(mobileModelOptionBlock).toMatch(
      /grid-template-columns:\s*34px minmax\(0,\s*1fr\);/,
    );
    expect(mobileModelOptionBlock).toMatch(/padding:\s*9px 12px 9px 0;/);
    expect(mobileModelOptionSelectedBlock).toMatch(
      /background:\s*rgba\(25,\s*103,\s*210,\s*0\.1\);/,
    );
    expect(mobileMenuCheckBlock).toMatch(/display:\s*inline-flex;/);
    expect(mobileMenuCheckBlock).toMatch(/align-items:\s*center;/);
    expect(mobileMenuCheckBlock).toMatch(/justify-content:\s*center;/);
    expect(mobileMenuCheckBlock).toMatch(/width:\s*34px;/);
    expect(mobileReasoningHeadBlock).toMatch(
      /padding:\s*10px 12px 10px 46px;/,
    );
    expect(mobileReasoningListBlock).toMatch(/padding-right:\s*2px;/);
    expect(mobileReasoningOptionBlock).toMatch(
      /grid-template-columns:\s*34px minmax\(0,\s*1fr\);/,
    );
    expect(chatStyles).toContain("background: var(--surface-elevated)");
    expect(chatStyles).toContain("outline: var(--focus-ring)");
    expect(chatStyles).toContain("box-shadow: var(--focus-ring-shadow)");
    expect(chatStyles).toContain(".chat-input-action:focus-visible");
    expect(chatStyles).toContain(".chat-mobile-model-title:focus-visible");
    expect(chatStyles).toContain(".chat-input-status-row");
    expect(chatStyles).toContain(".chat-input-mode-chip");
    expect(chatStyles).toContain(
      ".chat-input-panel:focus-within .chat-input-menu-button",
    );
    expect(inputPanelFocusMenuButtonBlock).toMatch(
      /border-color:\s*rgba\(49,\s*94,\s*248,\s*0\.28\);/,
    );
    expect(inputPanelFocusMenuButtonBlock).toMatch(
      /background:\s*var\(--surface-elevated\);/,
    );
    expect(inputPanelFocusMenuButtonBlock).toMatch(
      /box-shadow:[\s\S]*var\(--composer-shadow\),[\s\S]*0 0 0 3px rgba\(49,\s*94,\s*248,\s*0\.08\);/,
    );
    expect(chatStyles).toContain(
      ".chat-input-panel.chat-input-panel-empty:focus-within .chat-input-menu-button",
    );
    expect(emptyInputPanelFocusMenuButtonBlock).toMatch(
      /border-color:\s*rgba\(49,\s*94,\s*248,\s*0\.28\);/,
    );
    expect(emptyInputPanelFocusMenuButtonBlock).toMatch(
      /box-shadow:[\s\S]*var\(--composer-shadow\),[\s\S]*0 0 0 3px rgba\(49,\s*94,\s*248,\s*0\.08\);/,
    );
    expect(inputStatusRowBlock).toMatch(/position:\s*absolute;/);
    expect(inputStatusRowBlock).toMatch(/left:\s*14px;/);
    expect(inputStatusRowBlock).toMatch(/right:\s*58px;/);
    expect(inputStatusRowBlock).toMatch(/bottom:\s*10px;/);
    expect(inputStatusRowBlock).toMatch(/display:\s*flex;/);
    expect(inputStatusRowBlock).toMatch(/min-width:\s*0;/);
    expect(inputModeChipBlock).toMatch(/height:\s*30px;/);
    expect(inputModeChipBlock).toMatch(/max-width:\s*100%;/);
    expect(inputModeChipBlock).toMatch(/border-radius:\s*15px;/);
    expect(mobileStatusRowBlock).toMatch(/right:\s*52px;/);
    expect(mobileHeaderButtonBlock).toMatch(/appearance:\s*none;/);
    expect(mobileHeaderButtonBlock).toMatch(/border:\s*var\(--border-in-light\);/);
    expect(chatStyles).toContain(".chat-multimodal-tray");
    expect(chatStyles).toContain(".chat-multimodal-section");
    expect(chatStyles).toContain(".chat-multimodal-section-primary");
    expect(chatStyles).toContain(".chat-multimodal-section-session");
    expect(multimodalTrayBlock).toMatch(/display:\s*flex;/);
    expect(multimodalTrayBlock).toMatch(/gap:\s*6px;/);
    expect(multimodalPrimaryBlock).toMatch(/min-width:\s*0;/);
    expect(multimodalHeaderBlock).toMatch(/display:\s*flex;/);
    expect(multimodalHeaderBlock).toMatch(/justify-content:\s*space-between;/);
    expect(multimodalHeaderBlock).toMatch(/width:\s*100%;/);
    expect(multimodalTitleBlock).toMatch(/font-weight:\s*600;/);
    expect(chatStyles).toMatch(
      /\.chat-multimodal-section-subtitle\s*\{[\s\S]*color:\s*var\(--black-50\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(/box-sizing:\s*border-box;/);
    expect(actionMenuRootDeclarations).toMatch(
      /width:\s*min\(336px,\s*calc\(100vw - 32px\)\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(/padding:\s*10px;/);
    expect(actionMenuRootDeclarations).toMatch(/border-radius:\s*20px;/);
    expect(actionMenuActiveActionBlock).toMatch(
      /background:\s*rgba\(25,\s*103,\s*210,\s*0\.1\);/,
    );
    expect(actionMenuActiveActionBlock).toMatch(/color:\s*var\(--primary\);/);
    expect(mobileActionMenuBlock).toMatch(
      /bottom:\s*calc\(64px \+ env\(safe-area-inset-bottom\)\);/,
    );
    expect(mobileActionMenuBlock).toMatch(
      /width:\s*min\(320px,\s*calc\(100vw - 48px\)\);/,
    );
    expect(mobileActionMenuBlock).toMatch(/max-height:\s*min\(360px,\s*48vh\);/);
    expect(mobileActionMenuBlock).toMatch(/padding:\s*12px;/);
    expect(mobileActionMenuBlock).toMatch(/border-radius:\s*22px;/);
    expect(onInputBlock).toMatch(/setShowChatActionMenu\(false\);/);
    expect(setImageGenerationModeBlock).toContain("isMcpEnabled()");
    expect(setImageGenerationModeBlock).toContain(
      "activateMcpClient(JIMENG_MCP_SERVER_ID)",
    );
    expect(setImageGenerationModeBlock).toContain(
      "deactivateMcpClient(JIMENG_MCP_SERVER_ID)",
    );
    expect(setImageGenerationModeBlock).toMatch(/chatStore\.resetMcpCache\(\);/);
    expect(doSubmitBlock).toContain("attachImages");
    expect(doSubmitBlock).toContain("JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT");
    expect(chatStyles).toContain(
      ".chat-input-panel-inner-reasoning:not(.chat-input-panel-inner-collapsed)",
    );
    expect(chatStyles).toContain(".chat-input-panel-inner-status");
    expect(chatStyles).toMatch(
      /\.chat-input-panel-inner-status[\s\S]*?padding-bottom:\s*38px;/,
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
    expect(chatRootDeclarations).toMatch(/background:\s*var\(--surface\);/);
    expect(chatRootDeclarations).not.toContain("radial-gradient");
    expect(desktopChatRootDeclarations).toMatch(
      /background:\s*var\(--surface\);/,
    );
    expect(desktopChatRootDeclarations).not.toContain("radial-gradient");
    expect(desktopChatRootDeclarations).not.toContain("linear-gradient");

    expect(globalStyles).toContain("--window-width: 100vw");
    expect(globalStyles).toContain("--window-height: var(--full-height)");
    expect(globalStyles).toContain("--sidebar-width: 268px");
    expect(globalStyles).toContain("--surface-elevated:");
    expect(globalStyles).toContain("--focus-ring:");
    expect(globalStyles).toContain("--focus-ring-shadow:");
    expect(globalStyles).toMatch(
      /@mixin dark[\s\S]*--surface-elevated:[\s\S]*--focus-ring:[\s\S]*--focus-ring-shadow:/,
    );
    expect(constants).toContain("DEFAULT_SIDEBAR_WIDTH = 268");
    expect(buttonStyles).toContain("&:focus-visible");
    expect(buttonStyles).toContain("outline: var(--focus-ring)");
    expect(buttonStyles).toContain("box-shadow: var(--focus-ring-shadow)");
    expect(homeStyles).toContain("rgba(249, 251, 253");
    expect(homeStyles).toContain(
      "--mobile-sidebar-drawer-width: min(304px, calc(100vw - 54px));",
    );
    expect(homeStyles).toContain(".sidebar-backdrop");
    expect(homeStyles).toContain("z-index: 900");
    expect(homeStyles).toContain("z-index: 1000");
    expect(homeStyles).toMatch(/\.sidebar-show\s*\{\s*left:\s*0;/);
    expect(homeStyles).toContain("outline: var(--focus-ring)");
    expect(homeStyles).toContain("box-shadow: var(--focus-ring-shadow)");
    expect(homeStyles).toContain(".sidebar-primary-nav");
    expect(homeStyles).toContain(".sidebar-content-nav");
    expect(homeStyles).toContain(".sidebar-content-card");
    expect(chatItemBlock).toMatch(/padding:\s*8px 40px 8px 12px;/);
    expect(chatItemSelectedBlock).toMatch(/&::before[\s\S]*left:\s*0;/);
    expect(chatItemSelectedBlock).toMatch(/&::before[\s\S]*width:\s*3px;/);
    expect(chatItemSelectedBlock).toMatch(
      /&::before[\s\S]*height:\s*calc\(100% - 16px\);/,
    );
    expect(chatItemSelectedBlock).toMatch(
      /&::before[\s\S]*background:\s*var\(--primary\);/,
    );
    expect(chatItemTitleBlock).toMatch(/width:\s*100%;/);
    expect(chatItemDeleteBlock).toMatch(/appearance:\s*none;/);
    expect(chatItemDeleteBlock).toMatch(/width:\s*32px;/);
    expect(chatItemDeleteBlock).toMatch(/height:\s*32px;/);
    expect(chatItemDeleteBlock).toMatch(/border-radius:\s*999px;/);
    expect(chatItemDeleteBlock).toMatch(/display:\s*inline-flex;/);
    expect(chatItemDeleteBlock).toMatch(/align-items:\s*center;/);
    expect(chatItemDeleteBlock).toMatch(/justify-content:\s*center;/);
    expect(chatItemDeleteBlock).toMatch(/pointer-events:\s*none;/);
    expect(chatItemDeleteBlock).toMatch(/&:focus-visible[\s\S]*opacity:\s*1;/);
    expect(chatItemDeleteBlock).toMatch(/&:focus-visible[\s\S]*pointer-events:\s*auto;/);
    expect(chatItemDeleteBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(chatItemHoverDeleteBlock).toMatch(/pointer-events:\s*auto;/);
    expect(narrowSidebarBlock).toMatch(
      /\.chat-item-delete[\s\S]*width:\s*34px;[\s\S]*height:\s*34px;/,
    );
    expect(mobileChatItemDeleteBlock).toMatch(/opacity:\s*0.72;/);
    expect(mobileChatItemDeleteBlock).toMatch(/width:\s*34px;/);
    expect(mobileChatItemDeleteBlock).toMatch(/height:\s*34px;/);
    expect(cnLocale).toContain('EmptyTitle: "你好！想聊点什么？"');
    expect(cnLocale).toContain("EmptySuggestions:");
    expect(cnLocale).toContain("PrimarySection:");
    expect(cnLocale).toContain("ContentSection:");
    expect(cnLocale).toContain("LocalContent:");
    expect(enLocale).toContain(
      'EmptyTitle: "Hello! What would you like to discuss?"',
    );
    expect(enLocale).toContain("EmptySuggestions:");
    expect(enLocale).toContain("PrimarySection:");
    expect(enLocale).toContain("ContentSection:");
    expect(enLocale).toContain("LocalContent:");
    expect(qaNotes).not.toContain("console `warn/error` logs empty");
    expect(qaNotes).toContain("known React dev warning");
    expect(gitignore).toContain("design-prototypes/");
    expect(gitignore).toContain(".DS_Store");
  });
});
