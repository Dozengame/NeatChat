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

jest.mock("../app/icons/max.svg", () => {
  const React = require("react");
  return function MaxIcon() {
    return React.createElement("svg", { "aria-hidden": "true" });
  };
});

jest.mock("../app/icons/min.svg", () => {
  const React = require("react");
  return function MinIcon() {
    return React.createElement("svg", { "aria-hidden": "true" });
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
    expect(
      shell.querySelector(".markdown-table-scroll-hint"),
    ).toHaveTextContent(/see more columns/i);

    viewport.scrollLeft = 20;
    fireEvent.scroll(viewport);
    expect(
      shell.querySelector(".markdown-table-scroll-hint"),
    ).not.toBeInTheDocument();

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
      expect(
        shell.querySelector(".markdown-table-scroll-hint"),
      ).toHaveTextContent(/see more columns/i);
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

  test("shows overflow-only reading controls and restores focus after full-screen close", async () => {
    render(
      <MarkdownTable>
        <thead>
          <tr>
            <MarkdownTableHeader>Device</MarkdownTableHeader>
            <MarkdownTableHeader>Location</MarkdownTableHeader>
            <MarkdownTableHeader>Last report</MarkdownTableHeader>
          </tr>
        </thead>
        <tbody>
          <tr>
            <MarkdownTableCell>DEV-000001</MarkdownTableCell>
            <MarkdownTableCell>North monitoring station</MarkdownTableCell>
            <MarkdownTableCell>2026-07-13 08:42:01</MarkdownTableCell>
          </tr>
        </tbody>
      </MarkdownTable>,
    );

    const initialShell = document.querySelector(
      ".markdown-table-scroll-shell",
    ) as HTMLDivElement;
    const initialViewport = initialShell.querySelector(
      ".markdown-table-scroll-viewport",
    ) as HTMLDivElement;
    const initialTable = initialShell.querySelector("table") as HTMLTableElement;
    Object.defineProperties(initialViewport, {
      clientWidth: { configurable: true, value: 780 },
      scrollWidth: { configurable: true, value: 980 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });
    Object.defineProperty(initialTable, "scrollWidth", {
      configurable: true,
      value: 980,
    });
    act(() => window.dispatchEvent(new Event("resize")));

    const expandButton = await screen.findByRole("button", {
      name: /view table full screen/i,
    });
    expect(screen.getByRole("toolbar", { name: /table reading tools/i })).toBeInTheDocument();
    expect(expandButton).toHaveAttribute("aria-haspopup", "dialog");
    const scrollbar = screen.getByRole("slider", {
      name: /scroll table horizontally/i,
    });
    fireEvent.keyDown(scrollbar, { key: "PageUp" });
    expect(initialViewport.scrollLeft).toBe(200);
    expect(scrollbar).toHaveAttribute("aria-valuetext", "100% scrolled");
    fireEvent.keyDown(scrollbar, { key: "PageDown" });
    expect(initialViewport.scrollLeft).toBe(0);
    expect(scrollbar).toHaveAttribute("aria-valuetext", "0% scrolled");
    fireEvent.keyDown(scrollbar, { key: "End" });
    expect(initialViewport.scrollLeft).toBe(200);
    expect(scrollbar).toHaveAttribute("aria-valuetext", "100% scrolled");
    fireEvent.keyDown(scrollbar, { key: "Home" });
    expect(initialViewport.scrollLeft).toBe(0);

    expandButton.focus();
    fireEvent.click(expandButton);
    const dialog = await screen.findByRole("dialog", {
      name: /full-screen table: device, location, last report/i,
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.querySelectorAll("table")).toHaveLength(1);
    const collapseButton = screen.getByRole("button", {
      name: /exit table full screen/i,
    });
    expect(collapseButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /view table full screen/i }),
    ).toHaveFocus();

    fireEvent.click(
      screen.getByRole("button", { name: /view table full screen/i }),
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: /exit table full screen/i,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    const compactViewport = document.querySelector(
      ".markdown-table-scroll-viewport",
    ) as HTMLDivElement;
    Object.defineProperties(compactViewport, {
      clientWidth: { configurable: true, value: 980 },
      scrollWidth: { configurable: true, value: 980 },
    });
    act(() => window.dispatchEvent(new Event("resize")));
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /view table full screen/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    });
  });

  test("keeps custom thumb dragging anchored and stops after pointer cancellation", async () => {
    const originalPointerEvent = window.PointerEvent;
    class MockPointerEvent extends MouseEvent {
      pointerId: number;
      pointerType: string;
      isPrimary: boolean;

      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
        this.pointerType = init.pointerType ?? "mouse";
        this.isPrimary = init.isPrimary ?? true;
      }
    }
    window.PointerEvent =
      MockPointerEvent as unknown as typeof window.PointerEvent;

    render(
      <MarkdownTable>
        <thead>
          <tr>
            <MarkdownTableHeader>Device</MarkdownTableHeader>
            <MarkdownTableHeader>Location</MarkdownTableHeader>
          </tr>
        </thead>
        <tbody>
          <tr>
            <MarkdownTableCell>DEV-000001</MarkdownTableCell>
            <MarkdownTableCell>North monitoring station</MarkdownTableCell>
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
      scrollWidth: { configurable: true, value: 980 },
      scrollLeft: { configurable: true, writable: true, value: 60 },
    });
    Object.defineProperty(table, "scrollWidth", {
      configurable: true,
      value: 980,
    });
    act(() => window.dispatchEvent(new Event("resize")));

    const scrollbar = await screen.findByRole("slider", {
      name: /scroll table horizontally/i,
    });
    const thumb = shell.querySelector(
      ".markdown-table-scrollbar-thumb",
    ) as HTMLSpanElement;
    const trackWidth = 1000;
    const thumbWidth = (780 / 980) * trackWidth;
    const thumbLeft = (60 / 980) * trackWidth;
    const thumbCenter = thumbLeft + thumbWidth / 2;
    const trackRect = {
      left: 0,
      right: trackWidth,
      top: 0,
      bottom: 18,
      width: trackWidth,
      height: 18,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
    const thumbRect = {
      left: thumbLeft,
      right: thumbLeft + thumbWidth,
      top: 5,
      bottom: 13,
      width: thumbWidth,
      height: 8,
      x: thumbLeft,
      y: 5,
      toJSON: () => ({}),
    };
    Object.defineProperty(scrollbar, "getBoundingClientRect", {
      configurable: true,
      value: jest.fn(() => trackRect),
    });
    Object.defineProperty(thumb, "getBoundingClientRect", {
      configurable: true,
      value: jest.fn(() => thumbRect),
    });
    let capturedPointer: number | null = null;
    const setPointerCapture = jest.fn((pointerId: number) => {
      capturedPointer = pointerId;
    });
    const hasPointerCapture = jest.fn(
      (pointerId: number) => capturedPointer === pointerId,
    );
    const releasePointerCapture = jest.fn((pointerId: number) => {
      if (capturedPointer === pointerId) capturedPointer = null;
    });
    Object.defineProperties(scrollbar, {
      setPointerCapture: { configurable: true, value: setPointerCapture },
      hasPointerCapture: { configurable: true, value: hasPointerCapture },
      releasePointerCapture: {
        configurable: true,
        value: releasePointerCapture,
      },
    });

    fireEvent.pointerDown(scrollbar, {
      pointerId: 7,
      pointerType: "mouse",
      button: 0,
      isPrimary: true,
      clientX: thumbCenter,
    });
    expect(viewport.scrollLeft).toBe(60);
    expect(setPointerCapture).toHaveBeenCalledWith(7);

    fireEvent.pointerMove(scrollbar, {
      pointerId: 7,
      pointerType: "mouse",
      isPrimary: true,
      clientX: thumbCenter + 100,
    });
    expect(viewport.scrollLeft).toBe(158);

    fireEvent.pointerCancel(scrollbar, { pointerId: 7 });
    const cancelledScrollLeft = viewport.scrollLeft;
    fireEvent.pointerMove(scrollbar, {
      pointerId: 7,
      pointerType: "mouse",
      isPrimary: true,
      clientX: thumbCenter + 150,
    });
    expect(viewport.scrollLeft).toBe(cancelledScrollLeft);

    fireEvent.pointerDown(scrollbar, {
      pointerId: 8,
      pointerType: "mouse",
      button: 0,
      isPrimary: true,
      clientX: 900,
    });
    expect(viewport.scrollLeft).toBe(200);
    fireEvent.pointerUp(scrollbar, {
      pointerId: 8,
      pointerType: "mouse",
      isPrimary: true,
      clientX: 900,
    });
    expect(releasePointerCapture).toHaveBeenCalledWith(8);
    expect(scrollbar.tagName).toBe("DIV");
    expect(scrollbar).not.toHaveAttribute("type", "range");
    window.PointerEvent = originalPointerEvent;
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
