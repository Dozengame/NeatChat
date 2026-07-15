export interface ComposerTextareaLayoutOptions {
  value: string;
  scrollHeight: number;
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

export function getComposerTextareaLayout({
  value,
  scrollHeight,
  lineHeight,
  maxHeight,
  previousExpanded,
  freezeExpanded = false,
}: ComposerTextareaLayoutOptions): ComposerTextareaLayout {
  const safeLineHeight = Math.max(1, lineHeight);
  const safeMaxHeight = Math.max(safeLineHeight, maxHeight);
  const measuredHeight = Math.max(safeLineHeight, scrollHeight);
  const contentExpanded =
    value.length > 0 && measuredHeight > safeLineHeight + 1;
  const expanded = freezeExpanded ? previousExpanded : contentExpanded;

  return {
    expanded,
    scrolling: expanded && measuredHeight > safeMaxHeight + 1,
    height: expanded ? Math.min(measuredHeight, safeMaxHeight) : safeLineHeight,
  };
}
