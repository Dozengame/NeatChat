import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeRaw from "rehype-raw";
import RehypeHighlight from "rehype-highlight";
import RehypeSanitize from "rehype-sanitize";
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useMemo,
  useLayoutEffect,
  useId,
  useCallback,
} from "react";
import { copyToClipboard, useWindowSize } from "../utils";
import { getImageActionLabels } from "../utils/image-action-labels";
import Locale from "../locales";
import DownloadIcon from "../icons/download.svg";
import CopyIcon from "../icons/copy.svg";
import ConfirmIcon from "../icons/confirm.svg";
import ReturnIcon from "../icons/return.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import { useDebouncedCallback } from "use-debounce";
import { showToast } from "./ui-lib-actions";

import { useAppConfig } from "../store/config";
import { FileAttachment } from "./file-attachment";
import { encode } from "../utils/token";
import dynamic from "next/dynamic";
import clsx from "clsx";
import {
  isSafeMarkdownImageSource,
  markdownSanitizeSchema,
} from "../utils/markdown-sanitize";
import { ATTACHMENT_WIRE_LABELS } from "../utils/attachment-wire";
import { shouldPromoteMarkdownSurface } from "../utils/markdown-surface-width";
import {
  findMarkdownAnchorTarget,
  isMarkdownFragmentHref,
  rehypeMarkdownHeadingAnchors,
} from "../utils/markdown-anchor";

export { isSafeMarkdownImageSource, markdownSanitizeSchema };

const Mermaid = dynamic(async () => (await import("./mermaid")).Mermaid, {
  loading: () => null,
});

const HTMLPreview = dynamic(
  async () => (await import("./artifacts-preview")).HTMLPreview,
  {
    loading: () => null,
  },
);

export const MarkdownFeatureContext = createContext({
  enableArtifacts: true,
  enableCodeFold: true,
  streaming: false,
});

const REHYPE_HIGHLIGHT_PLUGIN: [
  typeof RehypeHighlight,
  { detect: boolean; ignoreMissing: boolean },
] = [
  RehypeHighlight,
  {
    detect: false,
    ignoreMissing: true,
  },
];

function Details({
  node: _node,
  ...props
}: React.DetailsHTMLAttributes<HTMLDetailsElement> & { node?: unknown }) {
  return <details {...props} />;
}

function Summary({
  node: _node,
  ...props
}: React.HTMLAttributes<HTMLElement> & { node?: unknown }) {
  return <summary {...props} />;
}

function ScrollableFormulaSpan({
  node: _node,
  className,
  ...spanProps
}: React.HTMLAttributes<HTMLSpanElement> & { node?: unknown }) {
  const formulaRef = useRef<HTMLSpanElement>(null);
  const [formulaIsScrollable, setFormulaIsScrollable] = useState(false);

  const syncFormulaOverflow = useCallback(() => {
    const formula = formulaRef.current;
    const nextIsScrollable = Boolean(
      formula && formula.scrollWidth - formula.clientWidth > 1,
    );
    setFormulaIsScrollable((current) =>
      current === nextIsScrollable ? current : nextIsScrollable,
    );
  }, []);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(syncFormulaOverflow);
    return () => cancelAnimationFrame(frame);
  }, [spanProps.children, syncFormulaOverflow]);

  useEffect(() => {
    const formula = formulaRef.current;
    if (!formula || typeof ResizeObserver === "undefined") {
      syncFormulaOverflow();
      window.addEventListener("resize", syncFormulaOverflow);
      return () => window.removeEventListener("resize", syncFormulaOverflow);
    }

    const resizeObserver = new ResizeObserver(syncFormulaOverflow);
    resizeObserver.observe(formula);
    if (formula.firstElementChild) {
      resizeObserver.observe(formula.firstElementChild);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [syncFormulaOverflow]);

  return (
    <span
      {...spanProps}
      className={className}
      ref={formulaRef}
      data-scrollable={formulaIsScrollable ? "true" : "false"}
      tabIndex={formulaIsScrollable ? 0 : undefined}
      role={formulaIsScrollable ? "region" : undefined}
      aria-label={
        formulaIsScrollable ? Locale.Markdown.ScrollableFormula : undefined
      }
    />
  );
}

export function MarkdownSpan({
  node: _node,
  className,
  ...spanProps
}: React.HTMLAttributes<HTMLSpanElement> & { node?: unknown }) {
  const isDisplayFormula = className?.split(/\s+/).includes("katex-display");
  if (!isDisplayFormula) {
    return <span {...spanProps} className={className} />;
  }

  return <ScrollableFormulaSpan {...spanProps} className={className} />;
}

function formatCodeLanguage(language: string) {
  const languageLabels: Record<string, string> = {
    bash: "Bash",
    c: "C",
    cpp: "C++",
    csharp: "C#",
    css: "CSS",
    go: "Go",
    html: "HTML",
    java: "Java",
    javascript: "JavaScript",
    js: "JavaScript",
    json: "JSON",
    jsx: "JSX",
    markdown: "Markdown",
    md: "Markdown",
    mcp: "MCP",
    plaintext: "Text",
    py: "Python",
    python: "Python",
    scss: "SCSS",
    sh: "Shell",
    shell: "Shell",
    sql: "SQL",
    text: "Text",
    ts: "TypeScript",
    typescript: "TypeScript",
    tsx: "TSX",
    txt: "Text",
    yaml: "YAML",
    yml: "YAML",
    zsh: "Zsh",
  };

  const formatToken = (token: string) => {
    const normalized = token.trim().toLowerCase();

    if (languageLabels[normalized]) {
      return languageLabels[normalized];
    }

    return normalized
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) =>
        part.length <= 3
          ? part.toUpperCase()
          : part[0].toUpperCase() + part.slice(1),
      )
      .join(" ");
  };
  const segments = language
    .trim()
    .replace(/\{[^}]*\}/g, "")
    .split(":")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !/^client[-_]?id$/i.test(segment));

  if (segments.length > 1) {
    return segments.slice(0, 2).map(formatToken).join(" ");
  }

  if (segments.length === 1) {
    return formatToken(segments[0]);
  }

  return formatToken(language);
}

function getCodeLanguage(children: React.ReactNode) {
  const rawLanguage = getRawCodeLanguage(children);

  return rawLanguage ? formatCodeLanguage(rawLanguage) : "";
}

function getRawCodeLanguage(children: React.ReactNode) {
  const codeElement = React.Children.toArray(children).find(
    (child): child is React.ReactElement<{ className?: string }> =>
      React.isValidElement<{ className?: string }>(child) &&
      typeof child.props.className === "string" &&
      child.props.className.includes("language-"),
  );
  const rawLanguage = codeElement?.props.className?.match(
    /(?:^|\s)language-([^\s]+)/,
  )?.[1];

  return rawLanguage ?? "";
}

function shouldWrapCodeLanguage(language: string) {
  const normalizedLanguage = language.split(":")[0].toLowerCase();

  return [
    "",
    "md",
    "markdown",
    "text",
    "txt",
    "plaintext",
    "tex",
    "latex",
  ].includes(normalizedLanguage);
}

function getReactTextContent(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getReactTextContent).join("");
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getReactTextContent(node.props.children);
  }

  return "";
}

function getNormalizedCodeText(children: React.ReactNode): string {
  return getReactTextContent(children)
    .replace(/\r\n?/g, "\n")
    .replace(/\n$/, "");
}

function getCodeLineCount(children: React.ReactNode): number {
  const codeText = getNormalizedCodeText(children);

  if (!codeText) {
    return 1;
  }

  return codeText.split("\n").length;
}

function getCodeLineNumbers(children: React.ReactNode): string {
  return Array.from({ length: getCodeLineCount(children) }, (_, index) =>
    String(index + 1),
  ).join("\n");
}

