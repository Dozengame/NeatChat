# 2026-07-12 Final Model Release Review

## Scope

- Review every commit from `6c8760f7` inclusive through the final local tree as one release candidate.
- Follow the complete chain from server/public environment config through global/session metadata, new-chat mode projection, composer model selection, reasoning/image capability UI, and OpenAI request construction.
- Preserve auth, access-code, persistence format, provider routing, MCP/Plugin, image request payloads, deployment, and remote state unless a confirmed regression required a minimal correction.

## Closed Findings

- Empty-session model normalization no longer hard-codes Terra. It prefers the effective server default model/provider when eligible, records automatic writes as `server_default` or `fallback`, keeps global sync enabled, and reserves `conversation_override` for direct user selection.
- The expanded composer pill and parameter header center the model name. The parameter page keeps the localized `切换模型 / Switch model` action; the model-list page no longer repeats the current-model header.
- Chat mode includes every available ordinary chat model, including non-GPT and non-OpenAI providers. Image mode uses the shared request capability helper and includes supported OpenAI/Azure DALL-E and OpenAI GPT Image pairs. Unsupported image-family pairs are not exposed as chat choices.
- Model-specific `OPENAI_REASONING_EFFORT` defaults no longer synthesize a global `WEBUI_ALLOWED_REASONING_EFFORTS` fallback. Explicit model rules and an explicit `*` policy are widened only enough to keep their own configured defaults visible.
- Reasoning capability resolution now distinguishes GPT-5, 5.1, 5.2, 5.4, 5.5, 5.6 and Pro variants. The API wire value `minimal` is typed, ordered, localized, and available only for supporting models.
- An invalid OpenAI GPT cross-model reasoning override now falls back to the target model's configured/global/model default and updates stale reasoning/max-token metadata. Anthropic and Azure targets remain outside this reconciliation path. Invalid exact model defaults fall back to a valid `*` default.
- Max output limits now match the reviewed model contracts: `128000` for GPT-5 base families and 5.4/5.5 Pro, `272000` for GPT-5 Pro, `16384` for GPT-5/5.1/5.2 `chat-latest`, and the existing `512000` fallback for other models.
- The removed desktop Header model controls no longer leave a stale Markdown layout contract. Access-control tests now clear local `ACCESS_*` variables so a developer `.env` cannot change deterministic default-limit assertions.

## Verification

- Full Jest: `62/62` suites and `580/580` tests passed.
- ESLint, `npx tsc --noEmit --pretty false`, `git diff --check`, and production `yarn build` passed.
- Local `/api/config` returned JSON 200 with `gpt-5.6-luna@OpenAI` and `xhigh`, matching the local environment. The deployed Vercel preview reported Terra because its remote environment is different and was not used as evidence for the local default.
- Real Chrome QA passed at the default desktop viewport, `390x844`, and `320x740`. New chat showed Luna; parameter headers and the expanded composer pill were centered; the model list contained Luna/Terra without a redundant header; the labeled switch action remained visible; popup bounds stayed inside the viewport; and document horizontal overflow was zero.
- Independent semantic review re-ran the focused model/config/UI contracts and found no remaining Critical or Important issue.

## Boundaries And Residual Risk

- No credential, paid provider request, remote configuration, push, PR, deploy, or destructive Git operation was performed.
- Administrator-forced reasoning still wins over model normalization by design. If a future mixed-capability deployment locks one global effort across incompatible models, the product will need a separate per-model lock contract.
- Derived max-token metadata is inferred from the old effort's standard budget. A separately typed custom value that exactly equals that budget is indistinguishable with the current single-value metadata format; current composer rail behavior is unaffected.
