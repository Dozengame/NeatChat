import { act, render, screen, waitFor } from "@testing-library/react";

let routeId = "artifact-a";

jest.mock("react-router", () => ({
  useParams: () => ({ id: routeId }),
}));

jest.mock("../app/components/artifacts-preview", () => {
  const React = jest.requireActual("react") as typeof import("react");
  return {
    HTMLPreview: React.forwardRef<
      unknown,
      {
        code: string;
        executionKey: string;
        onApprovalChange?: (isApproved: boolean) => void;
      }
    >(function MockHTMLPreview(
      { code, executionKey, onApprovalChange },
      _ref,
    ) {
      return (
        <>
          <div data-testid="artifact-preview">
            {executionKey}:{code}
          </div>
          <button type="button" onClick={() => onApprovalChange?.(true)}>
            Run preview
          </button>
        </>
      );
    }),
  };
});

jest.mock("../app/components/button", () => ({
  IconButton: ({
    aria,
    disabled,
    onClick,
  }: {
    aria?: string;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button
      aria-label={aria}
      disabled={disabled}
      onClick={onClick}
      type="button"
    />
  ),
}));

jest.mock("../app/components/artifacts-share-button", () => ({
  ArtifactsShareButton: () => null,
}));

jest.mock("../app/components/loading", () => ({
  Loading: () => <div>Loading</div>,
}));

jest.mock("../app/icons/github.svg", () => () => null);
jest.mock("../app/icons/reload.svg", () => () => null);

jest.mock("../app/components/ui-lib-actions", () => ({
  showToast: jest.fn(),
}));

import { Artifacts } from "../app/components/artifacts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe("Artifacts route loading", () => {
  test("aborts an old artifact request and cannot render its late response", async () => {
    const first = deferred<{ status: number; text: () => Promise<string> }>();
    const second = deferred<{ status: number; text: () => Promise<string> }>();
    let firstSignal: AbortSignal | undefined;
    const fetchMock = jest
      .fn()
      .mockImplementationOnce((_url, init: RequestInit) => {
        firstSignal = init.signal as AbortSignal;
        return first.promise;
      })
      .mockImplementationOnce(() => second.promise);
    global.fetch = fetchMock as typeof fetch;

    routeId = "artifact-a";
    const view = render(<Artifacts />);
    routeId = "artifact-b";
    view.rerender(<Artifacts />);

    expect(firstSignal?.aborted).toBe(true);

    await act(async () => {
      second.resolve({ status: 200, text: async () => "new-content" });
    });
    await waitFor(() => {
      expect(screen.getByTestId("artifact-preview")).toHaveTextContent(
        "artifact-b:new-content",
      );
    });
    const reloadButton = screen.getByRole("button", { name: /reload/i });
    expect(reloadButton).toBeDisabled();
    act(() => screen.getByRole("button", { name: "Run preview" }).click());
    expect(reloadButton).toBeEnabled();

    await act(async () => {
      first.resolve({ status: 200, text: async () => "stale-content" });
    });
    expect(screen.getByTestId("artifact-preview")).toHaveTextContent(
      "artifact-b:new-content",
    );
  });
});
