# Browser Acceptance Regression Follow-up

Date: 2026-07-14
Branch: `dev`
State: implemented and verified locally; included in this commit

## Goal And Boundaries

Close the six user-reported acceptance regressions discovered during desktop smoke testing, without changing provider requests, message persistence, native image generation, generic MCP behavior, or unrelated P2/P3 items.

Completion requires:

- closed model controls expose only the active reasoning or image parameters and reveal the full model name when opened;
- entering a draft in a new conversation keeps the welcome hero and centered composer until the first real submit;
- focusing or typing in a composer while reading history does not jump to the bottom;
- the Mask catalog follows the app language by default while preserving All Languages and explicit fixed-language choices;
- the quick-jump control does not place a visual wash over message content;
- the first-token wait state uses one compact status instead of simultaneous skeleton and Typing treatments;
- targeted regression tests, complete Jest, lint, TypeScript, diff checks, build, runtime health, and independent review pass.

## Implemented Result

### Composer And Model Control

- Restored progressive disclosure in the model button. The full model name and separator render only while the selector is open; the accessible label continues to expose the complete model and active detail.
- Empty-state layout now depends on conversation state, not draft content. Text, attachments, or prompt hints no longer move the composer to the page bottom or remove the welcome hero before submission.
- Removed focus/click-driven `scrollToBottom()` calls and removed typing from the automatic tail-follow predicate. Existing tail behavior remains for readers already at the bottom and for the bounded top-attachment path.

### Mask Language Persistence

- Added explicit `app`, `all`, and `fixed` language-filter modes. New and migrated default catalogs resolve against the current app language instead of a stale persisted concrete locale.
- Kept All Languages as an explicit selectable mode; ambiguous historical `language: undefined` state migrates to `app`, while concrete legacy languages remain fixed.
- Added localized “Follow App Language” options in Chinese and English and regression coverage for resolution and migration.

### Overlay And Streaming Feedback

- Removed the quick-jump safe-lane pseudo-element and its private color/height variables. The circular top/bottom control, composer gap, and message-body bottom safe area remain.
- Removed the redundant three-line waiting skeleton and its theme/mobile/reduced-motion branches. The localized Typing pill and accessible live status remain before the first token; the existing stream reveal, caret, and Reduced Motion fallback remain after content begins.

## Verification Evidence

Passed on the final code state:

```text
corepack yarn jest test/gemini-visual-migration.test.ts test/builtin-masks.test.ts test/chat-scroll-performance.test.ts test/chat-render.test.ts test/chat-scroll-navigation.test.ts test/message-content.test.ts --runInBand --runTestsByPath
6/6 suites, 116/116 tests

corepack yarn jest --runInBand
81/81 suites, 784/784 tests

corepack yarn lint
PASS, zero warning/error

corepack yarn tsc --noEmit --pretty false
PASS

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

An independent read-only review reran four focused suites (`106/106` tests), TypeScript, and diff checks, then rechecked the six behavior chains; it found no P0/P1/P2 blocker in this scope.

The development server was restarted after the production build and serves the corrected tree on port `3000`. Local HTTP smoke returned HTML `200` for `/` and valid JSON `200` for `/api/config`.

## Runtime Boundary And Manual Matrix

The in-app Browser runtime still fails during setup with `Cannot redefine property: process`, including after a clean runtime reset. Therefore this handoff does not claim post-fix visual or interaction PASS from automation.

Manual desktop and mobile smoke should cover:

1. closed/open Chat model control and closed/open Image model control;
2. new conversation text draft, attachment draft, first submit, and welcome-hero transition;
3. focus and typing while positioned mid-history, followed by an intentional quick-jump;
4. English and Chinese app language with Follow App Language, All Languages, and a fixed catalog language;
5. quick-jump over long Markdown in Light and Dark themes;
6. first-token wait, streaming content, completion, and Reduced Motion.

No commit, push, PR, deploy, provider request, external MCP call, credential entry, or remote configuration write is included in this follow-up.

## Second Mobile Acceptance Correction

The next user smoke pass found four mobile layout regressions, the remaining first-token alignment issue, and an unwanted error-page action. The same boundaries remain: provider requests, persistence, native image generation, MCP execution, animation, and streaming semantics are unchanged.

Implemented:

- The mobile empty composer no longer stops at `376px`; it uses `calc(100% - 20px)`, giving Image text enough room at the reported `564px` viewport while retaining the full `184px` reservation for long image parameters and Send.
- Mobile sidebar and desktop sidebar now render the same localized Settings row. The separate avatar/account card, `NeatChat / Local` copy, pixel face, private theme tokens, and dead responsive CSS are removed.
- Masks use compact horizontal rows from `421–600px`, stack only at `≤420px`, and stack long filter controls at `≤358px`. The shared Plugin list receives the same responsive rules. The misspelled window subtitle class is corrected in both Masks and Plugins, and header icon buttons have accessible labels.
- The first-token Typing pill is wrapped in the same centered `780px` prose track as the assistant model header, closing the remaining horizontal offset without removing model identity or feedback motion.
- The error boundary no longer imports or renders the GitHub report link. Clear All Data still exports the current sync state before clearing local conversations and retains its confirmation.

Verification on the final tree:

```text
corepack yarn jest test/composer-responsive.test.ts test/frontend-performance-compat.test.ts test/gemini-visual-migration.test.ts test/builtin-masks.test.ts test/chat-render.test.ts test/message-content.test.ts --runInBand --runTestsByPath
6/6 suites, 114/114 tests

