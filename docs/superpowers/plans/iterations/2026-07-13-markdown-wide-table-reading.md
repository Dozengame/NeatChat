# Markdown Wide Table Reading

Date: 2026-07-13  
Branch: `dev`  
Product commit: `9e9f42d0 fix(markdown): improve wide table reading`

## Result

Ultra-wide Markdown tables no longer rely on an auto-hidden operating-system scrollbar. A table that actually overflows now exposes a persistent horizontal slider and a full-screen reading action. Compact tables remain unchanged.

Full-screen reading uses the same table DOM instead of cloning content. It preserves horizontal position, moves the live surface into a native `dialog`, labels the dialog from its table headers, focuses the close action, traps Tab inside the dialog, supports Escape/backdrop/button close, and restores focus to the original full-screen button. The shell override is deliberately placed after the shared `780/920px` rail rules so a desktop full-screen table can consume the complete dialog width. If that larger width removes the overflow, the inert slider disappears.

The custom range control maps pointer position and drag movement to the real scroll viewport. Home/End, Page Up/Page Down, and arrow keys remain available, while the underlying viewport keeps touch and trackpad scrolling. Mobile controls use `44px` targets and safe-area-aware dialog padding. Light/Dark and reduced transparency/motion continue to use existing design tokens.

## Preserved Boundaries

- Existing `780px` prose and `920px` adaptive data-surface policy remains unchanged outside full-screen.
- Streaming tables keep their monotonic width behavior and structural reset semantics.
- GFM alignment, table/header semantics, sanitization, Markdown rendering, media, code, Mermaid, artifacts, attachment, chat, provider, API, auth, MCP, store, persistence, import/export, deployment, and dependency behavior are unchanged.
- No access gate bypass, credential input, paid request, remote write, push, PR, or deploy was performed.
- The temporary Light theme selected for QA was restored to `auto` before Browser cleanup.

## Validation

- `corepack yarn jest test/markdown-table.test.tsx --runInBand --runTestsByPath`: `5/5` passed, including overflow-only controls, slider state, unique table DOM, dialog labeling, Escape/close, focus return, and compact-table control removal.
- Focused Markdown/i18n regression matrix: `15/15` suites and `87/87` tests passed.
- Complete `test/gemini-visual-migration.test.ts`: `84/84` passed.
- `corepack yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `corepack yarn build`: passed. Production route size was `105 kB / 191 kB` first load.
- Independent reviewer returned `PASS` after catching and rechecking the full-screen width specificity issue and the empty-slider case.

## Browser QA

The dev-only deterministic Markdown stress conversation was exercised through the real NeatChat UI:

- `1440x1024` desktop, Light/Dark: regular wide table `920px` shell, `918px` viewport, `1277px` table content, `18px` visible slider, `34px` full-screen button, and zero HTML/body horizontal overflow.
- `1056x834` constrained desktop: toolbar, full-screen action, edge containment, and persistent slider remained visible.
- `390x844` mobile, Light/Dark: `306px` shell, `304px` viewport, `1196px` table content, `20px` slider, `44px` full-screen action, and `390px === scrollWidth` for both `html` and `body`.
- `320x740` narrow: the same controls stayed inside the message rail with no page-level clipping or horizontal overflow.
- Desktop full-screen after the specificity correction: `1440px` dialog, `1416px` shell, `1414px` viewport/content, zero dialog slider because all columns fit, and `1440px === document.scrollWidth`.
- Opening and closing full-screen kept the stress page at three total table DOM nodes; close-button focus, Escape, button close, and trigger focus restoration all passed.

Two existing `ChatInner` warnings were present in the accumulated dev Console: a render-time component update warning and an uncached `getSnapshot` warning. Both stacks terminate in `app/components/chat.tsx` and do not enter `MarkdownTable`; this slice does not claim a clean Console or expand into that separate Zustand/render issue.

QA screenshots are retained under the local visualization directory for desktop regular/full-screen and mobile regular/full-screen states; they are not product artifacts.
