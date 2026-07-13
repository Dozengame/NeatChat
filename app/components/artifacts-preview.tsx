import {
  forwardRef,
  useEffect,
  useImperativeHandle,
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
    } = props;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const loadedFrameRef = useRef<string | null>(null);
    const [previewId] = useState(() => nanoid(6));
    const [reloadRevision, setReloadRevision] = useState(0);
    const frameId = useMemo(
      () => `${previewId}-${nanoid(8)}-${reloadRevision}-${code.length}`,
      [code, previewId, reloadRevision],
    );
    const [iframeHeight, setIframeHeight] = useState(600);
    const [title, setTitle] = useState("");

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

    useImperativeHandle(ref, () => ({
      reload: () => {
        setReloadRevision((revision) => revision + 1);
      },
    }));

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
      const script = `<script>window.addEventListener("DOMContentLoaded", () => { const body = document.body; const root = document.documentElement; const report = () => parent.postMessage({id: '${frameId}', height: body.clientHeight, title: document.title, scrollWidth: Math.max(body.scrollWidth, root.scrollWidth), clientWidth: window.innerWidth}, '*'); const observer = new ResizeObserver(report); observer.observe(body); observer.observe(root); window.addEventListener('load', report, { once: true }); report(); })</script>`;
      if (code.includes("<!DOCTYPE html>")) {
        return code.replace("<!DOCTYPE html>", "<!DOCTYPE html>" + script);
      }
      return script + code;
    }, [code, frameId]);

    return (
      <iframe
        title={`${accessibleTitle} ${previewId}${title ? `: ${title}` : ""}`}
        className={styles["artifacts-iframe"]}
        key={frameId}
        ref={iframeRef}
        sandbox="allow-forms allow-modals allow-scripts"
        style={{ height }}
        srcDoc={srcDoc}
      />
    );
  },
);
