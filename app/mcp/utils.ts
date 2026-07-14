const MCP_JSON_PATTERN = /```json:mcp:([^{\s]+)([\s\S]*?)```/;
const MCP_JSON_GLOBAL_PATTERN = /```json:mcp:([^{\s]+)([\s\S]*?)```/g;
const MCP_JSON_START_PATTERN = /```json:mcp(?=[:\s`]|$)(?::[^\s`]*)?/;
const MCP_JSON_START_GLOBAL_PATTERN = /```json:mcp(?=[:\s`]|$)(?::[^\s`]*)?/g;
const MAX_MCP_JSON_LENGTH = 128 * 1024;
const MAX_MCP_JSON_DEPTH = 64;

export function isMcpJson(content: string) {
  return content.match(MCP_JSON_PATTERN);
}

export function hasMcpJsonStart(content: string) {
  return MCP_JSON_START_PATTERN.test(content);
}

function completeTruncatedJson(payload: string) {
  const value = payload.trim();
  if (
    !value.startsWith("{") ||
    !value.endsWith("}") ||
    value.length > MAX_MCP_JSON_LENGTH
  ) {
    return undefined;
  }
  const closingStack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const char of value) {
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
        continue;
      }
      if (char.charCodeAt(0) < 0x20) {
        return undefined;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      closingStack.push("}");
    } else if (char === "[") {
      closingStack.push("]");
    } else if (char === "}" || char === "]") {
      if (closingStack.pop() !== char) {
        return undefined;
      }
    }
    if (closingStack.length > MAX_MCP_JSON_DEPTH) {
      return undefined;
    }
  }

  if (
    inString ||
    escaped ||
    closingStack.length !== 1 ||
    closingStack[0] !== "}"
  ) {
    return undefined;
  }

  return value + "}";
}

function parseMcpJsonPayload(payload: string, allowEofCompletion: boolean) {
  try {
    return JSON.parse(payload);
  } catch (strictError) {
    if (!allowEofCompletion) {
      throw strictError;
    }
    const completedPayload = completeTruncatedJson(payload);
    if (!completedPayload) {
      throw strictError;
    }
    return JSON.parse(completedPayload);
  }
}

export function extractMcpJson(content: string) {
  const matches = Array.from(content.matchAll(MCP_JSON_GLOBAL_PATTERN));
  const startCount = Array.from(
    content.matchAll(MCP_JSON_START_GLOBAL_PATTERN),
  ).length;
  if (startCount > 1 || matches.length > 1) {
    throw new Error("Multiple MCP tool requests are not supported");
  }
  const match = matches[0];
  if (match?.length === 3) {
    return {
      clientId: match[1],
      mcp: parseMcpJsonPayload(match[2], false),
    };
  }
  return null;
}

export function tryExtractMcpJson(content: string) {
  try {
    return extractMcpJson(content);
  } catch {
    return null;
  }
}
