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
import AttachmentIcon from "../icons/attachment.svg";
import ImageIcon from "../icons/image.svg";
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
  autoGrowTextArea,
  useCompactScreen,
  useMobileScreen,
  getMessageTextContent,
  getMessageImages,
  hasMessageContent,
  isVisionModel,
  showPlugins,
  safeLocalStorage,
} from "../utils";
import {
  getImageActionLabels,
  getImagePreviewDialogLabel,
  getImagePreviewAlt,
  getMessageImageLabel,
} from "../utils/image-action-labels";

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
import { ExportMessageModal } from "./exporter";
import { getClientConfig } from "../config/client";
import { useAllModels } from "../utils/hooks";
import { MultimodalContent } from "../client/types";
import {
  applyOpenAIResponsesModelConstraints,
  filterOpenAIResponsesReasoningEfforts,
  getMaxOutputTokensForReasoningEffort,
  clampOpenAIResponsesMaxOutputTokens,
  isOpenAIGpt5OrNewerModelConfig,
  includeCurrentOpenAIResponsesReasoningEffort,
  normalizeOpenAIResponsesReasoningEffort,
  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
  OpenAIChatReasoningEffort,
} from "../utils/openai-responses";
import {
  applyOpenAIImageGenerationDefaults,
  DALLE_IMAGE_COMPATIBLE_SIZES,
  DALLE3_IMAGE_QUALITIES,
  DALLE3_IMAGE_SIZES,
  DALLE3_IMAGE_STYLES,
  GPT_IMAGE_2_QUALITIES,
  GPT_IMAGE_2_SIZES,
  isDalle3,
  isGptImageGenerationModel,
  isOpenAIImageGenerationModelConfig,
} from "../utils/openai-image";

import { ClientApi } from "../client/api";
import { createTTSPlayer } from "../utils/audio";
import { MsEdgeTTS, OUTPUT_FORMAT } from "../utils/ms_edge_tts";

import { isEmpty } from "lodash-es";
import { getModelProvider } from "../utils/model";
import { RealtimeChat } from "@/app/components/realtime-chat";
import clsx from "clsx";
import {
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
  activateMcpClient,
  deactivateMcpClient,
  isMcpEnabled,
} from "../mcp/actions";
import { createConfigFieldMeta } from "../utils/public-app-config";
import {
  createLatestBooleanIntent,
  type BooleanIntent,
} from "../utils/latest-boolean-intent";
import {
  JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT,
  JIMENG_MCP_SERVER_ID,
} from "../mcp/jimeng";
import {
  createVisibleChatMessagesProjector,
  RenderMessage,
  shouldRenderLoadingPreview,
} from "./chat-render";

import { ImageEditor } from "./image-editor";

const localStorage = safeLocalStorage();

