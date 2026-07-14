import Locale from "../locales";

function resultToLegacyMcpResponse(result: unknown) {
  return JSON.stringify(result) ?? "null";
}

export function formatPendingMcpRequestForChat(content: string) {
  if (!content.includes("```json:mcp")) return undefined;
  return [
    Locale.Mcp.Chat.ToolCall,
    `${Locale.Mcp.Chat.Progress}\n- ${Locale.Mcp.Chat.PreparingTool}`,
  ].join("\n\n");
}

export function formatFailedMcpRequestForChat() {
  return [
    Locale.Mcp.Chat.ToolCall,
    `${Locale.Mcp.Chat.Progress}\n- ${Locale.Mcp.Chat.ToolFailure}`,
  ].join("\n\n");
}

export function formatMcpToolResultForChat(clientId: string, result: unknown) {
  return `\`\`\`json:mcp-response:${clientId}\n${resultToLegacyMcpResponse(
    result,
  )}\n\`\`\``;
}
