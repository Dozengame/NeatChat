import fs from "fs";
import path from "path";

const chatSource = () =>
  fs.readFileSync(path.join(process.cwd(), "app/store/chat.ts"), "utf8");

describe("chat streaming persistence contract", () => {
  test("uses pre-serialization throttled persistence for the Chat store", () => {
    const source = chatSource();

    expect(source).toContain("createTrailingThrottledJSONStorage");
    expect(source).toContain("rawIndexedDBStorage");
    expect(source).toMatch(/storage:\s*chatPersistStorage/);
    expect(source).toMatch(/intervalMs:\s*1000/);
    expect(source).toContain('addEventListener("pagehide"');
    expect(source).toContain('visibilityState === "hidden"');
  });

  test("coalesces streaming UI notifications and flushes terminal state", () => {
    const source = chatSource();

    expect(source).toContain("createStreamUpdateCoalescer");
    expect(source).toContain("streamUpdateCoalescer.schedule()");
    expect(source).toContain("streamUpdateCoalescer.cancel()");
    expect(source).toContain("flushChatPersistence()");
  });
});
