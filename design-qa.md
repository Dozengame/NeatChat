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
