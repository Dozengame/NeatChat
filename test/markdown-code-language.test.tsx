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

jest.mock("react-markdown", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children }: { children: any }) =>
      React.createElement("div", null, children),
  };
});

jest.mock("remark-math", () => jest.fn());
jest.mock("remark-breaks", () => jest.fn());
jest.mock("remark-gfm", () => jest.fn());
jest.mock("rehype-katex", () => jest.fn());
jest.mock("rehype-raw", () => jest.fn());
jest.mock("rehype-highlight", () => jest.fn());

jest.mock("../app/icons/copy.svg", () => {
  const React = require("react");
  return function CopyIconMock() {
    return React.createElement("svg", { "data-testid": "copy-icon" });
  };
});

jest.mock("../app/icons/confirm.svg", () => {
  const React = require("react");
  return function ConfirmIconMock() {
    return React.createElement("svg", { "data-testid": "confirm-icon" });
  };
});

jest.mock("next/dynamic", () => {
  return () => function DynamicPlaceholder() {
    return null;
  };
});

import { act, fireEvent, render, screen } from "@testing-library/react";
import { PreCode } from "../app/components/markdown";
import { copyToClipboard } from "../app/utils";

function renderCodeBlock(className: string) {
  render(
    <PreCode>
      <code className={className}>{'{"tool": true}'}</code>
    </PreCode>,
  );
}

describe("PreCode language labels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test.each([
    ["language-js", "JavaScript"],
    ["language-typescript", "TypeScript"],
    ["language-tsx", "TSX"],
    ["language-python", "Python"],
    ["language-markdown", "Markdown"],
    ["language-shell-session", "Shell Session"],
  ])("renders %s as %s", (className, label) => {
    renderCodeBlock(className);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `复制 ${label} 代码` }),
    ).toHaveAttribute("title", `复制 ${label} 代码`);
  });

  test("renders qualified fence info as a short readable label", () => {
    renderCodeBlock("language-json:mcp:{clientId}");

    expect(screen.getByText("JSON MCP")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "复制 JSON MCP 代码" }),
    ).toHaveAttribute("title", "复制 JSON MCP 代码");
    expect(screen.queryByText(/clientId/i)).not.toBeInTheDocument();
  });

  test("marks plain text-like code blocks as wrapping blocks", () => {
    renderCodeBlock("language-text");

    expect(document.querySelector("pre")).toHaveClass(
      "markdown-code-block-wrap",
    );
  });

  test("keeps programming code blocks scrollable instead of wrapping", () => {
    renderCodeBlock("language-javascript");

    expect(document.querySelector("pre")).not.toHaveClass(
      "markdown-code-block-wrap",
    );
  });

  test("lets users toggle code wrapping without polluting copied code", () => {
    renderCodeBlock("language-json");

    const pre = document.querySelector("pre");
    expect(pre).toHaveAttribute("data-wrap-state", "scroll");
    expect(pre).not.toHaveClass("markdown-code-block-wrap");

    const wrapButton = screen.getByRole("button", {
      name: "自动换行 JSON 代码",
    });
    expect(wrapButton).toHaveAttribute("aria-pressed", "false");
    expect(wrapButton).toHaveAttribute("data-wrap-state", "scroll");

    fireEvent.click(wrapButton);

    expect(pre).toHaveClass("markdown-code-block-wrap");
    expect(pre).toHaveAttribute("data-wrap-state", "wrapped");
    expect(wrapButton).toHaveAttribute("aria-pressed", "true");
    expect(wrapButton).toHaveAttribute("data-wrap-state", "wrapped");

    fireEvent.click(screen.getByRole("button", { name: "复制 JSON 代码" }));

    expect(copyToClipboard).toHaveBeenCalledWith('{"tool": true}');
  });

  test("exposes copy feedback through a polite live button label", () => {
    renderCodeBlock("language-typescript");

    const copyButton = screen.getByRole("button", {
      name: "复制 TypeScript 代码",
    });

    expect(copyButton).toHaveAttribute("aria-live", "polite");
    expect(copyButton).toHaveAttribute("aria-atomic", "true");
    expect(copyButton).toHaveAttribute("title", "复制 TypeScript 代码");
  });

  test("keeps copied feedback in a dedicated hidden status", () => {
    jest.useFakeTimers();
    renderCodeBlock("language-typescript");

    const copyButton = screen.getByRole("button", {
      name: "复制 TypeScript 代码",
    });
    const status = screen.getByRole("status");

    expect(copyButton).not.toContainElement(status);
    expect(status).toHaveClass("copy-code-status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status).toHaveTextContent("");

    fireEvent.click(copyButton);

    expect(status).toHaveTextContent("已复制 TypeScript 代码");

    act(() => {
      jest.advanceTimersByTime(1400);
    });

    expect(status).toHaveTextContent("");
  });

  test("shows a temporary copied state after copying code", () => {
    jest.useFakeTimers();
    renderCodeBlock("language-typescript");

    const copyButton = screen.getByRole("button", {
      name: "复制 TypeScript 代码",
    });

    fireEvent.click(copyButton);

    expect(copyToClipboard).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "已复制 TypeScript 代码" }),
    ).toHaveAttribute("data-copy-state", "copied");
    expect(
      screen.getByRole("button", { name: "已复制 TypeScript 代码" }),
    ).toHaveAttribute("title", "已复制 TypeScript 代码");

    act(() => {
      jest.advanceTimersByTime(1400);
    });

    expect(
      screen.getByRole("button", { name: "复制 TypeScript 代码" }),
    ).toHaveAttribute("data-copy-state", "idle");
  });
});
