# 2026-07-09 Attachment Delete Stability

## Slice

- Target: make composer attachment deletion reliable when uploaded/pasted images or files contain duplicate values, names, sizes, and types.
- Commit: `0280cb3d fix(chat): stabilize attachment deletion`.
- Files changed: `app/components/chat.tsx`, `app/utils/file.ts`, `test/attachment-file-types.test.ts`, `test/gemini-visual-migration.test.ts`.
- Product-visible change: clicking the delete control on duplicate-looking image/file attachments removes the selected item instead of leaving an identical item in place and appearing unresponsive.
- Preserved semantics: upload picker, drag/drop, paste classification, attachment limits, send behavior, image edit behavior from the prior dedupe slice, model/provider/store/API/persistence, and mobile left-swipe delete reveal are unchanged.

## Root Cause

- Image attachments used `key={image}`. Duplicate image data URLs therefore produced duplicate React keys, so deleting one duplicate could reconcile to another identical node in the same visual slot.
- File attachments used `key={`${file.name}-${file.size}-${file.type}`}`. Same-name same-size files such as repeated `粘贴的文本.txt` had the same key, causing the same reconciliation ambiguity.
- Delete handlers used captured array state (`attachedFiles` / `attachImages`) instead of functional state updates. Rapid or queued updates could remove from stale state.

## Implementation

- Added `getAttachmentRenderKey()` in `app/utils/file.ts`; image/file preview keys now include the rendered index plus stable attachment identity details.
- Added `removeAttachmentAtIndex()` and changed image/file delete paths to functional state updates, so removal is calculated from the current attachment array.
- Updated visual-contract tests to lock the render-key helper, functional delete updates, and focus handoff behavior without depending on Prettier-only tail-comma formatting.
- Added utility tests for distinct render keys on duplicate attachment values and immutable indexed removal.

## Verification

- RED first: `yarn jest test/attachment-file-types.test.ts --runInBand --runTestsByPath` failed before the new helpers existed.
- Final checks passed after amend:
  - `yarn jest test/attachment-file-types.test.ts --runInBand --runTestsByPath`
  - `yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath`
  - `yarn lint`
  - `npx tsc --noEmit --pretty false`
  - `git diff --check`
  - `yarn build`
- `yarn build` retained only the existing Edge Runtime static-generation warning.

## Browser QA

- Browser path: local `http://127.0.0.1:3000/#/chat`, desktop viewport `1440x1024`.
- The prior dev server had stale `/api/config` HTML 500 output after a previous build; restarting `yarn dev` restored JSON and QA continued on the fresh server.
- Duplicate image path: pasted the same PNG data URL twice; deleting the first image attachment changed the strip from 2 image attachments to 1.
- Duplicate file path: pasted the same >1000 character text twice, creating two `粘贴的文本.txt` file attachments; deleting the first changed 2 -> 1, then deleting again changed 1 -> 0.
- Both paths had no page horizontal overflow, no framework overlay, and `tab.dev.logs()` returned no current console warn/error entries.

## Risks And Next

- Render keys intentionally include the current rendered index because the attachment model does not carry persistent local IDs. This is acceptable for these simple preview items and fixes duplicate-key reconciliation, but a future attachment model refactor could replace it with stored IDs.
- Long-text paste still uses the existing paste branch and was not refactored beyond deletion stability; if users report rapid-paste races there, handle it as a separate small slice.
