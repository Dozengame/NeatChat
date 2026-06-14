import { useEffect, useMemo, useState } from "react";
import { ChatMessage, useChatStore } from "../store/chat";
import { useAppConfig } from "../store/config";
import { Updater } from "../typing";
import { IconButton } from "./button";
import { MaskAvatar } from "./mask";
import Locale from "../locales";

import styles from "./message-selector.module.scss";
import { getMessageTextContent, hasMessageContent } from "../utils";
import clsx from "clsx";

function isValidSelectableMessage(message: ChatMessage) {
  return hasMessageContent(message);
}

function useShiftRange() {
  const [startIndex, setStartIndex] = useState<number>();
  const [shiftDown, setShiftDown] = useState(false);

  const getRangeForClick = (index: number) => {
    if (shiftDown && startIndex !== undefined) {
      return [startIndex, index].sort((a, b) => a - b) as [number, number];
    }

    setStartIndex(index);
    return undefined;
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Shift") return;
      setShiftDown(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "Shift") return;
      setShiftDown(false);
      setStartIndex(undefined);
    };

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return {
    getRangeForClick,
  };
}

export function useMessageSelector(initialSelection?: Iterable<string>) {
  const [selection, setSelection] = useState(
    () => new Set<string>(initialSelection),
  );
  const updateSelection: Updater<Set<string>> = (updater) => {
    setSelection((selection) => {
      const newSelection = new Set<string>(selection);
      updater(newSelection);
      return newSelection;
    });
  };

  return {
    selection,
    updateSelection,
  };
}

export function MessageSelector(props: {
  selection: Set<string>;
  updateSelection: Updater<Set<string>>;
}) {
  const LATEST_COUNT = 4;
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const allMessages = useMemo(() => {
    let startIndex = Math.max(0, session.clearContextIndex ?? 0);
    if (startIndex === session.messages.length - 1) {
      startIndex = 0;
    }
    return session.messages.slice(startIndex);
  }, [session.messages, session.clearContextIndex]);

  const messages = useMemo(
    () =>
      allMessages.filter(
        (m, i) =>
          m.id && // message must have id
          isValidSelectableMessage(m) &&
          (i >= allMessages.length - 1 ||
            isValidSelectableMessage(allMessages[i + 1])),
      ),
    [allMessages],
  );
  const messageCount = messages.length;
  const config = useAppConfig();

  const [searchInput, setSearchInput] = useState("");
  const [searchIds, setSearchIds] = useState(new Set<string>());
  const isInSearchResult = (id: string) => {
    return searchInput.length === 0 || searchIds.has(id);
  };
  const doSearch = (text: string) => {
    const searchResults = new Set<string>();
    if (text.length > 0) {
      messages.forEach((m) =>
        getMessageTextContent(m).includes(text)
          ? searchResults.add(m.id!)
          : null,
      );
    }
    setSearchIds(searchResults);
  };

  // for range selection
  const { getRangeForClick } = useShiftRange();

  const selectAll = () => {
    props.updateSelection((selection) =>
      messages.forEach((m) => selection.add(m.id!)),
    );
  };

  return (
    <div className={styles["message-selector"]}>
      <div className={styles["message-filter"]}>
        <input
          type="text"
          aria-label={Locale.Select.Search}
          placeholder={Locale.Select.Search}
          className={clsx(styles["filter-item"], styles["search-bar"])}
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.currentTarget.value);
            doSearch(e.currentTarget.value);
          }}
        />

        <div className={styles["actions"]}>
          <IconButton
            text={Locale.Select.All}
            bordered
            className={styles["filter-item"]}
            onClick={selectAll}
          />
          <IconButton
            text={Locale.Select.Latest}
            bordered
            className={styles["filter-item"]}
            onClick={() =>
              props.updateSelection((selection) => {
                selection.clear();
                messages
                  .slice(messageCount - LATEST_COUNT)
                  .forEach((m) => selection.add(m.id!));
              })
            }
          />
          <IconButton
            text={Locale.Select.Clear}
            bordered
            className={styles["filter-item"]}
            onClick={() =>
              props.updateSelection((selection) => selection.clear())
            }
          />
        </div>
      </div>

      <div className={styles["messages"]}>
        {messages.map((m, i) => {
          if (!isInSearchResult(m.id!)) return null;
          const id = m.id!;
          const isSelected = props.selection.has(id);

          return (
            <label
              className={clsx(styles["message"], {
                [styles["message-selected"]]: props.selection.has(m.id!),
              })}
              key={id}
            >
              <div className={styles["avatar"]}>
                {m.role === "user" ? (
                  <div className={styles["empty-avatar"]} />
                ) : (
                  <MaskAvatar
                    avatar={session.mask.avatar}
                    model={m.model || session.mask.modelConfig.model}
                  />
                )}
              </div>
              <div className={styles["body"]}>
                <div className={styles["date"]}>
                  {new Date(m.date).toLocaleString()}
                </div>
                <div className={clsx(styles["content"], "one-line")}>
                  {getMessageTextContent(m)}
                </div>
              </div>

              <div className={styles["checkbox"]}>
                <input type="checkbox" checked={isSelected} readOnly></input>
                <input
                  type="checkbox"
                  aria-label={getMessageTextContent(m)}
                  checked={isSelected}
                  onChange={() => {
                    const range = getRangeForClick(i);
                    props.updateSelection((selection) => {
                      if (range) {
                        const [start, end] = range;
                        for (let index = start; index <= end; index += 1) {
                          selection.add(messages[index].id!);
                        }
                        return;
                      }

                      selection.has(id)
                        ? selection.delete(id)
                        : selection.add(id);
                    });
                  }}
                />
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
