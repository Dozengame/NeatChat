import { useMemo, useState } from "react";
import styles from "./settings.module.scss";
import AddIcon from "../icons/add.svg";
import ClearIcon from "../icons/clear.svg";
import CopyIcon from "../icons/copy.svg";
import EditIcon from "../icons/edit.svg";
import EyeIcon from "../icons/eye.svg";
import Locale from "../locales";
import { SearchService, usePromptStore } from "../store/prompt";
import { copyToClipboard } from "../utils";
import { nanoid } from "nanoid";
import { IconButton } from "./button";
import { Modal } from "./ui-lib";
import { EditPromptModal } from "./settings-edit-prompt-modal";

export function UserPromptModal(props: { onClose?: () => void }) {
  const promptStore = usePromptStore();
  const userPrompts = promptStore.getUserPrompts();
  const builtinPrompts = SearchService.builtinPrompts;
  const allPrompts = useMemo(
    () => userPrompts.concat(builtinPrompts),
    [builtinPrompts, userPrompts],
  );
  const [searchInput, setSearchInput] = useState("");
  const prompts = useMemo(
    () =>
      searchInput.length > 0 ? SearchService.search(searchInput) : allPrompts,
    [allPrompts, searchInput],
  );

  const [editingPromptId, setEditingPromptId] = useState<string>();
  const addPrompt = () => {
    const promptId = promptStore.add({
      id: nanoid(),
      createdAt: Date.now(),
      title: "Empty Prompt",
      content: "Empty Prompt Content",
    });
    setEditingPromptId(promptId);
  };

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Prompt.Modal.Title}
        onClose={() => props.onClose?.()}
        actions={[
          <IconButton
            key="add"
            onClick={addPrompt}
            icon={<AddIcon />}
            bordered
            text={Locale.Settings.Prompt.Modal.Add}
          />,
        ]}
      >
        <div className={styles["user-prompt-modal"]}>
          <input
            type="text"
            aria-label={Locale.Settings.Prompt.Modal.Search}
            className={styles["user-prompt-search"]}
            placeholder={Locale.Settings.Prompt.Modal.Search}
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
          ></input>

          <div className={styles["user-prompt-list"]}>
            {prompts.map((v) => (
              <div className={styles["user-prompt-item"]} key={v.id ?? v.title}>
                <div className={styles["user-prompt-header"]}>
                  <div className={styles["user-prompt-title"]}>{v.title}</div>
                  <div className={styles["user-prompt-content"] + " one-line"}>
                    {v.content}
                  </div>
                </div>

                <div className={styles["user-prompt-buttons"]}>
                  {v.isUser && (
                    <IconButton
                      icon={<ClearIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => promptStore.remove(v.id!)}
                    />
                  )}
                  {v.isUser ? (
                    <IconButton
                      icon={<EditIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => setEditingPromptId(v.id)}
                    />
                  ) : (
                    <IconButton
                      icon={<EyeIcon />}
                      className={styles["user-prompt-button"]}
                      onClick={() => setEditingPromptId(v.id)}
                    />
                  )}
                  <IconButton
                    icon={<CopyIcon />}
                    className={styles["user-prompt-button"]}
                    onClick={() => copyToClipboard(v.content)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {editingPromptId !== undefined && (
        <EditPromptModal
          id={editingPromptId}
          onClose={() => setEditingPromptId(undefined)}
        />
      )}
    </div>
  );
}