corepack yarn jest --runInBand
81/81 suites, 784/784 tests

corepack yarn lint
PASS, zero warning/error

npx tsc --noEmit --pretty false
PASS

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

The development server was restarted after build and is available on port `3000`. A clean in-app Browser runtime retry still failed during setup with `Cannot redefine property: process`; therefore `564x998`, `524x998`, `390x844`, and `320x740` visual interaction remain explicit manual checks rather than claimed automation PASS.

## Final Mask Migration Correction

The `3.3` compatibility migration prioritizes the new product default where historical state is ambiguous:

- an old store with no persisted `language` migrates to `app` and follows the current UI language;
- an old store with concrete `cn` or `en` remains that language in `fixed` mode;
- a newly created store still starts in `app` mode and follows the current UI language.

Historical `language: undefined` cannot distinguish an untouched default from an explicit All Languages choice, so the migration deliberately favors Follow App Language; users who intentionally want the mixed catalog can select All Languages again. `test/builtin-masks.test.ts` passed as part of the final six-suite / `108`-test focused run; the complete Browser matrix remains the manual boundary recorded above.

## Mobile Markdown Gesture Arbitration Correction

The final uncommitted-change review found that the mobile left-edge history gesture yielded only to a class whitelist. The whitelist covered tables, code, images, and the gallery but not every complex Markdown surface, so a rightward horizontal drag beginning within the left `32px` of a wide formula or Mermaid surface could still navigate away from the conversation.

Implemented:

- `isExcludedChatSwipeTarget` now recognizes one semantic `data-chat-horizontal-scroll` contract plus the composer attachment strip; Markdown class names are no longer embedded in Chat gesture logic.
- Display formulas, code blocks, every table viewport, Markdown image frames, Mermaid figures, and Mermaid failure surfaces opt into the contract. CSV-style content is rendered through the same marked table viewport, while the message gallery retains its existing marker.
- The normal left-edge navigation threshold and horizontal-versus-vertical intent calculation are unchanged. No animation, provider request, state, persistence, Markdown parsing, or desktop behavior changed.
- Component-level tests assert the marker on rendered formula, code, table, Mermaid success, and Mermaid fallback surfaces. The Chat visual contract asserts that gesture arbitration depends on the semantic marker rather than Markdown implementation classes.

Verification on the final tree:

```text
corepack yarn jest test/gemini-visual-migration.test.ts test/mermaid.test.tsx test/markdown-performance.test.tsx test/markdown-code-language.test.tsx test/markdown-table.test.tsx --runInBand --runTestsByPath
5/5 suites, 113/113 tests

corepack yarn jest test/chat-scroll-navigation.test.ts test/chat-scroll-performance.test.ts test/message-content.test.ts --runInBand --runTestsByPath
3/3 suites, 16/16 tests

corepack yarn jest --runInBand
82/82 suites, 797/797 tests

corepack yarn lint
PASS, zero warning/error

corepack yarn tsc --noEmit --pretty false
PASS

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

The known post-build stale dev-server state initially returned HTML `500` for both `/` and `/api/config`. Restarting the development server restored HTML `200` for `/` and valid JSON `200` for `/api/config`. Two in-app Browser connection attempts, including one after a clean runtime reset, still failed with `Cannot redefine property: process`; therefore live `390x844` horizontal-drag arbitration remains a manual verification boundary and is not claimed from source or Jest evidence.

## Final Pre-commit Review Closure

The fresh review of the complete dirty tree found and closed two remaining catalog regressions:

- Mask search no longer stores a result array that becomes stale when the language filter changes. The visible list is derived from the current filtered catalog and normalized search text on every render.
- New Chat applies locale filtering only to built-in Masks. User-created and imported Masks remain eligible for the featured area even when their stored language differs from the current app language.

The same final pass completed the previously blocked Browser evidence. The in-app Browser loaded the live local app at desktop `1280px`, mobile `390x844`, and narrow `320x740`. It verified model progressive disclosure, empty-state draft retention, Mask search across `app`/`cn`/`en`, the mobile chat drawer and chat-settings modal, wide-table rendering, and non-overlapping narrow composer controls. All checked views had zero page overflow, no framework overlay, and no relevant Console warning/error. The `390px` wide-table viewport and custom scrollbar both exposed the horizontal-scroll marker. Physical touch-event arbitration remains covered by deterministic component/gesture contracts rather than a device touch injection.

Final verification:

```text
corepack yarn jest --runInBand --silent
82/82 suites, 806/806 tests

corepack yarn lint
PASS, zero warning/error

npx tsc --noEmit --pretty false
PASS

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

No commit, push, PR, deploy, credential entry, provider request, external MCP call, or remote write was performed.
