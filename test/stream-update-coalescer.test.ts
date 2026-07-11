import { createStreamUpdateCoalescer } from "../app/utils/stream-update-coalescer";

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
});
