import React from "react";
import FileIcon from "../icons/file.svg";
import { getFileIconClass } from "../utils/file";
import clsx from "clsx";
import styles from "./file-attachment.module.scss";
import Locale from "../locales";

export interface FileAttachmentProps {
  fileName: string;
  fileType: string;
  fileSize: number;
  onClick?: () => void;
}

export function FileAttachment(props: FileAttachmentProps) {
  const { fileName, fileType, fileSize, onClick } = props;
  const formattedFileSize = `${(fileSize / 1024).toFixed(2)} KB`;
  const attachmentLabel = Locale.FileAttachment.Label(
    fileName,
    fileType,
    formattedFileSize,
    !!onClick,
  );
  const interactiveProps = onClick
    ? {
        role: "button",
        tabIndex: 0,
        "aria-label": attachmentLabel,
        onClick,
        onKeyDown: (e: React.KeyboardEvent<HTMLSpanElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <span
      className={clsx(
        styles["file-attachment"],
        onClick && styles["file-attachment-interactive"],
      )}
      title={fileName}
      {...interactiveProps}
    >
      <span className={styles["file-attachment-card"]}>
        <span
          className={clsx(
            styles["file-attachment-icon"],
            getFileIconClass(fileType),
          )}
        >
          <FileIcon />
        </span>
        <span className={styles["file-attachment-info"]}>
          <span className={styles["file-attachment-name"]}>{fileName}</span>
          <span
            className={styles["file-attachment-meta"]}
            aria-label={Locale.FileAttachment.Meta(fileType, formattedFileSize)}
          >
            <span className={styles["file-attachment-size"]}>
              {formattedFileSize}
            </span>
            <span className={styles["file-attachment-type"]}>{fileType}</span>
          </span>
        </span>
      </span>
    </span>
  );
}
