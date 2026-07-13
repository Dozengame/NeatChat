import type { MultimodalContent } from "../client/types";
import type { ModelType } from "../store/config";
import type { DraggedAttachmentSummary, FileInfo } from "../utils/file";
import { getVisibleChatMessages, type RenderMessage } from "./chat-render";

const MARKDOWN_STRESS_QA_PARAM = "markdown-stress";
const IMAGE_GALLERY_QA_PARAM = "image-gallery";
const JIMENG_PARSER_QA_PARAM = "jimeng-parser";
const JIMENG_PARSER_QA_MALFORMED_PARAM = "malformed";
const MARKDOWN_STRESS_QA_BOUNDARY_PARAM = "streaming_boundary";
const MARKDOWN_STRESS_QA_DROPZONE_PREVIEW_PARAM = "dropzone_preview";
const MARKDOWN_STRESS_QA_ATTACHMENT_STRIP_PREVIEW_PARAM =
  "attachment_strip_preview";
const MARKDOWN_STRESS_QA_HISTORY_COUNT_PARAM = "history_count";
const MARKDOWN_STRESS_QA_HISTORY_DENSITY_PARAM = "history_density";
const MARKDOWN_STRESS_QA_INTERACTIVE_INPUT_PARAM = "interactive_input";
export const MARKDOWN_STRESS_QA_MESSAGE_ID_PREFIX = "codex-qa-markdown-stress";
const IMAGE_GALLERY_QA_MESSAGE_ID_PREFIX = "codex-qa-image-gallery";
const JIMENG_PARSER_QA_MESSAGE_ID_PREFIX = "codex-qa-jimeng-parser";
const QA_PNG_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const IMAGE_GALLERY_QA_IMAGES = [
  "https://picsum.photos/seed/neatchat-coast/1200/800",
  "https://picsum.photos/seed/neatchat-mountain/1200/800",
  "https://picsum.photos/seed/neatchat-lake/1200/800",
  "https://picsum.photos/seed/neatchat-field/1200/800",
];
type MarkdownStressBoundaryVariant =
  | "details"
  | "table"
  | "artifact"
  | "image"
  | "media";
type MarkdownStressDropzonePreviewVariant = "accepted" | "blocked";
type MarkdownStressAttachmentStripPreviewVariant =
  | "populated"
  | "full"
  | "overflow";
