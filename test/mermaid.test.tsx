import { render, screen, waitFor } from "@testing-library/react";
import mermaid from "mermaid";
import { Mermaid } from "../app/components/mermaid";

jest.mock("mermaid", () => ({
  __esModule: true,
  default: {
    run: jest.fn(),
  },
}));

jest.mock("../app/components/ui-lib-actions", () => ({
  showImageModal: jest.fn(),
}));

const runMermaid = mermaid.run as jest.MockedFunction<typeof mermaid.run>;

describe("Mermaid diagram rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("lets render failures reject so the fallback can render", async () => {
    runMermaid.mockRejectedValueOnce(new Error("bad diagram"));

    render(<Mermaid code="graph TD; A-->" />);

    await waitFor(() =>
      expect(screen.getByText("Diagram preview unavailable")).toBeVisible(),
    );

    expect(runMermaid).toHaveBeenCalledWith({
      nodes: [expect.any(HTMLButtonElement)],
    });
    expect(screen.getByText(/Mermaid source: graph TD; A-->/)).toBeVisible();
  });

  test("keeps successful diagrams as a preview button", async () => {
    runMermaid.mockResolvedValueOnce(undefined);

    render(<Mermaid code="graph TD; A-->B" />);

    const previewButton = screen.getByRole("button", {
      name: "Preview Mermaid diagram",
    });

    expect(previewButton).toHaveClass("mermaid");
    expect(previewButton).toHaveTextContent("graph TD; A-->B");
    await waitFor(() => expect(runMermaid).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
