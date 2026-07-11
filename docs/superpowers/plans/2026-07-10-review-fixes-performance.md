# Review Fixes and Frontend Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` or execute each task with an explicit RED -> GREEN -> refactor gate. Steps use checkbox syntax for tracking.

**Goal:** Fix all eleven confirmed merged-state review findings and remove the dominant sources of sidebar and long-conversation jank without changing provider, persistence-format, attachment-wire, drag/reorder, or access-control semantics.

**Architecture:** Use a hybrid performance design. Keep the existing DnD list and 45-message DOM window, but isolate Zustand subscriptions to stable derived metadata, memoize rows, batch chat persistence during streaming, window historical message projection, and skip syntax highlighting/per-line cloning until a stream completes. Security fixes use strict raw-HTML sanitization and server-side Responses policy enforcement; runtime fixes serialize MCP client lifecycles, make unknown tool outcomes terminal, close timers in `finally`, and apply a family context budget to atomic reasoning turns.

**Tech Stack:** Next.js 14, React 18, TypeScript 5.2, Zustand 4, SCSS, Jest/jsdom, IndexedDB, OpenAI Responses, MCP SDK.

## Completion Standard

- All 11 review findings have executable regression coverage and pass on the final tree.
- A chat-store streaming update does not commit the sidebar tree when session list metadata is unchanged.
- Streaming persistence serializes/writes at a bounded cadence and flushes the completed message immediately.
- Only a bounded raw-message window is projected for the visible 45-message UI window; completed message behavior and Jimeng merging remain correct.
- Streaming Markdown never runs syntax highlighting or recursive per-line cloning; completed Markdown restores both.
- Desktop and mobile Browser QA show working sidebar scroll, long-message streaming, Settings selector focus/Escape ownership, attachment paste, and image-generation latest-intent behavior with no relevant console warnings/errors or horizontal overflow.
- Full Jest, lint, `tsc`, `git diff --check`, production build, final diff review, and independent reviewer gate pass.
- Product changes are committed locally in coherent slices. No push, PR, deploy, main-branch change, credentialed provider call, or side-effecting live MCP call.

## Risk and Preserved Boundaries

- **Risk: high.** XSS, provider policy, unknown side effects, MCP concurrency, replay context, persistence and large-list rendering are affected.
- Preserve the `文件名/类型/大小` attachment marker/parser protocol.
- Preserve explicit HTTP/tool failures as retryable model-visible failures; only executor/transport rejection is an unknown outcome.
- Preserve `reasoningEffort`, `reasoningSummary`, tools, `max_output_tokens`, non-GPT-5.6 payloads, and unlocked fields.
- Preserve drag reorder and mobile/desktop navigation; do not introduce a new virtual-list/state framework.
- Use the official GPT-5.6 family context window of 1,050,000 tokens and subtract configured output, fixed prompts/newest input, and a safety reserve before selecting atomic history turns.
- `rehype-sanitize@^5.0.1` is the only justified new dependency because it matches the repo's react-markdown 8 / rehype-raw 6 / HAST 2 stack. Do not upgrade the Markdown stack in this slice.

## Chosen Design vs Alternatives

1. **Chosen hybrid:** subscription isolation + memo + browser containment + bounded message projection + streaming-specific Markdown fast path. This addresses the measured hot paths while preserving DnD and current UI contracts.
2. **Rejected minimal CSS-only patch:** `content-visibility` already exists on desktop chat items and cannot stop React/Zustand/persist work on every token.
3. **Deferred full virtualization rewrite:** would reduce DOM further, but adds a library or custom variable-height/DnD/focus machinery and creates higher accessibility/reorder risk than the confirmed bottleneck requires.

---

### Task 1: RED security and policy contracts

**Files:**
- Create: `test/markdown-security.test.tsx`
- Modify: `test/openai-responses-tools.test.ts`
- Create: `test/openai-responses-policy.test.ts`
- Modify: `test/openai-proxy.test.ts`

**Interfaces:**
- `enforceLockedOpenAIResponsesSettings(body, policy): Record<string, unknown>`
- `ToolExecutionOutcomeUnknownError` and a closed `tool_outcome_unknown` trace

- [ ] Add a real Markdown render test that rejects `iframe`, `srcdoc`, `object`, `script`, event attributes, SVG/MathML and unsafe/obfuscated URLs, while preserving thinking `details`, GFM, highlighted completed code, KaTeX triggers, HTTPS/relative/blob images and raster base64 images.
- [ ] Add executor-rejection tests proving one mutation, no continuation round, one `onError`, no `onFinish`, complete settled parallel output, recovery pending, and no secret leakage.
- [ ] Add pure and proxy tests for all five locked GPT-5.6 fields, every family alias, multi-image input, disabled/implicit/explicit cache modes, empty key, stored continuation, non-GPT-5.6 pass-through, unlocked fields, immutable input and safety-identifier composition.
- [ ] Run the four suites and confirm failures are the missing sanitizer, terminal unknown outcome, and server policy enforcement.

