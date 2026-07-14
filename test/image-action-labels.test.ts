import {
  getImageActionLabels,
  getMessageImageLabel,
  getImagePreviewAlt,
  getImagePreviewDialogLabel,
} from "../app/utils/image-action-labels";
import Locale from "../app/locales";

describe("image action labels", () => {
  test("uses default image labels when no alt text is available", () => {
    expect(getImageActionLabels()).toEqual({
      preview: Locale.ImageActions.Preview,
      download: Locale.ImageActions.Download,
    });
  });

  test("uses alt text as action context", () => {
    expect(getImageActionLabels("generated sunrise")).toEqual({
      preview: Locale.ImageActions.PreviewWithLabel("generated sunrise"),
      download: Locale.ImageActions.DownloadWithLabel("generated sunrise"),
    });
  });

  test("uses stable labels for single and multi-image message groups", () => {
    expect(getMessageImageLabel(0, 1)).toBe(Locale.ImageActions.Message(1, 1));
    expect(getMessageImageLabel(1, 3)).toBe(Locale.ImageActions.Message(2, 3));
  });

  test("uses image context for the preview image alt text", () => {
    expect(getImagePreviewAlt()).toBe(Locale.ImageActions.PreviewAlt);
    expect(getImagePreviewAlt(" generated sunrise ")).toBe("generated sunrise");
    expect(getImagePreviewAlt("第 2 张图片")).toBe("第 2 张图片");
  });

  test("uses image context for the preview dialog label", () => {
    expect(getImagePreviewDialogLabel()).toBe(Locale.ImageActions.PreviewDialog);
    expect(getImagePreviewDialogLabel("   ")).toBe(
      Locale.ImageActions.PreviewDialog,
    );
    expect(getImagePreviewDialogLabel(Locale.ImageActions.Image)).toBe(
      Locale.ImageActions.PreviewDialog,
    );
    expect(getImagePreviewDialogLabel(" generated sunrise ")).toBe(
      Locale.ImageActions.PreviewDialogWithLabel("generated sunrise"),
    );
    expect(getImagePreviewDialogLabel("第 2 张图片")).toBe(
      Locale.ImageActions.PreviewDialogWithLabel("第 2 张图片"),
    );
  });
});
