# 2026-07-12 Chat / Image New-Chat Home

## Scope

- Frontend, model-selection state, i18n, responsive UI, and accessibility slice.
- Add `Chat / Image` (`聊天 / 生图`) tabs only to the empty new-chat surface.
- Default the new-chat home to an available OpenAI GPT-5.x model; Chat exposes only the reasoning-effort control in the composer.
- Entering Image selects the preferred available OpenAI `gpt-image-x` model, hides model copy from the composer, collapses double-auto to one summary, and renders only real size/quality capabilities with the same discrete rail language.
- Existing GPT-5.x and image conversations open the current parameter rail first; Back remains the explicit route to model selection.
- Preserve existing message sessions, model/provider request contracts, admin locks, conversation override metadata, image defaults, plugin cleanup, persistence boundaries, and Jimeng/MCP behavior.

## Result

- The active tab is projected from the real session model/provider. No parallel UI-only mode or persisted field was introduced.
- New empty sessions normalize unsupported/non-GPT defaults to the preferred available GPT-5.x model after the available-model list is ready. Administrator-locked models are not overridden.
- Chat mode directly opens the existing reasoning rail and removes model copy from the composer trigger.
- Image mode prefers the available `gpt-image-2` and opens directly into size/quality rails. Its composer summary is `Auto / 自动` when both real values are auto, and does not display the model name on the empty surface.
- Existing conversations derive their initial selector page from the current model/provider. GPT-5.x enters reasoning, supported OpenAI/Azure image configs enter image options, and ordinary models enter the model list. Back returns to the model list without rewriting the current session.
- The old image size/quality accordion/listbox implementation is removed; image and reasoning use the same generic discrete rail. Image passes `emphasizeHighest={false}` because size/quality are categories, not a strength scale.
- Rail stops are visually reduced from `5px` and `74/78%` opacity to `4px` and `30/34%`, leaving the thumb and selected fill as the dominant state cues.
- `ReasoningEffortRail` now wraps a generic `DiscreteOptionRail`; reasoning keeps canonical policy behavior, while image size and quality keep their caller-defined option order.
- Tabs, rail labels/descriptions, unavailable feedback, and ARIA copy are localized in Chinese and English.
- Mobile Image composer prioritizes the localized parameter summary and ellipsizes safely. At `320px`, the input retains a narrow but non-overlapping lane and the two-rail popup remains inside the viewport.

## Verification

- Refinement Jest: `6` relevant suites / `127` tests passed on the final tree, including the complete Gemini visual contract `84/84`.
- ESLint, TypeScript, `git diff --check`, production `next build`, and independent read-only re-review passed.
- In-app Browser used the real local Chat route at `1440x1024`, `390x844`, and `320x740`, in dark/light, with no access-code bypass.
- Browser evidence: empty Chat direct reasoning; empty Image trigger `Image options: Auto`, two sliders and zero listboxes; historical GPT direct reasoning plus Back; historical image unified rails plus Back; Escape focus restoration; zero page overflow. A clean tab after the known post-build dev-server restart had zero console warn/error.
- The refinement references and implementation were reviewed together in `test-results/chat-selector-refinement-qa/reference-implementation-board.png`; ignored `design-qa.md` records `final result: passed`.
- No paid model request, live image generation, push, PR, deploy, or remote configuration change was performed.
- Local product commits: `dfda494e Add Chat and Image modes to new chat`, `7e99317d Refine composer parameter selectors`.

## Preserved Boundaries

- Existing conversations do not render the home tabs. Their composer still shows `model · current detail`, but supported GPT/Image models now drill into the current parameter rail first; ordinary models still open the model list.
- Unsent empty-chat drafts keep the selected mode/model because tabs use the true empty-session boundary rather than the hero-only boundary.
- `model`/`providerName`, `reasoningEffort`, `size`, and `quality` locks remain authoritative and return localized feedback without visual-only state changes.
- Selecting a model continues to apply Responses constraints, image defaults, `conversation_override` metadata, `syncGlobalConfig=false`, and the existing plugin cleanup rule.
- OpenAI/Azure DALL-E capability detection remains helper-backed; Azure `gpt-image*` stays unsupported by the existing request contract and is not exposed as a functional image rail.

## Local Evidence

- Desktop Chat: `test-results/chat-home-mode-qa/desktop-chat-rail-final.png`.
- Desktop Image: `test-results/chat-home-mode-qa/desktop-image-menu.png`.
- Mobile Image: `test-results/chat-home-mode-qa/mobile-image-refined.png`.
- Narrow Chat/Image: `test-results/chat-home-mode-qa/narrow-chat.png`, `test-results/chat-home-mode-qa/narrow-image-refined.png`.
- Refinement desktop Image: `test-results/chat-selector-refinement-qa/desktop-image-auto.png`.
- Refinement existing Image: `test-results/chat-selector-refinement-qa/desktop-existing-image-options.png`.
- Refinement mobile/narrow: `test-results/chat-selector-refinement-qa/mobile-390-image-auto.png`, `test-results/chat-selector-refinement-qa/narrow-320-image-auto.png`.
- Refinement light mode: `test-results/chat-selector-refinement-qa/desktop-light-image-auto.png`.

## Composer Interaction Correction

### Result

