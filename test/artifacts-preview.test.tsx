import { act, render, screen, waitFor } from "@testing-library/react";
import { HTMLPreview } from "../app/components/artifacts-preview";

let mockNanoIdCounter = 0;
jest.mock("nanoid", () => ({
  nanoid: () => `preview-${++mockNanoIdCounter}`,
}));

describe("HTMLPreview accessibility and message boundary", () => {
  test("uses unique stable titles and accepts metadata only from its own frame", async () => {
    const onLoad = jest.fn();
    const onLayoutMetrics = jest.fn();
    render(
      <>
        <HTMLPreview
          code="<!DOCTYPE html><title>Report</title><main>One</main>"
          accessibleTitle="HTML preview"
          onLoad={onLoad}
          onLayoutMetrics={onLayoutMetrics}
        />
        <HTMLPreview code="<main>Two</main>" accessibleTitle="HTML preview" />
      </>,
    );

    const frames = screen.getAllByTitle(/^HTML preview /);
    expect(frames).toHaveLength(2);
    expect(frames[0].getAttribute("title")).not.toBe(
      frames[1].getAttribute("title"),
    );

    const srcDoc = frames[0].getAttribute("srcdoc") ?? "";
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
});
