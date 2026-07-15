import { useDebouncedCallback } from "use-debounce";
import Image from "next/image";
import React, {
  useState,
  useReducer,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  Fragment,
  RefObject,
} from "react";

import SendWhiteIcon from "../icons/send-white.svg";
import ComposerStopIcon from "../icons/composer-stop.svg";
import ComposerCheckIcon from "../icons/composer-check.svg";
import ComposerChevronDownIcon from "../icons/composer-chevron-down.svg";
import ComposerChevronRightIcon from "../icons/composer-chevron-right.svg";
import BrainIcon from "../icons/brain.svg";
import RenameIcon from "../icons/rename.svg";
import ExportIcon from "../icons/share.svg";
import MenuIcon from "../icons/menu.svg";
import CopyIcon from "../icons/copy.svg";
import SpeakIcon from "../icons/speak.svg";
import SpeakStopIcon from "../icons/speak-stop.svg";
import LoadingIcon from "../icons/three-dots.svg";
import LoadingButtonIcon from "../icons/loading.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ResetIcon from "../icons/reload.svg";
import BreakIcon from "../icons/break.svg";
import SettingsIcon from "../icons/chat-settings.svg";
import DeleteIcon from "../icons/clear.svg";
import PinIcon from "../icons/pin.svg";
import EditIcon from "../icons/rename.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CancelIcon from "../icons/cancel.svg";
import FileIcon from "../icons/file.svg";
import ImageIcon from "../icons/image.svg";
import AttachmentIcon from "../icons/attachment.svg";
import PromptIcon from "../icons/prompt.svg";
import LeftIcon from "../icons/left.svg";
import DownloadIcon from "../icons/download.svg";
import AddIcon from "../icons/add.svg";
import NeatIcon from "../icons/neat.svg";

import LightIcon from "../icons/light.svg";
import DarkIcon from "../icons/dark.svg";
import AutoIcon from "../icons/auto.svg";
import BottomIcon from "../icons/bottom.svg";
import StopIcon from "../icons/pause.svg";
import RobotIcon from "../icons/robot.svg";
import SizeIcon from "../icons/size.svg";
import QualityIcon from "../icons/hd.svg";
import StyleIcon from "../icons/palette.svg";
import PluginIcon from "../icons/plugin.svg";
import ReloadIcon from "../icons/reload.svg";
import HeadphoneIcon from "../icons/headphone.svg";
import {
  ChatMessage,
  useChatStore,
  BOT_HELLO,
  createMessage,
  DEFAULT_TOPIC,
  hasClosedResponsesFunctionTrace,
} from "../store/chat";
import { useAccessStore } from "../store/access";
import { SubmitKey, Theme, useAppConfig, ModelType } from "../store/config";
import { usePluginStore } from "../store/plugin";

import {
  copyToClipboard,
  selectOrCopy,
  useCompactScreen,
  useMobileScreen,
  getMessageTextContent,
  getMessageImages,
  hasMessageContent,
  isVisionModel,
  showPlugins,
  safeLocalStorage,
} from "../utils";
import { getComposerTextareaLayout } from "../utils/composer-textarea-layout";
import {
  getImageActionLabels,
  getImagePreviewDialogLabel,
  getImagePreviewAlt,
  getMessageImageLabel,
} from "../utils/image-action-labels";
import {
  accumulateChatScrollDirection,
  followChatTailAfterResize,
  getAnchoredScrollTop,
  getUnderfilledChatWindowStart,
  isMessageIndexRetainedInWindow,
  isRetainedVisibleMessageAnchor,
  type ChatScrollTarget,
} from "../utils/chat-scroll-navigation";

import dynamic from "next/dynamic";

import { ChatControllerPool } from "../client/controller";
import { DalleStyle, OpenAIImageQuality, OpenAIImageSize } from "../typing";
import { Prompt, usePromptStore } from "../store/prompt";
import Locale from "../locales";

import { IconButton } from "./button";
import styles from "./chat.module.scss";

import {
  List,
  ListItem,
  Modal,
  Selector,
  SimpleMultipleSelector,
} from "./ui-lib";
import { showConfirm, showPrompt, showToast } from "./ui-lib-actions";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CHAT_PAGE_SIZE,
  MAX_RENDER_MSG_COUNT,
  DEFAULT_TTS_ENGINE,
  ENABLE_REALTIME_CHAT,
  ENABLE_TEXT_TO_SPEECH,
  ModelProvider,
  Path,
  REQUEST_TIMEOUT_MS,
  UNFINISHED_INPUT,
  ServiceProvider,
} from "../constant";
import { Avatar } from "./avatar";
import { ContextPrompts, MaskAvatar, MaskConfig } from "./mask";
import { useMaskStore } from "../store/mask";
import { useChatCommand, useCommand } from "../command";
import { prettyObject } from "../utils/format";
import { getClientConfig } from "../config/client";
import { useAllModels } from "../utils/hooks";
import { MultimodalContent } from "../client/types";
import {
  applyConfiguredOpenAIResponsesReasoningEffortDefault,
  applyOpenAIResponsesModelConstraints,
  filterOpenAIResponsesReasoningEfforts,
  getMaxOutputTokensForReasoningEffort,
  clampOpenAIResponsesMaxOutputTokens,
  isOpenAIResponsesReasoningModelConfig,
  includeCurrentOpenAIResponsesReasoningEffort,
  normalizeOpenAIResponsesReasoningEffort,
  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
  OpenAIChatReasoningEffort,
} from "../utils/openai-responses";
import {
  applyOpenAIImageGenerationDefaults,
  DALLE3_IMAGE_STYLES,
  getOpenAIImageGenerationOptions,
  isDalle3,
  isOpenAIImageGenerationModelConfig,
  normalizeOpenAIImageQuality,
  normalizeOpenAIImageSize,
} from "../utils/openai-image";

import { createTTSPlayer } from "../utils/audio";

import { isEmpty } from "lodash-es";
import { getModelProvider } from "../utils/model";
import clsx from "clsx";
import { shallow } from "zustand/shallow";
import {
  type AttachmentUploadKind,
  type DraggedAttachmentSummary,
  FileInfo,
  getAttachmentRenderKey,
  getClipboardAttachmentPayload,
  getDraggedAttachmentSummary,
  getFileIconClass,
  isAttachmentImage,
  processAttachmentFiles,
  removeAttachmentAtIndex,
  replaceAttachmentImageAtIndex,
  uploadAttachments,
} from "../utils/file";
import { formatAttachmentForPrompt } from "../utils/attachment-wire";
import {
  type ComposerPromptFilter,
  filterComposerPrompts,
} from "../utils/composer-prompt-library";
import {
  type ConfigSource,
  createConfigFieldMeta,
} from "../utils/public-app-config";
import {
  createPinnedContextMessage,
  createVisibleChatMessagesProjector,
  findMessageForRenderSource,
  getMessageRenderIdentity,
  RenderMessage,
  shouldRenderLoadingPreview,
} from "./chat-render";
import {
  getComposerPopoverPlacement,
  toComposerPopoverCssVariables,
} from "../utils/composer-model-menu-placement";

import {
  DiscreteOptionRail,
  ReasoningEffortRail,
} from "./reasoning-effort-rail";
import {
  MessageImageGallery,
  MessageImagePreview,
} from "./message-image-gallery";
import {
  ChatHomeMode,
  ChatHomeModel,
  ComposerModelMenuSection,
  getComposerModelMenuEscapeLayer,
  getComposerModelMenuLayer,
  getComposerModelMenuSection,
  getChatHomeModeForModel,
  getChatHomeModeModels,
  getImageComposerSummary,
  isChatHomeModeDisabled,
  resolvePreferredChatHomeModel,
} from "./chat-home-mode";
import { getComposerSubmitState } from "../utils/composer-submit";

const localStorage = safeLocalStorage();

const ttsPlayer = createTTSPlayer();
const reasoningLabels: Record<OpenAIChatReasoningEffort, string> = {
  none: Locale.Settings.ReasoningEffort.None,
  minimal: Locale.Settings.ReasoningEffort.Minimal,
  low: Locale.Settings.ReasoningEffort.Low,
  medium: Locale.Settings.ReasoningEffort.Medium,
  high: Locale.Settings.ReasoningEffort.High,
  xhigh: Locale.Settings.ReasoningEffort.XHigh,
  max: Locale.Settings.ReasoningEffort.Max,
};
const reasoningDescriptions: Record<OpenAIChatReasoningEffort, string> = {
  none: Locale.Settings.ReasoningEffort.NoneDescription,
  minimal: Locale.Settings.ReasoningEffort.MinimalDescription,
  low: Locale.Settings.ReasoningEffort.LowDescription,
  medium: Locale.Settings.ReasoningEffort.MediumDescription,
  high: Locale.Settings.ReasoningEffort.HighDescription,
  xhigh: Locale.Settings.ReasoningEffort.XHighDescription,
  max: Locale.Settings.ReasoningEffort.MaxDescription,
};
const imageQualityLabels: Record<OpenAIImageQuality, string> = {
  auto: Locale.Settings.ImageGeneration.Auto,
  low: Locale.Settings.ImageGeneration.Low,
  medium: Locale.Settings.ImageGeneration.Medium,
  high: Locale.Settings.ImageGeneration.High,
  standard: Locale.Settings.ImageGeneration.Standard,
  hd: Locale.Settings.ImageGeneration.HD,
};
const getImageQualityLabel = (quality: OpenAIImageQuality) =>
  imageQualityLabels[quality] ?? quality;
const getImageSizeLabel = (size: OpenAIImageSize) =>
  Locale.Settings.ImageGeneration.SizeLabel(size);
const CHAT_BODY_BOTTOM_SAFE_AREA_BASE = 150;
const CHAT_BODY_BOTTOM_SAFE_AREA_MOBILE_BASE = 118;
const CHAT_SCROLL_BOTTOM_CLEARANCE = 66;
const CHAT_SCROLL_BOTTOM_MOBILE_CLEARANCE = 60;
type ChatQaFixture = typeof import("./chat-qa-fixture");

async function loadChatQaFixture(
  locationSearch: string,
): Promise<ChatQaFixture | undefined> {
  if (process.env.NODE_ENV !== "production") {
    const params = new URLSearchParams(locationSearch);
    if (params.has("codex_qa")) {
      return import("./chat-qa-fixture");
    }
  }
}
const stopAll = () => ChatControllerPool.stopAll();
type ChatActionModalKey = "model" | "plugin" | "size" | "quality" | "style";
type ChatActionModals = Record<ChatActionModalKey, boolean>;
const closedChatActionModals: ChatActionModals = {
  model: false,
  plugin: false,
  size: false,
  quality: false,
  style: false,
};

function hasDraggedFiles(
  dataTransfer: DataTransfer | null,
): dataTransfer is DataTransfer {
  return Array.from(dataTransfer?.types ?? []).includes("Files");
}

const ATTACHMENT_SWIPE_DELETE_THRESHOLD = 36;

type AttachmentSwipeStart = {
  key: string;
  x: number;
  y: number;
};

type ClearAttachmentDeleteOptions = {
  restoreFocus?: boolean;
};

function getAttachmentSwipeKey(type: "image" | "file", index: number) {
  return `${type}-${index}`;
}

function chatActionModalsReducer(
  state: ChatActionModals,
  action: { key: ChatActionModalKey; value: boolean },
) {
  return {
    ...state,
    [action.key]: action.value,
  };
}

function getImageDownloadName(src: string) {
  const fallbackName = "generated-image.png";
  const decodeFileName = (fileName: string) => {
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  };

  try {
    const url = new URL(src, window.location.href);
    const fileName = url.pathname.split("/").filter(Boolean).pop();
    return fileName ? decodeFileName(fileName) : fallbackName;
  } catch {
    const fileName = src.split("/").filter(Boolean).pop()?.split("?")[0];
    return fileName ? decodeFileName(fileName) : fallbackName;
  }
}

function triggerFileDownload(url: string, fileName: string) {
  if (!url) return;

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function isMobileSaveTarget() {
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    window.matchMedia?.("(pointer: coarse)").matches
  );
}

async function shareImageFile(blob: Blob, fileName: string) {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  const file = new File([blob], fileName, {
    type: blob.type || "image/png",
  });
  const shareData: ShareData = {
    files: [file],
    title: fileName,
  };

  if (!nav.share || !nav.canShare?.(shareData)) {
    return false;
  }

  await nav.share(shareData);
  return true;
}

async function downloadImage(src: string) {
  if (!src) return;

  const fileName = getImageDownloadName(src);
  try {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    if (isMobileSaveTarget()) {
      try {
        if (await shareImageFile(blob, fileName)) {
          return;
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") {
          return;
        }
        console.warn("[Image Download] Failed to share image", error);
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    triggerFileDownload(objectUrl, fileName);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    console.warn("[Image Download] Falling back to direct link", error);
    showToast(Locale.ImageActions.OpenedOriginal);
    triggerFileDownload(src, fileName);
  }
}

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});
const ExportMessageModal = dynamic(
  async () => (await import("./exporter")).ExportMessageModal,
  { loading: () => <LoadingIcon /> },
);
const ImageEditor = dynamic(
  async () => (await import("./image-editor")).ImageEditor,
  { loading: () => <LoadingIcon /> },
);
const RealtimeChat = dynamic(
  async () => (await import("./realtime-chat")).RealtimeChat,
  { loading: () => <LoadingIcon /> },
);

export function SessionConfigModel(props: { onClose: () => void }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const maskStore = useMaskStore();
  const navigate = useNavigate();

  return (
    <div
      className="modal-mask"
      id="session-config-modal"
      role="dialog"
      aria-modal="true"
      aria-label={Locale.Context.Edit}
    >
      <Modal
        title={Locale.Context.Edit}
        onClose={() => props.onClose()}
        actions={[
          <IconButton
            key="reset"
            icon={<ResetIcon />}
            bordered
            text={Locale.Chat.Config.Reset}
            onClick={async () => {
              if (await showConfirm(Locale.Memory.ResetConfirm)) {
                chatStore.updateTargetSession(
                  session,
                  (session) => (session.memoryPrompt = ""),
                );
              }
            }}
          />,
          <IconButton
            key="copy"
            icon={<CopyIcon />}
            bordered
            text={Locale.Chat.Config.SaveAs}
            onClick={() => {
              navigate(Path.Masks);
              setTimeout(() => {
                maskStore.create(session.mask);
              }, 500);
            }}
          />,
        ]}
      >
        <MaskConfig
          mask={session.mask}
          updateMask={(updater) => {
            const mask = { ...session.mask };
            updater(mask);
            chatStore.updateTargetSession(
              session,
              (session) => (session.mask = mask),
            );
          }}
          shouldSyncFromGlobal
          extraListItems={
            session.mask.modelConfig.sendMemory ? (
              <ListItem
                className="copyable"
                title={`${Locale.Memory.Title} (${session.lastSummarizeIndex} of ${session.messages.length})`}
                subTitle={session.memoryPrompt || Locale.Memory.EmptyContent}
              ></ListItem>
            ) : (
              <></>
            )
          }
        ></MaskConfig>
      </Modal>
    </div>
  );
}

function PromptToast(props: {
  showToast?: boolean;
  showModal?: boolean;
  contextLength: number;
  onOpen: (_: HTMLButtonElement) => void;
}) {
  return (
    <div className={styles["prompt-toast"]} key="prompt-toast">
      {props.showToast && props.contextLength > 0 && (
        <button
          type="button"
          className={clsx(styles["prompt-toast-inner"], "clickable")}
          aria-label={Locale.Context.Toast(props.contextLength)}
          aria-haspopup="dialog"
          aria-controls="session-config-modal"
          aria-expanded={props.showModal}
          onClick={(event) => props.onOpen(event.currentTarget)}
        >
          <BrainIcon />
          <span className={styles["prompt-toast-content"]}>
            {Locale.Context.Toast(props.contextLength)}
          </span>
        </button>
      )}
    </div>
  );
}

function useSubmitHandler() {
  const config = useAppConfig();
  const submitKey = config.submitKey;
  const isComposing = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true;
    };
    const onCompositionEnd = () => {
      isComposing.current = false;
    };

    window.addEventListener("compositionstart", onCompositionStart);
    window.addEventListener("compositionend", onCompositionEnd);

    return () => {
      window.removeEventListener("compositionstart", onCompositionStart);
      window.removeEventListener("compositionend", onCompositionEnd);
    };
  }, []);

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Fix Chinese input method "Enter" on Safari
    if (e.keyCode == 229) return false;
    if (e.key !== "Enter") return false;
    if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
      return false;
    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (config.submitKey === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}

export type RenderPrompt = Pick<Prompt, "title" | "content">;

type PromptHintsCloseOptions = {
  restoreFocus?: boolean;
};

export function PromptHints(props: {
  prompts: RenderPrompt[];
  onPromptSelect: (prompt: RenderPrompt) => void;
  onClose: (options?: PromptHintsCloseOptions) => void;
}) {
  const { prompts, onClose, onPromptSelect } = props;
  const noPrompts = prompts.length === 0;
  const [selectIndex, setSelectIndex] = useState(0);
  const promptCountRef = useRef(prompts.length);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const activeSelectIndex = noPrompts
    ? 0
    : Math.min(selectIndex, prompts.length - 1);

  useEffect(() => {
    if (prompts.length !== promptCountRef.current) {
      promptCountRef.current = prompts.length;
      setSelectIndex(0);
      return;
    }
    if (selectIndex !== activeSelectIndex) {
      setSelectIndex(activeSelectIndex);
    }
  }, [activeSelectIndex, prompts.length, selectIndex]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [activeSelectIndex]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isPromptNavigationKey = [
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(e.key);

      if (noPrompts || e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      if (e.key === "Escape") {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        onClose({ restoreFocus: true });
        return;
      }

      if (e.shiftKey && isPromptNavigationKey) {
        return;
      }

      const selectPromptIndex = (nextIndex: number) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectIndex(nextIndex);
      };

      // arrow up / down to select prompt
      const changeIndex = (delta: number) => {
        const nextIndex = Math.max(
          0,
          Math.min(prompts.length - 1, activeSelectIndex + delta),
        );
        selectPromptIndex(nextIndex);
      };

      if (e.key === "ArrowUp") {
        changeIndex(-1);
      } else if (e.key === "ArrowDown") {
        changeIndex(1);
      } else if (e.key === "Home") {
        selectPromptIndex(0);
      } else if (e.key === "End") {
        selectPromptIndex(prompts.length - 1);
      } else if (e.key === "Enter") {
        e.stopPropagation();
        e.preventDefault();
        const selectedPrompt = prompts.at(activeSelectIndex);
        if (selectedPrompt) {
          onPromptSelect(selectedPrompt);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSelectIndex, noPrompts, onClose, onPromptSelect, prompts]);

  if (noPrompts) return null;
  return (
    <div
      id="chat-prompt-hints"
      className={styles["prompt-hints"]}
      role="listbox"
      aria-label={Locale.Chat.Accessibility.PromptSuggestions}
      aria-activedescendant={`chat-prompt-hint-${activeSelectIndex}`}
    >
      {prompts.map((prompt, i) => (
        <button
          type="button"
          id={`chat-prompt-hint-${i}`}
          ref={i === activeSelectIndex ? selectedRef : null}
          className={clsx(styles["prompt-hint"], {
            [styles["prompt-hint-selected"]]: i === activeSelectIndex,
          })}
          role="option"
          aria-selected={i === activeSelectIndex}
          key={prompt.title + i.toString()}
          onClick={() => onPromptSelect(prompt)}
          onMouseEnter={() => setSelectIndex(i)}
        >
          <div className={styles["hint-title"]}>{prompt.title}</div>
          <div className={styles["hint-content"]}>{prompt.content}</div>
        </button>
      ))}
    </div>
  );
}

const ClearContextDivider = React.forwardRef<HTMLButtonElement>(
  function ClearContextDivider(_, ref) {
    return (
      <button
        type="button"
        ref={ref}
        className={styles["clear-context"]}
        aria-label={Locale.Chat.Accessibility.CombinedLabels([
          Locale.Context.Clear,
          Locale.Context.Revert,
        ])}
        title={Locale.Context.Revert}
        onClick={() => {
          const chatStore = useChatStore.getState();
          const session = chatStore.currentSession();
          chatStore.updateTargetSession(
            session,
            (session) => (session.clearContextIndex = undefined),
          );
        }}
      >
        <span className={styles["clear-context-status"]}>
          <span className={styles["clear-context-mark"]} aria-hidden="true" />
          <span className={styles["clear-context-tips"]}>
            {Locale.Context.Clear}
          </span>
        </span>
        <span className={styles["clear-context-revert-btn"]}>
          {Locale.Context.Revert}
        </span>
      </button>
    );
  },
);

export function ChatAction(props: {
  text: string;
  description?: string;
  icon: JSX.Element;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
  dataCopyState?: "idle" | "copied";
  ariaHasPopup?: React.AriaAttributes["aria-haspopup"];
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  ariaBusy?: boolean;
  ariaDescribedBy?: string;
  role?: React.AriaRole;
  dataChatAction?: string;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState({
    full: 16,
    icon: 16,
  });

  function updateWidth() {
    if (!iconRef.current || !textRef.current) return;
    const getWidth = (dom: HTMLDivElement) => dom.getBoundingClientRect().width;
    const textWidth = getWidth(textRef.current);
    const iconWidth = getWidth(iconRef.current);
    setWidth({
      full: textWidth + iconWidth,
      icon: iconWidth,
    });
  }

  return (
    <button
      type="button"
      className={clsx(styles["chat-input-action"], "clickable", {
        [styles["chat-input-action-active"]]: props.active,
        [styles["chat-input-action-disabled"]]: props.disabled,
      })}
      aria-label={props.ariaLabel ?? props.text}
      aria-describedby={props.ariaDescribedBy}
      title={props.title}
      data-chat-action={props.dataChatAction}
      data-copy-state={props.dataCopyState}
      aria-haspopup={props.ariaHasPopup}
      aria-expanded={props.ariaExpanded}
      aria-pressed={props.ariaPressed}
      aria-busy={props.ariaBusy}
      role={props.role}
      disabled={props.disabled}
      onClick={(event) => {
        if (props.disabled) return;
        void props.onClick(event);
        setTimeout(updateWidth, 1);
      }}
      onMouseEnter={updateWidth}
      onTouchStart={updateWidth}
      style={
        {
          "--icon-width": `${width.icon}px`,
          "--full-width": `${width.full}px`,
        } as React.CSSProperties
      }
    >
      <div ref={iconRef} className={styles["icon"]}>
        {props.icon}
      </div>
      <div
        className={clsx(styles["text"], {
          [styles["chat-input-action-copy"]]: props.description,
        })}
        ref={textRef}
      >
        <span>{props.text}</span>
        {props.description && (
          <small className={styles["chat-input-action-description"]}>
            {props.description}
          </small>
        )}
      </div>
    </button>
  );
}

function useScrollToBottom(
  scrollRef: RefObject<HTMLDivElement>,
  shouldAutoScroll: boolean = true,
  scrollSignal?: string,
) {
  // for auto-scroll

  const [autoScroll, setAutoScroll] = useState(true);
  const scrollFrameRef = useRef<number | null>(null);
  const scrollDomToBottom = useCallback(() => {
    const dom = scrollRef.current;
    if (dom) {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
      scrollFrameRef.current = requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        setAutoScroll(true);
        dom.scrollTo(0, dom.scrollHeight);
      });
    }
  }, [scrollRef]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    },
    [],
  );

  // ResizeObserver follows content growth in modern browsers. This signal is
  // only the capability fallback, avoiding duplicate scroll/layout work.
  useLayoutEffect(() => {
    if (typeof ResizeObserver !== "undefined" && scrollSignal !== undefined) {
      return;
    }
    if (autoScroll && shouldAutoScroll) {
      scrollDomToBottom();
    }
  }, [autoScroll, scrollDomToBottom, scrollSignal, shouldAutoScroll]);

  return {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollDomToBottom,
  };
}

type ChatActionMenuView = "main" | "prompt-library";

