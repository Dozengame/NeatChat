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

## Iteration 2026-06-14 theme-a11y-focus

Result: passed.

Scope:

- `app/styles/globals.scss`: added shared `--surface-elevated`, `--focus-ring`, and `--focus-ring-shadow` tokens for light and dark themes.
- `app/components/chat.module.scss`: applied elevated surfaces to model/tool menus and added focus-visible rings to mobile header, model, reasoning, desktop model, composer menu, and action-menu controls.
- `app/components/home.module.scss`: applied the elevated surface token and focus-visible ring to sidebar nav/content controls.
- `app/components/button.module.scss`: aligned icon-button focus-visible treatment with the shared focus tokens.
- `test/gemini-visual-migration.test.ts`: locked the theme tokens and focus-visible selectors for the Gemini shell surfaces.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the new elevated-surface and focus-token assertions were missing.
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/markdown-performance.test.tsx --runInBand`

Browser QA:

- Desktop Browser viewport `1280x720`: `horizontalOverflowPx: 0`; tool menu opened at `left: 410`, `right: 746`, `top: 73`, `bottom: 284` with `rgba(255, 255, 255, 0.96)` elevated background; desktop model menu opened at `left: 318`, `right: 698`, `top: 54`, `bottom: 275`; no console errors.
- Mobile `390x844`: `horizontalOverflowPx: 0`; drawer trigger changed to `aria-expanded: true` and sidebar card moved into viewport at `left: 12`, `right: 291`; tool menu opened at `left: 11`, `right: 315`, `top: 636`, `bottom: 767`; mobile model menu opened at `left: 52`, `right: 338`, `top: 46`, `bottom: 267`; no console errors.
- Narrow mobile `320x740`: `horizontalOverflowPx: 0`; tool menu opened at `left: 11`, `right: 275`, `top: 532`, `bottom: 663`; no console errors.
- Browser CSSOM reported `36` loaded `:focus-visible` rules, including the updated sidebar content card, mobile model title, mobile reasoning head, desktop model title, and shared icon-button focus rules; theme variables resolved in-page for `--surface-elevated`, `--focus-ring`, and `--focus-ring-shadow`.

Known risks:

- Browser CUA keypress did not reliably move keyboard focus in this session, so focus-visible activation was verified through source tests plus Browser CSSOM rather than a live Tab traversal screenshot.
- Browser screenshots were not used for this iteration. DOM/layout metrics and CSSOM evidence directly covered the targeted surface, overflow, menu, and focus-token behavior.

## Iteration 2026-06-15 message-action-rail

Result: passed.

Scope:

- `app/components/chat.tsx`: moved message-level Retry, Delete, Pin, Copy, and Speech actions into a dedicated `chat-message-action-rail` wrapper and added explicit `aria-label` values to icon-only `ChatAction` buttons.
- `app/components/chat.module.scss`: separated message actions from composer actions, made desktop message actions low-interference until hover/focus, and made mobile actions visible with 34px touch targets and no resize transition trap.
- `test/gemini-visual-migration.test.ts`: locked the dedicated message action rail, removed inline margin styling, preserved accessible button names, and protected mobile visibility overrides.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `aria-label="消息操作"` and `chat-message-action-rail` were missing.
- A follow-up red test caught missing icon-button accessible names before adding `aria-label={props.text}` to `ChatAction`.
- Browser QA then found mobile resize could retain the desktop transparent action state; a red test locked `!important` visibility and `transition: none` for the mobile action container before the CSS fix.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts test/message-content.test.ts --runInBand`

Browser QA:

- Desktop `1440x1024`: after sending a local `Browser` prompt, measured `rows: 3`, `actionBlocks: 2`, `rails: 2`, `buttons: 8`, `horizontalOverflowPx: 0`; desktop action containers defaulted to `opacity: 0`, `pointer-events: none`, `transform: translateY(4px)`; first four buttons had aria labels `重试`, `删除`, `固定`, `复制` and measured `30x30`.
- Desktop CSSOM included both activation rules: `.chat-message-container:hover .chat-message-actions` and `.chat-message-container:focus-within .chat-message-actions` set `opacity: 1`, `pointer-events: auto`, and `transform: translateY(0px)`.
- Mobile `390x844` after dynamic resize from desktop: measured `rows: 3`, `actionBlocks: 2`, `rails: 2`, `buttons: 8`, `horizontalOverflowPx: 0`; action containers computed `opacity: 1`, `pointer-events: auto`, `transform: none`, `transition: none`; first four buttons measured `34x34`; rail right overflow was `0`.
- Narrow mobile `320x740` after dynamic resize from `390x844`: measured `rows: 3`, `actionBlocks: 2`, `rails: 2`, `buttons: 8`, `horizontalOverflowPx: 0`; action containers computed `opacity: 1`, `pointer-events: auto`, `transform: none`, `transition: none`; first four buttons measured `34x34`; rail right overflow was `0`.
- No Browser console warnings or errors were reported during the final desktop, mobile, or narrow checks.

Known risks:

- Browser wrapper could not trigger a true hover event through `locator.hover`, so desktop hover activation was verified through source tests plus Browser CSSOM. Desktop default hidden state, rail dimensions, overflow, labels, and focus/hover rules were verified in the live page.
- Browser virtual clipboard was unavailable, so Copy was not verified through the OS clipboard. The action buttons, labels, and existing click handlers were preserved by source-level tests.

## Iteration 2026-06-15 composer-attachment-strip

Result: passed.

Scope:

- `app/components/chat.tsx`: added list semantics to the composer attachment preview and split image/file preview items into explicit `attach-image-item` and `attach-file-item` hooks without changing paste, upload, edit, delete, or submit behavior.
- `app/components/chat.module.scss`: converted attachments from 82px square cards into a lightweight horizontal strip: 64px image previews, 64px file chips on desktop, 58px mobile image previews, bounded mobile file chips, and `min-width: 0` safeguards so the prompt bar cannot expand past the viewport.
- `test/gemini-visual-migration.test.ts`: locked the attachment strip semantics, desktop chip sizing, mobile chip sizing, and final mobile override that prevents root file-chip styles from overriding the mobile breakpoint.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `aria-label="附件预览"` and attachment item hooks were missing.
- Browser QA then found mobile min-content expansion pushing the composer panel and send button past the viewport; a follow-up red test locked `min-width: 0`, mobile strip padding, and final mobile file-chip width before the CSS fix.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/message-content.test.ts test/openai-image.test.ts test/stream-fetch.test.ts --runInBand`

Browser QA:

- Browser used the real app paste path to create both preview states: pasted a data image URL into `#chat-input`, then pasted 1200 characters so the app converted it into `粘贴的文本.txt`.
- Desktop `1440x1024`: measured `itemCount: 2`, `deleteCount: 2`, `horizontalOverflowPx: 0`; strip role `list`, aria `附件预览`, strip bounds `left: 503`, `right: 1193`; image preview `64x64`; file chip `220x64`; send button `right: 1301` inside the viewport.
- Mobile `390x844`: measured `itemCount: 2`, `deleteCount: 2`, `horizontalOverflowPx: 0`; strip bounds `left: 67`, `right: 313`, `clientWidth: 246`, `scrollWidth: 286`, right overflow `0`; image preview `58x58`; file chip `170x58`; send button `right: 364` inside the viewport.
- Narrow mobile `320x740`: measured `itemCount: 2`, `deleteCount: 2`, `horizontalOverflowPx: 0`; strip bounds `left: 67`, `right: 243`, `clientWidth: 176`, `scrollWidth: 286`, right overflow `0`; image preview `58x58`; file chip `170x58`; send button `right: 294` inside the viewport.
- Delete interaction: clicked the first attachment delete button on mobile `390x844`; attachment list changed from `2` items to `1`, retained `粘贴的文本.txt`, and `horizontalOverflowPx` remained `0`.
- No Browser console warnings or errors were reported during the final desktop, mobile, or narrow checks.

Known risks:

- Browser validation covered paste-created image and long-text file attachments. Native file picker upload was not automated because it would require OS file chooser control, but the rendered preview uses the same `attachImages` and `attachedFiles` state paths.

## Iteration 2026-06-15 composer-status-row

Result: passed.

Scope:

- `app/components/chat.tsx`: moved the existing desktop reasoning control into a reusable composer status row, added a read-only `图片生成` mode chip, and kept image mode as active composer content so the prompt bar expands when that mode is enabled.
- `app/components/chat.module.scss`: added bounded status-row and mode-chip styles, reused the existing reasoning control behavior, and reserved bottom input space so chips do not cover prompt text or the send button.
- `test/gemini-visual-migration.test.ts`: locked the status-row hooks, image-mode chip guard, mobile status-row bounds, and existing Jimeng MCP activation/deactivation invariants.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `styles["chat-input-status-row"]` was missing.
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/openai-image.test.ts test/message-content.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024` default mode: measured `chips: ["标准⌄"]`, `horizontalOverflowPx: 0`, `statusRightOverflow: 0`, panel right overflow `0`, send button right overflow `0`, and no console warn/error logs.
- Desktop `1440x1024` image mode: opened the composer tool menu, enabled `图片生成`, and measured `chips: ["标准⌄", "图片生成"]`, `hasImageChip: true`, `horizontalOverflowPx: 0`, `statusRightOverflow: 0`, panel/send right overflow `0`, and no console warn/error logs.
- Mobile `390x844` image mode: measured `chips: ["图片生成"]`, status bounds `left: 67`, `right: 319`, send bounds `left: 324`, `right: 364`, `horizontalOverflowPx: 0`, send right/bottom overflow `0`, and no console warn/error logs.
- Narrow mobile `320x740` image mode: measured `chips: ["图片生成"]`, status bounds `left: 67`, `right: 249`, send bounds `left: 254`, `right: 294`, `horizontalOverflowPx: 0`, send right/bottom overflow `0`, and no console warn/error logs.
- The existing compact-screen rule still keeps the desktop reasoning dropdown off mobile; mobile status-row QA therefore focused on the active image-generation mode chip.

Known risks:

- Browser CUA text input and virtual clipboard were unavailable in this session, so typed-draft and pasted-attachment coexistence were covered by source/Jest constraints plus the previous attachment-strip Browser iteration rather than a fresh live paste flow.

## Iteration 2026-06-15 empty-state-visual-restraint

Result: passed.

Scope:

- `app/components/chat.tsx`: removed the empty-state decorative halo element while preserving the empty title, NeatChat logo, suggestion chips, prompt bar, and suggestion-click behavior.
- `app/components/chat.module.scss`: removed the root, mobile, and desktop `.chat-empty-halo` styles so the empty state relies on restrained spacing and existing app background instead of a separate decorative blur layer.
- `test/gemini-visual-migration.test.ts`: changed the visual contract to require no `chat-empty-halo` hook while keeping the existing empty-state, suggestion, and tool-menu entry-point checks.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `styles["chat-empty-halo"]` was still rendered.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: measured title `你好！想聊点什么？`, `suggestionCount: 5`, `hasHalo: false`, `haloClassMatches: 0`, `horizontalOverflowPx: 0`, title/prompt overlap `false`, suggestions/prompt overlap `false`, and no console warn/error logs.
- Mobile `390x844`: measured title `你好！想聊点什么？`, `suggestionCount: 5`, `hasHalo: false`, `haloClassMatches: 0`, `horizontalOverflowPx: 0`, prompt right overflow `0`, suggestions right overflow `0`, title/prompt overlap `false`, suggestions/prompt overlap `false`, and no console warn/error logs.
- Narrow mobile `320x740`: measured title `你好！想聊点什么？`, `suggestionCount: 5`, `hasHalo: false`, `haloClassMatches: 0`, `horizontalOverflowPx: 0`, prompt right overflow `0`, suggestions right overflow `0`, title/prompt overlap `false`, suggestions/prompt overlap `false`, and no console warn/error logs.
- Interaction proof at desktop `1440x1024`: clicked `分析这份文件`; input value became `分析这份文件`, empty title and suggestions were hidden, `hasHalo: false`, `horizontalOverflowPx: 0`, and no console warn/error logs.

Known risks:

- Browser evidence is DOM/layout based. Screenshots were not used because the measured DOM state directly covered the removed decoration, empty-state visibility, prompt bounds, overlap, overflow, and interaction behavior.

## Iteration 2026-06-15 shell-background-restraint

Result: passed.

Scope:

- `app/components/chat.module.scss`: replaced the root and desktop `.chat` decorative radial/linear background stack with `background: var(--surface)`.
- `test/gemini-visual-migration.test.ts`: changed the visual contract to require the root and desktop `.chat` declarations to use the surface token without `radial-gradient` or desktop `linear-gradient`.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `.chat` still used a `radial-gradient` background.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: `.chat` computed `backgroundImage: none`, `backgroundColor: rgb(255, 255, 255)`, title `你好！想聊点什么？`, `suggestionCount: 5`, `horizontalOverflowPx: 0`, prompt right overflow `0`, title/prompt overlap `false`, suggestions/prompt overlap `false`, and no console warn/error logs.
- Mobile `390x844`: `.chat` computed `backgroundImage: none`, `backgroundColor: rgb(255, 255, 255)`, title `你好！想聊点什么？`, `suggestionCount: 5`, `horizontalOverflowPx: 0`, prompt right overflow `0`, suggestions right overflow `0`, title/prompt overlap `false`, suggestions/prompt overlap `false`, and no console warn/error logs.
- Narrow mobile `320x740`: `.chat` computed `backgroundImage: none`, `backgroundColor: rgb(255, 255, 255)`, title `你好！想聊点什么？`, `suggestionCount: 5`, `horizontalOverflowPx: 0`, prompt right overflow `0`, suggestions right overflow `0`, title/prompt overlap `false`, suggestions/prompt overlap `false`, and no console warn/error logs.

Known risks:

- This iteration intentionally leaves non-chat utility gradients untouched, such as the clear-context mask gradient and global scrollbar styling. The Browser evidence only covers the chat shell surface targeted by this slice.

## Iteration 2026-06-15 sidebar-history-action-polish

Result: passed.

Scope:

- `app/components/chat-list.tsx`: removed the inline style object from the recent-chat delete button while preserving the existing aria label, click handler, delete confirmation behavior, drag handle, session selection, and routing.
- `app/components/home.module.scss`: moved delete-button presentation into CSS, gave recent-chat rows fixed right-side action space, added a 32px desktop delete hit area with focus-visible treatment, disabled desktop pointer hits while the action is visually hidden, and kept mobile drawer delete buttons visible at 34px without expanding the drawer.
- `test/gemini-visual-migration.test.ts`: locked the no-inline-style contract, row padding/title width, delete-button hit area/focus-visible CSS, desktop pointer-event guard, narrow-sidebar sizing, and mobile drawer visibility.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `chat-list.tsx` still contained `style={{ ... }}` on the delete button.
- A follow-up RED assertion caught the desktop hidden delete action still accepting pointer events before adding the `pointer-events` guard.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: measured `rowCount: 5`, `deleteCount: 5`, sidebar `0..300`, row padding `8px 40px 8px 12px`, title width `223px`, delete button `32x32`, delete opacity `0`, delete pointer events `none`, delete right overflow `0`, `titleDeleteOverlap: false`, `horizontalOverflowPx: 0`, focus-visible CSS present, and no console warn/error logs.
- Mobile `390x844`: opened the mobile sidebar trigger from `aria-expanded: false` to `true`; drawer measured `0..304`, `rowCount: 5`, `deleteCount: 5`, row padding `0px 40px 0px 0px`, title width `199px`, delete button `34x34`, delete opacity `0.72`, delete pointer events `auto`, drawer/delete right overflow `0`, `titleDeleteOverlap: false`, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Narrow mobile `320x740`: opened the mobile sidebar trigger; drawer measured `0..266`, `rowCount: 5`, `deleteCount: 5`, row padding `0px 40px 0px 0px`, title width `157px`, delete button `34x34`, delete opacity `0.72`, delete pointer events `auto`, drawer/delete right overflow `0`, `titleDeleteOverlap: false`, `horizontalOverflowPx: 0`, and no console warn/error logs.

Known risks:

- Browser QA did not click the delete button because desktop delete is destructive without confirmation for non-compact layout. Existing click handlers and confirmation behavior were preserved in source, while Browser verified the rendered entry point, sizing, bounds, accessibility label, and drawer interaction.

## Iteration 2026-06-15 desktop-header-action-cluster

Result: passed.

Scope:

- `app/components/chat.tsx`: added local desktop header action cluster hooks around the existing refresh-title, edit-history, export, and fullscreen buttons without changing their handlers, titles, modal behavior, or routing.
- `app/components/chat.module.scss`: styled the chat-only desktop header action group as a bounded pill cluster, fixed each header action to a 34px circular hit area, and kept local spacing from being overridden by the generic window action rule.
- `test/gemini-visual-migration.test.ts`: locked the desktop header action hooks, cluster dimensions, local gap override, button sizing, and rounded hit area.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the desktop header action cluster hooks were missing.
- Browser QA then found the runtime action gap was still `2px` due to the generic chat window action rule; a follow-up RED assertion locked `gap: 4px !important` before the CSS fix.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: measured one header cluster with `buttonCount: 4` and titles `刷新标题`, `编辑消息记录`, `导出聊天记录`, `全屏`; cluster bounds `left: 1266`, `right: 1422`, `width: 156`, computed `gap: 4px`, `padding: 3px`, `borderRadius: 999px`; first button `34x34`; title/model did not overlap the cluster; cluster right overflow `0`; `horizontalOverflowPx: 0`; no console warn/error logs.
- Desktop interaction proof: clicked the `编辑消息记录` action in the cluster; the edit-history modal opened (`editModalOpen: true`) and `horizontalOverflowPx` remained `0`.
- Mobile `390x844`: desktop header cluster absent (`desktopClusterCount: 0`); mobile header bounds `0..390`; three mobile header buttons visible with sidebar `40x40`, model button `79x17`, settings `40x40`; no sidebar/model/settings overlap; right overflow `0`; `horizontalOverflowPx: 0`; no console warn/error logs.
- Narrow mobile `320x740`: desktop header cluster absent (`desktopClusterCount: 0`); mobile header bounds `0..320`; three mobile header buttons visible with sidebar `40x40`, model button `79x17`, settings `40x40`; no sidebar/model/settings overlap; right overflow `0`; `horizontalOverflowPx: 0`; no console warn/error logs.

Known risks:

- Browser QA used DOM and coordinate click evidence rather than screenshots. The targeted visual contract was bounded layout, hit-area size, overlap, overflow, and preserved edit action behavior.

## Iteration 2026-06-15 mobile-model-menu-polish

Result: passed.

Scope:

- `app/components/chat.tsx`: added listbox/option semantics and `aria-selected` to the mobile model menu, reasoning list, image size list, and image quality list while preserving the existing model/reasoning/image setting handlers.
- `app/components/chat.module.scss`: widened the mobile model menu within safe viewport bounds, tightened the scrollable list gutters, aligned option/check columns, made selected states visible in light and dark themes, and aligned the advanced-section header with option copy.
- `test/gemini-visual-migration.test.ts`: locked the mobile model menu accessibility roles, selected state, bounded menu dimensions, check column sizing, list gutters, selected background, and advanced-list alignment.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the menu did not yet expose `role="listbox"`, `role="option"`, or `aria-selected`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`

Browser QA:

- Desktop `1440x1024`: desktop model dialog remained the active desktop surface (`mobileMenuExists: false`), measured `380x223` at `left: 318`, `right: 698`, `top: 54`, `bottom: 277`; desktop model trigger remained `147x34`; `scrollOverflowPx: 0`; no console warn/error logs.
- Mobile `390x844`: mobile model dialog opened at `left: 35`, `right: 355`, `top: 46`, `bottom: 273`, `width: 320`; style measured `padding: 12px`, `borderRadius: 24px`, `maxHeight: 640px`; model list existed; `optionCount: 2`; `selectedCount: 1`; selected background `rgba(25, 103, 210, 0.1)`; check column measured `34px` with centered flex alignment; menu left/right overflow `0`; `scrollOverflowPx: 0`; no console warn/error logs.
- Mobile expanded reasoning `390x844`: reasoning list appeared with `reasoningOptionCount: 3`, `selectedReasoningCount: 1`, selected background `rgba(25, 103, 210, 0.1)`, menu height `405`, and `scrollOverflowPx: 0`.
- Narrow mobile `320x740`: mobile model dialog opened at `left: 24`, `right: 296`, `top: 46`, `bottom: 273`, `width: 272`; style measured `padding: 12px`, `borderRadius: 24px`, `maxHeight: 640px`; `optionCount: 2`; `selectedCount: 1`; selected background `rgba(25, 103, 210, 0.1)`; menu left/right overflow `0`; `scrollOverflowPx: 0`; no console warn/error logs.

Known risks:

- Browser QA covered the default model and reasoning controls available in the local config. Image size and quality list semantics are locked in source tests but did not render in this default non-image model state.

## Iteration 2026-06-15 composer-tools-popover-polish

Result: passed.

Target flow:

- App loads -> click the composer `打开对话工具` button -> the tools popover opens with bounded layout, grouped tool sections, stable toggle state, and no runtime errors.

Scope:

- `app/components/chat.tsx`: moved the tools popover semantics onto the real `.chat-input-action-menu` surface, added group roles for the multimodal/session sections, and exposed `aria-pressed` on the image generation toggle without changing any existing handlers.
- `app/components/chat.module.scss`: widened the desktop tools popover, aligned mobile width with the current safe-edge menu pattern, increased mobile max height slightly, and made active tool rows visible inside the popover.
- `test/gemini-visual-migration.test.ts`: locked the popover label, group semantics, image-generation toggle state, desktop/mobile menu bounds, and active row styling.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the tools popover did not expose `aria-label="对话工具菜单"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/`, title `NeatChat`, ready state `complete`, meaningful body content present, no framework overlay; tools popover existed with `role="dialog"` and `aria-label="对话工具菜单"`, measured `left: 490`, `right: 826`, `top: 178`, `bottom: 393`, `width: 336`, `height: 215`; style measured `width: 336px`, `maxHeight: 420px`, `padding: 10px`, `borderRadius: 20px`, `overflow: auto`; group count `2`; buttons measured `上传附件 310x38`, `图片生成 310x38` with `aria-pressed="false"`, `对话设置 310x38`, `gpt-5.4 310x38`; left/right overflow `0`, `scrollOverflowPx: 0`, no console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, ready state `complete`, meaningful body content present, no framework overlay; tools popover measured `left: 11`, `right: 331`, `top: 632`, `bottom: 767`, `width: 320`, `height: 135`; style measured `width: 320px`, `maxHeight: 360px`, `padding: 12px`, `borderRadius: 22px`, `overflow: auto`; tool trigger measured `42x42` with `aria-expanded="true"`; group count `1`; buttons measured `上传附件 294x46`, `图片生成 294x46` with `aria-pressed="false"`; left/right/bottom overflow `0`, `scrollOverflowPx: 0`, no console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, ready state `complete`, meaningful body content present, no framework overlay; tools popover measured `left: 11`, `right: 283`, `top: 528`, `bottom: 663`, `width: 272`, `height: 135`; style measured `width: 272px`, `maxHeight: 355.2px`, `padding: 12px`, `borderRadius: 22px`, `overflow: auto`; tool trigger measured `42x42` with `aria-expanded="true"`; group count `1`; buttons measured `上传附件 246x46`, `图片生成 246x46` with `aria-pressed="false"`; left/right/bottom overflow `0`, `scrollOverflowPx: 0`, no console warn/error logs.

Known risks:

- Browser QA did not enable image generation because that path depends on the live MCP availability check. The active row visual state and `aria-pressed` wiring are covered by source tests, while Browser verified the default `false` toggle state rendered correctly.

## Iteration 2026-06-15 composer-send-accessibility

Result: passed.

Target flow:

- App loads -> composer send control renders -> the send button has a stable accessible name while remaining visible, bounded, and separate from the textarea.

Scope:

- `app/components/chat.tsx`: passed `Locale.Chat.Send` to the existing send `IconButton` via its `aria` prop, so the real button has `aria-label="发送"` even when compact layouts hide visible send text.
- `test/gemini-visual-migration.test.ts`: locked the send button accessibility contract on the existing composer send control.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the send button did not pass `aria={Locale.Chat.Send}`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/`, title `NeatChat`, viewport `1440x1024`, ready state `complete`, meaningful body content present, no framework overlay; send button existed with `aria-label="发送"`, `roleButtonCount: 1`, visible text `发送`, measured `left: 1199`, `right: 1241`, `top: 459`, `bottom: 501`, `width: 42`, `height: 42`; textarea measured `left: 563`, `right: 1137`, `width: 574`; `sendTextareaOverlap: false`, send/panel right overflow `0`, bottom overflow `0`, `scrollOverflowPx: 0`, no console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, viewport `390x844`, ready state `complete`, meaningful body content present, no framework overlay; icon-only send button existed with `aria-label="发送"`, `roleButtonCount: 1`, visible text empty as expected, measured `left: 331`, `right: 371`, `top: 782`, `bottom: 822`, `width: 40`, `height: 40`; textarea measured `left: 67`, `right: 313`, `width: 246`; `sendTextareaOverlap: false`, send/panel right overflow `0`, bottom overflow `0`, `scrollOverflowPx: 0`, no console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, viewport `320x740`, ready state `complete`, meaningful body content present, no framework overlay; icon-only send button existed with `aria-label="发送"`, `roleButtonCount: 1`, visible text empty as expected, measured `left: 261`, `right: 301`, `top: 678`, `bottom: 718`, `width: 40`, `height: 40`; textarea measured `left: 67`, `right: 243`, `width: 176`; `sendTextareaOverlap: false`, send/panel right overflow `0`, bottom overflow `0`, `scrollOverflowPx: 0`, no console warn/error logs.

Known risks:

- Browser QA verified the send control entry point and layout, but did not submit a message because this slice intentionally did not change `doSubmit` or model/network behavior.

## Iteration 2026-06-15 composer-input-accessibility

Result: passed.

Target flow:

- App loads -> composer textarea renders -> the input has a stable accessible name on desktop and mobile while preserving existing placeholder, row count, attachments, model, MCP, and submit behavior.

Scope:

- `app/components/chat.tsx`: added an `aria-label` to the existing `#chat-input` textarea, using the desktop submit-key copy on wide layouts and `Locale.Chat.MobileInput` on compact layouts.
- `app/components/chat.module.scss`: reserved real desktop width for textarea when the input status row is visible, preventing the mode/status chip from overlapping input text.
- `test/gemini-visual-migration.test.ts`: locked the textarea accessibility contract and the status-row layout reservation.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the textarea did not expose `aria-label`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` passed after adding the textarea label.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed again as expected when the desktop status row overlap was captured as a source contract.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` passed after adding the status-row width reservation.

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/`, title `NeatChat`, viewport `1440x1024`, ready state `complete`, meaningful body content present, no framework overlay; textarea existed with `aria-label="Enter 发送，Shift + Enter 换行"`, matching placeholder, `rows="3"`, `roleTextboxCount: 1`, measured `left: 563`, `right: 1041`, `top: 466`, `bottom: 494`, `width: 478`, `height: 28`; status row measured `left: 1109`, `right: 1191`, `width: 82`; `textareaStatusOverlap: false`, `textareaSendOverlap: false`, `textareaToolOverlap: false`, textarea/panel right overflow `0`, `scrollOverflowPx: 0`, no console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, viewport `390x844`, ready state `complete`, meaningful body content present, no framework overlay; textarea existed with `aria-label="输入消息..."`, matching placeholder, `rows="1"`, `roleTextboxCount: 1`, measured `left: 67`, `right: 313`, `top: 788`, `bottom: 816`, `width: 246`, `height: 28`; send/tool overlap both `false`, textarea/panel right overflow `0`, `scrollOverflowPx: 0`, no console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, viewport `320x740`, ready state `complete`, meaningful body content present, no framework overlay; textarea existed with `aria-label="输入消息..."`, matching placeholder, `rows="1"`, `roleTextboxCount: 1`, measured `left: 67`, `right: 243`, `top: 684`, `bottom: 712`, `width: 176`, `height: 28`; send/tool overlap both `false`, textarea/panel right overflow `0`, `scrollOverflowPx: 0`, no console warn/error logs.

Screenshot note:

- In-app Browser screenshot capture was attempted with both full-page and viewport options, but the backend returned `Timed out running CDP command "Page.captureScreenshot" for tab 2`. DOM, ARIA, layout rectangle, overflow, and console-log checks above were completed in the in-app Browser after resetting each viewport and reloading.

Known risks:

- Browser QA verified the composer input accessibility and layout surface only. It did not submit a message or exercise live model/MCP network calls because this slice intentionally did not change those paths.

## Iteration 2026-06-15 empty-suggestion-list-semantics

Result: passed.

Target flow:

- App loads into an empty chat -> suggested prompts render as a stable suggestions list -> clicking a suggestion fills the existing composer textarea without changing model, MCP, attachment, image generation, or submit behavior.

Scope:

- `app/components/chat.tsx`: changed the empty-state suggestions container from a plain `div` of buttons into a semantic `ul/li/button` structure while keeping the existing `applyEmptySuggestion(suggestion)` click path.
- `app/components/chat.module.scss`: reset list margin, padding, and bullets, and added a bounded suggestion item wrapper so the visual chip layout stays unchanged.
- `test/gemini-visual-migration.test.ts`: locked the empty-state `ul/li/button` structure and suggestion item style hook.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the empty-state suggestions still rendered as a `div` without `li` items.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/`, title `NeatChat`, viewport `1440x1024`, ready state `complete`, no framework overlay; suggestions container rendered as `UL` with `aria-label="建议问题"`, `roleListCount: 1`, `itemCount: 4`, `buttonCount: 4`; buttons measured `110x40`, `149x40`, `136x40`, `110x40`; list measured `left: 550`, `right: 1190`, `top: 403`, `bottom: 443`, `width: 640`, `height: 40`; composer panel measured `left: 490`, `right: 1250`, `top: 450`, `bottom: 512`; `listPanelOverlap: false`, list/panel right overflow `0`, `scrollOverflowPx: 0`; coordinate-clicking `总结这段内容` filled `#chat-input` with `总结这段内容`; no console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, viewport `390x844`, ready state `complete`, no framework overlay; suggestions container rendered as `UL` with `aria-label="建议问题"`, `roleListCount: 1`, `itemCount: 4`, `buttonCount: 4`; list measured `left: 35`, `right: 355`, `top: 411`, `bottom: 487`, `width: 320`, `height: 76`; composer panel measured `left: 10`, `right: 380`, `top: 772`, `bottom: 832`; `listPanelOverlap: false`, list/panel right overflow `0`, `scrollOverflowPx: 0`; coordinate-clicking `总结这段内容` filled `#chat-input` with `总结这段内容`; no console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, viewport `320x740`, ready state `complete`, no framework overlay; suggestions container rendered as `UL` with `aria-label="建议问题"`, `roleListCount: 1`, `itemCount: 4`, `buttonCount: 4`; list measured `left: 16`, `right: 304`, `top: 366`, `bottom: 442`, `width: 288`, `height: 76`; composer panel measured `left: 10`, `right: 310`, `top: 668`, `bottom: 728`; `listPanelOverlap: false`, list/panel right overflow `0`, `scrollOverflowPx: 0`; coordinate-clicking `总结这段内容` filled `#chat-input` with `总结这段内容`; no console warn/error logs.

