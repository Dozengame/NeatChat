"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import clsx from "clsx";
import { showImageModal } from "./ui-lib-actions";

export function Mermaid(props: { code: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch((e) => {
          setHasError(true);
          console.error("[Mermaid] ", e.message);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.code]);

  function viewSvgInNewWindow() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: "image/svg+xml" });
    showImageModal(URL.createObjectURL(blob));
  }

  if (hasError) {
    return null;
  }

  return (
    <button
      type="button"
      className={clsx("no-dark", "mermaid")}
      ref={ref}
      onClick={() => viewSvgInNewWindow()}
      aria-label="Open Mermaid diagram preview"
    >
      {props.code}
    </button>
  );
}
