import {
  combineMcpToolResults,
  formatJimengMcpRequestForChat,
  formatMcpToolResultForChat,
  getJimengQuerySubmitId,
  hasJimengDisplayableImage,
  mergeJimengProgressWithResult,
  mergeJimengResultIntoReply,
} from "../app/mcp/display";
import { JIMENG_MCP_SERVER_ID } from "../app/mcp/jimeng";

const imageUrl = "https://123.207.69.230/jimeng-media/submit-1/image-1.png";
const jimengText2ImageRequest = [
  "```json:mcp:jimeng-mcp",
  JSON.stringify({
    method: "tools/call",
    params: {
      name: "dreamina_text2image",
      arguments: {
        prompt: "A cinematic scene of a cat and dog play-fighting in a yard",
        ratio: "1:1",
        resolution_type: "2k",
        model_version: "5.0",
      },
    },
  }),
  "```",
].join("\n");

describe("formatMcpToolResultForChat", () => {
  test("turns jimeng MCP request code into a visible generation progress message", () => {
    const formatted = formatJimengMcpRequestForChat(jimengText2ImageRequest);

    expect(formatted).toContain("图片生成任务");
    expect(formatted).toContain("生成类型：文生图");
    expect(formatted).toContain("优化后的 Prompt：");
    expect(formatted).toContain(
      "A cinematic scene of a cat and dog play-fighting in a yard",
    );
    expect(formatted).toContain("当前进度：");
    expect(formatted).toContain("正在提交到 jimeng-mcp");
    expect(formatted).not.toContain("```json:mcp");
    expect(formatted).not.toContain('"method"');
  });

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
    expect(formatted).not.toContain("markdown_images:");
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

    expect(formatted).toContain("submit_id: submit-1");
    expect(formatted).toContain("gen_status: success");
    expect(formatted).not.toContain("public_urls:");
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
    expect(formatted).not.toContain("local_file:");
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
    expect(formatted).not.toContain(imageUrl);
  });

  test("keeps failure details without rendering images", () => {
    const formatted = formatMcpToolResultForChat(
      JIMENG_MCP_SERVER_ID,
      [
        "submit_id: submit-1",
        "gen_status: failed",
        "error_message: prompt rejected",
        "public_urls:",
        imageUrl,
      ].join("\n"),
    );

    expect(formatted).toContain("submit_id: submit-1");
    expect(formatted).toContain("gen_status: failed");
    expect(formatted).toContain("error_message: prompt rejected");
    expect(formatted).not.toContain("![generated image");
    expect(formatted).not.toContain(imageUrl);
  });

  test("keeps multiline stderr failure details", () => {
    const formatted = formatMcpToolResultForChat(
      JIMENG_MCP_SERVER_ID,
      [
        "submit_id: submit-1",
        "gen_status: failed",
        "stderr:",
        "prompt rejected by policy",
        "public_urls:",
        imageUrl,
      ].join("\n"),
    );

    expect(formatted).toContain("submit_id: submit-1");
    expect(formatted).toContain("gen_status: failed");
    expect(formatted).toContain("stderr: prompt rejected by policy");
    expect(formatted).not.toContain("![generated image");
    expect(formatted).not.toContain(imageUrl);
  });

  test("requests a follow-up query when generation succeeds without public image urls", () => {
    expect(
      getJimengQuerySubmitId(
        [
          "command: dreamina text2image --poll=60",
          "stdout:",
          "{",
          '"submit_id": "submit-1",',
          '"gen_status": "success",',
          '"result_json": {"images": [{"image_url": "[redacted-url]"}]}',
          "}",
        ].join("\n"),
      ),
    ).toBe("submit-1");
  });

  test("does not query again when public image urls are already present", () => {
    expect(
      getJimengQuerySubmitId(
        [
          "submit_id: submit-1",
          "gen_status: success",
          "public_urls:",
          imageUrl,
        ].join("\n"),
      ),
    ).toBeUndefined();
  });

  test("does not query terminal failures", () => {
    expect(
      getJimengQuerySubmitId(
        [
          "submit_id: submit-1",
          "gen_status: failed",
          "error_message: prompt rejected",
        ].join("\n"),
      ),
    ).toBeUndefined();
  });

  test("renders public image urls from a combined generation and query result", () => {
    const combined = combineMcpToolResults(
      [
        "submit_id: submit-1",
        "gen_status: success",
        'result_json: {"images": [{"image_url": "[redacted-url]"}]}',
      ].join("\n"),
      ["public_urls:", imageUrl].join("\n"),
    );

    const formatted = formatMcpToolResultForChat(
      JIMENG_MCP_SERVER_ID,
      combined,
    );

    expect(formatted).toContain("submit_id: submit-1");
    expect(formatted).toContain("gen_status: success");
    expect(formatted).not.toContain("[redacted-url]");
    expect(formatted).toContain(`![generated image 1](${imageUrl})`);
  });

  test("renders public image urls when an async first result is followed by success", () => {
    const combined = combineMcpToolResults(
      ["submit_id: submit-1", "gen_status: querying"].join("\n"),
      [
        "submit_id: submit-1",
        "gen_status: success",
        "public_urls:",
        imageUrl,
      ].join("\n"),
    );

    const formatted = formatMcpToolResultForChat(
      JIMENG_MCP_SERVER_ID,
      combined,
    );

    expect(formatted).toContain("gen_status: success");
    expect(formatted).not.toContain("gen_status: querying");
    expect(formatted).toContain(`![generated image 1](${imageUrl})`);
  });

  test("omits raw jimeng transport details from display text", () => {
    const formatted = formatMcpToolResultForChat(
      JIMENG_MCP_SERVER_ID,
      combineMcpToolResults(
        [
          "command: dreamina text2image --poll=60",
          "stdout:",
          "{",
          '"submit_id": "72f8908b-5c02-4df0-b948-06faa48df015",',
          '"gen_status": "success",',
          '"result_json": {"images": [{"image_url": "[redacted-url]"}]}',
          "}",
        ].join("\n"),
        [
          "downloaded_files:",
          "/home/ubuntu/jimeng/downloads/72f8908b-5c02-4df0-b948-06faa48df015/image_1.png",
          "public_urls:",
          imageUrl,
          "markdown_images:",
          `![generated image 1](${imageUrl})`,
          "feishu_delivery:",
          "The generated media has been downloaded locally.",
          "To send it back to Feishu/OpenClaw chat, the assistant final reply must include these exact MEDIA lines.",
        ].join("\n"),
      ),
    );

    expect(formatted).toContain(
      "submit_id: 72f8908b-5c02-4df0-b948-06faa48df015",
    );
    expect(formatted).toContain("gen_status: success");
    expect(formatted).toContain(`![generated image 1](${imageUrl})`);
    expect(formatted).not.toContain("command:");
    expect(formatted).not.toContain("stdout:");
    expect(formatted).not.toContain("downloaded_files:");
    expect(formatted).not.toContain("/home/ubuntu");
    expect(formatted).not.toContain("public_urls:");
    expect(formatted).not.toContain("markdown_images:");
    expect(formatted).not.toContain("feishu_delivery:");
    expect(formatted).not.toContain("[redacted-url]");
    expect(formatted.match(/!\[generated image 1\]/g)).toHaveLength(1);
  });

  test("merges hidden jimeng images into a visible assistant reply", () => {
    const rawResult = [
      "downloaded_files:",
      "/home/ubuntu/jimeng/downloads/submit-1/image_1.png",
      "public_urls:",
      imageUrl,
      "feishu_delivery:",
      "The generated media has been downloaded locally.",
    ].join("\n");

    expect(hasJimengDisplayableImage(rawResult)).toBe(true);
    expect(
      mergeJimengResultIntoReply(
        "猫咪图片已生成成功：\n\n- 状态：success\n- 任务 ID：submit-1",
        rawResult,
      ),
    ).toBe(
      [
        "猫咪图片已生成成功：\n\n- 状态：success\n- 任务 ID：submit-1",
        `![generated image 1](${imageUrl})`,
      ].join("\n\n"),
    );
  });

  test("updates visible generation progress from jimeng result without raw transport text", () => {
    const progress = formatJimengMcpRequestForChat(jimengText2ImageRequest);
    expect(progress).toBeTruthy();

    const updatedProgress = mergeJimengProgressWithResult(
      progress!,
      [
        "command: dreamina text2image --poll=60",
        "stdout:",
        "submit_id: submit-1",
        "gen_status: querying",
      ].join("\n"),
      { includeImages: false },
    );

    expect(updatedProgress).toContain("优化后的 Prompt：");
    expect(updatedProgress).toContain("当前进度：");
    expect(updatedProgress).toContain("状态：生成中");
    expect(updatedProgress).toContain("原始状态：querying");
    expect(updatedProgress).toContain("任务 ID：submit-1");
    expect(updatedProgress).not.toContain("command:");
    expect(updatedProgress).not.toContain("stdout:");
  });

  test("shows generated images in progress only when no final reply consumed them", () => {
    const progress = formatJimengMcpRequestForChat(jimengText2ImageRequest);
    expect(progress).toBeTruthy();

    const updatedProgress = mergeJimengProgressWithResult(
      progress!,
      [
        "submit_id: submit-1",
        "gen_status: success",
        "public_urls:",
        imageUrl,
      ].join("\n"),
      { includeImages: true },
    );

    expect(updatedProgress).toContain("状态：生成成功");
    expect(updatedProgress).toContain(`![generated image 1](${imageUrl})`);
    expect(updatedProgress).not.toContain("public_urls:");
  });

  test("keeps jimeng diagnostics when the visible reply omitted them", () => {
    const rawResult = [
      "submit_id: submit-1",
      "gen_status: success",
      "public_urls:",
      imageUrl,
    ].join("\n");

    expect(mergeJimengResultIntoReply("已生成：", rawResult)).toBe(
      [
        "已生成：",
        "submit_id: submit-1\ngen_status: success",
        `![generated image 1](${imageUrl})`,
      ].join("\n\n"),
    );
  });

  test("does not duplicate jimeng images already present in the visible reply", () => {
    const visibleReply = ["已生成：", `![generated image 1](${imageUrl})`].join(
      "\n\n",
    );

    expect(
      mergeJimengResultIntoReply(
        visibleReply,
        [
          "submit_id: submit-1",
          "gen_status: success",
          "public_urls:",
          imageUrl,
        ].join("\n"),
      ),
    ).toBe(visibleReply);
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