Screenshot note:

- In-app Browser screenshot capture was attempted after the DOM/interaction pass, but the backend again returned `Timed out running CDP command "Page.captureScreenshot" for tab 2`. This iteration uses Browser DOM, ARIA role, layout rectangle, overflow, click interaction, and console-log evidence.

Known risks:

- Browser QA clicked one representative suggestion in each viewport. The four suggestion labels share the same `applyEmptySuggestion` path, and all four rendered as buttons with stable geometry, but the remaining three labels were not individually clicked.

## Iteration 2026-06-15 composer-tools-toggle-label

Result: passed.

Target flow:

- App loads -> click the composer tools button -> the same button changes from `打开对话工具` to `关闭对话工具`, opens the tools popover, then returns to `打开对话工具` after closing.

Scope:

- `app/components/chat.tsx`: changed the existing composer tools button `aria-label` to follow `showChatActionMenu`, without changing the click handler, popover contents, upload, image generation, settings, or MCP behavior.
- `test/gemini-visual-migration.test.ts`: locked the dynamic tools button label contract while preserving the existing `aria-expanded` and popover checks.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the tools button still had a static `aria-label="打开对话工具"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/`, title `NeatChat`, viewport `1440x1024`, ready state `complete`, meaningful body content present, no framework overlay. Initial tools button `aria-label="打开对话工具"`, `aria-expanded="false"`, measured `44x44` at `left: 490`, `right: 534`, with `buttonInputOverlap: false`, `buttonRightOverflow: 0`, `scrollOverflowPx: 0`. After coordinate-clicking the button, it changed to `aria-label="关闭对话工具"`, `aria-expanded="true"`; popover rendered with `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 490`, `right: 826`, `top: 178`, `bottom: 393`, `width: 336`, `height: 215`; popover right/bottom overflow `0`, popover/input overlap `false`. Clicking the same button again returned `aria-label="打开对话工具"`, `aria-expanded="false"`, and removed the popover. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, viewport `390x844`, ready state `complete`, no framework overlay. Initial tools button `aria-label="打开对话工具"`, `aria-expanded="false"`, measured `42x42` at `left: 19`, `right: 61`, with no input overlap and no horizontal overflow. After opening, the button changed to `aria-label="关闭对话工具"`, `aria-expanded="true"`; popover rendered as `role="dialog"` with `aria-label="对话工具菜单"`, measured `left: 11`, `right: 331`, `top: 632`, `bottom: 767`, `width: 320`, `height: 135`; right/bottom overflow `0`, popover/input overlap `false`. Closing returned the button to `aria-label="打开对话工具"`, `aria-expanded="false"`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, viewport `320x740`, ready state `complete`, no framework overlay. Initial tools button `aria-label="打开对话工具"`, `aria-expanded="false"`, measured `42x42` at `left: 19`, `right: 61`, with no input overlap and no horizontal overflow. After opening, the button changed to `aria-label="关闭对话工具"`, `aria-expanded="true"`; popover rendered as `role="dialog"` with `aria-label="对话工具菜单"`, measured `left: 11`, `right: 283`, `top: 528`, `bottom: 663`, `width: 272`, `height: 135`; right/bottom overflow `0`, popover/input overlap `false`. Closing returned the button to `aria-label="打开对话工具"`, `aria-expanded="false"`. No console warn/error logs.

Known risks:

- Browser role-click intermittently timed out in this local Browser backend, so the interaction proof used DOM-measured button coordinates. The verified state changes are DOM/ARIA state changes from the live app, not inferred from source.

## Iteration 2026-06-15 composer-tools-controls-link

Result: passed.

Target flow:

- App loads -> the composer tools button exposes `aria-controls="chat-input-action-menu"` -> opening the tools menu renders a dialog with the matching `id` -> closing removes that dialog while the button keeps the same controls target.

Scope:

- `app/components/chat.tsx`: linked the composer tools button to the actual tools popover with `aria-controls` and a stable popover `id`, without changing the click handler, popover contents, upload, image generation, settings, or MCP behavior.
- `test/gemini-visual-migration.test.ts`: locked the button-to-popover controls relationship alongside the existing dynamic label and `aria-expanded` contract.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the tools button did not expose `aria-controls="chat-input-action-menu"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: initial tools button existed with `aria-label="打开对话工具"`, `aria-expanded="false"`, `aria-controls="chat-input-action-menu"`, measured `44x44` at `left: 490`, `right: 534`, `top: 460`, `bottom: 504`; popover absent. After coordinate-clicking the button, it changed to `aria-label="关闭对话工具"`, `aria-expanded="true"`, kept `aria-controls="chat-input-action-menu"`; popover rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 490`, `right: 826`, `top: 178`, `bottom: 393`, `width: 336`, `height: 215`; `overflowsViewport: false`, `overlapsInput: false`, `overlapsButton: false`. Closing returned `aria-label="打开对话工具"`, `aria-expanded="false"`, kept the same controls target, and removed the popover. No console warn/error logs.
- Mobile `390x844`: initial tools button existed with `aria-label="打开对话工具"`, `aria-expanded="false"`, `aria-controls="chat-input-action-menu"`, measured `42x42` at `left: 19`, `right: 61`, `top: 781`, `bottom: 823`; popover absent. After opening, it changed to `aria-label="关闭对话工具"`, `aria-expanded="true"`, kept the controls target; popover rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 11`, `right: 331`, `top: 632`, `bottom: 767`, `width: 320`, `height: 135`; no viewport overflow, no input overlap, no button overlap. Closing returned the button to `aria-label="打开对话工具"`, `aria-expanded="false"` and removed the popover. No console warn/error logs.
- Narrow mobile `320x740`: initial tools button existed with `aria-label="打开对话工具"`, `aria-expanded="false"`, `aria-controls="chat-input-action-menu"`, measured `42x42` at `left: 19`, `right: 61`, `top: 677`, `bottom: 719`; popover absent. After opening, it changed to `aria-label="关闭对话工具"`, `aria-expanded="true"`, kept the controls target; popover rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 11`, `right: 283`, `top: 528`, `bottom: 663`, `width: 272`, `height: 135`; no viewport overflow, no input overlap, no button overlap. Closing returned the button to `aria-label="打开对话工具"`, `aria-expanded="false"` and removed the popover. No console warn/error logs.

Known risks:

- Browser role-click timed out again in this local Browser backend, so the interaction proof used DOM-measured button coordinates. The verified state changes are live DOM/ARIA state changes from the running app.

## Iteration 2026-06-15 composer-tools-escape-close

Result: passed.

Target flow:

- App loads -> click the composer tools button -> the tools popover opens -> pressing Escape closes the popover and returns the button to collapsed state.

Scope:

- `app/components/chat.tsx`: added an Escape-key listener only while the composer tools popover is open, closing the existing popover via `setShowChatActionMenu(false)`.
- `test/gemini-visual-migration.test.ts`: locked the Escape close contract without changing tool item behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because there was no Escape listener closing the tools menu.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`, body content present, no framework overlay. Initial tools button `aria-label="打开对话工具"`, `aria-expanded="false"`, `aria-controls="chat-input-action-menu"`, measured `44x44` at `left: 490`, `right: 534`, `top: 460`, `bottom: 504`, popover absent, `scrollOverflowPx: 0`. After coordinate-clicking the button, it changed to `aria-label="关闭对话工具"`, `aria-expanded="true"`; popover rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 490`, `right: 826`, `top: 178`, `bottom: 393`, `width: 336`, `height: 215`; no viewport overflow, no input overlap, no button overlap. Pressing Escape removed the popover and returned the button to `aria-label="打开对话工具"`, `aria-expanded="false"` while preserving `aria-controls`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`, body content present, no framework overlay. Initial tools button `aria-label="打开对话工具"`, `aria-expanded="false"`, `aria-controls="chat-input-action-menu"`, measured `42x42` at `left: 19`, `right: 61`, `top: 781`, `bottom: 823`, popover absent, `scrollOverflowPx: 0`. After opening, popover rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 11`, `right: 331`, `top: 632`, `bottom: 767`, `width: 320`, `height: 135`; no viewport overflow, no input overlap, no button overlap. Pressing Escape removed the popover and returned the button to `aria-label="打开对话工具"`, `aria-expanded="false"`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`, body content present, no framework overlay. Initial tools button `aria-label="打开对话工具"`, `aria-expanded="false"`, `aria-controls="chat-input-action-menu"`, measured `42x42` at `left: 19`, `right: 61`, `top: 677`, `bottom: 719`, popover absent, `scrollOverflowPx: 0`. After opening, popover rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 11`, `right: 283`, `top: 528`, `bottom: 663`, `width: 272`, `height: 135`; no viewport overflow, no input overlap, no button overlap. Pressing Escape removed the popover and returned the button to `aria-label="打开对话工具"`, `aria-expanded="false"`. No console warn/error logs.

Known risks:

- Browser role-click remains flaky in this local Browser backend, so opening the menu used DOM-measured button coordinates. Escape itself was verified through a real Browser keypress and live DOM/ARIA state after the key event.

## Iteration 2026-06-15 composer-tools-focus-return

Result: passed.

Target flow:

- App loads -> click the composer tools button -> the tools popover opens -> pressing Escape closes the popover and returns keyboard focus to the tools button.

Scope:

- `app/components/chat.tsx`: added a ref to the composer tools button and restored focus to it after Escape closes the tools popover.
- `test/gemini-visual-migration.test.ts`: locked the tools button ref and focus-return contract.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because there was no tools button ref or focus return after Escape.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`, body content present, no framework overlay. Initial active element was the textarea; tools button had `aria-label="打开对话工具"`, `aria-expanded="false"`, `aria-controls="chat-input-action-menu"`, measured `44x44` at `left: 490`, `right: 534`, `top: 460`, `bottom: 504`, popover absent, `scrollOverflowPx: 0`. After coordinate-clicking the button, active element was the tools button with `aria-label="关闭对话工具"` and `aria-expanded="true"`; popover rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 490`, `right: 826`, `top: 178`, `bottom: 393`, `width: 336`, `height: 215`; no viewport overflow, no input overlap, no button overlap. Pressing Escape removed the popover, returned the button to `aria-label="打开对话工具"`, `aria-expanded="false"`, and `document.activeElement` was the same tools button with `aria-controls="chat-input-action-menu"`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`, body content present, no framework overlay. Initial tools button had `aria-label="打开对话工具"`, `aria-expanded="false"`, `aria-controls="chat-input-action-menu"`, measured `42x42` at `left: 19`, `right: 61`, `top: 781`, `bottom: 823`, popover absent, `scrollOverflowPx: 0`. After opening, active element was the tools button with `aria-label="关闭对话工具"`; popover rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 11`, `right: 331`, `top: 632`, `bottom: 767`, `width: 320`, `height: 135`; no viewport overflow, no input overlap, no button overlap. Pressing Escape removed the popover and returned `document.activeElement` to the tools button with `aria-label="打开对话工具"` and `aria-expanded="false"`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`, body content present, no framework overlay. Initial tools button had `aria-label="打开对话工具"`, `aria-expanded="false"`, `aria-controls="chat-input-action-menu"`, measured `42x42` at `left: 19`, `right: 61`, `top: 677`, `bottom: 719`, popover absent, `scrollOverflowPx: 0`. After opening, active element was the tools button with `aria-label="关闭对话工具"`; popover rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 11`, `right: 283`, `top: 528`, `bottom: 663`, `width: 272`, `height: 135`; no viewport overflow, no input overlap, no button overlap. Pressing Escape removed the popover and returned `document.activeElement` to the tools button with `aria-label="打开对话工具"` and `aria-expanded="false"`. No console warn/error logs.

Known risks:

- Browser role-click remains flaky in this local Browser backend, so opening the menu used DOM-measured button coordinates. Focus return itself was verified through a real Browser Escape keypress and live `document.activeElement` state after the key event.

## Iteration 2026-06-15 model-menu-controls-link

Result: passed.

Target flow:

- App loads -> the top model selector exposes `aria-controls="chat-model-menu"` -> opening the selector renders a dialog with the matching `id` -> closing removes the dialog while the selector keeps the same controls target.

Scope:

- `app/components/chat.tsx`: linked both compact and desktop model selector buttons to the actual model menu with `aria-controls` and a stable menu `id`, without changing model selection, reasoning controls, image size/quality controls, MCP/Jimeng, or message behavior.
- `test/gemini-visual-migration.test.ts`: locked the model selector-to-menu controls relationship alongside the existing `aria-expanded` and dialog semantics.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the model selector did not expose `aria-controls="chat-model-menu"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`. Initial model selector existed with `aria-label="选择模型和参数"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `147x34` at `left: 397`, `right: 544`, `top: 14`, `bottom: 48`; menu absent; no horizontal overflow. Opening changed the selector to `aria-expanded="true"` and rendered `id="chat-model-menu"`, `role="dialog"`, `aria-label="模型和思考等级"`, measured `left: 318`, `right: 698`, `top: 54`, `bottom: 277`, `width: 380`, `height: 223`; no composer overlap and no horizontal overflow. Closing returned `aria-expanded="false"` and removed the menu. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`. Initial model selector existed with `aria-label="选择模型"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `79x17` at `left: 156`, `right: 234`, `top: 26`, `bottom: 42`; menu absent; no horizontal overflow. Opening changed the selector to `aria-expanded="true"` and rendered `id="chat-model-menu"`, `role="dialog"`, `aria-label="模型和思考等级"`, measured `left: 35`, `right: 355`, `top: 46`, `bottom: 273`, `width: 320`, `height: 227`; no composer overlap and no horizontal overflow. Closing returned `aria-expanded="false"` and removed the menu. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`. Initial model selector existed with `aria-label="选择模型"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `79x17` at `left: 121`, `right: 199`, `top: 26`, `bottom: 42`; menu absent; no horizontal overflow. Opening changed the selector to `aria-expanded="true"` and rendered `id="chat-model-menu"`, `role="dialog"`, `aria-label="模型和思考等级"`, measured `left: 24`, `right: 296`, `top: 46`, `bottom: 273`, `width: 272`, `height: 227`; no composer overlap and no horizontal overflow. Closing returned `aria-expanded="false"` and removed the menu. No console warn/error logs.

Known risks:

- The first Browser QA pass started before the hot-reloaded page exposed the new attributes, so it was discarded. The final evidence above waited for the live selector before each viewport check and verified the running DOM/ARIA state directly.

## Iteration 2026-06-15 model-menu-escape-close

Result: passed.

Target flow:

- App loads -> click the top model selector -> the model menu opens -> pressing Escape closes the model menu and returns the selector to collapsed state.

Scope:

- `app/components/chat.tsx`: added an Escape-key listener only while the model menu is open, closing the existing model menu through `closeMobileModelSelector`.
- `test/gemini-visual-migration.test.ts`: locked the model menu Escape close contract without changing model selection, reasoning controls, image size/quality controls, MCP/Jimeng, or message behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because there was no Escape listener closing the model menu.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`. Initial model selector existed with `aria-label="选择模型和参数"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `147x34` at `left: 394`, `right: 541`, `top: 14`, `bottom: 48`; menu absent, `scrollOverflowPx: 0`. Opening changed the selector to `aria-expanded="true"` and rendered `id="chat-model-menu"`, `role="dialog"`, `aria-label="模型和思考等级"`, measured `left: 318`, `right: 698`, `top: 54`, `bottom: 277`, `width: 380`, `height: 223`; no composer overlap and no horizontal overflow. Pressing Escape removed the menu and returned the selector to `aria-expanded="false"` while preserving `aria-controls="chat-model-menu"`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`. Initial model selector existed with `aria-label="选择模型"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `79x17` at `left: 156`, `right: 234`, `top: 26`, `bottom: 42`; menu absent, `scrollOverflowPx: 0`. Opening changed the selector to `aria-expanded="true"` and rendered `id="chat-model-menu"`, `role="dialog"`, `aria-label="模型和思考等级"`, measured `left: 35`, `right: 355`, `top: 46`, `bottom: 273`, `width: 320`, `height: 227`; no composer overlap and no horizontal overflow. Pressing Escape removed the menu and returned the selector to `aria-expanded="false"`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`. Initial model selector existed with `aria-label="选择模型"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `79x17` at `left: 121`, `right: 199`, `top: 26`, `bottom: 42`; menu absent, `scrollOverflowPx: 0`. Opening changed the selector to `aria-expanded="true"` and rendered `id="chat-model-menu"`, `role="dialog"`, `aria-label="模型和思考等级"`, measured `left: 24`, `right: 296`, `top: 46`, `bottom: 273`, `width: 272`, `height: 227`; no composer overlap and no horizontal overflow. Pressing Escape removed the menu and returned the selector to `aria-expanded="false"`. No console warn/error logs.

Known risks:

- This iteration intentionally covers close-on-Escape only. Returning focus after Escape is left as a separate follow-up slice so this commit does not mix behavior contracts.

## Iteration 2026-06-15 model-menu-focus-return

Result: passed.

Target flow:

- App loads -> click the top model selector -> the model menu opens -> pressing Escape closes the model menu and returns keyboard focus to the model selector.

Scope:

- `app/components/chat.tsx`: added a ref to the top model selector button and restored focus to it after Escape closes the model menu.
- `test/gemini-visual-migration.test.ts`: locked the model selector ref and focus-return contract without changing model selection, reasoning controls, image size/quality controls, MCP/Jimeng, or message behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because there was no model selector ref or focus return after Escape.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`. Initial model selector existed with `aria-label="选择模型和参数"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `147x34` at `left: 394`, `right: 541`, `top: 14`, `bottom: 48`; menu absent, `scrollOverflowPx: 0`. Opening changed the selector to `aria-expanded="true"` and `document.activeElement` was the model selector; menu rendered as `id="chat-model-menu"`, `role="dialog"`, `aria-label="模型和思考等级"`, measured `left: 318`, `right: 698`, `top: 54`, `bottom: 277`, `width: 380`, `height: 223`; no composer overlap and no horizontal overflow. Pressing Escape removed the menu, returned `aria-expanded="false"`, and `document.activeElement` remained the model selector with `aria-controls="chat-model-menu"`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`. Initial model selector existed with `aria-label="选择模型"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `79x17` at `left: 156`, `right: 234`, `top: 26`, `bottom: 42`; menu absent, `scrollOverflowPx: 0`. Opening changed the selector to `aria-expanded="true"` and `document.activeElement` was the model selector; menu rendered as `id="chat-model-menu"`, `role="dialog"`, `aria-label="模型和思考等级"`, measured `left: 35`, `right: 355`, `top: 46`, `bottom: 273`, `width: 320`, `height: 227`; no composer overlap and no horizontal overflow. Pressing Escape removed the menu, returned `aria-expanded="false"`, and `document.activeElement` remained the model selector. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`. Initial model selector existed with `aria-label="选择模型"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `79x17` at `left: 121`, `right: 199`, `top: 26`, `bottom: 42`; menu absent, `scrollOverflowPx: 0`. Opening changed the selector to `aria-expanded="true"` and `document.activeElement` was the model selector; menu rendered as `id="chat-model-menu"`, `role="dialog"`, `aria-label="模型和思考等级"`, measured `left: 24`, `right: 296`, `top: 46`, `bottom: 273`, `width: 272`, `height: 227`; no composer overlap and no horizontal overflow. Pressing Escape removed the menu, returned `aria-expanded="false"`, and `document.activeElement` remained the model selector. No console warn/error logs.

Known risks:

- This iteration intentionally covers focus return after Escape only. Menu-internal arrow-key navigation remains a separate future slice.

## Iteration 2026-06-15 model-menu-modal-semantics

Result: passed.

Target flow:

- App loads -> click the top model selector -> the model menu opens as a modal dialog with a matching backdrop -> closing removes the dialog and backdrop.

Scope:

- `app/components/chat.tsx`: added `aria-modal="true"` to the existing model menu dialog.
- `test/gemini-visual-migration.test.ts`: locked `aria-modal="true"` specifically on `id="chat-model-menu"` without changing model selection, reasoning controls, image size/quality controls, MCP/Jimeng, or message behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` first passed with an overly broad assertion because another dialog already had `aria-modal`; the test was corrected to target `id="chat-model-menu"` and then failed as expected.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`. Initial model selector existed with `aria-label="选择模型和参数"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `147x34` at `left: 394`, `right: 541`, `top: 14`, `bottom: 48`; menu and backdrop absent, `scrollOverflowPx: 0`. Opening changed the selector to `aria-expanded="true"` and rendered a visible backdrop plus `id="chat-model-menu"`, `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, measured `left: 318`, `right: 698`, `top: 54`, `bottom: 277`, `width: 380`, `height: 223`; no composer overlap and no horizontal overflow. Escape closing removed both dialog and backdrop, returned `aria-expanded="false"`, and preserved the controls target. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`. Initial model selector existed with `aria-label="选择模型"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `79x17` at `left: 156`, `right: 234`, `top: 26`, `bottom: 42`; menu and backdrop absent, `scrollOverflowPx: 0`. Opening changed the selector to `aria-expanded="true"` and rendered a visible backdrop plus `id="chat-model-menu"`, `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, measured `left: 35`, `right: 355`, `top: 46`, `bottom: 273`, `width: 320`, `height: 227`; no composer overlap and no horizontal overflow. Escape closing removed both dialog and backdrop and returned `aria-expanded="false"`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`. Initial model selector existed with `aria-label="选择模型"`, `aria-expanded="false"`, `aria-controls="chat-model-menu"`, measured `79x17` at `left: 121`, `right: 199`, `top: 26`, `bottom: 42`; menu and backdrop absent, `scrollOverflowPx: 0`. Opening changed the selector to `aria-expanded="true"` and rendered a visible backdrop plus `id="chat-model-menu"`, `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, measured `left: 24`, `right: 296`, `top: 46`, `bottom: 273`, `width: 272`, `height: 227`; no composer overlap and no horizontal overflow. Escape closing removed both dialog and backdrop and returned `aria-expanded="false"`. No console warn/error logs.

Known risks:

- This iteration only declares modal dialog semantics for the existing model menu. It does not add menu-internal arrow-key navigation.

## Iteration 2026-06-15 sidebar-recent-list-current-state

Result: passed.

Target flow:

- App loads -> sidebar shows recent chats -> selecting a chat marks the current item with readable list semantics and a visible left accent.

Scope:

- `app/components/chat-list.tsx`: added `role="list"` / `role="listitem"`, a recent-chat `aria-label`, current chat `aria-current="page"`, and readable per-chat link labels. Props are applied after drag-and-drop library props so the runtime DOM keeps the semantics.
- `app/components/home.module.scss`: added a 3px selected-chat accent bar without changing drag, delete, or session selection behavior.
- `test/gemini-visual-migration.test.ts`: locked the list semantics, attribute order after drag-and-drop props, and selected accent styling.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the sidebar recent list did not expose `role="list"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`. After selecting the visible session `浏览器相关, 2 条对话`, sidebar measured `left: 0`, `right: 300`, `width: 300`, `height: 1024`; recent list rendered as `role="list"`, `aria-label="最近聊天"`, `itemCount: 5`, measured `left: 12`, `right: 287`, `top: 428`, `bottom: 718`, `width: 275`, `height: 291`; current item rendered as `role="listitem"`, `aria-current="page"`, link label `浏览器相关, 2 条对话`, title `浏览器相关\n2 条对话`, measured `left: 12`, `right: 287`, `top: 428`, `bottom: 484`, `width: 275`, `height: 57`; selected accent pseudo-element rendered with `width: 3px`, `height: 40.5px`, `left: 0px`, `background: rgb(49, 94, 248)`. `scrollOverflowPx: 0`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/`, title `NeatChat`, actual viewport `390x844`. Opening the mobile sidebar produced class `home_sidebar-show`, sidebar measured `left: 0`, `right: 304`, `width: 304`, `height: 844`; recent list rendered as `role="list"`, `aria-label="最近聊天"`, `itemCount: 5`, measured `left: 12`, `right: 291`, `top: 464`, `bottom: 668`, `width: 279`, `height: 204`; current item rendered as `aria-current="page"`, link label `浏览器相关, 2 条对话`, measured `left: 32`, `right: 271`, `top: 464`, `bottom: 500`, `width: 239`, `height: 36`; selected accent pseudo-element rendered with `width: 3px`, `height: 20px`, `left: 0px`, `background: rgb(49, 94, 248)`. `scrollOverflowPx: 0`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/`, title `NeatChat`, actual viewport `320x740`. Opening the mobile sidebar produced class `home_sidebar-show`, sidebar measured `left: 0`, `right: 266`, `width: 266`, `height: 740`; recent list rendered as `role="list"`, `aria-label="最近聊天"`, `itemCount: 5`, measured `left: 12`, `right: 253`, `top: 464`, `bottom: 668`, `width: 241`, `height: 204`; current item rendered as `aria-current="page"`, link label `浏览器相关, 2 条对话`, measured `left: 32`, `right: 233`, `top: 464`, `bottom: 500`, `width: 201`, `height: 36`; selected accent pseudo-element rendered with `width: 3px`, `height: 20px`, `left: 0px`, `background: rgb(49, 94, 248)`. `scrollOverflowPx: 0`. No console warn/error logs.

Known risks:

- This iteration does not change drag sorting, delete confirmation, session persistence, or mobile drawer routing. It only improves the visible selected state and accessible structure of the existing recent-chat list.

## Iteration 2026-06-15 reading-surface-message-list

Result: passed.

Target flow:

- App loads -> selecting an existing chat shows the conversation as a readable message list -> each visible message has a stable list item label and width protection against long content.

Scope:

- `app/components/chat.tsx`: added `role="list"` / `aria-label="会话消息列表"` to the reading surface and `role="listitem"`, readable per-message labels, and `aria-busy` for streaming/preview messages on message rows.
- `app/components/chat.module.scss`: added `min-width: 0` to message containers and `overflow-wrap: anywhere` to message content blocks.
- `test/gemini-visual-migration.test.ts`: locked the reading surface semantics, message row labels/busy state, and width-protection CSS.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the reading surface did not expose `role="list"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`. After selecting the visible session `浏览器相关, 2 条对话`, chat body rendered with `aria-label="聊天消息"` and measured `left: 300`, `right: 1440`, `top: 62`, `bottom: 1024`, `width: 1140`, `height: 962`; reading surface rendered as `role="list"`, `aria-label="会话消息列表"`, `itemCount: 3`, measured `left: 410`, `right: 1330`, `top: 96`, `bottom: 1014`, `width: 920`, `height: 918`; first message row rendered as `role="listitem"`, `aria-label="助手消息 1"`, `aria-busy: null`, measured `left: 410`, `right: 1330`, `width: 920`; first message container had `minWidth: 0px`, `maxWidth: 100%`, `width: 760`; first message item had `overflowWrap: anywhere`, `wordBreak: break-word`, `maxWidth: 100%`; message action regions present (`messageActionsVisibleCount: 2`); `pageOverflowPx: 0`, `bodyOverflowPx: 0`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`. Chat body rendered with `aria-label="聊天消息"` and measured `left: 0`, `right: 390`, `top: 68`, `bottom: 844`, `width: 390`, `height: 776`; reading surface rendered as `role="list"`, `aria-label="会话消息列表"`, `itemCount: 3`, measured `left: 32`, `right: 358`, `top: 96`, `bottom: 1056`, `width: 326`, `height: 960`; first message row rendered as `role="listitem"`, `aria-label="助手消息 1"`, `aria-busy: null`, measured `left: 32`, `right: 358`, `width: 326`; first message container had `minWidth: 0px`, `maxWidth: 100%`, `width: 326`; first message item had `overflowWrap: anywhere`, `wordBreak: break-word`, `maxWidth: 100%`; message action regions present (`messageActionsVisibleCount: 2`); `pageOverflowPx: 0`, `bodyOverflowPx: 0`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`. Chat body rendered with `aria-label="聊天消息"` and measured `left: 0`, `right: 320`, `top: 68`, `bottom: 740`, `width: 320`, `height: 672`; reading surface rendered as `role="list"`, `aria-label="会话消息列表"`, `itemCount: 3`, measured `left: 32`, `right: 288`, `top: 96`, `bottom: 1098`, `width: 256`, `height: 1002`; first message row rendered as `role="listitem"`, `aria-label="助手消息 1"`, `aria-busy: null`, measured `left: 32`, `right: 288`, `width: 256`; first message container had `minWidth: 0px`, `maxWidth: 100%`, `width: 256`; first message item had `overflowWrap: anywhere`, `wordBreak: break-word`, `maxWidth: 100%`; message action regions present (`messageActionsVisibleCount: 2`); `pageOverflowPx: 0`, `bodyOverflowPx: 0`. No console warn/error logs.

