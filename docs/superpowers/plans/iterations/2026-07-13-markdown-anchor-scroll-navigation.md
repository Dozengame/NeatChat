# Markdown Anchor And Scroll Navigation

Date: 2026-07-13
Branch / baseline: `dev` / `401f888e`

## Result

- Markdown headings receive deterministic local slugs and message-scoped DOM IDs after sanitization. Duplicate headings use `-1`, `-2`, and later suffixes.
- Bare `#fragment` links no longer enter the external `_blank` path or overwrite the HashRouter. They resolve within the current `.markdown-body`, focus the target, respect Reduced Motion, and also resolve sanitized GFM footnote IDs.
- File attachments, audio/video cards, `/#/...` application routes, unsafe links, and external link safety remain on their previous branches.
- The floating chat quick-jump tracks accumulated vertical scroll direction with a `12px` reversal threshold. Up reaches the true first virtual message window and disables auto-follow; down reaches the last window and restores follow-latest.
- Programmatic virtual-window anchor compensation and boundary jumps synchronize their scroll baselines so they cannot masquerade as reverse user input. Existing composer safe-lane geometry remains unchanged.

## Tests And Runtime Evidence

- Added `test/markdown-internal-links.test.tsx` and `test/chat-scroll-navigation.test.ts`; the deterministic Markdown stress fixture now contains real TOC links.
- Focused relevant matrix: `11` suites / `47` tests passed.
- Complete visual contract: `84/84` passed.
- ESLint, `tsc --noEmit`, `git diff --check`, and production build passed; build size remained `103 kB / 189 kB`.
- Real Chrome QA passed at desktop, `390x844`, and `320x740`: TOC click kept `#/chat?codex_qa=markdown-stress`, focused the requested heading, and created no new tab; up/down labels and icon direction matched input; top/bottom boundary hiding worked; mobile button-to-composer gap remained `10px`; document overflow was `0`.
- Console contained only the existing Huaban extension attribute-injection hydration warning, not a product error. No access bypass, credential, paid request, push, PR, or deploy occurred.

## Preserved Boundaries And Remaining Manual Check

- Provider/API/MCP/auth/session/store/persistence/import-export/deployment behavior is unchanged.
- Physical iOS/Safari momentum remains a manual device boundary; Chrome wheel/trackpad-style scrolling and responsive viewport behavior are covered.
