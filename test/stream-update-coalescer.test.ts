import {
  createStreamUpdateCoalescer,
  getStreamUpdateInterval,
} from "../app/utils/stream-update-coalescer";

describe("stream update coalescer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("publishes the first update immediately and coalesces the rest", () => {
    const publish = jest.fn();
    const coalescer = createStreamUpdateCoalescer(publish, 50);

    for (let index = 0; index < 100; index += 1) {
      coalescer.schedule();
    }

    expect(publish).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);

    jest.advanceTimersByTime(50);
    expect(publish).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(0);
  });

  test("flushes the final pending update synchronously", () => {
    const publish = jest.fn();
    const coalescer = createStreamUpdateCoalescer(publish, 50);

    coalescer.schedule();
    coalescer.schedule();
    coalescer.flush();

    expect(publish).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(0);

    jest.advanceTimersByTime(50);
    expect(publish).toHaveBeenCalledTimes(2);
  });

  test("can cancel a pending render without publishing stale content", () => {
    const publish = jest.fn();
    const coalescer = createStreamUpdateCoalescer(publish, 50);

    coalescer.schedule();
    coalescer.schedule();
    coalescer.cancel();
    jest.advanceTimersByTime(50);

    expect(publish).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  test("adapts only very long replies while keeping first paint immediate", () => {
    const publish = jest.fn();
    let contentLength = 1_000;
    const coalescer = createStreamUpdateCoalescer(publish, () =>
      getStreamUpdateInterval(contentLength),
    );

    coalescer.schedule();
    expect(publish).toHaveBeenCalledTimes(1);

    contentLength = 40_000;
    coalescer.schedule();
    jest.advanceTimersByTime(119);
    expect(publish).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(publish).toHaveBeenCalledTimes(2);

    contentLength = 70_000;
    coalescer.schedule();
    jest.advanceTimersByTime(249);
    expect(publish).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(1);
    expect(publish).toHaveBeenCalledTimes(3);

    contentLength = 140_000;
    coalescer.schedule();
    jest.advanceTimersByTime(499);
    expect(publish).toHaveBeenCalledTimes(3);
    jest.advanceTimersByTime(1);
    expect(publish).toHaveBeenCalledTimes(4);

    contentLength = 300_000;
    coalescer.schedule();
    jest.advanceTimersByTime(1_199);
    expect(publish).toHaveBeenCalledTimes(4);
    jest.advanceTimersByTime(1);
    expect(publish).toHaveBeenCalledTimes(5);
  });
});
