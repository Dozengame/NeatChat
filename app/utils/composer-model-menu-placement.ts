export interface ComposerModelMenuRect {
  left: number;
  top: number;
  bottom: number;
  width: number;
}

export interface ComposerModelMenuViewport {
  left: number;
  top: number;
  width: number;
  height: number;
  layoutHeight: number;
}

interface ComposerModelMenuPlacementBase {
  left: number;
  width: number;
  maxHeight: number;
  gap: number;
}

export type ComposerModelMenuPlacement = ComposerModelMenuPlacementBase &
  (
    | { openBelow: true; top: number; bottom?: never }
    | { openBelow: false; top?: never; bottom: number }
  );

export function getComposerModelMenuPlacement(input: {
  buttonRect: ComposerModelMenuRect;
  composerRect: ComposerModelMenuRect;
  viewport: ComposerModelMenuViewport;
  compact: boolean;
  preferBelowOnDesktop: boolean;
}): ComposerModelMenuPlacement {
  const { buttonRect, composerRect, viewport } = input;
  const viewportRight = viewport.left + viewport.width;
  const viewportBottom = viewport.top + viewport.height;
  const viewportPadding = input.compact ? 12 : 16;
  const gap = input.compact ? 10 : 12;
  const width = Math.min(
    input.compact ? 360 : 380,
    Math.max(1, viewport.width - viewportPadding * 2),
  );
  const anchorCenter = input.compact
    ? composerRect.left + composerRect.width / 2
    : buttonRect.left + buttonRect.width / 2;
  const left = Math.max(
    viewport.left + viewportPadding,
    Math.min(anchorCenter - width / 2, viewportRight - width - viewportPadding),
  );
  const belowTop = composerRect.bottom + gap;
  const belowSpace = viewportBottom - belowTop - viewportPadding;
  const aboveSpace = composerRect.top - gap - viewport.top - viewportPadding;
  const preferredHeight = input.compact ? 230 : 250;
  const preferBelow =
    !input.compact &&
    input.preferBelowOnDesktop &&
    belowSpace >= preferredHeight;
  const openBelow =
    preferBelow || (aboveSpace < preferredHeight && belowSpace > aboveSpace);
  const maximumHeight = input.compact
    ? Math.min(420, viewport.height * 0.68)
    : 420;
  const maximumUsableHeight = Math.max(
    1,
    viewport.height - viewportPadding * 2,
  );
  const minimumUsableHeight = Math.min(96, maximumUsableHeight);
  const maxHeight = Math.min(
    maximumHeight,
    maximumUsableHeight,
    Math.max(minimumUsableHeight, openBelow ? belowSpace : aboveSpace),
  );

  if (openBelow) {
    return {
      left,
      top: Math.max(
        viewport.top + viewportPadding,
        Math.min(belowTop, viewportBottom - viewportPadding - maxHeight),
      ),
      width,
      maxHeight,
      gap,
      openBelow,
    };
  }

  return {
    left,
    // Bottom anchoring keeps the popover attached when its content is shorter
    // than maxHeight or changes between model and parameter views.
    bottom: Math.max(0, viewport.layoutHeight - composerRect.top + gap),
    width,
    maxHeight,
    gap,
    openBelow,
  };
}
