import { fireEvent, render, screen } from "@testing-library/react";

import {
  canonicalizeReasoningEfforts,
  getKeyboardReasoningEffort,
  getNearestAllowedReasoningEffort,
  ReasoningEffortRail,
} from "../app/components/reasoning-effort-rail";
import { OpenAIChatReasoningEffort } from "../app/utils/openai-responses";

const labels: Record<OpenAIChatReasoningEffort, string> = {
  none: "快速",
  low: "低",
  medium: "中",
  high: "高",
  xhigh: "极高",
  max: "MAX",
};
const descriptions: Record<OpenAIChatReasoningEffort, string> = {
  none: "优先速度",
  low: "适合大多数问题",
  medium: "更稳妥处理复杂任务",
  high: "用于高难度推理",
  xhigh: "用于更多探索和校验",
  max: "质量优先",
};

const renderRail = (
  overrides: Partial<React.ComponentProps<typeof ReasoningEffortRail>> = {},
) => {
  const props: React.ComponentProps<typeof ReasoningEffortRail> = {
    id: "reasoning-test",
    ariaLabel: "思考等级选项",
    title: "思考等级",
    backLabel: "返回模型列表",
    efforts: ["low", "medium", "high", "xhigh"],
    allowedEfforts: ["low", "medium", "high", "xhigh"],
    value: "medium",
    locked: false,
    lockedLabel: "该项已由管理员锁定",
    labels,
    descriptions,
    onChange: jest.fn(),
    onBack: jest.fn(),
    onLockedAttempt: jest.fn(),
    ...overrides,
  };
  render(<ReasoningEffortRail {...props} />);
  return props;
};

