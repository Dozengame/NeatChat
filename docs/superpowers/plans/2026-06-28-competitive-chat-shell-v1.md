# Competitive Chat Shell V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the approved PC dark chat-shell prototype for the chat entry and tool menu without changing model, attachment, image-generation, or persistence semantics.

**Architecture:** Keep existing `ChatInner` and `ChatActions` structure. Tighten visible conditions and SCSS tokens only: desktop empty chat header should not duplicate the composer model selector, and the composer tool menu should expose only real project menu actions.

**Tech Stack:** Next.js, React, SCSS modules, Jest visual contract test, in-app Browser QA.

---

### Task 1: Lock Visual Contract

**Files:**
- Modify: `test/gemini-visual-migration.test.ts`

- [ ] Add assertions that the chat tool menu keeps only the real project action set: upload attachment, image generation, scroll to bottom, clear context.
- [ ] Add assertions that prompt hints and shortcut key features remain available outside the tool menu, but their `ChatAction` rows are absent from the tool menu.
- [ ] Add assertions that desktop empty state uses `showEmptyState` to suppress the model selector and header action buttons.
- [ ] Run `yarn jest test/gemini-visual-migration.test.ts --runInBand` and verify the new assertions fail before implementation.

### Task 2: Land Chat Shell Changes

**Files:**
- Modify: `app/components/chat.tsx`
- Modify: `app/components/chat.module.scss`

- [ ] In `ChatActions`, remove prompt hint and shortcut key `ChatAction` rows from the composer tool menu only; keep slash prompt handling and shortcut modal code intact.
- [ ] In desktop header markup, render the model selector and header action group only when `!showEmptyState`.
- [ ] Tune `.chat-input-action-menu` and section styles to match the approved grouped menu: darker elevated surface, larger radius, primary multimodal section, compact section headers, and no extra menu rows.
- [ ] Keep existing upload, image-generation, scroll-to-bottom, clear-context click handlers unchanged.

### Task 3: Verify And QA

**Files:**
- Modify: `docs/superpowers/plans/current.md`
- Append: `docs/superpowers/plans/iterations/2026-06-28-competitive-chat-shell-v1.md`

- [ ] Run `yarn jest test/gemini-visual-migration.test.ts --runInBand`.
- [ ] Run `yarn lint`.
- [ ] Run `npx tsc --noEmit --pretty false`.
- [ ] Run `git diff --check`.
- [ ] Run `yarn build`.
- [ ] Start or reuse a local dev server and verify with Browser at desktop `1440x1024`, constrained desktop `1056x834`, and mobile `390x844`.
- [ ] Record commit/files/verification/browser boundary/risks in the ignored handoff files.
