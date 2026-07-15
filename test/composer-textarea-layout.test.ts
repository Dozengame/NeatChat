import { getComposerTextareaLayout } from "../app/utils/composer-textarea-layout";

describe("composer textarea layout", () => {
  test("ignores wrapped placeholder metrics for an empty draft", () => {
    expect(
      getComposerTextareaLayout({
        value: "",
        scrollHeight: 72,
        lineHeight: 24,
        maxHeight: 174,
        previousExpanded: false,
        freezeExpanded: false,
      }),
    ).toEqual({ expanded: false, scrolling: false, height: 24 });
  });

  test("expands only for real multiline content", () => {
    expect(
      getComposerTextareaLayout({
        value: "one visual line",
        scrollHeight: 24,
        lineHeight: 24,
        maxHeight: 174,
        previousExpanded: false,
        freezeExpanded: false,
      }),
    ).toEqual({ expanded: false, scrolling: false, height: 24 });

    expect(
      getComposerTextareaLayout({
        value: "two\nlines",
        scrollHeight: 49,
        lineHeight: 24,
        maxHeight: 174,
        previousExpanded: false,
        freezeExpanded: false,
      }),
    ).toEqual({ expanded: true, scrolling: false, height: 49 });
  });

  test("caps long drafts and enables internal scrolling", () => {
    expect(
      getComposerTextareaLayout({
        value: "long draft",
        scrollHeight: 280,
        lineHeight: 24,
        maxHeight: 174,
        previousExpanded: true,
        freezeExpanded: false,
      }),
    ).toEqual({ expanded: true, scrolling: true, height: 174 });
  });

  test("freezes the content shape while a menu temporarily reallocates width", () => {
    expect(
      getComposerTextareaLayout({
        value: "one visual line",
        scrollHeight: 49,
        lineHeight: 24,
        maxHeight: 174,
        previousExpanded: false,
        freezeExpanded: true,
      }),
    ).toEqual({ expanded: false, scrolling: false, height: 24 });
  });
});
