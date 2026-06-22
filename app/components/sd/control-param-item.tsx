import styles from "./sd-panel.module.scss";
import clsx from "clsx";

export function ControlParamItem(props: {
  title: string;
  subTitle?: string;
  required?: boolean;
  children?: JSX.Element | JSX.Element[];
  className?: string;
}) {
  return (
    <div className={clsx(styles["ctrl-param-item"], props.className)}>
      <div className={styles["ctrl-param-item-header"]}>
        <div className={styles["ctrl-param-item-title"]}>
          <div>
            {props.title}
            {props.required && (
              <span className={styles["ctrl-param-item-required"]}>*</span>
            )}
          </div>
        </div>
      </div>
      {props.children}
      {props.subTitle && (
        <div className={styles["ctrl-param-item-sub-title"]}>
          {props.subTitle}
        </div>
      )}
    </div>
  );
}
