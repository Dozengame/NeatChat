import {
  ATTACHMENT_WIRE_HEADER_PATTERN,
  formatAttachmentForPrompt,
} from "../app/utils/attachment-wire";

describe("attachment prompt wire format", () => {
  test("keeps the established parser contract independent of UI locale", () => {
    const formatted = formatAttachmentForPrompt({
      name: "report.txt",
      type: "text/plain",
      size: 1024,
      content: "latest news is only attachment content",
    });

    expect(formatted).toBe(
      "文件名: report.txt\n类型: text/plain\n大小: 1.00 KB\n\nlatest news is only attachment content",
    );
    expect(formatted.search(ATTACHMENT_WIRE_HEADER_PATTERN)).toBe(0);
  });
});
