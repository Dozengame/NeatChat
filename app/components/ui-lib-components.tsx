import styles from "./ui-lib.module.scss";
import LoadingIcon from "../icons/three-dots.svg";
import CloseIcon from "../icons/close.svg";
import EyeIcon from "../icons/eye.svg";
import EyeOffIcon from "../icons/eye-off.svg";
import DownIcon from "../icons/down.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";

import React, {
  CSSProperties,
  HTMLProps,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { IconButton } from "./button";
import clsx from "clsx";
import { useMobileScreen } from "../utils/screen";

type ActivationEvent = MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>;

const unstyledButton: CSSProperties = {
  appearance: "none",
  background: "none",
  border: 0,
  color: "inherit",
  font: "inherit",
  padding: 0,
};

const overlayButtonStyle: CSSProperties = {
  ...unstyledButton,
  bottom: 0,
  left: 0,
  position: "absolute",
  right: 0,
  top: 0,
  width: "100%",
  height: "100%",
};

function isActivationKey(e: KeyboardEvent<HTMLElement>) {
  return e.key === "Enter" || e.key === " ";
}

function getElementKey(element: JSX.Element) {
  return element.key ?? element.props?.text ?? element.props?.title ?? "action";
}

function getSelectorItemKey(value: unknown, title: string) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return `${title}-${String(value)}`;
  }

  return title;
}

export function Popover(props: {
  children: JSX.Element;
  content: JSX.Element;
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <div className={styles.popover}>
      {props.children}
      {props.open && (
        <button
          type="button"
          className={styles["popover-mask"]}
          onClick={props.onClose}
          aria-label="Close popover"
          style={{ border: 0, padding: 0 }}
        />
      )}
      {props.open && (
        <div className={styles["popover-content"]}>{props.content}</div>
      )}
    </div>
  );
}

function Card(props: { children: JSX.Element[]; className?: string }) {
  return (
    <div className={clsx(styles.card, props.className)}>{props.children}</div>
  );
}

export function ListItem(props: {
  title?: string;
  subTitle?: string | JSX.Element;
  children?: JSX.Element | JSX.Element[];
  icon?: JSX.Element;
  className?: string;
  onClick?: (e: ActivationEvent) => void;
  vertical?: boolean;
}) {
  const interactiveProps = props.onClick
    ? {
        role: "button",
        tabIndex: 0,
        onClick: props.onClick,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          if (isActivationKey(e)) {
            e.preventDefault();
            props.onClick?.(e);
          }
        },
      }
    : {};

  return (
    <div
      className={clsx(
        styles["list-item"],
        {
          [styles["vertical"]]: props.vertical,
        },
        props.className,
      )}
      {...interactiveProps}
    >
      <div className={styles["list-header"]}>
        {props.icon && <div className={styles["list-icon"]}>{props.icon}</div>}
        <div className={styles["list-item-title"]}>
          <div>{props.title}</div>
          {props.subTitle && (
            <div className={styles["list-item-sub-title"]}>
              {props.subTitle}
            </div>
          )}
        </div>
      </div>
      {props.children}
    </div>
  );
}

export function List(props: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={clsx(styles.list, props.className)} id={props.id}>
      {props.children}
    </div>
  );
}

function Loading() {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LoadingIcon />
    </div>
  );
}

