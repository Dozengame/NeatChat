# English UI, GPT-5.6 Locks, and Merged-State Review Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove production hard-coded Chinese UI text from English surfaces, make the five GPT-5.6-only capability fields administrator-locked by default, and review the merged current code from `081673c8f63f7d4a9cdeb551710f825cadfba8ea` through the final working tree.

**Architecture:** Keep localization in the existing typed `app/locales/cn.ts` / `app/locales/en.ts` dictionaries and replace literals at their render sites; dynamic labels are locale functions, while persisted user content and the legacy attachment wire format stay unchanged. Reuse the existing public-config lock pipeline by adding only the five GPT-5.6 fields to the default locked-field set; the review remains read-only and reports only current, reproducible findings.

**Tech Stack:** Next.js 14, React 18, TypeScript, Zustand, Jest, SCSS.

## Global Constraints

- Preserve model/provider payload behavior, prompt-cache request semantics, auth/access-code behavior, persistence formats, attachment protocol, and external state.
- Lock exactly `reasoningMode`, `reasoningContext`, `inputImageDetail`, `promptCacheMode`, and `promptCacheKey` by default; do not default-lock `reasoningEffort`.
- Treat the existing lock mechanism as deployment configuration, not a new administrator identity/role system.
- Do not translate user-saved text, local QA fixture content, comments, console-only diagnostics, or legacy attachment markers in this slice.
- Do not push, deploy, create a PR, alter upstreams, or stage local-only plan files.

---

### Task 1: RED localization and lock contracts

**Files:**
- Create: `test/i18n-ui-contract.test.ts`
- Modify: `test/gpt56-settings-contract.test.ts`
- Modify: `test/server-config.test.ts`
- Modify: `test/config-merge.test.ts`

**Interfaces:**
- Consumes: source files and `resolveLockedFields()` / `applyPublicAppConfig()`.
- Produces: failing assertions for locale-routed Settings/Chat/Markdown/editor copy and five default locked fields.

- [x] Add source contracts that reject the confirmed production literals and require corresponding `Locale` references.
- [x] Assert all five GPT-5.6 fields are returned by default lock resolution, while `reasoningEffort` remains unlocked.
- [x] Assert public config publishes the five values in `forced`, and global plus synced/unsynced sessions replace stale values with `admin_forced` locked metadata.
- [x] Run `yarn jest test/i18n-ui-contract.test.ts test/gpt56-settings-contract.test.ts test/server-config.test.ts test/config-merge.test.ts --runInBand --runTestsByPath` and confirm failures are the missing localization/default-lock behavior.

### Task 2: Locale production UI surfaces

**Files:**
- Modify: `app/locales/cn.ts`
- Modify: `app/locales/en.ts`
- Modify: `app/components/settings.tsx`
- Modify: `app/components/chat.tsx`
- Modify: `app/components/model-config.tsx`
- Modify: `app/components/image-editor.tsx`
- Modify: `app/components/markdown.tsx`
- Modify: `app/components/file-attachment.tsx`
- Modify: `app/components/home.tsx`
- Modify: `app/components/sidebar.tsx`
- Modify: `app/components/ui-lib-components.tsx`
- Modify: `app/components/update-announcement.tsx`
- Modify when confirmed by non-component audit: `app/utils/file.ts`, `app/utils/image-action-labels.ts`, `app/client/platforms/openai-responses-tools.ts`, `app/client/platforms/openai.ts`

**Interfaces:**
- Produces: typed locale groups/functions for Settings sections, composer/tool/menu/attachment ARIA and toasts, model controls, editor toolbar, Markdown/file/media controls, navigation, announcement copy, and source labels.
- Preserves: all callback behavior, persisted values, file markers, model values, provider payloads, and QA fixture content.

- [x] Add matching Chinese and English keys/functions; fix English full-width punctuation.
- [x] Replace confirmed production literals with `Locale` calls without changing component structure or behavior.
- [x] Remove the committed trailing whitespace in `app/components/chat.tsx` while touching that file.
- [x] Re-run Task 1 tests until localization assertions pass.

### Task 3: Default GPT-5.6 administrator locks

**Files:**
- Modify: `app/utils/public-app-config.ts`
- Modify if documentation needs clarification: `.env.template`

**Interfaces:**
- Produces: default locked fields for the five new GPT-5.6 settings.
- Reuses: existing `buildPublicAppConfig` forced values, `applyPublicAppConfig` global/session overwrite, `ModelConfigList.isLocked`, and payload builder.

- [x] Add the five fields to `DEFAULT_WEBUI_LOCKED_FIELDS` only.
- [x] Keep `WEBUI_LOCKED_FIELDS` additive and keep `reasoningEffort` opt-in.
- [x] Re-run Task 1 tests until config assertions pass.

### Task 4: Automated and Browser verification

**Files:**
- Test: targeted locale/config/component suites and full relevant visual contracts.

- [x] Run targeted Jest for Settings/GPT-5.6/config/Markdown/chat surfaces.
- [x] Run `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build`.
- [x] Start a fresh local preview and verify English Settings and chat at desktop `1280x720` plus mobile `390x844`: no Chinese chrome, five controls disabled with Administrator locked source, no overflow, and no console warnings/errors.
- [x] Stop only the server started for this task.

### Task 5: Review, independent gate, and handoff

