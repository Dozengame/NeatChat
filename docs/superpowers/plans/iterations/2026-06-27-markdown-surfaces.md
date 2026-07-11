# 2026-06-27 Markdown Surfaces

Use this file for the current Markdown, streaming, scroll, and message-action state.

## Commit Map

- `1d1a883c style(markdown): polish rendered content controls`
- `087675a6 style(markdown): polish reading surfaces`
- `5a3c2622 style(chat): quiet message action rail`
- `647ce7e2 style(chat): protect scroll affordance spacing`
- `61c54f29 style(markdown): polish streaming boundary affordance`
- `9787a98d test(markdown): harden stress media fixtures`
- `f68fe0c6 style(markdown): refine table details interactions`
- `3f3b3db1 style(markdown): polish diagram preview scroll`
- `176e6940 style(markdown): polish task footnote surfaces`
- `514fd0bd style(chat): smooth composer motion surfaces`
- `fa71be15 style(chat): refine reading and settings surfaces`

## Completed Slices

### Markdown Settings Interaction Polish

- Added code-block wrap toggle next to copy.
- Preserved code copy text without line numbers or controls.
- Styled task-list groups and fixed mixed image/media paragraph line-height.
- Converted mobile Settings selects to a full-screen selector sheet.
- Added full-screen custom-instructions editing.
- Browser QA covered desktop, mobile, narrow dark, Settings selector, and custom instructions modal.

### Markdown Reading Surface Polish

- Expanded deterministic stress fixture with deep-reading sections.
- Tokenized blockquote text, max reading width, inline-code inset shadow, and table focus ring.
- Covered light and dark desktop/mobile/narrow with no page/message overflow.
- Table internal horizontal scroll is intentional.

### Message Action Quiet Rail

- Desktop message action rails default hidden and become available on hover/focus-within.
- Mobile/touch rails remain visible.
- Removed duplicate user-message edit/avatar JSX and hidden user edit buttons.
- Browser hover proof was unreliable; keyboard focus and visible click paths were verified.

### Scroll Affordance Safe Area

- Replaced negative scroll-button offset with composer-relative bottom spacing.
- Added dynamic bottom safe-area measurement from the input panel.
- Verified normal and expanded composer spacing.
- Browser QA used a temporary local config override for fixture-only access-gate bypass; live account/API behavior stayed out of scope.

### Streaming Boundary Affordance

- Added final-block streaming affordance for details, tables, artifact previews, image-only paragraphs, and audio/video media.
- Fixed duplicate image/media parent caret.
- Target proof used real compiled CSS in a local static fixture because authenticated chat route was gated.

### Stress Media Runtime Fixtures

- Added small public QA-only audio/video fixtures for `codex_qa=markdown-stress`.
- Added `streaming_boundary=details|table|artifact|image|media|all`.
- Direct media resources returned 200 with correct media content type.
- Authenticated chat DOM remained blocked by access gate.

### Details/Table Interaction Polish

- Added table scroll-shell hover/focus transitions, themed scrollbars, stable gutter.
- Added ordinary Markdown `details` summary hover/focus/active states and marker.
- Fixed open-details hover precedence and reduced-motion test slicing.

### Diagram Preview Scroll Polish

- Added Mermaid scrollbar tokens and fallback code styling.
- Added artifact preview focus styling without creating a wrapper Tab stop.
- Moved `:has(> iframe:focus)` selectors into `@supports selector(:has(*))`.

### Task Footnote Surface Polish

- Added low-glare task-list card, checkbox, and footnote focus/target tokens.
- Bounded task-list and footnote reading surfaces.
- Added exact light/dark token assertions after local review found weak token checks.

### Composer Motion Surface Polish

