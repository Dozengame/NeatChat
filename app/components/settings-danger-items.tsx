import Locale from "../locales";
import { useChatStore } from "../store/chat";
import { useAppConfig } from "../store/config";
import { IconButton } from "./button";
import styles from "./settings.module.scss";
import { List, ListItem } from "./ui-lib";
import { showConfirm } from "./ui-lib-actions";

export function DangerItems() {
  const chatStore = useChatStore();
  const appConfig = useAppConfig();
  const dangerRegionLabel = `${Locale.Settings.Danger.Reset.Title} / ${Locale.Settings.Danger.Clear.Title}`;

  return (
    <section
      className={styles["settings-danger-surface"]}
      aria-label={dangerRegionLabel}
    >
      <List id="settings-danger-list">
        <ListItem
          className={styles["settings-danger-item"]}
          title={Locale.Settings.Danger.Reset.Title}
          subTitle={
            <span className={styles["settings-danger-subtitle"]}>
              {Locale.Settings.Danger.Reset.SubTitle}
            </span>
          }
        >
          <IconButton
            aria={Locale.Settings.Danger.Reset.Title}
            className={styles["settings-danger-action"]}
            text={Locale.Settings.Danger.Reset.Action}
            bordered
            onClick={async () => {
              if (await showConfirm(Locale.Settings.Danger.Reset.Confirm)) {
                appConfig.reset();
              }
            }}
            type="danger"
          />
        </ListItem>
        <ListItem
          className={styles["settings-danger-item"]}
          title={Locale.Settings.Danger.Clear.Title}
          subTitle={
            <span className={styles["settings-danger-subtitle"]}>
              {Locale.Settings.Danger.Clear.SubTitle}
            </span>
          }
        >
          <IconButton
            aria={Locale.Settings.Danger.Clear.Title}
            className={styles["settings-danger-action"]}
            text={Locale.Settings.Danger.Clear.Action}
            bordered
            onClick={async () => {
              if (await showConfirm(Locale.Settings.Danger.Clear.Confirm)) {
                chatStore.clearAllData();
              }
            }}
            type="danger"
          />
        </ListItem>
      </List>
    </section>
  );
}
