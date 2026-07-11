# 2026-06-14 to 2026-06-15 Gemini Foundation

Use this file only when a task needs the original Gemini-style UI migration baseline.

## Intent

Move NeatChat toward a Gemini Web-like chat experience while preserving NeatChat capabilities:

- lightweight start screen and prompt bar
- clearer sidebar and session reading flow
- multimodal entry points near the composer
- stable mobile shell
- restrained focus/theme/a11y states

Do not copy Google assets, add account/payment/release flows, change model API semantics, change MCP protocol behavior, or rewrite stores for visual polish.

## Completed Foundation Slices

- `start-screen suggestions`: Gemini-like empty-state suggestions; suggestion click fills composer without prompt autocomplete.
- `sidebar-navigation`: primary/content sidebar sections, local-content entry, preserved Search/Masks/Settings routes.
- `conversation-reading`: stable reading surface width, right-aligned user messages, mobile/narrow no-overflow checks.
- `multimodal-tray`: composer-adjacent multimodal tools without changing upload/image/MCP semantics.
- `mobile-shell`: drawer/header/composer/menu stability.
- `theme-a11y-focus`: maintainable tokens and focus-visible states.

## 2026-06-15 Candidate Queue

Most early candidates have since been superseded by later commits. Treat these as historical direction, not active instructions:

- message action rail
- composer attachment strip
- composer status row
- empty-state visual restraint
- shell background restraint
- sidebar history action polish
- desktop header action cluster
- mobile model menu polish
- composer tools popover semantics and focus return
- model menu modal semantics
- sidebar recent list current state
- reading-surface message list
- composer focus shell

Before implementing anything from this list, verify current source/tests and check newer iteration files.

## Verification Pattern

The original baseline used:

```bash
yarn lint
npx tsc --noEmit
yarn jest test/gemini-visual-migration.test.ts test/chat-render.test.ts --runInBand
```

Browser QA covered desktop `1440x1024`, mobile `390x844`, and narrow `320x740`, with no horizontal overflow, no overlap, and visible core entry points.
