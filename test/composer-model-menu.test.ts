import fs from "fs";
import path from "path";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("Composer 2.2 model control integration", () => {
  test("uses the four-layer transition contract and restores focus on close", () => {
    const source = read("app/components/chat.tsx");
    const styles = read("app/components/chat.module.scss");

    expect(source).toContain("getComposerModelMenuLayer(");
    expect(source).toContain("getComposerModelMenuEscapeLayer(");
    expect(source).toContain("stepBackOrCloseModelMenu");
    expect(source).toContain("setExpandedMobileModelSection(null)");
    expect(source).toContain("restoreModelSelectorFocus()");
    expect(source).toContain("data-model-menu-layer={currentModelMenuLayer}");
    expect(source).toContain('styles["chat-home-mode-tabs-model-open"]');
    expect(source).toContain("showMobileModelSelector,");
    expect(source).toContain("ref={homeModeTabsRef}");
    expect(source).toContain(`'[role="tab"][aria-selected="true"]'`);
    expect(source).toContain("trapModelMenuTab(event)");
    expect(source).toContain("aria-modal={!showEmptyState}");
    expect(source).toContain("{currentModelMenuSection && (");
    expect(source).toContain('currentModelMenuSection === "image-options"');
    expect(styles).toMatch(
      /\.chat-home-mode-tabs-model-open\s*\{[\s\S]*z-index:\s*65;/,
    );
  });

  test("keeps model writes locked and exposes the lock reason", () => {
    const source = read("app/components/chat.tsx");

    expect(source).toContain('id="chat-model-lock-status"');
    expect(source).toContain("disabled={!!headerModelLocked}");
    expect(source).toContain('"chat-model-lock-status"');
    expect(source).toContain("session.mask.modelConfigMeta?.model?.locked");
    expect(source).toContain(
      "session.mask.modelConfigMeta?.providerName?.locked",
    );
  });

  test("uses currentColor SVGs and keeps provider details out of closed copy", () => {
    const source = read("app/components/chat.tsx");
    const icons = [
      "app/icons/composer-chevron-down.svg",
      "app/icons/composer-chevron-right.svg",
      "app/icons/composer-check.svg",
      "app/icons/composer-stop.svg",
    ].map(read);

    expect(source).toContain("<ComposerChevronDownIcon />");
    expect(source).toContain("<ComposerChevronRightIcon />");
    expect(source).toContain("<ComposerCheckIcon />");
    expect(source).not.toContain(">⌄<");
    expect(source).not.toContain(">✓<");
    expect(source).not.toContain(">›<");
    expect(source).toContain(": Locale.Chat.ModelMenu.DefaultParameters;");
    expect(source).toContain("title={modelChipAccessibleLabel}");
    icons.forEach((icon) => expect(icon).toContain("currentColor"));
  });

  test("stops only streaming messages in the current session", () => {
    const source = read("app/components/chat.tsx");

    expect(source).toContain(".filter((message) => message.streaming)");
    expect(source).toContain("streamingMessageIds.forEach(onUserStop)");
    expect(source).toContain("ChatControllerPool.stop(session.id, messageId)");
    expect(source).toContain('displayedComposerSubmitState === "stop"');
  });
});
