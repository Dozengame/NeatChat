import {
  getImageActionLabels,
  getMessageImageLabel,
  getImagePreviewAlt,
  getImagePreviewDialogLabel,
} from "../app/utils/image-action-labels";

describe("image action labels", () => {
  test("uses default image labels when no alt text is available", () => {
    expect(getImageActionLabels()).toEqual({
      preview: "预览图片",
      download: "下载图片原图",
    });
  });

  test("uses alt text as action context", () => {
    expect(getImageActionLabels("generated sunrise")).toEqual({
      preview: "预览 generated sunrise",
      download: "下载 generated sunrise 原图",
    });
  });

  test("uses stable labels for single and multi-image message groups", () => {
    expect(getMessageImageLabel(0, 1)).toBe("图片");
    expect(getMessageImageLabel(1, 3)).toBe("第 2 张图片");
  });

  test("uses image context for the preview image alt text", () => {
    expect(getImagePreviewAlt()).toBe("图片预览");
    expect(getImagePreviewAlt(" generated sunrise ")).toBe("generated sunrise");
    expect(getImagePreviewAlt("第 2 张图片")).toBe("第 2 张图片");
  });

  test("uses image context for the preview dialog label", () => {
    expect(getImagePreviewDialogLabel()).toBe("图片预览");
    expect(getImagePreviewDialogLabel("   ")).toBe("图片预览");
    expect(getImagePreviewDialogLabel("图片")).toBe("图片预览");
    expect(getImagePreviewDialogLabel(" generated sunrise ")).toBe(
      "图片预览：generated sunrise",
    );
    expect(getImagePreviewDialogLabel("第 2 张图片")).toBe(
      "图片预览：第 2 张图片",
    );
  });
});