Known risks:

- This iteration does not change message rendering, Markdown behavior, retry/delete/pin/copy actions, TTS, image rendering, or auto-scroll. It only strengthens the reading surface structure and width stability.

## Iteration 2026-06-15 multimodal-menu-primary-heading

Result: passed.

Target flow:

- App loads -> open the composer tool menu -> the primary multimodal section clearly labels file and image entry points before the upload and image generation buttons.

Scope:

- `app/components/chat.tsx`: added a compact primary section heading inside the existing `多模态工具` group: `添加内容` plus `文件和图片`.
- `app/components/chat.module.scss`: added a full-width heading row with compact title/subtitle text treatment and overflow protection.
- `test/gemini-visual-migration.test.ts`: locked the heading DOM and heading styles while preserving existing upload, image generation, MCP/Jimeng, prompt hints, session tools, and settings contracts.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the multimodal section heading was missing.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`. Opening the composer tool menu rendered `id="chat-input-action-menu"`, `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 490`, `right: 826`, `top: 156`, `bottom: 393`, `width: 336`, `height: 237`; multimodal group rendered with `aria-label="多模态工具"`, measured `left: 501`, `right: 823`, `top: 167`, `bottom: 277`, `width: 322`, text `添加内容文件和图片上传附件图片生成`; heading title `添加内容` visible at `left: 513`, `right: 565`, `width: 52`; subtitle `文件和图片` visible at `left: 751`, `right: 811`, `width: 60`; upload button visible at `left: 505`, `right: 819`, `width: 314`; image generation button visible with `aria-pressed="false"` at `left: 505`, `right: 819`, `width: 314`; `pageOverflowPx: 0`, `menuOverflowPx: 0`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`. Opening the composer tool menu rendered `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 11`, `right: 331`, `top: 609`, `bottom: 767`, `width: 320`, `height: 158`; multimodal group rendered with `aria-label="多模态工具"`, measured `left: 24`, `right: 326`, `top: 622`, `bottom: 750`, `width: 302`; heading title `添加内容` visible at `left: 36`, `right: 88`, `width: 52`; subtitle `文件和图片` visible at `left: 254`, `right: 314`, `width: 60`; upload button visible at `left: 28`, `right: 322`, `width: 294`; image generation button visible with `aria-pressed="false"` at `left: 28`, `right: 322`, `width: 294`; `pageOverflowPx: 0`, `menuOverflowPx: 0`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`. Opening the composer tool menu rendered `role="dialog"`, `aria-label="对话工具菜单"`, measured `left: 11`, `right: 283`, `top: 505`, `bottom: 663`, `width: 272`, `height: 158`; multimodal group rendered with `aria-label="多模态工具"`, measured `left: 24`, `right: 278`, `top: 518`, `bottom: 646`, `width: 254`; heading title `添加内容` visible at `left: 36`, `right: 88`, `width: 52`; subtitle `文件和图片` visible at `left: 206`, `right: 266`, `width: 60`; upload button visible at `left: 28`, `right: 274`, `width: 246`; image generation button visible with `aria-pressed="false"` at `left: 28`, `right: 274`, `width: 246`; `pageOverflowPx: 0`, `menuOverflowPx: 0`. No console warn/error logs.

Known risks:

- This iteration only clarifies the primary multimodal tool group. It does not change upload handling, image generation activation, MCP/Jimeng checks, prompt hints, session tools, settings, or model behavior.

## Iteration 2026-06-15 composer-focus-shell

Result: passed.

Target flow:

- App loads -> focus the composer textarea -> prompt bar keeps focus in the input shell and left tool button receives matching focus feedback.

Scope:

- `app/components/chat.module.scss`: added `box-sizing: border-box` and border-color transition to the composer menu button, plus focus-within shell styling for the base, empty, collapsed, and dark-mode composer states.
- `test/gemini-visual-migration.test.ts`: locked the base focus shell and the higher-specificity empty composer focus rule.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the base focus shell rule was missing.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` later failed again as expected after Browser QA exposed the empty composer first-load specificity gap.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, actual viewport `1440x1024`. Focused textarea produced `activeElement: TEXTAREA#chat-input`, `focusWithinPanel: true`, `focusStyleApplied: true`; composer panel measured `left: 490`, `right: 1250`, `width: 760`, `height: 62`; menu button measured `left: 490`, `right: 534`, `width: 44`, `height: 44`, `borderColor: rgba(49, 94, 248, 0.28)`, `boxShadow: rgba(60, 64, 67, 0.12) 0px 2px 14px 0px, rgba(49, 94, 248, 0.08) 0px 0px 0px 3px`; send button measured `left: 1199`, `right: 1241`, `width: 42`, `height: 42`; input, menu button, panel, row, and send button all fit within viewport; `horizontalOverflowPx: 0`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, actual viewport `390x844`. Focused textarea produced `activeElement: TEXTAREA#chat-input`, `focusWithinPanel: true`, `focusStyleApplied: true`; composer panel measured `left: 10`, `right: 380`, `width: 370`, `height: 60`; row measured `left: 10`, `right: 380`, `borderColor: rgba(49, 94, 248, 0.22)`, `boxShadow: rgba(60, 64, 67, 0.16) 0px 8px 34px 0px, rgba(49, 94, 248, 0.1) 0px 0px 0px 3px`; menu button measured `left: 19`, `right: 61`, `width: 42`, `height: 42`, `borderColor: rgba(49, 94, 248, 0.28)`, `boxShadow: rgba(60, 64, 67, 0.12) 0px 2px 14px 0px, rgba(49, 94, 248, 0.08) 0px 0px 0px 3px`; send button measured `left: 331`, `right: 371`, `width: 40`, `height: 40`; all core controls fit within viewport; `horizontalOverflowPx: 0`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, actual viewport `320x740`. Focused textarea produced `activeElement: TEXTAREA#chat-input`, `focusWithinPanel: true`, `focusStyleApplied: true`; composer panel measured `left: 10`, `right: 310`, `width: 300`, `height: 60`; row measured `left: 10`, `right: 310`, `borderColor: rgba(49, 94, 248, 0.22)`, `boxShadow: rgba(60, 64, 67, 0.16) 0px 8px 34px 0px, rgba(49, 94, 248, 0.1) 0px 0px 0px 3px`; menu button measured `left: 19`, `right: 61`, `width: 42`, `height: 42`, `borderColor: rgba(49, 94, 248, 0.28)`, `boxShadow: rgba(60, 64, 67, 0.12) 0px 2px 14px 0px, rgba(49, 94, 248, 0.08) 0px 0px 0px 3px`; send button measured `left: 261`, `right: 301`, `width: 40`, `height: 40`; all core controls fit within viewport; `horizontalOverflowPx: 0`. No console warn/error logs.

Known risks:

- This iteration only strengthens composer focus feedback. It does not change input handling, sending, tool menu actions, upload, image generation, MCP/Jimeng, settings, model selection, attachments, or message rendering.

## Iteration 2026-06-15 composer-tools-modal-semantics

Result: passed.

Target flow:

- App loads -> open the composer tool menu -> the tool menu dialog exposes modal semantics while preserving the existing button state, backdrop, menu contents, and responsive placement.

Scope:

- `app/components/chat.tsx`: added `aria-modal="true"` to the existing `id="chat-input-action-menu"` dialog.
- `test/gemini-visual-migration.test.ts`: locked `aria-modal="true"` specifically on the composer tool menu without changing tool actions, upload, image generation, MCP/Jimeng, prompt hints, settings, model behavior, attachments, or messages.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `chat-input-action-menu` did not expose `aria-modal="true"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, actual viewport `1440x1024`. Initial tools button existed with `aria-label="打开对话工具"`, `aria-expanded="false"`, measured `44x44` at `left: 490`, `right: 534`, `top: 460.08`, `bottom: 504.08`. After opening, the button changed to `aria-label="关闭对话工具"`, `aria-expanded="true"`, `aria-controls="chat-input-action-menu"`; backdrop existed with `aria-label="关闭对话工具"` and covered the viewport; menu rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-modal="true"`, `aria-label="对话工具菜单"`, measured `left: 490`, `right: 826`, `top: 156.48`, `bottom: 393.08`, `width: 336`, `height: 236.59`; text included `添加内容文件和图片上传附件图片生成对话设置gpt-5.4`; `menuOverflowsViewport: false`, `pageOverflowPx: 0`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, actual viewport `390x844`. Initial tools button existed with `aria-label="打开对话工具"`, `aria-expanded="false"`, measured `42x42` at `left: 19`, `right: 61`, `top: 781`, `bottom: 823`. After opening, the button changed to `aria-label="关闭对话工具"`, `aria-expanded="true"`, `aria-controls="chat-input-action-menu"`; backdrop existed with `aria-label="关闭对话工具"` and covered the viewport; menu rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-modal="true"`, `aria-label="对话工具菜单"`, measured `left: 11`, `right: 331`, `top: 609.41`, `bottom: 767`, `width: 320`, `height: 157.59`; text included `添加内容文件和图片上传附件图片生成`; `menuOverflowsViewport: false`, `pageOverflowPx: 0`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, actual viewport `320x740`. Initial tools button existed with `aria-label="打开对话工具"`, `aria-expanded="false"`, measured `42x42` at `left: 19`, `right: 61`, `top: 677`, `bottom: 719`. After opening, the button changed to `aria-label="关闭对话工具"`, `aria-expanded="true"`, `aria-controls="chat-input-action-menu"`; backdrop existed with `aria-label="关闭对话工具"` and covered the viewport; menu rendered as `id="chat-input-action-menu"`, `role="dialog"`, `aria-modal="true"`, `aria-label="对话工具菜单"`, measured `left: 11`, `right: 283`, `top: 505.41`, `bottom: 663`, `width: 272`, `height: 157.59`; text included `添加内容文件和图片上传附件图片生成`; `menuOverflowsViewport: false`, `pageOverflowPx: 0`. No console warn/error logs.

Known risks:

- This iteration only declares modal semantics for the existing composer tool menu. It does not change tool item order, click handlers, Escape handling, focus return, upload, image generation, MCP/Jimeng, prompt hints, settings, model behavior, attachments, or messages.

## Iteration 2026-06-15 composer-tools-backdrop-focus

Result: passed.

Target flow:

- App loads -> open the composer tool menu -> click the backdrop -> the menu closes and focus returns to the composer tool button.

Scope:

- `app/components/chat.tsx`: changed the existing composer tool-menu backdrop click handler so it closes the menu and restores focus to the tool button on the next animation frame.
- `test/gemini-visual-migration.test.ts`: locked the backdrop close path so it keeps the same focus-return behavior as the Escape close path.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the backdrop close path only called `setShowChatActionMenu(false)` and did not restore focus.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`. Initial tools button existed with `aria-label="打开对话工具"`, `aria-controls="chat-input-action-menu"`, `aria-expanded="false"`, measured `44x44` at `left: 490`, `right: 534`, `top: 460.08`, `bottom: 504.08`; menu and backdrop absent, `pageOverflowPx: 0`. Opening changed the button to `aria-label="关闭对话工具"`, `aria-expanded="true"` and rendered a full-viewport backdrop with `aria-label="关闭对话工具"` plus `id="chat-input-action-menu"`, `role="dialog"`, `aria-modal="true"`, `aria-label="对话工具菜单"`, measured `left: 490`, `right: 826`, `top: 156.48`, `bottom: 393.08`, `width: 336`, `height: 236.59`; menu did not overflow the viewport. Clicking the backdrop removed the menu and backdrop, returned `aria-expanded="false"`, and set `activeElement` to the tools button with `aria-controls="chat-input-action-menu"`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`. Initial tools button existed with `aria-label="打开对话工具"`, `aria-controls="chat-input-action-menu"`, `aria-expanded="false"`, measured `42x42` at `left: 19`, `right: 61`, `top: 781`, `bottom: 823`; menu and backdrop absent, `pageOverflowPx: 0`. Opening changed the button to `aria-label="关闭对话工具"`, `aria-expanded="true"` and rendered a full-viewport backdrop plus dialog measured `left: 11`, `right: 331`, `top: 609.41`, `bottom: 767`, `width: 320`, `height: 157.59`; menu did not overflow the viewport. Clicking the backdrop removed the menu and backdrop, returned `aria-expanded="false"`, and set `activeElement` to the tools button. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`. Initial tools button existed with `aria-label="打开对话工具"`, `aria-controls="chat-input-action-menu"`, `aria-expanded="false"`, measured `42x42` at `left: 19`, `right: 61`, `top: 677`, `bottom: 719`; menu and backdrop absent, `pageOverflowPx: 0`. Opening changed the button to `aria-label="关闭对话工具"`, `aria-expanded="true"` and rendered a full-viewport backdrop plus dialog measured `left: 11`, `right: 283`, `top: 505.41`, `bottom: 663`, `width: 272`, `height: 157.59`; menu did not overflow the viewport. Clicking the backdrop removed the menu and backdrop, returned `aria-expanded="false"`, and set `activeElement` to the tools button. No console warn/error logs.

Known risks:

- This iteration only changes the backdrop close focus return for the existing composer tool menu. It does not change tool ordering, upload handling, image generation activation, MCP/Jimeng checks, prompt hints, settings, model behavior, attachments, or messages.

## Iteration 2026-06-16 composer-status-live-region

Result: passed.

Target flow:

- App loads -> composer prompt bar renders input mode status -> the status row exposes live-region semantics without changing visible model, image generation, attachment, or send behavior.

Scope:

- `app/components/chat.tsx`: added `role="status"`, `aria-live="polite"`, and `aria-atomic="true"` to the existing composer input status row.
- `app/components/chat.module.scss`: changed mobile collapsed status-row treatment from `display: none` to a 1px clipped live region so the state remains available without changing visible compact layout.
- `test/gemini-visual-migration.test.ts`: locked the status-row live semantics and the mobile collapsed CSS contract; also made the existing backdrop focus-return assertion formatting-tolerant.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the status row lacked `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`.
- A second RED check failed as expected because mobile collapsed CSS still used `display: none` for `.chat-input-status-row`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`. Prompt bar rendered at `left: 490`, `right: 1250`, `top: 450.08`, `bottom: 512.08`, `width: 760`, `height: 62`; status row existed with `role="status"`, `aria-live="polite"`, `aria-atomic="true"`, `aria-label="当前输入模式"`, text `标准⌄`, measured `left: 1109.17`, `right: 1191`, `top: 470.08`, `bottom: 500.08`, `width: 81.83`, `height: 30`; it did not overlap the send button, and the tools button plus textarea remained visible. `pageOverflowPx: 0`, `bodyOverflowPx: 0`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`. Prompt bar rendered at `left: 10`, `right: 380`, `top: 772`, `bottom: 832`, `width: 370`, `height: 60`; status row existed with `role="status"`, `aria-live="polite"`, `aria-atomic="true"`, `aria-label="当前输入模式"`, text `标准⌄`, and was visually clipped to `1x1` at `left: 316`, `right: 317`, `top: 820`, `bottom: 821`, preserving mobile compact layout. Tools button, textarea, and send button remained visible; `pageOverflowPx: 0`, `bodyOverflowPx: 0`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`. Prompt bar rendered at `left: 10`, `right: 310`, `top: 668`, `bottom: 728`, `width: 300`, `height: 60`; status row existed with `role="status"`, `aria-live="polite"`, `aria-atomic="true"`, `aria-label="当前输入模式"`, text `标准⌄`, and was visually clipped to `1x1` at `left: 246`, `right: 247`, `top: 716`, `bottom: 717`. Tools button, textarea, and send button remained visible; `pageOverflowPx: 0`, `bodyOverflowPx: 0`. No console warn/error logs.

Known risks:

- This iteration only strengthens status-row accessibility. It does not change model selection, reasoning selection, image generation activation, MCP/Jimeng checks, upload handling, prompt hints, settings, message rendering, or send behavior.

## Iteration 2026-06-16 model-menu-backdrop-focus

Result: passed.

Target flow:

- App loads -> open the top model menu -> click the backdrop -> the menu closes and focus returns to the model selector button.

Scope:

- `app/components/chat.tsx`: added a shared focus-restoration helper for the top model selector and used it for both Escape and backdrop dismissal.
- `test/gemini-visual-migration.test.ts`: locked the delayed focus-restoration helper and the backdrop dismissal path so pointer close behavior stays aligned with Escape close behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the model-menu backdrop only closed the menu and did not restore focus.
- Browser QA then exposed a runtime focus timing issue: the first implementation closed the menu but left `document.activeElement` on `BODY` after backdrop click.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `1440x1024`. Initial model button existed with `aria-label="选择模型和参数"`, `aria-controls="chat-model-menu"`, `aria-expanded="false"`, measured `146.5x34` at `left: 394`, `top: 14`. Opening changed the button to `aria-expanded="true"` and rendered a backdrop plus `id="chat-model-menu"`, `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, measured `left: 318`, `right: 698`, `top: 54`, `bottom: 277`, `width: 380`, `height: 223`; menu did not create horizontal overflow. Clicking the backdrop removed the menu and backdrop, returned `aria-expanded="false"`, and set `activeElement` to the model selector button with `aria-label="选择模型和参数"`. No console warn/error logs.
- Mobile `390x844`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `390x844`. Initial model button existed with `aria-label="选择模型和参数"`, `aria-controls="chat-model-menu"`, `aria-expanded="false"`, measured `132.59x34` at `left: 94`, `top: 14`. Opening rendered the dialog with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, measured `left: 35`, `right: 355`, `top: 46`, `bottom: 273`, `width: 320`, `height: 227`; no horizontal overflow. Clicking the backdrop removed the menu and backdrop, returned `aria-expanded="false"`, and set `activeElement` to the model selector button with `aria-label="选择模型"`. No console warn/error logs.
- Narrow mobile `320x740`: page identity `http://localhost:3000/#/chat`, title `NeatChat`, actual viewport `320x740`. Initial model button existed with `aria-label="选择模型"`, `aria-controls="chat-model-menu"`, `aria-expanded="false"`, measured `78.94x16.8` at `left: 120.53`, `top: 25.6`. Opening rendered the dialog with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, measured `left: 24`, `right: 296`, `top: 46`, `bottom: 273`, `width: 272`, `height: 227`; no horizontal overflow. Clicking the backdrop removed the menu and backdrop, returned `aria-expanded="false"`, and set `activeElement` to the model selector button. No console warn/error logs.

Known risks:

- This iteration only changes close-focus timing for the existing top model menu. It does not change model availability, model selection, reasoning selection, image size or quality selection, MCP/Jimeng checks, input, attachments, messages, settings, or API behavior.

## Iteration 2026-06-16 prompt-hints-listbox-semantics

Result: passed.

Target flow:

- Enable prompt hints -> return to chat -> type `/` in the composer -> prompt suggestions open with listbox semantics and the input explicitly points at the suggestion list.

Scope:

- `app/components/chat.tsx`: added `id="chat-prompt-hints"`, `role="listbox"`, and `aria-label="提示词建议"` to the existing prompt hints container; added stable option ids, `role="option"`, and `aria-selected` to each prompt hint button; connected the textarea to the list with conditional `aria-controls` and `aria-haspopup="listbox"`.
- `test/gemini-visual-migration.test.ts`: locked the prompt hints listbox, option selection semantics, and textarea/list association without changing prompt search, prompt insertion, upload, image generation, MCP/Jimeng, model behavior, attachments, or messages.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the prompt hints container did not expose `id="chat-prompt-hints"` or listbox semantics.
- `yarn lint` initially warned that `aria-expanded` is not supported on the textarea's implicit `textbox` role, so the implementation was corrected to use `aria-haspopup="listbox"` while keeping the `aria-controls` association.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: prompt hints were enabled through the Settings UI, then the existing chat was opened through the sidebar route without reloading the app state. Typing `/` rendered `id="chat-prompt-hints"`, `role="listbox"`, `aria-label="提示词建议"`, `407` options, and exactly one selected option with `id="chat-prompt-hint-0"`, `role="option"`, `aria-selected="true"`. The textarea reported `aria-controls="chat-prompt-hints"`, `aria-haspopup="listbox"`, and no `aria-expanded`; hint list measured `left: 430`, `right: 1312`, `top: 343`, `bottom: 857`, `width: 882`, `height: 514`; `pageOverflowPx: 0`. No console warn/error logs.
- Mobile `390x844`: typing `/` rendered the same listbox/option semantics with `407` options and one selected option. The textarea reported `aria-controls="chat-prompt-hints"`, `aria-haspopup="listbox"`, and no `aria-expanded`; hint list measured `left: 10`, `right: 382`, `top: 271`, `bottom: 695`, `width: 372`, `height: 424`; `pageOverflowPx: 0`. No console warn/error logs.
- Narrow mobile `320x740`: typing `/` rendered the same listbox/option semantics with `407` options and one selected option. The textarea reported `aria-controls="chat-prompt-hints"`, `aria-haspopup="listbox"`, and no `aria-expanded`; hint list measured `left: 10`, `right: 312`, `top: 288`, `bottom: 660`, `width: 302`, `height: 372`; `pageOverflowPx: 0`. No console warn/error logs.

Known risks:

- This iteration only strengthens prompt hints semantics and the input/list relationship. It does not change prompt matching, prompt ordering, prompt insertion, prompt-hints settings behavior, sending, upload handling, image generation activation, MCP/Jimeng checks, model selection, attachments, messages, or API behavior.

## Iteration 2026-06-16 prompt-hints-escape-dismiss

Result: passed.

Target flow:

- Enable prompt hints -> type `/` in the composer -> prompt suggestions open -> press Escape -> suggestions close while the textarea keeps focus and the `/` draft stays intact.

Scope:

- `app/components/chat.tsx`: added an `onClose` callback to `PromptHints`, handled Escape in the existing prompt-hints keydown listener, and passed `onClose={() => setPromptHints([])}` from the chat composer.
- `test/gemini-visual-migration.test.ts`: locked the Escape close path without changing prompt search, arrow-key selection, Enter selection, click insertion, upload, image generation, MCP/Jimeng, model behavior, attachments, or messages.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `PromptHints` did not expose `onClose` and did not handle Escape.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, prompt hints enabled. Before opening, textarea existed, was focused, had no `aria-controls`, and `pageOverflowPx: 0`. Pressing `/` opened `id="chat-prompt-hints"` with `role="listbox"`, `aria-label="提示词建议"`, `407` options, one selected option, textarea `aria-controls="chat-prompt-hints"`, and `aria-haspopup="listbox"`; list measured `left: 430`, `right: 1312`, `top: 343`, `bottom: 857`, `width: 882`, `height: 514`. Pressing Escape removed the list, cleared textarea `aria-controls`, kept `aria-haspopup="listbox"`, preserved textarea value `/`, and kept focus on `#chat-input`; `pageOverflowPx: 0`. No console warn/error logs.
- Mobile `390x844`: pressing `/` opened the same listbox semantics with `407` options and one selected option; list measured `left: 10`, `right: 382`, `top: 340`, `bottom: 764`, `width: 372`, `height: 424`. Pressing Escape removed the list, cleared textarea `aria-controls`, preserved value `/`, and kept focus on `#chat-input`; `pageOverflowPx: 0`. No console warn/error logs.
- Narrow mobile `320x740`: pressing `/` opened the same listbox semantics with `407` options and one selected option; list measured `left: 10`, `right: 312`, `top: 288`, `bottom: 660`, `width: 302`, `height: 372`. Pressing Escape removed the list, cleared textarea `aria-controls`, preserved value `/`, and kept focus on `#chat-input`; `pageOverflowPx: 0`. No console warn/error logs.

Known risks:

- This iteration only adds the Escape dismissal path for existing prompt hints. It does not change prompt matching, prompt ordering, arrow-key selection, Enter selection, click insertion, prompt-hints settings behavior, sending, upload handling, image generation activation, MCP/Jimeng checks, model selection, attachments, messages, or API behavior.

## Iteration 2026-06-16 prompt-hints-active-descendant

Result: passed.

Target flow:

- Enable prompt hints -> type `/` in the composer -> prompt suggestions open -> the listbox exposes the currently selected option through `aria-activedescendant` -> keyboard movement keeps that active descendant synchronized with the single selected option.

Scope:

- `app/components/chat.tsx`: added `aria-activedescendant` to the existing prompt hints listbox so it points at `chat-prompt-hint-${selectIndex}`.
- `test/gemini-visual-migration.test.ts`: locked the active-descendant contract without changing prompt search, keyboard selection math, Enter selection, click insertion, Escape dismissal, sending, upload, image generation, MCP/Jimeng, model behavior, attachments, or messages.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `#chat-prompt-hints` did not expose `aria-activedescendant`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`. Before opening, `#chat-input` was focused, empty, had no `aria-controls`, kept `aria-haspopup="listbox"`, and `pageOverflowPx: 0`. Pressing `/` opened `id="chat-prompt-hints"` with `role="listbox"`, `aria-label="提示词建议"`, `aria-activedescendant="chat-prompt-hint-0"`, `407` options, and one selected option `chat-prompt-hint-0`; the active option had `role="option"` and `aria-selected="true"`. The list measured `left: 430`, `right: 1312`, `top: 343.109375`, `bottom: 857.109375`, `width: 882`, `height: 514`; `listOverflowsViewport: false`, `pageOverflowPx: 0`. Pressing the existing next-selection key path moved both `aria-activedescendant` and the only selected option to `chat-prompt-hint-1`. Pressing Escape removed the list, cleared textarea `aria-controls`, preserved value `/`, and kept focus on `#chat-input`. No console warn/error logs.
- Mobile `390x844`: pressing `/` opened the same listbox semantics with `aria-activedescendant="chat-prompt-hint-0"`, `407` options, and one selected option `chat-prompt-hint-0`; list measured `left: 10`, `right: 382`, `top: 340`, `bottom: 764`, `width: 372`, `height: 424`; `listOverflowsViewport: false`, `pageOverflowPx: 0`. The same keyboard movement synchronized active descendant and selected option to `chat-prompt-hint-1`. Escape removed the list, preserved `/`, kept focus on `#chat-input`, and no console warn/error logs appeared.
- Narrow mobile `320x740`: pressing `/` opened the same listbox semantics with `aria-activedescendant="chat-prompt-hint-0"`, `407` options, and one selected option `chat-prompt-hint-0`; list measured `left: 10`, `right: 312`, `top: 288`, `bottom: 660`, `width: 302`, `height: 372`; `listOverflowsViewport: false`, `pageOverflowPx: 0`. The same keyboard movement synchronized active descendant and selected option to `chat-prompt-hint-1`. Escape removed the list, preserved `/`, kept focus on `#chat-input`, and no console warn/error logs appeared.

Known risks:

- This iteration only exposes the existing prompt-hints selection state through listbox semantics. It does not change prompt matching, prompt ordering, arrow-key selection math, Enter selection, click insertion, Escape dismissal, prompt-hints settings behavior, sending, upload handling, image generation activation, MCP/Jimeng checks, model selection, attachments, messages, or API behavior.

## Iteration 2026-06-16 prompt-hints-arrow-direction

Result: passed.

Target flow:

- Enable prompt hints -> type `/` in the composer -> prompt suggestions open at `chat-prompt-hint-0` -> ArrowDown moves to `chat-prompt-hint-1` -> ArrowUp returns to `chat-prompt-hint-0` -> Escape closes the list while preserving focus and the `/` draft.

Scope:

- `app/components/chat.tsx`: corrected the existing prompt hints keydown mapping so ArrowDown advances the selected prompt and ArrowUp moves back.
- `test/gemini-visual-migration.test.ts`: locked the direction-key contract without changing prompt search, Enter selection, click insertion, Escape dismissal, sending, upload, image generation, MCP/Jimeng, model behavior, attachments, or messages.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because ArrowUp called `changeIndex(1)` and ArrowDown called `changeIndex(-1)`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: page identity `http://localhost:3000/#/chat`, title `NeatChat`. Before opening, `#chat-input` was focused, empty, had no `aria-controls`, kept `aria-haspopup="listbox"`, and `pageOverflowPx: 0`. Pressing `/` opened `id="chat-prompt-hints"` with `role="listbox"`, `aria-label="提示词建议"`, `aria-activedescendant="chat-prompt-hint-0"`, `407` options, and one selected option `chat-prompt-hint-0`; the list measured `left: 430`, `right: 1312`, `top: 343.109375`, `bottom: 857.109375`, `width: 882`, `height: 514`; `listOverflowsViewport: false`, `pageOverflowPx: 0`. Pressing ArrowDown moved both `aria-activedescendant` and the only selected option to `chat-prompt-hint-1`; pressing ArrowUp moved both back to `chat-prompt-hint-0`. Pressing Escape removed the list, cleared textarea `aria-controls`, preserved value `/`, and kept focus on `#chat-input`. No console warn/error logs.
- Mobile `390x844`: pressing `/` opened the same listbox semantics with `aria-activedescendant="chat-prompt-hint-0"`, `407` options, and one selected option `chat-prompt-hint-0`; list measured `left: 10`, `right: 382`, `top: 271.109375`, `bottom: 695.109375`, `width: 372`, `height: 424`; `listOverflowsViewport: false`, `pageOverflowPx: 0`. ArrowDown moved active descendant and selected option to `chat-prompt-hint-1`; ArrowUp moved both back to `chat-prompt-hint-0`. Escape removed the list, preserved `/`, kept focus on `#chat-input`, and no console warn/error logs appeared.
- Narrow mobile `320x740`: pressing `/` opened the same listbox semantics with `aria-activedescendant="chat-prompt-hint-0"`, `407` options, and one selected option `chat-prompt-hint-0`; list measured `left: 10`, `right: 312`, `top: 219.109375`, `bottom: 591.109375`, `width: 302`, `height: 372`; `listOverflowsViewport: false`, `pageOverflowPx: 0`. ArrowDown moved active descendant and selected option to `chat-prompt-hint-1`; ArrowUp moved both back to `chat-prompt-hint-0`. Escape removed the list, preserved `/`, kept focus on `#chat-input`, and no console warn/error logs appeared.

