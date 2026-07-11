# GPT-5.6 Family Compatibility Implementation Plan

Status: completed in commits `114c49fb` and `524d338a`; fast-forwarded to `dev` and pushed to `origin/dev` on 2026-07-10.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `gpt-5.6-terra` the default while fully supporting the GPT-5.6 alias, Sol, Terra, and Luna across model selection, Responses requests, settings, state migration, and safe optional capabilities.

**Architecture:** Keep GPT-5.6 model metadata and capability gates in the existing OpenAI utilities, with a strict OpenAI-only registry boundary so Azure behavior does not change. Build payload-only additions into the Responses builder, inject the privacy-preserving safety identifier at the server proxy, and use a dedicated Responses function-tool runner instead of overloading the Chat Completions loop. Programmatic Tool Calling, hosted MCP, and Multi-agent remain disabled until their distinct approval, caller, beta-header, and agent-attribution protocols are implemented end to end.

**Tech Stack:** Next.js 14, React 18, TypeScript, Zustand, Jest, OpenAI Responses API over HTTP/SSE.

## Global Constraints

- Default model is exactly `gpt-5.6-terra`; supported GPT-5.6 identifiers are `gpt-5.6`, `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-5.6-luna`.
- GPT-5.6 built-ins are OpenAI-only and must not appear under Azure without an explicit custom deployment.
- Preserve existing auth, access-code, MCP/Jimeng, image-generation, persistence, and provider behavior outside the OpenAI GPT-5.6 path.
- Do not call a paid API, deploy, push, or expose credentials.
- Product changes form two verified commits; `.env` and this plan stay local-only and are never staged.
- PTC, hosted MCP, and Multi-agent must not be advertised or enabled by partial payload-only support.

---

### Task 1: GPT-5.6 Baseline Contracts

**Files:**
- Modify: `test/model-provider.test.ts`
- Modify: `test/server-config.test.ts`
- Modify: `test/openai-responses-builder.test.ts`
- Modify: `test/config-merge.test.ts`
- Modify: `test/custom-instructions.test.ts`
- Modify: `test/attachment-file-types.test.ts`

**Interfaces:**
- Consumes: existing model registry, public-config, Responses builder, and chat prompt APIs.
- Produces: failing table-driven contracts for four GPT-5.6 identifiers, Terra defaults, six reasoning efforts, correct cutoff/web search, and the 128,000-token outbound cap.

- [x] **Step 1: Add model/default/capability tests before production changes.**
- [x] **Step 2: Run the targeted suites and confirm failures are caused by missing GPT-5.6 behavior.**

Run:

```bash
yarn jest test/model-provider.test.ts test/server-config.test.ts test/openai-responses-builder.test.ts test/config-merge.test.ts test/custom-instructions.test.ts test/attachment-file-types.test.ts --runInBand --runTestsByPath
```

Expected: failures for absent GPT-5.6 registry entries, old default/cutoff, web-search rejection, missing `max`, and absent 128K clamping.

### Task 2: Implement Baseline Family Compatibility

**Files:**
- Modify: `app/constant.ts`
- Modify: `app/utils/openai-responses.ts`
- Modify: `app/config/public.ts`
- Modify: `app/store/access.ts`
- Modify: `app/store/config.ts`
- Modify: `app/utils/server-model-defaults.ts`
- Modify: `app/client/platforms/openai-responses-builder.ts`
- Modify: `app/components/model-config.tsx`
- Modify: `app/components/chat.tsx`
- Modify: `app/locales/cn.ts`
- Modify: `app/locales/en.ts`
- Modify: `.env.template`
- Local-only: `.env`

**Interfaces:**
- Produces: `OPENAI_RESPONSES_DEFAULT_MODEL = "gpt-5.6-terra"`, GPT-5.6 family helpers, six-effort type/options, and model-aware max-output normalization.
- Preserves: older OpenAI entries and all Azure/default provider behavior.

- [x] **Step 1: Add OpenAI-only GPT-5.6 registry entries and the official `2026-02-16` cutoff.**
- [x] **Step 2: Change code/public/access/local defaults to Terra and expose all four identifiers in the local allowlist.**
- [x] **Step 3: Generalize GPT-5.6 web search and reasoning efforts (`none` through `max`).**
- [x] **Step 4: Enforce the GPT-5.6 128K limit in env parsing, UI normalization, and the outbound payload.**
- [x] **Step 5: Synchronize Chinese/English reasoning labels and `.env.template` guidance.**
- [x] **Step 6: Run the targeted suites until green, then run slice verification.**

Run:

