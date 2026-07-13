import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import DownloadIcon from "../icons/download.svg";
import Locale from "../locales";
import {
  getImageActionLabels,
  getMessageImageLabel,
} from "../utils/image-action-labels";
import { getAttachmentRenderKey } from "../utils/file";
import styles from "./chat.module.scss";

type ImagePreviewHandler = (
  src: string,
  options?: { trigger?: HTMLButtonElement | null; label?: string },
) => void;

type MessageImagePreviewProps = {
  src: string;
  alt?: string;
  className: string;
  actionLabels: ReturnType<typeof getImageActionLabels>;
  onPreview: ImagePreviewHandler;
  onDownload: (src: string) => void | Promise<void>;
};

export function MessageImagePreview(props: MessageImagePreviewProps) {
  return (
    <span className={styles["chat-message-image-frame"]}>
      <button
        type="button"
        className={styles["chat-message-image-preview-button"]}
        aria-label={props.actionLabels.preview}
        onClick={(event) =>
          props.onPreview(props.src, {
            trigger: event.currentTarget,
            label: props.alt,
          })
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={props.className}
          src={props.src}
          alt={props.alt ?? ""}
          loading="lazy"
          decoding="async"
        />
      </button>
      <button
        type="button"
        className={styles["chat-message-image-download"]}
        aria-label={props.actionLabels.download}
        title={props.actionLabels.download}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          props.onDownload(props.src);
        }}
      >
        <DownloadIcon />
      </button>
    </span>
  );
}

export function MessageImageGallery(props: {
  images: string[];
  onPreview: ImagePreviewHandler;
  onDownload: (src: string) => void | Promise<void>;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastIndex = props.images.length - 1;
  const safeSelectedIndex = Math.min(selectedIndex, Math.max(lastIndex, 0));
  const selectedImage = props.images[safeSelectedIndex] ?? "";
  const selectedLabel = getMessageImageLabel(
    safeSelectedIndex,
    props.images.length,
  );

  useEffect(() => {
    if (selectedIndex > lastIndex) {
      setSelectedIndex(Math.max(lastIndex, 0));
    }
  }, [lastIndex, selectedIndex]);

  const selectAndFocus = (index: number) => {
    if (props.images.length === 0) return;
    const nextIndex = (index + props.images.length) % props.images.length;
    setSelectedIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  };

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = index - 1;
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = index + 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    selectAndFocus(nextIndex);
  };

  if (!selectedImage) return null;

  return (
    <div className={styles["chat-message-gallery"]}>
      <div className={styles["chat-message-gallery-main"]}>
        <MessageImagePreview
          className={styles["chat-message-item-image"]}
          src={selectedImage}
          alt={selectedLabel}
          actionLabels={getImageActionLabels(selectedLabel)}
          onPreview={props.onPreview}
          onDownload={props.onDownload}
        />
      </div>
      <div
        className={styles["chat-message-gallery-options"]}
        role="group"
        aria-label={Locale.ImageActions.Gallery}
      >
        {props.images.map((image, index) => {
          const selected = index === safeSelectedIndex;
          return (
            <button
              type="button"
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              className={styles["chat-message-gallery-option"]}
              aria-label={Locale.ImageActions.ShowGalleryImage(
                index + 1,
                props.images.length,
              )}
              aria-pressed={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setSelectedIndex(index)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              key={getAttachmentRenderKey("image", image, index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles["chat-message-gallery-thumbnail"]}
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