**Files:**
- Review: current product tree and `081673c8..final-working-tree` diff.
- Local-only: `docs/superpowers/plans/current.md`
- Local-only: this file and the README routing entry.

- [x] Merge frontend/backend reviewer findings, reproduce each against current code, remove duplicates and unsupported style opinions, and order by severity.
- [x] Dispatch an independent read-only review of the final product diff; fix Critical/Important issues inside the two implementation contracts and re-run affected checks.
- [x] Update local-only handoff with exact branch/head, changed files, verification, Browser boundary, review findings, and the client-policy/server-enforcement lock limitation.
- [x] Re-read all three user requirements and inspect the final diff before delivery.

## Result

- Product commit: `095f97a5 fix(i18n): localize UI and lock GPT-5.6 settings` on local `dev`; no push, PR, deploy, main update, or upstream change.
- Merged review baseline: `081673c8f63f7d4a9cdeb551710f825cadfba8ea`; reviewed the final tree rather than 394 commits individually. Final net scope was 127 files, 64,283 insertions, and 4,941 deletions.
- Automated verification: complete Jest `38` suites / `397` tests PASS; lint PASS; `tsc --noEmit` PASS; commit/range diff checks PASS; production build PASS with only the known Edge Runtime static-generation warning.
- Browser verification: in-app Browser, desktop `1280x720` and mobile `390x844`. English Settings headings/descriptions and chat tool menu contained no Chinese chrome; five GPT-5.6 controls were found and disabled; document width equalled viewport width; final console warning/error list was empty. The mobile menu copy was shortened to `Add`, `Files & images`, and `3 img · 5 files` after visual evidence showed truncation.

## Review Findings

1. **P0 — Raw HTML Markdown can execute in the app origin.** `app/components/markdown.tsx` enables `RehypeRaw` and only guards custom anchor `javascript:` URLs. A direct static-render reproduction preserved `<iframe src="javascript:...">`; existing tests mock `rehype-raw`. Remove raw HTML or add a strict `rehype-sanitize` schema and real iframe/SVG/srcdoc/URL tests.
2. **P1 — A mutating Responses tool can be duplicated after an unknown outcome.** `app/client/platforms/openai-responses-tools.ts` converts every non-abort executor rejection to a normal `tool_error`, continues the model loop, and only deduplicates the same `call_id`. A remote mutation followed by transport failure can be retried under a new call id. Treat that outcome as unknown, require idempotency, or pause for confirmation.
3. **P2 — GPT-5.6 administrator locks are not a server authorization boundary.** The public config/store/UI now force and disable all five fields, but `app/api/common.ts` still forwards client Responses JSON after only safety-identifier/model checks. If these settings must be policy-enforced against DevTools/direct HTTP clients, normalize locked payload fields server-side from environment configuration.
4. **P2 — Mobile Settings selectors do not own dialog focus/Escape.** `SettingsSelect` opens `SimpleSelector`, which lacks dialog semantics, a focus trap, initial/return focus, and its own Escape handler; the Settings page global Escape navigates Home. A nested selector can therefore close the route instead of only the sheet.
5. **P2 — Image-generation activation has a cross-layer race.** The toggle allows overlapping activate/deactivate calls and `initializeSingleClient` has no per-client in-flight promise, so rapid clicks or concurrent lazy execution can create multiple clients and let a stale completion overwrite current UI/runtime state.
6. **P2 — Rejected fetches leave timeout timers alive.** Speech, non-stream chat/image, and model-test paths clear timers only after a resolved `fetch`; a rejected request retains the timer until its configured deadline. Move cleanup to `finally`.
7. **P2 — Clipboard dedupe can discard distinct files.** The signature is only normalized name, MIME type, and size. Two real files with equal metadata collapse. Dedupe the same `File` object/clipboard representation or include stronger identity without rejecting legitimate duplicates.
8. **P2 — `all_turns` can bypass the context budget.** The history loop continues while `preserveAllReasoningTurns` is true, regardless of `maxTokenThreshold`, so a long GPT-5.6 session can exceed the model context and fail the request. Preserve reasoning continuity within a hard byte/token ceiling.
9. **P2 — Streaming code blocks rebuild every line on every chunk.** `splitChildrenIntoLines` recursively traverses and clones the entire rendered code tree whenever `props.children` changes. Long streaming code therefore grows toward quadratic work and extra GC pressure; current performance tests mock the Markdown renderer and miss this path.
10. **P2 — QA fixtures are shipped in production chat code.** The public query-driven Markdown fixture occupies about 16.7 KB (7.6%) of `chat.tsx` source and is reachable in every production bundle. Move it to a dev/test-only dynamic module or strip it at build time.
11. **P2 — Legacy file-reader error paths remain Chinese.** Word/PowerPoint/PDF/ZIP/Excel parsing dialogs, fallback contents, and unsupported/read-failure toasts in `app/utils/file.ts` predate the new UI localization contract. Translating them safely requires a separate parser-output contract because some strings are also sent to the model; do not replace the `文件名/类型/大小` attachment marker one-sidedly.

## Preserved Boundaries

- Did not translate user-authored Custom Instructions, stored chat titles, or QA fixture content.
- Kept the attachment marker/parser protocol (`文件名`, `类型`, `大小`) synchronized and unchanged.
- Kept `reasoningEffort` user-selectable by default; only the five new GPT-5.6 capability fields are default locked.
- No paid provider call or side-effecting third-party MCP execution was performed.
