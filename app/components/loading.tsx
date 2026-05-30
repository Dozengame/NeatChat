import clsx from "clsx";
import styles from "./home.module.scss";
import NeatIcon from "../icons/neat.svg";
import LoadingIcon from "../icons/three-dots.svg";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={clsx("no-dark", styles["loading-content"])}>
      {!props.noLogo && <NeatIcon width={30} height={30} />}
      <LoadingIcon />
    </div>
  );
}
