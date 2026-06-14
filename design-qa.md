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

## Iteration 2026-06-14 sidebar-navigation

Result: passed.

Scope:

- `app/components/sidebar.tsx`: split sidebar actions into primary and content sections, added a local-content entry that routes to Search Chat, and kept Discovery in the content section with the existing MCP/Plugins selector.
- `app/components/home.module.scss`: added sidebar section/card styling, narrow-sidebar icon behavior, and dark-mode styling without changing chat history, settings, or account placement.
- `app/locales/cn.ts` and `app/locales/en.ts`: added section labels and local-content copy.
- `test/gemini-visual-migration.test.ts`: locked the sidebar section hooks, existing routes, Discovery selector, ChatList, and locale keys.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected before implementation because `styles["sidebar-primary-nav"]` was missing.
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`

Browser QA:

- Desktop `1440x1024`: Browser DOM measured `horizontalOverflowPx: 0`; primary nav bounds `left: 12`, `right: 287`, `top: 68`, `bottom: 226.5`; content nav bounds `left: 12`, `right: 287`, `top: 240.5`, `bottom: 377`; local-content card bounds `left: 12`, `right: 287`, `top: 277`, `bottom: 335`; no framework overlay or console logs.
- Desktop interaction: clicking `本地内容` navigated to `#/search-chat` and rendered Search Chat; returning home and clicking `发现` opened the existing selector with MCP, Plugins, and Search Chat entries and `horizontalOverflowPx: 0`.
- Mobile closed drawer `390x844`: Browser DOM measured `horizontalOverflowPx: 0`; primary nav, content nav, local-content card, settings, and account remained in the off-canvas sidebar; section labels and local-content copy were present for the opened drawer state.
- Narrow mobile closed drawer `320x740`: Browser DOM measured `horizontalOverflowPx: 0`; off-canvas sidebar width was `266px`; primary/content sections and local-content card retained bounded widths with no framework overlay.

Known risks:

- Browser click helpers timed out or hit wrapper limits when attempting to open the mobile drawer by accessibility label, so opened-drawer mobile evidence is not included in this iteration. Desktop interaction and mobile closed-drawer layout passed, and automated tests lock the preserved sidebar routes and structure.

## Iteration 2026-06-14 conversation-reading

Result: passed.

Scope:

- `app/components/chat.tsx`: wrapped rendered conversation messages in `chat-reading-surface` and added role-specific row hooks for user and assistant messages.
- `app/components/chat.module.scss`: added stable conversation width variables, assistant/user max-width constraints, reading-surface spacing, and a post-`chat-message-user` override so user bubbles align to the right edge.
- `test/gemini-visual-migration.test.ts`: locked the reading-surface hooks, width variables, and CSS ordering required for right-aligned user messages.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `styles["chat-reading-surface"]` was missing.
- During Browser QA, user bubbles were found left-aligned because `.chat-message-user` overrode the new row direction; a second red test locked the required post-override before the fix.
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`

Browser QA:

- Desktop `1440x1024`: opened existing `日出东方图` conversation; Browser DOM measured `horizontalOverflowPx: 0`, `readingSurface.width: 920`, assistant container width `760`, user container `rightGapToSurface: 0`, input panel bounds `left: 430`, `right: 1310`; no framework overlay or console warn/error logs.
- Mobile `390x844`: same conversation measured `horizontalOverflowPx: 0`, `readingSurface.width: 322`, assistant containers fit the surface, user container `rightGapToSurface: 0`, input panel bounds `left: 10`, `right: 380`; model control remained visible.
- Narrow mobile `320x740`: measured `horizontalOverflowPx: 0`, `readingSurface.width: 252`, user container `rightGapToSurface: 0`, input panel bounds `left: 10`, `right: 310`; no framework overlay or console warn/error logs.

Known risks:

- This iteration used Browser DOM/layout metrics as evidence. Browser screenshots were not required because the DOM evidence directly covered width, alignment, overflow, and core controls for the target slice.

## Iteration 2026-06-14 multimodal-tray

Result: passed.

Scope:

- `app/components/chat.tsx`: grouped composer-adjacent actions into Gemini-like multimodal and session sections while preserving upload, Jimeng MCP activation, image generation, model, plugin, clear-context, and attachment behavior.
- `app/components/chat.module.scss`: added tray/section layout hooks, mobile action-menu stacking, section separation, and bounded widths for narrow viewports.
- `test/gemini-visual-migration.test.ts`: locked the multimodal tray hooks and the preserved Jimeng MCP, attachment, image-generation, and submit-path invariants.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `styles["chat-multimodal-tray"]` was missing.
- A follow-up test check caught the missing explicit `min-width: 0` on the primary multimodal section before the CSS fix.
- Browser QA found and fixed an empty mobile session section; mobile now omits the section when there is no visible session action.
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts test/openai-image.test.ts test/stream-fetch.test.ts --runInBand`