Known risks:

- This iteration only corrects prompt hints ArrowUp/ArrowDown direction. It does not change prompt matching, prompt ordering, Enter selection, click insertion, Escape dismissal, prompt-hints settings behavior, sending, upload handling, image generation activation, MCP/Jimeng checks, model selection, attachments, messages, or API behavior.

## Iteration 2026-06-16 prompt-hints-enter-select

Result: passed.

Target flow:

- Enable prompt hints -> type `/` in the composer -> prompt suggestions open at `chat-prompt-hint-0` -> press Enter -> the active prompt is inserted, the prompt list closes, textarea focus stays in place, no message is sent, and no trailing newline is introduced.

Scope:

- `app/components/chat.tsx`: consumed Enter in the existing prompt hints keydown path, prevented textarea default newline while prompt hints are open, and normalized selected prompt content with `trimEnd()` before filling the composer.
- `test/gemini-visual-migration.test.ts`: locked the Enter selection event handling and selected-prompt normalization without changing prompt search, prompt ordering, ArrowUp/ArrowDown selection, click insertion, Escape dismissal, ordinary sending, upload handling, image generation, MCP/Jimeng, model behavior, attachments, or messages.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the prompt hints Enter branch did not stop/prevent the event and the textarea keydown path did not prevent Enter while hints were open.
- Browser QA then exposed a real runtime issue: the first prompt in `public/prompts.json` contains a trailing newline, so selected prompt content was filled with a tail line break. The implementation now trims only trailing whitespace at selection time, without mutating prompt data or changing prompt search/order.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: before opening, `#chat-input` was focused, empty, had no `aria-controls`, and `pageOverflowPx: 0`. Pressing `/` opened `id="chat-prompt-hints"` with `role="listbox"`, `aria-label="提示词建议"`, `aria-activedescendant="chat-prompt-hint-0"`, `407` options, one selected option `chat-prompt-hint-0`, textarea `aria-controls="chat-prompt-hints"`, and `pageOverflowPx: 0`. Pressing Enter removed the list, cleared textarea `aria-controls`, kept focus on `#chat-input`, filled the selected prompt with `valueLength: 1716`, `hasNewline: false`, kept message count at `0`, and produced no console warn/error logs.
- Mobile `390x844`: the same flow opened the listbox with `407` options, one selected option, `aria-activedescendant="chat-prompt-hint-0"`, and `pageOverflowPx: 0`. Pressing Enter removed the list, kept focus on `#chat-input`, filled the selected prompt with no newline, kept message count at `0`, and produced no console warn/error logs.
- Narrow mobile `320x740`: the same flow opened the listbox with `407` options, one selected option, `aria-activedescendant="chat-prompt-hint-0"`, and `pageOverflowPx: 0`. Pressing Enter removed the list, kept focus on `#chat-input`, filled the selected prompt with no newline, kept message count at `0`, and produced no console warn/error logs.

Known risks:

- This iteration only fixes Enter selection and trailing whitespace in selected prompt fill. It does not change prompt matching inputs, prompt data, prompt ordering, ArrowUp/ArrowDown selection, click path entry points, Escape dismissal, prompt-hints settings behavior, sending, upload handling, image generation activation, MCP/Jimeng checks, model selection, attachments, messages, or API behavior.

## Iteration 2026-06-16 empty-suggestion-touch-wrap

Result: passed.

Target flow:

- Open a new empty chat -> the empty-state suggestion chips are visible -> desktop keeps a compact row -> mobile and narrow mobile wrap cleanly into two rows with stable touch targets -> no chip or text overflows the suggestion area or viewport.

Scope:

- `app/components/chat.tsx`: wrapped each empty-state suggestion label in a dedicated text span so text wrapping can be controlled without changing the existing button click path.
- `app/components/chat.module.scss`: converted suggestion buttons to centered inline-flex touch targets, moved multiline handling to the text span, added a two-line height fallback, and raised mobile chip height to `44px`.
- `test/gemini-visual-migration.test.ts`: locked the empty-suggestion structure, touch target, wrapping, and two-line fallback contracts without changing suggestion content, click-to-fill behavior, empty-state routing, sending, uploads, image generation, MCP/Jimeng, model selection, settings, stores, messages, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because empty suggestions were single-line `nowrap` buttons and mobile chips did not expose the new touch/wrap contract.
- Browser QA then exposed a runtime-verification gap: `-webkit-line-clamp` existed in the stylesheet, but Browser computed style did not expose it as a reliable value. A second RED added the explicit `line-height: 1.2` and `max-height: 2.4em` fallback contract before CSS was updated.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: empty suggestion area had `4` items, `4` buttons, and `4` text spans. Suggestion list measured `640x40`; buttons measured `110-149px` wide and `40px` tall, each stayed within the list and viewport. Text spans used `white-space: normal`, `overflow: hidden`, `max-height: 31.2px`, and actual span height `15.59px`, satisfying the two-line height cap. `pageOverflowX: 0`; console warn/error logs: `0`.
- Mobile `390x844`: empty suggestion area had `4` items, `4` buttons, and `4` text spans. Suggestion list measured `320x96`; buttons measured `98-134px` wide and `44px` tall, each stayed within the list and viewport. Text spans used `white-space: normal`, `overflow: hidden`, `max-height: 28.8px`, and actual span height `14.4px`, satisfying the two-line height cap. `pageOverflowX: 0`; console warn/error logs: `0`.
- Narrow mobile `320x740`: empty suggestion area had `4` items, `4` buttons, and `4` text spans. Suggestion list measured `288x96`; buttons measured `98-134px` wide and `44px` tall, each stayed within the list and viewport. Text spans used `white-space: normal`, `overflow: hidden`, `max-height: 28.8px`, and actual span height `14.4px`, satisfying the two-line height cap. `pageOverflowX: 0`; console warn/error logs: `0`.

Known risks:

- This iteration only changes empty-state suggestion chip structure and CSS. It does not change `Locale.Chat.EmptySuggestions`, `applyEmptySuggestion`, empty-state detection, composer placement, prompt hints, sending, upload handling, image generation activation, MCP/Jimeng checks, model selection, settings, stores, messages, or API behavior.

## Iteration 2026-06-16 reading-surface-live-updates

Result: passed.

Target flow:

- Open chat -> the existing conversation reading surface remains the message list -> newly added or streaming message text can be announced politely through the list live region -> empty-state layout, composer, and core entries remain visible without horizontal overflow.

Scope:

- `app/components/chat.tsx`: added `aria-live="polite"`, `aria-relevant="additions text"`, and `aria-atomic="false"` to the existing `role="list"` message reading surface.
- `test/gemini-visual-migration.test.ts`: locked the live region contract without changing message rendering, message ordering, scroll behavior, sending, retry/delete/pin actions, uploads, image generation, MCP/Jimeng, model selection, settings, stores, messages, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the existing message list did not expose live region attributes.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: chat body `aria-label="聊天消息"` measured `1140x962`, `overflowX: 0`, `pageOverflowX: 0`. Reading list had `role="list"`, `aria-label="会话消息列表"`, `aria-live="polite"`, `aria-relevant="additions text"`, `aria-atomic="false"`, width `920`, stayed within viewport, and empty-state suggestions stayed within viewport at `640x40`. Composer input remained visible. Console warn/error logs: `0`.
- Mobile `390x844`: chat body measured `390x776`, `overflowX: 0`, `pageOverflowX: 0`. Reading list had the same live region semantics, width `326`, stayed within viewport, and empty-state suggestions stayed within viewport at `320x96`. Composer input remained visible. Console warn/error logs: `0`.
- Narrow mobile `320x740`: chat body measured `320x672`, `overflowX: 0`, `pageOverflowX: 0`. Reading list had the same live region semantics, width `256`, stayed within viewport, and empty-state suggestions stayed within viewport at `288x96`. Composer input remained visible. Console warn/error logs: `0`.

Known risks:

- This iteration only adds non-visual live region semantics to the existing message list. It does not change `getVisibleChatMessages`, `RenderMessage`, Markdown rendering, message order, scroll behavior, clear-context logic, sending, retry/delete/pin actions, upload handling, image generation activation, MCP/Jimeng checks, model selection, settings, stores, messages, or API behavior.

## Iteration 2026-06-16 composer-tool-button-haspopup

Result: passed.

Target flow:

- Open chat -> the prompt bar left tool button remains visible -> assistive semantics identify it as a button that opens the existing dialog-style tool menu -> input and send controls remain visible on desktop and mobile without horizontal overflow.

Scope:

- `app/components/chat.tsx`: added `aria-haspopup="dialog"` to the existing chat input tool menu button.
- `test/gemini-visual-migration.test.ts`: locked the tool button popup contract without changing tool menu content, menu open/close state, Escape/backdrop handling, uploads, image generation, MCP/Jimeng, prompt hints, shortcut modal, sending, model selection, settings, stores, messages, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the tool menu button did not expose `aria-haspopup="dialog"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: tool button was a `button type="button"` with `aria-label="打开对话工具"`, `aria-controls="chat-input-action-menu"`, `aria-haspopup="dialog"`, and `aria-expanded="false"`; rect `44x44` at `x=490`, `y=460.08`, within viewport. Composer input rect `478x28` and send button rect `42x42` were within viewport. `pageOverflowX: 0`, chat body `overflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: tool button had the same semantics, rect `42x42` at `x=19`, `y=781`, within viewport. Composer input rect `246x28` and send button rect `40x40` were within viewport. `pageOverflowX: 0`, chat body `overflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: tool button had the same semantics, rect `42x42` at `x=19`, `y=677`, within viewport. Composer input rect `176x28` and send button rect `40x40` were within viewport. `pageOverflowX: 0`, chat body `overflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only adds a non-visual popup semantic to the existing tool button. It does not change `ChatActions`, menu placement, click behavior, Escape/backdrop close behavior, attachments, image generation activation, MCP/Jimeng checks, prompt hints, shortcut modal, sending, model selection, settings, stores, messages, or API behavior.

## Iteration 2026-06-16 sidebar-nav-landmarks

Result: passed.

Target flow:

- Open chat -> the sidebar primary navigation and content navigation are exposed as named navigation landmarks -> existing new chat/search/masks/local content/discovery entries remain available -> desktop and mobile layouts keep the page free of horizontal overflow.

Scope:

- `app/components/sidebar.tsx`: added `role="navigation"` and locale-driven `aria-label` values to the existing `sidebar-primary-nav` and `sidebar-content-nav` wrappers.
- `test/gemini-visual-migration.test.ts`: locked the sidebar landmark contract without changing routes, nav item behavior, history list, drag/delete behavior, settings, stores, messages, MCP/Jimeng, model selection, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the sidebar nav wrappers did not expose named navigation landmarks.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: sidebar exposed `2` navigation landmarks. Primary nav had `role="navigation"`, `aria-label="开始"`, `3` buttons, rect `275x159` at `x=12`, `y=68`; content nav had `role="navigation"`, `aria-label="内容"`, `2` buttons, rect `275x137` at `x=12`, `y=241`. Sidebar measured `300x1024`, chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: sidebar drawer was off-canvas by default, mobile sidebar trigger remained visible with `aria-label="查看消息列表"`. Primary nav had `role="navigation"`, `aria-label="开始"`, `3` buttons; content nav had `role="navigation"`, `aria-label="内容"`, `2` buttons. Chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: sidebar drawer was off-canvas by default, mobile sidebar trigger remained visible with `aria-label="查看消息列表"`. Primary nav had `role="navigation"`, `aria-label="开始"`, `3` buttons; content nav had `role="navigation"`, `aria-label="内容"`, `2` buttons. Chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only adds non-visual landmark semantics to existing sidebar groups. It does not change sidebar visual style, width, collapse behavior, nav copy, route targets, history list, drag sorting, deletion, settings, stores, model APIs, MCP/Jimeng checks, attachments, or image generation behavior.

## Iteration 2026-06-16 mobile-sidebar-hidden-state

Result: passed.

Target flow:

- On mobile, open chat with the sidebar drawer closed -> the off-canvas sidebar is hidden from assistive technology -> tap the mobile sidebar trigger -> the drawer opens, becomes accessible again, and the backdrop exposes the expanded state -> desktop sidebar remains accessible as before.

Scope:

- `app/components/home.tsx`: passes `isMobileHidden={isCompactScreen && !isHome}` into the sidebar so only the compact closed route hides the off-canvas drawer.
- `app/components/sidebar.tsx`: maps `isMobileHidden` to `aria-hidden` on `#mobile-sidebar-drawer`.
- `test/gemini-visual-migration.test.ts`: locks the mobile hidden-state contract without changing visual layout, drawer width, animation, routes, nav item behavior, history list behavior, settings, stores, MCP/Jimeng, model selection, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the sidebar did not expose `isMobileHidden` or `aria-hidden`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024` at `#/chat`: drawer had no `aria-hidden`, measured `300x1024` at `x=0`, `navCount: 2`, no mobile trigger, chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844` closed at `#/chat`: drawer had `aria-hidden="true"`, measured `304x844` at `x=-304`; mobile trigger was visible with `aria-label="查看消息列表"`, `aria-controls="mobile-sidebar-drawer"`, `aria-expanded="false"`, size `40x40`; chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844` opened after trigger: URL moved to `#/`, drawer removed `aria-hidden`, class included `sidebar-show`, measured `304x844` at `x=0`; backdrop existed with `aria-controls="mobile-sidebar-drawer"` and `aria-expanded="true"`; trigger also reported `aria-expanded="true"`; chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740` closed at `#/chat`: drawer had `aria-hidden="true"`, measured `266x740` at `x=-266`; mobile trigger was visible with `aria-expanded="false"`, size `40x40`; chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740` opened after trigger: URL moved to `#/`, drawer removed `aria-hidden`, class included `sidebar-show`, measured `266x740` at `x=0`; backdrop and trigger both reported `aria-expanded="true"`; chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only changes the accessibility state of the existing off-canvas sidebar. It does not change sidebar styling, drawer width, animation timing, route targets, nav copy, history list, drag sorting, deletion, settings, stores, model APIs, MCP/Jimeng checks, attachments, or image generation behavior.

## Iteration 2026-06-16 composer-prompt-action-close-loop

Result: passed.

Target flow:

- On desktop, open the prompt bar tool menu -> choose the existing prompt action -> the tool menu closes, the prompt hints list opens, and the input is focused with `/` ready for prompt search. On mobile, the compact tool menu keeps prompt search out of the reduced action set.

Scope:

- `app/components/chat.tsx`: changed the desktop prompt action to call `props.showPromptHints()` and then `props.onActionComplete?.()` so the existing tool menu closes after opening prompt hints.
- `test/gemini-visual-migration.test.ts`: locked the prompt action close-loop contract without changing prompt search, prompt ordering, prompt insertion, keyboard selection, sending, uploads, image generation, MCP/Jimeng, model selection, settings, stores, messages, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the prompt action only called `props.showPromptHints`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: Browser Playwright locator click timed out on the tool button and prompt action, so verification switched to Browser DOM/coordinate evidence after reading visible DOM and menu button rects. The tool button opened `#chat-input-action-menu`; the visible prompt action button had `aria-label="快捷指令"`, size `310x38`, at `x=505`, `y=213`. Clicking its center closed the tool menu, set the menu button `aria-expanded="false"`, focused `#chat-input`, set input value to `/`, set input `aria-controls="chat-prompt-hints"`, opened `#chat-prompt-hints` as `role="listbox"` with `aria-label="提示词建议"` and `407` options, kept input/send visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: compact tool menu opened as `role="dialog"` with `aria-label="对话工具菜单"`, measured `320x158` at `x=11`, `y=609`; menu button `aria-expanded="true"`. Buttons were `上传附件` and `图片生成`, each `294x46`; `hasPromptAction=false`; input/send remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: compact tool menu opened as `role="dialog"` with `aria-label="对话工具菜单"`, measured `272x158` at `x=11`, `y=505`; menu button `aria-expanded="true"`. Buttons were `上传附件` and `图片生成`, each `246x46`; `hasPromptAction=false`; input/send remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only closes the existing tool menu after the desktop prompt action opens prompt hints. It does not change prompt matching, prompt data, prompt ordering, selected prompt insertion, Escape/Enter behavior, sending, uploads, image generation activation, MCP/Jimeng checks, model selection, settings, stores, messages, or API behavior.

## Iteration 2026-06-16 reasoning-chip-popup-semantics

Result: passed.

Target flow:

- On desktop GPT-5 reasoning sessions, focus the prompt bar -> the status row reasoning chip announces its current level and popup behavior -> click the chip -> the popup state is reflected by `aria-expanded=true`. Mobile and narrow layouts keep the compact composer behavior where this desktop reasoning chip is not rendered.

Scope:

- `app/components/chat.tsx`: added `aria-label`, `aria-haspopup="listbox"`, and `aria-expanded` to the existing reasoning effort chip.
- `test/gemini-visual-migration.test.ts`: locked the reasoning chip popup semantic contract without changing reasoning selection, `max_output_tokens`, model APIs, sending, attachments, image generation, MCP/Jimeng, settings, stores, messages, or visual layout.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the reasoning chip did not expose current-level or popup state semantics.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: reasoning chip was visible as `button` with `aria-label="思考等级：标准"`, `aria-haspopup="listbox"`, `aria-expanded="false"`, rect `82x30` at `x=1109`, `y=470`. The surrounding status row kept `role="status"`, `aria-live="polite"`, `aria-atomic="true"`, and `aria-label="当前输入模式"`. Chat input rect `478x28` and send button rect `42x42` were visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Desktop popup check `1440x1024`: Browser Playwright found exactly one button named `思考等级：标准`; clicking it changed the chip to `aria-expanded="true"` while keeping `aria-haspopup="listbox"` and `aria-label="思考等级：标准"`, console warn/error logs: `0`.
- Mobile `390x844`: compact layout did not render the desktop-only reasoning chip or status row by design; chat input rect `246x28` and send button rect `40x40` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: compact layout did not render the desktop-only reasoning chip or status row by design; chat input rect `176x28` and send button rect `40x40` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only adds non-visual semantics to the existing desktop reasoning chip. It does not change `reasoningLabels`, `reasoningEfforts`, `Selector`, reasoning effort persistence, `max_output_tokens` calculation, prompt bar sizing, mobile model drawer behavior, model APIs, sending, attachments, image generation activation, MCP/Jimeng checks, settings, stores, messages, or API behavior.

## Iteration 2026-06-16 mobile-model-section-controls

Result: passed.

Target flow:

- On mobile, open the model menu -> each visible advanced section button exposes the controlled panel id through `aria-controls` -> expanding the section reveals a matching `listbox` panel. Desktop model entry remains unchanged.

Scope:

- `app/components/chat.tsx`: added stable `aria-controls` values to the mobile model menu advanced section buttons and matching ids to their option panels.
- `test/gemini-visual-migration.test.ts`: locked the reasoning, image size, and image quality section-control contracts without changing model selection, reasoning persistence, image settings, MCP/Jimeng, attachments, sending, settings, stores, messages, or visual layout.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the mobile advanced section buttons did not expose `aria-controls` and the option panels did not expose matching ids.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: model button remained visible with `aria-label="选择模型和参数"`, `aria-controls="chat-model-menu"`, `aria-expanded="false"`, rect `147x34` at `x=394`, `y=14`; chat input rect `478x28` and send button rect `42x42` were visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: model menu opened as `#chat-model-menu`, `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `320x227` at `x=35`, `y=46`; model button had `aria-expanded="true"` and `aria-controls="chat-model-menu"`. The visible advanced section button `思考等级标准⌄` had `aria-controls="chat-mobile-reasoning-options"` and `aria-expanded="false"`. Chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile expanded `390x844`: clicking the reasoning section changed `aria-expanded="true"` and revealed `#chat-mobile-reasoning-options` with `role="listbox"`, `aria-label="思考等级选项"`, `3` options, rect `294x178` at `x=48`, `y=260`; input/send remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: model menu opened as `#chat-model-menu`, `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `272x227` at `x=24`, `y=46`; visible reasoning section button had `aria-controls="chat-mobile-reasoning-options"` and `aria-expanded="false"`. Chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile expanded `320x740`: clicking the reasoning section changed `aria-expanded="true"` and revealed `#chat-mobile-reasoning-options` with `role="listbox"`, `aria-label="思考等级选项"`, `3` options, rect `246x178` at `x=37`, `y=260`; input/send remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- Runtime Browser QA used the default GPT-5 reasoning model, so only the visible reasoning section appeared in the mobile menu. The image size and image quality panel ids are covered by the static Jest contract because those sections only render for image-generation models. This iteration does not change `toggleMobileModelSection`, model selection, reasoning/max token logic, image setting values, MCP/Jimeng activation, attachments, sending, settings, stores, messages, or API behavior.

## Iteration 2026-06-16 model-menu-trigger-haspopup

Result: passed.

Target flow:

- On desktop and mobile, the model menu trigger declares that it opens a dialog before it is expanded -> opening the trigger still renders the existing model menu dialog -> composer input and send stay visible with no horizontal overflow.

Scope:

- `app/components/chat.tsx`: added `aria-haspopup="dialog"` to the desktop and mobile model menu trigger buttons.
- `test/gemini-visual-migration.test.ts`: locked the trigger popup contract without changing model selection, reasoning controls, image size/quality controls, MCP/Jimeng, attachments, sending, settings, stores, messages, or visual layout.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the model menu trigger buttons did not expose `aria-haspopup="dialog"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: model button had `aria-label="选择模型和参数"`, `aria-controls="chat-model-menu"`, `aria-haspopup="dialog"`, `aria-expanded="false"`, rect `147x34` at `x=394`, `y=14`. Opening via DOM-coordinate fallback changed `aria-expanded="true"` and rendered `#chat-model-menu` with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `380x223` at `x=318`, `y=54`. Chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: model button had `aria-label="选择模型"`, `aria-controls="chat-model-menu"`, `aria-haspopup="dialog"`, `aria-expanded="false"`, rect `79x17` at `x=156`, `y=26`. Opening changed `aria-expanded="true"` and rendered `#chat-model-menu` with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `320x227` at `x=35`, `y=46`. Chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: model button had `aria-label="选择模型"`, `aria-controls="chat-model-menu"`, `aria-haspopup="dialog"`, `aria-expanded="false"`, rect `79x17` at `x=121`, `y=26`. Opening changed `aria-expanded="true"` and rendered `#chat-model-menu` with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `272x227` at `x=24`, `y=46`. Chat input and send button remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- Browser role-locator click timed out on the desktop model trigger, so the verification switched to DOM rect plus coordinate click evidence after the first failure. This iteration only adds non-visual popup semantics to the existing model trigger buttons; it does not change model choice, reasoning/max token logic, image setting values, menu placement, Escape/backdrop close behavior, MCP/Jimeng, attachments, sending, settings, stores, messages, or API behavior.

## Iteration 2026-06-16 mobile-model-trigger-hit-area

Result: passed.

Target flow:

- On mobile, the header model trigger keeps the existing model-menu semantics while exposing a stable 40px touch target matching the adjacent header controls. Opening it still renders the existing model dialog, and composer input/send stay visible with no horizontal overflow.

Scope:

- `app/components/chat.module.scss`: increased the mobile header model trigger hit area to a `40px` minimum height with `12px` horizontal padding and pill radius while preserving text truncation and centered alignment.
- `test/gemini-visual-migration.test.ts`: locked the mobile header action `40x40` baseline and the mobile model trigger `min-height`, padding, and radius contract without changing model selection, reasoning controls, image settings, MCP/Jimeng, attachments, sending, settings, stores, messages, or desktop layout.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `.chat-mobile-model-title` did not declare `min-height: 40px`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: model button remained `aria-label="选择模型和参数"`, `aria-controls="chat-model-menu"`, `aria-haspopup="dialog"`, `aria-expanded="false"`, rect `147x34` at `x=394`, `y=14`; opening rendered `#chat-model-menu` with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `380x223` at `x=318`, `y=54`. Chat input rect `478x28` and send button rect `42x42` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: model button had `aria-label="选择模型"`, `aria-controls="chat-model-menu"`, `aria-haspopup="dialog"`, `aria-expanded="false"`, computed `min-height: 40px`, `padding-left/right: 12px`, `border-radius: 999px`, rect `87x40` at `x=152`, `y=14`; opening changed `aria-expanded="true"` and rendered `#chat-model-menu` with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `320x227` at `x=35`, `y=46`. Chat input rect `246x28` and send button rect `40x40` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: model button had `aria-label="选择模型"`, `aria-controls="chat-model-menu"`, `aria-haspopup="dialog"`, `aria-expanded="false"`, computed `min-height: 40px`, `padding-left/right: 12px`, `border-radius: 999px`, rect `87x40` at `x=117`, `y=14`; opening changed `aria-expanded="true"` and rendered `#chat-model-menu` with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `272x227` at `x=24`, `y=46`. Chat input rect `176x28` and send button rect `40x40` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only changes the mobile header model trigger hit area. It does not change `chat.tsx`, model choice, reasoning/max token logic, image setting values, menu placement, Escape/backdrop close behavior, MCP/Jimeng, attachments, sending, settings, stores, messages, API behavior, desktop model trigger sizing, or prompt bar layout.

## Iteration 2026-06-16 mobile-model-menu-clearance

Result: passed.

Target flow:

- On mobile, the header model trigger opens the existing model dialog below the 40px trigger target with a positive vertical gap. Desktop model menu placement remains unchanged.

Scope:

- `app/components/chat.module.scss`: moved the mobile model menu from `safe-area + 46px` to `safe-area + 60px` so it clears the taller mobile trigger target.
- `test/gemini-visual-migration.test.ts`: locked the mobile model menu top offset contract without changing model selection, reasoning controls, image settings, MCP/Jimeng, attachments, sending, settings, stores, messages, desktop layout, or menu content.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `.chat-mobile-model-menu` still used `top: calc(env(safe-area-inset-top) + 46px)`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: model button remained `aria-label="选择模型和参数"`, `aria-controls="chat-model-menu"`, `aria-haspopup="dialog"`, `aria-expanded="false"`, rect `147x34` at `x=394`, `y=14`; opening rendered `#chat-model-menu` with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `380x223` at `x=318`, `y=54`; vertical gap from button bottom to menu top was `6px`. Chat input rect `478x28` and send button rect `42x42` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: model button closed state was `aria-label="选择模型"`, `aria-controls="chat-model-menu"`, `aria-haspopup="dialog"`, `aria-expanded="false"`, rect `87x40` at `x=152`, `y=14`; opening changed `aria-expanded="true"` and rendered `#chat-model-menu` with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `320x227` at `x=35`, `y=60`; vertical gap from button bottom to menu top was `6px`. Chat input rect `246x28` and send button rect `40x40` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: model button closed state was `aria-label="选择模型"`, `aria-controls="chat-model-menu"`, `aria-haspopup="dialog"`, `aria-expanded="false"`, rect `87x40` at `x=117`, `y=14`; opening changed `aria-expanded="true"` and rendered `#chat-model-menu` with `role="dialog"`, `aria-modal="true"`, `aria-label="模型和思考等级"`, rect `272x227` at `x=24`, `y=60`; vertical gap from button bottom to menu top was `6px`. Chat input rect `176x28` and send button rect `40x40` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only changes the mobile model menu vertical offset. It does not change `chat.tsx`, model choice, reasoning/max token logic, image setting values, menu width, max height, option styling, Escape/backdrop close behavior, MCP/Jimeng, attachments, sending, settings, stores, messages, API behavior, desktop model menu placement, or prompt bar layout.

## Iteration 2026-06-16 desktop-header-action-labels

Result: passed.

Target flow:

- On desktop, the header action cluster exposes named controls for refresh title, edit messages, export, and full screen. On mobile, the desktop header action cluster is hidden so it does not compete with the mobile header controls.

Scope:

- `app/components/chat.tsx`: added button-level `aria` labels to the refresh title and export header actions, matching their existing visible tooltip/title copy.
- `app/components/chat.module.scss`: hides `.chat-desktop-header-actions` in the primary mobile breakpoint.
- `test/gemini-visual-migration.test.ts`: locked the refresh/export button label contract and the mobile hidden-state contract without changing header button order, click behavior, export modal, edit flow, model menu, prompt bar, MCP/Jimeng, attachments, sending, settings, stores, messages, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because refresh/export lacked button-level `aria` labels.
- A second RED check failed as expected because mobile CSS did not hide `.chat-desktop-header-actions`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: header action group displayed as `flex`, rect `156x42` at `x=1266`, `y=10`; all 4 visible buttons had names and titles: `刷新标题`, `编辑消息记录`, `导出聊天记录`, `全屏`, each `34x34`. Chat input rect `478x28` and send button rect `42x42` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: desktop header action group did not render; visible desktop header action count was `0`. Mobile sidebar trigger remained `40x40` at `x=16`, `y=14` with `aria-controls="mobile-sidebar-drawer"` and `aria-expanded="false"`; model trigger remained `87x40` at `x=152`, `y=14` with `aria-controls="chat-model-menu"` and `aria-expanded="false"`. Chat input rect `246x28` and send button rect `40x40` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: desktop header action group did not render; visible desktop header action count was `0`. Mobile sidebar trigger remained `40x40` at `x=16`, `y=14`; model trigger remained `87x40` at `x=117`, `y=14`; input rect `176x28` and send button rect `40x40` remained visible, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only names existing desktop header actions and hides that desktop action cluster on mobile. It does not change `IconButton`, button order, button size, refresh title behavior, edit message flow, export modal, full-screen setting, model menu behavior, prompt bar layout, MCP/Jimeng, attachments, sending, settings, stores, messages, or API behavior.

