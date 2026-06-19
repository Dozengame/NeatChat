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

jest.mock("next/dynamic", () => {
  return () => function DynamicPlaceholder() {
    return null;
  };
});

jest.mock("../app/icons/file.svg", () => {
  const React = require("react");
  return function FileIconMock() {
    return React.createElement("svg", { "data-testid": "file-icon" });
  };
});

jest.mock("../app/icons/three-dots.svg", () => {
  const React = require("react");
  return function LoadingIconMock() {
    return React.createElement("svg", { "data-testid": "loading-icon" });
  };
});

jest.mock("../app/icons/download.svg", () => {
  const React = require("react");
  return function DownloadIconMock() {
    return React.createElement("svg", { "data-testid": "download-icon" });
  };
});

jest.mock("../app/icons/copy.svg", () => {
  const React = require("react");
  return function CopyIconMock() {
    return React.createElement("svg", { "data-testid": "copy-icon" });
  };
});

import { fireEvent, render, screen } from "@testing-library/react";
import { Markdown } from "../app/components/markdown";
import { copyToClipboard } from "../app/utils";
import { showToast } from "../app/components/ui-lib-actions";

describe("Markdown file attachments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  test("renders detected file blocks as clickable attachment cards and copies the original body", () => {
    render(
      <Markdown
        content={
          "文件名: Gemini-UX-audit.pdf\n类型: application/pdf\n大小: 24.00 KB\n\n第一行内容\n第二行内容\n\n---\n\n请忽略这条测试消息。"
        }
      />,
    );

    const attachment = screen.getByRole("button", {
      name: "文件附件：Gemini-UX-audit.pdf，application/pdf，24.00 KB。点击复制文件内容。",
    });

    expect(attachment).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Gemini-UX-audit.pdf")).toBeInTheDocument();
    expect(screen.getByText("24.00 KB")).toBeInTheDocument();
    expect(screen.getByText("application/pdf")).toBeInTheDocument();
    expect(screen.queryByText(/文件名:/)).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="file://"]')).not.toBeInTheDocument();

    fireEvent.click(attachment);

    expect(showToast).toHaveBeenCalledWith("文件内容已复制到剪贴板");
    expect(copyToClipboard).toHaveBeenCalledWith("第一行内容\n第二行内容");
  });

  test("keeps unsafe javascript links downgraded to text", () => {
    render(<Markdown content="[bad](javascript:alert(1))" />);

    expect(screen.getByText("bad")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "bad" })).not.toBeInTheDocument();
  });
});
