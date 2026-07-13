# Jimeng MCP and generated-image gallery

## Goal and boundary

- Restore Jimeng as an LLM-optimized image-generation tool for Chat mode without routing it through the independent `gpt-image-*` Image mode.
- Replace misaligned generated-image grids with one message-aligned media surface. A multi-image reply shows one selected main image plus selectable alternatives; desktop keeps the options on the right and compact layouts move them below the main image.
- Preserve provider routing, OpenAI image request payloads/options, MCP authorization tiers, persistence/export formats, attachment editing, download behavior, and remote configuration.
- Do not call a paid model or live Jimeng generation during verification.

## Confirmed causes

- Jimeng is intentionally persisted as `paused` and `chatDefaultEnabled: false`, then transiently activated by the Chat tool toggle. `getMcpChatServerStates()` trusted the persisted status before the live runtime, so the scoped prompt omitted Jimeng's real tool schema even though the client was active.
- The LLM still received the Jimeng generation instruction, guessed several `to=... (json)` pseudo tool calls as ordinary text, and the UI displayed that text verbatim.
- GPT Image replies store images as multimodal `image_url` parts, while Jimeng's normalized result is a Markdown-image string. The previous renderer did not offer a shared multi-image projection and positioned media on a different horizontal track from assistant prose.

## Implemented behavior

- `app/mcp/actions.ts` treats only an initialized, error-free transient Jimeng runtime as active while leaving a generic persisted-paused server paused even if stale runtime data remains.
- `app/store/chat.ts` resolves a single scoped client ID into the canonical MCP call/response tags and rejects an explicit Jimeng request before the provider call if its scoped schema is missing.
- `app/components/chat.tsx` hides the Jimeng action/status on OpenAI image models and derives the submit-time Jimeng scope from the current model. A stale enabled toggle therefore cannot leak into `gpt-image-*` requests; switching back to Chat retains the user's prior Jimeng toggle.
- `app/mcp/display.ts` extracts images only from recognized Jimeng task/progress/diagnostic replies. Ordinary Markdown image replies remain on the Markdown renderer, and stored/exported message content is unchanged.
- `app/components/message-image-gallery.tsx` owns selected-image state, preview/download routing, pressed state, roving tabindex, cyclic arrow navigation, and Home/End. Thumbnails are decorative to assistive technology; the option buttons carry localized names.
- `app/components/chat.module.scss` aligns single and multi-image media to the shared `780px` reading track, uses natural aspect ratio and bounded height, adds a selected thumbnail ring and physical press feedback, keeps touch targets at least `44px`, and covers reduced motion/transparency, increased contrast, and forced colors.
- The development-only `codex_qa=image-gallery` fixture provides a repeatable four-image state without entering credentials or calling a generation provider.

## Verification

- Complete Jest: `81/81` suites and `795/795` tests passed.
- `corepack yarn lint`: passed with no warnings or errors.
- `npx tsc --noEmit --pretty false`: passed.
- `corepack yarn build`: passed; only the existing npm config notices and Edge static-generation warning remained.
- `git diff --check`: passed.
- Chrome QA:
  - `1440x1024` Light/Dark: main image `696x465`, right option rail `72x465`, shared left track with prose, document horizontal overflow `0`.
  - `390x844` Light/Dark: main image `306x205`, option rail below at `306x64`, document horizontal overflow `0`.
  - Click selection changed the main source and pressed state; Arrow keys cycled; Home/End selected boundaries and moved focus.
  - Preview opened the selected image; Escape closed it and restored focus to the opener.
  - After adding `priority` to the full-screen Next Image preview, a fresh second-image preview produced no new local Console warning/error.

## Residual boundary

- Live Jimeng/provider success is not claimed because the task did not authorize a paid or side-effecting third-party generation. Deterministic MCP initialization, prompt-schema, preflight failure, result projection, and gallery tests cover the repaired local chain.
- Jimeng's transient runtime remains initialized when the user temporarily switches to a `gpt-image-*` model; request and UI isolation are strict, and retaining it avoids a lifecycle race while preserving the enabled state when returning to Chat.
