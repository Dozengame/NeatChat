import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import RehypeRaw from "rehype-raw";
import RehypeSanitize from "rehype-sanitize";
import {
  isSafeMarkdownImageSource,
  markdownSanitizeSchema,
} from "../../app/utils/markdown-sanitize";

const content = `
<script>alert(1)</script>
<iframe src="https://example.com"></iframe>
<object data="https://example.com"></object>
<svg><script>alert(2)</script></svg>
<details class="markdown-thinking" onclick="alert(3)"><summary>Safe</summary>Body</details>
<a href="javascript:alert(4)">unsafe link</a>
<img alt="unsafe svg" src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" />
<img alt="safe png" src="data:image/png;base64,AA==" />
`;

const html = renderToStaticMarkup(
  <ReactMarkdown
    rehypePlugins={[RehypeRaw, [RehypeSanitize, markdownSanitizeSchema]]}
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
    {content}
  </ReactMarkdown>,
);

process.stdout.write(html);
