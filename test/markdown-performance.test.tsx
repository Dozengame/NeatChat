jest.mock("../app/utils/token", () => ({
  encode: jest.fn((text: string) => text.split("")),
}));

jest.mock("../app/store", () => ({
  useChatStore: jest.fn(() => ({
    currentSession: () => ({
      mask: { enableArtifacts: true },
    }),
  })),
}));

jest.mock("../app/store/config", () => ({
  useAppConfig: jest.fn(() => ({
    enableArtifacts: true,
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

jest.mock("next/dynamic", () => {
  return () => function DynamicPlaceholder() {
    return null;
  };
});

import { fireEvent, render, screen } from "@testing-library/react";
import { encode } from "../app/utils/token";
import { Markdown } from "../app/components/markdown";

describe("Markdown performance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  test("does not re-tokenize full streaming content until the message finishes", () => {
    const { rerender } = render(
      <Markdown content="hello" messageId="m1" streaming />,
    );

    rerender(<Markdown content="hello world" messageId="m1" streaming />);

    expect(encode).not.toHaveBeenCalled();

    rerender(
      <Markdown content="hello world" messageId="m1" streaming={false} />,
    );

    expect(encode).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledWith("hello world");
  });

  test("delegates content-change scrolling to the chat container", () => {
    const onContentChange = jest.fn();

    const { rerender } = render(
      <Markdown
        content="hello"
        messageId="m1"
        streaming
        shouldAutoScroll
        onContentChange={onContentChange}
      />,
    );

    rerender(
      <Markdown
        content="hello world"
        messageId="m1"
        streaming
        shouldAutoScroll
        onContentChange={onContentChange}
      />,
    );

    expect(onContentChange).toHaveBeenCalledTimes(1);
  });

  test("presents token info as a toggled metadata chip", () => {
    window.localStorage.setItem("first_char_delay_m2", "512");

    render(
      <Markdown content="hello world" messageId="m2" streaming={false} />,
    );

    const tokenChip = screen.getByRole("button", { name: "Token 信息" });

    expect(tokenChip.textContent).toBe("11 Tokens");
    expect(tokenChip.getAttribute("aria-pressed")).toBe("false");
    expect(tokenChip.getAttribute("data-token-info-expanded")).toBe("false");
    expect(encode).toHaveBeenCalledWith("hello world");

    fireEvent.mouseEnter(tokenChip);
    expect(tokenChip.textContent).toContain("512ms");
    expect(tokenChip.getAttribute("aria-pressed")).toBe("true");
    expect(tokenChip.getAttribute("data-token-info-expanded")).toBe("true");

    fireEvent.mouseLeave(tokenChip);
    expect(tokenChip.textContent).toBe("11 Tokens");
    expect(tokenChip.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(tokenChip);
    expect(tokenChip.textContent).toContain("512ms");
    expect(tokenChip.getAttribute("aria-pressed")).toBe("true");
  });
});
