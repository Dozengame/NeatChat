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
