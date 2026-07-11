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
    expect(container.querySelector("details summary")?.textContent).toBe(
      "Safe",
    );
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.querySelector('img[alt="unsafe svg"]')).toBeNull();
    expect(container.querySelector('img[alt="safe png"]')).toHaveAttribute(
      "src",
      "data:image/png;base64,AA==",
    );
  });
});