const MARKDOWN_STRESS_QA_BOUNDARY_VARIANTS: MarkdownStressBoundaryVariant[] = [
  "details",
  "table",
  "artifact",
  "image",
  "media",
];
const MARKDOWN_STRESS_QA_CONTENT = `# Markdown 压测示例文档

这份内容只用于本地 UI QA，覆盖标题、段落、引用、行内代码、列表、表格、代码块、details、长链接和长文本换行。

## 目录跳转

- [代码块](#代码块)
- [步骤与列表](#步骤与列表)

> 这是一段 blockquote，用于测试引用样式、换行、嵌套、以及长文本渲染效果。
> 第二行引用内容，包含 **bold**、_italic_、\`inline code\`。

## 引用与行内代码

> 引用第一段：同一行内混合中文、English words、\`inline code\` 和强调文本，用于检查低眩光背景、左侧 rail、段落节奏和换行。
>
> - 引用内列表第一项：短内容应该保持紧凑。
> - 引用内列表第二项包含 \`veryLongInlineCodeIdentifierForMarkdownStressWrappingAndCopySafety\`，用于检查超长行内代码不会撑破消息宽度。
>
> 引用最后一段紧跟列表，用于检查 blockquote 内部多段内容之间的留白是否自然。

### 连续标题层级
#### 子标题紧跟标题

连续标题后的正文包含 \`veryLongInlineCodeIdentifierForMarkdownStressWrappingAndCopySafety\`、普通链接和中文说明，用于检查标题、段落、行内代码之间的节奏。

## 深度阅读节奏

连续标题后的引用、表格、details 和长行内代码需要在 light/dark 下保持低眩光阅读面，并且 320px 窄屏不能出现页面级横向滚动。

> 深度引用第一段：包含 \`blockquoteStreamingCaretProbe\`、中文说明和 English words，用于检查引用卡片的宽度、文字颜色和 streaming caret 位置。
>
> - 引用内列表最后一项保留 \`blockquoteStreamingCaretProbeNestedListItem\`，用于检查流式输出停在引用列表末尾时 caret 不会漂到卡片外。

## 代码块

\`\`\`typescript
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: {
    markdown: true;
    language: "zh-CN";
  };
};

const renderMessage = (message: ChatMessage) => {
  return message.content.trim() || "empty";
};
\`\`\`

\`\`\`json
{
  "name": "stress-test",
  "type": "markdown",
  "enabled": true,
  "items": [1, 2, 3, 4, 5],
  "meta": {
    "author": "OpenAI",
    "language": "zh-CN"
  }
}
\`\`\`

\`\`\`bash
#!/usr/bin/env bash
set -e

echo "Start build..."
yarn install
yarn build
echo "Done."
\`\`\`

## 表格

### Normal table

| 项目 | 状态 |
| --- | ---: |
| 标题与正文同轨 | 通过 |
| 默认列起始对齐 | 通过 |

### Wide table 与显式对齐

| Surface | Expected behavior | QA focus | Extra long validation note |
| :--- | :---: | ---: | --- |
| Code block | GitHub-like card with line numbers | Copy excludes gutter | Keep language label, gutter, fold control, and copy button readable on mobile and desktop. |
| Table | Horizontal overflow stays contained | No page overflow | A deliberately longer table cell checks the edge fade, keyboard focus region, and wrapping behavior. |
| Quote | Soft rail and readable text | Light and dark comfort | Mixed Chinese and English text should remain calm without clipped glyphs or forced page width. |

### Strict compact cell list

| 类型 | 内容 |
| --- | --- |
| 严格列表 | - 项目 A<br>- 项目 B<br>- 项目 C |
| 保持原文 | 前缀<br>- 不应转换 |

表格说明：这段说明紧跟在表格之后，用于检查表格、段落和后续内容之间的节奏。

### Normal code

\`\`\`text
short line
\`\`\`

### Wide code

\`\`\`typescript
const deliberatelyWideMarkdownSurfaceProbe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
\`\`\`

## 连续分割线

---

---

---

## 步骤与列表

1. 明确完成标准：同一行内包含 \`inline code\`、[列表内长链接](https://example.com/neatchat/markdown-stress/list-item/with/a/very/long/url/that/should/wrap-cleanly?surface=list&viewport=mobile) 和中文说明时，仍然应该自然换行。
2. 拆分实现步骤：
   - 桌面和移动端使用同一套列表节奏。
   - 嵌套内容包含第二段说明，用于检查多段 list item。

   第二段继续描述这个步骤，确保列表项内段落不会产生过大的空白，也不会挤压后续列表。
3. 验证输出：
   - 代码块、表格和列表连续出现时保持清晰层级。
   - 320px 窄屏不出现页面横向滚动。

任务清单：

- [x] 已完成的任务列表项：行首 checkbox 与正文基线对齐。
- [ ] 待确认的任务列表项：未选状态在 light/dark 下都要清晰。
- [ ] 未完成任务 4：包含嵌套子任务，检查缩进、checkbox 对齐和文本换行。
  - [ ] 子任务 4.1：移动端窄屏不能挤压正文。
  - [x] 子任务 4.2：完成态不能让图标和文本错位。

## 数学公式

行内公式：爱因斯坦质能方程 \\(E = mc^2\\)。

\\[
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
\\]

\\[
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
\\]

\\[
A = \\begin{bmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9 \\end{bmatrix}
\\]

<details open>
<summary>折叠内容</summary>

### 折叠区域标题

这里可以放置普通文本、列表和代码：

- 第一层列表内容
  - 第二层列表内容
  - 混合中文和 English text should wrap without clipping.
- 长链接测试：https://example.com/neatchat/markdown-stress/very/long/path/that/should/wrap/without/forcing/horizontal/page/overflow?source=codex_qa&theme=both

> details 内的引用内容，用于检查普通折叠块内部引用、列表、链接和长文本的混排节奏。

\`\`\`javascript
console.log("这是折叠面板内的代码");
\`\`\`

</details>

## 多模态预览

![多模态预览](${QA_PNG_IMAGE})

![图片生成提示词预览](${QA_PNG_IMAGE}) 助手善于判断用户意图，当确定需要提供图片时，助手会输出 markdown 图片语法并追加一段较长的中文提示说明，用于验证图片后接长文本时不会挤压 token、按钮或消息边界，也不会产生横向滚动。

[音频预览](/codex-qa/neatchat-stress-audio.mp3)

[视频预览](/codex-qa/neatchat-stress-video.mp4)

连续内容后续段落：媒体、表格、details 和正文连续出现时，视觉节奏应该仍然保持轻量、留白清晰，并且不会让任何按钮、图片或控制条挤出聊天消息边界。

长文本压测：中文内容混排用于验证编码、换行、滚动、折叠、锚点、复制、搜索、高亮、SSR、CSR、分页、虚拟滚动等能力。ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789

\`End of markdown stress test content.\`
`;
const MARKDOWN_STRESS_QA_BOUNDARY_CONTENT: Record<
  MarkdownStressBoundaryVariant,
  string