- Shortened composer action label reveal from hard-coded `0.5s` delay to tokenized `0.12s` / `0.18s` cubic timing for hover and focus-visible.
- Added paint containment and `will-change` hints to dropzone and streaming reveal surfaces, with reduced-motion reset to avoid persistent composition hints.
- Removed tracked Jest dependency on ignored local `AGENTS.md`/old `design-qa.md`; visual contract now checks the tracked ignore rule instead.
- Preserved submit, stop, drag/drop attachment limits, upload processing, a11y labels, and model/account/backend semantics.
- Verification: `yarn jest test/gemini-visual-migration.test.ts --runInBand`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn build`.
- Browser QA: desktop `1440x1024` and mobile `390x844` on `/?codex_qa=markdown-stress&streaming_boundary=all#/chat`; no console warn/error, no framework overlay, no horizontal overflow, input fill enabled Send, tools menu opened as dialog, CSSOM confirmed reveal tokens, dropzone/streaming paint containment, and reduced-motion `will-change` reset.
- Boundary: initial post-build dev server returned `/api/config` HTML 500 / Edge sandbox error; restarted dev server and confirmed `/api/config` JSON 200 before final Browser QA.

### Reading And Settings Refresh

- Refined existing-chat reading width to `780px`, narrowed user bubbles, and kept assistant Markdown messages transparent in the reading surface.
- Removed duplicate model selection from the existing-chat composer; model selection remains in the chat header when content exists.
- Reworked Settings into one scroll stack with a top search field and horizontal section tabs; removed the extra vertical rail.
- Preserved model/provider/store, attachment, image generation, shortcuts, clear-context, sync/import/export, custom-instructions modal, and danger-action semantics.
- Verification: `yarn jest test/gemini-visual-migration.test.ts --runInBand`, targeted Markdown/chat suites, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build`.
- Browser QA: desktop `1440x1024`, constrained desktop `1056x834`, and mobile `390x844`; no horizontal overflow, no console warn/error, reading assistant CSS compiled as transparent/borderless, mobile table radius remained `10px`, Settings had no rail, and Settings search/tabs stacked correctly on mobile.
- Browser QA catch: the reading-surface assistant override originally lost to a later base bubble rule; the final CSS order now places the override after the base bubble rules.

## Verification Baseline Used

Most slices ran:

```bash
yarn jest test/gemini-visual-migration.test.ts --runInBand
yarn jest test/markdown-code-fold.test.tsx test/markdown-code-language.test.tsx test/markdown-file-attachment.test.tsx test/message-content.test.ts test/chat-render.test.ts test/chat-stream-payload.test.ts test/markdown-performance.test.tsx --runInBand
git diff --check
yarn lint
npx tsc --noEmit --pretty false
yarn build
```

## Current Risks

- Authenticated `markdown-stress` Chat DOM is often blocked by local access-code gate. Do not enter a real access code.
- Some target-surface proof uses a local static fixture with compiled CSS. Treat that as CSS/runtime-style proof, not full authenticated app proof.
- Browser `data:` fixtures can be blocked by Browser URL policy.
- Browser hover simulation is unreliable; use CSS/Jest contracts plus focus/click proof.
- `public/codex-qa` media fixtures are small and non-sensitive but will be part of a production static bundle if deployed.

## Good Next Work

- Add authenticated runtime proof only when a session is already legitimately open.
- If current evidence shows drift, continue Markdown mixed-content or streaming affordance work in one narrow slice.
- Avoid broad token sweeps unless `rg` or Browser evidence identifies a specific raw-paint or contrast issue.

## Markdown Code Detail Acceptance Fix

- Local uncommitted slice fixes three acceptance issues: auto-wrap keeps one line-number row per source line, PC wrap buttons default-hide like copy buttons, and HTML preview iframes receive a theme baseline so simple `.card` previews do not stay light inside dark mode.
- Source changes: `app/components/markdown.tsx`, `app/styles/markdown.scss`, `app/styles/globals.scss`, `app/components/artifacts-preview.tsx`, `test/markdown-code-language.test.tsx`, `test/gemini-visual-migration.test.ts`.
- Preserved semantics: chat/model/provider/store/backend behavior unchanged; code copy now explicitly uses normalized original code text to avoid DOM line-number pollution.
- Verification: `yarn jest test/markdown-code-language.test.tsx --runInBand` was RED before implementation and GREEN after; `yarn jest test/gemini-visual-migration.test.ts --runInBand`, `yarn jest test/markdown-code-fold.test.tsx test/markdown-code-language.test.tsx test/markdown-file-attachment.test.tsx test/markdown-performance.test.tsx --runInBand`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed.
- Browser QA: restarted `yarn dev` after build caused a stale loading state, then verified desktop `1056x834` dark `Markdown压测` with 9 code blocks where `rowCount === data-line-count`, wrap/copy buttons default hidden on PC, and mobile `390x844` still had source-line row parity with wrap buttons available.
- Boundary: current local data did not render an artifact iframe in that conversation, so dark HTML preview proof is static visual contract plus component source injection rather than a live iframe in the selected chat.

## Markdown Visual Regression Correction

- Local uncommitted follow-up narrows the prior bug fix so it does not restyle user HTML previews: artifact iframe theme injection now only sets color-scheme/body baseline and no longer injects `.card` or forced font-family styles.
- Code-line layout no longer uses the sticky/grid row gutter that clipped HTML source on desktop; the line number is a relative inline gutter with scroll transform, preserving one source-line row while keeping code text intact.
- Verification: `yarn jest test/gemini-visual-migration.test.ts --runInBand`, `yarn jest test/markdown-code-fold.test.tsx test/markdown-code-language.test.tsx test/markdown-file-attachment.test.tsx test/markdown-performance.test.tsx --runInBand`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed.
- Browser QA: local `http://localhost:3000/#/chat`, dark desktop selected `主题提取要求`; HTML line text was `<div class="card">`, line-number right edge was before content left edge, page had no horizontal overflow, and the iframe `srcdoc` had theme baseline but no `.card` override.

