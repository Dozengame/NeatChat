# 2026-07-09 Attachment Paste Dedupe

## Slice

- Target: stop the composer attachment strip from adding duplicate items when pasted clipboard content exposes the same file through multiple browser channels, and keep image edits scoped to the clicked attachment.
- Commit: `1e6dc330 fix(chat): dedupe pasted attachments`.
- Files changed: `app/components/chat.tsx`, `app/utils/file.ts`, `test/attachment-file-types.test.ts`.
- Product-visible change: pasting a copied image or file should add one attachment when the browser reports the same payload via `clipboardData.files` and `clipboardData.items`; image-file pastes also no longer append the same visual again from HTML/plain data URL clipboard fallbacks.
- Preserved semantics: upload picker, drag/drop, text paste, file reading, image upload/downscale, attachment limits, send behavior, model/provider/store/API/persistence, and message image editing are unchanged.

## Root Cause

- `handlePaste` independently merged `clipboardData.files` and `clipboardData.items.getAsFile()`, then deduped with `name:type:size:lastModified`. Clipboard-generated `File` objects for the same payload can differ by `lastModified`, so the same attachment could be processed twice.
- Image pastes could also include both an image file and HTML/plain image data in the same clipboard event. The previous flow uploaded the file and appended the extracted image URL, creating two attachment items for one user paste.
- Attachment image editing only tracked the image URL. If duplicate URLs existed, saving an edit replaced every matching URL rather than the clicked item.

## Implementation

- Added `getClipboardAttachmentPayload()` in `app/utils/file.ts` to collect clipboard files once using a stable `name:type:size` signature and to skip HTML/plain image URLs when the same paste already contains an image file.
- Added `replaceAttachmentImageAtIndex()` and changed the composer image edit path to record `editingAttachmentImageIndexRef`, then replace only the selected attachment index with a functional state update.
- Added RED-first coverage for duplicate clipboard file channels, image URL fallback suppression, and duplicate URL edit replacement.

## Verification

- RED first: `yarn jest test/attachment-file-types.test.ts --runInBand --runTestsByPath` failed because `getClipboardAttachmentPayload` and `replaceAttachmentImageAtIndex` were missing.
- Final checks passed:
  - `yarn jest test/attachment-file-types.test.ts --runInBand --runTestsByPath`
  - `yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath`
  - `yarn lint`
  - `npx tsc --noEmit --pretty false`
  - `git diff --check`
  - `yarn build`
- `yarn build` retained the existing Edge Runtime static-generation warning.

## Browser QA

- Browser path: in-app Browser available; `domSnapshot()` failed with the known `TypeError: o.incrementalAriaSnapshot is not a function`, so DOM evaluate, screenshots, and console logs were used.
- Desktop `1440x1024`: `http://127.0.0.1:3000/#/chat`, clipboard item containing one PNG as `image/png`, HTML `<img src=data:...>`, and plain data URL pasted into the composer. Result: one image attachment, no horizontal overflow, no framework overlay, no console warn/error.
- Mobile `390x844`: same clipboard payload and paste path using the mobile placeholder. Result: one image attachment, no horizontal overflow, no framework overlay, no console warn/error.
- Browser click on the attachment image edit button was not used as final evidence because the in-app Browser interaction repeatedly cleared temporary in-memory attachments without console errors. The edit scoping behavior is covered by the unit test and source-level TypeScript path.

## Risks And Next

- Clipboard dedupe intentionally treats same `name:type:size` within one paste as the same file. That matches browser duplicate-channel behavior, but two distinct clipboard files with exactly the same name, MIME, and size would collapse in the same paste event.
- If users still see duplicates, capture the exact source app/browser and inspect which clipboard MIME types it provides; the next likely source would be multiple distinct HTML image URLs rather than file/item duplication.
