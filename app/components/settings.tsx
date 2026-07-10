import { useState, useEffect, useMemo, type ReactNode } from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import CloseIcon from "../icons/close.svg";
import EditIcon from "../icons/edit.svg";
import ConfirmIcon from "../icons/confirm.svg";
import {
  Input,
  List,
  ListItem,
  Modal,
  PasswordInput,
  Select,
  SimpleSelector,
} from "./ui-lib";
import { ModelConfigList } from "./model-config";

import { IconButton } from "./button";
import { SubmitKey, Theme, useAppConfig } from "../store/config";
import { useAccessStore } from "../store/access";
import { useUpdateStore } from "../store/update";

import Locale, {
  AllLangs,
  ALL_LANG_OPTIONS,
  changeLang,
  getLang,
} from "../locales";
import {
  Anthropic,
  Azure,
  Baidu,
  Tencent,
  ByteDance,
  Alibaba,
  Moonshot,
  XAI,
  Google,
  GoogleSafetySettingsThreshold,
  OPENAI_BASE_URL,
  Path,
  ServiceProvider,
  SlotID,
  Stability,
  Iflytek,
  ChatGLM,
} from "../constant";
import { SearchService, usePromptStore } from "../store/prompt";
import { ErrorBoundary } from "./error";
import { InputRange } from "./input-range";
import { useNavigate } from "react-router-dom";
import { getClientConfig } from "../config/client";
import { createConfigFieldMeta } from "../utils/public-app-config";
import { UserPromptModal } from "./settings-user-prompt-modal";
import { DangerItems } from "./settings-danger-items";
import { SyncItems } from "./settings-sync-items";
import { useMobileScreen } from "../utils";

export function Settings() {
  return useSettingsView();
}

function SettingsSection(props: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={props.id} className={styles["settings-section"]}>
      <div className={styles["settings-section-head"]}>
        <h2>{props.title}</h2>
        <p>{props.description}</p>
      </div>
      {props.children}
    </section>
  );
}

