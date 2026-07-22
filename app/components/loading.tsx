import clsx from "clsx";
import styles from "./home.module.scss";
import NeatIcon from "../icons/neat.svg";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && (
        <div className={styles["loading-logo"]}>
          <span className={styles["loading-logo-aura"]} aria-hidden="true" />
          <NeatIcon width={30} height={30} />
        </div>
      )}
      <div className={styles["loading-dots"]} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className={styles["loading-bar"]} aria-hidden="true">
        <span className={styles["loading-bar-shimmer"]} />
      </div>
    </div>
  );
}
