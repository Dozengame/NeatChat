# 2026-07-11 Composer Model Selector

## Scope

- Frontend-only slice in `app/components/chat.tsx`, `app/components/chat.module.scss`, and the Gemini visual contract.
- Replace the empty-composer vs Header split with one composer-right model selector for empty, draft, existing-chat, desktop, and compact states.
- Preserve model/provider/store/persistence, reasoning allowlists, locked fields, image defaults, menu semantics, and Header session actions.
- Implement the user-approved GPT-5.x drill-in reasoning rail without changing provider, request, allowlist, locked-field, image-default, store, or persistence semantics.

## Result

- Root cause fixed: entering an unsent draft no longer removes the only desktop model entry.
- Desktop and mobile Header model triggers are removed; mobile Header shows the conversation topic instead.
- The shared menu is anchored to the composer on desktop and keeps the mobile sheet presentation on compact screens.
- Selecting a model closes the menu and restores focus to the single composer trigger.
- Input, status, model, and Send lanes have explicit desktop/mobile spacing; attachment and collapsed states align the model trigger to the bottom action row.
- The trigger now visibly includes the current model detail, expands left while Send stays fixed, and remains present while a new-chat draft is unsent.
- GPT-5.x reasoning uses one dedicated rail view with localized value/description, dynamic canonical stops, pointer drag/snap, Arrow/Home/End, current-only and locked behavior, Back/Escape focus restoration, reduced-motion support, and a highest-available gradient/sparkle state. Image models retain their original size/quality lists.
- Popup geometry is anchored to the whole composer vertically so multiline/mobile input is not covered; mobile centers on the composer axis and clamps to `360px`/viewport while desktop remains `380px`.

## Verification

- `84/84` Gemini visual-contract tests and `10/10` dedicated rail behavior tests; 7 relevant suites passed `167/167` in the final grouped run.
- Chat-render and message-content suites passed.
- ESLint, TypeScript, `git diff --check`, and production `next build` passed.
- In-app Browser temporary compiled-product-style fixture covered `1440x1024`, `390x844`, and `320x740`; final narrow geometry showed zero page overflow, 10px popup/composer gap, model-only ellipsis, stable detail/caret/Send, and no input overlap. Light `中`, Dark `极高`, drag, keyboard, current-only, locked, single-stop, image branch, and unsent multiline draft paths passed with zero console warning/error.
- Independent review first caught pointer-open focus leaving the modal; the final implementation always focuses the slider on drill-in and adds lost-pointer-capture cleanup. Re-review passed.
- The real local Chat route remained access-code gated; no credentials were entered and the gate was not bypassed. The temporary fixture and CSS were deleted. Final commit: `5231fc17`.

## Closed Design History

- Prototype 1: six-stop cyan-to-violet Intelligence Rail; recommended for the clearest combined model/effort control.
- Prototype 2: 3x2 Reasoning Cards; strongest for non-contiguous allowlists and explicit descriptions, but tallest.
- Prototype 3: drill-in Focus Mode rail; most premium and spacious, but adds one click.
- Reference ideas retained: discrete tiers, snap feedback, color progression, keyboard control, focus restoration, and reduced-motion support.
- Reference implementation intentionally not copied: its fixed five-tier model, Shadow DOM, hard-coded light palette, Canvas particles, and static rows conflict with NeatChat's six-tier/allowlist/locked/i18n/dark-mode contracts.

### User Feedback And Revised Visual Pass

- The user selected the drill-in Focus Mode interaction: choose the model in the first layer, then enter a dedicated reasoning-depth rail. They rejected the first rendering because its large white card and labeled node rail were visually far from the supplied Demo.
- The supplied `fb41120fe0752cdd96091b5f94a20b8f.mp4` is an 8.6s dark close-up of the compact Advanced panel. It confirms a small panel directly above the trigger, no pointer tail, a 28px capsule track, 34px white knob, discrete magnetic stops, drag-time endpoint labels, and a restrained blue-to-violet highest-tier state.
- Three revised design-only prototypes were generated for Light, Dark/dragging, and Light/MAX states. Independent visual review recommends the Light/MAX treatment as the strongest base and the Dark/dragging treatment as the interaction-state supplement; the Light middle-state draft retains a non-reference pointer tail and should not be implemented as-is.
- This pass was superseded by the unified final state set below; implementation kept the existing dynamic allowlist/locked states and NeatChat wire values rather than copying the reference project's tiers or usage-limit warning.

### Second Reference And Combined Prototype Pass

- The second reference, `主页 - X.mp4`, is a 23.744s slider-only showcase. It confirms continuous knob tracking, magnetic tier updates, a roughly 3.1:1 compact rail card, a knob about 1.2 times the track height, and a restrained highest-tier particle flow; it does not show trigger expansion, popup reveal, or placement flipping.
- The supplied closed/open PixPin crops confirm the missing trigger behavior: the closed trigger is content-fit, the open trigger expands to establish a stable anchor, the popup is slightly wider and center-aligned above it, and adjacent composer controls keep fixed gaps. The reference only shows above placement; below placement is a collision-aware fallback design.
- Current product constraints supersede the references: omit the lightning icon because no fast-mode capability exists; show `gpt-5.6-terra` plus the current localized effort in the adaptive trigger; use `思考等级` and current locale descriptions; and build stops from the current model/allowlist rather than the reference's static tiers.
- Current local Terra configuration is `low/medium/high/xhigh`, rendered as `低/中/高/极高`, with `中` selected. Four design-only prototypes now cover Light/above, Dark/above, Light/below, and Light/mobile states. The Dark draft contains one visual extra inactive stop and is not an implementation-ready stop map; the other three are the preferred structural references.
- The user approved the unified final state set and it is implemented in `5231fc17`. A future fast-mode affordance, if enabled by an explicit environment policy, remains a separate iteration and is not bundled into the reasoning selector.

### Unified Final State Set

- The user agreed that the prior Light/Dark/below/mobile images were states of one component, not four alternatives. The design is therefore consolidated into one specification and three final state images:
  - Light desktop, `gpt-5.6-terra · 中`: `exec-a0c32223-b532-4b25-871e-675b672d6aa0.png`.
  - Dark desktop, `gpt-5.6-terra · 极高`: `exec-ed42dda0-bb23-4002-863e-0954472e7558.png`.
  - Mobile Light, `gpt-5.6… · 中`: `exec-82004db6-2677-4195-8609-552b2d357911.png`.
- Unified component rules: desktop trigger is content-fit closed and expands left within an available-lane clamp; mobile keeps a clamped trigger and ellipsizes only the model name; popup prefers above, flips below when space requires, has no pointer tail, and clamps to viewport edges; Send remains fixed.
- Current Terra rail uses four canonical stops from the local allowlist: `低 / 中 / 高 / 极高`. The implementation must derive stops dynamically from model capability, server allowlist, and any truthful disabled current value rather than hard-code four or six levels.
- Light `中` uses the second stop; Dark `极高` ends at the far-right stop with no gray tail or hidden tier; Mobile preserves the effort label while truncating the model name. All three omit lightning, fast-mode, quota, pricing, and reference-only labels.
- Independent image review passed the three-state set for shared component structure, localization, four-stop placement, popup anchoring, no-tail treatment, responsive truncation, and non-overlapping composer controls. Static images do not verify drag, keyboard, focus, animation, English/320px layout, or contrast; those remain implementation Browser QA gates after explicit approval.
