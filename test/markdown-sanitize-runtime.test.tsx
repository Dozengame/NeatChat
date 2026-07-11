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

    expect(container.querySelector("script, iframe, object, svg")).toBeNull();
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
});
