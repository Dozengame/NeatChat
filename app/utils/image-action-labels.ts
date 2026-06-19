export function getImageActionLabels(label?: string) {
  const imageLabel = label?.trim() || "图片";

  if (imageLabel === "图片") {
    return {
      preview: "预览图片",
      download: "下载图片原图",
    };
  }

  return {
    preview: `预览 ${imageLabel}`,
    download: `下载 ${imageLabel} 原图`,
  };
}

export function getImagePreviewAlt(label?: string) {
  return label?.trim() || "图片预览";
}

export function getMessageImageLabel(index: number, total: number) {
  return total > 1 ? `第 ${index + 1} 张图片` : "图片";
}
