# 2026-07-08 Image Generation Menu

## Slice

- Target: fix the desktop `图片生成` button/menu rendering anomaly in the composer tool menu.
- Files changed: `app/components/chat.tsx`, `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`.
- Visible change: clicking desktop `图片生成` now expands two local option rows inside the tool menu instead of mounting the shared full-screen `Selector`, so no offset gray overlay or detached close layer appears.
- Preserved semantics: Jimeng MCP enable/disable calls, upload behavior, attachment limits, model/provider/store/API/persistence, access/auth, Search, Masks, Settings, SD, and mobile direct-toggle behavior are unchanged.

## Root Cause

- The shared `Selector` is `position: fixed` with a full-viewport close button.
- Rendering it inside `.chat-input-action-menu`, which uses transforms for open/close animation, creates a transformed containing block. The selector overlay is then offset from the menu instead of the viewport and can cover the composer area.
- The fix keeps this two-choice interaction inside the existing menu and removes the nested full-screen selector from this path.

## Verification

- RED first: `yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath` failed on the missing in-menu image-generation option contract.
- Final automated checks: `yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed.
- Build retained the existing Next Edge Runtime static-generation warning.

## Browser QA

- Local URL: `http://localhost:3000/#/chat?codex_qa=markdown-stress`.
- Desktop `1440x1024`: opening the tool menu and then `图片生成` produced two option rows, no `Close selector` button, menu width `320px`, no page horizontal overflow, and no console warn/error logs. Screenshot: `/tmp/neatchat-image-generation-menu-fixed-1440.png`.
- Mobile `390x844`: opening the tool menu kept a single `图片生成` row, no nested option rows, no `Close selector` button, no page horizontal overflow, and no console warn/error logs.
- Browser `domSnapshot()` failed with `TypeError: o.incrementalAriaSnapshot is not a function`; QA used Browser DOM evaluate, console logs, and screenshot evidence instead.

## Risks And Next

- The fix is local and uncommitted at handoff time.
- If product wants a different desktop interaction, keep it in-menu or portal the selector outside the transformed menu; do not nest the full-screen `Selector` under `.chat-input-action-menu`.

## User Correction Follow-up

- User clarified the intended behavior: desktop `图片生成` is not a selector. It should behave like the previous direct button contract: one click activates Jimeng MCP and image-generation mode; another click disables it.
- Commit: `7ba780ab fix(chat): restore direct image generation toggle`.
- Files changed: `app/components/chat.tsx`, `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`.
- Product-visible change: removed the image-generation option rows, modal key, and CSS; the button directly calls `setImageGenerationMode(!props.imageGenerationEnabled)`. Mobile still closes the tool menu after toggling.
- Preserved semantics: Jimeng MCP activation/deactivation, `JIMENG_MCP_SERVER_ID`, `JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT`, upload behavior, attachments, model/provider/store/API/persistence, Search, Masks, Settings, and SD behavior are unchanged.
- TDD evidence: first changed `test/gemini-visual-migration.test.ts` to reject `IMAGE_GENERATION_MODE_OPTIONS`, `selectImageGenerationMode`, `actionModals.imageGeneration`, and image-generation option styles; RED failed on the existing two-choice implementation, then passed after the direct-toggle fix.
- Verification after commit: `yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build` passed. `yarn build` retained the existing Edge Runtime static-generation warning.
- Browser QA: desktop `1440x1024` first click changed the menu row to `关闭图片生成`, `aria-pressed=true`, showed the image-generation status chip and `已启用图片生成`; second click changed it back to `图片生成`, `aria-pressed=false`, removed the chip and showed `已关闭图片生成`. Mobile `390x844` covered the same enable/disable path and closed the visible tool menu after toggle. Both viewports had `optionRows=0`, `Close selector` count `0`, no horizontal overflow, and no framework overlay.
- Browser boundary: `domSnapshot()` remains unreliable in this Browser runtime, so evidence used DOM evaluate metrics, screenshots, and console logs. The only console error entries were stale `Event` logs from `09:17`/`09:23`; the QA reference time was `10:05`, and no current warn/error entries were produced by this slice.
- Dev server note: after final `yarn build`, `/api/config` returned HTML 500; restarting `yarn dev` restored JSON 200. The replacement dev server was left running for local testing.
- Screenshots: `/tmp/neatchat-image-generation-toggle-desktop-1440.png`, `/tmp/neatchat-image-generation-toggle-mobile-390.png`.
