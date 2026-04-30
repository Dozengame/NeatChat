import { JIMENG_MCP_SERVER_ID } from "./jimeng";

const IMAGE_URL_PATTERN =
  /https:\/\/[^\s)"'>]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s)"'>]*)?/gi;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]\n]*\]\((https:\/\/[^\s)]+)\)/gi;
const MEDIA_LOCAL_PATH_PATTERN = /MEDIA:\/\S+/gi;
const GEN_STATUS_PATTERN = /"?gen_status"?\s*[:=]\s*"?([a-zA-Z0-9_-]+)"?/i;

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function resultToText(result: unknown): string {
  if (typeof result === "string") {
    return result;
  }

  if (result && typeof result === "object") {
    const content = (result as { content?: unknown }).content;
    if (Array.isArray(content)) {
      const textParts = content
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "text" in item) {
            const text = (item as { text?: unknown }).text;
            return typeof text === "string" ? text : "";
          }
          return "";
        })
        .filter(Boolean);

      if (textParts.length > 0) {
        return textParts.join("\n\n");
      }
    }
  }

  return JSON.stringify(result, null, 2);
}

function resultToLegacyMcpResponse(result: unknown) {
  return typeof result === "object" ? JSON.stringify(result) : String(result);
}

function hasNonSuccessStatus(text: string) {
  const status = text.match(GEN_STATUS_PATTERN)?.[1];
  return !!status && status.toLowerCase() !== "success";
}

function removeLocalMediaPaths(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(MEDIA_LOCAL_PATH_PATTERN, "").trimEnd())
    .filter((line) => line.trim())
    .join("\n")
    .trim();
}

function extractMarkdownImages(text: string) {
  const images = Array.from(text.matchAll(MARKDOWN_IMAGE_PATTERN)).map(
    (match) => ({
      markdown: match[0],
      url: match[1],
    }),
  );

  return unique(images.map((item) => item.url)).map((url, index) => {
    const markdown = images.find((item) => item.url === url)?.markdown;
    return {
      markdown,
      url,
      fallback: `![generated image ${index + 1}](${url})`,
    };
  });
}

function extractPublicImageUrls(text: string) {
  return unique(text.match(IMAGE_URL_PATTERN) ?? []);
}

function removeMarkdownImageLines(text: string) {
  return text
    .split(/\r?\n/)
    .filter(
      (line) => !line.trim().match(/^!\[[^\]\n]*\]\(https:\/\/[^\s)]+\)$/i),
    )
    .join("\n")
    .trim();
}

export function formatMcpToolResultForChat(clientId: string, result: unknown) {
  const rawText = resultToText(result);

  if (clientId !== JIMENG_MCP_SERVER_ID) {
    return `\`\`\`json:mcp-response:${clientId}\n${resultToLegacyMcpResponse(
      result,
    )}\n\`\`\``;
  }

  const sanitizedText = removeLocalMediaPaths(rawText);
  if (!sanitizedText) {
    return "";
  }

  if (hasNonSuccessStatus(sanitizedText)) {
    return sanitizedText;
  }

  const markdownImages = extractMarkdownImages(sanitizedText);
  if (markdownImages.length > 0) {
    const textWithoutImageLines = removeMarkdownImageLines(sanitizedText);
    const imageMarkdown = markdownImages
      .map((item) => item.markdown || item.fallback)
      .join("\n");
    return [textWithoutImageLines, imageMarkdown].filter(Boolean).join("\n\n");
  }

  const publicImageUrls = extractPublicImageUrls(sanitizedText);
  if (publicImageUrls.length > 0) {
    const imageMarkdown = publicImageUrls
      .map((url, index) => `![generated image ${index + 1}](${url})`)
      .join("\n");
    return [sanitizedText, imageMarkdown].join("\n\n");
  }

  return sanitizedText;
}
