# Frontend Motion and Rendering Polish (2026-07-22)

## Scope and boundaries

- Task class: frontend (motion, rendering performance, theme transitions). User goal: showpiece-level frontend polish covering page motion, long-text performance, sidebar performance, loading motion, button liveliness, premium feel, and responsive details, all compatible with both light and dark themes, on `dev` only.
- Preserved semantics: virtual window paging (15/45), streaming Markdown coalescing, anchor/scroll contracts, composer DOM and business chain, provider/store/MCP/auth/persistence/API/deployment/Tauri, dependency set. No new dependency.
- Intentionally not done (risk > gain, verified against live code): `content-visibility` on sidebar chat items (dnd dimension-marshal measures all rows on drag start), deferred `sidebarWidth` store commit during drag (`utils/screen.ts` compact-layout decision consumes it live), any composer geometry/token change (fresh remediation contracts), global `* { transition }` theme fade (performance and focus-ring risk).

## Delivered changes

### Motion foundation and theme transition

- `app/styles/animation.scss`: new global keyframes `message-enter`, `loading-aura-pulse`, `loading-dot-wave`, `loading-bar-shimmer` (compositor-only transform/opacity).
- `app/styles/globals.scss`: `::selection` themed via `color-mix(--primary 26%)`; scrollbar thumb hover deepens via new `--scrollbar-thumb-hover-color` tokens in both light and dark mixins; `::view-transition-old/new(root)` 0.36s root fade with reduced-motion fallback inside the existing reduced-motion media block (a separate earlier media block broke the test's first-block extraction — keep it there).
- `app/components/home.tsx` `useSwitchTheme`: theme class mutation is wrapped in `document.startViewTransition` when the API exists and `prefers-reduced-motion` is off; first mount always applies instantly; unsupported browsers fall back to the previous instant switch. Meta theme-color updates stay synchronous.

### Loading

- `app/components/loading.tsx` + `home.module.scss`: logo with breathing `--primary` radial aura, three-dot staggered wave, shimmer progress bar; `noLogo` route variant keeps dots + bar. All new animations are disabled under reduced motion in the single trailing reduced-motion block in `home.module.scss` (same first-block extraction constraint as globals).
- Follow-up (route unification): new `RouteLoading` export wraps the route fallback with a 160 ms anti-flash delay (fast chunk loads show nothing instead of a loading blink); `.loading-content` now has a `fade-in 0.24s ease-out` entrance, also reduced-motion-gated. All 9 dynamic route fallbacks in `home.tsx` (Settings, Chat, NewChat, Mask, Plugin, SearchChat, Sd, McpMarket, Artifacts) use `RouteLoading`; the boot hydration gate keeps the immediate full `Loading`. New global `fade-in` keyframe in `animation.scss`. Verified live: throttled-network navigation to `#/plugins` showed dots with `loading-dot-wave` + 0.15s stagger, `loading-bar-shimmer`, and the `fade-in` container; unthrottled fast navigation shows no loader flash.

### Button liveliness and message motion

- `app/components/button.module.scss`: `transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)` added to the IconButton transition; `@media (hover: hover)` lift `translateY(-1px)`; `:active:not([disabled])` press `scale(0.92)`; reduced-motion resets duration and transform. No persistent `will-change`.
- `app/components/home.module.scss` `.sidebar-nav-item`: label slide on hover (`span` translateX 2px, narrow icon-only mode renders no span and is untouched), press `scale(0.98)`, reduced-motion reset.
- `app/components/chat.module.scss`: `.chat-message-tail` entrance upgraded from linear `slide-in` to `message-enter 0.38s cubic-bezier(0.22,1,0.36,1)` (fade + 14px rise + 0.985 scale settle); gating (true final assistant message only) and existing reduced-motion removal unchanged.
- `.chat-message-actions` transition now covers `transform` (was opacity-only, so the 4px hover reveal jumped); test contract regex updated to the new exact list, and the rail added to the reduced-motion block.

### Long-text rendering performance

- `.chat-message-row`: `content-visibility: auto` + `contain-intrinsic-size: auto 140px`. Offscreen rows skip paint/layout while `auto` remembers last rendered size, keeping scrollHeight stable for the anchor paging math (rect-based `isRetainedVisibleMessageAnchor`/`getAnchoredScrollTop` verified compatible). Find-in-page and a11y tree are preserved by `content-visibility: auto`.

### Overlay entrance unification

- `app/styles/animation.scss`: new shared overlay keyframes `overlay-panel-in` (fade + 12px rise + 0.97 scale) and `overlay-sheet-in` (fade + 18px bottom rise); the existing `fade-in` doubles as the backdrop fade, so overlays now speak the same motion language as `message-enter` (settle curve `cubic-bezier(0.22,1,0.36,1)`).
- `app/components/update-announcement.module.scss`: local `updateAnnouncementMaskIn/PanelIn/SheetIn` keyframes deleted; mask uses `fade-in 0.18s ease-out both`, desktop panel `overlay-panel-in 0.24s`, mobile sheet `overlay-sheet-in 0.28s`. Per-surface durations preserved; only curve/geometry unified.
- `app/components/ui-lib.module.scss`: `.modal-container` moves from linear `slide-in ease 0.3s` to `overlay-panel-in 0.3s` settle curve; under the existing ≤600px media query (where `.modal-mask` is `align-items: flex-end` and the container is a bottom sheet) it overrides to `overlay-sheet-in 0.3s`. One class change covers every `showConfirm`/`showPrompt`/`showModal`/`showImageModal` and all Modal consumers because they all render `.modal-mask > .modal-container`. `slide-in` itself stays for popovers/lists/toasts.
- `app/styles/globals.scss`: `.modal-mask` gains `animation: fade-in 0.18s ease-out` (was an instant hard cut).
- Pre-existing Chrome bug found and bounded: the reduced-motion rule whose selector list contains `input[type=range]::-webkit-slider-thumb, ::-moz-range-thumb, ::-ms-thumb` is dropped entirely in Chrome — unknown pseudo-elements invalidate the whole selector list, so that rule never applied to anything (confirmed via CSSOM walk: rule absent; probe element still animated). Added a dedicated valid `.modal-mask { animation: none !important; transition-duration: 0.01ms !important; }` rule inside the same media block (contract's first-block extraction and selector-sequence regex both preserved). Reviving the dead rule for form controls is out of scope and recorded here.
- Visual contract updated intentionally: update-announcement keyframe assertions repointed from the three local names to shared `fade-in`/`overlay-panel-in`/`overlay-sheet-in` in `animation.scss`, panel geometry assertion updated to 12px/0.97, and an added `not.toContain("@keyframes updateAnnouncement")` guard.

## Verification

- `yarn lint` zero warnings; `npx tsc --noEmit` clean; `git diff --check` clean; `yarn build` passed (`/` 108 kB, First Load JS 195 kB, +1 kB from the home.tsx transition wiring).
- Full Jest `87/87` suites, `869/869` tests, including the updated Gemini visual contract (`85/85`) and chat scroll/performance suites.
- Browser QA (Chrome via WebBridge, dev server run with access-control env cleared for a credential-free local QA instance; production gate untouched): 240-message stress conversation rendered 15 -> 30 -> 45 rows on edge paging, capped at 45, anchored scroll restoration intact with `content-visibility: auto` computed on rows; zero horizontal overflow at desktop and `390x844`; light and dark screenshots of long chat and mobile views clean; interaction pass (paging, theme toggling, nav hover/press) logged zero console errors; real Settings theme switch drove `startViewTransition` (spy counted calls) and applied `dark`/`light` body classes correctly.
- Hidden-tab caveat: programmatic scroll events are deferred while the QA tab is not frontmost; an early "paging not firing" reading was a harness artifact, resolved with `Page.bringToFront` — not a product regression.

### Overlay slice verification (third commit)

- `yarn lint` zero warnings; `npx tsc --noEmit` clean; `git diff --check` clean; `yarn build` passed; full Jest `87/87` suites, `869/869` tests, updated visual contract `85/85`.
- Browser QA (WebBridge, credential-free local dev instance): fresh-load update announcement in light + dark — computed mask `fade-in 0.18s ease-out`, panel `overlay-panel-in 0.24s cubic-bezier(0.22,1,0.36,1) both` (screenshots `/tmp/neatchat-qa/overlay-announce-{light,dark}.png`); Settings 立即清除 `showConfirm` in dark + light — mask `fade-in`, container `overlay-panel-in 0.3s` (`overlay-confirm-{dark,light}.png`); CDP `390x844` emulation — bottom-sheet layout (`align-items: flex-end`) with container `overlay-sheet-in 0.3s` (`overlay-confirm-mobile.png`); `prefers-reduced-motion: reduce` emulation — mask and container both compute `animation: none` after the dead-selector fallback (probe element confirmed the original rule was Chrome-dropped); emulation cleared and normal path re-verified (`fade-in` + `overlay-panel-in`). All dialogs closed via 取消, never 确认; no data mutated.

## Residual risks and next candidates

- Physical Safari/Firefox/Edge and real touch hardware not exercised; View Transition degrades to instant switching where unsupported.
- `contain-intrinsic-size` estimate (140px) can transiently under/over-estimate scrollHeight for never-rendered tall rows until first render; self-corrects via `auto` memory, observed stable in the 240-message pass.
- Loading screen visual verified via CSSOM keyframes + markup for the boot path; the route-level `RouteLoading` was verified live under throttled network (dots wave, shimmer bar, fade-in container) plus fast-path no-flash behavior.
- Next candidates from prior review remain: per-session lazy hydration, `first_char_delay_*` localStorage eviction, incremental Markdown parsing.
