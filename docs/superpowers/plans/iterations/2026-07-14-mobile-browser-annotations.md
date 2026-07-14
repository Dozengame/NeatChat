# 2026-07-14 Mobile Browser Annotation Closure

## Scope

Close four mobile Browser annotations and their follow-up regressions without changing provider, request, session, persistence, model-selection, or Settings-value semantics:

- keep the model selector's source button sharp and actionable while the rest of the page remains blurred and modal;
- remove the visually heavy mobile message-action capsule while retaining accessible hit targets and state feedback;
- let mobile Settings use the available width without colliding with safe areas;
- prevent the model-open state from exposing overlapping quick-jump chrome.
- use the same quiet message-action visual language on desktop;
- keep Retry visible while the model selector is mounted;
- remove the selector immediately when an outside click closes it, without a delayed flash.

The implementation stays within the existing React, CSS Modules, design tokens, icon set, ARIA labels, focus handling, and responsive breakpoints. No new dependency or route was added.

## Result

- `chat.tsx` marks the compact composer while the mobile model selector is open and suppresses quick-jump for that modal state.
- The open composer sits above the modal backdrop. Its add/input/send controls are blurred and dimmed individually, while the real model trigger stays sharp, receives pointer input, and remains the focus-return target. The page backdrop still uses its existing blur.
- Message actions now share one transparent, borderless, shadow-free rail on desktop and mobile. Desktop keeps `34x34px` controls while mobile keeps four `44x44px` controls; both use the same quieter idle color and restrained hover, focus, active, and copied states.
- `reload.svg` no longer defines document-global fragment IDs. Mounting the model selector therefore cannot redirect the message Retry icon's SVG mask/reference to another instance.
- The model backdrop and dialog are conditionally mounted only while open. Outside-click closure removes both from the DOM immediately and restores focus to the real model trigger instead of leaving hidden composited nodes that can flash later.
- The desktop Settings padding is declared before the mobile override. Mobile content uses `10px` safe-area-aware side gutters and `14px` section-head insets.

## Verification

```text
corepack yarn jest test/gemini-visual-migration.test.ts test/frontend-performance-compat.test.ts test/composer-responsive.test.ts test/settings-selector-a11y.test.tsx --runInBand --runTestsByPath
4/4 suites, 100/100 tests

corepack yarn jest test/chat-render.test.ts test/message-content.test.ts --runInBand --runTestsByPath
2/2 suites, 12/12 tests

corepack yarn lint
PASS, zero warning/error

corepack yarn tsc --noEmit --pretty false
PASS

git diff --check
PASS

corepack yarn build
PASS; Next.js production build completed
```

In-app Browser QA used the real local app and the existing conversation:

- `430x932` auto-dark and Light: the page and non-source composer controls remain blurred, the actual model trigger is sharp and clickable, repeat-click closes the dialog, and focus returns to the trigger;
- `487x998`: opening the selector leaves both Retry icons at three SVG paths with no fragment IDs; an outside click removes backdrop and dialog at the first post-click sample and they remain absent after about `40ms`, `220ms`, and `1.22s` while focus returns to the model trigger;
- `487x998`: both message-action rails are transparent with no border/shadow, all controls remain `44x44px`, and page overflow is zero;
- `430x932` Settings: scroller padding is `10px`, the first section is `406px` wide, and page width stays `430/430px`;
- `320x740`: Settings is `296px` wide inside safe gutters, the open model trigger stays sharp, Retry remains intact across open/close, and page width stays `320/320px`;
- `1440x1024`: both desktop action rails are transparent with no border, padding, or shadow; controls are `34x34px`, use no filter/shadow, and page overflow is zero.

The final restarted-page pass had zero Browser warning/error and no Next.js error overlay. After the production build, the development server was restarted; `/` returned HTML `200` and `/api/config` returned JSON `200`.

No commit, push, PR, deploy, credential entry, provider request, external MCP call, or remote write was performed.
