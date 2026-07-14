# Jimeng Removal, P1 Closure, And Built-in Masks

Date: 2026-07-14
Branch: `dev`
Baseline: `dev=origin/dev=b5a768bf`, `main=0280cb3d`, `main...dev=0/50`
State: implemented and verified locally; included in this commit

## Goal And Completion Standard

Remove the Jimeng MCP integration instead of maintaining a second image-generation control plane, close the other confirmed P1 merge blockers from the `main...dev` review, and replace the legacy built-in mask catalog with a small, maintainable set of capability presets.

Completion requires:

- no Jimeng runtime, UI entry, state, environment fallback, public catalog item, proxy, polling path, locale string, or active test remains;
- native OpenAI/Azure image generation and generic MCP behavior remain available;
- request isolation, persistence failure handling, HTML artifact execution, artifact fetch races, mobile swipe conflicts, and generic MCP authorization/validation have deterministic tests;
- built-in masks have eight distinct capability families per locale, stable IDs, safe legacy migration, and no obsolete model override;
- lint, TypeScript, complete Jest, visual contract, mask generation, diff checks, production build, independent review, and an honest runtime/Browser boundary are recorded.

## Scope And Preserved Semantics

This is a cross-layer slice covering chat UI, provider request construction, Zustand persistence, artifact rendering, MCP execution, masks, localization, environment configuration, and related tests.

Preserved:

- native OpenAI/Azure image generation, editing, download fallback, and image model controls;
- generic MCP market, client initialization, tool result display, and non-Jimeng public catalog entries;
- provider request formats and streaming behavior outside the captured request snapshot;
- user-created masks and safe context from migrated built-in masks;
- existing animation and streaming feedback.

Not included:

- unrelated P2/P3 cleanup or visual polish;
- a new image provider abstraction or large state-management rewrite;
- live paid image generation, external MCP mutation, deployment, PR, push, or merge;
- cleanup of deployment- or user-owned runtime configuration outside this repository.

## Implemented Result

### Jimeng MCP Removal

- Deleted the dedicated Jimeng runtime, bundled default config, image-download proxy, legacy boolean-intent helper, and Jimeng-only tests.
- Removed environment fallback, activation state, menu/toggle entry, polling/recovery logic, prompt instructions, progress/gallery projection, and localized copy.
- Removed Jimeng entries from both public MCP catalogs without changing the remaining generic catalogs.
- Retained the shared image gallery for native image messages and the existing OpenAI/Azure image API path.

### Request And Persistence Isolation

- Chat submission captures Plugin IDs and OpenAI Responses recovery state from the target session before asynchronous attachment and message preparation. Providers consume only that request snapshot, so switching sessions cannot change tools or recovery policy mid-flight.
- Persistence keeps only the latest pending snapshot, retries with a finite exponential schedule, reports a terminal failure once, and uses generation guards so removal or suspension cannot resurrect an in-flight failed snapshot.
- Chat store wiring surfaces the terminal persistence failure through localized UI feedback.

### Artifact And Gesture Safety

- HTML preview requires an explicit user action before creating an executable iframe, resets consent when the artifact identity or code changes, and uses `sandbox="allow-scripts"` without same-origin privileges.
- The restrictive CSP is prepended before all user markup, including source that contains a fake `<head>` inside a script.
- Standalone artifact loading aborts stale requests and prevents an older response from overwriting the newly selected artifact.
- Mobile history navigation starts only from the left-edge zone, requires horizontal intent, and does not capture attachment, gallery, table, code, or image interactions.

### Generic MCP Boundary

- MCP instructions prefer read-only discovery and require explicit confirmation for destructive, irreversible, financial, publishing, account, or privacy-impacting actions.
- Execution accepts only a currently discovered tool, validates its exact input schema, and fails closed when the schema is missing or invalid.
- Payload guards reject values beyond the byte/depth/array limits and block prototype-polluting property names.
- Ambiguous side effects are not automatically retried, and private upstream failure detail is not rendered to the user.

### Built-in Masks

Each locale now contains the same eight capability families:

1. content writing;
2. engineering collaboration;
3. prompt design;
4. research and decision support;
5. event operations;
6. career and resume work;
7. startup validation;
8. emotional support.

Each preset uses a concise task contract instead of a long role-play persona, inherits the current global model configuration, and has a stable string ID. Useful numeric legacy IDs map to the closest current capability; obsolete or misleading presets are tombstoned. Migration applies only to true built-ins, preserves safe context, removes known obsolete prompt context, and never rewrites user masks.

