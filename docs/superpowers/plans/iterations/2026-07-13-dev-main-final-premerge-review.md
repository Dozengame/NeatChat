# Complete `main...dev` Pre-Merge Review

- Date: 2026-07-13
- Branch and write boundary: `dev` only
- Delivery commit: the commit containing this document, subject `fix: harden pre-merge runtime boundaries`

## Completion Standard

- Fetch remote refs, verify `dev`, preserve a clean user baseline, and review the complete merge-base range.
- Trace changed behavior through UI, store/persistence, provider/API, MCP, config, and rendering boundaries rather than relying on plan claims.
- Fix only confirmed defects or low-risk regressions in, or directly exercised by, `main...dev`.
- Pass the complete Jest suite, lint, TypeScript, production build, patch checks, risk-based Browser QA, and independent semantic review.
- Commit and push only to `origin/dev`; do not merge, rebase, rewrite history, create a PR, deploy, or write to `main`.

## Fetched Baseline And Scope

- `main=origin/main=merge-base=0280cb3d10f32d3afe8d26051fa86f79b4e8cdfd`.
- `dev=origin/dev=0e6972dd10fabd0e91899a4b09ae011e6298819e` at review start.
- `git rev-list --left-right --count main...dev`: `0 44`; all 44 ahead commits are non-merge commits.
- `git diff --shortstat main...dev`: 193 files, 30,576 insertions, and 6,403 deletions.
- The range includes 67 tests, 33 tracked plan files, 28 utilities, 22 components, 17 client/provider files, 6 API files, 5 store files, 3 MCP files, plus styles, locales, config, and dependency changes.
- There are no range changes under `src-tauri/`, `next.config.mjs`, Docker, or Vercel configuration. Dependency additions remain `react-window`, `rehype-sanitize`, and their type packages.
- The initial worktree was clean. Root `AGENTS.md`, `.env`, credentials, caches, screenshots, and build products are excluded from delivery.

## Reviewed Chains

- New chat, send/regenerate/stop/delete/switch, preflight, controller handoff, stream terminal state, timeout, cancellation, model switching, long-history projection, anchors, and persistence scheduling.
- OpenAI Chat Completions and Responses routing, role/history conversion, stored/stateless continuation, tool calls/results, model capability gating, images, Summary requests, error envelopes, and SSE lifecycle.
- Alibaba, Anthropic, Baidu, ByteDance, GLM, Google, iFlytek, Moonshot, Tencent, and xAI request/stream completion and error behavior.
- MCP access tiers, configuration/status exposure, initialize/retry/reconnect, partial server failure, tool schema/call validation, generic/Jimeng result display, and original-session isolation.
- Server/public/client model defaults, locks, hydration, reasoning and image controls, i18n, keyboard/pointer semantics, and responsive selector geometry.
- Markdown sanitize/runtime layout, links/anchors, tables, code, math, Mermaid, artifacts, streaming cost, and stable message render identity.
- Attachment wire format, supported types, PDF lifecycle, image generation/editing failure paths, IndexedDB/fallback compatibility, sync merge, clear/delete behavior, Web/export, and Tauri source boundaries.

## Confirmed Findings And Fixes

### High

- Provider adapters could treat non-2xx, non-JSON, native error envelopes, or empty bodies as successful completions and could surface raw upstream details. All affected adapters now reject invalid terminal responses, use settle-once streaming lifecycles, release timeout/abort resources, and pass only sanitized public errors. Safe request IDs remain available; credentials, headers, internal endpoints, paths, and raw bodies are filtered.
- MCP routes exposed configuration/status and mutations without a consistent access-tier boundary. Signed access context now separates normal `use` from administrator `manage`; raw configuration/status and mutations are administrator-only, normal chat receives a safe server projection, Jimeng activation follows its intended use boundary, and tool names/argument objects are validated against initialized definitions.
- Generic sync merge accepted prototype-bearing keys. Recursive merge now rejects `__proto__`, `prototype`, and `constructor`, with deterministic pollution coverage.

### Medium

