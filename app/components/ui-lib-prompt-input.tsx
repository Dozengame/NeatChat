import styles from "./ui-lib.module.scss";

export function PromptInput(props: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  rows?: number;
}) {
  const onInput = (value: string) => {
    props.onChange(value);
  };

  return (
    <textarea
      className={styles["modal-input"]}
      aria-label={props.ariaLabel ?? String(props.value || "Prompt input")}
      value={props.value}
      onChange={(e) => onInput(e.currentTarget.value)}
      rows={props.rows ?? 3}
    ></textarea>
  );
}
