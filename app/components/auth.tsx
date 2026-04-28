import styles from "./auth.module.scss";
import { IconButton } from "./button";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";
import NeatIcon from "../icons/neat.svg";
import { PasswordInput } from "./ui-lib";
import clsx from "clsx";
import { showToast } from "./ui-lib";

export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();
  const confirmAccessCode = async () => {
    const ok = await accessStore.validateAccessCode();
    if (ok) {
      navigate(Path.Chat);
      return;
    }
    showToast(
      accessStore.accessCodeError === "rate_limited"
        ? Locale.Auth.RateLimited
        : Locale.Auth.Invalid,
    );
  };

  return (
    <div className={styles["auth-page"]}>
      <div className={clsx("no-dark", styles["auth-logo"])}>
        <NeatIcon width={30} height={30} />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>

      <PasswordInput
        style={{ marginTop: "3vh", marginBottom: "3vh" }}
        aria={Locale.Settings.ShowPassword}
        aria-label={Locale.Auth.Input}
        value={accessStore.accessCode}
        type="text"
        placeholder={Locale.Auth.Input}
        onChange={(e) => {
          accessStore.setAccessCode(e.currentTarget.value);
        }}
      />

      <div className={styles["auth-actions"]}>
        <IconButton
          text={
            accessStore.isValidatingAccessCode
              ? Locale.Auth.Validating
              : Locale.Auth.Confirm
          }
          type="primary"
          disabled={accessStore.isValidatingAccessCode}
          onClick={confirmAccessCode}
        />
      </div>
    </div>
  );
}