## Verification Evidence

Passed on the final code state:

```text
corepack yarn jest --runInBand
81/81 suites, 783/783 tests

corepack yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath
84/84 tests

corepack yarn lint
PASS, zero warning/error

corepack yarn tsc --noEmit --pretty false
PASS

corepack yarn mask
PASS; generated 8 Chinese and 8 English masks

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

An independent read-only review rechecked the active Jimeng residual scan, preserved native/generic flows, request isolation, persistence races, artifact consent/CSP, MCP validation, mask migration, and targeted tests; it found no remaining P0/P1 blocker in the implemented scope.

Local runtime smoke:

- `/` returned `200 text/html`;
- `/api/config` returned `200 application/json` and parsed as valid JSON.

Interactive Browser QA is not claimed. The in-app Browser runtime failed during setup with `Cannot redefine property: process`, including after its JavaScript kernel reset. Desktop/mobile visual interaction therefore remains `需要验证`; source contracts, the complete visual suite, production build, and HTTP smoke are supporting evidence rather than a substitute for that final manual pass.

## Post-review Merge-boundary Corrections

The final review found four boundary cases in this slice and they are now covered without changing native Image or generic MCP behavior:

- Every HTML preview `code` or `executionKey` transition creates a new opaque identity. Approval is compared synchronously with that identity, so even `A -> B -> A` returns to the gate, and imperative reload is a no-op until that exact document instance is approved.
- A historical built-in mask that explicitly opted out of global sync retains its own `modelConfig`, `modelConfigMeta`, and `syncGlobalConfig=false`. Only known unsafe legacy context is removed. Other migrated built-ins still inherit the current global configuration, and user masks remain untouched.
- `jimeng-mcp` is an exact retired-ID tombstone at config read and mutation boundaries. Active or paused stale entries cannot appear in status/chat/runtime projections, initialize, or be written back; an attempted re-add fails explicitly. Initialization and restart delete a stale same-ID runtime from the executable map before starting best-effort transport close, so a permanently pending close cannot block generic servers.
- `.env.template` now documents the actual server rule: generic MCP is disabled unless `ENABLE_MCP=true`; token presence no longer implies enablement.

Focused verification for these corrections:

```text
corepack yarn jest test/artifacts-preview.test.tsx test/artifacts-route.test.tsx test/builtin-masks.test.ts test/mcp-config.test.ts test/mcp-initialize.test.ts test/server-config.test.ts --runInBand --runTestsByPath
6/6 suites, 108/108 tests

corepack yarn jest --runInBand
81/81 suites, 789/789 tests

corepack yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath
84/84 tests

corepack yarn tsc --noEmit --pretty false
PASS

corepack yarn eslint app/components/artifacts-preview.tsx app/masks/migration.ts app/store/mask.ts app/mcp/actions.ts test/artifacts-preview.test.tsx test/builtin-masks.test.ts test/mcp-initialize.test.ts --max-warnings 0
PASS, zero warnings

corepack yarn prettier --check app/components/artifacts-preview.tsx app/mcp/actions.ts test/artifacts-preview.test.tsx test/mcp-initialize.test.ts app/masks/migration.ts app/store/mask.ts test/builtin-masks.test.ts
PASS

git diff --check
PASS

corepack yarn mask
PASS; generated 8 Chinese and 8 English masks

corepack yarn build
PASS; Next.js production build completed
```

After the production build, the documented stale dev-server state briefly returned HTML `500` from `/api/config`. Restarting the development server restored HTML `200` for `/` and valid JSON `200` for `/api/config`. Authenticated desktop/mobile interaction remains the manual boundary recorded above because the in-app Browser runtime still cannot initialize.

## Final Dirty-worktree Review Fixes

The final uncommitted-change review closed five additional findings without changing native Image mode, generic MCP authorization, provider requests, or persisted data formats:

- MCP argument validation caches validators by schema object identity and compiles each schema with an isolated AJV registry. Two tools may therefore reuse the same third-party `$id` without accepting each other's arguments or failing initialization.
- Mask migration removes only the exact 16 retired built-in context IDs. Unknown and user-authored Pin entries retain their original order for both global-sync and explicit-model masks.
- The MCP system contract now explains how to continue after a successful `json:mcp-response` message and treats its contents as untrusted tool data. All tool results, including strings, are JSON-serialized before entering the fence; embedded newlines and triple backticks cannot close it early.
- Artifact consent and iframe states use the same computed preview height. Reload is disabled until Run approves the current code identity, and code or artifact changes revoke approval before another reload can execute.

Final evidence on the corrected tree:

```text
corepack yarn jest test/artifacts-preview.test.tsx test/artifacts-route.test.tsx test/builtin-masks.test.ts test/mcp-display.test.ts test/mcp-chat-recovery.test.ts test/mcp-config.test.ts test/mcp-initialize.test.ts --runInBand --runTestsByPath
7/7 suites, 54/54 tests

