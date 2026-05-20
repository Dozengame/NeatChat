"use client";

import { useEffect, useMemo, useState } from "react";

import ConfirmIcon from "../icons/confirm.svg";
import type { PublicUpdateAnnouncement } from "../utils/update-announcement";
import { IconButton } from "./button";
import styles from "./update-announcement.module.scss";

const SEEN_KEY_PREFIX = "neatchat:update-announcement:seen";

function getAnnouncementSeenKey(params: {
  deploymentId?: string;
  announcement: PublicUpdateAnnouncement;
}) {
  return [
    SEEN_KEY_PREFIX,
    params.deploymentId || "local",
    params.announcement.hash,
  ].join(":");
}

function hasSeenAnnouncement(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markAnnouncementSeen(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Ignore storage failures. The modal can still be dismissed for this render.
  }
}

export function UpdateAnnouncement(props: {
  announcement?: PublicUpdateAnnouncement;
  deploymentId?: string;
  enabled?: boolean;
}) {
  const { announcement, deploymentId, enabled = true } = props;
  const [visible, setVisible] = useState(false);
  const seenKey = useMemo(() => {
    if (!announcement) {
      return undefined;
    }

    return getAnnouncementSeenKey({ deploymentId, announcement });
  }, [announcement, deploymentId]);

  useEffect(() => {
    if (!enabled || !announcement || !seenKey) {
      setVisible(false);
      return;
    }

    setVisible(!hasSeenAnnouncement(seenKey));
  }, [announcement, enabled, seenKey]);

  if (!enabled || !announcement || !seenKey || !visible) {
    return null;
  }

  const title = `${announcement.date} 更新内容`;
  const onConfirm = () => {
    markAnnouncementSeen(seenKey);
    setVisible(false);
  };

  return (
    <div className={styles.mask} role="presentation">
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-announcement-title"
      >
        <header className={styles.header}>
          <h2 className={styles.title} id="update-announcement-title">
            {title}
          </h2>
        </header>

        <div className={styles.content}>
          {announcement.sections.map((section, sectionIndex) => (
            <section
              className={styles.section}
              key={`${section.title}-${sectionIndex}`}
            >
              <div className={styles["section-title"]}>{section.title}</div>
              <ul className={styles.items}>
                {section.items.map((item, itemIndex) => (
                  <li className={styles.item} key={`${item}-${itemIndex}`}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {announcement.note && (
            <div className={styles.note}>{announcement.note}</div>
          )}
        </div>

        <footer className={styles.footer}>
          <IconButton
            className={styles.confirm}
            type="primary"
            icon={<ConfirmIcon />}
            text="我知道了"
            aria="我知道了"
            onClick={onConfirm}
            autoFocus
            bordered
            shadow
          />
        </footer>
      </section>
    </div>
  );
}
