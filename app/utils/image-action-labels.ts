import Locale from "../locales";

export function getImageActionLabels(label?: string) {
  const imageLabel = label?.trim() || Locale.ImageActions.Image;

  if (imageLabel === Locale.ImageActions.Image) {
    return {
      preview: Locale.ImageActions.Preview,
      download: Locale.ImageActions.Download,
    };
  }

  return {
    preview: Locale.ImageActions.PreviewWithLabel(imageLabel),
    download: Locale.ImageActions.DownloadWithLabel(imageLabel),
  };
}

export function getImagePreviewAlt(label?: string) {
  return label?.trim() || Locale.ImageActions.PreviewAlt;
}

export function getImagePreviewDialogLabel(label?: string) {
  const imageLabel = label?.trim();
  return imageLabel && imageLabel !== Locale.ImageActions.Image
    ? Locale.ImageActions.PreviewDialogWithLabel(imageLabel)
    : Locale.ImageActions.PreviewDialog;
}

export function getMessageImageLabel(index: number, total: number) {
  return Locale.ImageActions.Message(index + 1, total);
}
