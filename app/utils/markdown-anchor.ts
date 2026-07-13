type MarkdownAstNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: MarkdownAstNode[];
};

export type MarkdownHeadingAnchorOptions = {
  scope?: string;
};

const HEADING_TAG_PATTERN = /^h[1-6]$/;
const SANITIZE_ID_PREFIX = "user-content-";
const SANITIZE_ID_PREFIX_PATTERN = /^user-content-/;

function decodeFragment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function isMarkdownFragmentHref(href: string) {
  return href.startsWith("#") && href.length > 1 && !href.startsWith("#/");
}

export function normalizeMarkdownAnchor(value: string) {
  const decoded = decodeFragment(value.replace(/^#/, ""));
  const normalized = decoded.normalize("NFKC").toLowerCase().trim();
  const withoutPunctuation = Array.from(normalized)
    .filter(
      (character) =>
        character === "-" || character === "_" || !/\p{P}/u.test(character),
    )
    .join("");

  return (
    withoutPunctuation
      .replace(/\p{C}+/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

function getMarkdownAstText(node: MarkdownAstNode): string {
  if (node.type === "text") return node.value ?? "";
  if (node.tagName === "img") {
    const alt = node.properties?.alt;
    return typeof alt === "string" ? alt : "";
  }
  return (node.children ?? []).map(getMarkdownAstText).join("");
}

function getUniqueAnchor(
  baseAnchor: string,
  anchorCounts: Map<string, number>,
) {
  const count = anchorCounts.get(baseAnchor) ?? 0;
  anchorCounts.set(baseAnchor, count + 1);
  return count === 0 ? baseAnchor : `${baseAnchor}-${count}`;
}

export function rehypeMarkdownHeadingAnchors(
  options: MarkdownHeadingAnchorOptions = {},
) {
  const scope = normalizeMarkdownAnchor(options.scope ?? "markdown");

  return (tree: MarkdownAstNode) => {
    const anchorCounts = new Map<string, number>();

    const visit = (node: MarkdownAstNode) => {
      if (
        node.type === "element" &&
        HEADING_TAG_PATTERN.test(node.tagName ?? "")
      ) {
        const existingId =
          typeof node.properties?.id === "string"
            ? node.properties.id.replace(SANITIZE_ID_PREFIX_PATTERN, "")
            : "";
        const baseAnchor = normalizeMarkdownAnchor(
          existingId || getMarkdownAstText(node),
        );
        const anchor = getUniqueAnchor(baseAnchor, anchorCounts);
        node.properties = {
          ...node.properties,
          id: `${scope}-${anchor}`,
          dataMarkdownAnchor: anchor,
          tabIndex: -1,
        };
      }

      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

export function findMarkdownAnchorTarget(
  markdownRoot: ParentNode,
  href: string,
) {
  if (!isMarkdownFragmentHref(href)) return null;

  const decodedAnchor = decodeFragment(href.slice(1));
  const unclobberedAnchor = decodedAnchor.replace(
    SANITIZE_ID_PREFIX_PATTERN,
    "",
  );
  const normalizedAnchor = normalizeMarkdownAnchor(unclobberedAnchor);
  const idCandidates = new Set([
    decodedAnchor,
    unclobberedAnchor,
    `${SANITIZE_ID_PREFIX}${decodedAnchor}`,
    `${SANITIZE_ID_PREFIX}${unclobberedAnchor}`,
  ]);

  return (
    Array.from(
      markdownRoot.querySelectorAll<HTMLElement>(
        "[data-markdown-anchor], [id]",
      ),
    ).find((element) => {
      const localAnchor = element.dataset.markdownAnchor;
      return (
        (localAnchor != null &&
          (localAnchor === decodedAnchor ||
            localAnchor === unclobberedAnchor ||
            normalizeMarkdownAnchor(localAnchor) === normalizedAnchor)) ||
        idCandidates.has(element.id)
      );
    }) ?? null
  );
}
