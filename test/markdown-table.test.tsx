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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  MarkdownTable,
  MarkdownTableCell,
  MarkdownFeatureContext,
  MarkdownTableHeader,
} from "../app/components/markdown";

describe("Markdown table semantics and adaptive width", () => {
  test("keeps streaming width monotonic without rescanning content on each update", async () => {
    const renderStreamingTable = (cell: string, streaming: boolean) => (
      <MarkdownFeatureContext.Provider
        value={{ enableArtifacts: true, enableCodeFold: true, streaming }}
      >
        <MarkdownTable>
          <tbody>
            <tr>
              <MarkdownTableCell>{cell}</MarkdownTableCell>
            </tr>
          </tbody>
        </MarkdownTable>
      </MarkdownFeatureContext.Provider>
    );
    const animationFrameSpy = jest.spyOn(window, "requestAnimationFrame");
    const view = render(renderStreamingTable("wide streaming cell", true));
    const shell = document.querySelector(
      ".markdown-table-scroll-shell",
    ) as HTMLDivElement;
    const viewport = shell.querySelector(
      ".markdown-table-scroll-viewport",
    ) as HTMLDivElement;
    const table = shell.querySelector("table") as HTMLTableElement;
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 780 },
      scrollWidth: { configurable: true, value: 860 },
    });
    Object.defineProperty(table, "scrollWidth", {
      configurable: true,
      value: 860,
    });
    act(() => window.dispatchEvent(new Event("resize")));
    await waitFor(() =>
      expect(shell).toHaveAttribute("data-markdown-width", "wide"),
    );

    const framesBeforeStreamingUpdate = animationFrameSpy.mock.calls.length;
    view.rerender(
      renderStreamingTable("wide streaming cell with more tokens", true),
    );
    expect(shell).toHaveAttribute("data-markdown-width", "wide");
    expect(animationFrameSpy).toHaveBeenCalledTimes(
      framesBeforeStreamingUpdate,
    );

    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 780 },
      scrollWidth: { configurable: true, value: 780 },
    });
    Object.defineProperty(table, "scrollWidth", {
      configurable: true,
      value: 780,
    });
    view.rerender(renderStreamingTable("complete", false));
    await waitFor(() =>
      expect(shell).toHaveAttribute("data-markdown-width", "normal"),
    );
    animationFrameSpy.mockRestore();
  });

  test("preserves explicit alignment and converts only strict dash-break cells", () => {
    render(
      <MarkdownTable>
        <thead>
          <tr>
            <MarkdownTableHeader isHeader>Name</MarkdownTableHeader>
            <MarkdownTableHeader style={{ textAlign: "center" }}>
              Center
            </MarkdownTableHeader>
            <MarkdownTableHeader style={{ textAlign: "right" }}>
              Right
            </MarkdownTableHeader>
          </tr>
        </thead>
        <tbody>
          <tr>
            <MarkdownTableCell isHeader={false}>Strict</MarkdownTableCell>
            <MarkdownTableCell>
              {"- Item A"}
              <br />
              {"- Item B"}
              <br />
              {"- Item C"}
            </MarkdownTableCell>
            <MarkdownTableCell>kept</MarkdownTableCell>
          </tr>
          <tr>
            <MarkdownTableCell>Mixed</MarkdownTableCell>
            <MarkdownTableCell>
              prefix
              <br />
              {"- Not a list"}
            </MarkdownTableCell>
            <MarkdownTableCell>kept</MarkdownTableCell>
          </tr>
        </tbody>
      </MarkdownTable>,
    );

    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveAttribute("scope", "col");
    expect(headers[0]).not.toHaveAttribute("isheader");
    expect(headers[0]).not.toHaveStyle({ textAlign: "center" });
    expect(headers[1]).toHaveStyle({ textAlign: "center" });
    expect(headers[2]).toHaveStyle({ textAlign: "right" });

    const strictCell = screen.getByText("Item A").closest("td");
    expect(
      strictCell?.querySelector("ul.markdown-table-cell-list"),
    ).not.toBeNull();
    expect(strictCell?.querySelectorAll("li")).toHaveLength(3);
    const mixedCell = screen
      .getByText("Mixed")
      .closest("tr")
      ?.querySelectorAll("td")[1];
    expect(mixedCell).toHaveTextContent("prefix- Not a list");
    expect(mixedCell?.querySelector("ul")).toBeNull();
  });

  test("promotes real overflow, labels the instance, and hides the mobile hint after scrolling", async () => {
    const view = render(
      <MarkdownTable>
        <thead>
          <tr>
            <MarkdownTableHeader>Feature</MarkdownTableHeader>
            <MarkdownTableHeader>State</MarkdownTableHeader>
            <MarkdownTableHeader>Notes</MarkdownTableHeader>
          </tr>
        </thead>
        <tbody>
          <tr>
            <MarkdownTableCell>Adaptive width</MarkdownTableCell>
            <MarkdownTableCell>Ready</MarkdownTableCell>
            <MarkdownTableCell>A deliberately wide table row</MarkdownTableCell>
          </tr>
        </tbody>
      </MarkdownTable>,
    );

    const shell = document.querySelector(
      ".markdown-table-scroll-shell",
    ) as HTMLDivElement;
    const viewport = shell.querySelector(
      ".markdown-table-scroll-viewport",
    ) as HTMLDivElement;
    const table = shell.querySelector("table") as HTMLTableElement;
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 780 },
      scrollWidth: { configurable: true, value: 860 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });
    Object.defineProperty(table, "scrollWidth", {
      configurable: true,
      value: 860,
    });

    act(() => window.dispatchEvent(new Event("resize")));

    await waitFor(() => {
      expect(shell).toHaveAttribute("data-markdown-width", "wide");
      expect(viewport).toHaveAttribute("role", "region");
    });
    expect(viewport.getAttribute("aria-label")).toMatch(
      /Feature, State, Notes/,
    );
    expect(screen.getByText(/see more columns/i)).toBeInTheDocument();

    viewport.scrollLeft = 20;
    fireEvent.scroll(viewport);
    expect(screen.queryByText(/see more columns/i)).not.toBeInTheDocument();

    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 900 },
      scrollWidth: { configurable: true, value: 900 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });
    act(() => window.dispatchEvent(new Event("resize")));
    await waitFor(() => {
      expect(viewport).not.toHaveAttribute("role");
    });

    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 780 },
      scrollWidth: { configurable: true, value: 860 },
    });
    act(() => window.dispatchEvent(new Event("resize")));
    await waitFor(() => {
      expect(screen.getByText(/see more columns/i)).toBeInTheDocument();
    });

    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 780 },
      scrollWidth: { configurable: true, value: 780 },
    });
    Object.defineProperty(table, "scrollWidth", {
      configurable: true,
      value: 780,
    });
    view.rerender(
      <MarkdownTable>
        <thead>
          <tr>
            <MarkdownTableHeader>Item</MarkdownTableHeader>
            <MarkdownTableHeader>State</MarkdownTableHeader>
          </tr>
        </thead>
        <tbody>
          <tr>
            <MarkdownTableCell>Compact table</MarkdownTableCell>
            <MarkdownTableCell>Ready</MarkdownTableCell>
          </tr>
        </tbody>
      </MarkdownTable>,
    );
    await waitFor(() => {
      expect(shell).toHaveAttribute("data-markdown-width", "normal");
    });
  });

  test("resets width when table structure changes without changing concatenated text", async () => {
    const view = render(
      <MarkdownTable>
        <thead>
          <tr>
            <MarkdownTableHeader>A</MarkdownTableHeader>
            <MarkdownTableHeader>BC</MarkdownTableHeader>
          </tr>
        </thead>
        <tbody>
          <tr>
            <MarkdownTableCell>X</MarkdownTableCell>
            <MarkdownTableCell>YZ</MarkdownTableCell>
          </tr>
        </tbody>
      </MarkdownTable>,
    );
    const shell = document.querySelector(
      ".markdown-table-scroll-shell",
    ) as HTMLDivElement;
    const viewport = shell.querySelector(
      ".markdown-table-scroll-viewport",
    ) as HTMLDivElement;
    const table = shell.querySelector("table") as HTMLTableElement;
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 780 },
      scrollWidth: { configurable: true, value: 860 },
    });
    Object.defineProperty(table, "scrollWidth", {
      configurable: true,
      value: 860,
    });
    act(() => window.dispatchEvent(new Event("resize")));
    await waitFor(() =>
      expect(shell).toHaveAttribute("data-markdown-width", "wide"),
    );

    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 780 },
      scrollWidth: { configurable: true, value: 780 },
    });
    Object.defineProperty(table, "scrollWidth", {
      configurable: true,
      value: 780,
    });
    view.rerender(
      <MarkdownTable>
        <thead>
          <tr>
            <MarkdownTableHeader>AB</MarkdownTableHeader>
            <MarkdownTableHeader>C</MarkdownTableHeader>
          </tr>
        </thead>
        <tbody>
          <tr>
            <MarkdownTableCell>XY</MarkdownTableCell>
            <MarkdownTableCell>Z</MarkdownTableCell>
          </tr>
        </tbody>
      </MarkdownTable>,
    );
    await waitFor(() =>
      expect(shell).toHaveAttribute("data-markdown-width", "normal"),
    );
  });
});