```bash
yarn jest test/model-provider.test.ts test/server-config.test.ts test/openai-responses-builder.test.ts test/config-merge.test.ts test/custom-instructions.test.ts test/attachment-file-types.test.ts test/gemini-visual-migration.test.ts --runInBand --runTestsByPath
yarn lint
npx tsc --noEmit --pretty false
git diff --check
yarn build
```

- [x] **Step 7: Review the actual diff and create commit `feat(openai): support the GPT-5.6 model family`.**

### Task 3: GPT-5.6 Optional Payload Contracts

**Files:**
- Modify: `test/openai-responses-builder.test.ts`
- Modify: `test/server-config.test.ts`
- Modify: `test/config-merge.test.ts`
- Modify: `test/access-control.test.ts`

**Interfaces:**
- Produces: failing contracts for Pro/standard mode, reasoning context, image detail, cache options/breakpoints, safety identifiers, and unsupported-beta exclusion.

- [x] **Step 1: Add tests for GPT-5.6-only payload fields and older-model omission.**
- [x] **Step 2: Add tests proving `store:false` still requests/replays encrypted reasoning for `all_turns`.**
- [x] **Step 3: Add a server-side test proving only a verified random device ID becomes `safety_identifier`, never an access code, API key, or unsigned input.**
- [x] **Step 4: Confirm the new tests fail for the intended missing behavior.**

### Task 4: Implement Safe GPT-5.6 Payload Features

**Files:**
- Modify: `app/utils/openai-responses.ts`
- Modify: `app/client/platforms/openai-responses-builder.ts`
- Modify: `app/client/platforms/openai.ts`
- Modify: `app/config/server.ts`
- Modify: `app/config/public.ts`
- Modify: `app/utils/public-app-config.ts`
- Modify: `app/store/access.ts`
- Modify: `app/store/config.ts`
- Modify: `app/components/model-config.tsx`
- Modify: `app/locales/cn.ts`
- Modify: `app/locales/en.ts`
- Modify: `app/api/abuse-control.ts`
- Modify: `app/api/common.ts`
- Modify: `.env.template`

**Interfaces:**
- Produces: typed `reasoning.mode`, `reasoning.context`, `input_image.detail`, GPT-5.6 cache policy/breakpoint, and server-injected safety identifier.
- Defaults: standard mode, automatic reasoning context, explicit `high` image detail to preserve GPT-5.4 cost/latency semantics, and implicit prompt caching.

- [x] **Step 1: Add parsers/types/defaults and public-config propagation for mode, context, image detail, and cache mode/key.**
- [x] **Step 2: Add Settings controls without changing the chat-shell layout.**
- [x] **Step 3: Add GPT-5.6-gated payload fields; mark only supported content blocks for explicit cache mode.**
- [x] **Step 4: Reuse the verified access-device identity to inject a max-64-character safety identifier server-side.**
- [x] **Step 5: Keep PTC, hosted MCP, and Multi-agent fields absent from the request type and payload.**
- [x] **Step 6: Run targeted tests until green.**

### Task 5: Native Responses Function Tools

**Files:**
- Create: `app/client/platforms/openai-responses-tools.ts`
- Create: `test/openai-responses-tools.test.ts`
- Modify: `app/client/platforms/openai-responses-builder.ts`
- Modify: `app/client/platforms/openai.ts`
- Modify: `app/utils/chat.ts` only if a small shared callback type is required

**Interfaces:**
- Consumes: selected OpenAPI Plugin tool definitions and executor functions.
- Produces: flattened Responses function definitions, collected `function_call` items, exact `call_id` continuation outputs, stored/stateless continuation payloads, call-id deduplication, and finite round/call limits.

- [x] **Step 1: Write failing pure-unit tests for tool adaptation, parallel calls, continuation, duplicate call IDs, malformed arguments, tool errors, and loop limits.**
- [x] **Step 2: Implement the pure adapter/collector/continuation module.**
- [x] **Step 3: Integrate only direct selected Plugin functions into the Responses stream; leave existing MCP prompt execution unchanged.**
- [x] **Step 4: Confirm the user-visible final text remains the final assistant message and tool-only intermediate responses are retained for continuation.**
- [x] **Step 5: Run targeted suites until green.**

### Task 6: Final Verification and Slice 2 Commit

**Files:**
- Review: all changed product and test files
- Local-only: `docs/superpowers/plans/current.md`
- Local-only: this iteration file

- [x] **Step 1: Run the full relevant suite and common product baseline.**

