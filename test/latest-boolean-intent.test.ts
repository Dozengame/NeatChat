import { createLatestBooleanIntent } from "../app/utils/latest-boolean-intent";
import fs from "node:fs";
import path from "node:path";

describe("latest boolean intent", () => {
  test("ignores stale async completions and preserves the newest requested value", () => {
    const intent = createLatestBooleanIntent(false);

    const enable = intent.next();
    const disable = intent.next();

    expect(enable.value).toBe(true);
    expect(disable.value).toBe(false);
    expect(intent.settle(enable.token, true)).toBe(false);
    expect(intent.settle(disable.token, true)).toBe(true);
    expect(intent.value()).toBe(false);

    expect(intent.next().value).toBe(true);
  });

  test("restores the last committed value when the latest request fails", () => {
    const intent = createLatestBooleanIntent(false);
    const enable = intent.next();

    expect(intent.settle(enable.token, false)).toBe(true);
    expect(intent.value()).toBe(false);
    expect(intent.next().value).toBe(true);
  });

  test("falls back to the last successfully applied value after a stale side effect", () => {
    const intent = createLatestBooleanIntent(false);
    const enable = intent.next();
    const disable = intent.next();

    intent.markApplied(enable.value);
    expect(intent.settle(enable.token, true)).toBe(false);
    expect(intent.settle(disable.token, false)).toBe(true);

    expect(intent.value()).toBe(true);
    expect(intent.next().value).toBe(false);
  });

  test("does not let prop synchronization overwrite an in-flight intent", () => {
    const intent = createLatestBooleanIntent(false);
    const enable = intent.next();

    intent.syncCommitted(false);
    expect(intent.value()).toBe(true);

    expect(intent.settle(enable.token, true)).toBe(true);
    intent.syncCommitted(true);
    expect(intent.value()).toBe(true);
  });

  test("coordinates the image-generation control through the latest intent", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/components/chat.tsx"),
      "utf8",
    );

    expect(source).toContain("createLatestBooleanIntent");
    expect(source).toContain("imageGenerationIntent.next()");
    expect(source).toContain("imageGenerationOperationRef.current");
    expect(source).toContain("reconcileImageGenerationIntent(intent)");
    expect(source).toContain("imageGenerationIntent.isCurrent(intent.token)");
    expect(source).toContain("imageGenerationIntent.markApplied(intent.value)");
    expect(source).toContain("imageGenerationPending");
    expect(source).toContain("ariaBusy={imageGenerationPending}");
    expect(source).toContain("<LoadingButtonIcon />");
    expect(source).toContain(
      "imageGenerationIntent.settle(intent.token, true)",
    );
    expect(source).toMatch(
      /markApplied\(intent\.value\);[\s\S]*?resetMcpCache\(\);[\s\S]*?if \(!isCurrentIntent\(\)\) return false;/,
    );
    expect(source).toMatch(
      /settle\(intent\.token, false\)[\s\S]*?setImageGenerationEnabled\(imageGenerationIntent\.value\(\)\)/,
    );
    expect(source).not.toContain("deactivateMcpClient(JIMENG_MCP_SERVER_ID)");
    expect(source).not.toContain(
      "setImageGenerationMode(!props.imageGenerationEnabled)",
    );
  });
});
