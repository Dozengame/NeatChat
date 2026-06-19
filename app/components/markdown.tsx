import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeRaw from "rehype-raw";
import RehypeHighlight from "rehype-highlight";
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useMemo,
  useLayoutEffect,
} from "react";
import { copyToClipboard, useWindowSize } from "../utils";
import Locale from "../locales";
import LoadingIcon from "../icons/three-dots.svg";
import DownloadIcon from "../icons/download.svg";
import CopyIcon from "../icons/copy.svg";
import { useDebouncedCallback } from "use-debounce";
import { showToast } from "./ui-lib-actions";

import { useAppConfig } from "../store/config";
import { FileAttachment } from "./file-attachment";
import { encode } from "../utils/token";
import dynamic from "next/dynamic";
import clsx from "clsx";

const Mermaid = dynamic(async () => (await import("./mermaid")).Mermaid, {
  loading: () => null,
});

const HTMLPreview = dynamic(
  async () => (await import("./artifacts-preview")).HTMLPreview,
  {
    loading: () => null,
  },
);

const MarkdownFeatureContext = createContext({
  enableArtifacts: true,
  enableCodeFold: true,
});

function Details(props: { children: React.ReactNode }) {
  return <details open>{props.children}</details>;
}
function Summary(props: { children: React.ReactNode }) {
  return <summary>{props.children}</summary>;
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
  const codeElement = React.Children.toArray(children).find(
    (child): child is React.ReactElement<{ className?: string }> =>
      React.isValidElement<{ className?: string }>(child) &&
      typeof child.props.className === "string" &&
      child.props.className.includes("language-"),
  );
  const rawLanguage = codeElement?.props.className?.match(
    /(?:^|\s)language-([^\s]+)/,
  )?.[1];

  return rawLanguage ? formatCodeLanguage(rawLanguage) : "";
}

export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null);
  const [mermaidCode, setMermaidCode] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const { height } = useWindowSize();

  const renderArtifacts = useDebouncedCallback(() => {
    if (!ref.current) return;
    const mermaidDom = ref.current.querySelector("code.language-mermaid");
    if (mermaidDom) {
      setMermaidCode((mermaidDom as HTMLElement).innerText);
    }
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
    }
  }, 600);

  const config = useAppConfig();
  const features = useContext(MarkdownFeatureContext);
  const enableArtifacts = features.enableArtifacts && config.enableArtifacts;
  const codeLanguage = getCodeLanguage(props.children);

  //Wrap the paragraph for plain-text
  useEffect(() => {
    if (ref.current) {
      const codeElements = ref.current.querySelectorAll(
        "code",
      ) as NodeListOf<HTMLElement>;
      const wrapLanguages = [
        "",
        "md",
        "markdown",
        "text",
        "txt",
        "plaintext",
        "tex",
        "latex",
      ];
      codeElements.forEach((codeElement) => {
        let languageClass = codeElement.className.match(
          /(?:^|\s)language-([^\s]+)/,
        );
        let name = languageClass ? languageClass[1].split(":")[0] : "";
        if (wrapLanguages.includes(name)) {
          codeElement.style.whiteSpace = "pre-wrap";
        }
      });
      const timer = setTimeout(renderArtifacts, 1);
      return () => clearTimeout(timer);
    }
  }, [renderArtifacts]);

  return (
    <>
      <pre
        ref={ref}
        className={clsx(
          "markdown-code-block",
          codeLanguage && "markdown-code-block-labeled",
        )}
      >
        {codeLanguage && (
          <span className="markdown-code-language" aria-hidden="true">
            {codeLanguage}
          </span>
        )}
        <button
          type="button"
          className="copy-code-button"
          aria-label={codeLanguage ? `复制 ${codeLanguage} 代码` : "复制代码"}
          onClick={() => {
            if (ref.current) {
              copyToClipboard(
                ref.current.querySelector("code")?.innerText ?? "",
              );
            }
          }}
        >
          <CopyIcon />
        </button>
        {props.children}
      </pre>
      {mermaidCode.length > 0 && (
        <Mermaid code={mermaidCode} key={mermaidCode} />
      )}
      {htmlCode.length > 0 && enableArtifacts && (
        <HTMLPreview
          code={htmlCode}
          autoHeight={!document.fullscreenElement}
          height={!document.fullscreenElement ? 600 : height}
        />
      )}
    </>
  );
}

