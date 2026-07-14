# Dev to Main Frontend Performance Review

## Scope and delivery boundary

- Baseline: `origin/main=0280cb3d`, `origin/dev=ed5bac80`, merge-base=`origin/main`.
- Baseline range: 47 non-merge commits, 207 changed files, `+35,023/-7,334`.
- Delivered commit: `32973c0e` (`perf(frontend): optimize long chat rendering and compatibility`).
- Pushed only `dev -> origin/dev`. No merge, PR, deploy, rebase, history rewrite, tag, `main` checkout, or `main` push.
- Review followed the real UI -> store/persistence -> provider/MCP -> rendered-result chains and kept auth, provider request contracts, persistence format, deployment, and Tauri behavior unchanged unless a verified bug required a local fix.

## Delivered result

### Long-chat performance

- Normal first paint remains the latest 15 messages. The DOM grows one 15-message page at a time only when the viewport is underfilled or the user reaches an edge, and remains capped at 45 messages.
- Paging anchors now carry absolute indexes. A window shift occurs only when a currently visible anchor survives the next slice; an oversized first Markdown row therefore cannot be removed while it still covers the viewport.
- Streaming Markdown keeps immediate first and final flushes, but uses 120/250/500/1200 ms coalescing beyond 32K/64K/128K/256K characters so the full parser is not scheduled faster than it can finish.
- Token counts call the scalar estimator directly instead of allocating an estimated-token array. The unused permanent `msg_start_*` localStorage write was removed.
- Modern browsers use the reading-surface `ResizeObserver` as the content-growth follow path. Markdown no longer schedules a second auto-scroll callback, explicit scroll-to-bottom uses one cancellable animation frame, and fallback behavior remains for browsers without `ResizeObserver`.
- Code blocks keep one scroll handler, and Markdown tables register a window resize listener only when `ResizeObserver` is unavailable.
- The development stress fixture supports 240 mixed messages, compact history, and safe editable-input timing without allowing a real send.

### Correctness found during the full diff review

- Jimeng text/video results now preserve known video URLs and opaque `public_urls` as safe links. Signed quoted URLs retain raw commas, duplicate/truncated media links are removed, and unmatched bare closing punctuation is normalized.
- A successful Jimeng submit may request one browser-safe download URL. A successful follow-up query is terminal even if it only returned a local `MEDIA` path, so a successful job no longer becomes a 40x3-second timeout.
- Turning Image mode off updates only the browser intent/cache; it no longer deactivates a process-global MCP client shared by other users. Explicit MCP management actions remain available elsewhere.
- Latest-winner cloud sync now recursively overlays nested defaults, replaces arrays intentionally, clones values, and rejects `__proto__`, `prototype`, and `constructor` keys.
- `docs/superpowers/plans/` remains tracked for cross-device collaboration and handoff. The restored plan set was checked for literal credentials, private keys, common token formats, personal home paths, and email addresses before synchronization. Root agent context remains local-only.

### Compatibility, accessibility, and motion

- The desktop Settings entry is one link rather than a nested link/button pair.
- Compact textarea text uses `max(16px, configured size)` to avoid iOS focus zoom; desktop keeps the configured size.
- Mobile header, message actions, and Markdown code controls use 44px interaction targets. Code rails were widened so the larger targets do not overlap content.
- Existing glass, spring-like, and spatial motion remains. Safari-compatible glass surfaces add `-webkit-backdrop-filter`, supported by WebKit's Safari 18 transition to unprefixed `backdrop-filter`.
- The reasoning rail preserves its timing and sparkle while moving fill animation from layout `width` to compositor-friendly `scaleX`.
- Only the true final assistant message receives the entrance animation; virtual-window paging cannot replay it on an old row. Reduced Motion disables that entrance while the default experience remains intact.

## Browser and performance evidence

- Authenticated Chrome, desktop `1440x1024`, real development runtime, 240-message Markdown/code/table/image/details/audio/video fixture.
- Initial tail: 15 rendered messages, about 3,460 total DOM nodes, internal scroll height about 21,767px, document horizontal overflow 0.
- Repeated rapid paging: 15 -> 30 -> 45 messages, never above the cap; returning to latest restored 15 messages and the true bottom.
- A rejected fixed-45 first-paint experiment produced about 8,253 DOM nodes and a 55,829px surface, so the final implementation deliberately keeps the 15-message first paint.
- Long-list input accepted 280 characters in about 15 ms with the textarea focused and responsive. The quick-jump interaction reached the true bottom in the observed run.
- Light and Dark both rendered without document overflow or Chrome console warnings/errors. Settings exposed one focusable semantic target.
- Baseline Chrome at `390x844` and `320x740` reproduced the 15px input and sub-44px targets before the fix. Final mobile values are enforced by compiled CSS/contracts; the Chrome viewport override became unavailable later in the run, so physical post-fix mobile/Safari remains a manual boundary rather than a false live claim.

## Final verification

- `corepack yarn test:ci --runInBand`: 81 suites / 823 tests passed.
- Focused performance/MCP/scroll/compatibility suites: passed, including the oversized-row retained-anchor model and Jimeng terminal/public-URL boundaries.
- `corepack yarn lint`: passed with zero warnings/errors.
- `npx tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed before commit; committed worktree is clean.
- `corepack yarn build`: passed on the committed tree. `/` is 108 kB, First Load JS 194 kB.
- Post-push state: `HEAD=origin/dev=32973c0e`; `origin/main=0280cb3d` remains the merge-base and was not modified.

## Residual risks

- Physical Safari, Firefox, Edge, Windows High Contrast, touch hardware, soft keyboard, and Safari compositing were not available for final execution. Current evergreen behavior is covered by Chrome, feature detection, WebKit compatibility handling, CSS contracts, and deterministic tests.
- All persisted sessions still hydrate into one Zustand store. Per-session lazy hydration or storage sharding requires a migration and is not safe as an unbounded pre-merge refactor.
- Off-window `details`, code-wrap, table-scroll, and gallery local component state can reset after the message leaves the 45-row window.
- `first_char_delay_*` localStorage entries and module-level image caches do not yet have centralized eviction.
- Incremental Markdown parsing remains separate architectural work; the current fix reduces scheduling pressure without risking syntax divergence across streaming chunk boundaries.
