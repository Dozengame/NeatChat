export interface ComposerPopoverRect {
  left: number;
  top: number;
  bottom: number;
  width: number;
}

export interface ComposerPopoverSegment {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ComposerPopoverInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ComposerPopoverViewport {
  left: number;
  top: number;
  width: number;
  height: number;
  layoutHeight: number;
  safeArea?: Partial<ComposerPopoverInsets>;
  segments?: ComposerPopoverSegment[];
}

export interface ComposerPopoverCollisionBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface ComposerPopoverPlacementBase {
  left: number;
  width: number;
  maxHeight: number;
  gap: number;
  collisionBounds: ComposerPopoverCollisionBounds;
  segmentIndex: number | null;
  layoutHeight: number;
}

export type ComposerPopoverPlacement = ComposerPopoverPlacementBase &
  (
    | { openBelow: true; top: number; bottom?: never }
    | { openBelow: false; top?: never; bottom: number }
  );

export type ComposerModelMenuRect = ComposerPopoverRect;
export type ComposerModelMenuViewport = ComposerPopoverViewport;
export type ComposerModelMenuPlacement = ComposerPopoverPlacement;

const emptyInsets: ComposerPopoverInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

function getRectRight(rect: ComposerPopoverRect) {
  return rect.left + rect.width;
}

function getSegmentBounds(segment: ComposerPopoverSegment) {
  return {
    left: segment.left,
    top: segment.top,
    right: segment.left + segment.width,
    bottom: segment.top + segment.height,
  };
}

function getIntersectionArea(
  first: ComposerPopoverCollisionBounds,
  second: ComposerPopoverCollisionBounds,
) {
  return (
    Math.max(
      0,
      Math.min(first.right, second.right) - Math.max(first.left, second.left),
    ) *
    Math.max(
      0,
      Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top),
    )
  );
}

function containsPoint(
  bounds: ComposerPopoverCollisionBounds,
  point: { x: number; y: number },
) {
  return (
    point.x >= bounds.left &&
    point.x <= bounds.right &&
    point.y >= bounds.top &&
    point.y <= bounds.bottom
  );
}

export function getComposerCollisionBounds(input: {
  composerRect: ComposerPopoverRect;
  triggerRect: ComposerPopoverRect;
  viewport: ComposerPopoverViewport;
  edgePadding: number;
}): {
  bounds: ComposerPopoverCollisionBounds;
  segmentIndex: number | null;
} {
  const safeArea = { ...emptyInsets, ...input.viewport.safeArea };
  const visualBounds: ComposerPopoverCollisionBounds = {
    left: input.viewport.left + safeArea.left,
    top: input.viewport.top + safeArea.top,
    right: input.viewport.left + input.viewport.width - safeArea.right,
    bottom: input.viewport.top + input.viewport.height - safeArea.bottom,
  };
  const composerBounds: ComposerPopoverCollisionBounds = {
    left: input.composerRect.left,
    top: input.composerRect.top,
    right: getRectRight(input.composerRect),
    bottom: input.composerRect.bottom,
  };
  const composerCenter = {
    x: input.composerRect.left + input.composerRect.width / 2,
    y:
      input.composerRect.top +
      Math.max(0, input.composerRect.bottom - input.composerRect.top) / 2,
  };
  const triggerCenter = {
    x: input.triggerRect.left + input.triggerRect.width / 2,
    y:
      input.triggerRect.top +
      Math.max(0, input.triggerRect.bottom - input.triggerRect.top) / 2,
  };

  let segmentIndex: number | null = null;
  let selectedBounds = visualBounds;
  const segments = input.viewport.segments ?? [];
  if (segments.length > 0) {
    const candidates = segments.map((segment, index) => {
      const bounds = getSegmentBounds(segment);
      return {
        bounds,
        index,
        containsComposer: containsPoint(bounds, composerCenter),
        containsTrigger: containsPoint(bounds, triggerCenter),
        intersectionArea: getIntersectionArea(bounds, composerBounds),
      };
    });
    candidates.sort(
      (first, second) =>
        Number(second.containsComposer) - Number(first.containsComposer) ||
        second.intersectionArea - first.intersectionArea ||
        Number(second.containsTrigger) - Number(first.containsTrigger) ||
        first.index - second.index,
    );
    const selected = candidates[0];
    const intersection = selected
      ? {
          left: Math.max(visualBounds.left, selected.bounds.left),
          top: Math.max(visualBounds.top, selected.bounds.top),
          right: Math.min(visualBounds.right, selected.bounds.right),
          bottom: Math.min(visualBounds.bottom, selected.bounds.bottom),
        }
      : visualBounds;
    if (
      selected &&
      intersection.right > intersection.left &&
      intersection.bottom > intersection.top
    ) {
      segmentIndex = selected.index;
      selectedBounds = intersection;
    }
  }

  const paddedBounds = {
    left: selectedBounds.left + input.edgePadding,
    top: selectedBounds.top + input.edgePadding,
    right: selectedBounds.right - input.edgePadding,
    bottom: selectedBounds.bottom - input.edgePadding,
  };
  if (
    paddedBounds.right <= paddedBounds.left ||
    paddedBounds.bottom <= paddedBounds.top
  ) {
    return { bounds: selectedBounds, segmentIndex };
  }

  return { bounds: paddedBounds, segmentIndex };
}

