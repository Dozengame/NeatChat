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
    expect(fixtureSource).toContain("codex-qa-markdown-stress");
    expect(fixtureSource).toContain('"history_count"');
    expect(fixtureSource).toMatch(/Math\.min\(\s*240,/);
    expect(fixtureSource).toContain("data:image/png;base64,");
    expect(fixtureSource).not.toContain("data:image/svg+xml");
  });
});
