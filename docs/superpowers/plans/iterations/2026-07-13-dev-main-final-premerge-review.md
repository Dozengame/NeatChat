# Final `main...dev` Pre-Merge Review

- Date: 2026-07-13
- Branch and write boundary: `dev` only
- Delivery commit: the commit containing this document, subject `fix: close final dev pre-merge audit findings`

## Completion Standard

- Fetch remote refs, verify the active branch and a clean starting worktree, and compare the complete merge-base range.
- Review every changed layer through its real call chains, not only recent commits or plan claims.
- Fix only confirmed defects or low-risk regressions attributable to, or directly exercised by, the `dev` range.
- Preserve provider, auth, persistence, attachment, image, MCP, Web/PWA, and Tauri product semantics outside the defect.
- Pass the complete test suite, lint, TypeScript, production build, patch checks, risk-based Browser QA, and an independent semantic re-review.
- Commit and push only to `dev`; do not merge, rebase, rewrite history, create a PR, deploy, or enter credentials.

## Fetched Baseline And Scope

- `main=origin/main=merge-base=0280cb3d10f32d3afe8d26051fa86f79b4e8cdfd`.
- `dev=origin/dev=0a74915b1dc9b1cebb8bdd2ad7396b7b1dea0cc8` at review start.
- `git rev-list --left-right --count main...dev`: `0 35`; all 35 ahead commits are non-merge commits.
- `git diff --shortstat main...dev`: 183 files, 27,739 insertions, 5,511 deletions.
- The range includes 63 tests, 30 plan/docs files, 26 utilities, 22 components, 17 client/provider files, 6 API files, 5 store files, 3 MCP files, styles/locales/config, and package-lock changes.
- There are no range changes under `src-tauri/`, `next.config.mjs`, Docker, or Vercel configuration. `react-window`, `rehype-sanitize`, and their type packages are the dependency additions.
- The initial worktree was clean. Root `AGENTS.md`, local credentials, `.env`, caches, screenshots, and build products are excluded from the delivery.

## Reviewed Chains

- New chat, send/regenerate/stop/delete/switch, stream state, timeout and abort, virtualized history, quick-jump, resize following, and persistence scheduling.
- OpenAI Chat Completions and Responses routing, role/history conversion, tool calls/results, capability gating, model tests, output budgets, streaming terminal states, errors, images, and Summary requests.
- MCP configuration, concurrent initialization, retry/reconnect, partial failure, prompt/tool availability, execution errors, and chat degradation.
- Every existing provider adapter and the shared configuration/request merge path, with special attention to OpenAI refactors leaking into other providers.
- Server/public/client model defaults, locks, hydration, reasoning and verbosity controls, i18n, keyboard semantics, and responsive selector geometry.
- Markdown sanitize/runtime layout, internal links, code, tables, math, Mermaid, streaming cost, and artifact previews.
- Attachment wire format, supported types, PDF concurrency/lifecycle, duplicate handling, image generation/editing options, and failure recovery.
- IndexedDB/fallback compatibility, clear/delete behavior, pending writes, long-history persistence, Web/browser boundaries, static export, and Tauri source compatibility.

## Confirmed Findings And Fixes

### High

- Public provider errors could pass credential-like environment assignments, Authorization/token material, internal URLs, paths, raw JSON, or oversized upstream bodies to users. The public error filter now accepts only short, plain, non-sensitive messages plus safe request IDs; regression coverage includes OpenAI-style and environment-variable secrets.
- Clearing chat data could race an already queued async persist and resurrect deleted sessions. Clear now waits for the persisted chat key to be removed before the store reset completes, with a deterministic pending-write regression test.

### Medium

