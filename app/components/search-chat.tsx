import { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ErrorBoundary } from "./error";
import { IconButton } from "./button";
import styles from "./search-chat.module.scss";
import CloseIcon from "../icons/close.svg";
import Locale from "../locales";
import { Path } from "../constant";
import { useChatStore, type ChatSession } from "../store/chat";

type Item = {
  id: number;
  name: string;
  content: string;
};

function contentText(content: unknown) {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join(" ");
  }

  return "";
}

function sessionPreview(session: ChatSession) {
  const preview = [...session.messages]
    .reverse()
    .map((message) => contentText(message.content).trim())
    .find(Boolean);

  return preview || Locale.SearchChat.Page.NoData;
}

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
          const content = contentText(message.content);
          if (content === "") return;

          const lowerCaseContent = content.toLowerCase();
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
            content: fullTextContents.join("... "),
          });
        }
      });

      results.sort((a, b) => b.content.length - a.content.length);

      return results;
    },
    [sessions],
  );

  const searchResults = useMemo(
    () => (searchText.length > 0 ? doSearch(searchText) : []),
    [doSearch, searchText],
  );
  const recentSessions = useMemo(
    () =>
      sessions
        .map((session, index) => ({
          id: index,
          name: session.topic,
          content: sessionPreview(session),
          lastUpdate: session.lastUpdate,
        }))
        .sort((a, b) => b.lastUpdate - a.lastUpdate)
        .slice(0, 8),
    [sessions],
  );

  const hasSearchText = searchText.trim().length > 0;
  const listItems = hasSearchText ? searchResults : recentSessions;
  const listTitle = hasSearchText
    ? Locale.SearchChat.Page.SubTitle(searchResults.length)
    : Locale.SearchChat.Page.Recent;

  return (
    <ErrorBoundary>
      <div className={styles["search-page"]}>
        <div className={styles["search-close"]}>
          <IconButton
            icon={<CloseIcon />}
            bordered
            onClick={() => navigate(-1)}
            aria={Locale.UI.Close}
          />
        </div>

        <main className={styles["search-body"]}>
          <section className={styles["search-hero"]}>
            <div className={styles["search-title"]}>
              {Locale.SearchChat.Page.Title}
            </div>
            <div className={styles["search-subtitle"]}>{listTitle}</div>
            <div className={styles["search-box"]}>
              <input
                type="text"
                aria-label={Locale.SearchChat.Page.Search}
                className={styles["search-input"]}
                placeholder={Locale.SearchChat.Page.Search}
                value={searchText}
                onChange={(e) => setSearchText(e.currentTarget.value)}
              />
              {searchText.length > 0 && (
                <button
                  type="button"
                  className={styles["clear-search"]}
                  onClick={() => setSearchText("")}
                  aria-label={Locale.UI.Clear}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </section>

          <section className={styles["result-panel"]}>
            <div className={styles["result-heading"]}>{listTitle}</div>

            {listItems.length === 0 ? (
              <div className={styles["empty-state"]}>
                {hasSearchText
                  ? Locale.SearchChat.Page.NoResult
                  : Locale.SearchChat.Page.NoData}
              </div>
            ) : (
              <div className={styles["result-list"]}>
                {listItems.map((item) => (
                  <Link
                    to={Path.Chat}
                    className={styles["result-item"]}
                    key={item.id}
                    onClick={() => {
                      selectSession(item.id);
                    }}
                  >
                    <div className={styles["result-content"]}>
                      <div className={styles["result-name"]}>{item.name}</div>
                      <div className={styles["result-snippet"]}>
                        {item.content.slice(0, 120)}
                      </div>
                    </div>
                    <span className={styles["result-action"]}>
                      {Locale.SearchChat.Item.View}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </ErrorBoundary>
  );
}