## Iteration 2026-06-16 sidebar-history-delete-focus

Result: passed.

Target flow:

- In the desktop sidebar history list, each delete control keeps the desktop default hidden state but uses the same `34px` hit target as mobile/narrow layouts and becomes discoverable when the history row receives keyboard focus.
- In the mobile sidebar drawer, history delete controls remain visible enough to discover without requiring hover.

Scope:

- `app/components/home.module.scss`: increased the base history delete hit target from `32px` to `34px`, added row `focus-within` reveal styles, preserved focused delete opacity at `1`, and added a mobile drawer open-state override for visible `0.72` opacity.
- `test/gemini-visual-migration.test.ts`: locked the desktop `34px` base target, focus-within reveal, and mobile drawer open-state opacity/pointer-events contracts without changing route links, drag handles, delete behavior, store, model controls, prompt bar, MCP/Jimeng, attachments, sending, or messages.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `.chat-item-delete` still used `32px`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: fresh tab, container `home_tight-container`, first history delete button label `确认删除选中的对话？`, rect `34x34` at `x=249`, `y=439`; default computed style `opacity: 0`, `pointer-events: none`, `display: flex`. Chat input rect `478x28`, send button rect `42x42`, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: drawer trigger `button[aria-label="查看消息列表"]` opened the sidebar; first history delete button label `确认删除选中的对话？`, rect `34x34` at `x=233`, `y=465`; computed style `opacity: 0.72`, `pointer-events: auto`, `display: flex`. Chat input rect `246x28`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: drawer trigger opened the sidebar with `aria-expanded="true"` and sidebar rect `266x740` at `x=0`; first history delete button rect `34x34` at `x=191`, `y=465`; computed style `opacity: 0.72`, `pointer-events: auto`, `display: flex`. Chat input rect `176x28`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only changes history-list delete affordance styling. It does not change `chat-list.tsx`, route links, drag handles, delete confirmation/direct-delete behavior, session selection, sidebar width, model menu behavior, prompt bar layout, MCP/Jimeng, attachments, sending, settings, stores, messages, or API behavior.

## Iteration 2026-06-16 message-action-rail-hit-targets

Result: passed.

Target flow:

- Message action controls remain attached to each readable message, expose a semantic action group, and use a stable `34px` hit target across desktop and mobile reading layouts.

Scope:

- `app/components/chat.tsx`: added `role="group"` to the existing `aria-label="消息操作"` message action container.
- `app/components/chat.module.scss`: raised the message action rail button target from `30x30` to `34x34`, including hover/focus width, while leaving labels hidden in the rail and preserving the existing desktop hidden/reveal model plus mobile always-visible model.
- `test/gemini-visual-migration.test.ts`: locked the semantic action group and `34px` rail target contract without changing action order, labels, icons, click handlers, message rendering, model controls, prompt bar, MCP/Jimeng, attachments, sending, settings, stores, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the message action container lacked `role="group"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: opened the existing `浏览器相关` recent chat without triggering delete/send. The conversation list had `3` listitems and `2` `role="group"` / `aria-label="消息操作"` groups. First action group rect was `154x40`, default computed style `opacity: 0`, `pointer-events: none`; action buttons `重试`, `删除`, `固定`, `复制` were each `34x34`. Chat input rect `562x40`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: first message action group was visible with computed `opacity: 1`, `pointer-events: auto`, `transform: none`; action buttons `重试`, `删除`, `固定`, `复制` were each `34x34`. Chat input rect `246x26`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: first message action group was visible with computed `opacity: 1`, `pointer-events: auto`, `transform: none`; action buttons `重试`, `删除`, `固定`, `复制` were each `34x34` and fit within the viewport. Chat input rect `176x26`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- Browser hover simulation did not flip desktop `:hover` state in the background Browser runtime, so desktop reveal behavior is covered by the static CSS contract (`.chat-message-container:hover .chat-message-actions` and `:focus-within`). This iteration does not change `onResend`, `onDelete`, `onPinMessage`, `copyToClipboard`, TTS, message content, markdown, image preview/download, scrolling, sending, model APIs, MCP/Jimeng, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 message-action-group-unique-labels

Result: passed.

Target flow:

- Each readable message action group has a unique accessible name that includes message role and message index, so repeated action groups can be distinguished while keeping the same visible rail and button behavior.

Scope:

- `app/components/chat.tsx`: changed the message action group label from the repeated `消息操作` to `${isUser ? "用户消息" : "助手消息"} ${i + 1} 操作`.
- `test/gemini-visual-migration.test.ts`: locked the dynamic role/index action group label without changing row labels, action order, action button labels, icons, click handlers, rail sizes, desktop reveal behavior, mobile always-visible behavior, message rendering, model controls, prompt bar, MCP/Jimeng, attachments, sending, settings, stores, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because message action groups still used the repeated `aria-label="消息操作"`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: opened the existing `浏览器相关` recent chat without triggering delete/send. The conversation list had `3` listitems and `2` message action groups with unique labels: `用户消息 2 操作`, `助手消息 3 操作`. First group default style remained `opacity: 0`, `pointer-events: none`; `重试`, `删除`, `固定`, `复制` buttons each remained `34x34`. Chat input rect `562x40`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: message action group labels were `用户消息 2 操作`, `助手消息 3 操作`, unique count matched group count. First group remained visible with `opacity: 1`, `pointer-events: auto`, `transform: none`; action buttons remained `34x34`. Chat input rect `246x26`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: message action group labels were `用户消息 2 操作`, `助手消息 3 操作`, unique count matched group count. First group remained visible with `opacity: 1`, `pointer-events: auto`, `transform: none`; action buttons remained `34x34`. Chat input rect `176x26`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only changes action group accessible names. It does not change `onResend`, `onDelete`, `onPinMessage`, `copyToClipboard`, TTS, message content, markdown, image preview/download, scrolling, sending, model APIs, MCP/Jimeng, stores, prompt bar, header, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 message-action-button-labels

Result: passed.

Target flow:

- Each message action button has a contextual accessible name that includes the message role/index action group, so repeated buttons such as copy/delete can be distinguished without changing the visible rail.

Scope:

- `app/components/chat.tsx`: added an optional `ariaLabel` prop to `ChatAction`; extracted `messageLabel` / `messageActionLabel`; kept row labels and action group labels aligned; passed contextual labels to message `Retry`, `Delete`, `Pin`, `Copy`, and optional TTS actions.
- `test/gemini-visual-migration.test.ts`: locked the contextual message action button labels, the `ChatAction` fallback to visible text, and the shared message/action label contract without changing action order, visible labels, icons, click handlers, rail sizes, desktop reveal behavior, mobile always-visible behavior, message rendering, model controls, prompt bar, MCP/Jimeng, attachments, sending, settings, stores, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `ChatAction` still used `aria-label={props.text}` and message buttons did not pass contextual `ariaLabel`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: opened the existing `浏览器相关` recent chat without triggering delete/send. The conversation list had `3` listitems and `2` unique message action groups: `用户消息 2 操作`, `助手消息 3 操作`. First group buttons had contextual labels `用户消息 2 操作：重试`, `用户消息 2 操作：删除`, `用户消息 2 操作：固定`, `用户消息 2 操作：复制`; each remained `34x34`. First group default style remained `opacity: 0`, `pointer-events: none`, `transform: matrix(1, 0, 0, 1, 0, 4)`. Chat input rect `562x40`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: opened the same recent chat through the drawer. Message action group labels remained `用户消息 2 操作`, `助手消息 3 操作`; first group buttons kept contextual labels `用户消息 2 操作：重试/删除/固定/复制` and remained `34x34`. First group remained visible with `opacity: 1`, `pointer-events: auto`, `transform: none`. Chat input rect `246x26`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: opened the same recent chat through the drawer. Message action group labels remained `用户消息 2 操作`, `助手消息 3 操作`; first group buttons kept contextual labels `用户消息 2 操作：重试/删除/固定/复制` and remained `34x34`. First group remained visible with `opacity: 1`, `pointer-events: auto`, `transform: none`. Chat input rect `176x26`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- This iteration only changes accessible names for message action buttons. It does not change visible action text, action order, icons, `onResend`, `onDelete`, `onPinMessage`, `copyToClipboard`, TTS behavior, message content, markdown, image preview/download, scrolling, sending, model APIs, MCP/Jimeng, stores, prompt bar, header, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 prompt-action-selector-state

Result: passed.

Target flow:

- Prompt bar actions that open a secondary selector expose their popup state, while mobile-only direct actions avoid claiming a popup they do not open.

Scope:

- `app/components/chat.tsx`: added optional `ariaHasPopup` and `ariaExpanded` props to `ChatAction`; passed `aria-haspopup="listbox"` and the matching `actionModals.*` expanded state to desktop selector-opening actions for image generation, model, image size, image quality, image style, and plugins. The image generation action now only exposes popup state on non-compact screens because compact screens toggle the mode directly.
- `test/gemini-visual-migration.test.ts`: locked the generic `ChatAction` ARIA forwarding contract, all selector-opening prompt actions, and the compact-screen exception for image generation without changing visible text, order, icons, selector contents, click handlers, prompt layout, MCP/Jimeng, attachments, sending, stores, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `ChatAction` did not support selector popup state.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed again after the first implementation because compact-screen image generation incorrectly exposed popup state.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: opened the prompt bar tool menu without sending/deleting/uploading. Visible selector-opening actions included `图片生成` and `gpt-5.4`, both with `aria-haspopup="listbox"` and `aria-expanded="false"` before opening a selector. Clicking `图片生成` opened its selector state without enabling image generation; the same button changed to `aria-expanded="true"` and kept `aria-pressed="false"`. Menu rect was `336x279` at `x=490`, `y=114`, bottom `393`, right `826`; input rect `478x120`, send button rect `42x42`, `pageOverflowX: 0`, console warn/error logs: `0`.
- Mobile `390x844`: opened the prompt bar tool menu. Visible actions were `上传附件` and `图片生成`; `图片生成` kept `aria-pressed="false"` and did not expose `aria-haspopup` or `aria-expanded` because compact screens toggle the mode directly. Menu rect was `320x158` at `x=11`, `y=609`, bottom `767`, right `331`; input rect `246x28`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.
- Narrow mobile `320x740`: opened the prompt bar tool menu. Visible actions were `上传附件` and `图片生成`; `图片生成` kept `aria-pressed="false"` and did not expose `aria-haspopup` or `aria-expanded`. Menu rect was `272x158` at `x=11`, `y=505`, bottom `663`, right `283`; input rect `176x28`, send button rect `40x40`, `pageOverflowX: 0`, console warn/error logs: `0`.

Known risks:

- Runtime QA only covered selector-opening actions visible under the current default model/config. Static tests cover size, quality, style, and plugin action wiring because those controls are conditional. This iteration does not change selector contents, model selection, image generation enable/disable logic, upload, prompt hints, clear context, theme, realtime chat, sending, scrolling, message rendering, model APIs, MCP/Jimeng, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 prompt-menu-session-header

Result: passed.

Target flow:

- Desktop prompt tool menus visually separate content actions from session actions with matching section headers, so the second group no longer appears as unlabeled controls under the Gemini-style tray.

Scope:

- `app/components/chat.tsx`: added a visible `会话` / `模型和设置` header inside the existing `会话工具` group, reusing the current multimodal section header/title/subtitle classes.
- `test/gemini-visual-migration.test.ts`: locked the prompt menu session section header under `aria-label="会话工具"` without changing action order, visible button text, icons, selector state, click handlers, compact-screen behavior, prompt layout, MCP/Jimeng, attachments, sending, stores, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the `会话工具` section did not render a visible section header.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: created/opened a chat and opened the prompt bar tool menu without sending/deleting/uploading. Menu rect was `336x300` at `x=490`, `y=93`, bottom `393`, right `826`. It rendered two groups: `多模态工具` with `添加内容` / `文件和图片` and `3` buttons, plus `会话工具` with `会话` / `模型和设置` and `2` buttons. Input rect was `478x120`, send button rect `42x42`, `pageOverflowX: 0`.
- Mobile `390x844`: opened the prompt bar tool menu. Compact menu still rendered only `多模态工具` with `添加内容` / `文件和图片` and `2` buttons; the new desktop-only session header was not present. Menu rect was `320x158` at `x=11`, `y=609`, bottom `767`, right `331`. Input rect was `246x28`, send button rect `40x40`, `pageOverflowX: 0`.
- Narrow mobile `320x740`: opened the prompt bar tool menu. Compact menu still rendered only `多模态工具` with `添加内容` / `文件和图片` and `2` buttons; the new desktop-only session header was not present. Menu rect was `272x158` at `x=11`, `y=505`, bottom `663`, right `283`. Input rect was `176x28`, send button rect `40x40`, `pageOverflowX: 0`.

Known risks:

- This iteration only adds visible copy to the existing desktop session action group. It does not change menu positioning, section styles, selector contents, ARIA popup state, model selection, image generation enable/disable logic, upload, prompt hints, clear context, theme, realtime chat, sending, scrolling, message rendering, model APIs, MCP/Jimeng, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 empty-suggestion-affordance

Result: passed.

Target flow:

- Empty-state suggestion buttons read as clickable prompt starters at a glance, while clicking a suggestion still only fills the prompt bar and does not send a message.

Scope:

- `app/components/chat.tsx`: added an `aria-hidden` right-arrow affordance inside each empty-state suggestion button, after the existing suggestion text.
- `app/components/chat.module.scss`: gave the affordance a fixed `18x18` pill treatment and adjusted suggestion button spacing so the added signal does not crowd text or expand past mobile widths.
- `test/gemini-visual-migration.test.ts`: locked the suggestion affordance markup, fixed sizing, hidden accessibility state, and spacing without changing suggestion copy, `applyEmptySuggestion`, input handling, prompt bar actions, attachments, image generation, MCP/Jimeng, sending, stores, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because suggestion buttons did not render `chat-empty-suggestion-affordance`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: empty state rendered `4` suggestion buttons. Each button had visible text plus an `aria-hidden="true"` `→` affordance with rect `18x18`; first button rect was `130x40`, suggestions row rect was `640x40`, input rect was `478x28`, send button rect was `42x42`, `pageOverflowX: 0`. Clicking `总结这段内容` focused `#chat-input`, set input value to `总结这段内容`, hid empty suggestions, kept message item count at `0`, and kept `pageOverflowX: 0`.
- Mobile `390x844`: empty state rendered `4` suggestion buttons in a two-row layout. Each affordance stayed `18x18`; button rects stayed between `124x44` and `150x44`, suggestions rect was `320x96`, input rect was `246x28`, send button rect was `40x40`, message item count was `0`, `pageOverflowX: 0`.
- Narrow mobile `320x740`: empty state rendered `4` suggestion buttons in a two-row layout. Each affordance stayed `18x18`; button rects stayed between `124x44` and `150x44`, suggestions rect was `288x96`, input rect was `176x28`, send button rect was `40x40`, message item count was `0`, `pageOverflowX: 0`.

Known risks:

- This iteration only changes the empty-state suggestion button visual affordance. It does not change `Locale.Chat.EmptySuggestions`, suggestion click behavior, input submission, prompt hints, attachments, image generation, model selection, MCP/Jimeng, message rendering, scrolling, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 sidebar-primary-active-indicator

Result: passed.

Target flow:

- The primary sidebar navigation exposes the current page to assistive tech and shows a clearer active marker, making the left rail easier to scan without changing navigation behavior.

Scope:

- `app/components/sidebar.tsx`: added `aria-current="page"` to the active primary navigation item driven by the existing `location.pathname === item.path` condition.
- `app/components/home.module.scss`: strengthened `.sidebar-nav-item-active` with primary color, `font-weight: 600`, and a `3px` inset active indicator; added `position: relative` and `overflow: hidden` to sidebar nav items for stable active rendering.
- `test/gemini-visual-migration.test.ts`: locked the `aria-current` contract and active nav styling without changing paths, labels, icons, `startNewChat`, `navigate`, mobile drawer logic, history list behavior, settings, prompt bar, MCP/Jimeng, sending, stores, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because primary sidebar nav buttons did not expose `aria-current`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `/new-chat` at `1440x1024`: active primary nav item was `新的聊天` with `aria-current="page"`, `color: rgb(49, 94, 248)`, `font-weight: 600`, and `box-shadow: rgb(49, 94, 248) 3px 0px 0px 0px inset`. Active rect was `275x38`, sidebar rect was `300x1024`, `pageOverflowX: 0`.
- Mobile `/new-chat` at `390x844`: hidden mobile drawer retained the active `新的聊天` state with `aria-current="page"`, primary color, `font-weight: 600`, and the same `3px` inset indicator. Sidebar rect was off-canvas `304x844`, `aria-hidden="true"`, `pageOverflowX: 0`.
- Narrow `/new-chat` at `320x740`: hidden mobile drawer retained the active `新的聊天` state with `aria-current="page"`, primary color, `font-weight: 600`, and the same `3px` inset indicator. Sidebar rect was off-canvas `266x740`, `aria-hidden="true"`, `pageOverflowX: 0`.
- Mobile `/chat` regression at `390x844`: input rect `246x28`, send button rect `40x40`, sidebar drawer remained off-canvas with `aria-hidden="true"`, `pageOverflowX: 0`.
- Narrow `/chat` regression at `320x740`: input rect `176x28`, send button rect `40x40`, sidebar drawer remained off-canvas with `aria-hidden="true"`, `pageOverflowX: 0`.

Known risks:

- `/new-chat` does not render the chat header drawer trigger on mobile, so mobile active-state QA used the off-canvas drawer DOM state and separate `/chat` input/send regression. This iteration does not change navigation destinations, click handlers, history list ordering/deletion, sidebar width, mobile drawer open/close behavior, settings, prompt bar, model selection, MCP/Jimeng, message rendering, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 sidebar-discovery-active-state

Result: passed.

Target flow:

- The sidebar content navigation exposes `发现` as the current page on both plugin discovery routes, matching the existing active visual treatment and assistive-tech state.

Scope:

- `app/components/sidebar.tsx`: added `aria-current="page"` to the existing `发现` button when `location.pathname` is `Path.Plugins` or `Path.McpMarket`.
- `test/gemini-visual-migration.test.ts`: locked the discovery current-page contract against the same `Path.Plugins` / `Path.McpMarket` condition without changing selector opening, MCP probing, navigation destinations, mobile drawer behavior, prompt bar, stores, or API behavior.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the discovery button did not expose `aria-current`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `#/plugins` at `1440x1024`: `发现` rendered once with `aria-current="page"`, active class, `color: rgb(49, 94, 248)`, `font-weight: 600`, and `box-shadow: rgb(49, 94, 248) 3px 0px 0px 0px inset`; button rect `275x38`, sidebar rect `300x1024`, `pageOverflowX: 0`.
- Desktop `#/mcp-market` at `1440x1024`: `发现` retained the same `aria-current="page"`, active class, primary color, `font-weight: 600`, and `3px` inset indicator; sidebar rect `300x1024`, `pageOverflowX: 0`.
- Mobile `#/plugins` at `390x844`: off-canvas sidebar DOM retained active `发现` with `aria-current="page"`, primary color, `font-weight: 600`, and `3px` inset indicator; sidebar rect `300x844` at `x=-390`, `pageOverflowX: 0`.
- Narrow `#/plugins` at `320x740`: off-canvas sidebar DOM retained active `发现` with `aria-current="page"`, primary color, `font-weight: 600`, and `3px` inset indicator; sidebar rect `300x740` at `x=-320`, `pageOverflowX: 0`.
- Mobile `#/chat` regression at `390x844`: input rect `246x28`, send button rect `40x40`, sidebar off-canvas, `pageOverflowX: 0`.
- Narrow `#/chat` regression at `320x740`: input rect `176x28`, send button rect `40x40`, sidebar off-canvas, `pageOverflowX: 0`.
- Browser console warn/error logs: `0`.

Known risks:

- Browser QA used hash routes (`#/plugins`, `#/mcp-market`, `#/chat`) because direct Next paths return the app-level 404 in this project. This iteration does not change `openDiscoverySelector`, `discoveryItems`, `SimpleSelector`, MCP enabled probing, plugin data, navigation parameters, primary nav, local content card, history list behavior, sidebar sizing, mobile drawer logic, prompt bar, model selection, MCP/Jimeng, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 new-chat-mobile-sidebar-trigger

Result: passed.

Target flow:

- Mobile `#/new-chat` keeps the visible `返回` action while exposing it as the mobile sidebar trigger and opening the drawer/backdrop from the new-chat start screen.

Scope:

- `app/components/button.tsx`: added optional ARIA/control props and data marker forwarding to `IconButton`.
- `app/components/new-chat.tsx`: marked the return button as a compact-screen sidebar trigger while preserving `navigate(Path.Home)`.
- `app/components/new-chat.module.scss`: stabilized the compact header so the mobile return trigger remains fully in-viewport and immediately clickable.
- `app/components/home.tsx`, `app/components/home.module.scss`, and `app/components/sidebar.tsx`: passed explicit `isMobileOpen` into sidebar, kept hidden mobile sidebars out of layout with `display: none`, and retained responsive left offset for the shown drawer.
- `app/components/home.module.scss`: added a stronger `.sidebar.sidebar-show` left fallback.
- `test/gemini-visual-migration.test.ts`: locked the button forwarding, new-chat trigger contract, and sidebar open-state wiring.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `IconButton` did not forward mobile trigger ARIA props.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `#/new-chat` at `1440x1024` after reload: composer rect `640x74` at `x=550`, sidebar `300x1024` at `x=0`, return button remained `返回` without mobile trigger attrs, `pageOverflowX: 0`, warn/error `0`.
- Mobile `#/new-chat` at `390x844`: before click return trigger had `aria-controls="mobile-sidebar-drawer"`, `aria-expanded="false"`, `aria-label="查看消息列表"`, trigger rect `77x48` at `y=10`, sidebar `display: none`, `pageOverflowX: 0`. After click hash `#/`, backdrop present, trigger expanded `true`, sidebar `display: flex`, left `0`, rect `304x844` at `x=0`, `pageOverflowX: 0`, warn/error `0`.
- Narrow `#/new-chat` at `320x740`: same contract; sidebar moved from `display: none` to `display: flex`, rect `266x740` at `x=0`, `pageOverflowX: 0`, warn/error `0`.
- Mobile `#/chat` at `390x844`: input `246x28`, send `40x40`, sidebar `display: none`, trigger `aria-expanded=false`, `pageOverflowX: 0`, warn/error `0`.
- Narrow `#/chat` at `320x740`: input `176x28`, send `40x40`, sidebar `display: none`, trigger `aria-expanded=false`, `pageOverflowX: 0`, warn/error `0`.

Known risks:

- Browser QA uses hash routes. No changes to `startChat`, mask selection, confirmation, session creation, model APIs, MCP/Jimeng, attachments, image generation, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 new-chat-header-viewport-stability

Result: passed.

Target flow:

- `#/new-chat` top actions stay fully inside the viewport on desktop, mobile, and narrow mobile, so the return/sidebar entry is not clipped while the start-chat layout and existing behavior remain unchanged.

Scope:

- `app/components/new-chat.module.scss`: made the root `.mask-header` a stable `72px` minimum-height flex row with centered children and no top slide-in animation.
- `test/gemini-visual-migration.test.ts`: fixed the mobile return-trigger contract matcher so it survives formatter line wraps, then locked the root header `min-height`, `align-items`, and `animation` contract.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` first exposed an existing brittle matcher after formatter line wrapping; after tightening that matcher, the new header assertion failed as expected because root `.mask-header` lacked `min-height: 72px`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `#/new-chat` at `1440x1024`: header rect `1140x72` at `y=0`, `min-height: 72px`, `align-items: center`, `animation-name: none`; return button rect `65x44` at `y=14`, fully inside header, no mobile trigger attrs, composer `640x74` at `x=550`, sidebar `300x1024` at `x=0`, `pageOverflowX: 0`, warn/error `0`.
- Mobile `#/new-chat` at `390x844`: header rect `390x68`, return button rect `77x48` at `y=10`, fully inside header, `aria-controls="mobile-sidebar-drawer"`, `aria-expanded="false"`, `aria-label="查看消息列表"`, `data-mobile-sidebar-trigger="true"`, sidebar `display: none`, `pageOverflowX: 0`, warn/error `0`.
- Narrow `#/new-chat` at `320x740`: header rect `316x68`, return button rect `77x48` at `y=10`, fully inside header, same mobile trigger attrs, sidebar `display: none`, `pageOverflowX: 0`, warn/error `0`.
- Mobile `#/chat` at `390x844`: input `246x28`, send `40x40`, mobile sidebar trigger `40x40` with `aria-expanded=false`, sidebar `display: none`, `pageOverflowX: 0`.
- Narrow `#/chat` at `320x740`: input `176x28`, send `40x40`, mobile sidebar trigger `40x40` with `aria-expanded=false`, sidebar `display: none`, `pageOverflowX: 0`.

Known risks:

- Browser QA uses hash routes. This iteration only stabilizes `new-chat` header geometry and a formatter-tolerant test matcher. No changes to `startChat`, `navigate(Path.Home)`, `navigate(Path.Chat)`, `navigate(Path.Masks)`, mask selection, confirmation, model APIs, MCP/Jimeng, attachments, image generation, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 mobile-model-title-surface

Result: passed.

Target flow:

- Mobile `#/chat` header model selector reads as a stable clickable pill with a lightweight surface, clear expanded state, and unchanged model menu behavior.

Scope:

- `app/components/chat.module.scss`: added a subtle surface, border, shadow, blur, hover state, and expanded state to the mobile model title pill.
- `test/gemini-visual-migration.test.ts`: locked the mobile model title surface and expanded-state CSS contract.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `.chat-mobile-model-title` still had `border: 0` and transparent background.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Mobile `#/chat` at `390x844`: model pill rect `89x40` at `x=151 y=14`, `background: rgba(255, 255, 255, 0.78)`, `border-top: 1px solid rgba(60, 64, 67, 0.1)`, `box-shadow: rgba(60, 64, 67, 0.1) 0px 2px 10px`, `backdrop-filter: blur(14px)`, `aria-controls="chat-model-menu"`, `aria-haspopup="dialog"`, `aria-expanded=false`. After click `aria-expanded=true`, expanded background `rgba(255, 255, 255, 0.96)`, focus-ring shadow visible, menu rect `320x227` at `x=35 y=60`, menu inside viewport, input `246x28`, send `40x40`, `pageOverflowX: 0`, warn/error `0`.
- Narrow `#/chat` at `320x740`: model pill rect `89x40` at `x=116 y=14`, same surface/border/shadow/blur and ARIA contract. After click `aria-expanded=true`, menu rect `272x227` at `x=24 y=60`, menu inside viewport, input `176x28`, send `40x40`, `pageOverflowX: 0`, warn/error `0`.
- Desktop `#/chat` at `1440x1024`: desktop model selector present with rect `147x34` at `x=394 y=14`, mobile model title absent, input `478x28`, send `42x42`, `pageOverflowX: 0`, warn/error `0`.

Known risks:

- Browser QA uses hash routes with a query before the hash for fresh page loads. This iteration only changes the mobile model selector surface. No changes to model selection logic, reasoning/image controls, prompt bar, sending, attachments, image generation, MCP/Jimeng, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 mobile-model-menu-selected-state

Result: passed.

Target flow:

- Mobile `#/chat` model menu makes the current model easier to scan after opening the header model selector, without changing model selection behavior or desktop menu treatment.

Scope:

- `app/components/chat.module.scss`: scoped selected-option border, primary text, weight, and inset indicator to `.chat-mobile-model-menu`, while preserving the existing selected background globally.
- `test/gemini-visual-migration.test.ts`: locked the mobile-menu scoped selected-state CSS contract and the transparent border used to avoid selected-state size shifts.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the mobile menu option lacked the transparent border/box sizing contract.
- After a boundary correction, `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed as expected until the new selected-state affordance was scoped under `.chat-mobile-model-menu`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Mobile `#/chat` at `390x844`: trigger `89x40`, menu rect `320x231` at `x=35 y=60`, inside viewport, selected model `✓gpt-5.4OpenAI` rect `292x60`, `background: rgba(25, 103, 210, 0.1)`, `border-top: 1px solid rgba(25, 103, 210, 0.18)`, `color: rgb(49, 94, 248)`, `font-weight: 600`, `box-shadow: rgba(25, 103, 210, 0.55) 3px 0px 0px inset`, input `246x28`, send `40x40`, `pageOverflowX: 0`, warn/error `0`.
- Narrow `#/chat` at `320x740`: trigger `89x40`, menu rect `272x231` at `x=24 y=60`, inside viewport, selected model rect `244x60`, same selected background/border/color/weight/inset indicator, input `176x28`, send `40x40`, `pageOverflowX: 0`, warn/error `0`.
- Desktop `#/chat` at `1440x1024`: desktop menu rect `380x223` at `x=318 y=54`, inside viewport, mobile menu absent, selected model retained only the existing selected background with `border-top-width: 0px`, `box-shadow: none`, `font-weight: 400`, input `478x28`, send `42x42`, `pageOverflowX: 0`, warn/error `0`.

Known risks:

