import fs from "node:fs";
import path from "node:path";

describe("development-only chat QA fixture", () => {
  test("keeps stress payloads out of the production chat entry", () => {
    const chatSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat.tsx"),
      "utf8",
    );
    const fixtureSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat-qa-fixture.ts"),
      "utf8",
    );

    expect(chatSource).toContain('import("./chat-qa-fixture")');
    expect(chatSource).toMatch(/process\.env\.NODE_ENV\s*!==\s*"production"/);
    expect(chatSource).not.toContain("MARKDOWN_STRESS_QA_CONTENT");
    expect(chatSource).not.toContain("Markdown 压测示例文档");
    expect(chatSource).not.toContain("codex-qa-markdown-stress");

    expect(fixtureSource).toContain("MARKDOWN_STRESS_QA_CONTENT");
    expect(fixtureSource).toContain("Markdown 压测示例文档");
    expect(fixtureSource).toContain("[代码块](#代码块)");
    expect(fixtureSource).toContain("codex-qa-markdown-stress");
    expect(fixtureSource).toContain('"history_count"');
    expect(fixtureSource).toContain('"history_density"');
    expect(fixtureSource).toContain('"interactive_input"');
    expect(fixtureSource).toContain(
      "isMarkdownStressQaInteractiveInputEnabled",
    );
    expect(fixtureSource).toMatch(/Math\.min\(\s*240,/);
    expect(fixtureSource).toContain("data:image/png;base64,");
    expect(fixtureSource).not.toContain("data:image/svg+xml");
    expect(fixtureSource).toContain('IMAGE_GALLERY_QA_PARAM = "image-gallery"');
    expect(fixtureSource).toContain("getImageGalleryQaMessages");
    expect(fixtureSource).toContain('model: "gpt-image-2"');
    expect(fixtureSource).toContain('JIMENG_PARSER_QA_PARAM = "jimeng-parser"');
    expect(fixtureSource).toContain("getJimengParserQaMessages");
    expect(fixtureSource).toContain('"model_version":"4.6","poll":0}}');
  });

  test("creates compact rows for tall-viewport underfill QA", async () => {
    const fixture = await import("../app/components/chat-qa-fixture");
    const messages = fixture.getMarkdownStressQaMessages(
      "?codex_qa=markdown-stress&history_count=60&history_density=compact",
    );

    expect(messages).toHaveLength(60);
    expect(messages[0].content).toBe("短消息 1");
    expect(messages[1].content).toBe("简短回复 2");
  });
});
