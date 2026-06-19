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
});