function splitChildrenIntoLines(
  children: React.ReactNode,
): React.ReactNode[][] {
  const lines: React.ReactNode[][] = [[]];
  let currentLine = lines[0];

  function processNode(node: React.ReactNode) {
    if (node == null || typeof node === "boolean") {
      return;
    }

    if (typeof node === "string" || typeof node === "number") {
      const parts = String(node).split("\n");
      parts.forEach((part, index) => {
        if (index > 0) {
          currentLine = [];
          lines.push(currentLine);
        }
        if (part) {
          currentLine.push(part);
        }
      });
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(processNode);
      return;
    }

    if (React.isValidElement(node)) {
      const text = getReactTextContent(node);
      if (!text.includes("\n")) {
        currentLine.push(node);
        return;
      }

      const elementChildren = (node.props as any).children;
      if (elementChildren) {
        const innerLines = splitChildrenIntoLines(elementChildren);
        innerLines.forEach((innerLine, index) => {
          if (index > 0) {
            currentLine = [];
            lines.push(currentLine);
          }
          if (innerLine.length > 0) {
            const cloned = React.cloneElement(
              node,
              { key: `${node.key || ""}-line-${index}` },
              ...innerLine,
            );
            currentLine.push(cloned);
          }
        });
      } else {
        currentLine.push(node);
      }
      return;
    }

    currentLine.push(node);
  }

  processNode(children);
  return lines;
}

function MarkdownArtifactPreview({ htmlCode }: { htmlCode: string }) {
  const { height: viewportHeight } = useWindowSize();
  const [isWide, setIsWide] = useState(false);
  const syncWidth = useCallback(
    (metrics: { scrollWidth: number; clientWidth: number }) => {
      setIsWide(
        (current) =>
          current ||
          shouldPromoteMarkdownSurface(
            metrics.scrollWidth,
            metrics.clientWidth,
          ),
      );
    },
    [],
  );
  const autoHeight = !document.fullscreenElement;

  return (
    <figure
      className="markdown-artifact-preview"
      data-markdown-width={isWide ? "wide" : "normal"}
    >
      <figcaption className="markdown-artifact-preview-caption">
        {Locale.Markdown.HtmlPreview}
      </figcaption>
      <div className="markdown-artifact-preview-frame">
        <HTMLPreview
          code={htmlCode}
          accessibleTitle={Locale.Markdown.HtmlPreview}
          autoHeight={autoHeight}
          height={autoHeight ? 600 : viewportHeight}
          onLayoutMetrics={syncWidth}
        />
      </div>
    </figure>
  );
}

export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null);
  const [mermaidCode, setMermaidCode] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [codeIsWide, setCodeIsWide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userWrapCode, setUserWrapCode] = useState<boolean | null>(null);
  const [codeScrollHint, setCodeScrollHint] = useState({
    start: false,
    end: false,
  });
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCodeScrollElement = useCallback(() => ref.current, []);

  const syncCodeScrollHint = useCallback(() => {
    const codeScroller = getCodeScrollElement();
    if (!codeScroller) {
      setCodeScrollHint((current) =>
        current.start || current.end ? { start: false, end: false } : current,
      );
      return;
    }
    codeScroller.style.setProperty(
      "--markdown-code-scroll-left",
      `${codeScroller.scrollLeft}px`,
    );

    const maxScrollLeft = Math.max(
      0,
      codeScroller.scrollWidth - codeScroller.clientWidth,
    );
    setCodeIsWide(
      (current) =>
        current ||
        shouldPromoteMarkdownSurface(
          codeScroller.scrollWidth,
          codeScroller.clientWidth,
        ),
    );
    const nextHint = {
      start: codeScroller.scrollLeft > 1,
      end: maxScrollLeft - codeScroller.scrollLeft > 1,
    };

    setCodeScrollHint((current) =>
      current.start === nextHint.start && current.end === nextHint.end
        ? current
        : nextHint,
    );
  }, [getCodeScrollElement]);

  const renderArtifacts = useDebouncedCallback(() => {
    if (!ref.current) return;
    const mermaidDom = ref.current.querySelector("code.language-mermaid");
    setMermaidCode(mermaidDom ? (mermaidDom as HTMLElement).innerText : "");
    const htmlDom = ref.current.querySelector("code.language-html");
    const refText = ref.current.querySelector("code")?.innerText;
    if (htmlDom) {
      setHtmlCode((htmlDom as HTMLElement).innerText);
    } else if (
      refText?.startsWith("<!DOCTYPE") ||
      refText?.startsWith("<svg") ||
      refText?.startsWith("<?xml")
    ) {
      setHtmlCode(refText);
    } else {
      setHtmlCode("");
    }
  }, 600);

  const enableArtifactsInConfig = useAppConfig(
    (state) => state.enableArtifacts,
  );
  const features = useContext(MarkdownFeatureContext);
  const streaming = features.streaming;
  const enableArtifacts = features.enableArtifacts && enableArtifactsInConfig;
  const rawCodeLanguage = getRawCodeLanguage(props.children);
  const codeLanguage = getCodeLanguage(props.children);
  const shouldWrapCodeBlock = shouldWrapCodeLanguage(rawCodeLanguage);
  const isCodeWrapped = userWrapCode ?? shouldWrapCodeBlock;
  const codeContentKey = useMemo(
    () => `${rawCodeLanguage}\u0000${getNormalizedCodeText(props.children)}`,
    [props.children, rawCodeLanguage],
  );
  const codeLineNumbers = useMemo(
    () => (streaming ? "" : getCodeLineNumbers(props.children)),
    [props.children, streaming],
  );
  const codeLineCount = useMemo(
    () => (streaming ? undefined : getCodeLineCount(props.children)),
    [props.children, streaming],
  );

  useEffect(() => {
    setUserWrapCode(null);
  }, [rawCodeLanguage]);

  useLayoutEffect(() => {
    setCodeIsWide(false);
  }, [codeContentKey]);

  useLayoutEffect(() => {
    if (streaming) return;
    const scrollHintFrame = requestAnimationFrame(() => {
      if (isCodeWrapped && ref.current) {
        ref.current.scrollLeft = 0;
      }
      syncCodeScrollHint();
    });
    return () => cancelAnimationFrame(scrollHintFrame);
  }, [codeContentKey, isCodeWrapped, streaming, syncCodeScrollHint]);

  useEffect(() => {
    if (streaming) return;
    if (!ref.current) return;
    const timer = setTimeout(renderArtifacts, 1);
    return () => clearTimeout(timer);
  }, [props.children, renderArtifacts, streaming]);

  useEffect(() => {
    if (streaming) return;
    const codeScroller = getCodeScrollElement() ?? ref.current;
    if (!codeScroller) {
      window.addEventListener("resize", syncCodeScrollHint);
      return () => window.removeEventListener("resize", syncCodeScrollHint);
    }

    let codeResizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      codeResizeObserver = new ResizeObserver(() => {
        syncCodeScrollHint();
      });
      codeResizeObserver.observe(codeScroller);
      if (ref.current && ref.current !== codeScroller) {
        codeResizeObserver.observe(ref.current);
      }
    } else {
      window.addEventListener("resize", syncCodeScrollHint);
    }
    codeScroller.addEventListener("scroll", syncCodeScrollHint, {
      passive: true,
    });

    return () => {
      codeResizeObserver?.disconnect();
      codeScroller.removeEventListener("scroll", syncCodeScrollHint);
      if (!codeResizeObserver) {
        window.removeEventListener("resize", syncCodeScrollHint);
      }
    };
  }, [getCodeScrollElement, props.children, streaming, syncCodeScrollHint]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const codeCopyLabel = Locale.Markdown.CopyCode(codeLanguage, copied);
  const codeWrapLabel = Locale.Markdown.WrapCode(codeLanguage, isCodeWrapped);
  const wrapState = isCodeWrapped ? "wrapped" : "scroll";
  const codeSurfaceWidth = !isCodeWrapped && codeIsWide ? "wide" : "normal";

  return (
    <>
      <pre
        ref={ref}
        className={clsx(
          "markdown-code-block",
          codeLanguage && "markdown-code-block-labeled",
          isCodeWrapped && "markdown-code-block-wrap",
        )}
        data-overflow-start={codeScrollHint.start ? "true" : "false"}
        data-overflow-end={codeScrollHint.end ? "true" : "false"}
        data-wrap-state={wrapState}
        data-markdown-width={codeSurfaceWidth}
        data-line-numbers={codeLineNumbers}
        data-line-count={codeLineCount}
        onScroll={syncCodeScrollHint}
      >
        <span className="markdown-code-line-numbers" aria-hidden="true">
          {codeLineNumbers}
        </span>
        {codeLanguage && (
          <span className="markdown-code-language" aria-hidden="true">
            {codeLanguage}
          </span>
        )}
        <span className="markdown-code-actions">
          <button
            type="button"
            className="wrap-code-button"
            aria-label={codeWrapLabel}
            aria-pressed={isCodeWrapped}
            title={codeWrapLabel}
            data-wrap-state={wrapState}
            onClick={() => {
              setUserWrapCode((current) => !(current ?? shouldWrapCodeBlock));
            }}
          >
            <ReturnIcon />
          </button>
          <button
            type="button"
            className="copy-code-button"
            aria-label={codeCopyLabel}
            aria-live="polite"
            aria-atomic="true"
            title={codeCopyLabel}
            data-copy-state={copied ? "copied" : "idle"}
            onClick={() => {
              if (ref.current) {
                const codeElement = ref.current.querySelector("code");
                copyToClipboard(
                  codeElement?.innerText ?? codeElement?.textContent ?? "",
                );
                setCopied(true);

                if (copyResetTimerRef.current) {
                  clearTimeout(copyResetTimerRef.current);
                }

                copyResetTimerRef.current = setTimeout(() => {
                  setCopied(false);
                  copyResetTimerRef.current = null;
                }, 1400);
              }
            }}
          >
            {copied ? <ConfirmIcon /> : <CopyIcon />}
          </button>
        </span>
        <span
          className="copy-code-status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {copied ? codeCopyLabel : ""}
        </span>
        {props.children}
        {codeScrollHint.start && (
          <span
            aria-hidden="true"
            className="markdown-code-scroll-fade markdown-code-scroll-fade-start"
          />
        )}
        {codeScrollHint.end && (
          <span
            aria-hidden="true"
            className="markdown-code-scroll-fade markdown-code-scroll-fade-end"
          />
        )}
      </pre>
      {mermaidCode.length > 0 && (
        <Mermaid code={mermaidCode} key={mermaidCode} />
      )}
      {htmlCode.length > 0 && enableArtifacts && (
        <MarkdownArtifactPreview key={htmlCode} htmlCode={htmlCode} />
      )}
    </>
  );
}