- Browser QA uses hash routes with a query before the hash for fresh page loads. This iteration only scopes stronger selected-state visuals to the mobile model menu. No changes to model/reasoning/image option data, selection handlers, prompt bar, sending, attachments, image generation, MCP/Jimeng, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-16 desktop-model-menu-selected-state

Result: passed.

Target flow:

- Desktop `#/chat` model menu makes the current model easier to scan after opening the desktop model selector, while preserving the mobile menu selected-state and all model selection behavior.

Scope:

- `app/components/chat.module.scss`: scoped desktop model-menu selected-option border, primary text, weight, and inset indicator to `.chat-desktop-model-menu`, while preserving the existing selected background.
- `test/gemini-visual-migration.test.ts`: locked the desktop-menu scoped selected-state CSS contract and transparent border used to avoid selected-state size shifts.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the desktop menu lacked the scoped transparent border and selected-state affordance.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `git diff --check`

Browser QA:

- Desktop `#/chat` at `1440x1024`: desktop trigger `147x34` at `x=394 y=14`, desktop menu rect `380x227` at `x=318 y=54`, inside viewport, mobile menu absent. Selected model `✓gpt-5.4OpenAI` rect `352x60`, `background: rgba(25, 103, 210, 0.1)`, `border-top: 1px solid rgba(25, 103, 210, 0.16)`, `color: rgb(49, 94, 248)`, `font-weight: 600`, `box-shadow: rgba(25, 103, 210, 0.42) 3px 0px 0px inset`, input `478x28`, send `42x42`, `pageOverflowX: 0`, warn/error `0`.
- Mobile `#/chat` at `390x844`: mobile menu rect `320x231` at `x=35 y=60`, inside viewport, selected model retained mobile styling with `border-top: 1px solid rgba(25, 103, 210, 0.18)`, `font-weight: 600`, `box-shadow: rgba(25, 103, 210, 0.55) 3px 0px 0px inset`, input `246x28`, send `40x40`, `pageOverflowX: 0`, warn/error `0`.
- Narrow `#/chat` at `320x740`: mobile menu rect `272x231` at `x=24 y=60`, inside viewport, selected model retained mobile styling, input `176x28`, send `40x40`, `pageOverflowX: 0`, warn/error `0`.

Known risks:

- Browser QA uses hash routes with a query before the hash for fresh page loads. This iteration only scopes stronger selected-state visuals to the desktop model menu. No changes to model/reasoning/image option data, selection handlers, prompt bar, sending, attachments, image generation, MCP/Jimeng, stores, Tauri config, deployment config, or secrets.

## Iteration 2026-06-19 scroll-to-bottom-microinteraction

Result: passed.

Target flow:

- In an existing conversation, scrolling away from the latest message reveals a compact Gemini-style `滚到最新` affordance; it keeps the existing click-to-bottom behavior while adding a clearer pressed state, dark hover treatment, and reduced-motion guard.

Scope:

- `app/components/chat.module.scss`: added active-state compression and shadow, dark hover border/shadow contrast, and a reduced-motion rule that keeps the button centered without hover/press motion.
- `test/gemini-visual-migration.test.ts`: locked the active, dark-hover, and reduced-motion visual contracts without changing scroll detection, message rendering, sending, model APIs, MCP/Jimeng, stores, Tauri config, deployment config, or secrets.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the reduced-motion scroll-button contract was missing.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build` passed after rerunning outside the filesystem sandbox because `tsx` IPC binding is blocked in the sandbox.
- `git diff --check`

Browser QA:

- Desktop `#/chat` at default Browser viewport: opened the existing `浏览器相关` local session, scrolled the message body to `scrollTop: 260`, and verified the button rendered with `aria-label="滚到最新"`, `aria-controls="chat-scroll-body"`, rect `42x42` at `x=769 y=554`, elevated glass background `rgba(255, 255, 255, 0.96)`, primary color `rgb(49, 94, 248)`, blur `18px`, no horizontal overflow, and no console warn/error logs.
- Runtime CSSOM confirmed the loaded CSS Modules rules for `.chat-scroll-to-bottom:hover`, `.chat-scroll-to-bottom:active`, `.dark .chat-scroll-to-bottom:hover`, and the reduced-motion block, including the new active `scale(0.96)` and dark hover shadow.
- Mobile `390x844`: opened the same session from the mobile drawer, scrolled to `scrollTop: 260`, and verified the button rendered as `40x40` at `x=175 y=714`, input rect `246x26`, send rect `40x40`, `pageOverflowX: 0`, and no console warn/error logs.
- Mobile click regression: clicking `滚到最新` completed the scroll to bottom after the animation frame; final `bottomDelta` was approximately `0`, and the button disappeared.

Known risks:

- Browser screenshot capture still times out at `Page.captureScreenshot`, matching earlier project QA limitations. This iteration is verified by Browser DOM/layout metrics, runtime CSSOM, click interaction evidence, console logs, and automated tests instead of screenshot output.

## Iteration 2026-06-19 image-preview-toolbar-polish

Result: passed.

Target flow:

- In an existing image-generation conversation, clicking a generated image opens the full preview overlay; the overlay keeps download and close behavior while making the toolbar feel like a Gemini-style glass control rail across desktop and mobile.

Design direction:

- Creative Production style intake selected: glass rail, floating controls, bounded overlay, soft hover lift, press feedback, reduced-motion safe, dark translucent glass, Google-blue focus, and high-contrast icons.

Scope:

- `app/components/chat.module.scss`: made the image preview `dialog` explicitly fill the viewport, removed UA max-size/margin defaults, converted the toolbar into a translucent blurred rail, added button hover/press transitions, dark-toolbar contrast, and reduced-motion transform suppression.
- `test/gemini-visual-migration.test.ts`: locked the viewport-filling dialog contract, toolbar glass rail styling, button hover/press motion contract, and reduced-motion guard without changing preview open/close, download, message rendering, model APIs, MCP/Jimeng, stores, Tauri config, deployment config, or secrets.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the toolbar lacked the new glass rail padding/border/background/backdrop-filter contract.
- After Browser mobile QA exposed the `dialog` UA sizing issue, `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed again as expected because `.image-preview-mask` did not yet declare `100vw`, `100dvh`, `max-width: none`, `max-height: none`, and `margin: 0`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Browser QA:

- Desktop `#/chat` at `1440x1024`: opened the existing local `日出东方图` conversation, clicked `generated image 1`, and verified the preview mask rect `1440x1024` at `x=0 y=0`, toolbar rect `98x52` at `x=1324 y=18`, background `rgba(31, 31, 31, 0.46)`, border `1px solid rgba(255, 255, 255, 0.18)`, blur `18px saturate(1.25)`, gap `4px`, padding `4px`, two controls at `42x42`, image rect `1392x783`, and `horizontalOverflowPx: 0`.
- Mobile `390x844`: opened the same session from the mobile sidebar, clicked `generated image 1`, and first observed the preview mask constrained to `390x294` at `y=275` by `dialog` defaults. After the viewport contract fix, the mask measured `390x844` at `x=0 y=0`, toolbar rect `102x54` at `x=274 y=14`, buttons `44x44`, image rect `366x206`, and `horizontalOverflowPx: 0`.
- Runtime CSSOM confirmed the loaded toolbar glass styles and button transition contract. Browser pointer hover did not trigger `:hover` reliably in this session, so hover/press motion is verified by CSSOM plus the Jest contract rather than live pointer state.
- Console warn/error logs contained only the pre-existing Next.js LCP warning for the remote generated image URL in the historical session; no new app errors were observed.

Known risks:

- Browser screenshot capture still times out at `Page.captureScreenshot`, matching earlier project QA limitations. This iteration is verified by Browser DOM/layout metrics, runtime CSSOM, click interaction evidence, console logs, and automated tests instead of screenshot output.

## Iteration 2026-06-19 inline-image-card-controls

Result: passed.

Target flow:

- In an existing image-generation conversation, the inline generated image card keeps preview and download behavior while making the download control match the Gemini-style glass media controls used by the full preview overlay.

Design direction:

- Creative Production style intake selected: media card, glass control, bounded corners, reveal-on-hover, press compression, reduced-motion-safe, translucent ink, dark-mode blue edge, and white-icon contrast.

Scope:

- `app/styles/markdown.scss`: upgraded the inline image download control to a blurred glass button, added hover/press/focus states, dark-mode contrast, touch/coarse-pointer/narrow always-visible sizing, and reduced-motion transform suppression.
- `test/gemini-visual-migration.test.ts`: locked the media-card control contract, dark variant, touch/coarse-pointer/narrow visibility override, hover/press transforms, focus ring, and reduced-motion rule without changing preview/download behavior, message rendering, model APIs, MCP/Jimeng, stores, Tauri config, deployment config, or secrets.
- `design-qa.md`: recorded the TDD failures, Browser QA measurements, review result, and validation commands for this slice.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the previous inline download button was still `34px` and lacked the new glass-control contract.
- After Browser mobile QA exposed that the no-hover rule did not win for `opacity` and `transform`, `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed again as expected until the touch/narrow override required `!important`.
- Read-only sub-agent review found no blocking issues. It flagged a low-risk touch-device gap; this was addressed by broadening the media query to `(hover: none), (pointer: coarse), (max-width: 600px)`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Browser QA:

- Desktop `#/chat` at `1440x1024`: opened the existing local `日出东方图` conversation, verified one inline image card with frame rect `722x411` at `x=427 y=768`, image rect `712x401`, no horizontal overflow, card radius `18px`, image radius `14px`, elevated surface shadow, and download control `36x36` with `aria-label="下载原图"`, `opacity: 0`, `pointer-events: none`, `transform: translateY(-4px)`, background `rgba(31, 31, 31, 0.52)`, border `rgba(255, 255, 255, 0.18)`, and `blur(16px) saturate(1.2)`.
- Mobile `390x844`: opened the same session from the mobile sidebar, verified one inline image card with frame rect `284x163`, image rect `276x155`, download control `38x38` with `opacity: 1`, `pointer-events: auto`, `transform: none`, touch/narrow media query matched, and `horizontalOverflowPx: 0`.
- Runtime CSSOM confirmed the loaded `markdown-image-download` base rule, touch/narrow override, dark rule, and reduced-motion rule before the follow-up coarse-pointer broadening. The final coarse-pointer condition is locked by Jest. Browser CUA pointer hover did not trigger `:hover` reliably in this session, so hover/press motion is verified by CSSOM plus the Jest contract rather than live pointer state.

Known risks:

- Browser screenshot capture still times out at `Page.captureScreenshot`, matching earlier project QA limitations. This iteration is verified by Browser DOM/layout metrics, runtime CSSOM, read-only review, and automated tests instead of screenshot output.

## Iteration 2026-06-19 streaming-handoff-polish

Result: passed.

Target flow:

- When an assistant response switches from the waiting skeleton to first streamed text, the handoff keeps the Gemini-style shimmer continuity while avoiding layout shift, abrupt surface flash, or persistent motion after content appears.

Design direction:

- Creative Production style intake selected: soft handoff, low latency, reveal sweep, reduced-motion safe, thin prism glow, no layout shift, content-first, dark-mode balanced, CSS-only, no API semantics, and browser-verifiable.

Scope:

- `app/components/chat.module.scss`: added a short surface handoff animation, softened the shimmer fade path, lengthened the first-text reveal to a calmer cubic-bezier curve, and disabled the new surface/shimmer/text animations under reduced motion.
- `test/gemini-visual-migration.test.ts`: locked the streaming handoff keyframe, timing curve, shimmer fade timing, text reveal timing, and reduced-motion stop without changing message streaming semantics, model APIs, MCP/Jimeng, stores, account/sync, Tauri config, deployment config, or secrets.
- `design-qa.md`: recorded the design direction, Browser QA, screenshot limitation, review result, and validation commands for this slice.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the previous streaming reveal state had no `streamingSurfaceHandoff` keyframe or surface animation contract.
- Read-only sub-agent review found no blocking issues. It flagged a low-risk test gap around the shimmer `::after` layout contract; this was addressed by locking absolute positioning, full inset, layer order, pointer safety, and the final transparent shimmer state in Jest.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Browser QA:

- Desktop default viewport at `http://localhost:3000/?qa=streaming-handoff`: page rendered with NeatChat shell, recent chats, empty-chat suggestions, and composer visible; control console had no warn/error entries. Runtime CSSOM confirmed hashed loaded rules for `streamingSurfaceHandoff`, `streamingShimmerFade`, `streamingTextReveal`, `.chat-message-streaming-reveal`, the shimmer `::after`, markdown-body reveal, and the reduced-motion stop.
- Mobile `390x844`: after the normal client-side hydration step, the chat screen rendered with composer and suggestions visible, `horizontalOverflowPx: 0`, the streaming handoff keyframe loaded, the reduced-motion stop loaded, and control console had no warn/error entries.
- Live API streaming was not invoked because this slice is CSS-only and must not require real accounts/API keys. The transient streaming visual state is verified through source tests plus Browser CSSOM on the running app.

Known risks:

- Browser screenshot capture still times out at `Page.captureScreenshot`, matching earlier project QA limitations. This iteration is verified by Browser DOM/layout metrics, runtime CSSOM, console logs, read-only review, and automated tests instead of screenshot output.

## Handoff Audit 2026-06-19 commits-since-8b7

Scope:

- Reviewed `git log --reverse 8b7da1a7e30221c0a1a6ff55a50cadd295624267^..HEAD` through `9aefcdcf`, plus the current R2 dropzone clarity working-tree slice.
- Confirmed the handoff's base R1-R6 commits are present locally and that later commits continued the same Gemini UI migration rather than reverting those surfaces.

Coverage result:

- R1 rainbow shimmer loading: covered by `8b7da1a7`, then refined by `cbe21a21`, `19c44289`, `3b3a6901`, `80d7c88e`, `f0627d1b`, and `9aefcdcf`. Current source keeps the empty-content waiting shimmer, streaming reveal class, dark reveal, reduced-motion guards, and source tests for the handoff from skeleton to first text.
- R2 multimodal drag/drop: covered by `bb30c490`, then hardened by `b6094f12`, `8518cff9`, `8e103d37`, `58880aff`, `f38366fa`, and this current slice. Current source keeps file-only drag activation, full-screen glass dropzone, live status, attachment strip semantics, touch delete affordance, and explicit drop guidance/limits without changing upload limits.
- R3 starting-style motion: covered by `afdc9a0a`, then strengthened by keyboard/focus work in `a8947361`, `47928847`, `7ebbaaca`, and related model/tools menu accessibility iterations. The old Safari fallback remains the documented CSS graceful-degradation tradeoff; no JS animation dependency was introduced.
- R4 markdown code/table typography: covered by `5e91acff`, then completed by `1d9db257`, `b70624f3`, `f720c911`, `ce299502`, `8fdcbd8d`, `65c62aa9`, `7a3f60a0`, `e1b81fa1`, `cadd52ff`, `22897f0e`, `37c40219`, and `2d9e4e72`. Current tests lock language labels, copy-button safe spacing, inline code, images, blockquotes, list rhythm, headings, links, and table surfaces.
- R5 sidebar glass and scrollbar: covered by `9302e519`, then refined by `28b7b3e6`, `423a77aa`, `53dba00b`, `b3ddbf3d`, and sidebar active-state/delete/focus iterations. Current source keeps desktop glass, mobile/dark drawer surface, cross-browser scrollbar rules, current-state indicators, and bounded drawer layout.
- R6 engineering cleanup: covered by `e2d3d8a7`, `8641a9b8`, and `e81b13f2`; later local hygiene kept `.agents/`, `.codex/`, plans, screenshots, and scratch artifacts out of committed scope. No model config semantics, account/secret/sync, production, deployment, or backend logic changes were required for the reviewed UI slices.

Remaining non-blocking boundaries:

- Real native file picker and OS-level file drag payloads are not automated in Browser because they require OS chooser / real file payload control. Source review and Jest source contracts cover limits and guards, while Browser validates rendered state, CSSOM, overflow, console, and non-file drag guard.
- Old Safari parity for `@starting-style` remains a deliberate graceful-degradation decision from the handoff; adding JS animation fallback or a motion dependency would cross the current pause condition for new dependency / broader module changes.

## Iteration 2026-06-19 dropzone-limit-hint

Result: passed.

Target flow:

- Dragging files over the chat surface shows the existing Gemini-style glass dropzone while making the next action and upload limits explicit: release to add to the input, up to 3 images and 5 files.

Design direction:

- Creative Production style intake selected: multimodal clarity, glass panel, limit-aware copy, content-first, reduced-motion safe, dark-mode balanced, no layout shift, CSS-only plus copy, and browser-verifiable.

Scope:

- `app/components/chat.tsx`: updated the dropzone live status and visible panel copy to explain release behavior and the existing 3-image / 5-file limits.
- `app/components/chat.module.scss`: added a compact centered hint style with light/dark contrast, without changing the dropzone positioning, pointer-events, drag activation, file limits, upload processing, MCP/Jimeng, model behavior, stores, account/sync, Tauri config, production config, deployment config, or secrets.
- `test/gemini-visual-migration.test.ts`: locked the new live status copy, visible hint hook, hint typography, light/dark colors, and existing file-only drag guard.
- `design-qa.md`: recorded the handoff audit, design direction, Browser QA, screenshot limitation, review result, and validation commands for this slice.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the previous dropzone had no limit-aware hint or expanded live status copy.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Browser QA:

- Desktop default viewport at `http://localhost:3000/?qa=dropzone-clarity#/chat`: after hydration, the app rendered the NeatChat shell and composer with `horizontalOverflowPx: 0` and no console warn/error logs. Runtime CSSOM confirmed `.chat-dropzone-hint` and the dark hint color rule. Runtime DOM measured the hidden overlay as `data-drop-active="false"`, `aria-hidden="true"`, `opacity: 0`, `pointer-events: none`, rect `980x720`, and the hint as `251x18` with `font-size: 13px`, `line-height: 18.85px`, `color: rgba(95, 99, 104, 0.92)`, `text-align: center`, and `max-width: 280px`.
- Non-file Browser drag gesture from page coordinates did not activate the dropzone: `data-drop-active` stayed false, live status text stayed empty, overlay opacity stayed `0`, and `horizontalOverflowPx` stayed `0`.
- Mobile `390x844`: after the normal client-side hydration step, the chat screen rendered with `horizontalOverflowPx: 0` and no console warn/error logs. The hidden overlay measured `390x844`, content measured `336x191`, and the hint measured `251x18`, inside the viewport.
- Browser screenshot capture still times out at `Page.captureScreenshot`, matching earlier project QA limitations. This iteration is verified by Browser DOM/layout metrics, runtime CSSOM, non-file drag guard, console logs, read-only review, and automated tests instead of screenshot output.

Known risks:

- Browser cannot supply a real OS file payload for drag/drop in this environment. Existing source review and Jest source contracts cover file-only activation, accepted file limits, and drop guards; Browser covered visible/runtime CSS, layout bounds, console health, and non-file drag non-activation.

## Iteration 2026-06-19 rendered-file-attachment-card

Result: passed.

Target flow:

- File blocks rendered inside AI/user Markdown responses appear as compact Gemini-style attachment capsules, remain keyboard accessible, preserve click-to-copy behavior, and no longer rely on a `file://` Markdown URL that `react-markdown` sanitizes away.

Design direction:

- Creative Production style intake selected: compact elevated row, content-first capsule, subtle Google-blue accent, dark-mode balanced, keyboard focus ring, active press feedback, metadata chips, mobile full-width safe, reduced-motion safe, no new dependencies, and no backend/model semantics changes.

Scope:

- `app/components/file-attachment.tsx`: added a formatted size label, accessible attachment label, interactive class hook, keyboard-safe click behavior, metadata chips, and inline-safe `span` structure so the card can render inside Markdown paragraphs without invalid DOM nesting.
- `app/components/file-attachment.module.scss`: replaced the old gray block with an elevated grid capsule, light/dark surfaces, focus ring, hover/active feedback, mobile/coarse-pointer bounds, and reduced-motion guard.
- `app/components/markdown.tsx`: changed the internal generated attachment href from `file://...` to `#neatchat-file-attachment?...` so `react-markdown` default URL sanitization still routes to the custom attachment renderer; the original file block detection and copy-source lookup remain unchanged.
- `test/gemini-visual-migration.test.ts`: locked the visual contract for the rendered file attachment capsule and the internal hash-based attachment href path.
- `test/markdown-file-attachment.test.tsx`: added render-level coverage that a raw `文件名/类型/大小/正文` block becomes a clickable attachment card, click copies the original body, no `file://` link remains, and unsafe `javascript:` links are still downgraded to text.

Automated checks:

- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the previous file attachment card had no Gemini capsule contract and still depended on `file://`.
- `yarn test:ci --runTestsByPath test/markdown-file-attachment.test.tsx --runInBand` initially exposed a React DOM nesting warning from rendering `div` inside Markdown `p`; the component was converted to inline-safe `span` structure and the test then passed without warnings.
- Read-only sub-agent review found no blocker. It flagged a P3 gap that the first pass over-relied on source/CSS string contracts; this was addressed by adding the render-level file attachment behavior test.
- `yarn test:ci --runTestsByPath test/markdown-file-attachment.test.tsx test/gemini-visual-migration.test.ts --runInBand`

Browser QA:

- Desktop default viewport: a real local Markdown file-block message rendered one attachment card with `role="button"`, `tabindex="0"`, `aria-label="文件附件：Gemini-UX-audit.pdf，application/pdf，24.00 KB。点击复制文件内容。"`, `display: grid`, `grid-template-columns: 36px ...`, `border-radius: 14px`, light gradient surface, filename `Gemini-UX-audit.pdf`, metadata `24.00 KB` and `application/pdf`, and no console warn/error logs.
- Clicking the card showed the existing `文件内容已复制到剪贴板` toast. The Browser-isolated clipboard read returned empty, so copy payload correctness is covered by `test/markdown-file-attachment.test.tsx`.
- Mobile `390x844`: the same card stayed inside the viewport with `rootMaxWidth: 100%`, no transform on touch/coarse-pointer rules, and filename overflow bounds intact.
- Browser screenshot capture still times out at `Page.captureScreenshot`, matching earlier project QA limitations. This iteration is verified by Browser DOM/CSSOM/layout metrics, console logs, render-level tests, source/CSS contracts, read-only review, and automated checks instead of screenshot output.

Known risks:

- The Browser sample message path can trigger the app's normal model proxy if sent as a real chat prompt. Further verification avoided relying on live model/API behavior; no model config, account/secret/sync, production, deployment, upload, or backend logic was changed.

## Iteration 2026-06-19 token-metadata-chip

Result: passed.

Target flow:

- Completed Markdown responses show token count and optional first-response latency as a quiet Gemini-style metadata chip, adjacent to message content instead of floating under it, while preserving the existing token count and `first_char_delay_*` localStorage semantics.

Design direction:

- Creative Production style intake selected: quiet metadata capsule, content-adjacent placement, subtle Google-blue focus, dark-mode readable surface, hover/click latency reveal, keyboard state, reduced-motion safe, mobile wrap-safe, and no model/API/storage semantic changes.

Scope:

- `app/components/markdown.tsx`: added explicit pressed/expanded state attributes for the existing token info button and reused the existing hover/click state to reveal first-response latency.
- `app/styles/markdown.scss`: changed `.markdown-body-container` into a column flow and replaced the old transparent absolute-positioned token text with a small elevated capsule, dark-mode variant, mobile wrapping, focus ring, and reduced-motion guard.
- `test/markdown-performance.test.tsx`: added render-level coverage for token count, delayed latency reveal, `aria-pressed`, `data-token-info-expanded`, and unchanged `encode(content)` use.
- `test/gemini-visual-migration.test.ts`: locked the non-overlapping chip layout, no legacy `bottom: -28px`, dark/mobile/reduced-motion rules, and state hooks.
- No model config semantics, account/secret/sync, production config, deployment config, upload limits, backend logic, token math, or localStorage keys were changed.

Automated checks:

- `yarn jest test/markdown-performance.test.tsx test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the old token info button lacked `aria-pressed`, `data-token-info-expanded`, and the new chip style contract.
- `npx tsc --noEmit` then caught the `firstCharDelay` nullable narrowing issue; the UI text was refactored through `tokenFirstCharDelay` / `tokenDelayText` without changing runtime behavior.
- Read-only sub-agent review found no blocking issues. Its Browser visual-regression concern was covered by the desktop/mobile/narrow Browser checks below; its accessible-name suggestion remains a non-blocking follow-up.
- `yarn jest test/markdown-performance.test.tsx test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/markdown-performance.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: opened the existing local `测试消息` conversation from recent chats without sending any prompt. Browser measured 3 `.token-info` buttons, the first chip as `position: static`, `display: flex`, `align-self: flex-end`, `min-height: 26px`, `border-radius: 999px`, `aria-pressed="false"`, `data-token-info-expanded="false"`, container `display: flex`, `flex-direction: column`, `gap: 6px`, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Desktop empty chat route before opening history had no token DOM, as expected, but runtime CSSOM confirmed the loaded token chip base rule, dark rule, mobile rule, reduced-motion rule, and absence of legacy `bottom: -28px`.
- Mobile `390x844`: opened the same existing local conversation from the mobile drawer. Browser measured 3 token chips, first chip `position: static`, `align-self: flex-start`, `white-space: normal`, `overflow-wrap: anywhere`, `min-height: 26px`, input panel `370px` wide inside the viewport, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Narrow mobile `320x740`: first chip stayed `position: static`, `align-self: flex-start`, `white-space: normal`, `overflow-wrap: anywhere`; input panel stayed within `left: 10`, `right: 310`, and `horizontalOverflowPx: 0`.

Known risks:

- The token chip accessible name remains the fixed `Token 信息`; screen readers get the button state via `aria-pressed` but not the current token/latency value in the accessible name. This is not a regression from the previous fixed label and can be addressed in a future accessibility-focused slice.
- Browser screenshots were not used for this iteration. DOM/layout metrics, runtime CSSOM, console logs, source contracts, render-level tests, read-only review, and production build cover the targeted behavior.

## Iteration 2026-06-19 clear-context-divider

Result: passed.

Target flow:

- The clear-context divider appears as a compact Gemini-style reversible status chip, remains visible above the fixed composer on desktop and mobile, and preserves the existing `clearContextIndex` set/revert semantics.

Design direction:

- Creative Production style intake selected: quiet status capsule, explicit reversible action, subtle Google-blue status mark, light/dark readable surface, focus ring, reduced-motion safe, narrow-screen safe, and no model/API/account/sync/deploy/backend semantic changes.

Scope:

- `app/components/chat.tsx`: converted `ClearContextDivider` to a ref-forwarding button with explicit `aria-label` and title, kept revert behavior as `session.clearContextIndex = undefined`, and added one-shot clear-context reveal logic that scrolls the divider into view after clearing or loading an already-cleared session without repeatedly stealing scroll on the same clear key.
- `app/components/chat.tsx`: added a composer panel ref, dynamic bottom inset calculation from actual composer height, and a `ResizeObserver`/window resize reveal guard so mobile divider positioning adapts when the composer height changes.
- `app/components/chat.module.scss`: replaced the masked horizontal divider with an elevated pill, added status/revert sub-elements, dark/mobile/reduced-motion rules, scroll margins, and narrow-screen spacing so the divider does not hide behind the composer.
- `test/gemini-visual-migration.test.ts`: locked the new divider structure, accessibility hooks, non-legacy CSS, scroll/reveal behavior, mobile/narrow bounds, reduced-motion behavior, and unchanged clear/revert state writes.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected on the missing Gemini-style divider contract.
- Follow-up red tests exposed the persisted/narrow clear-state overlap path; implementation added `scrollIntoView`, `scroll-margin-bottom`, safe visibility checks, and a resize reveal guard.
- Read-only sub-agent review found no P0/blocker but flagged two real risks: repeated same-key scroll stealing and fixed mobile `118px` composer inset. Both were addressed with an unconditional same-key guard, actual composer-height inset calculation, and a composer `ResizeObserver`.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`

Browser QA:

- Desktop `1440x1024`: existing local `测试消息` conversation showed one divider with `aria-label="上下文已清除，恢复上下文"`, `title="恢复上下文"`, `display: flex`, `justify-content: center`, `gap: 10px`, `border-radius: 999px`, `scroll-margin-bottom: 96px`, no horizontal overflow, about `137px` gap above the input panel, and no console warn/error logs.
- Desktop CUA click on the divider center restored context and removed the divider (`dividerCount: 0`), confirming the revert click path still clears `session.clearContextIndex`.
- Mobile `390x844`: CUA opened the chat tool menu, clicked visible `清除上下文`, and produced one divider with `justify-content: flex-start`, `width: 298px`, `scroll-margin-bottom: 118px`, about `40px` gap above the input panel, no horizontal overflow, and no console warn/error logs. After the dynamic-inset fix, a real viewport resize rechecked the same path with `gapToInputPanelPx: 40.21`.
- Mobile `390x844` with locator-filled multi-line input: React accepted a `38` character multi-line value, the composer stayed at the current mobile collapsed `78px` height, and the divider remained visible with no horizontal overflow.
- Narrow mobile `320x740`: after the dynamic-inset fix, the resize reveal guard left about `107px` gap above the input panel, `width: 228px`, `margin-bottom: 88px`, `scroll-margin-bottom: 118px`, no horizontal overflow, and no console warn/error logs.

Known risks:

- Browser's direct `window.location.reload`/URL navigation APIs are restricted in the in-app Browser evaluate sandbox, so persisted-load behavior was verified through component-level source contracts, target tests, manual `scrollIntoView` behavior, and a real viewport resize path rather than a full Browser reload. The underlying mount path uses the same ref and `scrollIntoView` code.
- Browser evaluate also blocks direct DOM mutation helpers such as synthetic `setAttribute` on the composer panel, so the high-composer risk is covered by code-level dynamic inset/ResizeObserver contracts plus real mobile input fill metrics rather than an artificial tall-panel Browser mutation.

## Iteration 2026-06-19 token-chip-accessible-name

Result: passed.

Target flow:

- Completed Markdown responses expose the token metadata chip as a compact visual capsule and as a meaningful screen-reader control: the accessible name includes the current token count, and includes first-response latency when that value exists, without changing visible chip text or token/latency semantics.

Design direction:

- Creative Production style intake selected: keep the quiet Gemini-style metadata capsule from the prior slice, improve assistive clarity in place, preserve locale-derived token and latency copy, avoid visual churn, remain mobile wrap-safe, and keep model/API/storage/backend behavior untouched.

Scope:

- `app/components/markdown.tsx`: derived `tokenCountText` and `tokenInfoLabel` from the existing `tokenInfo.count` and `tokenDelayText`, then wired the token chip to `aria-label={tokenInfoLabel}`. The visible button text still toggles between token count and latency exactly as before.
- `test/markdown-performance.test.tsx`: added render-level coverage that token chips with and without stored first-char delay expose accessible names containing the current values, while retaining `aria-pressed`, `data-token-info-expanded`, and unchanged `encode(content)` behavior.
- `test/gemini-visual-migration.test.ts`: locked the source contract against returning to a fixed `aria-label="Token 信息"` while avoiding an overly brittle exact implementation-string assertion after read-only review.
- Closed the prior `token-metadata-chip` known risk where the chip accessible name remained the fixed `Token 信息`.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, token math, localStorage keys, upload limits, or visible chip layout were changed.

Automated checks:

- `yarn jest test/markdown-performance.test.tsx --runInBand` failed first as expected because the existing button still exposed only the fixed accessible name `Token 信息`.
- `yarn jest test/markdown-performance.test.tsx test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/markdown-performance.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- Read-only sub-agent review found no blocking issues. It flagged one P3 brittle static-test concern, which was addressed by removing the exact array/join implementation assertion.
- Post-review: `yarn jest test/markdown-performance.test.tsx test/gemini-visual-migration.test.ts --runInBand`
- Post-review: `npx tsc --noEmit`
- `git diff --check`

