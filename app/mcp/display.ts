import { JIMENG_MCP_SERVER_ID } from "./jimeng";
import { extractMcpJson } from "./utils";
import Locale from "../locales";

const IMAGE_URL_PATTERN =
  /https:\/\/[^\s)"'>]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s)"'>]*)?/gi;
const IMAGE_URL_LINE_PATTERN =
  /^https:\/\/[^\s)"'>]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s)"'>]*)?$/i;
const VIDEO_URL_PATTERN =
  /https:\/\/[^\s)"'>]+\.(?:3g[2p]|avi|m4v|mov|mp4|mpeg|ogv|webm)(?:\?[^\s)"'>]*)?/gi;
const VIDEO_URL_LINE_PATTERN =
  /^https:\/\/[^\s)"'>]+\.(?:3g[2p]|avi|m4v|mov|mp4|mpeg|ogv|webm)(?:\?[^\s)"'>]*)?$/i;
const QUOTED_HTTPS_URL_PATTERN = /["'](https:\/\/[^"']+)["']/gi;
const BARE_HTTPS_URL_PATTERN = /https:\/\/[^\s"'<>\[\]{}]+/gi;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]\n]*\]\((https:\/\/[^\s)]+)\)/gi;
const MARKDOWN_IMAGE_LINE_PATTERN = /^!\[[^\]\n]*\]\((https:\/\/[^\s)]+)\)$/i;
const MARKDOWN_VIDEO_PATTERN =
  /\[[^\]\n]*\]\((https:\/\/[^\s)]+\.(?:3g[2p]|avi|m4v|mov|mp4|mpeg|ogv|webm)(?:\?[^\s)]*)?)\)/gi;
const MARKDOWN_VIDEO_LINE_PATTERN =
  /^\[[^\]\n]*\]\((https:\/\/[^\s)]+\.(?:3g[2p]|avi|m4v|mov|mp4|mpeg|ogv|webm)(?:\?[^\s)]*)?)\)$/i;
const MARKDOWN_GENERATED_MEDIA_PATTERN =
  /^\[generated (?:media|video) \d+\]\((https:\/\/[^\s)]+)\)$/i;
const MEDIA_LOCAL_PATH_PATTERN = /MEDIA:\/\S+/gi;
const GEN_STATUS_PATTERN = /"?gen_status"?\s*[:=]\s*"?([a-zA-Z0-9_-]+)"?/gi;
const SUBMIT_ID_PATTERN = /"?submit_id"?\s*[:=]\s*"?([^",\s]+)"?/gi;
const ERROR_DETAIL_PATTERN =
  /^"?((?:error(?:_code|_message|_reason)?|fail(?:ure)?_reason|message|detail|stderr))"?\s*[:=]\s*(.+?)\s*,?$/i;
const ERROR_DETAIL_HEADER_PATTERN =
  /^"?((?:error(?:_code|_message|_reason)?|fail(?:ure)?_reason|message|detail|stderr))"?\s*[:=]\s*$/i;
const DIAGNOSTIC_BLOCK_BOUNDARY_PATTERN =
  /^"?(?:command|stdout|downloaded_files|public_urls|markdown_images|feishu_delivery|local_file|submit_id|gen_status|result_json)"?\s*[:=]/i;
const JimengDisplay = Locale.Chat.ImageGeneration.Display;
const JIMENG_PROGRESS_MARKERS = [
  "\n\n当前进度：",
  "\n\nProgress:",
  `\n\n${JimengDisplay.Progress}`,
];
const JIMENG_TASK_MARKERS = [
  "图片生成任务",
  "Image generation task",
  JimengDisplay.Task,
];
const JIMENG_GENERATION_TOOL_LABELS: Record<string, string> = {
  dreamina_text2image: JimengDisplay.TextToImage,
  dreamina_image2image: JimengDisplay.ImageToImage,
  dreamina_text2video: JimengDisplay.TextToVideo,
  dreamina_image2video: JimengDisplay.ImageToVideo,
};

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function getLastPatternValue(text: string, pattern: RegExp) {
  return Array.from(text.matchAll(pattern)).at(-1)?.[1];
}

