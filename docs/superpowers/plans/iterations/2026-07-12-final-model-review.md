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

## Main To Dev Pre-Merge Review

- Review baseline: `main=0280cb3d`, `dev=9b479d4c`; `dev` was 24 commits ahead with a net 157-file diff (`23,505` insertions, `4,989` deletions).
- The full-stack review covered frontend and responsive product behavior, accessibility, auth and model-test key propagation, OpenAI Responses streaming and side-effect recovery, shared SSE settlement, MCP/Jimeng lifecycle and display parsing, Plugin deadlines, PDF resource bounds, configuration, persistence boundaries, and tests.
- Eleven confirmed findings were closed: ephemeral Jimeng activation for its paused built-in configuration; ordered four-worker PDF extraction; final-marker Jimeng prompt parsing; effective authenticated model-test keys; terminal-aware Responses streaming for every stream; finite Plugin/tool-loop deadlines; settle-once SSE timeout/Stop cleanup; next-turn direct-tool gating during unknown-outcome recovery; disabled unavailable/locked home modes; WCAG 4.5:1 Dark highest-effort contrast; and full-set ARIA metadata for virtualized messages.
- Independent semantic re-review found no remaining Critical or Important issue. Final verification passed 65 Jest suites / 594 tests, ESLint, TypeScript, production build, and both worktree and `main` diff checks.
- Real Chrome QA passed at `1440x1024` and `390x844`: Chat/Image controls and panels stayed in viewport, page horizontal overflow was zero, Escape restored focus to the composer trigger, and the current Console contained no product error. The active deployment exposed both model families, so unavailable-family visuals are covered by the native-disabled DOM contract and deterministic tests rather than a live unavailable-family configuration.
- No real third-party side effect, credential, paid provider request, branch merge, PR, deploy, remote configuration change, or destructive Git operation was performed. The only requested remote mutation is the final push of the review commit to `origin/dev`.
