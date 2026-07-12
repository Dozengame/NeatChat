import { fireEvent, render, screen } from "@testing-library/react";

import {
  DiscreteOptionRail,
  DiscreteOptionRailProps,
  getKeyboardDiscreteOption,
  getNearestAllowedDiscreteOption,
} from "../app/components/reasoning-effort-rail";

const options = ["auto", "square", "landscape", "portrait"] as const;
type Option = (typeof options)[number];

const labels: Record<Option, string> = {
  auto: "自动",
  square: "正方形",
  landscape: "横向",
  portrait: "竖向",
};
const descriptions: Record<Option, string> = {
  auto: "自动选择",
  square: "正方形尺寸",
  landscape: "横向尺寸",
  portrait: "竖向尺寸",
};

const renderRail = (
  overrides: Partial<DiscreteOptionRailProps<Option>> = {},
) => {
  const props: DiscreteOptionRailProps<Option> = {
    id: "image-size-test",
    ariaLabel: "图片尺寸选项",
    title: "图片尺寸",
    options,
    allowedOptions: options,
    value: "auto",
    locked: false,
    lockedLabel: "已锁定",
    labels,
    descriptions,
    onChange: jest.fn(),
    onLockedAttempt: jest.fn(),
    ...overrides,
  };
  render(<DiscreteOptionRail<Option> {...props} />);
  return props;
};

describe("DiscreteOptionRail", () => {
  test("keeps caller order for pointer and keyboard selection", () => {
    expect(
      getNearestAllowedDiscreteOption(1.6, options, [
        "auto",
        "landscape",
        "portrait",
      ]),
    ).toBe("landscape");
    expect(
      getKeyboardDiscreteOption("landscape", "ArrowRight", options, options),
    ).toBe("portrait");
    expect(
      getKeyboardDiscreteOption("landscape", "Home", options, options),
    ).toBe("auto");
  });

  test("exposes localized slider semantics without requiring a back action", () => {
    renderRail({ value: "landscape" });
    const slider = screen.getByRole("slider", { name: "图片尺寸选项" });
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "3");
    expect(slider).toHaveAttribute("aria-valuenow", "2");
    expect(slider).toHaveAttribute("aria-valuetext", "横向");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("supports keyboard changes and locked feedback", () => {
    const props = renderRail();
    const slider = screen.getByRole("slider", { name: "图片尺寸选项" });
    fireEvent.keyDown(slider, { key: "End" });
    expect(props.onChange).toHaveBeenCalledWith("portrait");

    const { unmount } = render(
      <DiscreteOptionRail<Option>
        {...props}
        id="locked-image-size"
        ariaLabel="锁定图片尺寸"
        locked
      />,
    );
    const locked = screen.getByRole("slider", { name: "锁定图片尺寸" });
    fireEvent.keyDown(locked, { key: "ArrowRight" });
    expect(props.onLockedAttempt).toHaveBeenCalledTimes(1);
    expect(locked).toHaveAttribute("aria-disabled", "true");
    unmount();
  });

  test("focuses on pointer input and measures geometry only once per drag", () => {
    const props: DiscreteOptionRailProps<Option> = {
      id: "pointer-image-size",
      ariaLabel: "拖动图片尺寸",
      title: "图片尺寸",
      options,
      allowedOptions: options,
      value: "auto",
      locked: false,
      lockedLabel: "已锁定",
      labels,
      descriptions,
      onChange: jest.fn(),
      onLockedAttempt: jest.fn(),
    };
    const view = render(<DiscreteOptionRail<Option> {...props} />);
    const slider = screen.getByRole("slider", { name: "拖动图片尺寸" });
    const rectSpy = jest.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 400,
      bottom: 44,
      width: 400,
      height: 44,
      toJSON: () => ({}),
    });
    Object.defineProperties(slider, {
      setPointerCapture: { configurable: true, value: jest.fn() },
      hasPointerCapture: { configurable: true, value: jest.fn(() => true) },
      releasePointerCapture: { configurable: true, value: jest.fn() },
    });

    const dispatchPointer = (type: string, clientX: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        clientX: { value: clientX },
        pointerId: { value: 1 },
      });
      fireEvent(slider, event);
    };

    dispatchPointer("pointerdown", 30);
    expect(document.activeElement).toBe(slider);
    for (let clientX = 40; clientX <= 360; clientX += 16) {
      dispatchPointer("pointermove", clientX);
    }
    expect(rectSpy).toHaveBeenCalledTimes(1);

    view.rerender(
      <DiscreteOptionRail<Option>
        {...props}
        options={[...options]}
        allowedOptions={[...options]}
      />,
    );
    expect(slider).toHaveAttribute("aria-valuetext", "竖向");

    dispatchPointer("pointerup", 360);
    expect(props.onChange).toHaveBeenCalledWith("portrait");
    rectSpy.mockRestore();
  });
});