> = {
  details: `# codex-qa-streaming-details

前置段落用于检查 streaming caret 在最终 details 块前的段落节奏。

<details open>
<summary>流式 details 终点</summary>

- codex-qa-streaming-details
- 最后一屏应该保留折叠块边界、左侧节奏和底部 caret 空间。

</details>`,
  table: `# codex-qa-streaming-table

最终内容停在表格，用于检查 streaming caret 与横向滚动容器的距离。

| codex-qa-streaming-table | 状态 | 说明 |
| --- | --- | --- |
| final-row | streaming | 表格边界不应挤压消息操作区或页面宽度。 |`,
  artifact: `# codex-qa-streaming-artifact

最终内容停在 HTML artifact 代码块，用于检查预览卡片与 streaming 状态的边界。

\`\`\`html
<!doctype html>
<html>
  <body>
    <main aria-label="codex-qa-streaming-artifact">
      <h1>codex-qa-streaming-artifact</h1>
      <p>Artifact preview should stay bounded in the message column.</p>
    </main>
  </body>
</html>
\`\`\``,
  image: `# codex-qa-streaming-image

最终内容停在图片，用于检查媒体卡片底部空间和流式 caret。

![codex-qa-streaming-image](${QA_PNG_IMAGE})`,
  media: `# codex-qa-streaming-media

最终内容停在真实本地媒体资源，用于检查 audio/video card 的 loading、focus 和底部留白。

[音频预览](/codex-qa/neatchat-stress-audio.mp3)

[视频预览](/codex-qa/neatchat-stress-video.mp4)`,
};
const MARKDOWN_STRESS_QA_MESSAGES: RenderMessage[] = [
  {
    id: `${MARKDOWN_STRESS_QA_MESSAGE_ID_PREFIX}-user`,
    date: "2026/6/26 00:00:00",
    role: "user",
    content: "渲染一份 Markdown 压测示例文档，用于检查聊天内容显示。",
  },
  {
    id: `${MARKDOWN_STRESS_QA_MESSAGE_ID_PREFIX}-assistant`,
    date: "2026/6/26 00:00:01",
    role: "assistant",
    model: "gpt-5.4" as ModelType,
    content: MARKDOWN_STRESS_QA_CONTENT,
  },
];
const IMAGE_GALLERY_QA_MESSAGES: RenderMessage[] = [
  {
    id: `${IMAGE_GALLERY_QA_MESSAGE_ID_PREFIX}-user`,
    date: "2026/7/13 00:00:00",
    role: "user",
    content: "生成四个日落风景方案。",
  },
  {
    id: `${IMAGE_GALLERY_QA_MESSAGE_ID_PREFIX}-assistant`,
    date: "2026/7/13 00:00:01",
    role: "assistant",
    model: "gpt-image-2" as ModelType,
    content: [
      {
        type: "text",
        text: "已生成 4 个图片方案，可从右侧选项切换查看。",
      },
      ...IMAGE_GALLERY_QA_IMAGES.map((url) => ({
        type: "image_url" as const,
        image_url: { url },
      })),
    ] satisfies MultimodalContent[],
  },
];
const JIMENG_PARSER_QA_REQUEST = [
  "我先优化日出风景的生成提示词。",
  "```json:mcp:jimeng-mcp",
  '{"method":"tools/call","params":{"name":"dreamina_text2image","arguments":{"prompt":"壮丽的日出风景，金色晨光洒在平静湖面，写实摄影风格，电影级构图，无文字，无水印","ratio":"16:9","resolution_type":"1k","model_version":"4.6","poll":0}}',
  "```",
  "正在提交生成任务。",
].join("\n");
const JIMENG_PARSER_QA_MALFORMED_REQUEST = [
  "```json:mcp:jimeng-mcp",
  '{"method":"tools/call" "params":{"name":"dreamina_text2image"}}',
  "```",
].join("\n");
const MARKDOWN_STRESS_QA_BOUNDARY_MESSAGES: RenderMessage[] =
  MARKDOWN_STRESS_QA_BOUNDARY_VARIANTS.map((variant) => ({
    id: `${MARKDOWN_STRESS_QA_MESSAGE_ID_PREFIX}-streaming-${variant}`,
    date: "2026/6/27 00:00:00",
    role: "assistant",
    model: "gpt-5.4" as ModelType,
    streaming: true,
    content: MARKDOWN_STRESS_QA_BOUNDARY_CONTENT[variant],
  }));
