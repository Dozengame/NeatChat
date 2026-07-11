import { execFileSync } from "node:child_process";
import path from "node:path";

describe("Markdown sanitization runtime", () => {
  test("removes executable raw HTML while preserving supported safe markup", () => {
    const html = execFileSync(
      path.join(process.cwd(), "node_modules/.bin/tsx"),
      [path.join(process.cwd(), "test/fixtures/markdown-sanitize-runtime.tsx")],
      { encoding: "utf8" },
    );
    const container = document.createElement("div");
    container.innerHTML = html;

    expect(container.querySelector("script, iframe, object")).toBeNull();
    expect(
      Array.from(container.querySelectorAll("svg")).every((svg) =>
        Boolean(svg.closest(".katex")),
      ),
    ).toBe(true);
    expect(container.querySelector("[onclick]")).toBeNull();
    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(3);
    expect(details[0]).not.toHaveAttribute("open");
    expect(details[1]).toHaveAttribute("open");
    expect(details[2]).toHaveAttribute("open");
    expect(details[2]).toHaveClass("markdown-thinking");
    expect(details[2].querySelector("summary")?.textContent).toBe("Thinking");
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.querySelector('img[alt="unsafe svg"]')).toBeNull();
    expect(container.querySelector('img[alt="safe png"]')).toHaveAttribute(
      "src",
      "data:image/png;base64,AA==",
    );
  });

  test("preserves math markers through sanitization and renders them with KaTeX", () => {
    const html = execFileSync(
      path.join(process.cwd(), "node_modules/.bin/tsx"),
      [path.join(process.cwd(), "test/fixtures/markdown-sanitize-runtime.tsx")],
      { encoding: "utf8" },
    );
    const container = document.createElement("div");
    container.innerHTML = html;

    expect(container.querySelectorAll(".math-inline > .katex")).toHaveLength(1);
    expect(
      container.querySelectorAll(".math-display > .katex-display"),
    ).toHaveLength(3);
    expect(
      Array.from(
        container.querySelectorAll('annotation[encoding="application/x-tex"]'),
      ).map((annotation) => annotation.textContent),
    ).toEqual([
      "E = mc^2",
      String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`,
      String.raw`\sum_{i=1}^{n} i = \frac{n(n+1)}{2}`,
      String.raw`A = \begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{bmatrix}`,
    ]);

    const codeBlocks = container.querySelectorAll("code");
    expect(codeBlocks).toHaveLength(2);
    expect(
      Array.from(codeBlocks).every((code) => !code.querySelector(".katex")),
    ).toBe(true);
    expect(Array.from(codeBlocks).map((code) => code.textContent)).toEqual([
      "$E = mc^2$",
      "<span>$E = mc^2$</span>\n",
    ]);
  });
});
