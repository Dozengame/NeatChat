jest.mock("../app/store/config", () => ({
  useAppConfig: jest.fn(() => ({
    enableArtifacts: true,
    enableCodeFold: true,
  })),
}));

jest.mock("../app/utils", () => ({
  copyToClipboard: jest.fn(),
  useWindowSize: jest.fn(() => ({ width: 1024, height: 768 })),
}));

jest.mock("../app/utils/token", () => ({
  encode: jest.fn((text: string) => text.split("")),
}));

jest.mock("../app/components/ui-lib-actions", () => ({
  showToast: jest.fn(),
}));

jest.mock("react-markdown", () =>
  jest.requireActual("react-markdown/react-markdown.min.js"),
);
jest.mock("remark-math", () => jest.fn());
jest.mock("remark-breaks", () => jest.fn());
jest.mock("remark-gfm", () => jest.fn());
jest.mock("rehype-katex", () => jest.fn());
jest.mock("rehype-raw", () => jest.fn());
jest.mock("rehype-highlight", () => jest.fn());
jest.mock("rehype-sanitize", () => ({
  __esModule: true,
  default: jest.fn(),
  defaultSchema: { tagNames: [], attributes: {}, protocols: {} },
}));

jest.mock("next/dynamic", () => {
  return () =>
    function DynamicPlaceholder() {
      return null;
    };
});

import { fireEvent, render, screen } from "@testing-library/react";
import { Markdown } from "../app/components/markdown";
import { findMarkdownAnchorTarget } from "../app/utils/markdown-anchor";

describe("Markdown internal links", () => {
  const scrollIntoView = jest.fn();

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn(() => ({ matches: false })),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.location.hash = "#/chat";
  });

  test("jumps to a Chinese heading inside the same Markdown message", () => {
    render(
      <Markdown content={"[一、项目概览](#一项目概览)\n\n## 一、项目概览"} />,
    );

    const link = screen.getByRole("link", { name: "一、项目概览" });
    const heading = screen.getByRole("heading", { name: "一、项目概览" });

    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
    expect(heading).toHaveAttribute("data-markdown-anchor", "一项目概览");
    expect(heading.id).toMatch(/^[^-]+-一项目概览$/);

    fireEvent.click(link);

    expect(window.location.hash).toBe("#/chat");
    expect(document.activeElement).toBe(heading);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  });

  test("keeps duplicate headings unique within and across messages", () => {
    render(
      <>
        <Markdown content={"## 重复\n\n## 重复"} />
        <Markdown content={"## 重复"} />
      </>,
    );

    const headings = screen.getAllByRole("heading", { name: "重复" });
    expect(headings.map((heading) => heading.dataset.markdownAnchor)).toEqual([
      "重复",
      "重复-1",
      "重复",
    ]);
    expect(new Set(headings.map((heading) => heading.id)).size).toBe(3);
  });

  test("resolves percent-encoded and sanitize-prefixed fragment targets", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <h2 data-markdown-anchor="一项目概览">一、项目概览</h2>
      <li id="user-content-fn-1">footnote</li>
    `;

    expect(
      findMarkdownAnchorTarget(
        root,
        "#%E4%B8%80%E9%A1%B9%E7%9B%AE%E6%A6%82%E8%A7%88",
      )?.textContent,
    ).toBe("一、项目概览");
    expect(findMarkdownAnchorTarget(root, "#fn-1")?.textContent).toBe(
      "footnote",
    );
    expect(() => findMarkdownAnchorTarget(root, "#%E0%A4%A")).not.toThrow();
  });

  test("preserves application routes and external-link safety", () => {
    render(
      <Markdown
        content={
          "[settings](/#/settings)\n\n[external](https://example.com/docs)"
        }
      />,
    );

    expect(screen.getByRole("link", { name: "settings" })).toHaveAttribute(
      "target",
      "_self",
    );
    expect(screen.getByRole("link", { name: "external" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "external" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });
});