export function Modal(props: {
  title: string | JSX.Element;
  children?: any;
  actions?: JSX.Element[];
  defaultMax?: boolean;
  footer?: React.ReactNode;
  onClose?: () => void;
}) {
  const { actions, children, defaultMax, footer, onClose, title } = props;
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const [isMax, setMax] = useState(!!defaultMax);

  return (
    <div
      className={clsx(styles["modal-container"], {
        [styles["modal-container-max"]]: isMax,
      })}
    >
      <div className={styles["modal-header"]}>
        <div className={styles["modal-title"]}>{title}</div>

        <div className={styles["modal-header-actions"]}>
          <button
            type="button"
            className={styles["modal-header-action"]}
            onClick={() => setMax(!isMax)}
            aria-label={isMax ? "Restore modal" : "Maximize modal"}
            style={unstyledButton}
          >
            {isMax ? <MinIcon /> : <MaxIcon />}
          </button>
          <button
            type="button"
            className={styles["modal-header-action"]}
            onClick={onClose}
            aria-label="Close modal"
            style={unstyledButton}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className={styles["modal-content"]}>{children}</div>

      <div className={styles["modal-footer"]}>
        {footer}
        <div className={styles["modal-actions"]}>
          {actions?.map((action) => (
            <div key={getElementKey(action)} className={styles["modal-action"]}>
              {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type ToastProps = {
  content: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  onClose?: () => void;
};

export function Toast(props: ToastProps) {
  return (
    <div className={styles["toast-container"]}>
      <div
        className={clsx(styles["toast-content"], {
          [styles["toast-content-passive"]]: !props.action,
        })}
      >
        <span>{props.content}</span>
        {props.action && (
          <button
            type="button"
            onClick={() => {
              props.action?.onClick?.();
              props.onClose?.();
            }}
            className={styles["toast-action"]}
          >
            {props.action.text}
          </button>
        )}
      </div>
    </div>
  );
}

export type InputProps = React.HTMLProps<HTMLTextAreaElement> & {
  autoHeight?: boolean;
  rows?: number;
};

export function Input(props: InputProps) {
  return (
    <textarea
      {...props}
      className={clsx(styles["input"], props.className)}
    ></textarea>
  );
}

export function PasswordInput(
  props: HTMLProps<HTMLInputElement> & { aria?: string },
) {
  const [visible, setVisible] = useState(false);
  const { aria, ...inputProps } = props;
  function changeVisibility() {
    setVisible(!visible);
  }

  return (
    <div className={"password-input-container"}>
      <IconButton
        aria={aria}
        icon={visible ? <EyeIcon /> : <EyeOffIcon />}
        onClick={changeVisibility}
        className={"password-eye"}
      />
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        className={"password-input"}
      />
    </div>
  );
}

export function Select(
  props: React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement> & {
      align?: "left" | "center";
    },
    HTMLSelectElement
  >,
) {
  const { className, children, align, ...otherProps } = props;
  return (
    <div
      className={clsx(
        styles["select-with-icon"],
        {
          [styles["left-align-option"]]: align === "left",
        },
        className,
      )}
    >
      <select className={styles["select-with-icon-select"]} {...otherProps}>
        {children}
      </select>
      <DownIcon className={styles["select-with-icon-icon"]} />
    </div>
  );
}

export function Selector<T>(props: {
  items: Array<{
    title: string;
    subTitle?: string;
    value: T;
    disable?: boolean;
    icon?: JSX.Element;
  }>;
  defaultSelectedValue?: T[] | T;
  onSelection?: (selection: T[]) => void;
  onClose?: () => void;
  multiple?: boolean;
  showSearch?: boolean;
}) {
  const [selectedValues, setSelectedValues] = useState<T[]>(
    Array.isArray(props.defaultSelectedValue)
      ? props.defaultSelectedValue
      : props.defaultSelectedValue !== undefined
      ? [props.defaultSelectedValue]
      : [],
  );

  const [searchText, setSearchText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const keepFocus = () => inputRef.current?.focus();
    document.addEventListener("click", keepFocus);
    return () => document.removeEventListener("click", keepFocus);
  }, []);

  const filteredItems = props.items.filter((item) =>
    item.title.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleSelection = (e: ActivationEvent, value: T) => {
    if (props.multiple) {
      e.stopPropagation();
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSelectedValues(newSelectedValues);
      props.onSelection?.(newSelectedValues);
    } else {
      setSelectedValues([value]);
      props.onSelection?.([value]);
      props.onClose?.();
    }
  };

  const isMobileScreen = useMobileScreen();

  return (
    <div className={styles["selector"]}>
      <button
        type="button"
        aria-label="Close selector"
        onClick={props.onClose}
        style={overlayButtonStyle}
      />
      <div className={styles["selector-content"]} style={{ zIndex: 1 }}>
        {props.showSearch !== false && (
          <div className={styles["selector-search"]}>
            <input
              ref={inputRef}
              type="text"
              aria-label="Search models"
              placeholder="搜索模型"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        )}

        <List>
          {(props.showSearch === false ? props.items : filteredItems).map(
            (item) => (
              <ListItem
                className={clsx(styles["selector-item"], {
                  [styles["selector-item-disabled"]]: item.disable,
                })}
                key={getSelectorItemKey(item.value, item.title)}
                title={item.title}
                subTitle={item.subTitle}
                icon={item.icon}
                onClick={
                  item.disable
                    ? undefined
                    : (e) => {
                        handleSelection(e, item.value);
                      }
                }
              >
                {selectedValues.includes(item.value) ? (
                  <div className={styles["selector-item-selected"]} />
                ) : (
                  <></>
                )}
              </ListItem>
            ),
          )}
        </List>
      </div>
    </div>
  );
}

function FullScreen(props: any) {
  const { children, right = 10, top = 10, ...rest } = props;
  const ref = useRef<HTMLDivElement>();
  const [fullScreen, setFullScreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      ref.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);
  useEffect(() => {
    const handleScreenChange = (e: any) => {
      if (e.target === ref.current) {
        setFullScreen(!!document.fullscreenElement);
      }
    };
    document.addEventListener("fullscreenchange", handleScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleScreenChange);
    };
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }} {...rest}>
      <div style={{ position: "absolute", right, top }}>
        <IconButton
          icon={fullScreen ? <MinIcon /> : <MaxIcon />}
          onClick={toggleFullscreen}
          bordered
        />
      </div>
      {children}
    </div>
  );
}

export function SimpleSelector<T>(props: {
  items: Array<{
    title: string;
    value: T;
  }>;
  onClose?: () => void;
  onSelection?: (selection: T[]) => void;
}) {
  return (
    <div className={styles["selector"]}>
      <button
        type="button"
        aria-label="Close selector"
        onClick={props.onClose}
        style={overlayButtonStyle}
      />
      <div
        className={clsx(styles["selector-content"], styles["simple"])}
        style={{ zIndex: 1 }}
      >
        <List>
          {props.items.map((item) => (
            <ListItem
              className={styles["selector-item"]}
              key={getSelectorItemKey(item.value, item.title)}
              title={item.title}
              onClick={() => {
                props.onSelection?.([item.value]);
                props.onClose?.();
              }}
            />
          ))}
        </List>
      </div>
    </div>
  );
}

export function SimpleMultipleSelector<T>(props: {
  items: Array<{
    title: string;
    value: T;
  }>;
  defaultSelectedValue?: T[];
  onClose?: () => void;
  onSelection?: (selection: T[]) => void;
  showSearch?: boolean;
}) {
  const [selectedValues, setSelectedValues] = useState<T[]>(
    props.defaultSelectedValue ?? [],
  );

  return (
    <div className={styles["selector"]}>
      <button
        type="button"
        aria-label="Close selector"
        onClick={props.onClose}
        style={overlayButtonStyle}
      />
      <div
        className={clsx(styles["selector-content"], styles["simple"])}
        style={{ zIndex: 1 }}
      >
        <List>
          {props.items.map((item) => (
            <ListItem
              className={styles["selector-item"]}
              key={getSelectorItemKey(item.value, item.title)}
              title={item.title}
              onClick={() => {
                const newSelectedValues = selectedValues.includes(item.value)
                  ? selectedValues.filter((v) => v !== item.value)
                  : [...selectedValues, item.value];
                setSelectedValues(newSelectedValues);
                props.onSelection?.(newSelectedValues);
              }}
            >
              {selectedValues.includes(item.value) ? (
                <div className={styles["selector-item-selected"]} />
              ) : (
                <></>
              )}
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  );
}
