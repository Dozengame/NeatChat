# 2026-07-09 MCP Init Retry

## Slice

- Target: add a short-term retry/backoff guard for transient MCP initialization failures, especially `TypeError: fetch failed` caused by `UND_ERR_CONNECT_TIMEOUT`.
- Commit: `3ca4a7c8 fix(mcp): retry transient initialization failures`.
- Files changed: `app/mcp/actions.ts`, `test/mcp-initialize.test.ts`.
- Product-visible change: Jimeng MCP activation and other MCP initialization paths can survive a transient connect timeout by retrying before surfacing failure.
- Preserved semantics: MCP config loading, auth gate, client status model, tool listing, Jimeng request normalization, MCP execution, provider/model/store/API/persistence, and UI behavior are unchanged.

## Implementation

- Added two retry delays, `500ms` and `1500ms`, around the combined `createClient` plus `listTools` initialization step.
- Retry is limited to network/timeout-shaped errors, including `fetch failed`, `UND_ERR_CONNECT_TIMEOUT`, undici socket/header/body timeouts, `ETIMEDOUT`, `ECONNRESET`, `ECONNREFUSED`, and `EAI_AGAIN`.
- The client remains in `{ client: null, tools: null, errorMsg: null }` while retrying, so status still reads as initializing. Final failure still records the real error message and rethrows.
- `resumeMcpServer` now uses the same retry helper as normal initialization, activation, restart, add-server, and execution-triggered lazy initialization.

## Verification

- RED first: `yarn jest test/mcp-initialize.test.ts --runInBand --runTestsByPath` failed because the transient `fetch failed` was thrown after the first attempt.
- Final checks passed: `yarn jest test/mcp-initialize.test.ts --runInBand --runTestsByPath`, `yarn lint`, `npx tsc --noEmit --pretty false`, `git diff --check`, and `yarn build`.
- `yarn build` retained the existing Edge Runtime static-generation warning.

## Browser QA

- Not run. This slice changes server-side MCP initialization only and has no visual surface or browser-only interaction.

## Risks And Next

- Retry only mitigates intermittent connect timeouts. Persistent Vercel-to-`123.207.69.230:443` reachability problems still require endpoint/network work such as a stable domain, proxy, CDN, firewall/security-group review, or provider routing fix.
- If a post-deploy digest remains, capture the production server log around Jimeng activation and compare whether retries were exhausted or the failure moved to a protocol/auth/tool-listing error.
