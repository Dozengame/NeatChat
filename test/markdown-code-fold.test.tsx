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
  estimateTokenLengthInLLM: jest.fn((text: string) => text.length),
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

describe("Markdown code folding", () => {
  let scrollHeightSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    scrollHeightSpy = jest
      .spyOn(HTMLElement.prototype, "scrollHeight", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.tagName === "CODE" ? 520 : 0;
      });
  });

  afterEach(() => {
    scrollHeightSpy.mockRestore();
  });

  test("renders long code blocks with an accessible expand control", async () => {
    const longCode = Array.from(
      { length: 48 },
      (_, index) => `const line${index} = ${index};`,
    ).join("\n");

    render(<Markdown content={`\`\`\`ts\n${longCode}\n\`\`\``} />);

    const expandButton = await screen.findByRole("button", {
      name: "Show full code block",
    });
    const controlledId = expandButton.getAttribute("aria-controls");
    const controlledCode = controlledId
      ? document.getElementById(controlledId)
      : null;

    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(controlledId).toBeTruthy();
    expect(controlledCode?.tagName).toBe("CODE");
    expect(controlledCode).toHaveStyle({ maxHeight: "400px" });

    fireEvent.click(expandButton);

    expect(
      screen.queryByRole("button", { name: "Show full code block" }),
    ).not.toBeInTheDocument();
    expect(controlledCode).toHaveStyle({ maxHeight: "none" });
  });

  test("does not split or measure code blocks while content is streaming", () => {
    render(
      <Markdown content={"```text\nfirst line\nsecond line\n```"} streaming />,
    );

    expect(document.querySelectorAll(".code-line")).toHaveLength(0);
    expect(scrollHeightSpy).not.toHaveBeenCalled();
  });
});
