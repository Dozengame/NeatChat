# 2026-06-28 Competitive Chat Shell

## Slice

- Commit: `c5465bb1 style(chat): refine competitive shell controls`.
- Files: `app/components/chat.tsx`, `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`.
- Visible change: desktop empty chat no longer shows the header model selector/actions; existing chats keep the top model selector/actions while the composer stays input-focused.
- Tool menu: visible menu actions now match current product functions: `上传附件`, `图片生成`, `滚到最新`, `清除上下文`; prompt hints and shortcut-key modal remain available through their existing non-menu paths.
- Menu polish: compact `300px` desktop menu, stronger dark surface, primary multimodal section border, tighter action rows. Desktop media override was corrected from `336px` to `300px`.

## Preserved Semantics

- No model/provider/store/API/persistence contract changes.
- No attachment, image generation, export/import, Search, Masks, Settings, SD, access/auth, MCP, or plugin protocol behavior changes.
- Slash prompt hint handling and keyboard shortcut modal still exist; they are only removed from the composer tool menu.

## Verification

- `yarn jest test/gemini-visual-migration.test.ts --runInBand`: pass, 83 tests.
- `yarn lint`: pass.
- `npx tsc --noEmit --pretty false`: pass.
- `git diff --check`: pass.
- `yarn build`: pass.

## Browser QA

- Local URL: `http://localhost:3000`.
- Desktop `1440x1024`, existing chat: top model selector/actions present, composer has no model selector, menu actions are `上传附件`, `图片生成`, `滚到最新`, `清除上下文`, no prompt/shortcut entries, menu width `300px`, horizontal overflow `0`.
- Empty chat `1440x1024`: empty title visible, desktop model selector/actions absent, composer has no model selector, horizontal overflow `0`.
- Constrained desktop `1056x834`: existing chat menu is `300px`, within viewport, top model selector/actions present, composer has no model selector, horizontal overflow `0`.
- Mobile guard `390x844`: desktop model selector/actions absent, composer has no model selector, menu within viewport, horizontal overflow `0`.
- Browser console warn/error: none.

## Notes

- Browser initially exposed stale desktop menu width because a `min-width: 901px` media override still forced `336px`; fixed in the same slice and covered by test.
- Dev server was stopped after QA.

## Empty-State Prompt Chip Slice

- Commit: `d81d67a2 style(chat): lighten empty state prompt chips`.
- Files: `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`.
- Visible change: empty-chat suggestions now render as low-glare centered prompt chips instead of heavy four-card tiles. Desktop chips hide secondary descriptions and icons; mobile keeps the icon affordance in a compact 2x2 layout.
- Preserved semantics: suggestion content, click-to-fill behavior, focus handoff, send enablement, model/provider/store/API/persistence, attachment, image generation, export/import, Search, Masks, Settings, SD, access/auth, MCP, and plugin protocol behavior are unchanged.

## Empty-State Verification

- RED first: `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed on the old `display: grid` card contract before implementation.
- Final automated checks: `yarn jest test/gemini-visual-migration.test.ts --runInBand` passed with 84 tests; `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed. Build kept only the existing Next Edge Runtime static-generation warning.
- Browser QA used `http://127.0.0.1:3000/#/chat` because the in-app Browser kept stale `localhost` loading state after restart while `/api/config` returned JSON 200.
- Browser QA: desktop `1440x1024`, constrained desktop `1056x834`, and mobile `390x844` had no horizontal overflow, no suggestion overlap, no console warn/error, and CSSOM matched flex/wrap centered chips. Suggestion click filled the composer, focused textarea, enabled Send, removed the empty-state panel, and kept the tools menu closed.
- Screenshot paths from the click-state guard: `/tmp/neatchat-empty-chips-1440.png`, `/tmp/neatchat-empty-chips-390.png`.
- Dev server was stopped after QA; Browser viewport was reset.

## Drag/Drop Upload Target Slice

- Commit: `33193359 style(chat): refine drag drop upload target`.
- Files: `app/components/chat.tsx`, `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`.
- Visible change: drag/drop upload feedback is now a compact composer-adjacent floating target instead of a full-screen blurred overlay. Accepted and blocked states share the same target shape and keep the input visible.
- QA fixture: `dropzone_preview=accepted|blocked` works with the existing Markdown stress fixture when placed inside the hash route query, for example `#/chat?codex_qa=markdown-stress&dropzone_preview=accepted`.
- Preserved semantics: actual drag/drop detection, image/file limits, upload processing, attachment store behavior, model/provider/API/persistence, image generation, Search, Masks, Settings, SD, access/auth, MCP, and plugin protocols are unchanged.

## Drag/Drop Verification