Browser QA:

- Desktop `1440x1024`: opened the existing local `测试消息` conversation without sending any prompt. Browser measured 3 token chips with labels `Token 信息，14 Tokens`, `Token 信息，82 Tokens`, and `Token 信息，60 Tokens，首字延迟: 1829ms`; each chip stayed `position: static`, `display: flex`, `min-height: 26px`, `aria-pressed="false"`, `data-token-info-expanded="false"`, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Desktop interaction: clicked the delayed chip. Visible text changed to `首字延迟: 1829ms`, `aria-pressed` and `data-token-info-expanded` changed to `true`, and the accessible name still retained both `60 Tokens` and `首字延迟: 1829ms`.
- Mobile `390x844`: the same local conversation rendered 3 token chips; all accessible names included their visible token text, no chip had the fixed-only label `Token 信息`, mobile styles stayed `align-self: flex-start`, `white-space: normal`, `overflow-wrap: anywhere`, input panel stayed within `left: 10`, `right: 380`, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Narrow mobile `320x740`: the same checks passed with input panel within `left: 10`, `right: 310`, all labels including visible token text, no fixed-only label, and no horizontal overflow.
- Empty chat routes in desktop/mobile/narrow viewports had no token DOM, as expected, while runtime CSSOM confirmed the existing token chip base/dark/mobile/reduced-motion rules remained loaded and the legacy `bottom: -28px` offset did not return.

Known risks:

- Browser QA used existing local conversation data instead of sending a real prompt, to avoid model/API/account dependencies. Render-level tests cover deterministic token and latency accessible-name values.
- Browser screenshots were not used for this iteration. DOM/ARIA/layout metrics, runtime CSSOM, console logs, render-level tests, read-only review, type/lint checks, and production build cover the targeted behavior.

## Iteration 2026-06-19 markdown-code-fold-control

Result: passed.

Target flow:

- Long AI-rendered Markdown code blocks keep the existing 400px collapsed preview, but the expand affordance now reads as a Gemini-style bottom action, exposes a clear accessible name, points to the controlled code block, and disappears after expanding without changing copy, language labels, Mermaid/HTML preview, token count, or code-fold semantics.

Design direction:

- Creative Production style intake selected: code-first reading surface, subtle bottom gradient, compact pill action, light/dark contrast, keyboard focus clarity, reduced-motion safe hover, and no model/API/storage/backend behavior changes.

Scope:

- `app/components/markdown.tsx`: added a stable `useId()` code block id and wired the existing one-way expand button with `aria-label`, `aria-controls`, and `aria-expanded`; visible copy still uses existing `Locale.NewChat.More`, and clicking still only changes the collapsed `maxHeight` from `400px` to `none`.
- `app/styles/markdown.scss`: styled `.show-hide-button` as a sticky bottom gradient action strip inside `pre`, added light/dark button surfaces, focus/hover states, explicit `margin: 0` to override old global button margins, and reduced-motion suppression.
- `app/locales/cn.ts` / `app/locales/en.ts`: added `CodeBlockExpand` accessible-label copy.
- `test/markdown-code-fold.test.tsx`: added render-level coverage for long code blocks, `aria-controls`, `aria-expanded`, controlled code id, collapsed `maxHeight: 400px`, click-to-expand, and button removal after expansion.
- `test/gemini-visual-migration.test.ts`: locked the Markdown code block chrome contract, bottom action strip CSS, dark/reduced-motion rules, and margin reset against global button styles.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, token math, localStorage keys, upload limits, copy-code behavior, Mermaid rendering, HTML preview, or code language labels were changed.

Automated checks:

- `yarn jest test/markdown-code-fold.test.tsx test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the old button only exposed `Find More` with no controls/expanded state and no new style contract.
- `yarn jest test/markdown-code-fold.test.tsx test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/markdown-code-fold.test.tsx test/markdown-code-language.test.tsx test/markdown-performance.test.tsx test/markdown-file-attachment.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only sub-agent review found one P2 issue: the new button could inherit old global `margin-top: 3em` / `margin-bottom: 4em` from `globals.scss`. This was fixed with explicit `margin: 0` in the local button rule and a migration-test assertion.
- Post-review checks passed: `yarn jest test/markdown-code-fold.test.tsx test/gemini-visual-migration.test.ts --runInBand`, full related `test:ci` matrix, `yarn lint`, `npx tsc --noEmit`, `yarn build`, and `git diff --check`.

Browser QA:

- Desktop `1440x1024`: runtime CSSOM confirmed the new local `.markdown-body pre .show-hide-button button` rule includes `min-height: 32px`, `margin: 0px`, `border-radius: 999px`, zero letter spacing, and the reduced-motion rule. Runtime also confirmed no horizontal overflow and no console warn/error logs.
- Desktop CSSOM also confirmed the old global `pre .show-hide-button button` rule still exists, but is overridden by the more specific Markdown rule with `margin: 0px`.
- Existing local history items checked (`测试消息`, `浏览器相关`, `能力介绍`, `主题提取要求`) did not contain code blocks, so no live persisted long-code message was available without creating or sending new content.
- Empty desktop/mobile/narrow routes verified CSSOM loading and no horizontal overflow; the actual long-code expand interaction is covered by `test/markdown-code-fold.test.tsx` to avoid writing test data into user history or triggering model/API requests.

Known risks:

- Browser QA did not click a live persisted long-code block because current local history has no code-block messages and creating one would mutate user data or risk model/API paths. Render-level tests cover the real Markdown component behavior for a deterministic long TypeScript block.
- Browser screenshots were not used for this iteration. DOM/CSSOM metrics, console logs, render-level tests, source/CSS contracts, read-only review, lint/type checks, and production build cover the targeted behavior.

## Iteration 2026-06-19 markdown-code-copy-feedback

Result: passed.

Target flow:

- AI-rendered Markdown code blocks keep the existing copy affordance, but copying now gives a short-lived Gemini-style success state with a check icon, green-tinted light/dark surface, and an updated accessible label before returning to idle.

Design direction:

- Creative Production style intake selected: keep the code block chrome quiet, make copy success visible without moving layout, use Google-green feedback color sparingly, preserve hover/mobile visibility rules, and avoid any model/API/account/sync/deploy/backend behavior changes.

Scope:

- `app/components/markdown.tsx`: added a local copied state, reset timer cleanup, copied/idle `aria-label`, `data-copy-state`, and `ConfirmIcon` swap for the existing code-copy button. The copied state resets after `1400ms`; repeated clicks clear the previous timer before starting a new one.
- `app/styles/globals.scss`: added light/dark copied-state button styling and a copied-only SVG fill override so the filled confirm icon inherits the current success color without changing the idle copy icon shape.
- `test/markdown-code-language.test.tsx`: added render-level coverage for clicking the code-copy button, the temporary copied accessible label/state, and reset back to idle.
- `test/gemini-visual-migration.test.ts`: locked the source/CSS contract for the copied state, timer cleanup, `data-copy-state`, confirm icon usage, light/dark success colors, and copied-only SVG fill override.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, token math, localStorage keys, upload limits, copy payload selection, Mermaid rendering, HTML preview, or code language labels were changed.

Automated checks:

- `yarn jest test/markdown-code-language.test.tsx --runInBand` failed first as expected because the old copy button had no temporary `已复制 ... 代码` state.
- Post-review `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected after adding the SVG-fill contract, because the copied state did not yet override the filled confirm icon's inline `fill:#333`.
- `yarn jest test/gemini-visual-migration.test.ts test/markdown-code-language.test.tsx --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/markdown-code-language.test.tsx test/markdown-code-fold.test.tsx test/markdown-performance.test.tsx test/markdown-file-attachment.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only sub-agent review found one real P2 issue: the filled `ConfirmIcon` could keep its inline `fill:#333` instead of inheriting copied-state green. This was fixed with a copied-only `svg path { fill: currentColor !important; }` rule and a migration-test assertion.
- The review also noted a P3 limitation: `copyToClipboard` is a project-wide async helper that reports failure through toast but does not return a success boolean. This slice intentionally preserves that global API shape and keeps the copied state optimistic, matching the existing app copy behavior.
- Post-review checks passed: targeted Jest, full related `test:ci` matrix, `yarn lint`, `npx tsc --noEmit`, `yarn build`, and `git diff --check`.

Browser QA:

- Desktop `1440x1024`: opened the local chat route without sending a prompt. Current local history had no code block DOM, as expected; runtime CSSOM confirmed the copied-state rule and dark copied-state rule were loaded, the chat input stayed within viewport bounds, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Mobile `390x844`: opened the same route without sending a prompt. Runtime CSSOM confirmed the copied-state and touch-visible copy-button rules were loaded, the input stayed within viewport bounds, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Narrow mobile `320x740`: repeated the route check with the same CSSOM confirmations, input bounds, `horizontalOverflowPx: 0`, and no console warn/error logs.

Known risks:

- Browser QA did not click a live persisted code-copy button because current local history has no code-block messages and creating one would mutate user data or risk model/API paths. Render-level tests cover the real `PreCode` click/reset behavior for a deterministic TypeScript block.
- The copied state remains optimistic because the existing `copyToClipboard` helper does not expose success/failure to callers. Changing that helper would affect many app copy paths and is outside this narrow UI slice.

## Iteration 2026-06-19 markdown-code-copy-live-label

Result: passed.

Target flow:

- AI-rendered Markdown code blocks keep the existing copy button visual treatment, but the icon-only copy control now exposes the same `复制 ... 代码` / `已复制 ... 代码` state through a native tooltip and polite live label so keyboard and assistive users get clearer feedback.

Design direction:

- Creative Production style intake selected: no visual churn, preserve the quiet Gemini-style code chrome, make the copied state more perceivable, avoid layout movement, keep the existing optimistic copy behavior, and do not change model/API/account/sync/deploy/backend semantics.

Scope:

- `app/components/markdown.tsx`: added `title={codeCopyLabel}`, `aria-live="polite"`, and `aria-atomic="true"` to the existing Markdown code-copy button. The title and accessible label are derived from the same `codeCopyLabel`, so initial and copied states stay in sync.
- `test/markdown-code-language.test.tsx`: locked the initial tooltip for normal and qualified code languages, the live-region attributes, and the copied-state tooltip.
- `test/gemini-visual-migration.test.ts`: locked the source contract so future code-block chrome changes keep the copy button's tooltip/live attributes.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, token math, localStorage keys, upload limits, copy payload selection, copied timer behavior, copied icon styling, Mermaid rendering, HTML preview, code folding, or code language labels were changed.

Automated checks:

- `yarn jest test/markdown-code-language.test.tsx --runInBand` failed first as expected because the old icon-only copy button had no `title`, `aria-live`, or `aria-atomic`.
- `yarn jest test/markdown-code-language.test.tsx --runInBand`
- `yarn jest test/markdown-code-language.test.tsx test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/markdown-code-language.test.tsx test/markdown-code-fold.test.tsx test/markdown-performance.test.tsx test/markdown-file-attachment.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`

Review:

- Read-only sub-agent review found no blocking issues. It noted that some screen readers may announce `aria-label` changes on a focusable live-region button less consistently than a separate `role="status"` node; this slice keeps the change narrow and avoids adding hidden DOM or altering copy behavior.
- The review also noted that tests do not explicitly assert the timer-reset tooltip after copied state. The implementation uses the same `codeCopyLabel` for `aria-label` and `title`, and the reset accessible name is covered by the copied-state timer test.

Browser QA:

- Desktop `1440x1024` at `/`: page rendered with title `NeatChat`, composer input `left: 563`, `right: 1137`, panel `left: 490`, `right: 1250`, no framework overlay, `horizontalOverflowPx: 0`, copied-state CSS loaded, and code-language ellipsis CSS loaded.
- Mobile `390x844` at `/#/chat`: composer input `left: 67`, `right: 313`, panel `left: 10`, `right: 380`, no framework overlay, `horizontalOverflowPx: 0`, copied-state CSS loaded, and code-language ellipsis CSS loaded.
- Narrow mobile `320x740` at `/#/chat`: composer input `left: 67`, `right: 243`, panel `left: 10`, `right: 310`, no framework overlay, `horizontalOverflowPx: 0`, copied-state CSS loaded, and code-language ellipsis CSS loaded.
- Browser log reads retained one unscoped `Event` error with the same timestamp across fresh tabs. No Next overlay rendered and no distinct new warn/error entry was observed during the stable-route checks, but this iteration is not recorded as console-clean because that buffered entry is still present.

Known risks:

- Browser QA did not click a live persisted code-copy button because current local history has no code-block messages and creating one would mutate user data or risk model/API paths. Render-level tests cover the real `PreCode` tooltip/live-label behavior for deterministic code blocks.
- A separate hidden status node may be more consistently announced by every screen reader, but that would add DOM and state plumbing beyond this narrow copy-button affordance slice.

## Iteration 2026-06-19 markdown-code-copy-status-node

Result: passed.

Target flow:

- AI-rendered Markdown code blocks keep the existing copy button visual treatment, tooltip, copied state, and optimistic copy behavior, but copied feedback is now also exposed through a dedicated visually hidden `role="status"` node outside the native button so assistive announcements do not depend only on the focusable button's own label mutation.

Design direction:

- Creative Production style intake selected: no visible layout change, preserve Gemini-style code chrome, make copy feedback more robust for assistive technology, keep the status node quiet while idle, and avoid model/API/account/sync/deploy/backend semantic changes.

Scope:

- `app/components/markdown.tsx`: added a sibling `.copy-code-status` node after the code-copy button, with `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`. It stays empty while idle and announces `codeCopyLabel` only while the copied state is active.
- `app/styles/globals.scss`: added `pre .copy-code-status` visually-hidden styling so the status node does not affect the fixed 34px copy button or code-block layout.
- `test/markdown-code-language.test.tsx`: added render-level coverage for the status node, copied/idle text transitions, and the structure guarantee that the status node is not nested inside the button.
- `test/gemini-visual-migration.test.ts`: locked the source/CSS contract for the sibling status node and its hidden style.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, token math, localStorage keys, upload limits, copy payload selection, copied timer behavior, copied icon styling, Mermaid rendering, HTML preview, code folding, code language labels, or visible code block layout were changed.

Automated checks:

- `yarn jest test/markdown-code-language.test.tsx --runInBand` failed first as expected because the old code-copy affordance had no dedicated `role="status"` node.
- Read-only review found a P1 issue in the first implementation: the status node was inside the native button, so it might be folded into the button's accessibility tree. A follow-up RED assertion `expect(copyButton).not.toContainElement(status)` reproduced the issue.
- The P1 was fixed by moving `.copy-code-status` after the button as a sibling and moving the hidden style to `pre .copy-code-status`.
- `yarn jest test/markdown-code-language.test.tsx test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/markdown-code-language.test.tsx test/markdown-code-fold.test.tsx test/markdown-performance.test.tsx test/markdown-file-attachment.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`

Review:

- Initial read-only review found the nested status P1 and a test gap; both were fixed with sibling placement and a structure assertion.
- Follow-up read-only review found no blocking issues. It confirmed `.copy-code-status` is a button sibling, the hidden CSS is scoped under `pre`, and copy payload/timer/visual styles/model/API/backend semantics were not changed.

Browser QA:

- Desktop `1440x1024` at `/`: after restarting the dev server, the app rendered with title `NeatChat`, composer input `left: 563`, `right: 1137`, panel `left: 490`, `right: 1250`, no framework overlay, `horizontalOverflowPx: 0`, copied-state CSS loaded, hidden status CSS loaded, and no console warn/error logs.
- Mobile `390x844` at `/#/chat`: composer input `left: 67`, `right: 313`, panel `left: 10`, `right: 380`, no framework overlay, `horizontalOverflowPx: 0`, copied-state CSS loaded, hidden status CSS loaded, and no console warn/error logs.
- Narrow mobile `320x740` at `/#/chat`: composer input `left: 67`, `right: 243`, panel `left: 10`, `right: 310`, no framework overlay, `horizontalOverflowPx: 0`, copied-state CSS loaded, hidden status CSS loaded, and no console warn/error logs.
- A Browser check immediately after `yarn build` left the app body empty until the dev server was restarted; after restart, the same routes rendered normally. This is recorded as a dev-server runtime artifact, not a product-code change.

Known risks:

- Browser QA did not click a live persisted code-copy button because current local history has no code-block messages and creating one would mutate user data or risk model/API paths. Render-level tests cover the real `PreCode` sibling status behavior for deterministic code blocks.
- The next high-value UI slice identified by read-only exploration is image message action context labels, especially for existing local image conversations such as `日出东方图`.

## Iteration 2026-06-19 image-action-context-labels

Result: passed.

Target flow:

- AI-rendered Markdown images and chat message images keep the existing preview/download behavior, but image action buttons now expose image-specific accessible names instead of repeated generic labels such as `下载原图`.

Design direction:

- Creative Production style intake selected: no visual churn, preserve Gemini-style media card treatment, improve multimodal result clarity for keyboard and assistive users, keep all download/preview callbacks unchanged, and do not change model/API/account/sync/deploy/backend semantics.

Scope:

- `app/utils/image-action-labels.ts`: added shared helpers for preview/download action labels and single/multi-message image labels.
- `app/components/markdown.tsx`: Markdown image preview/download buttons now use `预览 <alt>` and `下载 <alt> 原图` when alt text exists, with fallback labels for images without alt text.
- `app/components/chat.tsx`: message image preview/download buttons now receive contextual labels. Single image messages use `图片`; multi-image messages use `第 N 张图片`.
- `test/markdown-file-attachment.test.tsx`: added render-level coverage for Markdown image action labels and callback payloads.
- `test/gemini-visual-migration.test.ts`: locked the chat/Markdown source contract so future media-card changes keep contextual labels wired.
- `test/image-action-labels.test.ts`: added direct helper coverage for fallback, alt-text, single-image, and multi-image labels.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, image download source selection, proxy logic, generated-image result parsing, message content shape, upload limits, preview modal behavior, or persisted storage keys were changed.

Automated checks:

- `yarn test:ci test/markdown-file-attachment.test.tsx test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the old Markdown buttons were named `generated sunrise` / `下载原图`, and the chat path did not yet import/use the shared image-label helpers.
- `yarn test:ci test/markdown-file-attachment.test.tsx test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/image-action-labels.test.ts test/gemini-visual-migration.test.ts test/markdown-file-attachment.test.tsx test/markdown-code-language.test.tsx test/markdown-code-fold.test.tsx test/markdown-performance.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only sub-agent review found no Critical issues and no implementation-level accessibility/download/preview regression.
- The Important finding was a commit hygiene risk: the new helper file was still untracked at review time. This is resolved by including `app/utils/image-action-labels.ts` in the final staged commit.
- The Minor test-gap recommendation was addressed by adding `test/image-action-labels.test.ts` for fallback and multi-image helper labels.

Browser QA:

- Desktop default Browser viewport `1280x720` at `/`: page rendered with title `NeatChat`, no framework overlay, `horizontalOverflowPx: 0`, and no console warn/error logs. Browser screenshot capture timed out, so DOM/layout metrics were used.
- Existing `日出东方图` local chat was opened read-only; current local history had no visible image frame in this browser profile, so no live image action button was clicked.
- Mobile `390x844` at `/#/chat`: page rendered after reload, no framework overlay, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Narrow mobile `320x740` at `/#/chat`: page rendered after reload, no framework overlay, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Browser viewport was reset to the default `1280x720` after QA.

Known risks:

- Browser QA did not click a live persisted image preview/download button because the current Browser profile had no visible image-frame messages, and creating one would require mutating user data or triggering real model/API image generation. Render-level tests cover the Markdown image button behavior, and source-contract tests cover the chat image wiring.
- Fixed in the next slice: preview modal toolbar download labels now inherit originating image context.

## Iteration 2026-06-19 image-preview-context-labels

Result: passed.

Target flow:

- Opening a Markdown image or chat message image keeps the existing preview modal, download behavior, and focus return, but the preview modal toolbar download button now inherits the originating image context instead of falling back to generic `下载原图`.

Design direction:

- Creative Production style intake selected: no visible layout change, preserve the Gemini-style image preview modal, make the toolbar label consistent with inline image controls, keep the download URL/source logic unchanged, and avoid model/API/account/sync/deploy/backend semantic changes.

Scope:

- `app/components/markdown.tsx`: extended `onPreviewImage` to pass the Markdown image alt text as preview context.
- `app/components/chat.tsx`: added `previewImageActionLabels`, `openMarkdownImagePreview`, and an option-based `openImagePreview` call path so Markdown images pass `{ label }`, chat message images pass `{ trigger, label }`, and close resets labels to the default.
- `app/components/chat.tsx`: changed the preview modal toolbar download button to use `previewImageActionLabels.download` for both `aria-label` and `title`.
- `test/markdown-file-attachment.test.tsx`: added render-level coverage that Markdown preview clicks pass the alt label with the image URL.
- `test/gemini-visual-migration.test.ts`: locked the preview modal label state, reset, Markdown wrapper, message-image trigger+label path, and toolbar binding.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, image download source selection, proxy logic, generated-image result parsing, message content shape, upload limits, preview image `src`, modal close behavior, or persisted storage keys were changed.

Automated checks:

- `yarn test:ci --runTestsByPath test/markdown-file-attachment.test.tsx test/gemini-visual-migration.test.ts --runInBand` failed first as expected because Markdown preview clicks only passed `src`, chat still used the old `openImagePreview(src, trigger?)` contract, and the preview modal toolbar still used fixed `下载原图`.
- `yarn test:ci --runTestsByPath test/markdown-file-attachment.test.tsx test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/image-action-labels.test.ts test/gemini-visual-migration.test.ts test/markdown-file-attachment.test.tsx test/markdown-code-language.test.tsx test/markdown-code-fold.test.tsx test/markdown-performance.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only sub-agent review found no Critical, Important, or blocking Minor issues.
- The review confirmed Markdown alt -> `openMarkdownImagePreview` -> `openImagePreview` -> `previewImageActionLabels.download`, message image alt -> `MessageImagePreview` -> `openImagePreview`, close-time reset, focus return, and unchanged `downloadImage(previewImage)` behavior.
- The only optional note was that a future stable chat render harness could add a true DOM-level message-image preview test; this slice keeps the existing source-contract pattern.

Browser QA:

- Desktop default Browser viewport `1280x720` at `/`: page rendered with title `NeatChat`, no framework overlay, `horizontalOverflowPx: 0`, `imageFrameCount: 0`, and no console warn/error logs.
- Mobile `390x844` at `/#/chat`: page rendered after reload, no framework overlay, `horizontalOverflowPx: 0`, `imageFrameCount: 0`, and no console warn/error logs.
- Narrow mobile `320x740` at `/#/chat`: page rendered after reload, no framework overlay, `horizontalOverflowPx: 0`, `imageFrameCount: 0`, and no console warn/error logs.
- Browser viewport was reset to the default `1280x720`; reset check reported no framework overlay, `horizontalOverflowPx: 0`, and no console warn/error logs.

Known risks:

- Browser QA did not click a live persisted image preview/download button because the current Browser profile had no visible image-frame messages, and creating one would require mutating user data or triggering real model/API image generation. Render-level tests cover the Markdown preview label payload, and source-contract tests cover the chat preview modal label wiring.

## Iteration 2026-06-19 image-preview-alt-context

Result: passed.

Target flow:

- Opening a Markdown image or chat message image keeps the existing preview modal, download behavior, focus return, and toolbar labels, but the rendered preview image itself now uses the originating image context as its `alt` text instead of always exposing generic `图片预览`.

Design direction:

- Creative Production style intake selected: no visual layout change, preserve the Gemini-style image preview modal, make modal image naming consistent with inline media controls and toolbar download labels, keep preview/download source semantics unchanged, and avoid model/API/account/sync/deploy/backend semantic changes.

Scope:

- `app/utils/image-action-labels.ts`: added `getImagePreviewAlt`, which trims supplied context and falls back to `图片预览` when no useful label exists.
- `app/components/chat.tsx`: added `previewImageAlt` state, set it from Markdown alt or chat message image label when opening the modal, reset it on close, and bound the Next `Image` alt to that state.
- `test/image-action-labels.test.ts`: added helper coverage for fallback, trimmed alt text, and numbered multi-image labels.
- `test/gemini-visual-migration.test.ts`: locked the preview image alt state, open/reset path, helper import, and `alt={previewImageAlt}` binding.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, image download source selection, proxy logic, generated-image result parsing, message content shape, upload limits, preview image `src`, modal close behavior, focus restore, or persisted storage keys were changed.

Automated checks:

- `yarn test:ci --runTestsByPath test/image-action-labels.test.ts test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `getImagePreviewAlt` did not exist and the chat preview modal had no contextual alt state.
- `yarn test:ci --runTestsByPath test/image-action-labels.test.ts test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/image-action-labels.test.ts test/gemini-visual-migration.test.ts test/markdown-file-attachment.test.tsx test/markdown-code-language.test.tsx test/markdown-code-fold.test.tsx test/markdown-performance.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only sub-agent review found no Critical or Important issues.
- The only Minor finding was that this QA entry still had pending review wording while review was complete; this was fixed before commit.
- The review confirmed the helper fallback/trim behavior, open-time `previewImageAlt` assignment, close-time reset, unchanged `previewImage` source/download path, Markdown alt propagation, chat message image label propagation, and source/helper test coverage.

Browser QA:

- Desktop default Browser viewport at `http://localhost:3000/#/chat`: page rendered with title `NeatChat`, no framework overlay, `horizontalOverflowPx: 0`, composer input rect `left: 483`, `right: 1057`, panel rect `left: 410`, `right: 1170`, `imageFrameCount: 0`, `previewDialogCount: 0`, and no console warn/error logs.
- Mobile `390x844` at `/#/chat`: page rendered with title `NeatChat`, no framework overlay, `horizontalOverflowPx: 0`, composer input rect `left: 67`, `right: 313`, panel rect `left: 10`, `right: 380`, `imageFrameCount: 0`, `previewDialogCount: 0`, and no console warn/error logs.
- Narrow mobile `320x740` at `/#/chat`: page rendered with title `NeatChat`, no framework overlay, `horizontalOverflowPx: 0`, composer input rect `left: 67`, `right: 243`, panel rect `left: 10`, `right: 310`, `imageFrameCount: 0`, `previewDialogCount: 0`, and no console warn/error logs.
- Browser screenshot capture timed out at `Page.captureScreenshot`, matching prior project limitations; this iteration is verified by Browser DOM/layout metrics, console logs, read-only review, and automated tests instead of screenshot output.
- Browser viewport was reset to the default after QA.

Known risks:

- Browser QA did not click a live persisted image preview button because the current Browser profile had no visible image-frame messages, and creating one would require mutating user data or triggering real model/API image generation. Helper tests cover the label derivation, and source-contract tests cover Markdown/chat preview context propagation into the modal image alt.

## Iteration 2026-06-19 attachment-delete-context-labels

Result: passed.

Target flow:

- Composer attachment strip keeps the existing image edit, file edit, delete, upload, and submit behavior, but image and file delete controls now expose contextual labels instead of repeated generic `删除`.

Design direction:

- Creative Production style intake selected: no visual layout churn, preserve the compact Gemini-style attachment strip, improve multimodal keyboard and screen-reader clarity, keep attachment state semantics unchanged, and avoid model/API/account/sync/deploy/backend semantic changes.

Scope:

- `app/components/chat.tsx`: made `DeleteImageButton` accept an explicit `ariaLabel`, labeled image deletes as `删除第 N 张图片附件`, and labeled file deletes as `删除第 N 个文件附件：文件名`.
- `test/gemini-visual-migration.test.ts`: added source-contract coverage for contextual image/file attachment delete labels.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, upload limits, attachment content shape, edit/delete handlers, send behavior, persisted storage keys, or API behavior were changed.