describe("ReasoningEffortRail", () => {
  test("canonicalizes dynamic stops without changing allowlist semantics", () => {
    expect(canonicalizeReasoningEfforts(["xhigh", "medium", "medium"])).toEqual(
      ["medium", "xhigh"],
    );
    expect(canonicalizeReasoningEfforts(["medium", "xhigh"], "high")).toEqual([
      "medium",
      "high",
      "xhigh",
    ]);
    expect(
      getNearestAllowedReasoningEffort(
        1,
        ["medium", "high", "xhigh"],
        ["medium", "xhigh"],
      ),
    ).toBe("medium");
  });

  test("moves only through selectable efforts with keyboard", () => {
    expect(
      getKeyboardReasoningEffort("high", "ArrowRight", ["medium", "xhigh"]),
    ).toBe("xhigh");
    expect(
      getKeyboardReasoningEffort("high", "ArrowLeft", ["medium", "xhigh"]),
    ).toBe("medium");
    expect(
      getKeyboardReasoningEffort("medium", "End", ["medium", "xhigh"]),
    ).toBe("xhigh");
  });

  test("exposes slider semantics and marks highest available state dynamically", () => {
    const { rerender } = render(
      <ReasoningEffortRail
        id="reasoning-test"
        ariaLabel="思考等级选项"
        title="思考等级"
        backLabel="返回模型列表"
        efforts={["low", "medium", "high"]}
        allowedEfforts={["low", "medium", "high"]}
        value="high"
        locked={false}
        lockedLabel="该项已由管理员锁定"
        labels={labels}
        descriptions={descriptions}
        onChange={jest.fn()}
        onBack={jest.fn()}
        onLockedAttempt={jest.fn()}
      />,
    );
    const slider = screen.getByRole("slider", { name: "思考等级选项" });
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "2");
    expect(slider).toHaveAttribute("aria-valuenow", "2");
    expect(slider).toHaveAttribute("aria-valuetext", "高");
    expect(slider).toHaveAttribute("data-highest", "true");

    rerender(
      <ReasoningEffortRail
        id="reasoning-test"
        ariaLabel="思考等级选项"
        title="思考等级"
        backLabel="返回模型列表"
        efforts={["low", "medium", "high", "xhigh"]}
        allowedEfforts={["low", "medium", "high", "xhigh"]}
        value="high"
        locked={false}
        lockedLabel="该项已由管理员锁定"
        labels={labels}
        descriptions={descriptions}
        onChange={jest.fn()}
        onBack={jest.fn()}
        onLockedAttempt={jest.fn()}
      />,
    );
    expect(slider).toHaveAttribute("data-highest", "false");
  });

  test("keeps a disallowed current value visible but never selects it", () => {
    const props = renderRail({
      efforts: ["high", "medium", "xhigh"],
      allowedEfforts: ["medium", "xhigh"],
      value: "high",
    });
    const slider = screen.getByRole("slider", { name: "思考等级选项" });
    expect(slider).toHaveAttribute("aria-valuenow", "1");
    expect(slider).toHaveAttribute("data-stop-count", "3");

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(props.onChange).toHaveBeenCalledWith("xhigh");
    expect(props.onChange).not.toHaveBeenCalledWith("high");
  });

  test("supports arrows, Home and End without leaking handled keys", () => {
    const props = renderRail();
    const slider = screen.getByRole("slider", { name: "思考等级选项" });
    expect(fireEvent.keyDown(slider, { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(slider, { key: "Home" })).toBe(false);
    expect(fireEvent.keyDown(slider, { key: "End" })).toBe(false);

    expect(props.onChange).toHaveBeenNthCalledWith(1, "high");
    expect(props.onChange).toHaveBeenNthCalledWith(2, "low");
    expect(props.onChange).toHaveBeenNthCalledWith(3, "xhigh");
  });

  test("uses the locked feedback path and makes a single stop read-only", () => {
    const lockedProps = renderRail({ locked: true });
    const lockedSlider = screen.getByRole("slider", {
      name: "思考等级选项",
    });
    fireEvent.keyDown(lockedSlider, { key: "ArrowRight" });
    expect(lockedProps.onLockedAttempt).toHaveBeenCalledTimes(1);
    expect(lockedProps.onChange).not.toHaveBeenCalled();
    expect(lockedSlider).toHaveAttribute("aria-disabled", "true");

    const { unmount } = render(
      <ReasoningEffortRail
        {...lockedProps}
        id="single-test"
        ariaLabel="单档选项"
        efforts={["medium"]}
        allowedEfforts={["medium"]}
        value="medium"
        locked={false}
      />,
    );
    expect(screen.getByRole("slider", { name: "单档选项" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    unmount();
  });

  test("lets a current-only value move to the sole allowed stop", () => {
    const props = renderRail({
      efforts: ["medium", "high"],
      allowedEfforts: ["medium"],
      value: "high",
    });
    const slider = screen.getByRole("slider", { name: "思考等级选项" });
    expect(slider).toHaveAttribute("aria-disabled", "false");
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(props.onChange).toHaveBeenCalledWith("medium");
  });

  test("commits a pointer drag only to an allowed stop", () => {
    window.PointerEvent = MouseEvent as typeof PointerEvent;
    const props = renderRail({
      efforts: ["medium", "high", "xhigh"],
      allowedEfforts: ["medium", "xhigh"],
      value: "medium",
    });
    const slider = screen.getByRole("slider", { name: "思考等级选项" });
    const captured = new Set<number>();
    Object.defineProperty(slider, "getBoundingClientRect", {
      value: () => ({
        left: 0,
        right: 300,
        width: 300,
        top: 0,
        bottom: 38,
        height: 38,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    Object.defineProperties(slider, {
      setPointerCapture: {
        value: (pointerId: number) => captured.add(pointerId),
      },
      hasPointerCapture: {
        value: (pointerId: number) => captured.has(pointerId),
      },
      releasePointerCapture: {
        value: (pointerId: number) => captured.delete(pointerId),
      },
    });

    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 150 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 290 });
    fireEvent.pointerUp(slider, { pointerId: 1, clientX: 290 });

    expect(props.onChange).toHaveBeenCalledWith("xhigh");
    expect(props.onChange).not.toHaveBeenCalledWith("high");
  });

  test("cleans up preview state when pointer capture is lost", () => {
    window.PointerEvent = MouseEvent as typeof PointerEvent;
    const props = renderRail();
    const slider = screen.getByRole("slider", { name: "思考等级选项" });
    Object.defineProperties(slider, {
      setPointerCapture: { value: jest.fn() },
      hasPointerCapture: { value: () => true },
      releasePointerCapture: { value: jest.fn() },
    });

    fireEvent.pointerDown(slider, { pointerId: 2, clientX: 20 });
    fireEvent.lostPointerCapture(slider, { pointerId: 2 });
    fireEvent.pointerUp(slider, { pointerId: 2, clientX: 300 });

    expect(props.onChange).not.toHaveBeenCalled();
  });

  test("provides a keyboard-accessible back action", () => {
    const props = renderRail();
    fireEvent.click(screen.getByRole("button", { name: "返回模型列表" }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });
});