corepack yarn jest --runInBand
82/82 suites, 797/797 tests

corepack yarn lint
PASS, zero warning/error

corepack yarn tsc --noEmit --pretty false
PASS

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

An independent read-only reviewer found the initial successful-result fence could be escaped by a string containing a newline and triple backticks. After unified JSON serialization and an adversarial regression test, the same reviewer returned `PASS` with no remaining actionable issue. Post-build HTTP smoke returned HTML `200` for `/` and valid JSON `200` for `/api/config`.

Interactive desktop/mobile Browser QA is still not claimed: the in-app Browser runtime fails setup with `Cannot redefine property: process`. The deterministic UI contracts, complete Jest suite, build, and HTTP smoke support the fix but do not replace the final manual visual pass.

## MCP JSON Schema Dialect Follow-up

The final dirty-worktree review found that the generic MCP boundary compiled every discovered tool schema with Ajv's default draft-07 semantics. This contradicted the MCP SDK 1.29.0 contract, which defines `inputSchema` as JSON Schema 2020-12 and defaults schemas without `$schema` to that dialect. It also created two deterministic failures: `dependentRequired` could be ignored before a side-effecting call, while a valid 2020-12 `prefixItems` tuple could be rejected.

The correction keeps the existing authorization, discovered-tool check, argument limits, per-schema WeakMap cache, isolated `$id` registry, and execution flow. It changes only schema compilation:

- missing `$schema` and the canonical 2020-12 URI use an isolated Ajv 2020 validator;
- the canonical draft-07 URI uses an isolated Ajv draft-07 validator;
- an unknown or malformed dialect fails closed before `executeRequest`;
- every schema that compiles to Ajv's async validator mode is rejected before execution because the MCP validation boundary is synchronous, including non-boolean truthy `$async` markers;
- Ajv 8.20.0 and `ajv-formats` 3.0.1 are declared directly because application code now imports them; these versions were already present through MCP SDK 1.29.0.

Regression coverage first reproduced three dialect failures in the old implementation, then an independent review reproduced an async-validation bypass and unhandled rejection. The final tests cover default-2020 `dependentRequired`, explicit-2020 `prefixItems` with `items:false`, explicit draft-07 tuple compatibility, unknown-dialect rejection, boolean and non-boolean truthy `$async` rejection before execution, and duplicate `$id` isolation.

Final evidence:

```text
corepack yarn jest test/mcp-chat-recovery.test.ts test/mcp-config.test.ts test/mcp-display.test.ts test/mcp-initialize.test.ts test/mcp-market-tools-list.test.tsx --runInBand --runTestsByPath
5/5 suites, 50/50 tests

corepack yarn jest --runInBand
82/82 suites, 802/802 tests

corepack yarn lint
PASS, zero warning/error

corepack yarn tsc --noEmit --pretty false
PASS

corepack yarn prettier --check app/mcp/actions.ts test/mcp-initialize.test.ts package.json
PASS

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

This follow-up has no user-visible UI surface and does not require Browser QA. No live external MCP mutation was performed; deterministic discovered-tool fixtures cover the validation and execution boundary.

## Mask Migration Data-preservation Follow-up

The final review identified two upgrade-only regressions in the Mask slice:

- The v3.2 default was `language: undefined`, but the first v3.3 migration interpreted every such store as an explicit All Languages choice. Historical state cannot distinguish an untouched default from a user-selected All Languages value. The migration now prioritizes the new product default and maps `undefined` to Follow App Language; a persisted concrete language still maps to the fixed filter. Users who intentionally want the mixed catalog can select All Languages again.
- Legacy built-in session cleanup originally deleted context by message ID alone. Because editing a context message preserves its ID, this could silently remove user-authored replacements. Cleanup now requires the ID, role, and content fingerprint to match the retired canonical preset. The 16 original prompts remain absent from the client bundle, unchanged canonical entries are removed, and edited entries retain their content, order, model override, metadata, and sync mode.

Regression tests first reproduced both failures, then passed after the correction. Final evidence:

```text
corepack yarn jest test/builtin-masks.test.ts test/mcp-chat-recovery.test.ts test/mcp-config.test.ts test/mcp-display.test.ts test/mcp-initialize.test.ts test/server-config.test.ts --runInBand --runTestsByPath
6/6 suites, 119/119 tests

