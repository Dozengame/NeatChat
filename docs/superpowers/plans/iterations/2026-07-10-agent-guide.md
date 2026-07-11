# 2026-07-10 Full-Stack Agent Guide

## Goal

Rewrite the local NeatChat agent entry so recent Gemini UI work is treated as temporary context rather than the project's permanent identity, and future backend/API, provider, MCP, auth, persistence, deployment, and Tauri work receives correct routing and verification.

## Inputs

- [CyberVerse `AGENTS.md`](https://github.com/Lynpoint/CyberVerse/blob/main/AGENTS.md): evidence-first reasoning, verified disagreement, minimal correct fixes, and explicit uncertainty.
- [reliable-coding-agent Chinese `AGENTS.md`](https://github.com/Swfdong/reliable-coding-agent/blob/main/zh-CN/AGENTS.md): minimal changes, verification before delivery, indexed context, and durable documentation.
- Current `package.json`, source/test tree, Git state, `README.md`, `current.md`, `workflow.md`, and the visual migration compatibility test.

## Result

- Rewrote root `AGENTS.md` in Chinese as the durable full-stack project entry.
- Separated project identity from the current UI phase and added explicit task classification for frontend, backend/API, provider/streaming, MCP/integration, auth/security, state/persistence, configuration/deployment, Tauri, and cross-layer work.
- Added evidence hierarchy, task authorization boundaries, minimal-correct-change rules, stable full-stack code anchors, and layer-specific verification matrices.
- Added configuration, Docker/Vercel, export/PWA, Rust/Tauri, and desktop packaging verification criteria.
- Kept Browser QA risk-based and limited it to user-visible UI work; server-only work uses targeted Jest, logs, contract evidence, lint, `tsc`, and build.
- Clarified that root `AGENTS.md` uses `.git/info/exclude`, while the existing `docs/superpowers/plans/` rule remains in tracked `.gitignore`; neither enters product commits.
- Removed the obsolete claim that `test/gemini-visual-migration.test.ts` reads local `AGENTS.md` or requires a historical warning phrase. The current test reads `.gitignore` instead.
- Generalized `README.md`, `workflow.md`, and `current.md` so mandatory context routing no longer pulls every task back into frontend/UI work.
- Did not introduce the reference project's `.agentdocs/` system; `docs/superpowers/plans/` remains the single local handoff tree.

## Independent Review

The first read-only review found one broken iteration link and four important governance gaps: frontend-heavy mandatory workflow/current context, missing configuration/Tauri validation, conflicting ignore wording, and an overly general dev-server restart rule. All were corrected before final verification.

## Verification

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath`: passed, 1 suite and 84 tests.
- `npx prettier --check` across root `AGENTS.md` and the updated README/current/workflow/iteration files: passed after all review fixes.
- Direct path checks confirmed the documented API, provider, MCP, store, storage, Tauri, config, deployment, and test anchors exist.
- Direct content checks confirmed full-stack sections exist and obsolete compatibility wording is absent.
- `git check-ignore -v AGENTS.md docs/superpowers/plans/current.md docs/superpowers/plans/iterations/2026-07-10-agent-guide.md`: confirmed all local agent documents remain ignored.
- `git diff --check`: passed for tracked product files; there are no product-code changes.
- Browser QA, application build, export, Docker validation, and Tauri build were not run because this slice changes only local agent governance and has no product/runtime surface.

## Git Boundary

No product commit, push, PR, deployment, branch rewrite, or external-state change is part of this slice. Root `AGENTS.md` and all handoff files remain local-only.
