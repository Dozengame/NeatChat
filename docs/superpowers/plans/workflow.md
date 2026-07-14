# Agent Workflow Loop

This repo uses one full-stack loop:

```text
plan -> inspect -> act -> verify -> review -> deliver -> record handoff
```

## 1. Plan

- State the completion standard before making changes.
- Classify the task as frontend, backend/API, provider/streaming, MCP/integration, auth/security, state/persistence, configuration/deployment, desktop, or cross-layer.
- Define the target behavior, files and chain, non-goals, preserved semantics, required evidence, and external-state boundaries.
- Use sub-agents only when responsibilities are independent and parallel or review value is clear; avoid concurrent edits to the same files.

## 2. Inspect

- Read the plan index, current state, one routed iteration, and the smallest direct source/test/config/log scope.
- Verify user diagnoses and historical conclusions against live code or runtime evidence.
- For cross-layer failures, trace UI -> store/client -> API -> provider/MCP -> external response rather than stopping at one layer.

## 3. Act

- Implement the smallest change that fixes the verified root cause while preserving out-of-scope product semantics.
- Reuse existing components, helpers, clients, stores, API routes, fixtures, and test patterns.
- Keep user changes intact and keep internal plans, screenshots, temp files, env files, `.agents/`, `.codex/`, `.next/`, and `test-results/` out of product commits.
- Update both `app/locales/cn.ts` and `app/locales/en.ts` when user-facing copy changes and both locales apply.

## 4. Verify

Run the narrowest relevant checks first. Expand according to the changed layer and risk.

Common product baseline:

```bash
yarn lint
npx tsc --noEmit --pretty false
git diff --check
yarn build
```

Frontend/UI examples:

```bash
yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath
yarn jest test/chat-render.test.ts test/message-content.test.ts --runInBand
```

Backend/provider/streaming examples:

```bash
yarn jest test/server-config.test.ts test/config-merge.test.ts test/model-provider.test.ts --runInBand
yarn jest test/openai-responses-builder.test.ts test/chat-stream-payload.test.ts test/stream-fetch.test.ts --runInBand
```

Auth/MCP/persistence examples:

```bash
yarn jest test/access-code-validation.test.ts test/access-control.test.ts --runInBand
yarn jest test/mcp-config.test.ts test/mcp-display.test.ts test/mcp-initialize.test.ts --runInBand
yarn jest test/startup-cache.test.ts test/custom-instructions.test.ts --runInBand
```

Configuration, packaging, and desktop checks are selected by target:

```bash
docker compose config
yarn export
cargo check --manifest-path src-tauri/Cargo.toml
yarn app:build
```

Do not run these four mechanically: use Docker validation only for Docker changes, export for export/PWA changes, `cargo check` for Rust/Tauri changes, and `app:build` for desktop packaging or Web/Tauri integration.

User-visible UI changes require risk-based Browser QA. Default viewports are desktop `1440x1024`, constrained `1056x834`, mobile `390x844`, and narrow `320x740`; use only the viewports relevant to the change. Check overflow, overlap, key controls, keyboard/focus states, theme risk, and current console warn/error entries.

Server-side work without a UI surface does not require Browser QA. Use targeted Jest, logs, status/headers/payload evidence, `lint`, `tsc`, and build instead. Documentation-only changes use formatting, content, sensitive-information, tracking, and relevant compatibility checks rather than a full application build.

## 5. Review

- Re-read the user request and completion standard line by line.
- Inspect the actual changed files; do not trust a sub-agent report or passing test as proof of scope compliance by itself.
- For broad or risky work, run an independent read-only spec and risk review, then fix Important or Critical findings and re-review.

## 6. Deliver

- Only claim completion after fresh verification evidence passes.
- Keep one product slice in one clear commit when a commit is in scope; never include local agent documents.
- Do not push, deploy, create a PR, rewrite history, or modify external state unless explicitly requested.
- Report the outcome, actual changes, verification, remaining risks, and only the next action that materially helps.

## 7. Record Handoff

- Update `current.md` with rechecked branch/head, result, verification boundary, risks, and scoped candidates.
- Update one routed dated iteration, or create a new one and add it to the README routing table when the topic diverges.
- Record durable facts only: commit, files, behavior, preserved semantics, verification, Browser/runtime boundary, risks, and next candidate.
- Keep root `AGENTS.md` durable and generic; volatile branch state and recent failures belong in `current.md` or an iteration file.
