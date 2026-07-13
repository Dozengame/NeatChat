import {
  BUILTIN_MCP_CONFIG,
  mergeMcpConfig,
  resolveConfigHeaders,
} from "../app/mcp/config";
import {
  JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT,
  JIMENG_MCP_SERVER_CONFIG,
  normalizeJimengMcpRequest,
} from "../app/mcp/jimeng";
import { extractMcpJson } from "../app/mcp/utils";

describe("MCP config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("keeps bundled MCP servers when runtime config exists", () => {
    expect(
      mergeMcpConfig(
        {
          mcpServers: {
            "jimeng-mcp": {
              type: "streamable-http",
              url: "https://example.com/jimeng-mcp",
              status: "active",
            },
          },
        },
        {
          mcpServers: {
            filesystem: {
              type: "stdio",
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-filesystem"],
            },
          },
        },
      ).mcpServers,
    ).toHaveProperty("jimeng-mcp");
  });

  test("keeps Jimeng MCP out of default chat tool exposure", () => {
    expect(BUILTIN_MCP_CONFIG.mcpServers).toHaveProperty("jimeng-mcp");
    expect(JIMENG_MCP_SERVER_CONFIG.status).toBe("paused");
    expect(JIMENG_MCP_SERVER_CONFIG.chatDefaultEnabled).toBe(false);
  });

  test("guides async Jimeng result polling", () => {
    expect(JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT).toContain("gen_status");
    expect(JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT).toContain(
      "dreamina_query_result",
    );
    expect(JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT).toContain("poll 必须为 0");
  });

  test("completes only structurally truncated MCP JSON at the end of a closed fence", () => {
    const content = [
      "```json:mcp:jimeng-mcp",
      '{"method":"tools/call","params":{"name":"dreamina_text2image","arguments":{"prompt":"sunrise","poll":0}}',
      "```",
    ].join("\n");

    expect(extractMcpJson(content)).toEqual({
      clientId: "jimeng-mcp",
      mcp: {
        method: "tools/call",
        params: {
          name: "dreamina_text2image",
          arguments: { prompt: "sunrise", poll: 0 },
        },
      },
    });
  });

  test("keeps malformed MCP JSON strict when the error is not missing EOF delimiters", () => {
    const malformedPayloads = [
      '{"method":"tools/call" "params":{}}',
      '{"method":"tools/call","params":{"name":"tool",}}',
      '{"method":"tools/call","params":{"name":"tool","arguments":{"options":{}}',
      '{"method":"tools/call","params":{"name":"tool","arguments":{"prompt":"sunrise}',
    ];

    malformedPayloads.forEach((payload) => {
      const content = ["```json:mcp:jimeng-mcp", payload, "```"].join("\n");
      expect(() => extractMcpJson(content)).toThrow();
    });
  });

  test("does not apply Jimeng EOF completion to generic MCP clients", () => {
    const content = [
      "```json:mcp:demo",
      '{"method":"tools/call","params":{"name":"lookup"}',
      "```",
    ].join("\n");

    expect(() => extractMcpJson(content)).toThrow();
  });

  test("rejects multiple MCP requests in one assistant message", () => {
    const request = JSON.stringify({
      method: "tools/call",
      params: { name: "dreamina_text2image", arguments: { prompt: "sunrise" } },
    });
    const content = [
      "```json:mcp:jimeng-mcp",
      request,
      "```",
      "```json:mcp:jimeng-mcp",
      request,
      "```",
    ].join("\n");

    expect(() => extractMcpJson(content)).toThrow(
      "Multiple MCP tool requests are not supported",
    );
  });

  test("rejects a complete MCP request followed by a second incomplete request", () => {
    const request = JSON.stringify({
      method: "tools/call",
      params: { name: "dreamina_text2image", arguments: { prompt: "sunrise" } },
    });
    const content = [
      "```json:mcp:jimeng-mcp",
      request,
      "```",
      "```json:mcp:jimeng-mcp",
      '{"method":"tools/call"',
    ].join("\n");

    expect(() => extractMcpJson(content)).toThrow(
      "Multiple MCP tool requests are not supported",
    );
  });

  test("forces Jimeng generation submits to stay non-blocking", () => {
    expect(
      normalizeJimengMcpRequest({
        method: "tools/call",
        params: {
          name: "dreamina_text2image",
          arguments: {
            prompt: "cat",
            poll: 60,
          },
        },
      }),
    ).toEqual({
      method: "tools/call",
      params: {
        name: "dreamina_text2image",
        arguments: {
          prompt: "cat",
          poll: 0,
        },
      },
    });
  });

  test("resolves MCP headers from environment variables", () => {
    process.env.JIMENG_MCP_TOKEN = "test-token";

    expect(
      resolveConfigHeaders(
        { Authorization: "Bearer ${JIMENG_MCP_TOKEN}" },
        "jimeng-mcp",
      ),
    ).toEqual({ Authorization: "Bearer test-token" });
  });

  test("throws when a required MCP token env var is missing", () => {
    delete process.env.JIMENG_MCP_TOKEN;

    expect(() =>
      resolveConfigHeaders(
        { Authorization: "Bearer ${JIMENG_MCP_TOKEN}" },
        "jimeng-mcp",
      ),
    ).toThrow("JIMENG_MCP_TOKEN");
  });
});