function resultToText(result: unknown): string {
  if (typeof result === "string") {
    return result;
  }

  if (result && typeof result === "object") {
    const content = (result as { content?: unknown }).content;
    if (Array.isArray(content)) {
      const textParts = content.flatMap((item) => {
        if (typeof item === "string") return item ? [item] : [];
        if (item && typeof item === "object" && "text" in item) {
          const text = (item as { text?: unknown }).text;
          return typeof text === "string" && text ? [text] : [];
        }
        return [];
      });

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

function getLastGenStatus(text: string) {
  return getLastPatternValue(text, GEN_STATUS_PATTERN);
}

function getLastSubmitId(text: string) {
  return getLastPatternValue(text, SUBMIT_ID_PATTERN);
}

function hasNonSuccessStatus(text: string) {
  const status = getLastGenStatus(text);
  return !!status && status.toLowerCase() !== "success";
}

function isTerminalFailureStatus(status?: string) {
  return (
    !!status &&
    ["failed", "failure", "error", "cancelled", "canceled", "timeout"].includes(
      status.toLowerCase(),
    )
  );
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

function extractMarkdownVideos(text: string) {
  return unique(
    Array.from(text.matchAll(MARKDOWN_VIDEO_PATTERN)).map((match) => match[1]),
  );
}

function extractPublicVideoUrls(text: string) {
  return unique(text.match(VIDEO_URL_PATTERN) ?? []);
}

function extractDeclaredUrlsFromValue(value: string) {
  const quotedUrls = Array.from(value.matchAll(QUOTED_HTTPS_URL_PATTERN)).map(
    (match) => match[1].trim(),
  );
  if (quotedUrls.length > 0) {
    return quotedUrls;
  }

  return (value.match(BARE_HTTPS_URL_PATTERN) ?? []).map((url) => {
    let normalized = url.replace(/[.,;]+$/, "");
    while (normalized.endsWith(")")) {
      const closingCount = normalized.match(/\)/g)?.length ?? 0;
      const openingCount = normalized.match(/\(/g)?.length ?? 0;
      if (closingCount <= openingCount) break;
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  });
}

function extractDeclaredPublicUrls(text: string) {
  const urls: string[] = [];
  let collecting = false;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    const header = trimmed.match(/^"?public_urls"?\s*[:=]\s*(.*)$/i);
    if (header) {
      collecting = true;
      urls.push(...extractDeclaredUrlsFromValue(header[1]));
      continue;
    }

    if (!collecting) continue;
    const lineUrls = extractDeclaredUrlsFromValue(trimmed);
    if (lineUrls.length > 0) {
      urls.push(...lineUrls);
      continue;
    }
    if (trimmed && !/^[\],]+$/.test(trimmed)) {
      collecting = false;
    }
  }

  return unique(urls);
}

type DisplayableMediaItem = {
  url: string;
  markdown: string;
};

function getDisplayableMediaItems(text: string) {
  const items: DisplayableMediaItem[] = [];
  const seen = new Set<string>();
  const add = (url: string, markdown: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    items.push({ url, markdown });
  };

  extractMarkdownImages(text).forEach((item, index) =>
    add(item.url, item.markdown || item.fallback),
  );
  extractMarkdownVideos(text).forEach((url, index) =>
    add(url, `[generated video ${index + 1}](${url})`),
  );
  Array.from(text.matchAll(new RegExp(MARKDOWN_GENERATED_MEDIA_PATTERN, "gim")))
    .map((match) => match[1])
    .forEach((url, index) =>
      add(url, `[generated media ${index + 1}](${url})`),
    );
  extractPublicImageUrls(text).forEach((url, index) =>
    add(url, `![generated image ${index + 1}](${url})`),
  );
  extractPublicVideoUrls(text).forEach((url, index) =>
    add(url, `[generated video ${index + 1}](${url})`),
  );
  extractDeclaredPublicUrls(text).forEach((url, index) =>
    add(url, `[generated media ${index + 1}](${url})`),
  );

  return items;
}

function hasDisplayableMedia(text: string) {
  return getDisplayableMediaItems(text).length > 0;
}

function getMarkdownMediaLines(text: string) {
  return getDisplayableMediaItems(text).map((item) => item.markdown);
}

function removeMarkdownImageLines(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => !line.trim().match(MARKDOWN_IMAGE_LINE_PATTERN))
    .join("\n")
    .trim();
}

function removeMarkdownMediaLines(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return !(
        MARKDOWN_IMAGE_LINE_PATTERN.test(trimmed) ||
        MARKDOWN_VIDEO_LINE_PATTERN.test(trimmed) ||
        MARKDOWN_GENERATED_MEDIA_PATTERN.test(trimmed)
      );
    })
    .join("\n")
    .trim();
}