### Task 2: GREEN Markdown XSS and streaming fast path

**Files:**
- Modify: `package.json`, `yarn.lock`
- Modify: `app/components/markdown.tsx`
- Modify: `app/styles/markdown.scss`
- Test: `test/markdown-security.test.tsx`, `test/markdown-performance.test.tsx`, code/Markdown suites

**Interfaces:**
- `MARKDOWN_SANITIZE_SCHEMA` permits only existing safe thinking/details/classes and standard Markdown attributes.
- `MarkdownFeatureContext` includes `streaming`.

- [ ] Install `rehype-sanitize@^5.0.1`; order plugins as raw -> sanitize -> KaTeX -> conditional highlight.
- [ ] Restrict custom image sources to HTTPS/HTTP, safe relative/blob URLs, and raster base64; never allow SVG/data HTML.
- [ ] When `streaming`, omit `RehypeHighlight`, bypass `splitChildrenIntoLines`, and defer the expensive Markdown child with React concurrency; after completion render the exact final content with highlight/line wrappers once.
- [ ] Add `content-visibility`/`contain-intrinsic-size` only where scroll measurements remain stable, with unsupported-browser fallback by normal CSS property ignoring and `prefers-reduced-motion` unchanged.
- [ ] Run RED suites to GREEN, then all Markdown suites.

### Task 3: GREEN Responses unknown outcome and server enforcement

**Files:**
- Modify: `app/client/platforms/openai-responses-tools.ts`
- Create: `app/api/openai-responses-policy.ts`
- Modify: `app/api/common.ts`
- Test: Task 1 Responses suites

- [ ] Cache completed vs unknown call outcomes; wait for all started executors; make executor rejection terminal, sanitized, recovery-pending and non-retryable across new call IDs.
- [ ] Enforce locked fields only on OpenAI `v1/responses` GPT-5.6 requests. Normalize reasoning mode/context, every input image detail, prompt-cache wire options/breakpoints/key exactly like the builder, including stored explicit continuation.
- [ ] Make valid-JSON policy failure fail closed. Malformed JSON returns 400 rather than forwarding an uninspected payload.
- [ ] Run Responses tool/policy/proxy/safety suites to GREEN.

### Task 4: RED/GREEN runtime correctness

**Files:**
- Modify: `app/mcp/runtime.ts`, `app/mcp/actions.ts`
- Modify: `app/store/chat.ts`
- Create: `app/utils/openai-history.ts`
- Modify: `test/mcp-initialize.test.ts`, `test/openai-all-turns-history.test.ts`

**Interfaces:**
- Per-client lifecycle queue serializes ensure/activate/deactivate/lazy execution and continues after rejection.
- `selectOpenAIAllTurnsHistory(...)` selects complete turn segments under the dynamic GPT-5.6 input budget and pins recovery traces atomically.

- [ ] Add RED concurrency cases: activate×2, full init+activate, activate->deactivate, lazy execute+activate, multi-client initialization.
- [ ] Implement one lifecycle queue per client; never use `clientsMap.size` as whole-system completeness.
- [ ] Add RED history cases for under/over budget, oldest whole-turn eviction, encrypted reasoning/multimodal accounting, closed trace atomicity, pinned trace overflow controlled failure, and stored/stateless parity.
- [ ] Compute available history budget from 1,050,000 context minus requested output, fixed prompts, newest input and reserve; use conservative serialized-size accounting for encrypted/tool/multimodal data. Never use `truncation:auto` to split traces.
- [ ] Run MCP/history/store/builder suites to GREEN.

### Task 5: RED/GREEN timeout lifecycle across providers

**Files:**
- Create: `app/utils/request-timeout.ts`
- Modify: `app/utils/chat.ts`
- Modify: `app/api/model-test/route.ts`
- Modify: `app/client/platforms/openai.ts`
- Modify: `app/client/platforms/{alibaba,baidu,bytedance,glm,google,iflytek,moonshot,tencent,xai}.ts`
- Create/Modify: `test/request-timeout.test.ts`, `test/stream-fetch.test.ts`, `test/openai-image.test.ts`, provider source contract tests

**Interfaces:**
- `withAbortTimeout({ controller, timeoutMs, createReason }, operation)` always clears its timer in `finally`.

- [ ] Add fake-timer RED cases for resolve/reject/sync throw/real timeout/custom image reason and pre-open SSE rejection.
- [ ] Move non-stream timers into the non-stream branch; stream branches own only their actual stream timer.
- [ ] Consume SSE Promise rejection exactly once and clear connection timers at open or terminal settlement.
- [ ] Run timeout/stream/image/provider suites to GREEN.

### Task 6: RED/GREEN sidebar, chat projection, persistence and Settings/MCP UI