export function CustomCode(props: {
  children: any;
  className?: string;
  inline?: boolean;
}) {
  const config = useAppConfig();
  const features = useContext(MarkdownFeatureContext);
  const enableCodeFold = features.enableCodeFold && config.enableCodeFold;
  const streaming = features.streaming;

  const codeBlockId = useId();
  const ref = useRef<HTMLPreElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [showToggle, setShowToggle] = useState(false);

  useLayoutEffect(() => {
    if (streaming) return;
    if (ref.current && !props.inline) {
      const codeHeight = ref.current.scrollHeight;
      setShowToggle(codeHeight > 400);
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [props.children, props.inline, streaming]);

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => !collapsed);
  };

  const lines = useMemo(() => {
    if (props.inline || streaming) return null;
    return splitChildrenIntoLines(props.children);
  }, [props.children, props.inline, streaming]);

  const showMoreButton =
    !props.inline && showToggle && enableCodeFold && collapsed;
  return (
    <>
      <code
        id={codeBlockId}
        className={clsx(props?.className)}
        ref={ref}
        style={{
          maxHeight:
            !props.inline && enableCodeFold && collapsed ? "400px" : "none",
          overflowY: !props.inline ? "hidden" : undefined,
        }}
      >
        {lines
          ? lines.map((lineNodes, index) => (
              <React.Fragment key={index}>
                <span className="code-line">
                  {lineNodes.length > 0 ? lineNodes : ""}
                </span>
                {index < lines.length - 1 && (
                  <span className="code-line-newline">{"\n"}</span>
                )}
              </React.Fragment>
            ))
          : props.children}
      </code>

      {showMoreButton && (
        <div
          className={clsx("show-hide-button", {
            collapsed,
            expanded: !collapsed,
          })}
        >
          <button
            type="button"
            aria-label={Locale.NewChat.CodeBlockExpand}
            aria-controls={codeBlockId}
            aria-expanded={!collapsed}
            onClick={toggleCollapsed}
          >
            <span aria-hidden="true">{Locale.NewChat.More}</span>
          </button>
        </div>
      )}
    </>
  );
}

export function MarkdownTableHeader({
  node: _node,
  isHeader: _isHeader,
  scope,
  ...headerProps
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  node?: unknown;
  isHeader?: boolean;
}) {
  return <th {...headerProps} scope={scope ?? "col"} />;
}

function parseCompactTableCellList(children: React.ReactNode) {
  const parts = React.Children.toArray(children);
  if (parts.length < 3 || parts.length % 2 === 0) return null;

  const items: string[] = [];
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (index % 2 === 1) {
      if (!React.isValidElement(part) || part.type !== "br") return null;
      continue;
    }

    if (typeof part !== "string") return null;
    const match = part.match(/^\s*-\s+(\S(?:[\s\S]*\S)?)\s*$/);
    if (!match) return null;
    items.push(match[1]);
  }

  return items.length > 1 ? items : null;
}

export function MarkdownTableCell({
  node: _node,
  isHeader: _isHeader,
  children,
  ...cellProps
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  node?: unknown;
  isHeader?: boolean;
}) {
  const compactListItems = parseCompactTableCellList(children);

  return (
    <td {...cellProps}>
      {compactListItems ? (
        <ul className="markdown-table-cell-list">
          {compactListItems.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        children
      )}
    </td>
  );
}

function getMarkdownTableHeaderSummary(children: React.ReactNode) {
  const headers: string[] = [];

  const visit = (node: React.ReactNode) => {
    if (headers.length >= 4 || !React.isValidElement(node)) return;
    if (node.type === "th" || node.type === MarkdownTableHeader) {
      const text = getReactTextContent(
        (node.props as { children?: React.ReactNode }).children,
      ).trim();
      if (text) headers.push(text);
      return;
    }
    React.Children.forEach(
      (node.props as { children?: React.ReactNode }).children,
      visit,
    );
  };

  React.Children.forEach(children, visit);
  return headers.join(", ");
}

function getMarkdownTableContentKey(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") {
    return `text:${String(node).length}:${String(node)}`;
  }
  if (Array.isArray(node)) {
    return `[${node.map(getMarkdownTableContentKey).join("|")}]`;
  }
  if (!React.isValidElement(node)) return typeof node;

  const props = node.props as {
    children?: React.ReactNode;
    className?: string;
    colSpan?: number;
    rowSpan?: number;
    style?: React.CSSProperties;
  };
  let elementType = "element";
  if (typeof node.type === "string") {
    elementType = node.type;
  } else if (node.type === MarkdownTableHeader) {
    elementType = "th";
  } else if (node.type === MarkdownTableCell) {
    elementType = "td";
  } else if (typeof node.type === "function") {
    const componentType = node.type as {
      displayName?: string;
      name?: string;
    };
    elementType =
      componentType.displayName || componentType.name || "component";
  }

  return [
    `<${elementType}`,
    `class=${props.className ?? ""}`,
    `align=${String(props.style?.textAlign ?? "")}`,
    `colSpan=${props.colSpan ?? ""}`,
    `rowSpan=${props.rowSpan ?? ""}>`,
    getMarkdownTableContentKey(props.children),
    `</${elementType}>`,
  ].join("|");
}

