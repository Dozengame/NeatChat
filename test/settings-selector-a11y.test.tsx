import { fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { Selector, SimpleSelector } from "../app/components/ui-lib-components";

function SelectorHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Open language
      </button>
      {open && (
        <SimpleSelector
          ariaLabel="Choose language"
          items={[
            { title: "English", value: "en" },
            { title: "中文", value: "cn" },
          ]}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SearchableSelectorHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open model
      </button>
      {open && (
        <Selector
          ariaLabel="Choose model"
          items={[
            { title: "Alpha", value: "alpha" },
            { title: "Beta", value: "beta" },
          ]}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

describe("Settings mobile selector accessibility", () => {
  test("owns focus, traps Tab, and restores the trigger after Escape", () => {
    render(<SelectorHarness />);
    const trigger = screen.getByRole("button", { name: "Open language" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Choose language" });
    const english = screen.getByRole("button", { name: "English" });
    const chinese = screen.getByRole("button", { name: "中文" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(english).toHaveFocus();

    chinese.focus();
    fireEvent.keyDown(chinese, { key: "Tab" });
    expect(english).toHaveFocus();

    fireEvent.keyDown(english, { key: "Tab", shiftKey: true });
    expect(chinese).toHaveFocus();

    fireEvent.keyDown(chinese, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  test("does not leak Escape to the Settings page navigation handler", () => {
    const documentEscape = jest.fn();
    document.addEventListener("keydown", documentEscape);
    render(<SelectorHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Open language" }));

    fireEvent.keyDown(screen.getByRole("button", { name: "English" }), {
      key: "Escape",
    });

    expect(documentEscape).not.toHaveBeenCalled();
    document.removeEventListener("keydown", documentEscape);
  });

  test("gives the searchable selector one focus scope and restores its trigger", () => {
    render(<SearchableSelectorHarness />);
    const trigger = screen.getByRole("button", { name: "Open model" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Choose model" });
    const search = screen.getByRole("textbox", { name: "Search models" });
    const beta = screen.getByRole("button", { name: "Beta" });

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(search).toHaveFocus();

    beta.focus();
    fireEvent.keyDown(beta, { key: "Tab" });
    expect(search).toHaveFocus();

    fireEvent.keyDown(search, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Choose model" })).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
