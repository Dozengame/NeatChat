jest.mock("../app/mcp/actions", () => ({
  executeMcpAction: jest.fn(),
  getAllTools: jest.fn(() => Promise.resolve([])),
  getMcpChatServerStates: jest.fn(() => Promise.resolve({})),
  initializeMcpSystem: jest.fn(() => Promise.resolve()),
  isMcpEnabled: jest.fn(() => Promise.resolve(false)),
}));

jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));

jest.mock("../app/client/api", () => ({
  getHeaders: () => ({}),
  getClientApi: jest.fn(),
  ClientApi: jest.fn(),
}));

import { useChatStore } from "../app/store/chat";

describe("chat store rendering revisions", () => {
  beforeEach(() => {
    useChatStore.setState({
      sessions: [],
      temporarySession: undefined,
      currentSessionIndex: -1,
      lastInput: "",
      sessionListRevision: 0,
      messageProjectionRevision: 0,
    } as any);
  });

  test("does not invalidate list metadata or the full message projection for tail-only stream updates", () => {
    const store = useChatStore.getState() as any;
    store.newSession();
    const session = (
      useChatStore.getState() as any
    ).ensureCurrentSessionSaved();

    (useChatStore.getState() as any).updateTargetSession(
      session,
      (target: any) => {
        target.messages = target.messages.concat({
          id: "assistant-1",
          date: new Date(0).toISOString(),
          role: "assistant",
          content: "a",
          streaming: true,
        });
      },
    );

    const beforeStream = useChatStore.getState() as any;
    const listRevision = beforeStream.sessionListRevision;
    const projectionRevision = beforeStream.messageProjectionRevision;

    beforeStream.updateTargetSession(
      session,
      (target: any) => {
        target.messages.at(-1).content = "ab";
        target.messages = target.messages.concat();
      },
      { renderScope: "tail", tailMessageId: "assistant-1" },
    );

    const afterStream = useChatStore.getState() as any;
    expect(afterStream.sessionListRevision).toBe(listRevision);
    expect(afterStream.messageProjectionRevision).toBe(projectionRevision);
  });

  test("invalidates the message projection when a concurrent stream is no longer the tail", () => {
    const store = useChatStore.getState() as any;
    store.newSession();
    const session = (
      useChatStore.getState() as any
    ).ensureCurrentSessionSaved();

    (useChatStore.getState() as any).updateTargetSession(
      session,
      (target: any) => {
        target.messages = target.messages.concat(
          {
            id: "assistant-1",
            date: new Date(0).toISOString(),
            role: "assistant",
            content: "a",
            streaming: true,
          },
          {
            id: "assistant-2",
            date: new Date(1).toISOString(),
            role: "assistant",
            content: "b",
            streaming: true,
          },
        );
      },
    );
    const beforeStream = useChatStore.getState() as any;
    const listRevision = beforeStream.sessionListRevision;
    const projectionRevision = beforeStream.messageProjectionRevision;

    beforeStream.updateTargetSession(
      session,
      (target: any) => {
        target.messages[0].content = "ab";
        target.messages = target.messages.concat();
      },
      { renderScope: "tail", tailMessageId: "assistant-1" },
    );

    const afterStream = useChatStore.getState() as any;
    expect(afterStream.sessionListRevision).toBe(listRevision);
    expect(afterStream.messageProjectionRevision).toBe(
      projectionRevision + 1,
    );
  });

  test("invalidates sidebar metadata for count, title and ordering changes", () => {
    const store = useChatStore.getState() as any;
    store.newSession();
    const session = (
      useChatStore.getState() as any
    ).ensureCurrentSessionSaved();
    const savedRevision = (useChatStore.getState() as any).sessionListRevision;

    (useChatStore.getState() as any).updateTargetSession(
      session,
      (target: any) => {
        target.messages = target.messages.concat({
          id: "user-1",
          date: new Date(0).toISOString(),
          role: "user",
          content: "hello",
        });
      },
    );
    const countRevision = (useChatStore.getState() as any).sessionListRevision;
    expect(countRevision).toBeGreaterThan(savedRevision);

    (useChatStore.getState() as any).updateTargetSession(
      session,
      (target: any) => {
        target.topic = "Renamed";
      },
    );
    expect(
      (useChatStore.getState() as any).sessionListRevision,
    ).toBeGreaterThan(countRevision);
  });
});
