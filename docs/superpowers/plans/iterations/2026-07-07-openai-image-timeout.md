# 2026-07-07 OpenAI Image Timeout

## Slice

- Target: fix `gpt-image-2` image generation/edit failures that surfaced as `signal is aborted without reason`.
- Files changed: `app/utils/openai-image.ts`, `app/client/platforms/openai.ts`, `app/api/common.ts`, `app/api/openai/v1/images/[action]/route.ts`, `test/openai-image.test.ts`.
- Visible change: OpenAI image requests now wait up to the Vercel Hobby-compatible 300-second route cap and timeout aborts carry an explicit image-generation timeout reason.
- Preserved semantics: model/provider availability, Images API payload fields, multipart edit payloads, upload/cache handling, Responses API, chat streaming, store/persistence, MCP/Plugin, auth, and account behavior are unchanged.

## Verification

- `yarn jest test/openai-image.test.ts --runInBand`
- `yarn jest test/stream-fetch.test.ts --runInBand`
- `npx tsc --noEmit --pretty false`
- `git diff --check`
- `yarn lint`
- `yarn build`

## Follow-Up: Vercel Hobby Cap

- Commit `4892beda` set image route `maxDuration = 600`, which Vercel Hobby rejects because Hobby Serverless Functions are capped at 300 seconds.
- Follow-up commit `977d87eb` restores `maxDuration = 300`, aligns the client image timeout to 300 seconds, and keeps the generic OpenAI proxy internal timeout at 10 minutes so non-image OpenAI routes are not shortened by the Hobby cap.
- Added test coverage that reads `app/api/openai/v1/images/[action]/route.ts` and guards against reintroducing `maxDuration = 600`.

## Browser QA

- Not run. This slice changes API/proxy timeout handling and unit/build coverage exercises the affected request construction and route compilation paths.

## Risks And Next

- If live `gpt-image-2` requests still exceed 300 seconds on Vercel Hobby, the next slice should use Image API streaming/background handling or move the route to a deployment plan/runtime with a higher hard cap rather than extending local timers again.