- RED first: targeted `gemini-visual-migration` dropzone contract failed against the old full-screen blur/inset contract before implementation.
- Final automated checks: `yarn jest test/gemini-visual-migration.test.ts --runInBand`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed. Build kept only the existing Next Edge Runtime static-generation warning.
- Browser QA: desktop `1440x1024` accepted state had two Markdown QA messages, active dropzone width `760px`, bottom gap `88px`, no full-screen backdrop, no horizontal overflow, input panel still visible.
- Browser QA: desktop blocked state had `data-drop-accepted=false`, summary `附件已满`, width `760px`, no horizontal overflow.
- Browser QA: mobile `390x844` accepted state had width `334px`, mobile grid areas, bottom gap `88px`, no horizontal overflow.
- Browser QA: narrow `320x740` blocked state had width `264px`, `data-drop-accepted=false`, input panel visible, no horizontal overflow.
- Browser console warn/error: none beyond expected dev info/log entries. In-app Browser could not stably toggle the app theme select to dark; dark/auto-dark token coverage remains in `test/gemini-visual-migration.test.ts`.

## Attachment Strip Preview Slice

- Commit: `6c507cce style(chat): polish attachment strip states`.
- Files: `app/components/chat.tsx`, `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`.
- Visible change: composer attachment strip is lighter and tighter across populated, overflow, and full states. Image/file chips use smaller low-glare surfaces, the add affordance stays inside the strip, and the full state shows an inert `已满` status instead of a misleading add target.
- QA fixture: `attachment_strip_preview=populated|overflow|full` works with the existing Markdown stress fixture inside the hash route query, for example `#/chat?codex_qa=markdown-stress&attachment_strip_preview=full`.
- Preserved semantics: real upload, drag/drop, delete, edit, image/file limits, attachment store behavior, model/provider/API/persistence, image generation, Search, Masks, Settings, SD, access/auth, MCP, and plugin protocols are unchanged.

## Attachment Strip Verification

- RED first: targeted `gemini-visual-migration` attachment strip contracts failed against the old larger/high-glare strip and missing QA seed before implementation.
- Final automated checks: `yarn jest test/gemini-visual-migration.test.ts --runInBand`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed. Build kept only the existing Next Edge Runtime static-generation warning.
- Browser QA: desktop `1440x1024` populated/full/overflow states had no page horizontal overflow. Full state showed 3 images, 5 files, `已满`, no add button, and disabled upload in the tool menu.
- Browser QA: constrained desktop `1056x834` caught a real flex expansion bug where the composer inner shell exceeded the viewport; fixed with bounded `box-sizing`, `min-width: 0`, and `max-width: 100%`. Recheck kept the strip at the composer width with only internal strip overflow.
- Browser QA: mobile `390x844` and narrow `320x740` populated/full/overflow states had no page horizontal overflow, kept internal strip scrolling, and preserved primary controls.
- Browser console warn/error: none. Initial in-app Browser state needed a reload to drop stale bundle data after dev-server reuse.

## Acceptance Fix Slice

- Commit: pending local change, not committed.
- Files: `app/components/settings.tsx`, `app/components/settings.module.scss`, `app/components/chat.module.scss`, `app/components/update-announcement.module.scss`, `test/gemini-visual-migration.test.ts`.
- Visible change: Settings no longer renders the top section tabs or search box; the empty-chat suggestions are now low-glare cards with subtle page light fields; the root tool menu is a wider floating panel with softer backdrop; the mobile update announcement is bounded by safe-area side gutters and bottom-card sizing.
- Preserved semantics: settings values and section content remain available; suggestion click-to-fill, attachment upload, image generation, model/provider/API/persistence, Search, Masks, SD, access/auth, MCP, and plugin behavior are unchanged.

## Acceptance Fix Verification

- `yarn jest --ci test/gemini-visual-migration.test.ts --runInBand`: pass, 84 tests.
- `npx tsc --noEmit --pretty false`: pass.
- `yarn lint`: pass.
- `git diff --check`: pass.
- `yarn build`: pass, with the existing Next Edge Runtime static-generation warning.
- Runtime: local dev server should be restarted after `yarn build`; final Browser visual acceptance still needs a fresh screenshot pass against `http://localhost:3000`.

## Acceptance Fix Follow-Up

- Commit: pending local change, not committed.
- Files added to the local change set: `app/components/chat.tsx` for the root tool button aria label.
- Visible change: the root tool menu is anchored to the composer input left edge at 1056px, stays fully visible at `320px`, and no longer shares the same `关闭对话工具` accessible name between the backdrop and trigger. Empty-chat suggestions stay in one four-card desktop row at 1056px. Single image previews no longer overflow the user bubble. Custom instructions now sit in the dialog section before Data settings, matching the earlier Settings order.
- Preserved semantics: no upload, image generation, suggestion fill, message image preview/download, settings save, model/provider/API/persistence, Search, Masks, SD, access/auth, MCP, or plugin behavior changes.

## Acceptance Fix Follow-Up Verification

- RED first: visual contract failed for four-card desktop empty state, image frame clipping, and custom-instructions order before implementation.
- Final automated checks: `yarn jest --ci test/gemini-visual-migration.test.ts --runInBand`, `npx tsc --noEmit --pretty false`, `yarn lint`, `git diff --check`, and `yarn build` passed. Build kept only the existing Next Edge Runtime static-generation warning.
- Browser QA at `1056x834`: tool menu width `320px`, left aligned with composer input, fully visible without internal vertical scroll, no page horizontal overflow, and distinct aria labels `关闭对话工具` / `收起对话工具`.
- Browser QA at `1056x834`: empty state rendered 4 cards in one row, `620px` suggestion grid, no card overlap.
- Browser QA at `1056x834`: user image preview stayed within the `560px` user bubble, frame scroll width equaled client width, and image right edge stayed inside the message item.
- Browser QA at `1056x834`: Settings had no search/tabs, custom instructions appeared before Data, and console warn/error logs were empty.
- Local preview restarted after build and returned HTTP 200 at `http://localhost:3000`.

