import { render, screen } from "@testing-library/react";
import Locale from "../app/locales";
import { ToolsList } from "../app/components/mcp-market/tools-list";

describe("MCP market tools list", () => {
  test("shows loading before empty content while tools are pending", () => {
    render(<ToolsList isLoading tools={null} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      Locale.Mcp.Market.ToolsModal.Loading,
    );
    expect(
      screen.queryByText(Locale.Mcp.Market.ToolsModal.NoTools),
    ).not.toBeInTheDocument();
  });

  test("shows an alert when loading tools fails", () => {
    render(
      <ToolsList
        error={Locale.Mcp.Market.Errors.ToolsLoadFailed}
        isLoading={false}
        tools={null}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      Locale.Mcp.Market.Errors.ToolsLoadFailed,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      Locale.Mcp.Market.ToolsModal.LoadFailedHint,
    );
    expect(
      screen.queryByText(Locale.Mcp.Market.ToolsModal.NoTools),
    ).not.toBeInTheDocument();
  });

  test("shows empty state only after a successful empty response", () => {
    render(<ToolsList isLoading={false} tools={{ tools: [] }} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      Locale.Mcp.Market.ToolsModal.NoTools,
    );
  });

  test("renders successful tool responses as a list", () => {
    render(
      <ToolsList
        isLoading={false}
        tools={{
          tools: [
            {
              name: "image.generate",
              description: "Create an image from a prompt",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("list", { name: Locale.Mcp.Market.Actions.Tools }),
    ).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("image.generate");
    expect(screen.getByRole("listitem")).toHaveTextContent(
      "Create an image from a prompt",
    );
  });
});
