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
    const newChat = read("app/components/new-chat.tsx");
    const newChatStyles = read("app/components/new-chat.module.scss");
    const sidebar = read("app/components/sidebar.tsx");
    const chatList = read("app/components/chat-list.tsx");
    const homeStyles = read("app/components/home.module.scss");
    const button = read("app/components/button.tsx");
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
    const scrollToBottomBlock = readCssBlock(
      chatStyles,
      ".chat-scroll-to-bottom",
    );
    const emptyStateBlock = readCssBlock(chatStyles, ".chat-empty-state");
    const emptySuggestionsBlock = readCssBlock(
      chatStyles,
      ".chat-empty-suggestions",
    );
    const emptySuggestionBlock = readCssBlock(
      chatStyles,
      ".chat-empty-suggestion",
    );
    const emptySuggestionTextBlock = readCssBlock(
      chatStyles,
      ".chat-empty-suggestion-text",
    );
    const emptySuggestionAffordanceBlock = readCssBlock(
      chatStyles,
      ".chat-empty-suggestion-affordance",
    );
    const actionMenuRootDeclarations = readRootDeclarations(actionMenuBlock);
    const actionMenuActiveActionBlock = readCssBlock(
      chatStyles,
      ".chat-input-action-menu .chat-input-action-active",
    );
    const mobileActionMenuBlock = readCssBlock(
      mobileStyles,
      ".chat-input-action-menu",
    );
    const mobileScrollToBottomBlock = readCssBlock(
      mobileStyles,
      ".chat-scroll-to-bottom",
    );
    const mobileStatusRowBlock = readCssBlock(
      mobileStyles,
      ".chat-input-status-row",
    );
    const mobileEmptySuggestionBlock = readCssBlock(
      mobileStyles,
      ".chat-empty-suggestion",
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
    const mobileModelTitleBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-model-title",
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
    const mobileMenuModelOptionBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-model-menu .chat-mobile-model-option",
    );
    const mobileModelOptionSelectedBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-model-option-selected",
    );
    const mobileMenuModelOptionSelectedBlock = readCssBlock(
      chatStyles,
      ".chat-mobile-model-menu .chat-mobile-model-option-selected",
    );
    const desktopMenuModelOptionBlock = readCssBlock(
      chatStyles,
      ".chat-desktop-model-menu .chat-mobile-model-option",
    );
    const desktopMenuModelOptionSelectedBlock = readCssBlock(
      chatStyles,
      ".chat-desktop-model-menu .chat-mobile-model-option-selected",
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
    const mobileDesktopHeaderActionsBlock = readCssBlock(
      mobileStyles,
      ".chat-desktop-header-actions",
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
    const newChatHeaderBlock = readCssBlock(
      newChatStyles,
      ".mask-header",
    );
    const chatItemBlock = readCssBlock(homeStyles, ".chat-item");
    const chatItemSelectedBlock = readCssBlock(
      homeStyles,
      ".chat-item-selected",
    );
    const chatItemTitleBlock = readCssBlock(homeStyles, ".chat-item-title");
    const sidebarBlock = readCssBlock(
      homeStyles.slice(homeStyles.indexOf("\n.sidebar {")),
      ".sidebar",
    );
    const sidebarBodyBlock = readCssBlock(
      homeStyles.slice(homeStyles.lastIndexOf("\n.sidebar-body {")),
      ".sidebar-body",
    );
    const sidebarNavItemBlock = readCssBlock(homeStyles, ".sidebar-nav-item");
    const sidebarNavItemActiveBlock = readCssBlock(
      homeStyles,
      ".sidebar-nav-item-active",
    );
    const sidebarContentCardActiveBlock = readCssBlock(
      homeStyles,
      ".sidebar-content-card-active",
    );
    const sidebarSettingsLinkActiveBlock = readCssBlock(
      homeStyles,
      ".sidebar-settings-link-active",
    );
    const darkSidebarContentCardActiveBlock = readCssBlock(
      homeStyles,
      ":global(.dark) .sidebar-content-card-active",
    );
    const compactContainerBlock = readCssBlock(
      homeStyles,
      ".compact-container",
    );
    const compactSidebarBackdropBlock = readCssBlock(
      homeStyles,
      ".compact-container .sidebar-backdrop",
    );
    const compactContainerSidebarBlock = readCssBlock(
      compactContainerBlock,
      ".sidebar",
    );
    const homeMobileStyles = homeStyles.slice(
      homeStyles.indexOf("@media only screen and (max-width: 767px)"),
    );
    const homeMobileCompactBlock = readCssBlock(
      homeMobileStyles,
      ".compact-container",
    );
    const homeMobileCompactSidebarBlock = readCssBlock(
      homeMobileCompactBlock,
      ".sidebar",
    );
    const chatItemDeleteBlock = readCssBlock(
      homeStyles.slice(homeStyles.indexOf("\n.chat-item-delete {")),
      ".chat-item-delete",
    );
    const chatItemHoverDeleteBlock = readCssBlock(
      homeStyles,
      ".chat-item:hover > .chat-item-delete",
    );
    const chatItemFocusWithinDeleteBlock = readCssBlock(
      homeStyles,
      ".chat-item:focus-within > .chat-item-delete",
    );
    const mobileChatItemDeleteBlock = readCssBlock(
      homeStyles.slice(homeStyles.lastIndexOf("\n  .chat-item-delete {")),
      ".chat-item-delete",
    );
    const compactSidebarShowDeleteBlock = readCssBlock(
      homeStyles,
      ".sidebar-show .chat-item-delete",
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
    expect(chat).toMatch(
      /!isCompactScreen && config\.enablePromptHints && \([\s\S]*<ChatAction[\s\S]*onClick=\{\(\) => \{[\s\S]*props\.showPromptHints\(\);[\s\S]*props\.onActionComplete\?\.\(\);[\s\S]*\}\}[\s\S]*text=\{Locale\.Chat\.InputActions\.Prompt\}/,
    );
    expect(chat).toContain("handleUploadAttachments");
    expect(chat).toContain("setImageGenerationEnabled");
    expect(chat).toContain('styles["chat-input-status-row"]');
    expect(chat).toContain('styles["chat-input-mode-chip"]');
    expect(chat).toContain('styles["chat-input-image-mode-chip"]');
    expect(chat).toContain('aria-label="当前输入模式"');
    expect(chat).toMatch(
      /className=\{styles\["chat-input-status-row"\]\}[\s\S]*role="status"[\s\S]*aria-live="polite"[\s\S]*aria-atomic="true"[\s\S]*aria-label="当前输入模式"/,
    );
    expect(chat).toMatch(
      /className=\{clsx\([\s\S]*styles\["chat-input-mode-chip"\][\s\S]*styles\["chat-input-reasoning"\][\s\S]*\)\}[\s\S]*aria-label=\{`思考等级：\$\{reasoningLabels\[currentReasoningEffort\]\}`\}[\s\S]*aria-haspopup="listbox"[\s\S]*aria-expanded=\{showReasoningSelectorModal\}/,
    );
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
    expect(chat).toMatch(
      /aria-label="会话工具"[\s\S]*className=\{styles\["chat-multimodal-section-header"\]\}[\s\S]*className=\{styles\["chat-multimodal-section-title"\]\}[\s\S]*<span>会话<\/span>[\s\S]*className=\{styles\["chat-multimodal-section-subtitle"\]\}[\s\S]*<span>模型和设置<\/span>/,
    );
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
    expect(chat).toMatch(
      /<IconButton[\s\S]*icon=\{<ReloadIcon \/>\}[\s\S]*title=\{Locale\.Chat\.Actions\.RefreshTitle\}[\s\S]*aria=\{Locale\.Chat\.Actions\.RefreshTitle\}/,
    );
    expect(chat).toMatch(
      /<IconButton[\s\S]*icon=\{<ExportIcon \/>\}[\s\S]*title=\{Locale\.Chat\.Actions\.Export\}[\s\S]*aria=\{Locale\.Chat\.Actions\.Export\}/,
    );
    expect(chat).toMatch(/showMobileModelSelector\s*&&\s*\(/);
    expect(chat).toContain('styles["chat-mobile-model-menu"]');
    expect(chat).toContain('aria-controls="mobile-sidebar-drawer"');
    expect(chat).toContain("const isMobileSidebarOpen =");
    expect(chat).toContain("aria-expanded={isMobileSidebarOpen}");
    expect(chat).toContain("data-mobile-sidebar-trigger");
    expect(chat).toContain("onClick={() => navigate(Path.Home)}");
    expect(button).toContain("ariaControls?: string;");
    expect(button).toContain("ariaExpanded?: boolean;");
    expect(button).toContain("dataMobileSidebarTrigger?: boolean;");
    expect(button).toContain("aria-controls={props.ariaControls}");
    expect(button).toContain("aria-expanded={props.ariaExpanded}");
    expect(button).toMatch(
      /data-mobile-sidebar-trigger=\{[\s\S]*props\.dataMobileSidebarTrigger \? true : undefined[\s\S]*\}/,
    );
    expect(newChat).toContain("useCompactScreen()");
    expect(newChat).toContain("const isCompactScreen =");
    expect(newChat).toMatch(
      /<IconButton[\s\S]*icon=\{<LeftIcon \/>\}[\s\S]*text=\{Locale\.NewChat\.Return\}[\s\S]*aria=\{[\s\S]*isCompactScreen[\s\S]*\? Locale\.Chat\.Actions\.ChatList[\s\S]*: Locale\.NewChat\.Return[\s\S]*\}[\s\S]*ariaControls=\{isCompactScreen \? "mobile-sidebar-drawer" : undefined\}[\s\S]*ariaExpanded=\{isCompactScreen \? false : undefined\}[\s\S]*dataMobileSidebarTrigger=\{isCompactScreen\}[\s\S]*onClick=\{\(\) => navigate\(Path\.Home\)\}/,
    );
    expect(newChatHeaderBlock).toMatch(/min-height:\s*72px;/);
    expect(newChatHeaderBlock).toMatch(/align-items:\s*center;/);
    expect(newChatHeaderBlock).toMatch(/animation:\s*none;/);
    expect(newChatStyles).toMatch(
      /@media screen and \(max-width: 520px\)[\s\S]*\.mask-header\s*\{[\s\S]*min-height:\s*68px;[\s\S]*align-items:\s*center;[\s\S]*animation:\s*none;/,
    );
    expect(chat).toContain('aria-label="选择模型"');
    expect(chat).toContain(
      "const modelSelectorButtonRef = useRef<HTMLButtonElement>(null);",
    );
    expect(chat).toContain("const restoreModelSelectorFocus = useCallback");
    expect(chat).toMatch(
      /setTimeout\(\(\) => \{[\s\S]*requestAnimationFrame\([\s\S]*\(\) => modelSelectorButtonRef\.current\?\.focus\(\),?[\s\S]*\);[\s\S]*\}, 0\);/,
    );
    expect(chat).toContain("ref={modelSelectorButtonRef}");
    expect(chat).toContain("aria-expanded={showMobileModelSelector}");
    expect(chat).toContain('aria-controls="chat-model-menu"');
    expect(chat).toMatch(
      /className=\{styles\["chat-mobile-model-title"\]\}[\s\S]*aria-label="选择模型"[\s\S]*aria-controls="chat-model-menu"[\s\S]*aria-haspopup="dialog"[\s\S]*aria-expanded=\{showMobileModelSelector\}/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-desktop-model-title"\]\}[\s\S]*aria-label="选择模型和参数"[\s\S]*aria-controls="chat-model-menu"[\s\S]*aria-haspopup="dialog"[\s\S]*aria-expanded=\{showMobileModelSelector\}/,
    );
    expect(chat).toContain('aria-label="关闭模型选择"');
    expect(chat).toContain('id="chat-model-menu"');
    expect(chat).toContain('role="dialog"');
    expect(chat).toMatch(
      /id="chat-model-menu"[\s\S]*role="dialog"[\s\S]*aria-modal="true"[\s\S]*aria-label="模型和思考等级"/,
    );
    expect(chat).toContain('aria-label="模型和思考等级"');
    expect(chat).toMatch(
      /if \(!showMobileModelSelector\) return;[\s\S]*const closeModelSelectorOnEscape = \(event: KeyboardEvent\) =>[\s\S]*event\.key === "Escape"[\s\S]*closeMobileModelSelector\(\);[\s\S]*restoreModelSelectorFocus\(\);[\s\S]*window\.addEventListener\("keydown", closeModelSelectorOnEscape\);[\s\S]*window\.removeEventListener\("keydown", closeModelSelectorOnEscape\);/,
    );
    expect(chat).toMatch(
      /aria-label="关闭模型选择"[\s\S]*onClick=\{\(\) => \{[\s\S]*closeMobileModelSelector\(\);[\s\S]*restoreModelSelectorFocus\(\);[\s\S]*\}\}/,
    );
    expect(chat).toContain('role="listbox"');
    expect(chat).toContain('aria-label="可选模型"');
    expect(chat).toContain('aria-label="思考等级选项"');
    expect(chat).toContain('aria-label="图片尺寸选项"');
    expect(chat).toContain('aria-label="图片清晰度选项"');
    expect(chat).toMatch(
      /className=\{styles\["chat-mobile-reasoning-head"\]\}[\s\S]*aria-expanded=\{isReasoningSectionExpanded\}[\s\S]*aria-controls="chat-mobile-reasoning-options"[\s\S]*id="chat-mobile-reasoning-options"[\s\S]*role="listbox"[\s\S]*aria-label="思考等级选项"/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-mobile-reasoning-head"\]\}[\s\S]*aria-expanded=\{isImageSizeSectionExpanded\}[\s\S]*aria-controls="chat-mobile-image-size-options"[\s\S]*id="chat-mobile-image-size-options"[\s\S]*role="listbox"[\s\S]*aria-label="图片尺寸选项"/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-mobile-reasoning-head"\]\}[\s\S]*aria-expanded=\{isImageQualitySectionExpanded\}[\s\S]*aria-controls="chat-mobile-image-quality-options"[\s\S]*id="chat-mobile-image-quality-options"[\s\S]*role="listbox"[\s\S]*aria-label="图片清晰度选项"/,
    );
    expect(chat).toContain('role="option"');
    expect(chat).toContain("aria-selected={selected}");
    expect(chat).toContain('"打开对话工具"');
    expect(chat).toMatch(
      /aria-label=\{\s*showChatActionMenu\s*\?\s*"关闭对话工具"\s*:\s*"打开对话工具"\s*\}/,
    );
    expect(chat).toContain('id="chat-prompt-hints"');
    expect(chat).toMatch(
      /className=\{styles\["prompt-hints"\]\}[\s\S]*role="listbox"[\s\S]*aria-label="提示词建议"/,
    );
    expect(chat).toMatch(
      /className=\{styles\["prompt-hints"\]\}[\s\S]*aria-activedescendant=\{`chat-prompt-hint-\$\{selectIndex\}`\}/,
    );
    expect(chat).toMatch(
      /className=\{clsx\(styles\["prompt-hint"\][\s\S]*role="option"[\s\S]*aria-selected=\{i === selectIndex\}/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-input"\]\}[\s\S]*aria-controls=\{\s*promptHints\.length > 0 \? "chat-prompt-hints" : undefined\s*\}[\s\S]*aria-haspopup="listbox"/,
    );
    expect(chat).toMatch(
      /type PromptHintsCloseOptions = \{[\s\S]*restoreFocus\?: boolean;[\s\S]*\};/,
    );
    expect(chat).toMatch(
      /export function PromptHints\(props: \{[\s\S]*onClose: \(options\?: PromptHintsCloseOptions\) => void;/,
    );
    expect(chat).toMatch(
      /if \(e\.key === "Escape"\) \{[\s\S]*e\.stopPropagation\(\);[\s\S]*e\.stopImmediatePropagation\(\);[\s\S]*e\.preventDefault\(\);[\s\S]*onClose\(\{ restoreFocus: true \}\);[\s\S]*\}/,
    );
    expect(chat).toMatch(
      /if \(e\.key === "ArrowUp"\) \{[\s\S]*changeIndex\(-1\);[\s\S]*\} else if \(e\.key === "ArrowDown"\) \{[\s\S]*changeIndex\(1\);/,
    );
    expect(chat).toMatch(
      /const selectPromptIndex = \(nextIndex: number\) => \{[\s\S]*e\.stopPropagation\(\);[\s\S]*e\.preventDefault\(\);[\s\S]*setSelectIndex\(nextIndex\);[\s\S]*\};/,
    );
    expect(chat).toMatch(
      /if \(e\.key === "ArrowUp"\) \{[\s\S]*changeIndex\(-1\);[\s\S]*\} else if \(e\.key === "ArrowDown"\) \{[\s\S]*changeIndex\(1\);[\s\S]*\} else if \(e\.key === "Home"\) \{[\s\S]*selectPromptIndex\(0\);[\s\S]*\} else if \(e\.key === "End"\) \{[\s\S]*selectPromptIndex\(prompts\.length - 1\);/,
    );
    expect(chat).toMatch(
      /useEffect\(\(\) => \{[\s\S]*selectedRef\.current\?\.scrollIntoView\(\{[\s\S]*block:\s*"nearest",[\s\S]*\}\);[\s\S]*\}, \[selectIndex\]\);/,
    );
    expect(chat).toMatch(
      /else if \(e\.key === "Enter"\) \{[\s\S]*e\.stopPropagation\(\);[\s\S]*e\.preventDefault\(\);[\s\S]*const selectedPrompt = prompts\.at\(selectIndex\);[\s\S]*onPromptSelect\(selectedPrompt\);/,
    );
    expect(chat).toMatch(
      /const onInputKeyDown = \(e: React\.KeyboardEvent<HTMLTextAreaElement>\) => \{[\s\S]*if \(promptHints\.length > 0 && e\.key === "Enter"\) \{[\s\S]*e\.preventDefault\(\);[\s\S]*return;[\s\S]*\}[\s\S]*if \(shouldSubmit\(e\) && promptHints\.length === 0\)/,
    );
    expect(chat).toMatch(
      /const promptContent = prompt\.content\.trimEnd\(\);[\s\S]*const matchedChatCommand = chatCommands\.match\(promptContent\);[\s\S]*setUserInput\(promptContent\);/,
    );
    expect(chat).toMatch(
      /const closePromptHints = useCallback\(\s*\(options\?: PromptHintsCloseOptions\) => \{[\s\S]*setPromptHints\(\[\]\);[\s\S]*if \(options\?\.restoreFocus\) \{[\s\S]*inputRef\.current\?\.focus\(\);[\s\S]*\}[\s\S]*\},\s*\[\]\s*\);/,
    );
    expect(chat).toMatch(
      /<PromptHints[\s\S]*prompts=\{promptHints\}[\s\S]*onPromptSelect=\{onPromptSelect\}[\s\S]*onClose=\{closePromptHints\}/,
    );
    expect(chat).toContain('aria-controls="chat-input-action-menu"');
    expect(chat).toContain('aria-haspopup="dialog"');
    expect(chat).toContain("aria-expanded={showChatActionMenu}");
    expect(chat).toContain(
      "const chatInputMenuButtonRef = useRef<HTMLButtonElement>(null);",
    );
    expect(chat).toContain("ref={chatInputMenuButtonRef}");
    expect(chat).toContain('aria-label="关闭对话工具"');
    expect(chat).toMatch(
      /id="chat-input-action-menu"[\s\S]*className=\{clsx\(styles\["chat-input-action-menu"\][\s\S]*\)[\s\S]*\}[\s\S]*role="dialog"[\s\S]*aria-modal="true"[\s\S]*aria-label="对话工具菜单"/,
    );
    expect(chat).toMatch(
      /if \(!showChatActionMenu\) return;[\s\S]*const closeChatActionMenuOnEscape = \(event: KeyboardEvent\) =>[\s\S]*event\.key === "Escape"[\s\S]*setShowChatActionMenu\(false\);[\s\S]*window\.addEventListener\("keydown", closeChatActionMenuOnEscape\);[\s\S]*window\.removeEventListener\("keydown", closeChatActionMenuOnEscape\);/,
    );
    expect(chat).toMatch(
      /className=\{clsx\(styles\["chat-input-action-menu-backdrop"\][\s\S]*\)[\s\S]*\}[\s\S]*aria-label="关闭对话工具"[\s\S]*onClick=\{\(\) => \{[\s\S]*setShowChatActionMenu\(false\);[\s\S]*requestAnimationFrame\([\s\S]*\(\) => chatInputMenuButtonRef\.current\?\.focus\(\),?[\s\S]*\);[\s\S]*\}\}/,
    );
    expect(chat).toMatch(
      /requestAnimationFrame\([\s\S]*\(\) => chatInputMenuButtonRef\.current\?\.focus\(\),?[\s\S]*\);/,
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
    expect(chat).toContain('styles["chat-scroll-to-bottom"]');
    expect(chat).toMatch(
      /className=\{clsx\(styles\["chat-input-panel"\][\s\S]*\)\}[\s\S]*\{!showEmptyState && !hitBottom && !showChatActionMenu && \([\s\S]*className=\{styles\["chat-scroll-to-bottom"\]\}[\s\S]*aria-label=\{Locale\.Chat\.InputActions\.ToBottom\}[\s\S]*onClick=\{scrollToBottom\}[\s\S]*<BottomIcon \/>[\s\S]*\)\}[\s\S]*<PromptHints/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-reading-surface"\]\}[\s\S]*role="list"[\s\S]*aria-label="会话消息列表"/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-reading-surface"\]\}[\s\S]*role="list"[\s\S]*aria-label="会话消息列表"[\s\S]*aria-live="polite"[\s\S]*aria-relevant="additions text"[\s\S]*aria-atomic="false"/,
    );
    expect(chat).toContain('styles["chat-message-row"]');
    expect(chat).toContain('styles["chat-message-row-user"]');
    expect(chat).toContain('styles["chat-message-row-assistant"]');
    expect(chat).toMatch(
      /const messageLabel = `\$\{isUser \? "用户消息" : "助手消息"\} \$\{\s*i \+ 1\s*\}`;/,
    );
    expect(chat).toMatch(
      /className=\{clsx\([\s\S]*styles\["chat-message-row"\][\s\S]*\)\}[\s\S]*role="listitem"[\s\S]*aria-label=\{messageLabel\}[\s\S]*aria-busy=\{showTyping \? true : undefined\}/,
    );
    expect(chat).toMatch(
      /const messageActionLabel = `\$\{messageLabel\} 操作`;/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-message-actions"\]\}[\s\S]*role="group"[\s\S]*aria-label=\{messageActionLabel\}/,
    );
    expect(chat).toContain('styles["chat-message-action-rail"]');
    expect(chat).toContain("ariaLabel?: string;");
    expect(chat).toContain(
      'ariaHasPopup?: React.AriaAttributes["aria-haspopup"];',
    );
    expect(chat).toContain("ariaExpanded?: boolean;");
    expect(chat).toContain("aria-label={props.ariaLabel ?? props.text}");
    expect(chat).toContain("aria-haspopup={props.ariaHasPopup}");
    expect(chat).toContain("aria-expanded={props.ariaExpanded}");
    expect(chat).toMatch(
      /text=\{props\.imageGenerationEnabled \? "关闭图片生成" : "图片生成"\}[\s\S]*ariaHasPopup=\{isCompactScreen \? undefined : "listbox"\}[\s\S]*ariaExpanded=\{\s*isCompactScreen \? undefined : actionModals\.imageGeneration\s*\}/,
    );
    expect(chat).toMatch(
      /text=\{currentModelName\}[\s\S]*ariaHasPopup="listbox"[\s\S]*ariaExpanded=\{actionModals\.model\}/,
    );
    expect(chat).toMatch(
      /text=\{currentSize\}[\s\S]*ariaHasPopup="listbox"[\s\S]*ariaExpanded=\{actionModals\.size\}/,
    );
    expect(chat).toMatch(
      /text=\{currentQuality\}[\s\S]*ariaHasPopup="listbox"[\s\S]*ariaExpanded=\{actionModals\.quality\}/,
    );
    expect(chat).toMatch(
      /text=\{currentStyle\}[\s\S]*ariaHasPopup="listbox"[\s\S]*ariaExpanded=\{actionModals\.style\}/,
    );
    expect(chat).toMatch(
      /text=\{Locale\.Plugin\.Name\}[\s\S]*ariaHasPopup="listbox"[\s\S]*ariaExpanded=\{actionModals\.plugin\}/,
    );
    expect(chat).toMatch(
      /text=\{Locale\.Chat\.Actions\.Retry\}[\s\S]*ariaLabel=\{`\$\{messageActionLabel\}：\$\{Locale\.Chat\.Actions\.Retry\}`\}/,
    );
    expect(chat).toMatch(
      /text=\{Locale\.Chat\.Actions\.Delete\}[\s\S]*ariaLabel=\{`\$\{messageActionLabel\}：\$\{Locale\.Chat\.Actions\.Delete\}`\}/,
    );
    expect(chat).toMatch(
      /text=\{Locale\.Chat\.Actions\.Pin\}[\s\S]*ariaLabel=\{`\$\{messageActionLabel\}：\$\{Locale\.Chat\.Actions\.Pin\}`\}/,
    );
    expect(chat).toMatch(
      /text=\{Locale\.Chat\.Actions\.Copy\}[\s\S]*ariaLabel=\{`\$\{messageActionLabel\}：\$\{Locale\.Chat\.Actions\.Copy\}`\}/,
    );
    expect(chat).not.toContain('style={{ marginTop: "8px" }}');
    expect(sidebar).toContain('styles["sidebar-primary-nav"]');
    expect(sidebar).toContain('styles["sidebar-content-nav"]');
    expect(sidebar).toContain("Locale.Home.PrimarySection");
    expect(sidebar).toContain("Locale.Home.ContentSection");
    expect(sidebar).toMatch(
      /className=\{styles\["sidebar-primary-nav"\]\}[\s\S]*role="navigation"[\s\S]*aria-label=\{Locale\.Home\.PrimarySection\}/,
    );
    expect(sidebar).toMatch(
      /className=\{styles\["sidebar-content-nav"\]\}[\s\S]*role="navigation"[\s\S]*aria-label=\{Locale\.Home\.ContentSection\}/,
    );
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
    expect(sidebar).toMatch(
      /className=\{clsx\(styles\["sidebar-nav-item"\][\s\S]*location\.pathname === item\.path[\s\S]*aria-current=\{[\s\S]*location\.pathname === item\.path \? "page" : undefined[\s\S]*\}/,
    );
    expect(sidebar).toMatch(
      /className=\{clsx\(styles\["sidebar-content-card"\][\s\S]*\[styles\["sidebar-content-card-active"\]\]:\s*location\.pathname === Path\.SearchChat[\s\S]*aria-current=\{[\s\S]*location\.pathname === Path\.SearchChat \? "page" : undefined[\s\S]*\}/,
    );
    expect(sidebar).toMatch(
      /aria-label=\{Locale\.Discovery\.Name\}[\s\S]*aria-current=\{[\s\S]*location\.pathname === Path\.Plugins \|\|[\s\S]*location\.pathname === Path\.McpMarket[\s\S]*\?\s*"page"\s*:\s*undefined[\s\S]*\}/,
    );
    expect(sidebar).toMatch(
      /className=\{clsx\([\s\S]*styles\["sidebar-mobile-account-settings"\][\s\S]*\[styles\["sidebar-settings-link-active"\]\]:\s*location\.pathname === Path\.Settings[\s\S]*aria-current=\{[\s\S]*location\.pathname === Path\.Settings \? "page" : undefined[\s\S]*\}/,
    );
    expect(sidebar).toMatch(
      /<Link[\s\S]*to=\{Path\.Settings\}[\s\S]*className=\{clsx\([\s\S]*styles\["sidebar-settings-link"\][\s\S]*\[styles\["sidebar-settings-link-active"\]\]:\s*location\.pathname === Path\.Settings[\s\S]*aria-current=\{[\s\S]*location\.pathname === Path\.Settings \? "page" : undefined[\s\S]*\}/,
    );
    expect(sidebar).toContain('id="mobile-sidebar-drawer"');
    expect(sidebar).toContain("isMobileHidden?: boolean");
    expect(sidebar).toContain("isMobileOpen?: boolean");
    expect(sidebar).toMatch(
      /id="mobile-sidebar-drawer"[\s\S]*aria-hidden=\{isMobileHidden \? true : undefined\}/,
    );
    expect(sidebar).toMatch(
      /left:\s*isMobileOpen \? 0 : undefined/,
    );
    expect(sidebar).toMatch(
      /display:\s*isMobileHidden \? "none" : undefined/,
    );
    expect(sidebar).toMatch(
      /<SideBarContainer[\s\S]*isMobileHidden=\{props\.isMobileHidden\}/,
    );
    expect(sidebar).toMatch(
      /<SideBarContainer[\s\S]*isMobileOpen=\{props\.isMobileOpen\}/,
    );
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
    expect(home).toContain("isMobileHidden={isCompactScreen && !isHome}");
    expect(home).toContain("isMobileOpen={isCompactScreen && isHome}");
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
    expect(emptySuggestionsBlock).toMatch(/display:\s*grid;/);
    expect(emptySuggestionsBlock).not.toMatch(/display:\s*none/);
    expect(chatStyles).toContain(".chat-empty-suggestion-item");
    expect(chatStyles).toContain(".chat-empty-suggestion");
    expect(chat).toContain('styles["chat-empty-suggestion-text"]');
    expect(chat).toContain('styles["chat-empty-suggestion-affordance"]');
    expect(chat).toMatch(
      /className=\{styles\["chat-empty-suggestion"\]\}[\s\S]*<span[\s\S]*className=\{styles\["chat-empty-suggestion-text"\]\}[\s\S]*>\s*\{suggestion\}\s*<\/span>[\s\S]*<span[\s\S]*styles\["chat-empty-suggestion-affordance"\][\s\S]*aria-hidden="true"/,
    );
    expect(emptySuggestionBlock).toMatch(/display:\s*inline-flex;/);
    expect(emptySuggestionBlock).toMatch(/align-items:\s*center;/);
    expect(emptySuggestionBlock).toMatch(/justify-content:\s*center;/);
    expect(emptySuggestionBlock).toMatch(/gap:\s*8px;/);
    expect(emptySuggestionAffordanceBlock).toMatch(/flex:\s*0 0 18px;/);
    expect(emptySuggestionAffordanceBlock).toMatch(/width:\s*18px;/);
    expect(emptySuggestionAffordanceBlock).toMatch(/height:\s*18px;/);
    expect(emptySuggestionAffordanceBlock).toMatch(
      /border-radius:\s*999px;/,
    );
    expect(emptySuggestionAffordanceBlock).toMatch(
      /font-size:\s*12px;/,
    );
    expect(emptySuggestionTextBlock).toMatch(/display:\s*-webkit-box;/);
    expect(emptySuggestionTextBlock).toMatch(/line-height:\s*1\.2;/);
    expect(emptySuggestionTextBlock).toMatch(/max-height:\s*2\.4em;/);
    expect(emptySuggestionTextBlock).toMatch(/-webkit-line-clamp:\s*2;/);
    expect(emptySuggestionTextBlock).toMatch(
      /-webkit-box-orient:\s*vertical;/,
    );
    expect(emptySuggestionTextBlock).toMatch(/white-space:\s*normal;/);
    expect(mobileEmptySuggestionBlock).toMatch(/min-height:\s*44px;/);
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
    expect(messageActionRailBlock).toMatch(/\.chat-input-action[\s\S]*width:\s*34px;/);
    expect(messageActionRailBlock).toMatch(/\.chat-input-action[\s\S]*height:\s*34px;/);
    expect(messageActionRailBlock).toMatch(
      /&:hover,[\s\S]*&:focus-visible[\s\S]*width:\s*34px;/,
    );
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
    expect(scrollToBottomBlock).toMatch(/position:\s*absolute;/);
    expect(scrollToBottomBlock).toMatch(/left:\s*50%;/);
    expect(scrollToBottomBlock).toMatch(/top:\s*-56px;/);
    expect(scrollToBottomBlock).toMatch(/z-index:\s*20;/);
    expect(scrollToBottomBlock).toMatch(/width:\s*42px;/);
    expect(scrollToBottomBlock).toMatch(/height:\s*42px;/);
    expect(scrollToBottomBlock).toMatch(/border-radius:\s*999px;/);
    expect(scrollToBottomBlock).toMatch(/background:\s*var\(--surface-elevated\);/);
    expect(scrollToBottomBlock).toMatch(/backdrop-filter:\s*blur\(18px\) saturate\(160%\);/);
    expect(scrollToBottomBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(mobileScrollToBottomBlock).toMatch(/top:\s*-52px;/);
    expect(mobileScrollToBottomBlock).toMatch(/width:\s*40px;/);
    expect(mobileScrollToBottomBlock).toMatch(/height:\s*40px;/);
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
    expect(mobileDesktopHeaderActionsBlock).toMatch(/display:\s*none;/);
    expect(chatStyles).toContain(".chat-mobile-header");
    expect(chatStyles).toContain(".chat-mobile-header-button");
    expect(mobileHeaderButtonBlock).toMatch(/width:\s*40px;/);
    expect(mobileHeaderButtonBlock).toMatch(/height:\s*40px;/);
    expect(mobileModelTitleBlock).toMatch(/min-height:\s*40px;/);
    expect(mobileModelTitleBlock).toMatch(/padding:\s*0 12px;/);
    expect(mobileModelTitleBlock).toMatch(
      /border:\s*1px solid rgba\(60,\s*64,\s*67,\s*0\.1\);/,
    );
    expect(mobileModelTitleBlock).toMatch(/border-radius:\s*999px;/);
    expect(mobileModelTitleBlock).toMatch(
      /background:\s*rgba\(255,\s*255,\s*255,\s*0\.78\);/,
    );
    expect(mobileModelTitleBlock).toMatch(
      /box-shadow:\s*0 2px 10px rgba\(60,\s*64,\s*67,\s*0\.1\);/,
    );
    expect(mobileModelTitleBlock).toMatch(/backdrop-filter:\s*blur\(14px\);/);
    expect(mobileModelTitleBlock).toMatch(
      /&:hover[\s\S]*background:\s*var\(--hover-color\);/,
    );
    expect(chatStyles).toMatch(/@media only screen and \(min-width: 901px\)/);
    expect(chatStyles).toContain(".chat-input-action-menu");
    expect(chatStyles).toContain(".chat-input-action-menu-backdrop");
    expect(chatStyles).toContain(".chat-mobile-model-title[aria-expanded");
    expect(chatStyles).toMatch(
      /\.chat-mobile-model-title\[aria-expanded="true"\][\s\S]*background:\s*var\(--surface-elevated\);[\s\S]*box-shadow:\s*var\(--focus-ring-shadow\);/,
    );
    expect(chatStyles).toContain(".chat-mobile-model-menu-backdrop");
    expect(chatStyles).toContain(".chat-mobile-model-menu");
    expect(mobileModelMenuBlock).toMatch(
      /width:\s*min\(320px,\s*calc\(100vw - 48px\)\);/,
    );
    expect(mobileModelMenuBlock).toMatch(
      /top:\s*calc\(env\(safe-area-inset-top\) \+ 60px\);/,
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
    expect(mobileMenuModelOptionBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(mobileMenuModelOptionBlock).toMatch(
      /border:\s*1px solid transparent;/,
    );
    expect(mobileMenuModelOptionSelectedBlock).toMatch(
      /border-color:\s*rgba\(25,\s*103,\s*210,\s*0\.18\);/,
    );
    expect(mobileMenuModelOptionSelectedBlock).toMatch(
      /color:\s*var\(--primary\);/,
    );
    expect(mobileMenuModelOptionSelectedBlock).toMatch(/font-weight:\s*600;/);
    expect(mobileMenuModelOptionSelectedBlock).toMatch(
      /box-shadow:\s*inset 3px 0 0 rgba\(25,\s*103,\s*210,\s*0\.55\);/,
    );
    expect(desktopMenuModelOptionBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(desktopMenuModelOptionBlock).toMatch(
      /border:\s*1px solid transparent;/,
    );
    expect(desktopMenuModelOptionSelectedBlock).toMatch(
      /border-color:\s*rgba\(25,\s*103,\s*210,\s*0\.16\);/,
    );
    expect(desktopMenuModelOptionSelectedBlock).toMatch(
      /color:\s*var\(--primary\);/,
    );
    expect(desktopMenuModelOptionSelectedBlock).toMatch(/font-weight:\s*600;/);
    expect(desktopMenuModelOptionSelectedBlock).toMatch(
      /box-shadow:\s*inset 3px 0 0 rgba\(25,\s*103,\s*210,\s*0\.42\);/,
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
    expect(mobileStyles).not.toMatch(
      /\.chat-input-panel-inner-collapsed\s*\{[\s\S]*\.chat-input-status-row\s*\{[\s\S]*display:\s*none;/,
    );
    expect(mobileStyles).toMatch(
      /\.chat-input-panel-inner-collapsed\s*\{[\s\S]*\.chat-input-status-row\s*\{[\s\S]*width:\s*1px;/,
    );
    expect(mobileStyles).toMatch(
      /\.chat-input-panel-inner-collapsed\s*\{[\s\S]*\.chat-input-status-row\s*\{[\s\S]*clip-path:\s*inset\(50%\);/,
    );
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
      "--mobile-sidebar-drawer-width: 304px;",
    );
    expect(homeStyles).toContain("--mobile-sidebar-drawer-offset: -304px;");
    expect(homeStyles).toContain("@media only screen and (max-width: 358px)");
    expect(homeStyles).toContain(
      "--mobile-sidebar-drawer-width: calc(100vw - 54px);",
    );
    expect(homeStyles).toContain(
      "--mobile-sidebar-drawer-offset: calc(54px - 100vw);",
    );
    expect(homeStyles).toContain(
      "left: var(--mobile-sidebar-drawer-offset);",
    );
    expect(homeStyles).toContain(".sidebar-backdrop");
    expect(homeStyles).toContain("z-index: 900");
    expect(homeStyles).toContain("z-index: 1000");
    expect(compactContainerSidebarBlock).toMatch(
      /background:\s*rgba\(249,\s*251,\s*253,\s*0\.78\);/,
    );
    expect(compactContainerSidebarBlock).toMatch(
      /backdrop-filter:\s*blur\(24px\) saturate\(185%\);/,
    );
    expect(compactContainerSidebarBlock).toMatch(
      /border-right:\s*1px solid rgba\(60,\s*64,\s*67,\s*0\.12\);/,
    );
    expect(compactContainerSidebarBlock).toMatch(
      /box-shadow:\s*0 24px 72px rgba\(32,\s*33,\s*36,\s*0\.28\);/,
    );
    expect(homeStyles).not.toContain("0 20px 64px rgba(32, 33, 36, 0.22)");
    expect(homeMobileCompactSidebarBlock).not.toMatch(/background(?:-color)?:/);
    expect(homeMobileCompactSidebarBlock).not.toMatch(/backdrop-filter:/);
    expect(homeMobileCompactSidebarBlock).not.toMatch(/border-right:/);
    expect(homeMobileCompactSidebarBlock).toMatch(
      /box-shadow:\s*0 24px 72px rgba\(32,\s*33,\s*36,\s*0\.28\);/,
    );
    expect(compactContainerSidebarBlock).toMatch(
      /:global\(\.dark\) &[\s\S]*background:\s*rgba\(19,\s*20,\s*22,\s*0\.78\);/,
    );
    expect(compactSidebarBackdropBlock).toMatch(
      /backdrop-filter:\s*blur\(8px\) saturate\(135%\);/,
    );
    expect(compactSidebarBackdropBlock).toMatch(
      /background:[\s\S]*linear-gradient\(90deg,\s*rgba\(49,\s*94,\s*248,\s*0\.12\)/,
    );
    expect(homeStyles).toMatch(/\.sidebar-show\s*\{\s*left:\s*0;/);
    expect(homeStyles).toMatch(
      /\.sidebar\.sidebar-show\s*\{\s*left:\s*0;/,
    );
    expect(homeStyles).toContain("outline: var(--focus-ring)");
    expect(homeStyles).toContain("box-shadow: var(--focus-ring-shadow)");
    expect(homeStyles).toContain(".sidebar-primary-nav");
    expect(homeStyles).toContain(".sidebar-content-nav");
    expect(homeStyles).toContain(".sidebar-content-card");
    expect(sidebarBlock).toMatch(/scrollbar-width:\s*thin;/);
    expect(sidebarBlock).toMatch(
      /scrollbar-color:\s*transparent transparent;/,
    );
    expect(sidebarBlock).toMatch(
      /-ms-overflow-style:\s*-ms-autohiding-scrollbar;/,
    );
    expect(sidebarBlock).toMatch(
      /&:hover,\s*&:focus-within[\s\S]*scrollbar-color:\s*var\(--scrollbar-thumb-color\) transparent;/,
    );
    expect(sidebarBlock).toMatch(
      /&:hover,\s*&:focus-within[\s\S]*\.sidebar-body[\s\S]*scrollbar-color:\s*var\(--scrollbar-thumb-color\) transparent;[\s\S]*&::-webkit-scrollbar-thumb[\s\S]*background-color:\s*var\(--scrollbar-thumb-color\);/,
    );
    expect(sidebarBodyBlock).toMatch(/scrollbar-width:\s*thin;/);
    expect(sidebarBodyBlock).toMatch(
      /scrollbar-color:\s*transparent transparent;/,
    );
    expect(sidebarBodyBlock).toMatch(
      /-ms-overflow-style:\s*-ms-autohiding-scrollbar;/,
    );
    expect(sidebarBodyBlock).toMatch(
      /&::-webkit-scrollbar-thumb[\s\S]*background-color:\s*transparent;/,
    );
    expect(sidebarNavItemBlock).toMatch(/position:\s*relative;/);
    expect(sidebarNavItemBlock).toMatch(/overflow:\s*hidden;/);
    expect(sidebarNavItemActiveBlock).toMatch(/color:\s*var\(--primary\);/);
    expect(sidebarNavItemActiveBlock).toMatch(/font-weight:\s*600;/);
    expect(sidebarContentCardActiveBlock).toMatch(
      /border-color:\s*rgba\(49,\s*94,\s*248,\s*0\.22\);/,
    );
    expect(sidebarContentCardActiveBlock).toMatch(
      /background:\s*rgba\(25,\s*103,\s*210,\s*0\.1\);/,
    );
    expect(sidebarContentCardActiveBlock).toMatch(
      /box-shadow:\s*inset 3px 0 0 var\(--primary\);/,
    );
    expect(sidebarContentCardActiveBlock).toMatch(/color:\s*var\(--primary\);/);
    expect(darkSidebarContentCardActiveBlock).toMatch(
      /background:\s*rgba\(138,\s*180,\s*248,\s*0\.14\);/,
    );
    expect(narrowSidebarBlock).toMatch(
      /\.sidebar-content-card-active\s*\{[\s\S]*background-color:\s*rgba\(25,\s*103,\s*210,\s*0\.08\);[\s\S]*color:\s*var\(--primary\);/,
    );
    expect(sidebarSettingsLinkActiveBlock).toMatch(
      /button\s*\{[\s\S]*background:\s*rgba\(25,\s*103,\s*210,\s*0\.1\);/,
    );
    expect(sidebarSettingsLinkActiveBlock).toMatch(
      /box-shadow:\s*0 0 0 1px rgba\(49,\s*94,\s*248,\s*0\.22\)/,
    );
    expect(sidebarNavItemActiveBlock).toMatch(
      /box-shadow:\s*inset 3px 0 0 var\(--primary\);/,
    );
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
    expect(chatItemDeleteBlock).toMatch(/width:\s*34px;/);
    expect(chatItemDeleteBlock).toMatch(/height:\s*34px;/);
    expect(chatItemDeleteBlock).toMatch(/border-radius:\s*999px;/);
    expect(chatItemDeleteBlock).toMatch(/display:\s*inline-flex;/);
    expect(chatItemDeleteBlock).toMatch(/align-items:\s*center;/);
    expect(chatItemDeleteBlock).toMatch(/justify-content:\s*center;/);
    expect(chatItemDeleteBlock).toMatch(/pointer-events:\s*none;/);
    expect(chatItemDeleteBlock).toMatch(/&:focus-visible[\s\S]*opacity:\s*1;/);
    expect(chatItemDeleteBlock).toMatch(/&:focus-visible[\s\S]*pointer-events:\s*auto;/);
    expect(chatItemDeleteBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(chatItemHoverDeleteBlock).toMatch(/pointer-events:\s*auto;/);
    expect(chatItemFocusWithinDeleteBlock).toMatch(/opacity:\s*0.56;/);
    expect(chatItemFocusWithinDeleteBlock).toMatch(/pointer-events:\s*auto;/);
    expect(narrowSidebarBlock).toMatch(
      /\.chat-item-delete[\s\S]*width:\s*34px;[\s\S]*height:\s*34px;/,
    );
    expect(mobileChatItemDeleteBlock).toMatch(/opacity:\s*0.72;/);
    expect(mobileChatItemDeleteBlock).toMatch(/width:\s*34px;/);
    expect(mobileChatItemDeleteBlock).toMatch(/height:\s*34px;/);
    expect(compactSidebarShowDeleteBlock).toMatch(/opacity:\s*0.72;/);
    expect(compactSidebarShowDeleteBlock).toMatch(/pointer-events:\s*auto;/);
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

  test("keeps Gemini-style markdown code block chrome", () => {
    const markdown = read("app/components/markdown.tsx");
    const markdownStyles = read("app/styles/markdown.scss");
    const globalStyles = read("app/styles/globals.scss");
    const refinedCodeStyles = markdownStyles.slice(
      Math.max(
        0,
        markdownStyles.indexOf(
          "/* R4: Gemini-style refined code block card */",
        ) - 120,
      ),
    );
    const preBlock = readCssBlock(refinedCodeStyles, ".markdown-body pre");
    const globalPreBlock = readCssBlock(globalStyles, "pre");
    const desktopHoverBlock = readCssBlock(
      globalPreBlock,
      "&:hover .copy-code-button",
    );
    const copyButtonStyles = globalStyles.slice(
      globalStyles.indexOf(".copy-code-button {\n    position"),
    );
    const copyButtonBlock = readCssBlock(copyButtonStyles, ".copy-code-button");
    const focusVisibleBlock = readCssBlock(copyButtonBlock, "&:focus-visible");
    const touchCopyButtonBlock = readCssBlock(
      readCssBlock(
        globalStyles,
        "@media (hover: none), (pointer: coarse), (max-width: 600px)",
      ),
      "pre .copy-code-button",
    );
    const languageLabelBlock = readCssBlock(
      markdownStyles,
      ".markdown-code-language",
    );

    expect(markdown).toContain("function getCodeLanguage");
    expect(markdown).toContain("formatCodeLanguage");
    expect(markdown).toContain("markdown-code-block-labeled");
    expect(markdown).toContain('className="markdown-code-language"');
    expect(markdown).toContain("{codeLanguage}");
    expect(markdown).toContain("CopyIcon");
    expect(markdown).toContain(
      'aria-label={codeLanguage ? `复制 ${codeLanguage} 代码` : "复制代码"}',
    );
    expect(preBlock).toMatch(/padding:\s*14px 64px 14px 16px;/);
    expect(languageLabelBlock).toMatch(/position:\s*absolute;/);
    expect(languageLabelBlock).toMatch(/right:\s*52px;/);
    expect(languageLabelBlock).toMatch(/top:\s*12px;/);
    expect(languageLabelBlock).toMatch(/pointer-events:\s*none;/);
    expect(copyButtonBlock).toMatch(/width:\s*34px;/);
    expect(copyButtonBlock).toMatch(/height:\s*34px;/);
    expect(copyButtonBlock).toMatch(/right:\s*12px;/);
    expect(copyButtonBlock).toMatch(/top:\s*12px;/);
    expect(copyButtonBlock).toMatch(/pointer-events:\s*none;/);
    expect(copyButtonBlock).toMatch(/opacity:\s*0;/);
    expect(copyButtonBlock).toMatch(/stroke:\s*currentColor !important;/);
    expect(desktopHoverBlock).toMatch(/pointer-events:\s*all;/);
    expect(desktopHoverBlock).toMatch(/opacity:\s*0\.72;/);
    expect(desktopHoverBlock).toMatch(/transform:\s*translateY\(0\);/);
    expect(focusVisibleBlock).toMatch(/pointer-events:\s*all;/);
    expect(focusVisibleBlock).toMatch(/opacity:\s*1;/);
    expect(focusVisibleBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(touchCopyButtonBlock).toMatch(/pointer-events:\s*all;/);
    expect(touchCopyButtonBlock).toMatch(/opacity:\s*1;/);
    expect(touchCopyButtonBlock).toMatch(/transform:\s*translateY\(0\);/);
  });

  test("keeps Gemini-style markdown image media cards", () => {
    const markdown = read("app/components/markdown.tsx");
    const markdownStyles = read("app/styles/markdown.scss");
    const imageFrameBlock = readCssBlock(
      markdownStyles,
      ".markdown-body .markdown-image-frame",
    );
    const imagePreviewButtonBlock = readCssBlock(
      markdownStyles,
      ".markdown-body .markdown-image-preview-button",
    );
    const imagePreviewBlock = readCssBlock(
      markdownStyles,
      ".markdown-body img.markdown-image-preview",
    );
    const imageDownloadBlock = readCssBlock(
      markdownStyles,
      ".markdown-body .markdown-image-download",
    );

    expect(markdown).toContain('className="markdown-image-frame"');
    expect(markdown).toContain('className="markdown-image-preview-button"');
    expect(markdown).toContain('className="markdown-image-preview"');
    expect(markdown).toContain('className="markdown-image-download"');
    expect(imageFrameBlock).toMatch(/display:\s*inline-flex;/);
    expect(imageFrameBlock).toMatch(/max-width:\s*min\(100%, 760px\);/);
    expect(imageFrameBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(imageFrameBlock).toMatch(/overflow:\s*hidden;/);
    expect(imageFrameBlock).toMatch(/padding:\s*4px;/);
    expect(imageFrameBlock).toMatch(/border-radius:\s*18px;/);
    expect(imageFrameBlock).toMatch(
      /border:\s*1px solid rgba\(60, 64, 67, 0\.12\);/,
    );
    expect(imageFrameBlock).toMatch(/background:\s*var\(--surface-elevated\);/);
    expect(imageFrameBlock).toMatch(
      /box-shadow:\s*0 10px 28px rgba\(60, 64, 67, 0\.12\);/,
    );
    expect(imageFrameBlock).toMatch(
      /&:hover,\s*&:focus-within[\s\S]*transform:\s*translateY\(-1px\);/,
    );
    expect(imageFrameBlock).toMatch(
      /&:hover,\s*&:focus-within[\s\S]*\.markdown-image-download[\s\S]*opacity:\s*1;[\s\S]*pointer-events:\s*auto;/,
    );
    expect(imagePreviewButtonBlock).toMatch(/border-radius:\s*14px;/);
    expect(imagePreviewButtonBlock).toMatch(/overflow:\s*hidden;/);
    expect(imagePreviewButtonBlock).toMatch(
      /&:focus-visible[\s\S]*box-shadow:\s*var\(--focus-ring-shadow\);/,
    );
    expect(imagePreviewBlock).toMatch(/max-width:\s*100%;/);
    expect(imagePreviewBlock).toMatch(/border-radius:\s*14px;/);
    expect(imagePreviewBlock).toMatch(/border:\s*0;/);
    expect(imageDownloadBlock).toMatch(/top:\s*8px;/);
    expect(imageDownloadBlock).toMatch(/right:\s*8px;/);
    expect(imageDownloadBlock).toMatch(/opacity:\s*0;/);
    expect(imageDownloadBlock).toMatch(/pointer-events:\s*none;/);
    expect(imageDownloadBlock).toMatch(
      /&:focus-visible[\s\S]*opacity:\s*1;/,
    );
    expect(imageDownloadBlock).toMatch(
      /&:focus-visible[\s\S]*box-shadow:\s*0 0 0 3px rgba\(66, 133, 244, 0\.28\), 0 8px 24px rgba\(\$color: #000, \$alpha: 0\.24\);/,
    );
    expect(markdownStyles).toMatch(
      /@media \(hover: none\), \(max-width: 600px\)[\s\S]*\.markdown-body \.markdown-image-frame[\s\S]*padding:\s*3px;[\s\S]*border-radius:\s*16px;/,
    );
    expect(markdownStyles).toMatch(
      /@media \(hover: none\), \(max-width: 600px\)[\s\S]*\.markdown-body \.markdown-image-frame[\s\S]*&:hover,\s*&:focus-within[\s\S]*transform:\s*none;/,
    );
    expect(markdownStyles).toMatch(
      /@media \(hover: none\), \(max-width: 600px\)[\s\S]*\.markdown-body \.markdown-image-download[\s\S]*opacity:\s*1;[\s\S]*pointer-events:\s*auto;/,
    );
  });

  test("keeps file drag-and-drop scoped and visually polished", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const dragEnterBlock = readFunctionBlock(
      chat,
      "const handleDragEnter = (e: DragEvent) => {",
    );
    const dragOverBlock = readFunctionBlock(
      chat,
      "const handleDragOver = (e: DragEvent) => {",
    );
    const dragLeaveBlock = readFunctionBlock(
      chat,
      "const handleDragLeave = (e: DragEvent) => {",
    );
    const dropBlock = readFunctionBlock(
      chat,
      "const handleDrop = async (e: DragEvent) => {",
    );
    const dropzoneBlock = readCssBlock(chatStyles, ".chat-dropzone");
    const dropzoneContentBlock = readCssBlock(
      chatStyles,
      ".chat-dropzone-content",
    );
    const reducedMotionBlock = chatStyles.slice(
      chatStyles.indexOf("@media (prefers-reduced-motion: reduce)"),
    );

    expect(chat).toContain("function hasDraggedFiles");
    expect(dragEnterBlock).toMatch(
      /if \(!hasDraggedFiles\(dataTransfer\)\) \{\s*return;\s*\}/,
    );
    expect(dragOverBlock).toMatch(
      /if \(!hasDraggedFiles\(dataTransfer\)\) \{\s*return;\s*\}/,
    );
    expect(dragOverBlock).toContain('dataTransfer.dropEffect = "copy";');
    expect(dragLeaveBlock).toMatch(
      /if \(!hasDraggedFiles\(dataTransfer\)\) \{\s*return;\s*\}/,
    );
    expect(dropBlock).toMatch(
      /if \(!hasDraggedFiles\(dataTransfer\)\) \{\s*return;\s*\}/,
    );
    expect(dropzoneBlock).toMatch(/isolation:\s*isolate;/);
    expect(dropzoneContentBlock).toMatch(/scale\(0\.96\)/);
    expect(dropzoneContentBlock).toMatch(/border-color:\s*rgba\(66, 133, 244, 0\.55\);/);
    expect(dropzoneContentBlock).toMatch(/opacity:\s*1;/);
    expect(reducedMotionBlock).toContain(".chat-dropzone-content");
  });

  test("keeps streaming wait state as a polished Gemini-style skeleton", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const shimmerBlock = readCssBlock(chatStyles, ".chat-message-shimmer");
    const streamingRevealBlock = readCssBlock(
      chatStyles,
      ".chat-message-streaming-reveal",
    );
    const reducedMotionBlock = chatStyles.slice(
      chatStyles.indexOf("@media (prefers-reduced-motion: reduce)"),
    );

    expect(chat).toContain("const isStreamingReveal");
    expect(chat).toMatch(
      /const isStreamingReveal =\s*!isUser && message\.streaming && message\.content\.length > 0;/,
    );
    expect(chat).toMatch(
      /isStreamingReveal &&\s*styles\["chat-message-streaming-reveal"\]/,
    );
    expect(shimmerBlock).toMatch(/min-height:\s*72px;/);
    expect(shimmerBlock).toContain("&::after");
    expect(shimmerBlock).toContain(":global(.markdown-body)::before");
    expect(shimmerBlock).toContain(":global(.markdown-body)::after");
    expect(shimmerBlock).toMatch(/display:\s*none !important;/);
    expect(shimmerBlock).toMatch(/animation:\s*shimmer 1\.6s infinite linear/);
    expect(shimmerBlock).not.toContain("* {");
    expect(streamingRevealBlock).toMatch(/transition:\s*border-color 0\.18s ease/);
    expect(streamingRevealBlock).toContain(":global(.markdown-body-container)");
    expect(streamingRevealBlock).toMatch(/animation:\s*streamingTextReveal 0\.18s ease-out both;/);
    expect(reducedMotionBlock).toContain(".chat-message-shimmer");
    expect(reducedMotionBlock).toContain(".chat-message-streaming-reveal");
    expect(reducedMotionBlock).toContain("animation: none !important");
  });
});