function getJimengToolCall(content: string) {
  try {
    const request = extractMcpJson(content);
    if (request?.clientId !== JIMENG_MCP_SERVER_ID) {
      return undefined;
    }

    const mcp = request.mcp as {
      method?: string;
      params?: {
        name?: string;
        arguments?: Record<string, unknown>;
      };
    };
    if (mcp.method !== "tools/call") {
      return undefined;
    }

    const toolName = mcp.params?.name;
    if (!toolName || !(toolName in JIMENG_GENERATION_TOOL_LABELS)) {
      return undefined;
    }

    return {
      toolName,
      arguments: mcp.params?.arguments ?? {},
    };
  } catch (error) {
    return undefined;
  }
}

function getStringArgument(
  args: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = args[key];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function getJimengRequestParameterLines(args: Record<string, unknown>) {
  return [
    [JimengDisplay.AspectRatio, getStringArgument(args, "ratio")],
    [
      JimengDisplay.Resolution,
      getStringArgument(args, "resolution_type") ??
        getStringArgument(args, "video_resolution"),
    ],
    [JimengDisplay.ModelVersion, getStringArgument(args, "model_version")],
    [JimengDisplay.Duration, getStringArgument(args, "duration")],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}${value}`);
}

function getJimengStatusLabel(status?: string) {
  const normalized = status?.toLowerCase();
  if (!normalized) return JimengDisplay.Submitted;
  if (normalized === "success") return JimengDisplay.Success;
  if (["querying", "running", "processing", "pending"].includes(normalized)) {
    return JimengDisplay.Generating;
  }
  if (["failed", "failure", "error"].includes(normalized)) {
    return JimengDisplay.Failure;
  }
  if (["cancelled", "canceled"].includes(normalized)) {
    return JimengDisplay.Cancelled;
  }
  if (normalized === "timeout") return JimengDisplay.Timeout;
  return status ?? JimengDisplay.Unknown;
}

function stripJimengProgressSection(text: string) {
  const progressIndexes = JIMENG_PROGRESS_MARKERS.map((marker) =>
    text.lastIndexOf(marker),
  ).filter((index) => index >= 0);
  if (progressIndexes.length === 0) {
    return text.trim();
  }

  return text.slice(0, Math.max(...progressIndexes)).trim();
}

function normalizeDiagnosticValue(value: string) {
  return value
    .trim()
    .replace(/^["']/, "")
    .replace(/["'],?$/, "")
    .trim();
}

function isDiagnosticBlockBoundary(line: string) {
  const trimmed = line.trim();
  return (
    !trimmed ||
    DIAGNOSTIC_BLOCK_BOUNDARY_PATTERN.test(trimmed) ||
    MARKDOWN_IMAGE_LINE_PATTERN.test(trimmed) ||
    IMAGE_URL_LINE_PATTERN.test(trimmed) ||
    MARKDOWN_VIDEO_LINE_PATTERN.test(trimmed) ||
    VIDEO_URL_LINE_PATTERN.test(trimmed) ||
    trimmed.startsWith("/home/ubuntu/") ||
    trimmed === "{" ||
    trimmed === "}"
  );
}

function extractErrorDetails(text: string) {
  const lines = text.split(/\r?\n/);
  const details: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const inlineMatch = trimmed.match(ERROR_DETAIL_PATTERN);
    if (inlineMatch) {
      const value = normalizeDiagnosticValue(inlineMatch[2]);
      if (value && value !== "(empty)") {
        details.push(`${inlineMatch[1]}: ${value}`);
      }
      return;
    }

    const headerMatch = trimmed.match(ERROR_DETAIL_HEADER_PATTERN);
    if (!headerMatch) return;

    const continuationLines: string[] = [];
    for (let i = index + 1; i < lines.length; i += 1) {
      const nextLine = lines[i].trim();
      if (isDiagnosticBlockBoundary(nextLine)) {
        break;
      }
      if (nextLine === "(empty)") {
        break;
      }
      continuationLines.push(nextLine);
      if (continuationLines.length >= 12) {
        break;
      }
    }

    const value = normalizeDiagnosticValue(continuationLines.join(" "));
    if (value) {
      details.push(`${headerMatch[1]}: ${value}`);
    }
  });

  return unique(details);
}

function buildJimengDiagnosticText(text: string) {
  const submitId = getLastSubmitId(text);
  const genStatus = getLastGenStatus(text);
  const lines = [
    submitId ? `submit_id: ${submitId}` : "",
    genStatus ? `gen_status: ${genStatus}` : "",
    ...extractErrorDetails(text),
  ];

  return unique(lines.filter(Boolean)).join("\n");
}

function removeInternalJimengLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (
        /^(?:command|stdout|stderr|downloaded_files|public_urls|markdown_images|feishu_delivery|local_file)\s*:/i.test(
          trimmed,
        )
      ) {
        return false;
      }
      if (trimmed.startsWith("/home/ubuntu/")) return false;
      if (/^For Codex or other external clients/i.test(trimmed)) return false;
      if (/^The generated media has been downloaded locally/i.test(trimmed)) {
        return false;
      }
      if (/^To send it back to Feishu\/OpenClaw chat/i.test(trimmed)) {
        return false;
      }
      if (/^assistant final reply must include/i.test(trimmed)) return false;
      if (/^MEDIA lines on separate lines/i.test(trimmed)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

export function getJimengQuerySubmitId(
  result: unknown,
  options: { querySuccessfulResultWithoutMedia?: boolean } = {},
) {
  const sanitizedText = removeLocalMediaPaths(resultToText(result));
  if (!sanitizedText) {
    return undefined;
  }

  const status = getLastGenStatus(sanitizedText);
  if (isTerminalFailureStatus(status)) {
    return undefined;
  }

  if (
    hasDisplayableMedia(sanitizedText) &&
    (!status || status.toLowerCase() === "success")
  ) {
    return undefined;
  }

  if (
    status?.toLowerCase() === "success" &&
    !options.querySuccessfulResultWithoutMedia
  ) {
    return undefined;
  }

  return getLastSubmitId(sanitizedText);
}

export function combineMcpToolResults(...results: unknown[]) {
  return results
    .flatMap((result) => {
      const text = resultToText(result);
      return text ? [text] : [];
    })
    .join("\n\n");
}

export function hasJimengDisplayableMedia(result: unknown) {
  return hasDisplayableMedia(removeLocalMediaPaths(resultToText(result)));
}

export function getJimengGalleryDisplay(content: string) {
  const images = extractMarkdownImages(content);
  if (images.length === 0) {
    return { text: content, images: [] as string[] };
  }

  const isJimengDisplay =
    JIMENG_TASK_MARKERS.some((marker) => content.startsWith(marker)) ||
    JIMENG_PROGRESS_MARKERS.some((marker) => content.includes(marker)) ||
    Boolean(getLastSubmitId(content) || getLastGenStatus(content));
  if (!isJimengDisplay) {
    return { text: content, images: [] as string[] };
  }

  return {
    text: removeMarkdownImageLines(content),
    images: images.map((image) => image.url),
  };
}

export function formatJimengMcpRequestForChat(content: string) {
  const toolCall = getJimengToolCall(content);
  if (!toolCall) {
    return undefined;
  }

  const prompt = getStringArgument(toolCall.arguments, "prompt");
  const parameterLines = getJimengRequestParameterLines(toolCall.arguments);

  return [
    JimengDisplay.Task,
    `${JimengDisplay.GenerationType}${
      JIMENG_GENERATION_TOOL_LABELS[toolCall.toolName]
    }`,
    prompt ? `${JimengDisplay.OptimizedPrompt}\n${prompt}` : "",
    parameterLines.length > 0
      ? `${JimengDisplay.Parameters}\n${parameterLines.join("\n")}`
      : "",
    `${JimengDisplay.Progress}\n- ${JimengDisplay.Status}${JimengDisplay.Submitting}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function formatPendingMcpRequestForChat(content: string) {
  if (!content.includes("```json:mcp")) {
    return undefined;
  }

  if (!content.includes(`json:mcp:${JIMENG_MCP_SERVER_ID}`)) {
    return [
      JimengDisplay.ToolCall,
      `${JimengDisplay.Progress}\n- ${JimengDisplay.Status}${JimengDisplay.PreparingTool}`,
    ].join("\n\n");
  }

  return [
    JimengDisplay.Task,
    `${JimengDisplay.Progress}\n- ${JimengDisplay.Status}${JimengDisplay.PreparingSubmission}`,
  ].join("\n\n");
}

export function formatFailedMcpRequestForChat() {
  return [
    JimengDisplay.ToolCall,
    `${JimengDisplay.Progress}\n- ${JimengDisplay.Status}${JimengDisplay.ToolFailure}`,
  ].join("\n\n");
}

export function mergeJimengProgressWithResult(
  progressText: string,
  result: unknown,
  options: { includeMedia?: boolean } = {},
) {
  const formattedResult = formatMcpToolResultForChat(
    JIMENG_MCP_SERVER_ID,
    result,
  );
  const genStatus = getLastGenStatus(formattedResult);
  const errorDetails = extractErrorDetails(formattedResult);
  const mediaMarkdown = options.includeMedia
    ? getMarkdownMediaLines(formattedResult).join("\n")
    : "";
  const progressLines = [
    `- ${JimengDisplay.Status}${getJimengStatusLabel(genStatus)}`,
    ...errorDetails.map((detail) => `- ${detail}`),
  ];

  return [
    stripJimengProgressSection(progressText),
    `${JimengDisplay.Progress}\n${progressLines.filter(Boolean).join("\n")}`,
    mediaMarkdown,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function mergeJimengResultIntoReply(replyText: string, result: unknown) {
  const formattedResult = formatMcpToolResultForChat(
    JIMENG_MCP_SERVER_ID,
    result,
  );
  const missingMediaItems = getDisplayableMediaItems(formattedResult).filter(
    (item) => !replyText.includes(item.url),
  );

  if (missingMediaItems.length === 0) {
    return replyText;
  }

  const submitId = getLastSubmitId(formattedResult);
  const genStatus = getLastGenStatus(formattedResult);
  const hasDiagnostics =
    (!submitId || replyText.includes(submitId)) &&
    (!genStatus || replyText.toLowerCase().includes(genStatus.toLowerCase()));
  const resultTextWithoutMedia = removeMarkdownMediaLines(formattedResult);
  const appendedResult = [
    hasDiagnostics ? "" : resultTextWithoutMedia,
    missingMediaItems.map((item) => item.markdown).join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");

  return [replyText, appendedResult].filter(Boolean).join("\n\n");
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

  const displayableMedia = getDisplayableMediaItems(sanitizedText);
  const diagnosticText = buildJimengDiagnosticText(sanitizedText);

  if (hasNonSuccessStatus(sanitizedText)) {
    return diagnosticText || removeInternalJimengLines(sanitizedText);
  }

  if (displayableMedia.length > 0) {
    const mediaMarkdown = displayableMedia
      .map((item) => item.markdown)
      .join("\n");
    return [diagnosticText, mediaMarkdown].filter(Boolean).join("\n\n");
  }

  return diagnosticText || removeInternalJimengLines(sanitizedText);
}
