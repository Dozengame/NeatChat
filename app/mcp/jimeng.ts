import type { ServerConfig } from "./types";
import type { McpRequestMessage } from "./types";

export const JIMENG_MCP_SERVER_ID = "jimeng-mcp";

const JIMENG_GENERATION_TOOL_NAMES = new Set([
  "dreamina_text2image",
  "dreamina_image2image",
  "dreamina_text2video",
  "dreamina_image2video",
]);

export const JIMENG_MCP_SERVER_CONFIG: ServerConfig = {
  type: "streamable-http",
  url: "https://123.207.69.230/jimeng-mcp",
  headers: {
    Authorization: "Bearer ${JIMENG_MCP_TOKEN}",
  },
  status: "paused",
  chatDefaultEnabled: false,
};

export const JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT = `
图片生成模式已开启。用户默认希望得到图片或视频生成结果，而不是普通文字回答。

处理规则：
- 只使用 jimeng-mcp 的工具完成图片或视频生成。
- 调用工具前，先把用户需求整理成清晰、具体、适合生成模型理解的 prompt，保留主体、动作、风格、构图、光线、比例、材质、文字要求和限制条件。
- 提交生成任务时不要等待长轮询；生成工具的 poll 必须为 0，拿到 submit_id 后再用 dreamina_query_result 查询。
- 没有参考图时，优先根据用户意图选择 text2image 或 text2video。
- 用户附带图片时，优先判断是否需要 image2image 或 image2video；如果用户只是要求基于图片生成、改图、换风格、扩展、参考角色或参考画面，就使用带图片输入的工具。
- 用户询问余额、任务状态、历史任务或结果查询时，使用对应查询工具。
- 工具返回 submit_id 且 gen_status 为 querying、pending、running、processing 等未完成状态时，继续调用 dreamina_query_result 或工具列表中对应的查询结果工具，直到拿到 success、失败状态或明确错误原因。
- 信息足够时直接发起一次 MCP 请求；只有关键生成信息缺失且无法合理补全时，才用一句话追问。
`.trim();

export function normalizeJimengMcpRequest(
  request: McpRequestMessage,
): McpRequestMessage {
  const toolName = request.params?.name;
  if (
    request.method !== "tools/call" ||
    typeof toolName !== "string" ||
    !JIMENG_GENERATION_TOOL_NAMES.has(toolName)
  ) {
    return request;
  }

  const args = request.params?.arguments;
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return {
      ...request,
      params: {
        ...request.params,
        arguments: { poll: 0 },
      },
    };
  }

  return {
    ...request,
    params: {
      ...request.params,
      arguments: {
        ...args,
        poll: 0,
      },
    },
  };
}