Automated checks:

- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand` failed first as expected because attachment delete buttons still used generic `删除`.
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/image-action-labels.test.ts test/markdown-file-attachment.test.tsx test/markdown-code-language.test.tsx test/markdown-code-fold.test.tsx test/markdown-performance.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only sub-agent review found no blocking issues. Minor feedback requested disambiguating repeated file names with an index and replacing the pending review note; both were fixed before commit.

Browser QA:

- Desktop default Browser viewport `1280x720` at `/#/chat`: pasted one image data URL and one long-text file attachment through the real composer paste path. Page rendered with title `NeatChat`, no framework overlay, `horizontalOverflowPx: 0`, `itemCount: 2`, `imageButtonCount: 1`, file name `粘贴的文本.txt`, delete labels `删除第 1 张图片附件` and `删除第 1 个文件附件：粘贴的文本.txt`, composer input rect `left: 423`, `right: 1113`, panel rect `left: 350`, `right: 1230`, and no console warn/error logs for the QA window.
- Desktop delete sequence: `删除第 1 个文件附件：粘贴的文本.txt` resolved to exactly one button and removed the file, leaving only `删除第 1 张图片附件`; `删除第 1 张图片附件` then resolved to exactly one button and removed the image, leaving `itemCount: 0`, no framework overlay, `horizontalOverflowPx: 0`, and no console warn/error logs for the QA window.
- Mobile `390x844` at `/#/chat`: the same paste-created image/file attachment strip rendered with contextual delete labels, no framework overlay, `horizontalOverflowPx: 0`, input rect `left: 67`, `right: 313`, panel rect `left: 10`, `right: 380`, and no console warn/error logs for the QA window.
- Narrow mobile `320x740` with the same attachments: page rendered with title `NeatChat`, composer input present, contextual delete labels still present, no framework overlay, `horizontalOverflowPx: 0`, `itemCount: 2`, and no console warn/error logs for the QA window.
- Browser viewport was reset to the default `1280x720`; reset check reported no framework overlay, `horizontalOverflowPx: 0`, and `itemCount: 0`.

Known risks:

- Browser QA used paste-created image and long-text file attachments, not the native OS file picker, to avoid external dialogs and persistent user data changes. The slice intentionally changes only accessible names, so this covers the active composer attachment strip without touching upload or file picker semantics.

## Iteration 2026-06-19 attachment-edit-context-labels

Result: passed.

Target flow:

- Composer attachment strip keeps the existing image edit, file edit, delete, upload, and submit behavior, but image and file edit controls now expose contextual labels instead of generic or implicit names.

Design direction:

- Creative Production style intake selected: no visual layout churn, continue the Gemini-style compact attachment strip, make edit and delete controls use the same contextual naming model, keep attachment state/edit semantics unchanged, and avoid model/API/account/sync/deploy/backend semantic changes.

Scope:

- `app/components/chat.tsx`: labeled image edit buttons as `编辑第 N 张图片附件` and file edit buttons as `编辑第 N 个文件附件：文件名`.
- `test/gemini-visual-migration.test.ts`: added source-contract coverage for contextual image/file attachment edit labels.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, upload limits, attachment content shape, image editor path, file edit prompt path, delete handlers, send behavior, persisted storage keys, or API behavior were changed.

Automated checks:

- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand` failed first as expected because image edit was still labeled `编辑图片附件` and file edit had no explicit action label.
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/image-action-labels.test.ts test/markdown-file-attachment.test.tsx test/markdown-code-language.test.tsx test/markdown-code-fold.test.tsx test/markdown-performance.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only code review found no blocking issues. Minor feedback requested replacing the pending review note before commit; this entry was updated before commit.

Browser QA:

- First Browser pass exposed a stale dev bundle after prior build work: runtime attachment edit labels still showed the old `编辑图片附件`. The dev server was restarted and the QA pass below is from the fresh dev process.
- Desktop default Browser viewport `1280x720` at `/#/chat`: pasted one image data URL and one long-text file attachment through the real composer paste path. Page rendered with title `NeatChat`, no framework overlay, `horizontalOverflowPx: 0`, `itemCount: 2`, file name `粘贴的文本.txt`, labels `编辑第 1 张图片附件`, `删除第 1 张图片附件`, `编辑第 1 个文件附件：粘贴的文本.txt`, and `删除第 1 个文件附件：粘贴的文本.txt`; composer input rect `left: 423`, `right: 1113`, panel rect `left: 350`, `right: 1230`, and no console warn/error logs for the QA window.
- Desktop role checks found exactly one `编辑第 1 张图片附件` button and exactly one `编辑第 1 个文件附件：粘贴的文本.txt` button.
- Mobile `390x844` at `/#/chat`: the same paste-created image/file attachment strip rendered with contextual edit/delete labels, no framework overlay, `horizontalOverflowPx: 0`, input rect `left: 67`, `right: 313`, panel rect `left: 10`, `right: 380`, and no console warn/error logs for the QA window. Role checks again found exactly one image edit button and one file edit button.
- Narrow mobile `320x740` with the same attachments: page rendered with title `NeatChat`, composer input present, contextual edit/delete labels still present, no framework overlay, `horizontalOverflowPx: 0`, `itemCount: 2`, and no console warn/error logs for the QA window. Role checks again found exactly one image edit button and one file edit button.
- Browser viewport was reset to the default `1280x720`; cleanup removed the paste-created attachments, leaving `itemCount: 0`, no framework overlay, `horizontalOverflowPx: 0`, and no cleanup console warn/error logs.
- Browser viewport screenshot capture completed without timeout in this pass; DOM/layout metrics remain the primary recorded evidence because they directly cover labels, bounds, overflow, and console health for this narrow slice.

Known risks:

- Browser QA used paste-created image and long-text file attachments, not the native OS file picker, to avoid external dialogs and persistent user data changes. The slice intentionally changes only accessible names, so this covers the active composer attachment strip without touching upload, file picker, image editor, or file edit prompt semantics.

## Iteration 2026-06-19 image-preview-dialog-context-label

Result: passed.

Target flow:

- Opening a Markdown image or chat message image keeps the existing preview modal, image source, alt text, toolbar download label, close behavior, focus return, and download semantics, but the preview dialog itself now exposes the originating image context instead of always being named `图片预览`.

Design direction:

- Creative Production style intake selected: no visible layout change, continue the Gemini-style preview overlay, keep dialog naming aligned with inline preview labels, modal image alt, and toolbar download labels, and avoid model/API/account/sync/deploy/backend semantic changes.

Scope:

- `app/utils/image-action-labels.ts`: added `getImagePreviewDialogLabel`, which trims supplied context, returns `图片预览` by default or for generic `图片`, and returns `图片预览：<context>` when non-default image context exists.
- `app/components/chat.tsx`: added `previewImageDialogLabel` state, set it from Markdown alt or chat message image label when opening the preview, reset it on close, and bound the dialog `aria-label` to that state.
- `test/image-action-labels.test.ts`: added helper coverage for default, whitespace-only, generic `图片`, trimmed alt text, and numbered multi-image labels.
- `test/gemini-visual-migration.test.ts`: locked the helper import, preview dialog label state, open/reset path, and removed the fixed `aria-label="图片预览"` contract.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, image download source selection, proxy logic, generated-image result parsing, message content shape, upload limits, preview image `src`, modal image `alt`, toolbar labels, close behavior, focus restore, or persisted storage keys were changed.

Automated checks:

- `yarn test:ci --runTestsByPath test/image-action-labels.test.ts test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `getImagePreviewDialogLabel` and the `previewImageDialogLabel` state did not exist, and the dialog still used fixed `aria-label="图片预览"`.
- `yarn test:ci --runTestsByPath test/image-action-labels.test.ts test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/image-action-labels.test.ts test/gemini-visual-migration.test.ts test/markdown-file-attachment.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only code review found no blocking issues and confirmed the preview dialog label state updates with the same source context as `previewImageAlt` / `previewImageActionLabels`, while preview `src`, download, close handlers, and focus restore stay unchanged.
- The review suggested locking whitespace-only fallback and avoiding the redundant single-image label `图片预览：图片`; both were handled in `getImagePreviewDialogLabel` and helper tests before commit.
- The remaining optional note was that a future stable chat render harness could add a true DOM-level preview dialog click test. This slice keeps the existing helper/source-contract pattern because Browser had no visible persisted image-frame messages.

Browser QA:

- Desktop default Browser viewport `1280x720` at `http://localhost:3000/#/chat`: page rendered with title `NeatChat`, no framework overlay, `horizontalOverflowPx: 0`, composer input rect `left: 483`, `right: 1057`, panel rect `left: 410`, `right: 1170`, `imageFrameCount: 0`, `previewDialogCount: 0`, and no console warn/error logs.
- Mobile `390x844` at `/#/chat`: page rendered with title `NeatChat`, no framework overlay, `horizontalOverflowPx: 0`, composer input rect `left: 67`, `right: 313`, panel rect `left: 10`, `right: 380`, `imageFrameCount: 0`, `previewDialogCount: 0`, and no console warn/error logs.
- Narrow mobile `320x740` at `/#/chat`: page rendered with title `NeatChat`, no framework overlay, `horizontalOverflowPx: 0`, composer input rect `left: 67`, `right: 243`, panel rect `left: 10`, `right: 310`, `imageFrameCount: 0`, `previewDialogCount: 0`, and no console warn/error logs.
- Browser viewport screenshot capture completed successfully. DOM/layout metrics remain the primary recorded evidence because they directly cover route health, bounds, overflow, and console state for this narrow slice.
- Browser viewport was reset to the default after QA.

Known risks:

- Browser QA did not click a live persisted image preview button because the current Browser profile had no visible image-frame messages, and creating one would require mutating user data or triggering real model/API image generation. Helper tests cover dialog label derivation, and source-contract tests cover Markdown/chat preview context propagation into the dialog `aria-label`.

## Iteration 2026-06-19 image-editor-context-title

Result: passed.

Target flow:

- Composer image attachments keep the existing paste, upload limit, edit, save, close, delete, and submit behavior, but opening the image editor from an attachment now names the modal by attachment context: `编辑第 N 张图片附件`.
- Immediate edit clicks after paste should remain reliable on narrow touch-sized layouts: the delete button must not cover the thumbnail center, and passive upload toasts must not intercept the edit target.

Design direction:

- Creative Production style intake selected: no decorative layout churn, preserve the compact Gemini-style attachment strip and existing image editor surface, make contextual naming visible inside the modal header, improve the touch hit target conflict discovered in Browser QA, and avoid model/API/account/sync/deploy/backend semantic changes.

Scope:

- `app/components/chat.tsx`: added image-editor title state, set it from the clicked image attachment index, passed it into `ImageEditor`, and reset it on close/save.
- `app/components/image-editor.tsx`: accepted an optional `title` prop while keeping `编辑图片` as the default for other call sites.
- `app/components/chat.module.scss`: reduced the touch/coarse attachment delete button from `28px` to `24px` so it no longer covers the center of the `58px` image thumbnail.
- `app/components/ui-lib-components.tsx` and `app/components/ui-lib.module.scss`: made passive toasts pointer-transparent while preserving action toast interactivity.
- `test/image-editor-context.test.tsx`, `test/toast-pointer-events.test.tsx`, and `test/gemini-visual-migration.test.ts`: added render/source contracts for contextual editor titles, passive toast click-through behavior, and the touch delete hit target.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, upload limits, attachment content shape, image save output, file attachment behavior, send behavior, persisted storage keys, or API behavior were changed.

Automated checks:

- `yarn test:ci --runTestsByPath test/image-editor-context.test.tsx test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the modal still rendered fixed `编辑图片` and there was no `editingImageTitle` state.
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand` failed first as expected after Browser QA exposed the `28px` touch delete hit target overlap.
- `yarn test:ci --runTestsByPath test/toast-pointer-events.test.tsx --runInBand` failed first as expected because passive toasts still used only `toast-content`.
- `yarn test:ci --runTestsByPath test/toast-pointer-events.test.tsx test/image-editor-context.test.tsx test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/toast-pointer-events.test.tsx test/image-editor-context.test.tsx test/gemini-visual-migration.test.ts test/image-action-labels.test.ts test/markdown-file-attachment.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only code review found no blocking issues and confirmed the diff stayed within chat UI, ImageEditor title, Toast styling, and tests/QA documentation without touching model config, account/secret/sync, production/deploy config, backend/API, upload/save/send semantics, or persisted storage.
- The review noted residual test gaps around source-contract limits, action toast click callback coverage, and the smaller touch delete target. Action toast callback/onClose coverage was added before commit; Browser QA covers the click-through and center-hit behavior that JSDOM cannot prove.

Browser QA:

- Desktop default Browser viewport `1280x720` at `http://localhost:3000/`: pasted one image data URL through the real composer paste path, clicked `编辑第 1 张图片附件`, and the editor opened with contextual title `编辑第 1 张图片附件`, no generic `编辑图片` title, canvas visible, no framework overlay, `horizontalOverflowPx: 0`, cleanup `itemCount: 0`, and no console warn/error logs for the QA window.
- Narrow mobile `320x740` at `http://localhost:3000/`: pasted one image data URL, clicked the thumbnail edit target immediately without waiting for the passive toast to disappear, and the center stack resolved first to `button[aria-label="编辑第 1 张图片附件"]`; delete rect was `24x24`, edit rect was `58x58`, `deleteContainsEditCenter: false`, editor title/canvas opened correctly, cleanup left `itemCount: 0`, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Browser viewport was reset to the default after QA.

Known risks:

- Browser QA used paste-created data URL attachments, not the native OS file picker, to avoid external dialogs and persistent user data changes.
- Earlier Browser runs showed intermittent in-app Browser tab navigation/id issues and one screenshot timeout; the final recorded desktop and narrow QA passes are DOM/layout/console based and completed after cleaning Browser tabs.

## Iteration 2026-06-19 file-attachment-edit-prompt-context

Result: passed.

Target flow:

- Composer file attachments keep the existing paste, upload limit, edit, cancel, confirm, delete, size update, original file update, and submit behavior, but opening the file editor now names both the prompt title and textarea by attachment context: `编辑第 N 个文件附件：<file name>`.
- The file edit textarea accessible name must describe the target attachment, not expose the entire edited file body as its label.

Design direction:

- Creative Production style intake selected: no decorative layout churn, preserve the compact Gemini-style attachment strip and existing modal prompt surface, align file edit context with the already contextual attachment edit/delete labels, and avoid model/API/account/sync/deploy/backend semantic changes.

Scope:

- `app/components/chat.tsx`: reused a single `fileEditContextLabel` for the file attachment edit button, prompt title, and prompt textarea label option.
- `app/components/ui-lib-actions.tsx`: added an optional `ariaLabel` option to `showPrompt` while keeping the existing positional arguments and default behavior for all other callers.
- `app/components/ui-lib-prompt-input.tsx`: added an optional explicit `ariaLabel` prop with the existing value-derived fallback unchanged.
- `test/prompt-input-label.test.tsx` and `test/gemini-visual-migration.test.ts`: added render/source contracts for the explicit prompt input label and contextual file edit prompt wiring.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, upload limits, attachment content shape, file picker behavior, image attachment behavior, send behavior, persisted storage keys, or API behavior were changed.

Automated checks:

- `yarn test:ci --runTestsByPath test/prompt-input-label.test.tsx test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `PromptInput` still used the edited file body as the textarea `aria-label`, and the chat source had no contextual file edit prompt label.
- `yarn test:ci --runTestsByPath test/prompt-input-label.test.tsx test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/prompt-input-label.test.tsx test/gemini-visual-migration.test.ts test/markdown-file-attachment.test.tsx test/chat-render.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only code review found no blocking issues and confirmed the `showPrompt` optional fourth argument preserves existing callers, `PromptInput` fallback behavior remains compatible, and file attachment edit content/size/originalFile update plus delete/send/upload semantics were unchanged.
- Review feedback noted the source-string contract remains refactor-sensitive and asked to avoid committing a stale pending-review note; this entry was updated before commit, and fallback label coverage was added to `test/prompt-input-label.test.tsx`.

Browser QA:

- Desktop default Browser viewport `1280x720` at `http://localhost:3000/`: pasted long text through the real composer paste path, rendered exactly one `编辑第 1 个文件附件：粘贴的文本.txt` button, opened the prompt with visible title `编辑第 1 个文件附件：粘贴的文本.txt`, found exactly one textarea named `编辑第 1 个文件附件：粘贴的文本.txt内容`, canceled the prompt, deleted the attachment, cleanup left `remainingEditButtonsAfterDelete: 0`, and no relevant console warn/error logs.
- Narrow mobile `320x740` at `http://localhost:3000/`: after loading the page, switched viewport to 320px, repeated the same paste-created file edit prompt path, verified the same contextual prompt title and textarea label, canceled, deleted the attachment, cleanup left `remainingEditButtonsAfterDelete: 0`, and no relevant console warn/error logs.
- Browser screenshot capture was attempted after opening the prompt and failed with the in-app Browser CDP error `Timed out running CDP command "Page.captureScreenshot"`. DOM, role, title, cleanup, and console checks remain the recorded evidence for this slice.
- Browser viewport was reset to the default after QA.

Known risks:

- Browser QA used paste-created long-text file attachments, not the native OS file picker, to avoid external dialogs and persistent user data changes. This slice intentionally changes only prompt naming and prompt input accessibility, so the paste-created file covers the active composer file edit path without touching upload, file picker, delete, send, or API semantics.
- Earlier Browser runs showed intermittent in-app Browser tab navigation/id issues and repeated screenshot timeout. The final recorded desktop and narrow QA passes completed after cleaning Browser tabs and avoiding screenshot as a blocking assertion.

## Iteration 2026-06-19 prompt-toast-context-chip

Result: passed.

Target flow:

- The context prompt toast still appears only when the current session has context prompts and the chat is detached from the bottom, and still opens `SessionConfigModel` without changing context, mask, model, upload, send, API, account, sync, production, or deployment semantics.
- The toast trigger now behaves as a contextual Gemini-style chip: compact, translucent, focus-visible, dark-mode aware, reduced-motion safe, pointer-transparent outside the chip, and explicitly connected to the modal with `aria-haspopup`, `aria-controls`, and `aria-expanded`.

Design direction:

- Creative Production style intake selected: replace the old white floating toast button with a quiet contextual chip visually aligned with `ClearContextDivider`, preserve its existing header-anchored placement, keep it out of the composer hit path with `pointer-events: none` on the wrapper, and avoid backend or model semantic changes.

Scope:

- `app/components/chat.tsx`: added `id="session-config-modal"` to the existing `SessionConfigModel` mask and added `aria-label`, `aria-haspopup="dialog"`, `aria-controls`, and `aria-expanded` to the prompt toast trigger.
- `app/components/chat.module.scss`: restyled `.prompt-toast` / `.prompt-toast-inner` as a translucent bounded chip with focus, hover, active, expanded, dark-mode, and reduced-motion states.
- `test/gemini-visual-migration.test.ts`: added a source/CSS contract for the prompt toast ARIA relationship, chip sizing, dark mode, and reduced-motion behavior.
- No model config semantics, account/secret/sync, production config, deployment config, backend logic, upload limits, attachment behavior, send behavior, prompt/context data shape, persisted storage keys, or API behavior were changed.

Automated checks:

- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the prompt toast had no `session-config-modal` relationship and still used the old toast styling.
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/chat-render.test.ts test/markdown-file-attachment.test.tsx --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only code review found no blocking issues. The sub-agent review attempt failed because the external usage limit was reached, so the final review was completed locally against the current diff.
- The review confirmed `session-config-modal` is only defined on `SessionConfigModel`, `PromptToast` is rendered through a single header path per viewport, the ARIA trigger relationship does not change modal data flow, and the SCSS keeps the non-chip wrapper pointer-transparent to avoid blocking composer/header hit targets.
- Residual risk: the source/CSS contract is intentionally refactor-sensitive, and Browser QA covered a built-in mask session rather than every possible custom mask/context combination.

Browser QA:

- Desktop default Browser viewport `1280x720` at `http://localhost:3000/#/masks`: opened the built-in `以文搜图` mask session, used CUA scroll to detach from the bottom, verified exactly one prompt chip named `包含 4 条预设提示词`, `aria-controls="session-config-modal"`, `aria-haspopup="dialog"`, `aria-expanded` changed from `false` to `true` after click, modal `#session-config-modal` opened with title `当前对话设置`, close button existed, `horizontalOverflowPx: 0`, chip rect `left: 710`, `right: 870`, `top: 70`, `bottom: 106`, header bottom `62`, screenshot captured successfully, and no relevant console warn/error logs.
- Narrow mobile `320x740` at the same built-in mask flow: verified the same chip name and ARIA relationship, modal open/title, `horizontalOverflowPx: 0`, chip rect `left: 80`, `right: 240`, `top: 76`, `bottom: 112`, header bottom `68`, screenshot captured successfully, and no relevant console warn/error logs.
- Browser viewport was reset to the default after QA.

Known risks:

- Browser QA used a built-in mask session with preset context prompts and did not send a message, call a model, edit context content, or persist production data. The route creates only a local temporary mask chat state for UI verification.
- Closing the whole Browser tab was used for cleanup after opening the settings modal; this slice changes only the trigger chip and modal association, not the existing modal close implementation.

## Iteration 2026-06-20 session-config-dialog-aria

Result: passed.

Target flow:

- Opening the context prompt chip still shows the existing current chat settings modal with the same mask/context editing UI and actions, but the controlled target `#session-config-modal` is now a named `dialog` with `aria-modal="true"` and `aria-label={Locale.Context.Edit}`.
- The change must not alter context prompt data, mask updates, model config, reset/save-as-mask handlers, upload, send, API, account, sync, production, or deployment behavior.

Design direction:

- Creative Production style intake selected: keep the existing modal surface and layout unchanged, only strengthen the semantic bridge from the Gemini-style prompt chip to the settings dialog so assistive tech can identify the opened surface.

Scope:

- `app/components/chat.tsx`: added `role="dialog"`, `aria-modal="true"`, and `aria-label={Locale.Context.Edit}` to the existing `SessionConfigModel` wrapper that already owns `id="session-config-modal"`.
- `test/gemini-visual-migration.test.ts`: extended the prompt toast source contract to require the controlled modal target to be a named dialog.
- No visual sizing, context/mask/model semantics, generic `Modal` component behavior, upload/send paths, persisted storage keys, backend/API, or production/deployment configuration were changed.

Automated checks:

- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `#session-config-modal` had no `role="dialog"`, `aria-modal`, or modal label.
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand`
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts test/chat-render.test.ts test/markdown-file-attachment.test.tsx --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `yarn build`
- `git diff --check`

Review:

- Read-only local code review found no blocking issues. The review confirmed the change is scoped to `SessionConfigModel` semantics, does not touch its mask/context update handlers, and keeps the existing prompt chip `aria-controls` target unique.

Browser QA:

- Desktop default Browser viewport at `http://localhost:3000/#/masks`: opened the built-in `以文搜图` mask session, scrolled away from bottom to reveal the prompt chip, clicked `包含 4 条预设提示词`, and verified `getByRole("dialog", { name: "当前对话设置" })` found exactly one dialog with `aria-modal="true"`, `aria-label="当前对话设置"`, chip `aria-controls` matched `session-config-modal`, chip `aria-expanded` became `true`, `horizontalOverflowPx: 0`, and no relevant console warn/error logs.
- Narrow mobile `320x740` after page load: repeated the same built-in mask flow and verified the same named dialog, `aria-modal`, label, controls match, expanded state, `horizontalOverflowPx: 0`, and no relevant console warn/error logs.
- Browser viewport was reset to the default after QA.

Known risks:

- Browser QA used a built-in mask session and did not send a message, edit context data, or call any model/API. This slice is semantic-only for the existing settings modal wrapper.
- Browser first pass hit transient in-app Browser tab/session mapping and `Page.navigate` timeouts; both final desktop and narrow passes completed after cleaning tabs and retrying one viewport at a time.

## Iteration 2026-06-20 prompt-toast-focus-return

Result: passed.

Target flow:

- Opening `当前对话设置` from the context prompt chip must preserve the existing mask/context settings UI and return focus to the prompt chip after close.
- Opening the same settings modal from the compact header settings button must return focus to that header button after close, not jump to the prompt chip.
- The modal must remain clickable even though the prompt chip wrapper stays pointer-transparent to avoid blocking chat/header interactions.

Design direction:

- Creative Production style intake selected: keep the previous Gemini-style contextual chip visuals, but make the modal behave like an opener-aware overlay. The prompt chip remains a quiet contextual affordance; the modal is promoted to the chat view overlay layer so it does not inherit the chip wrapper's `pointer-events: none`.

Scope:

- `app/components/chat.tsx`: moved `SessionConfigModel` ownership from `PromptToast` to `ChatInner`, added opener-aware `openPromptModal` / `closePromptModal`, and restored focus only to the element that opened the modal when it is still connected.
- `app/components/button.tsx`: widened `IconButton.onClick` to receive the native button click event so the compact header settings button can pass its `event.currentTarget` as the opener. Existing no-argument click handlers remain valid.
- `test/gemini-visual-migration.test.ts`: replaced the brittle Fragment/inline close-handler contract with an opener-aware source contract that keeps `SessionConfigModel` out of `PromptToast`, requires the shared trigger ref, and locks the main-layer modal close path.
- No model config semantics, context/mask mutation rules, account/secret/sync, production config, deployment config, backend logic, upload/send behavior, persisted storage keys, or API behavior were changed.

Automated checks:

- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the old implementation always restored focus to `promptToastButtonRef` and rendered `SessionConfigModel` inside `PromptToast`.
- `yarn test:ci --runTestsByPath test/gemini-visual-migration.test.ts --runInBand`

Review:

- Read-only sub-agent review found one P2 issue: closing the modal after opening it from the compact header settings button would incorrectly focus the prompt chip. The implementation was changed to record the real opener and clear it after close.
- The same review noted the previous test contract was too JSX-shape-specific; the test was adjusted to assert behavior-relevant ownership and opener-aware focus logic instead.

Browser QA:

- Desktop Browser viewport `1280x720` on `http://localhost:3001/#/masks`: opened built-in `以文搜图`, revealed `包含 4 条预设提示词`, opened `当前对话设置`, verified mask pointer events `auto`, close button pointer events `auto`, close hit target under SVG parent `Close modal`, closed the modal, and verified `modalCount: 0`, chip `aria-expanded: false`, and focus returned to the prompt chip.
- Narrow Browser viewport `390x844` on the same built-in mask flow: verified the same prompt chip opener path, modal clickability, `modalCount: 0`, chip `aria-expanded: false`, and focus returned to the prompt chip.
- Narrow Browser viewport `390x844` compact header path: opened `当前对话设置` from the header `对话设置` button, closed the modal, and verified `modalCount: 0` and focus returned to the `对话设置` header button.
- Browser viewport was reset after QA. `localhost:3000` was stuck on a loading shell after Fast Refresh/full reload, so a clean `localhost:3001` dev server was used for final Browser verification.

Known risks:

- Browser QA used a built-in mask session and did not send messages, edit context values, call any model/API, or persist production data.
- The global toast action opened by pinning a message records the active element if available; if that transient toast action is removed before close, focus restoration safely does nothing instead of guessing another target.

## Iteration 2026-06-20 attachment-delete-focus-return

Result: passed.

Target flow:

- Deleting an image or file attachment from the composer should not leave focus on a removed delete button or fall back to `body`.
- After deletion, focus should move to the next remaining editable attachment, fall back to the previous remaining attachment when deleting the last item, and return to the chat input when no attachments remain.
- The change must preserve existing attachment upload, paste, edit, count-limit, send, model, account, sync, backend, production, and deployment behavior.

Design direction:

- Creative Production style intake selected: keep the current Gemini-style compact attachment strip visuals unchanged and improve interaction polish through deterministic keyboard focus handoff. This treats attachment deletion as a reversible composer edit, not a data or upload-flow change.

Scope:

- `app/components/chat.tsx`: added a composer attachment container ref and a shared `focusComposerAttachmentAfterRemoval` helper. Image and file deletion now restore focus after React commits the updated attachment list.
- `test/gemini-visual-migration.test.ts`: added a source contract for the attachment deletion focus handoff and relaxed an existing prompt modal assertion so it accepts equivalent JSX wrapping while preserving the same modal behavior requirement.
- No upload limits, attachment parsing, image/file content, edit modal behavior, send behavior, model config semantics, account/secret/sync, backend/API, production config, or deployment config were changed.

Automated checks:

- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="composer attachment deletion focus handoff"` failed first as expected because the composer attachment list had no deletion focus handoff.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="composer attachment deletion focus handoff"`
- `npx jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `git diff --check`
- `yarn build`

Browser QA:

- Desktop Browser viewport `1440x1024` at `http://localhost:3000/`: pasted a data URL image to create `编辑第 1 张图片附件`, pasted long text to create `编辑第 1 个文件附件：粘贴的文本.txt`, deleted the image attachment, and verified focus moved to the file attachment button; deleted the final file attachment and verified focus returned to `#chat-input`. `bodyOverflowX: false`, attachment container removed when empty, and console error logs were empty.
- Narrow mobile Browser viewport `390x844` on the same local app: repeated the image + long-text paste flow, verified the attachment strip itself could overflow horizontally while the page did not (`bodyOverflowX: false`), deleted the image attachment and saw focus move to the file attachment button, then deleted the final file and saw focus return to `#chat-input`. Console error logs were empty.

Known risks:

- Browser QA used generated local clipboard content only and did not send a message, call a model/API, upload personal files, edit production data, or persist production configuration.
- The focus target is the remaining attachment edit button rather than the next delete button, so keyboard users land on a stable attachment action after the removed delete control disappears.
