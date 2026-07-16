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

- `chat.module.scss` now has one authoritative Composer layout path. Add, textarea, Model Chip, and Send share a Grid Shell; Compact is `64px`, expanded content stays in normal flow, and long drafts scroll internally. Empty Composer positioning is owned by one root VisualViewport clamp; Mobile and Desktop retain only their necessary responsive variants, while obsolete collapsed, segment, and file-tail duplicates are removed and guarded by selector-count tests.
- Add is a `44px` Primary-soft control rather than a visually independent outlined button. Model and Send geometry are owned by their base selectors; obsolete right/bottom/calc positioning is rejected by tests.
- The Empty Hero remains visible when Tools, Prompt Library, Model, Reasoning, or image-option layers open. The Hero uses the specified responsive system typography and semantic gradient.
- Tools and Prompt Library use the existing real actions and Prompt Store data. Model and parameter panels use real model/provider/config data, a `12px` shell gap, right-edge alignment, bounded collision placement, a flat header, and a single parameter Rail surface. Phone panels consume the Composer width (`viewport - 20px`); Book and desktop segments retain the `460px` target.
- Light and Dark paint flows through Composer semantic tokens. The model panel has one Dark authority instead of component, media-query, and raw-color duplicates.
- Aura is represented by three real blue/cyan/violet blobs with state-aware opacity and reduced-motion behavior.
- QA-only fixture states now cover empty/conversation surfaces, multiline, scrolling, mixed draft plus attachments, menu layers, Light/Dark, and posture simulations without changing production contracts.
- The accepted follow-up audit aligns the Empty Hero and `820px` desktop Composer with the reference geometry, restores the desktop `48px` logo and natural title wrapping, gives Mobile Tabs the `226x46px` contract, separates the Model Chip's `44px` hit area from its `40px` optical Surface, and restores the Rail's semantic light Surface/Border/weak Shadow.
- Mobile Model/parameter panels now enforce `min(56dvh, 500px)` in both placement math and the final compound CSS selector. A short-wide viewport rule keeps Expanded and Compact empty Composers inside the VisualViewport after orientation changes; it does not add a device, User-Agent, or product-mode branch.

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
yarn jest --runInBand
yarn lint
npx tsc --noEmit --pretty false
git diff --check
yarn build
```

Results:

- Composer-related tests: `13/13` suites, `92/92` tests PASS.
- Gemini visual contract: `1/1` suite, `85/85` tests PASS.
- Complete Jest: `87/87` suites, `862/862` tests PASS.
- ESLint: PASS with zero warning/error.
- TypeScript: PASS.
- Diff check: PASS.
- Production build: PASS; `/` is 108 kB and First Load JS is 194 kB.
- Browser logs contained no warning/error; only expected development info/log output was present.

## Browser Acceptance

The in-app Browser provided visible screenshots plus DOM/CSSOM metrics.

- Required matrix: 52 state/theme combinations across `1600x1000`, `1366x768`, `1024x768`, `768x1024`, `430x932`, `390x844`, `360x800`, and `320x700`.
- Posture matrix: Fold outer `480x920`, Fold inner `900x980`, Book `1200x850`, Tabletop `1000x1050`, and Split `700x950`.
- Reference extras: Desktop Prompt Library and `520x980` Light Tools, Light Reasoning, and Dark Reasoning.
- Additional measured states: Light/Dark Focus and a `390x420` soft-keyboard proxy, bringing the measured screenshot set to 64 cases. Two orientation-retention screenshots and a `320x700` real `Extra High` Chip screenshot bring the final evidence set to 67.
- Dynamic checks: mixed draft plus three attachments survived `430x932 -> 932x430`; the short landscape Expanded Shell ended at `418/430` instead of crossing the viewport; the open Dark Reasoning panel reflowed with a `12px` gap; the keyboard proxy capped the panel at `235.2px`; and the `320px` Chip retained the full `Extra High` detail while truncating only the model name.
- Aggregate: zero page horizontal overflow, no measured Shell/dialog viewport or segment escape, `64px` Compact Shells, a `12px` gap for every above-Shell panel, desktop Model/parameter width at most `460px`, mobile width at most `viewport - 20px`, and `192/192` measured core controls at `44px` height.

Each of the 19 reference images has an exact-viewport local side-by-side comparison. The local-only `fidelity-ledger.md`, implementation shots, comparison boards, desktop contact sheet, and responsive contact sheet live under `/tmp/neatchat-composer-remediation-followup/`.

## Accepted Reference Interpretation

- The requirements explicitly keep the desktop backdrop transparent and avoid obvious blur, so the heavier full-page dim visible in some Dark reference captures is not copied.
- The requirements specify a `440–470px` desktop model panel and flat single-layer parameter treatment, so the implementation uses `460px` rather than copying smaller nested demo cards.
- Prototype model records are illustrative; production continues to render live model/provider/config data.
- Existing chat shell/sidebar and business behavior remain intact where the requirements only govern the Composer.

## Residual Boundaries

No safely fixable visual deviation remains. Physical fold hardware, a real mobile soft keyboard, Safari/Firefox/Edge, actual 200% browser zoom, screen-reader speech, touch/pen, Voice/microphone, real file chooser, Provider calls, credentials, push, PR, deploy, dependency changes, and destructive Git were not executed or inferred as PASS. They remain external verification boundaries rather than blockers to this repository-level visual sign-off.
