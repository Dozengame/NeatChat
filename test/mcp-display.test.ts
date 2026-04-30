import { formatMcpToolResultForChat } from "../app/mcp/display";
import { JIMENG_MCP_SERVER_ID } from "../app/mcp/jimeng";

const imageUrl =
  "https://123.207.69.230/jimeng-media/submit-1/image-1.png";

describe("formatMcpToolResultForChat", () => {
  test("renders markdown_images as markdown image lines", () => {
    const formatted = formatMcpToolResultForChat(JIMENG_MCP_SERVER_ID, {
      content: [
        {
          type: "text",
          text: [
            "submit_id: submit-1",
            "gen_status: success",
            "MEDIA:/home/ubuntu/jimeng/downloads/image-1.png",
            "markdown_images:",
            `![generated image 1](${imageUrl})`,
          ].join("\n"),
        },
      ],
    });

    expect(formatted).toContain("submit_id: submit-1");
    expect(formatted).toContain("gen_status: success");
    expect(formatted).toContain(`![generated image 1](${imageUrl})`);
    expect(formatted).not.toContain("MEDIA:/home/ubuntu");
    expect(formatted.match(/!\[generated image 1\]/g)).toHaveLength(1);
  });

  test("falls back to public_urls when markdown_images is missing", () => {
    const formatted = formatMcpToolResultForChat(
      JIMENG_MCP_SERVER_ID,
      [
        "submit_id: submit-1",
        "gen_status: success",
        "public_urls:",
        imageUrl,
      ].join("\n"),
    );

    expect(formatted).toContain("public_urls:");
    expect(formatted).toContain(imageUrl);
    expect(formatted).toContain(`![generated image 1](${imageUrl})`);
  });

  test("removes embedded local MEDIA paths", () => {
    const formatted = formatMcpToolResultForChat(
      JIMENG_MCP_SERVER_ID,
      [
        "submit_id: submit-1",
        "gen_status: success",
        "local_file: MEDIA:/home/ubuntu/jimeng/downloads/image-1.png",
        "public_urls:",
        imageUrl,
      ].join("\n"),
    );

    expect(formatted).not.toContain("MEDIA:/home/ubuntu");
    expect(formatted).toContain(`![generated image 1](${imageUrl})`);
  });

  test("does not render images for unfinished tasks", () => {
    const formatted = formatMcpToolResultForChat(
      JIMENG_MCP_SERVER_ID,
      [
        "submit_id: submit-1",
        "gen_status: querying",
        "public_urls:",
        imageUrl,
      ].join("\n"),
    );

    expect(formatted).toContain("gen_status: querying");
    expect(formatted).not.toContain("![generated image");
  });

  test("keeps normal MCP responses in the existing response block format", () => {
    const formatted = formatMcpToolResultForChat("filesystem", {
      content: [{ type: "text", text: "ok" }],
    });

    expect(formatted).toContain("```json:mcp-response:filesystem");
  });

  test("keeps plain non-jimeng MCP text unquoted", () => {
    const formatted = formatMcpToolResultForChat("filesystem", "ok");

    expect(formatted).toContain("\nok\n");
    expect(formatted).not.toContain('"ok"');
  });
});
