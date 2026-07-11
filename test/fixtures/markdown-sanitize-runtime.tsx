import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import RehypeKatex from "rehype-katex";
import RehypeRaw from "rehype-raw";
import RehypeSanitize from "rehype-sanitize";
import RemarkMath from "remark-math";
import {
  isSafeMarkdownImageSource,
  markdownSanitizeSchema,
} from "../../app/utils/markdown-sanitize";

const content = `
<script>alert(1)</script>
<iframe src="https://example.com"></iframe>
<object data="https://example.com"></object>
<svg><script>alert(2)</script></svg>
<details><summary>Closed</summary>Body</details>
<details open><summary>Open</summary>Body</details>
<details open class="markdown-thinking" onclick="alert(3)"><summary>Thinking</summary>Body</details>
<a href="javascript:alert(4)">unsafe link</a>
<img alt="unsafe svg" src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" />
<img alt="safe png" src="data:image/png;base64,AA==" />
`;

const mathContent = [
  "Inline math: $E = mc^2$.",
  "",
  "$$",
  String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`,
  "$$",
  "",
  "$$",
  String.raw`\sum_{i=1}^{n} i = \frac{n(n+1)}{2}`,
  "$$",
  "",
  "$$",
  String.raw`A = \begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{bmatrix}`,
  "$$",
  "",
  "Inline code: `$E = mc^2$`.",
  "",
  "~~~html",
  "<span>$E = mc^2$</span>",
  "~~~",
].join("\n");

const html = renderToStaticMarkup(
  <ReactMarkdown
    remarkPlugins={[RemarkMath]}
    rehypePlugins={[
      RehypeRaw,
      [RehypeSanitize, markdownSanitizeSchema],
      RehypeKatex,
    ]}
    components={{
      img({ src, alt, ...props }) {
        const candidate = typeof src === "string" ? src : "";
        return isSafeMarkdownImageSource(candidate) ? (
          <img {...props} src={candidate} alt={alt ?? ""} />
        ) : (
          <span>{alt}</span>
        );
      },
    }}
  >
    {[content, mathContent].join("\n")}
  </ReactMarkdown>,
);

process.stdout.write(html);
