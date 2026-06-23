import { useMemo, useState } from "react";
import styles from "./settings.module.scss";
import ConfigIcon from "../icons/config.svg";
import DownloadIcon from "../icons/download.svg";
import ResetIcon from "../icons/reload.svg";
import UploadIcon from "../icons/upload.svg";
import Locale from "../locales";
import { useChatStore } from "../store/chat";
import { useMaskStore } from "../store/mask";
import { usePromptStore } from "../store/prompt";
import { useSyncStore } from "../store/sync";
import { IconButton } from "./button";
import { List, ListItem } from "./ui-lib";
import { showToast } from "./ui-lib-actions";
import { SyncConfigModal } from "./settings-sync-config-modal";

export function SyncItems() {
  const syncStore = useSyncStore();
  const chatStore = useChatStore();
  const promptStore = usePromptStore();
  const maskStore = useMaskStore();
  const couldSync = useMemo(() => {
    return syncStore.cloudSync();
  }, [syncStore]);

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    const messageCount = sessions.reduce((p, c) => p + c.messages.length, 0);

    return {
      chat: sessions.length,
      message: messageCount,
      prompt: Object.keys(promptStore.prompts).length,
      mask: Object.keys(maskStore.masks).length,
    };
  }, [chatStore.sessions, maskStore.masks, promptStore.prompts]);

  return (
    <div className={styles["settings-sync-surface"]}>
      <List>
        <ListItem
          title={Locale.Settings.Sync.CloudState}
          subTitle={
            syncStore.lastProvider
              ? `${new Date(syncStore.lastSyncTime).toLocaleString()} [${
                  syncStore.lastProvider
                }]`
              : Locale.Settings.Sync.NotSyncYet
          }
        >
          <div className={styles["settings-sync-actions"]}>
            <div className={styles["settings-sync-action-cluster"]}>
              <IconButton
                aria={Locale.Settings.Sync.CloudState + Locale.UI.Config}
                className={styles["settings-sync-action-button"]}
                icon={<ConfigIcon />}
                text={Locale.UI.Config}
                onClick={() => {
                  setShowSyncConfigModal(true);
                }}
              />
              {couldSync && (
                <IconButton
                  className={styles["settings-sync-action-button"]}
                  icon={<ResetIcon />}
                  text={Locale.UI.Sync}
                  onClick={async () => {
                    try {
                      await syncStore.sync();
                      showToast(Locale.Settings.Sync.Success);
                    } catch (e) {
                      showToast(Locale.Settings.Sync.Fail);
                      console.error("[Sync]", e);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </ListItem>

        <ListItem
          title={Locale.Settings.Sync.LocalState}
          subTitle={Locale.Settings.Sync.Overview(stateOverview)}
        >
          <div className={styles["settings-sync-actions"]}>
            <div className={styles["settings-sync-action-cluster"]}>
              <IconButton
                aria={Locale.Settings.Sync.LocalState + Locale.UI.Export}
                className={styles["settings-sync-action-button"]}
                icon={<UploadIcon />}
                text={Locale.UI.Export}
                onClick={() => {
                  syncStore.export();
                }}
              />
              <IconButton
                aria={Locale.Settings.Sync.LocalState + Locale.UI.Import}
                className={styles["settings-sync-action-button"]}
                icon={<DownloadIcon />}
                text={Locale.UI.Import}
                onClick={() => {
                  syncStore.import();
                }}
              />
            </div>
          </div>
        </ListItem>
      </List>

      {showSyncConfigModal && (
        <SyncConfigModal onClose={() => setShowSyncConfigModal(false)} />
      )}
    </div>
  );
}
