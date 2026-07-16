import {
  getComposerTextareaLayout,
  getComposerTextareaProbeWidths,
} from "../app/utils/composer-textarea-layout";

describe("composer textarea layout", () => {
  test("ignores wrapped placeholder metrics for an empty draft", () => {
    expect(
      getComposerTextareaLayout({
        value: "",
        expansionScrollHeight: 72,
        displayScrollHeight: 72,
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
        expansionScrollHeight: 24,
        displayScrollHeight: 24,
        lineHeight: 24,
        maxHeight: 174,
        previousExpanded: false,
        freezeExpanded: false,
      }),
    ).toEqual({ expanded: false, scrolling: false, height: 24 });

    expect(
      getComposerTextareaLayout({
        value: "two\nlines",
        expansionScrollHeight: 49,
        displayScrollHeight: 49,
        lineHeight: 24,
        maxHeight: 174,
        previousExpanded: false,
        freezeExpanded: false,
      }),
    ).toEqual({ expanded: true, scrolling: false, height: 49 });
  });

  test("keeps the state stable when Compact wraps but Expanded fits", () => {
    const transitionLayout = getComposerTextareaLayout({
      value: "a boundary-length mobile draft",
      expansionScrollHeight: 49,
      displayScrollHeight: 24,
      lineHeight: 24,
      maxHeight: 174,
      previousExpanded: false,
      freezeExpanded: false,
    });

    expect(transitionLayout).toEqual({
      expanded: true,
      scrolling: false,
      height: 24,
    });
    expect(
      getComposerTextareaLayout({
        value: "a boundary-length mobile draft",
        expansionScrollHeight: 49,
        displayScrollHeight: 24,
        lineHeight: 24,
        maxHeight: 174,
        previousExpanded: transitionLayout.expanded,
        freezeExpanded: false,
      }),
    ).toEqual(transitionLayout);
  });

  test("collapses after deletion makes the draft fit the Compact width", () => {
    expect(
      getComposerTextareaLayout({
        value: "shorter draft",
        expansionScrollHeight: 24,
        displayScrollHeight: 24,
        lineHeight: 24,
        maxHeight: 174,
        previousExpanded: true,
        freezeExpanded: false,
      }),
    ).toEqual({ expanded: false, scrolling: false, height: 24 });
  });

  test("caps long drafts and enables internal scrolling", () => {
    expect(
      getComposerTextareaLayout({
        value: "long draft",
        expansionScrollHeight: 280,
        displayScrollHeight: 280,
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
        expansionScrollHeight: 49,
        displayScrollHeight: 49,
        lineHeight: 24,
        maxHeight: 174,
        previousExpanded: false,
        freezeExpanded: true,
      }),
    ).toEqual({ expanded: false, scrolling: false, height: 24 });
  });

  test.each([
    {
      name: "mobile without voice",
      shellWidth: 370,
      controlWidths: [44, 124, 44],
      compactColumnGap: 4,
      compact: 130,
      expanded: 354,
    },
    {
      name: "mobile with voice",
      shellWidth: 370,
      controlWidths: [44, 124, 44, 44],
      compactColumnGap: 4,
      compact: 82,
      expanded: 354,
    },
    {
      name: "desktop without voice",
      shellWidth: 820,
      controlWidths: [44, 132, 44],
      compactColumnGap: 6,
      compact: 566,
      expanded: 800,
    },
  ])(
    "derives stable $name probe widths",
    ({ shellWidth, controlWidths, compactColumnGap, compact, expanded }) => {
      expect(
        getComposerTextareaProbeWidths({
          shellWidth,
          compactInlinePadding: 8,
          compactColumnGap,
          expandedInlinePadding: shellWidth < 600 ? 8 : 10,
          controlWidths,
        }),
      ).toEqual({ compact, expanded });
    },
  );

  test("keeps probe widths usable in an extremely narrow shell", () => {
    expect(
      getComposerTextareaProbeWidths({
        shellWidth: 40,
        compactInlinePadding: 8,
        compactColumnGap: 6,
        expandedInlinePadding: 10,
        controlWidths: [44, 132, 44],
      }),
    ).toEqual({ compact: 1, expanded: 20 });
  });
});
