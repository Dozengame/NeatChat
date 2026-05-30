import React from "react";
import FileIcon from "../icons/file.svg";
import { getFileIconClass } from "../utils/file";
import clsx from "clsx";
import styles from "./file-attachment.module.scss";

export interface FileAttachmentProps {
  fileName: string;
  fileType: string;
  fileSize: number;
  onClick?: () => void;
}

export function FileAttachment(props: FileAttachmentProps) {
  const { fileName, fileType, fileSize, onClick } = props;
  const interactiveProps = onClick
    ? {
        role: "button",
        tabIndex: 0,
        onClick,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <div className={styles["file-attachment"]} {...interactiveProps}>
      <div className={styles["file-attachment-card"]}>
        <div
          className={clsx(
            styles["file-attachment-icon"],
            getFileIconClass(fileType),
          )}
        >
          <FileIcon />
        </div>
        <div className={styles["file-attachment-info"]}>
          <div className={styles["file-attachment-name"]}>{fileName}</div>
          <div className={styles["file-attachment-size"]}>
            {(fileSize / 1024).toFixed(2)} KB
          </div>
          <div className={styles["file-attachment-type"]}>{fileType}</div>
        </div>
      </div>
    </div>
  );
}
