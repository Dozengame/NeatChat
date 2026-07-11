# Current Plan State

Last updated: 2026-07-11.

## Repo State

- Branch: `dev`.
- Current HEAD: `04cc2644 fix(markdown): correct rejected layout regressions`.
- The committed three-slice Markdown optimization was rejected in visual acceptance; the root-cause correction is now committed locally. No push, PR, deploy, or remote configuration change was performed.
- Root `AGENTS.md` and `docs/superpowers/plans/` remain local-only/ignored and are not part of product history.

## Task Routing Boundary

Recent commits contain substantial Gemini-style UI/UX work, but that history is not the default scope for new tasks. Route each request from its actual layer:

- Frontend/UI and Markdown
- Backend/API and provider/streaming
- MCP/Plugin and external integrations
- Auth/security
- State, persistence, sync, import/export
- Configuration, deployment, export, or Tauri desktop
- Cross-layer request chains

Do not turn backend, runtime, configuration, or persistence work into a visual-polish slice. Do not apply Browser QA to server-only changes without a UI surface.

## Stable Source Anchors

- Frontend shell and interaction: `app/components/`, `app/styles/`.
- Backend/API and security: `app/api/`, `app/utils/access-*.ts`.
- Provider client and streaming: `app/client/`, `app/utils/stream.ts`, `app/utils/openai-*.ts`.
- MCP runtime and UI integration: `app/mcp/`, `app/components/mcp-market*`.
- State and persistence: `app/store/`, `app/utils/storage.ts`, `app/utils/indexedDB-storage.ts`, `app/utils/sync.ts`.
- Configuration and i18n: `app/config/`, `app/locales/`, `.env.template`, `next.config.mjs`.
- Deployment and desktop: `Dockerfile`, `docker-compose.yml`, `vercel.json`, `src-tauri/`.
- Contract tests: `test/`; choose suites by the changed layer.

## Recent Verified Changes

- 2026-07-11 homepage composer correction decouples opening the conversation-tools menu from `expandInput()`, so the empty composer keeps its compact pill geometry while the menu opens. The textarea now explicitly overrides the global `*:focus-visible` outline; focus remains visible on the rounded composer surface instead of rendering a rectangular native outline. The visual contract passed `84/84`, ESLint, TypeScript, `git diff --check`, and production build passed. Auth blocked the real local chat route, so Chrome QA used a temporary compiled-SCSS fixture without bypassing access control: composer stayed `706x62px` with `999px` radius before/after menu open, menu width was `320px`, textarea `outline-style` was `none`, and there was no horizontal overflow. The fixture was deleted; no push or deploy was performed.
- 2026-07-11 Markdown acceptance correction fixes five user-visible regressions from the three-slice version: all prose/blockquote/hr/details/task/math roots now resolve onto the centered `780px` track; Markdown task checkboxes suppress the global checked `::after` and use one `18px` control; sanitizer preserves remark-math `span.math.math-inline` and `div.math.math-display` markers so KaTeX runs; generic details child padding no longer erases list/code gutter padding; and desktop prompt/actions share a right-side cluster with actions last.
- Fresh verification passed the real sanitize-to-KaTeX runtime (`12/12`), rejected-layout contracts (`4/4`), relevant Markdown fixture contracts, Chat rendering, the complete visual suite (`84/84` before the fixture-only extension plus final targeted rerun), ESLint, TypeScript, `git diff --check`, and a production build. Chrome `1650x941` Light/Dark QA used the actual Markdown component and production Header classes without bypassing the access gate: canvas `920px`, prose/details/formulas `780px`, checkbox `18px` with `::after=none`, KaTeX inline/display `1/3`, details code start padding `58px`, Header prompt-to-actions gap `10px`, actions right gap `18px`, and no horizontal overflow. The temporary QA route/cache were deleted.
- 2026-07-11 uncommitted Markdown optimization was delivered as three independently observable slices: semantic/accessibility hardening (native closed/open details, overflow-only table/formula regions, media semantics, focus/pinch behavior); a 780px prose / 920px data reading system with 15px default text and calmer light/dark surfaces; and long-form interactions (non-overlay contextual prompt slot plus mobile badge, code action overlay without reserved content rail, static no-latency token metadata, Mermaid figure/source disclosure, and source-validated uniquely titled HTML previews).
- Verification passed `84` visual-contract tests, `31` targeted behavior tests across Markdown/Sanitize/Mermaid/chat/artifact preview, ESLint, TypeScript, `git diff --check`, and a production build. Browser QA used a temporary local compiled-CSS fixture because the legitimate chat route was access-code gated; desktop `1440x1024`, mobile `390x844`, and narrow `320x740` had no page overflow, expected 780/920 widths, internal code scrolling, 34/36px code actions, closed details, dark theme tokens, and zero console warn/error. The fixture was deleted after QA.
- Independent read-only review found and closed two Important polish gaps before final verification: image preview/code-expand/token controls now keep a real high-contrast focus outline, and the mobile context badge uses an invariant white foreground with `99+` overflow text instead of the theme-dependent `--white` token.

