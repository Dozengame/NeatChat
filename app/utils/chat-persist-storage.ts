import type {
  PersistStorage,
  StateStorage,
  StorageValue,
} from "zustand/middleware";

type ThrottledStorageOptions<S> = {
  intervalMs?: number;
  serialize?: (value: StorageValue<S>) => string;
  deserialize?: (value: string) => StorageValue<S>;
  shouldPersist?: (value: StorageValue<S>) => boolean;
};

export type FlushablePersistStorage<S> = PersistStorage<S> & {
  scheduleFlush: (name?: string, deadlineMs?: number) => void;
  flushNow: (name?: string) => Promise<void>;
};

type PendingValue<S> = {
  value: StorageValue<S>;
  timer?: ReturnType<typeof setTimeout>;
  cancelIdle?: () => void;
  idleTimeoutMs?: number;
};

const LARGE_SERIALIZED_STATE_LENGTH = 5 * 1024 * 1024;
const VERY_LARGE_SERIALIZED_STATE_LENGTH = 20 * 1024 * 1024;

function scheduleIdleSerialization(callback: () => void, timeoutMs: number) {
  const idleHost = globalThis as typeof globalThis & {
    requestIdleCallback?: (
      callback: () => void,
      options?: { timeout: number },
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };
  if (idleHost.requestIdleCallback) {
    const handle = idleHost.requestIdleCallback(callback, {
      timeout: timeoutMs,
    });
    return () => idleHost.cancelIdleCallback?.(handle);
  }

  const handle = setTimeout(callback, 0);
  return () => clearTimeout(handle);
}

export function createTrailingThrottledJSONStorage<S>(
  storage: StateStorage,
  options: ThrottledStorageOptions<S> = {},
): FlushablePersistStorage<S> {
  const intervalMs = options.intervalMs ?? 250;
  const serialize = options.serialize ?? JSON.stringify;
  const deserialize = options.deserialize ?? JSON.parse;
  const shouldPersist = options.shouldPersist ?? (() => true);
  const pendingValues = new Map<string, PendingValue<S>>();
  const writeChains = new Map<string, Promise<void>>();
  const lastSerializedLengths = new Map<string, number>();

  const getInterval = (name: string) => {
    const serializedLength = lastSerializedLengths.get(name) ?? 0;
    if (serializedLength >= VERY_LARGE_SERIALIZED_STATE_LENGTH) {
      return intervalMs * 4;
    }
    if (serializedLength >= LARGE_SERIALIZED_STATE_LENGTH) {
      return intervalMs * 2;
    }
    return intervalMs;
  };

  const trackWrite = (name: string, write: Promise<void>) => {
    writeChains.set(name, write);
    const cleanup = () => {
      if (writeChains.get(name) === write) {
        writeChains.delete(name);
      }
    };
    void write.then(cleanup, cleanup);
    return write;
  };

  const flushOneNow = async (name: string) => {
    const pending = pendingValues.get(name);
    if (!pending) {
      await writeChains.get(name);
      return;
    }

    if (pending.timer !== undefined) {
      clearTimeout(pending.timer);
    }
    pending.cancelIdle?.();
    pending.idleTimeoutMs = undefined;
    pendingValues.delete(name);
    const serializedValue = serialize(pending.value);
    lastSerializedLengths.set(name, serializedValue.length);
    const previousWrite = writeChains.get(name) ?? Promise.resolve();
    const write = previousWrite
      .catch(() => undefined)
      .then(() => storage.setItem(name, serializedValue))
      .then(() => undefined);
    await trackWrite(name, write);
  };

  const flushNow = async (name?: string) => {
    if (name) {
      await flushOneNow(name);
      return;
    }

    const names = new Set([...pendingValues.keys(), ...writeChains.keys()]);
    await Promise.all(
      Array.from(names, (storageName) => flushOneNow(storageName)),
    );
  };

  const scheduleOne = (name: string, deadlineMs: number) => {
    const pending = pendingValues.get(name);
    if (!pending) return;
    if (
      pending.cancelIdle &&
      pending.idleTimeoutMs !== undefined &&
      pending.idleTimeoutMs <= deadlineMs
    ) {
      return;
    }

    if (pending.timer !== undefined) {
      clearTimeout(pending.timer);
      pending.timer = undefined;
    }
    pending.cancelIdle?.();
    pending.idleTimeoutMs = deadlineMs;
    pending.cancelIdle = scheduleIdleSerialization(() => {
      pending.cancelIdle = undefined;
      pending.idleTimeoutMs = undefined;
      void flushOneNow(name).catch(() => undefined);
    }, deadlineMs);
  };

  const scheduleFlush = (name?: string, deadlineMs = 250) => {
    if (name) {
      scheduleOne(name, deadlineMs);
      return;
    }
    pendingValues.forEach((_pending, storageName) => {
      scheduleOne(storageName, deadlineMs);
    });
  };

  return {
    async getItem(name) {
      const pending = pendingValues.get(name);
      if (pending) return pending.value;
      const serializedValue = await storage.getItem(name);
      return serializedValue === null ? null : deserialize(serializedValue);
    },
    setItem(name, value) {
      if (!shouldPersist(value)) return;
      const currentPending = pendingValues.get(name);
      if (currentPending) {
        currentPending.value = value;
        return;
      }

      const pending: PendingValue<S> = { value };
      pending.timer = setTimeout(() => {
        pending.timer = undefined;
        scheduleOne(name, getInterval(name));
      }, getInterval(name));
      pendingValues.set(name, pending);
    },
    async removeItem(name) {
      const pending = pendingValues.get(name);
      if (pending) {
        if (pending.timer !== undefined) {
          clearTimeout(pending.timer);
        }
        pending.cancelIdle?.();
        pending.idleTimeoutMs = undefined;
        pendingValues.delete(name);
      }
      lastSerializedLengths.delete(name);
      const previousWrite = writeChains.get(name) ?? Promise.resolve();
      const remove = previousWrite
        .catch(() => undefined)
        .then(() => storage.removeItem(name))
        .then(() => undefined);
      await trackWrite(name, remove);
    },
    scheduleFlush,
    flushNow,
  };
}
