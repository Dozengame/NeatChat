# Table Drag And Mobile Composer Regressions

Date: 2026-07-13
Branch: `dev`
Product commit: `0900ffff fix(ui): stabilize table drag and mobile composer`

## Result

The persistent Markdown table scrollbar now follows the pointer continuously in both directions. Pressing the existing thumb no longer jumps it to a new position, forward/reverse dragging no longer appears to rebound, track clicks still seek predictably, and releasing or cancelling a pointer ends the drag. The same control remains focusable and supports Home, End, arrows, PageUp, and PageDown with ARIA slider semantics.

On mobile empty chats, tapping the textarea still expands it to the intended multi-line input, but the expanded shell now uses a `24px` card radius and bottom-aligned controls instead of stretching the compact `999px` pill into an oversized capsule. The expanded geometry is based on the persistent state class rather than `:focus-within`, so it remains stable after focus moves to the model selector. The collapsed composer remains the original compact pill.

## Root Causes And Fixes

- The table used a transparent native range and custom Pointer handlers at the same time. Its custom math mapped the whole track to `maxScrollLeft`, although the visible thumb can travel only `trackWidth - thumbWidth`; it also discarded the pointer's grab offset. The replacement uses one custom `role="slider"`, actual DOM track/thumb geometry, a stored grab offset, Pointer Capture, and explicit pointer cancel/lost-capture cleanup.
- The visible thumb had an `80ms` left/width transition, so even correct incremental values visually lagged behind the mouse. Position/size transitions were removed while the color transition remains.
- The mobile empty composer correctly moved from one textarea row to at least two, but the outer row always retained `border-radius: 999px`. A `max-width: 600px` expanded-empty state rule applies `24px`, `align-items: flex-end`, and the existing button bottom offset without changing the React state chain.
- Independent review found one follow-up issue in the new custom slider: PageUp/PageDown inherited reversed directions. PageUp now increments by one page and PageDown decrements, and the unit contract covers both directions.

## Preserved Boundaries

- Native viewport scrolling by trackpad/touch, full-screen dialog behavior, table width promotion, streaming resets, GFM semantics, and compact-table behavior are unchanged.
- Chat/Image selection, textarea auto-height, model menu, Send/Add behavior, request/provider/API, auth, Zustand, persistence, MCP, configuration, deployment, and dependencies are unchanged.
- No access-gate bypass, credential entry, paid request, remote write, push, PR, or deploy was performed. The supplied Vercel page was inspected only as the failing baseline.

## Validation

- Targeted regressions: `test/markdown-table.test.tsx`, `test/gemini-visual-migration.test.ts`, and `test/chat-home-mode.test.ts`: `3/3` suites and `96/96` tests passed.
- Focused Markdown/chat regression matrix: `14/14` suites and `69/69` tests passed.
- `corepack yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `corepack yarn build`: passed. Production `/` remains `105 kB / 191 kB` first load.
- The post-build dev-server collision was cleared by restarting the local server; `/` returned HTML 200 and `/api/config` returned JSON 200 before Browser smoke testing. No product workaround was added.
- Independent read-only review returned `PASS` after the PageUp/PageDown correction and found no remaining medium/high-risk issue in the changed scope.

## Browser QA

- Deployed `400px` baseline reproduced an expanded `376x114px` composer row with `999px` radius.
- Local `400x880`, `390x844`, and `320x740`: clicking the empty textarea produced an `86px`-high row with `24px` radius, `flex-end` alignment, aligned Add/model/Send controls, and zero document overflow. Blurring to the model selector kept the same geometry. Light and Dark passed.
- Regular table at `1440x1024`: pressing the current thumb center kept `scrollLeft=0`; a real mouse drag reached `139`, reversed to `28`, track click reached the exact maximum, and Home/End remained correct.
- Mobile table at `390x844`: pressing the thumb kept its current position, dragging right changed `359 -> 595`, reversing changed `595 -> 418`, and document overflow remained zero. `320x740` Dark also dragged continuously.
- Full-screen table at `1056x834`: pressing the thumb did not jump, dragging reached `124/247`, close restored the original control, and table DOM count stayed stable.
- Fresh post-restart smoke at `400x880` reconfirmed composer focus/blur geometry. At `390x844`, the thumb stayed at `0` when pressed, dragged to `236`, and reversed to `118`. Console warning/error output and Next.js error overlays were both zero.

Physical Safari, Firefox, and Windows High Contrast remain manual-test boundaries. Pointer Capture is available in the current target Chrome; very old browsers without it may stop continuous dragging once the pointer leaves the track.