## Markdown Line Number And Preview Spacing Follow-Up

- Local uncommitted follow-up fixes user acceptance notes that wrapped/long code blocks visually lost their line numbers and HTML preview cards sat too close to the left edge.
- Code line numbers now sit above the code-block fade layer, use `var(--color-fg-default)` in dark mode, and use `font-weight: 600`; source-line row count and copy text semantics are unchanged.
- HTML preview iframe body padding is restored to `16px` with `box-sizing: border-box`; `.card` remains untouched, so user-authored card styles are not overridden.
- Verification: visual contract RED/GREEN, `yarn jest test/markdown-code-fold.test.tsx test/markdown-code-language.test.tsx test/markdown-file-attachment.test.tsx test/markdown-performance.test.tsx --runInBand`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed.
- Browser QA: after post-build dev-server restart, `http://localhost:3000/api/config` returned JSON 200. Desktop `主题提取要求` had 12 code blocks, line `44` had `rgb(201, 209, 217)`, `font-weight: 600`, `z-index: 2`, no content overlap, no page horizontal overflow, and the HTML preview `srcdoc` had body padding plus no `.card` override.

## 2026-07-11 Markdown Three-Slice Optimization

### Slice 1: semantic and accessibility baseline

- Preserved native `details` closed/open state instead of forcing every disclosure open; sanitizer now retains safe `open` and Markdown class attributes.
- Table and display-formula shells receive region semantics and keyboard focus only when they actually overflow.
- Removed empty caption tracks from Markdown media, retained explicit media lint boundary, strengthened focus-visible tokens, and restored browser pinch zoom.

### Slice 2: reading and theme system

- Split layout into a centered `780px` prose column and `920px` data surfaces for code, tables, Mermaid, and artifacts.
- Raised the new-install default font size from `14px` to `15px` without migrating existing persisted preferences.
- Tightened heading scale, normalized code/footnote text, and reduced light/dark blockquote, code, table, Mermaid, and artifact glare while preserving token-only paint.

### Slice 3: long-form interactions

