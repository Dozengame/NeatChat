# Iteration Facts: 2026-06-29 Markdown Code Block Wrap Line Numbers

- **Change Details**:
  - Modified `CustomCode` in `app/components/markdown.tsx` to recursively split `props.children` elements on newlines via `splitChildrenIntoLines`.
  - Wrapped each code line in a `<span className="code-line">` container.
  - Inserted `<span className="code-line-newline">\n</span>` for copy/paste format fallback.
  - Added CSS Counter logic in `app/styles/markdown.scss` under `pre.markdown-code-block-wrap`:
    - Hidden Gutter line numbers visually (`color: transparent !important`).
    - Hidden inline newline spans (`display: none`).
    - Set `.code-line` to block layout (`display: block`).
    - Positioned line numbers absolutely via `::before` pseudo-element.
  - Resolved Line Numbers clipping under `overflow: hidden` by configuring `pre.markdown-code-block-wrap > code` (and `tt`) to span the Gutter area (via negative margin-left and positive padding-left).
  - Resolved Wrap Button opacity by separating hover opacity from `data-wrap-state="wrapped"` styling in `app/styles/globals.scss`.
  - Resolved Nested Code Blocks line number jumps and styling corruptions by scoping CSS selectors strictly using direct child selector (`>`) on `pre.markdown-code-block-wrap` and `:is(code, tt)`.
  - Resolved Empty Line Numbers collapse and overlap by enforcing `min-height: 1.6em` (matching code block's `line-height: 1.6`) on `.code-line` elements.
- **Verification**:
  - `yarn jest test/gemini-visual-migration.test.ts --runInBand` (Passed).
  - `yarn jest test/markdown-code-language.test.tsx test/markdown-code-fold.test.tsx --runInBand` (Passed).
  - `yarn lint` && `npx tsc --noEmit` (Passed).
  - `yarn build` (Passed).
