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

## Iteration 2026-06-20 attachment-scroll-edge-hints

Result: passed.

Target flow:

- A horizontally overflowing composer attachment strip should advertise hidden content with a subtle edge hint in the available scroll direction.
- The hint must update as the user scrolls: right only at the start, both sides in the middle, left only at the end, and no hint when the strip does not overflow.
- The hint must never block attachment edit/delete hit targets, change upload/paste limits, or alter model, account, sync, backend, production, or deployment semantics.

Design direction:

- Creative Production style intake selected: keep the existing Gemini-style compact attachment strip and add a lightweight gradient affordance only when overflow exists.
- The final implementation conditionally renders decorative `aria-hidden` edge overlays instead of opacity-controlled pseudo-elements. Browser QA exposed unreliable opacity cascade/computed behavior in dev mode, so rendering only the active hint is the more robust UI contract.

Scope:

- `app/components/chat.tsx`: added scroll state for the composer attachment list, resize/attachment-count synchronization, directional overflow data attributes, and conditional non-interactive edge overlays.
- `app/components/chat.module.scss`: added the attachment strip shell and left/right gradient overlay styles with dark-mode surface tuning.
- `test/gemini-visual-migration.test.ts`: added a source contract that locks the non-blocking conditional edge hints, scroll state calculation, wrapper data attributes, and gradient styling.
- No upload parsing, attachment limits, image/file edit behavior, send behavior, model config semantics, account/secret/sync, backend/API, production config, or deployment config were changed.

Automated checks:

- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip overflow hints"` failed first as expected before the edge hint contract was implemented.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip overflow hints"`
- `npx jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `git diff --check`

Browser QA:

- Narrow Browser viewport `390x844` at `http://localhost:3000/`: pasted one generated clipboard PNG and five long-text clipboard attachments, verified the attachment strip overflowed horizontally while the page did not (`bodyOverflowX: false`), with `data-overflow-start="false"`, `data-overflow-end="true"`, no left hint, and one right hint with `pointer-events: none`.
- After a real horizontal scroll to the end, verified `scrollLeft` reached `maxScrollLeft`, `data-overflow-start="true"`, `data-overflow-end="false"`, left hint rendered, and right hint was removed.
- After a real horizontal scroll back toward the middle, verified both hints rendered and both had `pointer-events: none`.
- Deleted the fifth file attachment while the strip was scrolled and verified the file count dropped from 5 to 4, confirming the overlay did not intercept attachment controls.
- Desktop Browser viewport `1440x1024`: verified the same attachment strip did not overflow, both overflow data attributes were false, neither edge hint rendered, and `bodyOverflowX: false`.
- Browser console warn/error output contained only expected Next.js Fast Refresh full-reload development warnings from file edits, with no app runtime errors.

Known risks:

- Browser QA used generated clipboard content only and did not send a message, call a model/API, upload personal files, edit production data, or persist production configuration.
- Because the hint is conditionally rendered rather than opacity-animated, it prioritizes deterministic visibility and hit-target safety over a fade transition in this slice.

## Iteration 2026-06-20 markdown-table-scroll-edge-hints

Result: passed.

Target flow:

- Wide AI-rendered Markdown tables should advertise hidden horizontal content with a subtle edge hint in the available scroll direction.
- The hint must update as the table scrolls: right only at the start, left only at the end, and no blocking layer over table content or nearby code actions.
- Existing Markdown code block language labels, copy behavior, table readability, model config semantics, account/secret/sync, backend/API, production config, and deployment config must remain unchanged.

Design direction:

- Creative Production style intake selected: keep the Gemini-style quiet Markdown surface and add the smallest possible overflow affordance to make dense AI tables scannable on desktop and compact mobile widths.
- The table chrome stays on a scroll shell while the actual `<table>` keeps semantic table display. Decorative edge hints are `aria-hidden` and non-interactive.

Scope:

- `app/components/markdown.tsx`: added `MarkdownTable`, directional scroll-hint state, content synchronization, `ResizeObserver`-backed container resize synchronization, data attributes, a dedicated scroll viewport, and non-interactive start/end fade elements for rendered Markdown tables.
- `app/styles/markdown.scss`: moved table card chrome to `.markdown-table-scroll-shell`, moved horizontal scrolling to `.markdown-table-scroll-viewport`, kept the semantic table layout, reset inner table spacing, and added light/dark edge surfaces for the directional hints.
- `test/gemini-visual-migration.test.ts`: extended the Markdown table contract to cover the shell/viewport structure, overflow calculation, container resize observer, non-blocking absolute overlay hints, block spacing, and table/card styling.
- No model config semantics, account/secret/sync, backend/API, production config, deployment config, upload/send behavior, or persisted app store keys were changed.

Automated checks:

- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown table dark surfaces"` failed first as expected because `MarkdownTable` and directional table hint state did not exist yet.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown table dark surfaces"`
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown table dark surfaces"` failed again after review tightening because the table still lacked a dedicated scroll viewport / absolute overlay contract.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown table dark surfaces"`
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown table dark surfaces"` failed again after the second review tightened the contract to strip ReactMarkdown `node` metadata before spreading table props to the DOM.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown table dark surfaces"`
- `npx jest test/markdown-code-language.test.tsx --runInBand`
- `npx jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `git diff --check`
- `yarn build`

Review:

- Read-only code review found two Important issues before commit: outer Markdown block spacing had not fully moved from the inner table to the wrapper, and overflow hint synchronization only covered mount/content/scroll/window resize.
- Fixed by moving block spacing to `.markdown-table-scroll-shell`, resetting the inner viewport table margin, and adding `ResizeObserver` for container-level size changes.
- Follow-up Browser QA exposed that the initial sticky hint spans had `0px` height in real Chrome. The structure was changed to outer shell + inner scroll viewport + absolute overlays, which gives the fade hints the full shell height while preserving scrolling on the viewport.
- Second read-only review found no Critical or Important issues. Its remaining Minor DOM cleanliness item was fixed by stripping ReactMarkdown `node` metadata before spreading props onto the real `<table>`.

Browser QA:

- Desktop Chrome viewport `1440x1024` at `http://localhost:3000/`: injected and selected a local temporary assistant message with a wide Markdown table and TypeScript code block. At scroll start, the viewport had `scrollWidth: 1388`, `clientWidth: 722`, `data-overflow-start="false"`, `data-overflow-end="true"`, shell `overflow: hidden`, viewport `overflow-x: auto`, shell `margin-bottom: 16px`, inner table `margin-bottom: 0px`, right hint `28px x 152px`, `pointer-events: none`, shell-to-code gap `16px`, and code language label `TypeScript`.
- After a real horizontal scroll to the end on desktop, verified `scrollLeft: 666`, `maxScrollLeft: 666`, `data-overflow-start="true"`, `data-overflow-end="false"`, left hint `28px x 152px`, and no right hint.
- Desktop container resize probe without window resize: after shrinking the viewport from `722px` to `542px` at the previous end position, `ResizeObserver` refreshed the state to `data-overflow-start="true"` and `data-overflow-end="true"`.
- Compact mobile Chrome viewport `390x844`: verified the same table overflow behavior with `scrollWidth: 1388`, `clientWidth: 288`, shell `margin-bottom: 16px`, inner table `margin-bottom: 0px`, right hint `28px x 152px`, `pointer-events: none`, shell-to-code gap `16px`, and code language label `TypeScript`.
- After a real horizontal scroll to the end on mobile, verified `scrollLeft: 1100`, `maxScrollLeft: 1100`, `data-overflow-start="true"`, `data-overflow-end="false"`, left hint `28px x 152px`, and no right hint.
- Mobile container resize probe without window resize: after shrinking the viewport to `180px` at the previous end position, `ResizeObserver` refreshed the state to `data-overflow-start="true"` and `data-overflow-end="true"`.
- Browser QA used a local temporary IndexedDB access/chat state in an isolated Chrome automation context, selected the temporary local session from the sidebar, did not send a message, did not call a model/API, and did not persist production data.

Known risks:

- Browser QA validates a representative wide Markdown table and code block in the live chat surface, but does not exhaust every table density or nested Markdown combination.
- The hint is conditionally rendered for deterministic hit-target safety; if future design requires animated opacity, it should be re-tested against pointer interception and dev-mode computed styles.

## Iteration 2026-06-20 drag-drop-payload-summary

Result: passed.

Target flow:

- The full-screen Dropzone should tell the user what will be added while files are dragged over the chat surface, instead of only repeating static upload guidance.
- The summary must distinguish image and document counts, respect the existing remaining slots of 3 images and 5 files, and clear immediately after drag leave or drop.
- The change must not alter upload parsing, size checks, slot limits, toast behavior, send behavior, model config semantics, account/secret/sync, backend/API, production config, or deployment config.

Design direction:

- Creative Production style intake selected: keep the existing Gemini-style glass Dropzone and add a compact contextual chip between the title and quota hint.
- The chip uses the current primary blue as a low-contrast state accent, with a separate dark-mode surface, so the overlay feels informative without competing with the main composer.

Scope:

- `app/utils/file.ts`: added a reusable dragged attachment summary helper that reuses the existing `isAttachmentImage(file)` extension fallback and returns structured `text`, `hint`, and `willAdd` state.
- `app/components/chat.tsx`: wired drag-state summary storage, live-status copy, visible summary chip, blocked-state hint copy, summary cleanup on leave/drop, and aligned drop slot pre-classification to `isAttachmentImage(file)`.
- `app/components/chat.module.scss`: added the Dropzone summary chip surface, spacing, dark-mode tuning, and wrapping safeguards.
- `test/gemini-visual-migration.test.ts`: extended the Dropzone contract to cover the summary helper, drag enter/over/leave/drop state handling, live status fallback, visible summary element, and chip styling.
- `test/attachment-file-types.test.ts`: added behavior coverage for normal image+file dragging, full-slot blocked state, partial overflow, empty-MIME image extension fallback through both `DataTransfer.files` and `DataTransfer.items`, and the file-slots-full / image-slot-open empty-MIME edge case.
- No model config semantics, account/secret/sync, backend/API, production config, deployment config, upload/send behavior, or persisted app store keys were changed.

Automated checks:

- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="file drag-and-drop" --silent` failed first as expected because `getDraggedAttachmentSummary` and `dragPayloadSummary` did not exist yet.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="file drag-and-drop" --silent`
- `npx jest test/attachment-file-types.test.ts --runInBand --silent`
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="file drag-and-drop" --silent` after review fixes.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --silent`
- `yarn lint`
- `npx tsc --noEmit`
- `git diff --check`
- `yarn build`

Review:

- Read-only code review found two Important issues before commit: full-slot states could still say “release to add”, and empty-MIME image files could be summarized as files even though real upload handling treats image extensions as images.
- Fixed by moving summary calculation to `app/utils/file.ts`, reusing `isAttachmentImage(file)`, returning structured hint state, and changing full-slot visible/live copy to `释放后不会添加新附件`.
- Added behavior tests for normal, partial overflow, full-slot blocked, and empty-MIME image fallback cases.
- Follow-up read-only review found one remaining Important issue: `drop` slot pre-classification still used MIME-only image detection. Fixed by changing the pre-classification to `isAttachmentImage(file)` and adding a source contract plus behavior coverage for an empty-MIME `.png` when file slots are full.

Browser QA:

- in-app Browser at `http://localhost:3000/`: loaded the local app, confirmed the chat UI and Dropzone DOM were available, and checked console output for app runtime errors before event-level testing.
- Temporary isolated Chrome QA desktop viewport `1440x1024`: intercepted only the temporary browser's local `/api/config` response to disable the access gate, dispatched synthetic local `File` objects for one PNG and one text file, and verified `data-drop-active="true"`, summary text `将添加 1 张图片、1 个文件`, live status with the same summary, chip min-height `28px`, font weight `500`, background `rgba(66, 133, 244, 0.12)`, no horizontal overflow, and inactive status/live text cleanup after drag leave.
- Temporary isolated Chrome QA desktop viewport `1440x1024` after review fixes: verified normal drag `将添加 1 张图片、1 个文件`, empty-MIME `camera.png` drag `将添加 1 张图片`, and after filling the temporary composer with 3 synthetic PNGs and 5 local text files, verified full-slot drag `附件数量已达上限`, hint `释放后不会添加新附件`, live status `附件数量已达上限，释放后不会添加新附件。`, and no horizontal overflow.
- Temporary isolated Chrome QA mobile viewport `390x844`: repeated the normal, empty-MIME, full-slot, live-status, cleanup, and overflow checks; the summary chip stayed inside viewport bounds.
- Temporary isolated Chrome QA after the follow-up review fix: in both `1440x1024` and `390x844`, filled only the 5 file slots, then dragged and dropped an empty-MIME `camera.png`; verified the summary stayed `将添加 1 张图片`, the composer produced `编辑第 1 张图片附件`, the 5 file attachments remained, and `bodyOverflowX: false`.
- Browser QA used synthetic local `File` objects only, did not upload personal files, did not send a message, did not call a model/API, and did not persist production data.

Known risks:

- QA covers representative `DataTransfer.files`, `DataTransfer.items`, empty-MIME image, normal, partial overflow, and full-slot states, but does not exhaust every browser-native drag payload shape.
- Computed `display` appears as `flex` in Chrome because the summary chip is blockified as a flex item, while the authored CSS contract remains `display: inline-flex`.

## Iteration 2026-06-20 markdown-thinking-card

Result: passed.

Target flow:

- AI-rendered `<think>` sections should look like the rest of the Gemini-style Markdown surface instead of a raw disclosure row with a legacy spinner.
- The live thinking state should keep a visible low-motion status indicator, while completed thinking sections keep the same disclosure behavior and timing text.
- The change must not alter model config semantics, reasoning effort settings, message streaming, account/secret/sync, backend/API, production config, deployment config, or persisted store keys.

Design direction:

- Creative Production style intake selected: quiet reasoning card, translucent glass surface, compact status pill, three-dot thinking pulse, dark-mode balanced, reduced-motion safe, content-first, no new assets, and no backend/model semantics changes.

Scope:

- `app/components/markdown.tsx`: preserved `details` / `summary` HTML attributes from `rehype-raw`, added dedicated `markdown-thinking` and `markdown-thinking-summary` classes to generated `<think>` sections, and marked the decorative loader `aria-hidden`.
- `app/styles/markdown.scss`: added the thinking card surface, summary pill, open-state caret, three-dot pulse, dark-mode tuning, and reduced-motion stop rules scoped only to `.markdown-thinking`.
- `test/gemini-visual-migration.test.ts`: locked the generated class hooks, attribute passthrough, light/dark/reduced-motion CSS, and non-legacy loader contract.
- No model config semantics, reasoning effort values, upload/send behavior, account/secret/sync, backend/API, production config, deployment config, or persisted app store keys were changed.

Automated checks:

- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="thinking details" --silent` failed first as expected because thinking sections did not have dedicated classes, the custom `Details`/`Summary` wrappers dropped raw HTML attributes, and the styling contract was absent.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="thinking details" --silent`
- `npx jest test/gemini-visual-migration.test.ts --runInBand --silent`
- `npx jest test/markdown-file-attachment.test.tsx test/markdown-code-language.test.tsx test/markdown-code-fold.test.tsx --runInBand --silent`
- `yarn lint`
- `npx tsc --noEmit`
- `git diff --check`
- `yarn build`

Review:

- Read-only sub-agent review found no Critical or Important issues. It verified the `details` / `summary` attribute passthrough does not add executable raw HTML behavior with the current `react-markdown@8` + `rehype-raw` stack, ordinary details are not affected by the scoped `.markdown-thinking` selectors, and reduced-motion coverage is effective.

Browser QA:

- in-app Browser desktop default viewport at `http://localhost:3000/?qa=thinking-card`: verified runtime CSSOM loaded the `details.markdown-thinking` shell with `backdrop-filter: blur(14px) saturate(160%)`, the `summary.markdown-thinking-summary` inline-flex pill, the `.thinking-loader` pulse rule, dark-mode thinking rules, `horizontalOverflowPx: 0`, and no console warn/error logs.
- in-app Browser mobile `390x844` and narrow `320x740`: repeated the CSSOM and overflow checks; thinking shell/summary/loader/dark rules stayed loaded, `horizontalOverflowPx: 0`, and no console warn/error logs.
- Runtime CSSOM confirmed the reduced-motion media rule for `.markdown-body details.markdown-thinking .thinking-loader` and `summary.markdown-thinking-summary::before`; Chrome serializes `animation: none` as a full animation shorthand, so the source/Jest contract remains the clearer reduced-motion assertion.

Known risks:

- in-app Browser evaluate is read-only and blocks temporary DOM construction via `document.createElement`, so live DOM shape is covered by the source/Jest contract and runtime CSSOM rather than injected DOM measurement.
- Read-only exploration identified the next recommended UI slice as the shortcut key modal's dialog semantics and narrow-screen key-row readability.

## Iteration 2026-06-20 shortcut-modal-semantics

Result: passed.

Target flow:

- The keyboard shortcut modal should be announced as a real dialog with a stable title, and its shortcuts should read as a concise list rather than a set of unlabelled visual rows.
- Compact screens should keep shortcut labels and key tokens readable without horizontal overflow or compressed key groups.
- The change must not alter model config semantics, shortcut behavior, account/secret/sync, backend/API, production config, deployment config, persisted store keys, or existing modal close behavior.

Design direction:

- Creative Production style intake selected: keep the existing Gemini-style utility modal surface, improve its semantic structure, and make compact key rows scan as title-first rows with key chips below.
- The visual change stays quiet and layout-focused: no new colors, assets, copy, dependencies, or backend behavior.

Scope:

- `app/components/chat.tsx`: added `shortcut-key-modal` dialog semantics, `aria-modal`, title association via `shortcut-key-modal-title`, and list/listitem semantics with readable shortcut labels.
- `app/components/chat.module.scss`: added flex sizing for shortcut titles/key rows and switched compact shortcut rows to a vertical title + key-token layout.
- `test/gemini-visual-migration.test.ts`: extended the shortcut modal contract to cover dialog title association, list semantics, item labels, and compact key-row layout rules.
- No model config semantics, shortcut key mappings, account/secret/sync, backend/API, production config, deployment config, or persisted app store keys were changed.

Automated checks:

- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="keeps shortcut key modal bounded"` failed first as expected because the shortcut modal lacked the new semantic and compact-layout contract.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="keeps shortcut key modal bounded"`
- `npx jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `git diff --check`
- `yarn build`

Review:

- Read-only code review found no Critical or Important issues.
- Remaining risk noted by review: source/CSS static tests alone cannot prove actual assistive technology output, but Browser QA verified the runtime dialog/list semantics and compact layout.

Browser QA:

- in-app Browser at `http://localhost:3000/`, desktop viewport `1440x1024`: opened the modal with `Control+/`, verified `role="dialog"`, `aria-modal="true"`, `aria-labelledby="shortcut-key-modal-title"`, title text `键盘快捷方式`, `role="list"`, 5 `role="listitem"` shortcut rows, readable item labels, row layout `row`, no horizontal overflow, and console warn/error logs: `0`.
- in-app Browser compact viewport `390x844`: repeated the semantic checks, verified the 5 shortcut rows switched to `flex-direction: column`, key rows used `justify-content: flex-start`, key row width stayed inside item width, page horizontal overflow stayed `0`, and console warn/error logs: `0`.
- Browser QA did not send a message, did not call a model/API, did not upload files, and did not persist production data.

Known risks:

- QA covered the Chinese locale runtime labels and current keyboard shortcut set. If future shortcut names become much longer, the compact row should be rechecked around 320px width.

## Iteration 2026-06-20 shortcut-modal-focus-loop

Result: passed.

Target flow:

- `Control+/` / `Command+/` opens the keyboard shortcut modal and moves focus into the modal confirm action instead of leaving focus on the page behind it.
- Escape, the modal close button, and Confirm all close through the same path and restore focus to the opener, with `#chat-input` as the fallback when the opener is `document.body` or no longer connected.
- The desktop tools-menu shortcut entry closes the tools menu before opening the shortcut modal, then restores focus to the tools button when available.
- The change must not alter model config semantics, shortcut mappings, account/secret/sync, backend/API, production config, deployment config, persisted store keys, or existing send/upload behavior.

Design direction:

- Creative Production style intake selected: keep the existing Gemini-style utility modal visual design and improve interaction polish only.
- No new colors, copy, assets, dependencies, configuration keys, or backend behavior.

Scope:

- `app/components/chat.tsx`: added an opener-aware shortcut modal open/close path, focused the modal confirm button on open, restored focus after close, and routed the tools-menu entry through the existing action-menu close callback.
- `test/gemini-visual-migration.test.ts`: extended the shortcut modal contract to cover focus entry, opener fallback, tools-menu close-before-open behavior, and a shared close path for Escape / Close / Confirm.
- No model config semantics, shortcut mappings, account/secret/sync, backend/API, production config, deployment config, or persisted app store keys were changed.

Automated checks:

- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="shortcut key modal"` failed first as expected because the shortcut modal did not yet have an opener-aware focus loop.
- A second targeted red check caught the `document.body` opener fallback case before the final fix.
- `npx jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `git diff --check`
- `yarn build`

Review:

- Sub-agent review was attempted but could not run because the account usage limit was reached.
- Main-thread code review found no Critical or Important issues. It verified `IconButton` passes `autoFocus` to the real button, `Modal` Escape / close button / Confirm share the same close path, opener restoration ignores `document.body` and disconnected nodes, and the tools-menu path closes the menu before opening the shortcut modal.

Browser QA:

- in-app Browser desktop viewport `1440x1024`: opened the modal with `Control+/`, verified focus moved to the `确认` button inside the `role="dialog"` modal, the modal kept `aria-modal="true"` / `aria-labelledby="shortcut-key-modal-title"`, 5 shortcut rows rendered, page horizontal overflow stayed `0`, and Escape returned focus to `#chat-input`.
- in-app Browser mobile viewport `390x844`: repeated the focus-entry and Escape-return checks, verified compact shortcut rows stayed column-based, key rows aligned left, and page horizontal overflow stayed `0`.
- in-app Browser narrow viewport `320x740`: verified modal focus stayed inside the confirm action, shortcut rows remained within the viewport, and page horizontal overflow stayed `0`.
- Runtime local config did not expose the desktop tools-menu shortcut entry during Browser QA, so that source path is covered by the code contract and Jest source test rather than visual interaction.
- Browser QA did not send a message, did not call a model/API, did not upload files, and did not persist production data.

Known risks:

- Runtime visual QA did not cover the tools-menu shortcut entry because the current local config hides it. If `enableShortcuts` exposes that entry in another environment, recheck the menu-to-modal focus path visually.

## Iteration 2026-06-20 streaming-wait-accessibility

Result: passed.

Target flow:

- While an assistant message is waiting for the first streamed token, the existing Gemini-style skeleton remains the only visible loading surface.
- The loading state also exposes a stable screen-reader status using the existing `Locale.Chat.Typing` copy, without rendering the legacy three-dot SVG directly in the Markdown body.
- The status node must not add visual text, extra height, layout shift, or persistent motion.
- The change must not alter model config semantics, streaming protocol, message content, token counting, first-token delay tracking, account/secret/sync, backend/API, production config, deployment config, persisted store keys, upload/send behavior, or existing shimmer/reveal timing.

Design direction:

- Creative Production style intake selected: keep the current streaming skeleton visually quiet, content-first, and low-interruption; improve assistive output without adding visible copy or new motion.
- No new colors, visible UI text, assets, dependencies, API paths, or configuration keys.

Scope:

- `app/components/markdown.tsx`: replaced the direct Markdown loading SVG with a `role="status"` / `aria-live="polite"` / `aria-atomic="true"` status node that reuses `Locale.Chat.Typing`.
- `app/styles/markdown.scss`: added a visually-hidden, layout-neutral `.markdown-loading-status` rule so the status stays in the accessibility tree but does not participate in the shimmer layout.
- `test/gemini-visual-migration.test.ts`: extended the streaming wait contract to lock the accessible status, removal of the direct `LoadingIcon` loading branch, hidden status styling, unchanged shimmer hooks, streaming reveal, and reduced-motion guards.
- No model config semantics, streaming protocol, message content, token counting, first-token delay tracking, account/secret/sync, backend/API, production config, deployment config, or persisted app store keys were changed.

Automated checks:

- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="streaming wait state"` failed first as expected because the Markdown loading branch did not expose `markdown-loading-status`.
- Read-only review then caught that the first implementation made the status node contribute `min-height: 48px`; a follow-up red check failed on the corrected non-layout contract before the fix.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="streaming wait state"`
- `npx jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit`
- `git diff --check`
- `yarn build`

Review:

- Read-only sub-agent review found one Important issue: the initial status wrapper used `display: block` and `min-height: 48px`, which could add layout height inside the existing shimmer skeleton.
- Fixed by moving the visual hiding and 1px sizing to `.markdown-loading-status` itself, removing `min-height`, and keeping the existing chat shimmer as the only visual loading structure.
- No Critical issues remained after the fix.

Browser QA:

- in-app Browser desktop viewport `1440x1024` at `http://localhost:3000/?qa=streaming-wait-accessibility-final-desktop#/chat`: verified the chat UI mounted, `#chat-input` existed, runtime CSSOM loaded `.markdown-body .markdown-loading-status` as absolute 1px clipped text with no `min-height`, page horizontal overflow stayed `0`, and console warn/error logs: `0`.
- in-app Browser mobile viewport `390x844`: repeated the CSSOM, mount, overflow, and console checks with the same result.
- in-app Browser narrow viewport `320x740`: repeated the CSSOM, mount, overflow, and console checks with the same result.
- Browser QA did not send a message, did not call a model/API, did not upload files, and did not persist production data. The actual waiting DOM state is covered by source/Jest contracts because creating a real waiting response would require sending a message.

Known risks:

- Browser QA verifies the runtime styles and layout shell, while the active loading DOM contract is covered by Jest/source inspection rather than a live model request.

## Iteration 2026-06-20 composer-tools-menu-focus-entry

Result: passed.

Target flow:

- Opening the composer `+` tools menu moves keyboard focus into the first available menu action instead of leaving it on the trigger.
- ArrowDown, Home, and End keep using the existing roving-focus behavior once the menu is open.
- Escape and backdrop close still return focus to the `+` trigger.
- Rapid close-and-reopen during the menu transition keeps the same focus-entry contract.
- The change must not alter model config semantics, account/secret/sync, backend/API, production config, deployment config, upload/file picker behavior, image generation settings, shortcut mappings, persisted store keys, or send/model request behavior.

Design direction:

- Creative Production style intake selected: treat the tools menu as a compact Gemini-style command surface, where opening the dialog immediately places the user inside the available actions.
- Keep the current visual treatment, labels, menu contents, animation, and responsive geometry unchanged; improve only focus choreography and assistive interaction predictability.

Scope:

- `app/components/chat.tsx`: added an open-state focus effect for `chat-input-action-menu` that focuses the first enabled visible `chat-input-action`, and added a delayed stabilization pass for rapid close/reopen transitions without overriding focus once the user is already inside a menu action.
- `test/gemini-visual-migration.test.ts`: extended the composer tools contract to require focus entry, active-action preservation, delayed stabilization, frame/timer cleanup, and the existing Escape/backdrop focus-return behavior.
- No model config semantics, account/secret/sync, backend/API, production config, deployment config, upload/file picker behavior, image generation settings, shortcut mappings, persisted store keys, or send/model request behavior were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because opening the tools menu did not yet focus the first menu action.
- Browser QA then exposed a rapid close/reopen edge case where the trigger could keep focus; the test contract was expanded and failed first as expected.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`

Review:

- Main-thread code review found no Critical or Important issues.
- The focus effect is scoped to `showChatActionMenu`, cancels both the RAF and stabilization timer on close/unmount, skips refocusing when the active element is already a menu action, and leaves downstream actions such as upload, prompt hints, shortcut modal, and image generation with their existing handlers.

Browser QA:

- in-app Browser desktop viewport `1440x1024`: initial menu trigger was closed; opening focused `上传附件`, ArrowDown moved to `快捷指令`, Home returned to `上传附件`, End moved to `图片生成`, Escape returned focus to `打开对话工具`, rapid reopen again focused `上传附件`, right-top backdrop close returned focus to `打开对话工具`, menu rect stayed within viewport, page horizontal overflow stayed `0`, and console warn/error logs: `0`.
- in-app Browser mobile viewport `390x844`: opening focused `上传附件`, ArrowDown/End moved to `图片生成`, Home returned to `上传附件`, Escape and backdrop both returned focus to `打开对话工具`, menu rect stayed within viewport, page horizontal overflow stayed `0`, and console warn/error logs: `0`.
- in-app Browser narrow viewport `320x740`: repeated the mobile focus, Escape/backdrop, menu bounds, overflow, and console checks with the same result.
- Browser QA did not send a message, did not call a model/API, did not upload files, did not open an OS file picker, and did not persist production data.

Known risks:

- The delayed stabilization is intentionally limited to focus entry only; it does not trap focus or change the behavior of nested tools that open their own UI.

## Iteration 2026-06-20 composer-send-ready-state

Result: passed.

Target flow:

- The composer send button should communicate whether a message can actually be submitted.
- Empty composer state is disabled and visually quiet.
- Typing text enables the existing send control without changing its accessible name or layout.
- Clearing the text returns the control to disabled.
- Attachments remain part of the same ready-state contract because they already bypass the empty-text guard in `doSubmit`.
- The change must not alter `doSubmit`, model config semantics, image generation settings, prompt hints, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, or model request payload construction.

Design direction:

- Creative Production style intake selected: treat the send control like a Gemini-style input affordance that feels responsive to readiness, with a quiet disabled state and the same strong primary state once content exists.
- Keep the existing circular send geometry, placement, icon, accessible name, and responsive layout unchanged.

Scope:

- `app/components/chat.tsx`: added `canSubmitComposer` from the same practical guard used by `doSubmit` (`trimmed text || images || files`) and passed it to the existing send `IconButton` as `disabled={!canSubmitComposer}`.
- `app/components/chat.module.scss`: added a no-shadow, no-transform disabled send state plus dark-mode icon/background tuning.
- `test/gemini-visual-migration.test.ts`: extended the composer contract to lock the submit-ready guard, disabled prop wiring, and disabled visual state.
- No `doSubmit`, model config semantics, image generation settings, prompt hints, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, or model request payload construction was changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `canSubmitComposer` and the disabled send state did not exist.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`

Browser QA:

- in-app Browser desktop viewport `1440x1024`: empty composer had one `发送` button, `disabled=true`, cursor `default`, no shadow, muted icon fill, no input overlap, no right/bottom overflow, and page horizontal overflow `0`; typing `测试发送按钮状态` changed the same button to enabled primary state without overflow; keyboard-clearing the input returned it to disabled; console warn/error logs: `0`.
- in-app Browser mobile viewport `390x844`: empty compact composer had icon-only `发送` with `disabled=true`, muted fill, no shadow, no input overlap, no right/bottom overflow, page horizontal overflow `0`; typing enabled the same control; clearing disabled it again; console warn/error logs: `0`.
- in-app Browser narrow viewport `320x740`: repeated the mobile disabled/enabled/disabled cycle with no overlap, no viewport overflow, and console warn/error logs: `0`.
- Browser QA did not click send, did not send a message, did not call a model/API, did not upload files, did not open an OS file picker, and did not persist production data.

