# 2026-06-25 Token Comfort Sweep

Use this file when a task touches low-glare theme token work or asks whether a surface was already polished.

## Theme

The day focused on replacing raw paint, harsh shadows, and hard-coded light/dark assumptions with semantic surface tokens across many utility surfaces. Most slices preserved behavior and changed only visual tokens, sizing, focus/hover/active states, reduced-motion, or mobile bounds.

## Covered Areas

- Markdown: long links, prose rhythm, mobile code/table readability, inline monospace, table rows, task checkbox, base separators/highlights, media frames, thinking cards.
- Chat: assistant bubble surface, composer send foreground, reading audio surfaces, image preview overlay.
- Settings/auth/shared UI: auth gate, settings sync/access/danger, model config, input range, modal input, native controls, shared icon buttons.
- Utility surfaces: export/message selector, plugin edit modal, MCP tools states, artifacts preview, SD output shadows, image editor canvas, new chat start surface, error recovery panel.
- Dormant Realtime Voice: control/status token comfort without enabling the feature.

## Representative Commits

- `04e3f28a style(markdown): wrap long links cleanly`
- `bfd052dc style(markdown): refine prose rhythm`
- `8ebd72e6 style(markdown): refine mobile code tables`
- `50884ae5 style(chat): soften assistant message bubble`
- `984c9c0c style(chat): soften header menu shadows`
- `465a9615 style(realtime): soften voice controls`
- `e92b3de3 style(chat): tokenize composer send foreground`
- `5604069e style(auth): soften access gate surfaces`
- `55ef8f8f style(export): soften selector preview surfaces`
- `515b210f style(sd): soften output shadows`

Use `git log --oneline --since='2026-06-25' --until='2026-06-26'` for the full list before touching any covered area.

## Recurring Verification Boundary

Many target Browser checks were blocked by the access-code gate. Accepted evidence often combined:

- source/Jest visual contracts
- production CSS bundle checks
- DOM/CSSOM checks
- access-gate overflow/console smoke
- read-only review

Do not present access-gated target surfaces as live-authenticated Browser proof.

## Continue Only When

- Current source still has raw paint or token drift.
- A visible regression appears in Browser evidence.
- A test contract needs strengthening around a specific surface.

Do not continue the 2026-06-25 sweep as a broad "find more tokens" task without evidence.

## 2026-06-27 Mobile Sidebar Drawer

- Commit: `72b217ea style(home): soften mobile sidebar drawer`, pushed to `origin/dev`.
- Files: `app/components/home.module.scss`, `test/gemini-visual-migration.test.ts`.
- Visible change: mobile sidebar drawer/backdrop light/dark/auto-dark tokens no longer hard-code raw dark/light RGB paints; drawer, shadow, inset, backdrop, and blur/saturate values now reference existing semantic theme tokens with softer low-glare values.
- Preserved semantics: no changes to `home.tsx`, `sidebar.tsx`, drawer width/offset/narrow fallback, z-index, ARIA, routing, auth/account, model/provider/store, backend/API, or deployment behavior.
- TDD: strengthened `gemini-visual-migration` source contract first; RED failed on old raw mobile sidebar token expectations, then GREEN after SCSS update.
- Verification: `yarn jest test/gemini-visual-migration.test.ts --runInBand` PASS 83/83; `yarn lint` PASS; `npx tsc --noEmit --pretty false` PASS; `git diff --check` PASS; `git diff --cached --check` PASS; `yarn build` PASS with existing Edge Runtime static-generation warning only.
- Browser QA: dev server `/api/config` returned JSON 200; in-app Browser mobile `390x844` opened `/#/chat`, triggered sidebar to `#/`, verified drawer `role=dialog`, `aria-modal=true`, width 304px, backdrop visible, no horizontal overflow, no framework overlay, no console warn/error. Narrow `320x740` kept drawer at `calc(100vw - 54px)` / 266px and no overflow. Desktop `1440x1024` smoke kept sidebar/chat input visible and no overflow. Initial Browser page held stale CSS until reload; served CSS and post-reload CSSOM matched new tokens.
- Review: read-only explorer and reviewer found no blocking issues; reviewer noted that `--black` / `--black-50` are accepted existing theme-aware foreground tokens, not source raw paints.

## 2026-06-27 Sidebar Dark Token Parity

- Commit: `8e025de3 style(home): align sidebar dark tokens`, pushed to `origin/dev`.
- Files: `app/components/home.module.scss`, `test/gemini-visual-migration.test.ts`.
- Visible change: sidebar manual dark and auto-dark override tokens now share the same low-glare token set for sidebar background, mobile shadow, card hover, action drop shadow, and mobile account/settings surfaces. The dark mobile drawer/account shadows no longer source raw `rgb(0, 0, 0)` paint and instead derive from `var(--surface)`.
- Preserved semantics: no `home.tsx` / `sidebar.tsx` changes; drawer width/offset, desktop sidebar behavior, route changes, account/settings controls, model/provider/store, backend/API, auth, and deployment config were untouched.
- TDD: strengthened `gemini-visual-migration` first. RED caught the old raw dark sidebar shadow and old raw account shadow; GREEN passed after the SCSS token update.
- Verification: `yarn jest test/gemini-visual-migration.test.ts --runInBand` PASS 83/83; `yarn lint` PASS; `npx tsc --noEmit --pretty false` PASS; `git diff --check` PASS; `git diff --cached --check` PASS; `yarn build` PASS with the existing Edge Runtime static-generation warning only.
- Browser QA: after `yarn build`, the dev server was restarted because the in-app Browser initially held stale CSS module rules. `/api/config` returned JSON 200 and the page returned HTML 200. Cache-busted Browser QA confirmed mobile `390x844` and narrow `320x740` drawers opened from `查看消息列表`, had no horizontal overflow, kept the account card/settings button visible, and had no console warn/error. Desktop `1440x1024` kept the sidebar/chat input visible and no overflow. Runtime CSSOM confirmed manual dark and auto-dark `--sidebar-mobile-shadow` / `--sidebar-mobile-account-shadow-color` use `var(--surface)`, and old `rgb(0, 0, 0)` 44%/18% shadow sources were absent. Forced dark computed-style mutation was blocked by the Browser DOM proxy, so dark evidence is source/Jest/CSSOM rather than screenshot-only.
- Review: read-only reviewer found no blocking, important, or minor issues. Residual risk is only perceptual: authenticated live dark-theme screenshot proof still depends on access-gated runtime.
- Next candidate: chat empty state suggestions low-glare/motion polish; explorer found it is a visible first-run surface with contained source/test scope.
