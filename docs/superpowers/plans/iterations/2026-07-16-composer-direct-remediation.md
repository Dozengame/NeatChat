# 2026-07-16 Composer Direct Remediation

## Scope And Authority

This slice is a frontend-only Composer visual and responsive remediation on `dev`. The external direct-remediation requirements and its 19 target-design images are the authority. Earlier handoff language that treated Add or other Composer controls as visually independent is superseded for this slice.

Completion means:

- one coherent Compact / Expanded / Scrolling surface in normal flow;
- requirements-aligned Hero, controls, menus, parameter rails, Aura, Light/Dark tokens, responsive collision behavior, and posture handling;
- preserved product behavior and real model/provider/prompt/attachment data;
- deterministic tests, lint, TypeScript, diff check, production build, Browser matrix, and one-to-one reference evidence all pass;
- a local commit only, with no publish or external mutation.

## Product Result

- `chat.module.scss` now has one authoritative Composer layout path. Add, textarea, Model Chip, and Send share a Grid Shell; Compact is `64px`, expanded content stays in normal flow, and long drafts scroll internally.
- Add is a `44px` Primary-soft control rather than a visually independent outlined button. Model and Send geometry are owned by their base selectors; obsolete right/bottom/calc positioning is rejected by tests.
- The Empty Hero remains visible when Tools, Prompt Library, Model, Reasoning, or image-option layers open. The Hero uses the specified responsive system typography and semantic gradient.
- Tools and Prompt Library use the existing real actions and Prompt Store data. Model and parameter panels use real model/provider/config data, a `12px` shell gap, right-edge alignment, bounded collision placement, a flat header, and a single parameter Rail surface. Phone panels consume the Composer width (`viewport - 20px`); Book and desktop segments retain the `460px` target.
- Light and Dark paint flows through Composer semantic tokens. The model panel has one Dark authority instead of component, media-query, and raw-color duplicates.
- Aura is represented by three real blue/cyan/violet blobs with state-aware opacity and reduced-motion behavior.
- QA-only fixture states now cover empty/conversation surfaces, multiline, scrolling, mixed draft plus attachments, menu layers, Light/Dark, and posture simulations without changing production contracts.

## Preserved Semantics

The slice does not change:

- model/provider selection authority, allowlists, lock semantics, request format, timeout, streaming, error propagation, or current-session Stop;
- attachment parsing, image/file limits, wire format, upload actions, image editing, or file dialogs;
- Prompt Store persistence, prompt insertion, Search, Masks, Settings, SD, exporter, MCP/Plugin, auth/access, abuse control, sync, or browser persistence;
- API contracts, environment variables, build/deploy configuration, Tauri, dependencies, or remote state.

## Deterministic Verification

Final commands executed after the last product change:

```bash
yarn jest test/chat-qa-fixture.test.ts test/composer-model-menu-placement.test.ts test/composer-model-menu.test.ts test/composer-responsive.test.ts test/composer-submit.test.ts test/composer-textarea-layout.test.ts test/composer-tools-menu.test.ts test/composer-visual-system.test.ts test/discrete-option-rail.test.tsx test/reasoning-effort-contrast.test.ts test/reasoning-effort-rail.test.tsx test/chat-render.test.ts test/message-content.test.ts --runInBand --runTestsByPath
yarn jest test/gemini-visual-migration.test.ts --runInBand --runTestsByPath
yarn test:ci --runInBand --silent
yarn lint
npx tsc --noEmit --pretty false
git diff --check
yarn build
```

Results:

- Composer-related tests: `13/13` suites, `88/88` tests PASS.
- Gemini visual contract: `1/1` suite, `85/85` tests PASS.
- Complete Jest: `87/87` suites, `858/858` tests PASS.
- ESLint: PASS with zero warning/error.
- TypeScript: PASS.
- Diff check: PASS.
- Production build: PASS; `/` is 108 kB and First Load JS is 194 kB.
- Restarted post-build smoke: `/api/config` returned JSON `200`; `390x844` Dark model list retained the Hero, measured a `370x64` shell and `370x231` menu with a `12px` gap and right-edge delta `0`, had zero horizontal overflow, and emitted no Browser warning/error.

## Browser Acceptance

The in-app Browser provided visible screenshots plus DOM/CSSOM metrics.

- Required matrix: 54 states across `1600x1000`, `1366x768`, `1024x768`, `768x1024`, `430x932`, `390x844`, `360x800`, and `320x700`, in the required Light/Dark state combinations.
- Posture matrix: Fold outer `480x920`, Fold inner `900x980`, Book `1200x850`, Tabletop `1000x1050`, and Split `700x950`.
- Reference extras: Desktop Prompt Library and `520x980` Light Tools, Light Reasoning, and Dark Reasoning.
- Dynamic checks: portrait-to-landscape-to-portrait preserved the open model layer; multiline and mixed draft/attachments survived resize; `390x500` VisualViewport proxies kept focused multiline and reasoning panels inside the visible viewport.
- Aggregate: 63 screenshot states, 9 Composer states, 14 unique viewports, zero page horizontal overflow, a `12px` gap for every open menu, and right-edge delta `0` for every Model / parameter panel.

Each of the 19 reference images has a local side-by-side comparison. The local-only ledger and evidence live under `/tmp/neatchat-composer-remediation/`; `fidelity-ledger.md` records the exact mapping and the 12-dimension acceptance ledger.

## Accepted Reference Interpretation

- The requirements explicitly keep the desktop backdrop transparent and avoid obvious blur, so the heavier full-page dim visible in some Dark reference captures is not copied.
- The requirements specify a `440–470px` desktop model panel and flat single-layer parameter treatment, so the implementation uses `460px` rather than copying smaller nested demo cards.
- Prototype model records are illustrative; production continues to render live model/provider/config data.
- Existing chat shell/sidebar and business behavior remain intact where the requirements only govern the Composer.

## Residual Boundaries

No safely fixable visual deviation remains. Physical fold hardware, a real mobile soft keyboard, Safari/Firefox/Edge, actual 200% browser zoom, screen-reader speech, touch/pen, Voice/microphone, real file chooser, Provider calls, credentials, push, PR, deploy, dependency changes, and destructive Git were not executed or inferred as PASS. They remain external verification boundaries rather than blockers to this repository-level visual sign-off.