## Acceptance Fix Second Follow-Up

- Commit: pending local change, not committed.
- Files added to the local change set: `app/components/ui-lib-components.tsx`, `app/components/ui-lib.module.scss`.
- Visible change: empty new-chat desktop header is removed completely; composer tool menu headers and action rows now share one internal alignment grid; Modal header max/close icons use `currentColor` so dark mode no longer leaves hard-coded black SVG strokes.
- Preserved semantics: no upload, image generation, message, settings-save, model/provider/API/persistence, Search, Masks, SD, access/auth, MCP, or plugin behavior changes.

## Acceptance Fix Second Follow-Up Verification

- RED first: visual contracts failed for empty desktop header removal and shared Modal dark icon tokens before implementation.
- Final automated checks: `yarn jest --ci test/gemini-visual-migration.test.ts --runInBand`, `npx tsc --noEmit --pretty false`, `yarn lint`, `git diff --check`, and `yarn build` passed. Build kept only the existing Next Edge Runtime static-generation warning.
- Local dev server was restarted after build to clear stale chunks and returned HTTP 200 at `http://localhost:3000`.
- Authenticated Chrome visual check: new-chat empty state no longer showed the top `新的聊天` title bar, and the tool menu primary section was fully visible with aligned internal edges.
- Browser QA boundary: clean headless Chrome hit the access-code gate, so no credentials were entered and dark modal icon runtime proof stayed at source/CSS/Jest contract level.

## Empty Composer Model Selector Restore

- Commit: pending local change, not committed.
- Files: `app/components/chat.tsx`, `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`.
- Visible change: desktop new-chat empty composer restores the model selector inside the input bar (`gpt-5.4⌄` in the tested state), matching the supplied homepage design reference. Existing-chat composer still has no model selector; model selection remains in the chat header there.
- Preserved semantics: no model/provider/store/API/persistence changes, no upload/image generation/message/settings behavior changes, and the existing `chat-model-menu` dialog is reused.
- RED first: `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed on the missing `showEmptyComposerModelSelect` contract before implementation.
- Final automated checks: `yarn jest test/gemini-visual-migration.test.ts --runInBand`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed. Build kept only the existing Next Edge Runtime static-generation warning.
- Browser QA at `1440x1024`: empty chat had one composer model button (`选择模型：gpt-5.4，标准`), no header model selector, the button stayed inside the composer and before Send, horizontal overflow was `0`, and clicking opened `chat-model-menu` as a dialog.
- Browser QA at `1440x1024`: existing chat `Markdown压测` had one header model selector, zero composer model buttons, horizontal overflow `0`, and console warn/error logs empty.
- Mobile guard at `390x844`: composer model button count was `0`; only the mobile header model selector remained, with horizontal overflow `0` and no console warn/error.

## Empty Composer Model Menu Placement Fix

- Commit: pending local change, not committed.
- Files: `app/components/chat.tsx`, `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`.
- Visible change: clicking the desktop new-chat input-bar model selector now opens the shared model menu next to that selector instead of reusing the desktop header menu position.
- Preserved semantics: the same `chat-model-menu` dialog, model options, reasoning controls, focus trap, Escape close, model/provider/store/API/persistence, upload/image generation/message/settings, Search, Masks, SD, access/auth, MCP, and plugin behavior remain unchanged.
- RED first: `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed on the missing `ModelMenuPlacement` / empty-composer menu-position contract before implementation.
- Final automated checks: `yarn jest test/gemini-visual-migration.test.ts --runInBand`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed. Build kept only the existing Next Edge Runtime static-generation warning.
- Browser QA at `1056x834`: empty chat had one input-bar model button. After click, menu `position` was `fixed`, `rightDelta` was `0`, vertical gap from button bottom to menu top was `10px`, menu top was `437.8359375px`, and the menu was no longer in the header area.
- Browser QA guard at `1056x834`: after typing temporary text into the composer, visible model controls count was `0`, preserving the non-empty/existing-chat composer behavior.
- Browser console warn/error logs were empty. Browser viewport was reset and the local dev server started for QA was stopped.

## Uncommitted Diff Cleanup

- Commit: pending local change, not committed.
- Product diff after cleanup: `app/components/chat.tsx`, `app/components/chat.module.scss`.
- Visible change retained: desktop new-chat empty composer keeps the input-bar model selector, and its model menu opens next to that selector. Existing-chat/non-empty composer remains model-free.
- Reverted scope: all local Markdown, Artifact preview, code-block, HTML preview, and Markdown test changes were restored to HEAD per user request.
- Verification after cleanup: `yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed.
