jest.mock("@fortaine/fetch-event-source", () => ({
  EventStreamContentType: "text/event-stream",
  fetchEventSource: jest.fn(),
}));

import { fetchEventSource } from "@fortaine/fetch-event-source";
import { stream } from "../app/utils/chat";

const mockedFetchEventSource = fetchEventSource as jest.Mock;

async function flushPromises() {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
}

describe("shared chat stream terminal cleanup", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedFetchEventSource.mockReset();
    globalThis.requestAnimationFrame = jest.fn() as any;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function startStream(
    controller: AbortController,
    options: Record<string, any>,
  ) {
    stream(
      "/api/chat",
      { messages: [] },
      {},
      [],
      {},
      controller,
      () => undefined,
      () => undefined,
      options,
      1_000,
    );
  }

  test("reports a connection rejection once and clears its timeout", async () => {
    const error = new Error("connection failed");
    mockedFetchEventSource.mockRejectedValue(error);
    const onError = jest.fn();
    const onFinish = jest.fn();

    startStream(new AbortController(), { onError, onFinish });
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
    expect(onFinish).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  test("does not report a second error after a user abort", async () => {
    let rejectRequest!: (error: Error) => void;
    mockedFetchEventSource.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );
    const controller = new AbortController();
    const onError = jest.fn();
    const onFinish = jest.fn();

    startStream(controller, { onError, onFinish });
    controller.abort();
    rejectRequest(new Error("aborted"));
    await flushPromises();

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
