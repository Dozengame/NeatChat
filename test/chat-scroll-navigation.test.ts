import {
  accumulateChatScrollDirection,
  CHAT_SCROLL_DIRECTION_THRESHOLD,
} from "../app/utils/chat-scroll-navigation";

describe("chat quick-jump direction", () => {
  test("accumulates small same-direction deltas before changing direction", () => {
    const first = accumulateChatScrollDirection(0, -4);
    const second = accumulateChatScrollDirection(first.accumulatedDelta, -5);
    const third = accumulateChatScrollDirection(second.accumulatedDelta, -3);

    expect(first.target).toBeNull();
    expect(second.target).toBeNull();
    expect(third).toEqual({ accumulatedDelta: 0, target: "top" });
  });

  test("resets sub-threshold jitter when the user reverses direction", () => {
    const upward = accumulateChatScrollDirection(0, -8);
    const reversed = accumulateChatScrollDirection(upward.accumulatedDelta, 7);

    expect(reversed).toEqual({ accumulatedDelta: 7, target: null });
    expect(
      accumulateChatScrollDirection(
        reversed.accumulatedDelta,
        CHAT_SCROLL_DIRECTION_THRESHOLD - 7,
      ),
    ).toEqual({ accumulatedDelta: 0, target: "bottom" });
  });

  test("ignores zero and non-finite layout noise", () => {
    expect(accumulateChatScrollDirection(6, 0)).toEqual({
      accumulatedDelta: 6,
      target: null,
    });
    expect(accumulateChatScrollDirection(6, Number.NaN)).toEqual({
      accumulatedDelta: 6,
      target: null,
    });
  });
});