const ttsPlayer = createTTSPlayer();
const reasoningLabels: Record<OpenAIChatReasoningEffort, string> = {
  none: Locale.Settings.ReasoningEffort.None,
  low: Locale.Settings.ReasoningEffort.Low,
  medium: Locale.Settings.ReasoningEffort.Medium,
  high: Locale.Settings.ReasoningEffort.High,
  xhigh: Locale.Settings.ReasoningEffort.XHigh,
  max: Locale.Settings.ReasoningEffort.Max,
};
const reasoningDescriptions: Record<OpenAIChatReasoningEffort, string> = {
  none: Locale.Settings.ReasoningEffort.NoneDescription,
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
type MobileModelAdvancedSection = "reasoning" | "image-size" | "image-quality";

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

function isJimengPublicImage(src: string) {
  try {
    const url = new URL(src, window.location.href);
    return (
      url.protocol === "https:" &&
      url.hostname === "123.207.69.230" &&
      url.pathname.startsWith("/jimeng-media/")
    );
  } catch {
    return false;
  }
}

function getDownloadSource(src: string) {
  if (!isJimengPublicImage(src)) {
    return src;
  }

  return `/api/image-download?url=${encodeURIComponent(src)}`;
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
  const downloadSource = getDownloadSource(src);

  try {
    const response = await fetch(downloadSource);
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

function MessageImagePreview(props: {
  src: string;
  alt?: string;
  className: string;
  actionLabels: ReturnType<typeof getImageActionLabels>;
  onPreview: (
    src: string,
    options?: { trigger?: HTMLButtonElement | null; label?: string },
  ) => void;
  onDownload: (src: string) => void | Promise<void>;
}) {
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

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

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
  ariaDescribedBy?: string;
  role?: React.AriaRole;
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
      data-copy-state={props.dataCopyState}
      aria-haspopup={props.ariaHasPopup}
      aria-expanded={props.ariaExpanded}
      aria-pressed={props.ariaPressed}
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
      <div className={styles["text"]} ref={textRef}>
        {props.text}
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
  const scrollDomToBottom = useCallback(() => {
    const dom = scrollRef.current;
    if (dom) {
      requestAnimationFrame(() => {
        setAutoScroll(true);
        dom.scrollTo(0, dom.scrollHeight);
      });
    }
  }, [scrollRef]);

  // auto scroll
  useLayoutEffect(() => {
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

type ChatActionsProps = {
  uploadAttachments: () => void;
  setAttachImages: (images: string[]) => void;
  setUploading: (uploading: boolean) => void;
  showPromptModal: () => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  hitBottom: boolean;
  uploading: boolean;
  attachmentSlotsFull: boolean;
  openShortcutKeyModal: () => void;
  setUserInput: (input: string) => void;
  setShowChatSidePanel: React.Dispatch<React.SetStateAction<boolean>>;
  imageGenerationEnabled: boolean;
  setImageGenerationEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onActionComplete?: () => void;
};

function useChatActionsView(props: ChatActionsProps) {
  const { setAttachImages, setUploading } = props;
  const config = useAppConfig();
  const accessStore = useAccessStore();
  const chatStore = useChatStore();
  const pluginStore = usePluginStore();
  const session = chatStore.currentSession();
  const imageGenerationIntentRef = useRef<
    ReturnType<typeof createLatestBooleanIntent> | undefined
  >(undefined);
  if (!imageGenerationIntentRef.current) {
    imageGenerationIntentRef.current = createLatestBooleanIntent(
      props.imageGenerationEnabled,
    );
  }
  const imageGenerationIntent = imageGenerationIntentRef.current;
  const imageGenerationOperationRef = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    imageGenerationIntent.syncCommitted(props.imageGenerationEnabled);
  }, [imageGenerationIntent, props.imageGenerationEnabled]);

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
  const isGptImageModel = isGptImageGenerationModel(currentModel);
  const isDalle3Model = isDalle3(currentModel);
  const imageSizes = isGptImageModel
    ? GPT_IMAGE_2_SIZES
    : isDalle3Model
    ? DALLE3_IMAGE_SIZES
    : DALLE_IMAGE_COMPATIBLE_SIZES;
  const imageQualitys = isGptImageModel
    ? GPT_IMAGE_2_QUALITIES
    : isDalle3Model
    ? DALLE3_IMAGE_QUALITIES
    : [];
  const dalle3Styles = DALLE3_IMAGE_STYLES;
  const currentSize = session.mask.modelConfig?.size ?? "1024x1024";
  const currentQuality = session.mask.modelConfig?.quality ?? "standard";
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
  const setImageGenerationMode = async (intent: BooleanIntent) => {
    const isCurrentIntent = () => imageGenerationIntent.isCurrent(intent.token);
    const settleFailedIntent = () => {
      if (!imageGenerationIntent.settle(intent.token, false)) return false;
      props.setImageGenerationEnabled(imageGenerationIntent.value());
      return true;
    };
    if (!isCurrentIntent()) return false;

    if (intent.value) {
      let mcpEnabled = false;
      try {
        mcpEnabled = await isMcpEnabled();
      } catch (error) {
        if (!settleFailedIntent()) return false;
        console.warn("[MCP] Failed to check MCP status", error);
        showToast(Locale.Chat.ImageGeneration.NotEnabled);
        return false;
      }

      if (!isCurrentIntent()) return false;
      if (!mcpEnabled) {
        if (!settleFailedIntent()) return false;
        showToast(Locale.Chat.ImageGeneration.NotEnabled);
        return false;
      }

      try {
        await activateMcpClient(JIMENG_MCP_SERVER_ID);
      } catch (error) {
        if (!settleFailedIntent()) return false;
        showToast(
          error instanceof Error
            ? error.message
            : Locale.Chat.ImageGeneration.EnableFailed,
        );
        return false;
      }
    } else {
      try {
        await deactivateMcpClient(JIMENG_MCP_SERVER_ID);
      } catch (error) {
        if (!settleFailedIntent()) return false;
        console.warn("[MCP] Failed to deactivate Jimeng MCP", error);
        showToast(
          error instanceof Error
            ? error.message
            : Locale.Chat.ImageGeneration.DisableFailed,
        );
        return false;
      }
    }

    imageGenerationIntent.markApplied(intent.value);
    chatStore.resetMcpCache();
    if (!isCurrentIntent()) return false;
    if (!imageGenerationIntent.settle(intent.token, true)) return false;

    props.setImageGenerationEnabled(intent.value);
    showToast(
      intent.value
        ? Locale.Chat.ImageGeneration.Enabled
        : Locale.Chat.ImageGeneration.Disabled,
    );
    return true;
  };
  const reconcileImageGenerationIntent = (intent: BooleanIntent) => {
    const operation = imageGenerationOperationRef.current
      .catch(() => undefined)
      .then(() => setImageGenerationMode(intent));
    imageGenerationOperationRef.current = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  };
  const hasSessionActions =
    couldStop ||
    !props.hitBottom ||
    (config.enableClearContext && hasClearableContext);

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
                props.attachmentSlotsFull &&
                  styles["chat-multimodal-section-meta-warning"],
              )}
              aria-live="polite"
            >
              {props.attachmentSlotsFull
                ? Locale.Chat.ChatToolMenu.Full
                : Locale.Chat.ChatToolMenu.Capacity}
            </span>
          </div>
          <ChatAction
            onClick={() => {
              if (props.attachmentSlotsFull) return;
              props.uploadAttachments();
              completeMobileAction();
            }}
            text={Locale.Chat.ChatToolMenu.UploadAttachment}
            icon={props.uploading ? <LoadingButtonIcon /> : <AttachmentIcon />}
            ariaDescribedBy="chat-multimodal-upload-state"
            disabled={props.attachmentSlotsFull}
            title={
              props.attachmentSlotsFull
                ? Locale.Chat.ChatToolMenu.AttachmentFull
                : undefined
            }
          />

          <ChatAction
            active={props.imageGenerationEnabled}
            ariaPressed={props.imageGenerationEnabled}
            onClick={async () => {
              const intent = imageGenerationIntent.next();
              if (await reconcileImageGenerationIntent(intent)) {
                completeMobileAction();
              }
            }}
            text={
              props.imageGenerationEnabled
                ? Locale.Chat.ChatToolMenu.DisableImageGeneration
                : Locale.Chat.ChatToolMenu.ImageGeneration
            }
            icon={<ImageIcon />}
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
    isOpenAIGpt5OrNewerModelConfig({
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
        aria-haspopup="listbox"
        aria-expanded={showReasoningSelectorModal}
      >
        <BrainIcon />
        <span>{reasoningLabels[currentReasoningEffort]}</span>
        <span className={styles["chat-input-reasoning-arrow"]}>⌄</span>
      </button>
      {showReasoningSelectorModal && (
        <Selector
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
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
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
  const unfinishedInputKey = UNFINISHED_INPUT(session.id);
  const [userInput, setUserInput] = useState(
    () => localStorage.getItem(unfinishedInputKey) ?? "",
  );
  const [isLoading, setIsLoading] = useReducer(
    (_: boolean, next: boolean) => next,
    false,
  );
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const scrollRef = useRef<HTMLDivElement>(null);
  const readingSurfaceRef = useRef<HTMLDivElement>(null);
  const [hitBottom, setHitBottom] = useState(true);
  const attachWithTopRef = useRef(false);
  const isTyping = userInput !== "";

  // if user is typing, should auto scroll to bottom
  // if user is not typing, should auto scroll to bottom only if already at bottom
  const lastSessionMessage = session.messages.at(-1);
  const messageScrollSignal = `${session.messages.length}:${
    lastSessionMessage?.id ?? ""
  }:${
    lastSessionMessage ? getMessageTextContent(lastSessionMessage).length : 0
  }:${lastSessionMessage?.streaming ? 1 : 0}`;
  const shouldFollowLatestMessage =
    hitBottom || attachWithTopRef.current || isTyping;
  const { autoScroll, setAutoScroll, scrollDomToBottom } = useScrollToBottom(
    scrollRef,
    shouldFollowLatestMessage,
    messageScrollSignal,
  );
  const isMobileScreen = useMobileScreen();
  const isCompactScreen = useCompactScreen();
  const syncHitBottomState = useCallback(
    (e: HTMLElement, syncAutoScroll = false) => {
      const bottomHeight = e.scrollTop + e.clientHeight;
      const isHitBottom =
        bottomHeight >= e.scrollHeight - (isMobileScreen ? 4 : 10);
      const lastMessage = readingSurfaceRef.current
        ?.lastElementChild as HTMLElement | null;
      attachWithTopRef.current = lastMessage
        ? lastMessage.offsetTop - e.scrollTop < 100
        : false;

      setHitBottom(isHitBottom);
      if (syncAutoScroll) {
        setAutoScroll(isHitBottom);
      }

      return { bottomHeight, isHitBottom };
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
  const [uploadingFile, setUploadingFile] = useState(false);
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
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dragPayloadSummary, setDragPayloadSummary] =
    useState<DraggedAttachmentSummary | null>(null);
  const dragCounter = useRef(0);
  const dropzonePreviewSummary = markdownStressQaDropzonePreview
    ? chatQaFixture?.MARKDOWN_STRESS_QA_DROPZONE_PREVIEW_SUMMARIES[
        markdownStressQaDropzonePreview
      ]
    : null;
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
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [showChatActionMenu, setShowChatActionMenu] = useState(false);
  const ignoreInputCollapseUntil = useRef(0);

  useEffect(() => {
    if (!markdownStressQaAttachmentStripPreview || !chatQaFixture) return;

    const seededAttachments =
      chatQaFixture.createMarkdownStressQaAttachmentStripPreview(
        markdownStressQaAttachmentStripPreview,
      );
    setAttachImages(seededAttachments.images);
    setAttachedFiles(seededAttachments.files);
    setIsInputExpanded(true);
  }, [chatQaFixture, markdownStressQaAttachmentStripPreview]);

  const hasActiveInputContent =
    userInput.trim().length > 0 ||
    attachImages.length > 0 ||
    attachedFiles.length > 0 ||
    imageGenerationEnabled ||
    promptHints.length > 0;
  const canSubmitComposer =
    !markdownStressQaEnabled &&
    (userInput.trim().length > 0 ||
      attachImages.length > 0 ||
      attachedFiles.length > 0);
  const canAddMoreAttachments =
    attachImages.length < 3 || attachedFiles.length < 5;
  const attachmentSlotsFull =
    attachImages.length >= 3 && attachedFiles.length >= 5;
  const shouldExpandChatInput = isInputExpanded || hasActiveInputContent;
  const expandInput = useCallback(() => {
    ignoreInputCollapseUntil.current = Date.now() + 350;
    setIsInputExpanded(true);
  }, []);
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

  // auto grow input
  const [inputRows, setInputRows] = useState(2);
  const measure = useDebouncedCallback(
    () => {
      const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
      const inputRows = Math.min(
        20,
        Math.max(2 + Number(!isCompactScreen), rows),
      );
      setInputRows(inputRows);
    },
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  useEffect(measure, [measure, userInput]);

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
    if (markdownStressQaEnabled) {
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
      .onUserInput(
        finalUserInput,
        attachImages,
        false,
        imageGenerationEnabled
          ? {
              mcpClientIds: [JIMENG_MCP_SERVER_ID],
              systemPrompt: JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT,
            }
          : undefined,
      )
      .then(() => setIsLoading(false));

    setAttachImages([]);
    setAttachedFiles([]); // 清除附加文件
    chatStore.setLastInput(finalUserInput);
    setUserInput("");
    setPromptHints([]);
    if (isCompactScreen) {
      setIsInputExpanded(false);
    } else {
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
      }
    });
  }, [updateTargetSession, config.modelConfig, session]);

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
    chatStore.updateTargetSession(session, (session) =>
      session.mask.context.push(message),
    );

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
    useState<MobileModelAdvancedSection | null>(null);
  const [composerModelMenuStyle, setComposerModelMenuStyle] =
    useState<React.CSSProperties | undefined>(undefined);
  const modelSelectorButtonRef = useRef<HTMLButtonElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuFocusFrameRef = useRef<number | null>(null);
  const getComposerModelMenuStyle = (button: HTMLButtonElement) => {
    const viewportPadding = 16;
    const menuWidth = Math.min(380, window.innerWidth - viewportPadding * 2);
    const buttonRect = button.getBoundingClientRect();
    const left = Math.max(
      viewportPadding,
      Math.min(
        buttonRect.right - menuWidth,
        window.innerWidth - menuWidth - viewportPadding,
      ),
    );
    const belowTop = buttonRect.bottom + 10;
    const belowSpace = window.innerHeight - belowTop - viewportPadding;
    const aboveSpace = buttonRect.top - 10 - viewportPadding;
    const openBelow = belowSpace >= 260 || belowSpace >= aboveSpace;
    const availableHeight = Math.max(
      0,
      Math.min(
        420,
        openBelow ? belowSpace : aboveSpace,
        window.innerHeight - viewportPadding * 2,
      ),
    );

    return {
      "--chat-model-menu-composer-left": `${left}px`,
      "--chat-model-menu-composer-top": openBelow ? `${belowTop}px` : "auto",
      "--chat-model-menu-composer-bottom": openBelow
        ? "auto"
        : `${window.innerHeight - buttonRect.top + 10}px`,
      "--chat-model-menu-composer-width": `${menuWidth}px`,
      "--chat-model-menu-composer-max-height": `${availableHeight}px`,
      "--chat-model-menu-composer-origin": openBelow
        ? "top right"
        : "bottom right",
      "--chat-model-menu-composer-shift": openBelow ? "8px" : "-8px",
    } as React.CSSProperties;
  };
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
    return Array.from(
      modelMenuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="option"], button[aria-controls]',
      ) ?? [],
    ).filter((control) => !control.disabled && control.offsetParent !== null);
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
      (control) => control.getAttribute("aria-selected") === "true",
    );
    const nextControl = selectedControl ?? controls[0];
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
    if (modelMenuFocusFrameRef.current !== null) {
      cancelAnimationFrame(modelMenuFocusFrameRef.current);
      modelMenuFocusFrameRef.current = null;
    }
    if (!showMobileModelSelector) return;

    modelMenuFocusFrameRef.current = requestAnimationFrame(() => {
      modelMenuFocusFrameRef.current = requestAnimationFrame(() => {
        modelMenuFocusFrameRef.current = null;
        focusInitialModelMenuControl();
      });
    });

    return () => {
      if (modelMenuFocusFrameRef.current !== null) {
        cancelAnimationFrame(modelMenuFocusFrameRef.current);
        modelMenuFocusFrameRef.current = null;
      }
    };
  }, [focusInitialModelMenuControl, showMobileModelSelector]);
  useEffect(() => {
    if (!showMobileModelSelector) return;

    const closeModelSelectorOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileModelSelector();
        restoreModelSelectorFocus();
      }
    };

    window.addEventListener("keydown", closeModelSelectorOnEscape);
    return () =>
      window.removeEventListener("keydown", closeModelSelectorOnEscape);
  }, [
    closeMobileModelSelector,
    restoreModelSelectorFocus,
    showMobileModelSelector,
  ]);
  const toggleMobileModelSection = (section: MobileModelAdvancedSection) => {
    setExpandedMobileModelSection((currentSection) =>
      currentSection === section ? null : section,
    );
  };
  const headerCurrentModel = session.mask.modelConfig.model;
  const headerCurrentProviderName =
    session.mask.modelConfig?.providerName || ServiceProvider.OpenAI;
  const headerModelLocked =
    accessStore.lockedFields?.includes("model") ||
    accessStore.lockedFields?.includes("providerName");
  const allHeaderModels = useAllModels();
  const headerAvailableModels = useMemo(
    () => allHeaderModels.filter((model) => model.available),
    [allHeaderModels],
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
  const headerReasoningEfforts = filterOpenAIResponsesReasoningEfforts(
    headerCurrentModel,
    accessStore.serverConfigSnapshot?.reasoningEffortAllowlist,
  );
  const visibleHeaderReasoningEfforts =
    includeCurrentOpenAIResponsesReasoningEffort(
      headerReasoningEfforts,
      headerCurrentReasoningEffort,
    );
  const headerReasoningLocked =
    accessStore.lockedFields?.includes("reasoningEffort") ||
    session.mask.modelConfigMeta?.reasoningEffort?.locked;
  const showHeaderReasoningControl =
    visibleHeaderReasoningEfforts.length > 0 &&
    isOpenAIGpt5OrNewerModelConfig({
      model: headerCurrentModel,
      providerName: headerCurrentProviderName,
    });
  const showHeaderImageControls = isOpenAIImageGenerationModelConfig({
    model: headerCurrentModel,
    providerName: headerCurrentProviderName,
  });
  const headerIsGptImageModel = isGptImageGenerationModel(headerCurrentModel);
  const headerIsDalle3Model = isDalle3(headerCurrentModel);
  const headerImageSizes = headerIsGptImageModel
    ? GPT_IMAGE_2_SIZES
    : headerIsDalle3Model
    ? DALLE3_IMAGE_SIZES
    : DALLE_IMAGE_COMPATIBLE_SIZES;
  const headerImageQualitys = headerIsGptImageModel
    ? GPT_IMAGE_2_QUALITIES
    : headerIsDalle3Model
    ? DALLE3_IMAGE_QUALITIES
    : [];
  const headerCurrentSize =
    session.mask.modelConfig?.size ?? ("1024x1024" as OpenAIImageSize);
  const headerCurrentQuality =
    session.mask.modelConfig?.quality ?? ("standard" as OpenAIImageQuality);
  const currentModelDetail = showHeaderImageControls
    ? `${headerCurrentSize} · ${getImageQualityLabel(headerCurrentQuality)}`
    : showHeaderReasoningControl
    ? reasoningLabels[headerCurrentReasoningEffort]
    : headerCurrentProviderName;
  const isReasoningSectionExpanded = expandedMobileModelSection === "reasoning";
  const isImageSizeSectionExpanded =
    expandedMobileModelSection === "image-size";
  const isImageQualitySectionExpanded =
    expandedMobileModelSection === "image-quality";
  const getHeaderReasoningMaxOutputTokens = (
    effort: OpenAIChatReasoningEffort,
  ) =>
    clampOpenAIResponsesMaxOutputTokens(
      accessStore.openaiMaxOutputTokens ??
        getMaxOutputTokensForReasoningEffort(effort),
      headerCurrentModel,
    );
  const selectHeaderModel = (selected: string) => {
    if (headerModelLocked) {
      showToast(Locale.Settings.GPT56Capabilities.ConfigSource.Locked);
      return;
    }
    const [model, providerName] = getModelProvider(selected);
    chatStore.updateTargetSession(session, (session) => {
      session.mask.modelConfig.model = model as ModelType;
      session.mask.modelConfig.providerName = providerName as ServiceProvider;
      applyOpenAIResponsesModelConstraints(session.mask.modelConfig);
      applyOpenAIImageGenerationDefaults(session.mask.modelConfig);
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
      if (model !== "gemini-2.0-flash-exp") {
        session.mask.plugin = [];
      }
    });
    closeMobileModelSelector();
    restoreModelSelectorFocus();
    showToast(model);
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
      var api: ClientApi;
      api = new ClientApi(ModelProvider.GPT);
      const config = useAppConfig.getState();
      ttsPlayer.init();
      let audioBuffer: ArrayBuffer;
      const { markdownToTxt } = require("markdown-to-txt");
      const textContent = markdownToTxt(text);
      if (config.ttsConfig.engine !== DEFAULT_TTS_ENGINE) {
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

  // preview messages
  const renderMessages = useMemo(() => {
    if (markdownStressQaEnabled && chatQaFixture) {
      return chatQaFixture.getMarkdownStressQaMessages(location.search);
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
        userInput.length > 0 && config.sendPreviewBubble
          ? [
              {
                ...createMessage({
                  role: "user",
                  content: userInput,
                }),
                preview: true,
              },
            ]
          : [],
      );
  }, [
    chatQaFixture,
    config.sendPreviewBubble,
    context,
    isLoading,
    location.search,
    markdownStressQaEnabled,
    chatStore.messageProjectionRevision,
    projectVisibleChatMessages,
    session.messages,
    userInput,
  ]);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(() =>
    Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  );
  const setMsgRenderIndex = useCallback(
    (newIndex: number) => {
      newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
      newIndex = Math.max(0, newIndex);
      _setMsgRenderIndex(newIndex);
    },
    [renderMessages.length],
  );

  const messages = useMemo(() => {
    const startRenderIndex = markdownStressQaEnabled ? 0 : msgRenderIndex;
    const endRenderIndex = Math.min(
      startRenderIndex + 3 * CHAT_PAGE_SIZE,
      renderMessages.length,
    );
    return renderMessages.slice(startRenderIndex, endRenderIndex);
  }, [markdownStressQaEnabled, msgRenderIndex, renderMessages]);
  const showEmptyState =
    !markdownStressQaEnabled &&
    session.messages.length === 0 &&
    context.length === 1 &&
    getMessageTextContent(context[0]) === BOT_HELLO.content &&
    !isLoading;
  const showEmptyComposer = showEmptyState && !hasActiveInputContent;
  const showEmptyHero =
    showEmptyState && !hasActiveInputContent && !showChatActionMenu;
  const showDesktopChatHeader = !isCompactScreen && !showEmptyState;
  const applyEmptySuggestion = useCallback(
    (suggestion: string) => {
      setShowChatActionMenu(false);
      setPromptHints([]);
      expandInput();
      setUserInput(suggestion);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    },
    [expandInput],
  );

  const onChatBodyScroll = (e: HTMLElement) => {
    const { bottomHeight } = syncHitBottomState(e, true);
    const edgeThreshold = e.clientHeight;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    if (isTouchTopEdge && !isTouchBottomEdge) {
      setMsgRenderIndex(prevPageMsgIndex);
    } else if (isTouchBottomEdge) {
      setMsgRenderIndex(nextPageMsgIndex);
    }

    if (
      isCompactScreen &&
      !hasActiveInputContent &&
      Date.now() > ignoreInputCollapseUntil.current
    ) {
      inputRef.current?.blur();
      setIsInputExpanded(false);
    }
  };
  const scrollToBottom = useCallback(() => {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }, [renderMessages.length, scrollDomToBottom, setMsgRenderIndex]);
  const clearContextDividerRef = useRef<HTMLButtonElement>(null);
  const chatInputPanelRef = useRef<HTMLDivElement>(null);
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

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncChatBodyBottomSafeArea);
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
  const clearContextIndex =
    (session.clearContextIndex ?? -1) >= 0
      ? session.clearContextIndex! + context.length - msgRenderIndex
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
    if (markdownStressQaEnabled) {
      return;
    }

    const dom = inputRef.current;
    return () => {
      localStorage.setItem(unfinishedInputKey, dom?.value ?? "");
    };
  }, [markdownStressQaEnabled, unfinishedInputKey]);

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
  async function handleUploadAttachments() {
    if (attachmentSlotsFull) {
      showToast(Locale.Chat.Attachments.Full);
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
          chatStore.newSession();
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
        let lastNonUserMessage: ChatMessage | undefined;
        let lastNonUserMessageIndex = -1;
        for (
          let messageIndex = messages.length - 1;
          messageIndex >= 0;
          messageIndex -= 1
        ) {
          const candidateMessage = messages[messageIndex];
          if (candidateMessage.role !== "user") {
            lastNonUserMessage = candidateMessage;
            lastNonUserMessageIndex = messageIndex;
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
  }, [
    messages,
    chatStore,
    navigate,
    openShortcutKeyModal,
    copyMessageContent,
    getMessageActionId,
  ]);

  const [showChatSidePanel, setShowChatSidePanel] = useState(false);

  // 添加触摸滑动相关的状态
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const ignoreChatSwipeRef = useRef(false);
  const isAttachmentStripTouch = (target: EventTarget | null) => {
    const touchTarget =
      target instanceof Element
        ? target
        : target instanceof Node
        ? target.parentElement
        : null;

    return Boolean(
      touchTarget?.closest('[data-composer-attachment-strip="true"]'),
    );
  };

  // 处理触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAttachmentStripTouch(e.target)) {
      ignoreChatSwipeRef.current = true;
      touchStartXRef.current = 0;
      touchEndXRef.current = 0;
      return;
    }

    ignoreChatSwipeRef.current = false;
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (ignoreChatSwipeRef.current) {
      return;
    }

    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (ignoreChatSwipeRef.current) {
      ignoreChatSwipeRef.current = false;
      touchStartXRef.current = 0;
      touchEndXRef.current = 0;
      return;
    }

    if (!isCompactScreen) return;

    const swipeDistance = touchEndXRef.current - touchStartXRef.current;
    const minSwipeDistance = 100; // 最小滑动距离

    // 向右滑动且距离足够
    if (swipeDistance > minSwipeDistance) {
      navigate(Path.Home);
    }

    // 重置触摸状态
    touchStartXRef.current = 0;
    touchEndXRef.current = 0;
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
  const chatInputMenuButtonRef = useRef<HTMLButtonElement>(null);
  const chatInputActionMenuRef = useRef<HTMLDivElement>(null);

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
      chatInputActionMenuRef.current?.querySelectorAll<HTMLButtonElement>(
        `button.${styles["chat-input-action"]}`,
      ) ?? [],
    ).filter(
      (control) =>
        !control.disabled &&
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
      if (
        activeElement instanceof HTMLButtonElement &&
        activeElement.classList.contains(styles["chat-input-action"]) &&
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
  }, [focusChatActionMenuControl, showChatActionMenu]);
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
        setShowChatActionMenu(false);
        requestAnimationFrame(() => chatInputMenuButtonRef.current?.focus());
      }
    };

    window.addEventListener("keydown", closeChatActionMenuOnEscape);
    return () =>
      window.removeEventListener("keydown", closeChatActionMenuOnEscape);
  }, [showChatActionMenu]);

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
  const showInputStatusRow = showInputReasoningAction || imageGenerationEnabled;
  const isMobileSidebarOpen = location.pathname === Path.Home;
  const promptToast = (
    <PromptToast
      showToast={!hitBottom}
      showModal={showPromptModal}
      contextLength={context.length}
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
            icon={
              <span className={styles["chat-mobile-context-icon"]}>
                <SettingsIcon />
                {context.length > 0 && (
                  <span
                    className={styles["chat-mobile-context-count"]}
                    aria-hidden="true"
                  >
                    {context.length > 99 ? "99+" : context.length}
                  </span>
                )}
              </span>
            }
            bordered
            title={
              context.length > 0
                ? Locale.Context.SettingsWithPrompts(context.length)
                : Locale.Chat.InputActions.Settings
            }
            aria={
              context.length > 0
                ? Locale.Context.SettingsWithPrompts(context.length)
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
                          (config) =>
                            (config.tightBorder = !config.tightBorder),
                        );
                      }}
                    />
                  </div>
                )}
            </div>
          </div>
        </div>
      ) : null}

      {/*
        We always render the model menu in the DOM to support smooth CSS exit transitions.
        We toggle its visibility via class name instead of: showMobileModelSelector && (
      */}
      <button
        type="button"
        className={clsx(
          isCompactScreen
            ? styles["chat-mobile-model-menu-backdrop"]
            : styles["chat-desktop-model-menu-backdrop"],
          {
            [styles["chat-model-menu-visible"]]: showMobileModelSelector,
          },
        )}
        aria-label={Locale.Chat.ModelMenu.Close}
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
          {
            [styles["chat-model-menu-visible"]]: showMobileModelSelector,
            [styles["chat-desktop-model-menu-composer"]]: !isCompactScreen,
          },
        )}
        style={!isCompactScreen ? composerModelMenuStyle : undefined}
        onKeyDown={handleModelMenuKeyDown}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={Locale.Chat.ModelMenu.ModelAndReasoning}
      >
        <div
          className={styles["chat-mobile-model-list"]}
          role="listbox"
          aria-label={Locale.Chat.ModelMenu.AvailableModels}
        >
          {headerAvailableModels.length === 0 ? (
            <div className={styles["chat-mobile-model-empty"]}>
              {Locale.Chat.ModelMenu.Empty}
            </div>
          ) : (
            headerAvailableModels.map((model) => {
              const providerName = model?.provider?.providerName;
              const selected =
                model.name === headerCurrentModel &&
                providerName === headerCurrentProviderName;
              return (
                <button
                  type="button"
                  key={`${model.name}@${providerName}`}
                  className={clsx(styles["chat-mobile-model-option"], {
                    [styles["chat-mobile-model-option-selected"]]: selected,
                  })}
                  role="option"
                  aria-selected={selected}
                  onClick={() =>
                    selectHeaderModel(`${model.name}@${providerName}`)
                  }
                >
                  <span className={styles["chat-mobile-menu-check"]}>
                    {selected ? "✓" : ""}
                  </span>
                  <span className={styles["chat-mobile-model-copy"]}>
                    <span className={styles["chat-mobile-model-name"]}>
                      {model.displayName || model.name}
                    </span>
                    {providerName && (
                      <span className={styles["chat-mobile-model-provider"]}>
                        {providerName}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {(showHeaderReasoningControl || showHeaderImageControls) && (
          <>
            <div className={styles["chat-mobile-model-divider"]} />
            {showHeaderReasoningControl && (
              <div className={styles["chat-mobile-model-section"]}>
                <button
                  type="button"
                  className={styles["chat-mobile-reasoning-head"]}
                  aria-expanded={isReasoningSectionExpanded}
                  aria-controls="chat-mobile-reasoning-options"
                  onClick={() => toggleMobileModelSection("reasoning")}
                >
                  <span>
                    <strong>{Locale.Chat.ModelMenu.ReasoningEffort}</strong>
                    <small>
                      {reasoningLabels[headerCurrentReasoningEffort]}
                    </small>
                  </span>
                  <span className={styles["chat-mobile-reasoning-caret"]}>
                    {isReasoningSectionExpanded ? "⌃" : "⌄"}
                  </span>
                </button>
                {isReasoningSectionExpanded && (
                  <div
                    id="chat-mobile-reasoning-options"
                    className={styles["chat-mobile-reasoning-list"]}
                    role="listbox"
                    aria-label={Locale.Chat.ModelMenu.ReasoningOptions}
                  >
                    {visibleHeaderReasoningEfforts.map((effort) => {
                      const selected = effort === headerCurrentReasoningEffort;
                      const disabled = !headerReasoningEfforts.some(
                        (allowedEffort) => allowedEffort === effort,
                      );
                      return (
                        <button
                          type="button"
                          key={effort}
                          className={clsx(
                            styles["chat-mobile-reasoning-option"],
                            {
                              [styles["chat-mobile-reasoning-option-selected"]]:
                                selected,
                            },
                          )}
                          role="option"
                          aria-selected={selected}
                          aria-disabled={disabled}
                          disabled={disabled}
                          onClick={() => selectHeaderReasoningEffort(effort)}
                        >
                          <span className={styles["chat-mobile-menu-check"]}>
                            {selected ? "✓" : ""}
                          </span>
                          <span className={styles["chat-mobile-model-copy"]}>
                            <span className={styles["chat-mobile-model-name"]}>
                              {reasoningLabels[effort]}
                            </span>
                            <span
                              className={styles["chat-mobile-model-provider"]}
                            >
                              {reasoningDescriptions[effort]}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {showHeaderImageControls && (
              <>
                <div className={styles["chat-mobile-model-section"]}>
                  <button
                    type="button"
                    className={styles["chat-mobile-reasoning-head"]}
                    aria-expanded={isImageSizeSectionExpanded}
                    aria-controls="chat-mobile-image-size-options"
                    onClick={() => toggleMobileModelSection("image-size")}
                  >
                    <span>
                      <strong>{Locale.Chat.ModelMenu.ImageSize}</strong>
                      <small>{headerCurrentSize}</small>
                    </span>
                    <span className={styles["chat-mobile-reasoning-caret"]}>
                      {isImageSizeSectionExpanded ? "⌃" : "⌄"}
                    </span>
                  </button>
                  {isImageSizeSectionExpanded && (
                    <div
                      id="chat-mobile-image-size-options"
                      className={styles["chat-mobile-reasoning-list"]}
                      role="listbox"
                      aria-label={Locale.Chat.ModelMenu.ImageSizeOptions}
                    >
                      {headerImageSizes.map((size) => {
                        const selected = size === headerCurrentSize;
                        return (
                          <button
                            type="button"
                            key={size}
                            className={clsx(
                              styles["chat-mobile-reasoning-option"],
                              {
                                [styles[
                                  "chat-mobile-reasoning-option-selected"
                                ]]: selected,
                              },
                            )}
                            role="option"
                            aria-selected={selected}
                            onClick={() =>
                              selectHeaderImageSize(size as OpenAIImageSize)
                            }
                          >
                            <span className={styles["chat-mobile-menu-check"]}>
                              {selected ? "✓" : ""}
                            </span>
                            <span className={styles["chat-mobile-model-copy"]}>
                              <span
                                className={styles["chat-mobile-model-name"]}
                              >
                                {size}
                              </span>
                              <span
                                className={styles["chat-mobile-model-provider"]}
                              >
                                {Locale.Chat.ModelMenu.GeneratedImageSize}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {headerImageQualitys.length > 0 && (
                  <div className={styles["chat-mobile-model-section"]}>
                    <button
                      type="button"
                      className={styles["chat-mobile-reasoning-head"]}
                      aria-expanded={isImageQualitySectionExpanded}
                      aria-controls="chat-mobile-image-quality-options"
                      onClick={() => toggleMobileModelSection("image-quality")}
                    >
                      <span>
                        <strong>{Locale.Chat.ModelMenu.ImageQuality}</strong>
                        <small>
                          {getImageQualityLabel(headerCurrentQuality)}
                        </small>
                      </span>
                      <span className={styles["chat-mobile-reasoning-caret"]}>
                        {isImageQualitySectionExpanded ? "⌃" : "⌄"}
                      </span>
                    </button>
                    {isImageQualitySectionExpanded && (
                      <div
                        id="chat-mobile-image-quality-options"
                        className={styles["chat-mobile-reasoning-list"]}
                        role="listbox"
                        aria-label={Locale.Chat.ModelMenu.ImageQualityOptions}
                      >
                        {headerImageQualitys.map((quality) => {
                          const selected = quality === headerCurrentQuality;
                          return (
                            <button
                              type="button"
                              key={quality}
                              className={clsx(
                                styles["chat-mobile-reasoning-option"],
                                {
                                  [styles[
                                    "chat-mobile-reasoning-option-selected"
                                  ]]: selected,
                                },
                              )}
                              role="option"
                              aria-selected={selected}
                              onClick={() =>
                                selectHeaderImageQuality(
                                  quality as OpenAIImageQuality,
                                )
                              }
                            >
                              <span
                                className={styles["chat-mobile-menu-check"]}
                              >
                                {selected ? "✓" : ""}
                              </span>
                              <span
                                className={styles["chat-mobile-model-copy"]}
                              >
                                <span
                                  className={styles["chat-mobile-model-name"]}
                                >
                                  {getImageQualityLabel(
                                    quality as OpenAIImageQuality,
                                  )}
                                </span>
                                <span
                                  className={
                                    styles["chat-mobile-model-provider"]
                                  }
                                >
                                  {quality}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

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
          >
            {showEmptyHero && (
              <div className={styles["chat-empty-state"]}>
                <div className={clsx(styles["chat-empty-logo"], "no-dark")}>
                  <NeatIcon />
                </div>
                <h1 className={styles["chat-empty-title"]}>
                  {Locale.Chat.EmptyTitle}
                </h1>
                <ul
                  className={styles["chat-empty-suggestions"]}
                  aria-label={Locale.Chat.Accessibility.SuggestedQuestions}
                >
                  {Locale.Chat.EmptySuggestions.map((suggestion) => (
                    <li
                      key={suggestion}
                      className={styles["chat-empty-suggestion-item"]}
                    >
                      <button
                        type="button"
                        className={styles["chat-empty-suggestion"]}
                        onClick={() => applyEmptySuggestion(suggestion)}
                      >
                        <div className={styles["chat-empty-suggestion-header"]}>
                          <span
                            className={styles["chat-empty-suggestion-title"]}
                          >
                            {Locale.Chat.EmptySuggestionTitles[
                              Locale.Chat.EmptySuggestions.indexOf(suggestion)
                            ] || suggestion}
                          </span>
                          <span
                            className={styles["chat-empty-suggestion-text"]}
                          >
                            {suggestion}
                          </span>
                        </div>
                        <div className={styles["chat-empty-suggestion-footer"]}>
                          <div
                            className={
                              styles["chat-empty-suggestion-icon-wrapper"]
                            }
                          >
                            {(() => {
                              const idx =
                                Locale.Chat.EmptySuggestions.indexOf(
                                  suggestion,
                                );
                              const icons = [
                                FileIcon,
                                AutoIcon,
                                StyleIcon,
                                BrainIcon,
                              ];
                              const IconComponent = icons[idx] || FileIcon;
                              return <IconComponent />;
                            })()}
                          </div>
                          <span
                            className={
                              styles["chat-empty-suggestion-affordance"]
                            }
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
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
                const isUser = message.role === "user";
                const isContext = i < context.length;
                const qaMessageIdPrefix =
                  chatQaFixture?.MARKDOWN_STRESS_QA_MESSAGE_ID_PREFIX;
                const isMarkdownStressQaMessage =
                  qaMessageIdPrefix != null &&
                  message.id.startsWith(qaMessageIdPrefix);
                const showActions =
                  i > 0 &&
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
                  i === clearContextIndex - 1;
                const messageLabel = isUser
                  ? Locale.Chat.Accessibility.UserMessage(i + 1)
                  : Locale.Chat.Accessibility.AssistantMessage(i + 1);
                const messageActionLabel =
                  Locale.Chat.Accessibility.MessageActions(messageLabel);
                const messageActionId = getMessageActionId(message, i);
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
                const messageImages = getMessageImages(message);
                const singleMessageImageLabel = getMessageImageLabel(0, 1);

                return (
                  <Fragment key={message.id}>
                    <div
                      className={clsx(
                        styles["chat-message-row"],
                        isUser
                          ? styles["chat-message-row-user"]
                          : styles["chat-message-row-assistant"],
                        isUser
                          ? styles["chat-message-user"]
                          : styles["chat-message"],
                      )}
                      role="listitem"
                      aria-label={messageLabel}
                      aria-busy={showTyping ? true : undefined}
                      data-testid={
                        isMarkdownStressQaMessage
                          ? "markdown-stress-qa-message"
                          : undefined
                      }
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
                                      for (let i = 0; i < images.length; i++) {
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
                                        const m = session.mask.context
                                          .concat(session.messages)
                                          .find((m) => m.id === message.id);
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
                            isWaiting && styles["chat-message-shimmer"],
                            isStreamingReveal &&
                              styles["chat-message-streaming-reveal"],
                          )}
                        >
                          <Markdown
                            key={message.streaming ? "loading" : "done"}
                            content={getMessageTextContent(message)}
                            loading={isWaiting}
                            fontSize={fontSize}
                            fontFamily={fontFamily}
                            isUser={isUser}
                            messageId={message.id}
                            streaming={message.streaming}
                            shouldAutoScroll={autoScroll}
                            enableArtifacts={
                              session.mask?.enableArtifacts !== false
                            }
                            enableCodeFold={
                              session.mask?.enableCodeFold !== false
                            }
                            onContentChange={scrollDomToBottom}
                            onPreviewImage={openMarkdownImagePreview}
                            onDownloadImage={downloadImage}
                          />
                          {messageImages.length == 1 && (
                            <MessageImagePreview
                              className={styles["chat-message-item-image"]}
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
                            <div
                              className={styles["chat-message-item-images"]}
                              style={
                                {
                                  "--image-count": messageImages.length,
                                } as React.CSSProperties
                              }
                            >
                              {messageImages.map((image, index) => {
                                const imageLabel = getMessageImageLabel(
                                  index,
                                  messageImages.length,
                                );

                                return (
                                  <MessageImagePreview
                                    className={
                                      styles["chat-message-item-image-multi"]
                                    }
                                    key={image}
                                    src={image}
                                    alt={imageLabel}
                                    actionLabels={getImageActionLabels(
                                      imageLabel,
                                    )}
                                    onPreview={openImagePreview}
                                    onDownload={downloadImage}
                                  />
                                );
                              })}
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
                                  onClick={() => onDelete(message.id ?? i)}
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
                                  className={styles["chat-message-copy-status"]}
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
          </section>
          <div
            ref={chatInputPanelRef}
            className={clsx(styles["chat-input-panel"], {
              [styles["chat-input-panel-collapsed"]]: !shouldExpandChatInput,
              [styles["chat-input-panel-empty"]]: showEmptyComposer,
            })}
            data-drag-active={isDropzonePreviewActive ? "true" : undefined}
          >
            {!showEmptyState && !hitBottom && !showChatActionMenu && (
              <button
                type="button"
                className={styles["chat-scroll-to-bottom"]}
                aria-label={Locale.Chat.InputActions.ToBottom}
                aria-controls="chat-scroll-body"
                onClick={scrollToBottom}
              >
                <BottomIcon />
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
                  uploadAttachments={handleUploadAttachments}
                  setAttachImages={setAttachImages}
                  setUploading={setUploading}
                  attachmentSlotsFull={attachmentSlotsFull}
                  showPromptModal={() =>
                    openPromptModal(chatInputMenuButtonRef.current)
                  }
                  scrollToBottom={scrollToBottom}
                  hitBottom={hitBottom}
                  uploading={uploading}
                  showPromptHints={() => {
                    expandInput();
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
                  imageGenerationEnabled={imageGenerationEnabled}
                  setImageGenerationEnabled={setImageGenerationEnabled}
                  onActionComplete={() => setShowChatActionMenu(false)}
                />
              )}
            </div>

            <div className={styles["chat-input-row"]}>
              <button
                type="button"
                ref={chatInputMenuButtonRef}
                className={clsx(styles["chat-input-menu-button"], {
                  [styles["chat-input-menu-button-active"]]: showChatActionMenu,
                })}
                onKeyDown={handleChatActionMenuKeyDown}
                onClick={() => {
                  setShowChatActionMenu((open) => !open);
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
              <label
                className={clsx(styles["chat-input-panel-inner"], {
                  [styles["chat-input-panel-inner-collapsed"]]:
                    !shouldExpandChatInput,
                  [styles["chat-input-panel-inner-attach"]]:
                    attachImages.length !== 0 || attachedFiles.length !== 0,
                  [styles["chat-input-panel-inner-reasoning"]]:
                    showInputReasoningAction,
                  [styles["chat-input-panel-inner-status"]]: showInputStatusRow,
                })}
                htmlFor="chat-input"
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
                  aria-readonly={markdownStressQaEnabled ? true : undefined}
                  aria-haspopup="listbox"
                  onChange={(e) => onInput(e.currentTarget.value)}
                  value={userInput}
                  onKeyDown={onInputKeyDown}
                  readOnly={markdownStressQaEnabled}
                  onFocus={() => {
                    scrollToBottom();
                  }}
                  onClick={() => {
                    scrollToBottom();
                  }}
                  onPaste={markdownStressQaEnabled ? undefined : handlePaste}
                  rows={isCompactScreen ? 1 : inputRows}
                  autoFocus={autoFocus}
                  style={{
                    fontSize: config.fontSize,
                    fontFamily: config.fontFamily,
                  }}
                />

                <button
                  type="button"
                  ref={modelSelectorButtonRef}
                  className={styles["chat-input-model-button"]}
                  aria-label={Locale.Chat.ModelMenu.SelectModel(
                    headerCurrentModelName,
                    currentModelDetail,
                  )}
                  title={`${headerCurrentModelName} · ${currentModelDetail}`}
                  onKeyDown={handleModelMenuKeyDown}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setShowChatActionMenu(false);
                    setExpandedMobileModelSection(null);
                    setComposerModelMenuStyle(
                      getComposerModelMenuStyle(event.currentTarget),
                    );
                    setShowMobileModelSelector((open) => !open);
                  }}
                  aria-controls="chat-model-menu"
                  aria-haspopup="dialog"
                  aria-expanded={showMobileModelSelector}
                >
                  <span className={styles["chat-input-model-name"]}>
                    {headerCurrentModelName}
                  </span>
                  <span className={styles["chat-input-model-arrow"]}>⌄</span>
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
                    {imageGenerationEnabled && (
                      <span
                        className={clsx(
                          styles["chat-input-mode-chip"],
                          styles["chat-input-image-mode-chip"],
                        )}
                        aria-label={Locale.Chat.ImageGeneration.ModeEnabled}
                      >
                        <ImageIcon />
                        <span>{Locale.Chat.ImageGeneration.ModeLabel}</span>
                      </span>
                    )}
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
                            onClick={handleUploadAttachments}
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

                <IconButton
                  icon={<SendWhiteIcon />}
                  text={isCompactScreen ? undefined : Locale.Chat.Send}
                  className={styles["chat-input-send"]}
                  type="primary"
                  disabled={!canSubmitComposer}
                  aria={Locale.Chat.Send}
                  onClick={() => doSubmit(userInput)}
                />
              </label>
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
