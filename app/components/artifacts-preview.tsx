import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { nanoid } from "nanoid";
import styles from "./artifacts.module.scss";

type HTMLPreviewProps = {
  code: string;
  accessibleTitle?: string;
  autoHeight?: boolean;
  height?: number | string;
  onLoad?: (title?: string) => void;
  onLayoutMetrics?: (metrics: HTMLPreviewLayoutMetrics) => void;
  onApprovalChange?: (isApproved: boolean) => void;
  runLabel?: string;
  executionKey?: string;
};

export type HTMLPreviewLayoutMetrics = {
  scrollWidth: number;
  clientWidth: number;
};

export type HTMLPreviewHander = {
  reload: () => void;
};

export const HTMLPreview = forwardRef<HTMLPreviewHander, HTMLPreviewProps>(
  function HTMLPreview(props, ref) {
    const {
      accessibleTitle = "HTML preview",
      autoHeight,
      code,
      height: configuredHeight,
      onLoad,
      onLayoutMetrics,
      onApprovalChange,
      runLabel = "Run preview",
      executionKey = "",
    } = props;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const runButtonRef = useRef<HTMLButtonElement>(null);
    const loadedFrameRef = useRef<string | null>(null);
    const focusIframeAfterApprovalRef = useRef(false);
    const previewHadFocusRef = useRef(false);
    const [previewId] = useState(() => nanoid(6));
    const [reloadRevision, setReloadRevision] = useState(0);
    const documentIdentity = useMemo(
      () => ({ token: nanoid(8), code, executionKey }),
      [code, executionKey],
    );
    const [approvedDocumentIdentity, setApprovedDocumentIdentity] = useState<
      string | null
    >(null);
    const isApproved = approvedDocumentIdentity === documentIdentity.token;
    const previousDocumentIdentityRef = useRef(documentIdentity.token);
    const frameId = useMemo(
      () =>
        `${previewId}-${nanoid(8)}-${reloadRevision}-${documentIdentity.token}`,
      [documentIdentity, previewId, reloadRevision],
    );
    const [iframeHeight, setIframeHeight] = useState(600);
    const [title, setTitle] = useState("");

    useEffect(() => {
      onApprovalChange?.(isApproved);
    }, [isApproved, onApprovalChange]);

    useLayoutEffect(() => {
      const identityChanged =
        previousDocumentIdentityRef.current !== documentIdentity.token;
      previousDocumentIdentityRef.current = documentIdentity.token;

      if (identityChanged) {
        focusIframeAfterApprovalRef.current = false;
        if (previewHadFocusRef.current) {
          previewHadFocusRef.current = false;
          runButtonRef.current?.focus();
        }
        return;
      }

      if (isApproved && focusIframeAfterApprovalRef.current) {
        focusIframeAfterApprovalRef.current = false;
        iframeRef.current?.focus();
      }
    }, [documentIdentity.token, isApproved]);

    useEffect(() => {
      loadedFrameRef.current = null;
      setIframeHeight(600);
      setTitle("");
    }, [frameId]);

    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (
          event.source !== iframeRef.current?.contentWindow ||
          typeof event.data !== "object" ||
          event.data === null ||
          event.data.id !== frameId
        ) {
          return;
        }

        const nextHeight = Number(event.data.height);
        const nextTitle =
          typeof event.data.title === "string" ? event.data.title.trim() : "";
        const nextScrollWidth = Number(event.data.scrollWidth);
        const nextClientWidth = Number(event.data.clientWidth);

        if (Number.isFinite(nextHeight) && nextHeight > 0) {
          setIframeHeight(nextHeight);
        }
        if (
          Number.isFinite(nextScrollWidth) &&
          nextScrollWidth > 0 &&
          Number.isFinite(nextClientWidth) &&
          nextClientWidth > 0
        ) {
          onLayoutMetrics?.({
            scrollWidth: nextScrollWidth,
            clientWidth: nextClientWidth,
          });
        }
        setTitle(nextTitle);
        if (loadedFrameRef.current !== frameId) {
          loadedFrameRef.current = frameId;
          onLoad?.(nextTitle || accessibleTitle);
        }
      };
      window.addEventListener("message", handleMessage);
      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }, [accessibleTitle, frameId, onLayoutMetrics, onLoad]);

    useImperativeHandle(
      ref,
      () => ({
        reload: () => {
          if (!isApproved) return;
          setReloadRevision((revision) => revision + 1);
        },
      }),
      [isApproved],
    );

    const height = useMemo(() => {
      if (!autoHeight) return configuredHeight || 600;
      if (typeof configuredHeight === "string") {
        return configuredHeight;
      }
      const parentHeight = configuredHeight || 600;
      return iframeHeight + 40 > parentHeight
        ? parentHeight
        : iframeHeight + 40;
    }, [autoHeight, configuredHeight, iframeHeight]);

    const srcDoc = useMemo(() => {
      const policy =
        "default-src 'none'; img-src data: blob:; media-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'";
      const safetyHeader = `<meta http-equiv="Content-Security-Policy" content="${policy}"><script>window.addEventListener("DOMContentLoaded", () => { const body = document.body; const root = document.documentElement; const report = () => parent.postMessage({id: '${frameId}', height: body.clientHeight, title: document.title, scrollWidth: Math.max(body.scrollWidth, root.scrollWidth), clientWidth: window.innerWidth}, '*'); const observer = new ResizeObserver(report); observer.observe(body); observer.observe(root); window.addEventListener('load', report, { once: true }); report(); })</script>`;
      const source = code.replace(/^\s*<!doctype\s+html[^>]*>/i, "");
      return `<!DOCTYPE html>${safetyHeader}${source}`;
    }, [code, frameId]);

    if (!isApproved) {
      return (
        <div className={styles["artifacts-preview-gate"]} style={{ height }}>
          <button
            ref={runButtonRef}
            type="button"
            className={styles["artifacts-preview-run"]}
            onClick={(event) => {
              focusIframeAfterApprovalRef.current = event.detail === 0;
              setApprovedDocumentIdentity(documentIdentity.token);
            }}
          >
            {runLabel}
          </button>
        </div>
      );
    }

    return (
      <iframe
        title={`${accessibleTitle} ${previewId}${title ? `: ${title}` : ""}`}
        className={styles["artifacts-iframe"]}
        key={frameId}
        ref={iframeRef}
        onFocus={() => {
          previewHadFocusRef.current = true;
        }}
        onBlur={() => {
          previewHadFocusRef.current = false;
        }}
        sandbox="allow-scripts"
        style={{ height }}
        srcDoc={srcDoc}
      />
    );
  },
);