Review:

- Read-only sub-agent review was attempted but could not run because the account usage limit was reached.
- Main-thread code review found no Critical or Important issues. It verified the ready-state guard matches the existing empty-submit guard, the send `IconButton` uses native disabled semantics, the disabled style overrides the shared button opacity/shadow, and no `doSubmit`, upload, prompt-hint, image-generation, model config, API, or store paths were changed.

Known risks:

- Browser QA covered the text ready-state path. Attachment-only enablement is covered by the source/Jest contract because exercising real upload or file picker paths would leave this slice's interaction boundary.

## Iteration 2026-06-20 composer-tools-menu-tab-containment

Result: passed.

Target flow:

- When the composer tools menu is open, Tab should move through the visible enabled tool actions instead of escaping to the textarea, send button, sidebar, or browser chrome.
- Shift+Tab should wrap from the first visible action to the last visible action.
- The existing ArrowDown, ArrowUp, Home, End, Escape, and backdrop close behavior must remain intact.
- Nested `[role="listbox"]` surfaces must keep their own keyboard behavior and should not be trapped by the tools menu handler.
- The change must not alter tool ordering, upload behavior, prompt hints, shortcut modal behavior, image generation settings, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, or model request payload construction.

Design direction:

- Creative Production style intake selected: treat the tools menu as a compact Gemini-style command surface that behaves like a contained modal once opened.
- Keep the existing menu geometry, action labels, action ordering, icons, backdrop, and close affordances unchanged; improve only keyboard containment.

Scope:

- `app/components/chat.tsx`: added `trapChatActionMenuTab` to cycle focus through visible enabled `chat-input-action` buttons and wired it into `handleChatActionMenuKeyDown` after the nested listbox guard.
- `test/gemini-visual-migration.test.ts`: extended the composer tools contract to require Tab/Shift+Tab wrapping, `preventDefault`/`stopPropagation`, visible-action filtering, and listbox exclusion.
- No tool ordering, upload behavior, prompt hints, shortcut modal behavior, image generation settings, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, or model request payload construction was changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because `trapChatActionMenuTab` did not exist.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`

Browser QA:

- in-app Browser desktop viewport `1440x1024`: opening focused `上传附件`; Tab sequence was `快捷指令` -> `图片生成` -> `上传附件`; Shift+Tab wrapped to `图片生成`; Escape returned focus to `打开对话工具`; empty-area backdrop click returned focus to `打开对话工具`; menu stayed within viewport; page horizontal overflow stayed `0`; console warn/error logs: `0`.
- in-app Browser mobile viewport `390x844`: opening focused `上传附件`; Tab sequence was `图片生成` -> `上传附件`; Shift+Tab wrapped to `图片生成`; Escape/backdrop returned focus to `打开对话工具`; menu stayed within viewport; page horizontal overflow stayed `0`; console warn/error logs: `0`.
- in-app Browser narrow viewport `320x740`: repeated the mobile Tab/Shift+Tab, Escape/backdrop, menu bounds, overflow, and console checks with the same result.
- Browser QA did not send a message, did not call a model/API, did not upload files, did not open an OS file picker, and did not persist production data.

Review:

- Read-only sub-agent review found no Critical/Important issues and no blocking Minor issues. It verified the visible/enabled action filtering, Tab/Shift+Tab wrap logic, listbox guard ordering, and unchanged Escape/backdrop close paths.
- Main-thread code review found no Critical or Important issues. It verified the new trap is scoped to the existing tools menu keyboard handler, does not change tool ordering or action handlers, and leaves upload, prompt hints, shortcut modal, image generation, model config, API, and store paths untouched.

Known risks:

- Browser QA used empty-area coordinate click for backdrop close because a direct backdrop locator click in the Browser runtime can click through to the textarea even though a user-style empty-area click closes the menu.

## Iteration 2026-06-20 message-copy-feedback-state

Result: passed.

Target flow:

- Ordinary message copy actions should expose short copied feedback, matching the quality of Markdown code-block copy feedback.
- The copied state should appear only after `copyToClipboard` reports success; failed copy attempts should keep the action in its normal state and should not announce success.
- Repeated copy attempts should not allow stale async completions to overwrite the latest copied state.
- Async focus restoration should keep the clicked action usable without stealing focus after the user has moved elsewhere.
- The action rail dimensions, message content, clipboard payload, model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat the message action rail as a quiet Gemini-style utility surface where feedback is brief, local, and visually restrained.
- Reuse the existing copy action geometry and label rhythm; show a green success tint and confirmation icon while copied, with a visually hidden polite status for assistive technology.

Scope:

- `app/utils.ts`: made `copyToClipboard` return a success boolean while preserving the existing success/failure toast behavior and fallback cleanup.
- `app/components/chat.tsx`: added copied-state tracking, request race protection, guarded focus restoration, action label/title/aria updates, confirmation icon swap, and a polite status node.
- `app/components/chat.module.scss`: added scoped copied-state styling for light and dark mode plus the visually hidden status utility.
- `app/components/sd/sd.tsx`: updated the existing SD history copy action to discard the new success boolean explicitly, preserving its prior click behavior.
- `test/gemini-visual-migration.test.ts`: extended the source contract for success-gated copied state, stale-request protection, focus-restore guard, timer cleanup, action accessibility, CSS state styling, and fallback clipboard cleanup.
- No send/model/upload/backend/store/config paths were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand` failed first as expected because the ordinary message copy feedback state did not exist.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`

Browser QA:

- in-app Browser desktop viewport `1440x1024`: clicked the existing message copy action in the local `测试消息` conversation; the action changed from `用户消息 2 操作：复制` to `用户消息 2 操作：已写入剪贴板`, kept focus on the button, exposed `data-copy-state="copied"`, switched text to `已写入剪贴板`, showed the green success background/color, announced `用户消息 2 已写入剪贴板`, kept the action rail dimensions stable, kept horizontal overflow at `0`, and produced no new warn/error logs. After the feedback timeout, the copied state and live status cleared.
- in-app Browser mobile viewport `390x844`: repeated the same copied-state, focus, status, rail-stability, overflow, console, and timeout reset checks with the same result.
- in-app Browser narrow viewport `320x740`: repeated the same copied-state, focus, status, rail-stability, overflow, console, and timeout reset checks with the same result.
- Browser QA did not send a message, did not call a model/API, did not upload files, did not open an OS file picker, and did not persist production data.

Review:

- Read-only sub-agent review found two Important issues: copied state could be set before copy success, and async completion could steal focus after the user moved elsewhere. Both were fixed before final verification.
- The same review noted the remaining test gap that this path is covered by source-contract tests plus Browser QA rather than a full Testing Library interaction test.
- Main-thread code review verified that copied feedback is success-gated, stale requests are ignored, fallback textarea cleanup runs in `finally`, focus restoration is guarded by the active element, the SD copy handler preserves its prior behavior while satisfying the updated utility return type, and no model/account/sync/backend/deployment paths were touched.

Known risks:

- No Testing Library interaction test was added for the click path; Browser QA covers the real interaction, and the source contract covers failure, focus, race, and cleanup behavior.

## Iteration 2026-06-20 message-action-rail-keyboard-navigation

Result: passed.

Target flow:

- Ordinary message action rails should support keyboard movement inside the current rail once an action has focus.
- `ArrowRight` and `ArrowDown` move to the next visible enabled action.
- `ArrowLeft` and `ArrowUp` move to the previous visible enabled action.
- `Home` moves to the first visible enabled action, and `End` moves to the last.
- The focus movement should not call `scrollIntoView`; the message viewport should not jump while moving across actions.
- Modified arrow keys should remain available for global or browser shortcuts and should not be intercepted by the rail handler.
- The change must not alter retry/delete/pin/copy click behavior, message content, clipboard payload, send/model/upload/backend/store/config paths, account/secret/sync, production config, deployment config, or model request payload construction.

Design direction:

- Creative Production style intake selected: treat the message action rail as a compact Gemini-style utility toolbar that stays visually quiet but supports fast keyboard scanning.
- Keep the current icon-only geometry, action ordering, labels, copy feedback state, focus ring styling, and responsive layout unchanged.

Scope:

- `app/components/chat.tsx`: added current-rail action discovery, Arrow/Home/End focus movement, and an `onKeyDown` binding on the message action rail.
- `test/gemini-visual-migration.test.ts`: extended the message action rail contract to lock visible enabled action filtering, unmodified direction keys, modified-key passthrough, `preventDefault`/`stopPropagation`, `preventScroll` focus, no `scrollIntoView`, and rail DOM wiring.
- No CSS, send/model/upload/backend/store/config files, or action business handlers were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` failed first as expected because the message action rail keyboard helpers did not exist.
- Browser QA then exposed a mobile scroll-jump risk caused by `scrollIntoView`; the test contract was tightened to require no `scrollIntoView` and failed first as expected.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"`
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit --pretty false`
- `git diff --check`

Browser QA:

- in-app Browser desktop viewport `1440x1024`: selected the existing local `测试消息` conversation; the first user-message rail exposed `重试`, `删除`, `固定`, `复制`; `ArrowRight` moved focus through delete, pin, and copy; `ArrowLeft` moved back to pin; `Home` returned to retry; `End` moved to copy; active element remained a button; rail dimensions stayed `154x40`; page horizontal overflow stayed `0`; no framework overlay appeared; no new warn/error logs were recorded.
- in-app Browser mobile viewport `390x844`: repeated the same focus sequence on the same rail; active element remained a button; page horizontal overflow stayed `0`; no framework overlay appeared; no new warn/error logs were recorded. Playwright locator-based key presses can scroll targets before dispatching keys, so the application contract is guarded in source by `focus({ preventScroll: true })` and no rail `scrollIntoView` call.
- in-app Browser narrow viewport `320x740`: repeated the same focus sequence, overflow, overlay, and log checks with the same result.
- After the modified-key fix, a fresh Browser tab entered a blank DOM state with a pre-existing Next/router error timestamped before this slice's verification; the modified-key passthrough was therefore verified by the failing-then-passing source contract rather than a second live Browser interaction.
- Browser QA did not click retry/delete/pin/copy, did not send a message, did not call a model/API, did not upload files, did not open an OS file picker, and did not persist production data.

Review:

- Read-only explorer confirmed this slice is limited to message action rail keyboard focus and does not need CSS changes.
- Read-only code review found one Important issue: modified arrow keys were initially intercepted by the rail handler, which could block existing global shortcut behavior. Fixed by returning early when `metaKey`, `ctrlKey`, `altKey`, or `shiftKey` is present, and locked this in the test contract.
- Main-thread review verified the handler only responds to unmodified Arrow/Home/End keys, only searches the current rail, filters disabled/hidden buttons, prevents default browser scrolling for handled keys, preserves native Tab and modified-key behavior, and leaves action click handlers plus send/model/upload/backend/store/config paths untouched.

Known risks:

- This is arrow-key focus movement, not a strict single-tab-stop roving tabindex toolbar. Native Tab order across the individual action buttons is intentionally preserved for this small slice.

## Iteration 2026-06-20 mobile-sidebar-dialog-focus

Result: passed.

Target flow:

- Opening the compact mobile sidebar should expose the drawer as a temporary dialog-like surface for assistive technology.
- The drawer should only expose `role="dialog"` and `aria-modal="true"` while it is open.
- Opening the drawer should move focus onto the drawer, and Tab/Shift+Tab should stay inside the drawer's visible focusable controls.
- Escape should close the mobile drawer without changing any sidebar route/action semantics.
- Backdrop close and Escape close should both restore focus to the mobile drawer trigger.
- The change must not alter model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, or model request payload construction.

Design direction:

- Creative Production style intake selected: keep the existing Gemini-style glass drawer visuals, route-driven drawer open state, and right-edge backdrop close affordance; improve only the semantic and focus containment contract.
- Keep drawer width, background, shadow, navigation order, account area, icons, and route targets unchanged.

Scope:

- `app/components/sidebar.tsx`: exposed `#mobile-sidebar-drawer` as `role="dialog"` with `aria-modal`, the existing chat-list label, and `tabIndex={-1}` only while the compact drawer is open.
- `app/components/home.tsx`: introduced `isMobileDrawerOpen` so Escape/listener behavior only applies when the drawer actually renders, reused one `closeMobileSidebar` path for backdrop and Escape close, restored focus to `[data-mobile-sidebar-trigger]`, focused the drawer on open, and trapped Tab/Shift+Tab inside visible drawer controls.
- `test/gemini-visual-migration.test.ts`: extended the mobile shell contract to lock drawer semantics, actual-open gating, Escape close wiring, focus restoration, and Tab containment.
- No model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, model request payload construction, or dependency files were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` failed first as expected because the drawer lacked dialog semantics.
- The same test failed once more because the source-contract regex was too sensitive to line breaks and quote style; the assertion was narrowed to the real contract.
- After review tightened the contract, the same targeted test failed first because the drawer lacked `tabIndex` and Tab containment; the implementation was then updated.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"`

Browser QA:

- in-app Browser desktop viewport `1280x720`: page identity `NeatChat`; no framework overlay; `#mobile-sidebar-drawer` existed with no `role`, no `aria-modal`, no `aria-hidden`, no `tabindex`, desktop drawer bounds `left: 0`, `right: 300`, width `300`, horizontal overflow `0`, and console warn/error logs `0`.
- in-app Browser viewport override could not be used for mobile verification because the Browser viewport capability continued to report `innerWidth: 1280` after setting `390x844`; mobile validation therefore used local headless Chrome via DevTools Protocol against `localhost:3000`, with a temporary QA-only profile state to pass the local access gate. No real access code, API key, account, sync, model request, upload, or production data was used.
- Chrome/CDP mobile viewport `390x844`: before open, trigger `aria-expanded=false`, drawer `display=none`, `aria-hidden=true`, no `role`, no `aria-modal`, horizontal overflow `0`. After open, URL `#/`, trigger `aria-expanded=true`, drawer `display=flex`, `role=dialog`, `aria-modal=true`, `aria-label=查看消息列表`, `tabindex=-1`, bounds `left: 0`, `right: 304`, width `304`, horizontal overflow `0`, and focus on the drawer. Tab moved focus to `新的聊天`; Shift+Tab wrapped to `设置`; both remained inside the drawer. Escape closed to `#/chat`, removed `role/aria-modal`, restored `aria-hidden=true`, and returned focus to the trigger. Reopening then clicking the right-edge backdrop produced the same closed state and focus return. Console/CDP log count `0`.
- Chrome/CDP narrow mobile viewport `320x740`: same open/Tab/Shift+Tab/Escape/backdrop path; open drawer bounds `left: 0`, `right: 266`, width `266`, horizontal overflow `0`, focus remained inside the drawer, and console/CDP log count `0`.
- Screenshots inspected: `/tmp/neatchat-mobile-drawer-390.png` and `/tmp/neatchat-mobile-drawer-320.png`; both showed the glass drawer, right-side dimmed backdrop, and no clipping/overlap.

Review:

- Read-only explorer recommended this slice as the safest next step because the existing mobile shell already exposed `aria-controls`, route-driven open state, and backdrop close, but lacked the dialog/focus handoff contract.
- Read-only code review found two Important issues: Escape was initially gated by route rather than actual drawer render state, and `aria-modal` needed focus containment. Both were fixed before final verification.
- Main-thread code review found no remaining Critical or Important issues. It verified that the new close path is scoped to `isMobileDrawerOpen`, Escape/Tab only register while the drawer is actually open, desktop keeps non-modal sidebar semantics, and the implementation leaves model/config/API/store/upload paths untouched.

Known risks:

- Mobile Browser QA used Chrome/CDP fallback because the in-app Browser viewport override did not apply in this environment.
- The fallback used a temporary local QA access-state seed in a headless Chrome profile only to reach the already protected frontend shell; it did not verify authenticated model/API behavior and did not use or persist real credentials.

## Iteration 2026-06-20 prompt-hints-gemini-popover

Result: passed.

Target flow:

- Typing `/` in the composer should open the prompt hints listbox as a quiet Gemini-style elevated surface above the composer.
- The selected prompt hint should use a filled selected state, not only a thin border.
- Prompt hint rows should keep a 44px touch target, left-aligned single-line title/content, and no horizontal overflow on desktop or narrow mobile widths.
- Arrow/Home/Escape keyboard behavior, prompt selection behavior, model config semantics, account/secret/sync, backend/API, upload behavior, persisted store keys, production config, deployment config, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat prompt hints as a compact Gemini-style suggestion surface that matches the composer shell, model menu, and tool menu visual language.
- Use elevated surface, restrained shadow, filled blue selected state, compact row rhythm, and bounded mobile height without changing prompt data or selection semantics.

Scope:

- `app/components/chat.module.scss`: updated `.prompt-hints` and `.prompt-hint` visual chrome with `surface-elevated`, box sizing, padding, thin scrollbar, contained overscroll, 18px popover radius, 44px rows, filled selected/hover/focus state, and a 600px mobile max-height rule.
- `test/gemini-visual-migration.test.ts`: extended the existing source contract for prompt hints elevated chrome, touch target, filled selected state, and mobile height bound.
- No model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, model request payload construction, or dependency files were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` failed first as expected because the root prompt hints style lacked the new Gemini chrome contract.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"`
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit --pretty false`
- `git diff --check`
- `yarn build`

Browser QA:

- in-app Browser desktop viewport `1280x720`: typed `/` in the existing local chat composer; `#chat-prompt-hints` appeared as `role=listbox` with `aria-label=提示词建议`, `407` options, selected item `chat-prompt-hint-0`, selected background `rgba(66, 133, 244, 0.1)`, inset selected shadow, row min-height `44px`, left-aligned text, horizontal overflow `0`, and no warn/error logs.
- Keyboard QA on desktop: `ArrowDown` moved `aria-activedescendant` and `aria-selected` to `chat-prompt-hint-1`, `Home` returned to `chat-prompt-hint-0`, and `Escape` closed the listbox while focus stayed on `#chat-input`; horizontal overflow stayed `0`, and console logs stayed clean.
- in-app Browser mobile viewport `390x844`: typed `/` via coordinate input because Playwright `fill` did not dispatch the mobile input path reliably; prompt hints rendered from `left=10` to `right=380`, height `320`, row min-height `44px`, filled selected state, horizontal overflow `0`, and no warn/error logs.
- in-app Browser narrow viewport `320x740`: prompt hints rendered from `left=10` to `right=310`, width `300`, height `320`, first row actual height `44`, left-aligned text, filled selected state, horizontal overflow `0`, and no warn/error logs.
- Browser QA did not send a message, did not call a model/API, did not upload files, did not open an OS file picker, and did not persist production data.

Review:

- Read-only explorer recommended this slice as the safest next target because prompt hints already had keyboard accessibility but still used older card/selected visuals.
- Read-only code review found no Critical or Important issues and confirmed the diff was limited to prompt hints CSS and source-contract tests.
- Main-thread review verified that no prompt hint behavior logic, model config semantics, account/secret/sync, backend/API, upload behavior, store keys, dependency files, production config, deployment config, or model request payload construction were touched.

Known risks:

- This slice is covered by source-contract tests plus Browser QA rather than a Testing Library interaction test for prompt selection.

## Iteration 2026-06-20 mobile-sidebar-app-body-suppression

Result: passed.

Target flow:

- Opening the compact mobile sidebar should keep the drawer as the only exposed modal surface for assistive technology.
- `#app-body` should receive `aria-hidden=true` and `data-mobile-sidebar-suppressed=true` only after focus has moved into `#mobile-sidebar-drawer`.
- Closing the drawer, desktop layout, auth/SD/artifact routes, and non-open mobile states should not keep `#app-body` suppressed.
- The change must not alter route targets, sidebar actions, model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, or model request payload construction.

Design direction:

- Creative Production style intake selected: keep the existing Gemini-style mobile drawer visuals and route-driven behavior; tighten only the modal semantics behind the glass drawer.
- The main chat surface should become background content while the mobile drawer is open, without visual churn or interaction changes.

Scope:

- `app/components/home.tsx`: added mobile app-body suppression state, made drawer focus return a success boolean based on `document.activeElement`, applied `aria-hidden` / `data-mobile-sidebar-suppressed` to `#app-body` only when the drawer is both open and successfully focused, and kept close/focus-return paths unchanged.
- `test/gemini-visual-migration.test.ts`: extended the mobile shell contract to lock app-body suppression, focus-before-suppress ordering, actual focus success verification, non-open clearing, and the final `isMobileDrawerOpen && isMobileAppBodySuppressed` gate.
- No model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, model request payload construction, or dependency files were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` failed first as expected because `WindowContent` did not support app-body suppression.
- Review then found a focus-order issue; the same targeted test was tightened and failed first because suppression was not gated by focus success.
- Review then found a close/desktop stale-state issue; the same targeted test was tightened and failed first because `WindowContent` was not gated by both drawer-open and suppression state.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"`
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit --pretty false`
- `git diff --check`
- `yarn build`

Browser QA:

- in-app Browser desktop viewport `1280x720`: `#app-body` had no `aria-hidden` and no `data-mobile-sidebar-suppressed`; drawer had no `role`/`aria-modal`; horizontal overflow was `0`; console warn/error logs were `0`.
- in-app Browser mobile viewport `390x844`: opening the drawer set trigger `aria-expanded=true`, drawer `role=dialog`, `aria-modal=true`, drawer bounds `left=0/right=304/width=304`, `#app-body aria-hidden=true`, `data-mobile-sidebar-suppressed=true`, focus on `#mobile-sidebar-drawer`, `activeInsideHiddenAppBody=false`, horizontal overflow `0`, and no warn/error logs. Immediate post-click inspection also showed focus inside drawer before app-body suppression was observed.
- Closing at `390x844` with Escape removed `#app-body` suppression, restored drawer `aria-hidden=true`, removed `role/aria-modal`, set trigger `aria-expanded=false`, kept `activeInsideHiddenAppBody=false`, and kept horizontal overflow `0`.
- in-app Browser narrow viewport `320x740`: opening then pressing Tab kept focus inside the drawer on `新的聊天`, drawer bounds `left=0/right=266/width=266`, `#app-body` remained suppressed, `activeInsideHiddenAppBody=false`, horizontal overflow `0`, and no warn/error logs. Closing with Escape removed suppression and modal attributes.
- Browser QA did not send a message, did not call a model/API, did not upload files, did not open an OS file picker, and did not persist production data.

Review:

- Read-only review first found two Important issues: app-body could be hidden before focus entered the drawer, and the source contract was too syntax-heavy to catch that. Both were fixed by adding focus-success-gated suppression and tightening tests.
- Read-only review then found two more Important issues: close/desktop first render could retain suppression, and focus success returned true when the drawer merely existed. Both were fixed by gating `WindowContent` with `isMobileDrawerOpen && isMobileAppBodySuppressed` and returning true only when `document.activeElement` is inside the drawer.
- Final read-only review found no Critical or Important issues and confirmed no model/account/sync/API/upload/store/deploy boundaries were touched.

Known risks:

- The automated test remains a source-contract test rather than a component-level DOM timing test; Browser QA covers the runtime focus and suppression ordering on the real page.
- The next recommended R4 slice from read-only exploration is Gemini-style bounded display math for KaTeX/LaTeX overflow.

## Iteration 2026-06-20 latex-display-math-bounds

Result: passed.

Target flow:

- Long LaTeX display math rendered by KaTeX should stay inside the assistant message reading column on desktop, mobile, and narrow mobile widths.
- Horizontal overflow should be contained inside the formula surface, not the page or chat body.
- Inline math should remain inline with surrounding text.
- The change must not alter Markdown parsing semantics, model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, or model request payload construction.

Design direction:

- Creative Production style intake selected: treat display math as a quiet Gemini-style reading surface, closer to the existing table scroll shell than a new card component.
- Use restrained background, thin border, compact radius, and touch-friendly horizontal scrolling. Keep inline math visually lightweight and unchanged.

Scope:

- `app/styles/markdown.scss`: added a bounded `.markdown-body .katex-display` surface with `max-width: 100%`, border-box sizing, horizontal scroll, contained overscroll, thin scrollbar, mobile padding/radius, and dark-mode surface tokens.
- `test/gemini-visual-migration.test.ts`: added a source-contract test that locks the KaTeX import/plugin chain, display math scroll surface, dark state, mobile padding, and inline math non-block behavior.
- No Markdown plugin order, model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, model request payload construction, or dependency files were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="LaTeX"` failed first as expected because `.markdown-body .katex-display` had no bounded surface contract.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="LaTeX"`
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`

Browser QA:

- in-app Browser app load `http://localhost:3000`: page identity `NeatChat`, title `NeatChat`, non-empty rendered app content confirmed by targeted DOM read, and console warn/error logs `0`.
- A temporary local HTTP fixture at `http://127.0.0.1:3107` loaded the current dev-server CSS from `/_next/static/css/app/layout.css` and `/_next/static/css/app/page.css`; it did not write project files, seed persisted chat state, send a message, call a model/API, upload files, open an OS file picker, or use real account/API data.
- Browser security policy blocked a `data:` fixture, so validation used the safer local HTTP fixture instead.
- Desktop Browser viewport `1280x720`: `.katex-display` width `688`, clientWidth `686`, scrollWidth `1558`, formula width `1530`, `overflow-x=auto`, `overflow-y=hidden`, `overscroll-behavior-x=contain`, `scrollbar-width=thin`, page horizontal overflow `0`, inline math `display=inline`, and dark surface border/background applied. Coordinate horizontal scroll moved formula `scrollLeft` from `0` to `700`.
- Mobile Browser viewport `390x780`: display width `358`, clientWidth `356`, scrollWidth `1554`, formula width `1530`, padding `12px`, radius `12px`, page horizontal overflow `0`, inline math `display=inline`, and console warn/error logs `0`.
- Narrow Browser viewport `320x720`: display width `288`, clientWidth `286`, scrollWidth `1554`, formula width `1530`, padding `12px`, radius `12px`, page horizontal overflow `0`, inline math `display=inline`, and console warn/error logs `0`.
- Browser screenshot capture failed twice on the fixture tab with `Timed out running CDP command "Page.captureScreenshot"`; DOM/CSS metrics and the horizontal scroll interaction remained available.

Review:

- Read-only review found no Critical or Important issues and confirmed the diff is limited to `app/styles/markdown.scss`, `test/gemini-visual-migration.test.ts`, and `design-qa.md`.
- Review noted the LaTeX source-contract intentionally locks concrete spacing/color values, which may make future visual-only tweaks require a matching test update; this is accepted here because the slice is a Gemini-style visual contract.
- Review confirmed the CSS is scoped to `.markdown-body .katex-display` and `.markdown-body .katex-display > .katex`, so inline `.katex`, Markdown tables, code blocks, images, model config semantics, account/secret/sync, backend/API/upload/store keys/model payload, production/deploy config, and dependency files are untouched.

Known risks:

- Browser screenshot capture was unavailable for this fixture tab, so visual evidence is DOM/CSS/interaction metrics rather than screenshots.
- Runtime QA used a local fixture with current compiled app CSS because creating a real chat message through the UI could trigger a model/API request and importing persisted state would exceed this slice's safety boundary.

## Iteration 2026-06-20 model-menu-focus-containment

Result: passed.

Target flow:

- Opening the header model menu should move focus into `#chat-model-menu`, preferring the currently selected model option.
- Tab and Shift+Tab should stay inside the model menu dialog and wrap across visible enabled model/reasoning/image controls.
- Escape and backdrop close should return focus to the model selector trigger.
- If the menu has no visible enabled controls, focus should fall back to the dialog itself instead of escaping to the page.
- The change must not alter model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, or model request payload construction.

Design direction:

- Creative Production style intake selected: keep the existing Gemini-style model surface and tighten its modal focus behavior to match the composer tools menu and mobile sidebar drawer.
- This slice changes keyboard/focus quality only; no model list, reasoning, image generation, provider, or request semantics changed.

Scope:

- `app/components/chat.tsx`: added a model menu focus frame ref, initial focus handoff to the selected/fallback menu control, Tab/Shift+Tab containment, dialog fallback focus for empty-control states, and `tabIndex={-1}` on `#chat-model-menu`.
- `test/gemini-visual-migration.test.ts`: extended the source contract for model menu focus entry, Tab containment, empty-control fallback, focus-frame cleanup, and dialog focusability.
- No model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, model request payload construction, or dependency files were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` failed first as expected because model menu focus entry and Tab containment were missing.
- After read-only review found an empty-control fallback gap, the same targeted test was tightened and failed first because `#chat-model-menu` was not a focus fallback.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"`
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit --pretty false`
- `yarn build`

Browser QA:

- in-app Browser desktop viewport `1280x720`: opening the model menu focused the selected `gpt-5.4` option, `Tab` moved to the next model option while staying inside `#chat-model-menu`, `Escape` closed the menu and returned focus to the model selector, `#chat-model-menu tabindex=-1`, horizontal overflow `0`, and no new warn/error logs after the clean dev-server reload.
- Earlier desktop QA on the same diff also verified Shift+Tab moved back to the selected option and backdrop close returned focus to the trigger.
- in-app Browser mobile viewport `390x844`: opening focused the selected model option, `Tab` stayed inside the menu, `Escape` returned focus to the trigger, `#chat-model-menu tabindex=-1`, horizontal overflow `0`, and no new warn/error logs after reload.
- in-app Browser narrow viewport `320x740`: opening focused the selected model option, `Tab` stayed inside the menu, `Escape` returned focus to the trigger, `#chat-model-menu tabindex=-1`, horizontal overflow `0`, and no new warn/error logs after reload.
- Earlier mobile and narrow QA on the same diff also verified backdrop close returned focus to the trigger.
- Browser QA did not send a message, did not call a model/API, did not upload files, did not open an OS file picker, and did not persist production data.

Review:

- Read-only exploration recommended this slice because `#chat-model-menu` already declared `role="dialog"` / `aria-modal="true"` but lacked focus entry and Tab containment, unlike the composer tools menu and mobile sidebar drawer.
- Read-only code review found no Critical or Important issues. It reported one Minor empty-control fallback risk; this was fixed by focusing the dialog itself and preventing Tab escape when no visible enabled controls exist.
- Main-thread review verified that the final diff is limited to model menu focus behavior, source-contract tests, and this QA record, and does not touch model/account/sync/API/upload/store/deploy boundaries.

Known risks:

- The empty-control fallback is covered by source-contract tests rather than a dedicated runtime fixture because the current local app configuration exposes three visible model menu controls.
- The interaction test remains source-contract plus Browser QA, not a Testing Library component-level focus simulation.

## Iteration 2026-06-20 prompt-hints-render-phase-reset

Result: passed.

Target flow:

- Opening prompt hints with `/` should still render the Gemini-style listbox with a valid active option.
- Arrow navigation should use the bounded active option index and keep `aria-activedescendant` / `aria-selected` in sync.
- When the prompt list length changes, the selected option should reset after render instead of calling `setSelectIndex` during render.
- Escape should close the list and return focus to the composer.
- The change must not alter model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, or model request payload construction.