- Active-controller abort events could settle before provider callbacks, classifying ordinary upstream errors containing `aborted` as user cancellation and discarding late Responses trace metadata or partial text. Provider callbacks are authoritative, the Store fallback is deferred, Timeout/Error/User Abort classification follows the controller reason, and late user-stop completion can enrich the saved partial message without restarting summary/title work.
- Stopping an image request could leave a terminal message that still said generation was in progress. Image cancellation now ends with localized Chinese/English cancelled copy.
- Generic MCP failures left the visible tool card permanently in a preparing state and success results followed whichever session was current when the Promise resolved. Both success and failure are now bound to the originating session; failure becomes a localized, non-secret terminal state and remains retryable through a new user turn.
- Message render keys included `absoluteIndex`, remounting all later visible messages after insert/delete/pin operations. IDs are now stable within `context` or `session`, with the index used only for legacy messages lacking an ID. Pinned context uses a detached deep clone with a fresh ID, and edit lookup respects the rendered source.
- Clearing chat data could race a queued persist and resurrect deleted state. Writes are suspended before controller shutdown/removal/IndexedDB clear, and the storage contract covers pending-write removal.
- Sync read the remote payload more than once and merged against mutable local state. It now reads once, snapshots local JSON after the remote read, preserves the selected session while sorting, updates projection/list revisions, honors Config/Access timestamps, and applies returned merger values.
- Unknown GPT-like suffixes inherited optimistic Responses capabilities. Exact known families and dated snapshots receive reasoning, verbosity, web-search, and output policies; custom unknown suffixes keep conservative compatibility.
- Server lock names could visually disable controls that had no authoritative public server value. Model controls now recognize locks only for the actual server-backed field contract; image size/quality/style and unsupported penalty names are not falsely presented as enforced.

### Low

- Safe provider messages already beginning with the localized fallback could be prefixed a second time by the Store. Public error composition now deduplicates the English/Chinese fallback while retaining safe request IDs.
- A streaming Markdown table could briefly expose a full-screen action whose content was still changing. The toolbar action is suppressed until the table is stable.
- The reasoning rail accepted non-primary pointer presses; it now starts drag interaction only for the primary left pointer.
- HTML artifact preview titles now use the localized label. One tracked plan file's trailing whitespace and two stale source contracts were corrected.

No Critical finding remained. Independent semantic review passed after all High/Medium findings were closed.

## Tests Added Or Strengthened

- Added `openai-nonstream-error` and `sync-merge` suites.
- Extended request timeout, public error, provider config, OpenAI model/Responses builder, MCP initialize/chat/display, chat preflight/abort/persistence/performance, render identity, Markdown table, server config, model settings, reasoning rail, and i18n coverage.
- Regression cases cover HTTP/native/non-JSON/empty provider failures, sensitive detail removal, settle-once aborts, late partial Responses traces, image cancellation, MCP original-session failure, server-backed locks, prototype keys, selected-session retention, and clear-data pending writes.

## Final Verification

- Initial baseline before edits: `78/78` suites and `732/732` tests PASS.
- Final `corepack yarn test:ci`: PASS, `80/80` suites and `788/788` tests.
- `corepack yarn lint`: PASS with zero warnings/errors.
- `corepack yarn tsc --noEmit --pretty false`: PASS.
- `git diff --check` and `git diff main --check`: PASS.
- `corepack yarn build`: PASS; optimized production compilation, lint/type phase, page data, and `6/6` static pages completed.
- `corepack yarn export`: FAIL at the pre-existing `/api/openai/v1/images/[action]` dynamic POST route because `output: export` requires `generateStaticParams()`. The route, export script, and `next.config.mjs` behavior already exist on `main`; the review does not replace a server API with a fake static implementation.
- Independent review passed 21 targeted suites / 293 tests plus TypeScript, lint, and patch checks.
- In-app Browser QA covered `1440x1024`, `1056x834`, `390x844`, and `320x740`; auto/Dark/Light; Chinese/English switching; multiline composer growth; Chat/Image entry controls; model popup clamping and Escape focus restoration; a 140-message windowed fixture; stable anchors; wide-table internal scroll/full-screen/focus restoration; links, code, math, artifacts, image/audio/video fixtures; zero page overflow; and a clean fresh Console after reload. Mermaid behavior is covered by its component/runtime Jest suite because the real QA fixture has no Mermaid sample.

## Explicit Non-Claims And Residual Boundaries

- No paid provider call, live third-party MCP side effect, real image generation/edit, or credentialed reverse-proxy smoke test was intentionally performed. Text/stream/tool/image failure behavior is verified through deterministic mocks, request structures, and the local fixture.
- Tauri source compatibility was reviewed, but native packaging was not run because `src-tauri/` is unchanged. Safari and Firefox were not physically exercised.
- Upload/delete/send attachment behavior is covered by the attachment/PDF/wire Jest suites and rendered local media fixture; the Browser pass did not operate the OS file chooser.
- Sync still lacks per-message revisions/tombstones and strict imported-schema validation, so same-ID concurrent edits/deletes remain last-merge limitations. Changing that requires a versioned data contract and is outside this defect-only review.
- The static export/API architecture predates this range and requires a deployment decision: a purely static artifact cannot host the dynamic image POST route.

## Delivery Boundary

The fixes, tests, and tracked handoff form one review slice. Push only the containing commit to `origin/dev`. Do not write to or merge `main`, create a PR, deploy, alter remote configuration, or rewrite history.
