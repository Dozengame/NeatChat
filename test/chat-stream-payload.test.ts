import { buildChatRequestPayload } from "../app/utils/chat";

describe("buildChatRequestPayload", () => {
  test("preserves Responses hosted tools when plugin tools are empty", () => {
    const payload = buildChatRequestPayload(
      {
        model: "gpt-5.5",
        input: "今天有什么大新闻",
        tools: [{ type: "web_search" }],
        tool_choice: "required",
      },
      [],
    );

    expect(payload.tools).toEqual([{ type: "web_search" }]);
    expect(payload.tool_choice).toBe("required");
  });

  test("uses plugin tools when provided", () => {
    const pluginTools = [
      {
        type: "function",
        function: { name: "googleSearch" },
      },
    ];
    const payload = buildChatRequestPayload(
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Search" }],
      },
      pluginTools,
    );

    expect(payload.tools).toBe(pluginTools);
  });
});
