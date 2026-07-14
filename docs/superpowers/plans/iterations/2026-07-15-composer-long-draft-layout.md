# Composer Long Draft Layout Regression

Date: 2026-07-15
Branch: `dev`
Baseline: `dev=origin/dev=51fc3e51`
State: implemented and verified locally; not committed

## Goal And Boundaries

Fix the long-draft composer regression consistently for empty and existing conversations on desktop and mobile. Completion requires the upper text lines to use the available composer width, the model and Send controls to avoid covering text, both composer states to share one bounded height with internal scrolling, and the message surface to remain unobstructed.

Provider selection, request payloads, submit behavior, session draft persistence, attachments, model-menu behavior, and the dynamic message-body safe area are outside this slice and must remain unchanged.

## Root Cause And Result

The expanded composer inherited the same right-side control reservation as the single-line composer. Depending on state and viewport, `154–300px` of `padding-right` was applied to the full textarea height even though the model and Send controls occupied only the bottom row. This forced every upper line to wrap through a narrow text column. A second state split capped the empty textarea at `120px` while existing conversations could grow to `30vh`.

The corrected layout:

- keeps the existing single-row collapsed geometry and right-side control reservation;
- gives expanded textarea content the full available width;
- reserves a dedicated `66px` bottom lane for model and Send controls, with `18px` desktop and `6px` compact end padding;
- shares `min(120px, 30dvh)` as the empty/existing textarea cap and uses internal vertical scrolling beyond it;
- adds responsive contract coverage for both the shared height cap and the expanded full-width controls lane.

## Compact Single-Surface Follow-up

Browser review at `490x998` and `706x998` exposed a second compact-only regression. The Add button still participated in the row's flex layout, leaving the textarea with a permanent left rail even though the right-side controls had already moved into the footer. At tablet widths, both the row and inner wrapper also painted their own background, border radius, and shadow, producing a nested double frame.

For expanded composers at widths up to `900px`, the Add button is now positioned inside the footer control lane and the inner wrapper is layout-only (`transparent`, no border, radius, or shadow). The outer row remains the single visual surface. Padding is symmetric at `18px` for tablet widths and `6px` at `600px` and below. These rules exclude collapsed composers, and desktop widths keep the existing surface and static Add-button geometry.

## Verification Evidence

Passed on the final code state:

```text
corepack yarn jest test/composer-responsive.test.ts test/chat-home-mode.test.ts test/gemini-visual-migration.test.ts test/frontend-performance-compat.test.ts --runInBand --runTestsByPath
4/4 suites, 106/106 tests

corepack yarn lint
PASS, zero warning/error

npx tsc --noEmit --pretty false
PASS

corepack yarn prettier --check test/composer-responsive.test.ts
PASS

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

Real Browser QA used the local `/#/chat` route after a forced reload:

- `490x998`: the text inset changed from asymmetric `59/15px` to `15/15px`; the compact inner wrapper had no border, background, radius, or shadow;
- `706x998`: the nested frame was removed, the text inset was `27/27px`, and the outer row remained the only visible surface;
- `390x844`: the compact result remained symmetric at `15/15px`, with controls below the text and a `120px` textarea cap;
- `1440x1024`: the existing desktop inner surface, static Add button, `120px` cap, and zero horizontal overflow were preserved;
- new-chat, existing-conversation, expanded, and collapsed states were checked; every measured viewport had zero page overflow and no framework error overlay;
- the temporary QA text was removed, and the original `343`-character draft was restored without submitting it.

After the production build, `/` returned HTML `200` and `/api/config` returned JSON `200`; the documented stale dev-server condition did not recur in this follow-up.

Physical soft-keyboard behavior and Safari were not exercised. The shared `30dvh` secondary cap is retained specifically so shorter dynamic viewports can shrink below `120px` without introducing another state-specific rule.

No commit, push, PR, deploy, credential entry, provider request, external MCP call, or remote write was performed.