Design direction:

- Creative Production style intake selected: keep the existing Gemini-style prompt suggestion surface and improve its runtime stability.
- This slice changes PromptHints state timing only; no visual styling, copy, prompt data, model list, provider, or request semantics changed.

Scope:

- `app/components/chat.tsx`: replaced the render-phase prompt count reset with a bounded `activeSelectIndex` plus effect-driven reset/correction; updated listbox active state, selected row, scroll target, keyboard navigation, and Enter selection to use the bounded index.
- `test/gemini-visual-migration.test.ts`: extended the PromptHints source contract to forbid `setSelectIndex(0)` before the first effect, require `activeSelectIndex`, and lock the active/selected/scroll/Enter call sites.
- No model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, model request payload construction, dependency files, or deploy files were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` failed first as expected because PromptHints still reset `selectIndex` during render.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"`
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit --pretty false`
- `git diff --check`
- `yarn build`

Browser QA:

- in-app Browser desktop viewport `1280x720`: page identity `NeatChat`, no framework overlay, horizontal overflow `0`; typing `/` opened `#chat-prompt-hints` with `407` options, `aria-activedescendant=chat-prompt-hint-0`, selected option `chat-prompt-hint-0`, `aria-controls=chat-prompt-hints`, and focus on the composer.
- Desktop keyboard QA: `ArrowDown` moved `aria-activedescendant` and `aria-selected` to `chat-prompt-hint-1`; `Escape` closed the list, removed composer `aria-controls`, and kept focus on the composer.
- Console QA: no `Cannot update a component while rendering a different component`, runtime error, framework overlay, build error, `TypeError`, or `ReferenceError` logs were observed. One old Next.js Fast Refresh reload warning remained in the captured log buffer from the development reload and was not related to this interaction.
- Current prompt hint filtering behavior only shows the full list for exact `/`; entering `/Linux`, `/充`, `/英`, and similar query text closes the list in the current app data path. The list-length reset is therefore locked by the source-contract test rather than a live filtered-list interaction.
- Browser screenshot capture failed twice on the app tab with `Timed out running CDP command "Page.captureScreenshot"`. Browser viewport override also did not affect layout in this session: both the existing tab and a new tab still reported `1280x720` after setting `390x844`. No Playwright dependency is installed in the repo, so this slice did not add one just for screenshots or fallback responsive capture.
- Browser QA did not send a message, did not call a model/API, did not upload files, did not open an OS file picker, and did not persist production data.

Review:

- Read-only exploration recommended a separate next slice for modified-key passthrough in the model menu; this PromptHints slice was completed first because it directly removed an older render-phase state update noted in the UI QA backlog.
- Read-only code review found no Critical, Important, or Minor issues. It confirmed the diff is limited to PromptHints timing and the source-contract test.
- Main-thread review verified that no model/account/sync/API/upload/store/deploy boundaries were touched.

Known risks:

- The behavior-level component test attempted for prompt-list shrink was not kept because importing `chat.tsx` in the current Jest transform path pulls ESM-heavy app dependencies such as `nanoid` and `lodash-es`; changing global Jest transforms would have exceeded this slice.
- The list-length reset guarantee is covered by source-contract tests plus Browser QA of the real open/navigate/close flow, not by a dedicated Testing Library interaction test.

## Iteration 2026-06-20 model-menu-modified-key-passthrough

Result: passed.

Target flow:

- Opening the header model menu should keep the existing selected-option focus handoff.
- `Shift+Tab` should still stay inside `#chat-model-menu`.
- Modified direction keys such as `Shift+ArrowDown`, `Alt+ArrowDown`, `Ctrl+ArrowDown`, and `Meta+ArrowDown` should pass through without model-menu focus movement or `preventDefault`.
- Plain `ArrowDown`, `ArrowUp`, `Home`, and `End` should keep moving focus inside the model menu.
- The change must not alter model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, or model request payload construction.

Design direction:

- Creative Production style intake selected: treat the model menu as a quiet Gemini-style dialog that supports fast keyboard scanning without stealing modified browser/system shortcuts.
- This slice changes keyboard event routing only; no model list, provider, reasoning, image-generation, prompt, copy, CSS, request, or store semantics changed.

Scope:

- `app/components/chat.tsx`: added a modifier-key early return in `handleModelMenuKeyDown`, after the existing Tab trap and before the unmodified Arrow/Home/End handling.
- `test/gemini-visual-migration.test.ts`: tightened the model-menu source contract with a focused function-block assertion, locking Tab first, modifier passthrough second, and plain Arrow/Home/End handling after that.
- No CSS, model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, model request payload construction, dependency files, or deploy files were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` first hung when the initial broad negative regex caused excessive matching work; that assertion was rewritten to inspect only the `handleModelMenuKeyDown` function block.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` then failed as expected because `handleModelMenuKeyDown` had no modifier-key guard.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"`
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit --pretty false`
- `git diff --check`
- `yarn build`

Browser QA:

- in-app Browser desktop viewport `1280x720`: page identity `NeatChat`, no framework overlay, horizontal overflow `0`, and one visible model selector with `aria-controls="chat-model-menu"` / `aria-expanded=false`.
- Opening the selector rendered `#chat-model-menu`, set `aria-expanded=true`, and focused the selected `gpt-5.4` option at visible control index `0`.
- Pressing `Shift+ArrowDown` on the selected option kept focus on index `0` and kept the menu open, proving the modified arrow key was not intercepted by the model-menu navigation path.
- Pressing plain `ArrowDown` moved focus to visible control index `1` (`gpt-image-2`) while keeping the selected model as `gpt-5.4`, proving existing arrow-key navigation still works without changing model selection.
- Pressing `Shift+Tab` from the second model option moved focus back to visible control index `0` inside `#chat-model-menu`, proving the Tab trap still runs before the modifier guard.
- Console QA on the clean Browser tab had no warn/error logs after reload. A prior Browser tab hit a CDP `Runtime.evaluate` timeout and was discarded before this clean run.
- Browser screenshot capture failed with `Timed out running CDP command "Page.captureScreenshot"`. Browser viewport override also did not affect layout in this session: after setting `390x844`, a new tab still reported `1280x720`. The mobile/narrow runtime check was therefore not used for this slice; the cross-viewport behavior is guarded by the shared source contract and earlier model-menu Browser QA.
- Browser QA did not send a message, did not call a model/API, did not select a model, did not upload files, did not open an OS file picker, and did not persist production data.

Review:

- Read-only exploration had recommended this slice after the model-menu focus-containment work because modified direction keys were still intercepted.
- Read-only code review found no Critical, Important, or Minor issues. It confirmed `Tab` remains handled before the modifier guard, modified Arrow/Home/End keys pass through, and plain Arrow/Home/End navigation remains unchanged.
- Main-thread review verified that the final diff is limited to model menu keyboard routing, source-contract tests, and this QA record, and does not touch model/account/sync/API/upload/store/deploy boundaries.

Known risks:

- Runtime Browser QA directly exercised `Shift+ArrowDown`, plain `ArrowDown`, and `Shift+Tab`; `Alt` / `Ctrl` / `Meta` passthrough is covered by the source-contract test because browser/system handling of those combinations can vary by OS and browser.
- Browser screenshot and mobile viewport override were unavailable in this session, so visual evidence is DOM/interaction/console state rather than screenshots or live mobile dimensions.

## Iteration 2026-06-20 markdown-code-scroll-edge-hints

Result: passed.

Target flow:

- Long AI-rendered Markdown code blocks should advertise hidden horizontal content with a subtle edge hint in the available scroll direction.
- The hint should update with horizontal scrolling: right only at the start, left only at the end, and no blocking layer over code text, copy action, language label, or code folding.
- Existing copy payload selection, copied feedback, code language labels, Mermaid/HTML artifact rendering, code folding, table overflow hints, model config semantics, account/secret/sync, backend/API, production config, deployment config, upload behavior, persisted store keys, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: align code blocks with the already completed Gemini-style table and attachment overflow affordances.
- The code block keeps the existing compact card shape and adds conditional, non-interactive left/right fade overlays using the same quiet 28px edge language as Markdown tables.

Scope:

- `app/components/markdown.tsx`: added code-block scroll hint state, actual `<code>` scroll-container detection, requestAnimationFrame synchronization, ResizeObserver-backed resize synchronization, passive scroll listener, overflow data attributes, and conditional start/end fade elements.
- `app/styles/markdown.scss`: added code-block edge surface variables, horizontal overscroll containment, thin scrollbar styling, light/dark fade overlays, and language-label layering above the fade.
- `app/styles/globals.scss`: raised the copy button z-index above the fade overlay.
- `test/gemini-visual-migration.test.ts`: extended the Markdown code block contract to cover scroll calculation, ResizeObserver fallback, passive scroll listener, overflow data attributes, conditional fade elements, overlay styling, copy button layering, and language-label layering.
- No model config semantics, account/secret/sync, backend/API, production config, deployment config, upload/send behavior, persisted store keys, model request payload construction, dependency files, or deploy files were changed.

Automated checks:

- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown code block chrome"` failed first as expected because code-block scroll hint state and CSS did not exist.
- `npx jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown code block chrome"`
- `npx jest test/markdown-code-language.test.tsx --runInBand`
- `npx jest test/markdown-code-fold.test.tsx --runInBand`
- `npx jest test/gemini-visual-migration.test.ts --runInBand`
- `yarn lint`
- `npx tsc --noEmit --pretty false`
- `git diff --check`
- `yarn build`

Browser QA:

- in-app Browser could not expose `localStorage` or `indexedDB` to the read-only page sandbox, so persistent local chat-state injection was not used for this slice.
- A temporary local QA fixture at `public/__codex_qa_code_scroll.html` was served through `http://localhost:3000/`, loaded the actual dev-server Markdown/chat/layout CSS assets, and was deleted before commit. It did not send messages, call a model/API, upload files, open file pickers, persist production data, or modify app storage.
- Desktop/default Browser viewport reported `1280x720` because Browser viewport override still did not affect layout in this session. The code fixture had `codeScrollWidth: 3919`, `codeClientWidth: 638`, `bodyOverflowX: 0`, `data-overflow-start="false"`, `data-overflow-end="true"`, no left hint, right hint `28px x 152px`, `pointer-events: none`, copy button `z-index: 3`, language label `z-index: 2`, and language label `TypeScript`.
- A real horizontal wheel scroll over the code region reached `scrollLeft: 3281` / `maxScrollLeft: 3281`, changed the state to `data-overflow-start="true"` and `data-overflow-end="false"`, rendered the left hint at `28px x 152px`, removed the right hint, and kept the hint `pointer-events: none`.
- Compact container QA used a same-origin `358px` shell because Browser viewport override was unavailable. It had `bodyOverflowX: 0`, `codeScrollWidth: 3919`, `codeClientWidth: 276`, `data-overflow-start="false"`, `data-overflow-end="true"`, no left hint, and right hint `28px x 152px` with `pointer-events: none`.
- A real horizontal wheel scroll in the compact shell reached `scrollLeft: 3643` / `maxScrollLeft: 3643`, changed the state to `data-overflow-start="true"` and `data-overflow-end="false"`, rendered the left hint at `28px x 152px`, removed the right hint, and kept the hint `pointer-events: none`.
- Browser console QA on the fixture tab had no warn/error logs.

Review:

- Main-thread code review verified that the final diff is limited to Markdown code-block rendering/styling, source-contract tests, and this QA record.
- Review specifically checked that the actual scroll target is the rendered `<code>` element, not the outer `<pre>`, so the hint tracks the element that already owns horizontal scrolling.
- Review also checked that the fallback path still attaches the passive scroll listener when `ResizeObserver` is unavailable, and that copy/language controls render above the decorative fade overlays.

Known risks:

- Browser QA validated the live CSS/DOM contract with a same-origin fixture because the Browser sandbox blocked direct persistent chat-state injection. The React state wiring is covered by source-contract tests plus existing rendered `PreCode` language and fold tests, not by a live stored assistant message in the app.
- Browser viewport override was unavailable in this session, so compact verification used a narrow container rather than a real mobile viewport.

## Iteration 2026-06-20 composer-tools-modified-key-passthrough

Result: passed.

Target flow:

- Opening the composer tools menu should keep the existing focus handoff to the first visible enabled tool action.
- `Tab` and `Shift+Tab` should still stay inside `#chat-input-action-menu`.
- Modified direction keys such as `Shift+ArrowDown`, `Alt+ArrowDown`, `Ctrl+ArrowDown`, and `Meta+ArrowDown` should pass through without moving tools-menu focus or calling `preventDefault`.
- Plain `ArrowDown`, `ArrowUp`, `Home`, and `End` should keep moving focus inside the tools menu.
- Nested listbox surfaces, Escape close, backdrop close, upload behavior, prompt hints, shortcut modal behavior, image generation behavior, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat the composer tools menu as a compact Gemini-style command surface that supports keyboard power-user chords without stealing browser/system shortcuts.
- This slice changes keyboard event routing only; no geometry, ordering, iconography, copy, tool handlers, upload/image-generation behavior, prompt data, model list, request, or store semantics changed.

Scope:

- `app/components/chat.tsx`: added a modifier-key early return in `handleChatActionMenuKeyDown`, after the existing listbox guard and Tab trap, and before unmodified Arrow/Home/End handling.
- `test/gemini-visual-migration.test.ts`: tightened the composer tools source contract with a focused function-block assertion, locking listbox guard, Tab handling, modifier passthrough, and plain Arrow/Home/End handling order.
- No CSS, tool ordering, upload behavior, prompt hints, shortcut modal behavior, image generation settings, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` failed first as expected because `handleChatActionMenuKeyDown` had no modifier-key guard.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"`
- `yarn jest test/gemini-visual-migration.test.ts --runInBand`
- `git diff --check`

Browser QA:

- in-app Browser page identity: `http://localhost:3000/#/chat`, title `NeatChat`, meaningful app controls rendered, no framework overlay, initial horizontal overflow `0`, and the composer tools trigger exposed `aria-controls="chat-input-action-menu"`, `aria-label="打开对话工具"`, and `aria-expanded="false"`.
- Opening the trigger rendered `#chat-input-action-menu` with `role="dialog"`, `aria-modal="true"`, `aria-label="对话工具菜单"`, `aria-expanded="true"` on the trigger, visible enabled controls `上传附件`, `快捷指令`, `图片生成`, and focus on control index `0` (`上传附件`).
- Pressing `Shift+ArrowDown` kept focus on index `0` and kept the menu open, proving the modified arrow key was not intercepted by the tools-menu roving focus path.
- Pressing plain `ArrowDown` moved focus to index `1` (`快捷指令`), proving existing unmodified ArrowDown navigation still works.
- Pressing `Home` then `Shift+Tab` moved focus from the first tool action to index `2` (`图片生成`), proving the existing Tab trap still runs before the modifier guard.
- Pressing Escape returned focus to the trigger with `aria-label="打开对话工具"` and `aria-expanded="false"`; horizontal overflow stayed `0`.
- Browser console QA had no warn/error logs.
- Browser screenshot capture still failed with `Timed out running CDP command "Page.captureScreenshot"` on this local app tab, so evidence is DOM/interaction/console state rather than screenshots.
- Browser QA did not send a message, call a model/API, select a model, upload files, open an OS file picker, trigger image generation, or persist production data.

Review:

- Read-only reviewer found no Critical, Important, or Minor issues. It confirmed the final handler order is show-menu guard, nested listbox guard, Tab/Shift+Tab trap, modifier guard, then unmodified Arrow/Home/End roving focus.
- Reviewer also confirmed the source contract covers the new ordering without binding tool order, upload, shortcut, image generation, prompt hint, model config, API/store, or deploy semantics.
- Main-thread review verified the final diff is limited to keyboard routing, the source-contract test, and this QA record.

Known risks:

- Runtime Browser QA directly exercised `Shift+ArrowDown`, plain `ArrowDown`, `Home`, `Shift+Tab`, and Escape. `Alt` / `Ctrl` / `Meta` passthrough is covered by the source-contract test because OS/browser handling of those combinations can vary.
- Browser screenshot and viewport override were unavailable in this session, so this slice uses interaction and DOM evidence from the default in-app Browser viewport.

## Iteration 2026-06-20 prompt-hints-modified-key-passthrough

Result: passed.

Target flow:

- Typing `/` in the composer should open `#chat-prompt-hints` as the existing prompt listbox.
- Modified navigation keys such as `Shift+ArrowDown`, `Alt+ArrowDown`, `Ctrl+ArrowDown`, and `Meta+ArrowDown` should pass through without moving the selected prompt hint.
- Plain `ArrowDown`, `ArrowUp`, `Home`, and `End` should keep moving the prompt-hint active descendant and selected option.
- Escape close, Enter selection, prompt data, model config semantics, account/secret/sync, backend/API, upload behavior, persisted store keys, production config, deployment config, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat prompt hints as a Gemini-style composer suggestion surface that should support keyboard power-user chords without stealing modified browser/system navigation.
- This slice changes keyboard event routing only; no geometry, styling, copy, prompt content, prompt ordering, model list, provider, request, upload, account, sync, store, or deploy semantics changed.

Scope:

- `app/components/chat.tsx`: added prompt navigation key detection and scoped `shiftKey` passthrough to `ArrowUp`, `ArrowDown`, `Home`, and `End`.
- `app/components/chat.tsx`: after read-only review, narrowed the `shiftKey` early return to prompt navigation keys only, so `Shift+Escape` still closes prompt hints and `Shift+Enter` still selects the active prompt.
- `test/gemini-visual-migration.test.ts`: added a focused `PromptHints` keydown source-contract assertion that locks `meta` / `alt` / `ctrl` as the global modifier guard and `shiftKey` as a navigation-key-only passthrough before Arrow/Home/End handling.
- No CSS, prompt text, prompt ordering, prompt selection payload, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` failed first as expected because `PromptHints` did not include `e.shiftKey` in its modifier guard.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"`
- After read-only review, `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` failed first as expected because the broad `e.shiftKey` guard lacked a scoped `isPromptNavigationKey` check.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` passed after scoping `shiftKey` to Arrow/Home/End handling.

Browser QA:

- in-app Browser page identity: `http://localhost:3000/#/chat`, title `NeatChat`, meaningful app controls rendered, no framework overlay, initial horizontal overflow `0`, and Browser console warn/error logs `0`.
- Typing `/` opened `#chat-prompt-hints` with `role="listbox"`, `aria-label="提示词建议"`, `407` options, `aria-activedescendant="chat-prompt-hint-0"`, exactly one selected option `chat-prompt-hint-0`, input `aria-controls="chat-prompt-hints"`, input `aria-haspopup="listbox"`, focus on `#chat-input`, and horizontal overflow `0`.
- Pressing `Shift+ArrowDown` on `#chat-input` kept `aria-activedescendant` and the selected option at `chat-prompt-hint-0`, kept the list open, kept focus on `#chat-input`, preserved input value `/`, and kept horizontal overflow `0`.
- Pressing plain `ArrowDown` moved both `aria-activedescendant` and the selected option to `chat-prompt-hint-1`, proving the existing unmodified navigation still works.
- After scoping the guard, pressing `Shift+Escape` removed the list, cleared input `aria-controls`, preserved `aria-haspopup="listbox"`, kept focus on `#chat-input`, preserved input value `/`, and kept horizontal overflow `0`.
- After scoping the guard, reopening prompt hints and pressing `Shift+Enter` removed the list, cleared input `aria-controls`, kept focus on `#chat-input`, filled the selected prompt into the input with `valueLength: 1716`, and kept horizontal overflow `0`.
- Pressing Escape removed the list, cleared input `aria-controls`, preserved `aria-haspopup="listbox"`, kept focus on `#chat-input`, preserved input value `/`, and kept horizontal overflow `0`.
- Browser screenshot capture still failed with `Timed out running CDP command "Page.captureScreenshot"` on this local app tab, so evidence is DOM/interaction/console state rather than screenshots.
- Browser QA did not send a message, call a model/API, select a model, upload files, open an OS file picker, change prompt data, or persist production data.

Review:

- Read-only code review found one Important issue: the first `shiftKey` guard was too broad and would block `Shift+Escape` / `Shift+Enter`, while QA claimed Escape and Enter were preserved.
- Fixed by keeping `metaKey`, `altKey`, and `ctrlKey` as the existing global guard and limiting `shiftKey` passthrough to `ArrowUp`, `ArrowDown`, `Home`, and `End`.
- Final read-only re-review found no Critical or Important issues; its remaining Minor wording concern in this QA record was fixed before commit.
- Main-thread review verified the final diff remains limited to prompt-hints keyboard routing, the source-contract test, and this QA record, without touching model/account/sync/API/upload/store/deploy boundaries.

Known risks:

- Runtime Browser QA directly exercised `Shift+ArrowDown`, plain `ArrowDown`, `Shift+Escape`, `Shift+Enter`, and Escape. `Alt` / `Ctrl` / `Meta` passthrough is covered by the source-contract test because browser/system handling of those combinations can vary by OS and browser.
- Browser screenshot and viewport override were unavailable in this session, so this slice uses interaction and DOM evidence from the default in-app Browser viewport.

## Iteration 2026-06-20 attachment-strip-swipe-scope

Result: passed.

Target flow:

- On compact/mobile chat, right-swipe navigation from the main chat surface should remain available.
- Horizontal touch gestures that start inside the composer attachment strip should stay scoped to the attachment strip and must not trigger chat-level right-swipe navigation to the sidebar.
- Attachment preview rendering, delete focus handoff, drag/drop limits, paste handling, upload behavior, send behavior, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: keep the attachment strip as a Gemini-style horizontal media rail where local swipe/scroll gestures feel predictable and do not fight page navigation.
- This slice changes touch gesture routing only; no visual styling, copy, attachment limits, file parsing, upload/send behavior, model list, request, store, account, sync, backend, or deploy semantics changed.

Scope:

- `app/components/chat.tsx`: added `ignoreChatSwipeRef`, a stable `[data-composer-attachment-strip="true"]` hit target, and an `isAttachmentStripTouch` guard so root chat swipe tracking ignores touches that begin inside the attachment strip.
- `test/gemini-visual-migration.test.ts`: added a focused source-contract test for the root touch handler bindings, attachment strip data marker on the scroll shell, nested attachment list coverage, touch-start ignore path, touch-move ignore path, touch-end reset path, non-Element touch target normalization, and unchanged compact right-swipe navigation branch.
- No CSS, attachment preview visuals, drag/drop limits, paste extraction, upload behavior, send behavior, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip swipes"` failed first as expected because the attachment strip had no scoped touch guard or stable data marker.
- After read-only review, `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip swipes"` failed as expected because the strengthened source-contract test required root touch handler bindings, attachment shell coverage, and non-Element touch target normalization.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip swipes"` passed after normalizing non-Element touch targets and tightening the source-contract coverage.

Browser QA:

- in-app Browser page identity: `http://localhost:3000/#/chat`, title `NeatChat`, meaningful app controls rendered, no framework overlay, initial `attachmentStripCount: 0`, horizontal overflow `0`, and Browser console warn/error logs `0`.
- A local data URL image was pasted into the composer to create an attachment preview without opening an OS file picker, uploading, sending a message, calling a model/API, or persisting production data.
- The rendered attachment state exposed `[data-composer-attachment-strip="true"]`, a nested `role="list"` with `aria-label="附件预览"`, `button[aria-label="编辑第 1 张图片附件"]`, and `button[aria-label="删除第 1 张图片附件"]`; strip rect was `left: 423`, `right: 1113`, `width: 690`, `height: 70`; `data-overflow-start="false"`, `data-overflow-end="false"`, input value stayed empty, horizontal overflow stayed `0`, and console warn/error logs stayed `0`.
- Cleanup clicked the delete attachment button; final `attachmentStripCount: 0`, input value empty, horizontal overflow `0`, and console warn/error logs `0`.
- Browser screenshot capture still failed with `Timed out running CDP command "Page.captureScreenshot"` on this local app tab, so evidence is DOM/interaction/console state rather than screenshots.

Review:

- Read-only code review found no Critical issues and one Important test gap: the first source-contract test did not lock the root touch handler bindings or prove the data marker lived on the scroll shell that wraps the attachment list.
- Fixed by adding assertions for `onTouchStart` / `onTouchMove` / `onTouchEnd`, requiring the marker on `attachments-scroll-shell` before the nested `attachments-container`, and normalizing non-Element touch targets before `closest(...)`.
- Main-thread review verified the final diff remains limited to touch gesture routing, source-contract coverage, and this QA record, without touching model/account/sync/API/upload/store/deploy boundaries.

Known risks:

- Runtime Browser QA verified the real attachment strip DOM marker, local pasted attachment state, cleanup path, layout bounds, and console health. The actual touch-routing branch is covered by the source-contract test because the in-app Browser runtime does not expose a reliable mobile touch-event dispatch path for this local app.
- Browser screenshot and viewport override were unavailable in this session, so this slice uses default-viewport DOM/interaction evidence plus source contracts.

## Iteration 2026-06-20 attachment-strip-add-entry

Result: passed.

Target flow:

- When the composer already has attachments, the Attachment Strip should expose a compact direct add entry at the end of the media rail.
- The add entry should reuse the existing native file picker upload path through `handleUploadAttachments`, without introducing new parsing, upload, send, model, API, account, sync, store, production, or deployment behavior.
- The add entry should disappear when all attachment slots are full, stay disabled while upload processing is active, and remain part of the attachment focus order after deleting a neighboring item.
- Attachment delete/edit behavior, drag/drop limits, paste handling, send readiness, attachment strip swipe scoping, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat Attachment Strip as a Gemini-style horizontal media rail with a quiet icon-only add tile, glassy surface, dashed affordance, mobile-sized 58px target, dark-mode balance, and no extra visible text.
- This slice adds only a frontend entry point to the already-existing upload flow; no new file parsing path, picker semantics, attachment limit, copy, backend, or model behavior changed.

Scope:

- `app/components/chat.tsx`: added `canAddMoreAttachments`, rendered a `继续添加附件` icon button at the end of the existing attachment list, wired it to `handleUploadAttachments`, and included the add button in the post-delete focus handoff query.
- `app/components/chat.module.scss`: added the add tile visual treatment, dark mode, focus/hover/pressed/disabled states, and compact `58px` sizing.
- `test/gemini-visual-migration.test.ts`: added a focused source-contract test for the add entry, existing upload handler reuse, slot-gated rendering, disabled upload state, focus handoff participation, and add tile styling.
- No upload parser, drag/drop limits, paste extraction, send behavior, prompt behavior, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip add action|attachment deletion focus"` failed first as expected because the strip did not yet include a direct add entry or add-button focus target.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip add action|attachment deletion focus"` passed after adding the entry and focus contract.
- After read-only review, `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip add action"` failed as expected because the strengthened source-contract test required disabled add buttons to avoid hover/focus visual affordances and required the add tile to stay inside the existing attachment-strip guard.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip add action|attachment deletion focus"` passed after scoping hover/focus/active styles to `:not(:disabled)` and tightening the attachment-strip guard assertion.

Browser QA:

- in-app Browser page identity: `http://localhost:3000/#/chat`, title `NeatChat`, meaningful app controls rendered, no framework overlay, initial `attachmentStripCount: 0`, add button count `0`, horizontal overflow `0`, and Browser console warn/error logs `0`.
- Pasted a local PNG data URL into the composer to create an attachment preview without sending a message, calling a model/API, uploading a personal file, changing model settings, or persisting production data.
- The rendered attachment state exposed `[data-composer-attachment-strip="true"]`, `role="list"`, `编辑第 1 张图片附件`, `删除第 1 张图片附件`, and `button[aria-label="继续添加附件"]`; add button rect was `64x64` at `left: 495`, `top: 613`; it was enabled, inside the strip, had `title="继续添加附件"`, list item count was `2`, send became enabled because a local attachment existed, horizontal overflow stayed `0`, and console warn/error logs stayed `0`.
- Added a local long-text attachment through the existing paste-to-file path, then deleted that file attachment. Focus moved to `button[aria-label="继续添加附件"]`, the file attachment was gone, the remaining image plus add entry kept list item count `2`, horizontal overflow stayed `0`, and console warn/error logs stayed `0`.
- Cleanup deleted the remaining image attachment and cleared the composer input; final attachment strip count `0`, add button count `0`, input value length `0`, send disabled `true`, and horizontal overflow `0`.
- The add button itself was not clicked in Browser QA because clicking it opens the native OS file picker; source tests and code review cover that it reuses `handleUploadAttachments`.
- Browser screenshot capture failed with `Timed out running CDP command "Page.captureScreenshot"` on this local app tab, so evidence is DOM/interaction/console state rather than screenshots.

Review:

- Read-only code review found no Critical or Important issues. It found two Minor improvements: disabled add buttons still received hover/focus visual affordance styles, and the source contract did not explicitly prove the add tile stayed inside the existing non-empty attachment-strip guard.
- Fixed both before commit by scoping add-button hover/focus/active CSS to `:not(:disabled)` and tightening the source-contract test around the outer `(attachImages.length > 0 || attachedFiles.length > 0)` guard.
- Main-thread review verified the final diff remains limited to the attachment-strip add entry, styling, source-contract coverage, and this QA record, without touching upload parsing, send/model/API/account/sync/store/deploy boundaries.

Known risks:

- Runtime Browser QA verified local attachment rendering, the add tile geometry/state, focus handoff after deleting a neighboring attachment, cleanup, layout bounds, and console health. It intentionally did not open the OS file picker or upload a real file.
- Browser screenshot and viewport override were unavailable in this session, so this slice uses default-viewport DOM/interaction evidence plus source contracts.

## Iteration 2026-06-20 attachment-strip-left-swipe-delete

Result: passed.

Target flow:

- On touch/compact attachment previews, left-swipe should reveal and focus the delete affordance without deleting the attachment.
- Right-swipe/cancel should clear the destructive affordance and move focus back to the attachment edit control or blur the delete button.
- Horizontal strip scrolling should keep priority while the rail can still scroll in the swipe direction, so scrolling a crowded attachment strip does not accidentally arm deletion.
- Clearing all attachments through delete, send, model switch, or cleanup should also clear any active swipe key so a future `image-0` or `file-0` is not shown as armed.
- Existing attachment deletion, edit, add-entry, paste, upload, send, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: keep Attachment Strip as a Gemini-style compact media rail with a quiet non-destructive swipe reveal, red-tinted delete focus, dark-mode balance, and reduced-motion fallback.
- This slice changes only the frontend affordance and touch-routing state around existing delete buttons; no model, upload, file parsing, request, store, account, sync, backend, or deploy semantics changed.

Scope:

- `app/components/chat.tsx`: added attachment swipe keys, active delete state cleanup, horizontal scroll guard, right-swipe focus restoration, empty-attachment active-key reset, and touch handlers on image/file attachment items.
- `app/components/chat.module.scss`: added active swipe visual treatment for the delete mask/button, dark-mode variant, and reduced-motion guard.
- `test/gemini-visual-migration.test.ts`: added source-contract coverage for non-destructive left-swipe reveal, no deletion in touch-move, right-swipe restoration, scroll guard, stale-key cleanup, image/file key wiring, and unchanged delete/focus handoff.
- No model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment left-swipe|attachment strip swipes|attachment deletion focus|attachment strip add action"` passed after the review fixes.
- `yarn lint` passed.
- `npx tsc --noEmit --pretty false` passed.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` passed with `25` tests.
- `git diff --check` passed.
- `yarn build` passed.

Browser QA:

- After `yarn build`, the already-running dev server served `/api/config` with a transient `500` from stale dev artifacts; the dev server was restarted, `/api/config` returned `200`, and Browser QA proceeded on a fresh tab.
- in-app Browser page identity: `http://localhost:3000/#/chat`, title `NeatChat`, meaningful app controls rendered, no framework overlay, and Browser console warn/error logs `0`.
- Pasted a local PNG data URL into `#chat-input` to create an image attachment without opening an OS file picker, sending a message, calling a model/API, changing model settings, uploading a personal file, or persisting production data.
- The rendered attachment state exposed `[data-composer-attachment-strip="true"]`, one `[data-attachment-swipe-key="image-0"]`, edit/delete buttons, a `继续添加附件` add button, active swipe attr `null`, input value length `0`, horizontal overflow `0`, strip overflow `0`, and console warn/error logs `0`.
- CSSOM verified active swipe rules for z-index, mask reveal/background, delete button scale/box-shadow, dark-mode companion rules, and reduced-motion `transition-duration: 0.01ms` with `transform: none`.
- Cleanup clicked the existing delete attachment button; final attachment strip count `0`, swipe-key item count `0`, add button count `0`, input value length `0`, send disabled `true`, horizontal overflow `0`, and console warn/error logs `0`.
- Browser CUA drag / scripted touch dispatch did not provide a reliable touch-event path in this sandbox, so the left-swipe and right-swipe touch branches are locked by source-contract tests while Browser QA validates live DOM/CSS/paste/delete/console behavior.

Review:

- First read-only review found no Critical issues and three Important risks: stale active swipe key after attachments are cleared, accidental reveal while horizontally scrolling a crowded strip, and destructive focus lingering after right-swipe cancel.
- Fixed by clearing active keys when attachment count reaches zero, adding `canAttachmentStripScrollWithSwipe`, and making right-swipe cancel restore focus to the edit control or blur the delete button.
- Final read-only re-review found no Critical or Important issues. It left two Minor notes: the coverage is source-contract rather than a full real-touch browser test, and one `data-attachment-swipe-key` JSX line is long but behavior-neutral.
- Main-thread review verified the final diff remains limited to attachment-strip swipe affordance, styling, source-contract coverage, and this QA record, without touching upload parsing, send/model/API/account/sync/store/deploy boundaries.

Known risks:

- Runtime Browser QA could not exercise physical mobile touch event timing in this session, and the repo has no Playwright dependency to run a separate mobile emulation without adding tooling. The touch behavior is guarded by source-contract tests plus live DOM/CSS/delete verification.
- The design intentionally reveals the existing delete button instead of deleting on swipe; a true destructive swipe-to-delete would require a product decision and is outside this slice.

## Iteration 2026-06-20 attachment-strip-full-state

Result: passed.

Target flow:

- When the composer reaches both local attachment limits, 3 images and 5 files, the Attachment Strip should keep an explicit full-state tile in the media rail instead of simply removing the add affordance.
- The full-state tile must be inert: no upload click handler, no native picker trigger, and no upload parsing path. The tool-menu upload action must also be disabled while both attachment classes are full.
- If only one class is full, such as 3 images with fewer than 5 files or 5 files with fewer than 3 images, the existing add entry remains available so the other class can still be added.
- Removing any attachment from full state should remove the full-state tile and restore both the strip add entry and the tool-menu upload entry.
- Existing paste, drag/drop, attachment parsing, send behavior, model config semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: keep the Attachment Strip as a Gemini-style compact media rail and represent full capacity with a quiet status tile, not a destructive or blocking modal.
- The tile uses the same 64px desktop / 58px mobile footprint as the add tile, restrained glass treatment, short `已满` label, and an accessible status label: `附件已满：最多 3 张图片、5 个文件`.

Scope:

- `app/components/chat.tsx`: added `attachmentSlotsFull`, rendered a non-button full-state list item, disabled the tool-menu upload action when both limits are full, and added a defensive guard in `handleUploadAttachments`.
- `app/components/chat.module.scss`: added full-state tile styling, dark-mode treatment, mobile sizing, and disabled affordance styling for generic chat action buttons.
- `test/gemini-visual-migration.test.ts`: added source-contract coverage for full-state rendering, inert markup, upload handler guard, tool-menu disabled wiring, and 64px/58px sizing.
- No model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip full state|attachment strip add action"` failed first as expected because the strip had no `attachmentSlotsFull` indicator.
- After adding the full-state tile, `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip full state|attachment strip add action"` passed.
- Read-only review found an Important gap: the full tile was inert, but the tool-menu `上传附件` action could still open the native picker while both limits were full.
- The test was strengthened and failed as expected until `ChatAction` supported `disabled`, `ChatActions` received `attachmentSlotsFull`, and `handleUploadAttachments` gained an early full-state guard.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip full state"` passed after the review fix.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip full state|attachment strip add action|attachment deletion focus|attachment strip overflow hints"` passed.
- `git diff --check` passed.
- `yarn lint` passed.
- `npx tsc --noEmit --pretty false` passed.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` passed with `26` tests.

Browser QA:

- in-app Browser page identity: `http://localhost:3000/#/chat`, title `NeatChat`, meaningful composer controls rendered, and Browser console warn/error logs `0`.
- Pasted 3 distinct local PNG data URLs and 5 long text snippets into the composer to create a full local attachment state without opening an OS picker, sending a message, calling a model/API, changing model settings, uploading a personal file, or touching production data.
- Full state exposed 3 image edit buttons, 5 file edit buttons, 8 delete buttons, one full-state indicator, no `继续添加附件` strip button, full-state rect `64x64`, role `status`, text `已满`, and no click handler on the indicator.
- Mobile viewport check at `390px` verified the full-state tile resized to `58x58` and still hid the strip add button.
- Deleting one image changed state to 2 images and 5 files, removed the full-state indicator, restored one `继续添加附件` strip button, and kept console warn/error logs at `0`.
- After the review fix, Browser QA also verified that tool-menu `上传附件` was disabled with title `附件已满：最多 3 张图片、5 个文件` in full state, then became enabled with no title after deleting one attachment.
- Browser screenshot was not captured for this slice; evidence is live DOM state, interaction state, responsive geometry, and console health.

Review:

- First read-only review found one Critical/Important-level issue: full-state did not disable the separate tool-menu upload entry. It also noted that the initial test was too static to catch that gap.
- Fixed by adding a disabled prop to `ChatAction`, passing `attachmentSlotsFull` into `ChatActions`, guarding both menu click and `handleUploadAttachments`, and strengthening the source-contract test.
- Final read-only re-review found no Critical or Important issues. It left one non-blocking P3 note: the repo's test remains source-contract oriented rather than a rendered component interaction test.
- Main-thread review verified the final diff remains limited to Attachment Strip full-state UI, chat-action disabled wiring, focused source-contract coverage, and this QA record, without touching upload parsing, send/model/API/account/sync/store/deploy boundaries.

Known risks:

- Runtime Browser QA covered the actual full-state flow and deletion recovery, including the tool-menu upload disabled state. Automated repo coverage remains mostly source-contract based because this codebase does not currently expose a lightweight rendered composer test harness for local attachment state.

## Iteration 2026-06-20 image-editor-toolbar-polish

Result: passed.

Target flow:

- Opening the editor from a pasted image attachment should keep the same drawing, save, undo, redo, and canvas behavior while presenting the editor tools as a Gemini-style grouped toolbar.
- Drawing tools, color choices, and brush sizes should expose clear toolbar/group semantics and retain the existing selected states through `aria-pressed`.
- The old hardcoded gray toolbar and canvas frame should move to shared Gemini surface, border, and focus tokens, with matching desktop, mobile, dark-mode, and reduced-motion treatments.
- Brush-size preview dots should be CSS controlled instead of inline black styling, so selected/focus/dark states inherit from the unified button color system.
- Model config semantics, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: keep Image Editor as a compact modal tool surface, not a new workflow. The toolbar uses elevated glass, tokenized borders, tight icon controls, accessible groups, and mobile wrapping consistent with the Gemini-style composer rail.
- This slice intentionally avoids changing editor commands or image data flow; it only refines the visual system and control semantics around existing tools.

Scope:

- `app/components/image-editor.tsx`: added a named toolbar, named groups for drawing tools, colors, and brush sizes, kept `aria-pressed` state, and moved brush-size dot styling to a CSS class with a per-size custom property.
- `app/components/image-editor.module.scss`: replaced legacy gray hardcoded toolbar/canvas surfaces with tokenized elevated surfaces, focus tokens, dark-mode variants, mobile sizing/wrapping, and reduced-motion guards.
- `test/image-editor-context.test.tsx`: added rendered coverage for toolbar/group semantics and default selected states.
- `test/gemini-visual-migration.test.ts`: added source-contract coverage for Gemini surface tokens, old-gray removal, dark/mobile/reduced-motion guards, focus states, and CSS-controlled brush dots.
- No model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/image-editor-context.test.tsx --runInBand --testNamePattern="grouped editor controls"` failed first as expected because the editor did not expose a named toolbar or grouped controls.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="image editor controls"` failed first as expected because the static Gemini surface/toolbar contract did not exist.
- After implementation, `yarn jest test/image-editor-context.test.tsx test/gemini-visual-migration.test.ts --runInBand --testNamePattern="grouped editor controls|image editor controls"` passed.
- `yarn lint` passed.
- `npx tsc --noEmit --pretty false` passed.

Browser QA:

- in-app Browser page identity: `http://localhost:3000/#/chat`, title `NeatChat`, meaningful composer controls rendered, and Browser console warn/error logs `0`.
- Pasted a local 1x1 PNG clipboard item into the composer to create one image attachment without opening an OS file picker, sending a message, calling a model/API, changing model settings, uploading a personal file, or touching production data.
- Opened `编辑第 1 张图片附件`; desktop runtime verified one `role="toolbar"` named `图片编辑工具`, groups `绘图工具` / `颜色` / `笔刷大小`, selected states for `画笔工具`, `选择颜色 #FF0000`, and `选择笔刷大小 5`, visible canvas, 38px drawing/size buttons, tokenized elevated toolbar styling, horizontal overflow `0`, and console errors `0`.
- Mobile viewport `390x844` verified the toolbar switches to column layout, uses 36px drawing/size controls and 28px color controls, keeps the canvas visible, keeps page horizontal overflow `0`, and emits no console errors.
- Narrow viewport `320x740` verified toolbar bounds stay inside the viewport, children do not overflow the toolbar, canvas remains visible, page horizontal overflow stays `0`, and console errors stay `0`.
- Browser QA intentionally used an in-memory PNG and did not exercise save/download or send/model flows because those are outside this visual-control slice.

Review:

- Read-only review found no P0, P1, or P2 issues.
- Review confirmed the diff is limited to Image Editor presentation and tests, preserves drawing/save/undo/redo/canvas initialization and event logic, and does not touch model config, account/secret/sync, production/deploy, backend/API, upload parsing, send path, or model request payload construction.
- Main-thread review verified the final diff remains limited to toolbar semantics, visual tokens, focused source/render tests, and this QA record.

Known risks:

- `role="toolbar"` currently keeps native button Tab navigation and does not add roving arrow-key focus. This is acceptable for the current slice because it preserves existing keyboard behavior, but editor-specific arrow-key navigation can be considered in a later accessibility pass.
- Runtime Browser QA covered light-mode desktop/mobile/narrow geometry. Dark mode is guarded by source-contract tests and CSS review, not by a live dark-theme Browser toggle in this slice.

## Iteration 2026-06-20 secondary-entry-surface-alignment

Result: passed.

Target flow:

- `#/search-chat` and `#/new-chat` should match the main Gemini-style shell by using the shared neutral page surface instead of decorative blue radial gradients.
- Search input, Search results, New Chat composer, header actions, more action, and mask shortcuts should use shared elevated surface, border, shadow, hover, and focus-ring tokens.
- Existing Search behavior, recent/results list, clear button, `selectSession(item.id)`, `Path.Chat` navigation, `startChat`, mask selection, `dontShowMaskSplashScreen`, and mobile sidebar trigger behavior must remain unchanged.
- Model config semantics, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: keep these secondary entry pages quiet and utilitarian, with Gemini-style neutral backgrounds and compact elevated controls rather than standalone decorative landing screens.
- This slice intentionally does not redesign the layout, information architecture, copy, session creation flow, or mask grid. It only aligns surfaces, focus states, and input chrome with the existing Chat shell tokens.

Scope:

- `app/components/search-chat.module.scss`: removed the root radial gradient, tokenized close/search/result/empty surfaces, added focus-ring treatment, fixed the search input specificity against global `input[type="text"]`, and left-aligns the search field.
- `app/components/new-chat.module.scss`: removed the root radial gradient, tokenized header/composer/more/mask surfaces, moved focus/hover affordances to shared tokens, and replaced the hardcoded white icon fill with `var(--white)`.
- `test/gemini-visual-migration.test.ts`: added source-contract coverage for root no-gradient surfaces, shared token usage, no hardcoded blue focus color, search input specificity, left-aligned search input, and unchanged Search/New Chat behavior anchors.
- No TypeScript component logic, routes, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="secondary entry pages"` failed first as expected because `search-chat` and `new-chat` still used `radial-gradient`.
- After initial implementation, the same test passed.
- The test was then strengthened to reject hardcoded `rgba(49, 94, 248...)` and `fill: white !important`; it failed as expected until those values moved to token-derived expressions.
- Browser QA exposed a runtime specificity issue: global `input[type="text"]` overrode the Search input radius to `10px`. The test was strengthened to require the scoped `.search-box input.search-input` contract, failed as expected, and passed after the specificity fix.
- The test was strengthened again to require `text-align: left`; it failed as expected until the Search input explicitly overrode the global centered input style.
- Final focused run: `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="secondary entry pages"` passed.
- `yarn lint` passed.
- `npx tsc --noEmit --pretty false` passed.

Browser QA:

- in-app Browser page identity: `http://localhost:3000/?qa=secondary-surfaces#/search-chat` and `http://localhost:3000/?qa=secondary-surfaces#/new-chat`, title `NeatChat`, meaningful page content rendered, no framework overlay, and console warn/error logs `0`.
- Desktop `1440x1024`: Search root `backgroundImage: none`, horizontal overflow `0`, Search input radius `28px`, result panel radius `22px`, typing `qa` showed one clear button and clearing restored empty input with overflow still `0`.
- Desktop `1440x1024`: New Chat root `backgroundImage: none`, horizontal overflow `0`, composer radius `30px`, mask shortcut radius `14px`, console warn/error logs `0`.
- Mobile `390x844`: Search root `backgroundImage: none`, horizontal overflow `0`, Search input radius `22px`, result panel radius `18px`, console warn/error logs `0`.
- Mobile `390x844`: New Chat root `backgroundImage: none`, horizontal overflow `0`, composer radius `24px`, mask shortcut radius `14px`, return button still exposed `aria-controls="mobile-sidebar-drawer"` and `aria-expanded="false"`, console warn/error logs `0`.
- Narrow `320x740`: Search and New Chat both kept `backgroundImage: none`, horizontal overflow `0`, mobile radii, and console warn/error logs `0`.
- Mobile return trigger regression: on `390x844`, clicking the New Chat return/sidebar trigger changed the URL to `#/`, expanded the trigger to `aria-expanded="true"`, brought the `304x844` sidebar to `x=0`, kept horizontal overflow `0`, and produced no console warn/error logs.
- Browser screenshot capture timed out in this in-app Browser session, so this slice uses DOM snapshots, CSSOM metrics, interaction state, and console health as runtime evidence.

Review:

- A read-only subagent first confirmed the slice was worth doing and recommended keeping the implementation limited to `search-chat.module.scss`, `new-chat.module.scss`, `test/gemini-visual-migration.test.ts`, and this QA record.
- A final read-only subagent review was attempted after implementation but could not run because Codex subagent usage quota was exhausted. Main-thread review then checked the staged work directly.
- Main-thread review found no P0, P1, or P2 issues. It verified the final diff is limited to two SCSS files plus the visual migration test, that `radial-gradient`, `rgba(49, 94, 248...)`, and `fill: white !important` are absent from the target SCSS files, and that there is no diff in `search-chat.tsx`, `new-chat.tsx`, route constants, stores, config, or API/backend files.

Known risks:

- The final review was main-thread only because the review subagent hit a usage-quota limit. The review still used source diff, forbidden-string scans, focused tests, Browser QA, and boundary checks before commit.
- Dark mode is protected by shared tokens and CSS review in this slice, but Browser QA was performed in light mode only.

## Iteration 2026-06-20 mobile-sidebar-drawer-surface-alignment

Result: passed.

Target flow:

- On compact screens, opening the mobile sidebar drawer from `#/chat` should keep the existing drawer route, trigger, focus, aria, width, offset, z-index, and close behavior.
- The drawer surface should use the shared Gemini-style elevated surface token instead of decorative radial or linear gradients.
- The backdrop should use a neutral overlay with the existing blur treatment instead of blue/purple decorative gradients.
- Model config semantics, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat the mobile sidebar as the same app shell surface system, not a decorative sheet. The drawer should feel like an elevated app panel over a quiet neutral scrim.
- This slice intentionally keeps drawer layout, copy, navigation, focus trap, keyboard handling, and route semantics unchanged.

Scope:

- `app/components/home.module.scss`: replaced compact sidebar light/dark gradient stacks with `var(--surface-elevated)`, tokenized the drawer border with `var(--border-in-light)`, and replaced the backdrop gradients with neutral rgba overlays.
- `test/gemini-visual-migration.test.ts`: updated the compact sidebar/backdrop source contract to require tokenized surfaces, neutral overlays, and absence of `radial-gradient`, `linear-gradient`, and `background-blend-mode` in the target blocks.
- No TypeScript component logic, routes, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` failed first as expected because the drawer and backdrop still used decorative gradients.
- After implementation, `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="empty state hooks"` passed.
- Review found a P3 issue: the first implementation used `border-right-color: var(--border-in-light)` in the dark nested block even though `--border-in-light` is a full border shorthand. Fixed by using `border-right: var(--border-in-light)` and updating the test to avoid locking in invalid CSS.
- The focused test passed again after the review fix.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/#/chat`, title `NeatChat`, meaningful composer and sidebar controls rendered, no framework overlay, and console warn/error logs `0`.
- Local access control was unlocked using the existing local `.env` access code only for QA; no real account, personal API key, model call, remote publish, production data, or config semantics were changed.
- Mobile `390x844`: closed state kept trigger `aria-expanded="false"`, sidebar `aria-hidden="true"`, width offscreen, no backdrop, and horizontal overflow `0`. Open state moved to `#/`, exposed `role="dialog"`, `aria-modal="true"`, drawer rect `304x844` at `x=0`, backdrop rect over the page, `backgroundImage: none` on drawer and backdrop, neutral backdrop rgba, app body suppression, and horizontal overflow `0`. Clicking outside the drawer closed back to `#/chat`, removed the backdrop, restored `aria-expanded="false"`, and kept horizontal overflow `0`.
- Mobile `320x740`: closed state used the narrow `calc(100vw - 54px)` drawer width, open state rendered a `266x740` drawer at `x=0`, kept `backgroundImage: none`, neutral backdrop rgba, no horizontal overflow, and closed correctly by clicking outside the drawer.
- Browser screenshot capture timed out in this in-app Browser session, so this slice uses DOM state, CSSOM metrics, interaction state, responsive geometry, and console health as runtime evidence.

Review:

- Read-only subagent review found no blocking issues. It found one P3 invalid-CSS test issue around `border-right-color: var(--border-in-light)`, which was fixed before final verification.
- Main-thread review verified the final diff remains limited to `home.module.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `home.tsx`, `sidebar.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- Browser QA ran in the current local runtime theme and Browser's read-only evaluate blocked direct DOM theme toggling for a computed light/dark comparison. Light/dark treatment is protected by shared token usage, source-contract tests, and CSS review.
- Automated coverage remains source-contract oriented for this shell-level visual slice; runtime Browser QA covers the key drawer open/close behavior and responsive geometry.

## Iteration 2026-06-20 drag-drop-overlay-surface-alignment

Result: passed.

Target flow:

- Dragging files or images over Chat should keep the existing scoped `hasDraggedFiles` checks, `dragActive` lifecycle, aria live status, visible copy, attachment limit summary, and drop parsing behavior.
- The drag overlay, drop card, icon, and summary chip should use the same Gemini-style neutral surface/token system as the composer instead of decorative radial or linear gradients.
- The active overlay should remain visually legible on desktop and compact viewports without introducing horizontal overflow.
- Model config semantics, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat multimodal drag as an in-product assistive surface, not a promotional graphic. The overlay should feel quiet, glassy, and consistent with existing composer surfaces.
- This slice intentionally keeps DataTransfer handling, accepted file/image limits, drag text, live-region behavior, and upload parsing untouched.

Scope:

- `app/components/chat.module.scss`: removed colorful radial and linear gradients from the drag overlay pseudo-layer, content card, icon tile, and dark-mode card; replaced them with neutral overlays, shared surface tokens, shared border/shadow tokens, and tokenized active border.
- `test/gemini-visual-migration.test.ts`: updated the drag-and-drop source contract to reject gradients in the target blocks and require tokenized neutral surfaces, `color-mix` active overlay backgrounds, shared icon surface, neutral summary chip, dark-mode neutral treatment, and existing reduced-motion guards.
- No TypeScript component logic, file utilities, upload parser, send/model/API/account/sync/store/deploy/config paths, dependency files, or route files were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="file drag-and-drop"` failed first as expected because `.chat-dropzone::before` still used radial gradients.
- After the SCSS implementation, the focused drag-and-drop test passed.
- Read-only review found two P3 issues: the active overlay root still used a cool-blue hardcoded rgba and the active border was hardcoded to blue rgba. Both were fixed by moving the overlay to `color-mix(in srgb, var(--surface) 58%, transparent)` / dark `var(--gray)` and the active border to `var(--primary)`, with tests updated to token contracts.
- Read-only re-review found no blocking issues and no new P1/P2/P3 findings.
- `yarn lint` passed.
- `npx tsc --noEmit --pretty false` passed.
- `git diff --check` passed.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` passed with `28` tests.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/#/chat`, title `NeatChat`, meaningful composer controls rendered, no framework overlay, and Browser console warn/error logs `0`.
- Desktop `1440x1024`: dropzone DOM existed with `aria-hidden="true"`, `data-drop-active="false"`, role/status live region present, full-page rect `1440x1024`, horizontal overflow `0`, and target computed styles reported `backgroundImage: none` for dropzone, pseudo-layer, content, icon, and summary.
- Mobile `390x844`: same hidden dropzone/aria/CSSOM checks passed, full-page rect `390x844`, horizontal overflow `0`, and console warn/error logs `0`.
- Narrow `320x740`: same hidden dropzone/aria/CSSOM checks passed, full-page rect `320x740`, horizontal overflow `0`, and console warn/error logs `0`.
- The current in-app Browser API could not synthesize a real file `DataTransfer` drag activation without DOM mutation or raw CDP workarounds, so the active drag-enter/drop flow was not runtime-triggered in Browser QA. Source-contract tests and unchanged TypeScript boundaries cover the active-state selectors and drag/drop code path.

Review:

- Initial read-only review found no blocking issues and identified the two P3 hardcoded active-state values noted above.
- Final read-only re-review confirmed the fixes, found no new P1/P2/P3 issues, and verified the diff remained limited to `chat.module.scss` and `gemini-visual-migration.test.ts`.
- Main-thread review verified no diff in `chat.tsx`, `app/utils/file.ts`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- Browser QA could not trigger a real file drag/drop active state with the available in-app Browser API. This slice has runtime CSSOM/viewport/console coverage for the rendered dropzone structure and source-contract coverage for active selectors, but not a full E2E DataTransfer drag.
- The test remains source-contract oriented for this visual slice; a future browser harness with real file drag support would reduce residual interaction risk.

## Iteration 2026-06-20 streaming-wait-state-tone-alignment

Result: passed.

Target flow:

- When an assistant response is waiting or revealing its first streamed tokens, the existing `message.streaming`, Markdown loading status, preview, and reveal class behavior should remain unchanged.
- The skeleton shimmer and first-token handoff should use Gemini-style neutral surfaces with a quiet primary accent, not the old blue/purple/pink multicolor banding.
- The reveal should stay smooth, reduced-motion should still disable shimmer/reveal motion, and desktop/mobile/narrow layouts should not introduce horizontal overflow.
- Model config semantics, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat streaming wait as a calm system feedback surface inside the message list, not as a decorative loading banner.
- The skeleton bars now use shared surface tokens plus subtle primary accenting, and the first-token reveal uses the same primary/elevated-surface language as the rest of the Gemini-style shell.
- This slice intentionally avoids changing message streaming logic, Markdown rendering semantics, typing copy, API calls, or model request flow.

Scope:

- `app/components/chat.module.scss`: tokenized `streamingSurfaceHandoff`, `.chat-message-shimmer`, `.chat-message-streaming-reveal`, and dark-mode variants; replaced old blue/purple/pink shimmer paint with neutral surface + primary token gradients; changed streaming gradients from `background` shorthand to explicit `background-image` after Browser QA found the shorthand compiling to empty CSSOM for shimmer.
- `test/gemini-visual-migration.test.ts`: strengthened the streaming wait-state source contract to require tokenized light/dark shimmer/reveal paint, explicit `background-image`, reduced-motion guards, and a unified legacy color blacklist across the target streaming blocks.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown rendering logic, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="streaming wait state"` failed first as expected because the old shimmer border/gradient still used hardcoded blue/purple/pink values.
- After implementation, the focused streaming wait-state test passed.
- The test was then strengthened with a unified legacy streaming paint blacklist; the focused test passed again.
- Browser QA exposed a runtime CSSOM issue where shimmer `background` shorthand compiled into empty background longhands. Fixed by switching streaming gradients to explicit `background-image` and keeping skeleton neutral `background-color` fallback. The focused test passed again after that fix.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/?qa=streaming-wait-fresh-1781970829337#/chat`, title `NeatChat`, meaningful chat UI rendered, no framework overlay, and Browser console warn/error logs `0`.
- Desktop `1440x1024`: horizontal overflow `0`; streaming CSSOM contained `streamingSurfaceHandoff`, `color-mix(in srgb`, `var(--primary)`, and `var(--surface-elevated)`; legacy streaming paints `rgba(66, 133, 244)`, `rgba(138, 180, 248)`, `rgba(155, 81, 224)`, `rgba(233, 30, 99)`, `rgba(196, 140, 255)`, and `rgba(255, 139, 180)` were absent from target rules; shimmer/reveal `background-image` values were non-empty; empty background rule count was `0`.
- Mobile `390x844`: same CSSOM checks passed, horizontal overflow `0`, and console warn/error logs `0`.
- Narrow `320x740`: same CSSOM checks passed, horizontal overflow `0`, and console warn/error logs `0`.
- Browser QA intentionally did not send a message, call a model/API, mutate message state, or exercise a real streaming response. The active streaming selectors are covered by source-contract tests and runtime CSSOM validation, not by a real model streaming E2E run.

Review:

- Read-only subagent review found no blocking issues. It raised two P3 notes: `color-mix()` has no automatic legacy-browser fallback, and the initial test was too precise without a unified target-block legacy color blacklist.
- The blacklist test gap was fixed by adding a streaming-scope negative regex covering `streamingSurfaceHandoff`, `.chat-message-shimmer`, `.chat-message-streaming-reveal`, and dark variants.
- The Browser QA CSSOM issue was fixed after review by replacing streaming gradient shorthands with explicit `background-image` declarations where needed.
- Main-thread review verified the final diff remains limited to `chat.module.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The remaining `color-mix()` usage targets modern Chromium/WebKit/Firefox behavior, which matches the Gemini Web alignment goal and the current in-app Browser runtime. If the product must support old embedded WebViews, a dedicated fallback slice should replace or precompute these mixed colors.
- Runtime Browser QA did not trigger an actual first-token streaming transition because doing so would require a real model/API call or DOM/message-state mutation. Source-contract tests and CSSOM validation cover the visual rules, but not live network streaming cadence.

## Iteration 2026-06-20 file-attachment-card-tone-alignment

Result: passed.

Target flow:

- Markdown-rendered file attachments should keep the existing detected-file replacement, safe href handling, clickable card semantics, keyboard copy trigger, file name, file size, and file type presentation.
- The rendered card, icon tile, meta chips, hover/focus/active states, and dark-mode variants should use shared Gemini-style surface, border, shadow, and primary tokens instead of hardcoded blue/green gradients and accent rgba values.
- Touch/mobile behavior should continue to make the card full-width without hover transform, and reduced-motion should still disable motion.
- Model config semantics, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: rendered file attachments are part of the AI answer reading surface, so they should feel like compact neutral document chips, not promotional mini-cards.
- The card now uses `surface-elevated`, `surface-soft`, shared border, and shared shadow tokens, with only a quiet primary-colored icon affordance.
- This slice intentionally avoids changing file detection, Markdown AST handling, copy behavior, or uploaded-file data flow.

Scope:

- `app/components/file-attachment.module.scss`: replaced hardcoded card/icon/meta gradients and blue/green accent rgba values with `--border-in-light`, `--surface-elevated`, `--surface-soft`, `--card-shadow`, `--composer-shadow`, `--primary`, and `color-mix` tokenized borders; dark-mode card shadow uses `--composer-shadow` to preserve visible depth.
- `test/gemini-visual-migration.test.ts`: updated the rendered file attachment source contract to require shared tokens, reject old blue/green accent paint across light/dark card/icon/meta/hover target blocks, and cover active shadow plus dark hover/focus.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown link handling, file detection, stores, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="rendered file attachment cards"` failed first as expected because the card still used a hardcoded border and gradient background.
- After implementation, the focused rendered-file-attachment visual contract passed.
- Read-only review found two Important issues and one Minor issue: dark card shadow was too weak with `--card-shadow`, dark hover/focus was missing from the old-paint blacklist, and active state still used a hardcoded neutral shadow. All three were fixed, and the focused test passed again.
- `yarn jest test/markdown-file-attachment.test.tsx --runInBand` passed with `3` tests, covering rendered file block replacement, clickable attachment card semantics, copy behavior, unsafe link downgrade, and image action labels.
- Sass compile check passed: compiled `file-attachment.module.scss` includes the required shared tokens and no old blue/green accent rgba values or `linear-gradient`.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/markdown-file-attachment.test.tsx test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/?qa=file-attachment-card-1781971323309#/chat`, title `NeatChat`, meaningful composer controls rendered, no framework overlay, and Browser console warn/error logs `0`.
- Desktop `1440x1024`: local app horizontal overflow `0`, composer present, no framework overlay, and console warn/error logs `0`.
- Mobile `390x844`: local app horizontal overflow `0`, composer present, no framework overlay, and console warn/error logs `0`.
- Narrow `320x740`: local app horizontal overflow `0`, composer present, no framework overlay, and console warn/error logs `0`.
- Browser CSSOM on the empty local chat did not load the `file-attachment` CSS module because no file attachment message was present. A temporary `data:` fixture generated from the current SCSS was rejected by Browser security policy, so no Browser workaround was used. Target card visual evidence for this slice is from Jest rendered Markdown behavior plus Sass-compiled CSS validation, not a live Browser-rendered attachment card.

