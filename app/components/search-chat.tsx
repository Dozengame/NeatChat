import { useState, useCallback, useMemo } from "react";
import { ErrorBoundary } from "./error";
import styles from "./mask.module.scss";
import { Link, useNavigate } from "react-router-dom";
import { IconButton } from "./button";
import CloseIcon from "../icons/close.svg";
import EyeIcon from "../icons/eye.svg";
import Locale from "../locales";
import { Path } from "../constant";

import { useChatStore } from "../store/chat";

type Item = {
  id: number;
  name: string;
  content: string;
};
export function SearchChatPage() {
  const navigate = useNavigate();

  const chatStore = useChatStore();

  const sessions = chatStore.sessions;
  const selectSession = chatStore.selectSession;

  const [searchText, setSearchText] = useState("");
  const doSearch = useCallback(
    (text: string) => {
      const lowerCaseText = text.toLowerCase();
      const results: Item[] = [];

      sessions.forEach((session, index) => {
        const fullTextContents: string[] = [];

        session.messages.forEach((message) => {
          const content = message.content as string;
          if (!content.toLowerCase || content === "") return;
          const lowerCaseContent = content.toLowerCase();

          // full text search
          let pos = 0;
          const segments = lowerCaseContent.split(lowerCaseText);
          for (let i = 0; i < segments.length - 1; i += 1) {
            pos += segments[i].length;
            const start = Math.max(0, pos - 35);
            const end = Math.min(
              content.length,
              pos + lowerCaseText.length + 35,
            );
            fullTextContents.push(content.substring(start, end));
            pos += lowerCaseText.length;
          }
        });

        if (fullTextContents.length > 0) {
          results.push({
            id: index,
            name: session.topic,
            content: fullTextContents.join("... "), // concat content with...
          });
        }
      });

      // sort by length of matching content
      results.sort((a, b) => b.content.length - a.content.length);

      return results;
    },
    [sessions],
  );
  const searchResults = useMemo(
    () => (searchText.length > 0 ? doSearch(searchText) : []),
    [doSearch, searchText],
  );

  const openSearchResult = (item: Item) => {
    navigate(Path.Chat);
    selectSession(item.id);
  };

  return (
    <ErrorBoundary>
      <div className={styles["mask-page"]}>
        {/* header */}
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">
              {Locale.SearchChat.Page.Title}
            </div>
            <div className="window-header-submai-title">
              {Locale.SearchChat.Page.SubTitle(searchResults.length)}
            </div>
          </div>

          <div className="window-actions">
            <div className="window-action-button">
              <IconButton
                icon={<CloseIcon />}
                bordered
                onClick={() => navigate(-1)}
              />
            </div>
          </div>
        </div>

        <div className={styles["mask-page-body"]}>
          <div className={styles["mask-filter"]}>
            {/**搜索输入框 */}
            <input
              type="text"
              aria-label={Locale.SearchChat.Page.Search}
              className={styles["search-bar"]}
              placeholder={Locale.SearchChat.Page.Search}
              value={searchText}
              onChange={(e) => setSearchText(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (searchText.length > 0) {
                    doSearch(searchText);
                  }
                }
              }}
            />
          </div>

          <div>
            {searchResults.map((item) => (
              <Link
                to={Path.Chat}
                className={styles["mask-item"]}
                key={item.id}
                onClick={() => {
                  selectSession(item.id);
                }}
                style={{ cursor: "pointer" }}
              >
                {/** 搜索匹配的文本 */}
                <div className={styles["mask-header"]}>
                  <div className={styles["mask-title"]}>
                    <div className={styles["mask-name"]}>{item.name}</div>
                    <div className={styles["mask-info"]}>
                      {item.content.slice(0, 70)}
                    </div>
                  </div>
                </div>
                {/** 操作按钮 */}
                <div className={styles["mask-actions"]}>
                  <span className={styles["mask-action"]}>
                    <EyeIcon />
                    {Locale.SearchChat.Item.View}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
