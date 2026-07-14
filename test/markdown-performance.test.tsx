jest.mock("../app/utils/token", () => ({
  estimateTokenLengthInLLM: jest.fn((text: string) => text.length),
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
jest.mock("rehype-katex", () => jest.fn());
jest.mock("rehype-raw", () => jest.fn());
jest.mock("rehype-highlight", () => ({ __esModule: true, default: jest.fn() }));
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
import { estimateTokenLengthInLLM } from "../app/utils/token";
import { Markdown, MarkdownSpan } from "../app/components/markdown";
import Locale from "../app/locales";
import RehypeHighlight from "rehype-highlight";

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

    expect(estimateTokenLengthInLLM).not.toHaveBeenCalled();

    rerender(
      <Markdown content="hello world" messageId="m1" streaming={false} />,
    );

    expect(estimateTokenLengthInLLM).toHaveBeenCalledTimes(1);
    expect(estimateTokenLengthInLLM).toHaveBeenCalledWith("hello world");
  });

  test("defers syntax highlighting until streaming finishes", () => {
    const { rerender } = render(
      <Markdown content={"```ts\nconst n = 1;\n```"} streaming />,
    );

    const streamingPlugins =
      mockReactMarkdown.mock.calls.at(-1)?.[0].rehypePlugins ?? [];
    expect(
      streamingPlugins.some((plugin: unknown) =>
        Array.isArray(plugin)
          ? plugin[0] === RehypeHighlight
          : plugin === RehypeHighlight,
      ),
    ).toBe(false);

    rerender(
      <Markdown content={"```ts\nconst n = 1;\n```"} streaming={false} />,
    );

    const completedPlugins =
      mockReactMarkdown.mock.calls.at(-1)?.[0].rehypePlugins ?? [];
    expect(
      completedPlugins.some((plugin: unknown) =>
        Array.isArray(plugin)
          ? plugin[0] === RehypeHighlight
          : plugin === RehypeHighlight,
      ),
    ).toBe(true);
  });

  test("keeps ordinary highlight spans off the formula measurement path", () => {
    const originalResizeObserver = global.ResizeObserver;
    const observe = jest.fn();
    const disconnect = jest.fn();
    const resizeObserver = jest.fn(() => ({ observe, disconnect }));
    Object.defineProperty(global, "ResizeObserver", {
      configurable: true,
      value: resizeObserver,
    });

    const { rerender } = render(
      <div>
        {Array.from({ length: 1500 }, (_, index) => (
          <MarkdownSpan key={index} className="hljs-keyword">
            token-{index}
          </MarkdownSpan>
        ))}
      </div>,
    );

    expect(resizeObserver).not.toHaveBeenCalled();

    rerender(
      <MarkdownSpan className="katex-display">
        <span>formula</span>
      </MarkdownSpan>,
    );
    expect(resizeObserver).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".katex-display")).toHaveAttribute(
      "data-chat-horizontal-scroll",
      "true",
    );

    Object.defineProperty(global, "ResizeObserver", {
      configurable: true,
      value: originalResizeObserver,
    });
  });

  test("presents token info as a toggled metadata chip", () => {
    window.localStorage.setItem("first_char_delay_m2", "512");
    const tokenCountText = Locale.Chat.TokenInfo.TokenCount(11);
    const tokenDelayText = Locale.Chat.TokenInfo.FirstDelay(512);
    const tokenInfoLabel = Locale.Chat.TokenInfo.Label(
      [tokenCountText, tokenDelayText].join(", "),
    );

    render(<Markdown content="hello world" messageId="m2" streaming={false} />);

    const tokenChip = screen.getByRole("button", {
      name: tokenInfoLabel,
    });

    expect(tokenChip.textContent).toBe(tokenCountText);
    expect(tokenChip.getAttribute("aria-label")).toBe(tokenInfoLabel);
    expect(tokenChip.getAttribute("aria-pressed")).toBe("false");
    expect(tokenChip.getAttribute("data-token-info-expanded")).toBe("false");
    expect(estimateTokenLengthInLLM).toHaveBeenCalledWith("hello world");

    fireEvent.mouseEnter(tokenChip);
    expect(tokenChip.textContent).toBe(tokenDelayText);
    expect(tokenChip.getAttribute("aria-pressed")).toBe("true");
    expect(tokenChip.getAttribute("data-token-info-expanded")).toBe("true");

    fireEvent.mouseLeave(tokenChip);
    expect(tokenChip.textContent).toBe(tokenCountText);
    expect(tokenChip.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(tokenChip);
    expect(tokenChip.textContent).toBe(tokenDelayText);
    expect(tokenChip.getAttribute("aria-pressed")).toBe("true");
  });

  test("renders token count as static metadata without latency", () => {
    const tokenCountText = Locale.Chat.TokenInfo.TokenCount(11);
    const tokenInfoLabel = Locale.Chat.TokenInfo.Label(tokenCountText);

    render(<Markdown content="hello world" messageId="m3" streaming={false} />);

    const tokenChip = screen.getByLabelText(tokenInfoLabel);

    expect(tokenChip.textContent).toBe(tokenCountText);
    expect(tokenChip.tagName).toBe("SPAN");
    expect(tokenChip.classList.contains("token-info-static")).toBe(true);
    expect(tokenChip.getAttribute("aria-pressed")).toBeNull();
    expect(tokenChip.getAttribute("data-token-info-expanded")).toBeNull();
  });
});
