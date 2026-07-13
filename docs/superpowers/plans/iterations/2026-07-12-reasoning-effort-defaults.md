# Per-model Reasoning Effort Defaults

Date: 2026-07-12

## Result

`OPENAI_REASONING_EFFORT` accepts both the legacy scalar and scoped defaults such as:

```env
OPENAI_REASONING_EFFORT="*=medium;gpt-5.6-sol=medium;gpt-5.6-terra=high;gpt-5.6-luna=xhigh"
```

- Resolution order is exact canonical model, `*`, then the project fallback `low`.
- `gpt-5.6` canonicalizes to `gpt-5.6-sol`; keys are trimmed and case-normalized; the last valid duplicate wins; invalid clauses are ignored without masking fallback rules.
- The public contract keeps `defaults.reasoningEffort` and `legacy.openaiReasoningEffort` as the effective scalar for the configured default model, and adds optional `reasoningEffortDefaults` for current clients.
- The canonical map participates in `configHash`, including changes that only affect a non-default model.
- Model switches in Settings, Mask, legacy chat actions, the unified composer/header selector, and unavailable-model fallback apply the selected model's server default only when the prior value is server-derived.
- `user_override`, `conversation_override`, `admin_forced`, locked reasoning effort, explicit/locked max tokens, non-OpenAI providers, and non-reasoning models remain protected.
- Server-derived `max_output_tokens` follows the resolved effort. Explicit or locked values are retained and still pass through existing model limits.
- `WEBUI_ALLOWED_REASONING_EFFORTS` remains an independent UI allowlist. Its effective lists are widened only enough to keep configured model defaults visible.
- Sync-global sessions now copy both `modelConfig` and `modelConfigMeta`, preventing source loss during model-aware resolution.

## Verification

- `npx jest test/server-config.test.ts test/config-merge.test.ts test/gpt56-settings-contract.test.ts --runInBand`: 3 suites, 75 tests passed.
- `npx next lint`: passed without warnings.
- `npx tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.
- `npx tsx app/masks/build.ts && npx cross-env BUILD_MODE=standalone next build`: passed.
- After the documented post-build dev-server restart, `GET /api/config` returned JSON 200 and the actual local configuration resolved `gpt-5.6-luna@OpenAI` to `xhigh`, with the canonical default/Sol/Terra/Luna map `medium/medium/high/xhigh`.

## Boundaries

- No Browser QA was required because this is configuration, state-merge, and model-switch semantics without a new visual surface.
- No access-code bypass, credential entry, paid provider request, push, PR, deploy, or remote configuration change was performed.
