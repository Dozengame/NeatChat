import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import {
  HTMLPreview,
  type HTMLPreviewHander,
} from "../app/components/artifacts-preview";

let mockNanoIdCounter = 0;
jest.mock("nanoid", () => ({
  nanoid: () => `preview-${++mockNanoIdCounter}`,
}));

describe("HTMLPreview accessibility and message boundary", () => {
  test("moves keyboard focus into the approved preview and back to the renewed gate", async () => {
    const view = render(
      <HTMLPreview code="<main>First</main>" accessibleTitle="HTML preview" />,
    );

    const runButton = screen.getByRole("button", { name: "Run preview" });
    runButton.focus();
    fireEvent.click(runButton, { detail: 0 });

    const firstFrame = screen.getByTitle(/^HTML preview /);
    await waitFor(() => expect(firstFrame).toHaveFocus());

    view.rerender(
      <HTMLPreview code="<main>Second</main>" accessibleTitle="HTML preview" />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Run preview" })).toHaveFocus(),
    );
  });

  test("does not steal focus for pointer approval or an unfocused preview", async () => {
    const view = render(
      <>
        <button type="button">Outside</button>
        <HTMLPreview code="<main>First</main>" accessibleTitle="HTML preview" />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Run preview" }), {
      detail: 1,
    });
    const firstFrame = screen.getByTitle(/^HTML preview /);
    expect(firstFrame).not.toHaveFocus();

    const outsideButton = screen.getByRole("button", { name: "Outside" });
    outsideButton.focus();
    view.rerender(
      <>
        <button type="button">Outside</button>
        <HTMLPreview
          code="<main>Second</main>"
          accessibleTitle="HTML preview"
        />
      </>,
    );

    await waitFor(() => expect(outsideButton).toHaveFocus());
  });

  test("reserves the configured preview height before execution", () => {
    render(
      <HTMLPreview
        code="<main>Stable preview</main>"
        accessibleTitle="HTML preview"
        height={600}
        autoHeight
      />,
    );

    const runButton = screen.getByRole("button", { name: "Run preview" });
    expect(runButton.parentElement).toHaveStyle({ height: "600px" });

    fireEvent.click(runButton);
    expect(screen.getByTitle(/^HTML preview /)).toHaveStyle({
      height: "600px",
    });
  });

  test("reports whether the current document has execution approval", () => {
    const onApprovalChange = jest.fn();
    const view = render(
      <HTMLPreview
        code="<main>First</main>"
        accessibleTitle="HTML preview"
        onApprovalChange={onApprovalChange}
      />,
    );

    expect(onApprovalChange).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "Run preview" }));
    expect(onApprovalChange).toHaveBeenLastCalledWith(true);

    view.rerender(
      <HTMLPreview
        code="<main>Second</main>"
        accessibleTitle="HTML preview"
        onApprovalChange={onApprovalChange}
      />,
    );
    expect(onApprovalChange).toHaveBeenLastCalledWith(false);
  });

  test("uses unique stable titles and accepts metadata only from its own frame", async () => {
    const onLoad = jest.fn();
    const onLayoutMetrics = jest.fn();
    render(
      <>
        <HTMLPreview
          code={
            '<!DOCTYPE html><script>const fakeHead = "<head>";</script><title>Report</title><main>One</main>'
          }
          accessibleTitle="HTML preview"
          onLoad={onLoad}
          onLayoutMetrics={onLayoutMetrics}
        />
        <HTMLPreview code="<main>Two</main>" accessibleTitle="HTML preview" />
      </>,
    );

    expect(screen.queryAllByTitle(/^HTML preview /)).toHaveLength(0);
    const runButtons = screen.getAllByRole("button", { name: "Run preview" });
    expect(runButtons).toHaveLength(2);
    runButtons.forEach((button) => fireEvent.click(button));

    const frames = screen.getAllByTitle(/^HTML preview /);
    expect(frames).toHaveLength(2);
    expect(frames[0].getAttribute("title")).not.toBe(
      frames[1].getAttribute("title"),
    );

    const srcDoc = frames[0].getAttribute("srcdoc") ?? "";
    expect(frames[0]).toHaveAttribute("sandbox", "allow-scripts");
    expect(srcDoc).toContain('http-equiv="Content-Security-Policy"');
    expect(srcDoc).toContain("default-src 'none'");
    expect(srcDoc).toContain("connect-src 'none'");
    expect(srcDoc.indexOf("Content-Security-Policy")).toBeLessThan(
      srcDoc.indexOf("<main>One</main>"),
    );
    expect(srcDoc.indexOf("Content-Security-Policy")).toBeLessThan(
      srcDoc.indexOf("const fakeHead"),
    );
    expect(srcDoc).toContain("title: document.title");
    expect(srcDoc).toContain("height: body.clientHeight");
    expect(srcDoc).not.toContain("height: Math.max(");
    expect(srcDoc).toContain("scrollWidth:");
    expect(srcDoc).toContain("clientWidth: window.innerWidth");
    const frameId = srcDoc.match(/id: '([^']+)'/)?.[1];
    expect(frameId).toBeTruthy();

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { id: frameId, height: 180, title: "Spoofed" },
          source: window,
        }),
      );
    });
    expect(onLoad).not.toHaveBeenCalled();
    expect(onLayoutMetrics).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            id: frameId,
            height: 180,
            title: "Report",
            scrollWidth: 840,
            clientWidth: 780,
          },
          source: (frames[0] as HTMLIFrameElement).contentWindow,
        }),
      );
    });

    await waitFor(() => {
      expect(frames[0].getAttribute("title")).toMatch(/: Report$/);
      expect(onLoad).toHaveBeenCalledWith("Report");
      expect(onLayoutMetrics).toHaveBeenCalledWith({
        scrollWidth: 840,
        clientWidth: 780,
      });
    });

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            id: frameId,
            height: 220,
            title: "Report",
            scrollWidth: 840,
            clientWidth: 780,
          },
          source: (frames[0] as HTMLIFrameElement).contentWindow,
        }),
      );
    });
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  test("treats updated code as a new document load", async () => {
    const onLoad = jest.fn();
    const view = render(
      <HTMLPreview
        code="<!DOCTYPE html><title>First</title>"
        accessibleTitle="HTML preview"
        onLoad={onLoad}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Run preview" }));
    const firstFrame = screen.getByTitle(/^HTML preview /);
    const firstFrameId = (firstFrame.getAttribute("srcdoc") ?? "").match(
      /id: '([^']+)'/,
    )?.[1];
    expect(firstFrameId).toBeTruthy();

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { id: firstFrameId, height: 120, title: "First" },
          source: (firstFrame as HTMLIFrameElement).contentWindow,
        }),
      );
    });
    await waitFor(() => expect(onLoad).toHaveBeenCalledWith("First"));

    view.rerender(
      <HTMLPreview
        code="<!DOCTYPE html><title>Second</title>"
        accessibleTitle="HTML preview"
        onLoad={onLoad}
      />,
    );

    expect(screen.queryByTitle(/^HTML preview /)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run preview" }));
    const secondFrame = screen.getByTitle(/^HTML preview /);
    const secondFrameId = (secondFrame.getAttribute("srcdoc") ?? "").match(
      /id: '([^']+)'/,
    )?.[1];
    expect(secondFrameId).toBeTruthy();
    expect(secondFrameId).not.toBe(firstFrameId);

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { id: secondFrameId, height: 140, title: "Second" },
          source: (secondFrame as HTMLIFrameElement).contentWindow,
        }),
      );
    });

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledTimes(2);
      expect(onLoad).toHaveBeenLastCalledWith("Second");
      expect(secondFrame.getAttribute("title")).toMatch(/: Second$/);
    });
  });

  test("treats an artifact id change as a new explicit execution", () => {
    const previewRef = createRef<HTMLPreviewHander>();
    const view = render(
      <HTMLPreview
        ref={previewRef}
        code="<main>Same code</main>"
        executionKey="artifact-a"
        accessibleTitle="HTML preview"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Run preview" }));
    const firstFrame = screen.getByTitle(/^HTML preview /);
    const firstSrcDoc = firstFrame.getAttribute("srcdoc") ?? "";

    act(() => previewRef.current?.reload());
    const reloadedFrame = screen.getByTitle(/^HTML preview /);
    expect(reloadedFrame.getAttribute("srcdoc")).not.toBe(firstSrcDoc);

    view.rerender(
      <HTMLPreview
        ref={previewRef}
        code="<main>Same code</main>"
        executionKey="artifact-b"
        accessibleTitle="HTML preview"
      />,
    );

    expect(screen.queryByTitle(/^HTML preview /)).not.toBeInTheDocument();
    act(() => previewRef.current?.reload());
    expect(screen.queryByTitle(/^HTML preview /)).not.toBeInTheDocument();

    view.rerender(
      <HTMLPreview
        ref={previewRef}
        code="<main>Same code</main>"
        executionKey="artifact-a"
        accessibleTitle="HTML preview"
      />,
    );

    expect(screen.queryByTitle(/^HTML preview /)).not.toBeInTheDocument();
    act(() => previewRef.current?.reload());
    expect(screen.queryByTitle(/^HTML preview /)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run preview" }));
    const secondFrame = screen.getByTitle(/^HTML preview /);
    expect(secondFrame.getAttribute("srcdoc")).not.toBe(firstSrcDoc);
  });
});