```bash
yarn jest test/server-config.test.ts test/config-merge.test.ts test/model-provider.test.ts test/openai-responses-builder.test.ts test/openai-responses-tools.test.ts test/chat-stream-payload.test.ts test/stream-fetch.test.ts test/access-control.test.ts test/attachment-file-types.test.ts test/custom-instructions.test.ts test/gemini-visual-migration.test.ts --runInBand --runTestsByPath
yarn lint
npx tsc --noEmit --pretty false
git diff --check
yarn build
```

- [x] **Step 2: Perform Browser QA at desktop `1280x720` and mobile `390x844` for the six reasoning options and new Settings controls; record the exact boundary.**
- [x] **Step 3: Run independent spec/risk review, fix Important/Critical findings, and re-run affected verification.**
- [x] **Step 4: Create commit `feat(openai): add GPT-5.6 response capabilities`.**
- [x] **Step 5: Update local-only current/iteration handoff with commits, verification, live-API boundary, and deferred PTC/MCP/Multi-agent work.**

## Final Result

- Slice 1 commit: `114c49fb feat(openai): support the GPT-5.6 model family`.
- Slice 2 commit: `524d338a feat(openai): add GPT-5.6 response capabilities`.
- Default and local allowlist: `gpt-5.6-terra`; supported built-ins are `gpt-5.6`, `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-5.6-luna` under OpenAI only.
- Optional Responses support: standard/Pro mode, auto/current/all-turn context, Low/High/Original/Auto image detail, implicit/explicit Prompt Cache with a non-secret routing key, verified server-injected `safety_identifier`, and encrypted stored/stateless replay.
- Direct selected Plugin functions use a dedicated bounded Responses SSE loop. Background title/summary calls cannot execute tools; incomplete/timeout/refusal/error paths are explicit; sensitive tool errors are redacted; side-effect recovery traces are persisted and normal Retry is blocked.
- Deferred: Programmatic Tool Calling, hosted MCP, and Multi-agent remain absent. No paid OpenAI or third-party Plugin API was called.

## Final Verification

- Jest: 18 relevant suites, 276 tests passed.
- Static/product: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed.
- Browser: desktop `1280x720` and mobile `390x844`; Terra/default capability values and all option sets were present, no horizontal overflow, and browser console had no warning/error.
- Mobile correction found by QA: GPT-5.6 selects now reserve `clamp(104px, 31vw, 148px)` and measured 121px at 390px instead of the previous 33-53px truncation.
- Review: independent config/UI, spec/continuation, and tool-safety passes reported no remaining blockers.
- Git integration: local `dev` was fast-forwarded from `0280cb3d` to `524d338a`, then pushed without force; local and remote `dev` were verified at the same full SHA.
- Post-merge verification on `dev`: all 37 Jest suites and 375 tests passed; `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check origin/dev..dev`, and `yarn build` passed. The build retained only the known Edge Runtime static-generation notice, and lint also emitted the existing TypeScript parser support notice.
- Git boundary: local `.env`, root `AGENTS.md`, and `docs/superpowers/plans/` stayed ignored; only `origin/dev` was pushed, with no deployment or remote-history rewrite.

## 2026-07-11 Reasoning Effort UI Allowlist

- Added optional `WEBUI_ALLOWED_REASONING_EFFORTS` as a frontend policy. The original comma-separated global syntax remains compatible; scoped syntax uses `*=...;model=...`, exact model rules win, and `gpt-5.6` shares the canonical Sol rule. Blank input preserves the complete API-supported list, invalid-only scopes fail closed, and output order is canonical.
- Official OpenAI guidance publishes one GPT-5.6 family-wide API set—`none/low/medium/high/xhigh/max`—rather than different Sol/Terra/Luna subsets. Scoped rules are administrator display policy, not a claim about model capabilities. Codex/ChatGPT Work Light corresponds to Low; Ultra is subagent orchestration and is intentionally absent from the Responses wire type.
- Public config exposes `reasoningEffortAllowlist` and includes it in `configHash`. If a restricted default model omits `OPENAI_REASONING_EFFORT`, public config creates an exact canonical model override instead of widening the global fallback. `reasoningEffort` remains unlocked by default.
- Settings, composer, and header share the same filter. Persisted values outside policy remain selected but disabled current-only entries. Chinese labels are `快速/低/中/高/极高/MAX`; English labels are `Fast/Low/Medium/High/Extra High/Max`.
- Verification passed four targeted suites (`88/88`), focused ESLint, TypeScript, `git diff --check`, production build, scoped `/api/config` runtime inspection, and independent review. The real local Chat route remained access-code gated and was not bypassed.
