import {
  extractClipboardImageUrls,
  getFileTypeByExtension,
  isAttachmentImage,
  isSupportedAttachmentFile,
} from "../app/utils/file";
import { isVisionModel } from "../app/utils";

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
  });

  test("treats gpt-5.5 as image-input capable", () => {
    expect(isVisionModel("gpt-5.5")).toBe(true);
  });

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
});