function CustomCode(props: { children: any; className?: string }) {
  const config = useAppConfig();
  const features = useContext(MarkdownFeatureContext);
  const enableCodeFold = features.enableCodeFold && config.enableCodeFold;

  const ref = useRef<HTMLPreElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [showToggle, setShowToggle] = useState(false);

  useLayoutEffect(() => {
    if (ref.current) {
      const codeHeight = ref.current.scrollHeight;
      setShowToggle(codeHeight > 400);
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [props.children]);

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => !collapsed);
  };
  const showMoreButton = showToggle && enableCodeFold && collapsed;
  return (
    <>
      <code
        className={clsx(props?.className)}
        ref={ref}
        style={{
          maxHeight: enableCodeFold && collapsed ? "400px" : "none",
          overflowY: "hidden",
        }}
      >
        {props.children}
      </code>

      {showMoreButton && (
        <div
          className={clsx("show-hide-button", {
            collapsed,
            expanded: !collapsed,
          })}
        >
          <button type="button" onClick={toggleCollapsed}>
            {Locale.NewChat.More}
          </button>
        </div>
      )}
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

    return `<details open>
<summary>${Locale.NewChat.Thinking} <span class="thinking-loader"></span></summary>

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

    return `<details open>
<summary>${Locale.NewChat.Think}${durationText}</summary>

${quotedContent}

</details>`;
  });
}

type MarkdownImageActionProps = {
  onPreviewImage?: (src: string) => void;
  onDownloadImage?: (src: string) => void | Promise<void>;
};

type DetectedFileAttachment = {
  fileName: string;
  fileType: string;
  fileSize: number;
  content: string;
};

const fileAttachmentHrefPrefix = "#neatchat-file-attachment?";

const createFileAttachmentHref = (file: DetectedFileAttachment) => {
  const params = new URLSearchParams();
  params.set("name", file.fileName);
  params.set("type", file.fileType);
  params.set("size", String(file.fileSize));
  return `${fileAttachmentHrefPrefix}${params.toString()}`;
};

function detectFileAttachments(content: string): DetectedFileAttachment[] {
  const fileRegex =
    /文件名: (.+?)\n类型: (.+?)\n大小: (.+?) KB\n\n([\s\S]+?)(?=\n\n---|$)/g;
  let match;
  const files: DetectedFileAttachment[] = [];

  while ((match = fileRegex.exec(content)) !== null) {
    files.push({
      fileName: match[1],
      fileType: match[2],
      fileSize: parseFloat(match[3]) * 1024,
      content: match[4],
    });
  }

  return files;
}

function replaceFileAttachments(content: string) {
  const files = detectFileAttachments(content);

  if (files.length === 0) {
    return content;
  }

  let newContent = content;

  files.forEach((file) => {
    const fileMarker = `文件名: ${file.fileName}\n类型: ${
      file.fileType
    }\n大小: ${(file.fileSize / 1024).toFixed(2)} KB\n\n`;
    const replacement = `[📄 ${file.fileName}](${createFileAttachmentHref(
      file,
    )})`;
    const startIndex = newContent.indexOf(fileMarker);

    if (startIndex >= 0) {
      const contentStart = startIndex + fileMarker.length;
      let contentEnd = newContent.indexOf("\n\n---\n\n", contentStart);
      if (contentEnd < 0) contentEnd = newContent.length;

      newContent =
        newContent.substring(0, startIndex) +
        replacement +
        newContent.substring(contentEnd);
    }
  });

  return newContent;
}

function MarkDownContentInner(
  props: {
    content: string;
  } & MarkdownImageActionProps,
) {
  const { content } = props;
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
        RehypeKatex,
        [
          RehypeHighlight,
          {
            detect: false,
            ignoreMissing: true,
          },
        ],
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
              const fileType = params.get("type") || "未知类型";
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
                      showToast("文件内容已复制到剪贴板");
                      // 使用更安全的方式查找文件内容
                      const fileMarker = `文件名: ${fileName}\n类型: ${fileType}\n大小: ${(
                        fileSize / 1024
                      ).toFixed(2)} KB\n\n`;
                      const startIndex = props.content.indexOf(fileMarker);

                      if (startIndex >= 0) {
                        const contentStart =
                          props.content.indexOf("\n\n", startIndex) + 2;
                        let contentEnd = props.content.indexOf(
                          "\n\n---\n\n",
                          contentStart,
                        );
                        if (contentEnd < 0) contentEnd = props.content.length;

                        const fileContent = props.content.substring(
                          contentStart,
                          contentEnd,
                        );
                        copyToClipboard(fileContent);
                      } else {
                        copyToClipboard("无法找到文件内容");
                      }
                    } catch (error) {
                      console.error("复制文件内容时出错:", error);
                      showToast("复制文件内容失败");
                    }
                  }}
                />
              );
            } catch (error) {
              console.error("解析文件附件链接出错:", error);
              return <span>文件附件加载失败</span>;
            }
          }

          // 处理音频链接
          if (/\.(aac|mp3|opus|wav)$/.test(href)) {
            return (
              <figure>
                <audio controls src={href} aria-label="音频附件">
                  <track kind="captions" />
                </audio>
              </figure>
            );
          }

          // 处理视频链接
          if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
            return (
              <video controls width="99.9%" aria-label="视频附件">
                <source src={href} />
                <track kind="captions" />
              </video>
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
        img: (imgProps) => {
          const src =
            typeof imgProps.src === "string" ? imgProps.src.trim() : "";
          const alt = typeof imgProps.alt === "string" ? imgProps.alt : "";

          if (!src || (!props.onPreviewImage && !props.onDownloadImage)) {
            return (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img {...imgProps} alt={alt} src={src} />
              </>
            );
          }

          return (
            <span className="markdown-image-frame">
              <button
                type="button"
                className="markdown-image-preview-button"
                aria-label={alt || "预览图片"}
                onClick={(event) => {
                  event.preventDefault();
                  props.onPreviewImage?.(src);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  {...imgProps}
                  alt={alt}
                  src={src}
                  className="markdown-image-preview"
                />
              </button>
              {props.onDownloadImage && (
                <button
                  type="button"
                  className="markdown-image-download"
                  aria-label="下载原图"
                  title="下载原图"
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
    () => ({ enableArtifacts, enableCodeFold }),
    [enableArtifacts, enableCodeFold],
  );
  const messageStartTimeRef = useRef<number | null>(null);
  const firstCharReceivedTimeRef = useRef<number | null>(null);

  // 添加鼠标悬停状态
  const [isHovering, setIsHovering] = useState(false);

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
      >
        {loading ? (
          <LoadingIcon />
        ) : (
          <MarkdownFeatureContext.Provider value={markdownFeatures}>
            <MarkdownContent
              content={content}
              onPreviewImage={onPreviewImage}
              onDownloadImage={onDownloadImage}
            />
          </MarkdownFeatureContext.Provider>
        )}
      </div>

      {/* Token信息显示 */}
      {!loading && tokenInfo && (
        <button
          type="button"
          className="token-info"
          aria-label="Token 信息"
          onMouseEnter={() => tokenInfo.firstCharDelay && setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={() => {
            // 点击时切换显示状态
            if (tokenInfo.firstCharDelay) {
              setIsHovering(!isHovering);
            }
          }}
        >
          {isHovering && tokenInfo.firstCharDelay
            ? Locale.Chat.TokenInfo.FirstDelay(tokenInfo.firstCharDelay)
            : Locale.Chat.TokenInfo.TokenCount(tokenInfo.count)}
        </button>
      )}
    </div>
  );
}
