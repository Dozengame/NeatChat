import fs from "node:fs";
import path from "node:path";

const chatStoreSource = () =>
  fs.readFileSync(path.join(process.cwd(), "app/store/chat.ts"), "utf8");

describe("chat store persistence scheduling", () => {
  test("keeps semantic persistence off the synchronous serialization path", () => {
    const source = chatStoreSource();

    expect(source).toMatch(
      /function flushChatPersistence\(\)[\s\S]*?chatPersistStorage\.scheduleFlush\(\s*StoreKey\.Chat/,
    );
    expect(source).toMatch(
      /function flushChatPersistenceNow\(\)[\s\S]*?chatPersistStorage\.flushNow\(StoreKey\.Chat/,
    );
    expect(source).toMatch(
      /addEventListener\("pagehide", flushChatPersistenceNow\)/,
    );
    expect(source).toMatch(
      /visibilityState === "hidden"[\s\S]*?flushChatPersistenceNow\(\)/,
    );

    const semanticFlushCalls = source.match(/flushChatPersistence\(\);/g);
    expect(semanticFlushCalls?.length).toBeGreaterThanOrEqual(5);
  });

  test("cancels pending chat persistence before clearing storage", () => {
    const source = chatStoreSource();
    const clearAllData = source.slice(
      source.indexOf("async clearAllData()"),
      source.indexOf("setLastInput", source.indexOf("async clearAllData()")),
    );

    expect(clearAllData).toMatch(
      /await chatPersistStorage\.removeItem\(StoreKey\.Chat\);[\s\S]*await indexedDBStorage\.clear\(\);[\s\S]*localStorage\.clear\(\);[\s\S]*location\.reload\(\);/,
    );
  });
});
