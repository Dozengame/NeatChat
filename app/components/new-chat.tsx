import { Path } from "../constant";
import { IconButton } from "./button";
import styles from "./new-chat.module.scss";

import LeftIcon from "../icons/left.svg";
import LightningIcon from "../icons/lightning.svg";
import EyeIcon from "../icons/eye.svg";

import { useLocation, useNavigate } from "react-router-dom";
import { Mask, useMaskStore } from "../store/mask";
import Locale, { getLang } from "../locales";
import { useChatStore } from "../store/chat";
import { useAppConfig } from "../store/config";
import { MaskAvatar } from "./mask";
import { useCommand } from "../command";
import { showConfirm } from "./ui-lib-actions";
import { BUILTIN_MASK_STORE } from "../masks";
import clsx from "clsx";
import { useCompactScreen } from "../utils";

function MaskItem(props: { mask: Mask; onClick?: () => void }) {
  return (
    <button type="button" className={styles["mask"]} onClick={props.onClick}>
      <MaskAvatar
        avatar={props.mask.avatar}
        model={props.mask.modelConfig.model}
      />
      <div className={clsx(styles["mask-name"], "one-line")}>
        {props.mask.name}
      </div>
    </button>
  );
}

export function NewChat() {
  const chatStore = useChatStore();
  const maskStore = useMaskStore();

  const masks = maskStore.getAll();
  const featuredMasks = masks
    .filter((mask) => !mask.builtin || mask.lang === getLang())
    .slice(0, 6);

  const navigate = useNavigate();
  const config = useAppConfig();
  const isCompactScreen = useCompactScreen();

  const { state } = useLocation();

  const startChat = (mask?: Mask) => {
    setTimeout(() => {
      chatStore.newSession(mask);
      navigate(Path.Chat);
    }, 10);
  };

  useCommand({
    mask: (id) => {
      try {
        const mask = maskStore.get(id) ?? BUILTIN_MASK_STORE.get(id);
        startChat(mask ?? undefined);
      } catch {
        console.error("[New Chat] failed to create chat from mask id=", id);
      }
    },
  });

  return (
    <div className={styles["new-chat"]}>
      <div className={styles["mask-header"]}>
        <IconButton
          icon={<LeftIcon />}
          text={Locale.NewChat.Return}
          aria={
            isCompactScreen
              ? Locale.Chat.Actions.ChatList
              : Locale.NewChat.Return
          }
          ariaControls={isCompactScreen ? "mobile-sidebar-drawer" : undefined}
          ariaExpanded={isCompactScreen ? false : undefined}
          dataMobileSidebarTrigger={isCompactScreen}
          onClick={() => navigate(Path.Home)}
        ></IconButton>
        {!state?.fromHome && (
          <IconButton
            text={Locale.NewChat.NotShow}
            onClick={async () => {
              if (await showConfirm(Locale.NewChat.ConfirmNoShow)) {
                startChat();
                config.update(
                  (config) => (config.dontShowMaskSplashScreen = true),
                );
              }
            }}
          ></IconButton>
        )}
      </div>

      <main className={styles["start"]}>
        <div className={styles["title"]}>{Locale.NewChat.Title}</div>
        <div className={styles["sub-title"]}>{Locale.NewChat.SubTitle}</div>

        <button
          type="button"
          className={styles["composer"]}
          onClick={() => startChat()}
        >
          <span className={styles["composer-text"]}>{Locale.NewChat.Skip}</span>
          <span className={styles["composer-action"]}>
            <LightningIcon />
          </span>
        </button>

        <div className={styles["actions"]}>
          <IconButton
            text={Locale.NewChat.More}
            onClick={() => navigate(Path.Masks)}
            icon={<EyeIcon />}
            bordered
            className={styles["more"]}
          />
        </div>

        {featuredMasks.length > 0 && (
          <div className={styles["masks"]}>
            {featuredMasks.map((mask) => (
              <MaskItem
                key={mask.id || mask.name}
                mask={mask}
                onClick={() => startChat(mask)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