export function getComposerPopoverPlacement(input: {
  kind: "model" | "tools";
  triggerRect: ComposerPopoverRect;
  composerRect: ComposerPopoverRect;
  viewport: ComposerPopoverViewport;
  panelHeight?: number;
  compact: boolean;
  preferBelowOnDesktop: boolean;
}): ComposerPopoverPlacement {
  const edgePadding = input.compact ? 10 : 16;
  const gap = 12;
  const { bounds, segmentIndex } = getComposerCollisionBounds({
    composerRect: input.composerRect,
    triggerRect: input.triggerRect,
    viewport: input.viewport,
    edgePadding,
  });
  const availableWidth = Math.max(1, bounds.right - bounds.left);
  const useMobileModelWidth = input.compact && input.viewport.width <= 600;
  const targetWidth =
    input.kind === "model"
      ? useMobileModelWidth
        ? input.composerRect.width
        : Math.min(460, input.composerRect.width)
      : input.compact
      ? Math.min(280, input.composerRect.width)
      : 268;
  const width = Math.min(targetWidth, availableWidth);
  const idealLeft =
    input.kind === "tools"
      ? input.composerRect.left
      : getRectRight(input.composerRect) - width;
  const left = Math.max(bounds.left, Math.min(idealLeft, bounds.right - width));
  const belowTop = input.composerRect.bottom + gap;
  const belowSpace = Math.max(0, bounds.bottom - belowTop);
  const aboveSpace = Math.max(0, input.composerRect.top - gap - bounds.top);
  const maximumHeight =
    input.kind === "tools"
      ? 380
      : useMobileModelWidth
      ? Math.min(500, input.viewport.height * 0.56)
      : 500;
  const measuredHeight = Math.max(
    1,
    input.panelHeight ?? (input.kind === "tools" ? 228 : 250),
  );
  const desiredHeight = Math.min(maximumHeight, measuredHeight);
  const preferBelow = !input.compact && input.preferBelowOnDesktop;
  const preferredSpace = preferBelow ? belowSpace : aboveSpace;
  const alternateSpace = preferBelow ? aboveSpace : belowSpace;
  const openBelow =
    preferredSpace >= desiredHeight
      ? preferBelow
      : alternateSpace >= desiredHeight
      ? !preferBelow
      : belowSpace > aboveSpace;
  const directionalSpace = openBelow ? belowSpace : aboveSpace;
  const maxHeight = Math.max(1, Math.min(maximumHeight, directionalSpace));

  const basePlacement: ComposerPopoverPlacementBase = {
    left,
    width,
    maxHeight,
    gap,
    collisionBounds: bounds,
    segmentIndex,
    layoutHeight: input.viewport.layoutHeight,
  };
  if (openBelow) {
    return {
      ...basePlacement,
      top: belowTop,
      openBelow: true,
    };
  }

  return {
    ...basePlacement,
    bottom: Math.max(
      0,
      input.viewport.layoutHeight - input.composerRect.top + gap,
    ),
    openBelow: false,
  };
}

export function getComposerModelMenuPlacement(input: {
  buttonRect: ComposerModelMenuRect;
  composerRect: ComposerModelMenuRect;
  viewport: ComposerModelMenuViewport;
  compact: boolean;
  preferBelowOnDesktop: boolean;
}): ComposerModelMenuPlacement {
  return getComposerPopoverPlacement({
    kind: "model",
    triggerRect: input.buttonRect,
    composerRect: input.composerRect,
    viewport: input.viewport,
    compact: input.compact,
    preferBelowOnDesktop: input.preferBelowOnDesktop,
  });
}

export function toComposerPopoverCssVariables(
  placement: ComposerPopoverPlacement,
  containingBlock?: ComposerPopoverRect,
): Record<string, string> {
  const left = containingBlock
    ? placement.left - containingBlock.left
    : placement.left;
  const top =
    placement.openBelow && containingBlock
      ? placement.top - containingBlock.top
      : placement.openBelow
      ? placement.top
      : undefined;
  const globalBottom = placement.openBelow
    ? undefined
    : placement.layoutHeight - placement.bottom;
  const bottom =
    globalBottom === undefined
      ? undefined
      : containingBlock
      ? containingBlock.bottom - globalBottom
      : placement.bottom;

  return {
    "--chat-composer-popover-left": `${left}px`,
    "--chat-composer-popover-top": top === undefined ? "auto" : `${top}px`,
    "--chat-composer-popover-bottom":
      bottom === undefined ? "auto" : `${bottom}px`,
    "--chat-composer-popover-width": `${placement.width}px`,
    "--chat-composer-popover-max-height": `${placement.maxHeight}px`,
    "--chat-composer-popover-origin": placement.openBelow
      ? "top center"
      : "bottom center",
    "--chat-composer-popover-shift": placement.openBelow ? "8px" : "-8px",
  };
}
