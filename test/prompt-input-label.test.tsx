import { render, screen } from "@testing-library/react";
import { PromptInput } from "../app/components/ui-lib-prompt-input";

describe("PromptInput label", () => {
  test("keeps the value-derived fallback label when no explicit aria label is provided", () => {
    const { rerender } = render(
      <PromptInput value="existing prompt value" onChange={jest.fn()} />,
    );

    expect(
      screen.getByRole("textbox", { name: "existing prompt value" }),
    ).toHaveValue("existing prompt value");

    rerender(<PromptInput value="" onChange={jest.fn()} />);

    expect(screen.getByRole("textbox", { name: "Prompt input" })).toHaveValue(
      "",
    );
  });

  test("uses an explicit aria label instead of exposing edited content as the textbox name", () => {
    render(
      <PromptInput
        value="private file content"
        ariaLabel="编辑第 1 个文件附件：notes.txt内容"
        onChange={jest.fn()}
      />,
    );

    expect(
      screen.getByRole("textbox", {
        name: "编辑第 1 个文件附件：notes.txt内容",
      }),
    ).toHaveValue("private file content");
    expect(
      screen.queryByRole("textbox", { name: "private file content" }),
    ).not.toBeInTheDocument();
  });

  test("marks long prompt editing surfaces without changing rows or label semantics", () => {
    const { rerender } = render(
      <PromptInput
        value="long editable content"
        ariaLabel="编辑消息"
        rows={10}
        onChange={jest.fn()}
      />,
    );

    const longInput = screen.getByRole("textbox", { name: "编辑消息" });
    expect(longInput).toHaveAttribute("rows", "10");
    expect(longInput).toHaveAttribute("data-long-input", "true");

    rerender(
      <PromptInput
        value="short editable content"
        ariaLabel="短文本"
        rows={3}
        onChange={jest.fn()}
      />,
    );

    const shortInput = screen.getByRole("textbox", { name: "短文本" });
    expect(shortInput).toHaveAttribute("rows", "3");
    expect(shortInput).not.toHaveAttribute("data-long-input");
  });
});
