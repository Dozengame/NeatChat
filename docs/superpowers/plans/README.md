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

- 2026-07-16 Composer direct remediation：以外部 requirements 与 19 张 reference images 为唯一视觉事实，收敛单一 Grid Shell、Primary-soft Add、Hero/Aura、Tools/Prompt、Model/parameter panels、Light/Dark semantic tokens、posture/collision/keyboard 行为，并完成规定 Browser matrix、逐图 Fidelity Ledger 与短横屏 follow-up：`iterations/2026-07-16-composer-direct-remediation.md`。
- 2026-07-15 Composer 2.2 continuity 全量改造：统一 Grid Shell、真实 textarea 测量、Tools/Prompt Library、四态 Model Chip、离散参数 Rail、统一菜单定位、Safe Area/Container Query 与完整 Browser QA：`iterations/2026-07-15-composer-2-2.md`。
- 2026-07-15 composer 长草稿回归：统一空白页与已有会话的高度上限，恢复展开态正文全宽，把 controls 下沉到独立底栏，并在移动/平板断点只保留一层对称输入表面：`iterations/2026-07-15-composer-long-draft-layout.md`。
- 2026-07-14 Browser 注释收口：模型面板打开时保留真实触发按钮清晰可操作、模型弹框关闭无残影、Retry 图标稳定、桌面/移动消息操作栏统一降噪，以及移动 Settings 横向空间与 safe-area 优化：`iterations/2026-07-14-mobile-browser-annotations.md`。
- 2026-07-14 Browser 验收回归：composer 草稿/阅读位置/移动宽度、模型按钮渐进披露、面具语言与移动布局、移动侧栏 Settings、quick-jump 遮罩、单一且对齐的等待反馈，以及错误页回报入口移除：`iterations/2026-07-14-browser-acceptance-regressions.md`。
- Jimeng MCP 全量移除、请求会话快照、持久化有界重试、HTML artifact 主动授权、移动端边缘手势、通用 MCP 校验与内置面具精简：`iterations/2026-07-14-jimeng-removal-p1-masks.md`。
- 已被 2026-07-14 全量移除方案取代的 Jimeng 历史实现与图库记录，仅用于历史追溯：`iterations/2026-07-13-jimeng-image-gallery.md`。
- Markdown table slider drag mapping/capture and mobile expanded-empty composer geometry regressions: `iterations/2026-07-13-table-drag-mobile-composer.md`.
- Markdown 超宽表格的常驻横向滚动控制、应用内全屏阅读、键盘/焦点语义和响应式验收：`iterations/2026-07-13-markdown-wide-table-reading.md`。
- Complete full-stack `main...dev` pre-merge audit at the 44-commit baseline, covering chat/abort/streaming, all provider terminal states, OpenAI Responses, MCP authorization and original-session recovery, sync/persistence, model locks, Markdown/render identity, security redaction, production build, static-export boundary, and desktop/mobile Browser QA: `iterations/2026-07-13-dev-main-final-premerge-review.md`.
- Summary Model effective `DEFAULT_MODEL` inheritance, per-model `OPENAI_REASONING_EFFORT`, provider-wide request/header authority, target-session isolation, locked/stale Settings states, and responsive sentinel UI: `iterations/2026-07-13-summary-model-defaults.md`.
- Context-prompt count regression where the rendered `BOT_HELLO` fallback was misreported as a preset prompt in desktop toast and mobile settings labels: `iterations/2026-07-13-context-prompt-count.md`.
- Markdown same-message TOC anchors under HashRouter and direction-aware chat quick-jump navigation: `iterations/2026-07-13-markdown-anchor-scroll-navigation.md`.
- Frontend-only `main...dev` pre-merge performance, browser compatibility, desktop-first composer/model-menu motion, and Markdown streaming optimization review: `iterations/2026-07-13-dev-main-frontend-performance-review.md`.
- Final merged review from `6c8760f7` through the 2026-07-12 model-selector/config capability release, including default-model hydration, Chat/Image classification, reasoning matrices, override reconciliation, output limits, and final QA: `iterations/2026-07-12-final-model-review.md`.
- Per-model `OPENAI_REASONING_EFFORT` defaults, scalar compatibility, model-switch resolution, and provider/override boundaries: `iterations/2026-07-12-reasoning-effort-defaults.md`.
- New-chat `Chat / Image` mode tabs, GPT-5.x reasoning-only composer control, and `gpt-image-x` model/size/quality rails: `iterations/2026-07-12-chat-image-home.md`.
- English UI localization, default GPT-5.6 administrator locks, and the merged-state review from `081673c8` through `095f97a5`: `2026-07-10-i18n-admin-lock-review.md`.
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
- `docs/superpowers/plans/` is tracked so current state, routed iterations, and QA boundaries can synchronize across devices. Keep these files free of credentials, tokens, private endpoints, personal paths, and other sensitive data, and stage the relevant handoff with the product slice it describes.
- Root `AGENTS.md`, `CLAUDE.md`, `.env`, screenshots, caches, and generated artifacts remain local-only unless a user explicitly changes their scope.

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
