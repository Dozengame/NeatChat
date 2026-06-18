jest.mock("../app/store/config", () => ({
  useAppConfig: jest.fn(() => ({
    enableArtifacts: true,
    enableCodeFold: true,
  })),
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

jest.mock("next/dynamic", () => {
  return () => function DynamicPlaceholder() {
    return null;
  };
});

import { render, screen } from "@testing-library/react";
import { PreCode } from "../app/components/markdown";

function renderCodeBlock(className: string) {
  render(
    <PreCode>
      <code className={className}>{'{"tool": true}'}</code>
    </PreCode>,
  );
}

describe("PreCode language labels", () => {
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
    ).toBeInTheDocument();
  });

  test("renders qualified fence info as a short readable label", () => {
    renderCodeBlock("language-json:mcp:{clientId}");

    expect(screen.getByText("JSON MCP")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "复制 JSON MCP 代码" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/clientId/i)).not.toBeInTheDocument();
  });
});
