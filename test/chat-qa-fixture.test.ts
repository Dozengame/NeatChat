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
    expect(chatSource).toContain("composerQaScenario?.theme");
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
    expect(fixtureSource).toContain("getComposerQaSeed");
    expect(fixtureSource).toContain("createComposerQaAttachments");
    expect(chatSource).toContain(
      "setShowMobileModelSelector(modelMenuOpen && capabilityReady)",
    );
    expect(chatSource).toContain("const currentCapabilityReady =");
    expect(chatSource).toContain(
      ") === composerQaSeed.modelCapability",
    );
    expect(chatSource).toContain("!capabilityReady");
    expect(chatSource).toContain("setChatActionMenuView(");
    expect(chatSource).toContain("displayedComposerSubmitState");
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

  test("parses stable composer state, posture, and theme scenarios", async () => {
    const fixture = await import("../app/components/chat-qa-fixture");

    expect(
      fixture.getComposerQaScenario(
        "?codex_qa=composer&composer_state=reasoning&composer_posture=book&composer_theme=dark",
      ),
    ).toEqual({ state: "reasoning", posture: "book", theme: "dark" });
    expect(
      fixture.getComposerQaScenario(
        "?codex_qa=composer&composer_state=unknown&composer_posture=watch&composer_theme=sepia",
      ),
    ).toEqual({ state: "idle", posture: undefined, theme: undefined });
    expect(
      fixture.getComposerQaScenario("?codex_qa=markdown-stress"),
    ).toBeUndefined();
  });

  test("maps composer QA states onto the production controls and content", async () => {
    const fixture = await import("../app/components/chat-qa-fixture");

    expect(fixture.getComposerQaSeed("prompt-library").menu).toBe(
      "prompt-library",
    );
    expect(fixture.getComposerQaSeed("reasoning").menu).toBe("reasoning");
    expect(fixture.getComposerQaSeed("reasoning").modelCapability).toBe(
      "reasoning",
    );
    expect(fixture.getComposerQaSeed("image-options").menu).toBe(
      "image-options",
    );
    expect(fixture.getComposerQaSeed("image-options").modelCapability).toBe(
      "image-options",
    );
    expect(fixture.getComposerQaSeed("streaming").submitState).toBe("stop");
    expect(fixture.getComposerQaSeed("uploading").uploading).toBe(true);
    expect(
      fixture.getComposerQaSeed("multiline").input.split("\n"),
    ).toHaveLength(4);

    const mixed = fixture.createComposerQaAttachments("mixed");
    const full = fixture.createComposerQaAttachments("full");
    expect(mixed.images).toHaveLength(1);
    expect(mixed.files).toHaveLength(2);
    expect(full.images).toHaveLength(3);
    expect(full.files).toHaveLength(5);
    expect(fixture.getComposerQaMessages()).toHaveLength(2);
    expect(fixture.getComposerQaDropzoneSummary("drag-blocked")?.willAdd).toBe(
      false,
    );
  });
});