- `095f97a5`: routed the Settings/chat/model/attachment/image/Markdown/editor/update-announcement UI introduced by the recent frontend work through typed Chinese and English locales; added an i18n contract; and made `reasoningMode`, `reasoningContext`, `inputImageDetail`, `promptCacheMode`, and `promptCacheKey` default administrator-locked fields without locking `reasoningEffort`. Global, persisted session, and temporary-session stale overrides are replaced by `admin_forced` values. The UI lock remains a client/public-config policy, not server-side request authorization.
- `cc6e8641`: added a GPT-5.6 Prompt Cache `disabled` setting. The internal mode maps to OpenAI's documented zero-write shape—`prompt_cache_options.mode="explicit"` with `ttl="30m"`, no `prompt_cache_key`, and no breakpoint—because omitting cache options would fall back to implicit caching. Settings expose Disabled/Implicit/Explicit and disable the key input while Disabled is selected. Local `.env` uses `disabled` with an empty key; no push or main merge was performed.
- `114c49fb`: added the OpenAI-only GPT-5.6 alias/Sol/Terra/Luna family, made `gpt-5.6-terra` the default, added the `2026-02-16` cutoff, six reasoning efforts, web/vision support, 128K output normalization, and migration of old/disallowed sessions.
- `524d338a`: added GPT-5.6 mode/context/image-detail/Prompt Cache settings and payloads, verified server-only `safety_identifier`, encrypted stored/stateless replay, native Responses Plugin function tools, finite/abort-safe recovery, Retry protection for side effects, and responsive Settings controls.
- `114c49fb` and `524d338a` were fast-forwarded from local `main` to `dev` and pushed to `origin/dev`. Post-merge verification passed all 37 Jest suites and 375 tests, lint, `tsc`, diff checks, and the production build.
- `3ca4a7c8`: MCP initialization now retries retryable transient network failures with finite backoff and records an error only after final failure. Server-side verification used targeted Jest, lint, `tsc`, diff check, and build; no Browser QA was required.
- `1e6dc330`: clipboard attachment collection deduplicates the same pasted file across browser clipboard representations; image editing replaces only the selected attachment.
- `0280cb3d`: duplicate attachment render keys and functional deletion updates stabilize removal of visually identical image/file attachments.
- Root `AGENTS.md` was rewritten on 2026-07-10 as an evidence-first full-stack guide. It now treats UI, API/provider, MCP, auth/security, state/persistence, configuration/deployment, and Tauri as first-class scopes and removes the obsolete claim that the visual migration test reads local `AGENTS.md`.

## Current Runtime And QA Boundaries

- The localization/admin-lock slice passed the complete Jest suite (`38` suites / `397` tests), lint, `tsc`, commit and range diff checks, and a fresh production build. In-app Browser QA at desktop `1280x720` and mobile `390x844` confirmed English Settings/chat chrome, all five GPT-5.6 controls disabled with `Administrator locked`, no horizontal overflow, one working conversation-tools interaction, and no console warnings/errors. User-authored chat titles and Custom Instructions remain untranslated by design.
- The merged-state review covered the final tree and the net diff from `081673c8` across `394` commits and `127` files. Highest-priority unresolved findings are raw-HTML Markdown XSS and unknown-outcome Responses tool side effects. The detailed severity-ordered list and evidence live in `iterations/2026-07-10-i18n-admin-lock-review.md`.
- Prompt Cache Disabled verification passed 5 targeted Jest suites / 107 tests, lint, `tsc`, diff checks, and production build. Independent review caught and resolved the important distinction between omitted options (implicit default) and explicit-without-breakpoint (zero write). Browser QA confirmed Disabled/Implicit/Explicit, disabled key input, no overflow at desktop and `390x844`, and no console warning/error.
- GPT-5.6 verification used 18 relevant Jest suites (276 tests), lint, `tsc`, diff checks, production build, and in-app Browser QA at desktop `1280x720` and mobile `390x844`. Settings showed Terra plus all five capability controls, no horizontal overflow, and no browser console warnings/errors.
- No paid OpenAI request or live third-party Plugin execution was performed. External API behavior is covered by official schema review plus deterministic builder/SSE/proxy/executor tests; a live credentialed smoke test requires explicit authorization.
- Programmatic Tool Calling, hosted MCP, and Multi-agent remain intentionally disabled because they require separate beta headers, approval/caller protocols, and attribution semantics.
- Never bypass the access-code gate or enter real credentials. If authenticated Browser QA is blocked, use source/Jest, DOM/CSSOM, compiled CSS, deterministic fixtures, or server logs and state the boundary.
- In-app Browser screenshot, viewport control, or DOM snapshots can be unreliable; use current DOM metrics, console logs, CSSOM, and visible screenshots as cross-checks.
- Only in the known local post-build scenario, stale dev-server state can make `/api/config` return HTML/Edge errors; restart the dev server as a diagnostic branch, not as a general fix.
- Root `AGENTS.md` and internal plans must remain out of product commits. Do not recreate `design-qa.md` or a parallel `.agentdocs/` tree.

## Scoped Candidates

Use only when supported by a fresh request or current evidence:

- OpenAI GPT-5.6: only with explicit credentials/authorization, run a minimal live Responses smoke test for one text response and one harmless direct Plugin function. Do not enable PTC, hosted MCP, or Multi-agent as a payload-only follow-up.
- Backend/API: if real image requests still exceed Vercel's current function limit, evaluate provider-supported background/streaming flow or a runtime with a longer execution window.
- MCP/runtime: if Jimeng activation still fails after retry, capture the current digest/server log and separate transient connect timeout from persistent reachability or remote-service failure.
- Frontend/UI: continue Gemini/Markdown polish only from a fresh visible regression; do not reopen covered surfaces from old screenshots alone.
- Security: remove or strictly sanitize `RehypeRaw` before treating assistant/user Markdown as trusted rendering; add real raw-HTML XSS tests rather than mocked plugin coverage.
- Responses tools: model rejected/timeout outcomes after a potentially mutating tool call as unknown, and require idempotency or user confirmation before any retry with a new call id.
- Localization: the recent UI chrome is covered, but the legacy Word/PowerPoint/PDF/ZIP/Excel reader error dialogs in `app/utils/file.ts` still contain Chinese and need a separate parser-output/i18n contract before broad translation.
- State/persistence/auth/deployment/Tauri: no standing rewrite is assumed; begin from live code, current config, runtime evidence, and the user's requested outcome.
