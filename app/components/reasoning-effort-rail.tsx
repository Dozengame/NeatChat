import React, {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

import {
  OPENAI_RESPONSES_REASONING_EFFORTS,
  OpenAIChatReasoningEffort,
} from "../utils/openai-responses";

import styles from "./reasoning-effort-rail.module.scss";

const canonicalEffortIndex = new Map<OpenAIChatReasoningEffort, number>(
  OPENAI_RESPONSES_REASONING_EFFORTS.map((effort, index) => [effort, index]),
);

export function canonicalizeReasoningEfforts(
  efforts: readonly OpenAIChatReasoningEffort[],
  current?: OpenAIChatReasoningEffort,
) {
  const uniqueEfforts = new Set(efforts);
  if (current) uniqueEfforts.add(current);

  return OPENAI_RESPONSES_REASONING_EFFORTS.filter((effort) =>
    uniqueEfforts.has(effort),
  );
}

export function getNearestAllowedReasoningEffort(
  position: number,
  visibleEfforts: readonly OpenAIChatReasoningEffort[],
  allowedEfforts: readonly OpenAIChatReasoningEffort[],
) {
  const allowed = new Set(allowedEfforts);
  const selectable = visibleEfforts
    .map((effort, index) => ({ effort, index }))
    .filter(({ effort }) => allowed.has(effort));

  if (selectable.length === 0) return undefined;

  return selectable.reduce((nearest, candidate) => {
    const candidateDistance = Math.abs(candidate.index - position);
    const nearestDistance = Math.abs(nearest.index - position);
    return candidateDistance < nearestDistance ? candidate : nearest;
  }).effort;
}

export function getKeyboardReasoningEffort(
  value: OpenAIChatReasoningEffort,
  key: string,
  allowedEfforts: readonly OpenAIChatReasoningEffort[],
) {
  const allowed = canonicalizeReasoningEfforts(allowedEfforts);
  if (allowed.length === 0) return undefined;
  if (key === "Home") return allowed[0];
  if (key === "End") return allowed[allowed.length - 1];

  const currentCanonicalIndex = canonicalEffortIndex.get(value) ?? 0;
  const moveForward = key === "ArrowRight" || key === "ArrowUp";
  const moveBackward = key === "ArrowLeft" || key === "ArrowDown";
  if (!moveForward && !moveBackward) return undefined;

  const candidates = allowed.filter((effort) => {
    const index = canonicalEffortIndex.get(effort) ?? 0;
    return moveForward
      ? index > currentCanonicalIndex
      : index < currentCanonicalIndex;
  });

  if (candidates.length === 0) {
    return moveForward ? allowed[allowed.length - 1] : allowed[0];
  }
  return moveForward ? candidates[0] : candidates[candidates.length - 1];
}

export function getNearestAllowedDiscreteOption<T extends string>(
  position: number,
  visibleOptions: readonly T[],
  allowedOptions: readonly T[],
) {
  const allowed = new Set(allowedOptions);
  const selectable = visibleOptions
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => allowed.has(option));

  if (selectable.length === 0) return undefined;

  return selectable.reduce((nearest, candidate) => {
    const candidateDistance = Math.abs(candidate.index - position);
    const nearestDistance = Math.abs(nearest.index - position);
    return candidateDistance < nearestDistance ? candidate : nearest;
  }).option;
}

export function getKeyboardDiscreteOption<T extends string>(
  value: T,
  key: string,
  visibleOptions: readonly T[],
  allowedOptions: readonly T[],
) {
  const allowed = new Set(allowedOptions);
  const selectable = visibleOptions.filter((option) => allowed.has(option));
  if (selectable.length === 0) return undefined;
  if (key === "Home") return selectable[0];
  if (key === "End") return selectable[selectable.length - 1];

  const currentIndex = visibleOptions.indexOf(value);
  const moveForward = key === "ArrowRight" || key === "ArrowUp";
  const moveBackward = key === "ArrowLeft" || key === "ArrowDown";
  if (!moveForward && !moveBackward) return undefined;

  const candidates = selectable.filter((option) => {
    const index = visibleOptions.indexOf(option);
    return moveForward ? index > currentIndex : index < currentIndex;
  });

  if (candidates.length === 0) {
    return moveForward ? selectable[selectable.length - 1] : selectable[0];
  }
  return moveForward ? candidates[0] : candidates[candidates.length - 1];
}

