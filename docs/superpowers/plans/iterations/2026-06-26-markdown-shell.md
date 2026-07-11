# 2026-06-26 Markdown And Shell Work

Use this file for recent shell/sidebar/update-modal/code-block/Markdown stress context.

## Main Outcomes

- Fixed reported chat shell regressions across update announcement sheet, dark icon contrast, model level text, suggestions layout, selector layering, recent-chat row, sidebar content module, and light code-block surfaces.
- Added deterministic Markdown stress coverage and code gutter/line-number structure.
- Continued Markdown mixed-format, media fallback, code-block cascade/scroll, list rhythm, and text rhythm polish.
- Fixed visible UI regressions still present after earlier Markdown work.

## Commit Map

- `47f46feb style(chat): clarify mobile entry controls`
- `6b9fe492 style(markdown): unify chat reading surfaces`
- `6bc27336 style(chat): fix reported shell regressions`
- `26f84e29 style(chat): refine markdown code and sidebar visuals`
- `79d968f4 test(chat): add markdown stress fixture`
- `35c3a3fe style(markdown): polish mixed format surfaces`
- `6e4d321e style(markdown): refine media fallback cards`
- `676628e1 style(markdown): stabilize code block chrome`
- `de8d398f style(markdown): polish list rhythm`
- `b3089f77 style(markdown): refine text rhythm`
- `fa2d9315 style(shell): fix visible UI regressions`

## Important Facts

- `codex_qa=markdown-stress` became the preferred deterministic route for Markdown visual QA.
- Code block line numbers are display-only and must not enter copied text.
- The unused sidebar content module was hidden/removed from visible local `dev` behavior.
- Settings text in the expanded desktop sidebar should remain visible.
- Mobile update announcement behavior has source/Jest coverage; it may not naturally appear in local Browser if already marked seen.
- GitHub HTTPS auth had previously blocked push in some slices, but current `dev` is aligned with `origin/dev` as of the 2026-06-27 reorganization.

## Browser QA Pattern

Common viewports used:

- desktop `1056x834` or `1280x720`
- mobile `390x844`
- narrow `320x740`

Evidence often included screenshots under `/tmp/neatchat-*`, DOM metrics, console warn/error count, no horizontal overflow, and light/dark checks through Settings UI where possible.

## Remaining Risks

- Access-code gate may block fresh authenticated sessions.
- Browser screenshot capture can time out.
- Some update-modal proof remains source/Jest/CSS contract level unless the modal naturally appears.
