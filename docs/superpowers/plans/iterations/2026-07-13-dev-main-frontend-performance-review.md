# Dev to Main Frontend Performance Review

## Scope and acceptance

- Final review baseline: `main=0280cb3d`, `dev=05ff72b0`; merge-base is `main`. The range contains 28 non-merge commits and changes 161 files before this optimization slice.
- Primary experience baselines are desktop `1440x1024`, constrained desktop `1056x834`, mobile `390x844`, and narrow mobile `320x740`.
- Provider/model request semantics, auth/access, MCP/Plugin, persistence schema, deployment, and existing animation intent remain unchanged.
- Delivery boundary is commit and push to `origin/dev` only. No merge, PR, deploy, paid request, credential change, or `main` write is included.

## Delivered result

- Optional Export, Image Editor, Realtime Chat, TTS, and provider model-discovery graphs now load on demand. The production `/` route fell from the prior `177 kB / 264 kB First Load JS` to `103 kB / 189 kB`.
- Chat uses a narrow Zustand subscription, avoids rebuilding a disabled preview bubble on every keystroke, and keeps the global shortcut listener stable during streaming.
- The 45-message render window now carries absolute message indexes and stable message anchors. Bidirectional page shifts compensate `scrollTop`, so long Markdown and image rows do not cause an index reset or uncorrected window jump.
- Streaming still publishes its first update immediately, then adapts from 50 ms to 80/120 ms only after 64K/128K characters. This reduces repeated full Markdown work without degrading normal replies or final flush semantics.
- Markdown history images use native lazy loading and async decoding. Artifact viewport subscription and code-block resize listeners are mounted only where needed and are cleaned up on unmount.
- The QA fixture can create up to 240 mixed history messages with long Markdown, code, tables, images, details, attachments, and a streaming tail; the real 140-message run kept the rendered DOM bounded to 45 messages.
- Mobile sidebar motion keeps its 200 ms spatial intent but moves from layout-triggering `left` animation to compositor `translate3d`. The iOS animation-disable branch was removed; Reduced Motion and Reduced Transparency retain explicit fallbacks.
- Mobile Settings is one semantic 44 px link instead of a nested link/button pair. Markdown image download is 44 px on coarse pointers. The shared Selector now owns initial focus, traps Tab, closes on Escape, restores trigger focus, and uses localized labels.
- A real `320px` attachment-composer regression was fixed: model-control reservation is compacted only at the narrow breakpoint, increasing the measured input width from 30 px to 96 px while keeping the model and Send controls visible.

## Verification

- `corepack yarn test:ci --runInBand`: 66 suites / 604 tests passed.
- `corepack yarn lint`: passed with no warnings or errors.
- `npx tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.
- `corepack yarn build`: passed; `/` is 103 kB and First Load JS is 189 kB.
- Real in-app Browser QA used the 140-message mixed fixture. Rapid bidirectional scrolling shifted the 45-message window while keeping page height bounded; all images in the window were lazy loaded. Desktop, constrained, mobile, narrow, Light, Dark, model-menu Escape focus restoration, Selector Tab trapping, mobile drawer target geometry, and horizontal overflow checks passed. Console reported zero warnings and zero errors.

## Residual risk

- Safari, Firefox, Edge, Windows High Contrast, and physical touch devices were not available. Current evergreen compatibility is covered by capability checks, CSS fallbacks, forced-colors/contrast/reduced-transparency contracts, and Chromium runtime evidence, but those environments remain an explicit manual-test boundary.
- Persisted Chat state still hydrates through one full `JSON.parse`, and all sessions remain resident in Zustand. True per-session lazy hydration and storage sharding require a separately designed persistence migration and were intentionally not introduced in this frontend slice.
- Streaming Markdown still reparses the growing tail. Adaptive coalescing reduces the worst repeated work, but a safe closed-block incremental parser would require an isolated rendering design and broader syntax-equivalence tests.
