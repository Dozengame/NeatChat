import {
  getComposerModelMenuPlacement,
  getComposerPopoverPlacement,
  toComposerPopoverCssVariables,
} from "../app/utils/composer-model-menu-placement";

const rect = (values: {
  left: number;
  top: number;
  bottom: number;
  width: number;
}) => values;

describe("composer model menu placement", () => {
  test("anchors variable-height desktop menus above the composer", () => {
    const composerRect = rect({
      left: 571,
      top: 865,
      bottom: 919,
      width: 828,
    });
    const placement = getComposerModelMenuPlacement({
      buttonRect: rect({
        left: 1052,
        top: 869,
        bottom: 913,
        width: 280,
      }),
      composerRect,
      compact: false,
      preferBelowOnDesktop: false,
      viewport: {
        left: 0,
        top: 0,
        width: 1650,
        height: 941,
        layoutHeight: 941,
      },
    });

    expect(placement).toMatchObject({
      openBelow: false,
      bottom: 88,
      gap: 12,
      width: 500,
    });
    expect(placement).not.toHaveProperty("top");
    for (const menuHeight of [217, 350, 420]) {
      const menuBottom = 941 - placement.bottom!;
      expect(composerRect.top - menuBottom).toBe(12);
      expect(menuBottom - menuHeight).toBeGreaterThanOrEqual(16);
    }
  });

  test("keeps compact reasoning and image panels ten pixels above", () => {
    const composerRect = rect({
      left: 63,
      top: 776,
      bottom: 832,
      width: 308,
    });
    const placement = getComposerModelMenuPlacement({
      buttonRect: rect({
        left: 281,
        top: 783,
        bottom: 827,
        width: 30,
      }),
      composerRect,
      compact: true,
      preferBelowOnDesktop: false,
      viewport: {
        left: 0,
        top: 0,
        width: 390,
        height: 844,
        layoutHeight: 844,
      },
    });

    expect(placement).toMatchObject({
      openBelow: false,
      bottom: 78,
      gap: 10,
      left: 63,
      width: 308,
    });
    expect(placement).not.toHaveProperty("top");
    for (const menuHeight of [225, 386]) {
      const menuBottom = 844 - placement.bottom!;
      expect(composerRect.top - menuBottom).toBe(10);
      expect(menuBottom - menuHeight).toBeGreaterThanOrEqual(12);
    }
  });

  test("opens an empty desktop composer below with a twelve-pixel gap", () => {
    const composerRect = rect({
      left: 633,
      top: 423,
      bottom: 485,
      width: 706,
    });
    const placement = getComposerModelMenuPlacement({
      buttonRect: rect({
        left: 993,
        top: 432,
        bottom: 476,
        width: 280,
      }),
      composerRect,
      compact: false,
      preferBelowOnDesktop: true,
      viewport: {
        left: 0,
        top: 0,
        width: 1440,
        height: 1024,
        layoutHeight: 1024,
      },
    });

    expect(placement).toMatchObject({
      openBelow: true,
      top: 497,
      gap: 12,
      width: 500,
    });
    expect(placement).not.toHaveProperty("bottom");
    expect(placement.top! - composerRect.bottom).toBe(12);
  });

  test("preserves the above anchor in an offset visual viewport", () => {
    const composerRect = rect({
      left: 420,
      top: 600,
      bottom: 654,
      width: 600,
    });
    const placement = getComposerModelMenuPlacement({
      buttonRect: rect({
        left: 760,
        top: 605,
        bottom: 649,
        width: 220,
      }),
      composerRect,
      compact: false,
      preferBelowOnDesktop: false,
      viewport: {
        left: 0,
        top: 200,
        width: 1200,
        height: 500,
        layoutHeight: 900,
      },
    });

    expect(placement).toMatchObject({
      openBelow: false,
      bottom: 312,
      gap: 12,
    });
    expect(placement).not.toHaveProperty("top");
    expect(composerRect.top - (900 - placement.bottom!)).toBe(12);
  });

  test("keeps tools and prompt library on the same collision path", () => {
    const composerRect = rect({
      left: 220,
      top: 430,
      bottom: 494,
      width: 760,
    });
    const triggerRect = rect({
      left: 220,
      top: 440,
      bottom: 484,
      width: 44,
    });
    const viewport = {
      left: 0,
      top: 0,
      width: 1200,
      height: 800,
      layoutHeight: 800,
    };

    const tools = getComposerPopoverPlacement({
      kind: "tools",
      triggerRect,
      composerRect,
      panelHeight: 228,
      compact: false,
      preferBelowOnDesktop: true,
      viewport,
    });
    expect(tools).toMatchObject({
      openBelow: true,
      left: 220,
      top: 506,
      width: 268,
      gap: 12,
    });

    const promptLibrary = getComposerPopoverPlacement({
      kind: "tools",
      triggerRect,
      composerRect,
      panelHeight: 500,
      compact: false,
      preferBelowOnDesktop: true,
      viewport,
    });
    expect(promptLibrary).toMatchObject({
      openBelow: false,
      bottom: 382,
      left: 220,
      width: 268,
      maxHeight: 380,
    });
  });

  test("intersects safe area and the segment containing the composer", () => {
    const placement = getComposerPopoverPlacement({
      kind: "model",
      triggerRect: rect({
        left: 980,
        top: 710,
        bottom: 754,
        width: 132,
      }),
      composerRect: rect({
        left: 650,
        top: 700,
        bottom: 764,
        width: 500,
      }),
      panelHeight: 420,
      compact: false,
      preferBelowOnDesktop: false,
      viewport: {
        left: 0,
        top: 0,
        width: 1200,
        height: 800,
        layoutHeight: 800,
        safeArea: { top: 0, right: 20, bottom: 0, left: 20 },
        segments: [
          { left: 0, top: 0, width: 580, height: 800 },
          { left: 620, top: 0, width: 580, height: 800 },
        ],
      },
    });

    expect(placement).toMatchObject({
      openBelow: false,
      left: 650,
      width: 500,
      bottom: 112,
      segmentIndex: 1,
    });
    expect(placement.collisionBounds.left).toBe(636);
    expect(placement.collisionBounds.right).toBe(1164);
  });

  test("uses the lower tabletop segment and visual viewport together", () => {
    const placement = getComposerPopoverPlacement({
      kind: "model",
      triggerRect: rect({
        left: 650,
        top: 910,
        bottom: 954,
        width: 132,
      }),
      composerRect: rect({
        left: 120,
        top: 900,
        bottom: 964,
        width: 660,
      }),
      panelHeight: 420,
      compact: false,
      preferBelowOnDesktop: false,
      viewport: {
        left: 0,
        top: 600,
        width: 900,
        height: 400,
        layoutHeight: 1200,
        safeArea: { top: 0, right: 0, bottom: 20, left: 0 },
        segments: [
          { left: 0, top: 0, width: 900, height: 580 },
          { left: 0, top: 600, width: 900, height: 600 },
        ],
      },
    });

    expect(placement).toMatchObject({
      openBelow: false,
      bottom: 312,
      maxHeight: 272,
      segmentIndex: 1,
    });
    expect(placement.collisionBounds).toMatchObject({ top: 616, bottom: 964 });
  });

  test("converts viewport coordinates for the nested tools containing block", () => {
    const placement = getComposerPopoverPlacement({
      kind: "tools",
      triggerRect: rect({ left: 100, top: 610, bottom: 654, width: 44 }),
      composerRect: rect({ left: 100, top: 600, bottom: 664, width: 700 }),
      panelHeight: 228,
      compact: false,
      preferBelowOnDesktop: false,
      viewport: {
        left: 0,
        top: 0,
        width: 1000,
        height: 800,
        layoutHeight: 800,
      },
    });
    const fixed = toComposerPopoverCssVariables(placement);
    const local = toComposerPopoverCssVariables(placement, {
      left: 80,
      top: 560,
      bottom: 800,
      width: 740,
    });

    expect(fixed["--chat-composer-popover-left"]).toBe("100px");
    expect(local["--chat-composer-popover-left"]).toBe("20px");
    expect(local["--chat-composer-popover-bottom"]).toBe("212px");
  });
});