- Desktop empty-home parameter menus now prefer the free space below the composer when it can fit the intended panel height, avoiding suggestion-card overlap. Mobile and bottom-anchored composers retain the existing collision-aware above placement.
- The model-menu backdrop/dialog now mounts only while open. Closing via backdrop, Escape, or selection removes the parameter/model branch in the same React commit, eliminating the 200ms exit-phase flash from the old always-mounted `display` transition.
- The composer trigger renders `model name · parameter` only while open. Closed new and existing sessions render only the truthful current parameter summary; ARIA labels and title text retain full model context.
- Home-specific open widths no longer collapse back to the closed width. At `320px`, the open trigger reserves a fixed `112px` lane so an ellipsized model name remains visible while parameter/caret and Send stay intact.
- Textarea pointer/click activation calls the existing `expandInput()` path. `showEmptyComposer` remains tied to the actual empty-session/content state so expanding does not surrender the homepage anchor to the bottom composer. A desktop-only expanded-empty rule changes the panel to `880px` and the inner radius to `30px` in place. Closed inputs stay at one row, then use the measured minimum of three desktop rows or two compact rows; desktop `autoFocus` does not expand the composer before a real click.
- Home `Chat / Image` tabs use a single token-backed indicator translated between the two grid cells. Existing `emptyComposerMode`, roving tab focus, model projection, Light/Dark tokens, and reduced-motion behavior remain authoritative.
- Model-name disclosure is now unified across new and existing sessions. The closed trigger has no model-name DOM or native `title`; its `aria-label` still identifies the current model and parameter for assistive technology. Desktop open state retains `model · detail`, while compact open state hides the redundant separator/detail and dedicates `112–132px` to the configured model name plus caret. The parameter remains visible in the open dialog, and every viewport gets a wrapping current-model surface that guarantees a complete readable value for arbitrary long custom display names.

### Verification

- Targeted Jest: `test/gemini-visual-migration.test.ts`, `test/chat-home-mode.test.ts`, `test/reasoning-effort-rail.test.tsx`, and `test/openai-image.test.ts` passed `114/114`.
- ESLint, TypeScript, `git diff --check`, and production `next build` passed.
- The initial multi-viewport Browser QA used a temporary static harness compiled from the final product SCSS, then deleted it. The final regression correction was verified directly in the user's authenticated Chrome route without reading or entering credentials.
- Browser viewports: `1440x1024`, `390x844`, `320x740`; Light/Dark; closed/open/next-frame-close; Chat/Image click and Arrow-key switching; pointer-expanded input; desktop-below and compact-above popup geometry.
- Measurements: desktop popup-composer gap `12px`, suggestion-card overlap `false`; compact menu edges `16..374` and `16..304`; real Chrome desktop input `1 row → 3 rows`, panel `760x62 → 880x116`, inner `706x62 / 999px → 826x116 / 30px`, with an unchanged `439.65625px` center and zero horizontal overflow; mobile input `1 row / 28px → 2 rows / 56px`. The only real-route Console warning came from Huaban extension HTML-attribute injection, not product code.
- Follow-up model-name measurements: `390px` new Chat/Image and `320px` new/existing Chat all report `clientWidth = scrollWidth = 89px`; compact detail/separator compute to `display:none`, Desktop detail remains visible, textarea/trigger gap is at least `4px`, trigger/Send gap is at least `4px`, and horizontal overflow is zero. Evidence is under `test-results/composer-model-name-fix-qa/`.
- Evidence: `test-results/composer-regression-qa/` and ignored root `design-qa.md` (`final result: passed`). No push, PR, deploy, remote configuration, credential entry, or intentional paid model request was performed.

## GPT Image Model-aware Options And Size Labels

### Result

- Image options now come from one model capability resolver shared by the composer, Settings, generation JSON, and edit multipart builders. GPT Image 2 exact/dated snapshots expose `auto` plus the seven documented popular sizes and `auto/low/medium/high`; known legacy GPT Image models retain their smaller size set; DALL-E 3 retains `standard/hd`; DALL-E 2 keeps no editable quality control.
- Cross-model stale values are normalized before display and request construction. A persisted GPT Image 2 `standard/hd` or DALL-E-only size can no longer be appended as a current-only rail stop while the request silently sends `auto`.
- Unknown/custom `gpt-image-*` names preserve the previous 2K/4K request compatibility instead of being silently downgraded. Azure GPT Image remains unsupported by the existing provider gate; Azure DALL-E behavior is unchanged.
- GPT Image 2 popular sizes now separate wire values from presentation. English uses the official meanings (`Square`, `Landscape`, `Portrait`, `2K/4K ...`); Chinese uses the requested product labels (`方形 · 1K`, `横向 · 1.5K`, through `纵向 · 4K`). Settings also shows the exact `WIDTHxHEIGHT`; composer descriptions identify them as common sizes rather than the complete API range.
- The OpenAI API supports additional valid GPT Image 2 custom resolutions, but this slice intentionally does not add a custom-size input. Existing fixed rails cover only `auto` and the seven documented popular sizes.

### Verification

- Official OpenAI developer docs were checked for GPT Image 2 size/quality constraints and DALL-E quality differences.
- Final targeted verification passed `5` suites / `147` tests, TypeScript, ESLint, `git diff --check`, production `next build`, and independent read-only semantic review.
- Real authenticated Chrome verified all eight Chinese size labels/descriptions, exactly four GPT Image 2 quality stops with no `standard/hd`, desktop popup geometry without overflow, and the restored `auto / medium` state. After the known post-build dev-server restart, `/api/config` returned JSON 200 and cold load passed; the only Console entry was Huaban extension attribute-injection noise, not a product error.
- No paid image generation, credential entry, push, PR, deploy, or remote configuration change was performed.
