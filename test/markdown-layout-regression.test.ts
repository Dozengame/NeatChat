import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function readBlock(source: string, selector: string) {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) return "";

  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }

  return "";
}

describe("Markdown rejected-layout regressions", () => {
  const markdownStyles = read("app/styles/markdown.scss");

  test("keeps all prose surfaces on the centered 780px reading track", () => {
    expect(readBlock(markdownStyles, ".markdown-body h1")).toMatch(
      /margin:\s*0\.67em auto;/,
    );
    expect(readBlock(markdownStyles, ".markdown-body hr")).toMatch(
      /margin:\s*24px auto;/,
    );
    expect(readBlock(markdownStyles, ".markdown-body blockquote")).toMatch(
      /margin:\s*0 auto;/,
    );
    expect(
      readBlock(
        markdownStyles,
        ".markdown-body details:not(.markdown-thinking)",
      ),
    ).toMatch(/margin:\s*0 auto var\(--markdown-block-gap\);/);
    expect(
      readBlock(markdownStyles, ".markdown-body details.markdown-thinking"),
    ).toMatch(/margin:\s*0 auto 16px;/);
    expect(
      readBlock(markdownStyles, ".markdown-body .contains-task-list"),
    ).toMatch(/margin:\s*10px auto var\(--markdown-block-gap\);/);
    expect(
      readBlock(
        markdownStyles,
        ".markdown-body .contains-task-list .contains-task-list",
      ),
    ).toMatch(/margin:\s*8px 0 0;/);
    expect(
      readBlock(
        markdownStyles,
        ".markdown-body p:has(> .markdown-image-frame:only-child),\n.markdown-body p:has(> .markdown-media-frame:only-child)",
      ),
    ).toMatch(/margin:\s*14px auto var\(--markdown-block-gap\);/);

    const mathTrack = readBlock(
      markdownStyles,
      ".markdown-body > .math-display",
    );
    expect(mathTrack).toMatch(
      /width:\s*min\(100%,\s*var\(--markdown-prose-max-width\)\);/,
    );
    expect(mathTrack).toMatch(/margin-inline:\s*auto;/);
  });

  test("renders one 18px Markdown task checkbox without the global square", () => {
    const markdownRoot = readBlock(markdownStyles, ".markdown-body");
    const checkboxAfter = readBlock(
      markdownStyles,
      '.markdown-body .task-list-item > input[type="checkbox"]::after',
    );
    const globalStyles = read("app/styles/globals.scss");

    expect(markdownRoot).toMatch(/--markdown-task-checkbox-size:\s*18px;/);
    expect(markdownRoot).toMatch(/--markdown-task-checkbox-gap:\s*8px;/);
    expect(checkboxAfter).toMatch(/content:\s*none;/);
    expect(checkboxAfter).toMatch(/display:\s*none;/);
    expect(globalStyles).toMatch(
      /input\[type="checkbox"\]:checked::after\s*\{[\s\S]*width:\s*8px;[\s\S]*height:\s*8px;/,
    );
  });

  test("lets lists and code keep their own padding inside open details", () => {
    const markdownRoot = readBlock(markdownStyles, ".markdown-body");
    const baseDetails = readBlock(markdownRoot, "details");
    const baseDetailsContent = readBlock(
      baseDetails,
      "& > *:not(summary)",
    );
    const detailsContent = readBlock(
      markdownStyles,
      ".markdown-body details:not(.markdown-thinking) > *:not(summary)",
    );

    expect(baseDetailsContent).not.toMatch(/padding-left:/);
    expect(baseDetailsContent).toMatch(/position:\s*relative;/);
    expect(detailsContent).not.toMatch(/padding-left:/);
    expect(detailsContent).toMatch(/overflow-wrap:\s*anywhere;/);
    expect(markdownStyles).toMatch(
      /\.markdown-body pre\s*\{[\s\S]*padding-left:\s*var\(--markdown-code-block-padding-start\);/,
    );
    expect(
      readBlock(
        markdownStyles,
        ".markdown-body ul,\n.markdown-body ol",
      ),
    ).toMatch(/padding-left:\s*var\(--markdown-list-indent\);/);
  });

  test("keeps the contextual chip and desktop actions in one right cluster", () => {
    const chat = read("app/components/chat.tsx");
    const chatStyles = read("app/components/chat.module.scss");
    const header = readBlock(chatStyles, ".chat .chat-desktop-header");
    const title = readBlock(chatStyles, ".chat-desktop-title-stack");
    const cluster = readBlock(chatStyles, ".chat-desktop-header-cluster");
    const actions = readBlock(chatStyles, ".chat-desktop-header-actions");
    const constrained = readBlock(
      chatStyles,
      "@media screen and (min-width: 768px) and (max-width: 1056px)",
    );

    expect(chat).toMatch(
      /className=\{styles\["chat-desktop-header-cluster"\]\}[\s\S]*\{promptToast\}[\s\S]*\{showDesktopModelControls && \([\s\S]*styles\["chat-desktop-header-actions"\]/,
    );
    expect(header).toMatch(/justify-content:\s*flex-start;/);
    expect(title).toMatch(/flex:\s*1 1 auto;/);
    expect(title).toMatch(/max-width:\s*none;/);
    expect(title).toMatch(/overflow:\s*hidden;/);
    expect(cluster).toMatch(/display:\s*inline-flex;/);
    expect(cluster).toMatch(/margin-left:\s*auto;/);
    expect(cluster).toMatch(/gap:\s*10px;/);
    expect(actions).toMatch(/flex:\s*0 0 auto;/);
    expect(constrained).toMatch(
      /\.chat-desktop-header-cluster \.prompt-toast-content\s*\{[\s\S]*display:\s*none;/,
    );
  });
});