function ComposerPromptLibrary(props: {
  onBack: () => void;
  onPromptSelect: (prompt: Prompt) => void;
}) {
  const promptStore = usePromptStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ComposerPromptFilter>("all");
  const prompts = filterComposerPrompts(promptStore.search(query), filter);
  const filters: Array<{
    value: ComposerPromptFilter;
    label: string;
  }> = [
    { value: "all", label: Locale.Chat.ChatToolMenu.PromptLibraryAll },
    { value: "user", label: Locale.Chat.ChatToolMenu.PromptLibraryUser },
    {
      value: "builtin",
      label: Locale.Chat.ChatToolMenu.PromptLibraryBuiltin,
    },
  ];

  return (
    <div
      className={styles["chat-prompt-library"]}
      aria-label={Locale.Chat.ChatToolMenu.PromptLibraryTitle}
    >
      <div className={styles["chat-prompt-library-header"]}>
        <button
          type="button"
          className={styles["chat-prompt-library-back"]}
          data-chat-action-menu-control="true"
          aria-label={Locale.Chat.ChatToolMenu.PromptLibraryBack}
          onClick={props.onBack}
        >
          <LeftIcon />
        </button>
        <strong>{Locale.Chat.ChatToolMenu.PromptLibraryTitle}</strong>
      </div>
      <input
        type="search"
        className={styles["chat-prompt-library-search"]}
        data-chat-action-menu-control="true"
        data-prompt-library-search="true"
        aria-label={Locale.Chat.ChatToolMenu.PromptLibrarySearch}
        placeholder={Locale.Chat.ChatToolMenu.PromptLibrarySearch}
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      <div
        className={styles["chat-prompt-library-filters"]}
        role="group"
        aria-label={Locale.Chat.ChatToolMenu.PromptLibraryTitle}
      >
        {filters.map((item) => (
          <button
            type="button"
            key={item.value}
            className={clsx(styles["chat-prompt-library-filter"], {
              [styles["chat-prompt-library-filter-active"]]:
                filter === item.value,
            })}
            data-chat-action-menu-control="true"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={styles["chat-prompt-library-list"]} role="list">
        {prompts.length === 0 && (
          <p className={styles["chat-prompt-library-empty"]} role="status">
            {Locale.Chat.ChatToolMenu.PromptLibraryEmpty}
          </p>
        )}
        {prompts.map((prompt) => (
          <div key={prompt.id} role="listitem">
            <button
              type="button"
              className={styles["chat-prompt-library-item"]}
              data-chat-action-menu-control="true"
              onClick={() => props.onPromptSelect(prompt)}
            >
              <strong>{prompt.title}</strong>
              <small>{prompt.content}</small>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

type ChatActionsProps = {
  uploadImages: () => void;
  uploadFiles: () => void;
  setAttachImages: (images: string[]) => void;
  setUploading: (uploading: boolean) => void;
  showPromptModal: () => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  hitBottom: boolean;
  uploading: boolean;
  imageSlotsFull: boolean;
  fileSlotsFull: boolean;
  menuView: ChatActionMenuView;
  openPromptLibrary: () => void;
  closePromptLibrary: () => void;
  onPromptSelect: (prompt: Prompt) => void;
  openShortcutKeyModal: () => void;
  setUserInput: (input: string) => void;
  setShowChatSidePanel: React.Dispatch<React.SetStateAction<boolean>>;
  onActionComplete?: () => void;
};

function useChatActionsView(props: ChatActionsProps) {
  const { setAttachImages, setUploading } = props;
  const config = useAppConfig();
  const accessStore = useAccessStore();
  const chatStore = useChatStore();
  const pluginStore = usePluginStore();
  const session = chatStore.currentSession();

  // switch themes
  const theme = config.theme;
  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    config.update((config) => (config.theme = nextTheme));
  }

  // stop all responses
  const couldStop = ChatControllerPool.hasPending();

  // switch model
  const currentModel = session.mask.modelConfig.model;
  const currentProviderName =
    session.mask.modelConfig?.providerName || ServiceProvider.OpenAI;
  const allModels = useAllModels();
  const models = useMemo(() => {
    return allModels.filter((m) => m.available);
  }, [allModels]);
  const modelLocked =
    accessStore.lockedFields?.includes("model") ||
    accessStore.lockedFields?.includes("providerName");
  const currentModelName = useMemo(() => {
    const model = models.find(
      (m) =>
        m.name == currentModel &&
        m?.provider?.providerName == currentProviderName,
    );
    return model?.displayName ?? "";
  }, [models, currentModel, currentProviderName]);
  const [actionModals, setActionModal] = useReducer(
    chatActionModalsReducer,
    closedChatActionModals,
  );
  const setActionModalOpen = (key: ChatActionModalKey, value: boolean) =>
    setActionModal({ key, value });
  const isOpenAIImageGeneration = isOpenAIImageGenerationModelConfig({
    model: currentModel,
    providerName: currentProviderName,
  });
  const isDalle3Model = isDalle3(currentModel);
  const imageOptions = getOpenAIImageGenerationOptions(currentModel);
  const imageSizes = imageOptions.sizes;
  const imageQualitys = imageOptions.qualities;
  const dalle3Styles = DALLE3_IMAGE_STYLES;
  const currentSize = normalizeOpenAIImageSize(
    currentModel,
    session.mask.modelConfig?.size,
  );
  const currentQuality =
    normalizeOpenAIImageQuality(
      currentModel,
      session.mask.modelConfig?.quality,
    ) ?? "standard";
  const currentStyle = session.mask.modelConfig?.style ?? "vivid";

  const isCompactScreen = useCompactScreen();

  useEffect(() => {
    if (!isVisionModel(currentModel)) {
      setAttachImages([]);
      setUploading(false);
    }

    // if current model is not available
    // switch to first available model
    const isUnavailableModel = !models.some(
      (m) =>
        m.name === currentModel &&
        m?.provider?.providerName === currentProviderName,
    );
    if (isUnavailableModel && models.length > 0) {
      // show next model to default model if exist
      let nextModel = models.find((model) => model.isDefault) || models[0];
      chatStore.updateTargetSession(session, (session) => {
        session.mask.modelConfig.model = nextModel.name;
        session.mask.modelConfig.providerName = nextModel?.provider
          ?.providerName as ServiceProvider;
        applyConfiguredOpenAIResponsesReasoningEffortDefault({
          config: session.mask.modelConfig,
          configMeta: session.mask.modelConfigMeta,
          defaults: config.serverConfigSnapshot?.reasoningEffortDefaults,
        });
        applyOpenAIResponsesModelConstraints(session.mask.modelConfig);
        applyOpenAIImageGenerationDefaults(session.mask.modelConfig);
        session.mask.modelConfigMeta = {
          ...(session.mask.modelConfigMeta ?? {}),
          model: createConfigFieldMeta({
            source: "admin_forced",
            publicConfig: config.serverConfigSnapshot,
            locked: true,
          }),
          providerName: createConfigFieldMeta({
            source: "admin_forced",
            publicConfig: config.serverConfigSnapshot,
            locked: true,
          }),
        };
      });
      showToast(
        nextModel?.provider?.providerName == "ByteDance"
          ? nextModel.displayName
          : nextModel.name,
      );
    }
  }, [
    chatStore,
    config.serverConfigSnapshot,
    currentModel,
    currentProviderName,
    models,
    session,
    setAttachImages,
    setUploading,
  ]);

  const showModelSearchOption = config.enableModelSearch ?? false;
  const availablePlugins = pluginStore
    .getAll()
    .filter((item) => item?.title?.trim() && item?.content?.trim());
  const pluginSelectorItems = [
    ...(currentModel === "gemini-2.0-flash-exp"
      ? [
          {
            title: Locale.Plugin.EnableWeb,
            value: "googleSearch",
          },
        ]
      : []),
    ...availablePlugins.map((item) => ({
      title: `${item?.title}@${item?.version}`,
      value: item?.id,
    })),
  ];
  const shouldShowPluginAction =
    showPlugins(currentProviderName, currentModel) &&
    pluginSelectorItems.length > 0;
  const hasClearableContext = session.messages.some((message) =>
    hasMessageContent(message),
  );
  const completeMobileAction = () => {
    if (isCompactScreen) {
      props.onActionComplete?.();
    }
  };
  const hasSessionActions =
    couldStop ||
    !props.hitBottom ||
    (config.enableClearContext && hasClearableContext);

  if (props.menuView === "prompt-library") {
    return (
      <ComposerPromptLibrary
        onBack={props.closePromptLibrary}
        onPromptSelect={props.onPromptSelect}
      />
    );
  }

  const imageUploadUnavailable = !isVisionModel(currentModel);
  const imageUploadDisabled =
    props.uploading || props.imageSlotsFull || imageUploadUnavailable;
  const fileUploadDisabled = props.uploading || props.fileSlotsFull;
  const imageUploadStatus = imageUploadUnavailable
    ? Locale.Chat.ChatToolMenu.ImageUploadUnavailable
    : props.imageSlotsFull
    ? Locale.Chat.Attachments.ImageSlotsFull
    : Locale.Chat.ChatToolMenu.Capacity;
  const fileUploadStatus = props.fileSlotsFull
    ? Locale.Chat.Attachments.FileSlotsFull
    : Locale.Chat.ChatToolMenu.Capacity;

  return (
    <div className={styles["chat-input-actions"]}>
      <div className={styles["chat-multimodal-tray"]}>
        <div
          className={clsx(
            styles["chat-multimodal-section"],
            styles["chat-multimodal-section-primary"],
          )}
          role="group"
          aria-label={Locale.Chat.ChatToolMenu.MultimodalTools}
        >
          <div className={styles["chat-multimodal-section-header"]}>
            <span className={styles["chat-multimodal-section-title"]}>
              <span>{Locale.Chat.ChatToolMenu.AddContent}</span>
            </span>
            <span className={styles["chat-multimodal-section-subtitle"]}>
              <span>{Locale.Chat.ChatToolMenu.FilesAndImages}</span>
            </span>
            <span
              id="chat-multimodal-upload-state"
              className={clsx(
                styles["chat-multimodal-section-meta"],
                props.imageSlotsFull &&
                  props.fileSlotsFull &&
                  styles["chat-multimodal-section-meta-warning"],
              )}
              aria-live="polite"
            >
              {props.imageSlotsFull && props.fileSlotsFull
                ? Locale.Chat.ChatToolMenu.Full
                : Locale.Chat.ChatToolMenu.Capacity}
            </span>
          </div>
          <span
            id="chat-image-upload-state"
            className={styles["chat-input-action-status"]}
          >
            {imageUploadStatus}
          </span>
          <span
            id="chat-file-upload-state"
            className={styles["chat-input-action-status"]}
          >
            {fileUploadStatus}
          </span>
          <ChatAction
            onClick={() => {
              if (imageUploadDisabled) return;
              props.uploadImages();
              completeMobileAction();
            }}
            text={Locale.Chat.ChatToolMenu.UploadImage}
            description={Locale.Chat.ChatToolMenu.UploadImageDescription}
            icon={props.uploading ? <LoadingButtonIcon /> : <ImageIcon />}
            ariaDescribedBy="chat-image-upload-state"
            ariaBusy={props.uploading}
            disabled={imageUploadDisabled}
            title={
              imageUploadUnavailable
                ? Locale.Chat.ChatToolMenu.ImageUploadUnavailable
                : props.imageSlotsFull
                ? Locale.Chat.Attachments.ImageSlotsFull
                : undefined
            }
          />
          <ChatAction
            onClick={() => {
              if (fileUploadDisabled) return;
              props.uploadFiles();
              completeMobileAction();
            }}
            text={Locale.Chat.ChatToolMenu.UploadFile}
            description={Locale.Chat.ChatToolMenu.UploadFileDescription}
            icon={props.uploading ? <LoadingButtonIcon /> : <FileIcon />}
            ariaDescribedBy="chat-file-upload-state"
            ariaBusy={props.uploading}
            disabled={fileUploadDisabled}
            title={
              props.fileSlotsFull
                ? Locale.Chat.Attachments.FileSlotsFull
                : undefined
            }
          />
          <ChatAction
            onClick={() => props.openPromptLibrary()}
            text={Locale.Chat.ChatToolMenu.PromptLibrary}
            description={Locale.Chat.ChatToolMenu.PromptLibraryDescription}
            icon={<PromptIcon />}
            ariaHasPopup="dialog"
            ariaExpanded={false}
            dataChatAction="prompt-library"
          />
        </div>

        {hasSessionActions && (
          <div
            className={clsx(
              styles["chat-multimodal-section"],
              styles["chat-multimodal-section-session"],
            )}
            role="group"
            aria-label={Locale.Chat.ChatToolMenu.SessionTools}
          >
            <div className={styles["chat-multimodal-section-header"]}>
              <span className={styles["chat-multimodal-section-title"]}>
                <span>{Locale.Chat.ChatToolMenu.Session}</span>
              </span>
              <span className={styles["chat-multimodal-section-subtitle"]}>
                <span>{Locale.Chat.ChatToolMenu.ModelsAndSettings}</span>
              </span>
            </div>
            {couldStop && (
              <ChatAction
                onClick={stopAll}
                text={Locale.Chat.InputActions.Stop}
                icon={<StopIcon />}
              />
            )}
            {!props.hitBottom && (
              <ChatAction
                onClick={props.scrollToBottom}
                text={Locale.Chat.InputActions.ToBottom}
                icon={<BottomIcon />}
              />
            )}
            {false && props.hitBottom && (
              <ChatAction
                onClick={() => {
                  props.showPromptModal();
                  completeMobileAction();
                }}
                text={Locale.Chat.InputActions.Settings}
                icon={<SettingsIcon />}
              />
            )}

            {false && config.enableThemeChange && (
              <ChatAction
                onClick={nextTheme}
                text={Locale.Chat.InputActions.Theme[theme]}
                icon={
                  <>
                    {theme === Theme.Auto ? (
                      <AutoIcon />
                    ) : theme === Theme.Light ? (
                      <LightIcon />
                    ) : theme === Theme.Dark ? (
                      <DarkIcon />
                    ) : null}
                  </>
                }
              />
            )}

            {config.enableClearContext && hasClearableContext && (
              <ChatAction
                text={Locale.Chat.InputActions.Clear}
                icon={<BreakIcon />}
                onClick={() => {
                  chatStore.updateTargetSession(session, (session) => {
                    if (session.clearContextIndex === session.messages.length) {
                      session.clearContextIndex = undefined;
                    } else {
                      session.clearContextIndex = session.messages.length;
                      session.memoryPrompt = ""; // will clear memory
                    }
                  });
                  requestAnimationFrame(() => props.scrollToBottom());
                  completeMobileAction();
                }}
              />
            )}

            {false && (
              <ChatAction
                onClick={() => {
                  if (modelLocked) {
                    showToast(
                      Locale.Settings.GPT56Capabilities.ConfigSource.Locked,
                    );
                    return;
                  }
                  setActionModalOpen("model", true);
                }}
                text={currentModelName}
                ariaHasPopup="listbox"
                ariaExpanded={actionModals.model}
                icon={<RobotIcon />}
              />
            )}

            {!isCompactScreen && actionModals.model && (
              <Selector
                defaultSelectedValue={`${currentModel}@${currentProviderName}`}
                items={models.map((m) => ({
                  title: `${m.displayName}${
                    m?.provider?.providerName
                      ? " (" + m?.provider?.providerName + ")"
                      : ""
                  }`,
                  value: `${m.name}@${m?.provider?.providerName}`,
                  icon: (
                    <Avatar
                      model={m.name}
                      provider={m?.provider?.providerName}
                    />
                  ),
                }))}
                onClose={() => setActionModalOpen("model", false)}
                onSelection={(m) => {
                  if (modelLocked) return;
                  if (m.length === 0) return;
                  const [model, providerName] = getModelProvider(m[0]);
                  chatStore.updateTargetSession(session, (session) => {
                    session.mask.modelConfig.model = model as ModelType;
                    session.mask.modelConfig.providerName =
                      providerName as ServiceProvider;
                    applyConfiguredOpenAIResponsesReasoningEffortDefault({
                      config: session.mask.modelConfig,
                      configMeta: session.mask.modelConfigMeta,
                      defaults:
                        config.serverConfigSnapshot?.reasoningEffortDefaults,
                    });
                    applyOpenAIResponsesModelConstraints(
                      session.mask.modelConfig,
                    );
                    applyOpenAIImageGenerationDefaults(
                      session.mask.modelConfig,
                    );
                    session.mask.modelConfigMeta = {
                      ...(session.mask.modelConfigMeta ?? {}),
                      model: createConfigFieldMeta({
                        source: "conversation_override",
                        publicConfig: config.serverConfigSnapshot,
                      }),
                      providerName: createConfigFieldMeta({
                        source: "conversation_override",
                        publicConfig: config.serverConfigSnapshot,
                      }),
                    };
                    session.mask.syncGlobalConfig = false;
                    // 如果切换到非 gemini-2.0-flash-exp 模型，清除插件选择
                    if (model !== "gemini-2.0-flash-exp") {
                      session.mask.plugin = [];
                    }
                  });
                  showToast(model);
                }}
                showSearch={config.enableModelSearch ?? false}
              />
            )}

            {false && isOpenAIImageGeneration && (
              <ChatAction
                onClick={() => setActionModalOpen("size", true)}
                text={currentSize}
                ariaHasPopup="listbox"
                ariaExpanded={actionModals.size}
                icon={<SizeIcon />}
              />
            )}

            {!isCompactScreen &&
              isOpenAIImageGeneration &&
              actionModals.size && (
                <Selector
                  defaultSelectedValue={currentSize}
                  items={imageSizes.map((m) => ({
                    title: m,
                    value: m,
                  }))}
                  onClose={() => setActionModalOpen("size", false)}
                  onSelection={(s) => {
                    if (s.length === 0) return;
                    const size = s[0] as OpenAIImageSize;
                    chatStore.updateTargetSession(session, (session) => {
                      session.mask.modelConfig.size = size;
                    });
                    showToast(size);
                  }}
                  showSearch={false}
                />
              )}

            {false && isOpenAIImageGeneration && imageQualitys.length > 0 && (
              <ChatAction
                onClick={() => setActionModalOpen("quality", true)}
                text={currentQuality}
                ariaHasPopup="listbox"
                ariaExpanded={actionModals.quality}
                icon={<QualityIcon />}
              />
            )}

            {!isCompactScreen &&
              isOpenAIImageGeneration &&
              imageQualitys.length > 0 &&
              actionModals.quality && (
                <Selector
                  defaultSelectedValue={currentQuality}
                  items={imageQualitys.map((m) => ({
                    title: m,
                    value: m,
                  }))}
                  onClose={() => setActionModalOpen("quality", false)}
                  onSelection={(q) => {
                    if (q.length === 0) return;
                    const quality = q[0] as OpenAIImageQuality;
                    chatStore.updateTargetSession(session, (session) => {
                      session.mask.modelConfig.quality = quality;
                    });
                    showToast(quality);
                  }}
                  showSearch={false}
                />
              )}

            {false && isDalle3Model && (
              <ChatAction
                onClick={() => setActionModalOpen("style", true)}
                text={currentStyle}
                ariaHasPopup="listbox"
                ariaExpanded={actionModals.style}
                icon={<StyleIcon />}
              />
            )}

            {!isCompactScreen && actionModals.style && (
              <Selector
                defaultSelectedValue={currentStyle}
                items={dalle3Styles.map((m) => ({
                  title: m,
                  value: m,
                }))}
                onClose={() => setActionModalOpen("style", false)}
                onSelection={(s) => {
                  if (s.length === 0) return;
                  const style = s[0] as DalleStyle;
                  chatStore.updateTargetSession(session, (session) => {
                    session.mask.modelConfig.style = style;
                  });
                  showToast(style);
                }}
                showSearch={false}
              />
            )}

            {false && shouldShowPluginAction && (
              <ChatAction
                onClick={() => setActionModalOpen("plugin", true)}
                text={Locale.Plugin.Name}
                ariaHasPopup="listbox"
                ariaExpanded={actionModals.plugin}
                icon={<PluginIcon />}
              />
            )}
            {!isCompactScreen && actionModals.plugin && (
              <SimpleMultipleSelector
                items={pluginSelectorItems}
                defaultSelectedValue={chatStore.currentSession().mask?.plugin}
                onClose={() => setActionModalOpen("plugin", false)}
                onSelection={(s) => {
                  chatStore.updateTargetSession(session, (session) => {
                    session.mask.plugin = s;
                  });
                }}
                showSearch={false}
              />
            )}
          </div>
        )}
      </div>
      <div className={styles["chat-input-actions-end"]}>
        {!isCompactScreen &&
          ENABLE_REALTIME_CHAT &&
          config.realtimeConfig.enable && (
            <ChatAction
              onClick={() => props.setShowChatSidePanel(true)}
              text={"Realtime Chat"}
              icon={<HeadphoneIcon />}
            />
          )}
      </div>
    </div>
  );
}

export function ChatActions(props: ChatActionsProps) {
  return useChatActionsView(props);
}

function ChatInputReasoningAction() {
  const accessStore = useAccessStore();
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const currentModel = session.mask.modelConfig.model;
  const currentProviderName =
    session.mask.modelConfig?.providerName || ServiceProvider.OpenAI;
  const currentReasoningEffort = normalizeOpenAIResponsesReasoningEffort(
    session.mask.modelConfig?.reasoningEffort ??
      OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
    currentModel,
  );
  const currentReasoningEfforts = filterOpenAIResponsesReasoningEfforts(
    currentModel,
    accessStore.serverConfigSnapshot?.reasoningEffortAllowlist,
  );
  const visibleCurrentReasoningEfforts =
    includeCurrentOpenAIResponsesReasoningEffort(
      currentReasoningEfforts,
      currentReasoningEffort,
    );
  const [showReasoningSelectorModal, setShowReasoningSelectorModal] =
    useState(false);
  const reasoningLocked =
    accessStore.lockedFields?.includes("reasoningEffort") ||
    session.mask.modelConfigMeta?.reasoningEffort?.locked;
  const showReasoningSelector =
    visibleCurrentReasoningEfforts.length > 0 &&
    isOpenAIResponsesReasoningModelConfig({
      model: currentModel,
      providerName: currentProviderName,
    });
  const getReasoningMaxOutputTokens = (effort: OpenAIChatReasoningEffort) =>
    clampOpenAIResponsesMaxOutputTokens(
      accessStore.openaiMaxOutputTokens ??
        getMaxOutputTokensForReasoningEffort(effort),
      currentModel,
    );

  if (!showReasoningSelector) return null;

  const openReasoningSelector = () => {
    if (reasoningLocked) {
      showToast(Locale.Settings.GPT56Capabilities.ConfigSource.Locked);
      return;
    }
    setShowReasoningSelectorModal(true);
  };
  const selectReasoningEffort = (selection: OpenAIChatReasoningEffort[]) => {
    if (reasoningLocked) return;
    const reasoningEffort = selection[0];
    if (!reasoningEffort) return;
    chatStore.updateTargetSession(session, (session) => {
      session.mask.modelConfig.reasoningEffort = reasoningEffort;
      session.mask.modelConfig.max_output_tokens =
        getReasoningMaxOutputTokens(reasoningEffort);
      session.mask.modelConfigMeta = {
        ...(session.mask.modelConfigMeta ?? {}),
        reasoningEffort: createConfigFieldMeta({
          source: "conversation_override",
          publicConfig: useAppConfig.getState().serverConfigSnapshot,
        }),
        max_output_tokens: createConfigFieldMeta({
          source: "conversation_override",
          publicConfig: useAppConfig.getState().serverConfigSnapshot,
        }),
      };
      session.mask.syncGlobalConfig = false;
    });
    showToast(reasoningLabels[reasoningEffort]);
  };

  return (
    <>
      <button
        type="button"
        className={clsx(
          styles["chat-input-mode-chip"],
          styles["chat-input-reasoning"],
        )}
        onClick={(event) => {
          event.preventDefault();
          openReasoningSelector();
        }}
        disabled={reasoningLocked || currentReasoningEfforts.length === 0}
        aria-label={Locale.Chat.ModelMenu.SelectedReasoning(
          reasoningLabels[currentReasoningEffort],
        )}
        aria-haspopup="dialog"
        aria-expanded={showReasoningSelectorModal}
      >
        <BrainIcon />
        <span>{reasoningLabels[currentReasoningEffort]}</span>
        <span
          className={styles["chat-input-reasoning-arrow"]}
          aria-hidden="true"
        >
          <ComposerChevronDownIcon />
        </span>
      </button>
      {showReasoningSelectorModal && (
        <Selector
          ariaLabel={Locale.Chat.ModelMenu.SelectedReasoning(
            reasoningLabels[currentReasoningEffort],
          )}
          defaultSelectedValue={currentReasoningEffort}
          items={visibleCurrentReasoningEfforts.map((effort) => ({
            title: reasoningLabels[effort],
            value: effort,
            disable: !currentReasoningEfforts.some(
              (allowedEffort) => allowedEffort === effort,
            ),
            icon: <BrainIcon />,
          }))}
          onClose={() => setShowReasoningSelectorModal(false)}
          onSelection={selectReasoningEffort}
          showSearch={false}
        />
      )}
    </>
  );
}

export function EditMessageModal(props: { onClose: () => void }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const [messages, setMessages] = useState(() => session.messages.slice());

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Chat.EditMessage.Title}
        onClose={props.onClose}
        actions={[
          <IconButton
            text={Locale.UI.Cancel}
            icon={<CancelIcon />}
            key="cancel"
            onClick={() => {
              props.onClose();
            }}
          />,
          <IconButton
            type="primary"
            text={Locale.UI.Confirm}
            icon={<ConfirmIcon />}
            key="ok"
            onClick={() => {
              chatStore.updateTargetSession(
                session,
                (session) => (session.messages = messages),
              );
              props.onClose();
            }}
          />,
        ]}
      >
        <List>
          <ListItem
            title={Locale.Chat.EditMessage.Topic.Title}
            subTitle={Locale.Chat.EditMessage.Topic.SubTitle}
          >
            <input
              type="text"
              aria-label={Locale.Chat.EditMessage.Topic.Title}
              value={session.topic}
              onChange={(e) =>
                chatStore.updateTargetSession(
                  session,
                  (session) => (session.topic = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </List>
        <ContextPrompts
          context={messages}
          updateContext={(updater) => {
            const newMessages = messages.slice();
            updater(newMessages);
            setMessages(newMessages);
          }}
        />
      </Modal>
    </div>
  );
}

export function DeleteImageButton(props: {
  ariaLabel: string;
  deleteImage: (e?: any) => void;
}) {
  return (
    <button
      type="button"
      className={styles["delete-image"]}
      aria-label={props.ariaLabel}
      onClick={props.deleteImage}
    >
      <DeleteIcon />
    </button>
  );
}

export function ShortcutKeyModal(props: { onClose: () => void }) {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const shortcutKeyModalTitleId = "shortcut-key-modal-title";
  const closeShortcutKeyModal = () => {
    props.onClose();
  };
  const shortcuts = [
    {
      title: Locale.Chat.ShortcutKey.newChat,
      keys: isMac ? ["⌘", "Shift", "O"] : ["Ctrl", "Shift", "O"],
    },
    { title: Locale.Chat.ShortcutKey.focusInput, keys: ["Shift", "Esc"] },
    {
      title: Locale.Chat.ShortcutKey.copyLastCode,
      keys: isMac ? ["⌘", "Shift", ";"] : ["Ctrl", "Shift", ";"],
    },
    {
      title: Locale.Chat.ShortcutKey.copyLastMessage,
      keys: isMac ? ["⌘", "Shift", "C"] : ["Ctrl", "Shift", "C"],
    },
    {
      title: Locale.Chat.ShortcutKey.showShortcutKey,
      keys: isMac ? ["⌘", "/"] : ["Ctrl", "/"],
    },
  ];
  return (
    <div
      className="modal-mask"
      id="shortcut-key-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={shortcutKeyModalTitleId}
    >
      <Modal
        title={
          <span id={shortcutKeyModalTitleId}>
            {Locale.Chat.ShortcutKey.Title}
          </span>
        }
        onClose={closeShortcutKeyModal}
        actions={[
          <IconButton
            type="primary"
            text={Locale.UI.Confirm}
            icon={<ConfirmIcon />}
            key="ok"
            autoFocus
            onClick={closeShortcutKeyModal}
          />,
        ]}
      >
        <div className={styles["shortcut-key-container"]}>
          <div
            className={styles["shortcut-key-grid"]}
            role="list"
            aria-label={Locale.Chat.ShortcutKey.Title}
          >
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.title}
                className={styles["shortcut-key-item"]}
                role="listitem"
                aria-label={`${shortcut.title}: ${shortcut.keys.join(" + ")}`}
              >
                <div className={styles["shortcut-key-title"]}>
                  {shortcut.title}
                </div>
                <div className={styles["shortcut-key-keys"]}>
                  {shortcut.keys.map((key) => (
                    <div
                      key={`${shortcut.title}-${key}`}
                      className={styles["shortcut-key"]}
                    >
                      <span>{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function useChatInnerView() {
  const chatStore = useChatStore((state) => {
    const session = state.currentSession();
    const tailMessage = session.messages.at(-1);

    return {
      session,
      tailContent: tailMessage ? getMessageTextContent(tailMessage) : "",
      tailStreaming: tailMessage?.streaming ?? false,
      messageProjectionRevision: state.messageProjectionRevision,
      currentSessionIndex: state.currentSessionIndex,
      lastInput: state.lastInput,
      updateTargetSession: state.updateTargetSession,
      newSession: state.newSession,
      nextSession: state.nextSession,
      forkSession: state.forkSession,
      deleteSession: state.deleteSession,
      setLastInput: state.setLastInput,
      onUserInput: state.onUserInput,
      summarizeSession: state.summarizeSession,
    };
  }, shallow);
  const session = chatStore.session;
  const updateTargetSession = chatStore.updateTargetSession;
  const visibleChatMessagesProjectorRef = useRef<
    ReturnType<typeof createVisibleChatMessagesProjector> | undefined
  >(undefined);
  const projectVisibleChatMessages =
    visibleChatMessagesProjectorRef.current ??
    (visibleChatMessagesProjectorRef.current =
      createVisibleChatMessagesProjector());
  const config = useAppConfig();
  const fontSize = config.fontSize;
  const fontFamily = config.fontFamily;

  const [showExport, setShowExport] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatComposerShellRef = useRef<HTMLDivElement>(null);
  const chatInputPanelRef = useRef<HTMLDivElement>(null);
  const chatInputMenuButtonRef = useRef<HTMLButtonElement>(null);
  const chatInputActionMenuRef = useRef<HTMLDivElement>(null);
  const composerViewportSegmentRef = useRef<HTMLSpanElement>(null);
  const unfinishedInputKey = UNFINISHED_INPUT(session.id);
  const [userInput, setUserInput] = useState(
    () => localStorage.getItem(unfinishedInputKey) ?? "",
  );
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const [isLoading, setIsLoading] = useReducer(
    (_: boolean, next: boolean) => next,
    false,
  );
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const scrollRef = useRef<HTMLDivElement>(null);
  const readingSurfaceRef = useRef<HTMLDivElement>(null);
  const [hitBottom, setHitBottom] = useState(true);
  const [hitTop, setHitTop] = useState(true);
  const [quickJumpTarget, setQuickJumpTarget] =
    useState<ChatScrollTarget>("bottom");
  const lastObservedScrollTopRef = useRef(0);
  const scrollDirectionAccumulatorRef = useRef(0);
  const pendingQuickJumpTargetRef = useRef<ChatScrollTarget | null>(null);
  const msgRenderIndexRef = useRef(0);
  const attachWithTopRef = useRef(false);
  const lastSessionMessage = session.messages.at(-1);
  const messageScrollSignal = `${session.messages.length}:${
    lastSessionMessage?.id ?? ""
  }:${
    lastSessionMessage ? getMessageTextContent(lastSessionMessage).length : 0
  }:${lastSessionMessage?.streaming ? 1 : 0}`;
  const shouldFollowLatestMessage = hitBottom || attachWithTopRef.current;
  const { autoScroll, setAutoScroll, scrollDomToBottom } = useScrollToBottom(
    scrollRef,
    shouldFollowLatestMessage,
    messageScrollSignal,
  );
  const autoScrollRef = useRef(autoScroll);
  autoScrollRef.current = autoScroll;
  const isMobileScreen = useMobileScreen();
  const isCompactScreen = useCompactScreen();
  useLayoutEffect(() => {
    setHitTop(true);
    setHitBottom(true);
    setQuickJumpTarget("bottom");
    pendingQuickJumpTargetRef.current = null;
    lastObservedScrollTopRef.current = scrollRef.current?.scrollTop ?? 0;
    scrollDirectionAccumulatorRef.current = 0;
  }, [session.id, scrollRef]);
  const syncHitBottomState = useCallback(
    (e: HTMLElement, syncAutoScroll = false) => {
      const bottomHeight = e.scrollTop + e.clientHeight;
      const edgeTolerance = isMobileScreen ? 4 : 10;
      const isHitTop =
        msgRenderIndexRef.current === 0 && e.scrollTop <= edgeTolerance;
      const isHitBottom = bottomHeight >= e.scrollHeight - edgeTolerance;
      const lastMessage = readingSurfaceRef.current
        ?.lastElementChild as HTMLElement | null;
      attachWithTopRef.current = lastMessage
        ? lastMessage.offsetTop - e.scrollTop < 100
        : false;

      setHitTop(isHitTop);
      setHitBottom(isHitBottom);
      if (syncAutoScroll) {
        autoScrollRef.current = isHitBottom;
        setAutoScroll(isHitBottom);
      }

      return { bottomHeight, isHitBottom, isHitTop };
    },
    [isMobileScreen, setAutoScroll],
  );
  const navigate = useNavigate();
  const location = useLocation();
  const [chatQaFixture, setChatQaFixture] = useState<ChatQaFixture>();
  useEffect(() => {
    let active = true;
    void loadChatQaFixture(location.search).then((fixture) => {
      if (active) setChatQaFixture(fixture);
    });
    return () => {
      active = false;
    };
  }, [location.search]);
  const markdownStressQaEnabled = useMemo(
    () => chatQaFixture?.isMarkdownStressQaEnabled(location.search) ?? false,
    [chatQaFixture, location.search],
  );
  const markdownStressQaInteractiveInputEnabled = useMemo(
    () =>
      chatQaFixture?.isMarkdownStressQaInteractiveInputEnabled(
        location.search,
      ) ?? false,
    [chatQaFixture, location.search],
  );
  const imageGalleryQaEnabled = useMemo(
    () => chatQaFixture?.isImageGalleryQaEnabled(location.search) ?? false,
    [chatQaFixture, location.search],
  );
  const composerQaScenario = useMemo(
    () => chatQaFixture?.getComposerQaScenario(location.search),
    [chatQaFixture, location.search],
  );
  const composerQaSeed = useMemo(
    () =>
      composerQaScenario
        ? chatQaFixture?.getComposerQaSeed(composerQaScenario.state)
        : undefined,
    [chatQaFixture, composerQaScenario],
  );
  useEffect(() => {
    const theme = composerQaScenario?.theme;
    if (!theme) return;

    const body = document.body;
    const previousLight = body.classList.contains("light");
    const previousDark = body.classList.contains("dark");
    const applyTheme = () => {
      const resolvedTheme =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      body.classList.remove("light", "dark");
      body.classList.add(resolvedTheme);
    };
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme();
    if (theme === "system") colorScheme.addEventListener("change", applyTheme);

    return () => {
      if (theme === "system") {
        colorScheme.removeEventListener("change", applyTheme);
      }
      body.classList.remove("light", "dark");
      if (previousLight) body.classList.add("light");
      if (previousDark) body.classList.add("dark");
    };
  }, [composerQaScenario?.theme]);
  const markdownStressQaDropzonePreview = useMemo(
    () =>
      markdownStressQaEnabled
        ? chatQaFixture?.getMarkdownStressQaDropzonePreviewVariant(
            location.search,
          )
        : undefined,
    [chatQaFixture, location.search, markdownStressQaEnabled],
  );
  const markdownStressQaAttachmentStripPreview = useMemo(
    () =>
      markdownStressQaEnabled
        ? chatQaFixture?.getMarkdownStressQaAttachmentStripPreviewVariant(
            location.search,
          )
        : undefined,
    [chatQaFixture, location.search, markdownStressQaEnabled],
  );
  const [attachImages, setAttachImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileInfo[]>([]);
  const attachmentsContainerRef = useRef<HTMLDivElement>(null);
  const attachmentSwipeStartRef = useRef<AttachmentSwipeStart | null>(null);
  const activeAttachmentDeleteKeyRef = useRef<string | null>(null);
  const [activeAttachmentDeleteKey, setActiveAttachmentDeleteKey] = useState<
    string | null
  >(null);
  const [attachmentScrollHint, setAttachmentScrollHint] = useState({
    start: false,
    end: false,
  });
  const [dragActive, setDragActive] = useState(false);
  const [dragPayloadSummary, setDragPayloadSummary] =
    useState<DraggedAttachmentSummary | null>(null);
  const dragCounter = useRef(0);
  const composerQaDropzoneSummary = composerQaScenario
    ? chatQaFixture?.getComposerQaDropzoneSummary(composerQaScenario.state)
    : undefined;
  const dropzonePreviewSummary = markdownStressQaDropzonePreview
    ? chatQaFixture?.MARKDOWN_STRESS_QA_DROPZONE_PREVIEW_SUMMARIES[
        markdownStressQaDropzonePreview
      ]
    : composerQaDropzoneSummary;
  const dropzonePayloadSummary = dropzonePreviewSummary ?? dragPayloadSummary;
  const isDropzonePreviewActive = dragActive || dropzonePreviewSummary != null;

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const attachedFilesRef = useRef(attachedFiles);
  const attachImagesRef = useRef(attachImages);
  useEffect(() => {
    attachedFilesRef.current = attachedFiles;
  }, [attachedFiles]);
  useEffect(() => {
    attachImagesRef.current = attachImages;
  }, [attachImages]);

  useEffect(() => {
    let resizeFrame = 0;

    const syncHitBottomAfterResize = () => {
      if (resizeFrame) {
        cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;

        const dom = scrollRef.current;
        if (dom) {
          if (autoScrollRef.current) {
            pendingQuickJumpTargetRef.current = "bottom";
          }
          if (followChatTailAfterResize(dom, autoScrollRef.current)) {
            lastObservedScrollTopRef.current = Math.max(
              0,
              dom.scrollHeight - dom.clientHeight,
            );
            scrollDirectionAccumulatorRef.current = 0;
            setQuickJumpTarget("bottom");
          }
          syncHitBottomState(dom);
        }
      });
    };

    let contentResizeObserver: ResizeObserver | undefined;
    const readingSurface = readingSurfaceRef.current;
    if (typeof ResizeObserver !== "undefined" && readingSurface) {
      contentResizeObserver = new ResizeObserver(syncHitBottomAfterResize);
      contentResizeObserver.observe(readingSurface);
    }

    syncHitBottomAfterResize();
    window.addEventListener("resize", syncHitBottomAfterResize);

    return () => {
      window.removeEventListener("resize", syncHitBottomAfterResize);

      if (resizeFrame) {
        cancelAnimationFrame(resizeFrame);
      }

      contentResizeObserver?.disconnect();
    };
  }, [scrollRef, session.id, syncHitBottomState]);

  useEffect(() => {
    if (typeof ResizeObserver !== "undefined") return;
    const resizeFrame = requestAnimationFrame(() => {
      const dom = scrollRef.current;
      if (dom) {
        syncHitBottomState(dom);
      }
    });
    return () => cancelAnimationFrame(resizeFrame);
  }, [messageScrollSignal, session.id, syncHitBottomState]);

  // prompt hints
  const promptStore = usePromptStore();
  const [promptHints, setPromptHints] = useState<RenderPrompt[]>([]);
  const [isTextareaExpanded, setIsTextareaExpanded] = useState(false);
  const [isTextareaScrolling, setIsTextareaScrolling] = useState(false);
  const [showChatActionMenu, setShowChatActionMenu] = useState(false);
  const [chatActionMenuView, setChatActionMenuView] =
    useState<ChatActionMenuView>("main");
  const composerTextareaExpandedRef = useRef(false);
  const composerMeasurementFrozenRef = useRef(false);

  useEffect(() => {
    if (!showChatActionMenu) {
      setChatActionMenuView("main");
    }
  }, [showChatActionMenu]);

  useEffect(() => {
    if (!markdownStressQaAttachmentStripPreview || !chatQaFixture) return;

    const seededAttachments =
      chatQaFixture.createMarkdownStressQaAttachmentStripPreview(
        markdownStressQaAttachmentStripPreview,
      );
    setAttachImages(seededAttachments.images);
    setAttachedFiles(seededAttachments.files);
  }, [chatQaFixture, markdownStressQaAttachmentStripPreview]);

  const hasComposerAttachments =
    attachImages.length > 0 || attachedFiles.length > 0;
  const isComposerReadOnly =
    markdownStressQaEnabled && !markdownStressQaInteractiveInputEnabled;
  const streamingMessageIds = session.messages
    .filter((message) => message.streaming)
    .map((message) => message.id);
  const hasActiveInputContent =
    userInput.trim().length > 0 ||
    hasComposerAttachments ||
    promptHints.length > 0;
  const hasSubmittableComposerContent =
    userInput.trim().length > 0 || hasComposerAttachments;
  const composerSubmitState = getComposerSubmitState({
    hasContent: hasSubmittableComposerContent,
    uploading,
    readOnly: isComposerReadOnly,
    loading: isLoading,
    streamingMessageIds,
  });
  const displayedComposerSubmitState =
    composerQaSeed?.submitState ?? composerSubmitState;
  const showComposerVoice =
    ENABLE_REALTIME_CHAT && config.realtimeConfig.enable;
  const canAddMoreAttachments =
    attachImages.length < 3 || attachedFiles.length < 5;
  const imageSlotsFull = attachImages.length >= 3;
  const fileSlotsFull = attachedFiles.length >= 5;
  const attachmentSlotsFull = imageSlotsFull && fileSlotsFull;
  const shouldExpandChatInput = hasComposerAttachments || isTextareaExpanded;
  const closePromptHints = useCallback((options?: PromptHintsCloseOptions) => {
    setPromptHints([]);
    if (options?.restoreFocus) {
      inputRef.current?.focus();
    }
  }, []);

  const onSearch = useDebouncedCallback(
    (text: string) => {
      const matchedPrompts = promptStore.search(text);
      setPromptHints(matchedPrompts);
    },
    100,
    { leading: true, trailing: true },
  );

  // chat commands shortcuts
  const chatCommands = useChatCommand({
    new: () => chatStore.newSession(),
    newm: () => navigate(Path.NewChat),
    prev: () => chatStore.nextSession(-1),
    next: () => chatStore.nextSession(1),
    clear: () =>
      chatStore.updateTargetSession(
        session,
        (session) => (session.clearContextIndex = session.messages.length),
      ),
    fork: () => chatStore.forkSession(),
    del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
  });

  // only search prompts when user input is short
  const SEARCH_TEXT_LIMIT = 30;
  const onInput = (text: string) => {
    const MAX_TEXT_LENGTH = 3000; // 最大文本长度

    if (showChatActionMenu && text.trim().length > 0) {
      setShowChatActionMenu(false);
    }

    // 修改输入文本处理逻辑
    if (text.length > MAX_TEXT_LENGTH && userInput.length <= MAX_TEXT_LENGTH) {
      // 截断过长的文本内容
      const MAX_FILE_CONTENT_LENGTH = 100000; // 与上传文件相同的最大内容长度
      const truncatedText =
        text.length > MAX_FILE_CONTENT_LENGTH
          ? text.substring(0, MAX_FILE_CONTENT_LENGTH) +
            `\n\n${Locale.Chat.Attachments.Reader.ContentTruncated(
              text.length,
            )}`
          : text;

      // 将长文本转换为文件附件
      const inputTextFileName = Locale.Chat.Attachments.InputTextFile(
        new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-"),
      );
      const longTextFile: FileInfo = {
        name: inputTextFileName,
        type: "text/plain",
        size: text.length,
        content: truncatedText,
        originalFile: new File([text], inputTextFileName, {
          type: "text/plain",
        }),
      };

      // 添加到文件附件列表
      setAttachedFiles([...attachedFiles, longTextFile]);

      // 清空输入框
      setUserInput("");

      // 显示提示
      showToast(Locale.Chat.Attachments.TextConverted);

      // 如果文本被截断，显示额外提示
      if (text.length > MAX_FILE_CONTENT_LENGTH) {
        showToast(
          Locale.Chat.Attachments.ContentTruncated(MAX_FILE_CONTENT_LENGTH),
        );
      }

      return;
    }

    setUserInput(text);
    const n = text.trim().length;

    // 只有在启用快捷指令功能时才处理 "/" 开头的输入
    if (n === 1 && text === "/" && config.enablePromptHints) {
      setPromptHints(promptStore.search(""));
    } else if (!config.enablePromptHints || text !== "/" || n > 1) {
      // 当功能关闭或不是单独的 "/" 时,清空提示
      setPromptHints([]);
    }
  };

  const doSubmit = (userInput: string) => {
    const submitState = getComposerSubmitState({
      hasContent:
        userInput.trim().length > 0 ||
        attachImages.length > 0 ||
        attachedFiles.length > 0,
      uploading,
      readOnly: isComposerReadOnly,
      loading: isLoading,
      streamingMessageIds,
    });
    if (submitState !== "send") {
      return;
    }

    if (
      userInput.trim() === "" &&
      isEmpty(attachImages) &&
      attachedFiles.length === 0
    )
      return;

    // 检查是否有长文本需要转换为文件
    let finalUserInput = userInput;
    const filesToSend = [...attachedFiles];
    const MAX_TEXT_LENGTH = 3000; // 最大文本长度

    if (userInput.length > MAX_TEXT_LENGTH) {
      // 将长文本转换为文件附件
      const longTextFileName = Locale.Chat.Attachments.LongTextFile;
      const longTextFile: FileInfo = {
        name: longTextFileName,
        type: "text/plain",
        size: userInput.length,
        content: userInput,
        originalFile: new File([userInput], longTextFileName, {
          type: "text/plain",
        }),
      };

      filesToSend.push(longTextFile);

      // 替换用户输入为提示信息
      finalUserInput = Locale.Chat.Attachments.LongTextMessage;

      // 显示提示
      showToast(Locale.Chat.Attachments.TextConverted);
    }

    // 如果有附加文件，将文件信息添加到用户输入
    if (filesToSend.length > 0) {
      const fileInfosText = filesToSend
        .map(formatAttachmentForPrompt)
        .join("\n\n---\n\n");

      finalUserInput = finalUserInput
        ? `${finalUserInput}\n\n${fileInfosText}`
        : fileInfosText;
    }

    const matchCommand = chatCommands.match(finalUserInput);
    if (matchCommand.matched) {
      setUserInput("");
      setPromptHints([]);
      matchCommand.invoke();
      return;
    }

    setIsLoading(true);
    chatStore
      .onUserInput(finalUserInput, attachImages)
      .then(() => setIsLoading(false));

    setAttachImages([]);
    setAttachedFiles([]); // 清除附加文件
    chatStore.setLastInput(finalUserInput);
    setUserInput("");
    setPromptHints([]);
    if (!isCompactScreen) {
      inputRef.current?.focus();
    }
    setAutoScroll(true);
  };

  const onPromptSelect = (prompt: RenderPrompt) => {
    setTimeout(() => {
      setPromptHints([]);

      const promptContent = prompt.content.trimEnd();
      const matchedChatCommand = chatCommands.match(promptContent);
      if (matchedChatCommand.matched) {
        // if user is selecting a chat command, just trigger it
        matchedChatCommand.invoke();
        setUserInput("");
      } else {
        // or fill the prompt
        setUserInput(promptContent);
      }
      inputRef.current?.focus();
    }, 30);
  };

  // stop response
  const onUserStop = (messageId: string) => {
    ChatControllerPool.stop(session.id, messageId);
  };
  const stopComposerResponse = () => {
    streamingMessageIds.forEach(onUserStop);
  };

  useEffect(() => {
    updateTargetSession(session, (session) => {
      const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
      session.messages.forEach((m) => {
        // check if should stop all stale messages
        if (m.isError || new Date(m.date).getTime() < stopTiming) {
          if (m.streaming) {
            m.streaming = false;
          }

          if (m.content.length === 0) {
            m.isError = true;
            m.content = prettyObject({
              error: true,
              message: "empty response",
            });
          }
        }
      });

      // auto sync mask config from global config
      if (session.mask.syncGlobalConfig) {
        console.log("[Mask] syncing from global, name = ", session.mask.name);
        session.mask.modelConfig = { ...config.modelConfig };
        session.mask.modelConfigMeta = { ...(config.modelConfigMeta ?? {}) };
      }
    });
  }, [
    updateTargetSession,
    config.modelConfig,
    config.modelConfigMeta,
    session,
  ]);

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput, fill with last input
    if (
      e.key === "ArrowUp" &&
      userInput.length <= 0 &&
      !(e.metaKey || e.altKey || e.ctrlKey)
    ) {
      setUserInput(chatStore.lastInput ?? "");
      e.preventDefault();
      return;
    }
    if (promptHints.length > 0 && e.key === "Enter") {
      e.preventDefault();
      return;
    }
    if (shouldSubmit(e) && promptHints.length === 0) {
      doSubmit(userInput);
      e.preventDefault();
    }
  };
  const onRightClick = (e: any, message: ChatMessage) => {
    // copy to clipboard
    if (selectOrCopy(e.currentTarget, getMessageTextContent(message))) {
      if (userInput.length === 0) {
        setUserInput(getMessageTextContent(message));
      }

      e.preventDefault();
    }
  };

  const deleteMessage = (msgId?: string) => {
    chatStore.updateTargetSession(
      session,
      (session) =>
        (session.messages = session.messages.filter((m) => m.id !== msgId)),
    );
  };

  const onDelete = (msgId: string) => {
    deleteMessage(msgId);
  };

  const onResend = (message: ChatMessage) => {
    // when it is resending a message
    // 1. for a user's message, find the next bot response
    // 2. for a bot's message, find the last user's input
    // 3. delete original user input and bot's message
    // 4. resend the user's input

    const resendingIndex = session.messages.findIndex(
      (m) => m.id === message.id,
    );

    if (resendingIndex < 0 || resendingIndex >= session.messages.length) {
      console.error("[Chat] failed to find resending message", message);
      return;
    }

    let userMessage: ChatMessage | undefined;
    let botMessage: ChatMessage | undefined;

    if (message.role === "assistant") {
      // if it is resending a bot's message, find the user input for it
      botMessage = message;
      for (let i = resendingIndex; i >= 0; i -= 1) {
        if (session.messages[i].role === "user") {
          userMessage = session.messages[i];
          break;
        }
      }
    } else if (message.role === "user") {
      // if it is resending a user's input, find the bot's response
      userMessage = message;
      for (let i = resendingIndex; i < session.messages.length; i += 1) {
        if (session.messages[i].role === "assistant") {
          botMessage = session.messages[i];
          break;
        }
      }
    }

    if (userMessage === undefined) {
      console.error("[Chat] failed to resend", message);
      return;
    }

    if (botMessage && hasClosedResponsesFunctionTrace(botMessage)) {
      showToast(Locale.Chat.Actions.RetryToolTraceBlocked);
      return;
    }

    // delete the original messages
    deleteMessage(userMessage.id);
    deleteMessage(botMessage?.id);

    // resend the message
    setIsLoading(true);
    const textContent = getMessageTextContent(userMessage);
    const images = getMessageImages(userMessage);
    chatStore.onUserInput(textContent, images).then(() => setIsLoading(false));
    // 只在非移动设备上聚焦输入框
    if (!isCompactScreen) {
      inputRef.current?.focus();
    }
  };

  const onPinMessage = (message: ChatMessage) => {
    const pinnedMessage = createPinnedContextMessage(
      message,
      createMessage({}).id,
    );
    chatStore.updateTargetSession(session, (session) => {
      session.mask.context.push(pinnedMessage);
    });

    showToast(Locale.Chat.Actions.PinToastContent, {
      text: Locale.Chat.Actions.PinToastAction,
      onClick: () => {
        openPromptModal();
      },
    });
  };

  const accessStore = useAccessStore();
  const [showMobileModelSelector, setShowMobileModelSelector] = useState(false);
  const [expandedMobileModelSection, setExpandedMobileModelSection] =
    useState<ComposerModelMenuSection | null>(null);
  composerMeasurementFrozenRef.current =
    showChatActionMenu || showMobileModelSelector;
  const modelSelectorButtonRef = useRef<HTMLButtonElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const homeModeTabsRef = useRef<HTMLDivElement>(null);
  const lastHomeChatModelRef = useRef<string>();
  const lastHomeImageModelRef = useRef<string>();
  const homeModeInitializedRef = useRef(false);
  const measureComposerTextarea = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea || composerMeasurementFrozenRef.current) return;

    const computedStyle = window.getComputedStyle(textarea);
    const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight);
    const parsedMaxHeight = Number.parseFloat(computedStyle.maxHeight);
    const lineHeight = Number.isFinite(parsedLineHeight)
      ? parsedLineHeight
      : 24;
    const maxHeight = Number.isFinite(parsedMaxHeight) ? parsedMaxHeight : 174;

    textarea.style.height = `${lineHeight}px`;
    const scrollHeight =
      textarea.value.length === 0 ? lineHeight : inputRef.current.scrollHeight;
    const layout = getComposerTextareaLayout({
      value: textarea.value,
      scrollHeight,
      lineHeight,
      maxHeight,
      previousExpanded: composerTextareaExpandedRef.current,
    });

    composerTextareaExpandedRef.current = layout.expanded;
    textarea.style.height = `${layout.height}px`;
    textarea.style.overflowY = layout.scrolling ? "auto" : "hidden";
    setIsTextareaExpanded((current) =>
      current === layout.expanded ? current : layout.expanded,
    );
    setIsTextareaScrolling((current) =>
      current === layout.scrolling ? current : layout.scrolling,
    );
  }, []);

  useLayoutEffect(() => {
    const measureFrame = requestAnimationFrame(measureComposerTextarea);
    return () => cancelAnimationFrame(measureFrame);
  }, [
    attachImages.length,
    attachedFiles.length,
    fontFamily,
    fontSize,
    measureComposerTextarea,
    showChatActionMenu,
    showMobileModelSelector,
    userInput,
  ]);

  useLayoutEffect(() => {
    const composerShell = chatComposerShellRef.current;
    if (!composerShell) return;

    let measureFrame = 0;
    let observedWidth = composerShell.getBoundingClientRect().width;
    const scheduleMeasure = () => {
      cancelAnimationFrame(measureFrame);
      measureFrame = requestAnimationFrame(measureComposerTextarea);
    };
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver((entries) => {
            const nextWidth = entries[0]?.contentRect.width ?? observedWidth;
            if (Math.abs(nextWidth - observedWidth) < 0.5) return;
            observedWidth = nextWidth;
            scheduleMeasure();
          });

    resizeObserver?.observe(composerShell);
    window.addEventListener("resize", scheduleMeasure);
    window.visualViewport?.addEventListener("resize", scheduleMeasure);

    return () => {
      cancelAnimationFrame(measureFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
    };
  }, [measureComposerTextarea]);
  const closeMobileModelSelector = useCallback(() => {
    setShowMobileModelSelector(false);
    setExpandedMobileModelSection(null);
  }, []);
  const restoreModelSelectorFocus = useCallback(() => {
    setTimeout(() => {
      requestAnimationFrame(() => modelSelectorButtonRef.current?.focus());
    }, 0);
  }, []);
  const getModelMenuControls = useCallback(() => {
    const selectedHomeModeTab =
      homeModeTabsRef.current?.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
    const menuControls = Array.from(
      modelMenuRef.current?.querySelectorAll<HTMLElement>(
        '[role="option"], [role="slider"], button[aria-controls], [data-model-menu-control="true"]',
      ) ?? [],
    );

    return [selectedHomeModeTab, ...menuControls].filter(
      (control): control is HTMLElement =>
        control != null &&
        (!(control instanceof HTMLButtonElement) || !control.disabled) &&
        control.offsetParent !== null,
    );
  }, []);
  const focusModelMenuControl = useCallback(
    (key: string) => {
      const controls = getModelMenuControls();
      if (controls.length === 0) return;

      const currentIndex = controls.findIndex(
        (control) => control === document.activeElement,
      );
      let nextIndex = currentIndex;

      switch (key) {
        case "ArrowDown":
          nextIndex =
            currentIndex < 0
              ? 0
              : Math.min(currentIndex + 1, controls.length - 1);
          break;
        case "ArrowUp":
          nextIndex =
            currentIndex < 0
              ? controls.length - 1
              : Math.max(currentIndex - 1, 0);
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = controls.length - 1;
          break;
        default:
          return;
      }

      const nextControl = controls[nextIndex];
      nextControl.focus();
      nextControl.scrollIntoView({ block: "nearest" });
    },
    [getModelMenuControls],
  );
  const focusInitialModelMenuControl = useCallback(() => {
    const controls = getModelMenuControls();
    if (controls.length === 0) {
      modelMenuRef.current?.focus({ preventScroll: true });
      return;
    }

    const selectedControl = controls.find(
      (control) =>
        control.getAttribute("role") === "option" &&
        control.getAttribute("aria-selected") === "true",
    );
    const sliderControl = controls.find(
      (control) => control.getAttribute("role") === "slider",
    );
    const nextControl = selectedControl ?? sliderControl ?? controls[0];
    nextControl.focus({ preventScroll: true });
    nextControl.scrollIntoView({ block: "nearest" });
  }, [getModelMenuControls]);
  const trapModelMenuTab = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const controls = getModelMenuControls();

      event.preventDefault();
      event.stopPropagation();

      if (controls.length === 0) {
        modelMenuRef.current?.focus({ preventScroll: true });
        return;
      }

      const currentIndex = controls.findIndex(
        (control) => control === document.activeElement,
      );
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? controls.length - 1
          : currentIndex - 1
        : currentIndex < 0 || currentIndex === controls.length - 1
        ? 0
        : currentIndex + 1;
      const nextControl = controls[nextIndex];

      nextControl.focus({ preventScroll: true });
      nextControl.scrollIntoView({ block: "nearest" });
    },
    [getModelMenuControls],
  );
  const handleModelMenuKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!showMobileModelSelector) return;
    if (event.key === "Tab") {
      trapModelMenuTab(event);
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    event.stopPropagation();
    focusModelMenuControl(event.key);
  };
  useEffect(() => {
    if (!showMobileModelSelector) return;

    const frame = requestAnimationFrame(() => {
      if (expandedMobileModelSection) {
        modelMenuRef.current
          ?.querySelector<HTMLElement>('[role="slider"]')
          ?.focus({ preventScroll: true });
      } else {
        focusInitialModelMenuControl();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [
    expandedMobileModelSection,
    focusInitialModelMenuControl,
    showMobileModelSelector,
  ]);
  const returnToModelList = () => {
    setExpandedMobileModelSection(null);
  };
  const headerCurrentModel = session.mask.modelConfig.model;
  const headerCurrentProviderName =
    session.mask.modelConfig?.providerName || ServiceProvider.OpenAI;
  const headerModelLocked = !!(
    accessStore.lockedFields?.includes("model") ||
    accessStore.lockedFields?.includes("providerName") ||
    session.mask.modelConfigMeta?.model?.locked ||
    session.mask.modelConfigMeta?.providerName?.locked
  );
  const allHeaderModels = useAllModels();
  const headerAvailableModels = useMemo(
    () => allHeaderModels.filter((model) => model.available),
    [allHeaderModels],
  );
  const headerChatModels = useMemo(
    () => getChatHomeModeModels(headerAvailableModels, "chat"),
    [headerAvailableModels],
  );
  const headerImageModels = useMemo(
    () => getChatHomeModeModels(headerAvailableModels, "image"),
    [headerAvailableModels],
  );
  const headerCurrentModelName = useMemo(() => {
    const model = headerAvailableModels.find(
      (item) =>
        item.name === headerCurrentModel &&
        item?.provider?.providerName === headerCurrentProviderName,
    );
    return model?.displayName ?? headerCurrentModel;
  }, [headerAvailableModels, headerCurrentModel, headerCurrentProviderName]);
  const headerCurrentReasoningEffort = normalizeOpenAIResponsesReasoningEffort(
    session.mask.modelConfig?.reasoningEffort ??
      OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
    headerCurrentModel,
  );
  const headerReasoningEfforts = useMemo(
    () =>
      filterOpenAIResponsesReasoningEfforts(
        headerCurrentModel,
        accessStore.serverConfigSnapshot?.reasoningEffortAllowlist,
      ),
    [
      accessStore.serverConfigSnapshot?.reasoningEffortAllowlist,
      headerCurrentModel,
    ],
  );
  const visibleHeaderReasoningEfforts = useMemo(
    () =>
      includeCurrentOpenAIResponsesReasoningEffort(
        headerReasoningEfforts,
        headerCurrentReasoningEffort,
      ),
    [headerCurrentReasoningEffort, headerReasoningEfforts],
  );
  const headerReasoningLocked =
    accessStore.lockedFields?.includes("reasoningEffort") ||
    session.mask.modelConfigMeta?.reasoningEffort?.locked;
  const showHeaderReasoningControl =
    visibleHeaderReasoningEfforts.length > 0 &&
    isOpenAIResponsesReasoningModelConfig({
      model: headerCurrentModel,
      providerName: headerCurrentProviderName,
    });
  const showHeaderImageControls = isOpenAIImageGenerationModelConfig({
    model: headerCurrentModel,
    providerName: headerCurrentProviderName,
  });
  const emptyComposerMode = getChatHomeModeForModel(
    headerCurrentModel,
    headerCurrentProviderName,
  );
  const headerImageOptions =
    getOpenAIImageGenerationOptions(headerCurrentModel);
  const headerImageSizes = headerImageOptions.sizes;
  const headerImageQualitys = headerImageOptions.qualities;
  const headerCurrentSize = normalizeOpenAIImageSize(
    headerCurrentModel,
    session.mask.modelConfig?.size,
  );
  const headerCurrentQuality =
    normalizeOpenAIImageQuality(
      headerCurrentModel,
      session.mask.modelConfig?.quality,
    ) ?? ("standard" as OpenAIImageQuality);
  const headerImageSizeLabels = Object.fromEntries(
    headerImageSizes.map((size) => [size, getImageSizeLabel(size)]),
  ) as Record<OpenAIImageSize, string>;
  const headerImageSizeDescriptions = Object.fromEntries(
    headerImageSizes.map((size) => [
      size,
      Locale.Chat.ModelMenu.ImageSizeDescription(size),
    ]),
  ) as Record<OpenAIImageSize, string>;
  const headerImageQualityLabels = Object.fromEntries(
    headerImageQualitys.map((quality) => [
      quality,
      getImageQualityLabel(quality),
    ]),
  ) as Record<OpenAIImageQuality, string>;
  const headerImageQualityDescriptions = Object.fromEntries(
    headerImageQualitys.map((quality) => [
      quality,
      Locale.Chat.ModelMenu.ImageQualityDescription(quality),
    ]),
  ) as Record<OpenAIImageQuality, string>;
  const headerImageSizeLocked =
    accessStore.lockedFields?.includes("size") ||
    session.mask.modelConfigMeta?.size?.locked;
  const headerImageQualityLocked =
    accessStore.lockedFields?.includes("quality") ||
    session.mask.modelConfigMeta?.quality?.locked;
  const isReasoningSectionExpanded = expandedMobileModelSection === "reasoning";
  const isImageOptionsExpanded = expandedMobileModelSection === "image-options";
  const currentModelMenuSection = getComposerModelMenuSection(
    headerCurrentModel,
    headerCurrentProviderName,
  );
  const currentModelMenuLayer = getComposerModelMenuLayer(
    showMobileModelSelector,
    expandedMobileModelSection,
  );
  useEffect(() => {
    if (!composerQaSeed || !chatQaFixture) return;

    setUserInput(composerQaSeed.input);
    setUploading(composerQaSeed.uploading);
    setShowChatActionMenu(
      composerQaSeed.menu === "tools" ||
        composerQaSeed.menu === "prompt-library",
    );
    setChatActionMenuView(
      composerQaSeed.menu === "prompt-library" ? "prompt-library" : "main",
    );
    const modelMenuOpen =
      composerQaSeed.menu === "reasoning" ||
      composerQaSeed.menu === "image-options" ||
      composerQaSeed.menu === "models";
    setShowMobileModelSelector(modelMenuOpen);
    setExpandedMobileModelSection(
      composerQaSeed.menu === "reasoning"
        ? "reasoning"
        : composerQaSeed.menu === "image-options"
        ? "image-options"
        : null,
    );

    const attachments = composerQaSeed.attachments
      ? chatQaFixture.createComposerQaAttachments(composerQaSeed.attachments)
      : { images: [], files: [] };
    setAttachImages(attachments.images);
    setAttachedFiles(attachments.files);

    const focusFrame = requestAnimationFrame(() => {
      if (composerQaSeed.focus) {
        inputRef.current?.focus({ preventScroll: true });
      } else {
        inputRef.current?.blur();
        setIsChatInputFocused(false);
      }
    });
    return () => cancelAnimationFrame(focusFrame);
  }, [chatQaFixture, composerQaSeed]);
  const stepBackOrCloseModelMenu = useCallback(() => {
    const nextLayer = getComposerModelMenuEscapeLayer(
      currentModelMenuLayer,
      currentModelMenuSection,
    );
    if (nextLayer === "closed") {
      closeMobileModelSelector();
      restoreModelSelectorFocus();
      return;
    }
    setExpandedMobileModelSection(nextLayer);
  }, [
    closeMobileModelSelector,
    currentModelMenuLayer,
    currentModelMenuSection,
    restoreModelSelectorFocus,
  ]);
  useEffect(() => {
    if (!showMobileModelSelector) return;

    const handleModelSelectorEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      stepBackOrCloseModelMenu();
    };

    window.addEventListener("keydown", handleModelSelectorEscape);
    return () =>
      window.removeEventListener("keydown", handleModelSelectorEscape);
  }, [showMobileModelSelector, stepBackOrCloseModelMenu]);
  const imageComposerSummary = getImageComposerSummary(
    headerCurrentSize,
    headerImageQualitys.length > 0 ? headerCurrentQuality : undefined,
    Locale.Settings.ImageGeneration.Auto,
    getImageSizeLabel(headerCurrentSize),
    getImageQualityLabel(headerCurrentQuality),
  );
  const currentModelDetail = showHeaderImageControls
    ? imageComposerSummary
    : showHeaderReasoningControl
    ? reasoningLabels[headerCurrentReasoningEffort]
    : Locale.Chat.ModelMenu.DefaultParameters;
  const modelChipAccessibleLabel = Locale.Chat.ModelMenu.SelectModel(
    headerCurrentModelName,
    `${headerCurrentProviderName} · ${currentModelDetail}`,
  );
  const getHeaderReasoningMaxOutputTokens = (
    effort: OpenAIChatReasoningEffort,
  ) =>
    clampOpenAIResponsesMaxOutputTokens(
      accessStore.openaiMaxOutputTokens ??
        getMaxOutputTokensForReasoningEffort(effort),
      headerCurrentModel,
    );
  const selectHeaderModel = useCallback(
    (
      selected: string,
      options: {
        closeMenu?: boolean;
        restoreFocus?: boolean;
        announce?: boolean;
        source?: ConfigSource;
        syncGlobalConfig?: boolean;
      } = {},
    ) => {
      if (headerModelLocked) {
        showToast(Locale.Settings.GPT56Capabilities.ConfigSource.Locked);
        return false;
      }
      const [model, providerName] = getModelProvider(selected);
      const source = options.source ?? "conversation_override";
      chatStore.updateTargetSession(session, (session) => {
        session.mask.modelConfig.model = model as ModelType;
        session.mask.modelConfig.providerName = providerName as ServiceProvider;
        applyConfiguredOpenAIResponsesReasoningEffortDefault({
          config: session.mask.modelConfig,
          configMeta: session.mask.modelConfigMeta,
          defaults: config.serverConfigSnapshot?.reasoningEffortDefaults,
        });
        applyOpenAIResponsesModelConstraints(session.mask.modelConfig);
        applyOpenAIImageGenerationDefaults(session.mask.modelConfig);
        session.mask.modelConfigMeta = {
          ...(session.mask.modelConfigMeta ?? {}),
          model: createConfigFieldMeta({
            source,
            publicConfig: config.serverConfigSnapshot,
          }),
          providerName: createConfigFieldMeta({
            source,
            publicConfig: config.serverConfigSnapshot,
          }),
        };
        session.mask.syncGlobalConfig = options.syncGlobalConfig ?? false;
        if (model !== "gemini-2.0-flash-exp") {
          session.mask.plugin = [];
        }
      });
      if (options.closeMenu !== false) closeMobileModelSelector();
      if (options.restoreFocus !== false) restoreModelSelectorFocus();
      if (options.announce !== false) showToast(model);
      return true;
    },
    [
      chatStore,
      closeMobileModelSelector,
      config.serverConfigSnapshot,
      headerModelLocked,
      restoreModelSelectorFocus,
      session,
    ],
  );
  const selectComposerModel = (model: ChatHomeModel, selected: boolean) => {
    const providerName = model.provider?.providerName;
    const nextSection = getComposerModelMenuSection(model.name, providerName);
    if (selected) {
      if (nextSection) {
        setExpandedMobileModelSection(nextSection);
      } else {
        closeMobileModelSelector();
        restoreModelSelectorFocus();
      }
      return;
    }
    const keepMenuOpen = nextSection !== null;
    const changed = selectHeaderModel(`${model.name}@${providerName}`, {
      closeMenu: !keepMenuOpen,
      restoreFocus: !keepMenuOpen,
    });
    if (changed && nextSection) setExpandedMobileModelSection(nextSection);
  };
  const selectHeaderReasoningEffort = (
    reasoningEffort: OpenAIChatReasoningEffort,
  ) => {
    if (headerReasoningLocked) {
      showToast(Locale.Settings.GPT56Capabilities.ConfigSource.Locked);
      return;
    }
    chatStore.updateTargetSession(session, (session) => {
      session.mask.modelConfig.reasoningEffort = reasoningEffort;
      session.mask.modelConfig.max_output_tokens =
        getHeaderReasoningMaxOutputTokens(reasoningEffort);
      session.mask.modelConfigMeta = {
        ...(session.mask.modelConfigMeta ?? {}),
        reasoningEffort: createConfigFieldMeta({
          source: "conversation_override",
          publicConfig: config.serverConfigSnapshot,
        }),
        max_output_tokens: createConfigFieldMeta({
          source: "conversation_override",
          publicConfig: config.serverConfigSnapshot,
        }),
      };
      session.mask.syncGlobalConfig = false;
    });
    showToast(reasoningLabels[reasoningEffort]);
  };
  const selectHeaderImageSize = (size: OpenAIImageSize) => {
    if (headerImageSizeLocked) {
      showToast(Locale.Settings.GPT56Capabilities.ConfigSource.Locked);
      return;
    }
    chatStore.updateTargetSession(session, (session) => {
      session.mask.modelConfig.size = size;
      session.mask.modelConfigMeta = {
        ...(session.mask.modelConfigMeta ?? {}),
        size: createConfigFieldMeta({
          source: "conversation_override",
          publicConfig: config.serverConfigSnapshot,
        }),
      };
      session.mask.syncGlobalConfig = false;
    });
    showToast(size);
  };
  const selectHeaderImageQuality = (quality: OpenAIImageQuality) => {
    if (headerImageQualityLocked) {
      showToast(Locale.Settings.GPT56Capabilities.ConfigSource.Locked);
      return;
    }
    chatStore.updateTargetSession(session, (session) => {
      session.mask.modelConfig.quality = quality;
      session.mask.modelConfigMeta = {
        ...(session.mask.modelConfigMeta ?? {}),
        quality: createConfigFieldMeta({
          source: "conversation_override",
          publicConfig: config.serverConfigSnapshot,
        }),
      };
      session.mask.syncGlobalConfig = false;
    });
    showToast(getImageQualityLabel(quality));
  };
  const [speechStatus, setSpeechStatus] = useState(false);
  async function openaiSpeech(text: string) {
    if (speechStatus) {
      ttsPlayer.stop();
      setSpeechStatus(false);
    } else {
      const [{ ClientApi }, { markdownToTxt }] = await Promise.all([
        import("../client/api"),
        import("markdown-to-txt"),
      ]);
      const api = new ClientApi(ModelProvider.GPT);
      const config = useAppConfig.getState();
      ttsPlayer.init();
      let audioBuffer: ArrayBuffer;
      const textContent = markdownToTxt(text);
      if (config.ttsConfig.engine !== DEFAULT_TTS_ENGINE) {
        const { MsEdgeTTS, OUTPUT_FORMAT } = await import(
          "../utils/ms_edge_tts"
        );
        const edgeVoiceName = accessStore.edgeVoiceName();
        const tts = new MsEdgeTTS();
        await tts.setMetadata(
          edgeVoiceName,
          OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
        );
        audioBuffer = await tts.toArrayBuffer(textContent);
      } else {
        audioBuffer = await api.llm.speech({
          model: config.ttsConfig.model,
          input: textContent,
          voice: config.ttsConfig.voice,
          speed: config.ttsConfig.speed,
        });
      }
      setSpeechStatus(true);
      ttsPlayer
        .play(audioBuffer, () => {
          setSpeechStatus(false);
        })
        .catch((e) => {
          console.error("[OpenAI Speech]", e);
          showToast(prettyObject(e));
          setSpeechStatus(false);
        });
    }
  }

  const presetPromptCount = session.mask.context.length;
  const context: RenderMessage[] = useMemo(() => {
    return session.mask.hideContext ? [] : session.mask.context.slice();
  }, [session.mask.context, session.mask.hideContext]);

  if (
    context.length === 0 &&
    session.messages.at(0)?.content !== BOT_HELLO.content
  ) {
    const copiedHello = Object.assign({}, BOT_HELLO);
    if (!accessStore.isAuthorized()) {
      copiedHello.content = Locale.Error.Unauthorized;
    }
    context.push(copiedHello);
  }

  const previewInput = config.sendPreviewBubble ? userInput : "";

  // preview messages
  const renderMessages = useMemo(() => {
    if (markdownStressQaEnabled && chatQaFixture) {
      return chatQaFixture.getMarkdownStressQaMessages(location.search);
    }

    if (imageGalleryQaEnabled && chatQaFixture) {
      return chatQaFixture.getImageGalleryQaMessages();
    }

    if (
      composerQaScenario &&
      composerQaScenario.state !== "empty" &&
      chatQaFixture
    ) {
      return chatQaFixture.getComposerQaMessages();
    }

    const visibleSessionMessages = projectVisibleChatMessages(
      session.messages as RenderMessage[],
      chatStore.messageProjectionRevision,
    );
    const showLoadingPreview = shouldRenderLoadingPreview(
      visibleSessionMessages,
      isLoading,
    );

    return context
      .concat(visibleSessionMessages)
      .concat(
        showLoadingPreview
          ? [
              {
                ...createMessage({
                  role: "assistant",
                  content: "……",
                }),
                preview: true,
              },
            ]
          : [],
      )
      .concat(
        previewInput.length > 0
          ? [
              {
                ...createMessage({
                  role: "user",
                  content: previewInput,
                }),
                preview: true,
              },
            ]
          : [],
      );
  }, [
    chatQaFixture,
    composerQaScenario,
    context,
    isLoading,
    imageGalleryQaEnabled,
    location.search,
    markdownStressQaEnabled,
    chatStore.messageProjectionRevision,
    projectVisibleChatMessages,
    session.messages,
    previewInput,
  ]);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(() =>
    Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  );
  msgRenderIndexRef.current = msgRenderIndex;
  const pendingMessageWindowAnchorRef = useRef<{
    key: string;
    index: number;
    top: number;
  } | null>(null);
  const setMsgRenderIndex = useCallback(
    (newIndex: number) => {
      newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
      newIndex = Math.max(0, newIndex);
      _setMsgRenderIndex(newIndex);
    },
    [renderMessages.length],
  );

  const qaMessageWindowKey = markdownStressQaEnabled
    ? `markdown:${location.search}`
    : imageGalleryQaEnabled
    ? `gallery:${location.search}`
    : composerQaScenario
    ? `composer:${location.search}`
    : undefined;
  const previousQaMessageWindowKeyRef = useRef<string>();
  useLayoutEffect(() => {
    if (!qaMessageWindowKey) {
      previousQaMessageWindowKeyRef.current = undefined;
      return;
    }
    if (previousQaMessageWindowKeyRef.current === qaMessageWindowKey) return;

    previousQaMessageWindowKeyRef.current = qaMessageWindowKey;
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
  }, [qaMessageWindowKey, renderMessages.length, setMsgRenderIndex]);

  const messageRenderStartIndex = msgRenderIndex;
  const messages = useMemo(() => {
    const endRenderIndex = Math.min(
      messageRenderStartIndex + MAX_RENDER_MSG_COUNT,
      renderMessages.length,
    );
    return renderMessages.slice(messageRenderStartIndex, endRenderIndex);
  }, [messageRenderStartIndex, renderMessages]);
  const shortcutMessagesRef = useRef(messages);
  const shortcutMessageWindowStartRef = useRef(messageRenderStartIndex);
  shortcutMessagesRef.current = messages;
  shortcutMessageWindowStartRef.current = messageRenderStartIndex;
  useLayoutEffect(() => {
    const scrollDom = scrollRef.current;
    const readingSurface = readingSurfaceRef.current;
    if (!scrollDom || !readingSurface) return;

    const nextStart = getUnderfilledChatWindowStart(
      messageRenderStartIndex,
      Math.max(0, renderMessages.length - MAX_RENDER_MSG_COUNT),
      readingSurface.scrollHeight,
      scrollDom.clientHeight,
      CHAT_PAGE_SIZE,
    );
    if (nextStart !== messageRenderStartIndex) {
      setMsgRenderIndex(nextStart);
    }
  }, [
    messageRenderStartIndex,
    messages.length,
    renderMessages.length,
    setMsgRenderIndex,
  ]);
  useLayoutEffect(() => {
    const pendingAnchor = pendingMessageWindowAnchorRef.current;
    const scrollDom = scrollRef.current;
    const readingSurface = readingSurfaceRef.current;
    if (!pendingAnchor || !scrollDom || !readingSurface) return;

    const anchorElement = Array.from(
      readingSurface.querySelectorAll<HTMLElement>("[data-message-anchor]"),
    ).find((element) => element.dataset.messageAnchor === pendingAnchor.key);
    pendingMessageWindowAnchorRef.current = null;
    if (!anchorElement) return;

    const scrollRect = scrollDom.getBoundingClientRect();
    const nextAnchorTop =
      anchorElement.getBoundingClientRect().top - scrollRect.top;
    const nextScrollTop = getAnchoredScrollTop(
      scrollDom.scrollTop,
      nextAnchorTop,
      pendingAnchor.top,
    );
    lastObservedScrollTopRef.current = nextScrollTop;
    scrollDirectionAccumulatorRef.current = 0;
    scrollDom.scrollTop = nextScrollTop;
  }, [messageRenderStartIndex, messages, scrollRef]);
  const showEmptyState = composerQaScenario
    ? composerQaScenario.state === "empty"
    : !markdownStressQaEnabled &&
      !imageGalleryQaEnabled &&
      session.messages.length === 0 &&
      context.length === 1 &&
      getMessageTextContent(context[0]) === BOT_HELLO.content &&
      !isLoading;
  const showEmptyComposer = showEmptyState;
  const showEmptyHero = showEmptyState && !showChatActionMenu;
  const showDesktopChatHeader = !isCompactScreen && !showEmptyState;
  useLayoutEffect(() => {
    const inputPanel = chatInputPanelRef.current;
    const segmentProbe = composerViewportSegmentRef.current;
    const containingBlock = inputPanel?.parentElement;
    if (!inputPanel || !segmentProbe || !containingBlock) return;

    let updateFrame = 0;
    const updateViewportFrame = () => {
      cancelAnimationFrame(updateFrame);
      updateFrame = requestAnimationFrame(() => {
        const visualViewport = window.visualViewport;
        const viewportTop = visualViewport?.offsetTop ?? 0;
        const viewportHeight = visualViewport?.height ?? window.innerHeight;
        const viewportBottom = viewportTop + viewportHeight;
        const viewportBottomInset = Math.max(
          0,
          window.innerHeight - viewportBottom,
        );
        inputPanel.style.setProperty(
          "--chat-composer-viewport-top",
          `${viewportTop}px`,
        );
        inputPanel.style.setProperty(
          "--chat-composer-viewport-height",
          `${viewportHeight}px`,
        );
        inputPanel.style.setProperty(
          "--chat-composer-viewport-bottom-inset",
          `${viewportBottomInset}px`,
        );

        const segmentProbeStyle = window.getComputedStyle(segmentProbe);
        const simulatedSegmentActive =
          segmentProbeStyle
            .getPropertyValue("--chat-composer-segment-active")
            .trim() === "1";
        const segmentProvider = window as Window & {
          getWindowSegments?: () => DOMRect[];
        };
        const segments = simulatedSegmentActive
          ? [segmentProbe.getBoundingClientRect()]
          : segmentProvider.getWindowSegments?.() ?? [];
        const containingRect = containingBlock.getBoundingClientRect();
        const selectedSegment = segments
          .map((segment) => {
            const left = Math.max(containingRect.left, segment.left);
            const top = Math.max(containingRect.top, segment.top);
            const right = Math.min(containingRect.right, segment.right);
            const bottom = Math.min(containingRect.bottom, segment.bottom);
            return {
              segment,
              overlap: Math.max(0, right - left) * Math.max(0, bottom - top),
            };
          })
          .sort((first, second) => second.overlap - first.overlap)[0];

        if (selectedSegment && selectedSegment.overlap > 0) {
          const segment = selectedSegment.segment;
          const segmentLeft = Math.max(segment.left, containingRect.left);
          const segmentRight = Math.min(segment.right, containingRect.right);
          const segmentTop = Math.max(segment.top, containingRect.top);
          const segmentBottom = Math.min(segment.bottom, containingRect.bottom);
          const isHorizontalSplit =
            segmentRight - segmentLeft < containingRect.width - 1;
          const isVerticalSplit =
            segmentBottom - segmentTop < containingRect.height - 1;
          inputPanel.dataset.composerSegment = "true";
          inputPanel.dataset.composerSegmentAxis =
            isHorizontalSplit && isVerticalSplit
              ? "both"
              : isVerticalSplit
              ? "vertical"
              : "horizontal";
          inputPanel.style.setProperty(
            "--chat-composer-segment-left",
            `${segmentLeft - containingRect.left}px`,
          );
          inputPanel.style.setProperty(
            "--chat-composer-segment-width",
            `${Math.max(1, segmentRight - segmentLeft)}px`,
          );
          inputPanel.style.setProperty(
            "--chat-composer-segment-top",
            `${segmentTop - containingRect.top}px`,
          );
          inputPanel.style.setProperty(
            "--chat-composer-segment-height",
            `${Math.max(1, segmentBottom - segmentTop)}px`,
          );
          inputPanel.style.setProperty(
            "--chat-composer-segment-bottom-inset",
            `${Math.max(0, containingRect.bottom - segmentBottom)}px`,
          );
        } else {
          delete inputPanel.dataset.composerSegment;
          delete inputPanel.dataset.composerSegmentAxis;
          inputPanel.style.removeProperty("--chat-composer-segment-left");
          inputPanel.style.removeProperty("--chat-composer-segment-width");
          inputPanel.style.removeProperty("--chat-composer-segment-top");
          inputPanel.style.removeProperty("--chat-composer-segment-height");
          inputPanel.style.removeProperty(
            "--chat-composer-segment-bottom-inset",
          );
        }
      });
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateViewportFrame);
    resizeObserver?.observe(containingBlock);
    resizeObserver?.observe(segmentProbe);
    updateViewportFrame();
    window.addEventListener("resize", updateViewportFrame);
    window.addEventListener("orientationchange", updateViewportFrame);
    window.visualViewport?.addEventListener("resize", updateViewportFrame);
    window.visualViewport?.addEventListener("scroll", updateViewportFrame);

    return () => {
      cancelAnimationFrame(updateFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateViewportFrame);
      window.removeEventListener("orientationchange", updateViewportFrame);
      window.visualViewport?.removeEventListener("resize", updateViewportFrame);
      window.visualViewport?.removeEventListener("scroll", updateViewportFrame);
    };
  }, []);
  useLayoutEffect(() => {
    if (!showChatActionMenu && !showMobileModelSelector) return;

    let updateFrame = 0;
    const updatePopoverPlacement = () => {
      cancelAnimationFrame(updateFrame);
      updateFrame = requestAnimationFrame(() => {
        const kind = showMobileModelSelector ? "model" : "tools";
        const trigger = showMobileModelSelector
          ? modelSelectorButtonRef.current
          : chatInputMenuButtonRef.current;
        const menu = showMobileModelSelector
          ? modelMenuRef.current
          : chatInputActionMenuRef.current;
        const composerShell = chatComposerShellRef.current;
        const inputPanel = chatInputPanelRef.current;
        if (!trigger || !menu || !composerShell || !inputPanel) return;

        const visualViewport = window.visualViewport;
        const inputPanelStyle = window.getComputedStyle(inputPanel);
        const parseInset = (property: string) => {
          const value = Number.parseFloat(
            inputPanelStyle.getPropertyValue(property),
          );
          return Number.isFinite(value) ? value : 0;
        };
        const segmentProbe = composerViewportSegmentRef.current;
        const probeStyle = segmentProbe
          ? window.getComputedStyle(segmentProbe)
          : null;
        const probeSegmentActive =
          probeStyle
            ?.getPropertyValue("--chat-composer-segment-active")
            .trim() === "1";
        const segmentProvider = window as Window & {
          getWindowSegments?: () => DOMRect[];
        };
        const rawSegments =
          probeSegmentActive && segmentProbe
            ? [segmentProbe.getBoundingClientRect()]
            : segmentProvider.getWindowSegments?.() ?? [];
        const composerRect = composerShell.getBoundingClientRect();
        const placement = getComposerPopoverPlacement({
          kind,
          triggerRect: trigger.getBoundingClientRect(),
          composerRect,
          panelHeight: Math.max(
            menu.getBoundingClientRect().height,
            menu.scrollHeight,
          ),
          compact: composerRect.width < 600,
          preferBelowOnDesktop: showEmptyComposer,
          viewport: {
            left: visualViewport?.offsetLeft ?? 0,
            top: visualViewport?.offsetTop ?? 0,
            width: visualViewport?.width ?? window.innerWidth,
            height: visualViewport?.height ?? window.innerHeight,
            layoutHeight: window.innerHeight,
            safeArea: {
              top: parseInset("--chat-composer-safe-area-top"),
              right: parseInset("--chat-composer-safe-area-right"),
              bottom: parseInset("--chat-composer-safe-area-bottom"),
              left: parseInset("--chat-composer-safe-area-left"),
            },
            segments: rawSegments.map((segment) => ({
              left: segment.left,
              top: segment.top,
              width: segment.width,
              height: segment.height,
            })),
          },
        });
        const cssVariables = toComposerPopoverCssVariables(
          placement,
          kind === "tools" ? inputPanel.getBoundingClientRect() : undefined,
        );
        for (const [property, value] of Object.entries(cssVariables)) {
          if (menu.style.getPropertyValue(property) !== value) {
            menu.style.setProperty(property, value);
          }
        }
        menu.dataset.popoverSide = placement.openBelow ? "below" : "above";
      });
    };

    const menu = showMobileModelSelector
      ? modelMenuRef.current
      : chatInputActionMenuRef.current;
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updatePopoverPlacement);
    if (menu) resizeObserver?.observe(menu);
    if (chatComposerShellRef.current) {
      resizeObserver?.observe(chatComposerShellRef.current);
    }
    if (chatInputPanelRef.current) {
      resizeObserver?.observe(chatInputPanelRef.current);
    }
    updatePopoverPlacement();
    window.addEventListener("resize", updatePopoverPlacement);
    window.addEventListener("orientationchange", updatePopoverPlacement);
    window.visualViewport?.addEventListener("resize", updatePopoverPlacement);
    window.visualViewport?.addEventListener("scroll", updatePopoverPlacement);

    return () => {
      cancelAnimationFrame(updateFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePopoverPlacement);
      window.removeEventListener("orientationchange", updatePopoverPlacement);
      window.visualViewport?.removeEventListener(
        "resize",
        updatePopoverPlacement,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        updatePopoverPlacement,
      );
    };
  }, [
    chatActionMenuView,
    currentModelMenuLayer,
    showChatActionMenu,
    showEmptyComposer,
    showMobileModelSelector,
  ]);
  const configuredChatHomeDefault = useMemo(
    () =>
      config.serverConfigSnapshot
        ? {
            name:
              config.serverConfigSnapshot.forced.model ??
              config.serverConfigSnapshot.defaults.model,
            providerName:
              config.serverConfigSnapshot.forced.providerName ??
              config.serverConfigSnapshot.defaults.providerName,
          }
        : undefined,
    [config.serverConfigSnapshot],
  );
  const headerModelsForMenu = showEmptyState
    ? emptyComposerMode === "image"
      ? headerImageModels
      : headerChatModels
    : headerAvailableModels;
  const selectEmptyComposerMode = (mode: ChatHomeMode) => {
    if (mode === emptyComposerMode) return;

    const availableModelCount =
      mode === "chat" ? headerChatModels.length : headerImageModels.length;
    if (
      isChatHomeModeDisabled({
        mode,
        activeMode: emptyComposerMode,
        availableModelCount,
        modelLocked: headerModelLocked,
      })
    ) {
      return;
    }

    const currentModelRef = `${headerCurrentModel}@${headerCurrentProviderName}`;
    if (emptyComposerMode === "chat") {
      lastHomeChatModelRef.current = currentModelRef;
    } else {
      lastHomeImageModelRef.current = currentModelRef;
    }

    const eligibleModels =
      mode === "chat" ? headerChatModels : headerImageModels;
    const rememberedRef =
      mode === "chat"
        ? lastHomeChatModelRef.current
        : lastHomeImageModelRef.current;
    const rememberedModel = eligibleModels.find(
      (model) =>
        `${model.name}@${model.provider?.providerName}` === rememberedRef,
    );
    const targetModel =
      rememberedModel ??
      resolvePreferredChatHomeModel(
        mode,
        headerAvailableModels,
        configuredChatHomeDefault,
      );

    if (!targetModel) {
      showToast(
        mode === "chat"
          ? Locale.Chat.ModelMenu.ChatModelUnavailable
          : Locale.Chat.ModelMenu.ImageModelUnavailable,
      );
      return;
    }

    const changed = selectHeaderModel(
      `${targetModel.name}@${targetModel.provider?.providerName}`,
      { closeMenu: false, restoreFocus: false, announce: false },
    );
    if (changed) {
      if (showMobileModelSelector) {
        setExpandedMobileModelSection(
          getComposerModelMenuSection(
            targetModel.name,
            targetModel.provider?.providerName,
          ),
        );
      } else {
        closeMobileModelSelector();
      }
    }
  };
  useEffect(() => {
    if (
      !showEmptyState ||
      homeModeInitializedRef.current ||
      headerAvailableModels.length === 0
    ) {
      return;
    }

    homeModeInitializedRef.current = true;
    const currentModelRef = `${headerCurrentModel}@${headerCurrentProviderName}`;
    const currentIsEligibleChat = headerChatModels.some(
      (model) =>
        `${model.name}@${model.provider?.providerName}` === currentModelRef,
    );
    if (currentIsEligibleChat) {
      lastHomeChatModelRef.current = currentModelRef;
      return;
    }
    if (headerModelLocked) return;

    const defaultChatModel = resolvePreferredChatHomeModel(
      "chat",
      headerAvailableModels,
      configuredChatHomeDefault,
    );
    if (!defaultChatModel) return;

    selectHeaderModel(
      `${defaultChatModel.name}@${defaultChatModel.provider?.providerName}`,
      {
        closeMenu: false,
        restoreFocus: false,
        announce: false,
        source: config.serverConfigSnapshot ? "server_default" : "fallback",
        syncGlobalConfig: true,
      },
    );
  }, [
    headerAvailableModels,
    headerChatModels,
    headerCurrentModel,
    headerCurrentProviderName,
    headerModelLocked,
    configuredChatHomeDefault,
    config.serverConfigSnapshot,
    selectHeaderModel,
    showEmptyState,
  ]);
  const handleEmptyComposerModeKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    const nextMode =
      event.key === "Home" || event.key === "ArrowLeft"
        ? "chat"
        : event.key === "End" || event.key === "ArrowRight"
        ? "image"
        : undefined;
    if (!nextMode) return;

    const availableModelCount =
      nextMode === "chat" ? headerChatModels.length : headerImageModels.length;
    if (
      isChatHomeModeDisabled({
        mode: nextMode,
        activeMode: emptyComposerMode,
        availableModelCount,
        modelLocked: headerModelLocked,
      })
    ) {
      return;
    }

    event.preventDefault();
    selectEmptyComposerMode(nextMode);
    requestAnimationFrame(() => {
      document.getElementById(`chat-home-mode-${nextMode}`)?.focus();
    });
  };
  const handleHomeModeTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    handleEmptyComposerModeKeyDown(event);
    if (showMobileModelSelector && event.key === "Tab") {
      trapModelMenuTab(event);
    }
  };
  const onChatBodyScroll = (e: HTMLElement) => {
    const pendingQuickJumpTarget = pendingQuickJumpTargetRef.current;
    if (pendingQuickJumpTarget) {
      lastObservedScrollTopRef.current = e.scrollTop;
      scrollDirectionAccumulatorRef.current = 0;
      setQuickJumpTarget(pendingQuickJumpTarget);
    } else {
      const directionUpdate = accumulateChatScrollDirection(
        scrollDirectionAccumulatorRef.current,
        e.scrollTop - lastObservedScrollTopRef.current,
      );
      lastObservedScrollTopRef.current = e.scrollTop;
      scrollDirectionAccumulatorRef.current = directionUpdate.accumulatedDelta;
      const nextTarget = directionUpdate.target;
      if (nextTarget) {
        setQuickJumpTarget((currentTarget) =>
          currentTarget === nextTarget ? currentTarget : nextTarget,
        );
      }
    }

    const { bottomHeight, isHitBottom, isHitTop } = syncHitBottomState(
      e,
      pendingQuickJumpTarget === null,
    );
    const edgeThreshold = e.clientHeight;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;
    const maxRenderIndex = Math.max(0, renderMessages.length - CHAT_PAGE_SIZE);

    const preserveMessageWindowAnchor = (targetIndex: number) => {
      const pendingAnchor = pendingMessageWindowAnchorRef.current;
      if (pendingAnchor) {
        return isMessageIndexRetainedInWindow(
          pendingAnchor.index,
          targetIndex,
          MAX_RENDER_MSG_COUNT,
        );
      }
      const scrollRect = e.getBoundingClientRect();
      const anchorElement = Array.from(
        readingSurfaceRef.current?.querySelectorAll<HTMLElement>(
          "[data-message-anchor]",
        ) ?? [],
      ).find((element) => {
        const messageIndex = Number(element.dataset.messageIndex);
        const messageRect = element.getBoundingClientRect();
        return isRetainedVisibleMessageAnchor(
          messageIndex,
          messageRect.top,
          messageRect.bottom,
          targetIndex,
          MAX_RENDER_MSG_COUNT,
          scrollRect.top,
          scrollRect.bottom,
        );
      });
      const key = anchorElement?.dataset.messageAnchor;
      if (!anchorElement || !key) return false;
      pendingMessageWindowAnchorRef.current = {
        key,
        index: Number(anchorElement.dataset.messageIndex),
        top: anchorElement.getBoundingClientRect().top - scrollRect.top,
      };
      return true;
    };

    if (isTouchTopEdge && !isTouchBottomEdge) {
      const targetIndex = Math.max(0, prevPageMsgIndex);
      if (
        targetIndex !== msgRenderIndex &&
        preserveMessageWindowAnchor(targetIndex)
      ) {
        setMsgRenderIndex(targetIndex);
      }
    } else if (isTouchBottomEdge) {
      const targetIndex = Math.min(maxRenderIndex, nextPageMsgIndex);
      if (
        targetIndex !== msgRenderIndex &&
        preserveMessageWindowAnchor(targetIndex)
      ) {
        setMsgRenderIndex(targetIndex);
      }
    }

    if (
      (pendingQuickJumpTarget === "top" && msgRenderIndex === 0 && isHitTop) ||
      (pendingQuickJumpTarget === "bottom" &&
        msgRenderIndex === maxRenderIndex &&
        isHitBottom)
    ) {
      pendingQuickJumpTargetRef.current = null;
    }

    if (isCompactScreen && !hasActiveInputContent) {
      inputRef.current?.blur();
    }
  };
  const scrollToTop = useCallback(() => {
    autoScrollRef.current = false;
    pendingQuickJumpTargetRef.current = "top";
    setAutoScroll(false);
    setQuickJumpTarget("top");
    setHitTop(true);
    setHitBottom(false);
    setMsgRenderIndex(0);
    scrollDirectionAccumulatorRef.current = 0;
    lastObservedScrollTopRef.current = 0;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo(0, 0);
    });
  }, [scrollRef, setAutoScroll, setMsgRenderIndex]);
  const scrollToBottom = useCallback(() => {
    autoScrollRef.current = true;
    pendingQuickJumpTargetRef.current = "bottom";
    setQuickJumpTarget("bottom");
    setHitTop(false);
    setHitBottom(true);
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDirectionAccumulatorRef.current = 0;
    const scrollDom = scrollRef.current;
    lastObservedScrollTopRef.current =
      scrollDom?.scrollTop ?? lastObservedScrollTopRef.current;
    scrollDomToBottom();
  }, [renderMessages.length, scrollDomToBottom, scrollRef, setMsgRenderIndex]);
  const clearContextDividerRef = useRef<HTMLButtonElement>(null);
  const [chatBodyBottomSafeArea, setChatBodyBottomSafeArea] = useState<
    number | null
  >(null);
  const getChatBodyBottomSafeArea = useCallback(() => {
    const inputPanel = chatInputPanelRef.current;
    const scrollDom = scrollRef.current;
    if (!inputPanel || !scrollDom) return null;

    const inputPanelRect = inputPanel.getBoundingClientRect();
    const scrollRect = scrollDom.getBoundingClientRect();
    const panelOverlap = Math.max(
      0,
      Math.ceil(scrollRect.bottom - inputPanelRect.top),
    );
    const baseSafeArea = isMobileScreen
      ? CHAT_BODY_BOTTOM_SAFE_AREA_MOBILE_BASE
      : CHAT_BODY_BOTTOM_SAFE_AREA_BASE;
    const scrollButtonClearance = isMobileScreen
      ? CHAT_SCROLL_BOTTOM_MOBILE_CLEARANCE
      : CHAT_SCROLL_BOTTOM_CLEARANCE;

    return Math.max(baseSafeArea, panelOverlap + scrollButtonClearance);
  }, [isMobileScreen, scrollRef]);
  const syncChatBodyBottomSafeArea = useCallback(() => {
    const nextSafeArea = getChatBodyBottomSafeArea();
    setChatBodyBottomSafeArea((currentSafeArea) =>
      currentSafeArea === nextSafeArea ? currentSafeArea : nextSafeArea,
    );
  }, [getChatBodyBottomSafeArea]);
  useLayoutEffect(() => {
    syncChatBodyBottomSafeArea();

    const inputPanel = chatInputPanelRef.current;
    const scrollDom = scrollRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(syncChatBodyBottomSafeArea)
        : null;

    if (inputPanel) resizeObserver?.observe(inputPanel);
    if (scrollDom) resizeObserver?.observe(scrollDom);
    window.addEventListener("resize", syncChatBodyBottomSafeArea);
    window.visualViewport?.addEventListener(
      "resize",
      syncChatBodyBottomSafeArea,
    );
    window.visualViewport?.addEventListener(
      "scroll",
      syncChatBodyBottomSafeArea,
    );

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncChatBodyBottomSafeArea);
      window.visualViewport?.removeEventListener(
        "resize",
        syncChatBodyBottomSafeArea,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        syncChatBodyBottomSafeArea,
      );
    };
  }, [scrollRef, syncChatBodyBottomSafeArea]);
  const chatBodyStyle = useMemo(
    () =>
      chatBodyBottomSafeArea === null
        ? undefined
        : ({
            "--chat-body-bottom-safe-area": `${chatBodyBottomSafeArea}px`,
          } as React.CSSProperties),
    [chatBodyBottomSafeArea],
  );
  const getClearContextBottomInset = useCallback(() => {
    if (!isCompactScreen) return 96;

    const inputPanel = chatInputPanelRef.current;
    const scrollDom = scrollRef.current;
    if (!inputPanel || !scrollDom) return 118;

    const inputPanelRect = inputPanel.getBoundingClientRect();
    const scrollRect = scrollDom.getBoundingClientRect();
    const inputPanelOverlap = scrollRect.bottom - inputPanelRect.top + 40;

    return Math.max(118, inputPanelOverlap);
  }, [isCompactScreen, scrollRef]);
  const scrollClearContextDividerIntoView = useCallback(() => {
    const divider = clearContextDividerRef.current;
    const scrollDom = scrollRef.current;
    if (!divider) return;

    divider.scrollIntoView({
      block: "end",
      inline: "nearest",
    });

    if (!scrollDom) return;

    const dividerRect = divider.getBoundingClientRect();
    const scrollRect = scrollDom.getBoundingClientRect();
    const bottomInset = getClearContextBottomInset();
    const dividerOverflow =
      dividerRect.bottom - (scrollRect.bottom - bottomInset);

    if (dividerOverflow > 0) {
      scrollDom.scrollTo(0, scrollDom.scrollTop + dividerOverflow);
    }
  }, [getClearContextBottomInset, scrollRef]);
  const isClearContextDividerSafelyVisible = useCallback(() => {
    const divider = clearContextDividerRef.current;
    const scrollDom = scrollRef.current;
    if (!divider || !scrollDom) return false;

    const dividerRect = divider.getBoundingClientRect();
    const scrollRect = scrollDom.getBoundingClientRect();
    const bottomInset = getClearContextBottomInset();

    return (
      dividerRect.top >= scrollRect.top &&
      dividerRect.bottom <= scrollRect.bottom - bottomInset
    );
  }, [getClearContextBottomInset, scrollRef]);

  // clear context index = context length + index in messages
  const clearContextAbsoluteIndex =
    (session.clearContextIndex ?? -1) >= 0
      ? session.clearContextIndex! + context.length
      : -1;
  const clearContextScrollKeyRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const sourceClearContextIndex = session.clearContextIndex ?? -1;
    if (sourceClearContextIndex < 0) {
      clearContextScrollKeyRef.current = null;
      return;
    }

    const clearContextScrollKey = `${session.id}:${sourceClearContextIndex}`;
    if (clearContextScrollKeyRef.current === clearContextScrollKey) {
      return;
    }

    clearContextScrollKeyRef.current = clearContextScrollKey;
    let revealFrame = 0;
    const scrollFrame = requestAnimationFrame(() => {
      scrollToBottom();
      revealFrame = requestAnimationFrame(() => {
        scrollClearContextDividerIntoView();
      });
    });

    return () => {
      cancelAnimationFrame(scrollFrame);
      if (revealFrame) cancelAnimationFrame(revealFrame);
    };
  }, [
    scrollClearContextDividerIntoView,
    scrollToBottom,
    session.clearContextIndex,
    session.id,
  ]);
  useEffect(() => {
    if ((session.clearContextIndex ?? -1) < 0) return;

    let resizeFrame = 0;
    const revealClearContextAfterResize = () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);

      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;

        if (!isClearContextDividerSafelyVisible()) {
          scrollClearContextDividerIntoView();
        }
      });
    };

    revealClearContextAfterResize();
    window.addEventListener("resize", revealClearContextAfterResize);
    const inputPanelResizeObserver =
      typeof ResizeObserver !== "undefined" && chatInputPanelRef.current
        ? new ResizeObserver(revealClearContextAfterResize)
        : undefined;
    if (chatInputPanelRef.current) {
      inputPanelResizeObserver?.observe(chatInputPanelRef.current);
    }

    return () => {
      window.removeEventListener("resize", revealClearContextAfterResize);
      inputPanelResizeObserver?.disconnect();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
    };
  }, [
    isClearContextDividerSafelyVisible,
    scrollClearContextDividerIntoView,
    session.clearContextIndex,
  ]);

  const [showPromptModal, setShowPromptModal] = useState(false);
  const promptModalTriggerRef = useRef<HTMLElement | null>(null);

  const openPromptModal = (trigger?: HTMLElement | null) => {
    promptModalTriggerRef.current =
      trigger ??
      (typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    setShowPromptModal(true);
  };

  const closePromptModal = () => {
    setShowPromptModal(false);
    requestAnimationFrame(() => {
      const promptModalTrigger = promptModalTriggerRef.current;
      if (promptModalTrigger?.isConnected) {
        promptModalTrigger.focus();
      }
      promptModalTriggerRef.current = null;
    });
  };

  const clientConfig = useMemo(() => getClientConfig(), []);

  const autoFocus = !isCompactScreen; // wont auto focus on compact screens
  const showMaxIcon = !isCompactScreen && !clientConfig?.isApp;

  useCommand({
    fill: markdownStressQaEnabled ? undefined : setUserInput,
    submit: markdownStressQaEnabled
      ? undefined
      : (text) => {
          doSubmit(text);
        },
    code: (text) => {
      if (accessStore.disableFastLink) return;
      console.log("[Command] got code from url: ", text);
      showConfirm(Locale.URLCommand.Code + `code = ${text}`).then((res) => {
        if (res) {
          accessStore.setAccessCode(text);
        }
      });
    },
    settings: (text) => {
      if (accessStore.disableFastLink) return;

      try {
        const payload = JSON.parse(text) as {
          key?: string;
          url?: string;
        };

        console.log("[Command] got settings from url: ", payload);

        if (payload.key || payload.url) {
          showConfirm(
            Locale.URLCommand.Settings +
              `\n${JSON.stringify(payload, null, 4)}`,
          ).then((res) => {
            if (!res) return;
            const apiKeyLocked =
              accessStore.hideUserApiKey ||
              accessStore.lockedFields?.includes("apiKey");
            const baseUrlLocked = accessStore.lockedFields?.includes("baseUrl");
            if (payload.key && !apiKeyLocked) {
              accessStore.update(
                (access) => (access.openaiApiKey = payload.key!),
              );
            }
            if (payload.url && !baseUrlLocked) {
              accessStore.update((access) => (access.openaiUrl = payload.url!));
            }
            if (!apiKeyLocked && !baseUrlLocked) {
              accessStore.update((access) => (access.useCustomConfig = true));
            }
          });
        }
      } catch {
        console.error("[Command] failed to get settings from url: ", text);
      }
    },
  });

  // edit / insert message modal
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  // remember unfinished input
  useEffect(() => {
    if (markdownStressQaEnabled || composerQaScenario) {
      return;
    }

    const dom = inputRef.current;
    return () => {
      localStorage.setItem(unfinishedInputKey, dom?.value ?? "");
    };
  }, [composerQaScenario, markdownStressQaEnabled, unfinishedInputKey]);

  const appendAttachments = useCallback(
    (fileInfos: FileInfo[], imageUrls: string[]) => {
      const messages: string[] = [];

      const currentAttachedFiles = attachedFilesRef.current;
      const currentAttachImages = attachImagesRef.current;

      if (fileInfos.length > 0) {
        const remainingFileSlots = Math.max(0, 5 - currentAttachedFiles.length);
        const filesToAdd = fileInfos.slice(0, remainingFileSlots);

        if (filesToAdd.length > 0) {
          setAttachedFiles([...currentAttachedFiles, ...filesToAdd]);
          messages.push(Locale.Chat.Attachments.AddedFiles(filesToAdd.length));
        }

        if (fileInfos.length > remainingFileSlots) {
          messages.push(Locale.Chat.Attachments.MaxFiles);
        }
      }

      if (imageUrls.length > 0) {
        const remainingImageSlots = Math.max(0, 3 - currentAttachImages.length);
        const imagesToAdd = imageUrls.slice(0, remainingImageSlots);

        if (imagesToAdd.length > 0) {
          setAttachImages([...currentAttachImages, ...imagesToAdd]);
          messages.push(
            Locale.Chat.Attachments.AddedImages(imagesToAdd.length),
          );
        }

        if (imageUrls.length > remainingImageSlots) {
          messages.push(Locale.Chat.Attachments.MaxImages);
        }
      }

      if (messages.length > 0) {
        showToast(Locale.Chat.Attachments.JoinMessages(messages));
      }
    },
    // All state reads go through refs; setAttachedFiles/setAttachImages are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      const dataTransfer = e.dataTransfer;
      if (!hasDraggedFiles(dataTransfer)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      dragCounter.current += 1;
      setDragPayloadSummary(
        getDraggedAttachmentSummary(
          dataTransfer,
          attachImagesRef.current.length,
          attachedFilesRef.current.length,
        ),
      );
      if (dragCounter.current === 1) {
        setDragActive(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      const dataTransfer = e.dataTransfer;
      if (!hasDraggedFiles(dataTransfer)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      dataTransfer.dropEffect = "copy";
      setDragPayloadSummary(
        getDraggedAttachmentSummary(
          dataTransfer,
          attachImagesRef.current.length,
          attachedFilesRef.current.length,
        ),
      );
    };

    const handleDragLeave = (e: DragEvent) => {
      const dataTransfer = e.dataTransfer;
      if (!hasDraggedFiles(dataTransfer)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setDragActive(false);
        setDragPayloadSummary(null);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      const dataTransfer = e.dataTransfer;
      if (!hasDraggedFiles(dataTransfer)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setDragActive(false);
      setDragPayloadSummary(null);

      if (dataTransfer.files.length > 0) {
        const files = Array.from(dataTransfer.files);

        // 15MB size limit check
        const MAX_SIZE = 15 * 1024 * 1024;
        const validSizeFiles = files.filter((file) => {
          if (file.size > MAX_SIZE) {
            showToast(Locale.Chat.Attachments.FileTooLarge(file.name));
            return false;
          }
          return true;
        });

        // Classify
        const images = validSizeFiles.filter((file) => isAttachmentImage(file));
        const documents = validSizeFiles.filter(
          (file) => !isAttachmentImage(file),
        );

        // Slots calculation
        const remainingFileSlots = Math.max(
          0,
          5 - attachedFilesRef.current.length,
        );
        const remainingImageSlots = Math.max(
          0,
          3 - attachImagesRef.current.length,
        );

        if (images.length > remainingImageSlots) {
          showToast(Locale.Chat.Attachments.MaxImages);
        }
        if (documents.length > remainingFileSlots) {
          showToast(Locale.Chat.Attachments.MaxFiles);
        }

        const slicedImages = images.slice(0, remainingImageSlots);
        const slicedDocuments = documents.slice(0, remainingFileSlots);

        const filesToProcess = [...slicedImages, ...slicedDocuments];

        if (filesToProcess.length === 0) {
          return;
        }

        setUploading(true);
        try {
          const { fileInfos, imageUrls } =
            await processAttachmentFiles(filesToProcess);
          if (!isMounted.current) return;
          appendAttachments(fileInfos, imageUrls);
        } catch (error) {
          if (!isMounted.current) return;
          console.error("读取拖拽附件失败:", error);
          showToast(Locale.Chat.Attachments.DragReadFailed);
        } finally {
          if (isMounted.current) {
            setUploading(false);
          }
        }
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [appendAttachments]);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    const { files: pastedFiles, imageUrls: pastedImageUrls } =
      getClipboardAttachmentPayload(clipboardData);

    if (pastedFiles.length > 0 || pastedImageUrls.length > 0) {
      e.preventDefault();
      setUploading(true);
      try {
        const { fileInfos, imageUrls } =
          await processAttachmentFiles(pastedFiles);
        appendAttachments(fileInfos, [...imageUrls, ...pastedImageUrls]);
      } catch (error) {
        console.error("读取粘贴附件失败:", error);
        showToast(Locale.Chat.Attachments.PasteReadFailed);
      } finally {
        setUploading(false);
      }
      return;
    } else {
      // 处理粘贴的文本
      const text = e.clipboardData.getData("text/plain");
      if (text && text.length > 1000) {
        // 如果文本超过1000字符
        e.preventDefault();

        // 检查文件数量限制
        if (attachedFiles.length >= 5) {
          showToast(Locale.Chat.Attachments.FileSlotsFull);
          return;
        }

        // 截断过长的文本内容
        const maxLength = 100000;
        const truncatedText =
          text.length > maxLength
            ? text.substring(0, maxLength) +
              `\n\n${Locale.Chat.Attachments.Reader.ContentTruncated(
                text.length,
              )}`
            : text;

        // 将长文本转为文件附件
        const pastedTextFileName = Locale.Chat.Attachments.PastedTextFile;
        const file = new File([text], pastedTextFileName, {
          type: "text/plain",
        });
        setAttachedFiles([
          ...attachedFiles,
          {
            name: pastedTextFileName,
            type: "text/plain",
            size: text.length,
            content: truncatedText,
            originalFile: file,
          },
        ]);

        showToast(Locale.Chat.Attachments.LongTextConverted);
      }
    }
  };

  // 修改上传附件的处理函数
  async function handleUploadAttachments(kind: AttachmentUploadKind = "all") {
    const requestedSlotsFull =
      kind === "image"
        ? imageSlotsFull
        : kind === "file"
        ? fileSlotsFull
        : attachmentSlotsFull;
    if (requestedSlotsFull) {
      showToast(
        kind === "image"
          ? Locale.Chat.Attachments.ImageSlotsFull
          : kind === "file"
          ? Locale.Chat.Attachments.FileSlotsFull
          : Locale.Chat.Attachments.Full,
      );
      return;
    }

    // 从file.ts导入的新函数
    uploadAttachments(
      // 开始上传
      () => {
        setUploading(true);
      },
      // 上传成功
      (fileInfos, imageUrls) => {
        appendAttachments(fileInfos, imageUrls);
      },
      // 上传失败
      (error) => {
        showToast(Locale.Chat.Attachments.FileReadFailed);
      },
      // 完成上传
      () => {
        setUploading(false);
      },
      kind,
    );
  }

  const [copiedMessageActionId, setCopiedMessageActionId] = useState<
    string | number | null
  >(null);
  const messageCopyFeedbackTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const messageCopyRequestIdRef = useRef(0);
  const restoreMessageCopyFocus = useCallback(
    (trigger?: HTMLButtonElement | null) => {
      if (!trigger?.isConnected) return;

      const activeElement = document.activeElement;
      if (activeElement === trigger || activeElement === document.body) {
        trigger.focus({ preventScroll: true });
      }
    },
    [],
  );
  const getMessageActionId = useCallback(
    (message: ChatMessage, index: number) => message.id ?? index,
    [],
  );
  const copyMessageContent = useCallback(
    async (
      message: ChatMessage,
      messageActionId: string | number,
      trigger?: HTMLButtonElement | null,
    ) => {
      const copyRequestId = messageCopyRequestIdRef.current + 1;
      messageCopyRequestIdRef.current = copyRequestId;

      if (messageCopyFeedbackTimerRef.current) {
        clearTimeout(messageCopyFeedbackTimerRef.current);
        messageCopyFeedbackTimerRef.current = null;
      }
      setCopiedMessageActionId(null);

      const didCopy = await copyToClipboard(getMessageTextContent(message));
      if (messageCopyRequestIdRef.current !== copyRequestId) return;

      restoreMessageCopyFocus(trigger);
      if (!didCopy) return;

      setCopiedMessageActionId(messageActionId);

      if (messageCopyFeedbackTimerRef.current) {
        clearTimeout(messageCopyFeedbackTimerRef.current);
      }

      messageCopyFeedbackTimerRef.current = setTimeout(() => {
        setCopiedMessageActionId((currentActionId) =>
          currentActionId === messageActionId ? null : currentActionId,
        );
        messageCopyFeedbackTimerRef.current = null;
      }, 1400);
    },
    [restoreMessageCopyFocus],
  );

  useEffect(() => {
    return () => {
      if (messageCopyFeedbackTimerRef.current) {
        clearTimeout(messageCopyFeedbackTimerRef.current);
      }
    };
  }, []);

  // 快捷键 shortcut keys
  const [showShortcutKeyModal, setShowShortcutKeyModal] = useState(false);
  const shortcutKeyModalOpenerRef = useRef<HTMLElement | null>(null);
  const openShortcutKeyModal = useCallback((opener?: HTMLElement | null) => {
    const activeElement = document.activeElement;
    shortcutKeyModalOpenerRef.current =
      opener ??
      (activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : inputRef.current);
    setShowShortcutKeyModal(true);
  }, []);
  const closeShortcutKeyModal = useCallback(() => {
    setShowShortcutKeyModal(false);
    requestAnimationFrame(() => {
      const opener = shortcutKeyModalOpenerRef.current;
      shortcutKeyModalOpenerRef.current = null;
      if (opener && opener !== document.body && opener.isConnected) {
        opener.focus();
        return;
      }
      inputRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      // 打开新聊天 command + shift + o
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "o"
      ) {
        event.preventDefault();
        setTimeout(() => {
          useChatStore.getState().newSession();
          navigate(Path.Chat);
        }, 10);
      }
      // 聚焦聊天输入 shift + esc
      else if (event.shiftKey && event.key.toLowerCase() === "escape") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      // 复制最后一个代码块 command + shift + ;
      else if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.code === "Semicolon"
      ) {
        event.preventDefault();
        const copyCodeButton =
          document.querySelectorAll<HTMLElement>(".copy-code-button");
        if (copyCodeButton.length > 0) {
          copyCodeButton[copyCodeButton.length - 1].click();
        }
      }
      // 复制最后一个回复 command + shift + c
      else if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "c"
      ) {
        event.preventDefault();
        const shortcutMessages = shortcutMessagesRef.current;
        let lastNonUserMessage: ChatMessage | undefined;
        let lastNonUserMessageIndex = -1;
        for (
          let messageIndex = shortcutMessages.length - 1;
          messageIndex >= 0;
          messageIndex -= 1
        ) {
          const candidateMessage = shortcutMessages[messageIndex];
          if (candidateMessage.role !== "user") {
            lastNonUserMessage = candidateMessage;
            lastNonUserMessageIndex =
              shortcutMessageWindowStartRef.current + messageIndex;
            break;
          }
        }
        if (lastNonUserMessage) {
          void copyMessageContent(
            lastNonUserMessage,
            getMessageActionId(lastNonUserMessage, lastNonUserMessageIndex),
          );
        }
      }
      // 展示快捷键 command + /
      else if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        openShortcutKeyModal(
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : inputRef.current,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, openShortcutKeyModal, copyMessageContent, getMessageActionId]);

  const [showChatSidePanel, setShowChatSidePanel] = useState(false);

  // 添加触摸滑动相关的状态
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchEndXRef = useRef(0);
  const touchEndYRef = useRef(0);
  const ignoreChatSwipeRef = useRef(false);
  const isExcludedChatSwipeTarget = (target: EventTarget | null) => {
    const touchTarget =
      target instanceof Element
        ? target
        : target instanceof Node
        ? target.parentElement
        : null;

    return Boolean(
      touchTarget?.closest(
        '[data-composer-attachment-strip="true"], [data-chat-horizontal-scroll="true"]',
      ),
    );
  };

  const resetChatSwipe = () => {
    ignoreChatSwipeRef.current = false;
    touchStartXRef.current = 0;
    touchStartYRef.current = 0;
    touchEndXRef.current = 0;
    touchEndYRef.current = 0;
  };

  // 处理触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || touch.clientX > 32 || isExcludedChatSwipeTarget(e.target)) {
      ignoreChatSwipeRef.current = true;
      return;
    }

    ignoreChatSwipeRef.current = false;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchEndXRef.current = touch.clientX;
    touchEndYRef.current = touch.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (ignoreChatSwipeRef.current) {
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;
    touchEndXRef.current = touch.clientX;
    touchEndYRef.current = touch.clientY;
  };

  const handleTouchEnd = () => {
    if (ignoreChatSwipeRef.current) {
      resetChatSwipe();
      return;
    }

    if (!isCompactScreen) {
      resetChatSwipe();
      return;
    }

    const swipeDistanceX = touchEndXRef.current - touchStartXRef.current;
    const swipeDistanceY = touchEndYRef.current - touchStartYRef.current;
    const minSwipeDistance = 100; // 最小滑动距离

    if (
      swipeDistanceX > minSwipeDistance &&
      Math.abs(swipeDistanceX) > 1.2 * Math.abs(swipeDistanceY)
    ) {
      navigate(Path.Home);
    }

    resetChatSwipe();
  };

  const syncAttachmentScrollHint = useCallback(() => {
    const attachmentContainer = attachmentsContainerRef.current;
    if (!attachmentContainer) {
      setAttachmentScrollHint((current) =>
        current.start || current.end ? { start: false, end: false } : current,
      );
      return;
    }

    const maxScrollLeft = Math.max(
      0,
      attachmentContainer.scrollWidth - attachmentContainer.clientWidth,
    );
    const nextHint = {
      start: attachmentContainer.scrollLeft > 1,
      end: maxScrollLeft - attachmentContainer.scrollLeft > 1,
    };

    setAttachmentScrollHint((current) =>
      current.start === nextHint.start && current.end === nextHint.end
        ? current
        : nextHint,
    );
  }, []);

  useLayoutEffect(() => {
    if (attachImages.length === 0 && attachedFiles.length === 0) {
      setAttachmentScrollHint((current) =>
        current.start || current.end ? { start: false, end: false } : current,
      );
      return;
    }

    const scrollHintFrame = requestAnimationFrame(syncAttachmentScrollHint);
    return () => cancelAnimationFrame(scrollHintFrame);
  }, [attachImages.length, attachedFiles.length, syncAttachmentScrollHint]);

  useEffect(() => {
    window.addEventListener("resize", syncAttachmentScrollHint);
    return () => window.removeEventListener("resize", syncAttachmentScrollHint);
  }, [syncAttachmentScrollHint]);

  const armAttachmentDelete = useCallback(
    (attachmentKey: string, target: HTMLElement) => {
      activeAttachmentDeleteKeyRef.current = attachmentKey;
      setActiveAttachmentDeleteKey(attachmentKey);
      requestAnimationFrame(() => {
        const deleteButton = target.querySelector<HTMLButtonElement>(
          `button.${styles["delete-image"]}`,
        );
        deleteButton?.focus({ preventScroll: true });
      });
    },
    [],
  );

  const clearActiveAttachmentDelete = useCallback(
    (options: ClearAttachmentDeleteOptions = {}) => {
      const activeKey = activeAttachmentDeleteKeyRef.current;
      activeAttachmentDeleteKeyRef.current = null;
      setActiveAttachmentDeleteKey(null);
      if (!options.restoreFocus || !activeKey) return;

      requestAnimationFrame(() => {
        const activeAttachment =
          attachmentsContainerRef.current?.querySelector<HTMLElement>(
            `[data-attachment-swipe-key="${activeKey}"]`,
          );
        const deleteButton = activeAttachment?.querySelector<HTMLButtonElement>(
          `button.${styles["delete-image"]}`,
        );
        const editButton = activeAttachment?.querySelector<HTMLButtonElement>(
          `button.${styles["attach-image"]}, button.${styles["attach-file"]}`,
        );

        if (document.activeElement !== deleteButton) return;
        if (editButton && !editButton.disabled) {
          editButton.focus({ preventScroll: true });
          return;
        }
        deleteButton?.blur();
      });
    },
    [],
  );

  useEffect(() => {
    if (attachImages.length > 0 || attachedFiles.length > 0) return;
    clearActiveAttachmentDelete();
  }, [attachImages.length, attachedFiles.length, clearActiveAttachmentDelete]);

  const canAttachmentStripScrollWithSwipe = useCallback((deltaX: number) => {
    const attachmentContainer = attachmentsContainerRef.current;
    if (!attachmentContainer) return false;

    const maxScrollLeft = Math.max(
      0,
      attachmentContainer.scrollWidth - attachmentContainer.clientWidth,
    );
    if (maxScrollLeft <= 1) return false;
    if (deltaX < 0) {
      return attachmentContainer.scrollLeft < maxScrollLeft - 1;
    }
    if (deltaX > 0) {
      return attachmentContainer.scrollLeft > 1;
    }
    return false;
  }, []);

  const handleAttachmentTouchStart = (
    attachmentKey: string,
    event: React.TouchEvent<HTMLElement>,
  ) => {
    const touch = event.touches[0];
    if (!touch) return;

    if (
      activeAttachmentDeleteKeyRef.current &&
      activeAttachmentDeleteKeyRef.current !== attachmentKey
    ) {
      clearActiveAttachmentDelete();
    }

    attachmentSwipeStartRef.current = {
      key: attachmentKey,
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleAttachmentTouchMove = (
    attachmentKey: string,
    event: React.TouchEvent<HTMLElement>,
  ) => {
    const swipeStart = attachmentSwipeStartRef.current;
    const touch = event.touches[0];
    if (!swipeStart || swipeStart.key !== attachmentKey || !touch) return;

    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    if (
      deltaX > ATTACHMENT_SWIPE_DELETE_THRESHOLD / 2 &&
      activeAttachmentDeleteKeyRef.current === attachmentKey
    ) {
      clearActiveAttachmentDelete({ restoreFocus: true });
      return;
    }

    if (canAttachmentStripScrollWithSwipe(deltaX)) {
      return;
    }

    if (deltaX < -ATTACHMENT_SWIPE_DELETE_THRESHOLD) {
      armAttachmentDelete(attachmentKey, event.currentTarget);
      return;
    }
  };

  const handleAttachmentTouchEnd = useCallback(() => {
    attachmentSwipeStartRef.current = null;
  }, []);

  const focusComposerAttachmentAfterRemoval = useCallback(
    (nextAttachmentIndex: number) => {
      requestAnimationFrame(() => {
        const attachmentControls = Array.from(
          attachmentsContainerRef.current?.querySelectorAll<HTMLButtonElement>(
            `button.${styles["attach-image"]}, button.${styles["attach-file"]}, button.${styles["attachment-add-button"]}`,
          ) ?? [],
        ).filter((control) => control.isConnected && !control.disabled);
        const nextControl =
          attachmentControls[
            Math.min(nextAttachmentIndex, attachmentControls.length - 1)
          ] ?? inputRef.current;

        nextControl?.focus();
      });
    },
    [],
  );

  // 添加删除单个文件函数
  function deleteAttachedFile(index: number) {
    setAttachedFiles((currentFiles) =>
      removeAttachmentAtIndex(currentFiles, index),
    );
    clearActiveAttachmentDelete();
    focusComposerAttachmentAfterRemoval(attachImages.length + index);
  }

  // 在 ChatInner 组件内添加新状态
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null);
  const [showFileEditModal, setShowFileEditModal] = useState(false);

  // 在_Chat组件中添加状态
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editingImageTitle, setEditingImageTitle] = useState(
    Locale.ImageEditor.Title,
  );
  const editingAttachmentImageIndexRef = useRef<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageActionLabels, setPreviewImageActionLabels] = useState(
    getImageActionLabels(),
  );
  const [previewImageAlt, setPreviewImageAlt] = useState(getImagePreviewAlt());
  const [previewImageDialogLabel, setPreviewImageDialogLabel] = useState(
    getImagePreviewDialogLabel(),
  );
  const imagePreviewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const openPromptLibrary = () => {
    setPromptHints([]);
    setChatActionMenuView("prompt-library");
  };
  const closePromptLibrary = () => {
    setChatActionMenuView("main");
    requestAnimationFrame(() => {
      chatInputActionMenuRef.current
        ?.querySelector<HTMLElement>('[data-chat-action="prompt-library"]')
        ?.focus({ preventScroll: true });
    });
  };
  const selectPromptFromLibrary = (prompt: Prompt) => {
    setShowChatActionMenu(false);
    setChatActionMenuView("main");
    onPromptSelect(prompt);
  };

  // 在_Chat组件中添加状态，记录当前编辑图片所属的消息ID
  const editingImageMessageIdRef = useRef<string | null>(null);

  const getMessageActionRailControls = useCallback(
    (rail: HTMLElement | null) => {
      return Array.from(
        rail?.querySelectorAll<HTMLButtonElement>(
          `button.${styles["chat-input-action"]}`,
        ) ?? [],
      ).filter((control) => !control.disabled && control.offsetParent !== null);
    },
    [],
  );
  const focusMessageActionRailControl = useCallback(
    (rail: HTMLElement | null, key: string) => {
      const controls = getMessageActionRailControls(rail);
      if (controls.length === 0) return;

      const currentIndex = controls.findIndex(
        (control) => control === document.activeElement,
      );
      let nextIndex = currentIndex;

      switch (key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex =
            currentIndex < 0
              ? 0
              : Math.min(currentIndex + 1, controls.length - 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex =
            currentIndex < 0
              ? controls.length - 1
              : Math.max(currentIndex - 1, 0);
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = controls.length - 1;
          break;
        default:
          return;
      }

      const nextControl = controls[nextIndex];
      if (!nextControl) return;

      nextControl.focus({ preventScroll: true });
    },
    [getMessageActionRailControls],
  );
  const handleMessageActionRailKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }

      if (
        ![
          "ArrowRight",
          "ArrowDown",
          "ArrowLeft",
          "ArrowUp",
          "Home",
          "End",
        ].includes(event.key)
      )
        return;

      event.preventDefault();
      event.stopPropagation();
      focusMessageActionRailControl(event.currentTarget, event.key);
    },
    [focusMessageActionRailControl],
  );

  const getChatActionMenuControls = useCallback(() => {
    return Array.from(
      chatInputActionMenuRef.current?.querySelectorAll<HTMLElement>(
        `button.${styles["chat-input-action"]}, [data-chat-action-menu-control="true"]`,
      ) ?? [],
    ).filter(
      (control) =>
        (!(
          control instanceof HTMLButtonElement ||
          control instanceof HTMLInputElement
        ) ||
          !control.disabled) &&
        control.offsetParent !== null &&
        !control.closest('[role="listbox"]'),
    );
  }, []);
  const focusChatActionMenuControl = useCallback(
    (key: string) => {
      const controls = getChatActionMenuControls();
      if (controls.length === 0) return;

      const currentIndex = controls.findIndex(
        (control) => control === document.activeElement,
      );
      let nextIndex = currentIndex;

      switch (key) {
        case "ArrowDown":
          nextIndex =
            currentIndex < 0
              ? 0
              : Math.min(currentIndex + 1, controls.length - 1);
          break;
        case "ArrowUp":
          nextIndex =
            currentIndex < 0
              ? controls.length - 1
              : Math.max(currentIndex - 1, 0);
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = controls.length - 1;
          break;
        default:
          return;
      }

      const nextControl = controls[nextIndex];
      if (!nextControl) return;

      nextControl.focus();
      nextControl.scrollIntoView({ block: "nearest" });
    },
    [getChatActionMenuControls],
  );
  const trapChatActionMenuTab = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const controls = getChatActionMenuControls();
      if (controls.length === 0) return;

      const currentIndex = controls.findIndex(
        (control) => control === document.activeElement,
      );
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? controls.length - 1
          : currentIndex - 1
        : currentIndex < 0 || currentIndex >= controls.length - 1
        ? 0
        : currentIndex + 1;
      const nextControl = controls[nextIndex];

      event.preventDefault();
      event.stopPropagation();
      nextControl?.focus();
      nextControl?.scrollIntoView({ block: "nearest" });
    },
    [getChatActionMenuControls],
  );
  useEffect(() => {
    if (!showChatActionMenu) return;

    const focusFirstChatActionMenuControl = () => {
      const activeElement = document.activeElement;
      if (chatActionMenuView === "prompt-library") {
        if (
          activeElement instanceof HTMLElement &&
          activeElement.closest(`.${styles["chat-prompt-library"]}`)
        ) {
          return;
        }
        chatInputActionMenuRef.current
          ?.querySelector<HTMLInputElement>(
            '[data-prompt-library-search="true"]',
          )
          ?.focus({ preventScroll: true });
        return;
      }
      if (
        activeElement instanceof HTMLElement &&
        chatInputActionMenuRef.current?.contains(activeElement)
      ) {
        return;
      }

      focusChatActionMenuControl("Home");
    };
    const focusFrame = requestAnimationFrame(focusFirstChatActionMenuControl);
    const settleFocusTimer = window.setTimeout(
      focusFirstChatActionMenuControl,
      180,
    );
    return () => {
      cancelAnimationFrame(focusFrame);
      window.clearTimeout(settleFocusTimer);
    };
  }, [chatActionMenuView, focusChatActionMenuControl, showChatActionMenu]);
  const handleChatActionMenuKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (!showChatActionMenu) return;
    if ((event.target as HTMLElement | null)?.closest('[role="listbox"]')) {
      return;
    }
    if (event.key === "Tab") {
      trapChatActionMenuTab(event);
      return;
    }
    if (event.target instanceof HTMLInputElement) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    event.stopPropagation();
    focusChatActionMenuControl(event.key);
  };
  const openImagePreview = useCallback(
    (
      src: string,
      options?: { trigger?: HTMLButtonElement | null; label?: string },
    ) => {
      imagePreviewTriggerRef.current = options?.trigger ?? null;
      setPreviewImageActionLabels(getImageActionLabels(options?.label));
      setPreviewImageAlt(getImagePreviewAlt(options?.label));
      setPreviewImageDialogLabel(getImagePreviewDialogLabel(options?.label));
      setPreviewImage(src);
    },
    [],
  );
  const openMarkdownImagePreview = useCallback(
    (src: string, label?: string) => openImagePreview(src, { label }),
    [openImagePreview],
  );
  const closeImagePreview = useCallback(() => {
    setPreviewImage(null);
    setPreviewImageActionLabels(getImageActionLabels());
    setPreviewImageAlt(getImagePreviewAlt());
    setPreviewImageDialogLabel(getImagePreviewDialogLabel());
    requestAnimationFrame(() => {
      const previewTrigger = imagePreviewTriggerRef.current;
      if (previewTrigger?.isConnected) {
        previewTrigger.focus();
      }
      imagePreviewTriggerRef.current = null;
    });
  }, []);

  useEffect(() => {
    if (!showChatActionMenu) return;

    const closeChatActionMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (chatActionMenuView === "prompt-library") {
          closePromptLibrary();
          return;
        }
        setShowChatActionMenu(false);
        setChatActionMenuView("main");
        requestAnimationFrame(() => chatInputMenuButtonRef.current?.focus());
      }
    };

    window.addEventListener("keydown", closeChatActionMenuOnEscape);
    return () =>
      window.removeEventListener("keydown", closeChatActionMenuOnEscape);
  }, [chatActionMenuView, showChatActionMenu]);

  useEffect(() => {
    if (!previewImage) return;

    const closePreview = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeImagePreview();
      }
    };

    window.addEventListener("keydown", closePreview);
    return () => window.removeEventListener("keydown", closePreview);
  }, [closeImagePreview, previewImage]);

  const showInputReasoningAction = false;
  const showInputStatusRow = showInputReasoningAction;
  const isMobileSidebarOpen = location.pathname === Path.Home;
  const promptToast = (
    <PromptToast
      showToast={!hitBottom}
      showModal={showPromptModal}
      contextLength={presetPromptCount}
      onOpen={openPromptModal}
    />
  );

  return (
    <div
      className={styles.chat}
      key={session.id}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetChatSwipe}
    >
      <span
        className={styles["chat-dropzone-live-status"]}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isDropzonePreviewActive
          ? Locale.Chat.Attachments.LiveStatus(
              dropzonePayloadSummary?.text ?? Locale.Chat.Attachments.DropTitle,
              dropzonePayloadSummary?.hint ??
                Locale.Chat.Attachments.Drag.AddHint,
            )
          : ""}
      </span>
      <div
        className={clsx(
          styles["chat-dropzone"],
          isDropzonePreviewActive && styles["chat-dropzone-active"],
        )}
        aria-hidden={!isDropzonePreviewActive}
        data-drop-active={isDropzonePreviewActive ? "true" : "false"}
        data-drop-accepted={
          dropzonePayloadSummary?.willAdd === false ? "false" : "true"
        }
        aria-labelledby="chat-dropzone-status"
        aria-describedby="chat-dropzone-summary chat-dropzone-hint"
      >
        <div className={styles["chat-dropzone-content"]}>
          <div className={styles["chat-dropzone-icon"]}>
            <AttachmentIcon />
          </div>
          <p id="chat-dropzone-status" className={styles["chat-dropzone-text"]}>
            {Locale.Chat.Attachments.DropTitle}
          </p>
          <p
            id="chat-dropzone-summary"
            className={styles["chat-dropzone-summary"]}
          >
            {dropzonePayloadSummary?.text ?? Locale.Chat.Attachments.DropDetect}
          </p>
          <p id="chat-dropzone-hint" className={styles["chat-dropzone-hint"]}>
            {dropzonePayloadSummary?.hint ??
              Locale.Chat.Attachments.Drag.AddHint}
          </p>
        </div>
      </div>
      <button
        type="button"
        className={clsx(styles["chat-input-action-menu-backdrop"], {
          [styles["chat-input-action-menu-backdrop-open"]]: showChatActionMenu,
        })}
        aria-label={Locale.Chat.ChatToolMenu.Close}
        onClick={() => {
          setShowChatActionMenu(false);
          setChatActionMenuView("main");
          requestAnimationFrame(() => chatInputMenuButtonRef.current?.focus());
        }}
      />
      {isCompactScreen ? (
        <div className={styles["chat-mobile-header"]} data-tauri-drag-region>
          <button
            type="button"
            className={clsx("clickable", styles["chat-mobile-header-button"])}
            title={Locale.Chat.Actions.ChatList}
            aria-label={Locale.Chat.Actions.ChatList}
            aria-controls="mobile-sidebar-drawer"
            aria-expanded={isMobileSidebarOpen}
            data-mobile-sidebar-trigger
            onClick={() => navigate(Path.Home)}
          >
            <MenuIcon />
          </button>
          <div className={styles["chat-mobile-topic-title"]}>
            {!session.topic ? DEFAULT_TOPIC : session.topic}
          </div>
          <IconButton
            className={styles["chat-mobile-header-button"]}
            icon={<SettingsIcon />}
            bordered
            title={
              presetPromptCount > 0
                ? Locale.Context.SettingsWithPrompts(presetPromptCount)
                : Locale.Chat.InputActions.Settings
            }
            aria={
              presetPromptCount > 0
                ? Locale.Context.SettingsWithPrompts(presetPromptCount)
                : Locale.Chat.InputActions.Settings
            }
            onClick={(event) => {
              closeMobileModelSelector();
              setShowChatActionMenu(false);
              openPromptModal(event.currentTarget);
            }}
          />
        </div>
      ) : showDesktopChatHeader ? (
        <div
          className={clsx("window-header", styles["chat-desktop-header"])}
          data-tauri-drag-region
        >
          <div
            className={clsx(
              "window-header-title",
              styles["chat-body-title"],
              styles["chat-desktop-title-stack"],
            )}
          >
            <button
              type="button"
              className={clsx(
                "window-header-main-title",
                styles["chat-body-main-title"],
              )}
              onClickCapture={() => setIsEditingMessage(true)}
            >
              {!session.topic ? DEFAULT_TOPIC : session.topic}
            </button>
          </div>
          <div className={styles["chat-desktop-header-cluster"]}>
            {promptToast}
            <div
              className={clsx(
                "window-actions",
                styles["chat-desktop-header-actions"],
              )}
            >
              <div
                className={clsx(
                  "window-action-button",
                  styles["chat-desktop-header-action"],
                )}
              >
                <IconButton
                  icon={<ReloadIcon />}
                  bordered
                  title={Locale.Chat.Actions.RefreshTitle}
                  aria={Locale.Chat.Actions.RefreshTitle}
                  onClick={() => {
                    showToast(Locale.Chat.Actions.RefreshToast);
                    chatStore.summarizeSession(true, session);
                  }}
                />
              </div>
              <div
                className={clsx(
                  "window-action-button",
                  styles["chat-desktop-header-action"],
                )}
              >
                <IconButton
                  icon={<RenameIcon />}
                  bordered
                  title={Locale.Chat.EditMessage.Title}
                  aria={Locale.Chat.EditMessage.Title}
                  onClick={() => setIsEditingMessage(true)}
                />
              </div>
              <div
                className={clsx(
                  "window-action-button",
                  styles["chat-desktop-header-action"],
                  styles["chat-desktop-header-action-export"],
                )}
              >
                <IconButton
                  icon={<ExportIcon />}
                  bordered
                  title={Locale.Chat.Actions.Export}
                  aria={Locale.Chat.Actions.Export}
                  onClick={() => {
                    setShowExport(true);
                  }}
                />
              </div>
              {showMaxIcon && (
                <div
                  className={clsx(
                    "window-action-button",
                    styles["chat-desktop-header-action"],
                    styles["chat-desktop-header-action-fullscreen"],
                  )}
                >
                  <IconButton
                    icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}
                    bordered
                    title={Locale.Chat.Actions.FullScreen}
                    aria={Locale.Chat.Actions.FullScreen}
                    onClick={() => {
                      config.update(
                        (config) => (config.tightBorder = !config.tightBorder),
                      );
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {showMobileModelSelector ? (
        <>
          <button
            type="button"
            className={clsx(
              isCompactScreen
                ? styles["chat-mobile-model-menu-backdrop"]
                : styles["chat-desktop-model-menu-backdrop"],
              styles["chat-model-menu-visible"],
            )}
            aria-label={Locale.Chat.ModelMenu.Close}
            tabIndex={0}
            onClick={() => {
              closeMobileModelSelector();
              restoreModelSelectorFocus();
            }}
          />
          <div
            id="chat-model-menu"
            ref={modelMenuRef}
            className={clsx(
              isCompactScreen
                ? styles["chat-mobile-model-menu"]
                : styles["chat-desktop-model-menu"],
              styles["chat-desktop-model-menu-composer"],
              styles["chat-model-menu-visible"],
              {
                [styles["chat-model-menu-reasoning"]]:
                  isReasoningSectionExpanded || isImageOptionsExpanded,
              },
            )}
            onKeyDown={handleModelMenuKeyDown}
            tabIndex={-1}
            role="dialog"
            aria-modal={!showEmptyState}
            aria-label={
              isImageOptionsExpanded
                ? Locale.Chat.ModelMenu.ImageOptions
                : isReasoningSectionExpanded
                ? Locale.Chat.ModelMenu.ReasoningOptions
                : Locale.Chat.ModelMenu.SelectModelAndParams
            }
          >
            {headerModelLocked && (
              <span
                id="chat-model-lock-status"
                className={styles["chat-model-menu-status"]}
              >
                {Locale.Settings.GPT56Capabilities.ConfigSource.Locked}
              </span>
            )}
            {(isReasoningSectionExpanded || isImageOptionsExpanded) && (
              <div className={styles["chat-model-menu-header"]}>
                <div className={styles["chat-model-menu-current-model"]}>
                  <strong>{headerCurrentModelName}</strong>
                  <small>{headerCurrentProviderName}</small>
                </div>
                <button
                  type="button"
                  className={styles["chat-model-menu-switch-model"]}
                  aria-label={Locale.Chat.ModelMenu.SwitchModel}
                  aria-describedby={
                    headerModelLocked ? "chat-model-lock-status" : undefined
                  }
                  title={Locale.Chat.ModelMenu.SwitchModel}
                  data-model-menu-control="true"
                  disabled={!!headerModelLocked}
                  onClick={returnToModelList}
                >
                  <ResetIcon />
                  <span>{Locale.Chat.ModelMenu.SwitchModel}</span>
                </button>
              </div>
            )}
            {isReasoningSectionExpanded ? (
              <ReasoningEffortRail
                id="chat-mobile-reasoning-options"
                ariaLabel={Locale.Chat.ModelMenu.ReasoningOptions}
                title={Locale.Chat.ModelMenu.ReasoningEffort}
                efforts={visibleHeaderReasoningEfforts}
                allowedEfforts={headerReasoningEfforts}
                value={headerCurrentReasoningEffort}
                locked={!!headerReasoningLocked}
                lockedLabel={
                  Locale.Settings.GPT56Capabilities.ConfigSource.Locked
                }
                labels={reasoningLabels}
                descriptions={reasoningDescriptions}
                onChange={selectHeaderReasoningEffort}
                onLockedAttempt={() =>
                  selectHeaderReasoningEffort(headerCurrentReasoningEffort)
                }
              />
            ) : isImageOptionsExpanded ? (
              <div className={styles["chat-image-option-rails"]}>
                <DiscreteOptionRail<OpenAIImageSize>
                  id="chat-image-size-options"
                  ariaLabel={Locale.Chat.ModelMenu.ImageSizeOptions}
                  title={Locale.Chat.ModelMenu.ImageSize}
                  options={headerImageSizes}
                  allowedOptions={headerImageSizes}
                  value={headerCurrentSize}
                  locked={!!headerImageSizeLocked}
                  lockedLabel={
                    Locale.Settings.GPT56Capabilities.ConfigSource.Locked
                  }
                  labels={headerImageSizeLabels}
                  descriptions={headerImageSizeDescriptions}
                  emphasizeHighest={false}
                  onChange={selectHeaderImageSize}
                  onLockedAttempt={() =>
                    selectHeaderImageSize(headerCurrentSize)
                  }
                />
                {headerImageQualitys.length > 0 && (
                  <DiscreteOptionRail<OpenAIImageQuality>
                    id="chat-image-quality-options"
                    ariaLabel={Locale.Chat.ModelMenu.ImageQualityOptions}
                    title={Locale.Chat.ModelMenu.ImageQuality}
                    options={headerImageQualitys}
                    allowedOptions={headerImageQualitys}
                    value={headerCurrentQuality}
                    locked={!!headerImageQualityLocked}
                    lockedLabel={
                      Locale.Settings.GPT56Capabilities.ConfigSource.Locked
                    }
                    labels={headerImageQualityLabels}
                    descriptions={headerImageQualityDescriptions}
                    emphasizeHighest={false}
                    onChange={selectHeaderImageQuality}
                    onLockedAttempt={() =>
                      selectHeaderImageQuality(headerCurrentQuality)
                    }
                  />
                )}
              </div>
            ) : (
              <>
                <div
                  className={styles["chat-mobile-model-list"]}
                  role="listbox"
                  aria-label={Locale.Chat.ModelMenu.AvailableModels}
                >
                  {headerModelsForMenu.length === 0 ? (
                    <div className={styles["chat-mobile-model-empty"]}>
                      {showEmptyState && emptyComposerMode === "image"
                        ? Locale.Chat.ModelMenu.ImageModelUnavailable
                        : Locale.Chat.ModelMenu.Empty}
                    </div>
                  ) : (
                    headerModelsForMenu.map((model) => {
                      const providerName = model?.provider?.providerName;
                      const selected =
                        model.name === headerCurrentModel &&
                        providerName === headerCurrentProviderName;
                      return (
                        <button
                          type="button"
                          key={`${model.name}@${providerName}`}
                          className={clsx(styles["chat-mobile-model-option"], {
                            [styles["chat-mobile-model-option-selected"]]:
                              selected,
                          })}
                          role="option"
                          aria-selected={selected}
                          aria-describedby={
                            headerModelLocked
                              ? "chat-model-lock-status"
                              : undefined
                          }
                          disabled={!!headerModelLocked}
                          onClick={() => selectComposerModel(model, selected)}
                        >
                          <span className={styles["chat-mobile-menu-check"]}>
                            {selected && <ComposerCheckIcon />}
                          </span>
                          <span className={styles["chat-mobile-model-copy"]}>
                            <span className={styles["chat-mobile-model-name"]}>
                              {model.displayName || model.name}
                            </span>
                            {providerName && (
                              <span
                                className={styles["chat-mobile-model-provider"]}
                              >
                                {providerName}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {currentModelMenuSection && (
                  <>
                    <div className={styles["chat-mobile-model-divider"]} />
                    {currentModelMenuSection === "reasoning" && (
                      <div className={styles["chat-mobile-model-section"]}>
                        <button
                          type="button"
                          className={styles["chat-mobile-reasoning-head"]}
                          aria-controls="chat-mobile-reasoning-options"
                          onClick={() =>
                            setExpandedMobileModelSection("reasoning")
                          }
                        >
                          <span>
                            <strong>
                              {Locale.Chat.ModelMenu.ReasoningEffort}
                            </strong>
                            <small>
                              {reasoningLabels[headerCurrentReasoningEffort]}
                            </small>
                          </span>
                          <span
                            className={styles["chat-mobile-reasoning-caret"]}
                          >
                            <ComposerChevronRightIcon />
                          </span>
                        </button>
                      </div>
                    )}
                    {currentModelMenuSection === "image-options" && (
                      <div className={styles["chat-mobile-model-section"]}>
                        <button
                          type="button"
                          className={styles["chat-mobile-reasoning-head"]}
                          aria-controls="chat-image-size-options"
                          onClick={() =>
                            setExpandedMobileModelSection("image-options")
                          }
                        >
                          <span>
                            <strong>
                              {Locale.Chat.ModelMenu.ImageOptions}
                            </strong>
                            <small>{imageComposerSummary}</small>
                          </span>
                          <span
                            className={styles["chat-mobile-reasoning-caret"]}
                          >
                            <ComposerChevronRightIcon />
                          </span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </>
      ) : null}

      <span
        ref={composerViewportSegmentRef}
        className={styles["chat-composer-viewport-segment-probe"]}
        data-qa-posture={composerQaScenario?.posture}
        aria-hidden="true"
      />

      <div className={styles["chat-main"]}>
        <div className={styles["chat-body-container"]}>
          <section
            id="chat-scroll-body"
            className={clsx(styles["chat-body"], {
              [styles["chat-body-empty"]]: showEmptyHero,
            })}
            ref={scrollRef}
            style={chatBodyStyle}
            aria-label={Locale.Chat.Accessibility.ChatMessages}
            onScroll={(e) => onChatBodyScroll(e.currentTarget)}
            onWheel={() => {
              pendingQuickJumpTargetRef.current = null;
            }}
            onTouchStart={() => {
              pendingQuickJumpTargetRef.current = null;
            }}
          >
            {showEmptyState && (
              <div
                ref={homeModeTabsRef}
                className={clsx(styles["chat-home-mode-tabs"], {
                  [styles["chat-home-mode-tabs-model-open"]]:
                    showMobileModelSelector,
                })}
                role="tablist"
                aria-label={Locale.Chat.HomeMode.Label}
                data-active-mode={emptyComposerMode}
              >
                <span
                  className={styles["chat-home-mode-indicator"]}
                  aria-hidden="true"
                />
                {(["chat", "image"] as const).map((mode) => {
                  const selected = emptyComposerMode === mode;
                  const availableModelCount =
                    mode === "chat"
                      ? headerChatModels.length
                      : headerImageModels.length;
                  const disabled = isChatHomeModeDisabled({
                    mode,
                    activeMode: emptyComposerMode,
                    availableModelCount,
                    modelLocked: headerModelLocked,
                  });
                  return (
                    <button
                      id={`chat-home-mode-${mode}`}
                      key={mode}
                      type="button"
                      className={clsx(styles["chat-home-mode-tab"], {
                        [styles["chat-home-mode-tab-selected"]]: selected,
                      })}
                      role="tab"
                      aria-selected={selected}
                      aria-controls="chat-home-panel"
                      disabled={disabled}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => selectEmptyComposerMode(mode)}
                      onKeyDown={handleHomeModeTabKeyDown}
                    >
                      {mode === "chat"
                        ? Locale.Chat.HomeMode.Chat
                        : Locale.Chat.HomeMode.Image}
                    </button>
                  );
                })}
              </div>
            )}
            <div
              className={styles["chat-home-panel"]}
              id={showEmptyState ? "chat-home-panel" : undefined}
              role={showEmptyState ? "tabpanel" : undefined}
              aria-labelledby={
                showEmptyState
                  ? `chat-home-mode-${emptyComposerMode}`
                  : undefined
              }
            >
              {showEmptyHero && (
                <div className={styles["chat-empty-state"]}>
                  <div className={clsx(styles["chat-empty-logo"], "no-dark")}>
                    <NeatIcon />
                  </div>
                  <h1 className={styles["chat-empty-title"]}>
                    {Locale.Chat.EmptyTitle}
                  </h1>
                </div>
              )}
              <div
                className={styles["chat-reading-surface"]}
                ref={readingSurfaceRef}
                role="list"
                aria-label={Locale.Chat.Accessibility.MessageList}
                aria-live="polite"
                aria-relevant="additions text"
                aria-atomic="false"
              >
                {(showEmptyState ? [] : messages).map((message, i) => {
                  const absoluteMessageIndex = messageRenderStartIndex + i;
                  const isUser = message.role === "user";
                  const isContext = absoluteMessageIndex < context.length;
                  const messageRenderIdentity = getMessageRenderIdentity(
                    message,
                    absoluteMessageIndex,
                    context.length,
                  );
                  const qaMessageIdPrefix =
                    chatQaFixture?.MARKDOWN_STRESS_QA_MESSAGE_ID_PREFIX;
                  const isMarkdownStressQaMessage =
                    qaMessageIdPrefix != null &&
                    message.id.startsWith(qaMessageIdPrefix);
                  const showActions =
                    absoluteMessageIndex > 0 &&
                    !message.streaming &&
                    !message.preview &&
                    message.content.length > 0 &&
                    !isContext &&
                    !isMarkdownStressQaMessage;
                  const showTyping = message.preview || message.streaming;
                  const isWaiting =
                    !isUser &&
                    (message.preview ||
                      (message.streaming && message.content.length === 0));
                  const isStreamingReveal =
                    !isUser && message.streaming && message.content.length > 0;

                  const shouldShowClearContextDivider =
                    absoluteMessageIndex === clearContextAbsoluteIndex - 1;
                  const messageLabel = isUser
                    ? Locale.Chat.Accessibility.UserMessage(
                        absoluteMessageIndex + 1,
                      )
                    : Locale.Chat.Accessibility.AssistantMessage(
                        absoluteMessageIndex + 1,
                      );
                  const messageActionLabel =
                    Locale.Chat.Accessibility.MessageActions(messageLabel);
                  const messageActionId = getMessageActionId(
                    message,
                    absoluteMessageIndex,
                  );
                  const isMessageCopied =
                    copiedMessageActionId === messageActionId;
                  const messageCopyActionLabel =
                    Locale.Chat.Accessibility.ActionLabel(
                      messageActionLabel,
                      isMessageCopied
                        ? Locale.Copy.Success
                        : Locale.Chat.Actions.Copy,
                    );
                  const messageCopyStatus = isMessageCopied
                    ? `${messageLabel} ${Locale.Copy.Success}`
                    : "";
                  const messageTextContent = getMessageTextContent(message);
                  const messageImages = getMessageImages(message);
                  const singleMessageImageLabel = getMessageImageLabel(0, 1);

                  return (
                    <Fragment key={messageRenderIdentity}>
                      <div
                        className={clsx(
                          styles["chat-message-row"],
                          isUser
                            ? styles["chat-message-row-user"]
                            : styles["chat-message-row-assistant"],
                          isUser
                            ? styles["chat-message-user"]
                            : styles["chat-message"],
                          !isUser &&
                            absoluteMessageIndex ===
                              renderMessages.length - 1 &&
                            styles["chat-message-tail"],
                        )}
                        role="listitem"
                        aria-label={messageLabel}
                        aria-busy={showTyping ? true : undefined}
                        data-testid={
                          isMarkdownStressQaMessage
                            ? "markdown-stress-qa-message"
                            : undefined
                        }
                        data-message-anchor={messageRenderIdentity}
                        data-message-index={absoluteMessageIndex}
                      >
                        <div className={styles["chat-message-container"]}>
                          <div className={styles["chat-message-header"]}>
                            <div className={styles["chat-message-avatar"]}>
                              {!isUser && (
                                <div className={styles["chat-message-edit"]}>
                                  <IconButton
                                    icon={<EditIcon />}
                                    aria={Locale.Chat.Actions.Edit}
                                    onClick={async () => {
                                      const newMessage = await showPrompt(
                                        Locale.Chat.Actions.Edit,
                                        getMessageTextContent(message),
                                        10,
                                      );
                                      let newContent:
                                        | string
                                        | MultimodalContent[] = newMessage;
                                      const images = getMessageImages(message);
                                      if (images.length > 0) {
                                        newContent = [
                                          { type: "text", text: newMessage },
                                        ];
                                        for (
                                          let i = 0;
                                          i < images.length;
                                          i++
                                        ) {
                                          newContent.push({
                                            type: "image_url",
                                            image_url: {
                                              url: images[i],
                                            },
                                          });
                                        }
                                      }
                                      chatStore.updateTargetSession(
                                        session,
                                        (session) => {
                                          const m = findMessageForRenderSource(
                                            session.mask.context,
                                            session.messages,
                                            message.id,
                                            isContext,
                                          );
                                          if (m) {
                                            m.content = newContent;
                                          }
                                        },
                                      );
                                    }}
                                  ></IconButton>
                                </div>
                              )}
                              {isUser ? (
                                <div className={styles["empty-avatar"]}></div>
                              ) : (
                                <>
                                  {["system"].includes(message.role) ? (
                                    <Avatar avatar="2699-fe0f" />
                                  ) : (
                                    <MaskAvatar
                                      avatar={session.mask.avatar}
                                      model={
                                        message.model ||
                                        session.mask.modelConfig.model
                                      }
                                    />
                                  )}
                                </>
                              )}
                            </div>
                            {!isUser && (
                              <div className={styles["chat-model-name"]}>
                                {message.model}
                              </div>
                            )}
                          </div>

                          <div
                            className={clsx(
                              styles["chat-message-item"],
                              isStreamingReveal &&
                                styles["chat-message-streaming-reveal"],
                            )}
                          >
                            <Markdown
                              key={message.streaming ? "loading" : "done"}
                              content={messageTextContent}
                              loading={isWaiting}
                              fontSize={fontSize}
                              fontFamily={fontFamily}
                              isUser={isUser}
                              messageId={message.id}
                              streaming={message.streaming}
                              enableArtifacts={
                                session.mask?.enableArtifacts !== false
                              }
                              enableCodeFold={
                                session.mask?.enableCodeFold !== false
                              }
                              onPreviewImage={openMarkdownImagePreview}
                              onDownloadImage={downloadImage}
                            />
                            {messageImages.length > 0 && (
                              <div className={styles["chat-message-media"]}>
                                {messageImages.length === 1 && (
                                  <MessageImagePreview
                                    className={
                                      styles["chat-message-item-image"]
                                    }
                                    src={messageImages[0]}
                                    alt={singleMessageImageLabel}
                                    actionLabels={getImageActionLabels(
                                      singleMessageImageLabel,
                                    )}
                                    onPreview={openImagePreview}
                                    onDownload={downloadImage}
                                  />
                                )}
                                {messageImages.length > 1 && (
                                  <MessageImageGallery
                                    images={messageImages}
                                    onPreview={openImagePreview}
                                    onDownload={downloadImage}
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          {showActions && (
                            <div
                              className={styles["chat-message-actions"]}
                              role="group"
                              aria-label={messageActionLabel}
                            >
                              <div
                                className={styles["chat-message-action-rail"]}
                                onKeyDown={handleMessageActionRailKeyDown}
                              >
                                <>
                                  <ChatAction
                                    text={Locale.Chat.Actions.Retry}
                                    ariaLabel={Locale.Chat.Accessibility.ActionLabel(
                                      messageActionLabel,
                                      Locale.Chat.Actions.Retry,
                                    )}
                                    icon={<ResetIcon />}
                                    onClick={() => onResend(message)}
                                  />
                                  <ChatAction
                                    text={Locale.Chat.Actions.Delete}
                                    ariaLabel={Locale.Chat.Accessibility.ActionLabel(
                                      messageActionLabel,
                                      Locale.Chat.Actions.Delete,
                                    )}
                                    icon={<DeleteIcon />}
                                    onClick={() =>
                                      onDelete(
                                        message.id ?? absoluteMessageIndex,
                                      )
                                    }
                                  />
                                  <ChatAction
                                    text={Locale.Chat.Actions.Pin}
                                    ariaLabel={Locale.Chat.Accessibility.ActionLabel(
                                      messageActionLabel,
                                      Locale.Chat.Actions.Pin,
                                    )}
                                    icon={<PinIcon />}
                                    onClick={() => onPinMessage(message)}
                                  />
                                  <ChatAction
                                    text={
                                      isMessageCopied
                                        ? Locale.Copy.Success
                                        : Locale.Chat.Actions.Copy
                                    }
                                    ariaLabel={messageCopyActionLabel}
                                    title={messageCopyActionLabel}
                                    dataCopyState={
                                      isMessageCopied ? "copied" : "idle"
                                    }
                                    icon={
                                      isMessageCopied ? (
                                        <ConfirmIcon />
                                      ) : (
                                        <CopyIcon />
                                      )
                                    }
                                    onClick={(event) =>
                                      copyMessageContent(
                                        message,
                                        messageActionId,
                                        event.currentTarget,
                                      )
                                    }
                                  />
                                  <span
                                    className={
                                      styles["chat-message-copy-status"]
                                    }
                                    role="status"
                                    aria-live="polite"
                                    aria-atomic="true"
                                  >
                                    {messageCopyStatus}
                                  </span>
                                  {ENABLE_TEXT_TO_SPEECH &&
                                    config.ttsConfig.enable && (
                                      <ChatAction
                                        text={
                                          speechStatus
                                            ? Locale.Chat.Actions.StopSpeech
                                            : Locale.Chat.Actions.Speech
                                        }
                                        ariaLabel={Locale.Chat.Accessibility.ActionLabel(
                                          messageActionLabel,
                                          speechStatus
                                            ? Locale.Chat.Actions.StopSpeech
                                            : Locale.Chat.Actions.Speech,
                                        )}
                                        icon={
                                          speechStatus ? (
                                            <SpeakStopIcon />
                                          ) : (
                                            <SpeakIcon />
                                          )
                                        }
                                        onClick={() =>
                                          openaiSpeech(
                                            getMessageTextContent(message),
                                          )
                                        }
                                      />
                                    )}
                                </>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {shouldShowClearContextDivider && (
                        <ClearContextDivider ref={clearContextDividerRef} />
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </section>
          <div
            ref={chatInputPanelRef}
            className={clsx(styles["chat-input-panel"], {
              [styles["chat-input-panel-collapsed"]]: !shouldExpandChatInput,
              [styles["chat-input-panel-empty"]]: showEmptyComposer,
              [styles["chat-input-panel-model-open"]]: showMobileModelSelector,
            })}
            data-composer-panel="true"
            data-qa-state={composerQaScenario?.state}
            data-qa-posture={composerQaScenario?.posture}
            data-qa-theme={composerQaScenario?.theme}
            data-drag-active={isDropzonePreviewActive ? "true" : undefined}
          >
            {!showEmptyState &&
              !(quickJumpTarget === "top" ? hitTop : hitBottom) &&
              !showChatActionMenu &&
              !showMobileModelSelector && (
                <button
                  type="button"
                  className={styles["chat-scroll-to-bottom"]}
                  data-direction={quickJumpTarget}
                  aria-label={
                    quickJumpTarget === "top"
                      ? Locale.Chat.InputActions.ToTop
                      : Locale.Chat.InputActions.ToBottom
                  }
                  aria-controls="chat-scroll-body"
                  onClick={
                    quickJumpTarget === "top" ? scrollToTop : scrollToBottom
                  }
                >
                  <span
                    className={styles["chat-scroll-direction-icon"]}
                    aria-hidden="true"
                  >
                    <BottomIcon />
                  </span>
                </button>
              )}
            <PromptHints
              prompts={promptHints}
              onPromptSelect={onPromptSelect}
              onClose={closePromptHints}
            />

            <div
              id="chat-input-action-menu"
              ref={chatInputActionMenuRef}
              className={clsx(styles["chat-input-action-menu"], {
                [styles["chat-input-action-menu-open"]]: showChatActionMenu,
              })}
              onKeyDown={handleChatActionMenuKeyDown}
              role="dialog"
              aria-modal="true"
              aria-label={Locale.Chat.ChatToolMenu.MenuLabel}
            >
              {showChatActionMenu && (
                <ChatActions
                  uploadImages={() => handleUploadAttachments("image")}
                  uploadFiles={() => handleUploadAttachments("file")}
                  setAttachImages={setAttachImages}
                  setUploading={setUploading}
                  imageSlotsFull={imageSlotsFull}
                  fileSlotsFull={fileSlotsFull}
                  menuView={chatActionMenuView}
                  openPromptLibrary={openPromptLibrary}
                  closePromptLibrary={closePromptLibrary}
                  onPromptSelect={selectPromptFromLibrary}
                  showPromptModal={() =>
                    openPromptModal(chatInputMenuButtonRef.current)
                  }
                  scrollToBottom={scrollToBottom}
                  hitBottom={hitBottom}
                  uploading={uploading}
                  showPromptHints={() => {
                    // Click again to close
                    if (promptHints.length > 0) {
                      setPromptHints([]);
                      return;
                    }

                    inputRef.current?.focus();
                    setUserInput("/");
                    onSearch("");
                  }}
                  openShortcutKeyModal={() =>
                    openShortcutKeyModal(chatInputMenuButtonRef.current)
                  }
                  setUserInput={setUserInput}
                  setShowChatSidePanel={setShowChatSidePanel}
                  onActionComplete={() => {
                    setShowChatActionMenu(false);
                    setChatActionMenuView("main");
                  }}
                />
              )}
            </div>

            <div
              ref={chatComposerShellRef}
              className={clsx(styles["chat-input-row"], {
                [styles["chat-input-row-focused"]]: isChatInputFocused,
                [styles["chat-input-row-with-voice"]]: showComposerVoice,
              })}
              data-composer-shell="true"
              data-composer-state={
                isTextareaScrolling
                  ? "scrolling"
                  : shouldExpandChatInput
                  ? "expanded"
                  : "compact"
              }
              data-composer-scroll={isTextareaScrolling ? "true" : "false"}
              data-composer-submit-state={displayedComposerSubmitState}
              data-composer-uploading={uploading ? "true" : "false"}
            >
              <button
                type="button"
                ref={chatInputMenuButtonRef}
                className={clsx(styles["chat-input-menu-button"], {
                  [styles["chat-input-menu-button-active"]]: showChatActionMenu,
                })}
                onKeyDown={handleChatActionMenuKeyDown}
                onClick={() => {
                  if (showChatActionMenu) {
                    setShowChatActionMenu(false);
                    setChatActionMenuView("main");
                    return;
                  }
                  closeMobileModelSelector();
                  setPromptHints([]);
                  setChatActionMenuView("main");
                  setShowChatActionMenu(true);
                }}
                aria-label={
                  showChatActionMenu
                    ? Locale.Chat.ChatToolMenu.Close
                    : Locale.Chat.ChatToolMenu.Open
                }
                aria-controls="chat-input-action-menu"
                aria-haspopup="dialog"
                aria-expanded={showChatActionMenu}
              >
                <AddIcon />
              </button>
              <div
                className={clsx(styles["chat-input-panel-inner"], {
                  [styles["chat-input-panel-inner-with-model"]]: true,
                  [styles["chat-input-panel-inner-focused"]]:
                    isChatInputFocused,
                  [styles["chat-input-panel-inner-collapsed"]]:
                    !shouldExpandChatInput,
                  [styles["chat-input-panel-inner-attach"]]:
                    attachImages.length !== 0 || attachedFiles.length !== 0,
                  [styles["chat-input-panel-inner-reasoning"]]:
                    showInputReasoningAction,
                  [styles["chat-input-panel-inner-status"]]: showInputStatusRow,
                  [styles["chat-input-panel-inner-model-open"]]:
                    showMobileModelSelector,
                  [styles["chat-input-panel-inner-home-image"]]:
                    showEmptyState && emptyComposerMode === "image",
                  [styles["chat-input-panel-inner-home-chat"]]:
                    showEmptyState && emptyComposerMode === "chat",
                })}
              >
                <textarea
                  id="chat-input"
                  ref={inputRef}
                  className={styles["chat-input"]}
                  placeholder={
                    isCompactScreen
                      ? Locale.Chat.MobileInput
                      : Locale.Chat.Input(submitKey)
                  }
                  aria-label={
                    isCompactScreen
                      ? Locale.Chat.MobileInput
                      : Locale.Chat.Input(submitKey)
                  }
                  aria-controls={
                    promptHints.length > 0 ? "chat-prompt-hints" : undefined
                  }
                  aria-readonly={isComposerReadOnly ? true : undefined}
                  aria-haspopup="listbox"
                  onChange={(e) => onInput(e.currentTarget.value)}
                  value={userInput}
                  onKeyDown={onInputKeyDown}
                  readOnly={isComposerReadOnly}
                  onFocus={() => {
                    setIsChatInputFocused(true);
                  }}
                  onBlur={() => setIsChatInputFocused(false)}
                  onPaste={markdownStressQaEnabled ? undefined : handlePaste}
                  rows={1}
                  autoFocus={autoFocus}
                  style={
                    {
                      "--chat-input-font-size": `${config.fontSize}px`,
                      fontFamily: config.fontFamily,
                    } as React.CSSProperties
                  }
                />

                <button
                  type="button"
                  ref={modelSelectorButtonRef}
                  className={clsx(styles["chat-input-model-button"], {
                    [styles["chat-input-model-button-open"]]:
                      showMobileModelSelector,
                    [styles["chat-input-model-button-home-chat"]]:
                      showEmptyState && emptyComposerMode === "chat",
                    [styles["chat-input-model-button-home-image"]]:
                      showEmptyState && emptyComposerMode === "image",
                  })}
                  aria-label={modelChipAccessibleLabel}
                  title={modelChipAccessibleLabel}
                  data-model-menu-layer={currentModelMenuLayer}
                  onKeyDown={handleModelMenuKeyDown}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setShowChatActionMenu(false);
                    setChatActionMenuView("main");
                    if (showMobileModelSelector) {
                      closeMobileModelSelector();
                      return;
                    }
                    setExpandedMobileModelSection(currentModelMenuSection);
                    setShowMobileModelSelector(true);
                  }}
                  aria-controls="chat-model-menu"
                  aria-haspopup="dialog"
                  aria-expanded={showMobileModelSelector}
                >
                  {showMobileModelSelector && (
                    <>
                      <span className={styles["chat-input-model-name"]}>
                        {headerCurrentModelName}
                      </span>
                      <span className={styles["chat-input-model-separator"]}>
                        ·
                      </span>
                    </>
                  )}
                  <span className={styles["chat-input-model-detail"]}>
                    {showEmptyState && emptyComposerMode === "chat"
                      ? reasoningLabels[headerCurrentReasoningEffort]
                      : showEmptyState && emptyComposerMode === "image"
                      ? imageComposerSummary
                      : currentModelDetail}
                  </span>
                  <span
                    className={styles["chat-input-model-arrow"]}
                    aria-hidden="true"
                  >
                    <ComposerChevronDownIcon />
                  </span>
                </button>

                {showInputStatusRow && (
                  <div
                    className={styles["chat-input-status-row"]}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={Locale.Chat.ModelMenu.CurrentInputMode}
                  >
                    {showInputReasoningAction && <ChatInputReasoningAction />}
                  </div>
                )}

                {/* 附件容器（包含图片和文件） */}
                {(attachImages.length > 0 || attachedFiles.length > 0) && (
                  <div
                    className={styles["attachments-scroll-shell"]}
                    data-composer-attachment-strip="true"
                    data-attachment-strip-preview={
                      markdownStressQaAttachmentStripPreview ?? undefined
                    }
                    data-overflow-start={
                      attachmentScrollHint.start ? "true" : "false"
                    }
                    data-overflow-end={
                      attachmentScrollHint.end ? "true" : "false"
                    }
                  >
                    {attachmentScrollHint.start && (
                      <span
                        aria-hidden="true"
                        className={clsx(
                          styles["attachment-scroll-fade"],
                          styles["attachment-scroll-fade-start"],
                        )}
                      />
                    )}
                    {attachmentScrollHint.end && (
                      <span
                        aria-hidden="true"
                        className={clsx(
                          styles["attachment-scroll-fade"],
                          styles["attachment-scroll-fade-end"],
                        )}
                      />
                    )}
                    <div
                      ref={attachmentsContainerRef}
                      className={styles["attachments-container"]}
                      role="list"
                      aria-label={Locale.Chat.Attachments.Preview}
                      onScroll={syncAttachmentScrollHint}
                    >
                      {/* 图片附件 */}
                      {attachImages.map((image, index) => (
                        <div
                          className={clsx(
                            styles["attach-item"],
                            styles["attach-image-item"],
                          )}
                          role="listitem"
                          key={getAttachmentRenderKey("image", image, index)}
                          data-attachment-swipe-key={getAttachmentSwipeKey(
                            "image",
                            index,
                          )}
                          data-swipe-delete-active={
                            activeAttachmentDeleteKey ===
                            getAttachmentSwipeKey("image", index)
                              ? "true"
                              : undefined
                          }
                          onTouchStart={(event) =>
                            handleAttachmentTouchStart(
                              getAttachmentSwipeKey("image", index),
                              event,
                            )
                          }
                          onTouchMove={(event) =>
                            handleAttachmentTouchMove(
                              getAttachmentSwipeKey("image", index),
                              event,
                            )
                          }
                          onTouchEnd={handleAttachmentTouchEnd}
                          onTouchCancel={handleAttachmentTouchEnd}
                        >
                          <button
                            type="button"
                            className={styles["attach-image"]}
                            aria-label={Locale.Chat.Attachments.EditImage(
                              index + 1,
                            )}
                            style={{ backgroundImage: `url("${image}")` }}
                            onClick={() => {
                              setEditingImageTitle(
                                Locale.Chat.Attachments.EditImage(index + 1),
                              );
                              editingAttachmentImageIndexRef.current = index;
                              editingImageMessageIdRef.current = null;
                              setEditingImage(image);
                            }}
                          />
                          <div className={styles["attach-image-mask"]}>
                            <DeleteImageButton
                              ariaLabel={Locale.Chat.Attachments.DeleteImage(
                                index + 1,
                              )}
                              deleteImage={(e) => {
                                e.stopPropagation(); // 防止触发图片点击事件
                                setAttachImages((currentImages) =>
                                  removeAttachmentAtIndex(currentImages, index),
                                );
                                clearActiveAttachmentDelete();
                                focusComposerAttachmentAfterRemoval(index);
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* 文件附件 */}
                      {attachedFiles.map((file, index) => {
                        const fileEditContextLabel =
                          Locale.Chat.Attachments.EditFile(
                            index + 1,
                            file.name,
                          );

                        return (
                          <div
                            className={clsx(
                              styles["attach-item"],
                              styles["attach-file-item"],
                            )}
                            role="listitem"
                            key={getAttachmentRenderKey("file", file, index)}
                            data-attachment-swipe-key={getAttachmentSwipeKey(
                              "file",
                              index,
                            )}
                            data-swipe-delete-active={
                              activeAttachmentDeleteKey ===
                              getAttachmentSwipeKey("file", index)
                                ? "true"
                                : undefined
                            }
                            onTouchStart={(event) =>
                              handleAttachmentTouchStart(
                                getAttachmentSwipeKey("file", index),
                                event,
                              )
                            }
                            onTouchMove={(event) =>
                              handleAttachmentTouchMove(
                                getAttachmentSwipeKey("file", index),
                                event,
                              )
                            }
                            onTouchEnd={handleAttachmentTouchEnd}
                            onTouchCancel={handleAttachmentTouchEnd}
                          >
                            <button
                              type="button"
                              className={styles["attach-file"]}
                              aria-label={fileEditContextLabel}
                              onClick={async () => {
                                // 使用与消息编辑相同的showPrompt函数
                                const newContent = await showPrompt(
                                  fileEditContextLabel,
                                  file.content,
                                  20, // 更多行数以便于编辑文件内容
                                  {
                                    ariaLabel:
                                      Locale.Chat.Attachments.EditFileContent(
                                        file.name,
                                      ),
                                  },
                                );

                                if (newContent) {
                                  // 更新文件内容
                                  const updatedFiles = attachedFiles.map(
                                    (f, i) => {
                                      if (i === index) {
                                        // 更新文件大小
                                        const newSize = new Blob([newContent])
                                          .size;
                                        return {
                                          ...f,
                                          content: newContent,
                                          size: newSize,
                                          originalFile: new File(
                                            [newContent],
                                            f.name,
                                            {
                                              type: f.type,
                                            },
                                          ),
                                        };
                                      }
                                      return f;
                                    },
                                  );
                                  setAttachedFiles(updatedFiles);
                                }
                              }}
                            >
                              <div className={styles["attach-file-card"]}>
                                <div
                                  className={clsx(
                                    styles["attach-file-icon"],
                                    getFileIconClass(file.type),
                                  )}
                                >
                                  <FileIcon />
                                </div>
                                <div className={styles["attach-file-info"]}>
                                  <div
                                    className={styles["attach-file-name"]}
                                    title={file.name}
                                  >
                                    {file.name}
                                  </div>
                                  <div className={styles["attach-file-size"]}>
                                    {(file.size / 1024).toFixed(2)} KB
                                  </div>
                                </div>
                              </div>
                            </button>
                            <div className={styles["attach-image-mask"]}>
                              <DeleteImageButton
                                ariaLabel={Locale.Chat.Attachments.DeleteFile(
                                  index + 1,
                                  file.name,
                                )}
                                deleteImage={(e) => {
                                  e.stopPropagation(); // 防止触发文件点击事件
                                  deleteAttachedFile(index);
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {canAddMoreAttachments && (
                        <div
                          className={clsx(
                            styles["attach-item"],
                            styles["attach-add-item"],
                          )}
                          role="listitem"
                        >
                          <button
                            type="button"
                            className={styles["attachment-add-button"]}
                            aria-label={Locale.Chat.Attachments.AddMore}
                            title={Locale.Chat.Attachments.AddMore}
                            disabled={uploading}
                            onClick={() => handleUploadAttachments("all")}
                          >
                            <AddIcon />
                          </button>
                        </div>
                      )}
                      {attachmentSlotsFull && (
                        <div
                          className={clsx(
                            styles["attach-item"],
                            styles["attach-full-item"],
                          )}
                          role="listitem"
                        >
                          <div
                            className={styles["attachment-full-indicator"]}
                            role="status"
                            aria-live="polite"
                            aria-label={Locale.Chat.Attachments.Full}
                            title={Locale.Chat.Attachments.Full}
                          >
                            <AttachmentIcon />
                            <span>{Locale.Chat.Attachments.FullShort}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {showComposerVoice && (
                  <IconButton
                    icon={<HeadphoneIcon />}
                    className={styles["chat-input-voice"]}
                    aria={Locale.Settings.Realtime.Start}
                    ariaExpanded={showChatSidePanel}
                    onClick={() => setShowChatSidePanel(true)}
                  />
                )}

                <IconButton
                  icon={
                    displayedComposerSubmitState === "stop" ? (
                      <ComposerStopIcon />
                    ) : (
                      <SendWhiteIcon />
                    )
                  }
                  className={clsx(styles["chat-input-send"], {
                    [styles["chat-input-send-stop"]]:
                      displayedComposerSubmitState === "stop",
                  })}
                  type="primary"
                  disabled={displayedComposerSubmitState === "disabled"}
                  aria={
                    displayedComposerSubmitState === "stop"
                      ? Locale.Chat.InputActions.Stop
                      : Locale.Chat.Send
                  }
                  onClick={
                    displayedComposerSubmitState === "stop"
                      ? stopComposerResponse
                      : () => doSubmit(userInput)
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className={clsx(styles["chat-side-panel"], {
            [styles["mobile"]]: isCompactScreen,
            [styles["chat-side-panel-show"]]: showChatSidePanel,
          })}
        >
          {ENABLE_REALTIME_CHAT && showChatSidePanel && (
            <RealtimeChat
              onClose={() => {
                setShowChatSidePanel(false);
              }}
              onStartVoice={async () => {
                console.log("start voice");
              }}
            />
          )}
        </div>
      </div>
      {showExport && (
        <ExportMessageModal onClose={() => setShowExport(false)} />
      )}

      {isEditingMessage && (
        <EditMessageModal
          onClose={() => {
            setIsEditingMessage(false);
          }}
        />
      )}

      {showShortcutKeyModal && (
        <ShortcutKeyModal onClose={closeShortcutKeyModal} />
      )}

      {showPromptModal && <SessionConfigModel onClose={closePromptModal} />}

      {showFileEditModal && editingFile && (
        <div className="modal-mask">
          <Modal
            title={Locale.Chat.Attachments.EditFileContent(editingFile.name)}
            onClose={() => setShowFileEditModal(false)}
            actions={[
              <IconButton
                text={Locale.UI.Cancel}
                icon={<CancelIcon />}
                key="cancel"
                onClick={() => {
                  setShowFileEditModal(false);
                }}
              />,
              <IconButton
                type="primary"
                text={Locale.UI.Confirm}
                icon={<ConfirmIcon />}
                key="ok"
                onClick={() => {
                  // 保存编辑后的内容
                  const updatedFiles = attachedFiles.map((file) => {
                    if (file === editingFile) {
                      // 更新文件大小
                      const newSize = new Blob([editingFile.content]).size;
                      return {
                        ...file,
                        size: newSize,
                        originalFile: new File(
                          [editingFile.content],
                          file.name,
                          { type: file.type },
                        ),
                      };
                    }
                    return file;
                  });
                  setAttachedFiles(updatedFiles);
                  setShowFileEditModal(false);
                }}
              />,
            ]}
          >
            <div className={styles["file-edit-scroll"]}>
              <textarea
                aria-label={Locale.Chat.Attachments.EditFileContent(
                  editingFile.name,
                )}
                className={styles["file-edit-textarea"]}
                value={editingFile.content}
                onChange={(e) => {
                  // 更新正在编辑的文件内容
                  setEditingFile({
                    ...editingFile,
                    content: e.target.value,
                  });
                }}
              />
            </div>
          </Modal>
        </div>
      )}

      {previewImage && (
        <dialog
          open
          className={styles["image-preview-mask"]}
          aria-modal="true"
          aria-label={previewImageDialogLabel}
          onCancel={(event) => {
            event.preventDefault();
            closeImagePreview();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeImagePreview();
            }
          }}
        >
          <div className={styles["image-preview-toolbar"]}>
            <button
              type="button"
              className={styles["image-preview-button"]}
              aria-label={previewImageActionLabels.download}
              title={previewImageActionLabels.download}
              onClick={() => downloadImage(previewImage)}
            >
              <DownloadIcon />
            </button>
            <button
              type="button"
              className={styles["image-preview-button"]}
              aria-label={Locale.ImageActions.ClosePreview}
              title={Locale.ImageActions.ClosePreview}
              onClick={closeImagePreview}
            >
              <CancelIcon />
            </button>
          </div>
          <Image
            className={styles["image-preview-image"]}
            src={previewImage}
            alt={previewImageAlt}
            width={1600}
            height={1200}
            unoptimized
            priority
          />
        </dialog>
      )}

      {editingImage && (
        <ImageEditor
          imageUrl={editingImage}
          title={editingImageTitle}
          onClose={() => {
            setEditingImage(null);
            setEditingImageTitle(Locale.ImageEditor.Title);
            editingAttachmentImageIndexRef.current = null;
            editingImageMessageIdRef.current = null; // 清除消息ID
          }}
          onSave={(editedImage) => {
            // 检查是否为附件图片
            if (editingAttachmentImageIndexRef.current != null) {
              const attachmentImageIndex =
                editingAttachmentImageIndexRef.current;
              setAttachImages((currentImages) =>
                replaceAttachmentImageAtIndex(
                  currentImages,
                  attachmentImageIndex,
                  editedImage,
                ),
              );
            }
            // 检查是否为消息中的图片
            else if (editingImageMessageIdRef.current) {
              // 更新消息中的图片
              chatStore.updateTargetSession(session, (session) => {
                // 查找所有消息(包括上下文消息)
                const messages = session.mask.context.concat(session.messages);
                const messageToUpdate = messages.find(
                  (m) => m.id === editingImageMessageIdRef.current,
                );

                if (messageToUpdate) {
                  // 处理两种可能的消息内容格式
                  if (typeof messageToUpdate.content === "string") {
                    // 文本消息内容 - 不应该有图片，但为防止错误进行处理
                    messageToUpdate.content = messageToUpdate.content;
                  } else if (Array.isArray(messageToUpdate.content)) {
                    // 多模态内容 - 找到并替换图片URL
                    messageToUpdate.content = messageToUpdate.content.map(
                      (item) => {
                        if (
                          item.type === "image_url" &&
                          item.image_url &&
                          item.image_url.url === editingImage
                        ) {
                          return {
                            ...item,
                            image_url: {
                              ...item.image_url,
                              url: editedImage,
                            },
                          };
                        }
                        return item;
                      },
                    );
                  }
                }
              });
            }

            setEditingImage(null);
            setEditingImageTitle(Locale.ImageEditor.Title);
            editingAttachmentImageIndexRef.current = null;
            editingImageMessageIdRef.current = null; // 清除消息ID
          }}
        />
      )}
    </div>
  );
}

function ChatInner() {
  return useChatInnerView();
}

export function Chat() {
  const sessionId = useChatStore((state) =>
    state.currentSessionIndex < 0
      ? state.temporarySession?.id
      : state.sessions[state.currentSessionIndex]?.id,
  );
  return <ChatInner key={sessionId}></ChatInner>;
}
