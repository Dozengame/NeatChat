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
import PromptIcon from "../icons/prompt.svg";
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
import ShortcutkeyIcon from "../icons/shortcutkey.svg";
import ReloadIcon from "../icons/reload.svg";
import HeadphoneIcon from "../icons/headphone.svg";
import {
  ChatMessage,
  useChatStore,
  BOT_HELLO,
  createMessage,
  DEFAULT_TOPIC,
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
  getMaxOutputTokensForReasoningEffort,
  isOpenAIGpt5OrNewerModelConfig,
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
  FileInfo,
  extractClipboardImageUrls,
  getFileIconClass,
  processAttachmentFiles,
  uploadAttachments,
} from "../utils/file";
import {
  activateMcpClient,
  deactivateMcpClient,
  isMcpEnabled,
} from "../mcp/actions";
import { createConfigFieldMeta } from "../utils/public-app-config";
import {
  JIMENG_IMAGE_GENERATION_SYSTEM_PROMPT,
  JIMENG_MCP_SERVER_ID,
} from "../mcp/jimeng";
import {
  getVisibleChatMessages,
  RenderMessage,
  shouldRenderLoadingPreview,
} from "./chat-render";

import { ImageEditor } from "./image-editor";

const localStorage = safeLocalStorage();

const ttsPlayer = createTTSPlayer();
const reasoningLabels: Record<OpenAIChatReasoningEffort, string> = {
  low: "标准",
  medium: "进阶",
  high: "深入",
};
const reasoningDescriptions: Record<OpenAIChatReasoningEffort, string> = {
  low: "最适合回答大多数问题",
  medium: "更稳妥处理复杂任务",
  high: "用于高难度推理",
};
const reasoningEfforts: OpenAIChatReasoningEffort[] = ["low", "medium", "high"];
const imageQualityLabels: Record<OpenAIImageQuality, string> = {
  auto: "自动",
  low: "低清晰度",
  medium: "标准清晰度",
  high: "高清晰度",
  standard: "标准",
  hd: "高清",
};
const getImageQualityLabel = (quality: OpenAIImageQuality) =>
  imageQualityLabels[quality] ?? quality;
type MobileModelAdvancedSection = "reasoning" | "image-size" | "image-quality";

const stopAll = () => ChatControllerPool.stopAll();
type ChatActionModalKey =
  | "model"
  | "plugin"
  | "imageGeneration"
  | "size"
  | "quality"
  | "style";
type ChatActionModals = Record<ChatActionModalKey, boolean>;
const closedChatActionModals: ChatActionModals = {
  model: false,
  plugin: false,
  imageGeneration: false,
  size: false,
  quality: false,
  style: false,
};

function hasDraggedFiles(
  dataTransfer: DataTransfer | null,
): dataTransfer is DataTransfer {
  return Array.from(dataTransfer?.types ?? []).includes("Files");
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
    showToast("无法直接保存图片，已打开原图");
    triggerFileDownload(src, fileName);
  }
}

