import { JIMENG_MCP_SERVER_ID } from "./jimeng";
import { extractMcpJson } from "./utils";

const IMAGE_URL_PATTERN =
  /https:\/\/[^\s)"'>]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s)"'>]*)?/gi;
const IMAGE_URL_LINE_PATTERN =
  /^https:\/\/[^\s)"'>]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s)"'>]*)?$/i;
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]\n]*\]\((https:\/\/[^\s)]+)\)/gi;
const MARKDOWN_IMAGE_LINE_PATTERN = /^!\[[^\]\n]*\]\((https:\/\/[^\s)]+)\)$/i;
const MEDIA_LOCAL_PATH_PATTERN = /MEDIA:\/\S+/gi;
const GEN_STATUS_PATTERN = /"?gen_status"?\s*[:=]\s*"?([a-zA-Z0-9_-]+)"?/gi;
const SUBMIT_ID_PATTERN = /"?submit_id"?\s*[:=]\s*"?([^",\s]+)"?/gi;
const ERROR_DETAIL_PATTERN =
  /^"?((?:error(?:_code|_message|_reason)?|fail(?:ure)?_reason|message|detail|stderr))"?\s*[:=]\s*(.+?)\s*,?$/i;
const ERROR_DETAIL_HEADER_PATTERN =
  /^"?((?:error(?:_code|_message|_reason)?|fail(?:ure)?_reason|message|detail|stderr))"?\s*[:=]\s*$/i;
const DIAGNOSTIC_BLOCK_BOUNDARY_PATTERN =
  /^"?(?:command|stdout|downloaded_files|public_urls|markdown_images|feishu_delivery|local_file|submit_id|gen_status|result_json)"?\s*[:=]/i;
const JIMENG_PROGRESS_MARKER = "\n\n当前进度：";
const JIMENG_GENERATION_TOOL_LABELS: Record<string, string> = {
  dreamina_text2image: "文生图",
  dreamina_image2image: "图生图",
  dreamina_text2video: "文生视频",
  dreamina_image2video: "图生视频",
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

function hasDisplayableImage(text: string) {
  return (
    extractMarkdownImages(text).length > 0 ||
    extractPublicImageUrls(text).length > 0
  );
}

function getMarkdownImageLines(text: string) {
  return extractMarkdownImages(text).map(
    (item) => item.markdown || item.fallback,
  );
}

function removeMarkdownImageLines(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => !line.trim().match(MARKDOWN_IMAGE_LINE_PATTERN))
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
    console.warn("[MCP] Failed to parse Jimeng request", error);
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
    ["画幅", getStringArgument(args, "ratio")],
    [
      "清晰度",
      getStringArgument(args, "resolution_type") ??
        getStringArgument(args, "video_resolution"),
    ],
    ["模型版本", getStringArgument(args, "model_version")],
    ["时长", getStringArgument(args, "duration")],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}：${value}`);
}

function getJimengStatusLabel(status?: string) {
  const normalized = status?.toLowerCase();
  if (!normalized) return "已提交，等待返回状态";
  if (normalized === "success") return "生成成功";
  if (["querying", "running", "processing", "pending"].includes(normalized)) {
    return "生成中";
  }
  if (["failed", "failure", "error"].includes(normalized)) return "生成失败";
  if (["cancelled", "canceled"].includes(normalized)) return "已取消";
  if (normalized === "timeout") return "查询超时";
  return status ?? "未知";
}

function stripJimengProgressSection(text: string) {
  const progressIndex = text.indexOf(JIMENG_PROGRESS_MARKER);
  if (progressIndex < 0) {
    return text.trim();
  }

  return text.slice(0, progressIndex).trim();
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

export function getJimengQuerySubmitId(result: unknown) {
  const sanitizedText = removeLocalMediaPaths(resultToText(result));
  if (!sanitizedText || hasDisplayableImage(sanitizedText)) {
    return undefined;
  }

  const status = getLastGenStatus(sanitizedText);
  if (isTerminalFailureStatus(status)) {
    return undefined;
  }

  return getLastSubmitId(sanitizedText);
}

export function combineMcpToolResults(...results: unknown[]) {
  return results.map(resultToText).filter(Boolean).join("\n\n");
}

export function hasJimengDisplayableImage(result: unknown) {
  return hasDisplayableImage(removeLocalMediaPaths(resultToText(result)));
}

export function formatJimengMcpRequestForChat(content: string) {
  const toolCall = getJimengToolCall(content);
  if (!toolCall) {
    return undefined;
  }

  const prompt = getStringArgument(toolCall.arguments, "prompt");
  const parameterLines = getJimengRequestParameterLines(toolCall.arguments);

  return [
    "图片生成任务",
    `生成类型：${JIMENG_GENERATION_TOOL_LABELS[toolCall.toolName]}`,
    prompt ? `优化后的 Prompt：\n${prompt}` : "",
    parameterLines.length > 0 ? `参数：\n${parameterLines.join("\n")}` : "",
    "当前进度：\n- 状态：正在提交到 jimeng-mcp",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function formatPendingMcpRequestForChat(content: string) {
  if (!content.includes("```json:mcp")) {
    return undefined;
  }

  if (!content.includes(`json:mcp:${JIMENG_MCP_SERVER_ID}`)) {
    return ["工具调用", "当前进度：\n- 状态：正在准备执行工具"].join("\n\n");
  }

  return ["图片生成任务", "当前进度：\n- 状态：正在准备提交到 jimeng-mcp"].join(
    "\n\n",
  );
}

