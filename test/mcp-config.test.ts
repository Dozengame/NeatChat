import {
  BUILTIN_MCP_CONFIG,
  mergeMcpConfig,
  resolveConfigHeaders,
} from "../app/mcp/config";
import { extractMcpJson } from "../app/mcp/utils";

describe("MCP config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("has no built-in executable MCP server", () => {
    expect(BUILTIN_MCP_CONFIG).toEqual({ mcpServers: {} });
  });

  test("merges configured servers without dropping either source", () => {
    const merged = mergeMcpConfig(
      { mcpServers: { first: { type: "stdio", command: "first" } } },
      { mcpServers: { second: { type: "stdio", command: "second" } } },
    );
    expect(Object.keys(merged.mcpServers)).toEqual(["first", "second"]);
  });

  test("keeps malformed and truncated generic MCP JSON strict", () => {
    const payloads = [
      '{"method":"tools/call" "params":{}}',
      '{"method":"tools/call","params":{"name":"tool",}}',
      '{"method":"tools/call","params":{"name":"tool"}',
    ];
    payloads.forEach((payload) => {
      expect(() =>
        extractMcpJson(["```json:mcp:demo", payload, "```"].join("\n")),
      ).toThrow();
    });
  });

  test("rejects multiple MCP requests in one assistant message", () => {
    const request = JSON.stringify({
      method: "tools/call",
      params: { name: "lookup", arguments: { query: "sunrise" } },
    });
    const content = [
      "```json:mcp:demo",
      request,
      "```",
      "```json:mcp:demo",
      request,
      "```",
    ].join("\n");
    expect(() => extractMcpJson(content)).toThrow(
      "Multiple MCP tool requests are not supported",
    );
  });

  test("resolves MCP headers from environment variables", () => {
    process.env.DEMO_MCP_TOKEN = "test-token";
    expect(
      resolveConfigHeaders(
        { Authorization: "Bearer ${DEMO_MCP_TOKEN}" },
        "demo",
      ),
    ).toEqual({ Authorization: "Bearer test-token" });
  });

  test("throws when a required MCP environment variable is missing", () => {
    delete process.env.DEMO_MCP_TOKEN;
    expect(() =>
      resolveConfigHeaders(
        { Authorization: "Bearer ${DEMO_MCP_TOKEN}" },
        "demo",
      ),
    ).toThrow("DEMO_MCP_TOKEN");
  });
});