function SettingsSelect<T extends string>(props: {
  ariaLabel: string;
  className?: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  const isMobileScreen = useMobileScreen();
  const [showSettingsSelectSheet, setShowSettingsSelectSheet] = useState(false);
  const selectedLabel =
    props.options.find((option) => option.value === props.value)?.label ??
    props.value;

  if (!isMobileScreen) {
    return (
      <Select
        className={props.className}
        aria-label={props.ariaLabel}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value as T)}
      >
        {props.options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <div className={props.className}>
      <button
        type="button"
        className={styles["settings-preference-select-trigger"]}
        aria-label={props.ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={showSettingsSelectSheet}
        onClick={() => setShowSettingsSelectSheet(true)}
      >
        <span>{selectedLabel}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {showSettingsSelectSheet && (
        <SimpleSelector
          items={props.options.map((option) => ({
            title: option.label,
            value: option.value,
          }))}
          onClose={() => setShowSettingsSelectSheet(false)}
          onSelection={(selection) => {
            const [value] = selection;
            if (value !== undefined) {
              props.onChange(value);
            }
          }}
        />
      )}
    </div>
  );
}

function useSettingsView() {
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCustomInstructionsModal, setShowCustomInstructionsModal] =
    useState(false);
  const config = useAppConfig();
  const updateConfig = config.update;
  const markModelConfigOverride = (fields: string[]) => {
    updateConfig((config) => {
      config.modelConfigMeta = { ...(config.modelConfigMeta ?? {}) };
      fields.forEach((field) => {
        config.modelConfigMeta![field] = createConfigFieldMeta({
          source: "user_override",
          publicConfig: config.serverConfigSnapshot,
        });
      });
    });
  };

  const updateStore = useUpdateStore();
  const accessStore = useAccessStore();
  const shouldHideBalanceQuery = useMemo(() => {
    const isOpenAiUrl = accessStore.openaiUrl.includes(OPENAI_BASE_URL);

    return (
      accessStore.hideBalanceQuery ||
      isOpenAiUrl ||
      accessStore.provider === ServiceProvider.Azure
    );
  }, [
    accessStore.hideBalanceQuery,
    accessStore.openaiUrl,
    accessStore.provider,
  ]);

  const usage = {
    used: updateStore.used,
    subscription: updateStore.subscription,
  };
  const [loadingUsage, setLoadingUsage] = useState(false);
  function checkUsage(force = false) {
    if (shouldHideBalanceQuery) {
      return;
    }

    setLoadingUsage(true);
    updateStore.updateUsage(force).finally(() => {
      setLoadingUsage(false);
    });
  }

  const enabledAccessControl = accessStore.enabledAccessControl();
  const clientConfig = useMemo(() => getClientConfig(), []);

  const promptStore = usePromptStore();
  const builtinCount = SearchService.count.builtin;
  const customCount = promptStore.getUserPrompts().length ?? 0;
  const customInstructionsDescriptionId =
    "settings-custom-instructions-description";
  const customInstructionsDescription =
    Locale.Settings.CustomInstructions.Content.SubTitle(
      config.customInstructions.length,
    );
  const [shouldShowPromptModal, setShowPromptModal] = useState(false);

  const showUsage = accessStore.isAuthorized();
  const apiResourceLocked =
    accessStore.hideUserApiKey || accessStore.lockedFields?.includes("apiKey");
  useEffect(() => {
    if (!showUsage || shouldHideBalanceQuery) return;

    setLoadingUsage(true);
    useUpdateStore
      .getState()
      .updateUsage(false)
      .finally(() => {
        setLoadingUsage(false);
      });
  }, [showUsage, shouldHideBalanceQuery]);

  useEffect(() => {
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(Path.Home);
      }
    };
    document.addEventListener("keydown", keydownEvent);
    return () => {
      document.removeEventListener("keydown", keydownEvent);
    };
  }, [navigate]);

  useEffect(() => {
    if (!clientConfig?.isApp) return;

    const accessState = useAccessStore.getState();
    if (accessState.useCustomConfig) return;

    accessState.update((state) => {
      state.useCustomConfig = true;
    });
  }, [clientConfig?.isApp]);

  const showAccessCode = enabledAccessControl && !clientConfig?.isApp;

  const accessCodeComponent = showAccessCode && (
    <ListItem
      title={Locale.Settings.Access.AccessCode.Title}
      subTitle={Locale.Settings.Access.AccessCode.SubTitle}
    >
      <PasswordInput
        value={accessStore.accessCode}
        type="text"
        placeholder={Locale.Settings.Access.AccessCode.Placeholder}
        onChange={(e) => {
          accessStore.update((access) => {
            access.accessCode = e.currentTarget.value;
            access.validatedAccessCode = "";
            access.accessCodeValidatedAt = 0;
          });
        }}
      />
    </ListItem>
  );

  const useCustomConfigComponent = // Conditionally render the following ListItem based on clientConfig.isApp
    !clientConfig?.isApp && ( // only show if isApp is false
      <ListItem
        title={Locale.Settings.Access.CustomEndpoint.Title}
        subTitle={
          accessStore.lockedFields?.includes("baseUrl")
            ? Locale.Settings.GPT56Capabilities.ConfigSource.Locked
            : Locale.Settings.Access.CustomEndpoint.SubTitle
        }
      >
        <input
          aria-label={Locale.Settings.Access.CustomEndpoint.Title}
          type="checkbox"
          checked={accessStore.useCustomConfig}
          disabled={accessStore.lockedFields?.includes("baseUrl")}
          onChange={(e) => {
            if (accessStore.lockedFields?.includes("baseUrl")) return;
            accessStore.update(
              (access) => (access.useCustomConfig = e.currentTarget.checked),
            );
          }}
        ></input>
      </ListItem>
    );

  const openAIConfigComponent = accessStore.provider ===
    ServiceProvider.OpenAI && (
    <>
      <ListItem
        title={Locale.Settings.Access.OpenAI.Endpoint.Title}
        subTitle={Locale.Settings.Access.OpenAI.Endpoint.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.OpenAI.Endpoint.Title}
          type="text"
          value={accessStore.openaiUrl}
          placeholder={OPENAI_BASE_URL}
          disabled={accessStore.lockedFields?.includes("baseUrl")}
          onChange={(e) => {
            if (accessStore.lockedFields?.includes("baseUrl")) return;
            accessStore.update(
              (access) => (access.openaiUrl = e.currentTarget.value),
            );
          }}
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.OpenAI.ApiKey.Title}
        subTitle={Locale.Settings.Access.OpenAI.ApiKey.SubTitle}
      >
        <PasswordInput
          aria={Locale.Settings.ShowPassword}
          aria-label={Locale.Settings.Access.OpenAI.ApiKey.Title}
          value={accessStore.openaiApiKey}
          type="text"
          placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
          disabled={
            accessStore.hideUserApiKey ||
            accessStore.lockedFields?.includes("apiKey")
          }
          onChange={(e) => {
            if (
              accessStore.hideUserApiKey ||
              accessStore.lockedFields?.includes("apiKey")
            ) {
              return;
            }
            accessStore.update(
              (access) => (access.openaiApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const azureConfigComponent = accessStore.provider ===
    ServiceProvider.Azure && (
    <>
      <ListItem
        title={Locale.Settings.Access.Azure.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Azure.Endpoint.SubTitle + Azure.ExampleEndpoint
        }
      >
        <input
          aria-label={Locale.Settings.Access.Azure.Endpoint.Title}
          type="text"
          value={accessStore.azureUrl}
          placeholder={Azure.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.azureUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Azure.ApiKey.Title}
        subTitle={Locale.Settings.Access.Azure.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Azure.ApiKey.Title}
          value={accessStore.azureApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Azure.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.azureApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Azure.ApiVerion.Title}
        subTitle={Locale.Settings.Access.Azure.ApiVerion.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Azure.ApiVerion.Title}
          type="text"
          value={accessStore.azureApiVersion}
          placeholder="2023-08-01-preview"
          onChange={(e) =>
            accessStore.update(
              (access) => (access.azureApiVersion = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
    </>
  );

  const googleConfigComponent = accessStore.provider ===
    ServiceProvider.Google && (
    <>
      <ListItem
        title={Locale.Settings.Access.Google.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Google.Endpoint.SubTitle +
          Google.ExampleEndpoint
        }
      >
        <input
          aria-label={Locale.Settings.Access.Google.Endpoint.Title}
          type="text"
          value={accessStore.googleUrl}
          placeholder={Google.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.googleUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Google.ApiKey.Title}
        subTitle={Locale.Settings.Access.Google.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Google.ApiKey.Title}
          value={accessStore.googleApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Google.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.googleApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Google.ApiVersion.Title}
        subTitle={Locale.Settings.Access.Google.ApiVersion.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Google.ApiVersion.Title}
          type="text"
          value={accessStore.googleApiVersion}
          placeholder="2023-08-01-preview"
          onChange={(e) =>
            accessStore.update(
              (access) => (access.googleApiVersion = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Google.GoogleSafetySettings.Title}
        subTitle={Locale.Settings.Access.Google.GoogleSafetySettings.SubTitle}
      >
        <Select
          className={styles["settings-access-select"]}
          aria-label={Locale.Settings.Access.Google.GoogleSafetySettings.Title}
          value={accessStore.googleSafetySettings}
          onChange={(e) => {
            accessStore.update(
              (access) =>
                (access.googleSafetySettings = e.target
                  .value as GoogleSafetySettingsThreshold),
            );
          }}
        >
          {Object.entries(GoogleSafetySettingsThreshold).map(([k, v]) => (
            <option value={v} key={k}>
              {k}
            </option>
          ))}
        </Select>
      </ListItem>
    </>
  );

  const anthropicConfigComponent = accessStore.provider ===
    ServiceProvider.Anthropic && (
    <>
      <ListItem
        title={Locale.Settings.Access.Anthropic.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Anthropic.Endpoint.SubTitle +
          Anthropic.ExampleEndpoint
        }
      >
        <input
          aria-label={Locale.Settings.Access.Anthropic.Endpoint.Title}
          type="text"
          value={accessStore.anthropicUrl}
          placeholder={Anthropic.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.anthropicUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Anthropic.ApiKey.Title}
        subTitle={Locale.Settings.Access.Anthropic.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Anthropic.ApiKey.Title}
          value={accessStore.anthropicApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Anthropic.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.anthropicApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Anthropic.ApiVerion.Title}
        subTitle={Locale.Settings.Access.Anthropic.ApiVerion.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Anthropic.ApiVerion.Title}
          type="text"
          value={accessStore.anthropicApiVersion}
          placeholder={Anthropic.Vision}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.anthropicApiVersion = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
    </>
  );

  const baiduConfigComponent = accessStore.provider ===
    ServiceProvider.Baidu && (
    <>
      <ListItem
        title={Locale.Settings.Access.Baidu.Endpoint.Title}
        subTitle={Locale.Settings.Access.Baidu.Endpoint.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Baidu.Endpoint.Title}
          type="text"
          value={accessStore.baiduUrl}
          placeholder={Baidu.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.baiduUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Baidu.ApiKey.Title}
        subTitle={Locale.Settings.Access.Baidu.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Baidu.ApiKey.Title}
          value={accessStore.baiduApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Baidu.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.baiduApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Baidu.SecretKey.Title}
        subTitle={Locale.Settings.Access.Baidu.SecretKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Baidu.SecretKey.Title}
          value={accessStore.baiduSecretKey}
          type="text"
          placeholder={Locale.Settings.Access.Baidu.SecretKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.baiduSecretKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const tencentConfigComponent = accessStore.provider ===
    ServiceProvider.Tencent && (
    <>
      <ListItem
        title={Locale.Settings.Access.Tencent.Endpoint.Title}
        subTitle={Locale.Settings.Access.Tencent.Endpoint.SubTitle}
      >
        <input
          aria-label={Locale.Settings.Access.Tencent.Endpoint.Title}
          type="text"
          value={accessStore.tencentUrl}
          placeholder={Tencent.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.tencentUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Tencent.ApiKey.Title}
        subTitle={Locale.Settings.Access.Tencent.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Tencent.ApiKey.Title}
          value={accessStore.tencentSecretId}
          type="text"
          placeholder={Locale.Settings.Access.Tencent.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.tencentSecretId = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Tencent.SecretKey.Title}
        subTitle={Locale.Settings.Access.Tencent.SecretKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Tencent.SecretKey.Title}
          value={accessStore.tencentSecretKey}
          type="text"
          placeholder={Locale.Settings.Access.Tencent.SecretKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.tencentSecretKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const byteDanceConfigComponent = accessStore.provider ===
    ServiceProvider.ByteDance && (
    <>
      <ListItem
        title={Locale.Settings.Access.ByteDance.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.ByteDance.Endpoint.SubTitle +
          ByteDance.ExampleEndpoint
        }
      >
        <input
          aria-label={Locale.Settings.Access.ByteDance.Endpoint.Title}
          type="text"
          value={accessStore.bytedanceUrl}
          placeholder={ByteDance.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.bytedanceUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.ByteDance.ApiKey.Title}
        subTitle={Locale.Settings.Access.ByteDance.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.ByteDance.ApiKey.Title}
          value={accessStore.bytedanceApiKey}
          type="text"
          placeholder={Locale.Settings.Access.ByteDance.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.bytedanceApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const alibabaConfigComponent = accessStore.provider ===
    ServiceProvider.Alibaba && (
    <>
      <ListItem
        title={Locale.Settings.Access.Alibaba.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Alibaba.Endpoint.SubTitle +
          Alibaba.ExampleEndpoint
        }
      >
        <input
          aria-label={Locale.Settings.Access.Alibaba.Endpoint.Title}
          type="text"
          value={accessStore.alibabaUrl}
          placeholder={Alibaba.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.alibabaUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Alibaba.ApiKey.Title}
        subTitle={Locale.Settings.Access.Alibaba.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Alibaba.ApiKey.Title}
          value={accessStore.alibabaApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Alibaba.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.alibabaApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const moonshotConfigComponent = accessStore.provider ===
    ServiceProvider.Moonshot && (
    <>
      <ListItem
        title={Locale.Settings.Access.Moonshot.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Moonshot.Endpoint.SubTitle +
          Moonshot.ExampleEndpoint
        }
      >
        <input
          aria-label={Locale.Settings.Access.Moonshot.Endpoint.Title}
          type="text"
          value={accessStore.moonshotUrl}
          placeholder={Moonshot.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.moonshotUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Moonshot.ApiKey.Title}
        subTitle={Locale.Settings.Access.Moonshot.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Moonshot.ApiKey.Title}
          value={accessStore.moonshotApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Moonshot.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.moonshotApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const XAIConfigComponent = accessStore.provider === ServiceProvider.XAI && (
    <>
      <ListItem
        title={Locale.Settings.Access.XAI.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.XAI.Endpoint.SubTitle + XAI.ExampleEndpoint
        }
      >
        <input
          aria-label={Locale.Settings.Access.XAI.Endpoint.Title}
          type="text"
          value={accessStore.xaiUrl}
          placeholder={XAI.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.xaiUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.XAI.ApiKey.Title}
        subTitle={Locale.Settings.Access.XAI.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.XAI.ApiKey.Title}
          value={accessStore.xaiApiKey}
          type="text"
          placeholder={Locale.Settings.Access.XAI.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.xaiApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const chatglmConfigComponent = accessStore.provider ===
    ServiceProvider.ChatGLM && (
    <>
      <ListItem
        title={Locale.Settings.Access.ChatGLM.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.ChatGLM.Endpoint.SubTitle +
          ChatGLM.ExampleEndpoint
        }
      >
        <input
          aria-label={Locale.Settings.Access.ChatGLM.Endpoint.Title}
          type="text"
          value={accessStore.chatglmUrl}
          placeholder={ChatGLM.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.chatglmUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.ChatGLM.ApiKey.Title}
        subTitle={Locale.Settings.Access.ChatGLM.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.ChatGLM.ApiKey.Title}
          value={accessStore.chatglmApiKey}
          type="text"
          placeholder={Locale.Settings.Access.ChatGLM.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.chatglmApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  const stabilityConfigComponent = accessStore.provider ===
    ServiceProvider.Stability && (
    <>
      <ListItem
        title={Locale.Settings.Access.Stability.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Stability.Endpoint.SubTitle +
          Stability.ExampleEndpoint
        }
      >
        <input
          aria-label={Locale.Settings.Access.Stability.Endpoint.Title}
          type="text"
          value={accessStore.stabilityUrl}
          placeholder={Stability.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.stabilityUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Stability.ApiKey.Title}
        subTitle={Locale.Settings.Access.Stability.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Stability.ApiKey.Title}
          value={accessStore.stabilityApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Stability.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.stabilityApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );
  const lflytekConfigComponent = accessStore.provider ===
    ServiceProvider.Iflytek && (
    <>
      <ListItem
        title={Locale.Settings.Access.Iflytek.Endpoint.Title}
        subTitle={
          Locale.Settings.Access.Iflytek.Endpoint.SubTitle +
          Iflytek.ExampleEndpoint
        }
      >
        <input
          aria-label={Locale.Settings.Access.Iflytek.Endpoint.Title}
          type="text"
          value={accessStore.iflytekUrl}
          placeholder={Iflytek.ExampleEndpoint}
          onChange={(e) =>
            accessStore.update(
              (access) => (access.iflytekUrl = e.currentTarget.value),
            )
          }
        ></input>
      </ListItem>
      <ListItem
        title={Locale.Settings.Access.Iflytek.ApiKey.Title}
        subTitle={Locale.Settings.Access.Iflytek.ApiKey.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Iflytek.ApiKey.Title}
          value={accessStore.iflytekApiKey}
          type="text"
          placeholder={Locale.Settings.Access.Iflytek.ApiKey.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.iflytekApiKey = e.currentTarget.value),
            );
          }}
        />
      </ListItem>

      <ListItem
        title={Locale.Settings.Access.Iflytek.ApiSecret.Title}
        subTitle={Locale.Settings.Access.Iflytek.ApiSecret.SubTitle}
      >
        <PasswordInput
          aria-label={Locale.Settings.Access.Iflytek.ApiSecret.Title}
          value={accessStore.iflytekApiSecret}
          type="text"
          placeholder={Locale.Settings.Access.Iflytek.ApiSecret.Placeholder}
          onChange={(e) => {
            accessStore.update(
              (access) => (access.iflytekApiSecret = e.currentTarget.value),
            );
          }}
        />
      </ListItem>
    </>
  );

  return (
    <ErrorBoundary>
      <div className={styles["settings-page"]}>
        <div className={styles["settings-page-head"]} data-tauri-drag-region>
          <div className={styles["settings-title-stack"]}>
            <h1>{Locale.Settings.Title}</h1>
            <p>{Locale.Settings.SubTitle}</p>
          </div>
          <IconButton
            className={styles["settings-close"]}
            aria={Locale.UI.Close}
            icon={<CloseIcon />}
            onClick={() => navigate(Path.Home)}
            bordered
          />
        </div>

        <div className={styles["settings"]}>
          <div className={styles["settings-stack"]}>
            <SettingsSection
              id="settings-section-general"
              title={Locale.Settings.Sections.General.Title}
              description={Locale.Settings.Sections.General.Description}
            >
              <div className={styles["settings-preferences-surface"]}>
                <List className={styles["settings-preference-list"]}>
                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.SendKey}
                  >
                    <SettingsSelect
                      className={styles["settings-preference-select"]}
                      ariaLabel={Locale.Settings.SendKey}
                      value={config.submitKey}
                      options={Object.values(SubmitKey).map((v) => ({
                        value: v,
                        label: v,
                      }))}
                      onChange={(value) => {
                        updateConfig(
                          (config) =>
                            (config.submitKey = value as any as SubmitKey),
                        );
                      }}
                    />
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.Theme}
                  >
                    <SettingsSelect
                      className={styles["settings-preference-select"]}
                      ariaLabel={Locale.Settings.Theme}
                      value={config.theme}
                      options={Object.values(Theme).map((v) => ({
                        value: v,
                        label: v,
                      }))}
                      onChange={(value) => {
                        updateConfig(
                          (config) => (config.theme = value as any as Theme),
                        );
                      }}
                    />
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.Lang.Name}
                  >
                    <SettingsSelect
                      className={styles["settings-preference-select"]}
                      ariaLabel={Locale.Settings.Lang.Name}
                      value={getLang()}
                      options={AllLangs.map((lang) => ({
                        value: lang,
                        label: ALL_LANG_OPTIONS[lang],
                      }))}
                      onChange={(value) => {
                        changeLang(value as any);
                      }}
                    />
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.FontSize.Title}
                    subTitle={Locale.Settings.FontSize.SubTitle}
                  >
                    <InputRange
                      className={styles["settings-preference-range"]}
                      aria={Locale.Settings.FontSize.Title}
                      title={`${config.fontSize ?? 14}px`}
                      value={config.fontSize}
                      min="12"
                      max="40"
                      step="1"
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.fontSize = Number.parseInt(
                              e.currentTarget.value,
                            )),
                        )
                      }
                    ></InputRange>
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.FontFamily.Title}
                    subTitle={Locale.Settings.FontFamily.SubTitle}
                  >
                    <input
                      aria-label={Locale.Settings.FontFamily.Title}
                      type="text"
                      value={config.fontFamily}
                      placeholder={Locale.Settings.FontFamily.Placeholder}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.fontFamily = e.currentTarget.value),
                        )
                      }
                    ></input>
                  </ListItem>
                </List>
              </div>
            </SettingsSection>

            <SettingsSection
              id="settings-section-dialog"
              title={Locale.Settings.Sections.Chat.Title}
              description={Locale.Settings.Sections.Chat.Description}
            >
              <div className={styles["settings-preferences-surface"]}>
                <List className={styles["settings-preference-list"]}>
                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.AutoGenerateTitle.Title}
                    subTitle={Locale.Settings.AutoGenerateTitle.SubTitle}
                  >
                    <input
                      aria-label={Locale.Settings.AutoGenerateTitle.Title}
                      type="checkbox"
                      checked={config.enableAutoGenerateTitle}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.enableAutoGenerateTitle =
                              e.currentTarget.checked),
                        )
                      }
                    ></input>
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.SendPreviewBubble.Title}
                    subTitle={Locale.Settings.SendPreviewBubble.SubTitle}
                  >
                    <input
                      aria-label={Locale.Settings.SendPreviewBubble.Title}
                      type="checkbox"
                      checked={config.sendPreviewBubble}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.sendPreviewBubble =
                              e.currentTarget.checked),
                        )
                      }
                    ></input>
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Mask.Config.Artifacts.Title}
                    subTitle={Locale.Mask.Config.Artifacts.SubTitle}
                  >
                    <input
                      aria-label={Locale.Mask.Config.Artifacts.Title}
                      type="checkbox"
                      checked={config.enableArtifacts}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.enableArtifacts = e.currentTarget.checked),
                        )
                      }
                    ></input>
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Mask.Config.CodeFold.Title}
                    subTitle={Locale.Mask.Config.CodeFold.SubTitle}
                  >
                    <input
                      type="checkbox"
                      aria-label={Locale.Mask.Config.CodeFold.Title}
                      checked={config.enableCodeFold}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.enableCodeFold = e.currentTarget.checked),
                        )
                      }
                    />
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.EnableModelSearch}
                    subTitle={Locale.Settings.EnableModelSearchSubTitle}
                  >
                    <input
                      type="checkbox"
                      aria-label={Locale.Settings.EnableModelSearch}
                      checked={config.enableModelSearch}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.enableModelSearch =
                              e.currentTarget.checked),
                        )
                      }
                    />
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.EnableThemeChange.Title}
                    subTitle={Locale.Settings.EnableThemeChange.SubTitle}
                  >
                    <input
                      type="checkbox"
                      aria-label={Locale.Settings.EnableThemeChange.Title}
                      checked={config.enableThemeChange}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.enableThemeChange =
                              e.currentTarget.checked),
                        )
                      }
                    />
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.EnablePromptHints.Title}
                    subTitle={Locale.Settings.EnablePromptHints.SubTitle}
                  >
                    <input
                      type="checkbox"
                      aria-label={Locale.Settings.EnablePromptHints.Title}
                      checked={config.enablePromptHints}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.enablePromptHints =
                              e.currentTarget.checked),
                        )
                      }
                    />
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.EnableClearContext.Title}
                    subTitle={Locale.Settings.EnableClearContext.SubTitle}
                  >
                    <input
                      type="checkbox"
                      aria-label={Locale.Settings.EnableClearContext.Title}
                      checked={config.enableClearContext}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.enableClearContext =
                              e.currentTarget.checked),
                        )
                      }
                    />
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.EnableShortcuts.Title}
                    subTitle={Locale.Settings.EnableShortcuts.SubTitle}
                  >
                    <input
                      type="checkbox"
                      aria-label={Locale.Settings.EnableShortcuts.Title}
                      checked={config.enableShortcuts}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.enableShortcuts = e.currentTarget.checked),
                        )
                      }
                    />
                  </ListItem>
                </List>
                <List className={styles["settings-preference-list"]}>
                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.CustomInstructions.Enable.Title}
                    subTitle={
                      Locale.Settings.CustomInstructions.Enable.SubTitle
                    }
                  >
                    <input
                      aria-label={
                        Locale.Settings.CustomInstructions.Enable.Title
                      }
                      type="checkbox"
                      checked={config.enableCustomInstructions}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.enableCustomInstructions =
                              e.currentTarget.checked),
                        )
                      }
                    />
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.CustomInstructions.Content.Title}
                    subTitle={customInstructionsDescription}
                    vertical
                  >
                    <>
                      <Input
                        aria-label={
                          Locale.Settings.CustomInstructions.Content.Title
                        }
                        aria-describedby={customInstructionsDescriptionId}
                        className={styles["custom-instructions-input"]}
                        value={config.customInstructions}
                        maxLength={1500}
                        rows={6}
                        disabled={!config.enableCustomInstructions}
                        placeholder={
                          Locale.Settings.CustomInstructions.Content.Placeholder
                        }
                        onInput={(e) =>
                          updateConfig(
                            (config) =>
                              (config.customInstructions =
                                e.currentTarget.value),
                          )
                        }
                      />
                      <div className={styles["custom-instructions-actions"]}>
                        <IconButton
                          className={styles["custom-instructions-edit-button"]}
                          aria={Locale.Settings.CustomInstructions.Content.Edit}
                          icon={<EditIcon />}
                          text={Locale.Settings.CustomInstructions.Content.Edit}
                          bordered
                          disabled={!config.enableCustomInstructions}
                          onClick={() => setShowCustomInstructionsModal(true)}
                        />
                      </div>
                      <span
                        id={customInstructionsDescriptionId}
                        className={styles["custom-instructions-status"]}
                      >
                        {customInstructionsDescription}
                      </span>
                    </>
                  </ListItem>
                </List>
              </div>
            </SettingsSection>

            <SettingsSection
              id="settings-section-data"
              title={Locale.Settings.Sections.Data.Title}
              description={Locale.Settings.Sections.Data.Description}
            >
              <div className={styles["settings-preferences-surface"]}>
                <SyncItems />

                <List className={styles["settings-preference-list"]}>
                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.Mask.Splash.Title}
                    subTitle={Locale.Settings.Mask.Splash.SubTitle}
                  >
                    <input
                      aria-label={Locale.Settings.Mask.Splash.Title}
                      type="checkbox"
                      checked={!config.dontShowMaskSplashScreen}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.dontShowMaskSplashScreen =
                              !e.currentTarget.checked),
                        )
                      }
                    ></input>
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.Mask.Builtin.Title}
                    subTitle={Locale.Settings.Mask.Builtin.SubTitle}
                  >
                    <input
                      aria-label={Locale.Settings.Mask.Builtin.Title}
                      type="checkbox"
                      checked={config.hideBuiltinMasks}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.hideBuiltinMasks = e.currentTarget.checked),
                        )
                      }
                    ></input>
                  </ListItem>
                </List>

                <List className={styles["settings-preference-list"]}>
                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.Prompt.Disable.Title}
                    subTitle={Locale.Settings.Prompt.Disable.SubTitle}
                  >
                    <input
                      aria-label={Locale.Settings.Prompt.Disable.Title}
                      type="checkbox"
                      checked={config.disablePromptHint}
                      onChange={(e) =>
                        updateConfig(
                          (config) =>
                            (config.disablePromptHint =
                              e.currentTarget.checked),
                        )
                      }
                    ></input>
                  </ListItem>

                  <ListItem
                    className={styles["settings-preference-item"]}
                    title={Locale.Settings.Prompt.List}
                    subTitle={Locale.Settings.Prompt.ListCount(
                      builtinCount,
                      customCount,
                    )}
                  >
                    <IconButton
                      className={styles["settings-preference-action"]}
                      aria={
                        Locale.Settings.Prompt.List +
                        Locale.Settings.Prompt.Edit
                      }
                      icon={<EditIcon />}
                      text={Locale.Settings.Prompt.Edit}
                      onClick={() => setShowPromptModal(true)}
                    />
                  </ListItem>
                </List>
              </div>
            </SettingsSection>

            <SettingsSection
              id="settings-section-model"
              title={Locale.Settings.Sections.Model.Title}
              description={Locale.Settings.Sections.Model.Description}
            >
              <div className={styles["settings-access-surface"]}>
                <List id={SlotID.CustomModel}>
                  {accessCodeComponent}

                  {!apiResourceLocked && (
                    <>
                      {useCustomConfigComponent}

                      {accessStore.useCustomConfig && (
                        <>
                          <ListItem
                            title={Locale.Settings.Access.Provider.Title}
                            subTitle={Locale.Settings.Access.Provider.SubTitle}
                          >
                            <Select
                              className={styles["settings-access-select"]}
                              aria-label={Locale.Settings.Access.Provider.Title}
                              value={accessStore.provider}
                              onChange={(e) => {
                                accessStore.update(
                                  (access) =>
                                    (access.provider = e.target
                                      .value as ServiceProvider),
                                );
                              }}
                            >
                              {Object.entries(ServiceProvider).map(([k, v]) => (
                                <option value={v} key={k}>
                                  {k}
                                </option>
                              ))}
                            </Select>
                          </ListItem>

                          {openAIConfigComponent}
                          {azureConfigComponent}
                          {googleConfigComponent}
                          {anthropicConfigComponent}
                          {baiduConfigComponent}
                          {byteDanceConfigComponent}
                          {alibabaConfigComponent}
                          {tencentConfigComponent}
                          {moonshotConfigComponent}
                          {stabilityConfigComponent}
                          {lflytekConfigComponent}
                          {XAIConfigComponent}
                          {chatglmConfigComponent}
                        </>
                      )}
                    </>
                  )}

                  {!shouldHideBalanceQuery && !clientConfig?.isApp ? (
                    <ListItem
                      title={Locale.Settings.Usage.Title}
                      subTitle={
                        showUsage
                          ? loadingUsage
                            ? Locale.Settings.Usage.IsChecking
                            : Locale.Settings.Usage.SubTitle(
                                usage?.used ?? "[?]",
                                usage?.subscription ?? "[?]",
                              )
                          : Locale.Settings.Usage.NoAccess
                      }
                    >
                      {!showUsage || loadingUsage ? (
                        <div />
                      ) : (
                        <IconButton
                          icon={<ResetIcon></ResetIcon>}
                          text={Locale.Settings.Usage.Check}
                          onClick={() => checkUsage(true)}
                        />
                      )}
                    </ListItem>
                  ) : null}
                </List>
              </div>

              <List>
                <ModelConfigList
                  modelConfig={config.modelConfig}
                  modelConfigMeta={config.modelConfigMeta}
                  markOverride={markModelConfigOverride}
                  updateConfig={(updater) => {
                    const modelConfig = { ...config.modelConfig };
                    updater(modelConfig);
                    config.update(
                      (config) => (config.modelConfig = modelConfig),
                    );
                  }}
                />
              </List>
            </SettingsSection>

            <SettingsSection
              id="settings-section-advanced"
              title={Locale.Settings.Sections.Advanced.Title}
              description={Locale.Settings.Sections.Advanced.Description}
            >
              <DangerItems />
            </SettingsSection>
          </div>
        </div>

        {shouldShowPromptModal && (
          <UserPromptModal onClose={() => setShowPromptModal(false)} />
        )}

        {showCustomInstructionsModal && (
          <div className="modal-mask">
            <Modal
              title={Locale.Settings.CustomInstructions.Content.Title}
              defaultMax
              onClose={() => setShowCustomInstructionsModal(false)}
              actions={[
                <IconButton
                  key="done"
                  icon={<ConfirmIcon />}
                  text={Locale.Settings.CustomInstructions.Content.Done}
                  bordered
                  onClick={() => setShowCustomInstructionsModal(false)}
                />,
              ]}
            >
              <Input
                aria-label={Locale.Settings.CustomInstructions.Content.Title}
                aria-describedby={customInstructionsDescriptionId}
                className={`${styles["custom-instructions-input"]} ${styles["custom-instructions-modal-input"]}`}
                value={config.customInstructions}
                maxLength={1500}
                rows={16}
                disabled={!config.enableCustomInstructions}
                placeholder={
                  Locale.Settings.CustomInstructions.Content.Placeholder
                }
                onInput={(e) =>
                  updateConfig(
                    (config) =>
                      (config.customInstructions = e.currentTarget.value),
                  )
                }
              />
            </Modal>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
