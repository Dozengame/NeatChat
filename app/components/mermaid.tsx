"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { showImageModal } from "./ui-lib-actions";
import Locale from "../locales";

export function Mermaid(props: { code: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [failedCode, setFailedCode] = useState<string | null>(null);
  const hasError = failedCode === props.code;

  useEffect(() => {
    let disposed = false;
    setFailedCode(null);

    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
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
    };
  }, [props.code]);

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
    <figure className="markdown-mermaid-figure">
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