Review:

- Read-only subagent review confirmed diff scope stayed within `file-attachment.module.scss` and `gemini-visual-migration.test.ts`, with no TSX, Markdown href handling, file parsing, upload, send, model/account/API/backend/deploy/production config changes.
- The reviewer Important findings were fixed before final verification: dark card depth now uses `--composer-shadow`, dark hover/focus is covered by the legacy paint blacklist and explicit token assertions, and active state uses `--card-shadow`.
- Main-thread review verified the final diff remains limited to `file-attachment.module.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- Browser did not render a real in-app file attachment card because that requires a pre-existing attachment message or local store seeding beyond the read-only in-app Browser surface. The behavior is still covered by `markdown-file-attachment.test.tsx`, and visual CSS is covered by source-contract plus Sass compile checks.
- The tokenized `color-mix()` icon/hover borders target modern browsers, consistent with the current Gemini Web alignment work. Old embedded WebView fallback remains a separate compatibility slice if required.

## Iteration 2026-06-21 markdown-blockquote-tone-alignment

Result: passed.

Target flow:

- Markdown blockquotes should keep the existing Markdown parsing, spacing rhythm, nested `details` behavior, and thinking/details rendering semantics.
- Quote callouts should use the shared Gemini-style neutral surface and primary accent language instead of old hardcoded Google-blue and gray rgba paint.
- Desktop, mobile, and narrow layouts should keep the composer visible, avoid framework overlays, and introduce no horizontal overflow.
- Model config semantics, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat blockquotes as quiet reader callouts inside AI-rendered content, not as separate promotional cards.
- The default blockquote now uses `--surface-soft`, `--surface-elevated`, and `--primary` tokens for a soft container plus a calm left rail.
- Nested blockquotes inside `details` keep a stripped-down left rail so reasoning/details content does not inherit a full card frame.
- This slice intentionally avoids changing Markdown AST handling, generated content rendering, message state, or network/model behavior.

Scope:

- `app/styles/markdown.scss`: replaced hardcoded blockquote blue/gray light and dark paints with tokenized `color-mix()` surface/primary declarations; added explicit top/right/bottom border longhands after Browser QA showed `border` and `border-color` shorthands could serialize to empty CSSOM longhands; reset `details` blockquotes to a left-rail-only treatment.
- `test/gemini-visual-migration.test.ts`: strengthened the Markdown blockquote contract to lock light/dark/default/details visual tokens, explicit border longhands, dark overrides, and a legacy blue/gray paint blacklist across the target blockquote rules.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown parsing/rendering logic, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown blockquote callouts"` failed first as expected because the old blockquote rule still used hardcoded blue and gray rgba values.
- After implementation, the focused Markdown blockquote visual contract passed.
- Read-only review found no blocking issues and one Minor test-hardening suggestion. The old gray rgba family was added to the target-block blacklist, and the focused test passed again.
- Sass compile check passed: compiled `markdown.scss` includes explicit border longhands, surface/primary tokens, dark overrides, primary details left rail, and no target-block old blue/gray rgba paint.
- Browser QA exposed a runtime CSSOM issue where `border: var(--border-in-light)` and then `border-color: color-mix(...)` shorthands serialized into empty border longhands. Fixed by using explicit top/right/bottom color longhands while keeping the primary left rail explicit.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/?qa=markdown-blockquote-final-1781972380847#/chat`, title `NeatChat`, composer present, no framework overlay, and Browser console warn/error logs `0`.
- Desktop `1440x1024`: horizontal overflow `0`; runtime CSSOM loaded `.markdown-body blockquote`, `.dark .markdown-body blockquote`, and `details` blockquote rules; top/right/bottom border width/style/color longhands were non-empty; primary left rail, dark surface border, details primary left rail, and surface-elevated shadow tokens were present; old target paints `rgba(66, 133, 244)`, `rgba(138, 180, 248)`, `rgba(60, 64, 67)`, and `rgba(232, 234, 237)` were absent.
- Mobile `390x844`: same CSSOM checks passed, horizontal overflow `0`, composer present, and console warn/error logs `0`.
- Narrow `320x740`: same CSSOM checks passed, horizontal overflow `0`, composer present, and console warn/error logs `0`.
- Browser QA intentionally did not send a message, call a model/API, seed chat history, or mutate message state. The active blockquote selectors are covered by source-contract tests plus runtime CSSOM validation on the running app.

Review:

- Read-only subagent review found no Critical or Important issues. It confirmed the diff scope stayed within `markdown.scss` and `gemini-visual-migration.test.ts`, with no parsing/rendering, details/thinking structure, model/account/API/backend/deploy/production config changes.
- The reviewer Minor finding was fixed before final verification by adding the old gray paint families to the blockquote target blacklist.
- Main-thread review also fixed the Browser QA CSSOM issue by replacing shorthand border declarations with explicit longhands in the blockquote target rules.
- Main-thread review verified the final diff remains limited to `markdown.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The blockquote surface continues to use modern `color-mix()` CSS, consistent with current Gemini Web alignment and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout, not an actual assistant response containing a live blockquote, because seeding model/chat content would cross this slice's read-only runtime boundary. Source-contract tests cover the target Markdown stylesheet rules directly.

## Iteration 2026-06-21 markdown-thinking-card-tone-alignment

Result: passed.

Target flow:

- Markdown-generated thinking/reasoning sections should keep the existing `details`, `summary`, loader, open state, reduced-motion behavior, and raw Markdown rendering semantics.
- The reasoning card, summary pill, caret, loader dots, keyframe pulse, and dark-mode variants should use shared Gemini-style surface, elevated-surface, primary, and text tokens instead of old hardcoded blue/green/gray rgba paint.
- Desktop, mobile, and narrow layouts should keep the composer visible, avoid framework overlays, and introduce no horizontal overflow.
- Model config semantics, reasoning payloads, message streaming, token counting, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat thinking output as a quiet reasoning surface inside the answer, visually related to the streaming wait and blockquote callout surfaces.
- The card now uses `--surface-elevated`, `--surface-soft`, `--primary`, and `--black` tokens with explicit border longhands, keeping the existing glass blur and compact summary pill.
- The loader's third dot now stays within the primary/surface token family rather than introducing a separate green accent, reducing palette noise in reasoning states.
- This slice intentionally avoids changing Markdown AST handling, generated thinking HTML, streaming state, reasoning settings, or network/model behavior.

Scope:

- `app/styles/markdown.scss`: tokenized `.markdown-thinking` shell, summary pill, caret, loader dots, `thinking-dot-pulse` keyframe, and dark-mode overrides; replaced shorthand border/color declarations with explicit longhands where needed for runtime CSSOM stability.
- `test/gemini-visual-migration.test.ts`: strengthened the thinking details contract to lock tokenized light/dark/default/loader/keyframe visuals and reject hardcoded `rgb`/`rgba`/`hsl`/`hsla`/hex color values inside the target thinking rules.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown parsing/rendering logic, thinking HTML generation, streaming logic, stores, model config, reasoning option semantics, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="thinking details"` failed first as expected because the existing thinking card still used hardcoded rgba border/background/shadow colors.
- After implementation, the focused thinking details visual contract passed.
- Sass compile check passed: compiled `markdown.scss` includes tokenized surface/primary/dark loader declarations and no hardcoded `rgb`/`rgba`/`hsl`/`hsla`/hex color values in the target thinking rules.
- Read-only review found no Critical or Important issues. It raised one Minor test-hardening note; the target blacklist was expanded from only `rgba(` to `rgb`/`rgba`/`hsl`/`hsla`/hex colors, and the focused test plus Sass check passed again.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/?qa=markdown-thinking-tone-1781972886275#/chat`, title `NeatChat`, composer present, no framework overlay, and Browser console warn/error logs `0`.
- Desktop `1440x1024`: horizontal overflow `0`; runtime CSSOM loaded `.markdown-body details.markdown-thinking`, summary, loader, dark shell, dark summary, dark loader, and `thinking-dot-pulse`; target rules had surface/elevated/primary/text tokens, no hardcoded color functions/hex values, no empty border longhands, tokenized keyframe dots, and tokenized dark loader dots.
- Mobile `390x844`: same CSSOM checks passed, horizontal overflow `0`, composer present, and console warn/error logs `0`.
- Narrow `320x740`: same CSSOM checks passed, horizontal overflow `0`, composer present, and console warn/error logs `0`.
- Runtime CSSOM also confirmed the reduced-motion stop selector for `.thinking-loader` and `summary.markdown-thinking-summary::before`; Chrome serializes `animation: none` as a full animation shorthand, so the source test remains the clearer reduced-motion assertion.
- Browser QA intentionally did not send a message, call a model/API, seed chat history, or mutate message state. The active thinking selectors are covered by source-contract tests plus runtime CSSOM validation on the running app.

Review:

- Read-only subagent review found no Critical or Important issues. It confirmed the diff scope stayed within `markdown.scss` and `gemini-visual-migration.test.ts`, with no parsing/rendering, thinking/details semantics, streaming, model/account/API/backend/deploy/production config changes.
- The reviewer Minor finding was fixed before final verification by broadening the thinking target color blacklist.
- Main-thread review verified the final diff remains limited to `markdown.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The thinking card surface uses modern `color-mix()` CSS, consistent with current Gemini Web alignment and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout, not an actual assistant response containing a live `<think>` section, because seeding model/chat content would cross this slice's read-only runtime boundary. Source-contract tests cover the target Markdown stylesheet rules directly.

## Iteration 2026-06-21 markdown-list-marker-tone-alignment

Result: passed.

Target flow:

- Markdown ordered, unordered, nested, and task lists should keep the existing parsing, spacing rhythm, nested marker behavior, and task-list checkbox semantics.
- List markers should use the shared Gemini-style primary tone as a quiet reading rhythm cue instead of old hardcoded blue rgba paint.
- Desktop, mobile, and narrow layouts should keep the composer visible, avoid framework overlays, and introduce no horizontal overflow.
- Model config semantics, message streaming, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat list markers as lightweight primary rhythm cues in AI output, not as a separate accent palette.
- Light markers now use `--primary` mixed with transparency; dark markers use `--primary` mixed with `--black` to preserve visible contrast after review.
- This slice intentionally avoids changing Markdown AST handling, generated list HTML, task-list behavior, streaming state, or network/model behavior.

Scope:

- `app/styles/markdown.scss`: tokenized `.markdown-body li::marker` for light and dark themes while preserving marker weight, list spacing, nested list rules, and task-list rules.
- `test/gemini-visual-migration.test.ts`: strengthened the Markdown list rhythm contract to lock tokenized marker colors and reject hardcoded color functions/hex values in the marker target rules.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown parsing/rendering logic, task-list semantics, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown list rhythm"` failed first as expected because the old list marker rule still used hardcoded blue rgba values.
- After implementation, the focused Markdown list rhythm visual contract passed.
- Sass compile check passed: compiled `markdown.scss` includes the primary marker mix, the dark readable marker mix, marker weight, and no hardcoded color functions/hex values in the target marker rules.
- Read-only review found no Critical issues. Its Important dark-mode contrast finding was fixed by mixing the dark marker with `--black`; its Minor test-hardening note was addressed by broadening the marker target color blacklist.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/?qa=markdown-list-marker-readable-final-1781973693835#/chat`, composer present, no framework overlay.
- Desktop `1440x1024`: horizontal overflow `0`; runtime CSSOM loaded primary light marker, readable dark marker, marker weight, list padding, item line-height, and task-list rules; no hardcoded marker color functions/hex values and no empty marker rules.
- Mobile `390x844`: same CSSOM checks passed, horizontal overflow `0`, composer present, and no framework overlay.
- Narrow `320x740`: same CSSOM checks passed, horizontal overflow `0`, composer present, and no framework overlay.
- Browser QA intentionally did not send a message, call a model/API, seed chat history, or mutate message state. The active list marker selectors are covered by source-contract tests plus runtime CSSOM validation on the running app.

Review:

- Read-only subagent review found no Critical issues and confirmed the diff scope stayed within `markdown.scss` and `gemini-visual-migration.test.ts`, with no parsing/rendering, list semantics, streaming, model/account/API/backend/deploy/production config changes.
- The reviewer Important finding was fixed before final verification by replacing the dark transparent mix with `color-mix(in srgb, var(--primary) 58%, var(--black))`.
- The reviewer Minor finding was fixed before final verification by broadening the marker target color blacklist.
- Main-thread review verified the final diff remains limited to `markdown.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The list marker tone uses modern `color-mix()` CSS, consistent with current Gemini Web alignment and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout, not an actual assistant response containing a live Markdown list, because seeding model/chat content would cross this slice's read-only runtime boundary. Source-contract tests cover the target Markdown stylesheet rules directly.

## Iteration 2026-06-21 markdown-inline-code-pill-tone-alignment

Result: passed.

Target flow:

- Markdown inline `code` and `tt` pills should keep the existing padding, line-height, `break-spaces` wrapping, cloned decoration behavior, and readable compact rhythm.
- Inline code pills should use the shared Gemini-style primary tone instead of old hardcoded light/dark blue rgba paint.
- Fenced code blocks, `pre > code`, deleted text code, copy controls, language labels, code folding, Markdown parsing, and rendering semantics must remain unchanged.
- Desktop, mobile, and narrow layouts should keep the composer visible, avoid framework overlays, and introduce no horizontal overflow.
- Model config semantics, message streaming, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat inline code as a subtle reader aid inside AI output, visually related to list markers and reasoning surfaces without introducing another accent palette.
- Light inline code now uses a very low-strength `--primary` mix for the pill background and border.
- Dark inline code uses a slightly stronger `--primary` mix for background and border so the pill edge remains visible on dark surfaces without changing text color.
- This slice intentionally avoids changing Markdown AST handling, generated code HTML, copy behavior, code folding, streaming state, or network/model behavior.

Scope:

- `app/styles/markdown.scss`: tokenized `.markdown-body code, .markdown-body tt` and dark-mode inline code pill background/border values while preserving `pre > code`, `del code`, and heading-code reset behavior.
- `test/gemini-visual-migration.test.ts`: strengthened the Markdown inline code contract to lock tokenized light/dark pill colors, preserve rhythm/spacing/transparent reset rules, and reject hardcoded color functions/hex values in the target inline rules.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown parsing/rendering logic, copy-code logic, code folding logic, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown inline code pills"` failed first as expected because the old inline code rule still used hardcoded blue rgba values.
- After implementation, the focused Markdown inline code visual contract passed.
- Sass compile check passed: compiled `markdown.scss` includes the primary inline pill mixes, dark primary inline pill mixes, transparent `pre > code` reset, transparent `del code` reset, and no hardcoded color functions/hex values in the target inline rules.
- Read-only review found no Critical or Important issues. Its Minor test-hardening note was addressed by broadening the inline target color blacklist to include `hwb()` and `device-cmyk()`.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/?qa=markdown-inline-code-pill-tone-final-1781974169558#/chat`, visible composer present, no framework overlay, and Browser console warn/error logs `0`.
- Desktop `1440x1024`: horizontal overflow `0`; runtime CSSOM loaded primary light inline pill background/border, primary dark inline pill background/border, inline rhythm rules, transparent `pre > code`, transparent `del code`, no hardcoded target color functions/hex values, and no empty inline rules.
- Mobile `390x844`: same CSSOM checks passed, horizontal overflow `0`, visible composer present, and no framework overlay.
- Narrow `320x740`: same CSSOM checks passed, horizontal overflow `0`, visible composer present, and no framework overlay.
- Browser QA intentionally did not send a message, call a model/API, seed chat history, or mutate message state. The active inline code selectors are covered by source-contract tests plus runtime CSSOM validation on the running app.

Review:

- Read-only subagent review found no Critical or Important issues and confirmed the diff scope stayed within `markdown.scss` and `gemini-visual-migration.test.ts`, with no parsing/rendering, copy-code, code-folding, streaming, model/account/API/backend/deploy/production config changes.
- The reviewer Minor finding was fixed before final verification by broadening the inline target color blacklist.
- Main-thread review verified the final diff remains limited to `markdown.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The inline code pill surface uses modern `color-mix()` CSS, consistent with current Gemini Web alignment and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout, not an actual assistant response containing live inline code, because seeding model/chat content would cross this slice's read-only runtime boundary. Source-contract tests cover the target Markdown stylesheet rules directly.

## Iteration 2026-06-21 markdown-heading-accent-tone-alignment

Result: passed.

Target flow:

- Markdown heading hierarchy should keep the existing H1-H6 spacing, weight, line-height, H2 left-rail layout, H2 anchor offset, summary-heading reset, and heading-code reset behavior.
- H2 accent rails should use the shared Gemini-style primary tone instead of old hardcoded light/dark blue rgba paint.
- Desktop, mobile, and narrow layouts should keep the composer visible, avoid framework overlays, and introduce no horizontal overflow.
- Model config semantics, message streaming, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat H2 rails as quiet section anchors inside AI-rendered answers, aligned with list markers, blockquotes, and inline code pills.
- Light H2 rails now use a low-strength `--primary` mix; dark H2 rails use `--primary` mixed with `--black`, matching the readable dark list-marker strategy.
- This slice intentionally avoids changing Markdown AST handling, generated heading HTML, anchor behavior, code rendering, streaming state, or network/model behavior.

Scope:

- `app/styles/markdown.scss`: tokenized `.markdown-body h2::before` and `.dark .markdown-body h2::before` rail backgrounds while preserving H2 layout, heading code reset, and summary heading reset.
- `test/gemini-visual-migration.test.ts`: strengthened the Markdown heading hierarchy contract to lock tokenized light/dark H2 rail colors and reject hardcoded color functions/hex values in the target rail rules.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown parsing/rendering logic, copy-code logic, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown heading hierarchy"` failed first as expected because the old H2 rail rule still used hardcoded blue rgba values.
- After implementation, the focused Markdown heading hierarchy visual contract passed.
- Sass compile check passed: compiled `markdown.scss` includes tokenized light/dark H2 rail mixes, transparent heading-code resets, and no hardcoded color functions/hex values in the target H2 rail rules.
- Read-only review found no Critical, Important, or Minor issues.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/?qa=markdown-heading-rail-tone-final-1781974938085#/chat`, visible composer present, no framework overlay, and Browser console warn/error logs `0`.
- Desktop `1440x1024`: horizontal overflow `0`; runtime CSSOM loaded primary light H2 rail, readable dark H2 rail, H2 rhythm rules, H2 anchor offset, transparent heading-code reset, dark heading-code reset, summary-heading reset, no hardcoded target color functions/hex values, and no empty rail rules.
- Mobile `390x844`: same CSSOM checks passed, horizontal overflow `0`, visible composer present, and no framework overlay.
- Narrow `320x740`: same CSSOM checks passed, horizontal overflow `0`, visible composer present, and no framework overlay.
- Browser QA intentionally did not send a message, call a model/API, seed chat history, or mutate message state. The active H2 rail selectors are covered by source-contract tests plus runtime CSSOM validation on the running app.

Review:

- Read-only subagent review found no Critical, Important, or Minor issues and confirmed the diff scope stayed within `markdown.scss` and `gemini-visual-migration.test.ts`, with no parsing/rendering, heading, code, streaming, model/account/API/backend/deploy/production config changes.
- The reviewer confirmed the dark H2 rail matches the existing readable dark list-marker tone strategy.
- Main-thread review verified the final diff remains limited to `markdown.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The H2 rail uses modern `color-mix()` CSS, consistent with current Gemini Web alignment and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout, not an actual assistant response containing live H2 headings, because seeding model/chat content would cross this slice's read-only runtime boundary. Source-contract tests cover the target Markdown stylesheet rules directly.

## Iteration 2026-06-21 markdown-link-tone-alignment

Result: passed.

Target flow:

- Markdown links should keep underline, underline offset/thickness, hover emphasis, focus-visible ring, no-href anchor reset, and heading-anchor hover reset behavior.
- Link tones should use the shared Gemini-style primary token rather than old hardcoded light/dark blue rgba paint.
- Auto theme with system dark, explicit Dark, and explicit Light should all receive the correct readable link tone without high-specificity selectors overriding link interaction resets.
- Desktop, mobile, and narrow layouts should keep the composer visible, avoid framework overlays, and introduce no horizontal overflow.
- Model config semantics, message streaming, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Continue the Markdown tokenization track: links are the primary inline navigation affordance inside AI-rendered answers, so their color should align with the Gemini-style primary tone while keeping underline behavior as the main affordance.
- Light theme defines `--markdown-link-color` from `--primary` with a subtle decoration token.
- Dark theme defines `--markdown-link-color` as `--primary` mixed with `--black` so links stay readable on dark message surfaces; Auto dark inherits the same token through the existing dark mixin path.
- This slice intentionally avoids changing Markdown AST handling, generated link HTML, routing, streaming state, or network/model behavior.

Scope:

- `app/styles/markdown.scss`: added `--markdown-link-color` and `--markdown-link-decoration-color` to Markdown light/dark mixins, then changed `.markdown-body a` to consume those tokens with low specificity.
- `test/gemini-visual-migration.test.ts`: strengthened the Markdown link contract to lock light/dark/Auto token paths, reject high-specificity dark link overrides, preserve hover/focus/no-href/heading-anchor resets, and reject hardcoded color functions/hex values in the target link token rules.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown parsing/rendering logic, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown links readable"` initially passed against the old test, confirming the old contract still allowed hardcoded link rgba values.
- After updating the test to require tokenized link colors, the focused test failed first as expected because `.markdown-body a` still used `rgba(26, 115, 232, 1)`.
- After the initial implementation, focused Jest passed, then read-only review found Auto/system dark missed the readable dark link path.
- An Auto dark assertion was added and failed first as expected because the Auto dark link block was missing.
- A direct `body:not(.light)` Auto dark selector fixed that gap but read-only review found it would override hover and no-href anchor behavior due to specificity.
- The final implementation moved link tones into Markdown light/dark custom properties and removed high-specificity dark link overrides; the focused Markdown link visual contract passed.
- Final read-only review found no Critical, Important, or Minor issues and marked the diff ready to submit.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/?qa=markdown-link-tone-final-1781975394331#/chat`, visible composer present, no framework overlay, and Browser console warn/error logs `0`.
- Desktop `1440x1024`: horizontal overflow `0`; runtime CSSOM loaded `.markdown-body a` as a low-specificity token consumer, light/dark/Auto link custom properties, hover/focus/no-href/heading-anchor resets, and no high-specificity dark/Auto link selector.
- Mobile `390x844`: same CSSOM checks passed, horizontal overflow `0`, visible composer present, and no framework overlay.
- Narrow `320x740`: same CSSOM checks passed, horizontal overflow `0`, visible composer present, and no framework overlay.
- The actual Browser environment had `prefers-color-scheme: dark` with `bodyClass=""`, validating the Auto dark path; computed `--markdown-link-color` resolved to a mix of `rgb(49, 94, 248)` and dark `--black` (`rgb(232, 234, 237)`).
- Browser QA intentionally did not send a message, call a model/API, seed chat history, or mutate message state. The active link selectors and tokens are covered by source-contract tests plus runtime CSSOM validation on the running app.

Review:

- First read-only review found an Important Auto/system dark gap because `.dark .markdown-body a` does not apply when Theme.Auto relies on `prefers-color-scheme`.
- Second read-only review found an Important specificity issue in the direct `body:not(.light)` selector because it could override link hover and no-href reset behavior.
- Final read-only review found no issues after switching to custom properties and confirmed the cascade, light/dark/Auto theme paths, and test coverage are acceptable.
- Main-thread review verified the final diff remains limited to `markdown.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The link tones use modern `color-mix()` CSS, consistent with the surrounding Gemini Web alignment work and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout, not an actual assistant response containing live Markdown links, because seeding model/chat content would cross this slice's read-only runtime boundary. Source-contract tests cover the target Markdown stylesheet rules directly.

## Iteration 2026-06-21 markdown-details-disclosure-hover-tone

Result: passed.

Target flow:

- Generic Markdown `details summary` disclosure hover should use the shared Gemini-style primary token family instead of hardcoded primary blue.
- Auto theme with system dark, explicit Dark, and explicit Light should receive the correct hover tone through existing Markdown theme mixins.
- Marker hiding, static disclosure arrow, open arrow rotation, focus reset, focus-visible reset, and active reset must remain unchanged.
- `details.markdown-thinking`, details blockquotes, Markdown parsing, generated details HTML, and streaming behavior must remain unchanged.
- Desktop, mobile, and narrow layouts should mount the app, keep the composer visible, avoid framework overlays, and introduce no horizontal overflow.
- Model config semantics, message streaming, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: treat disclosure hover as a quiet affordance inside AI-rendered content, visually aligned with link, list-marker, heading-rail, blockquote, and thinking-card token work.
- Light theme defines `--markdown-disclosure-hover-color` from `--primary`.
- Dark theme defines `--markdown-disclosure-hover-color` as `--primary` mixed with `--black`, matching the readable dark Markdown link strategy.
- This slice intentionally avoids changing Markdown AST handling, generated details markup, thinking-card specialized styling, streaming state, or network/model behavior.

Scope:

- `app/styles/markdown.scss`: added `--markdown-disclosure-hover-color` to Markdown light/dark mixins and changed generic `details summary:hover` plus `summary:hover::before` to consume that token.
- `test/gemini-visual-migration.test.ts`: added a Markdown details disclosure hover contract that locks light/dark/Auto token paths, hover consumers, marker hiding, static/open arrow behavior, focus resets, active reset, and absence of old hardcoded target paints.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown parsing/rendering logic, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown details disclosure hover"` failed first as expected because the old generic disclosure hover still used hardcoded `rgb(49, 94, 248)` and the new disclosure token was missing.
- After implementation, the focused Markdown details disclosure hover visual contract passed.
- Read-only review found no Critical, Important, or Minor issues and confirmed the diff is ready to submit.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity after restarting the 3000 dev server: `http://127.0.0.1:3000/?qa=markdown-details-disclosure-hover-restarted-1781977077580#/chat`, app mounted, visible composer present, no framework overlay, and Browser console warn/error logs `0`.
- Desktop `1440x1024`: horizontal overflow `0`; runtime CSSOM loaded root/light `--markdown-disclosure-hover-color: var(--primary)`, dark/Auto dark readable disclosure token, compiled hover and hover `::before` consumers, hidden marker, static arrow, open rotation, focus/focus-visible reset, active reset, and no old target paint.
- Mobile `390x844`: same CSSOM checks passed, horizontal overflow `0`, visible composer present, and no framework overlay.
- Narrow `320x740`: same CSSOM checks passed, horizontal overflow `0`, visible composer present, and no framework overlay.
- The actual Browser environment had `prefers-color-scheme: dark` with `bodyClass=""`, validating the Auto dark path; computed `--markdown-disclosure-hover-color` resolved to a mix of `rgb(49, 94, 248)` and dark `--black` (`rgb(232, 234, 237)`).
- Browser QA intentionally did not send a message, call a model/API, seed chat history, or mutate message state. The active disclosure selectors and tokens are covered by source-contract tests plus runtime CSSOM validation on the running app.

Review:

- Read-only subagent review found no Critical, Important, or Minor issues.
- The reviewer confirmed `details.markdown-thinking` uses more specific rules and is not overridden by the generic disclosure hover token change.
- Main-thread review verified the final diff remains limited to `markdown.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The dark disclosure hover tone uses modern `color-mix()` CSS, consistent with the surrounding Gemini Web alignment work and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout, not an actual assistant response containing live generic details markup, because seeding model/chat content would cross this slice's read-only runtime boundary. Source-contract tests cover the target Markdown stylesheet rules directly.

## Iteration 2026-06-21 markdown-image-media-card-tone

Result: passed.

Target flow:

- Markdown image media cards should keep the existing frame layout, image preview button, image download button, hover reveal, focus-visible, active press, mobile visible download button, and reduced-motion behavior.
- Image frame hover border and image download border should use shared Markdown theme tokens instead of legacy hardcoded Gemini blue values.
- Auto theme with system dark, explicit Dark, and explicit Light should receive the correct image media tones through existing Markdown theme mixins.
- Markdown image rendering, preview/download semantics, upload parsing, generated image markup, and streaming behavior must remain unchanged.
- Desktop, mobile, and narrow layouts should mount the app, avoid framework overlays, and introduce no horizontal overflow.
- Model config semantics, message streaming, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Continue the Markdown tokenization track: image media cards are high-attention AI output surfaces, so hover and download border tones should align with the same Gemini-style primary token system used by links, disclosure hover, list markers, headings, blockquotes, and thinking cards.
- Light theme defines a subtle image frame hover border from `--markdown-link-color` and keeps the download border as the existing translucent white overlay tone.
- Dark theme defines both image frame hover and download border from the readable dark Markdown link tone, so explicit Dark and Auto dark stay visually consistent without selector-specific color overrides.
- This slice intentionally avoids changing Markdown AST handling, image preview/download component logic, streaming state, or network/model behavior.

Scope:

- `app/styles/markdown.scss`: added `--markdown-image-frame-hover-border-color` and `--markdown-image-download-border-color` to Markdown light/dark mixins, then changed image frame hover and image download border rules to consume those tokens.
- `test/gemini-visual-migration.test.ts`: strengthened the Markdown image media card contract to lock light/dark/Auto token paths, reject legacy target blue paints in the image-media scope, and preserve frame layout, hover reveal, focus-visible, mobile, and reduced-motion behavior.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown parsing/rendering logic, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown image media cards"` failed first as expected because the new image media tokens were missing and the old rules still used hardcoded target blue paint.
- After implementation, the focused Markdown image media card visual contract passed.
- Read-only review then found an explicit Dark cascade bug: the dark base image frame border could override the generic hover token. The test was tightened to require a dark hover/focus token border, failed first as expected, then passed after adding the explicit dark hover token consumer.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/`, app mounted, current Browser console error logs `0`.
- Desktop `1440x1024`: horizontal overflow `0`; runtime CSSOM loaded light/root image frame and download tokens, dark image frame and download tokens, Auto dark image frame and download tokens, token-consuming frame hover and download border selectors, explicit dark hover token border after the dark base border, no legacy target blue paint in the image-media scope, and reduced-motion rules preserved.
- Mobile `390x844`: app mounted, horizontal overflow `0`, mobile media rule keeps the download button visible/clickable and image frame stable.
- Narrow `320x740`: app mounted, horizontal overflow `0`, mobile media rule keeps the download button visible/clickable and image frame stable.
- The actual Browser environment had `prefers-color-scheme: dark`, validating the Auto dark token path through computed root variables.
- Browser QA intentionally did not send a message, call a model/API, seed chat history, or mutate message state. The active image media selectors and tokens are covered by source-contract tests plus runtime CSSOM validation on the running app.

Review:

- First read-only subagent review found a P1 explicit Dark cascade bug and a matching test gap because the dark base image frame border could override the generic hover token.
- The bug was fixed by requiring and applying `border-color: var(--markdown-image-frame-hover-border-color)` inside `.dark .markdown-body .markdown-image-frame:hover, :focus-within`.
- Final read-only subagent review found no blocking or important issues and confirmed the P1 cascade bug is fixed.
- Main-thread review verified the current diff remains limited to `markdown.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The dark image media tones use modern `color-mix()` CSS, consistent with the surrounding Gemini Web alignment work and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout, not an actual assistant response containing live image Markdown, because seeding model/chat content would cross this slice's read-only runtime boundary. Source-contract tests cover the target Markdown stylesheet rules directly.

