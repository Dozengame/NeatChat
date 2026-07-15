import fs from "fs";
import path from "path";

import { filterComposerPrompts } from "../app/utils/composer-prompt-library";
import { getAttachmentUploadAccept } from "../app/utils/file";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("Composer 2.2 tools menu", () => {
  test("separates image and file chooser accept contracts", () => {
    const imageAccept = getAttachmentUploadAccept("image");
    const fileAccept = getAttachmentUploadAccept("file");
    const allAccept = getAttachmentUploadAccept("all");

    expect(imageAccept).toContain("image/png");
    expect(imageAccept).toContain(".heif");
    expect(imageAccept).not.toContain(".pdf");
    expect(imageAccept).not.toContain(".svg");

    expect(fileAccept).toContain(".pdf");
    expect(fileAccept).toContain(".svg");
    expect(fileAccept).toContain("Dockerfile");
    expect(fileAccept).not.toContain("image/png");
    expect(fileAccept).not.toContain(".png");

    expect(allAccept).toContain(imageAccept);
    expect(allAccept).toContain(fileAccept);
  });

  test("filters real prompt records without demo categories", () => {
    const prompts = [
      {
        id: "user",
        isUser: true,
        title: "My prompt",
        content: "User content",
        createdAt: 2,
      },
      {
        id: "builtin",
        title: "Official prompt",
        content: "Builtin content",
        createdAt: 1,
      },
    ];

    expect(filterComposerPrompts(prompts, "all")).toEqual(prompts);
    expect(filterComposerPrompts(prompts, "user")).toEqual([prompts[0]]);
    expect(filterComposerPrompts(prompts, "builtin")).toEqual([prompts[1]]);
  });

  test("keeps tools and model menus mutually exclusive with a real prompt drill-in", () => {
    const source = read("app/components/chat.tsx");

    expect(source).toContain(
      'type ChatActionMenuView = "main" | "prompt-library"',
    );
    expect(source).toContain("function ComposerPromptLibrary(");
    expect(source).toContain("uploadImages: () => void");
    expect(source).toContain("uploadFiles: () => void");
    expect(source).toContain('data-chat-action="prompt-library"');
    expect(source).toContain('id="chat-composer-prompt-library"');
    expect(source).not.toMatch(
      /text=\{Locale\.Chat\.ChatToolMenu\.PromptLibrary\}[\s\S]{0,260}ariaHasPopup=/,
    );
    expect(source).toContain('data-chat-action-menu-control="true"');
    expect(source).toContain("setShowMobileModelSelector(false)");
    expect(source).toContain('setChatActionMenuView("main")');
    expect(source).toContain("onPromptSelect(prompt)");
  });

  test("announces attachment and model changes from one stable live region", () => {
    const source = read("app/components/chat.tsx");

    expect(source).toContain('styles["chat-composer-live-status"]');
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("announceComposerStatus(");
    expect(source).toContain("Locale.Chat.Attachments.RemovedImage");
    expect(source).toContain("Locale.Chat.Attachments.RemovedFile");
    expect(source).toContain("Locale.Chat.ModelMenu.ModelSelected");
    expect(source).toContain("Locale.Chat.HomeMode.Changed");
  });

  test("opening the tools menu cannot mutate attachments or model config", () => {
    const source = read("app/components/chat.tsx");
    const actionsStart = source.indexOf("function useChatActionsView(");
    const actionsEnd = source.indexOf("function ChatActions(", actionsStart);
    const actionsView = source.slice(actionsStart, actionsEnd);

    expect(actionsView).not.toContain("setAttachImages([])");
    expect(actionsView).not.toContain("setUploading(false)");
    expect(actionsView).not.toContain('source: "admin_forced"');
    expect(source).toContain("canSwitchToModelWithImageAttachments(");
    expect(source).toContain("Locale.Chat.ModelMenu.ImageAttachmentsBlocked");
  });

  test("keeps file type and size visible and prompt filters touch sized", () => {
    const source = read("app/components/chat.tsx");
    const styles = read("app/components/chat.module.scss");

    expect(source).toContain("getAttachmentFileTypeLabel(file)");
    expect(source).toContain("{fileTypeLabel} · {fileSizeLabel}");
    expect(source).toContain("Locale.Chat.Attachments.FileMetadata.Type");
    expect(styles).toMatch(
      /\.chat-prompt-library-filter\s*\{[\s\S]*min-height:\s*44px;/,
    );
  });

  test("keeps all Composer tool copy localized in Chinese and English", () => {
    for (const localeFile of ["app/locales/cn.ts", "app/locales/en.ts"]) {
      const locale = read(localeFile);

      expect(locale).toContain("UploadImage:");
      expect(locale).toContain("UploadFile:");
      expect(locale).toContain("PromptLibrary:");
      expect(locale).toContain("PromptLibrarySearch:");
      expect(locale).toContain("PromptLibraryBack:");
      expect(locale).toContain("PromptLibraryEmpty:");
    }
  });

  test("associates each disabled upload action with its actual reason", () => {
    const source = read("app/components/chat.tsx");

    expect(source).toContain('id="chat-image-upload-state"');
    expect(source).toContain('ariaDescribedBy="chat-image-upload-state"');
    expect(source).toContain("Locale.Chat.ChatToolMenu.ImageUploadUnavailable");
    expect(source).toContain("Locale.Chat.Attachments.ImageSlotsFull");
    expect(source).toContain('id="chat-file-upload-state"');
    expect(source).toContain('ariaDescribedBy="chat-file-upload-state"');
    expect(source).toContain("Locale.Chat.Attachments.FileSlotsFull");
  });
});
