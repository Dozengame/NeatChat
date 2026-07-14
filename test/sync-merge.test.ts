jest.mock("nanoid", () => ({ nanoid: () => "sync-test-id" }));
jest.mock("../app/mcp/actions", () => ({
  executeMcpAction: jest.fn(),
  getAllTools: jest.fn(() => Promise.resolve([])),
  getMcpChatServerStates: jest.fn(() => Promise.resolve({})),
  initializeMcpSystem: jest.fn(() => Promise.resolve()),
  isMcpEnabled: jest.fn(() => Promise.resolve(false)),
}));
jest.mock("../app/store/chat", () => ({
  useChatStore: {
    getState: () => ({
      sessions: [],
      currentSessionIndex: -1,
      sessionListRevision: 0,
      messageProjectionRevision: 0,
    }),
    setState: jest.fn(),
  },
}));
jest.mock("../app/store/access", () => ({
  useAccessStore: {
    getState: () => ({ lastUpdateTime: 0 }),
    setState: jest.fn(),
  },
}));
jest.mock("../app/store/config", () => ({
  useAppConfig: {
    getState: () => ({ lastUpdateTime: 0 }),
    setState: jest.fn(),
  },
}));
jest.mock("../app/store/mask", () => ({
  useMaskStore: {
    getState: () => ({ masks: {} }),
    setState: jest.fn(),
  },
}));
jest.mock("../app/store/prompt", () => ({
  usePromptStore: {
    getState: () => ({ prompts: {} }),
    setState: jest.fn(),
  },
}));

import { StoreKey } from "../app/constant";
import { merge } from "../app/utils/merge";
import { mergeAppState, mergeWithUpdate } from "../app/utils/sync";

function chatSession(id: string, lastUpdate: number, messageIds: string[]) {
  return {
    id,
    topic: id,
    memoryPrompt: "",
    messages: messageIds.map((messageId) => ({
      id: messageId,
      date: new Date(lastUpdate).toISOString(),
      role: "user",
      content: messageId,
    })),
    stat: { tokenCount: 0, wordCount: 0, charCount: 0 },
    lastUpdate,
    lastSummarizeIndex: 0,
    mask: { context: [], modelConfig: {} },
  };
}

describe("sync state merge", () => {
  test("rejects prototype-pollution keys", () => {
    delete (Object.prototype as any).neatPolluted;
    const payload = JSON.parse(
      '{"constructor":{"prototype":{"neatPolluted":"yes"}}}',
    );

    expect(() => merge({}, payload)).toThrow("Unsafe object key");
    expect(({} as any).neatPolluted).toBeUndefined();
  });

  test("uses the state with the latest update timestamp", () => {
    expect(
      mergeWithUpdate(
        { lastUpdateTime: 20, value: "local" },
        { lastUpdateTime: 10, value: "remote" },
      ),
    ).toMatchObject({ value: "local", lastUpdateTime: 20 });
    expect(
      mergeWithUpdate(
        { lastUpdateTime: 10, value: "local" },
        { lastUpdateTime: 20, value: "remote" },
      ),
    ).toMatchObject({ value: "remote", lastUpdateTime: 20 });
  });

  test("fills nested defaults while preserving the latest state as winner", () => {
    const merged = mergeWithUpdate(
      {
        lastUpdateTime: 10,
        modelConfig: {
          model: "local-model",
          reasoningEffort: "medium",
          max_output_tokens: 4096,
          nested: { retained: true, winner: "local" },
        },
        models: ["local-a", "local-b"],
      },
      {
        lastUpdateTime: 20,
        modelConfig: {
          model: "remote-model",
          nested: { winner: "remote" },
        },
        models: ["remote-only"],
      } as any,
    ) as any;

    expect(merged.modelConfig).toEqual({
      model: "remote-model",
      reasoningEffort: "medium",
      max_output_tokens: 4096,
      nested: { retained: true, winner: "remote" },
    });
    expect(merged.models).toEqual(["remote-only"]);
  });

  test("rejects unsafe nested keys from either sync candidate", () => {
    const unsafeRemote = JSON.parse(
      '{"lastUpdateTime":20,"modelConfig":{"__proto__":{"polluted":true}}}',
    );

    expect(() =>
      mergeWithUpdate(
        { lastUpdateTime: 10, modelConfig: { model: "safe" } },
        unsafeRemote,
      ),
    ).toThrow("Unsafe object key");
    expect(({} as any).polluted).toBeUndefined();
  });

  test("preserves selected chat identity and advances render revisions", () => {
    const selected = chatSession("selected", 10, ["local-message"]);
    const localState = {
      [StoreKey.Chat]: {
        sessions: [selected, chatSession("newer-local", 20, [])],
        currentSessionIndex: 0,
        sessionListRevision: 4,
        messageProjectionRevision: 7,
      },
      [StoreKey.Access]: { lastUpdateTime: 20, value: "local-access" },
      [StoreKey.Config]: { lastUpdateTime: 20, value: "local-config" },
      [StoreKey.Mask]: { masks: {} },
      [StoreKey.Prompt]: { prompts: {} },
    } as any;
    const remoteSession = chatSession("remote", 30, ["remote-message"]);
    const remoteState = {
      [StoreKey.Chat]: {
        sessions: [remoteSession],
        currentSessionIndex: 0,
      },
      [StoreKey.Access]: { lastUpdateTime: 10, value: "remote-access" },
      [StoreKey.Config]: { lastUpdateTime: 10, value: "remote-config" },
      [StoreKey.Mask]: { masks: {} },
      [StoreKey.Prompt]: { prompts: {} },
    } as any;

    const merged = mergeAppState(localState, remoteState) as any;
    const mergedChat = merged[StoreKey.Chat];

    expect(mergedChat.sessions[mergedChat.currentSessionIndex].id).toBe(
      "selected",
    );
    expect(mergedChat.sessions.map((session: any) => session.id)).toEqual([
      "remote",
      "newer-local",
      "selected",
    ]);
    expect(mergedChat.sessionListRevision).toBe(5);
    expect(mergedChat.messageProjectionRevision).toBe(8);
    expect(merged[StoreKey.Config].value).toBe("local-config");
    expect(merged[StoreKey.Access].value).toBe("local-access");

    mergedChat.sessions[0].topic = "changed";
    expect(remoteSession.topic).toBe("remote");
  });
});
