import { act, render, screen, waitFor } from "@testing-library/react";
import { HTMLPreview } from "../app/components/artifacts-preview";

let mockNanoIdCounter = 0;
jest.mock("nanoid", () => ({
  nanoid: () => `preview-${++mockNanoIdCounter}`,
}));

describe("HTMLPreview accessibility and message boundary", () => {
  test("uses unique stable titles and accepts metadata only from its own frame", async () => {
    const onLoad = jest.fn();
    render(
      <>
        <HTMLPreview
          code="<!DOCTYPE html><title>Report</title><main>One</main>"
          accessibleTitle="HTML preview"
          onLoad={onLoad}
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

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { id: frameId, height: 180, title: "Report" },
          source: (frames[0] as HTMLIFrameElement).contentWindow,
        }),
      );
    });

    await waitFor(() => {
      expect(frames[0].getAttribute("title")).toMatch(/: Report$/);
      expect(onLoad).toHaveBeenCalledWith("Report");
    });

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { id: frameId, height: 220, title: "Report" },
          source: (frames[0] as HTMLIFrameElement).contentWindow,
        }),
      );
    });
    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});
