# Summary Model Defaults And Reasoning

Date: 2026-07-13

## Result

- Empty `compressModel` / `compressProviderName` remains the persisted sentinel, but now means “follow the effective deployment default” instead of following the current conversation model.
- The effective Summary model/provider comes from the hydrated public `DEFAULT_MODEL`, including provider normalization and allowed-model fallback. A valid explicit Summary selection remains an override; an override that becomes unavailable falls back at request time without rewriting stored user data.
- UI discovery and request-time resolution share the same catalog, custom-model, default-model, and allowlist policy. An override still present in the allowlist but marked `available=false`, or a legacy ref removed while the allowlist is empty, therefore falls back before any provider request.
- The Settings select contains a real localized `Follow default model / 跟随默认模型` option showing the current effective model. Returning to it clears Summary override metadata. Model/provider policy locks display the effective default and disable the control without deleting a dormant override. An unlocked stale or unavailable override remains visible as disabled until the user clears or replaces it.
- The effective Summary model resolves `OPENAI_REASONING_EFFORT` through the existing scalar/per-model map. Administrator-locked effort wins and is normalized against the actual Summary model. Non-OpenAI and non-reasoning models omit OpenAI reasoning fields but retain the effective request output budget.
- Automatic title generation and history compression share one resolver result. All eleven provider clients merge `global -> target session -> request`, and header selection uses the request provider. Request-level Summary model, provider, temperature, top-p, output budget, and credentials can no longer be replaced by the active conversation.
- Provider tool declarations and handlers remain available for normal chat only when `allowTools === true`; Summary requests do not inherit the active session's tools. Google streaming now gates both the advertised tools and executable handlers.
- `summarizeSession(targetSession)` now reads that target session's memory prompt instead of the active session's prompt.
- At `<=600px`, the Summary row stacks vertically and the select uses full width with one-line ellipsis, preventing the longer sentinel label from becoming a narrow multi-line control.
- Store version, persistence shape, public-config schema, auth, access-code, provider routing, MCP/Plugin, deployment, and remote configuration remain unchanged.

## Main Files

- `app/utils/summary-request.ts`
- `app/utils/model.ts`
- `app/utils/hooks.ts`
- `app/client/request-config.ts`
- `app/client/headers.ts`
- `app/client/platforms/*.ts`
- `app/client/types.ts`
- `app/store/chat.ts`
- `app/components/model-config.tsx`
- `app/components/model-config.module.scss`
- `app/components/settings.tsx`
- `app/components/mask.tsx`
- `app/locales/cn.ts`
- `app/locales/en.ts`
- `test/summary-request.test.ts`
- `test/request-config.test.ts`
- `test/anthropic-request-config.test.ts`
- `test/summary-session.test.ts`
- `test/summary-model-settings.test.tsx`
- `test/gemini-visual-migration.test.ts`

## Verification

- The final relevant integration group passed 11 suites / 249 tests, including the complete Gemini visual contract, server/public config, config merge, Responses payload, i18n, Settings locked/stale states, catalog-disabled and removed override fallback, Summary resolver, provider request/header authority, Anthropic payload/authentication, tool gating, and target-session Summary behavior.
- Independent review found the original OpenAI-only merge, misleading locked/stale selector states, Google streaming's unconditional handler lookup, and a UI/request mismatch for catalog-unavailable overrides. All four were corrected before delivery.
- `corepack yarn lint`, `npx tsc --noEmit --pretty false`, Prettier, `git diff --check`, and `corepack yarn build` passed. Production output was `104 kB / 190 kB` for `/`.
- Real in-app Browser QA used `http://localhost:3000/#/settings`: the local effective default rendered as `gpt-5.6-luna(OpenAI)`; Terra could be selected, then returning to the default option restored the empty sentinel. Desktop `1440x1024` stayed horizontal at about `511px`; mobile `390x844` stacked the row and expanded the select to about `294px` with one-line ellipsis. Light/Dark layouts had no overlap or horizontal overflow, and Console warn/error remained empty.

## Boundaries

- No real model request, credential entry, access-code bypass, persistence migration, public-config schema change, push, merge, PR, deploy, or remote state change was performed. Delivery is limited to one local product commit.
- Summary choices still use the existing model catalog. Image-capability classification and any future dedicated Summary effort control remain separate product decisions.