export function MarkdownTable({
  node: _node,
  ...tableProps
}: React.TableHTMLAttributes<HTMLTableElement> & { node?: unknown }) {
  const { streaming } = useContext(MarkdownFeatureContext);
  const tableShellRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollbarRef = useRef<HTMLDivElement>(null);
  const tableScrollbarThumbRef = useRef<HTMLSpanElement>(null);
  const tableScrollbarDragRef = useRef<{
    pointerId: number;
    grabOffset: number;
  } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const tableDialogRef = useRef<HTMLDialogElement>(null);
  const tableExpandButtonRef = useRef<HTMLButtonElement>(null);
  const tableCollapseButtonRef = useRef<HTMLButtonElement>(null);
  const tableScrollPositionRef = useRef(0);
  const tableIsExpandedRef = useRef(false);
  const shouldRestoreTableFocusRef = useRef(false);
  const tableDialogTitleId = useId();
  const tableScrollViewportId = useId();
  const [tableScrollHint, setTableScrollHint] = useState({
    start: false,
    end: false,
  });
  const [tableScrollbar, setTableScrollbar] = useState({
    max: 0,
    left: 0,
    thumbProgress: 0,
    thumbWidth: 100,
  });
  const [tableIsScrollable, setTableIsScrollable] = useState(false);
  const [tableIsWide, setTableIsWide] = useState(false);
  const [tableHintDismissed, setTableHintDismissed] = useState(false);
  const [tableIsExpanded, setTableIsExpanded] = useState(false);
  const [tablePlaceholderHeight, setTablePlaceholderHeight] = useState(0);
  const tableHeaderSummary = useMemo(
    () => getMarkdownTableHeaderSummary(tableProps.children),
    [tableProps.children],
  );
  const tableContentKey = useMemo(
    () =>
      streaming
        ? "streaming-table"
        : getMarkdownTableContentKey(tableProps.children),
    [streaming, tableProps.children],
  );

  const syncTableScrollHint = useCallback(() => {
    const tableShell = tableScrollRef.current;
    if (!tableShell) {
      setTableIsScrollable(false);
      setTableScrollbar((current) =>
        current.max ||
        current.left ||
        current.thumbProgress ||
        current.thumbWidth !== 100
          ? { max: 0, left: 0, thumbProgress: 0, thumbWidth: 100 }
          : current,
      );
      setTableScrollHint((current) =>
        current.start || current.end ? { start: false, end: false } : current,
      );
      return;
    }
    if (tableShell.clientWidth <= 0 && tableShell.scrollWidth <= 0) {
      return;
    }

    const maxScrollLeft = Math.max(
      0,
      tableShell.scrollWidth - tableShell.clientWidth,
    );
    const nextIsScrollable = maxScrollLeft > 1;
    const nextHint = {
      start: tableShell.scrollLeft > 1,
      end: maxScrollLeft - tableShell.scrollLeft > 1,
    };
    const tableScrollWidth = Math.max(
      tableShell.clientWidth,
      tableShell.scrollWidth,
    );
    const nextScrollbar = {
      max: maxScrollLeft,
      left: Math.min(maxScrollLeft, Math.max(0, tableShell.scrollLeft)),
      thumbProgress:
        maxScrollLeft > 0
          ? (Math.max(0, tableShell.scrollLeft) / maxScrollLeft) * 100
          : 0,
      thumbWidth:
        tableScrollWidth > 0
          ? Math.min(100, (tableShell.clientWidth / tableScrollWidth) * 100)
          : 100,
    };

    setTableIsScrollable((current) => {
      const resolvedIsScrollable = tableIsExpandedRef.current
        ? current || nextIsScrollable
        : nextIsScrollable;
      return current === resolvedIsScrollable ? current : resolvedIsScrollable;
    });
    if (!nextIsScrollable) {
      setTableHintDismissed(false);
    }
    setTableScrollbar((current) =>
      current.max === nextScrollbar.max &&
      current.left === nextScrollbar.left &&
      Math.abs(current.thumbProgress - nextScrollbar.thumbProgress) < 0.01 &&
      Math.abs(current.thumbWidth - nextScrollbar.thumbWidth) < 0.01
        ? current
        : nextScrollbar,
    );
    const table = tableRef.current;
    if (table) {
      setTableIsWide(
        (current) =>
          current ||
          shouldPromoteMarkdownSurface(
            table.scrollWidth,
            tableShell.clientWidth,
          ),
      );
    }
    setTableScrollHint((current) =>
      current.start === nextHint.start && current.end === nextHint.end
        ? current
        : nextHint,
    );
  }, []);

  const scrollTableTo = useCallback(
    (nextScrollLeft: number) => {
      const tableViewport = tableScrollRef.current;
      if (!tableViewport) return;
      const maxScrollLeft = Math.max(
        0,
        tableViewport.scrollWidth - tableViewport.clientWidth,
      );
      const resolvedScrollLeft = Math.min(
        maxScrollLeft,
        Math.max(0, Math.round(nextScrollLeft)),
      );
      tableViewport.scrollLeft = resolvedScrollLeft;
      tableScrollPositionRef.current = resolvedScrollLeft;
      if (resolvedScrollLeft > 1) setTableHintDismissed(true);
      syncTableScrollHint();
    },
    [syncTableScrollHint],
  );

  const scrollTableFromPointer = useCallback(
    (clientX: number, grabOffset: number) => {
      const tableViewport = tableScrollRef.current;
      const scrollbar = tableScrollbarRef.current;
      const thumb = tableScrollbarThumbRef.current;
      if (!tableViewport || !scrollbar || !thumb) return;

      const trackBounds = scrollbar.getBoundingClientRect();
      const thumbBounds = thumb.getBoundingClientRect();
      const thumbTravel = Math.max(0, trackBounds.width - thumbBounds.width);
      const maxScrollLeft = Math.max(
        0,
        tableViewport.scrollWidth - tableViewport.clientWidth,
      );
      if (thumbTravel <= 0 || maxScrollLeft <= 0) return;

      const nextThumbLeft = Math.min(
        thumbTravel,
        Math.max(0, clientX - trackBounds.left - grabOffset),
      );
      scrollTableTo((nextThumbLeft / thumbTravel) * maxScrollLeft);
    },
    [scrollTableTo],
  );

  const openExpandedTable = useCallback(() => {
    if (streaming) return;
    tableScrollPositionRef.current = tableScrollRef.current?.scrollLeft ?? 0;
    tableIsExpandedRef.current = true;
    setTablePlaceholderHeight(
      tableShellRef.current?.getBoundingClientRect().height ?? 0,
    );
    setTableIsExpanded(true);
  }, [streaming]);

  const closeExpandedTable = useCallback(() => {
    tableScrollPositionRef.current = tableScrollRef.current?.scrollLeft ?? 0;
    tableIsExpandedRef.current = false;
    shouldRestoreTableFocusRef.current = true;
    setTableIsExpanded(false);
  }, []);

  const handleTableDialogKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDialogElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeExpandedTable();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = tableDialogRef.current;
      if (!dialog) return;
      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    },
    [closeExpandedTable],
  );

  useLayoutEffect(() => {
    if (!streaming) {
      setTableIsWide(false);
      setTableHintDismissed(false);
    }
    const scrollHintFrame = requestAnimationFrame(syncTableScrollHint);
    return () => cancelAnimationFrame(scrollHintFrame);
  }, [streaming, syncTableScrollHint, tableContentKey]);

  useLayoutEffect(() => {
    const tableViewport = tableScrollRef.current;
    if (tableViewport) {
      tableViewport.scrollLeft = tableScrollPositionRef.current;
    }
    const scrollHintFrame = requestAnimationFrame(syncTableScrollHint);
    return () => cancelAnimationFrame(scrollHintFrame);
  }, [tableIsExpanded, syncTableScrollHint]);

  useLayoutEffect(() => {
    if (!tableIsExpanded) {
      if (shouldRestoreTableFocusRef.current) {
        shouldRestoreTableFocusRef.current = false;
        tableExpandButtonRef.current?.focus({ preventScroll: true });
      }
      return;
    }

    const dialog = tableDialogRef.current;
    if (!dialog) return;
    if (!dialog.open) {
      try {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      } catch {
        dialog.setAttribute("open", "");
      }
    }
    tableCollapseButtonRef.current?.focus({ preventScroll: true });

    return () => {
      if (dialog.open && typeof dialog.close === "function") {
        dialog.close();
      }
    };
  }, [tableIsExpanded]);

  useEffect(() => {
    const tableShell = tableScrollRef.current;
    if (!tableShell || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncTableScrollHint);
      return () => window.removeEventListener("resize", syncTableScrollHint);
    }

    const tableResizeObserver = new ResizeObserver(() => {
      syncTableScrollHint();
    });
    tableResizeObserver.observe(tableShell);
    if (tableRef.current) {
      tableResizeObserver.observe(tableRef.current);
    }
    window.addEventListener("resize", syncTableScrollHint);

    return () => {
      tableResizeObserver.disconnect();
      window.removeEventListener("resize", syncTableScrollHint);
    };
  }, [syncTableScrollHint, tableIsExpanded]);

  const tableSurface = (
    <div
      ref={tableShellRef}
      className="markdown-table-scroll-shell"
      data-markdown-width={tableIsWide ? "wide" : "normal"}
      data-scrollable={tableIsScrollable ? "true" : "false"}
      data-expanded={tableIsExpanded ? "true" : "false"}
      data-scroll-hint={
        tableIsScrollable && !tableHintDismissed && !tableIsExpanded
          ? "true"
          : "false"
      }
      data-overflow-start={tableScrollHint.start ? "true" : "false"}
      data-overflow-end={tableScrollHint.end ? "true" : "false"}
    >
      {!streaming && (tableIsScrollable || tableIsExpanded) && (
        <div
          className="markdown-table-toolbar"
          role="toolbar"
          aria-label={Locale.Markdown.TableToolbar}
        >
          <span
            id={tableIsExpanded ? tableDialogTitleId : undefined}
            className="markdown-table-toolbar-label"
          >
            {tableIsExpanded
              ? Locale.Markdown.TableDialog(tableHeaderSummary)
              : Locale.Markdown.ScrollableTableHint}
          </span>
          <button
            ref={
              tableIsExpanded ? tableCollapseButtonRef : tableExpandButtonRef
            }
            type="button"
            className="markdown-table-toolbar-button"
            aria-haspopup={tableIsExpanded ? undefined : "dialog"}
            aria-expanded={tableIsExpanded ? undefined : false}
            aria-label={
              tableIsExpanded
                ? Locale.Markdown.CollapseTable
                : Locale.Markdown.ExpandTable
            }
            title={
              tableIsExpanded
                ? Locale.Markdown.CollapseTable
                : Locale.Markdown.ExpandTable
            }
            onClick={tableIsExpanded ? closeExpandedTable : openExpandedTable}
          >
            {tableIsExpanded ? <MinIcon /> : <MaxIcon />}
          </button>
        </div>
      )}
      <div
        id={tableScrollViewportId}
        ref={tableScrollRef}
        className="markdown-table-scroll-viewport"
        tabIndex={tableScrollbar.max > 1 ? 0 : undefined}
        role={tableScrollbar.max > 1 ? "region" : undefined}
        aria-label={
          tableScrollbar.max > 1
            ? Locale.Markdown.ScrollableTable(tableHeaderSummary)
            : undefined
        }
        onScroll={() => {
          tableScrollPositionRef.current =
            tableScrollRef.current?.scrollLeft ?? 0;
          if (Math.abs(tableScrollPositionRef.current) > 1) {
            setTableHintDismissed(true);
          }
          syncTableScrollHint();
        }}
      >
        <table {...tableProps} ref={tableRef} />
      </div>
      {tableScrollbar.max > 1 && (
        <div
          ref={tableScrollbarRef}
          className="markdown-table-scrollbar"
          role="slider"
          tabIndex={0}
          aria-controls={tableScrollViewportId}
          aria-label={Locale.Markdown.TableScrollbar}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={tableScrollbar.max}
          aria-valuenow={Math.min(tableScrollbar.left, tableScrollbar.max)}
          aria-valuetext={Locale.Markdown.TableScrollPosition(
            tableScrollbar.max > 0
              ? Math.round((tableScrollbar.left / tableScrollbar.max) * 100)
              : 0,
          )}
          onKeyDown={(event) => {
            const tableViewport = tableScrollRef.current;
            if (!tableViewport) return;
            const arrowStep = Math.max(
              24,
              Math.round(tableViewport.clientWidth * 0.08),
            );
            const pageStep = Math.max(
              arrowStep,
              Math.round(tableViewport.clientWidth * 0.8),
            );
            let nextScrollLeft: number | undefined;

            if (event.key === "Home") nextScrollLeft = 0;
            if (event.key === "End") nextScrollLeft = tableScrollbar.max;
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              nextScrollLeft = tableScrollbar.left - arrowStep;
            }
            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              nextScrollLeft = tableScrollbar.left + arrowStep;
            }
            if (event.key === "PageUp") {
              nextScrollLeft = tableScrollbar.left + pageStep;
            }
            if (event.key === "PageDown") {
              nextScrollLeft = tableScrollbar.left - pageStep;
            }
            if (nextScrollLeft === undefined) return;
            event.preventDefault();
            scrollTableTo(nextScrollLeft);
          }}
          onPointerDown={(event) => {
            if (
              event.isPrimary === false ||
              (event.pointerType === "mouse" && event.button !== 0)
            ) {
              return;
            }
            const thumb = tableScrollbarThumbRef.current;
            if (!thumb) return;
            const thumbBounds = thumb.getBoundingClientRect();
            const grabbedThumb =
              event.clientX >= thumbBounds.left &&
              event.clientX <= thumbBounds.right;
            const grabOffset = grabbedThumb
              ? event.clientX - thumbBounds.left
              : thumbBounds.width / 2;

            event.preventDefault();
            event.currentTarget.focus({ preventScroll: true });
            tableScrollbarDragRef.current = {
              pointerId: event.pointerId,
              grabOffset,
            };
            event.currentTarget.setPointerCapture?.(event.pointerId);
            if (!grabbedThumb) {
              scrollTableFromPointer(event.clientX, grabOffset);
            }
          }}
          onPointerMove={(event) => {
            const drag = tableScrollbarDragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            scrollTableFromPointer(event.clientX, drag.grabOffset);
          }}
          onPointerUp={(event) => {
            const drag = tableScrollbarDragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            scrollTableFromPointer(event.clientX, drag.grabOffset);
            tableScrollbarDragRef.current = null;
            if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={(event) => {
            if (tableScrollbarDragRef.current?.pointerId !== event.pointerId) {
              return;
            }
            tableScrollbarDragRef.current = null;
            if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onLostPointerCapture={(event) => {
            if (tableScrollbarDragRef.current?.pointerId === event.pointerId) {
              tableScrollbarDragRef.current = null;
            }
          }}
        >
          <span
            ref={tableScrollbarThumbRef}
            aria-hidden="true"
            className="markdown-table-scrollbar-thumb"
            style={{
              left: `${tableScrollbar.thumbProgress}%`,
              transform: `translateX(-${tableScrollbar.thumbProgress}%)`,
              width: `${tableScrollbar.thumbWidth}%`,
            }}
          />
        </div>
      )}
      {tableScrollHint.start && (
        <span
          aria-hidden="true"
          className="markdown-table-scroll-fade markdown-table-scroll-fade-start"
        />
      )}
      {tableScrollHint.end && (
        <span
          aria-hidden="true"
          className="markdown-table-scroll-fade markdown-table-scroll-fade-end"
        />
      )}
      {tableIsScrollable && !tableHintDismissed && !tableIsExpanded && (
        <div className="markdown-table-scroll-hint" aria-hidden="true">
          {Locale.Markdown.ScrollableTableHint}
        </div>
      )}
    </div>
  );

  if (!tableIsExpanded) return tableSurface;

  return (
    <>
      <div
        aria-hidden="true"
        className="markdown-table-fullscreen-placeholder"
        data-markdown-width={tableIsWide ? "wide" : "normal"}
        style={{ height: tablePlaceholderHeight }}
      />
      <dialog
        ref={tableDialogRef}
        className="markdown-table-fullscreen-dialog"
        aria-modal="true"
        aria-labelledby={tableDialogTitleId}
        onCancel={(event) => {
          event.preventDefault();
          closeExpandedTable();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeExpandedTable();
          }
        }}
        onKeyDown={handleTableDialogKeyDown}
      >
        {tableSurface}
      </dialog>
    </>
  );
}

