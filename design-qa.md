# Gemini Visual Migration QA

Final result: passed.

Target:方案 A, keeping NeatChat routes, logo, model controls, chat actions, upload entry, and existing session behavior while moving the chat start screen toward a Gemini-like lightweight full-screen layout.

Implementation surfaces:

- `app/components/chat.tsx`: empty chat state and centered composer state.
- `app/components/chat.module.scss`: full-screen empty state, low-shadow input pill, mobile empty composer constraints, preserved action menu and model/send controls.
- `app/components/home.module.scss`: lighter sidebar surface.
- `app/styles/globals.scss` and `app/constant.ts`: full viewport sizing and sidebar width defaults.

Browser QA:

- Desktop viewport `1440x1024`: empty title and composer centered in the main chat area, no horizontal overflow.
- Mobile viewport `390x844`: default empty composer is `280px x 56px`, no horizontal overflow, keyboard clearing a draft returns the composer to default height.
- Interactions: chat tool menu opens and shows conversation settings, upload, clear chat, model entry, and image generation; textarea accepts draft input; Search route and Masks route navigate and render. Console health has a known React dev warning noted below.

Review-fix QA:

- Desktop empty expanded input keeps `38px` textarea bottom padding so the reasoning/model control does not cover typed content.
- Mobile empty composer keeps the tool menu button visible at `40px x 40px`; the menu opens and shows conversation settings, upload, clear chat, model entry, and image generation without horizontal overflow.
- Empty composer with attachments preserves the expanded attachment preview height on desktop and mobile; Browser paste-to-attachment QA measured expanded containers on both viewports with no horizontal overflow.
- Empty composer with pasted long-text attachment hides the empty-state title while keeping the empty input layout active; Browser measured title absent, no overlap, and no horizontal overflow on desktop `1440x1024` and mobile `390x844`.
- Empty composer tool menu hides the empty-state title while the menu is open; Browser measured title absent, menu visible, no overlap, and no horizontal overflow on desktop `1440x1024`.
- Mobile empty composer tool menu stays inside the viewport; Browser measured `rightOverflowPx: 0` at `390x844`, `360x740`, and `320x740`.
- Default empty composer still shows `你好！想聊点什么？` when there is no draft, attachment, or prompt hint.
- Empty-state title now reads from `Locale.Chat.EmptyTitle` with Chinese and English locale entries.
- Earlier broad Browser QA observed a known React dev warning about updating `AppPage` while rendering `Chat`; it is outside the targeted visual-fix diff and remains as follow-up risk.

Automated checks:

- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`

Visual evidence:

- Browser DOM, interaction, and viewport checks passed; console has the known React dev warning listed above.
- Browser screenshot capture timed out at `Page.captureScreenshot`; supplemental headless Chrome desktop screenshot was generated at `/tmp/neatchat-gemini-ui-qa/desktop-empty.png`.

## Iteration 2026-06-14 start-screen suggestions

Result: passed.

Scope:

- `app/components/chat.tsx`: added Gemini-like empty-state suggestion chips that only render with the empty hero and fill the composer on click.
- `app/components/chat.module.scss`: added independent `chat-empty-suggestions` and `chat-empty-suggestion` styling with mobile constraints.
- `app/locales/cn.ts` and `app/locales/en.ts`: added localized `EmptySuggestions`.
- `test/gemini-visual-migration.test.ts`: locked the empty-state suggestion structure without reusing `PromptHints`.

Automated checks:

- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`

Browser QA:

- Desktop `1440x1024`: Browser DOM measured `horizontalOverflowPx: 0`; four suggestion buttons visible under `你好！想聊点什么？`; composer bounds `left: 490`, `right: 1250`; no framework overlay; no console warnings or errors were observed during this focused check.
- Desktop interaction: clicking `帮我规划今天的任务` set `#chat-input` to that text, focused `chat-input`, hid the empty title and suggestion chips, and did not show prompt autocomplete.
- Mobile `390x844`: Browser DOM measured `horizontalOverflowPx: 0`; suggestion chips fit in two rows between title and bottom composer; composer bounds `left: 10`, `right: 380`; menu button remained `42px x 42px`.
- Mobile `390x844` interaction: clicking `分析这份文件` set `#chat-input` to that text, focused `chat-input`, hid the empty title and suggestion chips, and did not show prompt autocomplete.
- Narrow mobile `320x740`: Browser DOM measured `horizontalOverflowPx: 0`; suggestion container bounds `left: 16`, `right: 304`; composer bounds `left: 10`, `right: 310`; menu button remained `42px x 42px`.
- Narrow mobile tool menu: opening the chat tool menu measured `rightOverflowPx: 0`, `leftOverflowPx: 0`, `bottomOverflowPx: 0`; title and suggestion chips were hidden while the menu was open.

Known risks:

- Browser `tab.screenshot()` timed out at `Page.captureScreenshot`. Supplemental headless Chrome screenshots were not used as evidence because a clean Chrome profile stopped on the access-code screen. This iteration is verified by Browser DOM, layout metrics, interaction checks, and console logs instead of screenshots.