export function mergeJimengProgressWithResult(
  progressText: string,
  result: unknown,
  options: { includeImages?: boolean } = {},
) {
  const formattedResult = formatMcpToolResultForChat(
    JIMENG_MCP_SERVER_ID,
    result,
  );
  const genStatus = getLastGenStatus(formattedResult);
  const errorDetails = extractErrorDetails(formattedResult);
  const imageMarkdown = options.includeImages
    ? getMarkdownImageLines(formattedResult).join("\n")
    : "";
  const progressLines = [
    `- 状态：${getJimengStatusLabel(genStatus)}`,
    ...errorDetails.map((detail) => `- ${detail}`),
  ];

  return [
    stripJimengProgressSection(progressText),
    `当前进度：\n${progressLines.filter(Boolean).join("\n")}`,
    imageMarkdown,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function mergeJimengResultIntoReply(replyText: string, result: unknown) {
  const formattedResult = formatMcpToolResultForChat(
    JIMENG_MCP_SERVER_ID,
    result,
  );
  const missingImageLines = getMarkdownImageLines(formattedResult).filter(
    (line) => {
      const url = line.match(MARKDOWN_IMAGE_LINE_PATTERN)?.[1];
      return !!url && !replyText.includes(url);
    },
  );

  if (missingImageLines.length === 0) {
    return replyText;
  }

  const submitId = getLastSubmitId(formattedResult);
  const genStatus = getLastGenStatus(formattedResult);
  const hasDiagnostics =
    (!submitId || replyText.includes(submitId)) &&
    (!genStatus || replyText.toLowerCase().includes(genStatus.toLowerCase()));
  const resultTextWithoutImages = removeMarkdownImageLines(formattedResult);
  const appendedResult = [
    hasDiagnostics ? "" : resultTextWithoutImages,
    missingImageLines.join("\n"),
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

  const markdownImages = extractMarkdownImages(sanitizedText);
  const publicImageUrls = extractPublicImageUrls(sanitizedText);
  const diagnosticText = buildJimengDiagnosticText(sanitizedText);

  if (hasNonSuccessStatus(sanitizedText)) {
    return diagnosticText || removeInternalJimengLines(sanitizedText);
  }

  if (markdownImages.length > 0) {
    const imageMarkdown = markdownImages
      .map((item) => item.markdown || item.fallback)
      .join("\n");
    return [diagnosticText, imageMarkdown].filter(Boolean).join("\n\n");
  }

  if (publicImageUrls.length > 0) {
    const imageMarkdown = publicImageUrls
      .map((url, index) => `![generated image ${index + 1}](${url})`)
      .join("\n");
    return [diagnosticText, imageMarkdown].filter(Boolean).join("\n\n");
  }

  return diagnosticText || removeInternalJimengLines(sanitizedText);
}
