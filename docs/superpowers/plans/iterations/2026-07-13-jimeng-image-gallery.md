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

## Rejected acceptance follow-up: blank Jimeng reply

### Runtime evidence and cause

- The deployed conversation showed the assistant response during streaming and then rendered no assistant message. Its Console recorded `Failed to parse Jimeng request` followed by `failed to process a tool message`.
- The deployed Edit All Messages surface exposed the exact safe payload shape: the fenced request ended with `"model_version":"4.6","poll":0}}` before the closing fence. The `arguments` and `params` objects were closed, but the root request object was missing one final `}`.
- The streaming projection initially rendered Preparing while the fence was incomplete. Once the closed fence arrived, `isMcpJson` matched it, strict `JSON.parse` failed, `formatJimengMcpRequestForChat` returned no progress, and the projection still returned without a visible message. The store catch logged the error but did not update `content`, `streaming`, `isError`, or persistence.

### Corrected contract

- Strict `JSON.parse` remains the default. Only `jimeng-mcp` may attempt EOF recovery, and only when a quote/escape-aware delimiter scan proves that every nested value is closed and the sole missing delimiter is the outer root `}`. The repaired payload is parsed strictly again before the existing execution validation and live tool allowlist.
- Missing commas, trailing commas, raw control characters, unclosed strings, mismatched delimiters, multiple missing levels, generic MCP truncation, multiple complete blocks, and a complete block followed by another incomplete MCP start are rejected without execution.
- Final incomplete or malformed requests update the original assistant message to a localized `streaming=false`, `isError=true` terminal failure and flush persistence. The render projection applies the same sanitized fallback to historical or race-state records; raw MCP protocol is never shown.
- The Jimeng system prompt now explicitly requires one complete legal JSON request and bracket verification. This reduces recurrence but does not replace parser and failure-state protection.
- Development-only `codex_qa=jimeng-parser` fixtures reproduce both the exact recoverable deployment payload and a non-recoverable malformed payload without credentials or provider calls.

### Follow-up verification

- Complete Jest: `81/81` suites and `807/807` tests passed.
- `corepack yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `corepack yarn build` passed. The build retained only existing npm config notices and the Edge static-generation warning.
- Independent review found no remaining Critical or Important blocker after closing the mixed complete-plus-incomplete multiple-request case.
- Chrome QA on the real local app and final source:
  - `1440x1024`: exact deployed payload rendered the optimized prompt, parameters, and submitting status; document overflow `0`; raw MCP protocol absent; Console warning/error `0`.
  - `390x844`: the same message remained readable and non-empty with document overflow `0`; raw MCP protocol absent; Console warning/error `0`.
  - Non-recoverable malformed JSON rendered exactly one localized terminal failure instead of disappearing; raw protocol remained absent and Console warning/error stayed `0` in the render fixture.

### Remaining boundary

- No new live or paid Jimeng generation was run. External service success is not claimed; deterministic tests cover parser recovery, exactly-once handoff to `executeMcpAction`, non-execution for rejected inputs, persistence terminal state, and render visibility.

## 2026-07-14 Streamable HTTP tool refresh and image parameter compatibility

### Confirmed cause and contract

- The preset and client already used Streamable HTTP with a Bearer environment template. The integration failure came from the process-global client/tool snapshot: explicit activation reused an existing error-free client, so an old seven-tool connection never reconnected or repeated `tools/list` after the upstream expanded to 17 tools.
- The failed generation was independently explained by local request construction. `model_version=5.0` and `resolution_type=1k` passed through unchanged even though the current schema only permits `1k` for text-to-image model `3.0`/`3.1`; newer/default image models require `2k` or `4k`.
- A failed submit/query does not automatically turn off image-generation mode. This preserves retry intent, but the next explicit enable must refresh the actual MCP runtime rather than only toggling UI state or clearing the Chat prompt cache.

### Implemented behavior

- Explicit Jimeng activation runs inside the existing per-client lifecycle lock, detaches any old client, reconnects, refreshes `tools/list`, requires at least 17 discovered `dreamina_*` tools, and calls `dreamina_version`. The exact tool set remains dynamic so a future 18th tool does not require a code allowlist update.
- A refresh or version-verification failure removes the partially initialized transport and cached tools, records an error runtime, and returns the UI to disabled. It never restores or executes against the stale seven-tool snapshot. Generic MCP activation, authorization tiers, persisted config, and the Jimeng paused-by-default contract are unchanged.
- All eight generation submit tools discovered in the current schema are normalized to `poll=0`. `dreamina_text2image` keeps explicit `1k` only for model `3.0`/`3.1`; invalid `1k` for newer/default text-to-image, image-to-image, and image-upscale is rewritten to `2k`. Missing resolution and valid current values remain schema-controlled.
- While activation is pending, the conversation-tool action exposes `aria-busy`, a loading icon, localized enabling/disabling text, and a disabled control. Desktop and mobile only close the menu or show the enabled state after the refresh has actually succeeded.

### Verification and boundaries

- Targeted verification passed 6 suites / 175 tests covering stale-client replacement, outdated seven-tool rejection, version verification, lifecycle serialization, parameter normalization, Chat schema injection/recovery, and UI contracts.
- The complete Jest suite (`81/81` suites, `835/835` tests), ESLint, TypeScript, `git diff --check`, and the production build passed.
- A read-only live smoke using the locally configured Secret and the preset endpoint returned exactly 17 `dreamina_*` tools and a successful `dreamina_version` call. No token value was read into output or written to tracked files.
- Local Chrome QA covered desktop and `390x844`: activation and reactivation visibly entered the busy state, completed with the image-generation mode enabled, mobile closed the menu only after success, horizontal overflow stayed zero, and Console warning/error stayed zero.
- No image/video generation, account/session mutation, push, PR, deploy, remote configuration change, or credential persistence was performed.
