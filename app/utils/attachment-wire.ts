export const ATTACHMENT_WIRE_LABELS = {
  name: "文件名",
  type: "类型",
  size: "大小",
} as const;

export const ATTACHMENT_WIRE_HEADER_PATTERN =
  /(?:^|\n\n)文件名: .+\n类型: .+\n大小: [\d.]+ KB\n\n/;

export function formatAttachmentForPrompt(file: {
  name: string;
  type: string;
  size: number;
  content: string;
}) {
  return `${ATTACHMENT_WIRE_LABELS.name}: ${file.name}\n${
    ATTACHMENT_WIRE_LABELS.type
  }: ${file.type}\n${ATTACHMENT_WIRE_LABELS.size}: ${(file.size / 1024).toFixed(
    2,
  )} KB\n\n${file.content}`;
}