**Files:**
- Modify: `app/components/sidebar.tsx`, `app/components/chat-list.tsx`, `app/components/home.module.scss`
- Modify: `app/components/chat.tsx`, `app/components/chat-render.ts`, `app/components/chat.module.scss`
- Modify: `app/components/settings.tsx`, `app/components/ui-lib-components.tsx`
- Create: `app/components/chat-qa-fixtures.ts`
- Modify: `app/utils/store.ts`, `app/store/chat.ts` only if not owned by Task 4 (sequential ownership)
- Create/Modify: `test/chat-list-performance.test.tsx`, `test/chat-render.test.ts`, `test/chat-persistence.test.ts`, Settings/visual contracts

**Interfaces:**
- `selectChatListItems(state)` returns primitive metadata snapshots with a value comparator.
- `createThrottledJSONStorage(...)` serializes streaming chat state at most once per 250 ms and immediately writes the first non-streaming completion.
- `getVisibleChatMessageWindow(messages, start, count)` inspects a bounded raw window with MCP-cycle lookbehind and returns source offsets.
- Settings selector owns focus, Tab loop, Escape, return focus and dialog labelling.
- Image-generation UI reconciles a latest desired state through one worker.

- [ ] RED: unrelated/streaming store updates cause no sidebar Profiler commit; only old/new selected rows rerender; duplicate metadata changes still update count/topic/time.
- [ ] RED: 1,000-session source contract has containment/intrinsic size and no per-token date/map recompute; browser measurement records scroll frame long tasks.
- [ ] RED: visible tail/history projection never scans the whole long conversation and preserves Jimeng merge/loading/context-divider semantics.
- [ ] RED: persistence does not stringify/write every streaming update, writes periodically, and flushes completion immediately.
- [ ] RED: selector Escape closes only the dialog, focus cycles/returns, and page route remains Settings.
- [ ] RED: image-generation `true->false` and `true->false->true` latest-intent races end in the desired state without overlapping runtime calls/stale toast.
- [ ] Convert broad store subscriptions and callback-only reads to precise selectors/getState; memoize ChatItem with stable handlers; coalesce auto-scroll rAF; add intrinsic size containment.
- [ ] Move 16.7 KB Markdown QA data to a dev/test-only dynamic module guarded by `NODE_ENV !== "production"`; production query must not load or ship the fixture chunk.
- [ ] Run frontend/performance/Settings/MCP UI suites to GREEN and inspect production build chunks for fixture absence.

### Task 7: RED/GREEN clipboard identity and legacy file-reader i18n

**Files:**
- Modify: `app/utils/file.ts`
- Modify: `app/locales/cn.ts`, `app/locales/en.ts`
- Modify: `test/attachment-file-types.test.ts`, `test/file-real-fixtures.regression.test.ts`, `test/i18n-ui-contract.test.ts`

- [ ] RED: preserve same-metadata distinct files within either clipboard source; dedupe files/items one-to-one as a multiset; keep URL suppression.
- [ ] RED: English locale produces no Chinese Word/PPT/PDF/ZIP/Excel modal, toast, fallback, truncation or unsupported/read-failure output; Chinese remains equivalent; attachment marker stays exactly unchanged.
- [ ] Implement cross-source-only clipboard dedupe without content hashing.
- [ ] Route parser UI and generated fallback text through typed locale functions. Store PowerPoint slide number separately before localized formatting, and use PDF page status enums rather than comparing localized strings.
- [ ] Run attachment/real-fixture/i18n suites to GREEN and scan production source literals with explicit marker/comment/console allowlist.

### Task 8: Integration review, Browser performance QA and delivery

**Files:**
- Local-only: this plan, `current.md`, `README.md`, one dated iteration handoff

- [ ] Run targeted suites for every task, then `yarn test:ci`.
- [ ] Run `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build`.
- [ ] Run independent read-only code review over baseline `095f97a5..final` and fix all Critical/Important findings.
- [ ] Browser desktop and mobile: inject deterministic large-session/long-message local fixtures without credentials, measure DOM/scroll/frame behavior before/after, exercise selector Escape/Tab, sidebar select/delete/scroll, long streaming code, paste duplicates, and image toggle latest intent. Check page identity, meaningful DOM, overlay absence, console, screenshot, overflow and interaction state.
- [ ] Verify no QA fixture string/chunk appears in production build, no timer remains after rejected deterministic requests, and no product semantics outside the plan changed.
- [ ] Update local handoff, create coherent local commits, confirm final `git status` and report no remote actions.

## Authoritative References

- OpenAI GPT-5.6 Sol model: 1,050,000 context window and 128,000 max output: `https://developers.openai.com/api/docs/models/gpt-5.6-sol`.
- react-markdown security guidance: untrusted HTML with `rehype-raw` should use `rehype-sanitize`: `https://github.com/remarkjs/react-markdown`.
- rehype-sanitize schema/security guidance: `https://github.com/rehypejs/rehype-sanitize`.