- One broken MCP server could reject the whole initialization batch, hide already healthy tools, and leave future chats without a reliable retry path. Initialization now settles servers independently, retains healthy clients and prompt tools, applies a finite retry cooldown, and lets chat continue without MCP when prompt loading fails. Mixed healthy/broken and recovery paths are covered.
- Successful IndexedDB set/remove/clear operations did not clear stale in-memory fallback values, so later IndexedDB outages could return deleted or outdated data. Successful durable mutations now reconcile the fallback cache.
- Async Markdown/image/artifact height growth could leave a user who was following the tail above the latest content. A content `ResizeObserver` follows only while tail-follow intent is active; manual wheel/touch scrolling still detaches it, and quick jumps do not rewrite that intent.
- PDF loading tasks were not destroyed after successful or failed document extraction. The loading task is now released in `finally`, with success and rejection coverage.
- An HTML artifact whose `code` prop changed could reuse its loaded-frame identity, suppress `onLoad`, and retain stale title/height state. Code/reload revisions now create a fresh sandbox frame identity and reset derived state.
- OpenAI output caps and controls treated `chat-latest`, o-series, and arbitrary prefix-compatible custom names too broadly. Exact official model families and dated snapshots now receive documented caps and capabilities; chat models do not expose reasoning/verbosity, pro models with no streaming use the JSON path, and unknown custom suffixes keep the conservative generic fallback.
- Summary history trimming used the active chat budget and treated an explicit zero as a zero-token hard limit. It now resolves the target Summary model budget and treats non-positive configuration as unset fallback.
- Unknown image model names inherited optimistic size options. They now retain a conservative option set instead of claiming unsupported dimensions.

### Low

- Repeated image URLs in one message could produce duplicate React keys. Render identity now includes the image index.
- One plan file contained trailing whitespace, and two source-string contracts still described pre-fix behavior. Formatting and contracts were corrected without relaxing behavior checks.

No Critical finding remained. Independent review found no remaining High/Important issue in the audited change set after the corrections.

## Tests Added Or Strengthened

- Added IndexedDB durable/fallback reconciliation, MCP chat recovery/partial failure, and PDF lifecycle suites.
- Extended OpenAI Responses builder/tools, model-test route/helper, server config, Summary request/session/settings, public-error, image capability, chat persistence, scroll/navigation/performance, artifact preview, home mode, and frontend compatibility contracts.
- The final visual contract asserts the quick-jump-aware scroll synchronization instead of the obsolete unconditional auto-follow call.

## Final Verification

- `yarn test:ci`: PASS, 77/77 suites and 725/725 tests.
- `yarn lint`: PASS, zero warnings and zero errors.
- `npx tsc --noEmit --pretty false`: PASS.
- `git diff --check`: PASS.
- `yarn build`: PASS; optimized production compilation, lint/type phase, page data, and 6/6 static pages completed.
- `yarn export`: FAIL at the pre-existing `/api/openai/v1/images/[action]` POST route because `output: export` cannot statically materialize the dynamic server route. Both that route and `next.config.mjs` are byte-equivalent to `main`; no range change introduced the failure, and no fake static implementation was added.
- Targeted regression groups and the independent reviewer passed OpenAI, MCP, persistence, PDF, artifact, Summary, image, and scroll coverage.
- Real Browser QA passed desktop `1440x1024`, mobile `390x844`, and narrow `320x740`, Light/Dark, Chat/Image mode, model dialog/Escape focus restoration, multiline composer growth, a 140-message virtualized history, async tail resize, manual-scroll detachment, zero horizontal page overflow, and a clean fresh console.

## Explicit Non-Claims And Residual Boundaries

- No paid OpenAI or other provider request, live third-party MCP side effect, real image generation/edit, or credentialed reverse-proxy smoke test was run.
- Tauri source and scripts were reviewed for affected browser/API boundaries, but native packaging was not run because `src-tauri/` is unchanged. Safari and Firefox were not physically exercised.
- The static export/API architecture predates this range and requires a separate product/deployment decision: a static bundle cannot host the dynamic image POST route.
- Historical Tencent direct-mode signing/config inconsistencies and non-OpenAI Summary output-budget policy are outside this range and were not silently redesigned.
- Future OpenAI model variants need explicit capability entries or will intentionally use conservative fallback behavior.

## Delivery Boundary

The fixes, tests, and tracked handoff are one review slice. Push only the containing commit to `origin/dev`. Do not write to or merge `main`, create a PR, deploy, or alter remote configuration.
