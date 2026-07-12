# NeatChat Agent Plan Index

Purpose: keep NeatChat agent work in a low-context loop. Start here, then read only the linked file that matches the current task.

## Read Order

1. `docs/superpowers/plans/README.md` - routing and context budget.
2. `docs/superpowers/plans/current.md` - current branch, latest head, active risks, next candidates.
3. `docs/superpowers/plans/workflow.md` - required plan/action/acceptance/handoff loop.
4. One relevant file under `docs/superpowers/plans/iterations/`.
5. Source, tests, and current runtime evidence for the exact slice.

Do not read all iteration files by default. Use `rg` first, then open the smallest matching file.

## Routing

- Final merged review from `6c8760f7` through the 2026-07-12 model-selector/config capability release, including default-model hydration, Chat/Image classification, reasoning matrices, override reconciliation, output limits, and final QA: `iterations/2026-07-12-final-model-review.md`.
- Per-model `OPENAI_REASONING_EFFORT` defaults, scalar compatibility, model-switch resolution, and provider/override boundaries: `iterations/2026-07-12-reasoning-effort-defaults.md`.
- New-chat `Chat / Image` mode tabs, GPT-5.x reasoning-only composer control, and `gpt-image-x` model/size/quality rails: `iterations/2026-07-12-chat-image-home.md`.
- English UI localization, default GPT-5.6 administrator locks, and the merged-state review from `081673c8` through `095f97a5`: `iterations/2026-07-10-i18n-admin-lock-review.md`.
- Composer-only model selection, new-chat draft-state persistence, responsive geometry, and the pending GPT-5.x reasoning visual prototype: `iterations/2026-07-11-composer-model-selector.md`.
- GPT-5.6 Prompt Cache `disabled` mode and zero-cache-field request semantics: `iterations/2026-07-10-gpt-5-6-prompt-cache-disabled.md`.
- GPT-5.6 family defaults, Responses compatibility, capability fields, and native function tools: `iterations/2026-07-10-gpt-5-6-compatibility.md`.
- Full-stack agent governance, evidence rules, frontend/backend task routing, verification matrices, and local handoff policy: `iterations/2026-07-10-agent-guide.md`.
- Backend OpenAI image generation/edit timeout, abort reason, Vercel function-duration limits, and server/client timeout boundaries: `iterations/2026-07-07-openai-image-timeout.md`.
- MCP client initialization retry/backoff and transient network failure handling: `iterations/2026-07-09-mcp-init-retry.md`.
- Attachment clipboard deduplication and selected-item image editing: `iterations/2026-07-09-attachment-dedup.md`.
- Duplicate attachment render keys and deletion state stability: `iterations/2026-07-09-attachment-delete.md`.
- Image-generation tool-menu behavior and direct Jimeng MCP toggle: `iterations/2026-07-08-image-generation-menu.md`.
- Current Markdown, streaming, table, details, diagram, task-list, footnote, and QA fixture work: `iterations/2026-06-27-markdown-surfaces.md`.
- Markdown code wrapping, line-number alignment, and wrap-button behavior: `iterations/2026-06-29-markdown-wrap.md`.
- Competitive chat-shell, composer, settings, attachment, and responsive acceptance fixes: `iterations/2026-06-28-competitive-chat-shell.md`.
- Recent shell, sidebar, update announcement, code-block, line-number, and Markdown stress work: `iterations/2026-06-26-markdown-shell.md`.
- Broad token comfort sweep across utility surfaces, settings, auth, markdown, SD, export, MCP, plugin, shared controls: `iterations/2026-06-25-token-comfort.md`.
- Original Gemini-style UI foundation and first route plan: `iterations/2026-06-14-15-gemini-foundation.md`.
- Old high-level roadmap snapshot: `iterations/2026-06-21-roadmap.md`.

## Working Standard

- One iteration equals one independently observable slice, one risk-based verification set, and normally one product commit when product code changes.
- Classify the task as frontend, backend/API, MCP/integration, state/persistence, configuration/deployment, desktop, or cross-layer before following recent work context.
- Prefer the existing patterns in the affected layer: React/SCSS for UI, `app/client/` adapters for providers, `app/api/` routes for server boundaries, `app/mcp/` for MCP runtime, `app/store/` and storage helpers for persistence, and existing Jest suites for contracts.
- Do not introduce new dependencies, frameworks, state systems, or parallel documentation trees for a local fix without a verified need.
- Add or strengthen tests before implementation when feasible.
- Pair desktop evidence with mobile or narrow-mobile evidence only for UI slices where responsive behavior is at risk.
- Keep model/provider/store, MCP/Plugin, account/auth, backend/API, persistence, import/export, deployment, and dependency semantics unchanged unless the user explicitly asks otherwise.
- Do not bypass the access-code gate or enter real credentials. If authenticated Browser QA is blocked, record that boundary and use source, Jest, DOM/CSSOM, compiled CSS, or static fixture evidence.
- Internal planning and QA files are local context by default and are ignored by Git. Do not stage them unless the user explicitly changes that policy.

## Maintenance

At the start of an iteration:

- Define target, layer/chain, files, non-goals, preserved semantics, tests, runtime or Browser QA path, and completion standard.
- Read only `current.md`, `workflow.md`, the relevant iteration file, and direct source/test files.

At the end of an iteration:

- Update `current.md` with latest branch/head, result, verification boundary, known risks, and next candidates.
- Append to the matching dated file under `iterations/`, or create a new `YYYY-MM-DD-<slice>.md` if the day file exceeds about 150 lines or the topic diverges.
- Keep root `AGENTS.md` as the local compatibility entry. Do not rebuild the old monolithic `design-qa.md` QA log.
- Keep README as a routing index and `workflow.md` as the generic execution matrix; volatile details belong in `current.md` or one dated iteration.

## Replaced Files

The old monolithic handoff and roadmap files were consolidated into this index and the dated iteration files. Do not recreate these names:

- `docs/superpowers/plans/neatchat-gemini-ui-handoff.md`
- `docs/superpowers/plans/2026-06-14-gemini-ui-migration.md`
- `docs/superpowers/plans/2026-06-21-gemini-ui-ux-iteration-roadmap.md`
- old root `design-qa.md`
