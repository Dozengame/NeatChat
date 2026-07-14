import type { StateStorage, StorageValue } from "zustand/middleware";
import { createTrailingThrottledJSONStorage } from "../app/utils/chat-persist-storage";
import fs from "fs";
import path from "path";

type PersistedChat = { revision: number; content: string };

function createStateStorage() {
  const values = new Map<string, string>();
  const storage: jest.Mocked<StateStorage> = {
    getItem: jest.fn(async (name) => values.get(name) ?? null),
    setItem: jest.fn(async (name, value) => {
      values.set(name, value);
    }),
    removeItem: jest.fn(async (name) => {
      values.delete(name);
    }),
  };
  return { storage, values };
}

function value(revision: number): StorageValue<PersistedChat> {
  return {
    version: 1,
    state: { revision, content: `content-${revision}` },
  };
}

describe("chat trailing-throttled JSON persistence", () => {
  test("wires terminal persistence failures to a one-time user-visible warning", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/store/chat.ts"),
      "utf8",
    );
    expect(source).toContain("onError: () => {");
    expect(source).toContain("showToast(Locale.Chat.PersistenceFailed)");
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("serializes and writes only the latest value once per fixed 250ms window", async () => {
    const { storage, values } = createStateStorage();
    const serialize = jest.fn(JSON.stringify);
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      {
        intervalMs: 250,
        serialize,
      },
    );

    for (let revision = 1; revision <= 100; revision += 1) {
      throttled.setItem("chat", value(revision));
    }

    jest.advanceTimersByTime(249);
    expect(serialize).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await throttled.flushNow("chat");

    expect(serialize).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(values.get("chat")!)).toEqual(value(100));
  });

  test("does not reset the deadline while updates keep arriving", async () => {
    const { storage } = createStateStorage();
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      {
        intervalMs: 250,
      },
    );

    throttled.setItem("chat", value(1));
    jest.advanceTimersByTime(100);
    throttled.setItem("chat", value(2));
    jest.advanceTimersByTime(100);
    throttled.setItem("chat", value(3));
    jest.advanceTimersByTime(50);
    await throttled.flushNow("chat");

    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toEqual(value(3));
  });

  test("defers background serialization until the browser is idle", async () => {
    const originalRequestIdleCallback = (globalThis as any).requestIdleCallback;
    const originalCancelIdleCallback = (globalThis as any).cancelIdleCallback;
    let idleCallback!: () => void;
    (globalThis as any).requestIdleCallback = jest.fn((callback) => {
      idleCallback = callback;
      return 1;
    });
    (globalThis as any).cancelIdleCallback = jest.fn();
    const { storage } = createStateStorage();
    const serialize = jest.fn(JSON.stringify);
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      { intervalMs: 100, serialize },
    );

    throttled.setItem("chat", value(1));
    jest.advanceTimersByTime(100);
    expect(serialize).not.toHaveBeenCalled();

    idleCallback();
    await throttled.flushNow("chat");
    expect(serialize).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledTimes(1);

    (globalThis as any).requestIdleCallback = originalRequestIdleCallback;
    (globalThis as any).cancelIdleCallback = originalCancelIdleCallback;
  });

  test("schedules a semantic flush without serializing in the caller stack", async () => {
    const originalRequestIdleCallback = (globalThis as any).requestIdleCallback;
    const originalCancelIdleCallback = (globalThis as any).cancelIdleCallback;
    let idleCallback!: () => void;
    const requestIdleCallback = jest.fn((callback, options) => {
      idleCallback = callback;
      return 7;
    });
    (globalThis as any).requestIdleCallback = requestIdleCallback;
    (globalThis as any).cancelIdleCallback = jest.fn();
    const { storage } = createStateStorage();
    const serialize = jest.fn(JSON.stringify);
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      { intervalMs: 1000, serialize },
    );

    throttled.setItem("chat", value(1));
    throttled.scheduleFlush("chat", 200);

    expect(serialize).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 200,
    });

    idleCallback();
    await Promise.resolve();
    await Promise.resolve();
    expect(serialize).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledTimes(1);

    (globalThis as any).requestIdleCallback = originalRequestIdleCallback;
    (globalThis as any).cancelIdleCallback = originalCancelIdleCallback;
  });

  test("rejects pre-hydration snapshots before serialization", async () => {
    const { storage } = createStateStorage();
    const serialize = jest.fn(JSON.stringify);
    const throttled = createTrailingThrottledJSONStorage<any>(storage, {
      intervalMs: 100,
      serialize,
      shouldPersist: (entry) => entry.state?._hasHydrated === true,
    });

    throttled.setItem("chat", {
      version: 1,
      state: { _hasHydrated: false, content: "default" },
    });
    jest.advanceTimersByTime(100);
    await throttled.flushNow("chat");

    expect(serialize).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  test("backs off after observing a multi-megabyte serialized state", async () => {
    const { storage } = createStateStorage();
    const serialized = "x".repeat(5 * 1024 * 1024);
    const serialize = jest.fn(() => serialized);
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      { intervalMs: 100, serialize },
    );

    throttled.setItem("chat", value(1));
    await throttled.flushNow("chat");
    throttled.setItem("chat", value(2));

    jest.advanceTimersByTime(199);
    expect(serialize).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    await jest.runOnlyPendingTimersAsync();
    await throttled.flushNow("chat");
    expect(serialize).toHaveBeenCalledTimes(2);
  });

  test("flush writes the latest value immediately and cancels the timer", async () => {
    const { storage } = createStateStorage();
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      {
        intervalMs: 250,
      },
    );

    throttled.setItem("chat", value(7));
    await throttled.flushNow("chat");
    expect(storage.setItem).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(250);
    await throttled.flushNow("chat");
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  test("serializes newer flushes immediately but commits them after older writes", async () => {
    const writes: string[] = [];
    let releaseFirstWrite!: () => void;
    const firstWrite = new Promise<void>((resolve) => {
      releaseFirstWrite = resolve;
    });
    const storage: StateStorage = {
      getItem: jest.fn(async () => null),
      setItem: jest
        .fn()
        .mockImplementationOnce(async (_name: string, serialized: string) => {
          writes.push(serialized);
          await firstWrite;
        })
        .mockImplementation(async (_name: string, serialized: string) => {
          writes.push(serialized);
        }),
      removeItem: jest.fn(async () => undefined),
    };
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      {
        intervalMs: 250,
      },
    );

    throttled.setItem("chat", value(1));
    const olderFlush = throttled.flushNow("chat");
    await Promise.resolve();
    throttled.setItem("chat", value(2));
    const newerFlush = throttled.flushNow("chat");
    await Promise.resolve();

    expect(storage.setItem).toHaveBeenCalledTimes(1);
    releaseFirstWrite();
    await Promise.all([olderFlush, newerFlush]);

    expect(storage.setItem).toHaveBeenCalledTimes(2);
    expect(writes.map((entry) => JSON.parse(entry))).toEqual([
      value(1),
      value(2),
    ]);
  });

  test("does not requeue an older failed snapshot after a newer flush is queued", async () => {
    const values = new Map<string, string>();
    const writes: string[] = [];
    let rejectFirstWrite!: (error: Error) => void;
    const firstWrite = new Promise<void>((_resolve, reject) => {
      rejectFirstWrite = reject;
    });
    let writeCount = 0;
    const storage: StateStorage = {
      getItem: jest.fn(async (name) => values.get(name) ?? null),
      setItem: jest.fn(async (name, serialized) => {
        writeCount += 1;
        writes.push(serialized);
        if (writeCount === 1) {
          await firstWrite;
        }
        values.set(name, serialized);
      }),
      removeItem: jest.fn(async (name) => {
        values.delete(name);
      }),
    };
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      { intervalMs: 250, retryDelayMs: 10 },
    );

    throttled.setItem("chat", value(1));
    const olderFlush = throttled.flushNow("chat");
    await Promise.resolve();
    throttled.setItem("chat", value(2));
    const newerFlush = throttled.flushNow("chat");
    await Promise.resolve();

    rejectFirstWrite(new Error("older write failed"));
    await expect(olderFlush).rejects.toThrow("older write failed");
    await expect(newerFlush).resolves.toBeUndefined();
    await jest.runAllTimersAsync();
    await throttled.flushNow("chat");

    expect(writes.map((entry) => JSON.parse(entry))).toEqual([
      value(1),
      value(2),
    ]);
    await expect(throttled.getItem("chat")).resolves.toEqual(value(2));
  });

  test("remove cancels pending data so it cannot be written after deletion", async () => {
    const { storage } = createStateStorage();
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      {
        intervalMs: 250,
      },
    );

    throttled.setItem("chat", value(1));
    await throttled.removeItem("chat");
    jest.advanceTimersByTime(250);
    await throttled.flushNow("chat");

    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).toHaveBeenCalledWith("chat");
  });

  test("suspends writes that race with a destructive clear", async () => {
    let releaseRemove!: () => void;
    const removing = new Promise<void>((resolve) => {
      releaseRemove = resolve;
    });
    const { storage, values } = createStateStorage();
    storage.removeItem.mockImplementationOnce(async (name) => {
      await removing;
      values.delete(name);
    });
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      { intervalMs: 250 },
    );

    throttled.setItem("chat", value(1));
    throttled.suspendWrites("chat");
    const clear = throttled.removeItem("chat");
    throttled.setItem("chat", value(2));
    throttled.scheduleFlush("chat", 1);
    releaseRemove();
    await clear;
    jest.advanceTimersByTime(1000);
    await throttled.flushNow("chat");

    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).toHaveBeenCalledWith("chat");
    expect(values.has("chat")).toBe(false);
    await expect(throttled.getItem("chat")).resolves.toBeNull();
  });

  test("recovers after a failed write without poisoning the next write chain", async () => {
    const storage: StateStorage = {
      getItem: jest.fn(async () => null),
      setItem: jest
        .fn()
        .mockRejectedValueOnce(new Error("indexeddb write failed"))
        .mockResolvedValue(undefined),
      removeItem: jest.fn(async () => undefined),
    };
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      {
        intervalMs: 250,
      },
    );

    throttled.setItem("chat", value(1));
    await expect(throttled.flushNow("chat")).rejects.toThrow(
      "indexeddb write failed",
    );

    throttled.setItem("chat", value(2));
    await expect(throttled.flushNow("chat")).resolves.toBeUndefined();

    expect(storage.setItem).toHaveBeenCalledTimes(2);
    expect(JSON.parse((storage.setItem as jest.Mock).mock.calls[1][1])).toEqual(
      value(2),
    );
  });

  test("keeps the latest snapshot for a bounded retry and reports terminal failure once", async () => {
    const onError = jest.fn();
    const storage: StateStorage = {
      getItem: jest.fn(async () => null),
      setItem: jest
        .fn()
        .mockRejectedValueOnce(new Error("temporary failure"))
        .mockRejectedValueOnce(new Error("terminal failure")),
      removeItem: jest.fn(async () => undefined),
    };
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      { intervalMs: 10, maxRetries: 1, retryDelayMs: 10, onError },
    );

    throttled.setItem("chat", value(1));
    await expect(throttled.flushNow("chat")).rejects.toThrow(
      "temporary failure",
    );
    throttled.setItem("chat", value(2));
    await expect(throttled.flushNow("chat")).rejects.toThrow(
      "terminal failure",
    );

    expect(onError).toHaveBeenCalledTimes(1);
    await expect(throttled.getItem("chat")).resolves.toEqual(value(2));
    jest.advanceTimersByTime(1000);
    expect(storage.setItem).toHaveBeenCalledTimes(2);
  });

  test("does not resurrect a failed in-flight write after remove", async () => {
    let rejectWrite!: (error: Error) => void;
    const failedWrite = new Promise<void>((_resolve, reject) => {
      rejectWrite = reject;
    });
    const storage: StateStorage = {
      getItem: jest.fn(async () => null),
      setItem: jest.fn(() => failedWrite),
      removeItem: jest.fn(async () => undefined),
    };
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      { intervalMs: 10, retryDelayMs: 10 },
    );

    throttled.setItem("chat", value(1));
    const flush = throttled.flushNow("chat");
    await Promise.resolve();
    const remove = throttled.removeItem("chat");
    rejectWrite(new Error("write failed during remove"));

    await expect(flush).rejects.toThrow("write failed during remove");
    await expect(remove).resolves.toBeUndefined();
    await jest.runAllTimersAsync();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.removeItem).toHaveBeenCalledTimes(1);
    await expect(throttled.getItem("chat")).resolves.toBeNull();

    (storage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
    throttled.setItem("chat", value(2));
    await expect(throttled.flushNow("chat")).resolves.toBeUndefined();
    expect(storage.setItem).toHaveBeenCalledTimes(2);
  });

  test("does not requeue a failed write after writes are suspended", async () => {
    let rejectWrite!: (error: Error) => void;
    const failedWrite = new Promise<void>((_resolve, reject) => {
      rejectWrite = reject;
    });
    const storage: StateStorage = {
      getItem: jest.fn(async () => null),
      setItem: jest.fn(() => failedWrite),
      removeItem: jest.fn(async () => undefined),
    };
    const throttled = createTrailingThrottledJSONStorage<PersistedChat>(
      storage,
      { intervalMs: 10, retryDelayMs: 10 },
    );

    throttled.setItem("chat", value(1));
    const flush = throttled.flushNow("chat");
    await Promise.resolve();
    throttled.suspendWrites("chat");
    rejectWrite(new Error("write failed after suspend"));

    await expect(flush).rejects.toThrow("write failed after suspend");
    await jest.runAllTimersAsync();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    await expect(throttled.getItem("chat")).resolves.toBeNull();
  });
});