export const MARKDOWN_STRESS_QA_DROPZONE_PREVIEW_SUMMARIES: Record<
  MarkdownStressDropzonePreviewVariant,
  DraggedAttachmentSummary
> = {
  accepted: {
    text: "可添加 2 张图片 · 1 个文件",
    hint: "释放后添加到输入框 · 最多3张图片、5个文件",
    willAdd: true,
  },
  blocked: {
    text: "附件已满",
    hint: "最多3张图片、5个文件 · 请先移除部分附件",
    willAdd: false,
  },
};
const MARKDOWN_STRESS_QA_ATTACHMENT_STRIP_PREVIEW_IMAGES: Record<
  MarkdownStressAttachmentStripPreviewVariant,
  string[]
> = {
  populated: [QA_PNG_IMAGE],
  full: [QA_PNG_IMAGE, QA_PNG_IMAGE, QA_PNG_IMAGE],
  overflow: [QA_PNG_IMAGE, QA_PNG_IMAGE, QA_PNG_IMAGE],
};
const MARKDOWN_STRESS_QA_ATTACHMENT_STRIP_PREVIEW_FILE_FIXTURES: Record<
  MarkdownStressAttachmentStripPreviewVariant,
  Array<Pick<FileInfo, "name" | "type" | "content">>
> = {
  populated: [
    {
      name: "产品需求摘要.md",
      type: "text/markdown",
      content: "# 产品需求摘要\n\n用于验证附件 strip 的普通填充状态。",
    },
    {
      name: "release-checklist.json",
      type: "application/json",
      content: '{ "status": "draft", "items": ["qa", "review"] }',
    },
  ],
  full: [
    {
      name: "界面压测报告.md",
      type: "text/markdown",
      content: "# 界面压测报告\n\n用于验证附件已满状态。",
    },
    {
      name: "markdown-render-fixture.json",
      type: "application/json",
      content: '{ "fixture": "markdown-render", "rows": 42 }',
    },
    {
      name: "table-overflow-sample.csv",
      type: "text/csv",
      content: "metric,value\nlatency,128\nmemory,452",
    },
    {
      name: "long-code-block.ts",
      type: "text/typescript",
      content: "export const fixture = 'long-code-block';",
    },
    {
      name: "qa-notes.txt",
      type: "text/plain",
      content: "最多 3 张图片和 5 个文件时显示已满状态。",
    },
  ],
  overflow: [
    {
      name: "2026-markdown-performance-benchmark-summary.md",
      type: "text/markdown",
      content: "# Markdown Performance Benchmark\n\nOverflow fixture.",
    },
    {
      name: "conversation-export-with-extra-long-file-name.json",
      type: "application/json",
      content: '{ "messages": 128, "attachments": true }',
    },
    {
      name: "nested-list-and-table-regression-cases.csv",
      type: "text/csv",
      content: "case,result\nnested-list,pass\ntable,pass",
    },
    {
      name: "streaming-code-block-boundary-sample.ts",
      type: "text/typescript",
      content: "export function sample() { return 'streaming'; }",
    },
  ],
};

export function isMarkdownStressQaEnabled(locationSearch: string) {
  const params = new URLSearchParams(locationSearch);
  return params.get("codex_qa") === MARKDOWN_STRESS_QA_PARAM;
}

export function isMarkdownStressQaInteractiveInputEnabled(
  locationSearch: string,
) {
  const params = new URLSearchParams(locationSearch);
  return params.get(MARKDOWN_STRESS_QA_INTERACTIVE_INPUT_PARAM) === "editable";
}

export function isImageGalleryQaEnabled(locationSearch: string) {
  const params = new URLSearchParams(locationSearch);
  return params.get("codex_qa") === IMAGE_GALLERY_QA_PARAM;
}

export function isJimengParserQaEnabled(locationSearch: string) {
  const params = new URLSearchParams(locationSearch);
  return params.get("codex_qa") === JIMENG_PARSER_QA_PARAM;
}

export function getImageGalleryQaMessages(): RenderMessage[] {
  return IMAGE_GALLERY_QA_MESSAGES;
}