Browser QA:

- Desktop `1440x1024`: tool menu opened at `left: 490`, `right: 826`, `top: 177`, `bottom: 388`; `horizontalOverflowPx: 0`; menu/tray overflow all `0`; upload and image-generation actions visible; session section visible with `对话设置` and `gpt-5.4`; no framework overlay or console warn/error logs.
- Mobile `390x844`: tool menu opened at `left: 11`, `right: 315`, `top: 636`, `bottom: 767`; `horizontalOverflowPx: 0`; menu/tray overflow all `0`; upload and image-generation actions visible; empty session section not rendered; no framework overlay or console warn/error logs.
- Narrow mobile `320x740`: tool menu opened at `left: 11`, `right: 275`, `top: 532`, `bottom: 663`; `horizontalOverflowPx: 0`; menu/tray overflow all `0`; upload and image-generation actions visible; empty session section not rendered; no framework overlay or console warn/error logs.

Known risks:

- Browser screenshots were not used for this iteration. DOM/layout metrics were used because they directly covered menu bounds, overflow, grouping, visible actions, and console health for the targeted slice.

## Iteration 2026-06-14 mobile-shell

Result: passed.

Scope:

- `app/components/chat.tsx`: replaced the mobile drawer trigger with a native button that exposes `aria-controls="mobile-sidebar-drawer"`, route-derived `aria-expanded`, and a stable `data-mobile-sidebar-trigger` hook without changing the existing `Path.Home` navigation contract.
- `app/components/home.tsx`: connected the mobile sidebar backdrop to the same drawer id and exposed open state through `aria-expanded={isHome}`.
- `app/components/sidebar.tsx`: added the stable `mobile-sidebar-drawer` id on the existing sidebar container.
- `app/components/chat.module.scss`: preserved the mobile header button sizing while resetting native button appearance, border, hover, and focus-visible states.
- `test/gemini-visual-migration.test.ts`: locked mobile drawer, model menu, composer menu, input, and narrow action-menu layout hooks.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `aria-controls="mobile-sidebar-drawer"` was missing.
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/message-content.test.ts --runInBand`

Browser QA:

- Desktop `1440x1024`: page identity `NeatChat`, `horizontalOverflowPx: 0`; sidebar drawer id present with desktop bounds `left: 0`, `right: 300`; composer bounds `left: 490`, `right: 1250`; tool menu bounds `left: 490`, `right: 826`, `top: 177`, `bottom: 388`; upload and image-generation actions visible; no framework overlay or console warn/error logs.
- Mobile `390x844`: initial chat had trigger `aria-controls: mobile-sidebar-drawer`, `aria-expanded: false`; composer bounds `left: 10`, `right: 380`; `horizontalOverflowPx: 0`. Opening drawer changed trigger/backdrop to `aria-expanded: true`, drawer bounds `left: 0`, `right: 304`, sidebar entries visible. Closing via the visible right-edge backdrop returned route to `#/chat`, trigger `aria-expanded: false`, drawer hidden at `left: -304`; tool menu bounds `left: 11`, `right: 315`, `top: 636`, `bottom: 767`; upload and image-generation actions visible; no framework overlay or console warn/error logs.
- Narrow mobile `320x740`: initial chat had trigger `aria-controls: mobile-sidebar-drawer`, `aria-expanded: false`; composer bounds `left: 10`, `right: 310`; `horizontalOverflowPx: 0`. Opening drawer changed trigger/backdrop to `aria-expanded: true`, drawer bounds `left: 0`, `right: 266`, sidebar entries visible. Closing via the visible right-edge backdrop restored trigger `aria-expanded: false`, drawer hidden at `left: -266`; tool menu bounds `left: 11`, `right: 275`, `top: 532`, `bottom: 663`; upload and image-generation actions visible; no framework overlay or console warn/error logs.

Known risks:

- Browser screenshots were not used for this iteration. DOM/layout metrics were used because they directly covered drawer state, route transition, overflow, menu bounds, visible entries, and console health.
- The drawer close hit target is intentionally the visible right-edge backdrop outside the drawer; clicking inside the drawer does not close it because the drawer is above the backdrop by design.