corepack yarn jest --runInBand --silent
82/82 suites, 805/805 tests

corepack yarn lint
PASS, zero warning/error

corepack yarn tsc --noEmit --pretty false
PASS

corepack yarn prettier --check app/store/mask.ts app/masks/migration.ts test/builtin-masks.test.ts
PASS

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

An independent read-only review returned `PASS`. Its AST check recomputed all 16 stored fingerprints from `HEAD:app/masks/cn.ts` and `HEAD:app/masks/en.ts`; every ID, role, and canonical content value matched. It also confirmed the App Language filter call chain and preservation of explicit model overrides. This follow-up changes persisted-state migration only and adds no responsive or visual surface, so no new Browser QA is required.

## Residual Risks And Next Action

- Before rollout, inspect deployment- or user-owned runtime MCP configuration and delete any legacy server entry that is not part of the repository snapshot.
- Run one authenticated desktop and mobile smoke pass for native Image mode, generic MCP tool display, artifact consent/reset, closed composer model label, and left-edge history gesture. Confirm no console warning/error and no horizontal overflow.
- If that pass is clean, this slice has no known P0/P1 reason to block merging. Keep unrelated P2/P3 cleanup in separate follow-up work.

## Persistence And Artifact Focus Review Closure

The final dirty-worktree review found two deterministic regressions in the already modified scope:

- A failed older chat snapshot could exhaust its retry, observe no pending write, and requeue itself even though a newer snapshot had already been accepted and flushed. The persistence queue now gives every accepted snapshot its own monotonic generation. A failed snapshot is retryable only while it is still the latest accepted snapshot, preventing the old `[1, 2, 1]` write sequence without changing bounded retry, terminal error notification, `removeItem`, or suspended-write behavior.
- The HTML artifact Run control was replaced by the approved iframe without an explicit focus destination. Keyboard activation now moves focus into the iframe; if a focused preview is replaced after code or execution identity changes, focus returns to the new Run control. Pointer activation and unrelated external focus are not stolen. Approval, CSP injection, sandboxing, height, and Reload semantics remain unchanged.

Regression coverage reproduces the persistence ordering race and exercises keyboard, pointer, external-focus, and identity-change branches. Final evidence:

```text
corepack yarn jest test/chat-persist-storage.test.ts test/artifacts-preview.test.tsx test/artifacts-route.test.tsx --runInBand --runTestsByPath
3/3 suites, 24/24 tests

corepack yarn jest --runInBand
82/82 suites, 805/805 tests

corepack yarn lint
PASS, zero warning/error

corepack yarn tsc --noEmit --pretty false
PASS

corepack yarn prettier --check app/utils/chat-persist-storage.ts app/components/artifacts-preview.tsx test/chat-persist-storage.test.ts test/artifacts-preview.test.tsx
PASS

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

An independent read-only reviewer returned `PASS` with no remaining actionable issue. The in-app Browser runtime still fails setup after a clean reset with `Cannot redefine property: process`; therefore real-Browser iframe focus QA remains `需要验证`, and the deterministic RTL focus tests are not used to claim an interactive Browser PASS. The local dev server was restarted for manual verification. No commit, push, PR, deploy, credential entry, provider request, external MCP call, or remote write was performed.

## Final Gesture And Integration Review Closure

The pre-commit review found two horizontal-interaction surfaces missing from the shared mobile gesture contract: the custom Markdown table scrollbar and the single-image `MessageImagePreview` frame. Both now carry `data-chat-horizontal-scroll="true"`; the existing table viewport, multi-image gallery, formula, code, Markdown image, and Mermaid markers remain unchanged. Component tests cover both additions, and the Chat gesture gate continues to yield to the nearest marked ancestor without changing the ordinary left-edge threshold.

Three independent read-only reviews returned `PASS` for frontend, MCP/API/security, and state/migration/test scope after the corrections. Complete Jest passed `82/82` suites and `806/806` tests; ESLint, TypeScript, `git diff --check`, targeted Prettier, and the production build also passed. The final in-app Browser pass loaded the current local tree at `1280px`, `390x844`, and `320x740`; the live wide-table viewport and scrollbar exposed the marker, page overflow stayed zero, and Console warning/error stayed empty. Physical touch injection and external MCP/provider calls were not performed.
