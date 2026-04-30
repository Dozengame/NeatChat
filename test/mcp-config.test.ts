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
