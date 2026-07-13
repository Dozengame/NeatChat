import { ChatSession, useChatStore } from "../store/chat";
import { useAccessStore } from "../store/access";
import { useAppConfig } from "../store/config";
import { useMaskStore } from "../store/mask";
import { usePromptStore } from "../store/prompt";
import { StoreKey } from "../constant";

function cloneSyncState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const UNSAFE_SYNC_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function isPlainSyncObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneSyncValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneSyncValue(item)) as T;
  }
  if (!isPlainSyncObject(value)) {
    return value;
  }

  const clone: Record<string, unknown> = {};
  Object.keys(value).forEach((key) => {
    if (UNSAFE_SYNC_KEYS.has(key)) {
      throw new Error(`Unsafe object key: ${key}`);
    }
    clone[key] = cloneSyncValue(value[key]);
  });
  return clone as T;
}

function mergePreferredSyncValue<T>(fallback: T, preferred: T): T {
  if (!isPlainSyncObject(preferred)) {
    return cloneSyncValue(preferred);
  }

  const merged = isPlainSyncObject(fallback)
    ? cloneSyncValue(fallback)
    : ({} as Record<string, unknown>);
  Object.keys(preferred).forEach((key) => {
    if (UNSAFE_SYNC_KEYS.has(key)) {
      throw new Error(`Unsafe object key: ${key}`);
    }
    merged[key] = mergePreferredSyncValue(
      isPlainSyncObject(fallback) ? fallback[key] : undefined,
      preferred[key],
    );
  });
  return merged as T;
}

type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
}[keyof T];
type NonFunctionFields<T> = Pick<T, NonFunctionKeys<T>>;

export function getNonFunctionFileds<T extends object>(obj: T) {
  const ret: any = {};

  Object.entries(obj).map(([k, v]) => {
    if (typeof v !== "function") {
      ret[k] = v;
    }
  });

  return ret as NonFunctionFields<T>;
}

export type GetStoreState<T> = T extends { getState: () => infer U }
  ? NonFunctionFields<U>
  : never;

const LocalStateSetters = {
  [StoreKey.Chat]: useChatStore.setState,
  [StoreKey.Access]: useAccessStore.setState,
  [StoreKey.Config]: useAppConfig.setState,
  [StoreKey.Mask]: useMaskStore.setState,
  [StoreKey.Prompt]: usePromptStore.setState,
} as const;

const LocalStateGetters = {
  [StoreKey.Chat]: () => getNonFunctionFileds(useChatStore.getState()),
  [StoreKey.Access]: () => getNonFunctionFileds(useAccessStore.getState()),
  [StoreKey.Config]: () => getNonFunctionFileds(useAppConfig.getState()),
  [StoreKey.Mask]: () => getNonFunctionFileds(useMaskStore.getState()),
  [StoreKey.Prompt]: () => getNonFunctionFileds(usePromptStore.getState()),
} as const;

export type AppState = {
  [k in keyof typeof LocalStateGetters]: ReturnType<
    (typeof LocalStateGetters)[k]
  >;
};

type Merger<T extends keyof AppState, U = AppState[T]> = (
  localState: U,
  remoteState: U,
) => U;

type StateMerger = {
  [K in keyof AppState]: Merger<K>;
};

// we merge remote state to local state
const MergeStates: StateMerger = {
  [StoreKey.Chat]: (localState, remoteState) => {
    const nextState = cloneSyncState(localState);
    const selectedSessionId =
      nextState.currentSessionIndex >= 0
        ? nextState.sessions[nextState.currentSessionIndex]?.id
        : undefined;
    // merge sessions
    const localSessions: Record<string, ChatSession> = {};
    nextState.sessions.forEach((s) => (localSessions[s.id] = s));

    (remoteState.sessions ?? []).forEach((remoteSession) => {
      // skip empty chats
      if (remoteSession.messages.length === 0) return;

      const localSession = localSessions[remoteSession.id];
      if (!localSession) {
        // if remote session is new, just merge it
        const detachedSession = cloneSyncState(remoteSession);
        nextState.sessions.push(detachedSession);
        localSessions[detachedSession.id] = detachedSession;
      } else {
        // if both have the same session id, merge the messages
        const localMessageIds = new Set(localSession.messages.map((v) => v.id));
        remoteSession.messages.forEach((m) => {
          if (!localMessageIds.has(m.id)) {
            localSession.messages.push(cloneSyncState(m));
          }
        });

        // sort local messages with date field in asc order
        localSession.messages.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
      }
    });

    // sort local sessions with date field in desc order
    nextState.sessions.sort(
      (a, b) =>
        new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime(),
    );

    if (selectedSessionId) {
      const selectedIndex = nextState.sessions.findIndex(
        (session) => session.id === selectedSessionId,
      );
      if (selectedIndex >= 0) {
        nextState.currentSessionIndex = selectedIndex;
      }
    }

    nextState.sessionListRevision = (localState.sessionListRevision ?? 0) + 1;
    nextState.messageProjectionRevision =
      (localState.messageProjectionRevision ?? 0) + 1;

    return nextState;
  },
  [StoreKey.Prompt]: (localState, remoteState) => {
    return {
      ...localState,
      prompts: {
        ...remoteState.prompts,
        ...localState.prompts,
      },
    };
  },
  [StoreKey.Mask]: (localState, remoteState) => {
    return {
      ...localState,
      masks: {
        ...remoteState.masks,
        ...localState.masks,
      },
    };
  },
  [StoreKey.Config]: mergeWithUpdate<AppState[StoreKey.Config]>,
  [StoreKey.Access]: mergeWithUpdate<AppState[StoreKey.Access]>,
};

export function getLocalAppState() {
  const appState = Object.fromEntries(
    Object.entries(LocalStateGetters).map(([key, getter]) => {
      return [key, cloneSyncState(getter())];
    }),
  ) as AppState;

  return appState;
}

export function setLocalAppState(appState: AppState) {
  Object.entries(LocalStateSetters).forEach(([key, setter]) => {
    setter(appState[key as keyof AppState]);
  });
}

export function mergeAppState(localState: AppState, remoteState: AppState) {
  Object.keys(localState).forEach(<T extends keyof AppState>(k: string) => {
    const key = k as T;
    const localStoreState = localState[key];
    const remoteStoreState = remoteState?.[key];
    if (!remoteStoreState) return;
    (localState as any)[key] = MergeStates[key](
      localStoreState as any,
      remoteStoreState as any,
    );
  });

  return localState;
}

/**
 * Merge state with `lastUpdateTime`, older state will be override
 */
export function mergeWithUpdate<T extends { lastUpdateTime?: number }>(
  localState: T,
  remoteState: T,
) {
  const localUpdateTime = localState.lastUpdateTime ?? 0;
  const remoteUpdateTime = remoteState.lastUpdateTime ?? 0;

  if (localUpdateTime < remoteUpdateTime) {
    return mergePreferredSyncValue(localState, remoteState);
  } else {
    return mergePreferredSyncValue(remoteState, localState);
  }
}
