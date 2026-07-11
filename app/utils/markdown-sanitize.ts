import {
  defaultSchema,
  type Options as RehypeSanitizeSchema,
} from "rehype-sanitize";

export const markdownSanitizeSchema: RehypeSanitizeSchema = {
  ...defaultSchema,
  tagNames: Array.from(
    new Set([...(defaultSchema.tagNames ?? []), "details", "summary"]),
  ),
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", /^language-./, "math-inline", "math-display"],
    ],
    details: [
      ...(defaultSchema.attributes?.details ?? []),
      "open",
      ["className", "markdown-thinking"],
    ],
    summary: [
      ...(defaultSchema.attributes?.summary ?? []),
      ["className", "markdown-thinking-summary"],
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["className", "thinking-loader"],
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src ?? []), "blob", "data"],
  },
};

const SAFE_RASTER_DATA_IMAGE =
  /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i;

export function isSafeMarkdownImageSource(source: string) {
  const normalizedSource = source.trim();
  if (!normalizedSource) return false;
  if (/^data:/i.test(normalizedSource)) {
    return SAFE_RASTER_DATA_IMAGE.test(normalizedSource);
  }
  return !/^(?:javascript|vbscript):/i.test(normalizedSource);
}
