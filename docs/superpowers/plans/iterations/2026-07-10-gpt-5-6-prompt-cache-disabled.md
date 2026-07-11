# GPT-5.6 Prompt Cache Disabled Mode Implementation Plan

Status: completed in local `dev` commit `cc6e8641`; not pushed or merged to `main`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real `disabled` GPT-5.6 Prompt Cache mode that uses OpenAI's zero-write request shape: explicit policy, no key, and no breakpoints.

**Architecture:** Extend the existing Prompt Cache mode type and parser with `disabled`, while keeping `implicit` as the product fallback/default. OpenAI defaults omitted cache policy to `implicit`, so the Responses builder maps the internal `disabled` value to `prompt_cache_options: { mode: "explicit", ttl: "30m" }` while emitting no key or breakpoint. OpenAI documents that explicit mode without breakpoints does not use Prompt Cache or incur cache-write charges. Settings expose the third mode and disable the cache-key input while it is selected. The local deployment opts into `disabled`; other deployments remain backward compatible until configured.

**Tech Stack:** Next.js 14, React 18, TypeScript, Zustand, OpenAI Responses API, Jest.

## Global Constraints

- Work only on branch `dev`; do not merge or push to `main`.
- Preserve the current local model list exactly: `-all,gpt-5.6-terra@openai,gpt-image-2@openai`.
- Keep the product default Prompt Cache mode `implicit` for backward compatibility.
- `disabled` must emit explicit cache policy with no breakpoint and omit the cache key, even if a stale/non-empty key remains in stored config.
- Preserve current `implicit` and `explicit` request behavior.
- Do not change OpenAI credentials, proxy URLs, access codes, device secrets, or deployment state.
- Product code and tests form one verified local commit; `.env` and internal plan files remain ignored/local-only.

---

### Task 1: Disabled Payload Contract

**Files:**
- Modify: `test/openai-responses-builder.test.ts`
- Modify: `test/server-config.test.ts`
- Modify: `test/gpt56-settings-contract.test.ts`

**Interfaces:**
- Consumes: `parseOpenAIResponsesPromptCacheMode()` and `buildOpenAIResponsesPayload()`.
- Produces: failing contracts for `disabled` parsing, public config propagation, OpenAI's explicit-without-breakpoint zero-write shape, and the Settings option.

- [x] **Step 1: Add a parser assertion that `disabled` is preserved rather than falling back to `implicit`.**
- [x] **Step 2: Add a GPT-5.6 payload test with `promptCacheMode: "disabled"` and a stale cache key. Assert exact explicit/30m cache options while `prompt_cache_key` and all `prompt_cache_breakpoint` properties are absent.**
- [x] **Step 3: Add a Settings contract assertion for the `disabled` option and bilingual label.**
- [x] **Step 4: Run the three targeted suites and confirm they fail only because `disabled` is not implemented.**

Run:

```bash
yarn jest test/openai-responses-builder.test.ts test/server-config.test.ts test/gpt56-settings-contract.test.ts --runInBand --runTestsByPath
```

Expected: failures show `disabled` normalizing to `implicit`, the explicit-without-breakpoint request shape missing, and the Settings option/label absent.

### Task 2: Minimal Disabled Implementation

**Files:**
- Modify: `app/utils/openai-responses.ts`
- Modify: `app/client/platforms/openai-responses-builder.ts`
- Modify: `app/components/model-config.tsx`
- Modify: `app/locales/cn.ts`
- Modify: `app/locales/en.ts`
- Modify: `.env.template`
- Local-only: `.env`

**Interfaces:**
- Produces: `OpenAIResponsesPromptCacheMode = "disabled" | "implicit" | "explicit"` and a payload branch that emits explicit policy without key or breakpoint when disabled.
- Preserves: default `implicit`, TTL `30m`, explicit breakpoint insertion, and non-GPT-5.6 omission.

- [x] **Step 1: Extend the mode type/set/parser with `disabled` without changing the fallback constant.**
- [x] **Step 2: In the GPT-5.6 builder, map `disabled` to explicit/30m options while skipping key parsing and breakpoint insertion.**
- [x] **Step 3: Add the disabled select option and bilingual copy; disable the cache-key input when disabled or administratively locked.**
- [x] **Step 4: Document `disabled` in `.env.template`; set local `.env` to `OPENAI_PROMPT_CACHE_MODE=disabled` and clear `OPENAI_PROMPT_CACHE_KEY`, with Vercel-oriented classification comments.**
- [x] **Step 5: Re-run the targeted suites until green.**

### Task 3: Verification, Review, and Commit

**Files:**
- Review: all product/test changes
- Local-only: `docs/superpowers/plans/current.md`
- Local-only: this iteration file and plan index

**Interfaces:**
- Produces: verified product behavior and one local `dev` commit.

- [x] **Step 1: Run all Prompt Cache/config/tool continuation suites.**

```bash
yarn jest test/openai-responses-builder.test.ts test/openai-responses-tools.test.ts test/server-config.test.ts test/config-merge.test.ts test/gpt56-settings-contract.test.ts --runInBand --runTestsByPath
```

- [x] **Step 2: Run `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build`.**
- [x] **Step 3: Run an independent read-only spec/risk review and fix any Important or Critical finding.**
- [x] **Step 4: Recheck that the branch is `dev`, `.env` is ignored, and the local model list is unchanged.**
- [x] **Step 5: Commit only product/test/template files with message `feat(openai): add disabled prompt cache mode`. Do not push or merge.**
- [x] **Step 6: Update local-only handoff with the commit, verification evidence, and Vercel variables `OPENAI_PROMPT_CACHE_MODE=disabled` and `OPENAI_PROMPT_CACHE_KEY=`.**

## Final Result

- Internal `disabled` maps to OpenAI's documented no-write request shape: explicit/30m policy, no key, and no breakpoint. Omitting cache options was deliberately rejected because OpenAI defaults omission to implicit caching.
- Product default remains `implicit`; only deployments that configure `disabled` change behavior.
- Local `.env` uses `OPENAI_PROMPT_CACHE_MODE=disabled` and an empty `OPENAI_PROMPT_CACHE_KEY`; the Terra-only model list is unchanged.
- Verification after commit: 5 Jest suites / 107 tests, lint, `tsc`, commit diff check, and production build passed. Browser QA passed at default desktop and `390x844`, with no horizontal overflow or console warning/error.
- Git: local `dev` commit `cc6e8641`; no push, no PR, and no merge to `main`.