function MessageImagePreview(props: {
  src: string;
  alt?: string;
  className: string;
  onPreview: (src: string) => void;
  onDownload: (src: string) => void | Promise<void>;
}) {
  return (
    <span className={styles["chat-message-image-frame"]}>
      <button
        type="button"
        className={styles["chat-message-image-preview-button"]}
        aria-label={props.alt || "预览图片"}
        onClick={() => props.onPreview(props.src)}
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
        aria-label="下载原图"
        title="下载原图"
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
    <div className="modal-mask">
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
  setShowModal: (_: boolean) => void;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const context = session.mask.context;

  return (
    <div className={styles["prompt-toast"]} key="prompt-toast">
      {props.showToast && context.length > 0 && (
        <button
          type="button"
          className={clsx(styles["prompt-toast-inner"], "clickable")}
          onClick={() => props.setShowModal(true)}
        >
          <BrainIcon />
          <span className={styles["prompt-toast-content"]}>
            {Locale.Context.Toast(context.length)}
          </span>
        </button>
      )}
      {props.showModal && (
        <SessionConfigModel onClose={() => props.setShowModal(false)} />
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

  if (prompts.length !== promptCountRef.current) {
    promptCountRef.current = prompts.length;
    setSelectIndex(0);
  }

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [selectIndex]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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

      const selectPromptIndex = (nextIndex: number) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectIndex(nextIndex);
      };

      // arrow up / down to select prompt
      const changeIndex = (delta: number) => {
        const nextIndex = Math.max(
          0,
          Math.min(prompts.length - 1, selectIndex + delta),
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
        const selectedPrompt = prompts.at(selectIndex);
        if (selectedPrompt) {
          onPromptSelect(selectedPrompt);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [noPrompts, onClose, onPromptSelect, prompts, selectIndex]);

  if (noPrompts) return null;
  return (
    <div
      id="chat-prompt-hints"
      className={styles["prompt-hints"]}
      role="listbox"
      aria-label="提示词建议"
      aria-activedescendant={`chat-prompt-hint-${selectIndex}`}
    >
      {prompts.map((prompt, i) => (
        <button
          type="button"
          id={`chat-prompt-hint-${i}`}
          ref={i === selectIndex ? selectedRef : null}
          className={clsx(styles["prompt-hint"], {
            [styles["prompt-hint-selected"]]: i === selectIndex,
          })}
          role="option"
          aria-selected={i === selectIndex}
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

function ClearContextDivider() {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();

  return (
    <button
      type="button"
      className={styles["clear-context"]}
      onClick={() =>
        chatStore.updateTargetSession(
          session,
          (session) => (session.clearContextIndex = undefined),
        )
      }
    >
      <div className={styles["clear-context-tips"]}>{Locale.Context.Clear}</div>
      <div className={styles["clear-context-revert-btn"]}>
        {Locale.Context.Revert}
      </div>
    </button>
  );
}

export function ChatAction(props: {
  text: string;
  icon: JSX.Element;
  onClick: () => void | Promise<void>;
  active?: boolean;
  ariaLabel?: string;
  ariaHasPopup?: React.AriaAttributes["aria-haspopup"];
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
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
      })}
      aria-label={props.ariaLabel ?? props.text}
      aria-haspopup={props.ariaHasPopup}
      aria-expanded={props.ariaExpanded}
      aria-pressed={props.ariaPressed}
      role={props.role}
      onClick={() => {
        void props.onClick();
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
  detach: boolean = false,
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
    if (autoScroll && !detach) {
      scrollDomToBottom();
    }
  }, [autoScroll, detach, scrollDomToBottom, scrollSignal]);

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
  setShowShortcutKeyModal: React.Dispatch<React.SetStateAction<boolean>>;
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
  const setImageGenerationMode = async (enabled: boolean) => {
    if (enabled) {
      let mcpEnabled = false;
      try {
        mcpEnabled = await isMcpEnabled();
      } catch (error) {
        console.warn("[MCP] Failed to check MCP status", error);
        showToast("图片生成未启用");
        return;
      }

      if (!mcpEnabled) {
        showToast("图片生成未启用");
        return;
      }

      try {
        await activateMcpClient(JIMENG_MCP_SERVER_ID);
        chatStore.resetMcpCache();
      } catch (error) {
        showToast(error instanceof Error ? error.message : "图片生成启用失败");
        return;
      }
    } else {
      try {
        await deactivateMcpClient(JIMENG_MCP_SERVER_ID);
      } catch (error) {
        console.warn("[MCP] Failed to deactivate Jimeng MCP", error);
      }
      chatStore.resetMcpCache();
    }

    props.setImageGenerationEnabled(enabled);
    showToast(enabled ? "已启用图片生成" : "已关闭图片生成");
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
          aria-label="多模态工具"
        >
          <div className={styles["chat-multimodal-section-header"]}>
            <span className={styles["chat-multimodal-section-title"]}>
              <span>添加内容</span>
            </span>
            <span className={styles["chat-multimodal-section-subtitle"]}>
              <span>文件和图片</span>
            </span>
          </div>
          <ChatAction
            onClick={() => {
              props.uploadAttachments();
              completeMobileAction();
            }}
            text={"上传附件"}
            icon={props.uploading ? <LoadingButtonIcon /> : <AttachmentIcon />}
          />

          {!isCompactScreen && config.enablePromptHints && (
            <ChatAction
              onClick={() => {
                props.showPromptHints();
                props.onActionComplete?.();
              }}
              text={Locale.Chat.InputActions.Prompt}
              icon={<PromptIcon />}
            />
          )}

          <ChatAction
            active={props.imageGenerationEnabled}
            ariaPressed={props.imageGenerationEnabled}
            onClick={async () => {
              if (isCompactScreen) {
                completeMobileAction();
                await setImageGenerationMode(!props.imageGenerationEnabled);
                return;
              }

              setActionModalOpen("imageGeneration", true);
            }}
            text={props.imageGenerationEnabled ? "关闭图片生成" : "图片生成"}
            ariaHasPopup={isCompactScreen ? undefined : "listbox"}
            ariaExpanded={
              isCompactScreen ? undefined : actionModals.imageGeneration
            }
            icon={<ImageIcon />}
          />
          {!isCompactScreen && actionModals.imageGeneration && (
            <Selector
              defaultSelectedValue={
                props.imageGenerationEnabled ? "enabled" : "disabled"
              }
              items={[
                {
                  title: "启用图片生成",
                  subTitle: "后续消息会优先调用 jimeng-mcp 生成图片",
                  value: "enabled",
                  icon: <ImageIcon />,
                },
                {
                  title: "关闭图片生成",
                  subTitle: "后续消息按普通聊天处理",
                  value: "disabled",
                  icon: <ImageIcon />,
                },
              ]}
              onClose={() => setActionModalOpen("imageGeneration", false)}
              onSelection={(selection) => {
                const selected = selection[0];
                if (!selected) return;
                setImageGenerationMode(selected === "enabled");
              }}
              showSearch={false}
            />
          )}
        </div>

        {hasSessionActions && (
          <div
            className={clsx(
              styles["chat-multimodal-section"],
              styles["chat-multimodal-section-session"],
            )}
            role="group"
            aria-label="会话工具"
          >
            <div className={styles["chat-multimodal-section-header"]}>
              <span className={styles["chat-multimodal-section-title"]}>
                <span>会话</span>
              </span>
              <span className={styles["chat-multimodal-section-subtitle"]}>
                <span>模型和设置</span>
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
                  completeMobileAction();
                }}
              />
            )}

            {false && (
              <ChatAction
                onClick={() => {
                  if (modelLocked) {
                    showToast("该项已由管理员锁定");
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

            {!isCompactScreen && config.enableShortcuts && (
              <ChatAction
                onClick={() => props.setShowShortcutKeyModal(true)}
                text={Locale.Chat.ShortcutKey.Title}
                icon={<ShortcutkeyIcon />}
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
  const currentReasoningEffort =
    session.mask.modelConfig?.reasoningEffort ??
    (OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT as OpenAIChatReasoningEffort);
  const [showReasoningSelectorModal, setShowReasoningSelectorModal] =
    useState(false);
  const reasoningLocked =
    accessStore.lockedFields?.includes("reasoningEffort") ||
    session.mask.modelConfigMeta?.reasoningEffort?.locked;
  const showReasoningSelector = isOpenAIGpt5OrNewerModelConfig({
    model: currentModel,
    providerName: currentProviderName,
  });
  const getReasoningMaxOutputTokens = (effort: OpenAIChatReasoningEffort) =>
    accessStore.openaiMaxOutputTokens ??
    getMaxOutputTokensForReasoningEffort(effort);

  if (!showReasoningSelector) return null;

  const openReasoningSelector = () => {
    if (reasoningLocked) {
      showToast("该项已由管理员锁定");
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
        disabled={reasoningLocked}
        aria-label={`思考等级：${reasoningLabels[currentReasoningEffort]}`}
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
          items={reasoningEfforts.map((effort) => ({
            title: reasoningLabels[effort],
            value: effort,
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

export function DeleteImageButton(props: { deleteImage: (e?: any) => void }) {
  return (
    <button
      type="button"
      className={styles["delete-image"]}
      aria-label={Locale.Chat.Actions.Delete}
      onClick={props.deleteImage}
    >
      <DeleteIcon />
    </button>
  );
}

export function ShortcutKeyModal(props: { onClose: () => void }) {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
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
    <div className="modal-mask">
      <Modal
        title={Locale.Chat.ShortcutKey.Title}
        onClose={props.onClose}
        actions={[
          <IconButton
            type="primary"
            text={Locale.UI.Confirm}
            icon={<ConfirmIcon />}
            key="ok"
            onClick={() => {
              props.onClose();
            }}
          />,
        ]}
      >
        <div className={styles["shortcut-key-container"]}>
          <div className={styles["shortcut-key-grid"]}>
            {shortcuts.map((shortcut) => (
              <div key={shortcut.title} className={styles["shortcut-key-item"]}>
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
  const isScrolledToBottom = scrollRef?.current
    ? Math.abs(
        scrollRef.current.scrollHeight -
          (scrollRef.current.scrollTop + scrollRef.current.clientHeight),
      ) <= 1
    : false;
  const isAttachWithTop = (() => {
    const lastMessage = scrollRef.current?.lastElementChild as HTMLElement;
    // if scrolllRef is not ready or no message, return false
    if (!scrollRef?.current || !lastMessage) return false;
    const topDistance =
      lastMessage!.getBoundingClientRect().top -
      scrollRef.current.getBoundingClientRect().top;
    // leave some space for user question
    return topDistance < 100;
  })();

  const isTyping = userInput !== "";

  // if user is typing, should auto scroll to bottom
  // if user is not typing, should auto scroll to bottom only if already at bottom
  const messageScrollSignal = `${session.messages.length}:${
    session.messages.at(-1)?.id ?? ""
  }`;
  const { autoScroll, setAutoScroll, scrollDomToBottom } = useScrollToBottom(
    scrollRef,
    (isScrolledToBottom || isAttachWithTop) && !isTyping,
    messageScrollSignal,
  );
  const [hitBottom, setHitBottom] = useState(true);
  const isMobileScreen = useMobileScreen();
  const isCompactScreen = useCompactScreen();
  const navigate = useNavigate();
  const location = useLocation();
  const [attachImages, setAttachImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileInfo[]>([]);
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

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

  // prompt hints
  const promptStore = usePromptStore();
  const [promptHints, setPromptHints] = useState<RenderPrompt[]>([]);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [showChatActionMenu, setShowChatActionMenu] = useState(false);
  const ignoreInputCollapseUntil = useRef(0);
  const hasActiveInputContent =
    userInput.trim().length > 0 ||
    attachImages.length > 0 ||
    attachedFiles.length > 0 ||
    imageGenerationEnabled ||
    promptHints.length > 0;
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
            `\n\n[文件过大，已截断。原文件大小: ${text.length} 字符]`
          : text;

      // 将长文本转换为文件附件
      const longTextFile: FileInfo = {
        name: `输入文本_${new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[T:]/g, "-")}.txt`,
        type: "text/plain",
        size: text.length,
        content: truncatedText,
        originalFile: new File([text], "输入文本.txt", { type: "text/plain" }),
      };

      // 添加到文件附件列表
      setAttachedFiles([...attachedFiles, longTextFile]);

      // 清空输入框
      setUserInput("");

      // 显示提示
      showToast("文本过长，已自动转换为文件附件");

      // 如果文本被截断，显示额外提示
      if (text.length > MAX_FILE_CONTENT_LENGTH) {
        showToast(`文件内容过大，已截断至 ${MAX_FILE_CONTENT_LENGTH} 字符`);
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
      const longTextFile: FileInfo = {
        name: "长文本.txt",
        type: "text/plain",
        size: userInput.length,
        content: userInput,
        originalFile: new File([userInput], "长文本.txt", {
          type: "text/plain",
        }),
      };

      filesToSend.push(longTextFile);

      // 替换用户输入为提示信息
      finalUserInput = "我发送了一个长文本文件，内容已自动转换为附件。";

      // 显示提示
      showToast("文本过长，已自动转换为文件附件");
    }

    // 如果有附加文件，将文件信息添加到用户输入
    if (filesToSend.length > 0) {
      const fileInfosText = filesToSend
        .map(
          (file) =>
            `文件名: ${file.name}\n类型: ${file.type}\n大小: ${(
              file.size / 1024
            ).toFixed(2)} KB\n\n${file.content}`,
        )
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
        setShowPromptModal(true);
      },
    });
  };

  const accessStore = useAccessStore();
  const [showMobileModelSelector, setShowMobileModelSelector] = useState(false);
  const [expandedMobileModelSection, setExpandedMobileModelSection] =
    useState<MobileModelAdvancedSection | null>(null);
  const modelSelectorButtonRef = useRef<HTMLButtonElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
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
  const handleModelMenuKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!showMobileModelSelector) return;
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    event.stopPropagation();
    focusModelMenuControl(event.key);
  };
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
  const headerCurrentReasoningEffort =
    session.mask.modelConfig?.reasoningEffort ??
    (OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT as OpenAIChatReasoningEffort);
  const headerReasoningLocked =
    accessStore.lockedFields?.includes("reasoningEffort") ||
    session.mask.modelConfigMeta?.reasoningEffort?.locked;
  const showHeaderReasoningControl = isOpenAIGpt5OrNewerModelConfig({
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
  const desktopModelDetail = showHeaderImageControls
    ? `${headerCurrentSize} · ${getImageQualityLabel(headerCurrentQuality)}`
    : showHeaderReasoningControl
    ? `思考 ${reasoningLabels[headerCurrentReasoningEffort]}`
    : headerCurrentProviderName;
  const isReasoningSectionExpanded = expandedMobileModelSection === "reasoning";
  const isImageSizeSectionExpanded =
    expandedMobileModelSection === "image-size";
  const isImageQualitySectionExpanded =
    expandedMobileModelSection === "image-quality";
  const getHeaderReasoningMaxOutputTokens = (
    effort: OpenAIChatReasoningEffort,
  ) =>
    accessStore.openaiMaxOutputTokens ??
    getMaxOutputTokensForReasoningEffort(effort);
  const selectHeaderModel = (selected: string) => {
    if (headerModelLocked) {
      showToast("该项已由管理员锁定");
      return;
    }
    const [model, providerName] = getModelProvider(selected);
    chatStore.updateTargetSession(session, (session) => {
      session.mask.modelConfig.model = model as ModelType;
      session.mask.modelConfig.providerName = providerName as ServiceProvider;
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
    showToast(model);
  };
  const selectHeaderReasoningEffort = (
    reasoningEffort: OpenAIChatReasoningEffort,
  ) => {
    if (headerReasoningLocked) {
      showToast("该项已由管理员锁定");
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
    const visibleSessionMessages = getVisibleChatMessages(
      session.messages as RenderMessage[],
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
    config.sendPreviewBubble,
    context,
    isLoading,
    session.messages,
    userInput,
  ]);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(() =>
    Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  );
  function setMsgRenderIndex(newIndex: number) {
    newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    _setMsgRenderIndex(newIndex);
  }

  const messages = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      renderMessages.length,
    );
    return renderMessages.slice(msgRenderIndex, endRenderIndex);
  }, [msgRenderIndex, renderMessages]);
  const showEmptyState =
    session.messages.length === 0 &&
    context.length === 1 &&
    getMessageTextContent(context[0]) === BOT_HELLO.content &&
    !isLoading;
  const showEmptyComposer = showEmptyState && !hasActiveInputContent;
  const showEmptyHero =
    showEmptyState && !hasActiveInputContent && !showChatActionMenu;
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
    const bottomHeight = e.scrollTop + e.clientHeight;
    const edgeThreshold = e.clientHeight;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
    const isHitBottom =
      bottomHeight >= e.scrollHeight - (isMobileScreen ? 4 : 10);

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    if (isTouchTopEdge && !isTouchBottomEdge) {
      setMsgRenderIndex(prevPageMsgIndex);
    } else if (isTouchBottomEdge) {
      setMsgRenderIndex(nextPageMsgIndex);
    }

    setHitBottom(isHitBottom);
    setAutoScroll(isHitBottom);

    if (
      isCompactScreen &&
      !hasActiveInputContent &&
      Date.now() > ignoreInputCollapseUntil.current
    ) {
      inputRef.current?.blur();
      setIsInputExpanded(false);
    }
  };
  function scrollToBottom() {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  // clear context index = context length + index in messages
  const clearContextIndex =
    (session.clearContextIndex ?? -1) >= 0
      ? session.clearContextIndex! + context.length - msgRenderIndex
      : -1;

  const [showPromptModal, setShowPromptModal] = useState(false);

  const clientConfig = useMemo(() => getClientConfig(), []);

  const autoFocus = !isCompactScreen; // wont auto focus on compact screens
  const showMaxIcon = !isCompactScreen && !clientConfig?.isApp;

  useCommand({
    fill: setUserInput,
    submit: (text) => {
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
    const dom = inputRef.current;
    return () => {
      localStorage.setItem(unfinishedInputKey, dom?.value ?? "");
    };
  }, [unfinishedInputKey]);

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
          messages.push(`已添加 ${filesToAdd.length} 个文件`);
        }

        if (fileInfos.length > remainingFileSlots) {
          messages.push("最多只能上传5个文件，已保留前5个");
        }
      }

      if (imageUrls.length > 0) {
        const remainingImageSlots = Math.max(0, 3 - currentAttachImages.length);
        const imagesToAdd = imageUrls.slice(0, remainingImageSlots);

        if (imagesToAdd.length > 0) {
          setAttachImages([...currentAttachImages, ...imagesToAdd]);
          messages.push(`已添加 ${imagesToAdd.length} 张图片`);
        }

        if (imageUrls.length > remainingImageSlots) {
          messages.push("最多只能上传3张图片，已保留前3张");
        }
      }

      if (messages.length > 0) {
        showToast(messages.join("，"));
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

      if (dataTransfer.files.length > 0) {
        const files = Array.from(dataTransfer.files);

        // 15MB size limit check
        const MAX_SIZE = 15 * 1024 * 1024;
        const validSizeFiles = files.filter((file) => {
          if (file.size > MAX_SIZE) {
            showToast(`文件 ${file.name} 超过 15MB 限制，已忽略`);
            return false;
          }
          return true;
        });

        // Classify
        const images = validSizeFiles.filter((file) =>
          file.type.startsWith("image/"),
        );
        const documents = validSizeFiles.filter(
          (file) => !file.type.startsWith("image/"),
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
          showToast("最多只能上传3张图片，已保留前3张");
        }
        if (documents.length > remainingFileSlots) {
          showToast("最多只能上传5个文件，已保留前5个");
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
          showToast("读取拖拽附件失败");
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
    const filesFromList = Array.from(clipboardData?.files ?? []);
    const filesFromItems = Array.from(clipboardData?.items ?? [])
      .map((item) => (item.kind === "file" ? item.getAsFile() : null))
      .filter((file): file is File => !!file);
    const seenFiles = new Set<string>();
    const pastedFiles = [...filesFromList, ...filesFromItems].filter((file) => {
      const key = [file.name, file.type, file.size, file.lastModified].join(
        ":",
      );
      if (seenFiles.has(key)) {
        return false;
      }
      seenFiles.add(key);
      return true;
    });
    const pastedImageUrls = extractClipboardImageUrls(clipboardData);

    if (pastedFiles.length > 0 || pastedImageUrls.length > 0) {
      e.preventDefault();
      setUploading(true);
      try {
        const { fileInfos, imageUrls } =
          await processAttachmentFiles(pastedFiles);
        appendAttachments(fileInfos, [...imageUrls, ...pastedImageUrls]);
      } catch (error) {
        console.error("读取粘贴附件失败:", error);
        showToast("读取粘贴附件失败");
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
          showToast("最多只能上传5个文件");
          return;
        }

        // 截断过长的文本内容
        const maxLength = 100000;
        const truncatedText =
          text.length > maxLength
            ? text.substring(0, maxLength) +
              `\n\n[文件过大，已截断。原文件大小: ${text.length} 字符]`
            : text;

        // 将长文本转为文件附件
        const file = new File([text], "粘贴的文本.txt", { type: "text/plain" });
        setAttachedFiles([
          ...attachedFiles,
          {
            name: "粘贴的文本.txt",
            type: "text/plain",
            size: text.length,
            content: truncatedText,
            originalFile: file,
          },
        ]);

        showToast("已将长文本转为附件");
      }
    }
  };

  // 修改上传附件的处理函数
  async function handleUploadAttachments() {
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
        showToast("读取文件失败");
      },
      // 完成上传
      () => {
        setUploading(false);
      },
    );
  }

  // 快捷键 shortcut keys
  const [showShortcutKeyModal, setShowShortcutKeyModal] = useState(false);

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
        const lastNonUserMessage = messages
          .filter((message) => message.role !== "user")
          .pop();
        if (lastNonUserMessage) {
          const lastMessageContent = getMessageTextContent(lastNonUserMessage);
          copyToClipboard(lastMessageContent);
        }
      }
      // 展示快捷键 command + /
      else if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        setShowShortcutKeyModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [messages, chatStore, navigate]);

  const [showChatSidePanel, setShowChatSidePanel] = useState(false);

  // 添加触摸滑动相关的状态
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // 处理触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
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

  // 添加删除单个文件函数
  function deleteAttachedFile(index: number) {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  }

  // 在 ChatInner 组件内添加新状态
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null);
  const [showFileEditModal, setShowFileEditModal] = useState(false);

  // 在_Chat组件中添加状态
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const chatInputMenuButtonRef = useRef<HTMLButtonElement>(null);
  const chatInputActionMenuRef = useRef<HTMLDivElement>(null);

  // 在_Chat组件中添加状态，记录当前编辑图片所属的消息ID
  const editingImageMessageIdRef = useRef<string | null>(null);

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
  const handleChatActionMenuKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (!showChatActionMenu) return;
    if ((event.target as HTMLElement | null)?.closest('[role="listbox"]')) {
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    event.stopPropagation();
    focusChatActionMenuControl(event.key);
  };

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
        setPreviewImage(null);
      }
    };

    window.addEventListener("keydown", closePreview);
    return () => window.removeEventListener("keydown", closePreview);
  }, [previewImage]);

  const showInputReasoningAction = false;
  const showInputStatusRow = showInputReasoningAction || imageGenerationEnabled;
  const isMobileSidebarOpen = location.pathname === Path.Home;
  const promptToast = (
    <PromptToast
      showToast={!hitBottom}
      showModal={showPromptModal}
      setShowModal={setShowPromptModal}
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
      <div
        className={clsx(
          styles["chat-dropzone"],
          dragActive && styles["chat-dropzone-active"],
        )}
      >
        <div className={styles["chat-dropzone-content"]}>
          <div className={styles["chat-dropzone-icon"]}>
            <AttachmentIcon />
          </div>
          <p className={styles["chat-dropzone-text"]}>
            拖拽文件或图片到此处上传
          </p>
        </div>
      </div>
      <button
        type="button"
        className={clsx(styles["chat-input-action-menu-backdrop"], {
          [styles["chat-input-action-menu-backdrop-open"]]: showChatActionMenu,
        })}
        aria-label="关闭对话工具"
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
          <button
            type="button"
            ref={modelSelectorButtonRef}
            className={styles["chat-mobile-model-title"]}
            aria-label="选择模型"
            onKeyDown={handleModelMenuKeyDown}
            onClick={() => {
              setShowChatActionMenu(false);
              setExpandedMobileModelSection(null);
              setShowMobileModelSelector((open) => !open);
            }}
            aria-controls="chat-model-menu"
            aria-haspopup="dialog"
            aria-expanded={showMobileModelSelector}
          >
            <span>{headerCurrentModelName}</span>
            <span className={styles["chat-mobile-model-title-arrow"]}>⌄</span>
          </button>
          <IconButton
            className={styles["chat-mobile-header-button"]}
            icon={<RenameIcon />}
            bordered
            title={Locale.Chat.InputActions.Settings}
            aria={Locale.Chat.InputActions.Settings}
            onClick={() => {
              closeMobileModelSelector();
              setShowChatActionMenu(false);
              setShowPromptModal(true);
            }}
          />
          {promptToast}
        </div>
      ) : (
        <div className="window-header" data-tauri-drag-region>
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
            <button
              type="button"
              ref={modelSelectorButtonRef}
              className={styles["chat-desktop-model-title"]}
              aria-label="选择模型和参数"
              onKeyDown={handleModelMenuKeyDown}
              onClick={() => {
                setShowChatActionMenu(false);
                setExpandedMobileModelSection(null);
                setShowMobileModelSelector((open) => !open);
              }}
              aria-controls="chat-model-menu"
              aria-haspopup="dialog"
              aria-expanded={showMobileModelSelector}
            >
              <span className={styles["chat-desktop-model-name"]}>
                {headerCurrentModelName}
              </span>
              <span className={styles["chat-desktop-model-meta"]}>
                {desktopModelDetail}
              </span>
              <span className={styles["chat-desktop-model-title-arrow"]}>
                ⌄
              </span>
            </button>
          </div>
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
          {promptToast}
        </div>
      )}

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
        aria-label="关闭模型选择"
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
          },
        )}
        onKeyDown={handleModelMenuKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="模型和思考等级"
      >
        <div
          className={styles["chat-mobile-model-list"]}
          role="listbox"
          aria-label="可选模型"
        >
          {headerAvailableModels.length === 0 ? (
            <div className={styles["chat-mobile-model-empty"]}>
              暂无可用模型
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
                    <strong>思考等级</strong>
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
                    aria-label="思考等级选项"
                  >
                    {reasoningEfforts.map((effort) => {
                      const selected = effort === headerCurrentReasoningEffort;
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
                      <strong>图片尺寸</strong>
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
                      aria-label="图片尺寸选项"
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
                                生成图片尺寸
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
                        <strong>图片清晰度</strong>
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
                        aria-label="图片清晰度选项"
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
            className={clsx(styles["chat-body"], {
              [styles["chat-body-empty"]]: showEmptyHero,
            })}
            ref={scrollRef}
            aria-label="聊天消息"
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
                  aria-label="建议问题"
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
                            {(() => {
                              const isZh =
                                Locale.Chat.EmptySuggestions[0] ===
                                "总结这段内容";
                              const idx =
                                Locale.Chat.EmptySuggestions.indexOf(
                                  suggestion,
                                );
                              return (
                                [
                                  isZh ? "总结文本" : "Summarize text",
                                  isZh ? "规划日程" : "Plan schedule",
                                  isZh ? "创意绘图" : "Creative poster",
                                  isZh ? "分析文档" : "Analyze document",
                                ][idx] || suggestion
                              );
                            })()}
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
              role="list"
              aria-label="会话消息列表"
              aria-live="polite"
              aria-relevant="additions text"
              aria-atomic="false"
            >
              {(showEmptyState ? [] : messages).map((message, i) => {
                const isUser = message.role === "user";
                const isContext = i < context.length;
                const showActions =
                  i > 0 &&
                  !message.streaming &&
                  !message.preview &&
                  message.content.length > 0 &&
                  !isContext;
                const showTyping = message.preview || message.streaming;
                const isWaiting =
                  !isUser &&
                  (message.preview ||
                    (message.streaming && message.content.length === 0));
                const isStreamingReveal =
                  !isUser && message.streaming && message.content.length > 0;

                const shouldShowClearContextDivider =
                  i === clearContextIndex - 1;
                const messageLabel = `${isUser ? "用户消息" : "助手消息"} ${
                  i + 1
                }`;
                const messageActionLabel = `${messageLabel} 操作`;

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
                    >
                      <div className={styles["chat-message-container"]}>
                        <div className={styles["chat-message-header"]}>
                          <div className={styles["chat-message-avatar"]}>
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
                                  let newContent: string | MultimodalContent[] =
                                    newMessage;
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
                            {isUser ? (
                              <div className={styles["chat-message-avatar"]}>
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
                                <div className={styles["empty-avatar"]}></div>
                              </div>
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
                            onPreviewImage={setPreviewImage}
                            onDownloadImage={downloadImage}
                          />
                          {getMessageImages(message).length == 1 && (
                            <MessageImagePreview
                              className={styles["chat-message-item-image"]}
                              src={getMessageImages(message)[0]}
                              onPreview={setPreviewImage}
                              onDownload={downloadImage}
                            />
                          )}
                          {getMessageImages(message).length > 1 && (
                            <div
                              className={styles["chat-message-item-images"]}
                              style={
                                {
                                  "--image-count":
                                    getMessageImages(message).length,
                                } as React.CSSProperties
                              }
                            >
                              {getMessageImages(message).map((image, index) => {
                                return (
                                  <MessageImagePreview
                                    className={
                                      styles["chat-message-item-image-multi"]
                                    }
                                    key={image}
                                    src={image}
                                    onPreview={setPreviewImage}
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
                            <div className={styles["chat-message-action-rail"]}>
                              <>
                                <ChatAction
                                  text={Locale.Chat.Actions.Retry}
                                  ariaLabel={`${messageActionLabel}：${Locale.Chat.Actions.Retry}`}
                                  icon={<ResetIcon />}
                                  onClick={() => onResend(message)}
                                />
                                <ChatAction
                                  text={Locale.Chat.Actions.Delete}
                                  ariaLabel={`${messageActionLabel}：${Locale.Chat.Actions.Delete}`}
                                  icon={<DeleteIcon />}
                                  onClick={() => onDelete(message.id ?? i)}
                                />
                                <ChatAction
                                  text={Locale.Chat.Actions.Pin}
                                  ariaLabel={`${messageActionLabel}：${Locale.Chat.Actions.Pin}`}
                                  icon={<PinIcon />}
                                  onClick={() => onPinMessage(message)}
                                />
                                <ChatAction
                                  text={Locale.Chat.Actions.Copy}
                                  ariaLabel={`${messageActionLabel}：${Locale.Chat.Actions.Copy}`}
                                  icon={<CopyIcon />}
                                  onClick={() =>
                                    copyToClipboard(
                                      getMessageTextContent(message),
                                    )
                                  }
                                />
                                {ENABLE_TEXT_TO_SPEECH &&
                                  config.ttsConfig.enable && (
                                    <ChatAction
                                      text={
                                        speechStatus
                                          ? Locale.Chat.Actions.StopSpeech
                                          : Locale.Chat.Actions.Speech
                                      }
                                      ariaLabel={`${messageActionLabel}：${
                                        speechStatus
                                          ? Locale.Chat.Actions.StopSpeech
                                          : Locale.Chat.Actions.Speech
                                      }`}
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
                    {shouldShowClearContextDivider && <ClearContextDivider />}
                  </Fragment>
                );
              })}
            </div>
          </section>
          <div
            className={clsx(styles["chat-input-panel"], {
              [styles["chat-input-panel-collapsed"]]: !shouldExpandChatInput,
              [styles["chat-input-panel-empty"]]: showEmptyComposer,
            })}
          >
            {!showEmptyState && !hitBottom && !showChatActionMenu && (
              <button
                type="button"
                className={styles["chat-scroll-to-bottom"]}
                aria-label={Locale.Chat.InputActions.ToBottom}
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
              aria-label="对话工具菜单"
            >
              <ChatActions
                uploadAttachments={handleUploadAttachments}
                setAttachImages={setAttachImages}
                setUploading={setUploading}
                showPromptModal={() => setShowPromptModal(true)}
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
                setShowShortcutKeyModal={setShowShortcutKeyModal}
                setUserInput={setUserInput}
                setShowChatSidePanel={setShowChatSidePanel}
                imageGenerationEnabled={imageGenerationEnabled}
                setImageGenerationEnabled={setImageGenerationEnabled}
                onActionComplete={() => setShowChatActionMenu(false)}
              />
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
                  expandInput();
                  setShowChatActionMenu((open) => !open);
                }}
                aria-label={
                  showChatActionMenu ? "关闭对话工具" : "打开对话工具"
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
                  aria-haspopup="listbox"
                  onChange={(e) => onInput(e.currentTarget.value)}
                  value={userInput}
                  onKeyDown={onInputKeyDown}
                  onFocus={() => {
                    scrollToBottom();
                  }}
                  onClick={() => {
                    scrollToBottom();
                  }}
                  onPaste={handlePaste}
                  rows={isCompactScreen ? 1 : inputRows}
                  autoFocus={autoFocus}
                  style={{
                    fontSize: config.fontSize,
                    fontFamily: config.fontFamily,
                  }}
                />

                {showInputStatusRow && (
                  <div
                    className={styles["chat-input-status-row"]}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label="当前输入模式"
                  >
                    {showInputReasoningAction && <ChatInputReasoningAction />}
                    {imageGenerationEnabled && (
                      <span
                        className={clsx(
                          styles["chat-input-mode-chip"],
                          styles["chat-input-image-mode-chip"],
                        )}
                        aria-label="图片生成模式已开启"
                      >
                        <ImageIcon />
                        <span>图片生成</span>
                      </span>
                    )}
                  </div>
                )}

                {/* 附件容器（包含图片和文件） */}
                {(attachImages.length > 0 || attachedFiles.length > 0) && (
                  <div
                    className={styles["attachments-container"]}
                    role="list"
                    aria-label="附件预览"
                  >
                    {/* 图片附件 */}
                    {attachImages.map((image, index) => (
                      <div
                        className={clsx(
                          styles["attach-item"],
                          styles["attach-image-item"],
                        )}
                        role="listitem"
                        key={image}
                      >
                        <button
                          type="button"
                          className={styles["attach-image"]}
                          aria-label="编辑图片附件"
                          style={{ backgroundImage: `url("${image}")` }}
                          onClick={() => setEditingImage(image)}
                        />
                        <div className={styles["attach-image-mask"]}>
                          <DeleteImageButton
                            deleteImage={(e) => {
                              e.stopPropagation(); // 防止触发图片点击事件
                              setAttachImages(
                                attachImages.filter((_, i) => i !== index),
                              );
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* 文件附件 */}
                    {attachedFiles.map((file, index) => (
                      <div
                        className={clsx(
                          styles["attach-item"],
                          styles["attach-file-item"],
                        )}
                        role="listitem"
                        key={`${file.name}-${file.size}-${file.type}`}
                      >
                        <button
                          type="button"
                          className={styles["attach-file"]}
                          onClick={async () => {
                            // 使用与消息编辑相同的showPrompt函数
                            const newContent = await showPrompt(
                              `编辑文件：${file.name}`,
                              file.content,
                              20, // 更多行数以便于编辑文件内容
                            );

                            if (newContent) {
                              // 更新文件内容
                              const updatedFiles = attachedFiles.map((f, i) => {
                                if (i === index) {
                                  // 更新文件大小
                                  const newSize = new Blob([newContent]).size;
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
                              });
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
                              <div className={styles["attach-file-name"]}>
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
                            deleteImage={(e) => {
                              e.stopPropagation(); // 防止触发文件点击事件
                              deleteAttachedFile(index);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <IconButton
                  icon={<SendWhiteIcon />}
                  text={isCompactScreen ? undefined : Locale.Chat.Send}
                  className={styles["chat-input-send"]}
                  type="primary"
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
        <ShortcutKeyModal onClose={() => setShowShortcutKeyModal(false)} />
      )}

      {showFileEditModal && editingFile && (
        <div className="modal-mask">
          <Modal
            title={`编辑文件内容: ${editingFile.name}`}
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
                aria-label={`编辑文件内容: ${editingFile.name}`}
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
          aria-label="图片预览"
          onCancel={() => setPreviewImage(null)}
        >
          <div className={styles["image-preview-toolbar"]}>
            <button
              type="button"
              className={styles["image-preview-button"]}
              aria-label="下载原图"
              title="下载原图"
              onClick={() => downloadImage(previewImage)}
            >
              <DownloadIcon />
            </button>
            <button
              type="button"
              className={styles["image-preview-button"]}
              aria-label="关闭预览"
              title="关闭预览"
              onClick={() => setPreviewImage(null)}
            >
              <CancelIcon />
            </button>
          </div>
          <Image
            className={styles["image-preview-image"]}
            src={previewImage}
            alt="图片预览"
            width={1600}
            height={1200}
            unoptimized
          />
        </dialog>
      )}

      {editingImage && (
        <ImageEditor
          imageUrl={editingImage}
          onClose={() => {
            setEditingImage(null);
            editingImageMessageIdRef.current = null; // 清除消息ID
          }}
          onSave={(editedImage) => {
            // 检查是否为附件图片
            if (attachImages.includes(editingImage)) {
              setAttachImages(
                attachImages.map((img) =>
                  img === editingImage ? editedImage : img,
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
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  return <ChatInner key={session.id}></ChatInner>;
}