export type DiscreteOptionRailProps<T extends string> = {
  id: string;
  ariaLabel: string;
  title: string;
  backLabel?: string;
  options: readonly T[];
  allowedOptions: readonly T[];
  value: T;
  locked: boolean;
  lockedLabel: string;
  labels: Record<T, string>;
  descriptions: Record<T, string>;
  emphasizeHighest?: boolean;
  onChange: (option: T) => void;
  onBack?: () => void;
  onLockedAttempt: () => void;
};

export function DiscreteOptionRail<T extends string>({
  id,
  ariaLabel,
  title,
  backLabel,
  options,
  allowedOptions,
  value,
  locked,
  lockedLabel,
  labels,
  descriptions,
  emphasizeHighest = true,
  onChange,
  onBack,
  onLockedAttempt,
}: DiscreteOptionRailProps<T>) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragGeometryRef = useRef<{
    left: number;
    usableWidth: number;
  }>();
  const [dragOption, setDragOption] = useState<T>();
  const [dragging, setDragging] = useState(false);
  const visibleOptions = useMemo(
    () => Array.from(new Set([...options, value])),
    [options, value],
  );
  const allowed = useMemo(() => new Set(allowedOptions), [allowedOptions]);
  const selectableOptions = useMemo(
    () => visibleOptions.filter((option) => allowed.has(option)),
    [allowed, visibleOptions],
  );
  const displayValue = dragOption ?? value;
  const selectedIndex = Math.max(0, visibleOptions.indexOf(displayValue));
  const highestAllowedOption = selectableOptions[selectableOptions.length - 1];
  const isHighest =
    emphasizeHighest &&
    selectableOptions.length > 1 &&
    displayValue === highestAllowedOption;
  const readonly =
    selectableOptions.length === 0 ||
    (selectableOptions.length === 1 && allowed.has(value));
  const ariaDisabled = locked || readonly;
  const descriptionId = `${id}-description`;
  const visibleOptionsKey = visibleOptions.join("\u001f");

  useEffect(() => {
    setDragOption(undefined);
  }, [value, visibleOptionsKey]);

  const measureRailGeometry = () => {
    const rail = railRef.current;
    if (!rail) return undefined;

    const rect = rail.getBoundingClientRect();
    const computedThumbSize = Number.parseFloat(
      getComputedStyle(rail).getPropertyValue("--reasoning-rail-thumb-size"),
    );
    const thumbRadius = Number.isFinite(computedThumbSize)
      ? computedThumbSize / 2
      : 17;
    return {
      left: rect.left + thumbRadius,
      usableWidth: Math.max(1, rect.width - thumbRadius * 2),
    };
  };

  const positionFromPointer = (clientX: number) => {
    if (visibleOptions.length <= 1) return 0;
    const geometry = dragGeometryRef.current ?? measureRailGeometry();
    if (!geometry) return 0;
    const normalized = Math.min(
      1,
      Math.max(0, (clientX - geometry.left) / geometry.usableWidth),
    );
    return normalized * (visibleOptions.length - 1);
  };

  const optionFromPointer = (clientX: number) =>
    getNearestAllowedDiscreteOption(
      positionFromPointer(clientX),
      visibleOptions,
      selectableOptions,
    );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.isPrimary === false || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (locked) {
      onLockedAttempt();
      return;
    }
    if (readonly) return;

    event.currentTarget.focus({ preventScroll: true });
    dragGeometryRef.current = measureRailGeometry();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setDragOption(optionFromPointer(event.clientX));
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const nextOption = optionFromPointer(event.clientX);
    setDragOption((current) => (current === nextOption ? current : nextOption));
  };

  const finishPointerInteraction = (
    event: ReactPointerEvent<HTMLDivElement>,
    commit: boolean,
  ) => {
    if (!dragging) return;
    event.preventDefault();
    event.stopPropagation();
    const nextOption = commit
      ? optionFromPointer(event.clientX) ?? dragOption
      : undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    setDragOption(undefined);
    dragGeometryRef.current = undefined;
    if (commit && nextOption && nextOption !== value) onChange(nextOption);
  };

  const handleLostPointerCapture = () => {
    if (!dragging) return;
    setDragging(false);
    setDragOption(undefined);
    dragGeometryRef.current = undefined;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const handledKeys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (!handledKeys.includes(event.key)) return;

    event.preventDefault();
    event.stopPropagation();
    if (locked) {
      onLockedAttempt();
      return;
    }
    if (readonly) return;

    const nextOption = getKeyboardDiscreteOption(
      value,
      event.key,
      visibleOptions,
      selectableOptions,
    );
    if (nextOption && nextOption !== value) onChange(nextOption);
  };

  const stopCount = Math.max(visibleOptions.length, 1);
  const activePosition =
    stopCount <= 1 ? 0 : (selectedIndex / (stopCount - 1)) * 100;

  return (
    <section
      className={clsx(styles.panel, {
        [styles.highest]: isHighest,
        [styles.dragging]: dragging,
        [styles.readonly]: readonly,
        [styles.locked]: locked,
      })}
    >
      <div
        className={clsx(styles.heading, {
          [styles.headingNoBack]: !onBack,
        })}
      >
        {onBack && backLabel && (
          <button
            type="button"
            className={styles.back}
            onClick={onBack}
            data-model-menu-control="true"
            aria-label={backLabel}
            title={backLabel}
          >
            ‹
          </button>
        )}
        <div className={styles.copy}>
          <strong>{title}</strong>
          <span id={descriptionId}>{descriptions[displayValue]}</span>
        </div>
        <span className={styles.value} aria-hidden="true">
          {labels[displayValue]}
        </span>
      </div>

      <div
        id={id}
        ref={railRef}
        className={styles.rail}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-describedby={descriptionId}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, visibleOptions.length - 1)}
        aria-valuenow={selectedIndex}
        aria-valuetext={labels[displayValue]}
        aria-disabled={ariaDisabled}
        data-model-menu-control="true"
        data-effort={displayValue}
        data-option={displayValue}
        data-stop-count={visibleOptions.length}
        data-highest={isHighest}
        data-locked={locked}
        title={locked ? lockedLabel : labels[displayValue]}
        style={
          {
            "--reasoning-rail-position": `${activePosition}%`,
            "--reasoning-rail-fill-scale": activePosition / 100,
            "--reasoning-rail-stop-count": stopCount,
          } as React.CSSProperties
        }
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishPointerInteraction(event, true)}
        onPointerCancel={(event) => finishPointerInteraction(event, false)}
        onLostPointerCapture={handleLostPointerCapture}
      >
        <span className={styles.track} aria-hidden="true">
          <span className={styles.fill} />
          <span className={styles.sparkles} />
          <span className={styles.stops}>
            {visibleOptions.map((option, index) => (
              <span
                key={option}
                className={clsx(styles.stop, {
                  [styles.stopSelected]: option === displayValue,
                  [styles.stopCurrentOnly]: !allowed.has(option),
                })}
                style={
                  {
                    "--reasoning-rail-stop-position":
                      visibleOptions.length <= 1
                        ? "0%"
                        : `${(index / (visibleOptions.length - 1)) * 100}%`,
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
        </span>
        <span className={styles.thumbLane} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </div>
    </section>
  );
}

type ReasoningEffortRailProps = {
  id: string;
  ariaLabel: string;
  title: string;
  backLabel?: string;
  efforts: readonly OpenAIChatReasoningEffort[];
  allowedEfforts: readonly OpenAIChatReasoningEffort[];
  value: OpenAIChatReasoningEffort;
  locked: boolean;
  lockedLabel: string;
  labels: Record<OpenAIChatReasoningEffort, string>;
  descriptions: Record<OpenAIChatReasoningEffort, string>;
  onChange: (effort: OpenAIChatReasoningEffort) => void;
  onBack?: () => void;
  onLockedAttempt: () => void;
};

export function ReasoningEffortRail({
  efforts,
  allowedEfforts,
  value,
  ...props
}: ReasoningEffortRailProps) {
  return (
    <DiscreteOptionRail
      {...props}
      options={canonicalizeReasoningEfforts(efforts, value)}
      allowedOptions={canonicalizeReasoningEfforts(allowedEfforts)}
      value={value}
    />
  );
}
