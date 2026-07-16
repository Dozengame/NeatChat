export interface ComposerTextareaLayoutOptions {
  value: string;
  expansionScrollHeight: number;
  displayScrollHeight: number;
  lineHeight: number;
  maxHeight: number;
  previousExpanded: boolean;
  freezeExpanded?: boolean;
}

export interface ComposerTextareaLayout {
  expanded: boolean;
  scrolling: boolean;
  height: number;
}

export interface ComposerTextareaProbeWidthOptions {
  shellWidth: number;
  compactInlinePadding: number;
  compactColumnGap: number;
  expandedInlinePadding: number;
  controlWidths: number[];
}

export interface ComposerTextareaProbeWidths {
  compact: number;
  expanded: number;
}

export function getComposerTextareaProbeWidths({
  shellWidth,
  compactInlinePadding,
  compactColumnGap,
  expandedInlinePadding,
  controlWidths,
}: ComposerTextareaProbeWidthOptions): ComposerTextareaProbeWidths {
  const safeShellWidth = Math.max(1, shellWidth);
  const safeCompactPadding = Math.max(0, compactInlinePadding);
  const safeCompactGap = Math.max(0, compactColumnGap);
  const safeExpandedPadding = Math.max(0, expandedInlinePadding);
  const controlsWidth = controlWidths.reduce(
    (total, width) => total + Math.max(0, width),
    0,
  );
  const compactGaps = safeCompactGap * controlWidths.length;

  return {
    compact: Math.max(
      1,
      safeShellWidth - safeCompactPadding * 2 - controlsWidth - compactGaps,
    ),
    expanded: Math.max(1, safeShellWidth - safeExpandedPadding * 2),
  };
}

export function getComposerTextareaLayout({
  value,
  expansionScrollHeight,
  displayScrollHeight,
  lineHeight,
  maxHeight,
  previousExpanded,
  freezeExpanded = false,
}: ComposerTextareaLayoutOptions): ComposerTextareaLayout {
  const safeLineHeight = Math.max(1, lineHeight);
  const safeMaxHeight = Math.max(safeLineHeight, maxHeight);
  const expansionMeasuredHeight = Math.max(
    safeLineHeight,
    expansionScrollHeight,
  );
  const displayMeasuredHeight = Math.max(safeLineHeight, displayScrollHeight);
  const contentExpanded =
    value.length > 0 && expansionMeasuredHeight > safeLineHeight + 1;
  const expanded = freezeExpanded ? previousExpanded : contentExpanded;

  return {
    expanded,
    scrolling: expanded && displayMeasuredHeight > safeMaxHeight + 1,
    height: expanded
      ? Math.min(displayMeasuredHeight, safeMaxHeight)
      : safeLineHeight,
  };
}
