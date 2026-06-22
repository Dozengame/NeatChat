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

function readCssBlockInside(
  source: string,
  containerSelector: string,
  innerSelector: string,
) {
  const innerIndex = source.indexOf(innerSelector);
  if (innerIndex < 0) return "";

  const containerIndex = source.lastIndexOf(containerSelector, innerIndex);
  if (containerIndex < 0) return "";

  const containerBlock = readCssBlock(
    source.slice(containerIndex),
    containerSelector,
  );
  return readCssBlock(containerBlock, innerSelector);
}

function readCustomProperties(block: string, propertyNames: string[]) {
  const declarations = new Map<string, string>();
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    declarations.set(match[1], match[2].replace(/\s+/g, " ").trim());
  }

  return Object.fromEntries(
    propertyNames.map((propertyName) => [
      propertyName,
      declarations.get(propertyName) ?? "",
    ]),
  );
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
    const uiLibActions = read("app/components/ui-lib-actions.tsx");
    const promptInput = read("app/components/ui-lib-prompt-input.tsx");
    const utils = read("app/utils.ts");
    const globalStyles = read("app/styles/globals.scss");
    const globalLightMixinBlock = readCssBlock(globalStyles, "@mixin light");
    const globalDarkMixinBlock = readCssBlock(globalStyles, "@mixin dark");
    const constants = read("app/constant.ts");
    const cnLocale = read("app/locales/cn.ts");
    const enLocale = read("app/locales/en.ts");
    const qaNotes = read("design-qa.md");
    const gitignore = read(".gitignore");
    const chatActionMenuKeyDownBlock = readFunctionBlock(
      chat,
      "const handleChatActionMenuKeyDown = (",
    );
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
    const promptHintsStyles = chatStyles.slice(
      chatStyles.indexOf("@mixin single-line"),
    );
    const promptHintsBlock = readCssBlock(promptHintsStyles, ".prompt-hints");
    const promptHintsRootBlock = readRootDeclarations(promptHintsBlock);
    const promptHintBlock = readCssBlock(promptHintsBlock, ".prompt-hint");
    const promptHintRootBlock = readRootDeclarations(promptHintBlock);
    const darkPromptHintsBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .prompt-hints",
    );
    const autoDarkPromptHintsSelector =
      ":global(body:not(.light)) .prompt-hints";
    const autoDarkPromptHintsSelectorIndex = chatStyles.indexOf(
      autoDarkPromptHintsSelector,
    );
    const autoDarkPromptHintsMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkPromptHintsSelectorIndex,
    );
    const autoDarkPromptHintsBlock = readCssBlock(
      chatStyles.slice(autoDarkPromptHintsMediaIndex),
      autoDarkPromptHintsSelector,
    );
    const promptHintsMobileBlock = readCssBlock(
      chatStyles,
      "@media (max-width: 600px)",
    );
    const emptyInputPanelFocusMenuButtonBlock = readCssBlock(
      chatStyles,
      ".chat-input-panel.chat-input-panel-empty:focus-within .chat-input-menu-button",
    );
    const mobileStyles = chatStyles.slice(
      chatStyles.lastIndexOf("@media only screen and (max-width: 600px)"),
    );
    const tabletStyles = chatStyles.slice(
      chatStyles.indexOf(
        "@media only screen and (min-width: 601px) and (max-width: 900px)",
      ),
    );
    const desktopStyles = chatStyles.slice(
      chatStyles.indexOf("@media only screen and (min-width: 901px)"),
    );
    const reducedMotionBlock = readCssBlock(
      chatStyles,
      "@media (prefers-reduced-motion: reduce)",
    );
    const desktopChatRootDeclarations = readRootDeclarations(
      readCssBlock(desktopStyles, ".chat"),
    );
    const mobileEmptyInputPanelBlock = readCssBlock(
      mobileStyles,
      ".chat-input-panel.chat-input-panel-empty",
    );
    const mobileEmptyStatusRowBlock = readCssBlock(
      mobileEmptyInputPanelBlock,
      ".chat-input-status-row",
    );
    const actionMenuBlock = readCssBlock(chatStyles, ".chat-input-action-menu");
    const actionMenuOpenStabilizerBlock = readCssBlock(
      chatStyles,
      ".chat-input-action-menu.chat-input-action-menu-open",
    );
    const scrollToBottomBlock = readCssBlock(
      chatStyles,
      ".chat-scroll-to-bottom",
    );
    const sendButtonDisabledBlock = chatStyles.slice(
      chatStyles.indexOf("&:disabled,"),
      chatStyles.indexOf(":global(.dark) .chat-input-send:disabled"),
    );
    const darkSendButtonDisabledBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-input-send:disabled",
    );
    const darkScrollToBottomHoverBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-scroll-to-bottom:hover",
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
    const emptySuggestionFocusAffordanceBlock = readCssBlock(
      chatStyles,
      ".chat-empty-suggestion:focus-visible .chat-empty-suggestion-affordance",
    );
    const actionMenuRootDeclarations = readRootDeclarations(actionMenuBlock);
    const actionMenuActiveActionBlock = readCssBlock(
      chatStyles,
      ".chat-input-action-menu .chat-input-action-active",
    );
    const actionMenuMultimodalDividerBlock = readCssBlock(
      actionMenuBlock,
      ".chat-multimodal-section + .chat-multimodal-section",
    );
    const actionMenuMultimodalPrimaryBlock = readCssBlock(
      actionMenuBlock,
      ".chat-multimodal-section-primary",
    );
    const darkActionMenuMultimodalSectionBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-input-action-menu .chat-multimodal-section",
    );
    const darkActionMenuBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-input-action-menu",
    );
    const autoDarkActionMenuMultimodalSelector =
      ":global(body:not(.light)) .chat-input-action-menu .chat-multimodal-section";
    const autoDarkActionMenuMultimodalSelectorIndex = chatStyles.indexOf(
      autoDarkActionMenuMultimodalSelector,
    );
    const autoDarkActionMenuMultimodalMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkActionMenuMultimodalSelectorIndex,
    );
    const autoDarkActionMenuMultimodalBlock = readCssBlock(
      chatStyles.slice(autoDarkActionMenuMultimodalMediaIndex),
      autoDarkActionMenuMultimodalSelector,
    );
    const autoDarkActionMenuSelector =
      ":global(body:not(.light)) .chat-input-action-menu";
    const autoDarkActionMenuSelectorIndex = chatStyles.indexOf(
      autoDarkActionMenuSelector,
    );
    const autoDarkActionMenuMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkActionMenuSelectorIndex,
    );
    const autoDarkActionMenuBlock = readCssBlock(
      chatStyles.slice(autoDarkActionMenuMediaIndex),
      autoDarkActionMenuSelector,
    );
    const legacyMultimodalSectionPaint =
      /rgba\((?:60,\s*64,\s*67,\s*0\.08|49,\s*94,\s*248,\s*0\.04)/;
    const legacyActionActivePaint =
      /rgba\(25,\s*103,\s*210,\s*0\.1\)/;
    const promptHintsToneScope = [
      promptHintsRootBlock,
      promptHintBlock,
      darkPromptHintsBlock,
      autoDarkPromptHintsBlock,
    ].join("\n");
    const legacyPromptHintSelectedPaint =
      /rgba\(66,\s*133,\s*244,\s*(?:0\.1|0\.18|0\.22)\)/;
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
    const tabletCollapsedInputPanelBlock = readCssBlock(
      tabletStyles,
      ".chat-input-panel-inner-collapsed",
    );
    const tabletCollapsedStatusRowBlock = readCssBlock(
      tabletCollapsedInputPanelBlock,
      ".chat-input-status-row",
    );
    const mobileEmptySuggestionBlock = readCssBlock(
      mobileStyles,
      ".chat-empty-suggestion",
    );
    const narrowEmptyContainerBlock = readCssBlock(
      chatStyles,
      "@container chat-container (max-width: 480px)",
    );
    const narrowEmptySuggestionsBlock = readCssBlock(
      narrowEmptyContainerBlock,
      ".chat-empty-suggestions",
    );
    const narrowEmptySuggestionBlock = readCssBlock(
      narrowEmptyContainerBlock,
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
    const multimodalSubtitleColorBlock = readCssBlock(
      chatStyles.slice(
        chatStyles.lastIndexOf(".chat-multimodal-section-subtitle {\n"),
      ),
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
    const chatMessageItemBlock = readCssBlock(chatStyles, ".chat-message-item");
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
    const messageCopySuccessToneScope = [
      messageActionRailBlock,
      readCssBlock(chatStyles, ":global(.dark) .chat-message-action-rail"),
    ].join("\n");
    const legacyMessageCopySuccessPaint =
      /rgba\((?:52,\s*168,\s*83|24,\s*128,\s*56|129,\s*201,\s*149)/;
    const messageCopyStatusBlock = readCssBlock(
      chatStyles,
      ".chat-message-copy-status",
    );
    const messageActionRailFocusBlock = readFunctionBlock(
      chat,
      "const focusMessageActionRailControl = useCallback",
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
    const attachImageItemBlock = readCssBlock(chatStyles, ".attach-image-item");
    const attachFileItemBlock = readCssBlock(chatStyles, ".attach-file-item");
    const attachImageBlock = readCssBlock(chatStyles, ".attach-image");
    const attachImageMaskBlock = readCssBlock(chatStyles, ".attach-image-mask");
    const touchAttachmentStyles = readCssBlock(
      chatStyles,
      "@media (hover: none), (pointer: coarse), (max-width: 600px)",
    );
    const touchAttachmentsContainerBlock = readCssBlock(
      touchAttachmentStyles,
      ".attachments-container",
    );
    const touchAttachItemBlock = readCssBlock(
      touchAttachmentStyles,
      ".attach-item",
    );
    const touchAttachImageMaskBlock = readCssBlock(
      touchAttachmentStyles,
      ".attach-image-mask",
    );
    const touchDeleteImageBlock = readCssBlock(
      touchAttachmentStyles,
      ".delete-image",
    );
    const deleteImageBlock = readCssBlock(chatStyles, ".delete-image");
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
    const newChatHeaderBlock = readCssBlock(newChatStyles, ".mask-header");
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
    const compactContainerRootDeclarations = readRootDeclarations(
      compactContainerBlock,
    );
    const darkCompactContainerBlock = readCssBlock(
      homeStyles,
      ":global(.dark) .compact-container",
    );
    const autoDarkCompactContainerSelector =
      ":global(body:not(.light)) .compact-container";
    const autoDarkCompactContainerSelectorIndex = homeStyles.indexOf(
      autoDarkCompactContainerSelector,
    );
    const autoDarkCompactContainerMediaIndex = homeStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkCompactContainerSelectorIndex,
    );
    const autoDarkCompactContainerBlock = readCssBlock(
      homeStyles.slice(autoDarkCompactContainerMediaIndex),
      autoDarkCompactContainerSelector,
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
    const promptHintsStart = chat.indexOf("export function PromptHints");
    const promptHintsFirstEffect = chat.indexOf("useEffect(() =>", promptHintsStart);
    const promptHintsRenderSetup = chat.slice(
      promptHintsStart,
      promptHintsFirstEffect,
    );
    const promptHintsKeyDownBlock = readFunctionBlock(
      chat,
      "const onKeyDown = (e: KeyboardEvent) =>",
    );
    const handleModelMenuKeyDownBlock = readFunctionBlock(
      chat,
      "const handleModelMenuKeyDown = (event: React.KeyboardEvent<HTMLElement>) =>",
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
    expect(chat).toMatch(
      /onClick=\{\(\) => applyEmptySuggestion\(suggestion\)\}/,
    );
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
    expect(chat).toContain("aria-label={`编辑第 ${index + 1} 张图片附件`}");
    expect(chat).toContain(
      'const [editingImageTitle, setEditingImageTitle] = useState("编辑图片");',
    );
    expect(chat).toMatch(
      /onClick=\{\(\) => \{[\s\S]*setEditingImageTitle\(\s*`编辑第 \$\{index \+ 1\} 张图片附件`,?\s*\);[\s\S]*setEditingImage\(image\);[\s\S]*\}\}/,
    );
    expect(chat).toContain("title={editingImageTitle}");
    expect(chat).toContain('styles["attach-file"]');
    expect(chat).toContain("aria-label={fileEditContextLabel}");
    expect(chat).toMatch(
      /const fileEditContextLabel = `编辑第 \$\{[\s\S]*index \+ 1[\s\S]*\} 个文件附件：\$\{file\.name\}`;/,
    );
    expect(chat).toContain("const newContent = await showPrompt(");
    expect(chat).toContain("fileEditContextLabel,");
    expect(chat).toContain("file.content,");
    expect(chat).toContain("{ ariaLabel: `${fileEditContextLabel}内容` },");
    expect(uiLibActions).toContain("ariaLabel?: string");
    expect(uiLibActions).toContain("ariaLabel={options?.ariaLabel}");
    expect(promptInput).toContain("ariaLabel?: string");
    expect(chat).toMatch(
      /function DeleteImageButton\(props: \{[\s\S]*ariaLabel: string;[\s\S]*deleteImage: \(e\?: any\) => void[\s\S]*aria-label=\{props\.ariaLabel\}/,
    );
    expect(chat).toContain("ariaLabel={`删除第 ${index + 1} 张图片附件`}");
    expect(chat).toMatch(
      /ariaLabel=\{`删除第 \$\{index \+ 1\} 个文件附件：\$\{\s*file\.name\s*\}`\}/,
    );
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
    expect(chat).toContain(
      "const modelMenuRef = useRef<HTMLDivElement>(null);",
    );
    expect(chat).toContain(
      "const modelMenuFocusFrameRef = useRef<number | null>(null);",
    );
    expect(chat).toContain("const restoreModelSelectorFocus = useCallback");
    expect(chat).toMatch(
      /setTimeout\(\(\) => \{[\s\S]*requestAnimationFrame\([\s\S]*\(\) => modelSelectorButtonRef\.current\?\.focus\(\),?[\s\S]*\);[\s\S]*\}, 0\);/,
    );
    expect(chat).toMatch(
      /const getModelMenuControls = useCallback\(\(\) => \{[\s\S]*modelMenuRef\.current\?\.querySelectorAll<HTMLButtonElement>\(\s*'\[role="option"\], button\[aria-controls\]',\s*\)[\s\S]*filter\(\(control\) => !control\.disabled && control\.offsetParent !== null\);[\s\S]*\}, \[\]\);/,
    );
    expect(chat).toMatch(
      /const focusModelMenuControl = useCallback\(\s*\(key: string\) => \{[\s\S]*case "ArrowDown":[\s\S]*case "ArrowUp":[\s\S]*case "Home":[\s\S]*case "End":[\s\S]*nextControl\.focus\(\);[\s\S]*nextControl\.scrollIntoView\(\{ block: "nearest" \}\);[\s\S]*\},\s*\[getModelMenuControls\],\s*\);/,
    );
    expect(chat).toMatch(
      /const focusInitialModelMenuControl = useCallback\(\(\) => \{[\s\S]*if \(controls\.length === 0\) \{[\s\S]*modelMenuRef\.current\?\.focus\(\{ preventScroll: true \}\);[\s\S]*return;[\s\S]*\}[\s\S]*const selectedControl = controls\.find\([\s\S]*control\.getAttribute\("aria-selected"\) === "true"[\s\S]*const nextControl = selectedControl \?\? controls\[0\];[\s\S]*nextControl\.focus\(\{ preventScroll: true \}\);[\s\S]*nextControl\.scrollIntoView\(\{ block: "nearest" \}\);[\s\S]*\},\s*\[getModelMenuControls\],\s*\);/,
    );
    expect(chat).toMatch(
      /const trapModelMenuTab = useCallback\(\s*\(event: React\.KeyboardEvent<HTMLElement>\) => \{[\s\S]*const controls = getModelMenuControls\(\);[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);[\s\S]*if \(controls\.length === 0\) \{[\s\S]*modelMenuRef\.current\?\.focus\(\{ preventScroll: true \}\);[\s\S]*return;[\s\S]*\}[\s\S]*const nextIndex = event\.shiftKey[\s\S]*currentIndex <= 0[\s\S]*controls\.length - 1[\s\S]*currentIndex \+ 1[\s\S]*nextControl\.focus\(\{ preventScroll: true \}\);[\s\S]*nextControl\.scrollIntoView\(\{ block: "nearest" \}\);[\s\S]*\},\s*\[getModelMenuControls\],\s*\);/,
    );
    expect(handleModelMenuKeyDownBlock).toContain(
      "if (!showMobileModelSelector) return;",
    );
    expect(handleModelMenuKeyDownBlock).toMatch(
      /if \(event\.key === "Tab"\) \{[\s\S]*trapModelMenuTab\(event\);[\s\S]*return;[\s\S]*\}/,
    );
    expect(handleModelMenuKeyDownBlock).toMatch(
      /if \(event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey \|\| event\.shiftKey\) \{[\s\S]*return;[\s\S]*\}/,
    );
    expect(handleModelMenuKeyDownBlock).toMatch(
      /if \(!\["ArrowDown", "ArrowUp", "Home", "End"\]\.includes\(event\.key\)\) return;[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);[\s\S]*focusModelMenuControl\(event\.key\);/,
    );
    const modelMenuTabGuardIndex = handleModelMenuKeyDownBlock.indexOf(
      'if (event.key === "Tab")',
    );
    const modelMenuModifierGuardIndex = handleModelMenuKeyDownBlock.indexOf(
      "event.metaKey || event.ctrlKey || event.altKey || event.shiftKey",
    );
    const modelMenuArrowGuardIndex = handleModelMenuKeyDownBlock.indexOf(
      'if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;',
    );
    expect(modelMenuModifierGuardIndex).toBeGreaterThan(modelMenuTabGuardIndex);
    expect(modelMenuArrowGuardIndex).toBeGreaterThan(
      modelMenuModifierGuardIndex,
    );
    expect(chat).toMatch(
      /useEffect\(\(\) => \{[\s\S]*if \(modelMenuFocusFrameRef\.current !== null\) \{[\s\S]*cancelAnimationFrame\(modelMenuFocusFrameRef\.current\);[\s\S]*modelMenuFocusFrameRef\.current = null;[\s\S]*\}[\s\S]*if \(!showMobileModelSelector\) return;[\s\S]*modelMenuFocusFrameRef\.current = requestAnimationFrame\(\(\) => \{[\s\S]*modelMenuFocusFrameRef\.current = requestAnimationFrame\(\(\) => \{[\s\S]*modelMenuFocusFrameRef\.current = null;[\s\S]*focusInitialModelMenuControl\(\);[\s\S]*\}\);[\s\S]*\}\);[\s\S]*return \(\) => \{[\s\S]*if \(modelMenuFocusFrameRef\.current !== null\) \{[\s\S]*cancelAnimationFrame\(modelMenuFocusFrameRef\.current\);[\s\S]*modelMenuFocusFrameRef\.current = null;[\s\S]*\}[\s\S]*\};[\s\S]*\}, \[focusInitialModelMenuControl, showMobileModelSelector\]\);/,
    );
    expect(chat).toContain("ref={modelSelectorButtonRef}");
    expect(chat).toContain("aria-expanded={showMobileModelSelector}");
    expect(chat).toContain('aria-controls="chat-model-menu"');
    expect(chat).toMatch(
      /className=\{styles\["chat-mobile-model-title"\]\}[\s\S]*aria-label="选择模型"[\s\S]*onKeyDown=\{handleModelMenuKeyDown\}[\s\S]*aria-controls="chat-model-menu"[\s\S]*aria-haspopup="dialog"[\s\S]*aria-expanded=\{showMobileModelSelector\}/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-desktop-model-title"\]\}[\s\S]*aria-label="选择模型和参数"[\s\S]*onKeyDown=\{handleModelMenuKeyDown\}[\s\S]*aria-controls="chat-model-menu"[\s\S]*aria-haspopup="dialog"[\s\S]*aria-expanded=\{showMobileModelSelector\}/,
    );
    expect(chat).toContain('aria-label="关闭模型选择"');
    expect(chat).toContain('id="chat-model-menu"');
    expect(chat).toContain('role="dialog"');
    expect(chat).toMatch(
      /id="chat-model-menu"[\s\S]*role="dialog"[\s\S]*aria-modal="true"[\s\S]*aria-label="模型和思考等级"/,
    );
    expect(chat).toContain('aria-label="模型和思考等级"');
    expect(chat).toMatch(
      /id="chat-model-menu"[\s\S]*ref=\{modelMenuRef\}[\s\S]*onKeyDown=\{handleModelMenuKeyDown\}[\s\S]*tabIndex=\{-1\}[\s\S]*role="dialog"[\s\S]*aria-modal="true"/,
    );
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
      /className=\{styles\["prompt-hints"\]\}[\s\S]*aria-activedescendant=\{`chat-prompt-hint-\$\{activeSelectIndex\}`\}/,
    );
    expect(chat).toMatch(
      /className=\{clsx\(styles\["prompt-hint"\][\s\S]*role="option"[\s\S]*aria-selected=\{i === activeSelectIndex\}/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-input"\]\}[\s\S]*aria-controls=\{\s*promptHints\.length > 0 \? "chat-prompt-hints" : undefined\s*\}[\s\S]*aria-haspopup="listbox"/,
    );
    expect(promptHintsRootBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(promptHintsRootBlock).toMatch(
      /background:\s*var\(--surface-elevated\);/,
    );
    expect(promptHintsRootBlock).toMatch(
      /--prompt-hint-selected-background:\s*color-mix\(in srgb,\s*var\(--primary\) 10%,\s*transparent\);/,
    );
    expect(promptHintsRootBlock).toMatch(
      /--prompt-hint-selected-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 18%,\s*transparent\);/,
    );
    expect(promptHintsRootBlock).toMatch(
      /--prompt-hint-selected-ring-color:\s*color-mix\(in srgb,\s*var\(--primary\) 22%,\s*transparent\);/,
    );
    expect(promptHintsRootBlock).toMatch(/border-radius:\s*18px;/);
    expect(promptHintsRootBlock).toMatch(/padding:\s*6px;/);
    expect(promptHintsRootBlock).toMatch(/overscroll-behavior:\s*contain;/);
    expect(promptHintsRootBlock).toMatch(/scrollbar-width:\s*thin;/);
    expect(promptHintsRootBlock).toMatch(
      /box-shadow:\s*var\(--composer-shadow\);/,
    );
    expect(promptHintRootBlock).toMatch(/appearance:\s*none;/);
    expect(promptHintRootBlock).toMatch(/width:\s*100%;/);
    expect(promptHintRootBlock).toMatch(/min-height:\s*44px;/);
    expect(promptHintRootBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(promptHintRootBlock).toMatch(/text-align:\s*left;/);
    expect(promptHintRootBlock).toMatch(/background:\s*transparent;/);
    expect(promptHintRootBlock).toMatch(/border:\s*1px solid transparent;/);
    expect(promptHintBlock).toMatch(
      /&\.prompt-hint-selected,\s*&\[aria-selected="true"\],\s*&:hover,\s*&:focus-visible\s*\{[\s\S]*background:\s*var\(--prompt-hint-selected-background\);[\s\S]*border-color:\s*var\(--prompt-hint-selected-border-color\);[\s\S]*box-shadow:\s*inset 0 0 0 1px var\(--prompt-hint-selected-ring-color\);/,
    );
    expect(darkPromptHintsBlock).toMatch(
      /--prompt-hint-selected-background:\s*color-mix\(in srgb,\s*var\(--primary\) 16%,\s*var\(--surface\)\);/,
    );
    expect(darkPromptHintsBlock).toMatch(
      /--prompt-hint-selected-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 28%,\s*transparent\);/,
    );
    expect(darkPromptHintsBlock).toMatch(
      /--prompt-hint-selected-ring-color:\s*color-mix\(in srgb,\s*var\(--primary\) 24%,\s*transparent\);/,
    );
    expect(autoDarkPromptHintsSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkPromptHintsMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkPromptHintsBlock).toMatch(
      /--prompt-hint-selected-background:\s*color-mix\(in srgb,\s*var\(--primary\) 16%,\s*var\(--surface\)\);/,
    );
    expect(autoDarkPromptHintsBlock).toMatch(
      /--prompt-hint-selected-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 28%,\s*transparent\);/,
    );
    expect(autoDarkPromptHintsBlock).toMatch(
      /--prompt-hint-selected-ring-color:\s*color-mix\(in srgb,\s*var\(--primary\) 24%,\s*transparent\);/,
    );
    expect(promptHintsToneScope).not.toMatch(legacyPromptHintSelectedPaint);
    expect(promptHintsMobileBlock).toMatch(
      /\.prompt-hints\s*\{[\s\S]*max-height:\s*min\(46vh,\s*320px\);/,
    );
    expect(promptHintsMobileBlock).toMatch(
      /\.prompt-hint\s*\{[\s\S]*min-height:\s*44px;/,
    );
    expect(chat).toMatch(
      /type PromptHintsCloseOptions = \{[\s\S]*restoreFocus\?: boolean;[\s\S]*\};/,
    );
    expect(chat).toMatch(
      /export function PromptHints\(props: \{[\s\S]*onClose: \(options\?: PromptHintsCloseOptions\) => void;/,
    );
    expect(promptHintsRenderSetup).not.toContain("setSelectIndex(0);");
    expect(chat).toMatch(
      /const activeSelectIndex = noPrompts\s*\?\s*0\s*:\s*Math\.min\(selectIndex, prompts\.length - 1\);/,
    );
    expect(chat).toMatch(
      /useEffect\(\(\) => \{[\s\S]*if \(prompts\.length !== promptCountRef\.current\) \{[\s\S]*promptCountRef\.current = prompts\.length;[\s\S]*setSelectIndex\(0\);[\s\S]*return;[\s\S]*\}[\s\S]*if \(selectIndex !== activeSelectIndex\) \{[\s\S]*setSelectIndex\(activeSelectIndex\);[\s\S]*\}[\s\S]*\}, \[activeSelectIndex, prompts\.length, selectIndex\]\);/,
    );
    expect(chat).toMatch(
      /if \(e\.key === "Escape"\) \{[\s\S]*e\.stopPropagation\(\);[\s\S]*e\.stopImmediatePropagation\(\);[\s\S]*e\.preventDefault\(\);[\s\S]*onClose\(\{ restoreFocus: true \}\);[\s\S]*\}/,
    );
    expect(promptHintsKeyDownBlock).toMatch(
      /const isPromptNavigationKey = \[[\s\S]*"ArrowUp",[\s\S]*"ArrowDown",[\s\S]*"Home",[\s\S]*"End",?[\s\S]*\]\.includes\(e\.key\);/,
    );
    expect(promptHintsKeyDownBlock).toMatch(
      /if \(noPrompts \|\| e\.metaKey \|\| e\.altKey \|\| e\.ctrlKey\) \{[\s\S]*return;[\s\S]*\}/,
    );
    expect(promptHintsKeyDownBlock).not.toContain(
      "e.metaKey || e.altKey || e.ctrlKey || e.shiftKey",
    );
    expect(promptHintsKeyDownBlock).toMatch(
      /if \(e\.shiftKey && isPromptNavigationKey\) \{[\s\S]*return;[\s\S]*\}/,
    );
    expect(
      promptHintsKeyDownBlock.indexOf(
        "if (e.shiftKey && isPromptNavigationKey)",
      ),
    ).toBeGreaterThan(
      promptHintsKeyDownBlock.indexOf('if (e.key === "Escape")'),
    );
    expect(
      promptHintsKeyDownBlock.indexOf(
        "if (e.shiftKey && isPromptNavigationKey)",
      ),
    ).toBeLessThan(
      promptHintsKeyDownBlock.indexOf('if (e.key === "ArrowUp")'),
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
      /useEffect\(\(\) => \{[\s\S]*selectedRef\.current\?\.scrollIntoView\(\{[\s\S]*block:\s*"nearest",[\s\S]*\}\);[\s\S]*\}, \[activeSelectIndex\]\);/,
    );
    expect(chat).toMatch(
      /else if \(e\.key === "Enter"\) \{[\s\S]*e\.stopPropagation\(\);[\s\S]*e\.preventDefault\(\);[\s\S]*const selectedPrompt = prompts\.at\(activeSelectIndex\);[\s\S]*onPromptSelect\(selectedPrompt\);/,
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
    expect(chat).toContain(
      "const chatInputActionMenuRef = useRef<HTMLDivElement>(null);",
    );
    expect(chat).toMatch(
      /const getChatActionMenuControls = useCallback\(\(\) => \{[\s\S]*chatInputActionMenuRef\.current\?\.querySelectorAll<HTMLButtonElement>\(\s*`button\.\$\{styles\["chat-input-action"\]\}`,?\s*\)[\s\S]*\.filter\(\s*\(control\) =>[\s\S]*!control\.disabled &&[\s\S]*control\.offsetParent !== null &&[\s\S]*!control\.closest\('\[role="listbox"\]'\),[\s\S]*\);[\s\S]*\}, \[\]\);/,
    );
    expect(chat).toMatch(
      /const focusChatActionMenuControl = useCallback\(\s*\(key: string\) => \{[\s\S]*case "ArrowDown":[\s\S]*case "ArrowUp":[\s\S]*case "Home":[\s\S]*case "End":[\s\S]*nextControl\.focus\(\);[\s\S]*nextControl\.scrollIntoView\(\{ block: "nearest" \}\);[\s\S]*\},\s*\[getChatActionMenuControls\],\s*\);/,
    );
    expect(chat).toMatch(
      /const trapChatActionMenuTab = useCallback\(\s*\(event: React\.KeyboardEvent<HTMLElement>\) => \{[\s\S]*const controls = getChatActionMenuControls\(\);[\s\S]*if \(controls\.length === 0\) return;[\s\S]*const currentIndex = controls\.findIndex\([\s\S]*document\.activeElement[\s\S]*const nextIndex = event\.shiftKey[\s\S]*currentIndex <= 0[\s\S]*controls\.length - 1[\s\S]*currentIndex >= controls\.length - 1[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);[\s\S]*nextControl\?\.focus\(\);[\s\S]*nextControl\?\.scrollIntoView\(\{ block: "nearest" \}\);[\s\S]*\},\s*\[getChatActionMenuControls\],\s*\);/,
    );
    expect(chat).toMatch(
      /useEffect\(\(\) => \{[\s\S]*if \(!showChatActionMenu\) return;[\s\S]*const focusFirstChatActionMenuControl = \(\) => \{[\s\S]*activeElement\.classList\.contains\(styles\["chat-input-action"\]\)[\s\S]*chatInputActionMenuRef\.current\?\.contains\(activeElement\)[\s\S]*return;[\s\S]*focusChatActionMenuControl\("Home"\);[\s\S]*\};[\s\S]*const focusFrame = requestAnimationFrame\(focusFirstChatActionMenuControl\);[\s\S]*const settleFocusTimer = window\.setTimeout\(\s*focusFirstChatActionMenuControl,[\s\S]*180,?[\s\S]*\);[\s\S]*cancelAnimationFrame\(focusFrame\);[\s\S]*window\.clearTimeout\(settleFocusTimer\);[\s\S]*\}, \[focusChatActionMenuControl, showChatActionMenu\]\);/,
    );
    expect(chat).toMatch(
      /const handleChatActionMenuKeyDown = \(\s*event: React\.KeyboardEvent<HTMLElement>,?\s*\) => \{[\s\S]*if \(!showChatActionMenu\) return;[\s\S]*if \(\(event\.target as HTMLElement \| null\)\?\.closest\('\[role="listbox"\]'\)\) \{[\s\S]*return;[\s\S]*\}[\s\S]*if \(event\.key === "Tab"\) \{[\s\S]*trapChatActionMenuTab\(event\);[\s\S]*return;[\s\S]*\}[\s\S]*if \(!\["ArrowDown", "ArrowUp", "Home", "End"\]\.includes\(event\.key\)\) return;[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);[\s\S]*focusChatActionMenuControl\(event\.key\);[\s\S]*\};/,
    );
    expect(chatActionMenuKeyDownBlock).toMatch(
      /if \(event\.key === "Tab"\) \{[\s\S]*trapChatActionMenuTab\(event\);[\s\S]*return;[\s\S]*\}/,
    );
    expect(chatActionMenuKeyDownBlock).toMatch(
      /if \(event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey \|\| event\.shiftKey\) \{[\s\S]*return;[\s\S]*\}/,
    );
    expect(
      chatActionMenuKeyDownBlock.indexOf('if (event.key === "Tab")'),
    ).toBeLessThan(
      chatActionMenuKeyDownBlock.indexOf(
        "if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)",
      ),
    );
    expect(
      chatActionMenuKeyDownBlock.indexOf(
        "if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)",
      ),
    ).toBeLessThan(
      chatActionMenuKeyDownBlock.indexOf(
        'if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;',
      ),
    );
    expect(chat).toMatch(
      /if \(\(event\.target as HTMLElement \| null\)\?\.closest\('\[role="listbox"\]'\)\) \{[\s\S]*return;[\s\S]*\}/,
    );
    expect(chat).toContain("ref={chatInputMenuButtonRef}");
    expect(chat).toContain('aria-label="关闭对话工具"');
    expect(chat).toMatch(
      /id="chat-input-action-menu"[\s\S]*ref=\{chatInputActionMenuRef\}[\s\S]*className=\{clsx\(styles\["chat-input-action-menu"\][\s\S]*\)[\s\S]*\}[\s\S]*onKeyDown=\{handleChatActionMenuKeyDown\}[\s\S]*role="dialog"[\s\S]*aria-modal="true"[\s\S]*aria-label="对话工具菜单"/,
    );
    expect(chat).toMatch(
      /ref=\{chatInputMenuButtonRef\}[\s\S]*onKeyDown=\{handleChatActionMenuKeyDown\}[\s\S]*aria-controls="chat-input-action-menu"[\s\S]*aria-haspopup="dialog"[\s\S]*aria-expanded=\{showChatActionMenu\}/,
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
      /const canSubmitComposer =\s*userInput\.trim\(\)\.length > 0 \|\|\s*attachImages\.length > 0 \|\|\s*attachedFiles\.length > 0;/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-input-send"\]\}[\s\S]*disabled=\{!canSubmitComposer\}[\s\S]*aria=\{Locale\.Chat\.Send\}/,
    );
    expect(inputStatusBlock).toContain(".chat-input");
    expect(inputStatusBlock).toContain("width: calc(100% - 96px)");
    expect(chat).toContain('styles["chat-reading-surface"]');
    expect(chat).toContain('styles["chat-scroll-to-bottom"]');
    expect(chat).toMatch(
      /<section[\s\S]*id="chat-scroll-body"[\s\S]*className=\{clsx\(styles\["chat-body"\][\s\S]*ref=\{scrollRef\}[\s\S]*aria-label="聊天消息"[\s\S]*onScroll=\{\(e\) => onChatBodyScroll\(e\.currentTarget\)\}/,
    );
    expect(chat).toMatch(
      /className=\{clsx\(styles\["chat-input-panel"\][\s\S]*\)\}[\s\S]*\{!showEmptyState && !hitBottom && !showChatActionMenu && \([\s\S]*className=\{styles\["chat-scroll-to-bottom"\]\}[\s\S]*aria-label=\{Locale\.Chat\.InputActions\.ToBottom\}[\s\S]*aria-controls="chat-scroll-body"[\s\S]*onClick=\{scrollToBottom\}[\s\S]*<BottomIcon \/>[\s\S]*\)\}[\s\S]*<PromptHints/,
    );
    expect(chat).toMatch(
      /const syncHitBottomState = useCallback\(\s*\(e: HTMLElement, syncAutoScroll = false\) => \{[\s\S]*const bottomHeight = e\.scrollTop \+ e\.clientHeight;[\s\S]*setHitBottom\(isHitBottom\);[\s\S]*if \(syncAutoScroll\) \{[\s\S]*setAutoScroll\(isHitBottom\);[\s\S]*\}[\s\S]*return \{ bottomHeight, isHitBottom \};[\s\S]*\},\s*\[isMobileScreen, setAutoScroll\],\s*\);/,
    );
    expect(chat).toMatch(
      /const onChatBodyScroll = \(e: HTMLElement\) => \{[\s\S]*const \{ bottomHeight \} = syncHitBottomState\(e, true\);/,
    );
    expect(chat).toMatch(
      /window\.addEventListener\("resize", syncHitBottomAfterResize\);[\s\S]*window\.removeEventListener\("resize", syncHitBottomAfterResize\);[\s\S]*cancelAnimationFrame\(resizeFrame\);/,
    );
    expect(chat).toMatch(
      /syncHitBottomAfterResize\(\);[\s\S]*window\.addEventListener\("resize", syncHitBottomAfterResize\);/,
    );
    expect(chat).toMatch(
      /\}, \[messageScrollSignal, scrollRef, session\.id, syncHitBottomState\]\);/,
    );
    expect(chat).toContain(
      "const readingSurfaceRef = useRef<HTMLDivElement>(null);",
    );
    expect(chat).toMatch(
      /const readingSurface = readingSurfaceRef\.current;[\s\S]*new ResizeObserver\(syncHitBottomAfterResize\);[\s\S]*contentResizeObserver\.observe\(readingSurface\);[\s\S]*contentResizeObserver\?\.disconnect\(\);/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-reading-surface"\]\}[\s\S]*ref=\{readingSurfaceRef\}[\s\S]*role="list"[\s\S]*aria-label="会话消息列表"/,
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
    expect(chat).toContain("const getMessageActionRailControls = useCallback");
    expect(chat).toMatch(
      /const getMessageActionRailControls = useCallback\(\s*\(rail: HTMLElement \| null\) => \{[\s\S]*rail\?\.querySelectorAll<HTMLButtonElement>\(\s*`button\.\$\{styles\["chat-input-action"\]\}`,?\s*\)[\s\S]*\.filter\(\s*\(control\) => !control\.disabled && control\.offsetParent !== null[\s\S]*\);[\s\S]*\}, \[\]\);/,
    );
    expect(chat).toContain("const focusMessageActionRailControl = useCallback");
    expect(chat).toMatch(
      /const focusMessageActionRailControl = useCallback\(\s*\(rail: HTMLElement \| null, key: string\) => \{[\s\S]*const controls = getMessageActionRailControls\(rail\);[\s\S]*case "ArrowRight":[\s\S]*case "ArrowDown":[\s\S]*case "ArrowLeft":[\s\S]*case "ArrowUp":[\s\S]*case "Home":[\s\S]*case "End":[\s\S]*nextControl\.focus\(\{ preventScroll: true \}\);[\s\S]*\},\s*\[getMessageActionRailControls\],\s*\);/,
    );
    expect(messageActionRailFocusBlock).not.toContain("scrollIntoView");
    expect(chat).toContain("const handleMessageActionRailKeyDown = useCallback");
    expect(chat).toMatch(
      /const handleMessageActionRailKeyDown = useCallback\(\s*\(event: React\.KeyboardEvent<HTMLDivElement>\) => \{[\s\S]*if \(event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey \|\| event\.shiftKey\) \{[\s\S]*return;[\s\S]*\}/,
    );
    expect(chat).toMatch(
      /const handleMessageActionRailKeyDown = useCallback\(\s*\(event: React\.KeyboardEvent<HTMLDivElement>\) => \{[\s\S]*event\.metaKey \|\| event\.ctrlKey \|\| event\.altKey \|\| event\.shiftKey[\s\S]*return;[\s\S]*"ArrowRight"[\s\S]*"ArrowDown"[\s\S]*"ArrowLeft"[\s\S]*"ArrowUp"[\s\S]*"Home"[\s\S]*"End"[\s\S]*\.includes\(\s*event\.key,?\s*\)[\s\S]*return;[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);[\s\S]*focusMessageActionRailControl\(event\.currentTarget, event\.key\);[\s\S]*\},\s*\[focusMessageActionRailControl\],\s*\);/,
    );
    expect(chat).toMatch(
      /className=\{styles\["chat-message-action-rail"\]\}[\s\S]*onKeyDown=\{handleMessageActionRailKeyDown\}/,
    );
    expect(chat).toContain("copiedMessageActionId");
    expect(chat).toContain("messageCopyFeedbackTimerRef");
    expect(chat).toContain("messageCopyRequestIdRef");
    expect(chat).toContain("const restoreMessageCopyFocus = useCallback");
    expect(chat).toContain("if (!trigger?.isConnected) return;");
    expect(chat).toContain("const activeElement = document.activeElement;");
    expect(chat).toContain(
      "activeElement === trigger || activeElement === document.body",
    );
    expect(chat).toContain("trigger.focus({ preventScroll: true });");
    expect(chat).toContain("const copyMessageContent = useCallback");
    expect(chat).toMatch(
      /async \(\s*message: ChatMessage,\s*messageActionId: string \| number,\s*trigger\?: HTMLButtonElement \| null,\s*\) => \{/,
    );
    expect(chat).toContain(
      "const copyRequestId = messageCopyRequestIdRef.current + 1;",
    );
    expect(chat).toContain("messageCopyRequestIdRef.current = copyRequestId;");
    expect(chat).toContain(
      "const didCopy = await copyToClipboard(getMessageTextContent(message));",
    );
    expect(chat).toContain(
      "if (messageCopyRequestIdRef.current !== copyRequestId) return;",
    );
    expect(chat).toContain("restoreMessageCopyFocus(trigger);");
    expect(chat).toContain("if (!didCopy) return;");
    expect(chat).toContain("setCopiedMessageActionId(null);");
    expect(chat).toContain("setCopiedMessageActionId(messageActionId);");
    expect(chat).toContain(
      "clearTimeout(messageCopyFeedbackTimerRef.current);",
    );
    expect(chat).toContain(
      "messageCopyFeedbackTimerRef.current = setTimeout(() => {",
    );
    expect(chat).toMatch(
      /setCopiedMessageActionId\(\(currentActionId\) =>[\s\S]*currentActionId === messageActionId \? null : currentActionId,/,
    );
    expect(chat).toMatch(/setTimeout\([\s\S]*1400[\s\S]*\);/);
    expect(chat).not.toContain(
      "copyToClipboard(getMessageTextContent(message)).finally",
    );
    expect(chat).toMatch(
      /return \(\) => \{[\s\S]*if \(messageCopyFeedbackTimerRef\.current\) \{[\s\S]*clearTimeout\(messageCopyFeedbackTimerRef\.current\);[\s\S]*\}[\s\S]*\};/,
    );
    expect(chat).toMatch(
      /const messageActionId = message\.id \?\? i;[\s\S]*const isMessageCopied =[\s\S]*copiedMessageActionId === messageActionId;/,
    );
    expect(chat).toMatch(
      /const messageCopyActionLabel = `\$\{messageActionLabel\}：\$\{[\s\S]*isMessageCopied[\s\S]*\? Locale\.Copy\.Success[\s\S]*: Locale\.Chat\.Actions\.Copy[\s\S]*\}`;/,
    );
    expect(chat).toMatch(
      /const messageCopyStatus = isMessageCopied[\s\S]*\? `\$\{messageLabel\} \$\{Locale\.Copy\.Success\}`[\s\S]*: "";/,
    );
    expect(chat).toMatch(
      /text=\{[\s\S]*isMessageCopied[\s\S]*\? Locale\.Copy\.Success[\s\S]*: Locale\.Chat\.Actions\.Copy[\s\S]*\}/,
    );
    expect(chat).toContain("ariaLabel={messageCopyActionLabel}");
    expect(chat).toContain("title={messageCopyActionLabel}");
    expect(chat).toMatch(
      /dataCopyState=\{[\s\S]*isMessageCopied \? "copied" : "idle"[\s\S]*\}/,
    );
    expect(chat).toMatch(
      /icon=\{[\s\S]*isMessageCopied \?[\s\S]*<ConfirmIcon \/>[\s\S]*:[\s\S]*<CopyIcon \/>[\s\S]*\}/,
    );
    expect(chat).toMatch(
      /onClick=\{\(event\) =>[\s\S]*copyMessageContent\([\s\S]*message,[\s\S]*messageActionId,[\s\S]*event\.currentTarget,[\s\S]*\)[\s\S]*\}/,
    );
    expect(chat).toContain('styles["chat-message-copy-status"]');
    expect(chat).toMatch(
      /role="status"[\s\S]*aria-live="polite"[\s\S]*aria-atomic="true"[\s\S]*\{messageCopyStatus\}/,
    );
    expect(chat).toContain("ariaLabel?: string;");
    expect(chat).toContain(
      "onClick: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;",
    );
    expect(chat).toContain("title?: string;");
    expect(chat).toContain('dataCopyState?: "idle" | "copied";');
    expect(chat).toContain(
      'ariaHasPopup?: React.AriaAttributes["aria-haspopup"];',
    );
    expect(chat).toContain("ariaExpanded?: boolean;");
    expect(chat).toContain("aria-label={props.ariaLabel ?? props.text}");
    expect(chat).toContain("void props.onClick(event);");
    expect(chat).toContain("title={props.title}");
    expect(chat).toContain("data-copy-state={props.dataCopyState}");
    expect(chat).toContain("aria-haspopup={props.ariaHasPopup}");
    expect(chat).toContain("aria-expanded={props.ariaExpanded}");
    expect(utils).toContain("export async function copyToClipboard");
    expect(utils).toMatch(
      /await navigator\.clipboard\.writeText\(text\);[\s\S]*showToast\(Locale\.Copy\.Success\);[\s\S]*return true;/,
    );
    expect(utils).toMatch(
      /document\.execCommand\("copy"\);[\s\S]*showToast\(Locale\.Copy\.Success\);[\s\S]*return true;/,
    );
    expect(utils).toContain("showToast(Locale.Copy.Failed);");
    expect(utils).toContain("return false;");
    expect(utils).toMatch(
      /finally \{[\s\S]*document\.body\.removeChild\(textArea\);[\s\S]*\}/,
    );
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
    expect(chat).toContain("ariaLabel={messageCopyActionLabel}");
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
      /id="mobile-sidebar-drawer"[\s\S]*role=\{isMobileOpen \? "dialog" : undefined\}/,
    );
    expect(sidebar).toMatch(
      /id="mobile-sidebar-drawer"[\s\S]*aria-modal=\{isMobileOpen \? true : undefined\}/,
    );
    expect(sidebar).toMatch(
      /id="mobile-sidebar-drawer"[\s\S]*aria-label=\{Locale\.Chat\.Actions\.ChatList\}/,
    );
    expect(sidebar).toMatch(/tabIndex=\{isMobileOpen \? -1 : undefined\}/);
    expect(sidebar).toMatch(/left:\s*isMobileOpen \? 0 : undefined/);
    expect(sidebar).toMatch(/display:\s*isMobileHidden \? "none" : undefined/);
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
    expect(chatList).toContain(
      'aria-current={isCurrentChatItem ? "page" : undefined}',
    );
    expect(chatList).toMatch(
      /\{\.\.\.provided\.draggableProps\}[\s\S]*role="listitem"[\s\S]*aria-current=\{isCurrentChatItem \? "page" : undefined\}/,
    );
    expect(chatList).toMatch(
      /aria-label=\{`\$\{props\.title\}, \$\{Locale\.ChatItem\.ChatItemCount\(\s*props\.count,\s*\)\}`\}/,
    );
    expect(chatList).toMatch(
      /\{\.\.\.dragHandleProps\}[\s\S]*aria-label=\{`\$\{props\.title\}, \$\{Locale\.ChatItem\.ChatItemCount\(\s*props\.count,\s*\)\}`\}/,
    );
    expect(chatList).toContain("aria-label={Locale.Home.DeleteChat}");
    expect(chatList).toContain('styles["chat-item-delete"]');
    expect(chatList).not.toContain("style={{");
    expect(home).toContain('[styles["sidebar-show"]]: isHome');
    expect(home).toContain("isMobileHidden={isCompactScreen && !isHome}");
    expect(home).toMatch(
      /const isMobileDrawerOpen =[\s\S]*isCompactScreen &&[\s\S]*isHome &&[\s\S]*!shouldRequireAccessCode &&[\s\S]*!isAuth &&[\s\S]*!isSd &&[\s\S]*!isSdNew;/,
    );
    expect(home).toContain("isMobileOpen={isMobileDrawerOpen}");
    expect(home).toContain("isMobileDrawerOpen &&");
    expect(home).toContain('styles["sidebar-backdrop"]');
    expect(home).toContain('aria-label="关闭侧边栏"');
    expect(home).toContain('aria-controls="mobile-sidebar-drawer"');
    expect(home).toContain("aria-expanded={isMobileDrawerOpen}");
    expect(home).toContain("navigate(Path.Chat)");
    expect(home).toMatch(
      /function focusMobileSidebarTrigger[\s\S]*requestAnimationFrame\([\s\S]*document[\s\S]*\.querySelector<HTMLButtonElement>\(MOBILE_SIDEBAR_TRIGGER_SELECTOR\)[\s\S]*\?\.focus\(\{ preventScroll: true \}\)/,
    );
    expect(home).toMatch(
      /const closeMobileSidebar[\s\S]*navigate\(Path\.Chat\)[\s\S]*focusMobileSidebarTrigger\(\)/,
    );
    expect(home).toContain("focusMobileSidebarDrawer();");
    expect(home).toContain("trapMobileSidebarTab(event)");
    expect(home).toContain("MOBILE_SIDEBAR_FOCUSABLE_SELECTOR");
    expect(home).toMatch(
      /function trapMobileSidebarTab[\s\S]*event\.preventDefault\(\)[\s\S]*firstElement\.focus\(\{ preventScroll: true \}\)/,
    );
    expect(home).toMatch(
      /function trapMobileSidebarTab[\s\S]*lastElement\.focus\(\{ preventScroll: true \}\)/,
    );
    expect(home).toMatch(
      /if \(!isMobileDrawerOpen\) \{[\s\S]*setIsMobileAppBodySuppressed\(false\);[\s\S]*return;[\s\S]*\}[\s\S]*const handleKeyDown = \(event: KeyboardEvent\) => \{[\s\S]*event\.key === "Escape"[\s\S]*closeMobileSidebar\(\)/,
    );
    expect(home).toMatch(
      /event\.key === "Tab"[\s\S]*trapMobileSidebarTab\(event\)/,
    );
    expect(home).toContain("useState");
    expect(home).toContain(
      "const [isMobileAppBodySuppressed, setIsMobileAppBodySuppressed] =",
    );
    expect(home).toMatch(
      /id=\{SlotID\.AppBody\}[\s\S]*aria-hidden=\{props\.isMobileDrawerOpen \? true : undefined\}/,
    );
    expect(home).toMatch(
      /id=\{SlotID\.AppBody\}[\s\S]*data-mobile-sidebar-suppressed=\{[\s\S]*props\.isMobileDrawerOpen \? "true" : undefined[\s\S]*\}/,
    );
    expect(home).toMatch(
      /function focusMobileSidebarDrawer\(\)[\s\S]*const drawer = document[\s\S]*querySelector<HTMLElement>\([\s\S]*MOBILE_SIDEBAR_DRAWER_SELECTOR[\s\S]*\);[\s\S]*if \(!drawer\) return false;[\s\S]*drawer\.focus\(\{ preventScroll: true \}\);[\s\S]*return \([\s\S]*document\.activeElement instanceof Node &&[\s\S]*drawer\.contains\(document\.activeElement\)[\s\S]*\);/,
    );
    expect(home).toMatch(
      /if \(!isMobileDrawerOpen\) \{[\s\S]*setIsMobileAppBodySuppressed\(false\);[\s\S]*return;[\s\S]*\}[\s\S]*setIsMobileAppBodySuppressed\(false\);[\s\S]*const didFocusMobileSidebarDrawer = focusMobileSidebarDrawer\(\);[\s\S]*setIsMobileAppBodySuppressed\(didFocusMobileSidebarDrawer\);/,
    );
    expect(home).toMatch(
      /<WindowContent[\s\S]*isMobileDrawerOpen=\{isMobileDrawerOpen && isMobileAppBodySuppressed\}[\s\S]*>/,
    );
    expect(home).toContain("onClick={closeMobileSidebar}");

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
    expect(emptySuggestionBlock).toMatch(/width:\s*100%;/);
    expect(emptySuggestionBlock).toContain("&:active");
    expect(emptySuggestionBlock).toMatch(
      /&:active[\s\S]*transform:\s*translateY\(0\) scale\(0\.995\);/,
    );
    expect(emptySuggestionAffordanceBlock).toMatch(/flex:\s*0 0 18px;/);
    expect(emptySuggestionAffordanceBlock).toMatch(/width:\s*18px;/);
    expect(emptySuggestionAffordanceBlock).toMatch(/height:\s*18px;/);
    expect(emptySuggestionAffordanceBlock).toMatch(/border-radius:\s*999px;/);
    expect(emptySuggestionAffordanceBlock).toMatch(/font-size:\s*12px;/);
    expect(emptySuggestionFocusAffordanceBlock).toMatch(
      /transform:\s*translateX\(2px\);/,
    );
    expect(emptySuggestionFocusAffordanceBlock).toMatch(
      /background-color:\s*rgba\(49,\s*94,\s*248,\s*0\.1\);/,
    );
    expect(reducedMotionBlock).toMatch(
      /\.chat-empty-suggestion,\s*\.chat-empty-suggestion-affordance\s*\{[\s\S]*transition-duration:\s*0\.01ms !important;/,
    );
    expect(reducedMotionBlock).toMatch(
      /\.chat-empty-suggestion:hover,\s*\.chat-empty-suggestion:focus-visible,\s*\.chat-empty-suggestion:active,\s*\.chat-empty-suggestion:hover \.chat-empty-suggestion-affordance,\s*\.chat-empty-suggestion:focus-visible \.chat-empty-suggestion-affordance\s*\{[\s\S]*transform:\s*none !important;/,
    );
    expect(reducedMotionBlock).toMatch(
      /\.chat-scroll-to-bottom,\s*\.chat-scroll-to-bottom:hover,\s*\.chat-scroll-to-bottom:active\s*\{[\s\S]*transform:\s*translateX\(-50%\) !important;[\s\S]*transition-duration:\s*0\.01ms !important;/,
    );
    expect(emptySuggestionTextBlock).toMatch(/display:\s*-webkit-box;/);
    expect(emptySuggestionTextBlock).toMatch(/line-height:\s*1\.2;/);
    expect(emptySuggestionTextBlock).toMatch(/max-height:\s*2\.4em;/);
    expect(emptySuggestionTextBlock).toMatch(/-webkit-line-clamp:\s*2;/);
    expect(emptySuggestionTextBlock).toMatch(/-webkit-box-orient:\s*vertical;/);
    expect(emptySuggestionTextBlock).toMatch(/white-space:\s*normal;/);
    expect(mobileEmptySuggestionBlock).toMatch(/min-height:\s*44px;/);
    expect(narrowEmptySuggestionsBlock).toMatch(
      /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*!important;/,
    );
    expect(narrowEmptySuggestionsBlock).toMatch(
      /width:\s*min\(360px,\s*100%\)\s*!important;/,
    );
    expect(narrowEmptySuggestionBlock).toMatch(
      /min-height:\s*48px\s*!important;/,
    );
    expect(chatStyles).toContain(".chat-reading-surface");
    expect(chatStyles).toContain(".chat-message-row");
    expect(chatStyles).toContain(".chat-message-row-user");
    expect(chatStyles).toContain(".chat-message-row-assistant");
    expect(chatStyles).toContain(".chat-message-action-rail");
    expect(globalLightMixinBlock).toMatch(
      /--copy-success-background:\s*color-mix\(\s*in srgb,\s*rgb\(52,\s*168,\s*83\) 12%,\s*transparent\s*\);/,
    );
    expect(globalLightMixinBlock).toMatch(
      /--copy-success-color:\s*color-mix\(\s*in srgb,\s*rgb\(24,\s*128,\s*56\) 94%,\s*transparent\s*\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--copy-success-background:\s*color-mix\(\s*in srgb,\s*rgb\(129,\s*201,\s*149\) 14%,\s*transparent\s*\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--copy-success-color:\s*color-mix\(\s*in srgb,\s*rgb\(129,\s*201,\s*149\) 96%,\s*transparent\s*\);/,
    );
    expect(messageActionRailBlock).toMatch(
      /--message-action-copy-success-background:\s*var\(--copy-success-background\);/,
    );
    expect(messageActionRailBlock).toMatch(
      /--message-action-copy-success-color:\s*var\(--copy-success-color\);/,
    );
    expect(messageActionRailBlock).toMatch(
      /\.chat-input-action\[data-copy-state="copied"\],[\s\S]*\.chat-input-action\[data-copy-state="copied"\]:hover,[\s\S]*\.chat-input-action\[data-copy-state="copied"\]:focus-visible[\s\S]*background-color:\s*var\(--message-action-copy-success-background\)\s*!important;[\s\S]*color:\s*var\(--message-action-copy-success-color\)\s*!important;[\s\S]*transition:\s*box-shadow 0\.16s ease !important;/,
    );
    expect(messageActionRailBlock).not.toMatch(
      /background:\s*var\(--message-action-copy-success-background\)\s*!important;/,
    );
    expect(messageCopySuccessToneScope).not.toMatch(
      legacyMessageCopySuccessPaint,
    );
    expect(messageCopyStatusBlock).toMatch(/position:\s*absolute;/);
    expect(messageCopyStatusBlock).toMatch(/width:\s*1px;/);
    expect(messageCopyStatusBlock).toMatch(/height:\s*1px;/);
    expect(messageCopyStatusBlock).toMatch(/overflow:\s*hidden;/);
    expect(messageCopyStatusBlock).toMatch(/clip-path:\s*inset\(50%\);/);
    expect(messageCopyStatusBlock).toMatch(/white-space:\s*nowrap;/);
    expect(chatStyles).toContain(".attach-image-item");
    expect(chatStyles).toContain(".attach-file-item");
    expect(attachmentsContainerBlock).toMatch(/align-items:\s*center;/);
    expect(attachmentsContainerBlock).toMatch(/gap:\s*8px;/);
    expect(attachmentsContainerBlock).toMatch(/padding:\s*2px 58px 4px 0;/);
    expect(attachmentsContainerBlock).toMatch(/scroll-padding-right:\s*58px;/);
    expect(attachmentsContainerBlock).toMatch(/min-width:\s*0;/);
    expect(attachmentsContainerBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(attachmentsContainerBlock).not.toMatch(
      /overscroll-behavior-x:\s*contain;/,
    );
    expect(attachmentsContainerBlock).not.toMatch(
      /-webkit-overflow-scrolling:\s*touch;/,
    );
    expect(attachItemBlock).toMatch(/flex:\s*0 0 auto;/);
    expect(attachItemBlock).toMatch(/height:\s*64px;/);
    expect(attachImageItemBlock).toMatch(/width:\s*64px;/);
    expect(attachFileItemBlock).toMatch(/max-width:\s*min\(220px,\s*68vw\);/);
    expect(attachImageBlock).toMatch(/width:\s*64px;/);
    expect(attachImageBlock).toMatch(/height:\s*64px;/);
    expect(attachImageMaskBlock).toMatch(/opacity:\s*0;/);
    expect(attachImageMaskBlock).toMatch(/pointer-events:\s*none;/);
    expect(chatStyles).toMatch(
      /\.attach-item:hover \.attach-image-mask,\s*\.attach-image-mask:focus-within\s*\{\s*opacity:\s*1;/,
    );
    expect(deleteImageBlock).toMatch(/pointer-events:\s*auto;/);
    expect(touchAttachmentsContainerBlock).toMatch(
      /overscroll-behavior-x:\s*contain;/,
    );
    expect(touchAttachmentsContainerBlock).toMatch(
      /-webkit-overflow-scrolling:\s*touch;/,
    );
    expect(touchAttachmentsContainerBlock).toMatch(
      /scroll-snap-type:\s*x proximity;/,
    );
    expect(touchAttachItemBlock).toMatch(/scroll-snap-align:\s*start;/);
    expect(touchAttachImageMaskBlock).toMatch(/opacity:\s*1;/);
    expect(touchAttachImageMaskBlock).toMatch(/pointer-events:\s*none;/);
    expect(touchDeleteImageBlock).toMatch(/width:\s*24px;/);
    expect(touchDeleteImageBlock).toMatch(/height:\s*24px;/);
    expect(touchDeleteImageBlock).not.toMatch(/width:\s*28px;/);
    expect(touchDeleteImageBlock).not.toMatch(/height:\s*28px;/);
    expect(attachFileBlock).toMatch(/height:\s*64px;/);
    expect(attachFileBlock).toMatch(/min-width:\s*176px;/);
    expect(mobileAttachImageBlock).toMatch(/width:\s*58px;/);
    expect(mobileAttachImageBlock).toMatch(/height:\s*58px;/);
    expect(mobileAttachFileBlock).toMatch(/height:\s*58px;/);
    expect(finalMobileAttachmentsContainerBlock).toMatch(
      /padding:\s*2px 50px 4px 0;/,
    );
    expect(finalMobileAttachFileBlock).toMatch(
      /width:\s*min\(170px,\s*55vw\);/,
    );
    expect(messageActionsBlock).toMatch(/margin-top:\s*8px;/);
    expect(messageActionsBlock).toMatch(/transform:\s*translateY\(4px\);/);
    expect(messageActionsBlock).toMatch(/pointer-events:\s*none;/);
    expect(messageActionRailBlock).toMatch(/display:\s*inline-flex;/);
    expect(messageActionRailBlock).toMatch(/flex-wrap:\s*wrap;/);
    expect(messageActionRailBlock).toMatch(/border-radius:\s*999px;/);
    expect(messageActionRailBlock).toMatch(/max-width:\s*100%;/);
    expect(messageActionRailBlock).toMatch(
      /\.chat-input-action[\s\S]*width:\s*34px;/,
    );
    expect(messageActionRailBlock).toMatch(
      /\.chat-input-action[\s\S]*height:\s*34px;/,
    );
    expect(messageActionRailBlock).toMatch(
      /&:hover,[\s\S]*&:focus-visible[\s\S]*width:\s*34px;/,
    );
    expect(messageActionRailBlock).toMatch(/\.text[\s\S]*display:\s*none;/);
    expect(mobileMessageActionsBlock).toMatch(/opacity:\s*1\s*!important;/);
    expect(mobileMessageActionsBlock).toMatch(
      /pointer-events:\s*auto\s*!important;/,
    );
    expect(mobileMessageActionsBlock).toMatch(
      /transform:\s*none\s*!important;/,
    );
    expect(mobileMessageActionsBlock).toMatch(
      /transition:\s*none\s*!important;/,
    );
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
    expect(scrollToBottomBlock).toMatch(
      /background:\s*var\(--surface-elevated\);/,
    );
    expect(scrollToBottomBlock).toMatch(
      /backdrop-filter:\s*blur\(18px\) saturate\(160%\);/,
    );
    expect(scrollToBottomBlock).toMatch(
      /&:active[\s\S]*transform:\s*translateX\(-50%\) translateY\(0\) scale\(0\.96\);/,
    );
    expect(scrollToBottomBlock).toMatch(
      /&:active[\s\S]*box-shadow:[\s\S]*0 6px 18px rgba\(60,\s*64,\s*67,\s*0\.14\)/,
    );
    expect(scrollToBottomBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(darkScrollToBottomHoverBlock).toMatch(
      /border-color:\s*rgba\(138,\s*180,\s*248,\s*0\.28\);/,
    );
    expect(darkScrollToBottomHoverBlock).toMatch(
      /box-shadow:[\s\S]*0 12px 32px rgba\(0,\s*0,\s*0,\s*0\.34\)/,
    );
    expect(mobileScrollToBottomBlock).toMatch(/top:\s*-52px;/);
    expect(mobileScrollToBottomBlock).toMatch(/width:\s*40px;/);
    expect(mobileScrollToBottomBlock).toMatch(/height:\s*40px;/);
    expect(sendButtonDisabledBlock).toMatch(
      /&:disabled,[\s\S]*&:disabled:hover,[\s\S]*&:disabled:active[\s\S]*cursor:\s*default;/,
    );
    expect(sendButtonDisabledBlock).toMatch(
      /&:disabled,[\s\S]*box-shadow:\s*none;/,
    );
    expect(sendButtonDisabledBlock).toMatch(
      /&:disabled,[\s\S]*transform:\s*none;/,
    );
    expect(sendButtonDisabledBlock).toMatch(
      /&:disabled,[\s\S]*svg path[\s\S]*fill:\s*rgba\(60,\s*64,\s*67,\s*0\.42\) !important;/,
    );
    expect(darkSendButtonDisabledBlock).toMatch(
      /background:\s*rgba\(232,\s*234,\s*237,\s*0\.12\);/,
    );
    expect(darkSendButtonDisabledBlock).toMatch(
      /svg path[\s\S]*fill:\s*rgba\(232,\s*234,\s*237,\s*0\.48\) !important;/,
    );
    expect(
      chatStyles.indexOf(".chat-reading-surface > .chat-message-row-user"),
    ).toBeGreaterThan(chatStyles.indexOf(".chat-message-user"));
    expect(chatStyles).toMatch(
      /--conversation-max-width:\s*min\(920px,\s*100%\);/,
    );
    expect(chatStyles).toMatch(
      /--assistant-message-max-width:\s*min\(760px,\s*100%\);/,
    );
    expect(chatStyles).toMatch(
      /--user-message-max-width:\s*min\(660px,\s*100%\);/,
    );
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
    expect(desktopHeaderActionsBlock).toMatch(
      /max-width:\s*min\(240px,\s*28vw\);/,
    );
    expect(desktopHeaderActionBlock).toMatch(/flex:\s*0 0 auto;/);
    expect(desktopHeaderActionBlock).toMatch(
      /:global\(button\)[\s\S]*width:\s*34px;/,
    );
    expect(desktopHeaderActionBlock).toMatch(
      /:global\(button\)[\s\S]*height:\s*34px;/,
    );
    expect(desktopHeaderActionBlock).toMatch(
      /:global\(button\)[\s\S]*border-radius:\s*999px;/,
    );
    expect(desktopHeaderActionBlock).toMatch(
      /:global\(button\)[\s\S]*padding:\s*0;/,
    );
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
    expect(mobileReasoningHeadBlock).toMatch(/padding:\s*10px 12px 10px 46px;/);
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
    expect(mobileEmptyStatusRowBlock).toMatch(/width:\s*1px;/);
    expect(mobileEmptyStatusRowBlock).toMatch(/clip-path:\s*inset\(50%\);/);
    expect(tabletCollapsedStatusRowBlock).not.toMatch(/display:\s*none;/);
    expect(tabletCollapsedStatusRowBlock).toMatch(/width:\s*1px;/);
    expect(tabletCollapsedStatusRowBlock).toMatch(/clip-path:\s*inset\(50%\);/);
    expect(mobileHeaderButtonBlock).toMatch(/appearance:\s*none;/);
    expect(mobileHeaderButtonBlock).toMatch(
      /border:\s*var\(--border-in-light\);/,
    );
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
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-multimodal-section-title-color:\s*color-mix\(in srgb,\s*var\(--black\) 92%,\s*transparent\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-multimodal-section-subtitle-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 92%,\s*transparent\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-multimodal-section-divider-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 14%,\s*transparent\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-multimodal-section-primary-background:\s*color-mix\(in srgb,\s*var\(--primary\) 7%,\s*transparent\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-input-action-active-background:\s*color-mix\(in srgb,\s*var\(--primary\) 10%,\s*transparent\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-input-action-active-color:\s*var\(--primary\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-input-action-menu-radius:\s*8px;/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-input-action-menu-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-input-action-menu-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 94%,\s*transparent\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-input-action-menu-shadow-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 18%,\s*transparent\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /--chat-input-action-menu-accent-shadow-color:\s*color-mix\(in srgb,\s*var\(--primary\) 6%,\s*transparent\);/,
    );
    expect(darkActionMenuMultimodalSectionBlock).toMatch(
      /--chat-multimodal-section-title-color:\s*color-mix\(in srgb,\s*var\(--black\) 94%,\s*transparent\);/,
    );
    expect(darkActionMenuMultimodalSectionBlock).toMatch(
      /--chat-multimodal-section-subtitle-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 88%,\s*transparent\);/,
    );
    expect(darkActionMenuMultimodalSectionBlock).toMatch(
      /--chat-multimodal-section-divider-color:\s*color-mix\(in srgb,\s*var\(--black\) 9%,\s*transparent\);/,
    );
    expect(darkActionMenuMultimodalSectionBlock).toMatch(
      /--chat-multimodal-section-primary-background:\s*color-mix\(in srgb,\s*var\(--primary\) 14%,\s*var\(--surface\)\);/,
    );
    expect(darkActionMenuBlock).toMatch(
      /--chat-input-action-active-background:\s*color-mix\(in srgb,\s*var\(--primary\) 16%,\s*var\(--surface\)\);/,
    );
    expect(darkActionMenuBlock).toMatch(
      /--chat-input-action-active-color:\s*color-mix\(in srgb,\s*var\(--primary\) 78%,\s*var\(--black\)\);/,
    );
    expect(darkActionMenuBlock).toMatch(
      /--chat-input-action-menu-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 8%,\s*transparent\);/,
    );
    expect(darkActionMenuBlock).toMatch(
      /--chat-input-action-menu-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 88%,\s*transparent\);/,
    );
    expect(darkActionMenuBlock).toMatch(
      /--chat-input-action-menu-shadow-color:\s*color-mix\(in srgb,\s*var\(--gray\) 42%,\s*transparent\);/,
    );
    expect(darkActionMenuBlock).toMatch(
      /--chat-input-action-menu-accent-shadow-color:\s*color-mix\(in srgb,\s*var\(--primary\) 8%,\s*var\(--surface\)\);/,
    );
    expect(autoDarkActionMenuMultimodalSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkActionMenuMultimodalMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkActionMenuMultimodalBlock).toMatch(
      /--chat-multimodal-section-title-color:\s*color-mix\(in srgb,\s*var\(--black\) 94%,\s*transparent\);/,
    );
    expect(autoDarkActionMenuMultimodalBlock).toMatch(
      /--chat-multimodal-section-primary-background:\s*color-mix\(in srgb,\s*var\(--primary\) 14%,\s*var\(--surface\)\);/,
    );
    expect(autoDarkActionMenuSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkActionMenuMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkActionMenuBlock).toMatch(
      /--chat-input-action-active-background:\s*color-mix\(in srgb,\s*var\(--primary\) 16%,\s*var\(--surface\)\);/,
    );
    expect(autoDarkActionMenuBlock).toMatch(
      /--chat-input-action-active-color:\s*color-mix\(in srgb,\s*var\(--primary\) 78%,\s*var\(--black\)\);/,
    );
    expect(autoDarkActionMenuBlock).toMatch(
      /--chat-input-action-menu-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 8%,\s*transparent\);/,
    );
    expect(autoDarkActionMenuBlock).toMatch(
      /--chat-input-action-menu-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 88%,\s*transparent\);/,
    );
    expect(autoDarkActionMenuBlock).toMatch(
      /--chat-input-action-menu-shadow-color:\s*color-mix\(in srgb,\s*var\(--gray\) 42%,\s*transparent\);/,
    );
    expect(autoDarkActionMenuBlock).toMatch(
      /--chat-input-action-menu-accent-shadow-color:\s*color-mix\(in srgb,\s*var\(--primary\) 8%,\s*var\(--surface\)\);/,
    );
    expect(multimodalTitleBlock).toMatch(
      /color:\s*var\(--chat-multimodal-section-title-color\);/,
    );
    expect(multimodalSubtitleColorBlock).toMatch(
      /color:\s*var\(--chat-multimodal-section-subtitle-color\);/,
    );
    expect(actionMenuMultimodalDividerBlock).toMatch(
      /border-top:\s*1px solid var\(--chat-multimodal-section-divider-color\);/,
    );
    expect(actionMenuMultimodalPrimaryBlock).toMatch(
      /background:\s*var\(--chat-multimodal-section-primary-background\);/,
    );
    expect(
      [
        actionMenuMultimodalDividerBlock,
        actionMenuMultimodalPrimaryBlock,
        darkActionMenuMultimodalSectionBlock,
        autoDarkActionMenuMultimodalBlock,
      ].join("\n"),
    ).not.toMatch(
      legacyMultimodalSectionPaint,
    );
    expect(actionMenuRootDeclarations).toMatch(/box-sizing:\s*border-box;/);
    expect(actionMenuRootDeclarations).toMatch(
      /width:\s*min\(336px,\s*calc\(100vw - 32px\)\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(/padding:\s*10px;/);
    expect(actionMenuRootDeclarations).toMatch(
      /border:\s*1px solid var\(--chat-input-action-menu-border-color\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /border-radius:\s*var\(--chat-input-action-menu-radius\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /background:\s*var\(--chat-input-action-menu-background\);/,
    );
    expect(actionMenuRootDeclarations).toMatch(
      /box-shadow:\s*0 18px 48px var\(--chat-input-action-menu-shadow-color\),[\s\S]*0 0 0 1px var\(--chat-input-action-menu-accent-shadow-color\);/,
    );
    expect(actionMenuRootDeclarations).not.toContain(
      "border: var(--border-in-light)",
    );
    expect(actionMenuRootDeclarations).not.toContain("border-radius: 20px");
    expect(actionMenuRootDeclarations).not.toContain("box-shadow: var(--shadow)");
    expect(actionMenuOpenStabilizerBlock).toMatch(/display:\s*block;/);
    expect(actionMenuOpenStabilizerBlock).toMatch(/opacity:\s*1;/);
    expect(actionMenuOpenStabilizerBlock).toMatch(
      /transform:\s*translateY\(0\) scale\(1\);/,
    );
    expect(actionMenuActiveActionBlock).toMatch(
      /background:\s*var\(--chat-input-action-active-background\);/,
    );
    expect(actionMenuActiveActionBlock).toMatch(
      /color:\s*var\(--chat-input-action-active-color\);/,
    );
    expect(
      [actionMenuActiveActionBlock, darkActionMenuBlock, autoDarkActionMenuBlock].join(
        "\n",
      ),
    ).not.toMatch(legacyActionActivePaint);
    expect(mobileActionMenuBlock).toMatch(
      /bottom:\s*calc\(64px \+ env\(safe-area-inset-bottom\)\);/,
    );
    expect(mobileActionMenuBlock).toMatch(
      /width:\s*min\(320px,\s*calc\(100vw - 48px\)\);/,
    );
    expect(mobileActionMenuBlock).toMatch(
      /max-height:\s*min\(360px,\s*48vh\);/,
    );
    expect(mobileActionMenuBlock).toMatch(/padding:\s*12px;/);
    expect(mobileActionMenuBlock).toMatch(
      /border-radius:\s*var\(--chat-input-action-menu-radius\);/,
    );
    expect(mobileActionMenuBlock).not.toContain("border-radius: 22px");
    expect(onInputBlock).toMatch(/setShowChatActionMenu\(false\);/);
    expect(setImageGenerationModeBlock).toContain("isMcpEnabled()");
    expect(setImageGenerationModeBlock).toContain(
      "activateMcpClient(JIMENG_MCP_SERVER_ID)",
    );
    expect(setImageGenerationModeBlock).toContain(
      "deactivateMcpClient(JIMENG_MCP_SERVER_ID)",
    );
    expect(setImageGenerationModeBlock).toMatch(
      /chatStore\.resetMcpCache\(\);/,
    );
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
    expect(homeStyles).toContain("--mobile-sidebar-drawer-width: 304px;");
    expect(homeStyles).toContain("--mobile-sidebar-drawer-offset: -304px;");
    expect(homeStyles).toContain("@media only screen and (max-width: 358px)");
    expect(homeStyles).toContain(
      "--mobile-sidebar-drawer-width: calc(100vw - 54px);",
    );
    expect(homeStyles).toContain(
      "--mobile-sidebar-drawer-offset: calc(54px - 100vw);",
    );
    expect(homeStyles).toContain("left: var(--mobile-sidebar-drawer-offset);");
    expect(homeStyles).toContain(".sidebar-backdrop");
    expect(homeStyles).toContain("z-index: 900");
    expect(homeStyles).toContain("z-index: 1000");
    expect(compactContainerRootDeclarations).toMatch(
      /--mobile-sidebar-drawer-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 78%,\s*transparent\);/,
    );
    expect(compactContainerRootDeclarations).toMatch(
      /--mobile-sidebar-drawer-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(compactContainerRootDeclarations).toMatch(
      /--mobile-sidebar-drawer-shadow-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 24%,\s*transparent\);/,
    );
    expect(compactContainerRootDeclarations).toMatch(
      /--mobile-sidebar-drawer-inset-color:\s*color-mix\(in srgb,\s*rgb\(255,\s*255,\s*255\) 58%,\s*transparent\);/,
    );
    expect(compactContainerRootDeclarations).toMatch(
      /--mobile-sidebar-drawer-filter:\s*blur\(24px\) saturate\(185%\);/,
    );
    expect(compactContainerRootDeclarations).toMatch(
      /--mobile-sidebar-backdrop-background:\s*color-mix\(in srgb,\s*rgb\(32,\s*33,\s*36\) 28%,\s*transparent\);/,
    );
    expect(compactContainerRootDeclarations).toMatch(
      /--mobile-sidebar-backdrop-filter:\s*blur\(8px\) saturate\(135%\);/,
    );
    expect(darkCompactContainerBlock).toMatch(
      /--mobile-sidebar-drawer-background:\s*color-mix\(in srgb,\s*rgb\(22,\s*24,\s*29\) 72%,\s*transparent\);/,
    );
    expect(darkCompactContainerBlock).toMatch(
      /--mobile-sidebar-drawer-border-color:\s*color-mix\(in srgb,\s*rgb\(232,\s*234,\s*237\) 12%,\s*transparent\);/,
    );
    expect(darkCompactContainerBlock).toMatch(
      /--mobile-sidebar-drawer-shadow-color:\s*color-mix\(in srgb,\s*rgb\(0,\s*0,\s*0\) 52%,\s*transparent\);/,
    );
    expect(darkCompactContainerBlock).toMatch(
      /--mobile-sidebar-drawer-inset-color:\s*color-mix\(in srgb,\s*rgb\(255,\s*255,\s*255\) 8%,\s*transparent\);/,
    );
    expect(darkCompactContainerBlock).toMatch(
      /--mobile-sidebar-backdrop-background:\s*color-mix\(in srgb,\s*rgb\(8,\s*10,\s*14\) 52%,\s*transparent\);/,
    );
    expect(darkCompactContainerBlock).toMatch(
      /--mobile-sidebar-backdrop-filter:\s*blur\(10px\) saturate\(145%\);/,
    );
    expect(autoDarkCompactContainerSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkCompactContainerMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkCompactContainerBlock).toMatch(
      /--mobile-sidebar-drawer-background:\s*color-mix\(in srgb,\s*rgb\(22,\s*24,\s*29\) 72%,\s*transparent\);/,
    );
    expect(autoDarkCompactContainerBlock).toMatch(
      /--mobile-sidebar-drawer-border-color:\s*color-mix\(in srgb,\s*rgb\(232,\s*234,\s*237\) 12%,\s*transparent\);/,
    );
    expect(autoDarkCompactContainerBlock).toMatch(
      /--mobile-sidebar-backdrop-background:\s*color-mix\(in srgb,\s*rgb\(8,\s*10,\s*14\) 52%,\s*transparent\);/,
    );
    expect(autoDarkCompactContainerBlock).toMatch(
      /--mobile-sidebar-backdrop-filter:\s*blur\(10px\) saturate\(145%\);/,
    );
    expect(compactContainerSidebarBlock).toMatch(
      /background:\s*var\(--mobile-sidebar-drawer-background\);/,
    );
    expect(compactContainerSidebarBlock).not.toContain("radial-gradient");
    expect(compactContainerSidebarBlock).not.toContain("linear-gradient");
    expect(compactContainerSidebarBlock).not.toContain(
      "background-blend-mode",
    );
    expect(compactContainerSidebarBlock).toMatch(
      /backdrop-filter:\s*var\(--mobile-sidebar-drawer-filter\);/,
    );
    expect(compactContainerSidebarBlock).toMatch(
      /-webkit-backdrop-filter:\s*var\(--mobile-sidebar-drawer-filter\);/,
    );
    expect(compactContainerSidebarBlock).toMatch(
      /border-right:\s*1px solid var\(--mobile-sidebar-drawer-border-color\);/,
    );
    expect(compactContainerSidebarBlock).toMatch(
      /box-shadow:\s*0 28px 80px var\(--mobile-sidebar-drawer-shadow-color\),[\s\S]*inset -1px 0 0 var\(--mobile-sidebar-drawer-inset-color\);/,
    );
    expect(homeStyles).not.toContain("0 20px 64px rgba(32, 33, 36, 0.22)");
    expect(compactContainerSidebarBlock).not.toContain(
      "background: rgba(249, 251, 253, 0.78)",
    );
    expect(compactContainerSidebarBlock).not.toContain(
      "border-right: var(--border-in-light)",
    );
    expect(homeMobileCompactSidebarBlock).not.toMatch(/background(?:-color)?:/);
    expect(homeMobileCompactSidebarBlock).not.toMatch(/backdrop-filter:/);
    expect(homeMobileCompactSidebarBlock).not.toMatch(/border-right:/);
    expect(homeMobileCompactSidebarBlock).toMatch(
      /box-shadow:\s*0 28px 80px var\(--mobile-sidebar-drawer-shadow-color\),[\s\S]*inset -1px 0 0 var\(--mobile-sidebar-drawer-inset-color\);/,
    );
    expect(compactSidebarBackdropBlock).toMatch(
      /backdrop-filter:\s*var\(--mobile-sidebar-backdrop-filter\);/,
    );
    expect(compactSidebarBackdropBlock).toMatch(
      /-webkit-backdrop-filter:\s*var\(--mobile-sidebar-backdrop-filter\);/,
    );
    expect(compactSidebarBackdropBlock).toMatch(
      /background:\s*var\(--mobile-sidebar-backdrop-background\);/,
    );
    expect(compactSidebarBackdropBlock).not.toContain("linear-gradient");
    expect(compactSidebarBackdropBlock).not.toContain(
      "background: rgba(32, 33, 36, 0.28)",
    );
    expect(homeStyles).toMatch(/\.sidebar-show\s*\{\s*left:\s*0;/);
    expect(homeStyles).toMatch(/\.sidebar\.sidebar-show\s*\{\s*left:\s*0;/);
    expect(homeStyles).toContain("outline: var(--focus-ring)");
    expect(homeStyles).toContain("box-shadow: var(--focus-ring-shadow)");
    expect(homeStyles).toContain(".sidebar-primary-nav");
    expect(homeStyles).toContain(".sidebar-content-nav");
    expect(homeStyles).toContain(".sidebar-content-card");
    expect(sidebarBlock).toMatch(/scrollbar-width:\s*thin;/);
    expect(sidebarBlock).toMatch(/scrollbar-color:\s*transparent transparent;/);
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
    expect(chatItemDeleteBlock).toMatch(
      /&:focus-visible[\s\S]*pointer-events:\s*auto;/,
    );
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

  test("keeps shared IconButton states aligned with Gemini utility controls", () => {
    const button = read("app/components/button.tsx");
    const buttonStyles = read("app/components/button.module.scss");
    const iconButtonBlock = readCssBlock(buttonStyles, ".icon-button");
    const iconButtonRootBlock = readRootDeclarations(iconButtonBlock);
    const primaryBlock = readCssBlock(iconButtonBlock, "&.primary");
    const dangerBlock = readCssBlock(iconButtonBlock, "&.danger");
    const dangerHoverBlock = readCssBlock(dangerBlock, "&:hover");
    const rootHoverIndex = iconButtonBlock.indexOf("\n  &:hover");
    const hoverBlock = readCssBlock(
      iconButtonBlock.slice(rootHoverIndex),
      "&:hover",
    );
    const focusBlock = readCssBlock(iconButtonBlock, "&:focus-visible");
    const borderBlock = readCssBlock(buttonStyles, ".border");
    const darkIconButtonBlock = readCssBlock(
      buttonStyles,
      ":global(.dark) .icon-button",
    );
    const autoDarkIconButtonSelector =
      ":global(body:not(.light)) .icon-button";
    const autoDarkIconButtonSelectorIndex = buttonStyles.indexOf(
      autoDarkIconButtonSelector,
    );
    const autoDarkIconButtonMediaIndex = buttonStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkIconButtonSelectorIndex,
    );
    const autoDarkIconButtonBlock = readCssBlock(
      buttonStyles.slice(autoDarkIconButtonMediaIndex),
      autoDarkIconButtonSelector,
    );
    const sharedButtonPaintScope = [
      iconButtonRootBlock,
      primaryBlock,
      dangerBlock,
      dangerHoverBlock,
      hoverBlock,
      focusBlock,
      borderBlock,
      darkIconButtonBlock,
      autoDarkIconButtonBlock,
    ].join("\n");

    expect(button).toContain('export type ButtonType = "primary" | "danger" | null;');
    expect(button).toMatch(
      /className=\{clsx\([\s\S]*"clickable"[\s\S]*styles\["icon-button"\][\s\S]*\[styles\.border\]: props\.bordered,[\s\S]*\[styles\.shadow\]: props\.shadow,[\s\S]*styles\[props\.type \?\? ""\][\s\S]*props\.className[\s\S]*\)\}/,
    );
    expect(button).toContain("onClick={props.onClick}");
    expect(button).toContain("title={props.title}");
    expect(button).toContain("disabled={props.disabled}");
    expect(button).toContain("tabIndex={props.tabIndex}");
    expect(button).toContain("autoFocus={props.autoFocus}");
    expect(button).toContain("style={props.style}");
    expect(button).toContain("aria-label={props.aria}");
    expect(button).toContain("aria-controls={props.ariaControls}");
    expect(button).toContain("aria-expanded={props.ariaExpanded}");
    expect(button).toContain("data-mobile-sidebar-trigger=");
    expect(button).toMatch(
      /props\.icon && \([\s\S]*className=\{clsx\(styles\["icon-button-icon"\][\s\S]*"no-dark": props\.type === "primary"[\s\S]*\)\}[\s\S]*\{props\.icon\}[\s\S]*\)/,
    );
    expect(button).toMatch(
      /props\.text && \([\s\S]*aria-label=\{props\.text \|\| props\.title\}[\s\S]*className=\{styles\["icon-button-text"\]\}[\s\S]*\{props\.text\}[\s\S]*\)/,
    );
    expect(rootHoverIndex).toBeGreaterThan(-1);

    expect(iconButtonRootBlock).toMatch(
      /--icon-button-color:\s*var\(--black\);/,
    );
    expect(iconButtonRootBlock).toMatch(
      /--icon-button-hover-background:\s*var\(--hover-color\);/,
    );
    expect(iconButtonRootBlock).toMatch(
      /--icon-button-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 24%,\s*transparent\s*\);/,
    );
    expect(iconButtonRootBlock).toMatch(
      /--icon-button-primary-background:\s*var\(--primary\);/,
    );
    expect(iconButtonRootBlock).toMatch(
      /--icon-button-primary-color:\s*rgb\(255,\s*255,\s*255\);/,
    );
    expect(iconButtonRootBlock).toMatch(
      /--icon-button-danger-ink:\s*rgb\(217,\s*48,\s*37\);/,
    );
    expect(iconButtonRootBlock).toMatch(
      /--icon-button-danger-color:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 82%,\s*var\(--black\)\s*\);/,
    );
    expect(iconButtonRootBlock).toMatch(
      /--icon-button-danger-background:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 8%,\s*transparent\s*\);/,
    );
    expect(iconButtonRootBlock).toMatch(
      /--icon-button-danger-border-color:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 36%,\s*transparent\s*\);/,
    );
    expect(iconButtonRootBlock).toMatch(
      /--icon-button-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 10%,\s*transparent\s*\);/,
    );
    expect(iconButtonRootBlock).toMatch(/--icon-button-radius:\s*8px;/);
    expect(darkIconButtonBlock).toMatch(
      /--icon-button-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 30%,\s*transparent\s*\);/,
    );
    expect(darkIconButtonBlock).toMatch(
      /--icon-button-danger-background:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 14%,\s*transparent\s*\);/,
    );
    expect(darkIconButtonBlock).toMatch(
      /--icon-button-danger-color:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 58%,\s*var\(--black\)\s*\);/,
    );
    expect(darkIconButtonBlock).toMatch(
      /--icon-button-danger-border-color:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 44%,\s*transparent\s*\);/,
    );
    expect(darkIconButtonBlock).toMatch(
      /--icon-button-danger-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 18%,\s*transparent\s*\);/,
    );
    expect(darkIconButtonBlock).toMatch(
      /--icon-button-danger-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 60%,\s*transparent\s*\);/,
    );
    expect(darkIconButtonBlock).toMatch(
      /--icon-button-border-color:\s*color-mix\(\s*in srgb,\s*var\(--white\) 12%,\s*transparent\s*\);/,
    );
    expect(autoDarkIconButtonSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkIconButtonMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkIconButtonBlock).toMatch(
      /--icon-button-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 30%,\s*transparent\s*\);/,
    );
    expect(autoDarkIconButtonBlock).toMatch(
      /--icon-button-danger-color:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 58%,\s*var\(--black\)\s*\);/,
    );
    expect(autoDarkIconButtonBlock).toMatch(
      /--icon-button-danger-background:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 14%,\s*transparent\s*\);/,
    );
    expect(autoDarkIconButtonBlock).toMatch(
      /--icon-button-danger-border-color:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 44%,\s*transparent\s*\);/,
    );
    expect(autoDarkIconButtonBlock).toMatch(
      /--icon-button-danger-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 18%,\s*transparent\s*\);/,
    );
    expect(autoDarkIconButtonBlock).toMatch(
      /--icon-button-danger-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--icon-button-danger-ink\) 60%,\s*transparent\s*\);/,
    );
    expect(autoDarkIconButtonBlock).toMatch(
      /--icon-button-border-color:\s*color-mix\(\s*in srgb,\s*var\(--white\) 12%,\s*transparent\s*\);/,
    );

    expect(iconButtonRootBlock).toMatch(/color:\s*var\(--icon-button-color\);/);
    expect(iconButtonRootBlock).toMatch(
      /border-radius:\s*var\(--icon-button-radius\);/,
    );
    expect(primaryBlock).toMatch(
      /background-color:\s*var\(--icon-button-primary-background\);/,
    );
    expect(primaryBlock).toMatch(/color:\s*var\(--icon-button-primary-color\);/);
    expect(primaryBlock).toMatch(
      /fill:\s*var\(--icon-button-primary-color\) !important;/,
    );
    expect(dangerBlock).toMatch(/color:\s*var\(--icon-button-danger-color\);/);
    expect(dangerBlock).toMatch(
      /border-color:\s*var\(--icon-button-danger-border-color\);/,
    );
    expect(dangerBlock).toMatch(
      /background-color:\s*var\(--icon-button-danger-background\);/,
    );
    expect(dangerBlock).toMatch(
      /fill:\s*var\(--icon-button-danger-icon-color\) !important;/,
    );
    expect(dangerHoverBlock).toMatch(
      /border-color:\s*var\(--icon-button-danger-hover-border-color\);/,
    );
    expect(dangerHoverBlock).toMatch(
      /background-color:\s*var\(--icon-button-danger-hover-background\);/,
    );
    expect(hoverBlock).toMatch(
      /background-color:\s*var\(--icon-button-hover-background\);/,
    );
    expect(hoverBlock).toMatch(
      /border-color:\s*var\(--icon-button-hover-border-color\);/,
    );
    expect(focusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(focusBlock).toMatch(
      /background-color:\s*var\(--icon-button-hover-background\);/,
    );
    expect(focusBlock).toMatch(
      /border-color:\s*var\(--icon-button-hover-border-color\);/,
    );
    expect(focusBlock).toMatch(/box-shadow:\s*var\(--focus-ring-shadow\);/);
    expect(borderBlock).toMatch(
      /border:\s*1px solid var\(--icon-button-border-color\);/,
    );
    expect(sharedButtonPaintScope).not.toMatch(/rgba\(\$color:\s*red/);
    expect(sharedButtonPaintScope).not.toContain("border-color: red");
    expect(sharedButtonPaintScope).not.toContain("fill: red !important");
    expect(sharedButtonPaintScope).not.toContain("rgba(49, 94, 248, 0.24)");
    expect(sharedButtonPaintScope).not.toContain("color: white");
    expect(sharedButtonPaintScope).not.toContain("fill: white !important");
    expect(sharedButtonPaintScope).not.toContain("border-radius: 12px");
    expect(sharedButtonPaintScope).not.toContain("border: var(--border-in-light)");
  });

  test("keeps MCP market status controls aligned with Gemini utility tones", () => {
    const mcpMarket = read("app/components/mcp-market.tsx");
    const serverList = read("app/components/mcp-market/server-list.tsx");
    const configForm = read("app/components/mcp-market/config-form.tsx");
    const mcpMarketStyles = read("app/components/mcp-market.module.scss");
    const mcpMarketPageBlock = readCssBlock(
      mcpMarketStyles,
      ".mcp-market-page",
    );
    const mcpMarketRootBlock = readRootDeclarations(mcpMarketPageBlock);
    const darkMcpMarketBlock = readCssBlock(
      mcpMarketStyles,
      ":global(.dark) .mcp-market-page",
    );
    const darkMcpMarketStatusBlock = readCssBlock(
      mcpMarketStyles,
      ":global(.dark) .mcp-market-page .mcp-market-page-body .mcp-market-item\n  .operation-status,\n:global(.dark) .mcp-market-page .mcp-market-page-body .mcp-market-item\n  .mcp-market-header\n  .mcp-market-name\n  .server-status",
    );
    const autoDarkMcpMarketSelector =
      ":global(body:not(.light)) .mcp-market-page";
    const autoDarkMcpMarketStatusSelector =
      ":global(body:not(.light)) .mcp-market-page .mcp-market-page-body\n    .mcp-market-item\n    .operation-status,\n  :global(body:not(.light)) .mcp-market-page .mcp-market-page-body\n    .mcp-market-item\n    .mcp-market-header\n    .mcp-market-name\n    .server-status";
    const autoDarkMcpMarketSelectorIndex = mcpMarketStyles.indexOf(
      autoDarkMcpMarketSelector,
    );
    const autoDarkMcpMarketMediaIndex = mcpMarketStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkMcpMarketSelectorIndex,
    );
    const autoDarkMcpMarketBlock = readCssBlock(
      mcpMarketStyles.slice(autoDarkMcpMarketMediaIndex),
      autoDarkMcpMarketSelector,
    );
    const autoDarkMcpMarketStatusBlock = readCssBlock(
      mcpMarketStyles.slice(autoDarkMcpMarketMediaIndex),
      autoDarkMcpMarketStatusSelector,
    );
    const operationStatusBlock = readCssBlock(
      mcpMarketStyles,
      ".operation-status",
    );
    const operationStoppingBlock = readCssBlock(
      operationStatusBlock,
      '&[data-status="stopping"]',
    );
    const operationStartingBlock = readCssBlock(
      operationStatusBlock,
      '&[data-status="starting"]',
    );
    const operationErrorBlock = readCssBlock(
      operationStatusBlock,
      '&[data-status="error"]',
    );
    const serverStatusBlock = readCssBlock(mcpMarketStyles, ".server-status");
    const serverErrorBlock = readCssBlock(serverStatusBlock, "&.error");
    const serverStoppedBlock = readCssBlock(serverStatusBlock, "&.stopped");
    const serverInitializingBlock = readCssBlock(
      serverStatusBlock,
      "&.initializing",
    );
    const addPathButtonBlocks = Array.from(
      mcpMarketStyles.matchAll(
        /:global\(\.icon-button\.add-path-button\)\s*\{[\s\S]*?\n\s{6}\}/g,
      ),
      (match) => match[0],
    );
    const mcpMarketStatusPaintScope = [
      mcpMarketRootBlock,
      darkMcpMarketBlock,
      darkMcpMarketStatusBlock,
      autoDarkMcpMarketBlock,
      autoDarkMcpMarketStatusBlock,
      operationStatusBlock,
      operationStoppingBlock,
      operationStartingBlock,
      operationErrorBlock,
      serverStatusBlock,
      serverErrorBlock,
      serverStoppedBlock,
      serverInitializingBlock,
      ...addPathButtonBlocks,
    ].join("\n");

    expect(mcpMarket).toContain("useMcpMarketController");
    expect(mcpMarket).toContain("onClick={restartAllServers}");
    expect(mcpMarket).toContain("onClick={saveServerConfig}");
    expect(serverList).toContain("getOperationStatusType(loadingState)");
    expect(serverList).toContain("onAddServer(server)");
    expect(serverList).toContain("onConfigureServer(server.id)");
    expect(serverList).toContain("onPauseServer(server.id)");
    expect(serverList).toContain("onRestartServer(server.id)");
    expect(serverList).toContain("onViewTools(server.id)");
    expect(configForm).toContain("onUserConfigChange");
    expect(configForm).toContain("removeRowId(key, row.index)");

    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-status-running-ink:\s*rgb\(22,\s*163,\s*74\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-status-starting-ink:\s*rgb\(34,\s*197,\s*94\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-status-stopped-ink:\s*rgb\(107,\s*114,\s*128\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-status-error-ink:\s*rgb\(239,\s*68,\s*68\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-status-initializing-ink:\s*rgb\(245,\s*158,\s*11\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-status-ink:\s*var\(--mcp-market-status-running-ink\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-add-path-button-color:\s*rgb\(255,\s*255,\s*255\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-add-path-button-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 86%,\s*var\(--black\)\s*\);/,
    );
    expect(darkMcpMarketStatusBlock).toMatch(
      /--mcp-market-status-background:\s*color-mix\(\s*in srgb,\s*var\(--mcp-market-status-ink\) 18%,\s*transparent\s*\);/,
    );
    expect(darkMcpMarketStatusBlock).toMatch(
      /--mcp-market-status-color:\s*color-mix\(\s*in srgb,\s*var\(--mcp-market-status-ink\) 58%,\s*var\(--black\)\s*\);/,
    );
    expect(autoDarkMcpMarketSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkMcpMarketMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkMcpMarketStatusBlock).toMatch(
      /--mcp-market-status-background:\s*color-mix\(\s*in srgb,\s*var\(--mcp-market-status-ink\) 18%,\s*transparent\s*\);/,
    );
    expect(autoDarkMcpMarketStatusBlock).toMatch(
      /--mcp-market-status-color:\s*color-mix\(\s*in srgb,\s*var\(--mcp-market-status-ink\) 58%,\s*var\(--black\)\s*\);/,
    );

    expect(operationStatusBlock).toMatch(
      /--mcp-market-status-ink:\s*var\(--mcp-market-status-running-ink\);/,
    );
    expect(operationStatusBlock).toMatch(
      /--mcp-market-status-background:\s*color-mix\(\s*in srgb,\s*var\(--mcp-market-status-ink\) 12%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(operationStatusBlock).toMatch(
      /--mcp-market-status-border-color:\s*color-mix\(\s*in srgb,\s*var\(--mcp-market-status-ink\) 34%,\s*transparent\s*\);/,
    );
    expect(operationStatusBlock).toMatch(
      /--mcp-market-status-color:\s*color-mix\(\s*in srgb,\s*var\(--mcp-market-status-ink\) 78%,\s*var\(--black\)\s*\);/,
    );
    expect(operationStatusBlock).toMatch(
      /background-color:\s*var\(--mcp-market-status-background\);/,
    );
    expect(operationStatusBlock).toMatch(
      /border:\s*1px solid var\(--mcp-market-status-border-color\);/,
    );
    expect(operationStatusBlock).toMatch(
      /color:\s*var\(--mcp-market-status-color\);/,
    );
    expect(operationStatusBlock).toMatch(/border-radius:\s*999px;/);
    expect(operationStoppingBlock).toMatch(
      /--mcp-market-status-ink:\s*var\(--mcp-market-status-stopped-ink\);/,
    );
    expect(operationStartingBlock).toMatch(
      /--mcp-market-status-ink:\s*var\(--mcp-market-status-starting-ink\);/,
    );
    expect(operationErrorBlock).toMatch(
      /--mcp-market-status-ink:\s*var\(--mcp-market-status-error-ink\);/,
    );
    expect(serverStatusBlock).toMatch(
      /--mcp-market-status-ink:\s*var\(--mcp-market-status-running-ink\);/,
    );
    expect(serverStatusBlock).toMatch(
      /--mcp-market-status-background:\s*color-mix\(\s*in srgb,\s*var\(--mcp-market-status-ink\) 12%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(serverStatusBlock).toMatch(
      /--mcp-market-status-border-color:\s*color-mix\(\s*in srgb,\s*var\(--mcp-market-status-ink\) 34%,\s*transparent\s*\);/,
    );
    expect(serverStatusBlock).toMatch(
      /--mcp-market-status-color:\s*color-mix\(\s*in srgb,\s*var\(--mcp-market-status-ink\) 78%,\s*var\(--black\)\s*\);/,
    );
    expect(serverStatusBlock).toMatch(
      /background-color:\s*var\(--mcp-market-status-background\);/,
    );
    expect(serverStatusBlock).toMatch(
      /border:\s*1px solid var\(--mcp-market-status-border-color\);/,
    );
    expect(serverStatusBlock).toMatch(
      /color:\s*var\(--mcp-market-status-color\);/,
    );
    expect(serverErrorBlock).toMatch(
      /--mcp-market-status-ink:\s*var\(--mcp-market-status-error-ink\);/,
    );
    expect(serverStoppedBlock).toMatch(
      /--mcp-market-status-ink:\s*var\(--mcp-market-status-stopped-ink\);/,
    );
    expect(serverInitializingBlock).toMatch(
      /--mcp-market-status-ink:\s*var\(--mcp-market-status-initializing-ink\);/,
    );
    expect(addPathButtonBlocks).toHaveLength(2);
    addPathButtonBlocks.forEach((block) => {
      expect(block).toMatch(
        /background-color:\s*var\(--mcp-market-add-path-button-background\);/,
      );
      expect(block).toMatch(/color:\s*var\(--mcp-market-add-path-button-color\);/);
      expect(block).toMatch(
        /background-color:\s*var\(--mcp-market-add-path-button-hover-background\);/,
      );
    });
    expect(mcpMarketStatusPaintScope).not.toMatch(
      /#(?:16a34a|22c55e|9ca3af|4ade80|f87171|ef4444|6b7280|f59e0b)\b/i,
    );
    expect(mcpMarketStatusPaintScope).not.toContain("color: #fff");
    expect(mcpMarketStatusPaintScope).not.toContain("color: white");
    expect(mcpMarketStatusPaintScope).not.toContain("var(--primary-dark)");
  });

  test("keeps MCP market form controls aligned with Gemini utility surfaces", () => {
    const mcpMarket = read("app/components/mcp-market.tsx");
    const configForm = read("app/components/mcp-market/config-form.tsx");
    const mcpMarketStyles = read("app/components/mcp-market.module.scss");
    const mcpMarketPageBlock = readCssBlock(
      mcpMarketStyles,
      ".mcp-market-page",
    );
    const mcpMarketRootBlock = readRootDeclarations(mcpMarketPageBlock);
    const darkMcpMarketBlock = readCssBlock(
      mcpMarketStyles,
      ":global(.dark) .mcp-market-page",
    );
    const autoDarkMcpMarketSelector =
      ":global(body:not(.light)) .mcp-market-page";
    const autoDarkMcpMarketSelectorIndex = mcpMarketStyles.indexOf(
      autoDarkMcpMarketSelector,
    );
    const autoDarkMcpMarketMediaIndex = mcpMarketStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkMcpMarketSelectorIndex,
    );
    const autoDarkMcpMarketBlock = readCssBlock(
      mcpMarketStyles.slice(autoDarkMcpMarketMediaIndex),
      autoDarkMcpMarketSelector,
    );
    const arrayInputBlock = readCssBlock(mcpMarketStyles, ".array-input");
    const arrayInputItemBlock = readCssBlock(
      arrayInputBlock,
      ".array-input-item",
    );
    const arrayInputTextBlock = readCssBlock(arrayInputItemBlock, "input");
    const arrayInputHoverBlock = readCssBlock(arrayInputTextBlock, "&:hover");
    const arrayInputFocusBlock = readCssBlock(arrayInputTextBlock, "&:focus");
    const arrayInputPlaceholderBlock = readCssBlock(
      arrayInputTextBlock,
      "&::placeholder",
    );
    const arrayInputAddPathButtonBlock = readCssBlock(
      arrayInputBlock,
      ":global(.icon-button.add-path-button)",
    );
    const configSectionBlock = readCssBlock(
      mcpMarketStyles,
      ".config-section",
    );
    const configHeaderBlock = readCssBlock(
      configSectionBlock,
      ".config-header",
    );
    const configDescriptionBlock = readCssBlock(
      configHeaderBlock,
      ".config-description",
    );
    const configArrayInputBlock = readCssBlock(
      configSectionBlock,
      ".array-input",
    );
    const configArrayInputItemBlock = readCssBlock(
      configArrayInputBlock,
      ".array-input-item",
    );
    const configArrayInputTextBlock = readCssBlock(
      configArrayInputItemBlock,
      "input",
    );
    const configArrayInputHoverBlock = readCssBlock(
      configArrayInputTextBlock,
      "&:hover",
    );
    const configArrayInputFocusBlock = readCssBlock(
      configArrayInputTextBlock,
      "&:focus",
    );
    const configArrayInputPlaceholderBlock = readCssBlock(
      configArrayInputTextBlock,
      "&::placeholder",
    );
    const configIconButtonBlock = readCssBlock(
      configArrayInputItemBlock,
      ":global(.icon-button)",
    );
    const configIconButtonHoverBlock = readCssBlock(
      configIconButtonBlock,
      "&:hover",
    );
    const configAddPathButtonBlock = readCssBlock(
      configArrayInputBlock,
      ":global(.icon-button.add-path-button)",
    );
    const pathListBlock = readCssBlock(mcpMarketStyles, ".path-list");
    const pathItemBlock = readCssBlock(pathListBlock, ".path-item");
    const pathInputBlock = readCssBlock(pathItemBlock, "input");
    const pathInputHoverBlock = readCssBlock(pathInputBlock, "&:hover");
    const pathInputFocusBlock = readCssBlock(pathInputBlock, "&:focus");
    const browseButtonBlock = readCssBlock(pathItemBlock, ".browse-button");
    const browseButtonHoverBlock = readCssBlock(browseButtonBlock, "&:hover");
    const deleteButtonBlock = readCssBlock(pathItemBlock, ".delete-button");
    const deleteButtonHoverBlock = readCssBlock(deleteButtonBlock, "&:hover");
    const addButtonBlock = readCssBlock(pathListBlock, ".add-button");
    const addButtonHoverBlock = readCssBlock(addButtonBlock, "&:hover");
    const inputItemBlock = readCssBlock(mcpMarketStyles, ".input-item");
    const inputItemTextBlock = readCssBlock(inputItemBlock, "input");
    const inputItemHoverBlock = readCssBlock(inputItemTextBlock, "&:hover");
    const inputItemFocusBlock = readCssBlock(inputItemTextBlock, "&:focus");
    const inputItemPlaceholderBlock = readCssBlock(
      inputItemTextBlock,
      "&::placeholder",
    );
    const toolsListBlock = readCssBlock(mcpMarketStyles, ".tools-list");
    const toolItemBlock = readCssBlock(toolsListBlock, ".tool-item");
    const toolDescriptionBlock = readCssBlock(
      toolItemBlock,
      ".tool-description",
    );
    const globalMcpMarketBlock = readCssBlock(mcpMarketStyles, ":global");
    const globalListItemBlock = readCssBlock(globalMcpMarketBlock, ".list-item");
    const listSubTitleBlock = readCssBlock(
      mcpMarketStyles,
      ".list-sub-title",
    );
    const mcpMarketFormPaintScope = [
      mcpMarketRootBlock,
      darkMcpMarketBlock,
      autoDarkMcpMarketBlock,
      arrayInputBlock,
      arrayInputTextBlock,
      arrayInputHoverBlock,
      arrayInputFocusBlock,
      arrayInputPlaceholderBlock,
      arrayInputAddPathButtonBlock,
      configDescriptionBlock,
      configArrayInputBlock,
      configArrayInputTextBlock,
      configArrayInputHoverBlock,
      configArrayInputFocusBlock,
      configArrayInputPlaceholderBlock,
      configIconButtonBlock,
      configIconButtonHoverBlock,
      configAddPathButtonBlock,
      pathInputBlock,
      pathInputHoverBlock,
      pathInputFocusBlock,
      browseButtonBlock,
      browseButtonHoverBlock,
      deleteButtonBlock,
      deleteButtonHoverBlock,
      addButtonBlock,
      addButtonHoverBlock,
      inputItemTextBlock,
      inputItemHoverBlock,
      inputItemFocusBlock,
      inputItemPlaceholderBlock,
      globalListItemBlock,
      toolDescriptionBlock,
      listSubTitleBlock,
    ].join("\n");

    expect(mcpMarket).toContain("onClick={saveServerConfig}");
    expect(mcpMarket).toContain("onClose={() => !state.isLoading && closeConfig()}");
    expect(configForm).toContain("onUserConfigChange");
    expect(configForm).toContain("removeRowId(key, row.index)");
    expect(configForm).toContain("function createRowId()");
    expect(configForm).toContain("IconButton");
    expect(configForm).toContain("onChange={(event) => {");

    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-surface:\s*var\(--surface-elevated\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-soft-surface:\s*color-mix\(\s*in srgb,\s*var\(--black\) 4%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-hover-surface:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 6%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 14%,\s*transparent\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 22%,\s*transparent\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-placeholder-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 58%,\s*transparent\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-description-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 88%,\s*transparent\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-danger-color:\s*color-mix\(\s*in srgb,\s*rgb\(217,\s*48,\s*37\) 82%,\s*var\(--black\)\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-danger-hover-border-color:\s*color-mix\(\s*in srgb,\s*rgb\(217,\s*48,\s*37\) 36%,\s*transparent\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-focus-shadow:\s*0 0 0 2px\s*color-mix\(\s*in srgb,\s*var\(--primary\) 12%,\s*transparent\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-form-add-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 8%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(darkMcpMarketBlock).toMatch(
      /--mcp-market-form-hover-surface:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 12%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(darkMcpMarketBlock).toMatch(
      /--mcp-market-form-description-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 62%,\s*transparent\s*\);/,
    );
    expect(darkMcpMarketBlock).toMatch(
      /--mcp-market-form-danger-color:\s*color-mix\(\s*in srgb,\s*rgb\(248,\s*113,\s*113\) 72%,\s*var\(--black\)\s*\);/,
    );
    expect(autoDarkMcpMarketSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkMcpMarketMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkMcpMarketBlock).toMatch(
      /--mcp-market-form-hover-surface:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 12%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(autoDarkMcpMarketBlock).toMatch(
      /--mcp-market-form-description-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 62%,\s*transparent\s*\);/,
    );

    [arrayInputBlock, configArrayInputBlock].forEach((block) => {
      expect(block).toMatch(
        /border:\s*1px solid var\(--mcp-market-form-border-color\);/,
      );
      expect(block).toMatch(
        /background-color:\s*var\(--mcp-market-form-surface\);/,
      );
      expect(block).toMatch(/border-radius:\s*8px;/);
    });

    [arrayInputTextBlock, configArrayInputTextBlock].forEach((block) => {
      expect(block).toMatch(
        /background-color:\s*var\(--mcp-market-form-soft-surface\);/,
      );
      expect(block).toMatch(
        /border:\s*1px solid var\(--mcp-market-form-border-color\);/,
      );
      expect(block).toMatch(/border-radius:\s*8px;/);
    });

    [arrayInputHoverBlock, configArrayInputHoverBlock].forEach((block) => {
      expect(block).toMatch(
        /background-color:\s*var\(--mcp-market-form-hover-surface\);/,
      );
      expect(block).toMatch(
        /border-color:\s*var\(--mcp-market-form-hover-border-color\);/,
      );
    });

    [arrayInputFocusBlock, configArrayInputFocusBlock].forEach((block) => {
      expect(block).toMatch(
        /background-color:\s*var\(--mcp-market-form-surface\);/,
      );
      expect(block).toMatch(/border-color:\s*var\(--primary\);/);
      expect(block).toMatch(
        /box-shadow:\s*var\(--mcp-market-form-focus-shadow\);/,
      );
    });

    [
      arrayInputPlaceholderBlock,
      configArrayInputPlaceholderBlock,
      inputItemPlaceholderBlock,
    ].forEach((block) => {
      expect(block).toMatch(
        /color:\s*var\(--mcp-market-form-placeholder-color\)/,
      );
    });

    [pathInputBlock, inputItemTextBlock].forEach((block) => {
      expect(block).toMatch(
        /border:\s*1px solid var\(--mcp-market-form-border-color\);/,
      );
      expect(block).toMatch(/border-radius:\s*8px;/);
      expect(block).toMatch(
        /background-color:\s*var\(--mcp-market-form-surface\);/,
      );
      expect(block).toMatch(/color:\s*var\(--black\);/);
    });

    [pathInputHoverBlock, inputItemHoverBlock].forEach((block) => {
      expect(block).toMatch(
        /border-color:\s*var\(--mcp-market-form-hover-border-color\);/,
      );
    });

    [pathInputFocusBlock, inputItemFocusBlock].forEach((block) => {
      expect(block).toMatch(/border-color:\s*var\(--primary\);/);
      expect(block).toMatch(
        /box-shadow:\s*var\(--mcp-market-form-focus-shadow\);/,
      );
    });

    [browseButtonHoverBlock, addButtonHoverBlock].forEach((block) => {
      expect(block).toMatch(
        /border-color:\s*var\(--mcp-market-form-hover-border-color\);/,
      );
      expect(block).toMatch(
        /background-color:\s*var\(--mcp-market-form-add-hover-background\);/,
      );
    });
    expect(deleteButtonHoverBlock).toMatch(
      /border-color:\s*var\(--mcp-market-form-danger-hover-border-color\);/,
    );
    expect(deleteButtonHoverBlock).toMatch(
      /color:\s*var\(--mcp-market-form-danger-color\);/,
    );
    expect(configIconButtonBlock).toMatch(
      /border:\s*1px solid var\(--mcp-market-form-border-color\);/,
    );
    expect(configIconButtonBlock).toMatch(/border-radius:\s*8px;/);
    expect(configIconButtonHoverBlock).toMatch(
      /background-color:\s*var\(--mcp-market-form-hover-surface\);/,
    );
    expect(configIconButtonHoverBlock).toMatch(
      /border-color:\s*var\(--mcp-market-form-hover-border-color\);/,
    );
    [configDescriptionBlock, toolDescriptionBlock, listSubTitleBlock].forEach(
      (block) => {
        expect(block).toMatch(
          /color:\s*var\(--mcp-market-form-description-color\);/,
        );
      },
    );
    [arrayInputAddPathButtonBlock, configAddPathButtonBlock].forEach((block) => {
      expect(block).toMatch(/border-radius:\s*8px;/);
      expect(block).toMatch(
        /background-color:\s*var\(--mcp-market-add-path-button-background\);/,
      );
      expect(block).toMatch(/color:\s*var\(--mcp-market-add-path-button-color\);/);
    });
    [browseButtonBlock, deleteButtonBlock, addButtonBlock].forEach((block) => {
      expect(block).toMatch(
        /border:\s*1px solid var\(--mcp-market-form-border-color\);/,
      );
      expect(block).toMatch(/border-radius:\s*8px;/);
    });
    expect(globalListItemBlock).toMatch(/border-radius:\s*8px;/);
    expect(mcpMarketFormPaintScope).not.toMatch(
      /var\(--(?:gray-(?:50|100|200|300|500)|primary-10|danger)\)/,
    );
    expect(mcpMarketFormPaintScope).not.toContain(
      "border: var(--border-in-light)",
    );
    expect(mcpMarketFormPaintScope).not.toContain("border-radius: 10px");
    expect(mcpMarketFormPaintScope).not.toContain("border-radius: 6px");
  });

  test("keeps MCP market list surfaces aligned with Gemini utility cards", () => {
    const mcpMarket = read("app/components/mcp-market.tsx");
    const serverList = read("app/components/mcp-market/server-list.tsx");
    const mcpMarketStyles = read("app/components/mcp-market.module.scss");
    const mcpMarketPageBlock = readCssBlock(
      mcpMarketStyles,
      ".mcp-market-page",
    );
    const mcpMarketRootBlock = readRootDeclarations(mcpMarketPageBlock);
    const darkMcpMarketBlock = readCssBlock(
      mcpMarketStyles,
      ":global(.dark) .mcp-market-page",
    );
    const autoDarkMcpMarketSelector =
      ":global(body:not(.light)) .mcp-market-page";
    const autoDarkMcpMarketSelectorIndex = mcpMarketStyles.indexOf(
      autoDarkMcpMarketSelector,
    );
    const autoDarkMcpMarketMediaIndex = mcpMarketStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkMcpMarketSelectorIndex,
    );
    const autoDarkMcpMarketBlock = readCssBlock(
      mcpMarketStyles.slice(autoDarkMcpMarketMediaIndex),
      autoDarkMcpMarketSelector,
    );
    const loadingEmptyBlock = readCssBlock(
      mcpMarketStyles,
      ".loading-container,\n    .empty-container",
    );
    const loadingTextBlock = readCssBlock(
      mcpMarketStyles,
      ".loading-text,\n    .empty-text",
    );
    const marketFilterBlock = readCssBlock(
      mcpMarketStyles,
      ".mcp-market-filter",
    );
    const searchBarBlock = readCssBlock(marketFilterBlock, ".search-bar");
    const searchBarHoverBlock = readCssBlock(searchBarBlock, "&:hover");
    const searchBarFocusBlock = readCssBlock(searchBarBlock, "&:focus");
    const searchBarPlaceholderBlock = readCssBlock(
      searchBarBlock,
      "&::placeholder",
    );
    const serverListBlock = readCssBlock(mcpMarketStyles, ".server-list");
    const marketItemBlock = readCssBlock(mcpMarketStyles, ".mcp-market-item");
    const marketItemHoverBlock = readCssBlock(marketItemBlock, "&:hover");
    const marketItemNotLastBlock = readCssBlock(
      marketItemBlock,
      "&:not(:last-child)",
    );
    const marketItemLoadingBlock = readCssBlock(marketItemBlock, "&.loading");
    const marketItemLoadingAfterBlock = readCssBlock(
      marketItemLoadingBlock,
      "&::after",
    );
    const tagBlock = readCssBlock(mcpMarketStyles, ".tag");
    const marketInfoBlock = readCssBlock(mcpMarketStyles, ".mcp-market-info");
    const listBlock = readCssBlock(mcpMarketStyles, ".list");
    const marketListPaintScope = [
      mcpMarketRootBlock,
      darkMcpMarketBlock,
      autoDarkMcpMarketBlock,
      loadingEmptyBlock,
      loadingTextBlock,
      marketFilterBlock,
      searchBarBlock,
      searchBarHoverBlock,
      searchBarFocusBlock,
      searchBarPlaceholderBlock,
      serverListBlock,
      marketItemBlock,
      marketItemHoverBlock,
      marketItemNotLastBlock,
      marketItemLoadingAfterBlock,
      tagBlock,
      marketInfoBlock,
      listBlock,
    ].join("\n");

    expect(mcpMarket).toContain("onInput={(event) => setSearchText");
    expect(mcpMarket).toContain("<ServerList");
    expect(serverList).toContain("function getVisibleServers");
    expect(serverList).toContain("server.tags.some");
    expect(serverList).toContain("onAddServer(server)");
    expect(serverList).toContain("onConfigureServer(server.id)");
    expect(serverList).toContain("onPauseServer(server.id)");
    expect(serverList).toContain("onRestartServer(server.id)");
    expect(serverList).toContain("onViewTools(server.id)");
    expect(serverList).toContain('className={styles["empty-container"]}');
    expect(serverList).toContain('className={styles["tag"]}');
    expect(serverList).toContain('className={clsx(styles["mcp-market-info"], "one-line")}');

    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-card-surface:\s*var\(--surface-elevated\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-card-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-card-hover-surface:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 4%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-card-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 18%,\s*transparent\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 82%,\s*transparent\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-tag-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 7%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-tag-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 14%,\s*transparent\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-tag-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 68%,\s*var\(--black\)\s*\);/,
    );
    expect(mcpMarketRootBlock).toMatch(
      /--mcp-market-loading-shine-color:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 66%,\s*transparent\s*\);/,
    );
    expect(darkMcpMarketBlock).toMatch(
      /--mcp-market-card-hover-surface:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 10%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(darkMcpMarketBlock).toMatch(
      /--mcp-market-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 64%,\s*transparent\s*\);/,
    );
    expect(darkMcpMarketBlock).toMatch(
      /--mcp-market-loading-shine-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 16%,\s*transparent\s*\);/,
    );
    expect(autoDarkMcpMarketSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkMcpMarketMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkMcpMarketBlock).toMatch(
      /--mcp-market-card-hover-surface:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 10%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(autoDarkMcpMarketBlock).toMatch(
      /--mcp-market-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 64%,\s*transparent\s*\);/,
    );

    [loadingEmptyBlock, marketItemBlock, listBlock].forEach((block) => {
      expect(block).toMatch(
        /background-color:\s*var\(--mcp-market-card-surface\);/,
      );
      expect(block).toMatch(
        /border:\s*1px solid var\(--mcp-market-card-border-color\);/,
      );
      expect(block).toMatch(/border-radius:\s*8px;/);
    });
    expect(loadingTextBlock).toMatch(/color:\s*var\(--mcp-market-muted-color\);/);
    expect(searchBarBlock).toMatch(
      /background-color:\s*var\(--mcp-market-form-surface\);/,
    );
    expect(searchBarBlock).toMatch(
      /border:\s*1px solid var\(--mcp-market-form-border-color\);/,
    );
    expect(searchBarBlock).toMatch(/text-align:\s*left;/);
    expect(searchBarHoverBlock).toMatch(
      /border-color:\s*var\(--mcp-market-form-hover-border-color\);/,
    );
    expect(searchBarFocusBlock).toMatch(/border-color:\s*var\(--primary\);/);
    expect(searchBarFocusBlock).toMatch(
      /box-shadow:\s*var\(--mcp-market-form-focus-shadow\);/,
    );
    expect(searchBarPlaceholderBlock).toMatch(
      /color:\s*var\(--mcp-market-form-placeholder-color\);/,
    );
    expect(serverListBlock).toMatch(/gap:\s*8px;/);
    expect(marketItemHoverBlock).toMatch(
      /background-color:\s*var\(--mcp-market-card-hover-surface\);/,
    );
    expect(marketItemHoverBlock).toMatch(
      /border-color:\s*var\(--mcp-market-card-hover-border-color\);/,
    );
    expect(marketItemNotLastBlock).toMatch(
      /border-bottom:\s*1px solid var\(--mcp-market-card-border-color\);/,
    );
    expect(marketItemLoadingAfterBlock).toContain(
      "var(--mcp-market-loading-shine-color)",
    );
    expect(tagBlock).toMatch(/background:\s*var\(--mcp-market-tag-background\);/);
    expect(tagBlock).toMatch(/border:\s*1px solid var\(--mcp-market-tag-border-color\);/);
    expect(tagBlock).toMatch(/color:\s*var\(--mcp-market-tag-color\);/);
    expect(tagBlock).toMatch(/border-radius:\s*999px;/);
    expect(marketInfoBlock).toMatch(/color:\s*var\(--mcp-market-muted-color\);/);
    expect(marketListPaintScope).not.toMatch(
      /background(?:-color)?:\s*var\(--white\)|background:\s*var\(--gray\)|border:\s*var\(--border-in-light\)|rgba\(255,\s*255,\s*255,\s*0\.2\)/,
    );
  });

  test("keeps composer attachment deletion focus handoff predictable", () => {
    const chat = read("app/components/chat.tsx");

    expect(chat).toContain(
      "const attachmentsContainerRef = useRef<HTMLDivElement>(null);",
    );
    expect(chat).toContain("ref={attachmentsContainerRef}");
    expect(chat).toMatch(
      /const focusComposerAttachmentAfterRemoval = useCallback\(\s*\(nextAttachmentIndex: number\) => \{[\s\S]*requestAnimationFrame\(\(\) => \{[\s\S]*attachmentsContainerRef\.current\?\.querySelectorAll<HTMLButtonElement>\(\s*`button\.\$\{styles\["attach-image"\]\}, button\.\$\{styles\["attach-file"\]\}, button\.\$\{styles\["attachment-add-button"\]\}`[\s\S]*const nextControl =[\s\S]*attachmentControls\[[\s\S]*inputRef\.current;[\s\S]*nextControl\?\.focus\(\);[\s\S]*\}\);[\s\S]*\},\s*\[\],?\s*\);/,
    );
    expect(chat).toMatch(
      /function deleteAttachedFile\(index: number\) \{[\s\S]*setAttachedFiles\(attachedFiles\.filter\(\(_, i\) => i !== index\)\);[\s\S]*focusComposerAttachmentAfterRemoval\(attachImages\.length \+ index\);[\s\S]*\}/,
    );
    expect(chat).toMatch(
      /ariaLabel=\{`删除第 \$\{index \+ 1\} 张图片附件`\}[\s\S]*deleteImage=\{\(e\) => \{[\s\S]*setAttachImages\([\s\S]*attachImages\.filter\(\(_, i\) => i !== index\),[\s\S]*\);[\s\S]*focusComposerAttachmentAfterRemoval\(index\);[\s\S]*\}\}/,
    );
  });

  test("keeps composer attachment preview items aligned with Gemini multimodal surfaces", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const attachItemBlock = readRootDeclarations(
      readCssBlock(chatStyles, ".attach-item"),
    );
    const attachImageBlock = readCssBlock(chatStyles, ".attach-image");
    const attachFileBlock = readCssBlock(
      chatStyles.slice(chatStyles.lastIndexOf("\n.attach-file {")),
      ".attach-file",
    );
    const attachFileIconBlock = readCssBlock(
      attachFileBlock,
      ".attach-file-icon",
    );
    const attachFileNameBlock = readCssBlock(
      attachFileBlock,
      ".attach-file-name",
    );
    const attachFileSizeBlock = readCssBlock(
      attachFileBlock,
      ".attach-file-size",
    );
    const fileWordBlock = readCssBlock(
      chatStyles,
      ".attach-file-icon:global(.file-word)",
    );
    const filePdfBlock = readCssBlock(
      chatStyles,
      ".attach-file-icon:global(.file-pdf)",
    );
    const deleteImageBlock = readCssBlock(chatStyles, ".delete-image");
    const darkAttachItemBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .attach-item",
    );
    const darkDeleteImageBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .delete-image",
    );
    const autoDarkAttachItemSelector = ":global(body:not(.light)) .attach-item";
    const autoDarkAttachItemSelectorIndex = chatStyles.indexOf(
      autoDarkAttachItemSelector,
    );
    const autoDarkAttachItemMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkAttachItemSelectorIndex,
    );
    const autoDarkAttachItemBlock = readCssBlock(
      chatStyles.slice(autoDarkAttachItemMediaIndex),
      autoDarkAttachItemSelector,
    );
    const autoDarkDeleteImageSelector =
      ":global(body:not(.light)) .delete-image";
    const autoDarkDeleteImageSelectorIndex = chatStyles.indexOf(
      autoDarkDeleteImageSelector,
    );
    const autoDarkDeleteImageMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkDeleteImageSelectorIndex,
    );
    const autoDarkDeleteImageBlock = readCssBlock(
      chatStyles.slice(autoDarkDeleteImageMediaIndex),
      autoDarkDeleteImageSelector,
    );
    const mobileStyles = chatStyles.slice(
      chatStyles.lastIndexOf("@media screen and (max-width: 600px)"),
    );
    const mobileAttachImageBlock = readCssBlock(mobileStyles, ".attach-image");
    const mobileAttachFileBlock = readCssBlock(mobileStyles, ".attach-file");
    const attachmentPreviewToneScope = [
      attachItemBlock,
      attachImageBlock,
      attachFileBlock,
      deleteImageBlock,
      darkAttachItemBlock,
      darkDeleteImageBlock,
      autoDarkAttachItemBlock,
      autoDarkDeleteImageBlock,
    ].join("\n");

    expect(chat).toContain('styles["attach-image-item"]');
    expect(chat).toContain('styles["attach-file-item"]');
    expect(chat).toContain('styles["attach-image"]');
    expect(chat).toContain('styles["attach-file"]');
    expect(chat).toContain('styles["attach-file-card"]');
    expect(chat).toContain('styles["attach-file-icon"]');
    expect(chat).toContain('styles["delete-image"]');
    expect(chat).toContain("getFileIconClass(file.type)");
    expect(attachItemBlock).toMatch(/--attachment-item-radius:\s*8px;/);
    expect(attachItemBlock).toMatch(
      /--attachment-item-border-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 14%,\s*transparent\);/,
    );
    expect(attachItemBlock).toMatch(
      /--attachment-item-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 92%,\s*transparent\);/,
    );
    expect(attachItemBlock).toMatch(
      /--attachment-item-hover-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 28%,\s*transparent\);/,
    );
    expect(attachItemBlock).toMatch(
      /--attachment-file-icon-background:\s*color-mix\(in srgb,\s*var\(--primary\) 10%,\s*var\(--surface-elevated\)\);/,
    );
    expect(attachImageBlock).toMatch(
      /border:\s*1px solid var\(--attachment-item-border-color\);/,
    );
    expect(attachImageBlock).toMatch(
      /border-radius:\s*var\(--attachment-item-radius\);/,
    );
    expect(attachImageBlock).toMatch(
      /background-color:\s*var\(--attachment-item-background\);/,
    );
    expect(attachImageBlock).toMatch(
      /0 8px 24px var\(--attachment-item-shadow-color\);/,
    );
    expect(attachImageBlock).toMatch(
      /&:hover,[\s\S]*&:focus-visible[\s\S]*border-color:\s*var\(--attachment-item-hover-border-color\);/,
    );
    expect(attachImageBlock).toMatch(
      /&:focus-visible[\s\S]*outline:\s*var\(--focus-ring\);[\s\S]*box-shadow:\s*var\(--focus-ring-shadow\),[\s\S]*0 8px 24px var\(--attachment-item-hover-shadow-color\);/,
    );
    expect(attachFileBlock).toMatch(
      /border:\s*1px solid var\(--attachment-item-border-color\);/,
    );
    expect(attachFileBlock).toMatch(
      /border-radius:\s*var\(--attachment-item-radius\);/,
    );
    expect(attachFileBlock).toMatch(
      /background-color:\s*var\(--attachment-item-background\);/,
    );
    expect(attachFileBlock).toMatch(
      /0 8px 24px var\(--attachment-item-shadow-color\);/,
    );
    expect(attachFileBlock).toMatch(
      /&:hover,[\s\S]*&:focus-visible[\s\S]*border-color:\s*var\(--attachment-item-hover-border-color\);/,
    );
    expect(attachFileIconBlock).toMatch(/border-radius:\s*8px;/);
    expect(attachFileIconBlock).toMatch(
      /background:\s*var\(--attachment-file-icon-background\);/,
    );
    expect(attachFileIconBlock).toMatch(
      /color:\s*var\(--attachment-file-icon-color\);/,
    );
    expect(fileWordBlock).toMatch(
      /--attachment-file-icon-color:\s*#2b579a;/,
    );
    expect(filePdfBlock).toMatch(/--attachment-file-icon-color:\s*#f40f02;/);
    expect(attachFileNameBlock).toMatch(
      /color:\s*var\(--attachment-file-name-color\);/,
    );
    expect(attachFileSizeBlock).toMatch(
      /color:\s*var\(--attachment-file-size-color\);/,
    );
    expect(deleteImageBlock).toMatch(
      /--attachment-delete-button-border-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 16%,\s*transparent\);/,
    );
    expect(deleteImageBlock).toMatch(
      /border:\s*1px solid var\(--attachment-delete-button-border-color\);/,
    );
    expect(deleteImageBlock).toMatch(
      /background-color:\s*var\(--attachment-delete-button-background\);/,
    );
    expect(deleteImageBlock).toMatch(
      /color:\s*var\(--attachment-delete-button-color\);/,
    );
    expect(deleteImageBlock).toMatch(
      /&:hover,[\s\S]*&:focus-visible[\s\S]*background-color:\s*var\(--attachment-delete-button-hover-background\);/,
    );
    expect(darkAttachItemBlock).toMatch(
      /--attachment-item-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 74%,\s*transparent\);/,
    );
    expect(darkDeleteImageBlock).toMatch(
      /--attachment-delete-button-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 84%,\s*transparent\);/,
    );
    expect(autoDarkAttachItemSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkAttachItemMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkAttachItemBlock).toMatch(
      /--attachment-item-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 74%,\s*transparent\);/,
    );
    expect(autoDarkDeleteImageSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkDeleteImageMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkDeleteImageBlock).toMatch(
      /--attachment-delete-button-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 84%,\s*transparent\);/,
    );
    expect(attachmentPreviewToneScope).not.toMatch(
      /border:\s*var\(--border-in-light\)|background-color:\s*var\(--white\)|rgba\(\$color:\s*#000|rgba\(\$color:\s*#888/,
    );
    expect(mobileAttachImageBlock).toMatch(/width:\s*58px;/);
    expect(mobileAttachImageBlock).toMatch(/height:\s*58px;/);
    expect(mobileAttachFileBlock).toMatch(/width:\s*min\(170px,\s*55vw\);/);
    expect(mobileAttachFileBlock).toMatch(/height:\s*58px;/);
  });

  test("keeps attachment strip add action as a direct native picker entry", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const attachAddItemBlock = readCssBlock(chatStyles, ".attach-add-item");
    const attachmentAddButtonBlock = readCssBlock(
      chatStyles,
      ".attachment-add-button",
    );
    const darkAttachmentAddButtonBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .attachment-add-button",
    );
    const autoDarkAttachmentAddButtonSelector =
      ":global(body:not(.light)) .attachment-add-button";
    const autoDarkAttachmentAddButtonSelectorIndex = chatStyles.indexOf(
      autoDarkAttachmentAddButtonSelector,
    );
    const autoDarkAttachmentAddButtonMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkAttachmentAddButtonSelectorIndex,
    );
    const autoDarkAttachmentAddButtonBlock = readCssBlock(
      chatStyles.slice(autoDarkAttachmentAddButtonMediaIndex),
      autoDarkAttachmentAddButtonSelector,
    );
    const mobileStyles = chatStyles.slice(
      chatStyles.lastIndexOf("@media only screen and (max-width: 600px)"),
    );
    const mobileAddButtonBlock = readCssBlock(
      mobileStyles,
      ".attachment-add-button",
    );
    const attachmentAddButtonToneScope = [
      attachmentAddButtonBlock,
      darkAttachmentAddButtonBlock,
      autoDarkAttachmentAddButtonBlock,
    ].join("\n");
    const legacyAttachmentAddButtonPaint =
      /rgba\((?:25,\s*103,\s*210|26,\s*115,\s*232|66,\s*133,\s*244|138,\s*180,\s*248|174,\s*203,\s*250|232,\s*240,\s*254|248,\s*250,\s*255|32,\s*33,\s*36|48,\s*49,\s*52)/;

    expect(chat).toMatch(
      /const canAddMoreAttachments =\s*attachImages\.length < 3 \|\| attachedFiles\.length < 5;/,
    );
    expect(chat).toMatch(
      /\{\(attachImages\.length > 0 \|\| attachedFiles\.length > 0\) && \([\s\S]*\{canAddMoreAttachments && \([\s\S]*className=\{clsx\([\s\S]*styles\["attach-item"\][\s\S]*styles\["attach-add-item"\][\s\S]*role="listitem"[\s\S]*<button[\s\S]*type="button"[\s\S]*className=\{styles\["attachment-add-button"\]\}[\s\S]*aria-label="继续添加附件"[\s\S]*title="继续添加附件"[\s\S]*disabled=\{uploading\}[\s\S]*onClick=\{handleUploadAttachments\}[\s\S]*<AddIcon \/>/,
    );
    expect(attachAddItemBlock).toMatch(/width:\s*64px;/);
    expect(attachmentAddButtonBlock).toMatch(/width:\s*64px;/);
    expect(attachmentAddButtonBlock).toMatch(/height:\s*64px;/);
    expect(attachmentAddButtonBlock).toMatch(
      /border-radius:\s*var\(--attachment-item-radius\);/,
    );
    expect(attachmentAddButtonBlock).toMatch(
      /--attachment-add-button-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 38%,\s*transparent\);/,
    );
    expect(attachmentAddButtonBlock).toMatch(
      /--attachment-add-button-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 86%,\s*transparent\);/,
    );
    expect(attachmentAddButtonBlock).toMatch(
      /--attachment-add-button-hover-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 62%,\s*transparent\);/,
    );
    expect(attachmentAddButtonBlock).toMatch(
      /border:\s*1px dashed var\(--attachment-add-button-border-color\);/,
    );
    expect(attachmentAddButtonBlock).toMatch(
      /background:\s*var\(--attachment-add-button-background\);/,
    );
    expect(attachmentAddButtonBlock).toMatch(
      /color:\s*var\(--attachment-add-button-color\);/,
    );
    expect(attachmentAddButtonBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--attachment-add-button-inner-ring-color\);/,
    );
    expect(attachmentAddButtonBlock).toMatch(/backdrop-filter:\s*blur\(12px\);/);
    expect(attachmentAddButtonBlock).toMatch(/transition:/);
    expect(attachmentAddButtonBlock).toContain("&:not(:disabled):hover");
    expect(attachmentAddButtonBlock).toContain("&:not(:disabled):focus-visible");
    expect(attachmentAddButtonBlock).toMatch(
      /&:not\(:disabled\):hover,[\s\S]*&:not\(:disabled\):focus-visible[\s\S]*background:\s*var\(--attachment-add-button-hover-background\);[\s\S]*border-color:\s*var\(--attachment-add-button-hover-border-color\);/,
    );
    expect(attachmentAddButtonBlock).toMatch(
      /0 8px 24px var\(--attachment-add-button-hover-shadow-color\);/,
    );
    expect(attachmentAddButtonBlock).toMatch(/&:disabled[\s\S]*opacity:\s*0\.58;/);
    expect(darkAttachmentAddButtonBlock).toMatch(
      /--attachment-add-button-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 72%,\s*transparent\);/,
    );
    expect(darkAttachmentAddButtonBlock).toMatch(
      /--attachment-add-button-hover-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 58%,\s*transparent\);/,
    );
    expect(darkAttachmentAddButtonBlock).toMatch(
      /&:not\(:disabled\):hover,[\s\S]*&:not\(:disabled\):focus-visible[\s\S]*background:\s*var\(--attachment-add-button-hover-background\);/,
    );
    expect(autoDarkAttachmentAddButtonSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkAttachmentAddButtonMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkAttachmentAddButtonBlock).toMatch(
      /--attachment-add-button-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 72%,\s*transparent\);/,
    );
    expect(attachmentAddButtonToneScope).not.toMatch(
      legacyAttachmentAddButtonPaint,
    );
    expect(mobileAddButtonBlock).toMatch(/width:\s*58px;/);
    expect(mobileAddButtonBlock).toMatch(/height:\s*58px;/);
  });

  test("keeps attachment strip full state visible and inert", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const chatActionStart = chat.indexOf("export function ChatAction(props: {");
    const chatActionBlock = chat.slice(
      chatActionStart,
      chat.indexOf("function useScrollToBottom", chatActionStart),
    );
    const handleUploadAttachmentsBlock = readFunctionBlock(
      chat,
      "async function handleUploadAttachments()",
    );
    const attachFullItemBlock = readCssBlock(chatStyles, ".attach-full-item");
    const attachmentFullIndicatorBlock = readCssBlock(
      chatStyles,
      ".attachment-full-indicator",
    );
    const darkAttachmentFullIndicatorBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .attachment-full-indicator",
    );
    const autoDarkAttachmentFullIndicatorSelector =
      ":global(body:not(.light)) .attachment-full-indicator";
    const autoDarkAttachmentFullIndicatorSelectorIndex = chatStyles.indexOf(
      autoDarkAttachmentFullIndicatorSelector,
    );
    const autoDarkAttachmentFullIndicatorMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkAttachmentFullIndicatorSelectorIndex,
    );
    const autoDarkAttachmentFullIndicatorMediaBlock = readCssBlock(
      chatStyles,
      "@media (prefers-color-scheme: dark)",
    );
    const autoDarkAttachmentFullIndicatorBlock = readCssBlock(
      autoDarkAttachmentFullIndicatorMediaBlock,
      autoDarkAttachmentFullIndicatorSelector,
    );
    const attachmentFullIndicatorToneScope = [
      attachmentFullIndicatorBlock,
      darkAttachmentFullIndicatorBlock,
      autoDarkAttachmentFullIndicatorBlock,
    ].join("\n");
    const legacyAttachmentFullIndicatorPaint =
      /rgba\((?:95,\s*99,\s*104|232,\s*234,\s*237|248,\s*250,\s*255|241,\s*245,\s*249|48,\s*49,\s*52|32,\s*33,\s*36|255,\s*255,\s*255)/;
    const mobileStyles = chatStyles.slice(
      chatStyles.lastIndexOf("@media only screen and (max-width: 600px)"),
    );
    const mobileFullIndicatorBlock = readCssBlock(
      mobileStyles,
      ".attachment-full-indicator",
    );
    const fullIndicatorMarkupStart = chat.indexOf('styles["attach-full-item"]');
    const fullIndicatorMarkupEnd = chat.indexOf(
      "<IconButton",
      fullIndicatorMarkupStart,
    );
    const fullIndicatorMarkup = chat.slice(
      fullIndicatorMarkupStart,
      fullIndicatorMarkupEnd,
    );
    const uploadActionMarkupStart = chat.indexOf(
      "<ChatAction",
      chat.indexOf('aria-label="多模态工具"'),
    );
    const uploadActionMarkupEnd = chat.indexOf(
      "{!isCompactScreen && config.enablePromptHints",
      uploadActionMarkupStart,
    );
    const uploadActionMarkup = chat.slice(
      uploadActionMarkupStart,
      uploadActionMarkupEnd,
    );

    expect(chat).toMatch(
      /const attachmentSlotsFull =\s*attachImages\.length >= 3 && attachedFiles\.length >= 5;/,
    );
    expect(chat).toMatch(
      /type ChatActionsProps = \{[\s\S]*attachmentSlotsFull: boolean;[\s\S]*\};/,
    );
    expect(chatActionBlock).toContain("disabled?: boolean;");
    expect(chatActionBlock).toContain("disabled={props.disabled}");
    expect(chatActionBlock).toMatch(
      /onClick=\{\(event\) => \{[\s\S]*if \(props\.disabled\) return;[\s\S]*void props\.onClick\(event\);/,
    );
    expect(handleUploadAttachmentsBlock).toMatch(
      /if \(attachmentSlotsFull\) \{[\s\S]*showToast\("附件已满：最多 3 张图片、5 个文件"\);[\s\S]*return;[\s\S]*\}[\s\S]*uploadAttachments\(/,
    );
    expect(uploadActionMarkup).toMatch(
      /onClick=\{\(\) => \{[\s\S]*if \(props\.attachmentSlotsFull\) return;[\s\S]*props\.uploadAttachments\(\);[\s\S]*completeMobileAction\(\);/,
    );
    expect(uploadActionMarkup).toContain(
      "disabled={props.attachmentSlotsFull}",
    );
    expect(uploadActionMarkup).toContain("props.attachmentSlotsFull");
    expect(chat).toMatch(
      /<ChatActions[\s\S]*attachmentSlotsFull=\{attachmentSlotsFull\}/,
    );
    expect(chat).toMatch(
      /\{\(attachImages\.length > 0 \|\| attachedFiles\.length > 0\) && \([\s\S]*\{canAddMoreAttachments && \([\s\S]*styles\["attachment-add-button"\][\s\S]*\)\}[\s\S]*\{attachmentSlotsFull && \(/,
    );
    expect(fullIndicatorMarkupStart).toBeGreaterThan(-1);
    expect(fullIndicatorMarkup).toContain('styles["attach-full-item"]');
    expect(fullIndicatorMarkup).toContain(
      'className={styles["attachment-full-indicator"]}',
    );
    expect(fullIndicatorMarkup).toContain('role="status"');
    expect(fullIndicatorMarkup).toContain('aria-live="polite"');
    expect(fullIndicatorMarkup).toContain(
      'aria-label="附件已满：最多 3 张图片、5 个文件"',
    );
    expect(fullIndicatorMarkup).toContain(
      'title="附件已满：最多 3 张图片、5 个文件"',
    );
    expect(fullIndicatorMarkup).toContain("<AttachmentIcon />");
    expect(fullIndicatorMarkup).toContain("<span>已满</span>");
    expect(fullIndicatorMarkup).not.toContain("onClick");
    expect(fullIndicatorMarkup).not.toContain("handleUploadAttachments");
    expect(attachFullItemBlock).toMatch(/width:\s*64px;/);
    expect(attachmentFullIndicatorBlock).toMatch(/width:\s*64px;/);
    expect(attachmentFullIndicatorBlock).toMatch(/height:\s*64px;/);
    expect(attachmentFullIndicatorBlock).toMatch(
      /border-radius:\s*var\(--attachment-item-radius\);/,
    );
    expect(attachmentFullIndicatorBlock).toMatch(/cursor:\s*default;/);
    expect(attachmentFullIndicatorBlock).toMatch(/font-size:\s*11px;/);
    expect(attachmentFullIndicatorBlock).toMatch(/font-weight:\s*520;/);
    expect(attachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-border-color: color-mix(in srgb, var(--black-50) 16%, transparent);",
    );
    expect(attachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-background-start: color-mix(in srgb, var(--surface-elevated) 82%, transparent);",
    );
    expect(attachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-background-end: color-mix(in srgb, var(--surface-soft) 72%, transparent);",
    );
    expect(attachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-background-base: color-mix(in srgb, var(--surface-elevated) 86%, transparent);",
    );
    expect(attachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-color: color-mix(in srgb, var(--black-50) 84%, transparent);",
    );
    expect(attachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-inner-ring-color: color-mix(in srgb, var(--surface) 48%, transparent);",
    );
    expect(attachmentFullIndicatorBlock).toMatch(
      /border:\s*1px solid var\(--attachment-full-indicator-border-color\);/,
    );
    expect(attachmentFullIndicatorBlock).toContain(
      "linear-gradient(145deg, var(--attachment-full-indicator-background-start), var(--attachment-full-indicator-background-end))",
    );
    expect(attachmentFullIndicatorBlock).toContain(
      "var(--attachment-full-indicator-background-base)",
    );
    expect(attachmentFullIndicatorBlock).toMatch(
      /color:\s*var\(--attachment-full-indicator-color\);/,
    );
    expect(attachmentFullIndicatorBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--attachment-full-indicator-inner-ring-color\);/,
    );
    expect(attachmentFullIndicatorBlock).toMatch(/backdrop-filter:\s*blur\(12px\);/);
    expect(attachmentFullIndicatorBlock).toMatch(/pointer-events:\s*none;/);
    expect(darkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-border-color: color-mix(in srgb, var(--black) 10%, transparent);",
    );
    expect(darkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-background-start: color-mix(in srgb, var(--surface-soft) 72%, transparent);",
    );
    expect(darkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-background-end: color-mix(in srgb, var(--surface) 62%, transparent);",
    );
    expect(darkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-background-base: color-mix(in srgb, var(--surface) 72%, transparent);",
    );
    expect(darkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-color: color-mix(in srgb, var(--black) 68%, transparent);",
    );
    expect(darkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-inner-ring-color: color-mix(in srgb, var(--black) 6%, transparent);",
    );
    expect(darkAttachmentFullIndicatorBlock).toMatch(
      /border-color:\s*var\(--attachment-full-indicator-border-color\);/,
    );
    expect(darkAttachmentFullIndicatorBlock).toContain(
      "linear-gradient(145deg, var(--attachment-full-indicator-background-start), var(--attachment-full-indicator-background-end))",
    );
    expect(darkAttachmentFullIndicatorBlock).toContain(
      "var(--attachment-full-indicator-background-base)",
    );
    expect(darkAttachmentFullIndicatorBlock).toMatch(
      /color:\s*var\(--attachment-full-indicator-color\);/,
    );
    expect(darkAttachmentFullIndicatorBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--attachment-full-indicator-inner-ring-color\);/,
    );
    expect(autoDarkAttachmentFullIndicatorSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkAttachmentFullIndicatorMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-border-color: color-mix(in srgb, var(--black) 10%, transparent);",
    );
    expect(autoDarkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-background-start: color-mix(in srgb, var(--surface-soft) 72%, transparent);",
    );
    expect(autoDarkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-background-end: color-mix(in srgb, var(--surface) 62%, transparent);",
    );
    expect(autoDarkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-background-base: color-mix(in srgb, var(--surface) 72%, transparent);",
    );
    expect(autoDarkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-color: color-mix(in srgb, var(--black) 68%, transparent);",
    );
    expect(autoDarkAttachmentFullIndicatorBlock).toContain(
      "--attachment-full-indicator-inner-ring-color: color-mix(in srgb, var(--black) 6%, transparent);",
    );
    expect(autoDarkAttachmentFullIndicatorBlock).toMatch(
      /border-color:\s*var\(--attachment-full-indicator-border-color\);/,
    );
    expect(autoDarkAttachmentFullIndicatorBlock).toContain(
      "linear-gradient(145deg, var(--attachment-full-indicator-background-start), var(--attachment-full-indicator-background-end))",
    );
    expect(autoDarkAttachmentFullIndicatorBlock).toContain(
      "var(--attachment-full-indicator-background-base)",
    );
    expect(autoDarkAttachmentFullIndicatorBlock).toMatch(
      /color:\s*var\(--attachment-full-indicator-color\);/,
    );
    expect(autoDarkAttachmentFullIndicatorBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--attachment-full-indicator-inner-ring-color\);/,
    );
    expect(attachmentFullIndicatorToneScope).not.toMatch(
      legacyAttachmentFullIndicatorPaint,
    );
    expect(mobileFullIndicatorBlock).toMatch(/width:\s*58px;/);
    expect(mobileFullIndicatorBlock).toMatch(/height:\s*58px;/);
  });

  test("keeps composer attachment strip overflow hints non-blocking", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const attachmentShellBlock = readCssBlock(
      chatStyles,
      ".attachments-scroll-shell",
    );
    const attachmentFadeBlock = readCssBlock(
      chatStyles,
      ".attachment-scroll-fade",
    );
    const attachmentFadeStartBlock = readCssBlock(
      chatStyles,
      ".attachment-scroll-fade-start",
    );
    const attachmentFadeEndBlock = readCssBlock(
      chatStyles,
      ".attachment-scroll-fade-end",
    );

    expect(chat).toContain(
      "const [attachmentScrollHint, setAttachmentScrollHint] = useState({",
    );
    expect(chat).toMatch(
      /const syncAttachmentScrollHint = useCallback\(\(\) => \{[\s\S]*const attachmentContainer = attachmentsContainerRef\.current;[\s\S]*const maxScrollLeft = Math\.max\([\s\S]*attachmentContainer\.scrollWidth - attachmentContainer\.clientWidth[\s\S]*start: attachmentContainer\.scrollLeft > 1,[\s\S]*end: maxScrollLeft - attachmentContainer\.scrollLeft > 1,[\s\S]*setAttachmentScrollHint\(\(current\) =>/,
    );
    expect(chat).toMatch(
      /className=\{styles\["attachments-scroll-shell"\]\}[\s\S]*data-overflow-start=\{\s*attachmentScrollHint\.start \? "true" : "false"\s*\}[\s\S]*data-overflow-end=\{\s*attachmentScrollHint\.end \? "true" : "false"\s*\}[\s\S]*ref=\{attachmentsContainerRef\}[\s\S]*onScroll=\{syncAttachmentScrollHint\}/,
    );
    expect(chat).toMatch(
      /\{attachmentScrollHint\.start && \([\s\S]*<span[\s\S]*aria-hidden="true"[\s\S]*styles\["attachment-scroll-fade"\][\s\S]*styles\["attachment-scroll-fade-start"\]/,
    );
    expect(chat).toMatch(
      /\{attachmentScrollHint\.end && \([\s\S]*<span[\s\S]*aria-hidden="true"[\s\S]*styles\["attachment-scroll-fade"\][\s\S]*styles\["attachment-scroll-fade-end"\]/,
    );
    expect(attachmentShellBlock).toMatch(/position:\s*relative;/);
    expect(attachmentShellBlock).toMatch(/min-width:\s*0;/);
    expect(attachmentFadeBlock).toMatch(/position:\s*absolute;/);
    expect(attachmentFadeBlock).toMatch(/pointer-events:\s*none;/);
    expect(attachmentFadeBlock).toMatch(/width:\s*28px;/);
    expect(attachmentFadeStartBlock).toMatch(/linear-gradient\(\s*90deg/);
    expect(attachmentFadeEndBlock).toMatch(/linear-gradient\(\s*270deg/);
    expect(chatStyles).toMatch(
      /:global\(\.dark\) \.attachments-scroll-shell[\s\S]*--attachment-edge-surface:/,
    );
  });

  test("keeps composer attachment strip swipes scoped on mobile", () => {
    const chat = read("app/components/chat.tsx");
    const touchStartBlock = readFunctionBlock(
      chat,
      "const handleTouchStart = (e: React.TouchEvent) =>",
    );
    const touchMoveBlock = readFunctionBlock(
      chat,
      "const handleTouchMove = (e: React.TouchEvent) =>",
    );
    const touchEndBlock = readFunctionBlock(
      chat,
      "const handleTouchEnd = () =>",
    );

    expect(chat).toMatch(
      /<div\s+className=\{styles\.chat\}[\s\S]*key=\{session\.id\}[\s\S]*onTouchStart=\{handleTouchStart\}[\s\S]*onTouchMove=\{handleTouchMove\}[\s\S]*onTouchEnd=\{handleTouchEnd\}/,
    );
    expect(chat).toContain("const ignoreChatSwipeRef = useRef(false);");
    expect(chat).toMatch(
      /const isAttachmentStripTouch = \(target: EventTarget \| null\) => \{[\s\S]*const touchTarget =[\s\S]*target instanceof Element[\s\S]*target[\s\S]*target instanceof Node[\s\S]*target\.parentElement[\s\S]*return Boolean\([\s\S]*touchTarget\?\.closest\('\[data-composer-attachment-strip="true"\]'\)[\s\S]*\);[\s\S]*\};/,
    );
    expect(chat).toMatch(
      /className=\{styles\["attachments-scroll-shell"\]\}[\s\S]*data-composer-attachment-strip="true"[\s\S]*<div[\s\S]*className=\{styles\["attachments-container"\]\}/,
    );
    expect(touchStartBlock).toMatch(
      /if \(isAttachmentStripTouch\(e\.target\)\) \{[\s\S]*ignoreChatSwipeRef\.current = true;[\s\S]*touchStartXRef\.current = 0;[\s\S]*touchEndXRef\.current = 0;[\s\S]*return;[\s\S]*\}/,
    );
    expect(touchStartBlock).toMatch(
      /ignoreChatSwipeRef\.current = false;[\s\S]*touchStartXRef\.current = e\.touches\[0\]\.clientX;[\s\S]*touchEndXRef\.current = e\.touches\[0\]\.clientX;/,
    );
    expect(touchMoveBlock).toMatch(
      /if \(ignoreChatSwipeRef\.current\) \{[\s\S]*return;[\s\S]*\}/,
    );
    expect(touchEndBlock).toMatch(
      /if \(ignoreChatSwipeRef\.current\) \{[\s\S]*ignoreChatSwipeRef\.current = false;[\s\S]*touchStartXRef\.current = 0;[\s\S]*touchEndXRef\.current = 0;[\s\S]*return;[\s\S]*\}/,
    );
    expect(touchEndBlock).toMatch(
      /if \(!isCompactScreen\) return;[\s\S]*const swipeDistance = touchEndXRef\.current - touchStartXRef\.current;[\s\S]*if \(swipeDistance > minSwipeDistance\) \{[\s\S]*navigate\(Path\.Home\);/,
    );
  });

  test("keeps composer attachment left-swipe delete affordance non-destructive", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const swipeMoveBlock = readFunctionBlock(
      chat,
      "const handleAttachmentTouchMove = (",
    );
    const swipeActiveItemBlock = readCssBlock(
      chatStyles,
      '.attach-item[data-swipe-delete-active="true"]',
    );
    const swipeActiveMaskBlock = readCssBlock(
      chatStyles,
      '.attach-item[data-swipe-delete-active="true"] .attach-image-mask',
    );
    const swipeActiveDeleteBlock = readCssBlock(
      chatStyles,
      '.attach-item[data-swipe-delete-active="true"] .delete-image',
    );

    expect(chat).toContain("const ATTACHMENT_SWIPE_DELETE_THRESHOLD = 36;");
    expect(chat).toContain(
      "const attachmentSwipeStartRef = useRef<AttachmentSwipeStart | null>(null);",
    );
    expect(chat).toContain(
      "const [activeAttachmentDeleteKey, setActiveAttachmentDeleteKey] =",
    );
    expect(chat).toContain("function getAttachmentSwipeKey(");
    expect(chat).toContain("type ClearAttachmentDeleteOptions = {");
    expect(chat).toContain("data-attachment-swipe-key=");
    expect(chat).toMatch(
      /const canAttachmentStripScrollWithSwipe = useCallback\([\s\S]*const attachmentContainer = attachmentsContainerRef\.current;[\s\S]*const maxScrollLeft = Math\.max\([\s\S]*attachmentContainer\.scrollWidth - attachmentContainer\.clientWidth[\s\S]*if \(maxScrollLeft <= 1\) return false;[\s\S]*if \(deltaX < 0\) \{[\s\S]*return attachmentContainer\.scrollLeft < maxScrollLeft - 1;[\s\S]*\}[\s\S]*if \(deltaX > 0\) \{[\s\S]*return attachmentContainer\.scrollLeft > 1;[\s\S]*\}/,
    );
    expect(chat).toMatch(
      /const armAttachmentDelete = useCallback\([\s\S]*activeAttachmentDeleteKeyRef\.current = attachmentKey;[\s\S]*setActiveAttachmentDeleteKey\(attachmentKey\);[\s\S]*querySelector<HTMLButtonElement>\(\s*`button\.\$\{styles\["delete-image"\]\}`,\s*\)[\s\S]*deleteButton\?\.focus\(\{ preventScroll: true \}\);/,
    );
    expect(chat).toMatch(
      /const clearActiveAttachmentDelete = useCallback\(\s*\(options: ClearAttachmentDeleteOptions = \{\}\) => \{[\s\S]*const activeKey = activeAttachmentDeleteKeyRef\.current;[\s\S]*activeAttachmentDeleteKeyRef\.current = null;[\s\S]*setActiveAttachmentDeleteKey\(null\);[\s\S]*if \(!options\.restoreFocus \|\| !activeKey\) return;[\s\S]*querySelector<HTMLElement>\(\s*`\[data-attachment-swipe-key="\$\{activeKey\}"\]`,\s*\)[\s\S]*querySelector<HTMLButtonElement>\(\s*`button\.\$\{styles\["attach-image"\]\}, button\.\$\{styles\["attach-file"\]\}`,\s*\)[\s\S]*editButton\.focus\(\{ preventScroll: true \}\);[\s\S]*deleteButton\?\.blur\(\);[\s\S]*\}, \[\]\);/,
    );
    expect(chat).toMatch(
      /useEffect\(\(\) => \{[\s\S]*if \(attachImages\.length > 0 \|\| attachedFiles\.length > 0\) return;[\s\S]*clearActiveAttachmentDelete\(\);[\s\S]*\}, \[attachImages\.length, attachedFiles\.length, clearActiveAttachmentDelete\]\);/,
    );
    expect(chat).toMatch(
      /const handleAttachmentTouchStart = \([\s\S]*attachmentKey: string,[\s\S]*event: React\.TouchEvent<HTMLElement>[\s\S]*attachmentSwipeStartRef\.current = \{[\s\S]*key: attachmentKey,[\s\S]*x: touch\.clientX,[\s\S]*y: touch\.clientY,/,
    );
    expect(swipeMoveBlock).toMatch(
      /const deltaX = touch\.clientX - swipeStart\.x;[\s\S]*const deltaY = touch\.clientY - swipeStart\.y;/,
    );
    expect(swipeMoveBlock).toMatch(
      /if \(Math\.abs\(deltaY\) > Math\.abs\(deltaX\)\) \{[\s\S]*return;[\s\S]*\}/,
    );
    expect(swipeMoveBlock).toMatch(
      /if \(deltaX < -ATTACHMENT_SWIPE_DELETE_THRESHOLD\) \{[\s\S]*armAttachmentDelete\(attachmentKey, event\.currentTarget\);[\s\S]*return;[\s\S]*\}/,
    );
    expect(swipeMoveBlock).toMatch(
      /if \(\s*deltaX > ATTACHMENT_SWIPE_DELETE_THRESHOLD \/\s*2 &&[\s\S]*activeAttachmentDeleteKeyRef\.current === attachmentKey[\s\S]*\) \{[\s\S]*clearActiveAttachmentDelete\(\{ restoreFocus: true \}\);[\s\S]*\}/,
    );
    expect(swipeMoveBlock).toMatch(
      /if \(canAttachmentStripScrollWithSwipe\(deltaX\)\) \{[\s\S]*return;[\s\S]*\}/,
    );
    expect(swipeMoveBlock).not.toContain("setAttachImages(");
    expect(swipeMoveBlock).not.toContain("setAttachedFiles(");
    expect(swipeMoveBlock).not.toContain("deleteAttachedFile(");
    expect(chat).toMatch(
      /const handleAttachmentTouchEnd = useCallback\(\(\) => \{[\s\S]*attachmentSwipeStartRef\.current = null;[\s\S]*\}, \[\]\);/,
    );
    expect(chat).toMatch(
      /data-swipe-delete-active=\{[\s\S]*activeAttachmentDeleteKey ===[\s\S]*getAttachmentSwipeKey\("image", index\)[\s\S]*\? "true"[\s\S]*: undefined[\s\S]*\}/,
    );
    expect(chat).toMatch(
      /data-attachment-swipe-key=\{\s*getAttachmentSwipeKey\(\s*"image",\s*index,\s*\)\s*\}/,
    );
    expect(chat).toMatch(
      /handleAttachmentTouchStart\(\s*getAttachmentSwipeKey\("image", index\),\s*event,\s*\)/,
    );
    expect(chat).toMatch(
      /handleAttachmentTouchMove\(\s*getAttachmentSwipeKey\("image", index\),\s*event,\s*\)/,
    );
    expect(chat).toMatch(
      /onTouchEnd=\{handleAttachmentTouchEnd\}/,
    );
    expect(chat).toMatch(
      /data-swipe-delete-active=\{[\s\S]*activeAttachmentDeleteKey ===[\s\S]*getAttachmentSwipeKey\("file", index\)[\s\S]*\? "true"[\s\S]*: undefined[\s\S]*\}/,
    );
    expect(chat).toMatch(
      /data-attachment-swipe-key=\{\s*getAttachmentSwipeKey\(\s*"file",\s*index,\s*\)\s*\}/,
    );
    expect(chat).toMatch(
      /handleAttachmentTouchStart\(\s*getAttachmentSwipeKey\("file", index\),\s*event,\s*\)/,
    );
    expect(chat).toMatch(
      /handleAttachmentTouchMove\(\s*getAttachmentSwipeKey\("file", index\),\s*event,\s*\)/,
    );
    expect(chat).toMatch(
      /setAttachImages\([\s\S]*attachImages\.filter\(\(_, i\) => i !== index\),[\s\S]*\);[\s\S]*clearActiveAttachmentDelete\(\);[\s\S]*focusComposerAttachmentAfterRemoval\(index\);/,
    );
    expect(chat).toMatch(
      /function deleteAttachedFile\(index: number\) \{[\s\S]*setAttachedFiles\(attachedFiles\.filter\(\(_, i\) => i !== index\)\);[\s\S]*clearActiveAttachmentDelete\(\);[\s\S]*focusComposerAttachmentAfterRemoval\(attachImages\.length \+ index\);[\s\S]*\}/,
    );
    expect(swipeActiveItemBlock).toMatch(/z-index:\s*1;/);
    expect(swipeActiveMaskBlock).toMatch(/opacity:\s*1;/);
    expect(swipeActiveMaskBlock).toMatch(/background:/);
    expect(swipeActiveDeleteBlock).toMatch(/transform:\s*scale\(1\.06\);/);
    expect(swipeActiveDeleteBlock).toMatch(/box-shadow:/);
    expect(chatStyles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.attach-item\[data-swipe-delete-active="true"\] \.delete-image[\s\S]*transition-duration:\s*0\.01ms !important;[\s\S]*transform:\s*none !important;/,
    );
  });

  test("keeps clear-context divider as a Gemini-style reversible status chip", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const mobileStyles = chatStyles.slice(
      chatStyles.indexOf("@media only screen and (max-width: 600px)"),
    );
    const narrowMobileStyles = chatStyles.slice(
      chatStyles.indexOf("@media only screen and (max-width: 358px)"),
    );
    const reducedMotionBlock = chatStyles.slice(
      chatStyles.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    const clearContextBlock = readCssBlock(chatStyles, ".clear-context");
    const clearContextRootDeclarations =
      readRootDeclarations(clearContextBlock);
    const clearContextStatusBlock = readCssBlock(
      chatStyles,
      ".clear-context-status",
    );
    const clearContextMarkBlock = readCssBlock(
      chatStyles,
      ".clear-context-mark",
    );
    const clearContextTipsBlock = readCssBlock(
      chatStyles,
      ".clear-context-tips",
    );
    const clearContextRevertBlock = readCssBlock(
      chatStyles,
      ".clear-context-revert-btn",
    );
    const darkClearContextBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .clear-context",
    );
    const autoDarkClearContextSelector =
      ":global(body:not(.light)) .clear-context";
    const autoDarkClearContextSelectorIndex = chatStyles.indexOf(
      autoDarkClearContextSelector,
    );
    const autoDarkClearContextMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkClearContextSelectorIndex,
    );
    const autoDarkClearContextBlock = readCssBlock(
      chatStyles.slice(autoDarkClearContextMediaIndex),
      autoDarkClearContextSelector,
    );
    const mobileClearContextBlock = readCssBlock(
      mobileStyles,
      ".clear-context",
    );
    const narrowMobileClearContextBlock = readCssBlock(
      narrowMobileStyles,
      ".clear-context",
    );
    const clearContextToneScope = [
      clearContextRootDeclarations,
      clearContextBlock,
      clearContextMarkBlock,
      clearContextRevertBlock,
      darkClearContextBlock,
      autoDarkClearContextBlock,
    ].join("\n");
    const legacyClearContextPaint =
      /#8ab4f8|rgba\((?:248,\s*251,\s*255,\s*0\.78|241,\s*246,\s*255,\s*0\.94|248,\s*250,\s*255,\s*0\.9|60,\s*64,\s*67,\s*(?:0\.05|0\.08|0\.1|0\.78)|66,\s*133,\s*244,\s*(?:0\.08|0\.1|0\.24|0\.72)|25,\s*103,\s*210,\s*0\.08|32,\s*33,\s*36,\s*(?:0\.72|0\.88)|40,\s*43,\s*48,\s*0\.92|232,\s*234,\s*237,\s*(?:0\.1|0\.72)|138,\s*180,\s*248,\s*(?:0\.08|0\.12|0\.24)|0,\s*0,\s*0,\s*(?:0\.16|0\.22|0\.24))\)/;

    expect(chat).toContain("React.forwardRef<HTMLButtonElement>");
    expect(chat).toContain("function ClearContextDivider(_, ref)");
    expect(chat).toContain("ref={ref}");
    expect(chat).toMatch(
      /aria-label=\{`\$\{Locale\.Context\.Clear\}，\$\{Locale\.Context\.Revert\}`\}/,
    );
    expect(chat).toContain("title={Locale.Context.Revert}");
    expect(chat).toContain('styles["clear-context-status"]');
    expect(chat).toContain('styles["clear-context-mark"]');
    expect(chat).toContain('aria-hidden="true"');
    expect(chat).toContain('styles["clear-context-tips"]');
    expect(chat).toContain('styles["clear-context-revert-btn"]');
    expect(chat).toMatch(
      /chatStore\.updateTargetSession\(\s*session,\s*\(session\) => \(session\.clearContextIndex = undefined\),\s*\)/,
    );
    expect(chat).toMatch(
      /text=\{Locale\.Chat\.InputActions\.Clear\}[\s\S]*session\.clearContextIndex = session\.messages\.length;[\s\S]*requestAnimationFrame\(\(\) => props\.scrollToBottom\(\)\);[\s\S]*completeMobileAction\(\);/,
    );
    expect(chat).toMatch(
      /const clearContextScrollKeyRef = useRef<string \| null>\(null\);/,
    );
    expect(chat).toMatch(
      /const clearContextDividerRef = useRef<HTMLButtonElement>\(null\);/,
    );
    expect(chat).toMatch(
      /const chatInputPanelRef = useRef<HTMLDivElement>\(null\);/,
    );
    expect(chat).toMatch(/ref=\{chatInputPanelRef\}/);
    expect(chat).toMatch(
      /divider\.scrollIntoView\(\{\s*block: "end",\s*inline: "nearest",\s*\}\);/,
    );
    expect(chat).toContain(
      "const getClearContextBottomInset = useCallback(() => {",
    );
    expect(chat).toContain("const inputPanel = chatInputPanelRef.current;");
    expect(chat).toContain("scrollRect.bottom - inputPanelRect.top + 40");
    expect(chat).toContain("return Math.max(118, inputPanelOverlap);");
    expect(chat).toContain(
      "const isClearContextDividerSafelyVisible = useCallback(() => {",
    );
    expect(chat).toContain("const bottomInset = getClearContextBottomInset();");
    expect(chat).toContain(
      "dividerRect.bottom <= scrollRect.bottom - bottomInset",
    );
    expect(chat).toContain("}, [getClearContextBottomInset, scrollRef]);");
    expect(chat).toMatch(
      /const dividerOverflow =\s*dividerRect\.bottom - \(scrollRect\.bottom - bottomInset\);[\s\S]*scrollDom\.scrollTo\(0, scrollDom\.scrollTop \+ dividerOverflow\);/,
    );
    expect(chat).toMatch(
      /if \(clearContextScrollKeyRef\.current === clearContextScrollKey\) \{\s*return;\s*\}/,
    );
    expect(chat).not.toContain(
      "clearContextScrollKeyRef.current === clearContextScrollKey &&",
    );
    expect(chat).toMatch(
      /useLayoutEffect\(\(\) => \{\s*const sourceClearContextIndex = session\.clearContextIndex \?\? -1;[\s\S]*if \(sourceClearContextIndex < 0\) \{[\s\S]*clearContextScrollKeyRef\.current = null;[\s\S]*return;[\s\S]*const clearContextScrollKey = `\$\{session\.id\}:\$\{sourceClearContextIndex\}`;[\s\S]*if \(clearContextScrollKeyRef\.current === clearContextScrollKey\) \{[\s\S]*return;[\s\S]*clearContextScrollKeyRef\.current = clearContextScrollKey;[\s\S]*let revealFrame = 0;[\s\S]*const scrollFrame = requestAnimationFrame\(\(\) => \{[\s\S]*scrollToBottom\(\);[\s\S]*revealFrame = requestAnimationFrame\(\(\) => \{[\s\S]*scrollClearContextDividerIntoView\(\);[\s\S]*\}\);[\s\S]*return \(\) => \{[\s\S]*cancelAnimationFrame\(scrollFrame\);[\s\S]*if \(revealFrame\) cancelAnimationFrame\(revealFrame\);[\s\S]*\};[\s\S]*\}, \[[\s\S]*scrollClearContextDividerIntoView,[\s\S]*scrollToBottom,[\s\S]*session\.clearContextIndex,[\s\S]*session\.id,[\s\S]*\]\);/,
    );
    expect(chat).toMatch(
      /const revealClearContextAfterResize = \(\) => \{[\s\S]*if \(!isClearContextDividerSafelyVisible\(\)\) \{[\s\S]*scrollClearContextDividerIntoView\(\);[\s\S]*window\.addEventListener\("resize", revealClearContextAfterResize\);[\s\S]*window\.removeEventListener\("resize", revealClearContextAfterResize\);/,
    );
    expect(chat).toMatch(
      /const inputPanelResizeObserver =\s*typeof ResizeObserver !== "undefined" && chatInputPanelRef\.current\s*\? new ResizeObserver\(revealClearContextAfterResize\)\s*: undefined;[\s\S]*inputPanelResizeObserver\?\.observe\(chatInputPanelRef\.current\);[\s\S]*inputPanelResizeObserver\?\.disconnect\(\);/,
    );
    expect(chat).toMatch(
      /const shouldShowClearContextDivider =\s*i === clearContextIndex - 1;/,
    );
    expect(chat).toMatch(
      /\{shouldShowClearContextDivider && \(\s*<ClearContextDivider ref=\{clearContextDividerRef\} \/>\s*\)\}/,
    );
    expect(chatStyles).not.toContain("mask-image");
    expect(clearContextBlock).toMatch(/appearance:\s*none;/);
    expect(clearContextBlock).toMatch(/align-self:\s*center;/);
    expect(clearContextBlock).toMatch(
      /width:\s*min\(520px,\s*calc\(100% - 32px\)\);/,
    );
    expect(clearContextBlock).toMatch(/display:\s*inline-flex;/);
    expect(clearContextBlock).toMatch(/gap:\s*10px;/);
    expect(clearContextBlock).toMatch(/border-radius:\s*999px;/);
    expect(clearContextBlock).toMatch(/scroll-margin-bottom:\s*96px;/);
    expect(clearContextRootDeclarations).toMatch(
      /--clear-context-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 78%,\s*transparent\);/,
    );
    expect(clearContextRootDeclarations).toMatch(
      /--clear-context-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 78%,\s*transparent\);/,
    );
    expect(clearContextRootDeclarations).toMatch(
      /--clear-context-border-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 16%,\s*transparent\);/,
    );
    expect(clearContextRootDeclarations).toMatch(
      /--clear-context-hover-background:\s*color-mix\(in srgb,\s*var\(--primary\) 8%,\s*var\(--surface-elevated\)\);/,
    );
    expect(clearContextBlock).toMatch(
      /border:\s*1px solid var\(--clear-context-border-color\);/,
    );
    expect(clearContextBlock).toMatch(
      /background:\s*var\(--clear-context-background\);/,
    );
    expect(clearContextBlock).toMatch(
      /color:\s*var\(--clear-context-color\);/,
    );
    expect(clearContextBlock).toMatch(
      /box-shadow:[\s\S]*0 10px 24px var\(--clear-context-soft-shadow-color\)/,
    );
    expect(clearContextBlock).toMatch(
      /&:hover,\s*&:focus-visible\s*\{[\s\S]*border-color:\s*var\(--clear-context-hover-border-color\);[\s\S]*background:\s*var\(--clear-context-hover-background\);[\s\S]*color:\s*var\(--clear-context-hover-color\);/,
    );
    expect(clearContextBlock).toMatch(
      /&:hover,\s*&:focus-visible\s*\{[\s\S]*0 12px 28px var\(--clear-context-hover-shadow-color\)/,
    );
    expect(clearContextBlock).toMatch(/overflow-wrap:\s*anywhere;/);
    expect(clearContextBlock).toMatch(/&:focus-visible/);
    expect(clearContextBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(clearContextBlock).toMatch(
      /&:focus-visible\s*\{[\s\S]*var\(--focus-ring-shadow\),[\s\S]*0 12px 28px var\(--clear-context-hover-shadow-color\)/,
    );
    expect(clearContextBlock).not.toMatch(/border-top:/);
    expect(clearContextBlock).not.toMatch(/border-bottom:/);
    expect(clearContextBlock).not.toMatch(
      /box-shadow:\s*var\(--card-shadow\) inset/,
    );
    expect(clearContextStatusBlock).toMatch(/display:\s*inline-flex;/);
    expect(clearContextStatusBlock).toMatch(/min-width:\s*0;/);
    expect(clearContextMarkBlock).toMatch(/width:\s*6px;/);
    expect(clearContextMarkBlock).toMatch(/height:\s*6px;/);
    expect(clearContextMarkBlock).toMatch(/border-radius:\s*999px;/);
    expect(clearContextMarkBlock).toMatch(
      /background:\s*var\(--clear-context-mark-background\);/,
    );
    expect(clearContextMarkBlock).toMatch(
      /box-shadow:\s*0 0 0 4px var\(--clear-context-mark-ring-color\);/,
    );
    expect(clearContextTipsBlock).toMatch(/font-weight:\s*500;/);
    expect(clearContextTipsBlock).toMatch(/overflow-wrap:\s*anywhere;/);
    expect(clearContextRevertBlock).toMatch(
      /color:\s*var\(--clear-context-revert-color\);/,
    );
    expect(clearContextRevertBlock).toMatch(
      /background:\s*var\(--clear-context-revert-background\);/,
    );
    expect(clearContextRevertBlock).toMatch(/font-weight:\s*600;/);
    expect(clearContextRevertBlock).not.toMatch(/position:\s*absolute;/);
    expect(clearContextRevertBlock).not.toMatch(/opacity:\s*0;/);
    expect(darkClearContextBlock).toMatch(
      /--clear-context-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 72%,\s*transparent\);/,
    );
    expect(darkClearContextBlock).toMatch(
      /--clear-context-hover-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 92%,\s*var\(--surface\)\);/,
    );
    expect(darkClearContextBlock).toMatch(
      /--clear-context-revert-color:\s*color-mix\(in srgb,\s*var\(--primary\) 42%,\s*var\(--black\)\);/,
    );
    expect(autoDarkClearContextSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkClearContextMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkClearContextBlock).toMatch(
      /--clear-context-hover-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 92%,\s*var\(--surface\)\);/,
    );
    expect(clearContextToneScope).not.toMatch(legacyClearContextPaint);
    expect(mobileClearContextBlock).toMatch(
      /width:\s*min\(100%,\s*calc\(100% - 24px\)\);/,
    );
    expect(mobileClearContextBlock).toMatch(/justify-content:\s*flex-start;/);
    expect(mobileClearContextBlock).toMatch(
      /scroll-margin-bottom:\s*calc\(118px \+ env\(safe-area-inset-bottom\)\);/,
    );
    expect(narrowMobileClearContextBlock).toMatch(
      /margin-bottom:\s*calc\(88px \+ env\(safe-area-inset-bottom\)\);/,
    );
    expect(reducedMotionBlock).toContain(".clear-context");
    expect(reducedMotionBlock).toMatch(
      /\.clear-context,\s*\.clear-context:hover,\s*\.clear-context:active\s*\{[\s\S]*transform:\s*none !important;[\s\S]*transition-duration:\s*0\.01ms !important;/,
    );
  });

  test("keeps Gemini-style markdown code block chrome", () => {
    const markdown = read("app/components/markdown.tsx");
    const markdownStyles = read("app/styles/markdown.scss");
    const globalStyles = read("app/styles/globals.scss");
    const globalLightMixinBlock = readCssBlock(globalStyles, "@mixin light");
    const globalDarkMixinBlock = readCssBlock(globalStyles, "@mixin dark");
    const globalAutoDarkRootBlock = readCssBlock(
      readCssBlock(globalStyles, "@media (prefers-color-scheme: dark)"),
      ":root",
    );
    const lightMixinBlock = readCssBlock(markdownStyles, "@mixin light");
    const darkMixinBlock = readCssBlock(markdownStyles, "@mixin dark");
    const autoDarkRootBlock = readCssBlock(
      readCssBlock(markdownStyles, "@media (prefers-color-scheme: dark)"),
      ":root",
    );
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
    const copyButtonCopiedBlock = readCssBlock(
      copyButtonBlock,
      '&[data-copy-state="copied"]',
    );
    const copyButtonStatusBlock = readCssBlock(
      globalPreBlock,
      ".copy-code-status",
    );
    const focusVisibleBlock = readCssBlock(copyButtonBlock, "&:focus-visible");
    const darkCopyButtonBlock = readCssBlock(
      globalStyles,
      ".dark pre .copy-code-button",
    );
    const darkCopyButtonCopiedBlock = readCssBlock(
      darkCopyButtonBlock,
      '&[data-copy-state="copied"]',
    );
    const copyButtonCopiedToneScope = [
      copyButtonCopiedBlock,
      darkCopyButtonCopiedBlock,
    ].join("\n");
    const legacyCopyButtonCopiedPaint =
      /rgba\((?:52,\s*168,\s*83|24,\s*128,\s*56|129,\s*201,\s*149)/;
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
    const codeScrollFadeBlock = readCssBlock(
      markdownStyles,
      ".markdown-code-scroll-fade",
    );
    const codeScrollFadeStartBlock = readCssBlock(
      markdownStyles,
      ".markdown-code-scroll-fade-start",
    );
    const codeScrollFadeEndBlock = readCssBlock(
      markdownStyles,
      ".markdown-code-scroll-fade-end",
    );
    const darkPreBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body .highlight pre,\n.dark .markdown-body pre",
    );
    const darkLanguageLabelBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-code-language",
    );
    const labeledCodeBlock = readCssBlock(
      markdownStyles,
      ".markdown-body pre.markdown-code-block-labeled",
    );
    const showHideButtonBlock = readCssBlock(
      markdownStyles,
      ".markdown-body pre .show-hide-button",
    );
    const showHideActionBlock = readCssBlock(showHideButtonBlock, "button");
    const darkShowHideButtonBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body pre .show-hide-button",
    );
    const codeFoldToneScope = [
      showHideActionBlock,
      darkShowHideButtonBlock,
      lightMixinBlock.match(
        /--markdown-code-fold-hover-border-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      lightMixinBlock.match(
        /--markdown-code-fold-hover-background:[\s\S]*?var\(--surface-elevated\)\s*\);/,
      )?.[0] ?? "",
      lightMixinBlock.match(
        /--markdown-code-fold-hover-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      lightMixinBlock.match(
        /--markdown-code-fold-hover-shadow-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-code-fold-hover-border-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-code-fold-hover-background:[\s\S]*?var\(--surface-soft\)\s*\);/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-code-fold-hover-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-code-fold-hover-shadow-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
    ].join("\n");
    const reducedMotionBlock = markdownStyles.slice(
      markdownStyles.lastIndexOf("@media (prefers-reduced-motion: reduce)"),
    );

    expect(markdown).toContain("function getCodeLanguage");
    expect(markdown).toContain("formatCodeLanguage");
    expect(markdown).toContain("const [codeScrollHint, setCodeScrollHint]");
    expect(markdown).toMatch(
      /const getCodeScrollElement = useCallback\([\s\S]*\(\) => ref\.current\?\.querySelector\("code"\) as HTMLElement \| null/,
    );
    expect(markdown).toMatch(
      /const syncCodeScrollHint = useCallback\(\(\) => \{[\s\S]*const codeScroller = getCodeScrollElement\(\) \?\? ref\.current;[\s\S]*const maxScrollLeft = Math\.max\([\s\S]*codeScroller\.scrollWidth - codeScroller\.clientWidth[\s\S]*start: codeScroller\.scrollLeft > 1,[\s\S]*end: maxScrollLeft - codeScroller\.scrollLeft > 1,/,
    );
    expect(markdown).toMatch(
      /let codeResizeObserver: ResizeObserver \| null = null;[\s\S]*typeof ResizeObserver !== "undefined"[\s\S]*codeResizeObserver = new ResizeObserver\(\(\) => \{[\s\S]*syncCodeScrollHint\(\);[\s\S]*codeResizeObserver\.observe\(codeScroller\)/,
    );
    expect(markdown).toMatch(
      /codeScroller\.addEventListener\("scroll", syncCodeScrollHint, \{\s*passive: true,?\s*\}\)/,
    );
    expect(markdown).toContain("const codeBlockId = useId()");
    expect(markdown).toContain("markdown-code-block-labeled");
    expect(markdown).toContain('className="markdown-code-language"');
    expect(markdown).toContain("{codeLanguage}");
    expect(markdown).toContain("CopyIcon");
    expect(markdown).toContain("ConfirmIcon");
    expect(markdown).toContain("const [copied, setCopied] = useState(false)");
    expect(markdown).toContain("copyResetTimerRef");
    expect(markdown).toContain("const codeCopyLabel = codeLanguage");
    expect(markdown).toContain("aria-label={codeCopyLabel}");
    expect(markdown).toContain('aria-live="polite"');
    expect(markdown).toContain('aria-atomic="true"');
    expect(markdown).toContain("title={codeCopyLabel}");
    expect(markdown).toContain('className="copy-code-status"');
    expect(markdown).toContain('role="status"');
    expect(markdown).toContain('{copied ? codeCopyLabel : ""}');
    expect(markdown).toContain('data-copy-state={copied ? "copied" : "idle"}');
    expect(markdown).toContain("id={codeBlockId}");
    expect(markdown).toContain("aria-controls={codeBlockId}");
    expect(markdown).toContain("aria-expanded={!collapsed}");
    expect(markdown).toContain("aria-label={Locale.NewChat.CodeBlockExpand}");
    expect(lightMixinBlock).toMatch(
      /--markdown-code-fold-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 24%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-code-fold-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 8%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-code-fold-hover-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 94%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-code-fold-hover-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 10%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-code-fold-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 28%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-code-fold-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 14%,\s*var\(--surface-soft\)\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-code-fold-hover-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 92%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-code-fold-hover-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 12%,\s*transparent\s*\);/,
    );
    expect(autoDarkRootBlock).toMatch(/@include dark;/);
    expect(globalLightMixinBlock).toMatch(
      /--copy-success-border-color:\s*color-mix\(\s*in srgb,\s*rgb\(52,\s*168,\s*83\) 24%,\s*transparent\s*\);/,
    );
    expect(globalLightMixinBlock).toMatch(
      /--copy-success-background:\s*color-mix\(\s*in srgb,\s*rgb\(52,\s*168,\s*83\) 12%,\s*transparent\s*\);/,
    );
    expect(globalLightMixinBlock).toMatch(
      /--copy-success-color:\s*color-mix\(\s*in srgb,\s*rgb\(24,\s*128,\s*56\) 94%,\s*transparent\s*\);/,
    );
    expect(globalLightMixinBlock).toMatch(
      /--copy-success-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 10%,\s*transparent\s*\);/,
    );
    expect(globalLightMixinBlock).toMatch(
      /--copy-success-accent-shadow-color:\s*color-mix\(\s*in srgb,\s*rgb\(52,\s*168,\s*83\) 12%,\s*transparent\s*\);/,
    );
    expect(globalLightMixinBlock).toMatch(
      /--markdown-code-copy-success-border-color:\s*var\(--copy-success-border-color\);/,
    );
    expect(globalLightMixinBlock).toMatch(
      /--markdown-code-copy-success-background:\s*var\(--copy-success-background\);/,
    );
    expect(globalLightMixinBlock).toMatch(
      /--markdown-code-copy-success-color:\s*var\(--copy-success-color\);/,
    );
    expect(globalLightMixinBlock).toMatch(
      /--markdown-code-copy-success-shadow-color:\s*var\(--copy-success-shadow-color\);/,
    );
    expect(globalLightMixinBlock).toMatch(
      /--markdown-code-copy-success-accent-shadow-color:\s*var\(--copy-success-accent-shadow-color\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--copy-success-border-color:\s*color-mix\(\s*in srgb,\s*rgb\(129,\s*201,\s*149\) 24%,\s*transparent\s*\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--copy-success-background:\s*color-mix\(\s*in srgb,\s*rgb\(129,\s*201,\s*149\) 14%,\s*transparent\s*\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--copy-success-color:\s*color-mix\(\s*in srgb,\s*rgb\(129,\s*201,\s*149\) 96%,\s*transparent\s*\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--copy-success-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--surface\) 24%,\s*transparent\s*\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--copy-success-accent-shadow-color:\s*color-mix\(\s*in srgb,\s*rgb\(129,\s*201,\s*149\) 12%,\s*transparent\s*\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--markdown-code-copy-success-border-color:\s*var\(--copy-success-border-color\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--markdown-code-copy-success-background:\s*var\(--copy-success-background\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--markdown-code-copy-success-color:\s*var\(--copy-success-color\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--markdown-code-copy-success-shadow-color:\s*var\(--copy-success-shadow-color\);/,
    );
    expect(globalDarkMixinBlock).toMatch(
      /--markdown-code-copy-success-accent-shadow-color:\s*var\(--copy-success-accent-shadow-color\);/,
    );
    expect(globalAutoDarkRootBlock).toMatch(/@include dark;/);
    expect(markdown).toMatch(
      /className=\{clsx\([\s\S]*"markdown-code-block"[\s\S]*\)\}[\s\S]*data-overflow-start=\{codeScrollHint\.start \? "true" : "false"\}[\s\S]*data-overflow-end=\{codeScrollHint\.end \? "true" : "false"\}[\s\S]*onScroll=\{syncCodeScrollHint\}/,
    );
    expect(markdown).toMatch(
      /\{codeScrollHint\.start && \([\s\S]*className="markdown-code-scroll-fade markdown-code-scroll-fade-start"/,
    );
    expect(markdown).toMatch(
      /\{codeScrollHint\.end && \([\s\S]*className="markdown-code-scroll-fade markdown-code-scroll-fade-end"/,
    );
    expect(preBlock).toMatch(
      /--markdown-code-edge-surface:\s*rgba\(248,\s*249,\s*250,\s*0\.94\);/,
    );
    expect(preBlock).toMatch(/--markdown-code-block-radius:\s*8px;/);
    expect(preBlock).toMatch(/--markdown-code-block-padding-y:\s*14px;/);
    expect(preBlock).toMatch(/--markdown-code-block-padding-start:\s*16px;/);
    expect(preBlock).toMatch(/--markdown-code-action-rail-width:\s*64px;/);
    expect(preBlock).toMatch(/--markdown-code-action-inset:\s*12px;/);
    expect(preBlock).toMatch(/--markdown-code-action-size:\s*34px;/);
    expect(preBlock).toMatch(/--markdown-code-labeled-padding-top:\s*52px;/);
    expect(preBlock).toMatch(/--markdown-code-fold-overlay-offset:\s*68px;/);
    expect(preBlock).toMatch(
      /padding:\s*var\(--markdown-code-block-padding-y\)\s*var\(--markdown-code-action-rail-width\)\s*var\(--markdown-code-block-padding-y\)\s*var\(--markdown-code-block-padding-start\);/,
    );
    expect(preBlock).toMatch(/overscroll-behavior-x:\s*contain;/);
    expect(preBlock).toMatch(/scrollbar-width:\s*thin;/);
    expect(preBlock).toMatch(
      /border-radius:\s*var\(--markdown-code-block-radius\);/,
    );
    expect(labeledCodeBlock).toMatch(
      /padding-top:\s*var\(--markdown-code-labeled-padding-top\);/,
    );
    expect(labeledCodeBlock).toMatch(
      /scroll-padding-top:\s*var\(--markdown-code-labeled-padding-top\);/,
    );
    expect(languageLabelBlock).toMatch(/position:\s*absolute;/);
    expect(languageLabelBlock).toMatch(
      /max-width:\s*calc\(\s*100%\s*-\s*var\(--markdown-code-action-rail-width\)\s*-\s*var\(--markdown-code-block-padding-start\)\s*\);/,
    );
    expect(languageLabelBlock).toMatch(/overflow:\s*hidden;/);
    expect(languageLabelBlock).toMatch(/text-overflow:\s*ellipsis;/);
    expect(languageLabelBlock).toMatch(/white-space:\s*nowrap;/);
    expect(languageLabelBlock).toMatch(
      /right:\s*calc\(\s*var\(--markdown-code-action-inset\)\s*\+\s*var\(--markdown-code-action-size\)\s*\+\s*6px\s*\);/,
    );
    expect(languageLabelBlock).toMatch(
      /top:\s*var\(--markdown-code-action-inset\);/,
    );
    expect(languageLabelBlock).toMatch(/z-index:\s*2;/);
    expect(languageLabelBlock).toMatch(/pointer-events:\s*none;/);
    expect(codeScrollFadeBlock).toMatch(/position:\s*absolute;/);
    expect(codeScrollFadeBlock).toMatch(/top:\s*0;/);
    expect(codeScrollFadeBlock).toMatch(/bottom:\s*0;/);
    expect(codeScrollFadeBlock).toMatch(/pointer-events:\s*none;/);
    expect(codeScrollFadeBlock).toMatch(/width:\s*28px;/);
    expect(codeScrollFadeBlock).toMatch(/z-index:\s*1;/);
    expect(codeScrollFadeStartBlock).toMatch(/linear-gradient\(\s*90deg/);
    expect(codeScrollFadeEndBlock).toMatch(/linear-gradient\(\s*270deg/);
    expect(showHideButtonBlock).toMatch(
      /bottom:\s*calc\(-1 \* var\(--markdown-code-block-padding-y\)\);/,
    );
    expect(showHideButtonBlock).toMatch(
      /margin:\s*calc\(-1 \* var\(--markdown-code-fold-overlay-offset\)\)\s*calc\(-1 \* var\(--markdown-code-action-rail-width\)\)\s*calc\(-1 \* var\(--markdown-code-block-padding-y\)\)\s*calc\(-1 \* var\(--markdown-code-block-padding-start\)\);/,
    );
    expect(showHideButtonBlock).toMatch(
      /padding:\s*36px var\(--markdown-code-block-padding-start\) 12px;/,
    );
    expect(darkPreBlock).toMatch(
      /--markdown-code-edge-surface:\s*rgba\(30,\s*30,\s*46,\s*0\.94\);/,
    );
    expect(darkPreBlock).toMatch(/background-color:\s*#1e1e2e;/);
    expect(darkPreBlock).toMatch(
      /border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.08\);/,
    );
    expect(darkLanguageLabelBlock).toMatch(
      /color:\s*rgba\(255,\s*255,\s*255,\s*0\.54\);/,
    );
    expect(copyButtonBlock).toMatch(
      /width:\s*var\(--markdown-code-action-size,\s*34px\);/,
    );
    expect(copyButtonBlock).toMatch(
      /height:\s*var\(--markdown-code-action-size,\s*34px\);/,
    );
    expect(copyButtonBlock).toMatch(
      /right:\s*var\(--markdown-code-action-inset,\s*12px\);/,
    );
    expect(copyButtonBlock).toMatch(
      /top:\s*var\(--markdown-code-action-inset,\s*12px\);/,
    );
    expect(copyButtonBlock).toMatch(/z-index:\s*3;/);
    expect(copyButtonBlock).toMatch(/pointer-events:\s*none;/);
    expect(copyButtonBlock).toMatch(/opacity:\s*0;/);
    expect(copyButtonBlock).toMatch(/stroke:\s*currentColor !important;/);
    expect(copyButtonStatusBlock).toMatch(/position:\s*absolute;/);
    expect(copyButtonStatusBlock).toMatch(/width:\s*1px;/);
    expect(copyButtonStatusBlock).toMatch(/height:\s*1px;/);
    expect(copyButtonStatusBlock).toMatch(/overflow:\s*hidden;/);
    expect(copyButtonStatusBlock).toMatch(/clip:\s*rect\(0,\s*0,\s*0,\s*0\);/);
    expect(copyButtonStatusBlock).toMatch(/white-space:\s*nowrap;/);
    expect(copyButtonCopiedBlock).toMatch(/pointer-events:\s*all;/);
    expect(copyButtonCopiedBlock).toMatch(/opacity:\s*1;/);
    expect(copyButtonCopiedBlock).toMatch(/transform:\s*translateY\(0\);/);
    expect(copyButtonCopiedBlock).toMatch(
      /border-color:\s*var\(--markdown-code-copy-success-border-color\);/,
    );
    expect(copyButtonCopiedBlock).toMatch(
      /background-color:\s*var\(--markdown-code-copy-success-background\);/,
    );
    expect(copyButtonCopiedBlock).toMatch(
      /color:\s*var\(--markdown-code-copy-success-color\);/,
    );
    expect(copyButtonCopiedBlock).toMatch(
      /0 1px 2px var\(--markdown-code-copy-success-shadow-color\),[\s\S]*0 8px 18px var\(--markdown-code-copy-success-accent-shadow-color\);/,
    );
    expect(copyButtonCopiedBlock).toContain("svg path");
    expect(copyButtonCopiedBlock).toMatch(/fill:\s*currentColor !important;/);
    expect(darkCopyButtonCopiedBlock).toMatch(
      /border-color:\s*var\(--markdown-code-copy-success-border-color\);/,
    );
    expect(darkCopyButtonCopiedBlock).toMatch(
      /background-color:\s*var\(--markdown-code-copy-success-background\);/,
    );
    expect(darkCopyButtonCopiedBlock).toMatch(
      /color:\s*var\(--markdown-code-copy-success-color\);/,
    );
    expect(darkCopyButtonCopiedBlock).toMatch(
      /0 1px 2px var\(--markdown-code-copy-success-shadow-color\),[\s\S]*0 8px 18px var\(--markdown-code-copy-success-accent-shadow-color\);/,
    );
    expect(copyButtonCopiedToneScope).not.toMatch(
      legacyCopyButtonCopiedPaint,
    );
    expect(desktopHoverBlock).toMatch(/pointer-events:\s*all;/);
    expect(desktopHoverBlock).toMatch(/opacity:\s*0\.72;/);
    expect(desktopHoverBlock).toMatch(/transform:\s*translateY\(0\);/);
    expect(focusVisibleBlock).toMatch(/pointer-events:\s*all;/);
    expect(focusVisibleBlock).toMatch(/opacity:\s*1;/);
    expect(focusVisibleBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(touchCopyButtonBlock).toMatch(/pointer-events:\s*all;/);
    expect(touchCopyButtonBlock).toMatch(/opacity:\s*1;/);
    expect(touchCopyButtonBlock).toMatch(/transform:\s*translateY\(0\);/);
    expect(showHideButtonBlock).toMatch(/position:\s*sticky;/);
    expect(showHideButtonBlock).toMatch(
      /bottom:\s*calc\(-1 \* var\(--markdown-code-block-padding-y\)\);/,
    );
    expect(showHideButtonBlock).toMatch(/pointer-events:\s*none;/);
    expect(showHideButtonBlock).toMatch(
      /background:\s*linear-gradient\(\s*180deg,\s*rgba\(248,\s*249,\s*250,\s*0\),\s*rgba\(248,\s*249,\s*250,\s*0\.96\)\s*58%\s*\);/,
    );
    expect(showHideActionBlock).toMatch(/pointer-events:\s*auto;/);
    expect(showHideActionBlock).toMatch(/border-radius:\s*999px;/);
    expect(showHideActionBlock).toMatch(/letter-spacing:\s*0;/);
    expect(showHideActionBlock).toMatch(/margin:\s*0;/);
    expect(showHideActionBlock).toMatch(/min-height:\s*32px;/);
    expect(showHideActionBlock).toMatch(
      /&:hover,\s*&:focus-visible[\s\S]*border-color:\s*var\(--markdown-code-fold-hover-border-color\);/,
    );
    expect(showHideActionBlock).toMatch(
      /&:hover,\s*&:focus-visible[\s\S]*background:\s*var\(--markdown-code-fold-hover-background\);/,
    );
    expect(showHideActionBlock).toMatch(
      /&:hover,\s*&:focus-visible[\s\S]*color:\s*var\(--markdown-code-fold-hover-color\);/,
    );
    expect(showHideActionBlock).toMatch(
      /&:hover,\s*&:focus-visible[\s\S]*0 10px 24px var\(--markdown-code-fold-hover-shadow-color\);/,
    );
    expect(showHideActionBlock).toMatch(
      /&:focus-visible[\s\S]*var\(--focus-ring-shadow\),[\s\S]*0 10px 24px var\(--markdown-code-fold-hover-shadow-color\);/,
    );
    expect(darkShowHideButtonBlock).toMatch(
      /background:\s*linear-gradient\(\s*180deg,\s*rgba\(30,\s*30,\s*46,\s*0\),\s*rgba\(30,\s*30,\s*46,\s*0\.96\)\s*58%\s*\);/,
    );
    expect(darkShowHideButtonBlock).toMatch(
      /&:hover,\s*&:focus-visible[\s\S]*border-color:\s*var\(--markdown-code-fold-hover-border-color\);/,
    );
    expect(darkShowHideButtonBlock).toMatch(
      /&:hover,\s*&:focus-visible[\s\S]*background:\s*var\(--markdown-code-fold-hover-background\);/,
    );
    expect(darkShowHideButtonBlock).toMatch(
      /&:hover,\s*&:focus-visible[\s\S]*color:\s*var\(--markdown-code-fold-hover-color\);/,
    );
    expect(darkShowHideButtonBlock).toMatch(
      /&:hover,\s*&:focus-visible[\s\S]*0 10px 24px var\(--markdown-code-fold-hover-shadow-color\);/,
    );
    expect(codeFoldToneScope).not.toMatch(
      /rgba\((?:66,\s*133,\s*244|138,\s*180,\s*248)|#(?:4285f4|8ab4f8)\b/,
    );
    expect(reducedMotionBlock).toContain(
      ".markdown-body pre .show-hide-button button",
    );
    expect(reducedMotionBlock).toMatch(
      /transition-duration:\s*0\.01ms !important;/,
    );
  });

  test("keeps Gemini-style markdown inline code pills", () => {
    const markdownStyles = read("app/styles/markdown.scss");
    const inlineCodeStyles = markdownStyles.slice(
      markdownStyles.lastIndexOf(".markdown-body code,\n.markdown-body tt"),
    );
    const inlineCodeBlock = readCssBlock(
      inlineCodeStyles,
      ".markdown-body code,\n.markdown-body tt",
    );
    const darkInlineCodeBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body code,\n.dark .markdown-body tt",
    );
    const preCodeBlock = readCssBlock(
      markdownStyles,
      ".markdown-body pre > code",
    );
    const darkPreCodeBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body pre code,\n.dark .markdown-body pre tt",
    );
    const delCodeBlock = readCssBlock(
      markdownStyles,
      ".markdown-body del code",
    );
    const darkDelCodeBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body del code",
    );
    const inlineCodeToneScope = [
      inlineCodeBlock,
      darkInlineCodeBlock,
    ].join("\n");

    expect(inlineCodeBlock).toMatch(/padding:\s*0\.12em 0\.36em;/);
    expect(inlineCodeBlock).toMatch(/line-height:\s*1\.55;/);
    expect(inlineCodeBlock).toMatch(/white-space:\s*break-spaces;/);
    expect(inlineCodeBlock).toMatch(
      /background:\s*color-mix\(in srgb,\s*var\(--primary\) 8%,\s*transparent\);/,
    );
    expect(inlineCodeBlock).toMatch(
      /border:\s*1px solid color-mix\(in srgb,\s*var\(--primary\) 12%,\s*transparent\);/,
    );
    expect(inlineCodeBlock).toMatch(/border-radius:\s*6px;/);
    expect(inlineCodeBlock).toMatch(/box-decoration-break:\s*clone;/);
    expect(inlineCodeBlock).toMatch(/-webkit-box-decoration-break:\s*clone;/);
    expect(darkInlineCodeBlock).toMatch(
      /background:\s*color-mix\(in srgb,\s*var\(--primary\) 16%,\s*transparent\);/,
    );
    expect(darkInlineCodeBlock).toMatch(
      /border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 28%,\s*transparent\);/,
    );
    expect(inlineCodeToneScope).not.toMatch(
      /(?:rgba?|hsla?|hwb|oklch|oklab|lch|lab|color|device-cmyk)\(|#[0-9a-fA-F]{3,8}\b/,
    );
    expect(preCodeBlock).toMatch(/padding:\s*0;/);
    expect(preCodeBlock).toMatch(/background:\s*transparent;/);
    expect(preCodeBlock).toMatch(/border:\s*0;/);
    expect(preCodeBlock).toMatch(/box-shadow:\s*none;/);
    expect(darkPreCodeBlock).toMatch(/background:\s*transparent;/);
    expect(darkPreCodeBlock).toMatch(/border:\s*0;/);
    expect(darkPreCodeBlock).toMatch(/box-shadow:\s*none;/);
    expect(delCodeBlock).toMatch(/text-decoration:\s*inherit;/);
    expect(delCodeBlock).toMatch(/background:\s*transparent;/);
    expect(delCodeBlock).toMatch(/border:\s*0;/);
    expect(delCodeBlock).toMatch(/line-height:\s*inherit;/);
    expect(darkDelCodeBlock).toMatch(/background:\s*transparent;/);
    expect(darkDelCodeBlock).toMatch(/border:\s*0;/);
  });

  test("keeps Gemini-style markdown image media cards", () => {
    const markdown = read("app/components/markdown.tsx");
    const markdownStyles = read("app/styles/markdown.scss");
    const lightMixinBlock = readCssBlock(markdownStyles, "@mixin light");
    const darkMixinBlock = readCssBlock(markdownStyles, "@mixin dark");
    const autoDarkRootBlock = readCssBlock(
      readCssBlock(markdownStyles, "@media (prefers-color-scheme: dark)"),
      ":root",
    );
    const imageFrameBlock = readCssBlock(
      markdownStyles,
      ".markdown-body .markdown-image-frame",
    );
    const darkImageFrameBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body .markdown-image-frame",
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
    const darkImageDownloadBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body .markdown-image-download",
    );
    const markdownReducedMotionBlock = readCssBlock(
      markdownStyles,
      "@media (prefers-reduced-motion: reduce)",
    );
    const imageFrameToneScope = [
      imageFrameBlock,
      darkImageFrameBlock,
      imageDownloadBlock,
      darkImageDownloadBlock,
      lightMixinBlock.match(
        /--markdown-image-frame-hover-border-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-image-frame-hover-border-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      lightMixinBlock.match(
        /--markdown-image-download-border-color:[\s\S]*?;/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-image-download-border-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
    ].join("\n");

    expect(markdown).toContain('className="markdown-image-frame"');
    expect(markdown).toContain('className="markdown-image-preview-button"');
    expect(markdown).toContain('className="markdown-image-preview"');
    expect(markdown).toContain('className="markdown-image-download"');
    expect(lightMixinBlock).toMatch(
      /--markdown-image-frame-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 24%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-image-download-border-color:\s*rgba\(255,\s*255,\s*255,\s*0\.18\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-image-frame-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 34%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-image-download-border-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 22%,\s*transparent\s*\);/,
    );
    expect(autoDarkRootBlock).toMatch(/@include dark;/);
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
    expect(darkImageFrameBlock).toMatch(
      /border-color:\s*rgba\(232,\s*234,\s*237,\s*0\.12\);/,
    );
    expect(darkImageFrameBlock).toMatch(
      /box-shadow:\s*0 14px 36px rgba\(0,\s*0,\s*0,\s*0\.28\);/,
    );
    expect(imageFrameBlock).toMatch(
      /&:hover,\s*&:focus-within[\s\S]*border-color:\s*var\(--markdown-image-frame-hover-border-color\);/,
    );
    expect(darkImageFrameBlock).toMatch(
      /&:hover,\s*&:focus-within[\s\S]*border-color:\s*var\(--markdown-image-frame-hover-border-color\);/,
    );
    expect(darkImageFrameBlock).toMatch(
      /&:hover,\s*&:focus-within[\s\S]*box-shadow:\s*0 16px 40px rgba\(0,\s*0,\s*0,\s*0\.34\);/,
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
    expect(imageDownloadBlock).toMatch(/width:\s*36px;/);
    expect(imageDownloadBlock).toMatch(/height:\s*36px;/);
    expect(imageDownloadBlock).toMatch(
      /border:\s*1px solid var\(--markdown-image-download-border-color\);/,
    );
    expect(imageDownloadBlock).toMatch(
      /background:\s*rgba\(\$color:\s*#1f1f1f,\s*\$alpha:\s*0\.52\);/,
    );
    expect(imageDownloadBlock).toMatch(
      /backdrop-filter:\s*blur\(16px\) saturate\(1\.2\);/,
    );
    expect(imageDownloadBlock).toMatch(/opacity:\s*0;/);
    expect(imageDownloadBlock).toMatch(/pointer-events:\s*none;/);
    expect(imageDownloadBlock).toMatch(
      /transition:[\s\S]*opacity 0\.18s ease,[\s\S]*transform 0\.18s ease,[\s\S]*background 0\.18s ease,[\s\S]*border-color 0\.18s ease,[\s\S]*box-shadow 0\.18s ease;/,
    );
    expect(imageFrameBlock).toMatch(
      /\.markdown-image-download:hover[\s\S]*transform:\s*translateY\(-1px\);/,
    );
    expect(imageFrameBlock).toMatch(
      /\.markdown-image-download:active[\s\S]*transform:\s*translateY\(0\) scale\(0\.96\);/,
    );
    expect(imageDownloadBlock).toMatch(/&:focus-visible[\s\S]*opacity:\s*1;/);
    expect(imageDownloadBlock).toMatch(
      /&:focus-visible[\s\S]*outline:\s*var\(--focus-ring\);/,
    );
    expect(imageDownloadBlock).toMatch(
      /&:focus-visible[\s\S]*box-shadow:[\s\S]*var\(--focus-ring-shadow\),[\s\S]*0 8px 22px rgba\(\$color:\s*#000,\s*\$alpha:\s*0\.24\);/,
    );
    expect(darkImageDownloadBlock).not.toMatch(/border-color:/);
    expect(darkImageDownloadBlock).toMatch(
      /background:\s*rgba\(\$color:\s*#202124,\s*\$alpha:\s*0\.62\);/,
    );
    expect(imageFrameToneScope).not.toMatch(
      /rgba\((?:66,\s*133,\s*244|138,\s*180,\s*248)|#8ab4f8\b/,
    );
    expect(markdownStyles).toMatch(
      /@media \(hover: none\), \(pointer: coarse\), \(max-width: 600px\)[\s\S]*\.markdown-body \.markdown-image-frame[\s\S]*padding:\s*3px;[\s\S]*border-radius:\s*16px;/,
    );
    expect(markdownStyles).toMatch(
      /@media \(hover: none\), \(pointer: coarse\), \(max-width: 600px\)[\s\S]*\.markdown-body \.markdown-image-frame[\s\S]*&:hover,\s*&:focus-within[\s\S]*transform:\s*none;/,
    );
    expect(markdownStyles).toMatch(
      /@media \(hover: none\), \(pointer: coarse\), \(max-width: 600px\)[\s\S]*\.markdown-body \.markdown-image-download[\s\S]*opacity:\s*1(?: !important)?;[\s\S]*pointer-events:\s*auto;/,
    );
    expect(markdownStyles).toMatch(
      /@media \(hover: none\), \(pointer: coarse\), \(max-width: 600px\)[\s\S]*\.markdown-body \.markdown-image-download[\s\S]*opacity:\s*1 !important;[\s\S]*transform:\s*none !important;/,
    );
    expect(markdownReducedMotionBlock).toMatch(
      /\.markdown-body \.markdown-image-frame,[\s\S]*\.markdown-body \.markdown-image-frame:hover,[\s\S]*\.markdown-body \.markdown-image-frame:focus-within,[\s\S]*\.markdown-body \.markdown-image-download,[\s\S]*\.markdown-body \.markdown-image-download:hover,[\s\S]*\.markdown-body \.markdown-image-download:active[\s\S]*transform:\s*none !important;[\s\S]*transition-duration:\s*0\.01ms !important;/,
    );
  });

  test("labels image actions with image-specific context", () => {
    const chat = read("app/components/chat.tsx");
    const markdown = read("app/components/markdown.tsx");

    expect(chat).toMatch(
      /import \{\s*getImageActionLabels,\s*getImagePreviewDialogLabel,\s*getImagePreviewAlt,\s*getMessageImageLabel,\s*\} from "\.\.\/utils\/image-action-labels";/,
    );
    expect(markdown).toContain(
      'import { getImageActionLabels } from "../utils/image-action-labels";',
    );
    expect(markdown).toContain(
      "const imageActionLabels = getImageActionLabels(alt);",
    );
    expect(markdown).toContain("aria-label={imageActionLabels.preview}");
    expect(markdown).toContain("aria-label={imageActionLabels.download}");
    expect(chat).toContain(
      "actionLabels: ReturnType<typeof getImageActionLabels>;",
    );
    expect(chat).toContain("aria-label={props.actionLabels.preview}");
    expect(chat).toContain("aria-label={props.actionLabels.download}");
    expect(chat).toContain("const messageImages = getMessageImages(message);");
    expect(chat).toMatch(
      /const singleMessageImageLabel = getMessageImageLabel\(0, 1\);[\s\S]*src=\{messageImages\[0\]\}[\s\S]*actionLabels=\{getImageActionLabels\(\s*singleMessageImageLabel,\s*\)\}/,
    );
    expect(chat).toMatch(
      /const imageLabel = getMessageImageLabel\(\s*index,\s*messageImages\.length,\s*\);[\s\S]*actionLabels=\{getImageActionLabels\(\s*imageLabel,\s*\)\}/,
    );
  });

  test("keeps Gemini-style rendered file attachment cards", () => {
    const markdown = read("app/components/markdown.tsx");
    const fileAttachment = read("app/components/file-attachment.tsx");
    const fileAttachmentStyles = read(
      "app/components/file-attachment.module.scss",
    );
    const rootBlock = readCssBlock(fileAttachmentStyles, ".file-attachment");
    const interactiveBlock = readCssBlock(
      fileAttachmentStyles,
      ".file-attachment-interactive",
    );
    const rootDeclarations = readRootDeclarations(rootBlock);
    const cardBlock = readCssBlock(
      fileAttachmentStyles,
      ".file-attachment-card",
    );
    const iconBlock = readCssBlock(
      fileAttachmentStyles,
      ".file-attachment-icon",
    );
    const infoBlock = readCssBlock(
      fileAttachmentStyles,
      ".file-attachment-info",
    );
    const nameBlock = readCssBlock(
      fileAttachmentStyles,
      ".file-attachment-name",
    );
    const metaBlock = readCssBlock(
      fileAttachmentStyles,
      ".file-attachment-meta",
    );
    const metaChipBlock = readCssBlock(
      fileAttachmentStyles,
      ".file-attachment-meta span",
    );
    const interactiveHoverBlock = readCssBlock(
      fileAttachmentStyles,
      ".file-attachment-interactive:hover .file-attachment-card,\n.file-attachment-interactive:focus-visible .file-attachment-card",
    );
    const interactiveActiveBlock = readCssBlock(
      fileAttachmentStyles,
      ".file-attachment-interactive:active .file-attachment-card",
    );
    const interactiveFocusBlock = readCssBlock(
      fileAttachmentStyles,
      ".file-attachment-interactive:focus-visible",
    );
    const darkCardBlock = readCssBlock(
      fileAttachmentStyles,
      ":global(.dark) .file-attachment-card",
    );
    const darkRootBlock = readCssBlock(
      fileAttachmentStyles,
      ":global(.dark) .file-attachment",
    );
    const darkIconBlock = readCssBlock(
      fileAttachmentStyles,
      ":global(.dark) .file-attachment-icon",
    );
    const darkMetaChipBlock = readCssBlock(
      fileAttachmentStyles,
      ":global(.dark) .file-attachment-meta span",
    );
    const darkInteractiveHoverBlock = readCssBlock(
      fileAttachmentStyles,
      ":global(.dark) .file-attachment-interactive:hover .file-attachment-card,\n:global(.dark) .file-attachment-interactive:focus-visible .file-attachment-card",
    );
    const autoDarkAttachmentSelector = ":global(body:not(.light)) .file-attachment";
    const autoDarkAttachmentSelectorIndex = fileAttachmentStyles.indexOf(
      autoDarkAttachmentSelector,
    );
    const autoDarkAttachmentMediaIndex = fileAttachmentStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkAttachmentSelectorIndex,
    );
    const autoDarkRootBlock = readCssBlock(
      fileAttachmentStyles.slice(autoDarkAttachmentMediaIndex),
      autoDarkAttachmentSelector,
    );
    const attachmentToneScope = [
      rootDeclarations,
      cardBlock,
      iconBlock,
      metaChipBlock,
      interactiveHoverBlock,
      autoDarkRootBlock,
      darkRootBlock,
      darkCardBlock,
      darkIconBlock,
      darkMetaChipBlock,
      darkInteractiveHoverBlock,
    ].join("\n");
    const legacyAttachmentPaint =
      /rgba\((?:66,\s*133,\s*244|138,\s*180,\s*248|52,\s*168,\s*83|129,\s*201,\s*149)/;
    const touchBlock = readCssBlock(
      fileAttachmentStyles,
      "@media (hover: none), (pointer: coarse), (max-width: 600px)",
    );
    const touchRootBlock = readCssBlock(touchBlock, ".file-attachment");
    const touchCardBlock = readCssBlock(touchBlock, ".file-attachment-card");
    const reducedMotionBlock = readCssBlock(
      fileAttachmentStyles,
      "@media (prefers-reduced-motion: reduce)",
    );

    expect(markdown).toContain(
      'const fileAttachmentHrefPrefix = "#neatchat-file-attachment?"',
    );
    expect(markdown).toContain(
      "const createFileAttachmentHref = (file: DetectedFileAttachment) =>",
    );
    expect(markdown).toContain("new URLSearchParams");
    expect(markdown).toContain(
      "if (href.startsWith(fileAttachmentHrefPrefix))",
    );
    expect(markdown).toMatch(
      /const params = new URLSearchParams\(\s*href\.slice\(fileAttachmentHrefPrefix\.length\),?\s*\);/,
    );
    expect(markdown).not.toContain("file://");
    expect(fileAttachment).toContain("const formattedFileSize");
    expect(fileAttachment).toContain("const attachmentLabel");
    expect(fileAttachment).toContain('styles["file-attachment-interactive"]');
    expect(fileAttachment).toContain("title={fileName}");
    expect(fileAttachment).toContain('"aria-label": attachmentLabel');
    expect(fileAttachment).toContain('styles["file-attachment-meta"]');
    expect(fileAttachment).toMatch(
      /<span className=\{styles\["file-attachment-size"\]\}>\s*\{formattedFileSize\}\s*<\/span>/,
    );
    expect(fileAttachment).toMatch(
      /<span className=\{styles\["file-attachment-type"\]\}>\s*\{fileType\}\s*<\/span>/,
    );
    expect(rootBlock).toMatch(/display:\s*inline-flex;/);
    expect(rootBlock).toMatch(/max-width:\s*min\(100%, 440px\);/);
    expect(rootBlock).toMatch(/min-width:\s*0;/);
    expect(rootBlock).toMatch(/vertical-align:\s*middle;/);
    expect(rootDeclarations).toMatch(
      /--file-attachment-card-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 92%,\s*var\(--gray\)\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--file-attachment-interactive-radius:\s*8px;/,
    );
    expect(rootDeclarations).toMatch(/--file-attachment-card-radius:\s*8px;/);
    expect(rootDeclarations).toMatch(/--file-attachment-icon-radius:\s*8px;/);
    expect(rootDeclarations).toMatch(
      /--file-attachment-card-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--file-attachment-icon-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 8%,\s*var\(--surface-soft\)\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--file-attachment-chip-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 10%,\s*transparent\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--file-attachment-hover-shadow:\s*0 14px 36px\s*color-mix\(in srgb,\s*var\(--primary\) 12%,\s*transparent\);/,
    );
    expect(interactiveBlock).toMatch(/cursor:\s*pointer;/);
    expect(interactiveBlock).toMatch(
      /border-radius:\s*var\(--file-attachment-interactive-radius\);/,
    );
    expect(cardBlock).toMatch(
      /grid-template-columns:\s*36px minmax\(0, 1fr\);/,
    );
    expect(cardBlock).toMatch(/gap:\s*10px;/);
    expect(cardBlock).toMatch(/padding:\s*9px 12px 9px 10px;/);
    expect(cardBlock).toMatch(
      /border-radius:\s*var\(--file-attachment-card-radius\);/,
    );
    expect(cardBlock).not.toContain("border-radius: 14px");
    expect(cardBlock).toMatch(
      /border:\s*1px solid var\(--file-attachment-card-border-color\);/,
    );
    expect(cardBlock).toMatch(
      /background:\s*var\(--file-attachment-card-background\);/,
    );
    expect(cardBlock).toMatch(
      /box-shadow:\s*var\(--file-attachment-card-shadow\);/,
    );
    expect(cardBlock).not.toContain("linear-gradient");
    expect(cardBlock).not.toMatch(/var\(--gray\)/);
    expect(iconBlock).toMatch(/width:\s*36px;/);
    expect(iconBlock).toMatch(/height:\s*36px;/);
    expect(iconBlock).toMatch(
      /border-radius:\s*var\(--file-attachment-icon-radius\);/,
    );
    expect(iconBlock).not.toContain("border-radius: 10px");
    expect(iconBlock).toMatch(/color:\s*var\(--primary\);/);
    expect(iconBlock).toMatch(
      /background:\s*var\(--file-attachment-icon-background\);/,
    );
    expect(iconBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--file-attachment-icon-ring-color\);/,
    );
    expect(iconBlock).not.toContain("linear-gradient");
    expect(infoBlock).toMatch(/min-width:\s*0;/);
    expect(nameBlock).toMatch(/font-weight:\s*520;/);
    expect(nameBlock).toMatch(/letter-spacing:\s*0;/);
    expect(nameBlock).toMatch(/text-overflow:\s*ellipsis;/);
    expect(metaBlock).toMatch(/display:\s*flex;/);
    expect(metaBlock).toMatch(/flex-wrap:\s*wrap;/);
    expect(metaBlock).toMatch(/gap:\s*5px;/);
    expect(metaChipBlock).toMatch(/border-radius:\s*999px;/);
    expect(metaChipBlock).toMatch(
      /border:\s*1px solid var\(--file-attachment-chip-border-color\);/,
    );
    expect(metaChipBlock).toMatch(
      /background:\s*var\(--file-attachment-chip-background\);/,
    );
    expect(metaChipBlock).toMatch(
      /color:\s*var\(--black-50\);/,
    );
    expect(interactiveHoverBlock).toMatch(/transform:\s*translateY\(-1px\);/);
    expect(interactiveHoverBlock).toMatch(
      /border-color:\s*var\(--file-attachment-hover-border-color\);/,
    );
    expect(interactiveHoverBlock).toMatch(
      /box-shadow:\s*var\(--file-attachment-hover-shadow\);/,
    );
    expect(interactiveActiveBlock).toMatch(
      /transform:\s*translateY\(0\) scale\(0\.985\);/,
    );
    expect(interactiveActiveBlock).toMatch(
      /box-shadow:\s*var\(--file-attachment-active-shadow\);/,
    );
    expect(interactiveFocusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(interactiveFocusBlock).toMatch(/outline-offset:\s*3px;/);
    expect(darkRootBlock).toMatch(
      /--file-attachment-card-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(darkRootBlock).toMatch(
      /--file-attachment-card-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 10%,\s*transparent\s*\);/,
    );
    expect(darkCardBlock).toMatch(
      /background:\s*var\(--file-attachment-card-background\);/,
    );
    expect(darkCardBlock).toMatch(
      /box-shadow:\s*var\(--file-attachment-card-shadow\);/,
    );
    expect(darkCardBlock).not.toContain("linear-gradient");
    expect(darkIconBlock).toMatch(/color:\s*var\(--primary\);/);
    expect(darkIconBlock).toMatch(
      /background:\s*var\(--file-attachment-icon-background\);/,
    );
    expect(darkIconBlock).not.toContain("linear-gradient");
    expect(darkMetaChipBlock).toMatch(
      /background:\s*var\(--file-attachment-chip-background\);/,
    );
    expect(darkInteractiveHoverBlock).toMatch(
      /border-color:\s*var\(--file-attachment-hover-border-color\);/,
    );
    expect(darkInteractiveHoverBlock).toMatch(
      /box-shadow:\s*var\(--file-attachment-hover-shadow\);/,
    );
    expect(autoDarkAttachmentSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkAttachmentMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkRootBlock).toMatch(
      /--file-attachment-card-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkRootBlock).toMatch(
      /--file-attachment-card-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 10%,\s*transparent\s*\);/,
    );
    expect(attachmentToneScope).not.toMatch(legacyAttachmentPaint);
    expect(attachmentToneScope).not.toContain("border: var(--border-in-light)");
    expect(touchRootBlock).toMatch(/width:\s*100%;/);
    expect(touchRootBlock).toMatch(/max-width:\s*100%;/);
    expect(touchCardBlock).toMatch(/width:\s*100%;/);
    expect(touchCardBlock).toMatch(/transform:\s*none;/);
    expect(reducedMotionBlock).toMatch(
      /\.file-attachment-card,\s*\.file-attachment-interactive:hover \.file-attachment-card,\s*\.file-attachment-interactive:focus-visible \.file-attachment-card,\s*\.file-attachment-interactive:active \.file-attachment-card\s*\{[\s\S]*transition-duration:\s*0\.01ms !important;[\s\S]*transform:\s*none !important;/,
    );
  });

  test("keeps Gemini-style markdown table surfaces readable across themes", () => {
    const markdown = read("app/components/markdown.tsx");
    const markdownStyles = read("app/styles/markdown.scss");
    const lightMixinBlock = readCssBlock(markdownStyles, "@mixin light");
    const darkMixinBlock = readCssBlock(markdownStyles, "@mixin dark");
    const tableShellBlock = readCssBlock(
      markdownStyles,
      ".markdown-table-scroll-shell",
    );
    const tableShellSpacingBlock = readCssBlock(
      markdownStyles,
      ".markdown-body .markdown-table-scroll-shell",
    );
    const tableViewportBlock = readCssBlock(
      markdownStyles,
      ".markdown-table-scroll-viewport",
    );
    const tableFadeBlock = readCssBlock(
      markdownStyles,
      ".markdown-table-scroll-fade",
    );
    const tableFadeStartBlock = readCssBlock(
      markdownStyles,
      ".markdown-table-scroll-fade-start",
    );
    const tableFadeEndBlock = readCssBlock(
      markdownStyles,
      ".markdown-table-scroll-fade-end",
    );
    const tableBlock = readCssBlock(markdownStyles, ".markdown-body table");
    const tableInsideShellBlock = readCssBlock(
      markdownStyles,
      ".markdown-body .markdown-table-scroll-viewport > table",
    );
    const tableHeaderBlock = readCssBlock(
      markdownStyles,
      ".markdown-body table th",
    );
    const tableCellBlock = readCssBlock(
      markdownStyles,
      ".markdown-body table th,\n.markdown-body table td",
    );
    const tableRowHoverBlock = readCssBlock(
      markdownStyles,
      ".markdown-body table tr:hover",
    );
    const tableZebraBlock = readCssBlock(
      markdownStyles,
      ".markdown-body table tr:nth-child(2n):not(:hover)",
    );
    const autoDarkRootBlock = readCssBlock(
      readCssBlock(markdownStyles, "@media (prefers-color-scheme: dark)"),
      ":root",
    );
    const tableToneScope = [
      tableShellBlock,
      tableFadeStartBlock,
      tableFadeEndBlock,
      tableHeaderBlock,
      tableCellBlock,
      tableRowHoverBlock,
    ].join("\n");

    const tableTokenNames = [
      "--markdown-table-shell-border-color",
      "--markdown-table-shell-background",
      "--markdown-table-edge-surface",
      "--markdown-table-header-background",
      "--markdown-table-cell-border-color",
      "--markdown-table-row-hover-background",
    ];

    for (const tokenName of tableTokenNames) {
      expect(lightMixinBlock).toContain(tokenName);
      expect(darkMixinBlock).toContain(tokenName);
    }

    expect(lightMixinBlock).toMatch(
      /--markdown-table-shell-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 72%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-table-cell-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-table-row-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 7%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-table-shell-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 62%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-table-cell-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 10%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-table-row-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 12%,\s*var\(--surface-soft\)\s*\);/,
    );
    expect(autoDarkRootBlock).toMatch(/@include dark;/);
    expect(readRootDeclarations(tableShellBlock)).toMatch(
      /--markdown-table-shell-radius:\s*8px;/,
    );

    expect(markdown).toContain("function MarkdownTable");
    expect(markdown).toContain("const [tableScrollHint, setTableScrollHint]");
    expect(markdown).toMatch(
      /const syncTableScrollHint = useCallback\(\(\) => \{[\s\S]*const tableShell = tableScrollRef\.current;[\s\S]*const maxScrollLeft = Math\.max\([\s\S]*tableShell\.scrollWidth - tableShell\.clientWidth[\s\S]*start: tableShell\.scrollLeft > 1,[\s\S]*end: maxScrollLeft - tableShell\.scrollLeft > 1,/,
    );
    expect(markdown).toMatch(
      /className="markdown-table-scroll-shell"[\s\S]*data-overflow-start=\{tableScrollHint\.start \? "true" : "false"\}[\s\S]*data-overflow-end=\{tableScrollHint\.end \? "true" : "false"\}[\s\S]*className="markdown-table-scroll-viewport"[\s\S]*onScroll=\{syncTableScrollHint\}/,
    );
    expect(markdown).toMatch(
      /typeof ResizeObserver === "undefined"[\s\S]*const tableResizeObserver = new ResizeObserver\(\(\) => \{[\s\S]*syncTableScrollHint\(\);[\s\S]*tableResizeObserver\.observe\(tableShell\)/,
    );
    expect(markdown).toContain("node: _node");
    expect(markdown).toContain("<table {...tableProps} />");
    expect(markdown).toMatch(
      /\{tableScrollHint\.start && \([\s\S]*className="markdown-table-scroll-fade markdown-table-scroll-fade-start"/,
    );
    expect(markdown).toMatch(
      /\{tableScrollHint\.end && \([\s\S]*className="markdown-table-scroll-fade markdown-table-scroll-fade-end"/,
    );
    expect(markdown).toContain("table: MarkdownTable");
    expect(tableShellBlock).toMatch(/position:\s*relative;/);
    expect(tableShellBlock).toMatch(
      /border:\s*1px solid var\(--markdown-table-shell-border-color\);/,
    );
    expect(tableShellBlock).toMatch(
      /border-radius:\s*var\(--markdown-table-shell-radius\);/,
    );
    expect(tableShellBlock).toMatch(
      /background:\s*var\(--markdown-table-shell-background\);/,
    );
    expect(tableShellBlock).toMatch(/overflow:\s*hidden;/);
    expect(tableShellSpacingBlock).toMatch(/margin-top:\s*0;/);
    expect(tableShellSpacingBlock).toMatch(/margin-bottom:\s*16px;/);
    expect(tableViewportBlock).toMatch(/overflow-x:\s*auto;/);
    expect(tableViewportBlock).toMatch(/overflow-y:\s*hidden;/);
    expect(tableViewportBlock).toMatch(/overscroll-behavior-x:\s*contain;/);
    expect(tableViewportBlock).toMatch(/-webkit-overflow-scrolling:\s*touch;/);
    expect(tableViewportBlock).toMatch(/scrollbar-width:\s*thin;/);
    expect(tableFadeBlock).toMatch(/position:\s*absolute;/);
    expect(tableFadeBlock).toMatch(/top:\s*0;/);
    expect(tableFadeBlock).toMatch(/bottom:\s*0;/);
    expect(tableFadeBlock).toMatch(/pointer-events:\s*none;/);
    expect(tableFadeBlock).toMatch(/width:\s*28px;/);
    expect(tableFadeStartBlock).toMatch(/linear-gradient\(\s*90deg/);
    expect(tableFadeEndBlock).toMatch(/linear-gradient\(\s*270deg/);
    expect(tableBlock).toMatch(/width:\s*max-content;/);
    expect(tableBlock).toMatch(/min-width:\s*100%;/);
    expect(tableBlock).toMatch(/background:\s*transparent;/);
    expect(tableBlock).not.toMatch(/overflow-x:\s*auto;/);
    expect(tableInsideShellBlock).toMatch(/margin-bottom:\s*0;/);
    expect(tableHeaderBlock).toMatch(
      /background-color:\s*var\(--markdown-table-header-background\);/,
    );
    expect(tableCellBlock).toMatch(
      /border-bottom:\s*1px solid var\(--markdown-table-cell-border-color\);/,
    );
    expect(tableRowHoverBlock).toMatch(
      /background-color:\s*var\(--markdown-table-row-hover-background\);/,
    );
    expect(tableZebraBlock).toMatch(/background-color:\s*transparent;/);
    expect(markdownStyles).not.toMatch(
      /\.markdown-body table tr:nth-child\(2n\)\s*\{/,
    );
    expect(tableToneScope).not.toMatch(
      /rgba\(60,\s*64,\s*67|rgba\(255,\s*255,\s*255|var\(--color-border-muted\)/,
    );
  });

  test("keeps Gemini-style LaTeX display math bounded", () => {
    const markdown = read("app/components/markdown.tsx");
    const markdownStyles = read("app/styles/markdown.scss");
    const katexDisplayBlock = readCssBlock(
      markdownStyles,
      ".markdown-body .katex-display",
    );
    const katexDisplayFormulaBlock = readCssBlock(
      markdownStyles,
      ".markdown-body .katex-display > .katex",
    );
    const lightMixinBlock = readCssBlock(markdownStyles, "@mixin light");
    const darkMixinBlock = readCssBlock(markdownStyles, "@mixin dark");
    const autoDarkMediaBlock = readCssBlock(
      markdownStyles,
      "@media (prefers-color-scheme: dark)",
    );
    const autoDarkRootBlock = readCssBlock(autoDarkMediaBlock, ":root");
    const mobileBlock = readCssBlock(
      markdownStyles,
      "@media only screen and (max-width: 600px)",
    );
    const mobileKatexDisplayBlock = readCssBlock(
      mobileBlock,
      ".markdown-body .katex-display",
    );

    expect(markdown).toContain('import "katex/dist/katex.min.css";');
    expect(markdown).toContain('import RemarkMath from "remark-math";');
    expect(markdown).toContain('import RehypeKatex from "rehype-katex";');
    expect(markdown).toContain("remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}");
    expect(markdown).toContain("RehypeKatex");
    expect(lightMixinBlock).toMatch(
      /--markdown-math-display-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-math-display-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 72%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-math-display-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 10%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-math-display-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 62%,\s*transparent\s*\);/,
    );
    expect(autoDarkRootBlock).toMatch(/@include dark;/);
    expect(katexDisplayBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(readRootDeclarations(katexDisplayBlock)).toMatch(
      /--markdown-math-display-radius:\s*8px;/,
    );
    expect(katexDisplayBlock).toMatch(/width:\s*100%;/);
    expect(katexDisplayBlock).toMatch(/max-width:\s*100%;/);
    expect(katexDisplayBlock).toMatch(/margin:\s*14px 0 16px;/);
    expect(katexDisplayBlock).toMatch(/padding:\s*12px 14px;/);
    expect(katexDisplayBlock).toMatch(/overflow-x:\s*auto;/);
    expect(katexDisplayBlock).toMatch(/overflow-y:\s*hidden;/);
    expect(katexDisplayBlock).toMatch(/overscroll-behavior-x:\s*contain;/);
    expect(katexDisplayBlock).toMatch(/scrollbar-width:\s*thin;/);
    expect(katexDisplayBlock).toMatch(/-webkit-overflow-scrolling:\s*touch;/);
    expect(katexDisplayBlock).toMatch(
      /border:\s*1px solid var\(--markdown-math-display-border-color\);/,
    );
    expect(katexDisplayBlock).toMatch(
      /border-radius:\s*var\(--markdown-math-display-radius\);/,
    );
    expect(katexDisplayBlock).toMatch(
      /background:\s*var\(--markdown-math-display-background\);/,
    );
    expect(katexDisplayFormulaBlock).toMatch(/display:\s*inline-block;/);
    expect(katexDisplayFormulaBlock).toMatch(/min-width:\s*max-content;/);
    expect(katexDisplayFormulaBlock).toMatch(/max-width:\s*none;/);
    expect(markdownStyles).not.toMatch(
      /\.dark\s+\.markdown-body\s+\.katex-display\s*\{/,
    );
    expect(katexDisplayBlock).not.toMatch(
      /rgba\(60,\s*64,\s*67|rgba\(248,\s*249,\s*250|rgba\(255,\s*255,\s*255/,
    );
    expect(mobileKatexDisplayBlock).toMatch(/padding:\s*10px 12px;/);
    expect(mobileKatexDisplayBlock).not.toMatch(/border-radius:\s*12px;/);
    expect(mobileBlock).toMatch(
      /\.markdown-body \.katex-display\s*\{[\s\S]*padding:\s*10px 12px;/,
    );
    expect(markdownStyles).not.toMatch(
      /\.markdown-body\s+\.katex\s*\{[\s\S]*display:\s*block;/,
    );
  });

  test("keeps Gemini-style markdown links readable and accessible", () => {
    const markdownStyles = read("app/styles/markdown.scss");
    const topLevelLinkSource = markdownStyles.slice(
      markdownStyles.indexOf("\n.markdown-body a {"),
    );
    const linkBlock = readCssBlock(topLevelLinkSource, ".markdown-body a");
    const lightMixinBlock = readCssBlock(markdownStyles, "@mixin light");
    const darkMixinBlock = readCssBlock(markdownStyles, "@mixin dark");
    const explicitLightBlock = readCssBlock(markdownStyles, ".light");
    const explicitDarkBlock = readCssBlock(markdownStyles, ".dark");
    const autoDarkMediaBlock = readCssBlock(
      markdownStyles,
      "@media (prefers-color-scheme: dark)",
    );
    const autoDarkRootBlock = readCssBlock(autoDarkMediaBlock, ":root");
    const darkLinkBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body a",
    );
    const autoDarkLinkBlock = readCssBlock(
      autoDarkMediaBlock,
      "body:not(.light) .markdown-body a",
    );
    const linkHoverBlock = readCssBlock(
      markdownStyles,
      ".markdown-body a:hover",
    );
    const linkFocusVisibleBlock = readCssBlock(
      markdownStyles,
      '.markdown-body a:focus-visible,\n.markdown-body [role="button"]:focus-visible,\n.markdown-body input[type="radio"]:focus-visible,\n.markdown-body input[type="checkbox"]:focus-visible',
    );
    const focusOffsetResetBlock = readCssBlock(
      markdownStyles,
      '.markdown-body a:not([class]):focus,\n.markdown-body a:not([class]):focus-visible,\n.markdown-body input[type="radio"]:focus,\n.markdown-body input[type="radio"]:focus-visible,\n.markdown-body input[type="checkbox"]:focus,\n.markdown-body input[type="checkbox"]:focus-visible',
    );
    const anchorWithoutHrefBlock = readCssBlock(
      markdownStyles,
      ".markdown-body a:not([href])",
    );
    const headingAnchorHoverBlock = readCssBlock(
      markdownStyles,
      ".markdown-body h1:hover .anchor,\n.markdown-body h2:hover .anchor,\n.markdown-body h3:hover .anchor,\n.markdown-body h4:hover .anchor,\n.markdown-body h5:hover .anchor,\n.markdown-body h6:hover .anchor",
    );

    const lightLinkTokenScope =
      lightMixinBlock.match(
        /--markdown-link-color:[\s\S]*?--markdown-link-decoration-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "";
    const darkLinkTokenScope =
      darkMixinBlock.match(
        /--markdown-link-color:[\s\S]*?--markdown-link-decoration-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "";
    const linkToneScope = [
      linkBlock,
      lightLinkTokenScope,
      darkLinkTokenScope,
    ].join("\n");

    expect(lightMixinBlock).toMatch(/--markdown-link-color:\s*var\(--primary\);/);
    expect(lightMixinBlock).toMatch(
      /--markdown-link-decoration-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 34%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-link-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 42%,\s*var\(--black\)\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-link-decoration-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 40%,\s*transparent\s*\);/,
    );
    expect(explicitLightBlock).toMatch(/@include light;/);
    expect(explicitDarkBlock).toMatch(/@include dark;/);
    expect(autoDarkRootBlock).toMatch(/@include dark;/);
    expect(darkLinkBlock).toBe("");
    expect(autoDarkLinkBlock).toBe("");
    expect(linkBlock).toMatch(/color:\s*var\(--markdown-link-color\);/);
    expect(linkBlock).toMatch(/text-decoration:\s*underline;/);
    expect(linkBlock).toMatch(
      /text-decoration-color:\s*var\(--markdown-link-decoration-color\);/,
    );
    expect(linkBlock).toMatch(/text-underline-offset:\s*3px;/);
    expect(linkBlock).toMatch(/text-decoration-thickness:\s*1px;/);
    expect(linkToneScope).not.toMatch(
      /(?:rgba?|hsla?|hwb|oklch|oklab|lch|lab|color|device-cmyk)\(|#[0-9a-fA-F]{3,8}\b/,
    );
    expect(linkHoverBlock).toMatch(/text-decoration-color:\s*currentColor;/);
    expect(linkHoverBlock).toMatch(/text-decoration-thickness:\s*1\.5px;/);
    expect(linkFocusVisibleBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(linkFocusVisibleBlock).toMatch(/outline-offset:\s*2px;/);
    expect(focusOffsetResetBlock).toMatch(/outline-offset:\s*0;/);
    expect(anchorWithoutHrefBlock).toMatch(/color:\s*inherit;/);
    expect(anchorWithoutHrefBlock).toMatch(/text-decoration:\s*none;/);
    expect(headingAnchorHoverBlock).toMatch(/text-decoration:\s*none;/);
  });

  test("keeps Gemini-style markdown details disclosure hover", () => {
    const markdownStyles = read("app/styles/markdown.scss");
    const markdownBodyBlock = readCssBlock(markdownStyles, ".markdown-body");
    const detailsBlock = readCssBlock(markdownBodyBlock, "details");
    const detailsSummaryBlock = readCssBlock(detailsBlock, "summary");
    const detailsSummaryHoverBlock = readCssBlock(
      detailsSummaryBlock,
      "&:hover",
    );
    const detailsSummaryHoverBeforeBlock = readCssBlock(
      detailsSummaryHoverBlock,
      "&::before",
    );
    const detailsSummaryMarkerBlock = readCssBlock(
      detailsSummaryBlock,
      "&::-webkit-details-marker",
    );
    const detailsSummaryStaticBeforeSource = detailsSummaryBlock.slice(
      detailsSummaryBlock.indexOf("&::-webkit-details-marker"),
    );
    const detailsSummaryBeforeBlock = readCssBlock(
      detailsSummaryStaticBeforeSource,
      "&::before",
    );
    const detailsOpenBeforeBlock = readCssBlock(
      detailsBlock,
      "&[open] > summary::before",
    );
    const detailsSummaryFocusBlock = readCssBlock(
      detailsSummaryBlock,
      "&:focus",
    );
    const detailsSummaryFocusVisibleBlock = readCssBlock(
      detailsSummaryBlock,
      "&:focus-visible",
    );
    const detailsSummaryActiveBlock = readCssBlock(
      detailsSummaryBlock,
      "&:active",
    );
    const lightMixinBlock = readCssBlock(markdownStyles, "@mixin light");
    const darkMixinBlock = readCssBlock(markdownStyles, "@mixin dark");
    const autoDarkRootBlock = readCssBlock(
      readCssBlock(markdownStyles, "@media (prefers-color-scheme: dark)"),
      ":root",
    );
    const detailsDisclosureToneScope = [
      detailsSummaryHoverBlock,
      detailsSummaryHoverBeforeBlock,
      lightMixinBlock.match(
        /--markdown-disclosure-hover-color:[\s\S]*?;/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-disclosure-hover-color:[\s\S]*?\);/,
      )?.[0] ?? "",
    ].join("\n");

    expect(lightMixinBlock).toMatch(
      /--markdown-disclosure-hover-color:\s*var\(--primary\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-disclosure-hover-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 42%,\s*var\(--black\)\s*\);/,
    );
    expect(autoDarkRootBlock).toMatch(/@include dark;/);
    expect(detailsSummaryHoverBlock).toMatch(
      /color:\s*var\(--markdown-disclosure-hover-color\);/,
    );
    expect(detailsSummaryHoverBeforeBlock).toMatch(
      /color:\s*var\(--markdown-disclosure-hover-color\);/,
    );
    expect(detailsSummaryMarkerBlock).toMatch(/display:\s*none;/);
    expect(detailsSummaryBeforeBlock).toMatch(/content:\s*"▶";/);
    expect(detailsSummaryBeforeBlock).toMatch(
      /transition:\s*transform 0\.2s;/,
    );
    expect(detailsOpenBeforeBlock).toMatch(/transform:\s*rotate\(90deg\);/);
    expect(detailsSummaryFocusBlock).toMatch(/outline:\s*none;/);
    expect(detailsSummaryFocusVisibleBlock).toMatch(/outline:\s*none;/);
    expect(detailsSummaryActiveBlock).toMatch(/background:\s*none;/);
    expect(detailsDisclosureToneScope).not.toMatch(
      /(?:rgba?|hsla?|hwb|oklch|oklab|lch|lab|color|device-cmyk)\(|#[0-9a-fA-F]{3,8}\b|rgb\(49,\s*94,\s*248\)/,
    );
  });

  test("keeps Gemini-style markdown blockquote callouts", () => {
    const markdownStyles = read("app/styles/markdown.scss");
    const blockquoteBlock = readCssBlock(
      markdownStyles,
      ".markdown-body blockquote",
    );
    const darkBlockquoteBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body blockquote",
    );
    const detailsBlockquoteBlock = readCssBlock(
      markdownStyles,
      ".markdown-body details blockquote,\n.markdown-body details > p > blockquote",
    );
    const darkDetailsBlockquoteBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body details blockquote,\n.dark .markdown-body details > p > blockquote",
    );
    const blockquoteToneScope = [
      blockquoteBlock,
      darkBlockquoteBlock,
      detailsBlockquoteBlock,
      darkDetailsBlockquoteBlock,
    ].join("\n");

    expect(blockquoteBlock).toMatch(/padding:\s*10px 14px;/);
    expect(blockquoteBlock).toMatch(/border-width:\s*1px;/);
    expect(blockquoteBlock).toMatch(/border-style:\s*solid;/);
    expect(blockquoteBlock).toMatch(
      /border-top-color:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 72%,\s*transparent\);/,
    );
    expect(blockquoteBlock).toMatch(
      /border-right-color:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 72%,\s*transparent\);/,
    );
    expect(blockquoteBlock).toMatch(
      /border-bottom-color:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 72%,\s*transparent\);/,
    );
    expect(blockquoteBlock).toMatch(
      /border-left:\s*3px solid color-mix\(in srgb,\s*var\(--primary\) 52%,\s*transparent\);/,
    );
    expect(blockquoteBlock).toMatch(/border-radius:\s*12px;/);
    expect(blockquoteBlock).toMatch(
      /background:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 76%,\s*transparent\);/,
    );
    expect(blockquoteBlock).toMatch(/line-height:\s*1\.65;/);
    expect(blockquoteBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px color-mix\(in srgb,\s*var\(--surface-elevated\) 48%,\s*transparent\);/,
    );
    expect(darkBlockquoteBlock).toMatch(
      /background:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 72%,\s*transparent\);/,
    );
    expect(darkBlockquoteBlock).toMatch(
      /border-top-color:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 64%,\s*transparent\);/,
    );
    expect(darkBlockquoteBlock).toMatch(
      /border-right-color:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 64%,\s*transparent\);/,
    );
    expect(darkBlockquoteBlock).toMatch(
      /border-bottom-color:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 64%,\s*transparent\);/,
    );
    expect(darkBlockquoteBlock).toMatch(
      /border-left-color:\s*color-mix\(in srgb,\s*var\(--primary\) 58%,\s*transparent\);/,
    );
    expect(detailsBlockquoteBlock).toMatch(/background:\s*transparent;/);
    expect(detailsBlockquoteBlock).toMatch(/border:\s*0;/);
    expect(detailsBlockquoteBlock).toMatch(
      /border-left:\s*3px solid color-mix\(in srgb,\s*var\(--primary\) 42%,\s*transparent\);/,
    );
    expect(detailsBlockquoteBlock).toMatch(/border-radius:\s*0;/);
    expect(detailsBlockquoteBlock).toMatch(/box-shadow:\s*none;/);
    expect(detailsBlockquoteBlock).toMatch(/line-height:\s*inherit;/);
    expect(darkDetailsBlockquoteBlock).toMatch(/background:\s*transparent;/);
    expect(darkDetailsBlockquoteBlock).toMatch(
      /border-left-color:\s*color-mix\(in srgb,\s*var\(--primary\) 50%,\s*transparent\);/,
    );
    expect(darkDetailsBlockquoteBlock).toMatch(/box-shadow:\s*none;/);
    expect(blockquoteToneScope).not.toMatch(
      /rgba\((?:66,\s*133,\s*244|138,\s*180,\s*248|60,\s*64,\s*67|232,\s*234,\s*237)/,
    );
  });

  test("keeps thinking details as a Gemini-style reasoning card", () => {
    const markdown = read("app/components/markdown.tsx");
    const markdownStyles = read("app/styles/markdown.scss");
    const thinkingBlock = readCssBlock(
      markdownStyles,
      ".markdown-body details.markdown-thinking",
    );
    const thinkingSummaryBlock = readCssBlock(
      markdownStyles,
      ".markdown-body details.markdown-thinking > summary.markdown-thinking-summary",
    );
    const thinkingLoaderBlock = readCssBlock(
      markdownStyles,
      ".markdown-body details.markdown-thinking .thinking-loader",
    );
    const thinkingPulseBlock = readCssBlock(
      markdownStyles,
      "@keyframes thinking-dot-pulse",
    );
    const lightMixinBlock = readCssBlock(markdownStyles, "@mixin light");
    const darkMixinBlock = readCssBlock(markdownStyles, "@mixin dark");
    const autoDarkRootBlock = readCssBlock(
      readCssBlock(markdownStyles, "@media (prefers-color-scheme: dark)"),
      ":root",
    );
    const thinkingToneScope = [
      thinkingBlock,
      thinkingSummaryBlock,
      thinkingLoaderBlock,
      thinkingPulseBlock,
    ].join("\n");
    const reducedMotionBlock = markdownStyles.slice(
      markdownStyles.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    const thinkingTokenNames = [
      "--markdown-thinking-card-border-color",
      "--markdown-thinking-card-background",
      "--markdown-thinking-card-color",
      "--markdown-thinking-card-shadow-color",
      "--markdown-thinking-summary-border-color",
      "--markdown-thinking-summary-background",
      "--markdown-thinking-summary-color",
      "--markdown-thinking-summary-ring-color",
      "--markdown-thinking-marker-color",
      "--markdown-thinking-loader-dot-primary",
      "--markdown-thinking-loader-dot-secondary",
      "--markdown-thinking-loader-dot-trailing",
      "--markdown-thinking-loader-dot-active-secondary",
      "--markdown-thinking-loader-dot-active-trailing",
    ];

    expect(markdown).toContain('class="markdown-thinking"');
    expect(markdown).toContain('class="markdown-thinking-summary"');
    expect(markdown).toContain('class="thinking-loader" aria-hidden="true"');
    expect(markdown).toContain("return <details {...props} open />");
    expect(markdown).toContain("return <summary {...props} />");
    for (const tokenName of thinkingTokenNames) {
      expect(lightMixinBlock).toContain(tokenName);
      expect(darkMixinBlock).toContain(tokenName);
    }
    expect(lightMixinBlock).toMatch(
      /--markdown-thinking-card-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 72%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-thinking-card-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-thinking-summary-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 8%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-thinking-card-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 62%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-thinking-card-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 10%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-thinking-summary-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 14%,\s*var\(--surface\)\s*\);/,
    );
    expect(autoDarkRootBlock).toMatch(/@include dark;/);
    expect(readRootDeclarations(thinkingBlock)).toMatch(
      /--markdown-thinking-card-radius:\s*8px;/,
    );
    expect(thinkingBlock).toMatch(/padding:\s*10px 12px;/);
    expect(thinkingBlock).toMatch(
      /border-radius:\s*var\(--markdown-thinking-card-radius\);/,
    );
    expect(thinkingBlock).toMatch(/border-width:\s*1px;/);
    expect(thinkingBlock).toMatch(/border-style:\s*solid;/);
    expect(thinkingBlock).toMatch(
      /border-color:\s*var\(--markdown-thinking-card-border-color\);/,
    );
    expect(thinkingBlock).toMatch(
      /background:\s*var\(--markdown-thinking-card-background\);/,
    );
    expect(thinkingBlock).toMatch(
      /box-shadow:[\s\S]*0 12px 30px var\(--markdown-thinking-card-shadow-color\);/,
    );
    expect(thinkingBlock).toMatch(
      /color:\s*var\(--markdown-thinking-card-color\);/,
    );
    expect(thinkingBlock).toMatch(
      /backdrop-filter:\s*blur\(14px\) saturate\(160%\);/,
    );
    expect(thinkingBlock).toMatch(/overflow-wrap:\s*anywhere;/);
    expect(thinkingSummaryBlock).toMatch(/display:\s*inline-flex;/);
    expect(thinkingSummaryBlock).toMatch(/align-items:\s*center;/);
    expect(thinkingSummaryBlock).toMatch(/gap:\s*8px;/);
    expect(thinkingSummaryBlock).toMatch(/min-height:\s*30px;/);
    expect(thinkingSummaryBlock).toMatch(/padding:\s*5px 10px;/);
    expect(thinkingSummaryBlock).toMatch(/border-radius:\s*999px;/);
    expect(thinkingSummaryBlock).toMatch(/border-width:\s*1px;/);
    expect(thinkingSummaryBlock).toMatch(/border-style:\s*solid;/);
    expect(thinkingSummaryBlock).toMatch(
      /border-color:\s*var\(--markdown-thinking-summary-border-color\);/,
    );
    expect(thinkingSummaryBlock).toMatch(
      /background:\s*var\(--markdown-thinking-summary-background\);/,
    );
    expect(thinkingSummaryBlock).toMatch(
      /color:\s*var\(--markdown-thinking-summary-color\);/,
    );
    expect(thinkingSummaryBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--markdown-thinking-summary-ring-color\);/,
    );
    expect(thinkingSummaryBlock).toMatch(/letter-spacing:\s*0;/);
    expect(thinkingSummaryBlock).toMatch(/list-style:\s*none;/);
    expect(thinkingSummaryBlock).toMatch(
      /&::-webkit-details-marker[\s\S]*display:\s*none;/,
    );
    expect(thinkingSummaryBlock).toMatch(/&::before[\s\S]*content:\s*"⌄";/);
    expect(thinkingSummaryBlock).toMatch(
      /&::before[\s\S]*color:\s*var\(--markdown-thinking-marker-color\);/,
    );
    expect(thinkingLoaderBlock).toMatch(/width:\s*6px;/);
    expect(thinkingLoaderBlock).toMatch(/height:\s*6px;/);
    expect(thinkingLoaderBlock).toMatch(/border:\s*0;/);
    expect(thinkingLoaderBlock).toMatch(
      /background:\s*var\(--markdown-thinking-loader-dot-primary\);/,
    );
    expect(thinkingLoaderBlock).toMatch(
      /box-shadow:\s*10px 0 0 var\(--markdown-thinking-loader-dot-secondary\),\s*20px 0 0 var\(--markdown-thinking-loader-dot-trailing\);/,
    );
    expect(thinkingLoaderBlock).toMatch(
      /animation:\s*thinking-dot-pulse 1\.2s ease-in-out infinite;/,
    );
    expect(markdownStyles).toContain("@keyframes thinking-dot-pulse");
    expect(thinkingPulseBlock).toMatch(
      /box-shadow:\s*10px 0 0 var\(--markdown-thinking-loader-dot-active-secondary\),\s*20px 0 0 var\(--markdown-thinking-loader-dot-active-trailing\);/,
    );
    expect(markdownStyles).not.toMatch(
      /\.dark\s+\.markdown-body\s+details\.markdown-thinking/,
    );
    expect(thinkingToneScope).not.toMatch(
      /(?:rgba?|hsla?)\(|#[0-9a-fA-F]{3,8}\b/,
    );
    expect(reducedMotionBlock).toContain(
      ".markdown-body details.markdown-thinking .thinking-loader",
    );
    expect(reducedMotionBlock).toMatch(/animation:\s*none !important;/);
  });

  test("keeps Gemini-style markdown list rhythm", () => {
    const markdownStyles = read("app/styles/markdown.scss");
    const listBlock = readCssBlock(
      markdownStyles,
      ".markdown-body ul,\n.markdown-body ol",
    );
    const listItemBlock = readCssBlock(markdownStyles, ".markdown-body li");
    const markerBlock = readCssBlock(
      markdownStyles,
      ".markdown-body li::marker",
    );
    const darkMarkerBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body li::marker",
    );
    const siblingItemBlock = readCssBlock(
      markdownStyles,
      ".markdown-body li + li",
    );
    const taskListItemBlock = readCssBlock(
      markdownStyles,
      ".markdown-body .task-list-item",
    );
    const listMarkerToneScope = [markerBlock, darkMarkerBlock].join("\n");

    expect(listBlock).toMatch(/padding-left:\s*1\.7em;/);
    expect(listBlock).toMatch(/line-height:\s*1\.65;/);
    expect(listItemBlock).toMatch(/padding-left:\s*0\.16em;/);
    expect(listItemBlock).toMatch(/line-height:\s*inherit;/);
    expect(markerBlock).toMatch(
      /color:\s*color-mix\(in srgb,\s*var\(--primary\) 72%,\s*transparent\);/,
    );
    expect(markerBlock).toMatch(/font-weight:\s*600;/);
    expect(darkMarkerBlock).toMatch(
      /color:\s*color-mix\(in srgb,\s*var\(--primary\) 58%,\s*var\(--black\)\);/,
    );
    expect(listMarkerToneScope).not.toMatch(
      /(?:rgba?|hsla?|oklch|oklab|lch|lab|color)\(|#[0-9a-fA-F]{3,8}\b/,
    );
    expect(siblingItemBlock).toMatch(/margin-top:\s*0\.38em;/);
    expect(taskListItemBlock).toMatch(/list-style-type:\s*none;/);
  });

  test("keeps Gemini-style markdown heading hierarchy", () => {
    const markdownStyles = read("app/styles/markdown.scss");
    const headingBlock = readCssBlock(
      markdownStyles,
      ".markdown-body h1,\n.markdown-body h2,\n.markdown-body h3,\n.markdown-body h4,\n.markdown-body h5,\n.markdown-body h6",
    );
    const h1Block = readCssBlock(markdownStyles, ".markdown-body h1");
    const h2Block = readCssBlock(markdownStyles, ".markdown-body h2");
    const h3Block = readCssBlock(markdownStyles, ".markdown-body h3");
    const darkH2RailBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body h2::before",
    );
    const h2AnchorBlock = readCssBlock(
      markdownStyles,
      ".markdown-body h2 .anchor",
    );
    const headingCodeBlock = readCssBlock(
      markdownStyles,
      ".markdown-body h1 tt,\n.markdown-body h1 code,\n.markdown-body h2 tt,\n.markdown-body h2 code,\n.markdown-body h3 tt,\n.markdown-body h3 code,\n.markdown-body h4 tt,\n.markdown-body h4 code,\n.markdown-body h5 tt,\n.markdown-body h5 code,\n.markdown-body h6 tt,\n.markdown-body h6 code",
    );
    const darkHeadingCodeBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body h1 tt,\n.dark .markdown-body h1 code,\n.dark .markdown-body h2 tt,\n.dark .markdown-body h2 code,\n.dark .markdown-body h3 tt,\n.dark .markdown-body h3 code,\n.dark .markdown-body h4 tt,\n.dark .markdown-body h4 code,\n.dark .markdown-body h5 tt,\n.dark .markdown-body h5 code,\n.dark .markdown-body h6 tt,\n.dark .markdown-body h6 code",
    );
    const summaryHeadingBlock = readCssBlock(
      markdownStyles,
      ".markdown-body summary h1,\n.markdown-body summary h2",
    );
    const h2RailToneScope = [h2Block, darkH2RailBlock].join("\n");

    expect(headingBlock).toMatch(/margin-top:\s*22px;/);
    expect(headingBlock).toMatch(/margin-bottom:\s*10px;/);
    expect(headingBlock).toMatch(/line-height:\s*1\.32;/);
    expect(headingBlock).toMatch(/letter-spacing:\s*0;/);
    expect(h1Block).toMatch(/font-size:\s*1\.55em;/);
    expect(h1Block).toMatch(/padding-bottom:\s*0;/);
    expect(h1Block).toMatch(/border-bottom:\s*0;/);
    expect(h2Block).toMatch(/position:\s*relative;/);
    expect(h2Block).toMatch(/padding-left:\s*12px;/);
    expect(h2Block).toMatch(/padding-bottom:\s*0;/);
    expect(h2Block).toMatch(/font-size:\s*1\.28em;/);
    expect(h2Block).toMatch(/border-bottom:\s*0;/);
    expect(h2Block).toMatch(/&::before[\s\S]*width:\s*3px;/);
    expect(h2Block).toMatch(
      /&::before[\s\S]*background:\s*color-mix\(in srgb,\s*var\(--primary\) 42%,\s*transparent\);/,
    );
    expect(darkH2RailBlock).toMatch(
      /background:\s*color-mix\(in srgb,\s*var\(--primary\) 58%,\s*var\(--black\)\);/,
    );
    expect(h2RailToneScope).not.toMatch(
      /(?:rgba?|hsla?|hwb|oklch|oklab|lch|lab|color|device-cmyk)\(|#[0-9a-fA-F]{3,8}\b/,
    );
    expect(h2AnchorBlock).toMatch(/margin-left:\s*-32px;/);
    expect(h3Block).toMatch(/font-size:\s*1\.12em;/);
    expect(headingCodeBlock).toMatch(/line-height:\s*inherit;/);
    expect(headingCodeBlock).toMatch(/background:\s*transparent;/);
    expect(headingCodeBlock).toMatch(/border:\s*0;/);
    expect(darkHeadingCodeBlock).toMatch(/background:\s*transparent;/);
    expect(darkHeadingCodeBlock).toMatch(/border:\s*0;/);
    expect(summaryHeadingBlock).toMatch(/padding-left:\s*0;/);
    expect(summaryHeadingBlock).toMatch(/&::before[\s\S]*display:\s*none;/);
  });

  test("keeps image editor controls aligned with Gemini surfaces", () => {
    const imageEditor = read("app/components/image-editor.tsx");
    const imageEditorStyles = read("app/components/image-editor.module.scss");
    const toolsContainerBlock = readCssBlock(
      imageEditorStyles,
      ".tools-container",
    );
    const imageEditorContainerBlock = readRootDeclarations(
      readCssBlock(imageEditorStyles, ".image-editor-container"),
    );
    const darkImageEditorContainerBlock = readCssBlock(
      imageEditorStyles,
      ":global(.dark) .image-editor-container",
    );
    const imageEditorAutoDarkMediaBlock = readCssBlock(
      imageEditorStyles,
      "@media (prefers-color-scheme: dark)",
    );
    const toolAndSizeOptionBlock = readCssBlock(
      imageEditorStyles,
      ".tool-option,\n.size-option",
    );
    const colorOptionBlock = readCssBlock(imageEditorStyles, ".color-option");
    const canvasContainerBlock = readCssBlock(
      imageEditorStyles,
      ".canvas-container",
    );
    const mobileBlock = readCssBlock(
      imageEditorStyles,
      "@media screen and (max-width: 600px)",
    );
    const reducedMotionBlock = readCssBlock(
      imageEditorStyles,
      "@media (prefers-reduced-motion: reduce)",
    );

    expect(imageEditor).toContain('role="toolbar"');
    expect(imageEditor).toContain('aria-label="图片编辑工具"');
    expect(imageEditor).toContain('role="group"');
    expect(imageEditor).toContain('aria-label="绘图工具"');
    expect(imageEditor).toContain('aria-label="颜色"');
    expect(imageEditor).toContain('aria-label="笔刷大小"');
    expect(imageEditor).toContain('aria-pressed={selectedTool === DrawingTool.Brush}');
    expect(imageEditor).toContain('aria-pressed={color === c}');
    expect(imageEditor).toContain('aria-pressed={brushSize === s}');
    expect(imageEditor).toContain('className={styles["size-dot"]}');
    expect(imageEditorStyles).not.toMatch(/#f3f3f3|#e1e1e1|#f0f0f0|#ccc/);
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-option-selected-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 12%,\s*transparent\s*\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-option-selected-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 22%,\s*transparent\s*\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-option-selected-color:\s*var\(--primary\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-option-selected-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 12%,\s*transparent\s*\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-swatch-selected-ring-color:\s*var\(--primary\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-swatch-selected-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 22%,\s*transparent\s*\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-panel-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 10%,\s*transparent\s*\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-panel-shadow-color:\s*color-mix\(\s*in srgb,\s*rgb\(0,\s*0,\s*0\) 10%,\s*transparent\s*\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-panel-inset-color:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 60%,\s*transparent\s*\);/,
    );
    expect(imageEditorContainerBlock).toMatch(/--image-editor-panel-radius:\s*8px;/);
    expect(imageEditorContainerBlock).toMatch(/--image-editor-control-radius:\s*8px;/);
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-control-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--black\) 6%,\s*transparent\s*\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-control-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 92%,\s*transparent\s*\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-swatch-border-color:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 92%,\s*transparent\s*\);/,
    );
    expect(imageEditorContainerBlock).toMatch(
      /--image-editor-swatch-rest-ring-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 22%,\s*transparent\s*\);/,
    );
    expect(darkImageEditorContainerBlock).toMatch(
      /--image-editor-option-selected-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 14%,\s*transparent\s*\);/,
    );
    expect(darkImageEditorContainerBlock).toMatch(
      /--image-editor-option-selected-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 28%,\s*transparent\s*\);/,
    );
    expect(darkImageEditorContainerBlock).toMatch(
      /--image-editor-option-selected-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 46%,\s*var\(--black\)\s*\);/,
    );
    expect(darkImageEditorContainerBlock).toMatch(
      /--image-editor-swatch-selected-ring-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 46%,\s*var\(--black\)\s*\);/,
    );
    expect(darkImageEditorContainerBlock).toMatch(
      /--image-editor-panel-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 12%,\s*transparent\s*\);/,
    );
    expect(darkImageEditorContainerBlock).toMatch(
      /--image-editor-panel-shadow-color:\s*color-mix\(\s*in srgb,\s*rgb\(0,\s*0,\s*0\) 28%,\s*transparent\s*\);/,
    );
    expect(darkImageEditorContainerBlock).toMatch(
      /--image-editor-control-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 88%,\s*transparent\s*\);/,
    );
    expect(imageEditorAutoDarkMediaBlock).toContain(
      ":global(body:not(.light)) .image-editor-container",
    );
    expect(imageEditorAutoDarkMediaBlock).toMatch(
      /--image-editor-panel-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 12%,\s*transparent\s*\);/,
    );
    expect(toolsContainerBlock).toMatch(/background:\s*var\(--surface-elevated\);/);
    expect(toolsContainerBlock).toMatch(
      /border:\s*1px solid var\(--image-editor-panel-border-color\);/,
    );
    expect(toolsContainerBlock).toMatch(
      /border-radius:\s*var\(--image-editor-panel-radius\);/,
    );
    expect(toolsContainerBlock).toMatch(
      /box-shadow:\s*0 12px 32px var\(--image-editor-panel-shadow-color\);/,
    );
    expect(toolsContainerBlock).toMatch(/backdrop-filter:\s*blur\(18px\);/);
    expect(toolAndSizeOptionBlock).toMatch(/width:\s*38px;/);
    expect(toolAndSizeOptionBlock).toMatch(/height:\s*38px;/);
    expect(toolAndSizeOptionBlock).toMatch(/border:\s*1px solid transparent;/);
    expect(toolAndSizeOptionBlock).toMatch(
      /border-radius:\s*var\(--image-editor-control-radius\);/,
    );
    expect(toolAndSizeOptionBlock).toMatch(
      /&:hover[\s\S]*background:\s*var\(--image-editor-control-hover-background\);/,
    );
    expect(toolAndSizeOptionBlock).toMatch(/color:\s*var\(--image-editor-control-color\);/);
    expect(toolAndSizeOptionBlock).toMatch(
      /&\.selected,[\s\S]*&\[aria-pressed="true"\]/,
    );
    expect(toolAndSizeOptionBlock).toMatch(
      /background:\s*var\(--image-editor-option-selected-background\);/,
    );
    expect(toolAndSizeOptionBlock).toMatch(
      /border-color:\s*var\(--image-editor-option-selected-border-color\);/,
    );
    expect(toolAndSizeOptionBlock).toMatch(
      /color:\s*var\(--image-editor-option-selected-color\);/,
    );
    expect(toolAndSizeOptionBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px\s*var\(--image-editor-option-selected-shadow-color\);/,
    );
    expect(toolAndSizeOptionBlock).toMatch(
      /&:focus-visible[\s\S]*outline:\s*var\(--focus-ring\);/,
    );
    expect(toolAndSizeOptionBlock).toMatch(
      /&:focus-visible[\s\S]*box-shadow:\s*var\(--focus-ring-shadow\);/,
    );
    expect(colorOptionBlock).toMatch(/width:\s*30px;/);
    expect(colorOptionBlock).toMatch(/height:\s*30px;/);
    expect(colorOptionBlock).toMatch(
      /border:\s*2px solid var\(--image-editor-swatch-border-color\);/,
    );
    expect(colorOptionBlock).toMatch(
      /box-shadow:\s*0 0 0 1px var\(--image-editor-swatch-rest-ring-color\);/,
    );
    expect(colorOptionBlock).toMatch(/&\.selected,[\s\S]*&\[aria-pressed="true"\]/);
    expect(colorOptionBlock).toMatch(
      /0 0 0 2px var\(--image-editor-swatch-selected-ring-color\)/,
    );
    expect(colorOptionBlock).toMatch(
      /0 6px 14px var\(--image-editor-swatch-selected-shadow-color\)/,
    );
    expect(imageEditorStyles).not.toMatch(
      /rgba\((?:66,\s*133,\s*244|138,\s*180,\s*248)|#(?:4285f4|8ab4f8)\b/,
    );
    expect(imageEditorStyles).not.toMatch(
      /:global\(\.dark\) \.(?:tool-option|color-option)/,
    );
    expect(imageEditorStyles).toContain(".size-dot");
    expect(canvasContainerBlock).toMatch(/background:\s*var\(--surface-elevated\);/);
    expect(canvasContainerBlock).toMatch(
      /border:\s*1px solid var\(--image-editor-panel-border-color\);/,
    );
    expect(canvasContainerBlock).toMatch(
      /border-radius:\s*var\(--image-editor-panel-radius\);/,
    );
    expect(canvasContainerBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--image-editor-panel-inset-color\);/,
    );
    expect(canvasContainerBlock).toMatch(/min-width:\s*0;/);
    expect(
      [toolsContainerBlock, toolAndSizeOptionBlock, canvasContainerBlock, mobileBlock].join(
        "\n",
      ),
    ).not.toMatch(
      /border:\s*var\(--border-in-light\)|border-radius:\s*(?:18|16|12)px/,
    );
    expect(mobileBlock).toContain(".tools-container");
    expect(mobileBlock).toMatch(/flex-direction:\s*column;/);
    expect(mobileBlock).toMatch(/padding:\s*10px;/);
    expect(mobileBlock).toMatch(
      /\.tools-container[\s\S]*border-radius:\s*var\(--image-editor-panel-radius\);/,
    );
    expect(mobileBlock).toMatch(
      /\.canvas-container[\s\S]*border-radius:\s*var\(--image-editor-panel-radius\);/,
    );
    expect(reducedMotionBlock).toContain(".tool-option");
    expect(reducedMotionBlock).toContain(".color-option");
    expect(reducedMotionBlock).toContain(".size-option");
    expect(reducedMotionBlock).toMatch(/transition-duration:\s*0\.01ms !important;/);
  });

  test("keeps secondary entry pages aligned with Gemini surfaces", () => {
    const searchChat = read("app/components/search-chat.tsx");
    const newChat = read("app/components/new-chat.tsx");
    const newChatStyles = read("app/components/new-chat.module.scss");
    const newChatRootBlock = readRootDeclarations(
      readCssBlock(newChatStyles, ".new-chat"),
    );

    expect(searchChat).toContain("selectSession(item.id)");
    expect(searchChat).toContain("to={Path.Chat}");
    expect(searchChat).toContain("onChange={(e) => setSearchText(e.currentTarget.value)}");
    expect(searchChat).toContain('onClick={() => setSearchText("")}');
    expect(newChat).toContain("chatStore.newSession(mask)");
    expect(newChat).toContain("navigate(Path.Chat)");
    expect(newChat).toContain("navigate(Path.Masks)");
    expect(newChat).toContain("dontShowMaskSplashScreen");
    expect(newChatStyles).not.toContain("radial-gradient");
    expect(newChatStyles).not.toContain("rgba(49, 94, 248");
    expect(newChatStyles).not.toContain("fill: white !important");
    expect(newChatRootBlock).toMatch(
      /(?:^|\n)\s*background:\s*var\(--new-chat-page-background\);/,
    );
  });

  test("keeps SD panel textareas aligned with Gemini utility fields", () => {
    const controlParam = read("app/components/sd/control-param.tsx");
    const controlParamItem = read("app/components/sd/control-param-item.tsx");
    const sdPanelStyles = read("app/components/sd/sd-panel.module.scss");
    const rootBlock = readCssBlock(sdPanelStyles, ".ctrl-param-item");
    const rootDeclarations = readRootDeclarations(rootBlock);
    const textareaBlock = readCssBlock(rootBlock, "textarea");
    const textareaFocusBlock = readCssBlock(textareaBlock, "&:focus-visible");
    const darkRootBlock = readCssBlock(
      sdPanelStyles,
      ":global(.dark) .ctrl-param-item",
    );
    const autoDarkSelector = ":global(body:not(.light)) .ctrl-param-item";
    const autoDarkSelectorIndex = sdPanelStyles.indexOf(autoDarkSelector);
    const autoDarkMediaIndex = sdPanelStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkSelectorIndex,
    );
    const autoDarkRootBlock = readCssBlock(
      sdPanelStyles.slice(autoDarkMediaIndex),
      autoDarkSelector,
    );
    const sdPanelFieldToneScope = [
      rootDeclarations,
      textareaBlock,
      textareaFocusBlock,
      darkRootBlock,
      autoDarkRootBlock,
    ].join("\n");

    expect(controlParam).toContain('case "textarea":');
    expect(controlParam).toContain("<textarea");
    expect(controlParam).toContain("aria-label={item.name}");
    expect(controlParam).toContain("rows={item.rows || 3}");
    expect(controlParam).toContain("placeholder={item.placeholder}");
    expect(controlParam).toContain(
      "props.onChange(item.value, e.currentTarget.value);",
    );
    expect(controlParam).toContain("value={props.data[item.value]}");
    expect(controlParamItem).toContain('styles["ctrl-param-item"]');
    expect(rootDeclarations).toMatch(/--sd-panel-field-radius:\s*8px;/);
    expect(rootDeclarations).toMatch(
      /--sd-panel-field-border-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 12%,\s*transparent\);/,
    );
    expect(rootDeclarations).toMatch(
      /--sd-panel-field-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 92%,\s*transparent\);/,
    );
    expect(rootDeclarations).toMatch(
      /--sd-panel-field-focus-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 42%,\s*transparent\);/,
    );
    expect(rootDeclarations).toMatch(
      /--sd-panel-field-focus-shadow:\s*0 0 0 3px color-mix\(in srgb,\s*var\(--primary\) 10%,\s*transparent\);/,
    );
    expect(textareaBlock).toMatch(/appearance:\s*none;/);
    expect(textareaBlock).toMatch(
      /border-radius:\s*var\(--sd-panel-field-radius\);/,
    );
    expect(textareaBlock).toMatch(
      /border:\s*1px solid var\(--sd-panel-field-border-color\);/,
    );
    expect(textareaBlock).toMatch(
      /background:\s*var\(--sd-panel-field-background\);/,
    );
    expect(textareaBlock).toMatch(/color:\s*var\(--sd-panel-field-color\);/);
    expect(textareaBlock).toMatch(/font-family:\s*inherit;/);
    expect(textareaBlock).toMatch(
      /transition:[\s\S]*border-color 0\.18s ease,[\s\S]*box-shadow 0\.18s ease,[\s\S]*background 0\.18s ease;/,
    );
    expect(textareaFocusBlock).toMatch(/outline:\s*none;/);
    expect(textareaFocusBlock).toMatch(
      /border-color:\s*var\(--sd-panel-field-focus-border-color\);/,
    );
    expect(textareaFocusBlock).toMatch(
      /box-shadow:\s*var\(--sd-panel-field-focus-shadow\);/,
    );
    expect(darkRootBlock).toMatch(
      /--sd-panel-field-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(darkRootBlock).toMatch(
      /--sd-panel-field-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 88%,\s*transparent\);/,
    );
    expect(autoDarkSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkRootBlock).toMatch(
      /--sd-panel-field-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(autoDarkRootBlock).toMatch(
      /--sd-panel-field-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 88%,\s*transparent\);/,
    );
    expect(sdPanelFieldToneScope).not.toContain("border: var(--border-in-light)");
    expect(sdPanelFieldToneScope).not.toContain("background: var(--white)");
    expect(sdPanelFieldToneScope).not.toContain("border-radius: 10px");
  });

  test("keeps SD output thumbnails aligned with Gemini multimodal surfaces", () => {
    const sd = read("app/components/sd/sd.tsx");
    const sdStyles = read("app/components/sd/sd.module.scss");
    const listBlock = readCssBlock(sdStyles, ".sd-img-list");
    const listRootDeclarations = readRootDeclarations(listBlock);
    const itemBlock = readCssBlock(listBlock, ".sd-img-item");
    const placeholderBlock = readCssBlock(itemBlock, ".pre-img");
    const thumbnailBlock = readCssBlock(itemBlock, ".img");
    const thumbnailButtonBlock = readCssBlock(itemBlock, "button.img");
    const thumbnailButtonFocusBlock = readCssBlock(
      thumbnailButtonBlock,
      "&:focus-visible",
    );
    const darkListBlock = readCssBlock(
      sdStyles,
      ":global(.dark) .sd-img-list",
    );
    const autoDarkSelector = ":global(body:not(.light)) .sd-img-list";
    const autoDarkSelectorIndex = sdStyles.indexOf(autoDarkSelector);
    const autoDarkMediaIndex = sdStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkSelectorIndex,
    );
    const autoDarkListBlock = readCssBlock(
      sdStyles.slice(autoDarkMediaIndex),
      autoDarkSelector,
    );
    const sdOutputToneScope = [
      listRootDeclarations,
      placeholderBlock,
      thumbnailBlock,
      thumbnailButtonBlock,
      thumbnailButtonFocusBlock,
      darkListBlock,
      autoDarkListBlock,
    ].join("\n");

    expect(sd).toContain('className={styles["sd-img-list"]}');
    expect(sd).toContain('className={styles["sd-img-item"]}');
    expect(sd).toContain('className={styles["pre-img"]}');
    expect(sd).toContain('className={styles["img"]}');
    expect(sd).toContain("showImageModal(");
    expect(sd).toContain("copyToClipboard(");
    expect(sd).toContain("getMessageTextContent({");
    expect(sd).toContain("removeImage(item.img_data)");
    expect(listRootDeclarations).toMatch(/--sd-output-thumb-radius:\s*8px;/);
    expect(listRootDeclarations).toMatch(
      /--sd-output-thumb-background:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 82%,\s*transparent\);/,
    );
    expect(listRootDeclarations).toMatch(
      /--sd-output-thumb-border-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 12%,\s*transparent\);/,
    );
    expect(placeholderBlock).toMatch(/width:\s*130px;/);
    expect(placeholderBlock).toMatch(/height:\s*130px;/);
    expect(placeholderBlock).toMatch(
      /border-radius:\s*var\(--sd-output-thumb-radius\);/,
    );
    expect(placeholderBlock).toMatch(
      /background:\s*var\(--sd-output-thumb-background\);/,
    );
    expect(placeholderBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--sd-output-thumb-border-color\);/,
    );
    expect(thumbnailBlock).toMatch(/width:\s*130px;/);
    expect(thumbnailBlock).toMatch(/height:\s*130px;/);
    expect(thumbnailBlock).toMatch(
      /border-radius:\s*var\(--sd-output-thumb-radius\);/,
    );
    expect(thumbnailBlock).toMatch(
      /transition:[\s\S]*opacity 0\.18s ease,[\s\S]*transform 0\.18s ease,[\s\S]*box-shadow 0\.18s ease;/,
    );
    expect(thumbnailButtonBlock).toMatch(/box-shadow:\s*0 10px 28px/);
    expect(thumbnailButtonBlock).toMatch(/&:hover[\s\S]*opacity:\s*0\.86;/);
    expect(thumbnailButtonBlock).toMatch(
      /&:hover[\s\S]*transform:\s*translateY\(-1px\);/,
    );
    expect(thumbnailButtonFocusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(thumbnailButtonFocusBlock).toMatch(/outline-offset:\s*2px;/);
    expect(thumbnailButtonFocusBlock).toMatch(
      /box-shadow:\s*var\(--focus-ring-shadow\),[\s\S]*0 10px 28px var\(--sd-output-thumb-shadow-color\);/,
    );
    expect(darkListBlock).toMatch(
      /--sd-output-thumb-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 78%,\s*transparent\);/,
    );
    expect(darkListBlock).toMatch(
      /--sd-output-thumb-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(autoDarkSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkListBlock).toMatch(
      /--sd-output-thumb-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 78%,\s*transparent\);/,
    );
    expect(autoDarkListBlock).toMatch(
      /--sd-output-thumb-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(sdOutputToneScope).not.toContain("background-color: var(--second)");
    expect(sdOutputToneScope).not.toContain("border-radius: 10px");
    expect(sdOutputToneScope).not.toContain("transition: all .3s");
  });

  test("keeps New Chat aligned with Gemini start surfaces", () => {
    const newChat = read("app/components/new-chat.tsx");
    const newChatStyles = read("app/components/new-chat.module.scss");
    const newChatRootBlock = readRootDeclarations(
      readCssBlock(newChatStyles, ".new-chat"),
    );
    const maskHeaderBlock = readCssBlock(newChatStyles, ".mask-header");
    const maskHeaderButtonBlock = readCssBlock(maskHeaderBlock, "button");
    const titleBlock = readCssBlock(newChatStyles, ".title");
    const subtitleBlock = readCssBlock(newChatStyles, ".sub-title");
    const composerBlock = readCssBlock(newChatStyles, ".composer");
    const composerFocusBlock = readCssBlock(composerBlock, "&:focus-visible");
    const composerActionBlock = readCssBlock(newChatStyles, ".composer-action");
    const composerActionPathBlock = readCssBlock(composerActionBlock, "path");
    const moreButtonBlock = readCssBlock(newChatStyles, ".more");
    const maskBlock = readCssBlock(newChatStyles, ".mask");
    const maskFocusBlock = readCssBlock(maskBlock, "&:focus-visible");
    const darkNewChatBlock = readCssBlock(
      newChatStyles,
      ":global(.dark) .new-chat",
    );
    const autoDarkNewChatSelector = ":global(body:not(.light)) .new-chat";
    const autoDarkNewChatIndex = newChatStyles.indexOf(autoDarkNewChatSelector);
    const autoDarkNewChatMediaIndex = newChatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkNewChatIndex,
    );
    const autoDarkNewChatBlock = readCssBlock(
      newChatStyles.slice(autoDarkNewChatMediaIndex),
      autoDarkNewChatSelector,
    );
    const mobileBlock = readCssBlock(
      newChatStyles,
      "@media screen and (max-width: 520px)",
    );
    const mobileComposerBlock = readCssBlock(mobileBlock, ".composer");
    const mobileComposerActionBlock = readCssBlock(mobileBlock, ".composer-action");
    const newChatPaintScope = [
      newChatRootBlock,
      maskHeaderButtonBlock,
      titleBlock,
      subtitleBlock,
      composerBlock,
      composerFocusBlock,
      composerActionBlock,
      composerActionPathBlock,
      moreButtonBlock,
      maskBlock,
      maskFocusBlock,
      darkNewChatBlock,
      autoDarkNewChatBlock,
      mobileComposerBlock,
      mobileComposerActionBlock,
    ].join("\n");

    expect(newChat).toContain("chatStore.newSession(mask)");
    expect(newChat).toContain("startChat(mask ?? undefined)");
    expect(newChat).toContain("navigate(Path.Chat)");
    expect(newChat).toContain("navigate(Path.Masks)");
    expect(newChat).toContain("showConfirm(Locale.NewChat.ConfirmNoShow)");
    expect(newChat).toContain("dontShowMaskSplashScreen = true");
    expect(newChat).toContain("dataMobileSidebarTrigger={isCompactScreen}");

    expect(newChatRootBlock).toMatch(
      /--new-chat-page-background:\s*var\(--surface\);/,
    );
    expect(newChatRootBlock).toMatch(
      /--new-chat-control-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 94%,\s*var\(--white\)\s*\);/,
    );
    expect(newChatRootBlock).toMatch(
      /--new-chat-mask-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 5%,\s*transparent\s*\);/,
    );
    expect(newChatRootBlock).toMatch(/background:\s*var\(--new-chat-page-background\);/);
    expect(maskHeaderButtonBlock).toMatch(
      /border:\s*1px solid var\(--new-chat-control-border-color\);/,
    );
    expect(maskHeaderButtonBlock).toMatch(/border-radius:\s*8px;/);
    expect(maskHeaderButtonBlock).toMatch(
      /background:\s*var\(--new-chat-control-background\);/,
    );
    expect(titleBlock).toMatch(/letter-spacing:\s*0;/);
    expect(subtitleBlock).toMatch(/color:\s*var\(--new-chat-muted-color\);/);
    expect(composerBlock).toMatch(/min-height:\s*60px;/);
    expect(composerBlock).toMatch(
      /border:\s*1px solid var\(--new-chat-control-border-color\);/,
    );
    expect(composerBlock).toMatch(/border-radius:\s*8px;/);
    expect(composerBlock).toMatch(
      /background:\s*var\(--new-chat-control-background\);/,
    );
    expect(composerBlock).toMatch(
      /box-shadow:\s*0 14px 34px var\(--new-chat-control-shadow-color\);/,
    );
    expect(composerFocusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(composerFocusBlock).toMatch(
      /border-color:\s*var\(--new-chat-control-focus-border-color\);/,
    );
    expect(composerActionBlock).toMatch(/width:\s*40px;/);
    expect(composerActionBlock).toMatch(/height:\s*40px;/);
    expect(composerActionBlock).toMatch(/border-radius:\s*8px;/);
    expect(composerActionBlock).toMatch(
      /background:\s*var\(--new-chat-action-background\);/,
    );
    expect(composerActionPathBlock).toMatch(
      /fill:\s*var\(--new-chat-action-foreground\) !important;/,
    );
    expect(moreButtonBlock).toMatch(
      /border:\s*1px solid var\(--new-chat-control-border-color\);/,
    );
    expect(moreButtonBlock).toMatch(/border-radius:\s*8px;/);
    expect(moreButtonBlock).toMatch(
      /background:\s*var\(--new-chat-control-background\);/,
    );
    expect(maskBlock).toMatch(
      /border:\s*1px solid var\(--new-chat-control-border-color\);/,
    );
    expect(maskBlock).toMatch(/border-radius:\s*8px;/);
    expect(maskBlock).toMatch(
      /background:\s*var\(--new-chat-control-background\);/,
    );
    expect(maskFocusBlock).toMatch(
      /background:\s*var\(--new-chat-mask-hover-background\);/,
    );
    expect(darkNewChatBlock).toMatch(
      /--new-chat-control-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(darkNewChatBlock).toMatch(
      /--new-chat-control-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 9%,\s*transparent\s*\);/,
    );
    expect(darkNewChatBlock).toMatch(
      /--new-chat-control-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 12%,\s*transparent\s*\);/,
    );
    expect(darkNewChatBlock).toMatch(
      /--new-chat-control-focus-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 34%,\s*transparent\s*\);/,
    );
    expect(darkNewChatBlock).toMatch(
      /--new-chat-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 84%,\s*transparent\s*\);/,
    );
    expect(darkNewChatBlock).toMatch(
      /--new-chat-action-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 92%,\s*var\(--white\)\s*\);/,
    );
    expect(darkNewChatBlock).toMatch(
      /--new-chat-mask-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 9%,\s*transparent\s*\);/,
    );
    expect(autoDarkNewChatIndex).toBeGreaterThan(-1);
    expect(autoDarkNewChatMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkNewChatBlock).toMatch(
      /--new-chat-control-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkNewChatBlock).toMatch(
      /--new-chat-control-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 9%,\s*transparent\s*\);/,
    );
    expect(autoDarkNewChatBlock).toMatch(
      /--new-chat-control-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 12%,\s*transparent\s*\);/,
    );
    expect(autoDarkNewChatBlock).toMatch(
      /--new-chat-control-focus-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 34%,\s*transparent\s*\);/,
    );
    expect(autoDarkNewChatBlock).toMatch(
      /--new-chat-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 84%,\s*transparent\s*\);/,
    );
    expect(autoDarkNewChatBlock).toMatch(
      /--new-chat-action-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 92%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkNewChatBlock).toMatch(
      /--new-chat-mask-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 9%,\s*transparent\s*\);/,
    );
    expect(mobileComposerBlock).toMatch(/min-height:\s*56px;/);
    expect(mobileComposerBlock).toMatch(/border-radius:\s*8px;/);
    expect(mobileComposerActionBlock).toMatch(/width:\s*40px;/);
    expect(mobileComposerActionBlock).toMatch(/height:\s*40px;/);
    expect(newChatPaintScope).not.toContain("border: var(--border-in-light)");
    expect(newChatPaintScope).not.toContain("box-shadow: var(--composer-shadow)");
    expect(newChatPaintScope).not.toContain("border-radius: 30px");
    expect(newChatPaintScope).not.toContain("border-radius: 26px");
    expect(newChatPaintScope).not.toContain("border-radius: 24px");
    expect(newChatPaintScope).not.toContain("border-radius: 14px");
    expect(newChatStyles).not.toContain("fill: white !important");
  });

  test("keeps Search Chat aligned with Gemini command surfaces", () => {
    const searchChat = read("app/components/search-chat.tsx");
    const searchChatStyles = read("app/components/search-chat.module.scss");
    const searchRootBlock = readRootDeclarations(
      readCssBlock(searchChatStyles, ".search-page"),
    );
    const closeBlock = readCssBlock(searchChatStyles, ".search-close");
    const closeButtonBlock = readCssBlock(closeBlock, "button");
    const titleBlock = readCssBlock(searchChatStyles, ".search-title");
    const subtitleBlock = readCssBlock(searchChatStyles, ".search-subtitle");
    const searchInputBlock = readCssBlock(searchChatStyles, ".search-input");
    const searchInputFocusBlock = readCssBlock(searchInputBlock, "&:focus-visible");
    const scopedSearchInputBlock = readCssBlock(
      searchChatStyles,
      ".search-box input.search-input",
    );
    const clearSearchBlock = readCssBlock(searchChatStyles, ".clear-search");
    const clearSearchFocusBlock = readCssBlock(clearSearchBlock, "&:focus-visible");
    const resultPanelBlock = readCssBlock(searchChatStyles, ".result-panel");
    const headingBlock = readCssBlock(searchChatStyles, ".result-heading");
    const resultItemBlock = readCssBlock(searchChatStyles, ".result-item");
    const resultItemFocusBlock = readCssBlock(resultItemBlock, "&:focus-visible");
    const snippetBlock = readCssBlock(searchChatStyles, ".result-snippet");
    const actionBlock = readCssBlock(searchChatStyles, ".result-action");
    const emptyStateBlock = readCssBlock(searchChatStyles, ".empty-state");
    const darkSearchBlock = readCssBlock(
      searchChatStyles,
      ":global(.dark) .search-page",
    );
    const autoDarkSearchSelector = ":global(body:not(.light)) .search-page";
    const autoDarkSearchIndex = searchChatStyles.indexOf(autoDarkSearchSelector);
    const autoDarkSearchMediaIndex = searchChatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkSearchIndex,
    );
    const autoDarkSearchBlock = readCssBlock(
      searchChatStyles.slice(autoDarkSearchMediaIndex),
      autoDarkSearchSelector,
    );
    const mobileBlock = readCssBlock(
      searchChatStyles,
      "@media screen and (max-width: 520px)",
    );
    const mobileSearchInputBlock = readCssBlock(mobileBlock, ".search-input");
    const mobileResultPanelBlock = readCssBlock(mobileBlock, ".result-panel");
    const searchPaintScope = [
      searchRootBlock,
      closeButtonBlock,
      titleBlock,
      subtitleBlock,
      searchInputBlock,
      searchInputFocusBlock,
      scopedSearchInputBlock,
      clearSearchBlock,
      clearSearchFocusBlock,
      resultPanelBlock,
      headingBlock,
      resultItemBlock,
      resultItemFocusBlock,
      snippetBlock,
      actionBlock,
      emptyStateBlock,
      darkSearchBlock,
      autoDarkSearchBlock,
      mobileSearchInputBlock,
      mobileResultPanelBlock,
    ].join("\n");

    expect(searchChat).toContain("selectSession(item.id)");
    expect(searchChat).toContain("to={Path.Chat}");
    expect(searchChat).toContain("setSearchText(e.currentTarget.value)");
    expect(searchChat).toContain('onClick={() => setSearchText("")}');
    expect(searchChat).toContain("const hasSearchText = searchText.trim().length > 0");
    expect(searchChat).toContain("Locale.SearchChat.Page.NoResult");
    expect(searchChat).toContain("Locale.SearchChat.Page.NoData");

    expect(searchRootBlock).toMatch(
      /--search-page-background:\s*var\(--surface\);/,
    );
    expect(searchRootBlock).toMatch(
      /--search-panel-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 94%,\s*var\(--white\)\s*\);/,
    );
    expect(searchRootBlock).toMatch(
      /--search-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 92%,\s*transparent\s*\);/,
    );
    expect(searchRootBlock).toMatch(
      /--search-item-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 5%,\s*transparent\s*\);/,
    );
    expect(searchRootBlock).toMatch(/background:\s*var\(--search-page-background\);/);
    expect(closeButtonBlock).toMatch(/border:\s*1px solid var\(--search-panel-border-color\);/);
    expect(closeButtonBlock).toMatch(/border-radius:\s*8px;/);
    expect(closeButtonBlock).toMatch(/background:\s*var\(--search-panel-background\);/);
    expect(titleBlock).toMatch(/letter-spacing:\s*0;/);
    expect(subtitleBlock).toMatch(/color:\s*var\(--search-muted-color\);/);
    expect(searchInputBlock).toMatch(/height:\s*56px;/);
    expect(searchInputBlock).toMatch(/border:\s*1px solid var\(--search-field-border-color\);/);
    expect(searchInputBlock).toMatch(/border-radius:\s*8px;/);
    expect(searchInputBlock).toMatch(/background:\s*var\(--search-field-background\);/);
    expect(searchInputBlock).toMatch(/box-shadow:\s*0 14px 34px var\(--search-panel-shadow-color\);/);
    expect(searchInputFocusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(searchInputFocusBlock).toMatch(
      /border-color:\s*var\(--search-field-focus-border-color\);/,
    );
    expect(scopedSearchInputBlock).toMatch(/border-radius:\s*8px;/);
    expect(scopedSearchInputBlock).toMatch(
      /background:\s*var\(--search-field-background\);/,
    );
    expect(clearSearchBlock).toMatch(/color:\s*var\(--search-muted-color\);/);
    expect(clearSearchFocusBlock).toMatch(
      /background:\s*var\(--search-item-hover-background\);/,
    );
    expect(resultPanelBlock).toMatch(/border:\s*1px solid var\(--search-panel-border-color\);/);
    expect(resultPanelBlock).toMatch(/border-radius:\s*8px;/);
    expect(resultPanelBlock).toMatch(/background:\s*var\(--search-panel-background\);/);
    expect(resultPanelBlock).toMatch(/box-shadow:\s*0 14px 34px var\(--search-panel-shadow-color\);/);
    expect(headingBlock).toMatch(/color:\s*var\(--search-muted-color\);/);
    expect(resultItemBlock).toMatch(/border-radius:\s*8px;/);
    expect(resultItemFocusBlock).toMatch(
      /background:\s*var\(--search-item-hover-background\);/,
    );
    expect(snippetBlock).toMatch(/color:\s*var\(--search-muted-color\);/);
    expect(actionBlock).toMatch(/color:\s*var\(--search-action-color\);/);
    expect(emptyStateBlock).toMatch(/border-radius:\s*8px;/);
    expect(emptyStateBlock).toMatch(/background:\s*var\(--search-empty-background\);/);
    expect(darkSearchBlock).toMatch(
      /--search-panel-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkSearchIndex).toBeGreaterThan(-1);
    expect(autoDarkSearchMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkSearchBlock).toMatch(
      /--search-panel-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(mobileSearchInputBlock).toMatch(/height:\s*52px;/);
    expect(mobileSearchInputBlock).toMatch(/border-radius:\s*8px;/);
    expect(mobileResultPanelBlock).toMatch(/border-radius:\s*8px;/);
    expect(searchPaintScope).not.toContain("border: var(--border-in-light)");
    expect(searchPaintScope).not.toContain("box-shadow: var(--composer-shadow)");
    expect(searchPaintScope).not.toContain("border-radius: 28px");
    expect(searchPaintScope).not.toContain("border-radius: 22px");
    expect(searchPaintScope).not.toContain("border-radius: 14px");
  });

  test("keeps auth gate aligned with Gemini secure entry surfaces", () => {
    const authPage = read("app/components/auth.tsx");
    const authStyles = read("app/components/auth.module.scss");
    const authBlock = readCssBlock(authStyles, ".auth-page");
    const authRootBlock = readRootDeclarations(authBlock);
    const logoBlock = readCssBlock(authBlock, ".auth-logo");
    const titleBlock = readCssBlock(authBlock, ".auth-title");
    const tipsBlock = readCssBlock(authBlock, ".auth-tips");
    const passwordContainerBlock = readCssBlock(
      authBlock,
      ":global(.password-input-container)",
    );
    const passwordEyeBlock = readCssBlock(
      passwordContainerBlock,
      ":global(.password-eye)",
    );
    const passwordInputBlock = readCssBlock(
      passwordContainerBlock,
      ":global(.password-input)",
    );
    const passwordInputFocusBlock = readCssBlock(
      passwordInputBlock,
      "&:focus-visible",
    );
    const actionsBlock = readCssBlock(authBlock, ".auth-actions");
    const actionButtonBlock = readCssBlock(actionsBlock, "button");
    const darkAuthBlock = readCssBlock(authStyles, ":global(.dark) .auth-page");
    const autoDarkAuthSelector = ":global(body:not(.light)) .auth-page";
    const autoDarkAuthIndex = authStyles.indexOf(autoDarkAuthSelector);
    const autoDarkAuthMediaIndex = authStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkAuthIndex,
    );
    const autoDarkAuthBlock = readCssBlock(
      authStyles.slice(autoDarkAuthMediaIndex),
      autoDarkAuthSelector,
    );
    const mobileBlock = readCssBlock(
      authStyles,
      "@media screen and (max-width: 600px)",
    );
    const mobileAuthBlock = readCssBlock(mobileBlock, ".auth-page");
    const authPaintScope = [
      authRootBlock,
      logoBlock,
      titleBlock,
      tipsBlock,
      passwordContainerBlock,
      passwordEyeBlock,
      passwordInputBlock,
      actionsBlock,
      actionButtonBlock,
      darkAuthBlock,
      autoDarkAuthBlock,
      mobileAuthBlock,
    ].join("\n");

    expect(authPage).toContain("accessStore.validateAccessCode()");
    expect(authPage).toContain("navigate(Path.Chat)");
    expect(authPage).toContain("showToast(");
    expect(authPage).toContain('accessStore.accessCodeError === "rate_limited"');
    expect(authPage).toContain("accessStore.setAccessCode(e.currentTarget.value)");
    expect(authPage).toContain("disabled={accessStore.isValidatingAccessCode}");
    expect(authPage).toContain("Locale.Auth.Validating");
    expect(authPage).toContain("Locale.Auth.Confirm");
    expect(authPage).not.toContain('marginTop: "3vh"');
    expect(authPage).not.toContain('marginBottom: "3vh"');

    expect(authRootBlock).toMatch(
      /--auth-panel-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 92%,\s*var\(--white\)\s*\);/,
    );
    expect(authRootBlock).toMatch(
      /--auth-panel-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(authRootBlock).toMatch(
      /--auth-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface\) 72%,\s*var\(--white\)\s*\);/,
    );
    expect(authRootBlock).toMatch(/padding:\s*clamp\(24px,\s*8vh,\s*72px\) 20px;/);
    expect(authRootBlock).toMatch(/background:\s*var\(--auth-page-background\);/);
    expect(authRootBlock).toMatch(/gap:\s*14px;/);
    expect(logoBlock).toMatch(/background:\s*var\(--auth-logo-background\);/);
    expect(logoBlock).toMatch(/border:\s*1px solid var\(--auth-panel-border-color\);/);
    expect(logoBlock).toMatch(/border-radius:\s*16px;/);
    expect(titleBlock).toMatch(/font-size:\s*clamp\(24px,\s*5vw,\s*32px\);/);
    expect(titleBlock).toMatch(/letter-spacing:\s*0;/);
    expect(tipsBlock).toMatch(/color:\s*var\(--auth-muted-color\);/);
    expect(passwordContainerBlock).toMatch(/width:\s*min\(360px,\s*100%\);/);
    expect(passwordContainerBlock).toMatch(
      /background:\s*var\(--auth-field-background\);/,
    );
    expect(passwordContainerBlock).toMatch(
      /border:\s*1px solid var\(--auth-field-border-color\);/,
    );
    expect(passwordContainerBlock).toMatch(/border-radius:\s*8px;/);
    expect(passwordEyeBlock).toMatch(/color:\s*var\(--auth-muted-color\);/);
    expect(passwordInputBlock).toMatch(/min-width:\s*0;/);
    expect(passwordInputBlock).toMatch(/background:\s*transparent;/);
    expect(passwordInputBlock).toMatch(/border:\s*0;/);
    expect(passwordInputFocusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(actionsBlock).toMatch(/width:\s*min\(360px,\s*100%\);/);
    expect(actionButtonBlock).toMatch(/border-radius:\s*8px;/);
    expect(darkAuthBlock).toMatch(
      /--auth-panel-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(darkAuthBlock).toMatch(
      /--auth-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 78%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkAuthIndex).toBeGreaterThan(-1);
    expect(autoDarkAuthMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkAuthBlock).toMatch(
      /--auth-panel-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(mobileAuthBlock).toMatch(/padding:\s*28px 16px;/);
    expect(authPaintScope).not.toContain("margin-top: 10vh");
    expect(authPaintScope).not.toContain("transform: scale(1.4)");
    expect(authPaintScope).not.toContain("font-weight: bold");
    expect(authPaintScope).not.toMatch(/line-height:\s*2;/);
    expect(authPaintScope).not.toContain("width: 65px");
    expect(authPaintScope).not.toContain("margin-bottom: 10px");
  });

  test("keeps Masks and Plugins list surfaces aligned with Gemini utility cards", () => {
    const maskPage = read("app/components/mask.tsx");
    const pluginPage = read("app/components/plugin.tsx");
    const maskStyles = read("app/components/mask.module.scss");
    const maskPageBlock = readCssBlock(maskStyles, ".mask-page");
    const maskPageRootBlock = readRootDeclarations(maskPageBlock);
    const maskPageBodyBlock = readCssBlock(maskPageBlock, ".mask-page-body");
    const filterBlock = readCssBlock(maskPageBodyBlock, ".mask-filter");
    const searchBarBlock = readCssBlock(filterBlock, ".search-bar");
    const searchFocusBlock = readCssBlock(searchBarBlock, "&:focus-visible");
    const langBlock = readCssBlock(filterBlock, ".mask-filter-lang");
    const createBlock = readCssBlock(filterBlock, ".mask-create");
    const maskItemBlock = readCssBlock(maskPageBodyBlock, ".mask-item");
    const itemRootBlock = readRootDeclarations(maskItemBlock);
    const itemHoverBlock = readCssBlock(maskItemBlock, "&:hover");
    const notLastBlock = readCssBlock(maskItemBlock, "&:not(:last-child)");
    const firstBlock = readCssBlock(maskItemBlock, "&:first-child");
    const lastBlock = readCssBlock(maskItemBlock, "&:last-child");
    const headerBlock = readCssBlock(maskItemBlock, ".mask-header");
    const titleBlock = readCssBlock(headerBlock, ".mask-title");
    const infoBlock = readCssBlock(titleBlock, ".mask-info");
    const actionsBlock = readCssBlock(maskItemBlock, ".mask-actions");
    const actionBlock = readCssBlock(actionsBlock, ".mask-action");
    const mobileItemBlock = readCssBlock(
      maskItemBlock,
      "@media screen and (max-width: 600px)",
    );
    const darkMaskPageBlock = readCssBlock(
      maskStyles,
      ":global(.dark) .mask-page",
    );
    const autoDarkMaskSelector = ":global(body:not(.light)) .mask-page";
    const autoDarkMaskIndex = maskStyles.indexOf(autoDarkMaskSelector);
    const autoDarkMaskMediaIndex = maskStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkMaskIndex,
    );
    const autoDarkMaskBlock = readCssBlock(
      maskStyles.slice(autoDarkMaskMediaIndex),
      autoDarkMaskSelector,
    );
    const masksPaintScope = [
      maskPageRootBlock,
      filterBlock,
      searchBarBlock,
      langBlock,
      createBlock,
      itemRootBlock,
      itemHoverBlock,
      notLastBlock,
      firstBlock,
      lastBlock,
      infoBlock,
      actionsBlock,
      actionBlock,
      mobileItemBlock,
      darkMaskPageBlock,
      autoDarkMaskBlock,
    ].join("\n");

    expect(maskPage).toContain('styles["mask-page"]');
    expect(maskPage).toContain('styles["mask-filter"]');
    expect(maskPage).toContain('styles["mask-filter-lang"]');
    expect(maskPage).toContain('styles["mask-create"]');
    expect(maskPage).toContain('styles["mask-item"]');
    expect(maskPage).toContain('styles["mask-actions"]');
    expect(maskPage).toContain("maskStore.setLanguage(undefined)");
    expect(maskPage).toContain("maskStore.setLanguage(value as Lang)");
    expect(maskPage).toContain("maskStore.create()");
    expect(maskPage).toContain("setEditingMaskId(createdMask.id)");
    expect(maskPage).toContain("chatStore.newSession(m)");
    expect(maskPage).toContain("navigate(Path.Chat)");
    expect(maskPage).toContain("text={Locale.Mask.Item.View}");
    expect(maskPage).toContain("text={Locale.Mask.Item.Edit}");
    expect(maskPage.match(/setEditingMaskId\(m\.id\)/g)?.length).toBeGreaterThanOrEqual(
      2,
    );
    expect(maskPage).toContain("showConfirm(Locale.Mask.Item.DeleteConfirm)");
    expect(maskPage).toContain("maskStore.delete(m.id)");

    expect(pluginPage).toContain('styles["mask-page"]');
    expect(pluginPage).toContain('styles["mask-filter"]');
    expect(pluginPage).toContain('styles["mask-create"]');
    expect(pluginPage).toContain('styles["mask-item"]');
    expect(pluginPage).toContain('styles["mask-actions"]');
    expect(pluginPage).toContain("pluginStore.create()");
    expect(pluginPage).toContain("setEditingPluginId(createdPlugin.id)");
    expect(pluginPage).toContain("setEditingPluginId(m.id)");
    expect(pluginPage).toContain("showConfirm(Locale.Plugin.Item.DeleteConfirm)");
    expect(pluginPage).toContain("pluginStore.delete(m.id)");

    expect(maskPageRootBlock).toMatch(
      /--mask-list-item-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 94%,\s*var\(--white\)\s*\);/,
    );
    expect(maskPageRootBlock).toMatch(
      /--mask-list-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(maskPageRootBlock).toMatch(
      /--mask-list-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 5%,\s*transparent\s*\);/,
    );
    expect(maskPageRootBlock).toMatch(
      /--mask-filter-control-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 92%,\s*transparent\s*\);/,
    );
    expect(filterBlock).toMatch(/gap:\s*10px;/);
    expect(searchBarBlock).toMatch(
      /border:\s*1px solid var\(--mask-filter-border-color\);/,
    );
    expect(searchBarBlock).toMatch(/border-radius:\s*8px;/);
    expect(searchBarBlock).toMatch(
      /background:\s*var\(--mask-filter-control-background\);/,
    );
    expect(searchFocusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(searchFocusBlock).toMatch(
      /border-color:\s*var\(--mask-filter-focus-border-color\);/,
    );
    expect(langBlock).toMatch(/margin-left:\s*0;/);
    expect(createBlock).toMatch(/margin-left:\s*0;/);
    expect(itemRootBlock).toMatch(
      /border:\s*1px solid var\(--mask-list-border-color\);/,
    );
    expect(itemRootBlock).toMatch(
      /background:\s*var\(--mask-list-item-background\);/,
    );
    expect(itemRootBlock).toMatch(
      /transition:\s*background-color 0\.18s ease,\s*border-color 0\.18s ease,\s*box-shadow 0\.18s ease;/,
    );
    expect(itemHoverBlock).toMatch(
      /background-color:\s*var\(--mask-list-hover-background\);/,
    );
    expect(firstBlock).toMatch(/border-top-left-radius:\s*8px;/);
    expect(firstBlock).toMatch(/border-top-right-radius:\s*8px;/);
    expect(lastBlock).toMatch(/border-bottom-left-radius:\s*8px;/);
    expect(lastBlock).toMatch(/border-bottom-right-radius:\s*8px;/);
    expect(infoBlock).toMatch(/color:\s*var\(--mask-list-muted-color\);/);
    expect(actionsBlock).toMatch(/gap:\s*6px;/);
    expect(actionsBlock).toMatch(
      /transition:\s*color 0\.18s ease,\s*opacity 0\.18s ease;/,
    );
    expect(actionBlock).toMatch(/color:\s*var\(--mask-list-action-color\);/);
    expect(mobileItemBlock).toMatch(/border-radius:\s*8px;/);
    expect(mobileItemBlock).toMatch(
      /box-shadow:\s*0 12px 30px var\(--mask-list-shadow-color\);/,
    );
    expect(mobileItemBlock).toMatch(
      /border-bottom:\s*1px solid var\(--mask-list-border-color\);/,
    );
    expect(darkMaskPageBlock).toMatch(
      /--mask-list-item-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(darkMaskPageBlock).toMatch(
      /--mask-list-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 9%,\s*transparent\s*\);/,
    );
    expect(autoDarkMaskIndex).toBeGreaterThan(-1);
    expect(autoDarkMaskMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkMaskBlock).toMatch(
      /--mask-list-item-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkMaskBlock).toMatch(
      /--mask-list-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 9%,\s*transparent\s*\);/,
    );
    expect(masksPaintScope).not.toContain("border: var(--border-in-light)");
    expect(masksPaintScope).not.toContain("border-bottom: var(--border-in-light)");
    expect(masksPaintScope).not.toContain("background-color: var(--white)");
    expect(masksPaintScope).not.toContain("border-radius: 10px");
    expect(masksPaintScope).not.toContain("box-shadow: var(--card-shadow)");
  });

  test("keeps Plugin edit modal content surfaces aligned with Gemini utility fields", () => {
    const pluginPage = read("app/components/plugin.tsx");
    const pluginStyles = read("app/components/plugin.module.scss");
    const normalizedPluginPage = pluginPage.replace(/\s+/g, " ");
    const normalizedPluginStyles = pluginStyles.replace(/\s+/g, " ");
    const sharedSurfaceBlock = readCssBlock(
      normalizedPluginStyles,
      ".plugin-content, .plugin-schema",
    );
    const pluginContentBlock = readCssBlock(pluginStyles, ".plugin-content");
    const contentCodeBlock = readCssBlock(pluginContentBlock, "pre code");
    const codeFocusBlock = readCssBlock(contentCodeBlock, "&:focus-visible");
    const schemaStylesSource = pluginStyles.slice(
      pluginStyles.lastIndexOf("\n.plugin-schema {"),
    );
    const pluginSchemaBlock = readCssBlock(schemaStylesSource, ".plugin-schema");
    const schemaInputBlock = readCssBlock(pluginSchemaBlock, "input");
    const schemaInputFocusBlock = readCssBlock(schemaInputBlock, "&:focus-visible");
    const mobileSchemaBlock = readCssBlock(
      pluginSchemaBlock,
      "@media screen and (max-width: 600px)",
    );
    const mobileInputBlock = readCssBlock(mobileSchemaBlock, "input");
    const darkPluginContentBlock = readCssBlock(
      normalizedPluginStyles,
      ":global(.dark) .plugin-content, :global(.dark) .plugin-schema",
    );
    const autoDarkPluginSelector =
      ":global(body:not(.light)) .plugin-content, :global(body:not(.light)) .plugin-schema";
    const autoDarkPluginIndex = normalizedPluginStyles.indexOf(
      autoDarkPluginSelector,
    );
    const autoDarkPluginMediaIndex = normalizedPluginStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkPluginIndex,
    );
    const autoDarkPluginBlock = readCssBlock(
      normalizedPluginStyles.slice(autoDarkPluginMediaIndex),
      autoDarkPluginSelector,
    );
    const pluginModalPaintScope = [
      sharedSurfaceBlock,
      pluginContentBlock,
      contentCodeBlock,
      pluginSchemaBlock,
      schemaInputBlock,
      mobileSchemaBlock,
      darkPluginContentBlock,
      autoDarkPluginBlock,
    ].join("\n");

    expect(pluginPage).toContain('pluginStyles["plugin-content"]');
    expect(pluginPage).toContain('pluginStyles["plugin-schema"]');
    expect(normalizedPluginPage).toMatch(
      /className=\{clsx\("markdown-body", pluginStyles\["plugin-content"\]\)\}/,
    );
    expect(pluginPage).toContain("contentEditable={true}");
    expect(pluginPage).toContain("suppressContentEditableWarning");
    expect(pluginPage).toContain("onBlur={onChangePlugin}");
    expect(pluginPage).toContain("pluginStore.updatePlugin(editingPlugin.id");
    expect(pluginPage).toContain("plugin.authType = e.target.value;");
    expect(pluginPage).toContain("plugin.authLocation = e.target.value;");
    expect(pluginPage).toContain("plugin.authHeader = e.target.value;");
    expect(pluginPage).toContain("plugin.authToken = e.currentTarget.value;");
    expect(pluginPage).toContain("loadUrlRef.current = e.currentTarget.value;");
    expect(pluginPage).toContain("onClick={() => loadFromUrl(loadUrlRef.current)}");
    expect(pluginPage).toContain("FunctionToolService.add(plugin, true)");

    expect(sharedSurfaceBlock).toMatch(/--plugin-modal-control-radius:\s*8px;/);
    expect(sharedSurfaceBlock).toMatch(
      /--plugin-modal-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 92%,\s*transparent\s*\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--plugin-modal-code-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-soft\) 78%,\s*transparent\s*\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--plugin-modal-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--plugin-modal-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 8%,\s*transparent\s*\);/,
    );
    expect(pluginContentBlock).toMatch(/color:\s*var\(--black\);/);
    expect(contentCodeBlock).toMatch(/display:\s*block;/);
    expect(contentCodeBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(contentCodeBlock).toMatch(/width:\s*100%;/);
    expect(contentCodeBlock).toMatch(/min-width:\s*0;/);
    expect(contentCodeBlock).toMatch(/max-height:\s*min\(42vh,\s*360px\);/);
    expect(contentCodeBlock).toMatch(/padding:\s*12px;/);
    expect(contentCodeBlock).toMatch(
      /border:\s*1px solid var\(--plugin-modal-border-color\);/,
    );
    expect(contentCodeBlock).toMatch(
      /border-radius:\s*var\(--plugin-modal-control-radius\);/,
    );
    expect(contentCodeBlock).toMatch(
      /background:\s*var\(--plugin-modal-code-background\);/,
    );
    expect(contentCodeBlock).toMatch(
      /box-shadow:\s*inset 0 1px 2px var\(--plugin-modal-shadow-color\);/,
    );
    expect(codeFocusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(pluginSchemaBlock).toMatch(/gap:\s*10px;/);
    expect(pluginSchemaBlock).toMatch(/align-items:\s*center;/);
    expect(schemaInputBlock).toMatch(/margin-right:\s*0;/);
    expect(schemaInputBlock).toMatch(/min-height:\s*36px;/);
    expect(schemaInputBlock).toMatch(
      /border:\s*1px solid var\(--plugin-modal-border-color\);/,
    );
    expect(schemaInputBlock).toMatch(
      /border-radius:\s*var\(--plugin-modal-control-radius\);/,
    );
    expect(schemaInputBlock).toMatch(
      /background:\s*var\(--plugin-modal-field-background\);/,
    );
    expect(schemaInputFocusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(schemaInputFocusBlock).toMatch(
      /border-color:\s*var\(--plugin-modal-focus-border-color\);/,
    );
    expect(mobileSchemaBlock).toMatch(/gap:\s*8px;/);
    expect(mobileSchemaBlock).toMatch(/align-items:\s*stretch;/);
    expect(mobileInputBlock).toMatch(/width:\s*100%;/);
    expect(mobileInputBlock).toMatch(/min-width:\s*0 !important;/);
    expect(darkPluginContentBlock).toMatch(
      /--plugin-modal-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(darkPluginContentBlock).toMatch(
      /--plugin-modal-code-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-soft\) 84%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkPluginIndex).toBeGreaterThan(-1);
    expect(autoDarkPluginMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkPluginBlock).toMatch(
      /--plugin-modal-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkPluginBlock).toMatch(
      /--plugin-modal-code-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-soft\) 84%,\s*var\(--white\)\s*\);/,
    );
    expect(pluginModalPaintScope).not.toContain("margin-right: 20px");
    expect(pluginModalPaintScope).not.toContain("min-width: 280px");
    expect(pluginModalPaintScope).not.toContain("max-height: 240px");
    expect(pluginModalPaintScope).not.toContain("border-radius: 10px");
    expect(pluginModalPaintScope).not.toContain("border: var(--border-in-light)");
    expect(pluginModalPaintScope).not.toContain("background-color: var(--white)");
    expect(pluginModalPaintScope).not.toContain("box-shadow: var(--card-shadow)");
  });

  test("keeps Plugin edit modal auth controls aligned with Gemini utility fields", () => {
    const pluginPage = read("app/components/plugin.tsx");
    const pluginStyles = read("app/components/plugin.module.scss");
    const normalizedPluginPage = pluginPage.replace(/\s+/g, " ");
    const pluginEditModalBlock = readCssBlock(pluginStyles, ".plugin-edit-modal");
    const pluginEditModalRootBlock = readRootDeclarations(pluginEditModalBlock);
    const normalizedPluginEditModalBlock = pluginEditModalBlock.replace(/\s+/g, " ");
    const authControlSelector =
      '.plugin-auth-row > select, .plugin-auth-row > input[type="text"], .plugin-auth-row > :global(.password-input-container)';
    const authControlsBlock = readCssBlock(
      normalizedPluginEditModalBlock,
      authControlSelector,
    );
    const authSelectBlock = readCssBlock(
      normalizedPluginEditModalBlock,
      ".plugin-auth-row > select",
    );
    const authTextInputBlock = readCssBlock(
      normalizedPluginEditModalBlock,
      '.plugin-auth-row > input[type="text"]',
    );
    const normalizedPluginEditModalAfterAuthControls =
      normalizedPluginEditModalBlock.slice(
        normalizedPluginEditModalBlock.indexOf(authControlSelector) +
          authControlSelector.length,
      );
    const passwordContainerBlock = readCssBlock(
      normalizedPluginEditModalAfterAuthControls,
      ".plugin-auth-row > :global(.password-input-container)",
    );
    const passwordInputBlock = readCssBlock(
      normalizedPluginEditModalBlock,
      ".plugin-auth-row :global(.password-input-container) :global(.password-input)",
    );
    const passwordEyeBlock = readCssBlock(
      normalizedPluginEditModalBlock,
      ".plugin-auth-row :global(.password-input-container) :global(.password-eye)",
    );
    const authFocusBlock = readCssBlock(
      normalizedPluginEditModalBlock,
      '.plugin-auth-row > select:focus-visible, .plugin-auth-row > input[type="text"]:focus-visible, .plugin-auth-row > :global(.password-input-container):focus-within',
    );
    const mobileBlock = readCssBlock(
      pluginEditModalBlock,
      "@media screen and (max-width: 600px)",
    );
    const mobileAuthControlsBlock = readCssBlock(
      mobileBlock.replace(/\s+/g, " "),
      authControlSelector,
    );
    const darkPluginEditModalBlock = readCssBlock(
      pluginStyles.replace(/\s+/g, " "),
      ":global(.dark) .plugin-edit-modal",
    );
    const autoDarkPluginEditModalSelector =
      ":global(body:not(.light)) .plugin-edit-modal";
    const normalizedPluginStyles = pluginStyles.replace(/\s+/g, " ");
    const autoDarkPluginEditModalIndex = normalizedPluginStyles.indexOf(
      autoDarkPluginEditModalSelector,
    );
    const autoDarkPluginEditModalMediaIndex = normalizedPluginStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkPluginEditModalIndex,
    );
    const autoDarkPluginEditModalBlock = readCssBlock(
      normalizedPluginStyles.slice(autoDarkPluginEditModalMediaIndex),
      autoDarkPluginEditModalSelector,
    );
    const pluginAuthPaintScope = [
      pluginEditModalRootBlock,
      authControlsBlock,
      authSelectBlock,
      authTextInputBlock,
      passwordContainerBlock,
      passwordInputBlock,
      passwordEyeBlock,
      authFocusBlock,
      mobileAuthControlsBlock,
      darkPluginEditModalBlock,
      autoDarkPluginEditModalBlock,
    ].join("\n");

    expect(pluginPage).toContain('pluginStyles["plugin-edit-modal"]');
    expect(pluginPage).toContain('pluginStyles["plugin-auth-row"]');
    expect(
      pluginPage.match(/className=\{pluginStyles\["plugin-auth-row"\]\}/g)
        ?.length,
    ).toBe(4);
    expect(normalizedPluginPage).toMatch(
      /<Modal[\s\S]*>\s*<div className=\{pluginStyles\["plugin-edit-modal"\]\}>[\s\S]*<List>[\s\S]*Locale\.Plugin\.EditModal\.Auth/,
    );
    expect(normalizedPluginPage).toMatch(
      /Locale\.Plugin\.Auth\.Token[\s\S]*<PasswordInput[\s\S]*aria=\{Locale\.Plugin\.Auth\.Token\}[\s\S]*type="text"[\s\S]*plugin\.authToken = e\.currentTarget\.value;/,
    );
    expect(pluginPage).toContain("plugin.authType = e.target.value;");
    expect(pluginPage).toContain("plugin.authLocation = e.target.value;");
    expect(pluginPage).toContain("plugin.authHeader = e.target.value;");
    expect(pluginPage).toContain("plugin.authToken = e.currentTarget.value;");
    expect(pluginPage).toContain("aria={Locale.Plugin.Auth.Token}");
    expect(pluginPage).toContain("loadUrlRef.current = e.currentTarget.value;");
    expect(pluginPage).toContain("onClick={() => loadFromUrl(loadUrlRef.current)}");

    expect(pluginEditModalRootBlock).toMatch(
      /--plugin-modal-control-radius:\s*8px;/,
    );
    expect(pluginEditModalRootBlock).toMatch(
      /--plugin-modal-auth-field-width:\s*min\(240px,\s*100%\);/,
    );
    expect(pluginEditModalRootBlock).toMatch(
      /--plugin-modal-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 92%,\s*transparent\s*\);/,
    );
    expect(pluginEditModalRootBlock).toMatch(
      /--plugin-modal-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 84%,\s*transparent\s*\);/,
    );
    expect(authControlsBlock).toMatch(
      /width:\s*var\(--plugin-modal-auth-field-width\);/,
    );
    expect(authControlsBlock).toMatch(/max-width:\s*100%;/);
    expect(authControlsBlock).toMatch(/min-height:\s*36px;/);
    expect(authControlsBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(authControlsBlock).toMatch(
      /border:\s*1px solid var\(--plugin-modal-border-color\);/,
    );
    expect(authControlsBlock).toMatch(
      /border-radius:\s*var\(--plugin-modal-control-radius\);/,
    );
    expect(authControlsBlock).toMatch(
      /background:\s*var\(--plugin-modal-field-background\);/,
    );
    expect(authControlsBlock).toMatch(
      /box-shadow:\s*inset 0 1px 2px var\(--plugin-modal-shadow-color\);/,
    );
    expect(authControlsBlock).toMatch(/text-align:\s*left;/);
    expect(authSelectBlock).toMatch(/appearance:\s*none;/);
    expect(authSelectBlock).toMatch(/cursor:\s*pointer;/);
    expect(authSelectBlock).toMatch(/linear-gradient\(/);
    expect(authTextInputBlock).toMatch(/padding:\s*0 12px;/);
    expect(passwordContainerBlock).toMatch(/display:\s*flex;/);
    expect(passwordContainerBlock).toMatch(/align-items:\s*center;/);
    expect(passwordInputBlock).toMatch(/flex:\s*1 1 auto;/);
    expect(passwordInputBlock).toMatch(/min-width:\s*0;/);
    expect(passwordInputBlock).toMatch(/max-width:\s*none;/);
    expect(passwordInputBlock).toMatch(/border:\s*0;/);
    expect(passwordInputBlock).toMatch(/background:\s*transparent;/);
    expect(passwordInputBlock).toMatch(/box-shadow:\s*none;/);
    expect(passwordEyeBlock).toMatch(/color:\s*var\(--plugin-modal-muted-color\);/);
    expect(authFocusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(authFocusBlock).toMatch(
      /border-color:\s*var\(--plugin-modal-focus-border-color\);/,
    );
    expect(mobileAuthControlsBlock).toMatch(/width:\s*100%;/);
    expect(mobileAuthControlsBlock).toMatch(/min-width:\s*0;/);
    expect(darkPluginEditModalBlock).toMatch(
      /--plugin-modal-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(darkPluginEditModalBlock).toMatch(
      /--plugin-modal-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 90%,\s*transparent\s*\);/,
    );
    expect(autoDarkPluginEditModalIndex).toBeGreaterThan(-1);
    expect(autoDarkPluginEditModalMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkPluginEditModalBlock).toMatch(
      /--plugin-modal-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkPluginEditModalBlock).toMatch(
      /--plugin-modal-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 90%,\s*transparent\s*\);/,
    );
    expect(pluginAuthPaintScope).not.toContain("border: var(--border-in-light)");
    expect(pluginAuthPaintScope).not.toContain("border-radius: 10px");
    expect(pluginAuthPaintScope).not.toContain("background: var(--white)");
    expect(pluginAuthPaintScope).not.toContain("background-color: var(--white)");
    expect(pluginAuthPaintScope).not.toContain("max-width: 50%");
    expect(pluginAuthPaintScope).not.toContain("box-shadow: var(--card-shadow)");
  });

  test("keeps artifacts preview shell aligned with Gemini output surfaces", () => {
    const artifacts = read("app/components/artifacts.tsx");
    const artifactsPreview = read("app/components/artifacts-preview.tsx");
    const artifactsShareButton = read(
      "app/components/artifacts-share-button.tsx",
    );
    const artifactsStyles = read("app/components/artifacts.module.scss");
    const rootBlock = readCssBlock(artifactsStyles, ".artifacts");
    const rootDeclarations = readRootDeclarations(rootBlock);
    const headerBlock = readCssBlock(rootBlock, "&-header");
    const titleBlock = readCssBlock(rootBlock, "&-title");
    const contentBlock = readCssBlock(rootBlock, "&-content");
    const iframeBlock = readCssBlock(artifactsStyles, ".artifacts-iframe");
    const darkRootBlock = readCssBlock(
      artifactsStyles,
      ":global(.dark) .artifacts",
    );
    const autoDarkArtifactsSelector = ":global(body:not(.light)) .artifacts";
    const autoDarkArtifactsSelectorIndex = artifactsStyles.indexOf(
      autoDarkArtifactsSelector,
    );
    const autoDarkArtifactsMediaIndex = artifactsStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkArtifactsSelectorIndex,
    );
    const autoDarkRootBlock = readCssBlock(
      artifactsStyles.slice(autoDarkArtifactsMediaIndex),
      autoDarkArtifactsSelector,
    );
    const artifactsPaintScope = [
      rootDeclarations,
      headerBlock,
      titleBlock,
      contentBlock,
      iframeBlock,
      darkRootBlock,
      autoDarkRootBlock,
    ].join("\n");

    expect(artifacts).toContain("async function loadArtifactContent(id: string)");
    expect(artifacts).toContain("fetch(`${ApiPath.Artifacts}?id=${id}`)");
    expect(artifacts).toContain("showToast(Locale.Export.Artifacts.Error)");
    expect(artifacts).toContain("previewRef.current?.reload()");
    expect(artifacts).toContain("<ArtifactsShareButton");
    expect(artifacts).toContain("getCode={() => code}");
    expect(artifactsPreview).toContain("new ResizeObserver");
    expect(artifactsPreview).toContain("parent.postMessage");
    expect(artifactsPreview).toContain('sandbox="allow-forms allow-modals allow-scripts"');
    expect(artifactsPreview).toContain("srcDoc={srcDoc}");
    expect(artifactsPreview).toContain("onLoad={handleOnLoad}");
    expect(artifactsShareButton).toContain("fetch(ApiPath.Artifacts");
    expect(artifactsShareButton).toContain("method: \"POST\"");
    expect(artifactsShareButton).toContain("upload(getCode())");
    expect(artifactsShareButton).toContain("downloadAs(getCode()");
    expect(artifactsShareButton).toContain("copyToClipboard(shareUrl)");

    expect(rootDeclarations).toMatch(
      /--artifacts-background:\s*color-mix\(\s*in srgb,\s*var\(--surface\) 92%,\s*var\(--gray\)\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--artifacts-header-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*transparent\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--artifacts-iframe-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 14%,\s*transparent\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--artifacts-iframe-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 10%,\s*transparent\s*\);/,
    );
    expect(rootDeclarations).toMatch(/background:\s*var\(--artifacts-background\);/);
    expect(rootDeclarations).toMatch(/color:\s*var\(--black\);/);
    expect(headerBlock).toMatch(
      /background:\s*var\(--artifacts-header-background\);/,
    );
    expect(headerBlock).toMatch(
      /border-bottom:\s*1px solid var\(--artifacts-header-border-color\);/,
    );
    expect(headerBlock).toMatch(/min-height:\s*64px;/);
    expect(headerBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(headerBlock).toMatch(/gap:\s*14px;/);
    expect(headerBlock).toMatch(/backdrop-filter:\s*blur\(12px\);/);
    expect(titleBlock).toMatch(/font-size:\s*20px;/);
    expect(titleBlock).toMatch(/font-weight:\s*600;/);
    expect(titleBlock).toMatch(/letter-spacing:\s*0;/);
    expect(contentBlock).toMatch(/padding:\s*16px 20px 20px;/);
    expect(contentBlock).toMatch(/background:\s*var\(--artifacts-background\);/);
    expect(iframeBlock).toMatch(
      /border:\s*1px solid var\(--artifacts-iframe-border-color\);/,
    );
    expect(iframeBlock).toMatch(/border-radius:\s*8px;/);
    expect(iframeBlock).toMatch(
      /background-color:\s*var\(--artifacts-iframe-background\);/,
    );
    expect(iframeBlock).toMatch(
      /box-shadow:\s*0 14px 40px var\(--artifacts-iframe-shadow-color\);/,
    );
    expect(darkRootBlock).toMatch(
      /--artifacts-background:\s*color-mix\(\s*in srgb,\s*var\(--gray\) 82%,\s*var\(--black\)\s*\);/,
    );
    expect(darkRootBlock).toMatch(
      /--artifacts-iframe-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 12%,\s*transparent\s*\);/,
    );
    expect(autoDarkArtifactsSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkArtifactsMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkRootBlock).toMatch(
      /--artifacts-background:\s*color-mix\(\s*in srgb,\s*var\(--gray\) 82%,\s*var\(--black\)\s*\);/,
    );
    expect(autoDarkRootBlock).toMatch(
      /--artifacts-iframe-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 12%,\s*transparent\s*\);/,
    );
    expect(artifactsPaintScope).not.toContain("var(--second)");
    expect(artifactsPaintScope).not.toContain("border: var(--border-in-light)");
    expect(artifactsPaintScope).not.toContain("background-color: var(--gray)");
  });

  test("keeps export message selector aligned with Gemini utility surfaces", () => {
    const messageSelector = read("app/components/message-selector.tsx");
    const messageSelectorStyles = read(
      "app/components/message-selector.module.scss",
    );
    const rootBlock = readCssBlock(messageSelectorStyles, ".message-selector");
    const rootDeclarations = readRootDeclarations(rootBlock);
    const filterBlock = readCssBlock(rootBlock, ".message-filter");
    const filterItemBlock = readCssBlock(rootBlock, ".filter-item");
    const searchBarBlock = readCssBlock(rootBlock, ".search-bar");
    const actionsBlock = readCssBlock(rootBlock, ".actions");
    const actionButtonSpacingBlock = readCssBlock(
      actionsBlock,
      "button:not(:last-child)",
    );
    const messagesBlock = readCssBlock(rootBlock, ".messages");
    const messageBlock = readCssBlock(messagesBlock, ".message");
    const selectedBlock = readCssBlock(messageBlock, "&-selected");
    const messageDividerBlock = readCssBlock(messageBlock, "&:not(:last-child)");
    const checkboxBlock = readCssBlock(messageBlock, ".checkbox");
    const checkboxFocusBlock = readCssBlock(
      checkboxBlock,
      'input[type="checkbox"]:not([aria-hidden="true"]):focus-visible',
    );
    const mobileBlock = readCssBlock(
      filterBlock,
      "@media screen and (max-width: 600px)",
    );
    const darkRootBlock = readCssBlock(
      messageSelectorStyles,
      ":global(.dark) .message-selector",
    );
    const autoDarkMessageSelector = ":global(body:not(.light)) .message-selector";
    const autoDarkMessageSelectorIndex = messageSelectorStyles.indexOf(
      autoDarkMessageSelector,
    );
    const autoDarkMessageSelectorMediaIndex =
      messageSelectorStyles.lastIndexOf(
        "@media (prefers-color-scheme: dark)",
        autoDarkMessageSelectorIndex,
      );
    const autoDarkRootBlock = readCssBlock(
      messageSelectorStyles.slice(autoDarkMessageSelectorMediaIndex),
      autoDarkMessageSelector,
    );
    const messageSelectorPaintScope = [
      rootDeclarations,
      filterItemBlock,
      searchBarBlock,
      messagesBlock,
      messageBlock,
      selectedBlock,
      messageDividerBlock,
      darkRootBlock,
      autoDarkRootBlock,
    ].join("\n");

    expect(messageSelector).toContain("function useShiftRange()");
    expect(messageSelector).toContain('e.key !== "Shift"');
    expect(messageSelector).toContain("getRangeForClick(i)");
    expect(messageSelector).toContain("props.updateSelection((selection)");
    expect(messageSelector).toContain("messages.forEach((m) => selection.add(m.id!))");
    expect(messageSelector).toContain("selection.clear()");
    expect(messageSelector).toMatch(
      /messages\s*\.slice\(messageCount - LATEST_COUNT\)/,
    );
    expect(messageSelector).toContain("setSearchInput(e.currentTarget.value)");
    expect(messageSelector).toContain("doSearch(e.currentTarget.value)");
    expect(messageSelector).toContain('aria-label={Locale.Select.Search}');
    expect(messageSelector).toContain('text={Locale.Select.All}');
    expect(messageSelector).toContain('text={Locale.Select.Latest}');
    expect(messageSelector).toContain('text={Locale.Select.Clear}');
    expect(messageSelector).toMatch(
      /<input[\s\S]*type="checkbox"[\s\S]*checked=\{isSelected\}[\s\S]*readOnly[\s\S]*aria-hidden="true"[\s\S]*tabIndex=\{-1\}[\s\S]*\/>/,
    );
    expect(messageSelector).toMatch(
      /<input[\s\S]*type="checkbox"[\s\S]*aria-label=\{getMessageTextContent\(m\)\}[\s\S]*checked=\{isSelected\}[\s\S]*onChange=\{\(\) =>/,
    );
    expect(messageSelector).toContain("selection.has(id)");
    expect(messageSelector).toContain("selection.delete(id)");
    expect(messageSelector).toContain("selection.add(id)");

    expect(rootDeclarations).toMatch(
      /--message-selector-panel-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 90%,\s*var\(--gray\)\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--message-selector-panel-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--message-selector-selected-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 10%,\s*transparent\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--message-selector-selected-ring-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 18%,\s*transparent\s*\);/,
    );
    expect(rootDeclarations).toMatch(
      /--message-selector-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 6%,\s*transparent\s*\);/,
    );
    expect(filterBlock).toMatch(/gap:\s*10px;/);
    expect(filterBlock).toMatch(/align-items:\s*center;/);
    expect(filterItemBlock).toMatch(/min-height:\s*36px;/);
    expect(filterItemBlock).toMatch(/border-radius:\s*8px;/);
    expect(filterItemBlock).toMatch(
      /border:\s*1px solid var\(--message-selector-control-border-color\);/,
    );
    expect(filterItemBlock).toMatch(
      /background:\s*var\(--message-selector-control-background\);/,
    );
    expect(filterItemBlock).toMatch(
      /&:focus-visible[\s\S]*outline:\s*var\(--focus-ring\);/,
    );
    expect(searchBarBlock).toMatch(/margin-right:\s*0;/);
    expect(searchBarBlock).toMatch(/color:\s*var\(--black\);/);
    expect(actionsBlock).toMatch(/gap:\s*10px;/);
    expect(actionButtonSpacingBlock).toMatch(/margin-right:\s*0;/);
    expect(messagesBlock).toMatch(/border-radius:\s*8px;/);
    expect(messagesBlock).toMatch(
      /border:\s*1px solid var\(--message-selector-panel-border-color\);/,
    );
    expect(messagesBlock).toMatch(
      /background:\s*var\(--message-selector-panel-background\);/,
    );
    expect(messagesBlock).toMatch(
      /box-shadow:\s*0 12px 30px var\(--message-selector-panel-shadow-color\);/,
    );
    expect(messageBlock).toMatch(/transition:\s*background-color 0\.16s ease;/);
    expect(messageBlock).toMatch(
      /&:hover[\s\S]*background-color:\s*var\(--message-selector-hover-background\);/,
    );
    expect(selectedBlock).toMatch(
      /background-color:\s*var\(--message-selector-selected-background\);/,
    );
    expect(selectedBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--message-selector-selected-ring-color\);/,
    );
    expect(messageDividerBlock).toMatch(
      /border-bottom:\s*1px solid var\(--message-selector-panel-border-color\);/,
    );
    expect(checkboxBlock).toMatch(/min-width:\s*44px;/);
    expect(checkboxFocusBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(mobileBlock).toMatch(/gap:\s*12px;/);
    expect(mobileBlock).toMatch(/margin-top:\s*0;/);
    expect(darkRootBlock).toMatch(
      /--message-selector-panel-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(darkRootBlock).toMatch(
      /--message-selector-selected-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 14%,\s*transparent\s*\);/,
    );
    expect(autoDarkMessageSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkMessageSelectorMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkRootBlock).toMatch(
      /--message-selector-panel-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkRootBlock).toMatch(
      /--message-selector-selected-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 14%,\s*transparent\s*\);/,
    );
    expect(messageSelectorPaintScope).not.toContain("border: var(--border-in-light)");
    expect(messageSelectorPaintScope).not.toContain("border-bottom: var(--border-in-light)");
    expect(messageSelectorPaintScope).not.toContain("border-radius: 10px");
    expect(messageSelectorPaintScope).not.toContain("background-color: var(--second)");
  });

  test("keeps export workflow stepper aligned with Gemini utility surfaces", () => {
    const exporter = read("app/components/exporter.tsx");
    const exporterStyles = read("app/components/exporter.module.scss");
    const stepsBlock = readCssBlock(exporterStyles, ".steps");
    const stepsRootBlock = readRootDeclarations(stepsBlock);
    const progressBlock = readCssBlock(stepsBlock, ".steps-progress");
    const progressInnerBlock = readCssBlock(progressBlock, "&-inner");
    const stepsInnerBlock = readCssBlock(stepsBlock, ".steps-inner");
    const stepBlock = readCssBlock(stepsInnerBlock, ".step");
    const finishedBlock = readCssBlock(stepBlock, "&-finished");
    const hoverBlock = readCssBlock(stepBlock, "&:hover");
    const currentBlock = readCssBlock(stepBlock, "&-current");
    const stepIndexBlock = readCssBlock(stepBlock, ".step-index");
    const stepNameBlock = readCssBlock(stepBlock, ".step-name");
    const darkStepsBlock = readCssBlock(exporterStyles, ":global(.dark) .steps");
    const autoDarkStepsSelector = ":global(body:not(.light)) .steps";
    const autoDarkStepsIndex = exporterStyles.indexOf(autoDarkStepsSelector);
    const autoDarkStepsMediaIndex = exporterStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkStepsIndex,
    );
    const autoDarkStepsBlock = readCssBlock(
      exporterStyles.slice(autoDarkStepsMediaIndex),
      autoDarkStepsSelector,
    );
    const stepperPaintScope = [
      stepsRootBlock,
      progressInnerBlock,
      stepBlock,
      finishedBlock,
      hoverBlock,
      currentBlock,
      stepIndexBlock,
      darkStepsBlock,
      autoDarkStepsBlock,
    ].join("\n");

    expect(exporter).toContain("const EXPORT_STEPS = [");
    expect(exporter).toContain("name: Locale.Export.Steps.Select");
    expect(exporter).toContain('value: "select"');
    expect(exporter).toContain("name: Locale.Export.Steps.Preview");
    expect(exporter).toContain('value: "preview"');
    expect(exporter).toContain('className={styles["steps"]}');
    expect(exporter).toContain('className={styles["steps-progress-inner"]}');
    expect(exporter).toContain("width: `${((props.index + 1) / stepCount) * 100}%`");
    expect(exporter).toContain('type="button"');
    expect(exporter).toContain("props.onStepChange?.(i)");
    expect(exporter).toMatch(
      /\[styles\["step-finished"\]\]:\s*i <= props\.index/,
    );
    expect(exporter).toMatch(
      /\[styles\["step-current"\]\]:\s*i === props\.index/,
    );

    expect(stepsRootBlock).toMatch(
      /--export-stepper-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 90%,\s*var\(--gray\)\s*\);/,
    );
    expect(stepsRootBlock).toMatch(
      /--export-stepper-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(stepsRootBlock).toMatch(
      /--export-stepper-progress-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 96%,\s*var\(--white\)\s*\);/,
    );
    expect(stepsRootBlock).toMatch(
      /--export-stepper-current-index-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 11%,\s*transparent\s*\);/,
    );
    expect(stepsRootBlock).toMatch(/background:\s*var\(--export-stepper-background\);/);
    expect(stepsRootBlock).toMatch(
      /border:\s*1px solid var\(--export-stepper-border-color\);/,
    );
    expect(stepsRootBlock).toMatch(/border-radius:\s*8px;/);
    expect(progressInnerBlock).toMatch(
      /border:\s*1px solid var\(--export-stepper-border-color\);/,
    );
    expect(progressInnerBlock).toMatch(
      /background:\s*var\(--export-stepper-progress-background\);/,
    );
    expect(progressInnerBlock).toMatch(
      /box-shadow:\s*0 8px 24px var\(--export-stepper-progress-shadow-color\);/,
    );
    expect(progressInnerBlock).toMatch(/transition:\s*width 0\.22s ease;/);
    expect(stepBlock).toMatch(/color:\s*var\(--export-stepper-step-color\);/);
    expect(stepBlock).toMatch(/opacity:\s*1;/);
    expect(stepBlock).toMatch(
      /transition:\s*color 0\.18s ease,\s*background-color 0\.18s ease;/,
    );
    expect(finishedBlock).toMatch(
      /color:\s*var\(--export-stepper-step-finished-color\);/,
    );
    expect(hoverBlock).toMatch(
      /color:\s*var\(--export-stepper-step-hover-color\);/,
    );
    expect(currentBlock).toMatch(
      /color:\s*var\(--export-stepper-current-color\);/,
    );
    expect(currentBlock).toMatch(
      /\.step-index[\s\S]*background:\s*var\(--export-stepper-current-index-background\);/,
    );
    expect(stepIndexBlock).toMatch(
      /background:\s*var\(--export-stepper-index-background\);/,
    );
    expect(stepIndexBlock).toMatch(
      /border:\s*1px solid var\(--export-stepper-index-border-color\);/,
    );
    expect(stepNameBlock).toMatch(/line-height:\s*1\.4;/);
    expect(darkStepsBlock).toMatch(
      /--export-stepper-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(darkStepsBlock).toMatch(
      /--export-stepper-current-index-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 16%,\s*transparent\s*\);/,
    );
    expect(autoDarkStepsIndex).toBeGreaterThan(-1);
    expect(autoDarkStepsMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkStepsBlock).toMatch(
      /--export-stepper-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkStepsBlock).toMatch(
      /--export-stepper-current-index-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 16%,\s*transparent\s*\);/,
    );
    expect(stepperPaintScope).not.toContain("background-color: var(--gray)");
    expect(stepperPaintScope).not.toContain("background-color: var(--white)");
    expect(stepperPaintScope).not.toContain("border: var(--border-in-light)");
    expect(stepperPaintScope).not.toContain("border-radius: 10px");
    expect(stepperPaintScope).not.toContain("var(--card-shadow)");
  });

  test("keeps export image preview surfaces aligned with Gemini output panels", () => {
    const exporter = read("app/components/exporter.tsx");
    const exporterStyles = read("app/components/exporter.module.scss");
    const imagePreviewerBlock = exporter.slice(
      exporter.indexOf("function ImagePreviewer"),
      exporter.indexOf("function MarkdownPreviewer"),
    );
    const previewerBlock = readCssBlock(exporterStyles, ".image-previewer");
    const previewerRootBlock = readRootDeclarations(previewerBlock);
    const previewBodyBlock = readCssBlock(previewerBlock, ".preview-body");
    const chatInfoBlock = readCssBlock(previewBodyBlock, ".chat-info");
    const chatInfoItemBlock = readCssBlock(chatInfoBlock, ".chat-info-item");
    const messageBlock = readCssBlock(previewBodyBlock, ".message");
    const messageBodyBlock = readCssBlock(messageBlock, ".body");
    const normalizedMessageBodyBlock = messageBodyBlock.replace(/\s+/g, " ");
    const messageImageBlock = readCssBlock(
      normalizedMessageBodyBlock,
      ".message-image, .message-image-multi",
    );
    const assistantBlock = readCssBlock(messageBlock, "&-assistant");
    const assistantBodyBlock = readCssBlock(assistantBlock, ".body");
    const userBlock = readCssBlock(messageBlock, "&-user");
    const userBodyBlock = readCssBlock(userBlock, ".body");
    const darkPreviewerBlock = readCssBlock(
      exporterStyles,
      ":global(.dark) .image-previewer",
    );
    const autoDarkPreviewerSelector =
      ":global(body:not(.light)) .image-previewer";
    const autoDarkPreviewerIndex = exporterStyles.indexOf(
      autoDarkPreviewerSelector,
    );
    const autoDarkPreviewerMediaIndex = exporterStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkPreviewerIndex,
    );
    const autoDarkPreviewerBlock = readCssBlock(
      exporterStyles.slice(autoDarkPreviewerMediaIndex),
      autoDarkPreviewerSelector,
    );
    const exportPreviewPaintScope = [
      previewerRootBlock,
      previewBodyBlock,
      chatInfoBlock,
      chatInfoItemBlock,
      messageBodyBlock,
      messageImageBlock,
      assistantBodyBlock,
      userBodyBlock,
      darkPreviewerBlock,
      autoDarkPreviewerBlock,
    ].join("\n");

    expect(exporter).toContain('className={styles["image-previewer"]}');
    expect(imagePreviewerBlock).toContain(
      "const previewRef = useRef<HTMLDivElement>(null);",
    );
    expect(imagePreviewerBlock).toMatch(
      /const copy = \(\) => \{[\s\S]*const dom = previewRef\.current;[\s\S]*if \(!dom\) return;[\s\S]*toBlob\(dom\)\.then/,
    );
    expect(imagePreviewerBlock).toMatch(
      /const download = async \(\) => \{[\s\S]*const dom = previewRef\.current;[\s\S]*if \(!dom\) return;[\s\S]*const blob = await toPng\(dom\);/,
    );
    expect(imagePreviewerBlock).toMatch(
      /<div\s+[^>]*className=\{clsx\(styles\["preview-body"\], styles\["default-theme"\]\)\}[^>]*ref=\{previewRef\}[^>]*>/,
    );
    expect(imagePreviewerBlock).toContain('className={styles["chat-info"]}');
    expect(imagePreviewerBlock).toContain('className={styles["chat-info-item"]}');
    expect(imagePreviewerBlock).toContain(
      'className={clsx(styles["message"], styles["message-" + m.role])}',
    );
    expect(imagePreviewerBlock).toContain('className={styles["body"]}');
    expect(imagePreviewerBlock).toContain("copy={copy}");
    expect(imagePreviewerBlock).toContain("download={download}");

    expect(previewerRootBlock).toMatch(/--export-preview-radius:\s*8px;/);
    expect(previewerRootBlock).toMatch(
      /--export-preview-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-soft\) 88%,\s*transparent\s*\);/,
    );
    expect(previewerRootBlock).toMatch(
      /--export-preview-info-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 90%,\s*var\(--gray\)\s*\);/,
    );
    expect(previewerRootBlock).toMatch(
      /--export-preview-item-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 96%,\s*var\(--white\)\s*\);/,
    );
    expect(previewerRootBlock).toMatch(
      /--export-preview-message-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*transparent\s*\);/,
    );
    expect(previewerRootBlock).toMatch(
      /--export-preview-message-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 94%,\s*transparent\s*\);/,
    );
    expect(previewBodyBlock).toMatch(/border-radius:\s*var\(--export-preview-radius\);/);
    expect(previewBodyBlock).toMatch(/background:\s*var\(--export-preview-background\);/);
    expect(previewBodyBlock).toMatch(
      /box-shadow:\s*inset 0 1px 2px var\(--export-preview-shadow-color\);/,
    );
    expect(chatInfoBlock).toMatch(
      /background:\s*var\(--export-preview-info-background\);/,
    );
    expect(chatInfoBlock).toMatch(/border-radius:\s*var\(--export-preview-radius\);/);
    expect(chatInfoBlock).toMatch(
      /border:\s*1px solid var\(--export-preview-info-border-color\);/,
    );
    expect(chatInfoBlock).toMatch(
      /box-shadow:\s*0 12px 30px var\(--export-preview-info-shadow-color\);/,
    );
    expect(chatInfoItemBlock).toMatch(
      /background:\s*var\(--export-preview-item-background\);/,
    );
    expect(chatInfoItemBlock).toMatch(
      /border:\s*1px solid var\(--export-preview-item-border-color\);/,
    );
    expect(chatInfoItemBlock).toMatch(/border-radius:\s*6px;/);
    expect(chatInfoItemBlock).toMatch(
      /box-shadow:\s*0 8px 18px var\(--export-preview-item-shadow-color\);/,
    );
    expect(messageBodyBlock).toMatch(/border-radius:\s*var\(--export-preview-radius\);/);
    expect(messageBodyBlock).toMatch(
      /border:\s*1px solid var\(--export-preview-message-border-color\);/,
    );
    expect(messageBodyBlock).toMatch(
      /box-shadow:\s*0 10px 28px var\(--export-preview-message-shadow-color\);/,
    );
    expect(messageImageBlock).toMatch(/border-radius:\s*var\(--export-preview-radius\);/);
    expect(messageImageBlock).toMatch(
      /border:\s*1px solid var\(--export-preview-image-border-color\);/,
    );
    expect(assistantBodyBlock).toMatch(
      /background:\s*var\(--export-preview-message-background\);/,
    );
    expect(userBodyBlock).toMatch(
      /background:\s*var\(--export-preview-message-background\);/,
    );
    expect(darkPreviewerBlock).toMatch(
      /--export-preview-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-soft\) 84%,\s*var\(--white\)\s*\);/,
    );
    expect(darkPreviewerBlock).toMatch(
      /--export-preview-info-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(darkPreviewerBlock).toMatch(
      /--export-preview-item-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(darkPreviewerBlock).toMatch(
      /--export-preview-message-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(darkPreviewerBlock).toMatch(
      /--export-preview-image-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 14%,\s*transparent\s*\);/,
    );
    expect(autoDarkPreviewerIndex).toBeGreaterThan(-1);
    expect(autoDarkPreviewerMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkPreviewerBlock).toMatch(
      /--export-preview-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-soft\) 84%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkPreviewerBlock).toMatch(
      /--export-preview-info-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkPreviewerBlock).toMatch(
      /--export-preview-item-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkPreviewerBlock).toMatch(
      /--export-preview-message-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkPreviewerBlock).toMatch(
      /--export-preview-image-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 14%,\s*transparent\s*\);/,
    );
    expect(exportPreviewPaintScope).not.toContain("background-color: var(--gray)");
    expect(exportPreviewPaintScope).not.toContain("background-color: var(--second)");
    expect(exportPreviewPaintScope).not.toContain("background-color: var(--white)");
    expect(exportPreviewPaintScope).not.toContain("border: var(--border-in-light)");
    expect(exportPreviewPaintScope).not.toContain("border-radius: 10px");
    expect(exportPreviewPaintScope).not.toContain("var(--card-shadow)");
  });

  test("keeps update announcement modal aligned with Gemini release surfaces", () => {
    const updateAnnouncement = read("app/components/update-announcement.tsx");
    const updateAnnouncementStyles = read(
      "app/components/update-announcement.module.scss",
    );
    const maskBlock = readCssBlock(updateAnnouncementStyles, ".mask");
    const maskRootBlock = readRootDeclarations(maskBlock);
    const panelBlock = readCssBlock(updateAnnouncementStyles, ".panel");
    const headerBlock = readCssBlock(updateAnnouncementStyles, ".header");
    const sectionTitleBlock = readCssBlock(
      updateAnnouncementStyles,
      ".section-title",
    );
    const itemBeforeBlock = readCssBlock(
      updateAnnouncementStyles,
      "&::before",
    );
    const noteBlock = readCssBlock(updateAnnouncementStyles, ".note");
    const footerBlock = readCssBlock(updateAnnouncementStyles, ".footer");
    const darkMaskBlock = readCssBlock(
      updateAnnouncementStyles,
      ":global(.dark) .mask",
    );
    const autoDarkMaskSelector = ":global(body:not(.light)) .mask";
    const autoDarkMaskSelectorIndex =
      updateAnnouncementStyles.indexOf(autoDarkMaskSelector);
    const autoDarkMaskMediaIndex = updateAnnouncementStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkMaskSelectorIndex,
    );
    const autoDarkMaskBlock = readCssBlock(
      updateAnnouncementStyles.slice(autoDarkMaskMediaIndex),
      autoDarkMaskSelector,
    );
    const mobileBlock = readCssBlock(
      updateAnnouncementStyles,
      "@media screen and (max-width: 600px)",
    );
    const mobileMaskBlock = readCssBlock(mobileBlock, ".mask");
    const mobilePanelBlock = readCssBlock(mobileBlock, ".panel");
    const mobileConfirmBlock = readCssBlock(mobileBlock, ".confirm");

    expect(updateAnnouncement).toContain(
      'const SEEN_KEY_PREFIX = "neatchat:update-announcement:seen";',
    );
    expect(updateAnnouncement).toContain(
      'return localStorage.getItem(key) === "1";',
    );
    expect(updateAnnouncement).toContain('localStorage.setItem(key, "1");');
    expect(updateAnnouncement).toMatch(
      /dismissedKey !== seenKey\s*&&\s*!hasSeenAnnouncement\(seenKey\)/,
    );
    expect(updateAnnouncement).toMatch(
      /const onConfirm = \(\) => \{[\s\S]*markAnnouncementSeen\(seenKey\);[\s\S]*setDismissedKey\(seenKey\);[\s\S]*\};/,
    );
    expect(updateAnnouncement).toContain('role="presentation"');
    expect(updateAnnouncement).toContain("<dialog");
    expect(updateAnnouncement).toContain(
      'aria-labelledby="update-announcement-title"',
    );
    expect(updateAnnouncement).toContain('text="我知道了"');
    expect(updateAnnouncement).toContain("onClick={onConfirm}");
    expect(updateAnnouncementStyles).not.toContain("rgba(49, 94, 248");
    expect(updateAnnouncementStyles).not.toContain("rgba(0, 0, 0, 0.36)");
    expect(maskRootBlock).toMatch(
      /--update-announcement-shadow-ink:\s*rgb\(0,\s*0,\s*0\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-panel-border-ink:\s*rgb\(60,\s*64,\s*67\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-mask-background:\s*color-mix\(in srgb,\s*var\(--update-announcement-shadow-ink\) 36%,\s*transparent\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-panel-background:\s*var\(--surface-elevated\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-panel-border-color:\s*color-mix\(in srgb,\s*var\(--update-announcement-panel-border-ink\) 12%,\s*transparent\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-panel-shadow-color:\s*color-mix\(in srgb,\s*var\(--update-announcement-shadow-ink\) 18%,\s*transparent\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-section-background:\s*color-mix\(in srgb,\s*var\(--primary\) 8%,\s*transparent\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-section-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 18%,\s*transparent\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-section-color:\s*var\(--primary\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-bullet-color:\s*var\(--primary\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-note-color:\s*color-mix\(in srgb,\s*var\(--black\) 72%,\s*transparent\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-divider-color:\s*color-mix\(in srgb,\s*var\(--update-announcement-panel-border-ink\) 10%,\s*transparent\);/,
    );
    expect(maskRootBlock).toMatch(
      /--update-announcement-panel-hairline-shadow-color:\s*color-mix\(in srgb,\s*var\(--update-announcement-shadow-ink\) 8%,\s*transparent\);/,
    );
    expect(maskRootBlock).toMatch(/--update-announcement-panel-radius:\s*8px;/);
    expect(maskRootBlock).toMatch(
      /--update-announcement-mobile-panel-radius:\s*8px 8px 0 0;/,
    );
    expect(maskRootBlock).toMatch(
      /background:\s*var\(--update-announcement-mask-background\);/,
    );
    expect(panelBlock).toMatch(
      /background:\s*var\(--update-announcement-panel-background\);/,
    );
    expect(panelBlock).toMatch(
      /border:\s*1px solid var\(--update-announcement-panel-border-color\);/,
    );
    expect(panelBlock).toMatch(
      /border-radius:\s*var\(--update-announcement-panel-radius\);/,
    );
    expect(panelBlock).toMatch(
      /0 22px 70px var\(--update-announcement-panel-shadow-color\),/,
    );
    expect(panelBlock).toMatch(
      /0 1px 2px var\(--update-announcement-panel-hairline-shadow-color\);/,
    );
    expect(headerBlock).toMatch(
      /border-bottom:\s*1px solid var\(--update-announcement-divider-color\);/,
    );
    expect(sectionTitleBlock).toMatch(
      /color:\s*var\(--update-announcement-section-color\);/,
    );
    expect(sectionTitleBlock).toMatch(
      /background:\s*var\(--update-announcement-section-background\);/,
    );
    expect(sectionTitleBlock).toMatch(
      /border:\s*1px solid var\(--update-announcement-section-border-color\);/,
    );
    expect(itemBeforeBlock).toMatch(
      /background:\s*var\(--update-announcement-bullet-color\);/,
    );
    expect(noteBlock).toMatch(
      /color:\s*var\(--update-announcement-note-color\);/,
    );
    expect(noteBlock).toMatch(
      /border-top:\s*1px solid var\(--update-announcement-divider-color\);/,
    );
    expect(noteBlock).toMatch(/opacity:\s*1;/);
    expect(footerBlock).toMatch(
      /border-top:\s*1px solid var\(--update-announcement-divider-color\);/,
    );
    expect(darkMaskBlock).toMatch(
      /--update-announcement-panel-border-ink:\s*rgb\(255,\s*255,\s*255\);/,
    );
    expect(darkMaskBlock).toMatch(
      /--update-announcement-mask-background:\s*color-mix\(in srgb,\s*var\(--update-announcement-shadow-ink\) 50%,\s*transparent\);/,
    );
    expect(darkMaskBlock).toMatch(
      /--update-announcement-panel-border-color:\s*color-mix\(in srgb,\s*var\(--update-announcement-panel-border-ink\) 10%,\s*transparent\);/,
    );
    expect(darkMaskBlock).toMatch(
      /--update-announcement-panel-shadow-color:\s*color-mix\(in srgb,\s*var\(--update-announcement-shadow-ink\) 36%,\s*transparent\);/,
    );
    expect(darkMaskBlock).toMatch(
      /--update-announcement-divider-color:\s*color-mix\(in srgb,\s*var\(--update-announcement-panel-border-ink\) 12%,\s*transparent\);/,
    );
    expect(darkMaskBlock).toMatch(
      /--update-announcement-section-background:\s*color-mix\(in srgb,\s*var\(--primary\) 16%,\s*var\(--surface\)\);/,
    );
    expect(darkMaskBlock).toMatch(
      /--update-announcement-section-color:\s*color-mix\(in srgb,\s*var\(--primary\) 42%,\s*var\(--black\)\);/,
    );
    expect(autoDarkMaskBlock).toMatch(
      /--update-announcement-panel-border-ink:\s*rgb\(255,\s*255,\s*255\);/,
    );
    expect(autoDarkMaskBlock).toMatch(
      /--update-announcement-mask-background:\s*color-mix\(in srgb,\s*var\(--update-announcement-shadow-ink\) 50%,\s*transparent\);/,
    );
    expect(autoDarkMaskBlock).toMatch(
      /--update-announcement-section-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 28%,\s*transparent\);/,
    );
    expect(autoDarkMaskBlock).toMatch(
      /--update-announcement-divider-color:\s*color-mix\(in srgb,\s*var\(--update-announcement-panel-border-ink\) 12%,\s*transparent\);/,
    );
    expect(updateAnnouncementStyles).not.toContain(
      "--update-announcement-mask-background: color-mix(in srgb, var(--black) 50%, transparent);",
    );
    expect(updateAnnouncementStyles).not.toContain(
      "--update-announcement-panel-border-color: color-mix(in srgb, var(--white) 10%, transparent);",
    );
    expect(updateAnnouncementStyles).not.toContain(
      "border-bottom: var(--border-in-light)",
    );
    expect(updateAnnouncementStyles).not.toContain(
      "border-top: var(--border-in-light)",
    );
    expect(updateAnnouncementStyles).not.toContain("border-radius: 14px");
    expect(updateAnnouncementStyles).not.toContain("var(--card-shadow)");
    expect(mobileMaskBlock).toMatch(/height:\s*100dvh;/);
    expect(mobileMaskBlock).toMatch(/padding:\s*0;/);
    expect(mobilePanelBlock).toMatch(/width:\s*100vw;/);
    expect(mobilePanelBlock).toMatch(
      /max-height:\s*calc\(78dvh - env\(safe-area-inset-bottom\)\);/,
    );
    expect(mobilePanelBlock).toMatch(
      /border-radius:\s*var\(--update-announcement-mobile-panel-radius\);/,
    );
    expect(mobileConfirmBlock).toMatch(/width:\s*100%;/);
  });

  test("keeps shared ui-lib modal selector and toast surfaces aligned with Gemini", () => {
    const uiLibComponents = read("app/components/ui-lib-components.tsx");
    const uiLibStyles = read("app/components/ui-lib.module.scss");
    const sharedSurfaceSelector =
      ".card,\n.popover-mask,\n.list,\n.modal-container,\n.toast-content,\n.input,\n.select-with-icon,\n.modal-input,\n.list-item,\n.selector";
    const sharedSurfaceBlock = readRootDeclarations(
      readCssBlock(uiLibStyles, sharedSurfaceSelector),
    );
    const darkSharedSurfaceBlock = readCssBlock(
      uiLibStyles,
      ":global(.dark) .card,\n:global(.dark) .popover-mask,\n:global(.dark) .list,\n:global(.dark) .modal-container,\n:global(.dark) .toast-content,\n:global(.dark) .input,\n:global(.dark) .select-with-icon,\n:global(.dark) .modal-input,\n:global(.dark) .list-item,\n:global(.dark) .selector",
    );
    const autoDarkSharedSurfaceSelector =
      ":global(body:not(.light)) .card,\n  :global(body:not(.light)) .popover-mask,\n  :global(body:not(.light)) .list,\n  :global(body:not(.light)) .modal-container,\n  :global(body:not(.light)) .toast-content,\n  :global(body:not(.light)) .input,\n  :global(body:not(.light)) .select-with-icon,\n  :global(body:not(.light)) .modal-input,\n  :global(body:not(.light)) .list-item,\n  :global(body:not(.light)) .selector";
    const autoDarkSharedSurfaceSelectorIndex = uiLibStyles.indexOf(
      autoDarkSharedSurfaceSelector,
    );
    const autoDarkSharedSurfaceMediaIndex = uiLibStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkSharedSurfaceSelectorIndex,
    );
    const autoDarkSharedSurfaceBlock = readCssBlock(
      uiLibStyles.slice(autoDarkSharedSurfaceMediaIndex),
      autoDarkSharedSurfaceSelector,
    );
    const cardBlock = readCssBlock(uiLibStyles, ".card");
    const listItemBlock = readCssBlock(uiLibStyles, ".list-item");
    const listBlock = readCssBlock(uiLibStyles, ".list");
    const popoverMaskBlock = readCssBlock(uiLibStyles, ".popover-mask");
    const modalContainerBlock = readRootDeclarations(
      readCssBlock(uiLibStyles, ".modal-container"),
    );
    const modalHeaderBlock = readCssBlock(uiLibStyles, ".modal-header");
    const modalFooterBlock = readCssBlock(uiLibStyles, ".modal-footer");
    const toastContentBlock = readCssBlock(uiLibStyles, ".toast-content");
    const inputBlock = readCssBlock(uiLibStyles, ".input");
    const selectBlock = readCssBlock(
      uiLibStyles,
      ".select-with-icon-select",
    );
    const modalInputBlock = readCssBlock(uiLibStyles, ".modal-input");
    const modalInputFocusBlock = readCssBlock(modalInputBlock, "&:focus");
    const selectorStyles = uiLibStyles.slice(
      uiLibStyles.lastIndexOf("\n.selector {"),
    );
    const selectorBlock = readRootDeclarations(
      readCssBlock(selectorStyles, ".selector"),
    );
    const selectorContentBlock = readCssBlock(
      selectorStyles,
      "&-content",
    );
    const selectorSearchBlock = readCssBlock(selectorContentBlock, ".selector-search");
    const selectorListItemBlock = readCssBlock(selectorContentBlock, ".list-item");
    const selectorSelectedBlock = readCssBlock(
      uiLibStyles,
      ".selector-item-selected",
    );
    const mobileSelectorMediaIndex = uiLibStyles.lastIndexOf(
      "@media screen and (max-width: 600px)",
      uiLibStyles.indexOf("\n.show {"),
    );
    const mobileBlock = readCssBlock(
      uiLibStyles.slice(mobileSelectorMediaIndex),
      "@media screen and (max-width: 600px)",
    );
    const mobileSelectorBlock = readCssBlock(mobileBlock, ".selector");
    const mobileSelectorContentBlock = readCssBlock(
      mobileSelectorBlock,
      "&-content",
    );
    const sharedUiLibPaintScope = [
      sharedSurfaceBlock,
      darkSharedSurfaceBlock,
      autoDarkSharedSurfaceBlock,
      cardBlock,
      listBlock,
      popoverMaskBlock,
      modalContainerBlock,
      modalHeaderBlock,
      modalFooterBlock,
      toastContentBlock,
      inputBlock,
      selectBlock,
      modalInputBlock,
      selectorBlock,
      selectorContentBlock,
      selectorSearchBlock,
      selectorListItemBlock,
      selectorSelectedBlock,
      mobileSelectorContentBlock,
    ].join("\n");

    expect(uiLibComponents).toContain("export function Modal");
    expect(sharedSurfaceSelector).toContain(".list-item");
    expect(uiLibComponents).toContain("window.addEventListener(\"keydown\", onKeyDown)");
    expect(uiLibComponents).toContain('aria-label={isMax ? "Restore modal" : "Maximize modal"}');
    expect(uiLibComponents).toContain('aria-label="Close modal"');
    expect(uiLibComponents).toContain("props.action?.onClick?.();");
    expect(uiLibComponents).toContain("props.onClose?.();");
    expect(uiLibComponents).toContain('aria-label="Close selector"');
    expect(uiLibComponents).toContain('aria-label="Search models"');
    expect(uiLibComponents).toContain("props.onSelection?.(newSelectedValues);");
    expect(uiLibComponents).toContain("props.onSelection?.([value]);");
    expect(uiLibComponents).toContain("props.onClose?.();");

    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-shadow-ink:\s*rgb\(0,\s*0,\s*0\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-surface:\s*var\(--surface-elevated\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(sharedSurfaceBlock).toMatch(/--ui-lib-panel-radius:\s*8px;/);
    expect(sharedSurfaceBlock).toMatch(/--ui-lib-control-radius:\s*8px;/);
    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-mobile-sheet-radius:\s*8px 8px 0 0;/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-divider-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-list-hover-background:\s*color-mix\(in srgb,\s*var\(--black\) 6%,\s*transparent\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-overlay-background:\s*color-mix\(in srgb,\s*var\(--ui-lib-shadow-ink\) 46%,\s*transparent\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-popover-mask-background:\s*color-mix\(in srgb,\s*var\(--ui-lib-shadow-ink\) 30%,\s*transparent\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-panel-shadow-color:\s*color-mix\(in srgb,\s*var\(--ui-lib-shadow-ink\) 16%,\s*transparent\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-toast-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 92%,\s*transparent\);/,
    );
    expect(sharedSurfaceBlock).toMatch(
      /--ui-lib-selected-shadow-color:\s*color-mix\(in srgb,\s*var\(--primary\) 18%,\s*transparent\);/,
    );
    expect(darkSharedSurfaceBlock).toMatch(
      /--ui-lib-overlay-background:\s*color-mix\(in srgb,\s*var\(--ui-lib-shadow-ink\) 54%,\s*transparent\);/,
    );
    expect(darkSharedSurfaceBlock).toMatch(
      /--ui-lib-toast-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 86%,\s*transparent\);/,
    );
    expect(darkSharedSurfaceBlock).toMatch(
      /--ui-lib-toast-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(darkSharedSurfaceBlock).toMatch(
      /--ui-lib-divider-color:\s*color-mix\(in srgb,\s*var\(--black\) 12%,\s*transparent\);/,
    );
    expect(darkSharedSurfaceBlock).toMatch(
      /--ui-lib-list-hover-background:\s*color-mix\(in srgb,\s*var\(--black\) 8%,\s*transparent\);/,
    );
    expect(autoDarkSharedSurfaceSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkSharedSurfaceMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkSharedSurfaceBlock).toMatch(
      /--ui-lib-popover-mask-background:\s*color-mix\(in srgb,\s*var\(--ui-lib-shadow-ink\) 42%,\s*transparent\);/,
    );
    expect(autoDarkSharedSurfaceBlock).toMatch(
      /--ui-lib-selected-shadow-color:\s*color-mix\(in srgb,\s*var\(--primary\) 24%,\s*transparent\);/,
    );
    expect(autoDarkSharedSurfaceBlock).toMatch(
      /--ui-lib-divider-color:\s*color-mix\(in srgb,\s*var\(--black\) 12%,\s*transparent\);/,
    );

    expect(cardBlock).toMatch(/background-color:\s*var\(--ui-lib-surface\);/);
    expect(cardBlock).toMatch(/border:\s*1px solid var\(--ui-lib-border-color\);/);
    expect(cardBlock).toMatch(/border-radius:\s*var\(--ui-lib-panel-radius\);/);
    expect(listItemBlock).toMatch(
      /border-bottom:\s*1px solid var\(--ui-lib-divider-color\);/,
    );
    expect(listBlock).toMatch(/background:\s*var\(--ui-lib-surface\);/);
    expect(listBlock).toMatch(/border:\s*1px solid var\(--ui-lib-border-color\);/);
    expect(listBlock).toMatch(/border-radius:\s*var\(--ui-lib-panel-radius\);/);
    expect(listBlock).toMatch(/box-shadow:[\s\S]*var\(--ui-lib-panel-shadow-color\);/);
    expect(popoverMaskBlock).toMatch(
      /background-color:\s*var\(--ui-lib-popover-mask-background\);/,
    );
    expect(modalContainerBlock).toMatch(
      /background-color:\s*var\(--ui-lib-surface\);/,
    );
    expect(modalContainerBlock).toMatch(
      /border:\s*1px solid var\(--ui-lib-border-color\);/,
    );
    expect(modalContainerBlock).toMatch(
      /border-radius:\s*var\(--ui-lib-panel-radius\);/,
    );
    expect(modalContainerBlock).toMatch(
      /box-shadow:[\s\S]*var\(--ui-lib-panel-shadow-color\);/,
    );
    expect(modalHeaderBlock).toMatch(
      /border-bottom:\s*1px solid var\(--ui-lib-divider-color\);/,
    );
    expect(modalFooterBlock).toMatch(
      /border-top:\s*1px solid var\(--ui-lib-divider-color\);/,
    );
    expect(modalFooterBlock).toMatch(
      /box-shadow:\s*0 -10px 24px var\(--ui-lib-footer-shadow-color\);/,
    );
    expect(toastContentBlock).toMatch(
      /background-color:\s*var\(--ui-lib-toast-background\);/,
    );
    expect(toastContentBlock).toMatch(
      /border:\s*1px solid var\(--ui-lib-toast-border-color\);/,
    );
    expect(toastContentBlock).toMatch(
      /box-shadow:[\s\S]*var\(--ui-lib-toast-shadow-color\);/,
    );
    expect(toastContentBlock).toMatch(/backdrop-filter:\s*blur\(18px\);/);
    expect(inputBlock).toMatch(/background-color:\s*var\(--ui-lib-surface\);/);
    expect(inputBlock).toMatch(/border:\s*1px solid var\(--ui-lib-border-color\);/);
    expect(inputBlock).toMatch(/border-radius:\s*var\(--ui-lib-control-radius\);/);
    expect(selectBlock).toMatch(/background-color:\s*var\(--ui-lib-surface\);/);
    expect(selectBlock).toMatch(/border:\s*1px solid var\(--ui-lib-border-color\);/);
    expect(selectBlock).toMatch(/border-radius:\s*var\(--ui-lib-control-radius\);/);
    expect(modalInputBlock).toMatch(/background-color:\s*var\(--ui-lib-surface\);/);
    expect(modalInputBlock).toMatch(
      /border-radius:\s*var\(--ui-lib-control-radius\);/,
    );
    expect(modalInputBlock).toMatch(
      /box-shadow:\s*0 -2px 5px var\(--ui-lib-input-shadow-color\);/,
    );
    expect(modalInputFocusBlock).toMatch(
      /border-color:\s*var\(--ui-lib-focus-border-color\);/,
    );
    expect(modalInputFocusBlock).toMatch(
      /box-shadow:\s*var\(--focus-ring-shadow\);/,
    );
    expect(selectorBlock).toMatch(
      /background-color:\s*var\(--ui-lib-overlay-background\);/,
    );
    expect(selectorBlock).toMatch(/backdrop-filter:\s*blur\(8px\);/);
    expect(selectorContentBlock).toMatch(
      /background-color:\s*var\(--ui-lib-surface\);/,
    );
    expect(selectorContentBlock).toMatch(
      /border:\s*1px solid var\(--ui-lib-border-color\);/,
    );
    expect(selectorContentBlock).toMatch(
      /border-radius:\s*var\(--ui-lib-panel-radius\);/,
    );
    expect(selectorContentBlock).toMatch(
      /box-shadow:[\s\S]*var\(--ui-lib-panel-shadow-color\);/,
    );
    expect(selectorSearchBlock).toMatch(
      /border-bottom:\s*1px solid var\(--ui-lib-divider-color\);/,
    );
    expect(selectorListItemBlock).toMatch(
      /&:hover[\s\S]*background-color:\s*var\(--ui-lib-list-hover-background\);/,
    );
    expect(selectorListItemBlock).toMatch(
      /&:active[\s\S]*background-color:\s*var\(--ui-lib-list-hover-background\);/,
    );
    expect(selectorSelectedBlock).toMatch(
      /background-color:\s*var\(--ui-lib-selected-background\);/,
    );
    expect(selectorSelectedBlock).toMatch(
      /box-shadow:\s*0 0 0 4px var\(--ui-lib-selected-shadow-color\);/,
    );
    expect(mobileSelectorMediaIndex).toBeGreaterThan(-1);
    expect(mobileSelectorBlock).toMatch(/align-items:\s*flex-end;/);
    expect(mobileSelectorContentBlock).toMatch(
      /width:\s*min\(100vw,\s*420px\);/,
    );
    expect(mobileSelectorContentBlock).toMatch(
      /max-height:\s*min\(76dvh,\s*600px\);/,
    );
    expect(mobileSelectorContentBlock).toMatch(
      /border-radius:\s*var\(--ui-lib-mobile-sheet-radius\);/,
    );
    expect(sharedUiLibPaintScope).not.toContain("background-color: var(--white)");
    expect(sharedUiLibPaintScope).not.toContain("background: var(--white)");
    expect(sharedUiLibPaintScope).not.toContain("box-shadow: var(--shadow)");
    expect(sharedUiLibPaintScope).not.toContain("border-bottom: var(--border-in-light)");
    expect(sharedUiLibPaintScope).not.toContain("border-top: var(--border-in-light)");
    expect(sharedUiLibPaintScope).not.toContain("border-radius: 10px");
    expect(sharedUiLibPaintScope).not.toContain("border-radius: 12px");
    expect(sharedUiLibPaintScope).not.toContain("border-radius: 16px 16px 0 0");
    expect(sharedUiLibPaintScope).not.toContain("rgba(0, 0, 0, 0.5)");
    expect(sharedUiLibPaintScope).not.toContain("rgba(0, 0, 0, 0.3)");
  });

  test("keeps chat image preview overlay focus-restoring and bounded", () => {
    const chat = read("app/components/chat.tsx");
    const markdown = read("app/components/markdown.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const imagePreviewMaskBlock = readCssBlock(
      chatStyles,
      ".image-preview-mask",
    );
    const reducedMotionBlock = readCssBlock(
      chatStyles,
      "@media (prefers-reduced-motion: reduce)",
    );
    const imagePreviewToolbarBlock = readCssBlock(
      chatStyles,
      ".image-preview-toolbar",
    );
    const imagePreviewButtonBlock = readCssBlock(
      chatStyles,
      ".image-preview-button",
    );
    const imagePreviewButtonHoverBlock = readCssBlock(
      imagePreviewButtonBlock,
      "&:hover",
    );
    const imagePreviewButtonActiveBlock = readCssBlock(
      imagePreviewButtonBlock,
      "&:active",
    );
    const imagePreviewButtonFocusBlock = readCssBlock(
      imagePreviewButtonBlock,
      "&:focus-visible",
    );
    const imagePreviewImageBlock = readCssBlock(
      chatStyles,
      ".image-preview-image",
    );

    expect(chat).toMatch(
      /function MessageImagePreview\([\s\S]*onPreview: \(\s*src: string,\s*options\?: \{ trigger\?: HTMLButtonElement \| null; label\?: string \},\s*\) => void;[\s\S]*onClick=\{\(event\) =>\s*props\.onPreview\(props\.src, \{[\s\S]*trigger: event\.currentTarget,[\s\S]*label: props\.alt,[\s\S]*\}\)[\s\S]*\}/,
    );
    expect(chat).toContain(
      "const imagePreviewTriggerRef = useRef<HTMLButtonElement | null>(null);",
    );
    expect(chat).toMatch(
      /const \[previewImageActionLabels, setPreviewImageActionLabels\] =\s*useState\(\s*getImageActionLabels\(\),?\s*\);/,
    );
    expect(chat).toMatch(
      /const \[previewImageAlt, setPreviewImageAlt\] =\s*useState\(\s*getImagePreviewAlt\(\),?\s*\);/,
    );
    expect(chat).toMatch(
      /const \[previewImageDialogLabel, setPreviewImageDialogLabel\] =\s*useState\(\s*getImagePreviewDialogLabel\(\),?\s*\);/,
    );
    expect(chat).toMatch(
      /const openImagePreview = useCallback\(\s*\(\s*src: string,\s*options\?: \{ trigger\?: HTMLButtonElement \| null; label\?: string \},\s*\) => \{[\s\S]*imagePreviewTriggerRef\.current = options\?\.trigger \?\? null;[\s\S]*setPreviewImageActionLabels\(getImageActionLabels\(options\?\.label\)\);[\s\S]*setPreviewImageAlt\(getImagePreviewAlt\(options\?\.label\)\);[\s\S]*setPreviewImageDialogLabel\(getImagePreviewDialogLabel\(options\?\.label\)\);[\s\S]*setPreviewImage\(src\);[\s\S]*\},\s*\[\]\s*\);/,
    );
    expect(chat).toMatch(
      /const closeImagePreview = useCallback\(\(\) => \{[\s\S]*setPreviewImage\(null\);[\s\S]*setPreviewImageActionLabels\(getImageActionLabels\(\)\);[\s\S]*setPreviewImageAlt\(getImagePreviewAlt\(\)\);[\s\S]*setPreviewImageDialogLabel\(getImagePreviewDialogLabel\(\)\);[\s\S]*requestAnimationFrame\(\(\) => \{[\s\S]*const previewTrigger = imagePreviewTriggerRef\.current;[\s\S]*if \(previewTrigger\?\.isConnected\) \{[\s\S]*previewTrigger\.focus\(\);[\s\S]*\}[\s\S]*imagePreviewTriggerRef\.current = null;[\s\S]*\}\);[\s\S]*\}, \[\]\);/,
    );
    expect(chat).toMatch(
      /const openMarkdownImagePreview = useCallback\(\s*\(src: string, label\?: string\) => openImagePreview\(src, \{ label \}\),\s*\[openImagePreview\],\s*\);/,
    );
    expect(chat).toContain("onPreviewImage={openMarkdownImagePreview}");
    expect(chat).toContain("onPreview={openImagePreview}");
    expect(markdown).toContain("props.onPreviewImage?.(src, alt);");
    expect(chat).toMatch(
      /const closePreview = \(event: KeyboardEvent\) => \{[\s\S]*if \(event\.key === "Escape"\) \{[\s\S]*event\.preventDefault\(\);[\s\S]*closeImagePreview\(\);[\s\S]*\}[\s\S]*\};/,
    );
    expect(chat).toMatch(
      /onCancel=\{\(event\) => \{[\s\S]*event\.preventDefault\(\);[\s\S]*closeImagePreview\(\);[\s\S]*\}\}/,
    );
    expect(chat).toMatch(
      /onClick=\{\(event\) => \{[\s\S]*if \(event\.target === event\.currentTarget\) \{[\s\S]*closeImagePreview\(\);[\s\S]*\}[\s\S]*\}\}/,
    );
    expect(chat).toContain('aria-label="关闭预览"');
    expect(chat).toContain("aria-label={previewImageActionLabels.download}");
    expect(chat).toContain("title={previewImageActionLabels.download}");
    expect(chat).toContain("aria-label={previewImageDialogLabel}");
    expect(chat).not.toContain('aria-label="图片预览"');
    expect(chat).toContain("alt={previewImageAlt}");
    expect(chat).toMatch(
      /aria-label="关闭预览"[\s\S]*onClick=\{closeImagePreview\}/,
    );
    expect(imagePreviewMaskBlock).toMatch(/position:\s*fixed;/);
    expect(imagePreviewMaskBlock).toMatch(/inset:\s*0;/);
    expect(imagePreviewMaskBlock).toMatch(/width:\s*100vw;/);
    expect(imagePreviewMaskBlock).toMatch(/height:\s*100dvh;/);
    expect(imagePreviewMaskBlock).toMatch(/max-width:\s*none;/);
    expect(imagePreviewMaskBlock).toMatch(/max-height:\s*none;/);
    expect(imagePreviewMaskBlock).toMatch(/margin:\s*0;/);
    expect(imagePreviewMaskBlock).toMatch(/display:\s*flex;/);
    expect(imagePreviewMaskBlock).toMatch(/box-sizing:\s*border-box;/);
    expect(imagePreviewToolbarBlock).toMatch(/padding:\s*4px;/);
    expect(imagePreviewToolbarBlock).toMatch(
      /border:\s*1px solid rgba\(\$color:\s*#fff,\s*\$alpha:\s*0\.18\);/,
    );
    expect(imagePreviewToolbarBlock).toMatch(
      /background:\s*rgba\(\$color:\s*#1f1f1f,\s*\$alpha:\s*0\.46\);/,
    );
    expect(imagePreviewToolbarBlock).toMatch(
      /backdrop-filter:\s*blur\(18px\) saturate\(1\.25\);/,
    );
    expect(imagePreviewButtonBlock).toMatch(
      /transition:[\s\S]*background 0\.16s ease,[\s\S]*border-color 0\.16s ease,[\s\S]*transform 0\.16s ease,[\s\S]*box-shadow 0\.16s ease;/,
    );
    expect(imagePreviewButtonHoverBlock).toMatch(
      /transform:\s*translateY\(-1px\);/,
    );
    expect(imagePreviewButtonActiveBlock).toMatch(
      /transform:\s*translateY\(0\) scale\(0\.96\);/,
    );
    expect(imagePreviewButtonFocusBlock).toMatch(
      /outline:\s*var\(--focus-ring\);/,
    );
    expect(imagePreviewButtonFocusBlock).toMatch(
      /box-shadow:\s*var\(--focus-ring-shadow\),/,
    );
    expect(imagePreviewImageBlock).toMatch(/max-width:\s*min\(100%, 1600px\);/);
    expect(imagePreviewImageBlock).toMatch(/max-height:\s*100%;/);
    expect(reducedMotionBlock).toMatch(
      /\.image-preview-button,\s*\.image-preview-button:hover,\s*\.image-preview-button:active\s*\{[\s\S]*transform:\s*none !important;[\s\S]*transition-duration:\s*0\.01ms !important;/,
    );
  });

  test("keeps shortcut key modal bounded on compact screens", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const shortcutModalStart = chat.indexOf("export function ShortcutKeyModal");
    const shortcutModalEnd = chat.indexOf(
      "function useChatInnerView()",
      shortcutModalStart,
    );
    const shortcutModalBlock = chat.slice(shortcutModalStart, shortcutModalEnd);
    const chatInnerBlock = readFunctionBlock(
      chat,
      "function useChatInnerView() {",
    );
    const shortcutMobileMediaIndex = chatStyles.indexOf(
      "@media screen and (max-width: 600px)",
      chatStyles.indexOf(".shortcut-key span"),
    );
    const mobileStyles = chatStyles.slice(shortcutMobileMediaIndex);
    const shortcutContainerBlock = readCssBlock(
      chatStyles,
      ".shortcut-key-container",
    );
    const shortcutGridBlock = readCssBlock(chatStyles, ".shortcut-key-grid");
    const shortcutItemBlock = readCssBlock(chatStyles, ".shortcut-key-item");
    const shortcutTitleBlock = readCssBlock(chatStyles, ".shortcut-key-title");
    const shortcutKeysBlock = readCssBlock(chatStyles, ".shortcut-key-keys");
    const shortcutKeyBlock = readCssBlock(chatStyles, ".shortcut-key");
    const shortcutKeyTextBlock = readCssBlock(chatStyles, ".shortcut-key span");
    const darkShortcutContainerBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .shortcut-key-container",
    );
    const autoDarkShortcutContainerSelector =
      ":global(body:not(.light)) .shortcut-key-container";
    const autoDarkShortcutContainerIndex = chatStyles.indexOf(
      autoDarkShortcutContainerSelector,
    );
    const autoDarkShortcutMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkShortcutContainerIndex,
    );
    const autoDarkShortcutContainerBlock = readCssBlock(
      chatStyles.slice(autoDarkShortcutMediaIndex),
      autoDarkShortcutContainerSelector,
    );
    const mobileShortcutContainerBlock = readCssBlock(
      mobileStyles,
      ".shortcut-key-container",
    );
    const mobileShortcutGridBlock = readCssBlock(
      mobileStyles,
      ".shortcut-key-grid",
    );
    const mobileShortcutItemBlock = readCssBlock(
      mobileStyles,
      ".shortcut-key-item",
    );
    const mobileShortcutKeysBlock = readCssBlock(
      mobileStyles,
      ".shortcut-key-keys",
    );

    expect(chat).toContain("export function ShortcutKeyModal");
    expect(chat).toContain(
      'const shortcutKeyModalTitleId = "shortcut-key-modal-title";',
    );
    expect(chat).toMatch(
      /<div[\s\S]*className="modal-mask"[\s\S]*id="shortcut-key-modal"[\s\S]*role="dialog"[\s\S]*aria-modal="true"[\s\S]*aria-labelledby=\{shortcutKeyModalTitleId\}/,
    );
    expect(chat).toMatch(
      /title=\{\s*<span id=\{shortcutKeyModalTitleId\}>[\s\S]*Locale\.Chat\.ShortcutKey\.Title[\s\S]*<\/span>\s*\}/,
    );
    expect(chat).toContain('styles["shortcut-key-container"]');
    expect(chat).toContain('styles["shortcut-key-grid"]');
    expect(chat).toMatch(
      /className=\{styles\["shortcut-key-grid"\]\}[\s\S]*role="list"[\s\S]*aria-label=\{Locale\.Chat\.ShortcutKey\.Title\}/,
    );
    expect(chat).toMatch(
      /role="listitem"[\s\S]*aria-label=\{\`\$\{shortcut\.title\}: \$\{shortcut\.keys\.join\(" \+ "\)\}\`\}/,
    );
    expect(shortcutModalBlock).toMatch(
      /const closeShortcutKeyModal = \(\) => \{[\s\S]*props\.onClose\(\);[\s\S]*\};/,
    );
    expect(shortcutModalBlock).toMatch(/onClose=\{closeShortcutKeyModal\}/);
    expect(shortcutModalBlock).toMatch(
      /autoFocus[\s\S]*onClick=\{closeShortcutKeyModal\}/,
    );
    expect(chatInnerBlock).toContain(
      "const shortcutKeyModalOpenerRef = useRef<HTMLElement | null>(null);",
    );
    expect(chatInnerBlock).toMatch(
      /const openShortcutKeyModal = useCallback\(\s*\(\s*opener\?: HTMLElement \| null\s*\) => \{[\s\S]*const activeElement = document\.activeElement;[\s\S]*activeElement instanceof HTMLElement && activeElement !== document\.body[\s\S]*setShowShortcutKeyModal\(true\);[\s\S]*\},\s*\[\],\s*\);/,
    );
    expect(chatInnerBlock).toMatch(
      /const closeShortcutKeyModal = useCallback\(\(\) => \{[\s\S]*setShowShortcutKeyModal\(false\);[\s\S]*requestAnimationFrame\(\(\) => \{[\s\S]*const opener = shortcutKeyModalOpenerRef\.current;[\s\S]*shortcutKeyModalOpenerRef\.current = null;[\s\S]*if \(opener && opener !== document\.body && opener\.isConnected\) \{[\s\S]*opener\.focus\(\);[\s\S]*return;[\s\S]*\}[\s\S]*inputRef\.current\?\.focus\(\);[\s\S]*\}\);[\s\S]*\}, \[\]\);/,
    );
    expect(chatInnerBlock).toMatch(
      /openShortcutKeyModal\(\s*document\.activeElement instanceof HTMLElement[\s\S]*\);/,
    );
    expect(chat).toContain("openShortcutKeyModal: () => void;");
    expect(chat).toMatch(
      /onClick=\{\(\) => \{[\s\S]*props\.onActionComplete\?\.\(\);[\s\S]*props\.openShortcutKeyModal\(\);[\s\S]*\}\}[\s\S]*text=\{Locale\.Chat\.ShortcutKey\.Title\}/,
    );
    expect(chat).toMatch(
      /openShortcutKeyModal=\{\(\) =>\s*openShortcutKeyModal\(chatInputMenuButtonRef\.current\)\s*\}/,
    );
    expect(chat).toContain(
      "<ShortcutKeyModal onClose={closeShortcutKeyModal} />",
    );
    expect(chat).toContain("showShortcutKeyModal &&");
    expect(shortcutContainerBlock).toMatch(/max-height:\s*min\(70vh, 560px\);/);
    expect(shortcutContainerBlock).toMatch(/overflow-x:\s*hidden;/);
    expect(shortcutGridBlock).toMatch(
      /grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 350px\), 1fr\)\);/,
    );
    expect(shortcutGridBlock).toMatch(/min-width:\s*0;/);
    expect(shortcutItemBlock).toMatch(/min-width:\s*0;/);
    expect(shortcutItemBlock).toMatch(/gap:\s*12px;/);
    expect(shortcutContainerBlock).toMatch(
      /--shortcut-key-item-radius:\s*8px;/,
    );
    expect(shortcutContainerBlock).toMatch(
      /--shortcut-key-keycap-radius:\s*8px;/,
    );
    expect(shortcutContainerBlock).toMatch(
      /--shortcut-key-item-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(shortcutContainerBlock).toMatch(
      /--shortcut-key-item-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 92%,\s*transparent\);/,
    );
    expect(shortcutContainerBlock).toMatch(
      /--shortcut-key-item-color:\s*color-mix\(in srgb,\s*var\(--black\) 90%,\s*transparent\);/,
    );
    expect(shortcutContainerBlock).toMatch(
      /--shortcut-key-keycap-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(shortcutContainerBlock).toMatch(
      /--shortcut-key-keycap-background:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 72%,\s*transparent\);/,
    );
    expect(shortcutContainerBlock).toMatch(
      /--shortcut-key-keycap-color:\s*color-mix\(in srgb,\s*var\(--black\) 88%,\s*transparent\);/,
    );
    expect(darkShortcutContainerBlock).toMatch(
      /--shortcut-key-item-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 8%,\s*transparent\);/,
    );
    expect(darkShortcutContainerBlock).toMatch(
      /--shortcut-key-item-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 88%,\s*transparent\);/,
    );
    expect(darkShortcutContainerBlock).toMatch(
      /--shortcut-key-item-color:\s*color-mix\(in srgb,\s*var\(--black\) 94%,\s*transparent\);/,
    );
    expect(darkShortcutContainerBlock).toMatch(
      /--shortcut-key-keycap-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(darkShortcutContainerBlock).toMatch(
      /--shortcut-key-keycap-background:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 82%,\s*transparent\);/,
    );
    expect(darkShortcutContainerBlock).toMatch(
      /--shortcut-key-keycap-color:\s*color-mix\(in srgb,\s*var\(--black\) 92%,\s*transparent\);/,
    );
    expect(autoDarkShortcutContainerIndex).toBeGreaterThan(-1);
    expect(autoDarkShortcutMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkShortcutContainerBlock).toMatch(
      /--shortcut-key-item-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 8%,\s*transparent\);/,
    );
    expect(autoDarkShortcutContainerBlock).toMatch(
      /--shortcut-key-item-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 88%,\s*transparent\);/,
    );
    expect(autoDarkShortcutContainerBlock).toMatch(
      /--shortcut-key-item-color:\s*color-mix\(in srgb,\s*var\(--black\) 94%,\s*transparent\);/,
    );
    expect(autoDarkShortcutContainerBlock).toMatch(
      /--shortcut-key-keycap-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 10%,\s*transparent\);/,
    );
    expect(autoDarkShortcutContainerBlock).toMatch(
      /--shortcut-key-keycap-background:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 82%,\s*transparent\);/,
    );
    expect(autoDarkShortcutContainerBlock).toMatch(
      /--shortcut-key-keycap-color:\s*color-mix\(in srgb,\s*var\(--black\) 92%,\s*transparent\);/,
    );
    expect(shortcutItemBlock).toMatch(
      /border-radius:\s*var\(--shortcut-key-item-radius\);/,
    );
    expect(shortcutItemBlock).toMatch(
      /border:\s*1px solid var\(--shortcut-key-item-border-color\);/,
    );
    expect(shortcutItemBlock).toMatch(
      /background-color:\s*var\(--shortcut-key-item-background\);/,
    );
    expect(shortcutTitleBlock).toMatch(/flex:\s*1 1 auto;/);
    expect(shortcutTitleBlock).toMatch(/min-width:\s*0;/);
    expect(shortcutTitleBlock).toMatch(/overflow-wrap:\s*anywhere;/);
    expect(shortcutTitleBlock).toMatch(
      /color:\s*var\(--shortcut-key-item-color\);/,
    );
    expect(shortcutTitleBlock).not.toContain("color: var(--black)");
    expect(shortcutKeysBlock).toMatch(/flex-wrap:\s*wrap;/);
    expect(shortcutKeysBlock).toMatch(/justify-content:\s*flex-end;/);
    expect(shortcutKeysBlock).toMatch(/flex:\s*0 1 auto;/);
    expect(shortcutKeysBlock).toMatch(/min-width:\s*0;/);
    expect(shortcutKeyBlock).toMatch(/min-height:\s*30px;/);
    expect(shortcutKeyBlock).toMatch(
      /border:\s*1px solid var\(--shortcut-key-keycap-border-color\);/,
    );
    expect(shortcutKeyBlock).toMatch(
      /border-radius:\s*var\(--shortcut-key-keycap-radius\);/,
    );
    expect(shortcutKeyBlock).toMatch(
      /background-color:\s*var\(--shortcut-key-keycap-background\);/,
    );
    expect(shortcutKeyBlock).toMatch(
      /color:\s*var\(--shortcut-key-keycap-color\);/,
    );
    expect(shortcutKeyTextBlock).toMatch(/white-space:\s*nowrap;/);
    expect(shortcutKeyTextBlock).toMatch(/color:\s*inherit;/);
    expect(
      [shortcutContainerBlock, shortcutItemBlock, shortcutKeyBlock].join("\n"),
    ).not.toMatch(
      /border:\s*var\(--border-in-light\)|background-color:\s*var\(--white\)|background-color:\s*var\(--gray\)|border-radius:\s*14px;/,
    );
    expect(mobileShortcutContainerBlock).toMatch(
      /max-height:\s*min\(62vh, 520px\);/,
    );
    expect(mobileShortcutGridBlock).toMatch(
      /grid-template-columns:\s*minmax\(0, 1fr\);/,
    );
    expect(mobileShortcutItemBlock).toMatch(/align-items:\s*flex-start;/);
    expect(mobileShortcutItemBlock).toMatch(/flex-direction:\s*column;/);
    expect(mobileShortcutKeysBlock).toMatch(/justify-content:\s*flex-start;/);
    expect(mobileShortcutKeysBlock).toMatch(/width:\s*100%;/);
  });

  test("keeps file drag-and-drop scoped and visually polished", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const fileUtils = read("app/utils/file.ts");
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
    const dropzoneBeforeBlock = readCssBlock(
      chatStyles,
      ".chat-dropzone::before",
    );
    const activeDropzoneBeforeBlock = readCssBlock(
      chatStyles,
      ".chat-dropzone.chat-dropzone-active::before",
    );
    const liveStatusBlock = readCssBlock(
      chatStyles,
      ".chat-dropzone-live-status",
    );
    const darkDropzoneBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-dropzone",
    );
    const autoDarkDropzoneSelector = ":global(body:not(.light)) .chat-dropzone";
    const autoDarkDropzoneSelectorIndex = chatStyles.indexOf(
      autoDarkDropzoneSelector,
    );
    const autoDarkDropzoneMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkDropzoneSelectorIndex,
    );
    const autoDarkDropzoneBlock = readCssBlock(
      chatStyles.slice(autoDarkDropzoneMediaIndex),
      autoDarkDropzoneSelector,
    );
    const darkDropzoneActiveBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-dropzone.chat-dropzone-active",
    );
    const dropzoneHintBlock = readCssBlock(chatStyles, ".chat-dropzone-hint");
    const dropzoneContentBlock = readCssBlock(
      chatStyles,
      ".chat-dropzone-content",
    );
    const dropzoneContentBeforeBlock = readCssBlock(
      chatStyles,
      ".chat-dropzone-content::before",
    );
    const activeDropzoneContentBeforeBlock = readCssBlock(
      chatStyles,
      ".chat-dropzone.chat-dropzone-active .chat-dropzone-content::before",
    );
    const dropzoneIconBlock = readCssBlock(chatStyles, ".chat-dropzone-icon");
    const dropzoneSummaryBlock = readCssBlock(
      chatStyles,
      ".chat-dropzone-summary",
    );
    const darkDropzoneBeforeBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-dropzone.chat-dropzone-active::before",
    );
    const darkDropzoneContentBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-dropzone-content",
    );
    const darkActiveDropzoneContentBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-dropzone.chat-dropzone-active .chat-dropzone-content",
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
    expect(dropBlock).toContain(
      "const images = validSizeFiles.filter((file) =>",
    );
    expect(dropBlock).toContain("isAttachmentImage(file)");
    expect(dropBlock).not.toContain('file.type.startsWith("image/")');
    expect(chat).toContain("getDraggedAttachmentSummary,");
    expect(chat).toContain("isAttachmentImage,");
    expect(fileUtils).toContain("export function getDraggedAttachmentSummary");
    expect(fileUtils).toContain("export type DraggedAttachmentSummary");
    expect(chat).toMatch(
      /const \[dragPayloadSummary, setDragPayloadSummary\] =\s*useState<DraggedAttachmentSummary \| null>\(null\);/,
    );
    expect(fileUtils).toMatch(
      /const draggedFiles = Array\.from\(dataTransfer\.files \?\? \[\]\)[\s\S]*const draggedEntries = getDraggedAttachmentEntries\(dataTransfer\);/,
    );
    expect(fileUtils).toMatch(
      /return Array\.from\(dataTransfer\.items \?\? \[\]\)[\s\S]*item\.kind === "file"[\s\S]*item\.getAsFile\(\)/,
    );
    expect(fileUtils).toMatch(
      /entry\.file\s*\?\s*isAttachmentImage\(entry\.file\)\s*:\s*entry\.type\.startsWith\("image\/"\)/,
    );
    expect(fileUtils).toMatch(
      /text:\s*getDraggedAttachmentLimitText\([\s\S]*hint:\s*DRAG_ATTACHMENT_BLOCKED_HINT[\s\S]*willAdd:\s*false/,
    );
    expect(fileUtils).toMatch(
      /const acceptedImageCount = Math\.min\(imageCount, remainingImageSlots\);/,
    );
    expect(fileUtils).toMatch(
      /const acceptedFileCount = Math\.min\(fileCount, remainingFileSlots\);/,
    );
    expect(chat).toContain("setDragPayloadSummary(");
    expect(dragEnterBlock).toContain("getDraggedAttachmentSummary(");
    expect(dragOverBlock).toContain("getDraggedAttachmentSummary(");
    expect(dragLeaveBlock).toContain("setDragPayloadSummary(null);");
    expect(dropBlock).toContain("setDragPayloadSummary(null);");
    expect(chat).not.toContain('role={dragActive ? "status" : undefined}');
    expect(chat).not.toContain('aria-live={dragActive ? "polite" : undefined}');
    expect(chat).toMatch(
      /className=\{styles\["chat-dropzone-live-status"\]\}[\s\S]*role="status"[\s\S]*aria-live="polite"[\s\S]*aria-atomic="true"[\s\S]*dragActive[\s\S]*dragPayloadSummary\?\.text[\s\S]*"拖拽文件或图片到此处上传"[\s\S]*dragPayloadSummary\?\.hint[\s\S]*: ""/,
    );
    expect(chat).toContain('aria-atomic="true"');
    expect(chat).toContain("aria-hidden={!dragActive}");
    expect(chat).toContain('data-drop-active={dragActive ? "true" : "false"}');
    expect(chat).toContain('id="chat-dropzone-status"');
    expect(chat).toContain('className={styles["chat-dropzone-summary"]}');
    expect(chat).toContain("{dragPayloadSummary?.text ??");
    expect(chat).toContain('className={styles["chat-dropzone-hint"]}');
    expect(chat).toContain("{dragPayloadSummary?.hint ??");
    expect(chat).toContain("释放后添加到输入框");
    expect(chat).toContain("最多3张图片、5个文件");
    expect(chat).toMatch(
      /const remainingFileSlots = Math\.max\(0,\s*5 - currentAttachedFiles\.length\);/,
    );
    expect(chat).toMatch(
      /const remainingImageSlots = Math\.max\(0,\s*3 - currentAttachImages\.length\);/,
    );
    expect(dropBlock).toMatch(
      /const remainingFileSlots = Math\.max\(\s*0,\s*5 - attachedFilesRef\.current\.length,\s*\);/,
    );
    expect(dropBlock).toMatch(
      /const remainingImageSlots = Math\.max\(\s*0,\s*3 - attachImagesRef\.current\.length,\s*\);/,
    );
    expect(dropzoneBlock).toMatch(/isolation:\s*isolate;/);
    expect(dropzoneBlock).toMatch(/pointer-events:\s*none;/);
    expect(dropzoneBlock).toMatch(
      /--chat-dropzone-active-background:\s*color-mix\(in srgb,\s*var\(--surface\) 58%,\s*transparent\);/,
    );
    expect(dropzoneBlock).toMatch(
      /--chat-dropzone-scrim-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 18%,\s*transparent\);/,
    );
    expect(dropzoneBlock).toMatch(
      /--chat-dropzone-content-active-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 58%,\s*transparent\);/,
    );
    expect(dropzoneBlock).toMatch(/--chat-dropzone-content-radius:\s*8px;/);
    expect(dropzoneBlock).toMatch(/--chat-dropzone-icon-radius:\s*8px;/);
    expect(dropzoneBlock).toMatch(
      /--chat-dropzone-icon-border-color:\s*color-mix\(in srgb,\s*var\(--surface-soft\) 44%,\s*transparent\);/,
    );
    expect(dropzoneBlock).toMatch(
      /--chat-dropzone-icon-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 86%,\s*transparent\);/,
    );
    expect(dropzoneBlock).toMatch(
      /--chat-dropzone-icon-shadow-color:\s*color-mix\(in srgb,\s*var\(--primary\) 8%,\s*transparent\);/,
    );
    expect(darkDropzoneBlock).toMatch(
      /--chat-dropzone-active-background:\s*color-mix\(in srgb,\s*var\(--gray\) 66%,\s*transparent\);/,
    );
    expect(darkDropzoneBlock).toMatch(
      /--chat-dropzone-summary-color:\s*color-mix\(in srgb,\s*var\(--black\) 92%,\s*transparent\);/,
    );
    expect(darkDropzoneBlock).toMatch(
      /--chat-dropzone-icon-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 12%,\s*transparent\);/,
    );
    expect(darkDropzoneBlock).toMatch(
      /--chat-dropzone-icon-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 84%,\s*var\(--primary\) 4%\);/,
    );
    expect(darkDropzoneBlock).toMatch(
      /--chat-dropzone-icon-shadow-color:\s*color-mix\(in srgb,\s*var\(--primary\) 8%,\s*var\(--surface\)\);/,
    );
    expect(autoDarkDropzoneSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkDropzoneMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkDropzoneBlock).toMatch(
      /--chat-dropzone-active-background:\s*color-mix\(in srgb,\s*var\(--gray\) 66%,\s*transparent\);/,
    );
    expect(autoDarkDropzoneBlock).toMatch(
      /--chat-dropzone-summary-color:\s*color-mix\(in srgb,\s*var\(--black\) 92%,\s*transparent\);/,
    );
    expect(autoDarkDropzoneBlock).toMatch(
      /--chat-dropzone-icon-border-color:\s*color-mix\(in srgb,\s*var\(--black\) 12%,\s*transparent\);/,
    );
    expect(autoDarkDropzoneBlock).toMatch(
      /--chat-dropzone-icon-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 84%,\s*var\(--primary\) 4%\);/,
    );
    expect(autoDarkDropzoneBlock).toMatch(
      /--chat-dropzone-icon-shadow-color:\s*color-mix\(in srgb,\s*var\(--primary\) 8%,\s*var\(--surface\)\);/,
    );
    expect(dropzoneBlock).toMatch(
      /&\.chat-dropzone-active[\s\S]*background-color:\s*var\(--chat-dropzone-active-background\);/,
    );
    expect(darkDropzoneActiveBlock).toMatch(
      /background-color:\s*var\(--chat-dropzone-active-background\);/,
    );
    expect(liveStatusBlock).toMatch(/position:\s*absolute;/);
    expect(liveStatusBlock).toMatch(/width:\s*1px;/);
    expect(liveStatusBlock).toMatch(/height:\s*1px;/);
    expect(liveStatusBlock).toMatch(/clip-path:\s*inset\(50%\);/);
    expect(liveStatusBlock).toMatch(/white-space:\s*nowrap;/);
    expect(dropzoneHintBlock).toMatch(/font-size:\s*13px;/);
    expect(dropzoneHintBlock).toMatch(/line-height:\s*1\.45;/);
    expect(dropzoneHintBlock).toMatch(
      /color:\s*var\(--chat-dropzone-hint-color\);/,
    );
    expect(dropzoneHintBlock).toMatch(/text-align:\s*center;/);
    expect(dropzoneHintBlock).toMatch(/margin:\s*-6px 0 0;/);
    expect(dropzoneBeforeBlock).toMatch(/content:\s*"";/);
    expect(dropzoneBeforeBlock).toMatch(/position:\s*absolute;/);
    expect(dropzoneBeforeBlock).toMatch(/inset:\s*0;/);
    expect(dropzoneBeforeBlock).toMatch(
      /background:\s*var\(--chat-dropzone-scrim-background\);/,
    );
    expect(dropzoneBeforeBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--chat-dropzone-scrim-border-color\);/,
    );
    expect(dropzoneBeforeBlock).not.toContain("radial-gradient");
    expect(dropzoneBeforeBlock).not.toContain("linear-gradient");
    expect(dropzoneBeforeBlock).toMatch(/pointer-events:\s*none;/);
    expect(dropzoneBeforeBlock).toMatch(/opacity:\s*0;/);
    expect(activeDropzoneBeforeBlock).toMatch(/opacity:\s*1;/);
    expect(dropzoneContentBlock).toMatch(/scale\(0\.96\)/);
    expect(dropzoneContentBlock).toMatch(/position:\s*relative;/);
    expect(dropzoneContentBlock).toMatch(/overflow:\s*hidden;/);
    expect(dropzoneContentBlock).toMatch(
      /backdrop-filter:\s*blur\(22px\) saturate\(180%\);/,
    );
    expect(dropzoneContentBlock).toMatch(
      /background:\s*var\(--surface-elevated\);/,
    );
    expect(dropzoneContentBlock).toMatch(
      /border:\s*2px dashed var\(--chat-dropzone-content-border-color\);/,
    );
    expect(dropzoneContentBlock).toMatch(
      /border-radius:\s*var\(--chat-dropzone-content-radius\);/,
    );
    expect(dropzoneContentBlock).toMatch(
      /box-shadow:\s*0 22px 70px var\(--chat-dropzone-content-shadow-color\);/,
    );
    expect(dropzoneContentBlock).not.toMatch(/border-radius:\s*20px;/);
    expect(dropzoneContentBlock).not.toContain("linear-gradient");
    expect(dropzoneContentBeforeBlock).toMatch(/content:\s*"";/);
    expect(dropzoneContentBeforeBlock).toMatch(/pointer-events:\s*none;/);
    expect(dropzoneContentBeforeBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--chat-dropzone-content-inner-border-color\),/,
    );
    expect(activeDropzoneContentBeforeBlock).toMatch(/opacity:\s*1;/);
    expect(dropzoneContentBlock).toMatch(
      /border-color:\s*var\(--chat-dropzone-content-active-border-color\);/,
    );
    expect(dropzoneContentBlock).toMatch(
      /box-shadow:\s*0 18px 54px var\(--chat-dropzone-content-active-shadow-color\);/,
    );
    expect(dropzoneContentBlock).toMatch(/opacity:\s*1;/);
    expect(dropzoneIconBlock).toMatch(
      /border-radius:\s*var\(--chat-dropzone-icon-radius\);/,
    );
    expect(dropzoneIconBlock).toMatch(
      /border:\s*1px solid var\(--chat-dropzone-icon-border-color\);/,
    );
    expect(dropzoneIconBlock).toMatch(
      /background:\s*var\(--chat-dropzone-icon-background\);/,
    );
    expect(dropzoneIconBlock).not.toContain("linear-gradient");
    expect(dropzoneIconBlock).toMatch(
      /box-shadow:\s*0 8px 24px var\(--chat-dropzone-icon-shadow-color\);/,
    );
    expect(dropzoneIconBlock).not.toMatch(/border-radius:\s*16px;/);
    expect(dropzoneIconBlock).not.toContain("var(--border-in-light)");
    expect(dropzoneIconBlock).not.toContain("var(--composer-shadow)");
    expect(dropzoneSummaryBlock).toMatch(/display:\s*inline-flex;/);
    expect(dropzoneSummaryBlock).toMatch(/min-height:\s*28px;/);
    expect(dropzoneSummaryBlock).toMatch(/border-radius:\s*999px;/);
    expect(dropzoneSummaryBlock).toMatch(
      /background:\s*var\(--chat-dropzone-summary-background\);/,
    );
    expect(dropzoneSummaryBlock).toMatch(
      /box-shadow:\s*inset 0 0 0 1px var\(--chat-dropzone-summary-border-color\);/,
    );
    expect(dropzoneSummaryBlock).toMatch(
      /color:\s*var\(--chat-dropzone-summary-color\);/,
    );
    expect(dropzoneSummaryBlock).toMatch(/font-weight:\s*500;/);
    expect(darkDropzoneBeforeBlock).toMatch(
      /background:\s*var\(--chat-dropzone-scrim-background\);/,
    );
    expect(darkDropzoneBeforeBlock).not.toContain("radial-gradient");
    expect(darkDropzoneBeforeBlock).not.toContain("linear-gradient");
    expect(darkDropzoneContentBlock).toMatch(
      /background:\s*var\(--surface-elevated\);/,
    );
    expect(darkDropzoneContentBlock).not.toContain("linear-gradient");
    expect(darkActiveDropzoneContentBlock).toMatch(
      /border-color:\s*var\(--chat-dropzone-content-active-border-color\);/,
    );
    expect(darkActiveDropzoneContentBlock).toMatch(
      /box-shadow:\s*0 18px 54px var\(--chat-dropzone-content-active-shadow-color\);/,
    );
    expect(
      chatStyles.indexOf(
        ":global(.dark) .chat-dropzone.chat-dropzone-active .chat-dropzone-content",
      ),
    ).toBeGreaterThan(
      chatStyles.indexOf(":global(.dark) .chat-dropzone-content"),
    );
    expect(dropzoneHintBlock).toMatch(
      /:global\(\.dark\) &[\s\S]*color:\s*var\(--chat-dropzone-hint-color\);/,
    );
    expect(reducedMotionBlock).toContain(".chat-dropzone-content");
    expect(reducedMotionBlock).toContain(".chat-dropzone::before");
    expect(reducedMotionBlock).toMatch(
      /\.chat-dropzone::before,\s*\.chat-dropzone-content::before,\s*\.chat-dropzone,\s*\.chat-dropzone-content\s*\{[\s\S]*transform:\s*none !important;[\s\S]*transition-duration:\s*0\.01ms !important;/,
    );
  });

  test("keeps token metadata as a quiet non-overlapping chip", () => {
    const markdown = read("app/components/markdown.tsx");
    const markdownStyles = read("app/styles/markdown.scss");
    const lightMixinBlock = readCssBlock(markdownStyles, "@mixin light");
    const darkMixinBlock = readCssBlock(markdownStyles, "@mixin dark");
    const autoDarkRootBlock = readCssBlock(
      readCssBlock(markdownStyles, "@media (prefers-color-scheme: dark)"),
      ":root",
    );
    const containerBlock = readCssBlock(
      markdownStyles,
      ".markdown-body-container",
    );
    const tokenInfoBlock = readCssBlock(markdownStyles, ".token-info");
    const darkTokenInfoBlock = readCssBlock(
      markdownStyles,
      ".dark .markdown-body-container .token-info",
    );
    const mobileBlock = markdownStyles.slice(
      markdownStyles.indexOf("@media only screen and (max-width: 600px)"),
    );
    const reducedMotionBlock = markdownStyles.slice(
      markdownStyles.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    const tokenInfoToneScope = [
      tokenInfoBlock,
      darkTokenInfoBlock,
      lightMixinBlock.match(
        /--markdown-token-info-border-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      lightMixinBlock.match(
        /--markdown-token-info-background:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      lightMixinBlock.match(
        /--markdown-token-info-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      lightMixinBlock.match(
        /--markdown-token-info-hover-border-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      lightMixinBlock.match(
        /--markdown-token-info-hover-background:[\s\S]*?var\(--surface-elevated\)\s*\);/,
      )?.[0] ?? "",
      lightMixinBlock.match(
        /--markdown-token-info-hover-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      lightMixinBlock.match(
        /--markdown-token-info-hover-shadow-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-token-info-background:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-token-info-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-token-info-hover-background:[\s\S]*?var\(--surface-soft\)\s*\);/,
      )?.[0] ?? "",
      darkMixinBlock.match(
        /--markdown-token-info-hover-color:[\s\S]*?transparent\s*\);/,
      )?.[0] ?? "",
    ].join("\n");

    expect(markdown).toContain(
      "const tokenFirstCharDelay = tokenInfo?.firstCharDelay",
    );
    expect(markdown).toContain("const showTokenDelay = Boolean");
    expect(markdown).toContain("const tokenDelayText = tokenFirstCharDelay");
    expect(markdown).toContain(
      "Locale.Chat.TokenInfo.FirstDelay(tokenFirstCharDelay)",
    );
    expect(markdown).toContain("const tokenCountText = tokenInfo");
    expect(markdown).toContain(
      "Locale.Chat.TokenInfo.TokenCount(tokenInfo.count)",
    );
    expect(markdown).toContain("const tokenInfoLabel = tokenInfo");
    expect(markdown).toContain("aria-label={tokenInfoLabel}");
    expect(markdown).not.toContain('aria-label="Token 信息"');
    expect(markdown).toContain("aria-pressed={showTokenDelay}");
    expect(markdown).toContain(
      'data-token-info-expanded={showTokenDelay ? "true" : "false"}',
    );
    expect(markdown).toMatch(/showTokenDelay\s*\?\s*tokenDelayText/);
    expect(lightMixinBlock).toMatch(
      /--markdown-token-info-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 10%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-token-info-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 72%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-token-info-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 90%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-token-info-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 22%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-token-info-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 8%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-token-info-hover-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 92%,\s*transparent\s*\);/,
    );
    expect(lightMixinBlock).toMatch(
      /--markdown-token-info-hover-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 8%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-token-info-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-soft\) 72%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-token-info-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 74%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-token-info-hover-border-color:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 24%,\s*transparent\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-token-info-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--markdown-link-color\) 14%,\s*var\(--surface-soft\)\s*\);/,
    );
    expect(darkMixinBlock).toMatch(
      /--markdown-token-info-hover-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 90%,\s*transparent\s*\);/,
    );
    expect(autoDarkRootBlock).toMatch(/@include dark;/);
    expect(containerBlock).toMatch(/display:\s*flex;/);
    expect(containerBlock).toMatch(/flex-direction:\s*column;/);
    expect(containerBlock).toMatch(/align-items:\s*flex-start;/);
    expect(containerBlock).toMatch(/gap:\s*6px;/);
    expect(containerBlock).toMatch(/width:\s*100%;/);
    expect(containerBlock).toContain(".markdown-body");
    expect(containerBlock).toMatch(/min-width:\s*0;/);
    expect(tokenInfoBlock).toMatch(/position:\s*static;/);
    expect(tokenInfoBlock).not.toMatch(/position:\s*absolute;/);
    expect(tokenInfoBlock).not.toMatch(/bottom:\s*-28px;/);
    expect(tokenInfoBlock).toMatch(/align-self:\s*flex-end;/);
    expect(tokenInfoBlock).toMatch(/display:\s*inline-flex;/);
    expect(tokenInfoBlock).toMatch(/min-height:\s*26px;/);
    expect(tokenInfoBlock).toMatch(/padding:\s*4px 9px;/);
    expect(tokenInfoBlock).toMatch(/border-radius:\s*999px;/);
    expect(tokenInfoBlock).toMatch(/letter-spacing:\s*0;/);
    expect(tokenInfoBlock).toMatch(/font-size:\s*11px;/);
    expect(tokenInfoBlock).toMatch(
      /border:\s*1px solid var\(--markdown-token-info-border-color\);/,
    );
    expect(tokenInfoBlock).toMatch(
      /background:\s*var\(--markdown-token-info-background\);/,
    );
    expect(tokenInfoBlock).toMatch(
      /color:\s*var\(--markdown-token-info-color\);/,
    );
    expect(tokenInfoBlock).toMatch(
      /box-shadow:\s*0 1px 2px rgba\(60,\s*64,\s*67,\s*0\.08\)/,
    );
    expect(tokenInfoBlock).toMatch(
      /&:hover,\s*&:focus-visible,\s*&\[data-token-info-expanded="true"\][\s\S]*border-color:\s*var\(--markdown-token-info-hover-border-color\);/,
    );
    expect(tokenInfoBlock).toMatch(
      /&:hover,\s*&:focus-visible,\s*&\[data-token-info-expanded="true"\][\s\S]*background:\s*var\(--markdown-token-info-hover-background\);/,
    );
    expect(tokenInfoBlock).toMatch(
      /&:hover,\s*&:focus-visible,\s*&\[data-token-info-expanded="true"\][\s\S]*color:\s*var\(--markdown-token-info-hover-color\);/,
    );
    expect(tokenInfoBlock).toMatch(
      /&:hover,\s*&:focus-visible,\s*&\[data-token-info-expanded="true"\][\s\S]*0 10px 24px var\(--markdown-token-info-hover-shadow-color\);/,
    );
    expect(tokenInfoBlock).toMatch(/&:focus-visible/);
    expect(tokenInfoBlock).toMatch(/outline:\s*none;/);
    expect(tokenInfoBlock).toMatch(
      /&:focus-visible[\s\S]*var\(--focus-ring-shadow\),[\s\S]*0 10px 24px var\(--markdown-token-info-hover-shadow-color\);/,
    );
    expect(tokenInfoBlock).toMatch(/&\[data-token-info-expanded="true"\]/);
    expect(darkTokenInfoBlock).toMatch(
      /background:\s*var\(--markdown-token-info-background\);/,
    );
    expect(darkTokenInfoBlock).toMatch(
      /border-color:\s*var\(--markdown-token-info-border-color\);/,
    );
    expect(darkTokenInfoBlock).toMatch(
      /color:\s*var\(--markdown-token-info-color\);/,
    );
    expect(darkTokenInfoBlock).toMatch(
      /&:hover,\s*&:focus-visible,\s*&\[data-token-info-expanded="true"\][\s\S]*border-color:\s*var\(--markdown-token-info-hover-border-color\);/,
    );
    expect(darkTokenInfoBlock).toMatch(
      /&:hover,\s*&:focus-visible,\s*&\[data-token-info-expanded="true"\][\s\S]*background:\s*var\(--markdown-token-info-hover-background\);/,
    );
    expect(darkTokenInfoBlock).toMatch(
      /&:hover,\s*&:focus-visible,\s*&\[data-token-info-expanded="true"\][\s\S]*color:\s*var\(--markdown-token-info-hover-color\);/,
    );
    expect(darkTokenInfoBlock).toMatch(
      /&:focus-visible[\s\S]*var\(--focus-ring-shadow\),[\s\S]*0 10px 24px var\(--markdown-token-info-hover-shadow-color\);/,
    );
    expect(tokenInfoToneScope).not.toMatch(
      /rgba\((?:66,\s*133,\s*244|138,\s*180,\s*248)|#(?:4285f4|8ab4f8)\b/,
    );
    expect(mobileBlock).toContain(".markdown-body-container .token-info");
    expect(mobileBlock).toMatch(/align-self:\s*flex-start;/);
    expect(mobileBlock).toMatch(/white-space:\s*normal;/);
    expect(mobileBlock).toMatch(/overflow-wrap:\s*anywhere;/);
    expect(reducedMotionBlock).toContain(
      ".markdown-body-container .token-info",
    );
    expect(reducedMotionBlock).toMatch(
      /transition-duration:\s*0\.01ms !important;/,
    );
    expect(reducedMotionBlock).toMatch(/transform:\s*none !important;/);
  });

  test("keeps streaming wait state as a polished Gemini-style skeleton", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const markdown = read("app/components/markdown.tsx");
    const markdownStyles = read("app/styles/markdown.scss");
    const shimmerBlock = readCssBlock(chatStyles, ".chat-message-shimmer");
    const darkShimmerBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-message-shimmer",
    );
    const streamingRevealBlock = readCssBlock(
      chatStyles,
      ".chat-message-streaming-reveal",
    );
    const streamingSurfaceHandoffBlock = readCssBlock(
      chatStyles,
      "@keyframes streamingSurfaceHandoff",
    );
    const darkStreamingRevealBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .chat-message-streaming-reveal",
    );
    const autoDarkShimmerSelector =
      ":global(body:not(.light)) .chat-message-shimmer";
    const autoDarkShimmerBlock = readCssBlockInside(
      chatStyles,
      "@media (prefers-color-scheme: dark)",
      autoDarkShimmerSelector,
    );
    const autoDarkStreamingRevealSelector =
      ":global(body:not(.light)) .chat-message-streaming-reveal";
    const autoDarkStreamingRevealBlock = readCssBlockInside(
      chatStyles,
      "@media (prefers-color-scheme: dark)",
      autoDarkStreamingRevealSelector,
    );
    const streamingDarkShimmerTokenNames = [
      "--chat-streaming-wait-border-color",
      "--chat-streaming-wait-line-start",
      "--chat-streaming-wait-line-highlight",
      "--chat-streaming-wait-line-tail",
      "--chat-streaming-wait-line-end",
    ];
    const streamingDarkRevealTokenNames = [
      "--chat-streaming-reveal-strip-primary",
      "--chat-streaming-reveal-strip-surface",
      "--chat-streaming-reveal-strip-secondary",
      "--chat-streaming-handoff-border-start",
      "--chat-streaming-handoff-border-mid",
      "--chat-streaming-handoff-shadow-start",
      "--chat-streaming-handoff-shadow-mid",
    ];
    const darkShimmerTokenMap = readCustomProperties(
      darkShimmerBlock,
      streamingDarkShimmerTokenNames,
    );
    const autoDarkShimmerTokenMap = readCustomProperties(
      autoDarkShimmerBlock,
      streamingDarkShimmerTokenNames,
    );
    const darkRevealTokenMap = readCustomProperties(
      darkStreamingRevealBlock,
      streamingDarkRevealTokenNames,
    );
    const autoDarkRevealTokenMap = readCustomProperties(
      autoDarkStreamingRevealBlock,
      streamingDarkRevealTokenNames,
    );
    const streamingToneScope = [
      shimmerBlock,
      darkShimmerBlock,
      streamingRevealBlock,
      darkStreamingRevealBlock,
      autoDarkShimmerBlock,
      autoDarkStreamingRevealBlock,
      streamingSurfaceHandoffBlock,
    ].join("\n");
    const streamingTokenScope = [shimmerBlock, streamingRevealBlock].join("\n");
    const legacyStreamingPaint =
      /rgba\((?:66,\s*133,\s*244|138,\s*180,\s*248|155,\s*81,\s*224|233,\s*30,\s*99|196,\s*140,\s*255|255,\s*139,\s*180)/;
    const reducedMotionBlock = chatStyles.slice(
      chatStyles.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    const markdownLoadingStatusBlock = readCssBlock(
      markdownStyles,
      ".markdown-body .markdown-loading-status",
    );

    expect(chat).toContain("const isStreamingReveal");
    expect(chat).toMatch(
      /const isWaiting =\s*!isUser &&\s*\(\s*message\.preview \|\|\s*\(\s*message\.streaming && message\.content\.length === 0\s*\)\s*\);/,
    );
    expect(chat).toMatch(
      /const isStreamingReveal =\s*!isUser && message\.streaming && message\.content\.length > 0;/,
    );
    expect(chat).toMatch(
      /isStreamingReveal &&\s*styles\["chat-message-streaming-reveal"\]/,
    );
    expect(chat).toMatch(/loading=\{isWaiting\}/);
    expect(chat).toMatch(/streaming=\{message\.streaming\}/);
    expect(markdown).toContain('className="markdown-loading-status"');
    expect(markdown).toMatch(
      /role="status"[\s\S]*aria-live="polite"[\s\S]*aria-atomic="true"/,
    );
    expect(markdown).toMatch(/\{Locale\.Chat\.Typing\}/);
    expect(markdown).not.toMatch(
      /loading \? \(\s*<LoadingIcon \/>[\s\S]*\) : \(/,
    );
    expect(markdownLoadingStatusBlock).toMatch(/position:\s*absolute;/);
    expect(markdownLoadingStatusBlock).toMatch(/width:\s*1px;/);
    expect(markdownLoadingStatusBlock).toMatch(/height:\s*1px;/);
    expect(markdownLoadingStatusBlock).toMatch(/overflow:\s*hidden;/);
    expect(markdownLoadingStatusBlock).toMatch(/clip:\s*rect\(0 0 0 0\);/);
    expect(markdownLoadingStatusBlock).not.toMatch(/min-height/);
    expect(streamingToneScope).not.toMatch(legacyStreamingPaint);
    expect(shimmerBlock).toMatch(/min-height:\s*72px;/);
    expect(shimmerBlock).toContain("&::after");
    expect(shimmerBlock).toContain(":global(.markdown-body)::before");
    expect(shimmerBlock).toContain(":global(.markdown-body)::after");
    expect(shimmerBlock).toMatch(/display:\s*none !important;/);
    expect(shimmerBlock).toMatch(/animation:\s*shimmer 1\.6s infinite linear/);
    expect(shimmerBlock).not.toContain("* {");
    [
      "--chat-streaming-wait-border-color",
      "--chat-streaming-wait-line-base",
      "--chat-streaming-wait-line-start",
      "--chat-streaming-wait-line-highlight",
      "--chat-streaming-wait-line-tail",
      "--chat-streaming-wait-line-end",
      "--chat-streaming-reveal-strip-primary",
      "--chat-streaming-reveal-strip-surface",
      "--chat-streaming-reveal-strip-secondary",
      "--chat-streaming-handoff-border-start",
      "--chat-streaming-handoff-border-mid",
      "--chat-streaming-handoff-border-end",
      "--chat-streaming-handoff-shadow-start",
      "--chat-streaming-handoff-shadow-mid",
      "--chat-streaming-handoff-shadow-end",
    ].forEach((tokenName) => {
      expect(streamingTokenScope).toContain(tokenName);
    });
    expect(shimmerBlock).toMatch(
      /--chat-streaming-wait-border-color:\s*color-mix\(in srgb,\s*var\(--primary\) 18%,\s*transparent\);/,
    );
    expect(shimmerBlock).toMatch(
      /border-color:\s*var\(--chat-streaming-wait-border-color\) !important;/,
    );
    expect(shimmerBlock).toMatch(
      /background-color:\s*var\(--chat-streaming-wait-line-base\);/,
    );
    expect(shimmerBlock).toMatch(
      /background-image:\s*linear-gradient\(\s*90deg,[\s\S]*var\(--chat-streaming-wait-line-start\) 0%,[\s\S]*var\(--chat-streaming-wait-line-highlight\) 38%,[\s\S]*var\(--chat-streaming-wait-line-tail\) 68%,[\s\S]*var\(--chat-streaming-wait-line-end\) 100%/,
    );
    expect(shimmerBlock).not.toContain("rgba(155, 81, 224");
    expect(shimmerBlock).not.toContain("rgba(233, 30, 99");
    expect(darkShimmerBlock).toMatch(
      /--chat-streaming-wait-line-highlight:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 82%,\s*var\(--primary\) 18%\);/,
    );
    expect(darkShimmerBlock).not.toContain("rgba(196, 140, 255");
    expect(darkShimmerBlock).not.toContain("rgba(255, 139, 180");
    expect(autoDarkShimmerBlock).toContain(
      "--chat-streaming-wait-border-color",
    );
    expect(autoDarkShimmerBlock).toMatch(
      /--chat-streaming-wait-line-highlight:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 82%,\s*var\(--primary\) 18%\);/,
    );
    expect(autoDarkShimmerTokenMap).toEqual(darkShimmerTokenMap);
    expect(chatStyles).toContain("@keyframes streamingShimmerFade");
    expect(chatStyles).toContain("@keyframes streamingSurfaceHandoff");
    expect(chatStyles).toMatch(
      /@keyframes streamingShimmerFade[\s\S]*100%[\s\S]*opacity:\s*0;[\s\S]*transform:\s*translateX\(18%\) scaleX\(1\.02\);/,
    );
    expect(chatStyles).toMatch(
      /@keyframes streamingSurfaceHandoff[\s\S]*0%[\s\S]*box-shadow:[\s\S]*var\(--chat-streaming-handoff-border-start\)[\s\S]*var\(--chat-streaming-handoff-shadow-start\)[\s\S]*58%[\s\S]*var\(--chat-streaming-handoff-border-mid\)[\s\S]*var\(--chat-streaming-handoff-shadow-mid\)[\s\S]*100%[\s\S]*var\(--chat-streaming-handoff-border-end\)[\s\S]*var\(--chat-streaming-handoff-shadow-end\)/,
    );
    expect(streamingRevealBlock).toMatch(
      /--chat-streaming-reveal-strip-primary:\s*color-mix\(in srgb,\s*var\(--primary\) 14%,\s*transparent\);/,
    );
    expect(streamingRevealBlock).toMatch(
      /transition:\s*border-color 0\.18s ease/,
    );
    expect(streamingRevealBlock).toMatch(/overflow-anchor:\s*none;/);
    expect(streamingRevealBlock).toMatch(/overflow:\s*hidden;/);
    expect(streamingRevealBlock).toMatch(/isolation:\s*isolate;/);
    expect(streamingRevealBlock).toMatch(
      /animation:\s*streamingSurfaceHandoff 0\.42s cubic-bezier\(0\.2,\s*0,\s*0,\s*1\) both;/,
    );
    expect(streamingRevealBlock).toContain(":global(.markdown-body-container)");
    expect(streamingRevealBlock).toMatch(/transform-origin:\s*top left;/);
    expect(streamingRevealBlock).toMatch(
      /animation:\s*streamingTextReveal 0\.24s cubic-bezier\(0\.2,\s*0,\s*0,\s*1\) both;/,
    );
    expect(streamingRevealBlock).toContain("&::after");
    expect(streamingRevealBlock).toMatch(/position:\s*absolute;/);
    expect(streamingRevealBlock).toMatch(/inset:\s*0;/);
    expect(streamingRevealBlock).toMatch(/z-index:\s*1;/);
    expect(streamingRevealBlock).toMatch(/pointer-events:\s*none;/);
    expect(streamingRevealBlock).toMatch(
      /animation:\s*streamingShimmerFade 0\.42s cubic-bezier\(0\.2,\s*0,\s*0,\s*1\) both;/,
    );
    expect(streamingRevealBlock).toMatch(
      /background-image:\s*linear-gradient\(\s*90deg,\s*transparent 0%,[\s\S]*var\(--chat-streaming-reveal-strip-primary\) 32%,[\s\S]*var\(--chat-streaming-reveal-strip-surface\) 50%,[\s\S]*var\(--chat-streaming-reveal-strip-secondary\) 66%,/,
    );
    expect(darkStreamingRevealBlock).toMatch(
      /--chat-streaming-reveal-strip-primary:\s*color-mix\(in srgb,\s*var\(--primary\) 18%,\s*transparent\);/,
    );
    expect(darkStreamingRevealBlock).not.toContain("background-image");
    expect(darkStreamingRevealBlock).not.toContain("rgba(196, 140, 255");
    expect(darkStreamingRevealBlock).not.toContain("rgba(255, 139, 180");
    expect(autoDarkStreamingRevealBlock).toContain(
      "--chat-streaming-reveal-strip-primary",
    );
    expect(autoDarkStreamingRevealBlock).toMatch(
      /--chat-streaming-reveal-strip-surface:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 64%,\s*transparent\);/,
    );
    expect(autoDarkRevealTokenMap).toEqual(darkRevealTokenMap);
    expect(reducedMotionBlock).toContain(".chat-message-shimmer");
    expect(reducedMotionBlock).toContain(".chat-message-streaming-reveal");
    expect(reducedMotionBlock).toContain("animation: none !important");
    expect(reducedMotionBlock).toMatch(
      /\.chat-message-streaming-reveal[\s\S]*&::after[\s\S]*display:\s*none;/,
    );
    expect(reducedMotionBlock).toMatch(
      /\.chat-message-streaming-reveal[\s\S]*animation:\s*none !important;[\s\S]*box-shadow:\s*none !important;/,
    );
  });

  test("keeps the context prompt toast as a Gemini-style contextual chip", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const promptToastBlock = readCssBlock(chatStyles, ".prompt-toast");
    const promptToastRootDeclarations =
      readRootDeclarations(promptToastBlock);
    const promptToastInnerBlock = readCssBlock(
      chatStyles,
      ".prompt-toast-inner",
    );
    const promptToastContentBlock = readCssBlock(
      chatStyles,
      ".prompt-toast-content",
    );
    const darkPromptToastBlock = readCssBlock(
      chatStyles,
      ":global(.dark) .prompt-toast",
    );
    const autoDarkPromptToastSelector =
      ":global(body:not(.light)) .prompt-toast";
    const autoDarkPromptToastSelectorIndex = chatStyles.indexOf(
      autoDarkPromptToastSelector,
    );
    const autoDarkPromptToastMediaIndex = chatStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkPromptToastSelectorIndex,
    );
    const autoDarkPromptToastBlock = readCssBlock(
      chatStyles.slice(autoDarkPromptToastMediaIndex),
      autoDarkPromptToastSelector,
    );
    const reducedMotionBlock = readCssBlock(
      chatStyles,
      "@media (prefers-reduced-motion: reduce)",
    );
    const promptToastSection = chat.slice(
      chat.indexOf("function PromptToast"),
      chat.indexOf("function useSubmitHandler"),
    );
    const promptToastPaintScope = [
      promptToastRootDeclarations,
      promptToastInnerBlock,
      darkPromptToastBlock,
      autoDarkPromptToastBlock,
    ].join("\n");
    const legacyPromptToastPaint =
      /rgba\((?:248,\s*251,\s*255,\s*(?:0\.86|0\.96)|232,\s*240,\s*254,\s*0\.94|26,\s*115,\s*232,\s*(?:0\.1|0\.12|0\.24)|32,\s*33,\s*36,\s*0\.84|40,\s*43,\s*48,\s*0\.94|60,\s*64,\s*67,\s*(?:0\.08|0\.1|0\.12|0\.86)|138,\s*180,\s*248,\s*(?:0\.08|0\.18|0\.28)|232,\s*234,\s*237,\s*(?:0\.1|0\.92)|0,\s*0,\s*0,\s*(?:0\.2|0\.24|0\.26))/;

    expect(chat).toContain('id="session-config-modal"');
    expect(chat).toMatch(
      /id="session-config-modal"[\s\S]*role="dialog"[\s\S]*aria-modal="true"[\s\S]*aria-label=\{Locale\.Context\.Edit\}/,
    );
    expect(chat).toContain("aria-label={Locale.Context.Toast(context.length)}");
    expect(chat).toContain('aria-haspopup="dialog"');
    expect(chat).toContain('aria-controls="session-config-modal"');
    expect(chat).toContain("aria-expanded={props.showModal}");
    expect(chat).toContain(
      "const promptModalTriggerRef = useRef<HTMLElement | null>(null);",
    );
    expect(chat).toContain(
      "const openPromptModal = (trigger?: HTMLElement | null) => {",
    );
    expect(chat).toContain("promptModalTriggerRef.current =");
    expect(chat).toContain("const closePromptModal = () => {");
    expect(chat).toContain(
      "const promptModalTrigger = promptModalTriggerRef.current;",
    );
    expect(chat).toContain("if (promptModalTrigger?.isConnected) {");
    expect(chat).toContain("promptModalTrigger.focus();");
    expect(chat).toContain("promptModalTriggerRef.current = null;");
    expect(promptToastSection).toContain(
      "onOpen: (_: HTMLButtonElement) => void;",
    );
    expect(chat).toMatch(
      /onClick=\{\(event\) => props\.onOpen\(event\.currentTarget\)\}/,
    );
    expect(promptToastSection).not.toContain("SessionConfigModel");
    expect(promptToastSection).not.toContain("setShowModal");
    expect(chat).toContain("openPromptModal(event.currentTarget);");
    expect(chat).toMatch(
      /showPromptModal=\{\(\) =>\s*openPromptModal\(chatInputMenuButtonRef\.current\)\s*\}/,
    );
    expect(chat).toMatch(
      /\{showPromptModal && (?:\(\s*)?<SessionConfigModel onClose=\{closePromptModal\} \/>(?:\s*\))?\}/,
    );

    expect(promptToastBlock).toMatch(/pointer-events:\s*none;/);
    expect(promptToastBlock).toMatch(/top:\s*calc\(100% \+ 8px\);/);
    expect(promptToastBlock).toMatch(/bottom:\s*auto;/);
    expect(promptToastBlock).toMatch(/padding:\s*0 16px;/);
    expect(promptToastRootDeclarations).toMatch(
      /--prompt-toast-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 88%,\s*transparent\);/,
    );
    expect(promptToastRootDeclarations).toMatch(
      /--prompt-toast-color:\s*color-mix\(in srgb,\s*var\(--black\) 86%,\s*transparent\);/,
    );
    expect(promptToastRootDeclarations).toMatch(
      /--prompt-toast-border-color:\s*color-mix\(in srgb,\s*var\(--black-50\) 16%,\s*transparent\);/,
    );
    expect(promptToastRootDeclarations).toMatch(
      /--prompt-toast-expanded-background:\s*color-mix\(in srgb,\s*var\(--primary\) 11%,\s*var\(--surface-elevated\)\);/,
    );

    expect(promptToastInnerBlock).toMatch(/appearance:\s*none;/);
    expect(promptToastInnerBlock).toMatch(/pointer-events:\s*auto;/);
    expect(promptToastInnerBlock).toMatch(/max-width:\s*min\(420px, 100%\);/);
    expect(promptToastInnerBlock).toMatch(/min-height:\s*36px;/);
    expect(promptToastInnerBlock).toMatch(/padding:\s*7px 12px;/);
    expect(promptToastInnerBlock).toMatch(/border-radius:\s*999px;/);
    expect(promptToastInnerBlock).toMatch(
      /background:\s*var\(--prompt-toast-background\);/,
    );
    expect(promptToastInnerBlock).toMatch(
      /color:\s*var\(--prompt-toast-color\);/,
    );
    expect(promptToastInnerBlock).toMatch(
      /border:\s*1px solid var\(--prompt-toast-border-color\);/,
    );
    expect(promptToastInnerBlock).toMatch(/backdrop-filter:\s*blur\(18px\);/);
    expect(promptToastInnerBlock).toMatch(
      /box-shadow:[\s\S]*0 10px 26px var\(--prompt-toast-shadow-color\)/,
    );
    expect(promptToastInnerBlock).toMatch(
      /transition:[\s\S]*transform 0\.16s ease,[\s\S]*background-color 0\.16s ease,[\s\S]*box-shadow 0\.16s ease/,
    );
    expect(promptToastInnerBlock).toMatch(
      /&:hover[\s\S]*background:\s*var\(--prompt-toast-hover-background\);/,
    );
    expect(promptToastInnerBlock).toMatch(
      /&:hover[\s\S]*0 14px 30px var\(--prompt-toast-hover-shadow-color\)/,
    );
    expect(promptToastInnerBlock).toContain("&:focus-visible");
    expect(promptToastInnerBlock).toMatch(/outline:\s*var\(--focus-ring\);/);
    expect(promptToastInnerBlock).toContain('&[aria-expanded="true"]');
    expect(promptToastInnerBlock).toMatch(
      /&\[aria-expanded="true"\][\s\S]*background:\s*var\(--prompt-toast-expanded-background\);/,
    );
    expect(promptToastInnerBlock).toMatch(
      /&\[aria-expanded="true"\][\s\S]*border-color:\s*var\(--prompt-toast-expanded-border-color\);/,
    );
    expect(promptToastInnerBlock).toMatch(
      /&\[aria-expanded="true"\][\s\S]*0 12px 28px var\(--prompt-toast-expanded-shadow-color\)/,
    );
    expect(promptToastInnerBlock).not.toMatch(
      /border:\s*var\(--border-in-light\);/,
    );
    expect(promptToastInnerBlock).not.toMatch(
      /box-shadow:\s*var\(--card-shadow\);/,
    );
    expect(promptToastContentBlock).toMatch(/min-width:\s*0;/);
    expect(promptToastContentBlock).toMatch(/overflow:\s*hidden;/);
    expect(promptToastContentBlock).toMatch(/text-overflow:\s*ellipsis;/);
    expect(promptToastContentBlock).toMatch(/white-space:\s*nowrap;/);

    expect(darkPromptToastBlock).toMatch(
      /--prompt-toast-background:\s*color-mix\(in srgb,\s*var\(--surface-elevated\) 84%,\s*transparent\);/,
    );
    expect(darkPromptToastBlock).toMatch(
      /--prompt-toast-color:\s*color-mix\(in srgb,\s*var\(--black\) 92%,\s*transparent\);/,
    );
    expect(darkPromptToastBlock).toMatch(
      /--prompt-toast-expanded-background:\s*color-mix\(in srgb,\s*var\(--primary\) 16%,\s*var\(--surface\)\);/,
    );
    expect(autoDarkPromptToastSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkPromptToastMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkPromptToastBlock).toMatch(
      /--prompt-toast-expanded-background:\s*color-mix\(in srgb,\s*var\(--primary\) 16%,\s*var\(--surface\)\);/,
    );
    expect(promptToastPaintScope).not.toMatch(legacyPromptToastPaint);
    expect(reducedMotionBlock).toContain(".prompt-toast-inner");
    expect(reducedMotionBlock).toMatch(
      /\.prompt-toast-inner[\s\S]*animation:\s*none !important;[\s\S]*transition-duration:\s*0\.01ms !important;/,
    );
  });

  test("keeps Settings prompt management aligned with Gemini utility surfaces", () => {
    const settings = read("app/components/settings.tsx");
    const userPromptModal = read("app/components/settings-user-prompt-modal.tsx");
    const settingsStyles = read("app/components/settings.module.scss");
    const userPromptModalSelectorIndex = settingsStyles.indexOf(
      "\n.user-prompt-modal {",
    );
    const userPromptModalBlock = readCssBlock(
      settingsStyles.slice(userPromptModalSelectorIndex),
      ".user-prompt-modal",
    );
    const userPromptModalRootBlock = readRootDeclarations(
      userPromptModalBlock,
    );
    const darkSettingsPromptBlock = readCssBlock(
      settingsStyles,
      ":global(.dark) .user-prompt-modal",
    );
    const autoDarkSettingsPromptSelector =
      ":global(body:not(.light)) .user-prompt-modal";
    const autoDarkSettingsPromptSelectorIndex = settingsStyles.indexOf(
      autoDarkSettingsPromptSelector,
    );
    const autoDarkSettingsPromptMediaIndex = settingsStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkSettingsPromptSelectorIndex,
    );
    const autoDarkSettingsPromptBlock = readCssBlock(
      settingsStyles.slice(autoDarkSettingsPromptMediaIndex),
      autoDarkSettingsPromptSelector,
    );
    const promptSearchBlock = readCssBlock(
      userPromptModalBlock,
      ".user-prompt-search",
    );
    const promptSearchFocusBlock = readCssBlock(promptSearchBlock, "&:focus");
    const promptListBlock = readCssBlock(
      userPromptModalBlock,
      ".user-prompt-list",
    );
    const promptItemBlock = readCssBlock(promptListBlock, ".user-prompt-item");
    const promptItemHoverBlock = readCssBlock(promptItemBlock, "&:hover");
    const promptItemDividerBlock = readCssBlock(
      promptItemBlock,
      "&:not(:last-child)",
    );
    const promptTitleBlock = readCssBlock(
      promptItemBlock,
      ".user-prompt-title",
    );
    const promptContentBlock = readCssBlock(
      promptItemBlock,
      ".user-prompt-content",
    );
    const settingsPromptPaintScope = [
      userPromptModalRootBlock,
      darkSettingsPromptBlock,
      autoDarkSettingsPromptBlock,
      promptSearchBlock,
      promptSearchFocusBlock,
      promptListBlock,
      promptItemBlock,
      promptItemHoverBlock,
      promptItemDividerBlock,
      promptTitleBlock,
      promptContentBlock,
    ].join("\n");

    expect(settings).toContain("setShowPromptModal(true)");
    expect(settings).toContain("<UserPromptModal");
    expect(userPromptModal).toContain("SearchService.search(searchInput)");
    expect(userPromptModal).toContain("promptStore.remove(v.id!)");
    expect(userPromptModal).toContain("setEditingPromptId(v.id)");
    expect(userPromptModal).toContain("copyToClipboard(v.content)");

    expect(userPromptModalRootBlock).toMatch(
      /--settings-prompt-search-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 88%,\s*var\(--gray\)\s*\);/,
    );
    expect(userPromptModalRootBlock).toMatch(
      /--settings-prompt-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 14%,\s*transparent\s*\);/,
    );
    expect(userPromptModalRootBlock).toMatch(
      /--settings-prompt-divider-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 10%,\s*transparent\s*\);/,
    );
    expect(userPromptModalRootBlock).toMatch(
      /--settings-prompt-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 74%,\s*transparent\s*\);/,
    );
    expect(userPromptModalRootBlock).toMatch(
      /--settings-prompt-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 7%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(userPromptModalRootBlock).toMatch(
      /--settings-prompt-focus-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 16%,\s*transparent\s*\);/,
    );
    expect(darkSettingsPromptBlock).toMatch(
      /--settings-prompt-search-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(darkSettingsPromptBlock).toMatch(
      /--settings-prompt-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 56%,\s*transparent\s*\);/,
    );
    expect(autoDarkSettingsPromptSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkSettingsPromptMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkSettingsPromptBlock).toMatch(
      /--settings-prompt-search-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkSettingsPromptBlock).toMatch(
      /--settings-prompt-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 12%,\s*var\(--surface-elevated\)\s*\);/,
    );

    expect(promptSearchBlock).toMatch(
      /background-color:\s*var\(--settings-prompt-search-background\);/,
    );
    expect(promptSearchBlock).toMatch(
      /border:\s*1px solid var\(--settings-prompt-border-color\);/,
    );
    expect(promptSearchBlock).toMatch(/border-radius:\s*8px;/);
    expect(promptSearchFocusBlock).toMatch(
      /border-color:\s*var\(--settings-prompt-focus-border-color\);/,
    );
    expect(promptSearchFocusBlock).toMatch(
      /box-shadow:\s*0 0 0 3px var\(--settings-prompt-focus-shadow-color\);/,
    );
    expect(promptListBlock).toMatch(
      /background-color:\s*var\(--settings-prompt-list-background\);/,
    );
    expect(promptListBlock).toMatch(
      /border:\s*1px solid var\(--settings-prompt-border-color\);/,
    );
    expect(promptListBlock).toMatch(/border-radius:\s*8px;/);
    expect(promptItemBlock).toMatch(
      /background-color:\s*var\(--settings-prompt-item-background\);/,
    );
    expect(promptItemHoverBlock).toMatch(
      /background-color:\s*var\(--settings-prompt-hover-background\);/,
    );
    expect(promptItemDividerBlock).toMatch(
      /border-bottom:\s*1px solid var\(--settings-prompt-divider-color\);/,
    );
    expect(promptTitleBlock).toMatch(/color:\s*var\(--black\);/);
    expect(promptContentBlock).toMatch(
      /color:\s*var\(--settings-prompt-muted-color\);/,
    );
    expect(settingsPromptPaintScope).not.toContain(
      "background-color: var(--gray)",
    );
    expect(settingsPromptPaintScope).not.toContain("border: var(--border-in-light)");
    expect(settingsPromptPaintScope).not.toContain("border-bottom: var(--border-in-light)");
    expect(settingsPromptPaintScope).not.toContain("border-radius: 10px");
  });

  test("keeps Settings prompt editor aligned with Gemini utility fields", () => {
    const editPromptModal = read(
      "app/components/settings-edit-prompt-modal.tsx",
    );
    const settingsStyles = read("app/components/settings.module.scss");
    const editPromptModalSelectorIndex = settingsStyles.indexOf(
      "\n.edit-prompt-modal {",
    );
    const editPromptModalBlock = readCssBlock(
      settingsStyles.slice(editPromptModalSelectorIndex),
      ".edit-prompt-modal",
    );
    const editPromptModalRootBlock =
      readRootDeclarations(editPromptModalBlock);
    const darkEditPromptModalBlock = readCssBlock(
      settingsStyles,
      ":global(.dark) .edit-prompt-modal",
    );
    const autoDarkEditPromptModalSelector =
      ":global(body:not(.light)) .edit-prompt-modal";
    const autoDarkEditPromptModalSelectorIndex = settingsStyles.indexOf(
      autoDarkEditPromptModalSelector,
    );
    const autoDarkEditPromptModalMediaIndex = settingsStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkEditPromptModalSelectorIndex,
    );
    const autoDarkEditPromptModalBlock = readCssBlock(
      settingsStyles.slice(autoDarkEditPromptModalMediaIndex),
      autoDarkEditPromptModalSelector,
    );
    const editPromptTitleBlock = readCssBlock(
      editPromptModalBlock,
      ".edit-prompt-title",
    );
    const editPromptContentBlock = readCssBlock(
      editPromptModalBlock,
      ".edit-prompt-content",
    );
    const editPromptTitleFocusBlock = readCssBlock(
      editPromptTitleBlock,
      "&:focus",
    );
    const editPromptContentFocusBlock = readCssBlock(
      editPromptContentBlock,
      "&:focus",
    );
    const editPromptTitleReadOnlyBlock = readCssBlock(
      editPromptTitleBlock,
      "&:read-only",
    );
    const editPromptContentReadOnlyBlock = readCssBlock(
      editPromptContentBlock,
      "&:read-only",
    );
    const editPromptPaintScope = [
      editPromptModalRootBlock,
      darkEditPromptModalBlock,
      autoDarkEditPromptModalBlock,
      editPromptTitleBlock,
      editPromptContentBlock,
      editPromptTitleFocusBlock,
      editPromptContentFocusBlock,
      editPromptTitleReadOnlyBlock,
      editPromptContentReadOnlyBlock,
    ].join("\n");

    expect(editPromptModal).toContain("usePromptStore()");
    expect(editPromptModal).toContain("promptStore.get(props.id)");
    expect(editPromptModal).toContain("readOnly={!prompt.isUser}");
    expect(editPromptModal).toContain("promptStore.updatePrompt");
    expect(editPromptModal).toMatch(
      /promptStore\.updatePrompt\([\s\S]*\(prompt\) => \(prompt\.title = e\.currentTarget\.value\)/,
    );
    expect(editPromptModal).toMatch(
      /promptStore\.updatePrompt\([\s\S]*\(prompt\) => \(prompt\.content = e\.currentTarget\.value\)/,
    );

    expect(editPromptModalRootBlock).toMatch(
      /--settings-edit-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 90%,\s*var\(--gray\)\s*\);/,
    );
    expect(editPromptModalRootBlock).toMatch(
      /--settings-edit-field-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 14%,\s*transparent\s*\);/,
    );
    expect(editPromptModalRootBlock).toMatch(
      /--settings-edit-field-muted-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 78%,\s*var\(--gray\)\s*\);/,
    );
    expect(editPromptModalRootBlock).toMatch(
      /--settings-edit-field-focus-border-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 58%,\s*transparent\s*\);/,
    );
    expect(editPromptModalRootBlock).toMatch(
      /--settings-edit-field-focus-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 16%,\s*transparent\s*\);/,
    );
    expect(darkEditPromptModalBlock).toMatch(
      /--settings-edit-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(darkEditPromptModalBlock).toMatch(
      /--settings-edit-field-muted-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 82%,\s*var\(--white\)\s*\);/,
    );
    expect(darkEditPromptModalBlock).toMatch(
      /--settings-edit-field-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 11%,\s*transparent\s*\);/,
    );
    expect(darkEditPromptModalBlock).toMatch(
      /--settings-edit-field-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 58%,\s*transparent\s*\);/,
    );
    expect(autoDarkEditPromptModalSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkEditPromptModalMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkEditPromptModalBlock).toMatch(
      /--settings-edit-field-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkEditPromptModalBlock).toMatch(
      /--settings-edit-field-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 11%,\s*transparent\s*\);/,
    );
    expect(autoDarkEditPromptModalBlock).toMatch(
      /--settings-edit-field-muted-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 82%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkEditPromptModalBlock).toMatch(
      /--settings-edit-field-muted-color:\s*color-mix\(\s*in srgb,\s*var\(--black\) 58%,\s*transparent\s*\);/,
    );

    [editPromptTitleBlock, editPromptContentBlock].forEach((block) => {
      expect(block).toMatch(
        /background-color:\s*var\(--settings-edit-field-background\);/,
      );
      expect(block).toMatch(
        /border:\s*1px solid var\(--settings-edit-field-border-color\);/,
      );
      expect(block).toMatch(/border-radius:\s*8px;/);
      expect(block).toMatch(/color:\s*var\(--black\);/);
      expect(block).toMatch(
        /transition:[\s\S]*background-color 0\.16s ease,[\s\S]*border-color 0\.16s ease,[\s\S]*box-shadow 0\.16s ease/,
      );
    });
    [editPromptTitleFocusBlock, editPromptContentFocusBlock].forEach((block) => {
      expect(block).toMatch(
        /border-color:\s*var\(--settings-edit-field-focus-border-color\);/,
      );
      expect(block).toMatch(
        /box-shadow:\s*0 0 0 3px var\(--settings-edit-field-focus-shadow-color\);/,
      );
    });
    [editPromptTitleReadOnlyBlock, editPromptContentReadOnlyBlock].forEach(
      (block) => {
        expect(block).toMatch(
          /background-color:\s*var\(--settings-edit-field-muted-background\);/,
        );
        expect(block).toMatch(
          /color:\s*var\(--settings-edit-field-muted-color\);/,
        );
      },
    );
    expect(editPromptPaintScope).not.toContain("border: var(--border-in-light)");
    expect(editPromptPaintScope).not.toContain(
      "background-color: var(--gray)",
    );
    expect(editPromptPaintScope).not.toContain("border-radius: 10px");
  });

  test("keeps shared InputRange aligned with Gemini utility controls", () => {
    const inputRange = read("app/components/input-range.tsx");
    const inputRangeStyles = read("app/components/input-range.module.scss");
    const inputRangeBlock = readCssBlock(inputRangeStyles, ".input-range");
    const inputRangeRootBlock = readRootDeclarations(inputRangeBlock);
    const darkInputRangeBlock = readCssBlock(
      inputRangeStyles,
      ":global(.dark) .input-range",
    );
    const autoDarkInputRangeSelector =
      ":global(body:not(.light)) .input-range";
    const autoDarkInputRangeSelectorIndex = inputRangeStyles.indexOf(
      autoDarkInputRangeSelector,
    );
    const autoDarkInputRangeMediaIndex = inputRangeStyles.lastIndexOf(
      "@media (prefers-color-scheme: dark)",
      autoDarkInputRangeSelectorIndex,
    );
    const autoDarkInputRangeBlock = readCssBlock(
      inputRangeStyles.slice(autoDarkInputRangeMediaIndex),
      autoDarkInputRangeSelector,
    );
    const focusWithinBlock = readCssBlock(inputRangeBlock, "&:focus-within");
    const disabledBlock = readCssBlock(inputRangeBlock, "&:has(input:disabled)");
    const rangeInputBlock = readCssBlock(inputRangeBlock, 'input[type="range"]');
    const rangeInputDisabledBlock = readCssBlock(
      rangeInputBlock,
      "&:disabled",
    );
    const webkitThumbBlock = readCssBlock(
      rangeInputBlock,
      "&::-webkit-slider-thumb",
    );
    const mozThumbBlock = readCssBlock(rangeInputBlock, "&::-moz-range-thumb");
    const rangePaintScope = [
      inputRangeRootBlock,
      darkInputRangeBlock,
      autoDarkInputRangeBlock,
      focusWithinBlock,
      disabledBlock,
      rangeInputBlock,
      rangeInputDisabledBlock,
      webkitThumbBlock,
      mozThumbBlock,
    ].join("\n");

    expect(inputRange).toContain("clsx(styles[\"input-range\"], className)");
    expect(inputRange).toContain("aria-label={aria}");
    expect(inputRange).toContain("type=\"range\"");
    expect(inputRange).toContain("title={title}");
    expect(inputRange).toContain("value={value}");
    expect(inputRange).toContain("min={min}");
    expect(inputRange).toContain("max={max}");
    expect(inputRange).toContain("step={step}");
    expect(inputRange).toContain("disabled={disabled}");
    expect(inputRange).toContain("onChange={onChange}");

    expect(inputRangeRootBlock).toMatch(
      /--input-range-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 90%,\s*var\(--gray\)\s*\);/,
    );
    expect(inputRangeRootBlock).toMatch(
      /--input-range-border-color:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 14%,\s*transparent\s*\);/,
    );
    expect(inputRangeRootBlock).toMatch(
      /--input-range-track-background:\s*color-mix\(\s*in srgb,\s*var\(--black-50\) 12%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(inputRangeRootBlock).toMatch(
      /--input-range-focus-shadow-color:\s*color-mix\(\s*in srgb,\s*var\(--primary\) 16%,\s*transparent\s*\);/,
    );
    expect(darkInputRangeBlock).toMatch(
      /--input-range-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(darkInputRangeBlock).toMatch(
      /--input-range-track-background:\s*color-mix\(\s*in srgb,\s*var\(--black\) 16%,\s*var\(--surface-elevated\)\s*\);/,
    );
    expect(autoDarkInputRangeSelectorIndex).toBeGreaterThan(-1);
    expect(autoDarkInputRangeMediaIndex).toBeGreaterThan(-1);
    expect(autoDarkInputRangeBlock).toMatch(
      /--input-range-background:\s*color-mix\(\s*in srgb,\s*var\(--surface-elevated\) 86%,\s*var\(--white\)\s*\);/,
    );
    expect(autoDarkInputRangeBlock).toMatch(
      /--input-range-track-background:\s*color-mix\(\s*in srgb,\s*var\(--black\) 16%,\s*var\(--surface-elevated\)\s*\);/,
    );

    expect(inputRangeRootBlock).toMatch(
      /background-color:\s*var\(--input-range-background\);/,
    );
    expect(inputRangeRootBlock).toMatch(
      /border:\s*1px solid var\(--input-range-border-color\);/,
    );
    expect(inputRangeRootBlock).toMatch(/border-radius:\s*8px;/);
    expect(inputRangeRootBlock).toMatch(/color:\s*var\(--black\);/);
    expect(inputRangeRootBlock).toMatch(/min-height:\s*36px;/);
    expect(focusWithinBlock).toMatch(
      /border-color:\s*var\(--input-range-focus-border-color\);/,
    );
    expect(focusWithinBlock).toMatch(
      /box-shadow:\s*0 0 0 3px var\(--input-range-focus-shadow-color\);/,
    );
    expect(disabledBlock).toMatch(
      /background-color:\s*var\(--input-range-disabled-background\);/,
    );
    expect(disabledBlock).toMatch(/cursor:\s*not-allowed;/);

    expect(rangeInputBlock).toMatch(/appearance:\s*none;/);
    expect(rangeInputBlock).toMatch(
      /background-color:\s*var\(--input-range-track-background\);/,
    );
    expect(rangeInputBlock).toMatch(/border-radius:\s*999px;/);
    expect(rangeInputBlock).toMatch(/height:\s*4px;/);
    expect(rangeInputBlock).toMatch(/accent-color:\s*var\(--primary\);/);
    expect(rangeInputDisabledBlock).toMatch(/cursor:\s*not-allowed;/);
    [webkitThumbBlock, mozThumbBlock].forEach((block) => {
      expect(block).toMatch(/appearance:\s*none;/);
      expect(block).toMatch(/height:\s*8px;/);
      expect(block).toMatch(/width:\s*20px;/);
      expect(block).toMatch(/border-radius:\s*999px;/);
      expect(block).toMatch(
        /background-color:\s*var\(--input-range-thumb-background\);/,
      );
      expect(block).toMatch(
        /box-shadow:\s*0 2px 6px var\(--input-range-thumb-shadow-color\);/,
      );
    });
    expect(rangePaintScope).not.toContain("border: var(--border-in-light)");
    expect(rangePaintScope).not.toContain("border-radius: 10px");
    expect(rangePaintScope).not.toContain("background-color: var(--white)");
  });
});