function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      }
      return match;
    },
  );
}

function tryWrapHtmlCode(text: string) {
  // try add wrap html code (fixed: html codeblock include 2 newline)
  // ignore embed codeblock
  if (text.includes("```")) {
    return text;
  }
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, lang, newLine, doctype) => {
        return !quoteStart ? "\n```html\n" + doctype : match;
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) => {
        return !quoteEnd ? bodyEnd + space + htmlEnd + "\n```\n" : match;
      },
    );
}

function formatThinkText(text: string): string {
  // 创建一个函数来处理思考时间
  const handleThinkingTime = (thinkContent: string) => {
    // 尝试从localStorage获取开始和结束时间
    try {
      const thinkStartKey = `think_start_${thinkContent
        .substring(0, 50)
        .trim()}`;
      const thinkEndKey = `think_end_${thinkContent.substring(0, 50).trim()}`;

      // 获取开始时间
      const startTime = localStorage.getItem(thinkStartKey);

      if (startTime) {
        // 检查是否已经有结束时间
        let endTime = localStorage.getItem(thinkEndKey);

        // 如果没有结束时间，才设置当前时间为结束时间
        if (!endTime) {
          endTime = Date.now().toString();
          localStorage.setItem(thinkEndKey, endTime);
        }

        // 使用结束时间计算持续时间
        const duration = Math.round(
          (parseInt(endTime) - parseInt(startTime)) / 1000,
        );
        return duration;
      }
    } catch (e) {
      console.error("处理思考时间出错:", e);
    }

    return null;
  };

  // 改进的 HTML 转义函数，更好地处理代码块和 HTML 标签
  const escapeHtmlPreserveCodeBlocks = (str: string) => {
    // 使用更复杂的正则表达式来匹配代码块
    // 这个正则表达式匹配 ```code``` 和 `inline code`
    const codeBlockRegex = /(```[\s\S]*?```|`[^`\n]+`)/g;

    // 将字符串分割成代码块和非代码块部分
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(str)) !== null) {
      // 添加代码块前的文本（需要转义）
      if (match.index > lastIndex) {
        parts.push({
          text: str.substring(lastIndex, match.index),
          isCode: false,
        });
      }

      // 添加代码块（不需要转义）
      parts.push({
        text: match[0],
        isCode: true,
      });

      lastIndex = match.index + match[0].length;
    }

    // 添加最后一部分文本（如果有）
    if (lastIndex < str.length) {
      parts.push({
        text: str.substring(lastIndex),
        isCode: false,
      });
    }

    // 处理每个部分
    return parts
      .map((part) => {
        if (part.isCode) {
          // 代码块保持原样
          return part.text;
        } else {
          // 非代码块部分需要转义 HTML 标签
          return part.text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        }
      })
      .join("");
  };

  // 处理正在思考的情况（只有开始标签）
  if (text.startsWith("<think>") && !text.includes("</think>")) {
    // 获取 <think> 后的所有内容
    const thinkContent = text.slice("<think>".length);

    // 保存开始时间到localStorage
    try {
      const thinkStartKey = `think_start_${thinkContent
        .substring(0, 50)
        .trim()}`;
      if (!localStorage.getItem(thinkStartKey)) {
        localStorage.setItem(thinkStartKey, Date.now().toString());
      }
    } catch (e) {
      console.error("保存思考开始时间出错:", e);
    }

    // 转义内容中的HTML标签，但保留代码块，然后给每一行添加引用符号
    const escapedContent = escapeHtmlPreserveCodeBlocks(thinkContent);
    const quotedContent = escapedContent
      .split("\n")
      .map((line: string) => (line.trim() ? `> ${line}` : ">"))
      .join("\n");

    return `<details open class="markdown-thinking">
<summary class="markdown-thinking-summary">${Locale.NewChat.Thinking} <span class="thinking-loader" aria-hidden="true"></span></summary>

${quotedContent}

</details>`;
  }

  // 处理完整的思考过程（有结束标签）
  const pattern = /^<think>([\s\S]*?)<\/think>/;
  return text.replace(pattern, (match, thinkContent) => {
    // 转义内容中的HTML标签，但保留代码块，然后给每一行添加引用符号
    const escapedContent = escapeHtmlPreserveCodeBlocks(thinkContent);
    const quotedContent = escapedContent
      .split("\n")
      .map((line: string) => (line.trim() ? `> ${line}` : ">"))
      .join("\n");

    // 获取思考用时
    const duration = handleThinkingTime(thinkContent);
    const durationText = duration ? Locale.NewChat.ThinkingTime(duration) : "";

    return `<details open class="markdown-thinking">
<summary class="markdown-thinking-summary">${Locale.NewChat.Think}${durationText}</summary>

${quotedContent}

</details>`;
  });
}

type MarkdownImageActionProps = {
  onPreviewImage?: (src: string, label?: string) => void;
  onDownloadImage?: (src: string) => void | Promise<void>;
};

type DetectedFileAttachment = {
  fileName: string;
  fileType: string;
  fileSize: number;
  content: string;
  startIndex: number;
  endIndex: number;
};

const fileAttachmentHrefPrefix = "#neatchat-file-attachment?";
const audioMediaExtensions = new Set(["aac", "mp3", "opus", "wav"]);
const videoMediaExtensions = new Set([
  "3gp",
  "3g2",
  "webm",
  "ogv",
  "mpeg",
  "mp4",
  "avi",
]);

const createFileAttachmentHref = (file: DetectedFileAttachment) => {
  const params = new URLSearchParams();
  params.set("name", file.fileName);
  params.set("type", file.fileType);
  params.set("size", String(file.fileSize));
  return `${fileAttachmentHrefPrefix}${params.toString()}`;
};

function getMediaHrefExtension(href: string) {
  const trimmedHref = href.trim();
  if (!trimmedHref) return "";

  const fallbackPath = trimmedHref.split("#")[0].split("?")[0];

  try {
    const parsedHref = new URL(trimmedHref, "https://neatchat.local");
    const match = parsedHref.pathname.match(/\.([a-z0-9]+)$/i);
    return match?.[1]?.toLowerCase() ?? "";
  } catch {
    const match = fallbackPath.match(/\.([a-z0-9]+)$/i);
    return match?.[1]?.toLowerCase() ?? "";
  }
}

function getMediaFileName(href: string) {
  const trimmedHref = href.trim();
  if (!trimmedHref) return "";

  const fallbackPath = trimmedHref.split("#")[0].split("?")[0];
  const getNameFromPath = (path: string) => {
    const lastSegment = path.split("/").filter(Boolean).pop() ?? "";
    try {
      return decodeURIComponent(lastSegment);
    } catch {
      return lastSegment;
    }
  };

  try {
    const parsedHref = new URL(trimmedHref, "https://neatchat.local");
    return getNameFromPath(parsedHref.pathname);
  } catch {
    return getNameFromPath(fallbackPath);
  }
}

function MarkdownMediaCard({
  kind,
  href,
  children,
}: {
  kind: "audio" | "video";
  href: string;
  children: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);
  const typeLabel =
    kind === "audio" ? Locale.Markdown.Audio : Locale.Markdown.Video;
  const mediaLabel =
    getReactTextContent(children).trim() || getMediaFileName(href) || href;
  const mediaAriaLabel = Locale.Markdown.MediaAttachment(typeLabel, mediaLabel);
  const fallbackText = Locale.Markdown.MediaFallback(typeLabel);

  return (
    <span
      className={clsx(
        "markdown-media-frame",
        kind === "audio" ? "markdown-media-audio" : "markdown-media-video",
      )}
      data-media-error={hasError ? "true" : undefined}
    >
      <span className="markdown-media-header">
        <span className="markdown-media-type">{typeLabel}</span>
        <span className="markdown-media-name">{mediaLabel}</span>
      </span>
      {hasError ? (
        <span
          className="markdown-media-fallback"
          role="status"
          aria-live="polite"
        >
          {fallbackText}
        </span>
      ) : kind === "audio" ? (
        <audio
          className="markdown-audio-player"
          controls
          preload="metadata"
          src={href}
          aria-label={mediaAriaLabel}
          onError={() => setHasError(true)}
        ></audio>
      ) : (
        // The Markdown media model does not currently carry caption resources.
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          className="markdown-video-player"
          controls
          preload="metadata"
          aria-label={mediaAriaLabel}
          onError={() => setHasError(true)}
        >
          <source src={href} onError={() => setHasError(true)} />
        </video>
      )}
      <span className="markdown-media-footer">
        <a
          className="markdown-media-open-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {Locale.Markdown.OpenOriginal}
        </a>
      </span>
    </span>
  );
}

function detectFileAttachments(content: string): DetectedFileAttachment[] {
  const escapePattern = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const currentLabels = Locale.Chat.Attachments.FileMetadata;
  const labelSets = [
    [currentLabels.Name, currentLabels.Type, currentLabels.Size],
    [
      ATTACHMENT_WIRE_LABELS.name,
      ATTACHMENT_WIRE_LABELS.type,
      ATTACHMENT_WIRE_LABELS.size,
    ],
    ["File name", "Type", "Size"],
  ].filter(
    (labels, index, allLabels) =>
      allLabels.findIndex(
        (candidate) => candidate.join("\u0000") === labels.join("\u0000"),
      ) === index,
  );
  const files: DetectedFileAttachment[] = [];

  labelSets.forEach(([nameLabel, typeLabel, sizeLabel]) => {
    const fileRegex = new RegExp(
      `${escapePattern(nameLabel)}: (.+?)\\n${escapePattern(
        typeLabel,
      )}: (.+?)\\n${escapePattern(
        sizeLabel,
      )}: (.+?) KB\\n\\n([\\s\\S]+?)(?=\\n\\n---|$)`,
      "g",
    );
    let match: RegExpExecArray | null;
    while ((match = fileRegex.exec(content)) !== null) {
      files.push({
        fileName: match[1],
        fileType: match[2],
        fileSize: parseFloat(match[3]) * 1024,
        content: match[4],
        startIndex: match.index,
        endIndex: fileRegex.lastIndex,
      });
    }
  });

  return files
    .sort((left, right) => left.startIndex - right.startIndex)
    .filter(
      (file, index, allFiles) =>
        allFiles.findIndex(
          (candidate) => candidate.startIndex === file.startIndex,
        ) === index,
    );
}

function replaceFileAttachments(content: string) {
  const files = detectFileAttachments(content);

  if (files.length === 0) {
    return content;
  }

  let newContent = content;

  files
    .slice()
    .sort((left, right) => right.startIndex - left.startIndex)
    .forEach((file) => {
      const replacement = `[📄 ${file.fileName}](${createFileAttachmentHref(
        file,
      )})`;
      newContent =
        newContent.substring(0, file.startIndex) +
        replacement +
        newContent.substring(file.endIndex);
    });

  return newContent;
}

function MarkDownContentInner(
  props: {
    content: string;
    streaming?: boolean;
  } & MarkdownImageActionProps,
) {
  const { content, streaming = false } = props;
  const markdownAnchorScope = useId();
  const escapedContent = useMemo(() => {
    // 检查是否是 base64 图像数据
    try {
      // 尝试解析整个内容
      const jsonData = JSON.parse(content);
      if (jsonData.type === "base64_image") {
        // 如果有附加文本，添加到图像后面
        const textContent = jsonData.text ? `\n\n${jsonData.text}` : "";
        return `![Generated Image](${jsonData.data})${textContent}`;
      }
    } catch (e) {
      // 不是 JSON 格式，继续检查内容中是否包含 JSON 字符串

      // 尝试匹配完整的 JSON 字符串模式
      const jsonRegex = /(\{.*"type"\s*:\s*"base64_image".*?\})/;
      const jsonMatch = jsonRegex.exec(content);

      if (jsonMatch && jsonMatch[1]) {
        try {
          // 尝试解析匹配到的 JSON 字符串
          const jsonData = JSON.parse(jsonMatch[1]);
          if (jsonData.type === "base64_image" && jsonData.data) {
            // 分析原始内容，保持文本顺序
            const parts = content.split(jsonMatch[1]);
            const beforeText = parts[0] ? `${parts[0]}\n\n` : "";
            const afterText = parts[1] ? `\n\n${parts[1]}` : "";
            const imageText = jsonData.text ? `\n\n${jsonData.text}` : "";

            return `${beforeText}![Generated Image](${jsonData.data})${imageText}${afterText}`;
          }
        } catch (jsonError) {
          console.error("Failed to parse JSON in content:", jsonError);
        }
      }

      // 尝试其他正则表达式匹配
      const regex = /\{"type":"base64_image","data":"(data:[^"]+)".*?\}/g;
      const match = regex.exec(content);
      if (match && match[1]) {
        // 找到了 base64 图像数据
        return `![Generated Image](${match[1]})`;
      }

      // 尝试另一种格式
      const regex2 = /\{"data":"(data:[^"]+)","type":"base64_image".*?\}/g;
      const match2 = regex2.exec(content);
      if (match2 && match2[1]) {
        // 找到了 base64 图像数据
        return `![Generated Image](${match2[1]})`;
      }
    }

    const processedContent = replaceFileAttachments(content);
    return tryWrapHtmlCode(formatThinkText(escapeBrackets(processedContent)));
  }, [content]);

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={[
        RehypeRaw,
        [RehypeSanitize, markdownSanitizeSchema],
        [rehypeMarkdownHeadingAnchors, { scope: markdownAnchorScope }],
        RehypeKatex,
        ...(!streaming ? [REHYPE_HIGHLIGHT_PLUGIN] : []),
      ]}
      components={{
        // 添加自定义组件处理
        a: (aProps) => {
          const href = aProps.href || "";

          // 检测并阻止javascript协议
          if (href.toLowerCase().startsWith("javascript:")) {
            // 简单地显示文本内容，不添加任何特殊样式或提示
            return <span>{aProps.children}</span>;
          }

          // 处理文件附件链接
          if (href.startsWith(fileAttachmentHrefPrefix)) {
            try {
              const params = new URLSearchParams(
                href.slice(fileAttachmentHrefPrefix.length),
              );
              const fileName = params.get("name") || "";
              const fileType =
                params.get("type") || Locale.Markdown.UnknownType;
              const fileSize = parseFloat(params.get("size") || "0");

              // 忽略链接文本，直接使用 FileAttachment 组件
              return (
                <FileAttachment
                  fileName={fileName}
                  fileType={fileType}
                  fileSize={fileSize}
                  onClick={() => {
                    try {
                      // 点击时显示文件内容
                      showToast(Locale.Markdown.FileCopied);
                      const detectedFile = detectFileAttachments(
                        props.content,
                      ).find(
                        (file) =>
                          file.fileName === fileName &&
                          file.fileType === fileType &&
                          Math.abs(file.fileSize - fileSize) < 1,
                      );

                      if (detectedFile) {
                        copyToClipboard(detectedFile.content);
                      } else {
                        copyToClipboard(Locale.Markdown.FileNotFound);
                      }
                    } catch (error) {
                      console.error("复制文件内容时出错:", error);
                      showToast(Locale.Markdown.FileCopyFailed);
                    }
                  }}
                />
              );
            } catch (error) {
              console.error("解析文件附件链接出错:", error);
              return <span>{Locale.Markdown.FileLoadFailed}</span>;
            }
          }

          const mediaHrefExtension = getMediaHrefExtension(href);

          // 处理音频链接
          if (audioMediaExtensions.has(mediaHrefExtension)) {
            return (
              <MarkdownMediaCard kind="audio" href={href}>
                {aProps.children}
              </MarkdownMediaCard>
            );
          }

          // 处理视频链接
          if (videoMediaExtensions.has(mediaHrefExtension)) {
            return (
              <MarkdownMediaCard kind="video" href={href}>
                {aProps.children}
              </MarkdownMediaCard>
            );
          }

          if (isMarkdownFragmentHref(href)) {
            return (
              <a
                {...aProps}
                href={href}
                target={undefined}
                rel={undefined}
                onClick={(event) => {
                  event.preventDefault();
                  const markdownRoot =
                    event.currentTarget.closest(".markdown-body");
                  if (!markdownRoot) return;

                  const target = findMarkdownAnchorTarget(markdownRoot, href);
                  if (!target) return;

                  if (!target.hasAttribute("tabindex")) {
                    target.tabIndex = -1;
                  }
                  try {
                    target.focus({ preventScroll: true });
                  } catch {
                    target.focus();
                  }
                  target.scrollIntoView({
                    behavior: window.matchMedia?.(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "auto"
                      : "smooth",
                    block: "start",
                    inline: "nearest",
                  });
                }}
              >
                {aProps.children || href}
              </a>
            );
          }

          // 处理其他安全链接
          const isInternal = /^\/#/i.test(href);
          const target = isInternal ? "_self" : aProps.target ?? "_blank";
          const rel = !isInternal ? "noopener noreferrer" : undefined;

          return (
            <a {...aProps} href={href} target={target} rel={rel}>
              {aProps.children || href}
            </a>
          );
        },
        pre: PreCode,
        code: CustomCode,
        table: MarkdownTable,
        th: MarkdownTableHeader,
        td: MarkdownTableCell,
        img: (imgProps) => {
          const candidateSrc =
            typeof imgProps.src === "string" ? imgProps.src.trim() : "";
          const src = isSafeMarkdownImageSource(candidateSrc)
            ? candidateSrc
            : "";
          const alt = typeof imgProps.alt === "string" ? imgProps.alt : "";
          const imageActionLabels = getImageActionLabels(alt);

          if (!src) {
            return <span>{alt}</span>;
          }

          if (!src || (!props.onPreviewImage && !props.onDownloadImage)) {
            return (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  {...imgProps}
                  alt={alt}
                  src={src}
                  loading="lazy"
                  decoding="async"
                />
              </>
            );
          }

          return (
            <span className="markdown-image-frame">
              <button
                type="button"
                className="markdown-image-preview-button"
                aria-label={imageActionLabels.preview}
                onClick={(event) => {
                  event.preventDefault();
                  props.onPreviewImage?.(src, alt);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  {...imgProps}
                  alt={alt}
                  src={src}
                  className="markdown-image-preview"
                  loading="lazy"
                  decoding="async"
                />
              </button>
              {props.onDownloadImage && (
                <button
                  type="button"
                  className="markdown-image-download"
                  aria-label={imageActionLabels.download}
                  title={imageActionLabels.download}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    props.onDownloadImage?.(src);
                  }}
                >
                  <DownloadIcon />
                </button>
              )}
            </span>
          );
        },
        p: (pProps) => <p {...pProps} dir="auto" />,
        span: MarkdownSpan,
        details: Details,
        summary: Summary,
      }}
    >
      {escapedContent}
    </ReactMarkdown>
  );
}

export const MarkdownContent = React.memo(MarkDownContentInner);

export function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    fontFamily?: string;
    defaultShow?: boolean;
    isUser?: boolean;
    messageId?: string;
    streaming?: boolean;
    shouldAutoScroll?: boolean;
    enableArtifacts?: boolean;
    enableCodeFold?: boolean;
    onContentChange?: () => void;
  } & MarkdownImageActionProps,
) {
  const {
    content,
    fontSize,
    fontFamily,
    isUser,
    loading,
    messageId,
    streaming,
    shouldAutoScroll,
    enableArtifacts = true,
    enableCodeFold = true,
    onContentChange,
    onPreviewImage,
    onDownloadImage,
  } = props;
  const mdRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(content);

  // 添加token计数状态和首字延迟状态
  const tokenInfo = useMemo<{
    count: number;
    isUser: boolean;
    firstCharDelay?: number;
  } | null>(() => {
    if (!content || content.length === 0 || streaming) {
      return null;
    }

    try {
      const storedDelay = messageId
        ? localStorage.getItem(`first_char_delay_${messageId}`)
        : null;

      return {
        count: encode(content).length,
        isUser: isUser ?? false,
        firstCharDelay: storedDelay ? parseInt(storedDelay) : undefined,
      };
    } catch (e) {
      console.error("计算token出错:", e);
      return null;
    }
  }, [content, isUser, messageId, streaming]);
  const markdownFeatures = useMemo(
    () => ({ enableArtifacts, enableCodeFold, streaming: !!streaming }),
    [enableArtifacts, enableCodeFold, streaming],
  );
  const messageStartTimeRef = useRef<number | null>(null);
  const firstCharReceivedTimeRef = useRef<number | null>(null);

  // 添加鼠标悬停状态
  const [isHovering, setIsHovering] = useState(false);
  const tokenFirstCharDelay = tokenInfo?.firstCharDelay;
  const hasTokenFirstCharDelay =
    Number.isFinite(tokenFirstCharDelay) && (tokenFirstCharDelay ?? -1) >= 0;
  const showTokenDelay = hasTokenFirstCharDelay && isHovering;
  const tokenDelayText = hasTokenFirstCharDelay
    ? Locale.Chat.TokenInfo.FirstDelay(tokenFirstCharDelay!)
    : "";
  const tokenCountText = tokenInfo
    ? Locale.Chat.TokenInfo.TokenCount(tokenInfo.count)
    : "";
  const tokenInfoLabel = Locale.Chat.TokenInfo.Label(
    [tokenCountText, tokenDelayText].filter(Boolean).join(", "),
  );

  // 初始化消息发送时间
  useLayoutEffect(() => {
    if (loading && !isUser && !messageStartTimeRef.current) {
      // 记录消息开始请求的时间
      messageStartTimeRef.current = Date.now();

      // 保存到localStorage
      if (messageId) {
        localStorage.setItem(
          `msg_start_${messageId}`,
          messageStartTimeRef.current.toString(),
        );
      }
    }
  }, [loading, isUser, messageId]);

  useLayoutEffect(() => {
    if (
      isUser ||
      !content ||
      content.length === 0 ||
      firstCharReceivedTimeRef.current
    ) {
      return;
    }

    firstCharReceivedTimeRef.current = Date.now();

    if (messageStartTimeRef.current && messageId) {
      const firstCharDelay =
        firstCharReceivedTimeRef.current - messageStartTimeRef.current;
      localStorage.setItem(
        `first_char_delay_${messageId}`,
        firstCharDelay.toString(),
      );
    }
  }, [content, isUser, messageId]);

  // 自动滚动效果
  useLayoutEffect(() => {
    if (content === lastContentRef.current) return;

    if (shouldAutoScroll) {
      onContentChange?.();
    }

    lastContentRef.current = content;
  }, [content, onContentChange, shouldAutoScroll]);

  return (
    <div className="markdown-body-container">
      <div
        className="markdown-body"
        style={{
          fontSize: `${fontSize ?? 14}px`,
          fontFamily: fontFamily || "inherit",
        }}
        ref={mdRef}
        dir="auto"
        data-streaming={
          streaming && !loading && !isUser && content.length > 0
            ? "true"
            : undefined
        }
      >
        {loading ? (
          <>
            <div
              className="markdown-loading-status"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {Locale.Chat.Typing}
            </div>
            <div className="markdown-loading-visual" aria-hidden="true">
              <span className="markdown-loading-dot" />
              <span className="markdown-loading-label">
                {Locale.Chat.Typing}
              </span>
            </div>
          </>
        ) : (
          <MarkdownFeatureContext.Provider value={markdownFeatures}>
            <MarkdownContent
              content={content}
              streaming={streaming}
              onPreviewImage={onPreviewImage}
              onDownloadImage={onDownloadImage}
            />
          </MarkdownFeatureContext.Provider>
        )}
      </div>

      {/* Token信息显示 */}
      {!loading && tokenInfo && hasTokenFirstCharDelay && (
        <button
          type="button"
          className="token-info"
          aria-label={tokenInfoLabel}
          aria-pressed={showTokenDelay}
          data-token-info-expanded={showTokenDelay ? "true" : "false"}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={() => {
            // 点击时切换显示状态
            setIsHovering(!isHovering);
          }}
        >
          {showTokenDelay ? tokenDelayText : tokenCountText}
        </button>
      )}
      {!loading && tokenInfo && !hasTokenFirstCharDelay && (
        <span
          className="token-info token-info-static"
          aria-label={tokenInfoLabel}
        >
          {tokenCountText}
        </span>
      )}
    </div>
  );
}