## Iteration 2026-06-21 markdown-code-fold-control-tone

Result: passed.

Target flow:

- Long AI-rendered Markdown code blocks should keep the existing sticky bottom gradient expand affordance, button size, accessible expand contract, focus-visible ring, active press, and reduced-motion behavior.
- The code fold expand button hover/focus border, background, foreground, and accent shadow should use shared Markdown theme tokens instead of legacy hardcoded Gemini blue values.
- Auto theme with system dark, explicit Dark, and explicit Light should receive the correct code fold control tones through existing Markdown theme mixins.
- Code block rendering, copy button behavior, language label, scroll fade hints, code folding semantics, and Markdown parsing must remain unchanged.
- Desktop, mobile, and narrow layouts should mount the app, avoid framework overlays, and introduce no horizontal overflow.
- Model config semantics, message streaming, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Continue the AI-rendered content tokenization track: code blocks are one of the densest Gemini-style output surfaces, so the fold control should feel like part of the same Markdown primary/surface token family instead of a separate old-blue chip.
- Light theme defines code fold hover border, background, foreground, and accent shadow from `--markdown-link-color`, `--surface-elevated`, `--black`, and transparent mixes.
- Dark theme defines the same token family from the readable dark Markdown link tone, `--surface-soft`, and dark `--black`, so explicit Dark and Auto dark remain aligned.
- This slice intentionally avoids changing code block structure, copy feedback, code language labels, scroll fade logic, folding behavior, streaming state, or network/model behavior.

Scope:

- `app/styles/markdown.scss`: added `--markdown-code-fold-hover-border-color`, `--markdown-code-fold-hover-background`, `--markdown-code-fold-hover-color`, and `--markdown-code-fold-hover-shadow-color` to Markdown light/dark mixins, then changed the code fold expand button hover/focus rules to consume those tokens.
- `test/gemini-visual-migration.test.ts`: strengthened the Markdown code block chrome contract to lock light/dark/Auto token paths, hover/focus token consumers including foreground color, absence of legacy target blue paint in the code fold scope, and preservation of sticky shell, button dimensions, focus ring, and reduced-motion behavior.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown parsing/rendering logic, code copy logic, code folding semantics, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown code block chrome"` failed first as expected because the new code fold control tokens were missing and the old rules still used hardcoded target blue paint.
- After implementation, the focused Markdown code block chrome visual contract passed.
- Read-only review then found an Auto dark foreground cascade bug: Auto dark could receive a dark hover background token while the base hover rule kept a light-theme dark foreground color. The test was tightened to require `--markdown-code-fold-hover-color`, failed first as expected, then passed after tokenizing foreground color for light/dark/Auto.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/`, app mounted, current Browser console error logs `0`.
- Desktop `1440x1024`: horizontal overflow `0`; runtime CSSOM loaded light/root code fold hover tokens, dark code fold hover tokens, Auto dark code fold hover tokens, token-consuming hover/focus selectors including foreground color, preserved sticky shell, preserved base button geometry, preserved reduced-motion rule, and no legacy target blue paint in the code fold scope. Computed Auto dark root variables paired the dark background token with a light foreground token.
- Mobile `390x844`: app mounted, horizontal overflow `0`, tokenized code fold controls including foreground color loaded, reduced-motion rule preserved, and no legacy target blue paint in the code fold scope.
- Narrow `320x740`: app mounted, horizontal overflow `0`, tokenized code fold controls including foreground color loaded, reduced-motion rule preserved, and no legacy target blue paint in the code fold scope.
- Browser QA intentionally did not send a message, call a model/API, seed chat history, or mutate message state. The active code fold selectors and tokens are covered by source-contract tests plus runtime CSSOM validation on the running app.

Review:

- First read-only subagent review found an Auto dark foreground cascade bug and recommended tokenizing code fold hover/focus foreground.
- The bug was fixed by adding and consuming `--markdown-code-fold-hover-color` in the shared hover/focus rule and explicit Dark override.
- Final read-only subagent review found no blocking or important issues and confirmed the Auto dark foreground/cascade bug is fixed.
- Main-thread review verified the current diff remains limited to `markdown.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The code fold control tones use modern `color-mix()` CSS, consistent with the surrounding Gemini Web alignment work and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout, not an actual assistant response containing a live long code block, because seeding model/chat content would cross this slice's read-only runtime boundary. Source-contract tests cover the target Markdown stylesheet rules directly.

## Iteration 2026-06-21 markdown-token-info-tone

Result: passed.

Target flow:

- Markdown token metadata chips should keep the existing token count, optional first-character delay reveal, accessible label, `aria-pressed`, `data-token-info-expanded`, static non-overlapping placement, mobile wrapping, and reduced-motion behavior.
- Token metadata chip base, hover, focus-visible, expanded, and accent shadow tones should use shared Markdown theme tokens instead of legacy hardcoded Gemini blue values.
- Auto theme with system dark, explicit Dark, and explicit Light should receive the correct token metadata tones through existing Markdown theme mixins.
- Token counting, first-character delay storage, Markdown rendering, stream state, and message layout semantics must remain unchanged.
- Desktop, mobile, and narrow layouts should mount the app, avoid framework overlays, and introduce no horizontal overflow.
- Model config semantics, message streaming, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Continue the AI-rendered content tokenization track: token metadata is a low-attention status chip, so it should feel quieter than links and code fold controls while still sharing the same Gemini-style Markdown primary/surface token family.
- Light theme defines subtle base border/background/text tones from `--black`, `--black-50`, and `--surface-elevated`, with hover/expanded emphasis from `--markdown-link-color`.
- Dark theme defines the same chip contract from `--surface-soft`, readable dark text, and the dark Markdown link tone, so explicit Dark and Auto dark remain aligned.
- This slice intentionally avoids changing token calculation, latency capture, aria/data attributes, Markdown AST handling, streaming state, or network/model behavior.

Scope:

- `app/styles/markdown.scss`: added token metadata chip base, hover, foreground, and shadow CSS variables to Markdown light/dark mixins, then changed the shared and explicit Dark `.token-info` rules to consume those variables.
- `test/gemini-visual-migration.test.ts`: strengthened the token metadata chip visual contract to lock light/dark/Auto token paths, token-consuming base/hover/focus/expanded selectors, focus ring preservation, mobile wrapping, reduced motion, and absence of legacy target blue paint in the token metadata scope.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, Markdown parsing/rendering logic, token calculation, token latency storage, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, upload parser, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="token metadata"` failed first as expected because the token metadata chip theme variables were missing and the old hover/focus/expanded rules still used hardcoded target blue paint.
- After implementation, the focused Markdown token metadata visual contract passed.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/`, app mounted, no framework overlay observed through Browser QA, and Browser console warn/error logs `0` after the QA start timestamp.
- Desktop `1439x1024`: app mounted, horizontal overflow `0`, runtime CSSOM loaded light/root token metadata variables, dark token metadata variables, Auto dark token metadata variables, base/hover/focus/expanded token consumers, explicit Dark token consumers, focus ring preservation, reduced-motion rule, and no legacy target blue paint in the token metadata scope.
- Mobile `390x844`: app mounted, horizontal overflow `0`, token metadata CSS loaded, and no new warn/error logs.
- Narrow `320x740`: app mounted, horizontal overflow `0`, token metadata CSS loaded, and no new warn/error logs.
- The actual Browser environment had `prefers-color-scheme: dark` with `bodyClass=""`, validating the Auto dark path; computed root variables resolved token metadata background from `rgb(36, 39, 43) 72%` and token metadata text from `rgb(232, 234, 237) 74%`.
- Browser QA intentionally did not send a message, call a model/API, seed chat history, or mutate message state. The active token metadata selectors and tokens are covered by source-contract tests plus runtime CSSOM validation on the running app.

Review:

- A read-only subagent review was requested, but the subagent failed before producing findings because the account hit the Codex usage limit. Two existing subagent ids exposed in the environment were also unavailable to receive review input.
- Main-thread code review found no Critical, Important, or Minor issues. The selector scope remains limited to `.markdown-body-container .token-info`; Auto dark and explicit `.dark` use the same token names with theme-specific values; focus-visible keeps `--focus-ring-shadow`; mobile and reduced-motion behavior are preserved; the test locks both source contract and legacy paint removal.
- Main-thread boundary review verified the current diff remains limited to `markdown.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `markdown.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- The token metadata chip tones use modern `color-mix()` CSS, consistent with the surrounding Gemini Web alignment work and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout, not an actual assistant response containing a live token metadata chip, because seeding model/chat content would cross this slice's read-only runtime boundary. Render/source-contract tests cover the target Markdown stylesheet and token metadata behavior directly.

## Iteration 2026-06-21 image-editor-control-tone

Result: passed.

Target flow:

- Image editor drawing tools, brush-size controls, and color swatches should keep the existing toolbar roles, group labels, `aria-pressed` selected states, tool dimensions, focus rings, mobile wrapping, and reduced-motion behavior.
- Selected tool/size and selected color swatch tones should use local Gemini-style variables instead of legacy hardcoded blue values.
- Light and Dark theme selected states should remain readable while sharing the same variable contract, so the control family feels aligned with the rest of the UI tokenization work.
- Canvas drawing, eraser behavior, brush size switching, undo/redo, save/cancel, edited image output, upload parsing, model calls, and message state must remain unchanged.
- Model config semantics, message streaming, account/secret/sync, backend/API, production config, deployment config, upload parsing, send path, and model request payload construction must remain unchanged.

Design direction:

- Continue the multimodal polish track: the image editor is a high-touch editing surface, so selected controls should feel like part of the same primary/surface token system instead of isolated old-blue patches.
- Light theme defines selected button background, border, foreground, inset shadow, swatch ring, and swatch shadow from `--primary`.
- Dark theme overrides the same local variables under `:global(.dark) .image-editor-container`, mixing `--primary` with readable dark theme text/surface tokens where needed.
- This slice intentionally avoids changing React component logic, canvas drawing behavior, image processing, save flow, network/model behavior, or persisted state.

Scope:

- `app/components/image-editor.module.scss`: added local selected-state variables on `.image-editor-container`, added Dark overrides on `:global(.dark) .image-editor-container`, and changed selected tool/size buttons plus selected color swatches to consume those variables.
- `test/gemini-visual-migration.test.ts`: strengthened the image editor visual contract to lock Light/Dark selected variables, selected control consumers, selected swatch consumers, and absence of legacy target blue paint in the image editor stylesheet.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, image editor canvas behavior, upload parser, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="image editor controls"` failed first as expected because the new image editor selected-state variables were missing and selected controls still used hardcoded legacy blue paint.
- After implementation, the focused image editor visual contract passed.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Runtime QA:

- in-app Browser plugin could not start in this sandboxed turn. The Node browser bridge failed before documentation/bootstrap with `sandbox-state-meta: missing field sandboxPolicy`; therefore no Browser CSSOM or screenshot claim is made for this slice.
- Local dev server reachability was still checked as a fallback: with approved localhost access, `curl -I http://localhost:3000/` returned `HTTP/1.1 200 OK`.
- Runtime visual confidence for this slice comes from the source-contract test over the ImageEditor stylesheet plus localhost reachability, not from a fresh Browser-rendered image editor interaction.

Review:

- Read-only subagent review found no Critical, Important, or Minor issues and gave a submit-ready verdict.
- The reviewer confirmed the local variable scope and Dark inheritance path are correct, and that the diff does not cross model config, account/secret, sync, production/deployment, or backend boundaries.
- Main-thread review verified the current diff remains limited to `image-editor.module.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `image-editor.tsx`, `chat.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, or model request paths.

Known risks:

- Browser MCP was unavailable in this turn, so this slice lacks a fresh interactive Browser CSSOM/screenshot pass. If the browser bridge recovers, a follow-up QA-only check should validate selected image editor controls in Light/Dark at desktop and mobile sizes.
- The selected-state tones use modern `color-mix()` CSS, consistent with the surrounding Gemini Web alignment work. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.

## Iteration 2026-06-21 dropzone-surface-tone

Result: passed.

Target flow:

- Dragging files or images over chat should keep the existing scoped drag handlers, file/image type checks, upload-slot limits, live status region, hidden inactive overlay, non-blocking pointer behavior, and reduced-motion fallback.
- The multimodal dropzone overlay, scrim, content border, content shadow, summary chip, and hint copy should use local Gemini-style surface tokens instead of hardcoded gray/white paint.
- Light, explicit Dark, and Auto dark should share the same variable contract while preserving explicit Light overrides.
- Upload parsing, attachment limits, image/file classification, message state, model config, model requests, account/secret/sync, backend/API, production config, and deployment config must remain unchanged.

Design direction:

- Continue the multimodal polish track: the drag target should feel like part of the same Gemini-style surface system as the composer and attachment controls, with quieter surface-mixed tones and a restrained active accent.
- Light theme defines dropzone overlay and content tones from `--surface`, `--surface-elevated`, `--surface-soft`, `--primary`, `--black`, and `--black-50`.
- Explicit Dark and Auto dark override the same local variables with dark surface/text tokens; Auto dark uses `body:not(.light)` under `prefers-color-scheme: dark` so explicit Light is not overridden.
- This slice intentionally avoids changing React drag/drop logic, upload slot calculations, file helpers, attachment state, network/model behavior, or persisted settings.

Scope:

- `app/components/chat.module.scss`: added local dropzone tone variables, consumed them across active overlay, scrim, content border/shadow, summary chip, and hint copy; added explicit Dark and Auto dark token paths; added a higher-specificity explicit Dark active content rule so active border/shadow are not overwritten by the dark base content rule.
- `test/gemini-visual-migration.test.ts`: strengthened the drag-and-drop visual contract to lock Light/Dark/Auto dark token paths, active-state consumers, dark cascade order, reduced-motion preservation, live status behavior, and existing drag/drop/file-limit source contracts.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, file helper logic, upload parser, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="file drag-and-drop"` failed first as expected because the new dropzone local tone variables were missing and old rules still used direct paint values.
- After the first implementation, focused test passed, then read-only review found two cascade/theme gaps: explicit Dark active content was overridden by the dark base content rule, and Auto dark did not receive the dark-specific dropzone tokens.
- A second RED check failed as expected on the missing Auto dark source contract; after adding Auto dark tokens and explicit Dark active content override, the focused drag-and-drop visual contract passed.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser page identity: `http://127.0.0.1:3000/#/chat`, app mounted, and Browser console warn/error logs `0` after the QA start timestamp.
- Desktop `1439x1024`: chat mounted, horizontal overflow `0`, dropzone exists with `aria-hidden="true"`, `data-drop-active="false"`, `pointer-events: none`, opacity `0`, live status region exists with `aria-atomic="true"`, runtime CSSOM loaded the dropzone variables, active/background/scrim/content/summary/hint consumers, Auto dark selector, explicit Dark active content selector, and reduced-motion contract.
- Mobile `390x844`: same dropzone hidden-state, CSSOM, reduced-motion, live-region, and horizontal overflow checks passed.
- Narrow `320x740`: same dropzone hidden-state, CSSOM, reduced-motion, live-region, and horizontal overflow checks passed.
- Browser runtime reported `prefers-color-scheme: light` with `bodyClass=""`, so computed variables were validated for the current light runtime; Auto dark and explicit Dark cascade paths were validated through source-contract tests and runtime CSSOM selector presence without mutating the user's theme.
- Browser QA intentionally did not dispatch real drag/drop events, send a message, call a model/API, seed chat history, mutate local storage, or change persisted theme state. Drag/drop behavior and limits are covered by the existing source-contract assertions in the visual migration test.

Review:

- First read-only subagent review found two issues: explicit Dark active content border/shadow were overridden by the later dark base rule, and Auto dark lacked dark-specific dropzone token overrides.
- Both issues were fixed by adding an explicit Dark active content override after the dark base rule and adding a `prefers-color-scheme: dark` + `body:not(.light)` Auto dark token block.
- Final read-only subagent review found no blocking or important issues and confirmed the two prior findings were resolved.
- Main-thread boundary review verified the current diff remains limited to `chat.module.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `file.ts`, stores, config, API/backend, route constants, deployment files, dependency files, upload parser, send path, or model request paths.

Known risks:

- The dropzone tones use modern `color-mix()` CSS, consistent with the surrounding Gemini Web alignment work and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated hidden-state layout and loaded CSSOM rather than an actual OS file drag/drop active state, because simulating a real external file drag through the in-app Browser would not match the user's OS-level drag source. Source-contract tests cover the drag handler and active-state styling contracts directly.

## Iteration 2026-06-21 attachment-add-button-tone

Result: passed.

Target flow:

- The composer attachment strip "continue adding attachments" button should keep the existing native file picker entry, `canAddMoreAttachments` guard, `disabled={uploading}` behavior, hover/focus-visible affordance, disabled opacity/cursor, and mobile sizing.
- The add button border, surface, icon color, inner ring, hover/focus surface, hover/focus border, and hover/focus shadow should use local Gemini-style variables instead of hardcoded old blue/light paint.
- Light, explicit Dark, and Auto dark should share the same variable contract while preserving explicit Light overrides.
- Upload parsing, file/image limits, existing attachment state, drag/drop behavior, model config, model requests, account/secret/sync, backend/API, production config, and deployment config must remain unchanged.

Design direction:

- Continue the multimodal polish track: the small add-more control is the recurring entry point after an attachment exists, so it should look like part of the same primary/surface token system as the dropzone and attachment strip instead of an isolated old-blue tile.
- Light theme defines dashed border, elevated surface, readable primary icon, inner ring, and hover accent from `--primary`, `--surface-elevated`, `--surface`, and `--black`.
- Explicit Dark and Auto dark override the same local variables with dark surface/text tokens; Auto dark uses `body:not(.light)` under `prefers-color-scheme: dark` so explicit Light is not overridden.
- This slice intentionally avoids changing React upload handlers, file input behavior, attachment limits, drag/drop logic, network/model behavior, or persisted state.

Scope:

- `app/components/chat.module.scss`: added local attachment add-button tone variables; changed base, hover/focus-visible, explicit Dark, and Auto dark rules to consume them; preserved dimensions, disabled behavior, transitions, and mobile sizing.
- `test/gemini-visual-migration.test.ts`: strengthened the attachment add-button visual contract to lock Light/Dark/Auto dark token paths, token-consuming base/hover/focus selectors, mobile dimensions, disabled behavior, native picker wiring, and absence of legacy target paint in the add-button tone scope.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, file helper logic, upload parser, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, send path, model request payload construction, or drag/drop behavior were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip add action"` failed first as expected because the new attachment add-button tone variables were missing and the old button rules still used hardcoded legacy blue/light paint.
- After implementation, the focused attachment add-button visual contract passed.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser initially loaded `http://127.0.0.1:3001/#/chat` into the Auth page because that origin had no local access session, so target Chat CSS was not present there. No auth state or access code was created or modified.
- in-app Browser page identity for successful QA: `http://localhost:3000/#/chat`, app mounted with an existing local session, `textareaCount=1`, and Browser console warn/error logs `0` after the QA start timestamp.
- Desktop `1439x1024`: chat mounted, horizontal overflow `0`, runtime CSSOM loaded attachment add-button base/background/border/color variables, hover/focus background and shadow consumers, explicit Dark selector, Auto dark selector, mobile-size rule, and no legacy old-blue/light paint in the add-button tone scope.
- Mobile `390x844`: same CSSOM, selector, token-consumer, and horizontal overflow checks passed.
- Narrow `320x740`: same CSSOM, selector, token-consumer, and horizontal overflow checks passed.
- Browser runtime reported `bodyClass="light"` and `prefers-color-scheme: light`; Auto dark and explicit Dark paths were validated through source-contract tests and runtime CSSOM selector presence without mutating the user's theme.
- Browser QA intentionally did not open the native file picker, upload a file, send a message, call a model/API, seed chat history, mutate local storage, or change persisted theme/access state. Upload behavior and limits are covered by source-contract assertions in the visual migration test.

Review:

- Read-only subagent review found no blocking or important issues.
- The reviewer confirmed Light, explicit Dark, and Auto dark cascade paths do not conflict; hover/focus-visible/disabled behavior remains intact; mobile `58px` sizing remains intact; and upload behavior is still anchored to `canAddMoreAttachments`, `disabled={uploading}`, `onClick={handleUploadAttachments}`, and the native picker entry.
- Main-thread boundary review verified the current diff remains limited to `chat.module.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `file.ts`, stores, config, API/backend, route constants, deployment files, dependency files, upload parser, send path, model request paths, or account/sync logic.

Known risks:

- The attachment add-button tones use modern `color-mix()` CSS, consistent with the surrounding Gemini Web alignment work and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated the loaded CSSOM and shell layout rather than an actual rendered add-button instance, because the button only appears after existing attachments are present and this slice intentionally avoided mutating chat/upload state or opening the native file picker. Source-contract tests cover the rendered entry point, upload guard, and visual state rules directly.

## Iteration 2026-06-21 attachment-full-indicator-tone

Result: passed.

Target flow:

- The composer attachment strip "full" state should remain visible, inert, and status-only when the existing image/file limits are reached.
- The "已满" indicator border, surface gradient, text/icon color, and inner ring should use local Gemini-style variables instead of hardcoded old light/dark rgba paint.
- Light, explicit Dark, and Auto dark should share the same variable contract while preserving explicit Light overrides.
- Upload parsing, file/image limits, attachment state, drag/drop behavior, model config, model requests, account/secret/sync, backend/API, production config, deployment config, dependencies, and persisted state must remain unchanged.

Design direction:

- Continue the multimodal polish track after the add-button slice: the full indicator is the adjacent terminal state in the same attachment strip, so it should read as a quiet disabled/status surface rather than a separate legacy tile.
- Light theme defines a soft elevated surface, muted label/icon, subtle border, and inner ring from `--surface-elevated`, `--surface-soft`, `--surface`, `--black`, and `--black-50`.
- Explicit Dark and Auto dark override the same local variables with dark surface/text tokens; Auto dark uses `body:not(.light)` under `prefers-color-scheme: dark` so explicit Light is not overridden.
- This slice intentionally avoids changing React upload handlers, file input behavior, attachment limits, drag/drop logic, network/model behavior, or persisted state.

Scope:

- `app/components/chat.module.scss`: added local attachment full-indicator tone variables; changed base, explicit Dark, and Auto dark rules to consume them; preserved dimensions, `cursor: default`, `pointer-events: none`, status layout, blur, icon sizing, and mobile sizing.
- `test/gemini-visual-migration.test.ts`: strengthened the attachment full-state visual contract to lock Light/Dark/Auto dark token paths, token-consuming selectors, media containment for Auto dark, mobile dimensions, inert/status semantics, upload guard, and absence of legacy target paint in the full-indicator tone scope.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, file helper logic, upload parser, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, send path, model request payload construction, or drag/drop behavior were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="attachment strip full state"` failed first as expected because the new attachment full-indicator tone variables were missing and the old indicator rules still used hardcoded legacy light/dark rgba paint.
- After implementation, the focused attachment full-state visual contract passed.
- Read-only review found one P3 test precision gap: Auto dark was proven after a dark media query but not strictly inside the media block. The test was tightened to read the `@media (prefers-color-scheme: dark)` block first, then assert the Auto dark selector inside that block.
- After the test tightening, the focused attachment full-state visual contract passed again.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- in-app Browser first checked the existing `http://localhost:3000/#/chat` service, but that running Next server stayed on the `home_loading-content` fallback and never exposed target Chat CSS, so it was not used as successful visual evidence.
- A temporary current-repo dev server was started at `http://localhost:3001/#/chat` for QA and stopped before final verification.
- Desktop `1439x1024`: chat mounted with `textareaCount=1`, horizontal overflow `0`, Browser console warn/error logs `0` after the QA start timestamp, and runtime CSSOM loaded full-indicator base variables, border/background/color/inner-ring consumers, explicit Dark selector, Auto dark selector, mobile-size rule, and no legacy target paint in the full-indicator tone scope.
- Mobile `390x844`: same CSSOM, selector, token-consumer, no-legacy-paint, console, and horizontal overflow checks passed.
- Narrow `320x740`: same CSSOM, selector, token-consumer, no-legacy-paint, console, and horizontal overflow checks passed.
- Browser runtime reported `bodyClass=""` and `prefers-color-scheme: light`; Auto dark and explicit Dark paths were validated through source-contract tests and runtime CSSOM selector presence without mutating the user's theme.
- Browser QA intentionally did not open the native file picker, upload a file, create fake attachments, send a message, call a model/API, seed chat history, mutate local storage, or change persisted theme/access state. Full-state rendering, upload guard, and inert semantics are covered by source-contract assertions in the visual migration test.

Review:

- Initial read-only subagent review found no blocking issues and one P3 test precision issue around Auto dark media containment.
- The P3 was fixed by reading the `@media (prefers-color-scheme: dark)` block directly before checking the Auto dark selector.
- Follow-up read-only subagent review confirmed the P3 is resolved and found no new issues.
- Main-thread boundary review verified the current diff remains limited to `chat.module.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `chat.tsx`, `file.ts`, stores, config, API/backend, route constants, deployment files, dependency files, upload parser, send path, model request paths, or account/sync logic.

Known risks:

- The attachment full-indicator tones use modern `color-mix()` CSS, consistent with the surrounding Gemini Web alignment work and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout rather than an actual rendered full-indicator instance, because the indicator only appears when attachment limits are reached and this slice intentionally avoided mutating chat/upload state. Source-contract tests cover the rendered full-state branch, upload guard, and inert status rules directly.

## Iteration 2026-06-21 markdown-code-copy-success-tone

Result: passed.

Target flow:

- Markdown code blocks should keep the existing language label, copy button position, hover/focus/touch visibility, copied icon swap, `aria-live` feedback, code fold controls, and horizontal scroll hints.
- The copy button `data-copy-state="copied"` success border, background, text/icon color, and shadow should use theme variables instead of hardcoded green rgba paint.
- Light, explicit Dark, and Auto dark should share the same `--markdown-code-copy-success-*` contract while preserving explicit theme overrides.
- Copy behavior, clipboard calls, code block parsing, language extraction, artifacts rendering, model config, model requests, account/secret/sync, backend/API, production config, deployment config, dependencies, and persisted state must remain unchanged.

Design direction:

- Continue the AI rendering polish track: code blocks already use Gemini-style language labels, scroll fades, and copy controls; the remaining copied-success state should inherit the same theme token discipline instead of carrying old hardcoded green paint.
- Light theme defines copied success border/background/color/shadow variables from Google-style success green plus existing text/shadow tokens.
- Explicit Dark and Auto dark override the same variables with dark success green; Auto dark uses the existing global `@media (prefers-color-scheme: dark)` + `:root { @include dark; }` path.
- This slice intentionally avoids changing `markdown.tsx`, copy timers, button semantics, keyboard shortcuts, code fold behavior, message rendering, network/model behavior, or persisted state.

Scope:

- `app/styles/globals.scss`: added `--markdown-code-copy-success-*` variables in Light and Dark mixins; changed default and explicit Dark copied-state selectors to consume the variables for border, background, color, and shadow; preserved button size, position, hidden/visible states, hover/focus/touch behavior, transitions, and icon fill.
- `test/gemini-visual-migration.test.ts`: strengthened the Markdown code block chrome contract to lock Light/Dark/Auto dark success variables, copied-state variable consumers, existing aria/status behavior, button sizing, hover/focus/touch behavior, language label, code fold controls, and absence of legacy copied green rgba in the copied tone scope.
- `design-qa.md`: recorded this QA slice and review outcome.
- No `markdown.tsx`, TypeScript component logic, copy/clipboard helper, artifacts rendering, stores, model config, account/secret/sync, backend/API, production config, deployment config, persisted store keys, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="markdown code block chrome"` failed first as expected because the new `--markdown-code-copy-success-*` variables were missing and the copied-state rules still used hardcoded green rgba paint.
- After implementation, the focused Markdown code block chrome contract passed.
- Final verification before commit: `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, `yarn jest test/gemini-visual-migration.test.ts --runInBand`, and `yarn build` passed.

Browser QA:

- A temporary current-repo dev server was started at `http://localhost:3001/#/chat` for QA and stopped before final verification.
- Desktop `1439x1024`: chat mounted with `textareaCount=1`, horizontal overflow `0`, Browser console warn/error logs `0` after the QA start timestamp, and runtime CSSOM loaded Light/Dark copied-success variables, copied-state selector, border/background/color/shadow variable consumers, explicit Dark selector, touch visibility selector, and no legacy copied green rgba in the copied tone scope.
- Mobile `390x844`: same CSSOM, selector, token-consumer, no-legacy-paint, console, and horizontal overflow checks passed.
- Narrow `320x740`: same CSSOM, selector, token-consumer, no-legacy-paint, console, and horizontal overflow checks passed.
- Browser runtime reported `bodyClass=""` and `prefers-color-scheme: light`; Auto dark and explicit Dark paths were validated through source-contract tests and runtime CSSOM selector presence without mutating the user's theme.
- Browser QA intentionally did not send a message, seed a code-block response, click the copy button, read or write clipboard, call a model/API, seed chat history, mutate local storage, or change persisted theme/access state. Copied-state rendering, aria feedback, and copy semantics are covered by source-contract assertions in the visual migration test.

Review:

