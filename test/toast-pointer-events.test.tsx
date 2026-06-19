import { render, screen } from "@testing-library/react";
import { Toast } from "../app/components/ui-lib-components";
import styles from "../app/components/ui-lib.module.scss";

describe("Toast pointer events", () => {
  test("passive toasts do not intercept nearby composer clicks", () => {
    render(<Toast content="已添加图片" />);

    const toastContent = screen.getByText("已添加图片").parentElement;

    expect(toastContent).toHaveClass(styles["toast-content"]);
    expect(toastContent).toHaveClass(styles["toast-content-passive"]);
  });

  test("action toasts keep their action target interactive", () => {
    const onClick = jest.fn();
    const onClose = jest.fn();

    render(
      <Toast
        content="已固定"
        action={{
          text: "查看",
          onClick,
        }}
        onClose={onClose}
      />,
    );

    const toastContent = screen.getByText("已固定").parentElement;

    expect(toastContent).toHaveClass(styles["toast-content"]);
    expect(toastContent).not.toHaveClass(styles["toast-content-passive"]);

    screen.getByRole("button", { name: "查看" }).click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
