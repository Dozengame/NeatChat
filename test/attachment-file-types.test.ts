import {
  extractClipboardImageUrls,
  getAttachmentRenderKey,
  getClipboardAttachmentPayload,
  getDraggedAttachmentSummary,
  getFileTypeByExtension,
  isAttachmentImage,
  isSupportedAttachmentFile,
  removeAttachmentAtIndex,
  replaceAttachmentImageAtIndex,
} from "../app/utils/file";
import { isVisionModel } from "../app/utils";
import { OPENAI_GPT_56_MODELS } from "../app/constant";
import Locale from "../app/locales";

function dragTransferFromFiles(files: File[]) {
  return {
    files,
    items: [],
  } as unknown as DataTransfer;
}

function dragTransferFromItems(files: File[]) {
  return {
    files: [],
    items: files.map((file) => ({
      kind: "file",
      type: file.type,
      getAsFile: () => file,
    })),
  } as unknown as DataTransfer;
}

function clipboardTransfer({
  files = [],
  items = [],
  html = "",
  text = "",
}: {
  files?: File[];
  items?: File[];
  html?: string;
  text?: string;
}) {
  return {
    files,
    items: items.map((file) => ({
      kind: "file",
      type: file.type,
      getAsFile: () => file,
    })),
    getData(type: string) {
      if (type === "text/html") return html;
      if (type === "text/plain") return text;
      return "";
    },
  } as unknown as DataTransfer;
}

describe("attachment file type support", () => {
  test("supports laya, cocos, and lua code attachments", () => {
    expect(getFileTypeByExtension("main.lua")).toBe("text/x-lua");
    expect(getFileTypeByExtension("game.laya")).toBe("text/x-laya");
    expect(getFileTypeByExtension("scene.fire")).toBe("text/x-game-asset");

    expect(
      isSupportedAttachmentFile(
        new File(["print('ok')"], "main.lua", { type: "" }),
      ),
    ).toBe(true);
    expect(
      isSupportedAttachmentFile(new File(["{}"], "scene.fire", { type: "" })),
    ).toBe(true);
  });

  test("recognizes pasted image files even when the mime type is missing", () => {
    expect(
      isAttachmentImage(new File(["image"], "pasted.png", { type: "" })),
    ).toBe(true);
    expect(
      isAttachmentImage(new File(["image"], "pasted.heic", { type: "" })),
    ).toBe(true);
    expect(
      isAttachmentImage(new File(["image"], "pasted.heif", { type: "" })),
    ).toBe(true);
  });

  test("summarizes dragged attachments by remaining slots", () => {
    const png = new File(["image"], "gemini.png", { type: "image/png" });
    const note = new File(["notes"], "notes.txt", { type: "text/plain" });
    const dragCopy = Locale.Chat.Attachments.Drag;

    expect(getDraggedAttachmentSummary(dragTransferFromFiles([png, note]), 0, 0))
      .toEqual({
        text: dragCopy.WillAdd(
          [dragCopy.ImageCount(1), dragCopy.FileCount(1)],
          false,
        ),
        hint: dragCopy.AddHint,
        willAdd: true,
      });
    expect(getDraggedAttachmentSummary(dragTransferFromFiles([png, note]), 3, 5))
      .toEqual({
        text: dragCopy.Limit,
        hint: dragCopy.BlockedHint,
        willAdd: false,
      });
    expect(getDraggedAttachmentSummary(dragTransferFromFiles([png, note]), 3, 0))
      .toEqual({
        text: dragCopy.WillAdd([dragCopy.FileCount(1)], true),
        hint: dragCopy.AddHint,
        willAdd: true,
      });
  });

  test("summarizes empty-mime dragged images using the real extension fallback", () => {
    const pastedPng = new File(["image"], "pasted.png", { type: "" });
    const dragCopy = Locale.Chat.Attachments.Drag;

    expect(getDraggedAttachmentSummary(dragTransferFromFiles([pastedPng]), 0, 0))
      .toEqual({
        text: dragCopy.WillAdd([dragCopy.ImageCount(1)], false),
        hint: dragCopy.AddHint,
        willAdd: true,
      });
    expect(getDraggedAttachmentSummary(dragTransferFromItems([pastedPng]), 0, 0))
      .toEqual({
        text: dragCopy.WillAdd([dragCopy.ImageCount(1)], false),
        hint: dragCopy.AddHint,
        willAdd: true,
      });
    expect(getDraggedAttachmentSummary(dragTransferFromFiles([pastedPng]), 0, 5))
      .toEqual({
        text: dragCopy.WillAdd([dragCopy.ImageCount(1)], false),
        hint: dragCopy.AddHint,
        willAdd: true,
      });
  });

  test("treats gpt-5.5 as image-input capable", () => {
    expect(isVisionModel("gpt-5.5")).toBe(true);
  });

  test.each(OPENAI_GPT_56_MODELS)(
    "treats %s as image-input capable",
    (model) => {
      expect(isVisionModel(model)).toBe(true);
    },
  );

  test("extracts pasted images from html and data-url text", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
    const clipboardData = {
      getData(type: string) {
        if (type === "text/html") {
          return `<img src="${dataUrl}"><img src="https://example.com/a.png">`;
        }
        if (type === "text/plain") {
          return `copied image ${dataUrl}`;
        }
        return "";
      },
    } as DataTransfer;

    expect(extractClipboardImageUrls(clipboardData)).toEqual([
      dataUrl,
      "https://example.com/a.png",
    ]);
  });

  test("deduplicates pasted files exposed through both clipboard file lists", () => {
    const fileListImage = new File(["image"], "pasted.png", {
      type: "image/png",
      lastModified: 1,
    });
    const itemListImage = new File(["image"], "pasted.png", {
      type: "image/png",
      lastModified: 2,
    });
    const fileListDocument = new File(["notes"], "notes.txt", {
      type: "text/plain",
      lastModified: 1,
    });
    const itemListDocument = new File(["notes"], "notes.txt", {
      type: "text/plain",
      lastModified: 2,
    });
    const dataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";

    const payload = getClipboardAttachmentPayload(
      clipboardTransfer({
        files: [fileListImage, fileListDocument],
        items: [itemListImage, itemListDocument],
        html: `<img src="${dataUrl}">`,
        text: `copied image ${dataUrl}`,
      }),
    );

    expect(payload.files).toEqual([fileListImage, fileListDocument]);
    expect(payload.imageUrls).toEqual([]);
  });

  test("replaces only the selected attachment image when duplicate urls exist", () => {
    expect(replaceAttachmentImageAtIndex(["same", "same"], 1, "edited")).toEqual(
      ["same", "edited"],
    );
  });

  test("creates distinct render keys for duplicate attachment values", () => {
    const duplicateFile = {
      name: "same.md",
      type: "text/markdown",
      size: 128,
      content: "# Same",
      originalFile: new File(["# Same"], "same.md", {
        type: "text/markdown",
      }),
    };

    expect(getAttachmentRenderKey("image", "same-url", 0)).not.toBe(
      getAttachmentRenderKey("image", "same-url", 1),
    );
    expect(getAttachmentRenderKey("file", duplicateFile, 0)).not.toBe(
      getAttachmentRenderKey("file", duplicateFile, 1),
    );
  });

  test("removes attachments by index without mutating the source list", () => {
    const source = ["a", "b", "c"];

    expect(removeAttachmentAtIndex(source, 1)).toEqual(["a", "c"]);
    expect(source).toEqual(["a", "b", "c"]);
  });
});