- Read-only subagent review found no blocking issues.
- The reviewer confirmed Light, explicit Dark, and Auto dark variable chains are complete; default and explicit Dark copied selectors consume the variables; old hardcoded green rgba does not remain in the copied tone blocks; and existing copy logic, aria/status, button sizing, hover/focus/touch visibility, language label, and code fold source contracts remain covered.
- Main-thread boundary review verified the current diff remains limited to `globals.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in `markdown.tsx`, `chat.tsx`, stores, config, API/backend, route constants, deployment files, dependency files, copy helpers, send path, model request paths, or account/sync logic.

Known risks:

- The copied-state variables use modern `color-mix()` CSS, consistent with the surrounding Gemini Web alignment work and the in-app Browser runtime. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA validated loaded CSSOM and shell layout rather than an actual rendered copied-state code block, because creating a code-block response would require seeding chat state or sending content and this slice intentionally avoided mutating message history or clipboard. Source-contract tests cover the rendered copied-state branch, aria feedback, and copy button state rules directly.

## Iteration 2026-06-21 mobile-sidebar-glass-tone

Result: passed.

Target flow:

- The compact/mobile sidebar drawer should read as a translucent Gemini-style glass layer instead of a solid elevated panel.
- Opening the mobile chat-list drawer should preserve drawer width, focus handoff, dialog semantics, backdrop, no-horizontal-overflow behavior, and the existing route/focus interactions.
- Light and explicit Dark style paths should share the same drawer contract: translucent surface, retained blur/saturation, edge definition, and tuned elevation.
- Model config, model requests, account/secret/sync, backend/API, production config, deployment config, dependencies, persisted settings, and sidebar navigation behavior must remain unchanged.

Design direction:

- Continue handoff R5 by softening the mobile drawer surface rather than adding decorative blobs, new imagery, or broad layout changes.
- Light theme uses `rgba(249, 251, 253, 0.78)` over the existing `blur(24px) saturate(185%)`, with a softer outer shadow and a subtle white inset edge to make the drawer feel layered over chat content.
- Dark theme uses `rgba(22, 24, 29, 0.72)`, a low-opacity light border, and a darker elevation with a restrained inset highlight.
- The mobile `max-width: 767px` override keeps dimensions and transitions intact and only mirrors the new elevation, avoiding duplicate background/backdrop/border definitions.

Scope:

- `app/components/home.module.scss`: changed only compact/mobile sidebar drawer light/dark background, dark border, and drawer shadow/inset edge; preserved width, offset, z-index, blur, transition, `@starting-style`, backdrop, focus handling, and route behavior.
- `test/gemini-visual-migration.test.ts`: updated the existing Gemini visual migration contract to require the new translucent light/dark drawer surface, tuned shadow, dark border, and mobile override behavior while continuing to forbid gradient/background-blend additions in the drawer.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, routes, stores, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="Gemini-style empty state"` failed first as expected because `.compact-container .sidebar` still used `background: var(--surface-elevated);` and the old shadow contract.
- After implementation, the focused Gemini visual migration shell contract passed.

Browser QA:

- A temporary current-repo dev server was started at `http://localhost:3001/#/chat` for QA.
- Desktop `1439x1024`: chat mounted, sidebar baseline remained present, horizontal overflow was `0`, and drawer background/backdrop-filter stayed on the desktop sidebar path.
- Mobile `390x844`: the unique `data-mobile-sidebar-trigger` opened the drawer; computed drawer state was `display: flex`, `left: 0px`, `role="dialog"`, `aria-modal="true"`, focus moved to `#mobile-sidebar-drawer`, app body suppression was active, horizontal overflow was `0`, console warn/error logs were `0`, and computed style matched `rgba(249, 251, 253, 0.78)`, `blur(24px) saturate(1.85)`, the tuned border, and the new outer-plus-inset shadow.
- Narrow `320x740`: the drawer opened at `266px` wide, matching `calc(100vw - 54px)`, retained the same glass background/backdrop/shadow contract, and horizontal overflow was `0`.
- Explicit Dark and Auto dark paths were validated by source-contract tests rather than mutating the user's persisted theme.
- Browser screenshot capture failed twice with a local `Page.captureScreenshot` timeout. This slice used DOM, computed style, focus, ARIA, overflow, console, and source-contract evidence instead of screenshot evidence.

Review:

- Read-only subagent review found no blocking issues.
- The reviewer confirmed the current diff only touched `app/components/home.module.scss` and `test/gemini-visual-migration.test.ts`, the test changes matched the SCSS changes, `git diff --check` was clean, and the slice did not touch model config, account/secret/sync, production/deployment config, backend logic, or dependencies.
- Main-thread boundary review verified the current diff remains limited to `home.module.scss`, `gemini-visual-migration.test.ts`, and this QA record, with no diff in TypeScript component logic, stores, config, API/backend, route constants, deployment files, dependency files, send path, model request paths, or account/sync logic.

Known risks:

- Screenshot evidence is missing for this slice because the Browser screenshot API timed out on the local dev page; runtime DOM/CSS evidence and source-contract tests still cover the targeted behavior.
- The visual balance of dark-mode opacity was verified through source contracts, not by changing persisted theme settings in Browser. If a later slice intentionally covers theme switching, add a dedicated dark-mode visual QA pass.

## Iteration 2026-06-21 handoff-coverage-audit-through-5f04abb5

Result: audit complete; one pause-boundary item remains.

Audit scope:

- Reviewed the user-referenced handoff file at `/Users/issaczeng/.gemini/antigravity/brain/ecc9b33a-8613-46cc-b6de-de17c9c31158/handoff.md` against the current `dev` HEAD `5f04abb5` and the commit range after base commit `8b7da1a7e30221c0a1a6ff55a50cadd295624267`.
- Two read-only explorer subagents cross-checked the range: one for R1/R2/R3 and one for R4/R5/R6.
- This is a QA/audit iteration only. It does not change runtime UI, model config semantics, streaming protocol, account/secret/sync, backend/API, production config, deployment config, dependencies, or persisted store keys.

Coverage table:

| Handoff area | Current conclusion | Evidence | Remaining risk |
| --- | --- | --- | --- |
| R1 rainbow shimmer loading and first-token handoff | Completed. The original waiting shimmer exists, and the handoff no longer hard-switches without a reveal layer. | Base `8b7da1a7`, then `19c44289`, `3b3a6901`, `80d7c88e`, `f0627d1b`, `9aefcdcf`, and `fe43edda`; `app/components/chat.tsx` keeps `isWaiting` and `isStreamingReveal`; `app/components/chat.module.scss` keeps `streamingTextReveal`, `streamingShimmerFade`, `streamingSurfaceHandoff`, dark variants, and reduced-motion stop; `test/gemini-visual-migration.test.ts` locks the streaming wait state contract. | Low. Runtime Browser QA does not call a real model/API; the transient first-token state is covered by source/Jest and CSSOM validation. |
| R2 drag/drop and glass dropzone | Completed for the current app architecture. Window-level drag handling, file-only activation, drag counter, chat-viewport glass overlay, live status, limits, and attachment insertion behavior are covered. | `bb30c490`, `b6094f12`, `8518cff9`, `8e103d37`, `16b45183`, `1997fa5d`, `463e74f9`, and `519e794b`; current `chat.tsx` keeps drag counter and `appendAttachments`; current `chat.module.scss` keeps the dropzone overlay surface scoped to the chat root; `test/gemini-visual-migration.test.ts` locks the drag/drop visual and behavior contracts. | Low to medium. The listener is window-level, but the visual overlay is scoped to the chat area rather than the entire browser viewport/sidebar; this matches the current shell but should not be described as full-browser-screen coverage. |
| R3 `@starting-style` motion | Partially completed. Modern CSS entry/exit motion is implemented for menus, popovers, and mobile drawer; old-Safari equivalent fallback is intentionally not implemented. | `afdc9a0a`, plus later keyboard/focus/menu hardening commits such as `a8947361`, `47928847`, `f82c5e87`, `cbc09e8e`, and `5f04abb5`; current `chat.module.scss` and `home.module.scss` keep `@starting-style` plus `transition-behavior: allow-discrete`; `test/gemini-visual-migration.test.ts` locks the current CSS shape. | Medium and paused by scope. Matching the same animation on iOS 16.x/macOS 13-era Safari would require a JS fallback or animation library / broader interaction rewrite, which is a product-direction and dependency/boundary decision. |
| R4 Markdown code/table typography and code chrome | Completed. Handoff's language-label and copy-button overlap risks are covered. | `5e91acff`, `1d9db257`, `b70624f3`, `2d9e4e72`, `989fe4be`, `0d60e2b4`, `62630cca`, `4c59c6dc`, `57a2bb05`; `app/components/markdown.tsx` extracts and renders `.markdown-code-language`; `app/styles/markdown.scss` reserves `padding: 14px 64px 14px 16px` plus labeled top padding; tests lock labels, copy button sizing/position, scroll fades, fold controls, and copied-state feedback. | Low. Extremely narrow widths and custom font scaling may still need future visual tuning, but the handoff defects are closed. |
| R5 glass sidebar and mobile drawer translucency | Completed. Desktop glass, cross-browser scrollbar rules, mobile drawer glass, dark backdrop, focus containment, and app-body suppression are covered through current HEAD. | `9302e519`, `28b7b3e6`, `423a77aa`, `53dba00b`, `b3ddbf3d`, `cc84e6c7`, `5f04abb5`; current `home.module.scss` keeps desktop and mobile translucent glass surfaces; tests lock drawer width, backdrop, z-index, no overflow, and dark/light mobile surface contracts. | Low. Browsers without `backdrop-filter` degrade to weaker translucency; this is a CSS capability fallback, not an unimplemented handoff item. |
| R6 source hygiene and local artifact control | Covered for current known source-control risks, but this audit does not fully prove every original automation/screenshot/commit-management requirement. Internal plans, local QA captures, scratch tests, env files, MCP config, and test results are ignored and not tracked. | `8641a9b8`; `.gitignore` covers `docs/superpowers/plans/`, `capture*.js`, `test-screenshot.js`, `screenshot.spec.js`, `/test-results/`, `PROJECT.md`, `progress.md`, and scratch tests; `.git/info/exclude` keeps `.agents/` and `.codex/` local-only; `git check-ignore` confirms current internal plan and QA artifacts are excluded. | Medium. Source hygiene is covered, but a separate release/process audit would be needed to prove all original R6 validation, screenshot, and per-module commit-management expectations across the whole historical run. |

Review:

- R1/R2/R3 explorer result: R1 and R2 are covered; R3 old-Safari fallback remains a product-decision pause boundary.
- R4/R5/R6 explorer result: R4 and R5 are covered by current source and tests; R6 source hygiene is covered by current ignore rules, while original automation/screenshot/commit-process proof remains outside this narrowed audit.
- Main-thread review confirmed `git log --reverse 8b7da1a7e30221c0a1a6ff55a50cadd295624267..HEAD` contains the expected staged evolution from initial R2-R6 work through later UI polish and the latest `5f04abb5` mobile drawer refinement.

Next iteration guidance:

- Do not implement R3 legacy Safari parity unless product direction accepts JS animation fallback, a new dependency, or a broader menu/drawer animation rewrite.
- Continue non-blocked Gemini UI/UX polish through narrow, test-first slices: streaming/readability details, multimodal tray affordances, Markdown rendering tone consistency, or cross-viewport layout polish.

## Iteration 2026-06-21 message-copy-success-token-unification

Result: passed.

Target flow:

- Ordinary message copy copied-state feedback should share the same success-tone discipline as Markdown code copy feedback.
- Light, explicit Dark, and Auto dark paths should resolve copied feedback through theme tokens instead of component-local hardcoded green rgba paint.
- The existing message action geometry, hover/focus-visible behavior, copied label/status behavior, clipboard payload, copy success gating, stale-request protection, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, persisted store keys, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected: quiet Gemini-style utility surface, local copied feedback, stable action geometry, shared copy-success green, theme-aware values, no hardcoded component paint, no copy behavior change, no layout shift, and no backend/config changes.
- Promote the copied success palette from Markdown-specific variables to shared `--copy-success-*` theme tokens, then keep the existing `--markdown-code-copy-success-*` variables as aliases for Markdown code chrome compatibility.
- Let message action copied-state styling consume local `--message-action-copy-success-*` aliases so future message-action polish can stay scoped without reintroducing raw paint.

Scope:

- `app/styles/globals.scss`: added shared Light/Dark `--copy-success-*` border/background/color/shadow tokens and pointed existing `--markdown-code-copy-success-*` variables at those shared tokens.
- `app/components/chat.module.scss`: changed message action copied-state styling to consume `--message-action-copy-success-background` and `--message-action-copy-success-color`; removed the duplicated explicit Dark hardcoded copied-state rule; after review, kept only `background-color` instead of a `background` shorthand to avoid unstable runtime CSSOM expansion.
- `test/gemini-visual-migration.test.ts`: strengthened the visual migration contract to lock shared Light/Dark copy-success tokens, Markdown aliasing, message action local aliases, copied/hover/focus-visible token consumers, absence of old hardcoded copied green rgba in the message copied tone scope, and absence of the copied-state `background` shorthand.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, copy helper, message rendering structure, clipboard payload selection, copied timers, action labels/status text, stores, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="Gemini-style empty state hooks|markdown code block chrome"` failed first as expected because shared `--copy-success-*` tokens and message action token consumers did not exist yet.
- After implementation, the same focused visual migration contract passed.
- After the read-only review P3 fix removed the copied-state `background` shorthand, the same focused visual migration contract passed again.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001/#/chat` for QA.
- Desktop `1439x1024`: runtime CSSOM loaded shared copy-success globals, Markdown aliases, message action aliases, and message copied-state variable consumers; old hardcoded message copied green paint was absent; copied-state `background` shorthand was absent; chat mounted with `textareaCount=1`, panel `left: 490`, `right: 1250`, textarea `left: 563`, `right: 1137`, horizontal overflow `0`, and Browser console warn/error logs `0`.
- Mobile `390x844`: the same CSSOM/token/no-legacy/no-shorthand checks passed; panel `left: 10`, `right: 380`, textarea `left: 67`, `right: 313`, horizontal overflow `0`, and console warn/error logs `0`.
- Narrow `320x740`: the same CSSOM/token/no-legacy/no-shorthand checks passed; panel `left: 10`, `right: 310`, textarea `left: 67`, `right: 243`, horizontal overflow `0`, and console warn/error logs `0`.
- Browser QA intentionally did not send a message, seed chat history, click copy, read/write clipboard, call a model/API, upload files, mutate local storage, or change persisted theme/access state. Runtime QA validated loaded CSSOM and shell layout; source-contract tests cover the copied-state selectors and token chain directly.

Review:

- Read-only sub-agent review found no Critical, Important, or blocking issues. It confirmed the diff was limited to `app/styles/globals.scss`, `app/components/chat.module.scss`, and `test/gemini-visual-migration.test.ts` before this QA record; light, explicit Dark, and Auto dark token chains were correct; deleting the explicit Dark message rail rule still inherits the correct theme token values; button size, hover/focus-visible structure, focus ring, and copy behavior were unchanged; and no model/config/account/backend/deploy/dependency files were touched.
- A second read-only review found one P3 CSS quality issue: the copied-state `background` shorthand was functionally safe but produced noisy runtime CSSOM expansion with `var()`. This was fixed by keeping only `background-color` and adding a test assertion that forbids the copied-state shorthand.
- Main-thread boundary review verified the final diff remains limited to `app/styles/globals.scss`, `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`, and this QA record, with no diff in TypeScript component logic, stores, config, API/backend, route constants, deployment files, dependency files, copy helpers, send path, model request paths, or account/sync logic.

Known risks:

- This slice uses existing modern `color-mix()` CSS already adopted by the Gemini visual migration work. If old embedded WebView support becomes a product requirement, a dedicated fallback color slice should be planned.
- Browser QA did not mutate chat state to render a real copied message button; the runtime CSSOM and focused source-contract tests cover the target copied-state selectors, and prior message-copy feedback QA covers the actual interaction path.

## Iteration 2026-06-21 multimodal-menu-section-tone

Result: passed.

Target flow:

- Composer tool menu multimodal/session section titles, subtitles, divider, and primary section surface should use local theme tokens rather than raw component paint.
- The tool menu open state should stay visible at runtime even when compiled `@starting-style` CSS appears after the normal open rule.
- Upload/image-generation/session actions, labels, ARIA behavior, keyboard behavior, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet Gemini-style utility surface: local section context, stable menu density, theme-tokenized heading/subheading text, a soft primary surface, and a subtle divider.
- The slice avoids decorative backgrounds, new imagery, layout restructuring, model/menu behavior changes, and dependency changes.

Scope:

- `app/components/chat.module.scss`: added local multimodal section tone tokens on `.chat-input-action-menu`, dark and auto-dark overrides, token consumers for section title/subtitle/divider/primary surface, and a higher-specificity `.chat-input-action-menu.chat-input-action-menu-open` visibility stabilizer.
- `test/gemini-visual-migration.test.ts`: strengthened the Gemini visual migration contract to lock the new light/dark/auto-dark tokens, token consumers, removal of old hardcoded section paint in this scope, and the open-state stabilizer.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, stores, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="Gemini-style empty state hooks"` failed first as expected because the multimodal section tone tokens did not exist yet.
- After token implementation, the same focused contract passed.
- A second RED pass was added for the missing high-specificity open-state stabilizer after Browser QA exposed runtime `opacity: 0`; after the stabilizer, the same focused contract passed again.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001/#/chat`.
- The local access-code screen was handled by intercepting only `/api/access-code` in the Browser QA context and returning `{ ok: true }` for a dummy access code. No real access code, key, account, model/API request, upload, image-generation action, or persisted production config was used.
- Desktop `1439x1024`: tool menu opened with `aria-expanded="true"`, `display: block`, `opacity: 1`, transform resolved to the open matrix, trigger and menu were in viewport, horizontal overflow was `0`, runtime CSSOM contained the multimodal tone tokens and open stabilizer, scoped legacy paint was absent, and console warn/error logs were `0`.
- Mobile `390x844`: menu opened at `left: 10`, `right: 330`, `width: 320`, stayed in viewport, `display: block`, `opacity: 1`, horizontal overflow was `0`, token rules and consumers were loaded, scoped legacy paint was absent, and console warn/error logs were `0`.
- Narrow `320x740`: menu opened at `left: 10`, `right: 282`, `width: 272`, stayed in viewport, `display: block`, `opacity: 1`, horizontal overflow was `0`, token rules and consumers were loaded, scoped legacy paint was absent, and console warn/error logs were `0`.
- Explicit Dark desktop QA: adding `.dark` kept open state visible with the dark title/subtitle/divider/primary token values, no overflow, close returned `display: none` and `opacity: 0`, and console warn/error logs were `0`.
- Auto dark plus `prefers-reduced-motion: reduce` desktop QA: system dark media resolved the dark token values with no theme class, open state remained visible, close returned `display: none` and `opacity: 0`, and console warn/error logs were `0`.
- Mobile close-state QA confirmed the open menu returned to `aria-expanded="false"`, `display: none`, and `opacity: 0`.

Review:

- Read-only sub-agent review found no blocking issues. It confirmed the current diff was limited to `app/components/chat.module.scss` and `test/gemini-visual-migration.test.ts` before this QA record; the open stabilizer has higher specificity than the original open and compiled `@starting-style` rules; closed state does not match the stabilizer; dark/auto-dark token inheritance is valid for the current DOM; and no plan files, internal text, secrets, deployment/production config, model config semantics, backend logic, or dependencies were changed.
- The reviewer noted the string-based test cannot by itself prove runtime CSSOM behavior. Main-thread Browser QA covered that residual risk through computed-style open/close checks in light, explicit Dark, auto dark, reduced-motion, desktop, mobile, and narrow viewports.
- Main-thread boundary review verified the final diff remains limited to `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`, and this QA record, with no diff in TypeScript component logic, stores, config, API/backend, route constants, deployment files, dependency files, upload handlers, image generation handlers, send path, model request paths, or account/sync logic.

Known risks:

- This slice uses existing modern `color-mix()` CSS already adopted by the Gemini visual migration work. If old WebView or legacy Safari color fallback becomes a product requirement, plan a dedicated fallback slice rather than expanding this narrow menu-tone change.
- Browser QA opens and closes the tool menu only. It intentionally does not trigger upload, image generation, session actions, model changes, or real model/API calls.

## Iteration 2026-06-21 tool-menu-active-tone

Result: passed.

Target flow:

- Composer tool menu active actions should share the same local Gemini-style token discipline as the surrounding multimodal menu surface.
- The active action background and foreground should no longer carry the old hardcoded `rgba(25, 103, 210, 0.1)` paint.
- Tool menu structure, upload action, image-generation action, model/menu behavior, ARIA labels, keyboard behavior, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet utility feedback direction: theme-tokenized active state, soft primary surface, stable menu density, no behavior change, and no model/upload semantic change.
- The slice keeps the existing active item geometry and interaction model, and only moves active paint into local menu tokens for Light, explicit Dark, and Auto dark.

Scope:

- `app/components/chat.module.scss`: added `--chat-input-action-active-background` and `--chat-input-action-active-color` to `.chat-input-action-menu`, plus explicit Dark and Auto dark overrides on the menu root; changed `.chat-input-action-active` to consume those tokens.
- `test/gemini-visual-migration.test.ts`: strengthened the existing tool-menu contract to lock Light/Dark/Auto active token values, active token consumers, and absence of old hardcoded active paint in the active tone scope.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, stores, upload handlers, image-generation handlers, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="Gemini-style empty state hooks"` failed first as expected because `--chat-input-action-active-background` was missing from `.chat-input-action-menu`.
- After implementation, the same focused visual migration contract passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001/#/chat`.
- The in-app Browser path was attempted first, but local navigation timed out with the current Browser session. QA then used local Google Chrome headless as a fallback with the same localhost target.
- The local access-code screen was handled by intercepting only `/api/access-code` in the QA browser context and returning `{ ok: true }` for a dummy access code. No real access code, key, account, model/API request, upload, image-generation action, or persisted production config was used.
- Runtime active-state verification added the compiled active CSS class to the image-generation button in the QA DOM only, without clicking the image-generation action or changing app state.
- Desktop `1439x1024` Light: tool menu opened with `aria-expanded="true"`, `display: block`, `opacity: 1`, active class resolved, active background/color came from `--chat-input-action-active-*`, menu stayed in viewport, horizontal overflow was `0`, old active paint was absent from active-scoped CSSOM, and console warn/error logs were `0`.
- Mobile `390x844` Light: menu stayed in viewport at `left: 10`, `right: 330`, active token consumers resolved, horizontal overflow was `0`, old active paint was absent, and console warn/error logs were `0`.
- Narrow `320x740` Light: menu stayed in viewport at `left: 10`, `right: 282`, active token consumers resolved, horizontal overflow was `0`, old active paint was absent, and console warn/error logs were `0`.
- Explicit Dark desktop QA resolved active background to `color-mix(in srgb, rgb(49, 94, 248) 16%, rgb(19, 20, 22))` and active color to `color-mix(in srgb, rgb(49, 94, 248) 78%, rgb(232, 234, 237))`, with no overflow or console warn/error logs.
- Auto dark plus `prefers-reduced-motion: reduce` desktop QA resolved the same dark active token values with no theme class, kept the menu visible, and produced no overflow or console warn/error logs.

Review:

- Read-only sub-agent review found no blocking issues. It confirmed the token scope is correct; Light tokens live on `.chat-input-action-menu`; explicit Dark and Auto dark override the menu root; active rows inherit correctly; closed state, mobile layout, disabled state, and the `@starting-style` open stabilizer are not affected.
- The reviewer noted hover/focus background remains controlled by the existing higher-specificity hover/focus rules, so this slice preserves previous hover/focus behavior while tokenizing the active base state.
- The reviewer also confirmed the tracked diff before this QA record only contained `app/components/chat.module.scss` and `test/gemini-visual-migration.test.ts`, with no backend, config, dependency, deployment, secret, or internal-plan file changes.
- Main-thread Browser QA covered the reviewer's residual risk that source regex tests cannot prove runtime computed style.

Known risks:

- Browser QA validates active visual state by applying the compiled active class in the QA DOM only. It intentionally does not click the image-generation action, enable MCP clients, upload files, mutate app stores, send messages, or call any model/API.
- This slice uses the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallbacks remain a separate product decision.

## Iteration 2026-06-21 prompt-toast-token-surface

Result: passed.

Target flow:

- Context Prompt Toast should read as the same Gemini-style contextual chip across Light, explicit Dark, and Auto dark.
- The toast background, border, text, hover, shadow, and expanded state should no longer carry isolated hardcoded light/dark paint.
- Prompt modal trigger behavior, focus return, ARIA wiring, session context semantics, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet contextual chip direction: theme-tokenized glass surface, soft expanded primary surface, stable pill geometry, no modal behavior change, no model/account/sync changes, no new dependencies, and reduced-motion safe.
- The slice keeps the existing Prompt Toast geometry, blur, focus ring, ellipsis, and reduced-motion contract. Only the visual paint source moves into local tokens inherited by the existing button.

Scope:

- `app/components/chat.module.scss`: added local `--prompt-toast-*` tokens on `.prompt-toast`, moved the inner chip background, text, border, hover, shadow, and expanded state to those tokens, and replaced the old dark inner hardcoded paint with explicit Dark and Auto dark root token overrides.
- `test/gemini-visual-migration.test.ts`: strengthened the existing Prompt Toast contract to lock Light/Dark/Auto dark token declarations, token consumers for base/hover/expanded state, and absence of the old hardcoded toast paint in the scoped toast style surface.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, stores, modal behavior, session context semantics, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="context prompt toast"` failed first as expected because the Prompt Toast root token declarations did not exist yet.
- After implementation, the same focused visual migration contract passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001`.
- In-app Browser was used for this slice. No real access code, key, account, model/API request, upload, image-generation action, persisted production config, store mutation, or QA-only DOM mutation was used.
- Current empty-chat state does not naturally render Prompt Toast because the real condition requires context plus non-bottom scroll. Runtime QA therefore validated the compiled Prompt Toast CSSOM and surrounding chat shell layout without changing app state.
- Desktop `1439x1024` Light: chat region, input panel, textarea, tool button, and send button were visible and inside the viewport; horizontal overflow was `0`; Prompt Toast CSSOM contained the Light token, base consumer, expanded consumer, explicit Dark override, and Auto dark override; old toast paint matches were `0`; console error logs were `0`.
- Mobile `390x844` Light: chat/input controls stayed inside viewport, horizontal overflow was `0`, Prompt Toast token CSSOM checks passed, old toast paint matches were `0`, and console error logs were `0`.
- Narrow `320x740` Light: chat/input controls stayed inside viewport, horizontal overflow was `0`, Prompt Toast token CSSOM checks passed, old toast paint matches were `0`, and console error logs were `0`.

Review:

- Read-only sub-agent review found no blocking issues. It confirmed the diff is limited to `app/components/chat.module.scss` and `test/gemini-visual-migration.test.ts` before this QA record; no TSX, model config, account/secret/sync, production/deployment config, or backend logic was changed.
- The reviewer confirmed Prompt Toast Light, explicit Dark, and Auto dark token scopes are present; hover, focus-visible, `aria-expanded="true"`, and reduced-motion structure were not broken; and the Jest contract covers root tokens, inner token consumers, dark/auto-dark selectors, old hardcoded rgba removal, focus, and reduced-motion.
- The reviewer noted the residual risk that static Jest string checks cannot prove runtime computed style or visual layout. Main-thread Browser QA covered that risk through CSSOM and layout checks on desktop, mobile, and narrow viewports.

Known risks:

- Browser QA validates Prompt Toast through compiled CSSOM because the current empty-chat runtime state does not show the real toast without mutating app/session state. The source-level Jest contract covers structure, ARIA, reduced-motion, and scoped token usage.
- This slice continues the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallback remains a separate product decision.

## Iteration 2026-06-21 clear-context-token-surface

Result: passed.

Target flow:

- Clear-context divider should read as the same Gemini-style reversible status chip across Light, explicit Dark, and Auto dark.
- The chip background, border, text, hover/focus, marker, marker ring, revert affordance, and shadows should no longer carry isolated hardcoded light/dark/primary paint.
- Clear/revert behavior, `clearContextIndex`, scroll reveal, focus ring, ARIA/title text, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet reversible status chip direction: theme-tokenized glass surface, soft primary marker, subtle elevation, stable pill geometry, no clear-context behavior change, no model/account/sync/backend/deploy changes, no new dependencies, and reduced-motion safe.
- The slice keeps the existing compact pill geometry, revert affordance placement, focus ring, scroll margin, mobile/narrow-mobile sizing, and reduced-motion contract. Only the visual paint source moves into local tokens inherited by the existing chip children.

Scope:

- `app/components/chat.module.scss`: added local `--clear-context-*` tokens on `.clear-context`, moved base/hover/focus/mark/revert paint to token consumers, and replaced the old explicit Dark hardcoded paint with explicit Dark and Auto dark root token overrides.
- `test/gemini-visual-migration.test.ts`: strengthened the existing clear-context contract to lock Light/Dark/Auto dark token declarations, base/hover/focus/mark/revert token consumers, focus ring preservation, mobile sizing, reduced-motion, and absence of old hardcoded clear-context paint in the scoped style surface.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, stores, clear/revert behavior, scroll reveal behavior, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="clear-context divider"` failed first as expected because the clear-context root token declarations did not exist yet.
- After implementation, the same focused visual migration contract passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001`.
- In-app Browser was used for this slice. No real access code, key, account, model/API request, upload, image-generation action, persisted production config, store mutation, session mutation, or QA-only DOM mutation was used.
- Current empty-chat state does not naturally render clear-context divider because the real condition requires a clear-context session state. Runtime QA therefore validated the compiled clear-context CSSOM and surrounding chat shell layout without changing app state.
- Desktop `1439x1024` Light: chat region, input panel, textarea, tool button, and send button were visible and inside the viewport; horizontal overflow was `0`; clear-context CSSOM contained the Light token, base consumer, hover consumer, focus ring, marker consumer, revert consumer, explicit Dark override, and Auto dark override; old clear-context paint matches were `0`; console error logs were `0`.
- Mobile `390x844` Light: chat/input controls stayed inside viewport, horizontal overflow was `0`, clear-context token CSSOM checks passed, old clear-context paint matches were `0`, and console error logs were `0`.
- Narrow `320x740` Light: chat/input controls stayed inside viewport, horizontal overflow was `0`, clear-context token CSSOM checks passed, old clear-context paint matches were `0`, and console error logs were `0`.

Review:

- Read-only sub-agent review found no blocking issues. It confirmed the diff is limited to `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`, and this QA record; no TSX behavior, store, model config, account/secret/sync, backend/API, production/deployment config, or dependency changes were found.
- The reviewer confirmed Light base tokens, explicit Dark, Auto dark, base/hover/focus-visible/marker/revert token consumers, focus ring, mobile/narrow sizing, and reduced-motion are preserved, with no clear/revert behavior, scroll reveal, or ARIA changes.
- The reviewer noted the residual risks that Auto dark source checks are string-slice based, the legacy paint blacklist targets exact old values, and Browser QA validates compiled CSSOM rather than a rendered clear-context divider. Main-thread QA accepted those as non-blocking because this slice intentionally avoids session/store mutation.

Known risks:

- Browser QA validates clear-context through compiled CSSOM because the current empty-chat runtime state does not show the real divider without mutating app/session state. The source-level Jest contract covers structure, ARIA, clear/revert source behavior, scroll reveal hooks, focus, mobile sizing, reduced-motion, and scoped token usage.
- This slice continues the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallback remains a separate product decision.
- Read-only exploration identified PromptHints selected/hover/focus tokenization as a strong next low-risk candidate; it was not included in this slice to keep file scope and review surface narrow.

## Iteration 2026-06-21 prompt-hints-selected-tone

Result: passed.

Target flow:

- PromptHints selected, hover, and focus-visible rows should read as the same Gemini-style suggestion state across Light, explicit Dark, and Auto dark.
- The selected row paint should use local primary/surface tokens instead of isolated hardcoded Google-blue rgba values.
- Prompt search, prompt selection, keyboard navigation, prompt-store semantics, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet suggestion row direction: theme-tokenized primary wash, stable listbox density, class plus ARIA selected-state coverage, no keyboard behavior change, no model/account/sync/backend/deploy changes, no new dependencies, and reduced-motion safe.
- The slice keeps the existing listbox geometry, scroll behavior, item density, single-line truncation, role/ARIA wiring, and mobile max-height contract. Only the selected/hover/focus paint source moves into inherited local tokens.

Scope:

- `app/components/chat.module.scss`: added local `--prompt-hint-selected-*` tokens on `.prompt-hints`, moved selected/hover/focus-visible paint to token consumers, tightened selected styling to `&.prompt-hint-selected` plus `&[aria-selected="true"]`, and added explicit Dark plus Auto dark token overrides.
- `test/gemini-visual-migration.test.ts`: strengthened the PromptHints contract to lock Light/Dark/Auto dark token declarations, class plus ARIA selected consumers, mobile max-height preservation, and absence of the old hardcoded selected paint in the scoped PromptHints style surface.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, stores, prompt search/selection behavior, keyboard navigation behavior, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="Gemini-style empty state hooks"` failed first as expected because the PromptHints root token declarations and stronger selected-state selector did not exist yet.
- After implementation, the same focused visual migration contract passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001`.
- In-app Browser was used for this slice. The local `启用快捷指令功能` setting was temporarily enabled only to expose the real PromptHints UI and restored to `false` after QA. No real access code, key, account, model/API request, upload, image-generation action, persisted production config, backend config, dependency, send action, or model request was used.
- Desktop `1439x1024` Light: typing `/` exposed the real `#chat-prompt-hints` listbox, textarea `aria-controls` pointed to the listbox, `aria-activedescendant` updated after `ArrowDown`, 407 options rendered, selected row carried both base and selected classes, listbox stayed in viewport, and horizontal/vertical overflow was `false`.
- Mobile `390x844` Light: typing `/` exposed the listbox with `role="listbox"`, selected row had `aria-selected="true"`, CSSOM contained the stronger class plus ARIA selected selector, max-height resolved to `320px`, and horizontal/vertical overflow was `false`.
- Narrow `320x740` Light: listbox width resolved to `300px` at `x: 10`, max-height resolved to `320px`, selected class/ARIA state and token variables were present, and horizontal/vertical overflow was `false`.
- Explicit Dark and Auto dark CSSOM checks both contained the PromptHints selected token override with `var(--primary) 16%` mixed into `var(--surface)`.

Review:

- Two read-only sub-agent reviews found no blocking issues. They confirmed the diff is limited to `app/components/chat.module.scss`, `test/gemini-visual-migration.test.ts`, and this QA record; no TSX behavior, store, model config, account/secret/sync, backend/API, production/deployment config, dependency, send-path, or internal-plan changes were found.
- The reviewers confirmed `&.prompt-hint-selected` compiles to the expected scoped base-plus-selected CSS Modules selector, `&[aria-selected="true"]` safely covers the same option element, and neither branch breaks hover/focus-visible styling.
- The reviewers also confirmed Light, explicit Dark, Auto dark, old hardcoded selected paint removal, and mobile max-height are covered by the visual migration contract. One residual source-test gap around Auto dark border/ring was addressed by strengthening the Jest assertions before final verification.

Known risks:

- The in-app Browser screenshot API timed out on this dev page, so this slice records DOM, ARIA, layout, and CSSOM evidence rather than screenshot pixels.
- Dynamic hover/selected computedStyle from the in-app Browser was inconsistent after keyboard navigation, so the implementation was tightened to class plus ARIA selected selectors and covered by source-level Jest plus compiled CSSOM checks.
- This slice continues the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallback remains a separate product decision.

## Iteration 2026-06-21 update-announcement-surface-tone

Result: passed.

Target flow:

- Update announcement modal should read as a Gemini-style release-note surface across Light, explicit Dark, Auto dark, desktop, mobile, and narrow mobile.
- Section pills, modal scrim, panel border/shadow, bullets, and note text should consume local theme tokens instead of isolated hardcoded rgba paint.
- Seen-key composition, localStorage read/write, dismiss behavior, dialog/ARIA structure, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet release-note modal: tokenized section pills, soft modal scrim, elevated surface panel, mobile bottom-sheet safe area, reduced-motion safe, and no storage/config behavior change.
- The slice keeps the existing dialog copy, confirm action, component structure, desktop dimensions, mobile bottom-sheet layout, and safe-area contract. Only local color/shadow sources move to theme-aware tokens.

Scope:

- `app/components/update-announcement.module.scss`: added local `--update-announcement-*` tokens on `.mask`, moved scrim/panel/section/bullet/note paint to token consumers, replaced old local hardcoded blue/black rgba values, added explicit Dark plus Auto dark token overrides, and after review corrected scrim/shadow/border ink tokens so Dark does not inherit the theme-reversed `--black` / `--white` semantics.
- `test/gemini-visual-migration.test.ts`: added a focused update-announcement visual migration contract locking storage/dismiss source behavior, dialog/ARIA structure, Light/Dark/Auto dark token declarations, token consumers, old hardcoded paint removal, mobile bottom-sheet safe-area sizing, and the corrected physical scrim/shadow/border ink contract for Dark mode.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, stores, update announcement public config semantics, localStorage key format/value semantics, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="update announcement modal"` failed first as expected because the modal still used old hardcoded local rgba paint and lacked update-announcement root token declarations.
- After read-only review found the Dark scrim/shadow/border tokens were incorrectly locked to theme-reversed `--black` / `--white`, the same focused test failed again against the bad contract, then passed after introducing local physical ink tokens.
- After implementation, the same focused visual migration contract passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001`.
- In-app Browser was used for this slice. No real access code, key, account, model/API request, upload, image-generation action, persisted production config, store mutation, session mutation, or QA-only DOM mutation was used.
- Current local runtime does not naturally render an update announcement modal without public server config. Browser QA therefore validated the compiled update-announcement CSSOM and surrounding chat shell layout without changing app config or localStorage.
- Desktop `1439x1024` Light: chat shell, model button, textarea, and send button stayed inside viewport; horizontal overflow was `0`; scoped update-announcement CSSOM contained Light root tokens, panel/section/bullet/note consumers, explicit Dark override, Auto dark override, mobile safe-area rule, corrected physical shadow/border ink tokens, no bad Dark `var(--black)` / `var(--white)` scrim/border lock, and no old local update-announcement rgba paint; console error logs were `0`.
- Mobile `390x844` Light: new chat button, textarea, and send button stayed inside viewport; horizontal overflow was `0`; scoped update-announcement CSSOM contained mobile mask height, panel width, safe-area max-height, confirm full-width rule, corrected physical shadow/border ink tokens, no bad Dark token lock, and no old local update-announcement rgba paint; console error logs were `0`.
- Narrow `320x740` Light: new chat button, textarea, and send button stayed inside viewport; horizontal overflow was `0`; scoped update-announcement CSSOM contained Light, explicit Dark, Auto dark, mobile safe-area, corrected physical shadow/border ink tokens, bad Dark token removal, and old-paint removal checks; console error logs were `0`.

Review:

- Initial read-only sub-agent review found two blocking issues: the Dark scrim/shadow tokens incorrectly used theme-reversed `--black`, and the Dark border token incorrectly used theme-reversed `--white`.
- Main-thread fix replaced those with local physical `--update-announcement-shadow-ink` and `--update-announcement-panel-border-ink` tokens, updated the test contract, and reran focused Jest plus Browser QA.

Known risks:

- Browser QA validates the update announcement modal through compiled CSSOM because the real modal requires public server config to render; the source-level Jest contract covers component structure, storage behavior, token usage, old paint removal, and mobile sizing.
- This slice continues the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallback remains a separate product decision.

## Iteration 2026-06-21 shared-ui-lib-surface-tone

Result: passed.

Target flow:

- Shared ui-lib card, popover mask, list, modal, toast, text input, select, modal input, and selector surfaces should read as the same Gemini-style elevated UI chrome across Light, explicit Dark, Auto dark, desktop, mobile, and narrow mobile.
- Overlay scrims, panel borders, panel shadows, toast glass, input focus, and selected-dot affordance should consume local theme tokens instead of isolated hardcoded white/black/rgba paint.
- Modal keyboard handling, selector search/selection behavior, toast actions, form values, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet shared modal/selector surface direction: tokenized overlay scrim, elevated selector panel, soft toast pill, Dark/Auto dark safety, mobile bottom-sheet safety, and no behavior/config/backend changes.
- The slice keeps existing component structure, ARIA labels, keyboard handlers, selector selection callbacks, modal action callbacks, toast pointer-event behavior, desktop sizing, and mobile modal sizing. Only shared surface paint sources move to local tokens.

Scope:

- `app/components/ui-lib.module.scss`: added local `--ui-lib-*` tokens for shared elevated surfaces, replaced old hardcoded white/rgba/shadow paint in shared surfaces, added explicit Dark plus Auto dark token overrides, added selector overlay blur, added selected-dot ring, and made selector content bottom-sheet safe on mobile.
- `test/gemini-visual-migration.test.ts`: added a focused shared ui-lib contract locking Modal/Selector/Toast source structure, Light/Dark/Auto dark token declarations, token consumers, mobile selector sizing, focus ring preservation, and absence of old hardcoded shared-surface paint in the scoped style surface.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component logic, stores, selector/model behavior, modal/toast behavior, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="shared ui-lib modal selector"` failed first as expected because the shared ui-lib root token declarations did not exist yet.
- After implementation and test-scope correction for nested selector/mobile blocks, the same focused visual migration contract passed.
- `git diff --check` passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001`.
- In-app Browser was used for this slice. No real access code, key, account, model/API request, upload, image-generation action, persisted production config, backend config, dependency, send action, model request, or model/config selection mutation was used. The local UI theme was temporarily changed through the real Settings Theme select for computed-style QA and restored to its original `auto` value.
- Desktop `1439x1024` current Auto runtime: app shell completed load, chat controls were visible, horizontal overflow was `0`, compiled CSSOM contained shared ui-lib Light tokens, explicit Dark override, Auto dark override, mobile selector bottom-sheet rule, old shared white/rgba paint was absent in the ui-lib token scope, and console error logs were `0`.
- Mobile `390x844` current Auto runtime: app shell completed load, new-chat/model/textarea/settings controls stayed inside viewport, horizontal overflow was `0`, shared ui-lib token CSSOM checks passed, mobile selector bottom-sheet rule was present, and console error logs were `0`.
- Narrow `320x740` current Auto runtime: app shell completed load, visible controls stayed inside viewport, horizontal overflow was `0`, shared ui-lib token CSSOM checks passed, old shared paint was absent in the ui-lib token scope, and console error logs were `0`.
- Live Settings surface check opened Settings, confirmed visible `ui-lib` input/select/list controls resolve to tokenized elevated surface paint in explicit Light (`body.light`, `--theme: light`), explicit Dark (`body.dark`, `--theme: dark`), and Auto dark (`body` without light/dark class, `--theme: dark` from current system preference). The original theme value was restored to `auto`; console error logs were `0`.
- Model selector interaction was probed but did not expose this shared `Selector` surface in the current runtime state, so it was not used as blocking evidence.

Review:

- Read-only sub-agent review found no blocking issues. It confirmed the diff is limited to `app/components/ui-lib.module.scss`, `test/gemini-visual-migration.test.ts`, and this QA record; no TSX behavior, store, model config, account/secret/sync, backend/API, production/deployment config, dependency, send-path, or internal-plan changes were found.
- The reviewer noted that Browser QA originally proved Light/current layout and CSSOM but not Dark/Auto dark computed styles. Main-thread follow-up QA addressed this with explicit Light, explicit Dark, and Auto dark computed-style checks on live Settings `ui-lib` input/select/list controls.
- The reviewer also noted the source-level Jest contract is not a render-level Modal/Selector behavior test. This is accepted for the slice because no TSX behavior changed; the QA wording was corrected to describe source structure and visual-style coverage rather than full behavior coverage.

Known risks:

- Browser QA validates selector bottom-sheet rules through compiled CSSOM because the current model selector entry does not expose the shared `Selector` component in this runtime state. Source-level Jest covers the shared `Selector` source structure and style contract, not a full rendered selection/close/search behavior test.
- This slice continues the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallback remains a separate product decision.

## Iteration 2026-06-21 shared-icon-button-surface-tone

Result: passed.

Target flow:

- Shared `IconButton` primary, danger, hover, and focus-visible states should read as one Gemini-style utility-control language across Light, explicit Dark, Auto dark, desktop, and mobile.
- Primary action, destructive action, quiet hover, border hover, and focus affordances should consume local theme tokens instead of isolated hardcoded red, white, or blue rgba paint.
- Button DOM structure, click/disabled/ARIA behavior, mobile sidebar trigger, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet shared utility-control direction: tokenized default foreground, primary solid action, soft destructive state, hover border tied to `--primary`, explicit Dark/Auto dark safety, and no behavior/config/backend change.
- The slice keeps the existing `IconButton` component API, class composition, accessible labels, click handlers, disabled handling, layout dimensions, and mobile padding. Only shared state paint sources move to local SCSS tokens.

Scope:

- `app/components/button.module.scss`: added local `--icon-button-*` tokens, replaced old hardcoded red/white/blue hover paint, added explicit Dark plus Auto dark token overrides, and kept `focus-visible` on the existing app focus ring.
- `test/gemini-visual-migration.test.ts`: added a focused visual migration contract locking `IconButton` source behavior hooks, Light/Dark/Auto dark token declarations, token consumers, focus ring preservation, old paint removal, and Auto dark parity for hover/danger tokens.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TypeScript component behavior, stores, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="shared IconButton states"` failed first as expected because shared `IconButton` still used old hardcoded color paint and lacked root state tokens.
- After implementation, the same focused visual migration contract passed.
- After read-only review noted Auto dark parity was weaker than explicit Dark coverage, the test contract was strengthened for Auto dark hover/danger tokens and the same focused test passed again.
- `git diff --check` passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001`.
- In-app Browser was used for this slice. No real access code, key, account, model/API request, upload, image-generation action, persisted production config, backend config, dependency, send action, model request, or model/config selection mutation was used.
- Desktop default runtime `1280x720`: chat shell loaded at `/`, 6 shared `IconButton` instances were present, send primary button stayed disabled, all visible sampled controls resolved the new token values, and console error logs were `0`.
- Settings route `#/settings`: 9 shared `IconButton` instances were present; the two danger buttons `立即重置` and `立即清除` were visible, used the new danger background/border/color tokens, kept normal dimensions, and were not clicked.
- Mobile `390x844`: Settings and chat views had no horizontal overflow; mobile chat showed a visible 40px shared settings button with the new token values; console error logs were `0`. The temporary viewport override was reset after QA.

Review:

- Read-only sub-agent review found no blocking issues. It confirmed the diff is limited to `app/components/button.module.scss`, `test/gemini-visual-migration.test.ts`, and this QA record; no TSX behavior, store, model config, account/secret/sync, backend/API, production/deployment config, dependency, send-path, or internal-plan changes were found.
- The reviewer confirmed `danger:hover` remains more specific than general hover, `:global(.dark) .icon-button` and Auto dark media selectors match the repository's theme pattern, and the migration preserves existing `IconButton` semantics.
- The only non-blocking review note was weaker Auto dark parity coverage in the new test. This was addressed by adding Auto dark assertions for hover border, danger color, danger border, danger hover background, and danger hover border.

Known risks:

- Browser QA used DOM/CSSOM/computed-style evidence rather than screenshot pixels.
- Settings danger controls were inspected but not clicked to avoid destructive reset/clear paths.
- This slice continues the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallback remains a separate product decision.

## Iteration 2026-06-21 mcp-market-status-tone

Result: passed.

Target flow:

- MCP market server and operation status badges should use the same Gemini-style utility status language as the rest of the UI: soft semantic ink, subtle borders, quiet fills, and readable text across Light, explicit Dark, and Auto dark.
- MCP config modal add-path primary actions should use local tokens instead of hardcoded `white` text and an undefined `--primary-dark` hover token.
- MCP controller behavior, MCP add/start/stop/restart/configure/tools actions, config form value updates, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected quiet status badges: softer semantic backgrounds, readable text, pill radius, local tokens, Dark/Auto dark safety, and no MCP mutation.
- The slice keeps the existing page structure, server sorting, operation status strings, action handlers, config form handlers, and modal behavior. Only MCP market SCSS paint sources move to local status/action tokens.

Scope:

- `app/components/mcp-market.module.scss`: added local `--mcp-market-*` status/action tokens, replaced old hardcoded green/red/yellow/gray status fills, replaced config add-path `white`/`--primary-dark`, and added explicit Dark plus Auto dark badge overrides with high-specificity selectors that beat the nested base badge rules.
- `test/gemini-visual-migration.test.ts`: added a focused MCP market contract locking React behavior entry points, Light/Dark/Auto dark status token declarations, status-specific ink mappings, add-path token consumers, high-specificity dark selectors, and old hardcoded status paint removal.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TSX behavior, MCP controller/helper behavior, store logic, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="MCP market status controls"` failed first as expected because MCP market status badges lacked local status tokens and still used old hardcoded status colors.
- After implementation, the same focused contract passed.
- Browser computed-style QA found a real CSS variable cascade issue: a status badge could override `--mcp-market-status-ink` while inherited derived background/border/color tokens still resolved from the root running ink. The fix moved derived status tokens onto the badge elements and added a root default ink.
- Read-only review then found a blocking Dark/Auto dark specificity issue: low-specificity dark status selectors could not beat the nested base badge token declarations. The test was tightened to require the full high-specificity selector, failed first as expected, then passed after fixing the selectors.
- `git diff --check` passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001`.
- In-app Browser was used for this slice. No real access code, key, account, model/API request, upload, image-generation action, persisted production config, backend config, dependency, send action, model request, MCP start/stop/add/restart/configure action, or model/config selection mutation was used.
- Initial desktop `1280x720` direct route `#/mcp-market`: MCP market rendered 16 server items, one visible `Stopped` status badge, add buttons, and no horizontal overflow or console error logs. This pass surfaced the inherited-token bug described above.
- After the CSS fixes, reloading the local app triggered the app's access-code gate. The Browser pass stopped at the password screen; no access code was entered and no auth/config bypass was attempted. Post-fix runtime computed-style evidence is therefore limited by local auth state, while source-level Jest and read-only review cover the corrected cascade contract.

Review:

- First read-only sub-agent review found one blocking issue: explicit Dark and Auto dark status overrides were lower specificity than the nested base `.operation-status` / `.server-status` rules, so they would not override the badge-derived tokens.
- Main-thread fix replaced those selectors with full-path status selectors covering `.mcp-market-page-body`, `.mcp-market-item`, and for server status `.mcp-market-header .mcp-market-name`, then strengthened the test to fail on the low-specificity form.
- Second read-only sub-agent review found no blocking or non-blocking issues. It confirmed the high-specificity Dark/Auto dark selectors beat the base rules, status ink mappings are complete, old hardcoded status colors are removed from the target scope, and behavior entry points remain unchanged.

Known risks:

- Post-fix live Browser computed-style verification for MCP market was blocked by the local access-code gate after reload. The slice does not enter credentials or change auth/config to bypass that gate.
- Browser QA did not click Add, Start, Stop, Restart, Configure, Save, or Tools because those are MCP/config side-effect paths.
- This slice continues the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallback remains a separate product decision.

## Iteration 2026-06-21 mcp-market-form-surface-tone

Result: passed.

Target flow:

- MCP market config forms, array/path inputs, add/browse/delete controls, tool descriptions, and list subtitles should use the same Gemini-style elevated form surface language as the rest of the app.
- Form surfaces, soft input fills, hover borders, focus rings, placeholders, descriptions, and destructive hover states should consume local MCP market form tokens instead of undefined `--gray-*`, `--primary-10`, or `--danger` tokens.
- MCP controller behavior, MCP add/start/stop/restart/configure/tools actions, config form value updates, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet utility-form direction: elevated panel surface, subtle soft input wells, primary hover/focus affordance, restrained destructive hover, explicit Dark/Auto dark safety, and no MCP mutation.
- No generated raster design was used for this slice because it is a small UI-system repair inside the existing design language. The design spec is the local token contract in `mcp-market.module.scss` plus this QA record.

Scope:

- `app/components/mcp-market.module.scss`: added local `--mcp-market-form-*` tokens, replaced form/control references to undefined gray/focus/danger tokens, aligned description text with a local description color, and added explicit Dark plus Auto dark token overrides.
- `test/gemini-visual-migration.test.ts`: added a focused MCP market form contract locking behavior entry points, Light/Dark/Auto dark token declarations, form/input/control token consumers, placeholder/description/danger hover coverage, and old undefined token removal from the scoped form surface.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TSX behavior, MCP controller/helper behavior, store logic, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="MCP market form controls"` failed first as expected because the MCP market form tokens did not exist and the form controls still referenced old tokens.
- After implementation, the same focused contract passed.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="MCP market"` passed.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` passed.
- `yarn lint` passed.
- `npx tsc --noEmit --pretty false` passed.
- `yarn build` passed with the existing Next warning that Edge runtime disables static generation for that page.
- `git diff --check` passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001`.
- In-app Browser was used for this slice. No real access code, key, account, model/API request, upload, image-generation action, persisted production config, backend config, dependency, send action, model request, MCP start/stop/add/restart/configure/save/tools action, or model/config selection mutation was used.
- The existing `http://localhost:3000` listener returned a stale Next Server Error from `.next/server/webpack-runtime.js`, so it was not used as valid QA evidence.
- `http://localhost:3001` responded successfully after initial compilation. Direct Browser navigation to `#/mcp-market` then stopped at the local access-code gate: `需要密码`, `管理员开启了密码验证，请在下方填入访问码`, `确认`.
- No access code was entered and no auth/config bypass was attempted. Runtime computed-style evidence for the MCP market form surface is therefore blocked by local auth state; source-level Jest, lint, typecheck, build, diff check, and read-only review cover the corrected style contract.

Review:

- Read-only sub-agent review found one scope note: `design-qa.md` is an additional changed file beyond the SCSS and test files. This is intentionally included because each small iteration requires a QA/review record.
- The same review found no blocking code issues. It confirmed no TSX behavior, store, model config, account/secret/sync, backend/API, production/deployment config, dependency, send-path, or internal-plan changes were found.
- The reviewer confirmed no target undefined form tokens remain in the scoped MCP market form surface and the Dark/Auto dark form token overrides use the repository's theme variable semantics.

Known risks:

- Live Browser computed-style verification for MCP market form controls is blocked by the local access-code gate. The slice does not enter credentials or change auth/config to bypass that gate.
- Browser QA did not click Add, Start, Stop, Restart, Configure, Save, or Tools because those are MCP/config side-effect paths.
- This slice continues the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallback remains a separate product decision.

## Iteration 2026-06-21 mcp-market-list-surface-tone

Result: passed.

Target flow:

- MCP market outer search, list, server cards, tags, empty/loading containers, loading shimmer, and modal list surfaces should read as one Gemini-style utility-card language across Light, explicit Dark, and Auto dark.
- Card/list surfaces, subtle borders, muted descriptions, tag chips, search focus, and loading shine should consume local MCP market tokens instead of old white card backgrounds, gray tag fills, generic `border-in-light` list/card borders, or hardcoded white shimmer paint.
- MCP controller behavior, search filtering/sorting, add/configure/pause/restart/tools actions, config form updates, model config semantics, account/secret/sync, backend/API, production config, deployment config, dependencies, send path, and model request payload construction must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet utility-card direction: elevated list cards, 8px card radius, pill search, subdued tag chips, muted descriptions, Dark/Auto dark safety, and no MCP mutation.
- No generated raster design was used for this slice because it is a small UI-system repair inside the existing design language. The design spec is the local token contract in `mcp-market.module.scss` plus this QA record.

Scope:

- `app/components/mcp-market.module.scss`: added local `--mcp-market-card-*`, `--mcp-market-tag-*`, `--mcp-market-muted-color`, and `--mcp-market-loading-shine-color` tokens; applied them to empty/loading containers, search bar, server list gap, server cards, tags, descriptions, loading shimmer, and modal list surfaces; added explicit Dark plus Auto dark token overrides.
- `test/gemini-visual-migration.test.ts`: added a focused MCP market list-surface contract locking behavior entry points, Light/Dark/Auto dark token declarations, search/card/tag/list token consumers, loading shimmer token use, and removal of old target paint in the scoped list/card surface.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TSX behavior, MCP controller/helper behavior, store logic, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, or model request payload construction were changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="MCP market list surfaces"` failed first as expected because the MCP market list/card tokens did not exist and the list/card surfaces still used old paint.
- After implementation, the same focused contract passed.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="MCP market"` passed.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` passed.
- `yarn lint` passed.
- `npx tsc --noEmit --pretty false` passed.
- `yarn build` passed with the existing Next warning that Edge runtime disables static generation for that page.
- `git diff --check` passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001`.
- In-app Browser was used for this slice. No real access code, key, account, model/API request, upload, image-generation action, persisted production config, backend config, dependency, send action, model request, MCP start/stop/add/restart/configure/save/tools action, or model/config selection mutation was used.
- `http://localhost:3001` reached the app shell. Direct Browser navigation to `#/mcp-market` stopped at the local access-code gate: `需要密码`, `管理员开启了密码验证，请在下方填入访问码`, `确认`.
- No access code was entered and no auth/config bypass was attempted. Runtime computed-style evidence for the MCP market list/card surface is therefore blocked by local auth state; source-level Jest, lint, typecheck, build, diff check, and read-only review cover the corrected style contract.

Review:

- Read-only sub-agent review found no blocking issues. It confirmed the pre-QA diff was limited to `app/components/mcp-market.module.scss` and `test/gemini-visual-migration.test.ts`; this QA record is intentionally added afterward because each small iteration requires a review/QA comment.
- The reviewer confirmed no TSX runtime behavior changed, existing search/list callbacks remain in `mcp-market.tsx` and `server-list.tsx`, Dark/Auto dark selectors are aligned with the repository pattern, and target old paint is removed from the list/search/card/tag/empty/loading scope.
- The reviewer noted the new test is a source-level visual guard and intentionally sensitive to token percentages and SCSS formatting, consistent with the existing Gemini visual migration test style. It is not a substitute for behavioral tests if search/filter logic changes later.

Known risks:

- Live Browser computed-style verification for MCP market list/card controls is blocked by the local access-code gate. The slice does not enter credentials or change auth/config to bypass that gate.
- Browser QA did not click Add, Start, Stop, Restart, Configure, Save, or Tools because those are MCP/config side-effect paths.
- This slice continues the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallback remains a separate product decision.

## Iteration 2026-06-21 settings-prompt-surface-tone

Result: passed.

Target flow:

- Settings prompt management modal search, prompt list, row dividers, hover state, title/content text, and focus affordance should read as one Gemini-style quiet utility surface across Light, explicit Dark, and Auto dark.
- Prompt search/list surfaces should consume local `--settings-prompt-*` tokens instead of raw `var(--gray)`, generic `var(--border-in-light)`, or the old 10px list radius.
- Settings page structure, prompt search/filter logic, add/edit/remove/copy callbacks, model config semantics, account/secret/sync/backend/deploy behavior, dependencies, send path, and production config must remain unchanged.

Design direction:

- Creative Production style intake selected a quiet utility-modal direction: 8px prompt list radius, elevated neutral search well, subtle tokenized dividers, soft primary hover/focus, muted content text, Dark/Auto dark safety, and no prompt-store or Settings behavior change.
- No generated raster design was used because this is a small UI-system repair inside the existing Gemini migration language. The design spec is the local token contract in `settings.module.scss` plus this QA record.

Scope:

- `app/components/settings.module.scss`: added local `--settings-prompt-*` tokens scoped to `.user-prompt-modal`, replaced prompt search/list legacy paint with tokenized surface, border, hover, divider, focus, title, and muted-content styles, and added explicit Dark plus Auto dark token overrides.
- `test/gemini-visual-migration.test.ts`: added a focused Settings prompt-management contract locking prompt modal behavior entry points, Light/Dark/Auto dark token declarations, search/list/item token consumers, old target paint removal, and the narrowed modal-only scope.
- `design-qa.md`: recorded this QA slice and review outcome.
- No TSX behavior, store logic, model config, account/secret/sync, backend/API, production config, deployment config, dependency files, deploy files, send path, model request payload construction, or Settings page-level layout/background contract was changed.

Automated checks:

- `yarn jest test/gemini-visual-migration.test.ts --runInBand --testNamePattern="Settings prompt management"` failed first as expected because `.settings` / `.user-prompt-modal` had no local prompt surface tokens and the prompt search/list still used legacy paint.
- After implementation and test-scope correction, the same focused contract passed.
- After read-only review found the first patch overreached by tokenizing `.settings` page background, the scope was narrowed to `.user-prompt-modal`; the focused contract passed again.
- `yarn jest test/gemini-visual-migration.test.ts --runInBand` passed.
- `yarn lint` passed.
- `npx tsc --noEmit --pretty false` passed.
- `yarn build` passed with the existing Next warning that Edge runtime disables static generation for that page.
- `git diff --check` passed.

Browser QA:

- A temporary current-repo dev server was used at `http://localhost:3001`.
- In-app Browser was used for this slice. No real access code, key, account, model/API request, upload, image-generation action, persisted production config, backend config, dependency, send action, model request, prompt add/edit/remove/copy action, Settings change, sync/import/export/reset/clear action, or model/config selection mutation was used.
- The first Browser run hit the local access-code gate on `http://localhost:3001/#/settings`, so the prompt modal itself could not be opened without credentials.
- Running `yarn build` while the dev server was alive caused a temporary dev-server `.next` runtime error/blank-shell state; the dev server was stopped and restarted before final Browser status collection.
- Fresh post-restart Browser check at `http://localhost:3001/#/settings` showed the access-code gate text `需要密码`, `管理员开启了密码验证，请在下方填入访问码`, `确认`; framework overlay was absent, console warn/error logs were `0`, and horizontal overflow was `0`.

Review:

- Read-only sub-agent review first found one Important issue: the initial diff also added `.settings` page-level background/token contracts, which exceeded the intended prompt-modal-only scope.
- Main-thread fix removed all `.settings` root prompt/background token contracts and updated the Jest contract to cover only `.user-prompt-modal` and its children.
- Follow-up checks confirmed the revised diff stays limited to the prompt-management modal style surface and visual test contract, with no TSX/runtime behavior changes.

Known risks:

- Live Browser computed-style verification for the prompt modal is blocked by the local access-code gate. The slice does not enter credentials or change auth/config to bypass that gate.
- Prompt add/edit/remove/copy controls were not clicked because they mutate prompt data or clipboard state.
- This slice continues the existing modern `color-mix()` CSS path already present in the Gemini visual migration work. Legacy browser color fallback remains a separate product decision.
