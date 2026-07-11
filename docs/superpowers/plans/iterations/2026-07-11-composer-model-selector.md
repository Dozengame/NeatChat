# 2026-07-11 Composer Model Selector

## Scope

- Frontend-only slice in `app/components/chat.tsx`, `app/components/chat.module.scss`, and the Gemini visual contract.
- Replace the empty-composer vs Header split with one composer-right model selector for empty, draft, existing-chat, desktop, and compact states.
- Preserve model/provider/store/persistence, reasoning allowlists, locked fields, image defaults, menu semantics, and Header session actions.
- Keep the GPT-5.x reasoning visual redesign out of product code until the user chooses a prototype.

## Result

- Root cause fixed: entering an unsent draft no longer removes the only desktop model entry.
- Desktop and mobile Header model triggers are removed; mobile Header shows the conversation topic instead.
- The shared menu is anchored to the composer on desktop and keeps the mobile sheet presentation on compact screens.
- Selecting a model closes the menu and restores focus to the single composer trigger.
- Input, status, model, and Send lanes have explicit desktop/mobile spacing; attachment and collapsed states align the model trigger to the bottom action row.

## Verification

- `84/84` Gemini visual-contract tests.
- `6/6` chat-render and message-content tests.
- ESLint, TypeScript, `git diff --check`, and production `next build` passed.
- Chrome temporary compiled-SCSS fixture covered `1440x1024`, `390x844`, and `320x740`; final narrow geometry showed zero page overflow and no input/model/Send overlap across empty, unsent-draft, and attachment-expanded states.
- The real local Chat route remained access-code gated; no credentials were entered and the gate was not bypassed. The temporary fixture and CSS were deleted.

## Pending Design Gate

- Prototype 1: six-stop cyan-to-violet Intelligence Rail; recommended for the clearest combined model/effort control.
- Prototype 2: 3x2 Reasoning Cards; strongest for non-contiguous allowlists and explicit descriptions, but tallest.
- Prototype 3: drill-in Focus Mode rail; most premium and spacious, but adds one click.
- Reference ideas retained: discrete tiers, snap feedback, color progression, keyboard control, focus restoration, and reduced-motion support.
- Reference implementation intentionally not copied: its fixed five-tier model, Shadow DOM, hard-coded light palette, Canvas particles, and static rows conflict with NeatChat's six-tier/allowlist/locked/i18n/dark-mode contracts.
