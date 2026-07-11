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
    } = props;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const loadedFrameRef = useRef<string | null>(null);
    const [previewId] = useState(() => nanoid(6));
    const [frameId, setFrameId] = useState<string>(() => nanoid());
    const [iframeHeight, setIframeHeight] = useState(600);
    const [title, setTitle] = useState("");

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

        if (Number.isFinite(nextHeight) && nextHeight > 0) {
          setIframeHeight(nextHeight);
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
    }, [accessibleTitle, frameId, onLoad]);

    useImperativeHandle(ref, () => ({
      reload: () => {
        setFrameId(nanoid());
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
      const script = `<script>window.addEventListener("DOMContentLoaded", () => new ResizeObserver((entries) => parent.postMessage({id: '${frameId}', height: entries[0].target.clientHeight, title: document.title}, '*')).observe(document.body))</script>`;
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
