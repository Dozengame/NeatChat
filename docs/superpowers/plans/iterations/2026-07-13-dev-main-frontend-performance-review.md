# Dev to Main Frontend Performance Review

## Scope and acceptance

- Review baseline: `main=0280cb3d`, `dev=2b047124`; frontend-only audit before a future merge.
- Primary experience baseline: desktop `1440x1024` and constrained desktop `1056x834`. Mobile `390x844` and narrow `320x740` validate the same responsive contracts rather than defining a separate interaction model.
- Preserve provider/model requests, stores, persistence, auth/access, MCP/Plugin, deployment, and all existing product animation semantics.
- Delivery boundary: commit and push to `origin/dev` only. Do not merge branches, create a PR, or deploy.

## Delivered result

- Commit `8768d70c` replaces critical composer `:has()` dependencies with explicit React state classes, preserving focus and layout behavior in browsers that do not support the selector.
- Model-menu placement now follows `visualViewport` dimensions and offsets, updates on viewport resize/scroll, clamps to visible bounds, remains mounted for the close transition, and restores focus to the trigger after Escape.
- Desktop Chat/Image tabs, model trigger, model-switch action, and Send control use 44px targets. Mobile inherits the same target and state rules with compact geometry.
- Highest reasoning effort retains its animated sparkle. The motion now uses a pseudo-element `translate3d` loop instead of animated `background-position`; `prefers-reduced-motion` stops it and forced-colors removes nonessential sparkle decoration.
- Reasoning-rail pointer movement reuses geometry captured on pointer down, ignores equivalent option-array identities, focuses the slider, and skips redundant value writes.
- Ordinary Markdown spans no longer mount ResizeObserver/formula hooks. Streaming tables keep width state monotonic and avoid recursively serializing the entire React subtree on each token update.
- Added regression contracts for drag geometry/focus, ordinary-span hook avoidance, streaming-table width stability, 44px targets, browser fallbacks, viewport listeners, and preserved transform-based sparkle.

## Verification

- `corepack yarn test:ci --runInBand`: 65 suites / 597 tests passed on the final committed tree.
- `corepack yarn lint`: passed with no warnings or errors.
- `npx tsc --noEmit --pretty false`: passed.
- `git diff HEAD^ HEAD --check`: passed.
- `corepack yarn build`: passed; `/` remains 177 kB and First Load JS 264 kB. Baseline `main` was 156 kB / 242 kB; the roughly 22 kB First Load increase belongs to the broader 24-commit feature range, not this fix slice.
- Independent reviewer: PASS with no blocking regression.
- Real Chrome: `1440x1024` and `1056x834` model menu, rail animation, close transition, Escape focus restoration, 44px targets, and zero page overflow passed. Earlier responsive passes covered `390x844` and `320x740`. Console evidence contained only Huaban extension-injected hydration attributes.

## Residual risk

- No real legacy Firefox/Safari or Windows High Contrast device was available. Compatibility is supported by explicit-class fallbacks, optional `visualViewport`, forced-colors/contrast/reduced-transparency rules, Jest contracts, and Chrome runtime evidence, but those environments remain unexecuted.
- The `main...dev` feature range remains larger than `main` by about 22 kB First Load JS. The review confirmed major feature growth and no shared-chunk regression; any further budget reduction should be a separate route-level lazy-loading slice with product behavior measurements.
