"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { showImageModal } from "./ui-lib-actions";
import Locale from "../locales";
import { shouldPromoteMarkdownSurface } from "../utils/markdown-surface-width";

export function Mermaid(props: { code: string }) {
  const figureRef = useRef<HTMLElement>(null);
  const ref = useRef<HTMLButtonElement>(null);
  const [failedCode, setFailedCode] = useState<string | null>(null);
  const [isWide, setIsWide] = useState(false);
  const hasError = failedCode === props.code;

  const syncDiagramWidth = useCallback(() => {
    const figure = figureRef.current;
    const svg = ref.current?.querySelector("svg");
    if (!figure || !svg) return;

    const viewBoxWidth =
      svg.viewBox?.baseVal?.width ||
      Number(svg.getAttribute("viewBox")?.trim().split(/\s+/)[2]);
    if (!Number.isFinite(viewBoxWidth)) return;

    setIsWide(
      (current) =>
        current ||
        shouldPromoteMarkdownSurface(viewBoxWidth, figure.clientWidth),
    );
  }, []);

  useEffect(() => {
    let disposed = false;
    let diagramResizeObserver: ResizeObserver | null = null;
    setFailedCode(null);

    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
        })
        .then(() => {
          if (disposed) return;
          syncDiagramWidth();

          if (typeof ResizeObserver !== "undefined" && figureRef.current) {
            diagramResizeObserver = new ResizeObserver(syncDiagramWidth);
            diagramResizeObserver.observe(figureRef.current);
          }
          window.addEventListener("resize", syncDiagramWidth);
        })
        .catch((error) => {
          if (disposed) return;

          const message =
            error instanceof Error ? error.message : String(error);
          setFailedCode(props.code);
          console.error("[Mermaid] ", message);
        });
    }

    return () => {
      disposed = true;
      diagramResizeObserver?.disconnect();
      window.removeEventListener("resize", syncDiagramWidth);
    };
  }, [props.code, syncDiagramWidth]);

  function viewSvgInNewWindow() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: "image/svg+xml" });
    showImageModal(URL.createObjectURL(blob));
  }

  if (hasError) {
    return (
      <div
        className="markdown-mermaid-fallback"
        data-markdown-width="normal"
        role="status"
        aria-live="polite"
      >
        <span className="markdown-mermaid-fallback-title">
          {Locale.NewChat.Mermaid.Unavailable}
        </span>
        <code className="markdown-mermaid-fallback-code">
          {Locale.NewChat.Mermaid.SourceLabel}
          {": "}
          {props.code}
        </code>
      </div>
    );
  }

  return (
    <figure
      ref={figureRef}
      className="markdown-mermaid-figure"
      data-markdown-width={isWide ? "wide" : "normal"}
    >
      <figcaption className="markdown-mermaid-caption">
        {Locale.NewChat.Mermaid.Caption}
      </figcaption>
      <button
        type="button"
        className="mermaid"
        ref={ref}
        onClick={() => viewSvgInNewWindow()}
        aria-label={Locale.NewChat.Mermaid.Preview}
        title={Locale.NewChat.Mermaid.Preview}
      >
        {props.code}
      </button>
      <details className="markdown-mermaid-source">
        <summary>{Locale.NewChat.Mermaid.SourceLabel}</summary>
        <code>{props.code}</code>
      </details>
    </figure>
  );
}
