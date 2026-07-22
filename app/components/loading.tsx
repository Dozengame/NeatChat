import clsx from "clsx";
import { useEffect, useState } from "react";
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

// 路由级加载：延迟出现避免 chunk 秒开时的加载态闪烁，
// 出现时由 .loading-content 的 fade-in 平滑入场
const ROUTE_LOADING_DELAY_MS = 160;

export function RouteLoading() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(true),
      ROUTE_LOADING_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return <Loading noLogo />;
}
