# Context Prompt Count Regression

Date: 2026-07-13
Baseline: `dev=571ee925`

## Result

The desktop context-prompt toast and mobile conversation-settings accessible label now count only persisted session presets from `session.mask.context`. The temporary `BOT_HELLO` message remains in the derived render context but is no longer presented as a preset prompt.

## Scope

- `app/components/chat.tsx`: derive `presetPromptCount` from the real Mask context and reuse it for desktop and mobile labels.
- `test/gemini-visual-migration.test.ts`: lock the real count source and reject the render-context regression.

Provider requests, Mask editing, welcome-message rendering, chat history, store/persistence formats, scrolling visibility, authentication, configuration, and deployment are unchanged.

## Verification

- The new regression assertions failed against the old `context.length` implementation, then passed after the fix.
- Complete Gemini visual contract: `84/84`.
- ESLint: pass with no warnings/errors.
- TypeScript: pass.
- `git diff --check`: pass.
- Production build: pass; `/` remains `103 kB`, First Load JS `189 kB`.
- Real Chrome local QA:
  - constrained desktop showed `滚到最新`, proving the chat was away from the bottom, with no false `包含 1 条预设提示词` control;
  - `390x844` exposed plain `对话设置`, not the false one-prompt label;
  - clicking the mobile control opened `当前对话设置` with the empty preset state and `新增一条对话`;
  - no Console warning/error was recorded.

No commit, push, PR, deploy, credential entry, paid request, or remote-state change was performed.
