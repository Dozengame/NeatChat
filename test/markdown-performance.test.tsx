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

import { render } from "@testing-library/react";
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
});