- Moved desktop contextual prompts into normal Header flow and merged the mobile count into the existing Settings control, eliminating content overlap.
- Grouped wrap/copy controls into a scroll-compensated overlay so code retains normal end padding; mobile targets are `36px` and narrow targets `34px`.
- Rendered token counts without latency as static metadata rather than a false button; retained the interactive latency chip when a finite non-negative delay exists.
- Wrapped Mermaid output in a labeled figure with a collapsed source disclosure. HTML Preview now has a visible caption, stable unique iframe title, document-title reporting, positive finite height checks, and same-frame/source message validation.

### Verification and boundary

- Passed: `test/gemini-visual-migration.test.ts` (`84/84`), targeted Markdown/Sanitize/Mermaid/chat/artifact suites (`31/31`), `yarn lint`, `tsc --noEmit`, `git diff --check`, and `yarn build`.
- Browser QA: the authenticated Chat DOM was access-code gated and was not bypassed. A deleted-after-use static fixture loaded the real dev CSS at desktop `1440x1024`, mobile `390x844`, and narrow `320x740`; it confirmed 780/920 width separation, zero page overflow, internal code scrolling, focus-visible action overlay, closed details, dark theme tokens, stable iframe title, and no console warn/error.
- Independent review caught two Important specificity/theme gaps before handoff: image preview, code-expand, and interactive-token controls now retain `var(--focus-ring)` outlines; the mobile context badge now uses an invariant white foreground and `99+` count overflow. The visual contract, targeted tests, lint, TypeScript, diff check, and production build were rerun after these fixes.
- Preserved: provider/API/MCP/auth/session/store/persistence/import-export/deployment semantics and user-authored iframe styles. No paid request, push, PR, or deploy was performed.

## 2026-07-11 Markdown Acceptance Correction

- Local product commit: `04cc2644 fix(markdown): correct rejected layout regressions`.
- User rejected the three-slice version for five concrete regressions: mixed prose left edges, double-painted task checkboxes, raw TeX, misaligned/clipped expanded details content, and desktop Header controls spread across the row.
- Verified root causes were CSS cascade/specificity, the global checked-checkbox `::after` leaking into Markdown, math marker classes being stripped before `RehypeKatex`, generic details-child `padding-left` overriding list/code padding, and three direct Header children inheriting global `space-between`.
- Product fixes: explicit centered margins for high-specificity prose surfaces; one `18px` Markdown checkbox with local `::after` suppression; sanitizer allowlists for `span.math.math-inline` and `div.math.math-display`; restored native list/code padding inside details; and one right-side `promptToast -> actions` cluster with constrained-desktop prompt text collapse.
- The deterministic Markdown QA fixture now contains inline/display math, an open details card, list content, and a JavaScript code block so the rejected surfaces remain reproducible without persistence or network calls.
- Verification passed: real sanitize-to-KaTeX tests (`12/12`), rejected-layout contracts (`4/4`), relevant QA-fixture contracts, Chat rendering (`6/6`), full visual contracts (`84/84` before the fixture-only extension plus final targeted rerun), ESLint, TypeScript, `git diff --check`, and production build.
- Chrome `1650x941` Light/Dark QA rendered the actual Markdown component and production Header classes. Measured results: `920px` data canvas; every prose/details/formula root `780px` at the same `x`; checkbox `18x18` with `::after` `display:none`; KaTeX inline/display `1/3`; details list padding `27.2px`, code pre left padding `58px`; Header prompt/action gap `10px`, action/right edge `18px`; no page horizontal overflow; a fresh QA tab had no console warn/error.
- Auth boundary: the local Chat route remained access-code gated and was not bypassed. A temporary direct-component Next route was used and then deleted. Its dev terminal emitted SSR-only `window/localStorage` diagnostics because the production Markdown component normally mounts under the client app; browser rendering and fresh-tab console evidence were clean. This harness diagnostic is not part of the product tree or final build.
- Preserved: provider/API/MCP/auth/session/store/persistence/import-export/deployment semantics. No paid request, push, PR, or deploy was performed.
