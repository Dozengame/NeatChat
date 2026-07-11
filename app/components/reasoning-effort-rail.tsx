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

type ReasoningEffortRailProps = {
  id: string;
  ariaLabel: string;
  title: string;
  backLabel: string;
  efforts: readonly OpenAIChatReasoningEffort[];
  allowedEfforts: readonly OpenAIChatReasoningEffort[];
  value: OpenAIChatReasoningEffort;
  locked: boolean;
  lockedLabel: string;
  labels: Record<OpenAIChatReasoningEffort, string>;
  descriptions: Record<OpenAIChatReasoningEffort, string>;
  onChange: (effort: OpenAIChatReasoningEffort) => void;
  onBack: () => void;
  onLockedAttempt: () => void;
};

export function ReasoningEffortRail({
  id,
  ariaLabel,
  title,
  backLabel,
  efforts,
  allowedEfforts,
  value,
  locked,
  lockedLabel,
  labels,
  descriptions,
  onChange,
  onBack,
  onLockedAttempt,
}: ReasoningEffortRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [dragEffort, setDragEffort] = useState<OpenAIChatReasoningEffort>();
  const [dragging, setDragging] = useState(false);
  const visibleEfforts = useMemo(
    () => canonicalizeReasoningEfforts(efforts, value),
    [efforts, value],
  );
  const allowed = useMemo(
    () => new Set(canonicalizeReasoningEfforts(allowedEfforts)),
    [allowedEfforts],
  );
  const selectableEfforts = useMemo(
    () => visibleEfforts.filter((effort) => allowed.has(effort)),
    [allowed, visibleEfforts],
  );
  const displayValue = dragEffort ?? value;
  const selectedIndex = Math.max(0, visibleEfforts.indexOf(displayValue));
  const highestAllowedEffort = selectableEfforts[selectableEfforts.length - 1];
  const isHighest =
    selectableEfforts.length > 1 && displayValue === highestAllowedEffort;
  const readonly =
    selectableEfforts.length === 0 ||
    (selectableEfforts.length === 1 && allowed.has(value));
  const ariaDisabled = locked || readonly;
  const descriptionId = `${id}-description`;

  useEffect(() => {
    setDragEffort(undefined);
  }, [value, efforts]);

  const positionFromPointer = (clientX: number) => {
    const rail = railRef.current;
    if (!rail || visibleEfforts.length <= 1) return 0;

    const rect = rail.getBoundingClientRect();
    const computedThumbSize = Number.parseFloat(
      getComputedStyle(rail).getPropertyValue("--reasoning-rail-thumb-size"),
    );
    const thumbRadius = Number.isFinite(computedThumbSize)
      ? computedThumbSize / 2
      : 17;
    const usableWidth = Math.max(1, rect.width - thumbRadius * 2);
    const normalized = Math.min(
      1,
      Math.max(0, (clientX - rect.left - thumbRadius) / usableWidth),
    );
    return normalized * (visibleEfforts.length - 1);
  };

  const effortFromPointer = (clientX: number) =>
    getNearestAllowedReasoningEffort(
      positionFromPointer(clientX),
      visibleEfforts,
      selectableEfforts,
    );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (locked) {
      onLockedAttempt();
      return;
    }
    if (readonly) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setDragEffort(effortFromPointer(event.clientX));
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setDragEffort(effortFromPointer(event.clientX));
  };

  const finishPointerInteraction = (
    event: ReactPointerEvent<HTMLDivElement>,
    commit: boolean,
  ) => {
    if (!dragging) return;
    event.preventDefault();
    event.stopPropagation();
    const nextEffort = commit
      ? effortFromPointer(event.clientX) ?? dragEffort
      : undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    setDragEffort(undefined);
    if (commit && nextEffort && nextEffort !== value) onChange(nextEffort);
  };

  const handleLostPointerCapture = () => {
    if (!dragging) return;
    setDragging(false);
    setDragEffort(undefined);
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

    const nextEffort = getKeyboardReasoningEffort(
      value,
      event.key,
      selectableEfforts,
    );
    if (nextEffort && nextEffort !== value) onChange(nextEffort);
  };

  const stopCount = Math.max(visibleEfforts.length, 1);
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
      <div className={styles.heading}>
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
        aria-valuemax={Math.max(0, visibleEfforts.length - 1)}
        aria-valuenow={selectedIndex}
        aria-valuetext={labels[displayValue]}
        aria-disabled={ariaDisabled}
        data-model-menu-control="true"
        data-effort={displayValue}
        data-stop-count={visibleEfforts.length}
        data-highest={isHighest}
        data-locked={locked}
        title={locked ? lockedLabel : labels[displayValue]}
        style={
          {
            "--reasoning-rail-position": `${activePosition}%`,
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
            {visibleEfforts.map((effort, index) => (
              <span
                key={effort}
                className={clsx(styles.stop, {
                  [styles.stopSelected]: effort === displayValue,
                  [styles.stopCurrentOnly]: !allowed.has(effort),
                })}
                style={
                  {
                    "--reasoning-rail-stop-position":
                      visibleEfforts.length <= 1
                        ? "0%"
                        : `${(index / (visibleEfforts.length - 1)) * 100}%`,
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
