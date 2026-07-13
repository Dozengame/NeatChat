type ReactMarkdownMockProps = {
  children: React.ReactNode;
  rehypePlugins?: unknown[];
};

const mockReactMarkdown = jest.fn(({ children }: ReactMarkdownMockProps) => (
  <div>{children}</div>
));

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: (props: ReactMarkdownMockProps) => mockReactMarkdown(props),
}));

jest.mock("remark-math", () => jest.fn());
jest.mock("remark-breaks", () => jest.fn());
jest.mock("remark-gfm", () => jest.fn());
jest.mock("rehype-katex", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("rehype-raw", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("rehype-highlight", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("rehype-sanitize", () => ({
  __esModule: true,
  default: jest.fn(),
  defaultSchema: {
    tagNames: ["a", "code", "img", "p", "pre", "span"],
    attributes: { a: ["href"], code: ["className"], img: ["src", "alt"] },
    protocols: { href: ["http", "https"], src: ["http", "https"] },
  },
}));

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

jest.mock("next/dynamic", () => {
  return () =>
    function DynamicPlaceholder() {
      return null;
    };
});

import { render } from "@testing-library/react";
import RehypeHighlight from "rehype-highlight";
import RehypeKatex from "rehype-katex";
import RehypeRaw from "rehype-raw";
import RehypeSanitize from "rehype-sanitize";
import {
  isSafeMarkdownImageSource,
  Markdown,
  markdownSanitizeSchema,
} from "../app/components/markdown";
import { rehypeMarkdownHeadingAnchors } from "../app/utils/markdown-anchor";

describe("Markdown raw HTML sanitization contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  test("sanitizes immediately after raw HTML and before trusted render plugins", () => {
    render(<Markdown content="<details><summary>Safe</summary></details>" />);

    const rehypePlugins =
      mockReactMarkdown.mock.calls[0][0].rehypePlugins ?? [];
    expect(rehypePlugins[0]).toBe(RehypeRaw);
    expect(rehypePlugins[1]).toEqual([RehypeSanitize, markdownSanitizeSchema]);
    expect(rehypePlugins[2]).toEqual([
      rehypeMarkdownHeadingAnchors,
      expect.objectContaining({ scope: expect.any(String) }),
    ]);
    expect(rehypePlugins[3]).toBe(RehypeKatex);
    expect(Array.isArray(rehypePlugins[4])).toBe(true);
    expect((rehypePlugins[4] as unknown[])[0]).toBe(RehypeHighlight);
  });

  test("allows only the raw HTML and classes required by supported Markdown", () => {
    expect(markdownSanitizeSchema.tagNames).toEqual(
      expect.arrayContaining(["details", "summary"]),
    );
    expect(markdownSanitizeSchema.tagNames).not.toEqual(
      expect.arrayContaining(["iframe", "script", "style"]),
    );
    expect(markdownSanitizeSchema.attributes?.code).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(["className", expect.any(RegExp)]),
      ]),
    );
    expect(markdownSanitizeSchema.attributes?.code).not.toEqual(
      expect.arrayContaining([
        expect.arrayContaining(["math-inline", "math-display"]),
      ]),
    );
    expect(markdownSanitizeSchema.attributes?.div).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(["className", "math", "math-display"]),
      ]),
    );
    expect(markdownSanitizeSchema.attributes?.span).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          "className",
          "thinking-loader",
          "math",
          "math-inline",
        ]),
      ]),
    );
    expect(markdownSanitizeSchema.attributes?.details).toEqual(
      expect.arrayContaining([
        "open",
        expect.arrayContaining(["className", "markdown-thinking"]),
      ]),
    );
    expect(markdownSanitizeSchema.protocols?.src).toContain("data");
  });

  test.each([
    "data:image/png;base64,AA==",
    "data:image/jpeg;base64,AA==",
    "data:image/gif;base64,AA==",
    "data:image/webp;base64,AA==",
    "data:image/avif;base64,AA==",
  ])("allows safe raster image source %s", (source) => {
    expect(isSafeMarkdownImageSource(source)).toBe(true);
  });

  test.each([
    "data:image/svg+xml,<svg></svg>",
    "data:text/html,<script>alert(1)</script>",
    "javascript:alert(1)",
  ])("rejects active image source %s", (source) => {
    expect(isSafeMarkdownImageSource(source)).toBe(false);
  });
});