export function getJimengParserQaMessages(
  locationSearch: string,
): RenderMessage[] {
  const params = new URLSearchParams(locationSearch);
  const content = params.has(JIMENG_PARSER_QA_MALFORMED_PARAM)
    ? JIMENG_PARSER_QA_MALFORMED_REQUEST
    : JIMENG_PARSER_QA_REQUEST;

  return getVisibleChatMessages([
    {
      id: `${JIMENG_PARSER_QA_MESSAGE_ID_PREFIX}-user`,
      date: "2026/7/13 00:00:00",
      role: "user",
      content: "出几张日出图",
    },
    {
      id: `${JIMENG_PARSER_QA_MESSAGE_ID_PREFIX}-assistant`,
      date: "2026/7/13 00:00:01",
      role: "assistant",
      model: "gpt-5.6-luna" as ModelType,
      streaming: false,
      content,
    },
  ]);
}

function getMarkdownStressQaBoundaryVariant(locationSearch: string) {
  const params = new URLSearchParams(locationSearch);
  const variant = params.get(MARKDOWN_STRESS_QA_BOUNDARY_PARAM);
  if (variant === "all") {
    return variant;
  }

  if (
    MARKDOWN_STRESS_QA_BOUNDARY_VARIANTS.includes(
      variant as MarkdownStressBoundaryVariant,
    )
  ) {
    return variant as MarkdownStressBoundaryVariant;
  }
}

export function getMarkdownStressQaDropzonePreviewVariant(
  locationSearch: string,
) {
  const params = new URLSearchParams(locationSearch);
  const variant = params.get(MARKDOWN_STRESS_QA_DROPZONE_PREVIEW_PARAM);
  return variant === "accepted" || variant === "blocked" ? variant : undefined;
}

export function getMarkdownStressQaAttachmentStripPreviewVariant(
  locationSearch: string,
) {
  const params = new URLSearchParams(locationSearch);
  const variant = params.get(MARKDOWN_STRESS_QA_ATTACHMENT_STRIP_PREVIEW_PARAM);
  return variant === "populated" || variant === "full" || variant === "overflow"
    ? variant
    : undefined;
}

export function createMarkdownStressQaAttachmentStripPreview(
  variant: MarkdownStressAttachmentStripPreviewVariant,
): { images: string[]; files: FileInfo[] } {
  const files = MARKDOWN_STRESS_QA_ATTACHMENT_STRIP_PREVIEW_FILE_FIXTURES[
    variant
  ].map((fixture) => ({
    ...fixture,
    size: new Blob([fixture.content]).size,
    originalFile: new File([fixture.content], fixture.name, {
      type: fixture.type,
    }),
  }));

  return {
    images: [...MARKDOWN_STRESS_QA_ATTACHMENT_STRIP_PREVIEW_IMAGES[variant]],
    files,
  };
}

export function getMarkdownStressQaMessages(
  locationSearch: string,
): RenderMessage[] {
  const boundaryVariant = getMarkdownStressQaBoundaryVariant(locationSearch);
  const defaultMessages = !boundaryVariant
    ? MARKDOWN_STRESS_QA_MESSAGES
    : [
        MARKDOWN_STRESS_QA_MESSAGES[0],
        ...(boundaryVariant === "all"
          ? MARKDOWN_STRESS_QA_BOUNDARY_MESSAGES
          : MARKDOWN_STRESS_QA_BOUNDARY_MESSAGES.filter((message) =>
              message.id.endsWith(`-${boundaryVariant}`),
            )),
      ];
  const params = new URLSearchParams(locationSearch);
  const requestedHistoryCount = Number.parseInt(
    params.get(MARKDOWN_STRESS_QA_HISTORY_COUNT_PARAM) ?? "",
    10,
  );
  if (!Number.isFinite(requestedHistoryCount)) return defaultMessages;

  const historyCount = Math.min(
    240,
    Math.max(defaultMessages.length, requestedHistoryCount),
  );
  const historyTemplates = [
    ...MARKDOWN_STRESS_QA_MESSAGES,
    ...MARKDOWN_STRESS_QA_BOUNDARY_MESSAGES,
  ];
  const compactHistory =
    params.get(MARKDOWN_STRESS_QA_HISTORY_DENSITY_PARAM) === "compact";

  return Array.from({ length: historyCount }, (_, index) => {
    const template = historyTemplates[index % historyTemplates.length];
    return {
      ...template,
      id: `${template.id}-history-${index}`,
      date: new Date(Date.UTC(2026, 6, 13, 0, 0, index)).toISOString(),
      role: compactHistory ? "user" : template.role,
      content: compactHistory
        ? `${template.role === "user" ? "短消息" : "简短回复"} ${index + 1}`
        : template.content,
      streaming: compactHistory
        ? undefined
        : index === historyCount - 1 && template.role === "assistant"
        ? true
        : undefined,
    };
  });
}
