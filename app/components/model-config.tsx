import { ServiceProvider } from "@/app/constant";
import {
  ModalConfigValidator,
  useAppConfig,
  type ConfigSource,
  type ModelConfig,
  type ModelConfigMeta,
} from "../store/config";
import { useAccessStore } from "../store/access";

import Locale from "../locales";
import { InputRange } from "./input-range";
import { ListItem, Select } from "./ui-lib";
import { useAllModels } from "../utils/hooks";
import { groupBy } from "lodash-es";
import styles from "./model-config.module.scss";
import { getModelProvider } from "../utils/model";
import {
  applyOpenAIResponsesModelConstraints,
  applyConfiguredOpenAIResponsesReasoningEffortDefault,
  filterOpenAIResponsesReasoningEfforts,
  getMaxOutputTokensForReasoningEffort,
  getOpenAIResponsesMaxOutputTokensLimit,
  includeCurrentOpenAIResponsesReasoningEffort,
  isOpenAIGpt56ModelConfig,
  isOpenAIGpt5OrNewerModelConfig,
  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
  normalizeOpenAIResponsesReasoningEffort,
  OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY,
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
import type {
  OpenAIChatReasoningEffort,
  OpenAIResponsesInputImageDetail,
  OpenAIResponsesPromptCacheMode,
  OpenAIResponsesReasoningContext,
  OpenAIResponsesReasoningMode,
  OpenAIResponsesTextVerbosity,
} from "../utils/openai-responses";

const SOURCE_LABELS: Record<ConfigSource, string> = {
  admin_forced: Locale.Settings.GPT56Capabilities.ConfigSource.AdminForced,
  server_default: Locale.Settings.GPT56Capabilities.ConfigSource.ServerDefault,
  user_override: Locale.Settings.GPT56Capabilities.ConfigSource.UserOverride,
  conversation_override:
    Locale.Settings.GPT56Capabilities.ConfigSource.ConversationOverride,
  fallback: Locale.Settings.GPT56Capabilities.ConfigSource.Fallback,
};

const REASONING_LABELS: Record<OpenAIChatReasoningEffort, string> = {
  none: Locale.Settings.ReasoningEffort.None,
  low: Locale.Settings.ReasoningEffort.Low,
  medium: Locale.Settings.ReasoningEffort.Medium,
  high: Locale.Settings.ReasoningEffort.High,
  xhigh: Locale.Settings.ReasoningEffort.XHigh,
  max: Locale.Settings.ReasoningEffort.Max,
};

const TEXT_VERBOSITY_LABELS: Record<OpenAIResponsesTextVerbosity, string> = {
  low: Locale.Settings.TextVerbosity.Low,
  medium: Locale.Settings.TextVerbosity.Medium,
  high: Locale.Settings.TextVerbosity.High,
};

const REASONING_MODE_LABELS: Record<OpenAIResponsesReasoningMode, string> = {
  standard: Locale.Settings.GPT56Capabilities.ReasoningMode.Standard,
  pro: Locale.Settings.GPT56Capabilities.ReasoningMode.Pro,
};

const REASONING_CONTEXT_LABELS: Record<
  OpenAIResponsesReasoningContext,
  string
> = {
  auto: Locale.Settings.GPT56Capabilities.ReasoningContext.Auto,
  current_turn: Locale.Settings.GPT56Capabilities.ReasoningContext.CurrentTurn,
  all_turns: Locale.Settings.GPT56Capabilities.ReasoningContext.AllTurns,
};

const INPUT_IMAGE_DETAIL_LABELS: Record<
  OpenAIResponsesInputImageDetail,
  string
> = {
  low: Locale.Settings.GPT56Capabilities.InputImageDetail.Low,
  high: Locale.Settings.GPT56Capabilities.InputImageDetail.High,
  original: Locale.Settings.GPT56Capabilities.InputImageDetail.Original,
  auto: Locale.Settings.GPT56Capabilities.InputImageDetail.Auto,
};

const PROMPT_CACHE_MODE_LABELS: Record<OpenAIResponsesPromptCacheMode, string> =
  {
    disabled: Locale.Settings.GPT56Capabilities.PromptCacheMode.Disabled,
    implicit: Locale.Settings.GPT56Capabilities.PromptCacheMode.Implicit,
    explicit: Locale.Settings.GPT56Capabilities.PromptCacheMode.Explicit,
  };

export function ModelConfigList(props: {
  modelConfig: ModelConfig;
  updateConfig: (updater: (config: ModelConfig) => void) => void;
  modelConfigMeta?: ModelConfigMeta;
  markOverride?: (fields: string[]) => void;
}) {
  return useModelConfigListView(props);
}

function useModelConfigListView(props: {
  modelConfig: ModelConfig;
  updateConfig: (updater: (config: ModelConfig) => void) => void;
  modelConfigMeta?: ModelConfigMeta;
  markOverride?: (fields: string[]) => void;
}) {
  const accessStore = useAccessStore();
  const appConfig = useAppConfig();
  const modelConfigMeta =
    props.modelConfigMeta ?? appConfig.modelConfigMeta ?? {};
  const lockedFields = new Set(accessStore.lockedFields ?? []);
  const allowedModels = new Set(accessStore.allowedModels ?? []);
  const isLocked = (field: string) =>
    modelConfigMeta[field]?.locked || lockedFields.has(field);
  const sourceText = (field: string) => {
    const source = isLocked(field)
      ? "admin_forced"
      : modelConfigMeta[field]?.source ?? "fallback";
    const sourceLocale = Locale.Settings.GPT56Capabilities.ConfigSource;
    const text = `${sourceLocale.Prefix}${SOURCE_LABELS[source]}`;
    return isLocked(field)
      ? `${text}${sourceLocale.Separator}${sourceLocale.Locked}`
      : text;
  };
  const withSourceText = (description: string, field: string) =>
    `${description}${
      Locale.Settings.GPT56Capabilities.ConfigSource.Separator
    }${sourceText(field)}`;
  const updateUnlocked = (
    fields: string[],
    updater: (config: ModelConfig) => void,
  ) => {
    if (fields.some((field) => isLocked(field))) return;
    props.updateConfig(updater);
    props.markOverride?.(fields);
  };
  const allModels = useAllModels();
  const groupModels = groupBy(
    allModels.filter(
      (v) =>
        v.available &&
        (allowedModels.size === 0 ||
          allowedModels.has(`${v.name}@${v.provider?.providerName}`)),
    ),
    "provider.providerName",
  );
  const value = `${props.modelConfig.model}@${props.modelConfig?.providerName}`;
  const compressModelValue = `${props.modelConfig.compressModel}@${props.modelConfig?.compressProviderName}`;
  const isOpenAIGpt5OrNewer = isOpenAIGpt5OrNewerModelConfig({
    model: props.modelConfig.model,
    providerName: props.modelConfig?.providerName,
  });
  const isOpenAIGpt56 = isOpenAIGpt56ModelConfig({
    model: props.modelConfig.model,
    providerName: props.modelConfig?.providerName,
  });
  const isOpenAIImageGeneration = isOpenAIImageGenerationModelConfig({
    model: props.modelConfig.model,
    providerName: props.modelConfig?.providerName,
  });
  const isDalle3Model = isDalle3(props.modelConfig.model);
  const imageOptions = getOpenAIImageGenerationOptions(props.modelConfig.model);
  const imageSizeOptions = imageOptions.sizes;
  const imageQualityOptions = imageOptions.qualities;
  const currentImageSize = normalizeOpenAIImageSize(
    props.modelConfig.model,
    props.modelConfig.size,
  );
  const currentImageQuality = normalizeOpenAIImageQuality(
    props.modelConfig.model,
    props.modelConfig.quality,
  );
  const reasoningEffortOptions = filterOpenAIResponsesReasoningEfforts(
    props.modelConfig.model,
    accessStore.serverConfigSnapshot?.reasoningEffortAllowlist,
  );
  const reasoningEffort = normalizeOpenAIResponsesReasoningEffort(
    props.modelConfig.reasoningEffort ??
      OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
    props.modelConfig.model,
  );
  const visibleReasoningEffortOptions =
    includeCurrentOpenAIResponsesReasoningEffort(
      reasoningEffortOptions,
      reasoningEffort,
    );
  const getReasoningMaxOutputTokens = (effort: OpenAIChatReasoningEffort) =>
    accessStore.openaiMaxOutputTokens ??
    getMaxOutputTokensForReasoningEffort(effort);
  const forcedMaxOutputTokens =
    typeof accessStore.openaiMaxOutputTokens === "number";
  const maxOutputTokensValue =
    accessStore.openaiMaxOutputTokens ?? props.modelConfig.max_output_tokens;
  const maxOutputTokensLimit = getOpenAIResponsesMaxOutputTokensLimit(
    props.modelConfig.model,
  );
  const textVerbosity = (props.modelConfig.textVerbosity ||
    accessStore.openaiTextVerbosity ||
    OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY) as OpenAIResponsesTextVerbosity;
  const reasoningMode = ModalConfigValidator.reasoningMode(
    props.modelConfig.reasoningMode ?? "",
  );
  const reasoningContext = ModalConfigValidator.reasoningContext(
    props.modelConfig.reasoningContext ?? "",
  );
  const inputImageDetail = ModalConfigValidator.inputImageDetail(
    props.modelConfig.inputImageDetail ?? "",
  );
  const promptCacheMode = ModalConfigValidator.promptCacheMode(
    props.modelConfig.promptCacheMode ?? "",
  );
  const promptCacheKey = ModalConfigValidator.promptCacheKey(
    props.modelConfig.promptCacheKey ?? "",
  );

  return (
    <>
      <ListItem title={Locale.Settings.Model} subTitle={sourceText("model")}>
        <Select
          aria-label={Locale.Settings.Model}
          value={value}
          align="left"
          disabled={isLocked("model") || isLocked("providerName")}
          onChange={(e) => {
            if (isLocked("model") || isLocked("providerName")) return;
            const [model, providerName] = getModelProvider(
              e.currentTarget.value,
            );
            updateUnlocked(["model", "providerName"], (config) => {
              config.model = ModalConfigValidator.model(model);
              config.providerName = providerName as ServiceProvider;
              applyConfiguredOpenAIResponsesReasoningEffortDefault({
                config,
                configMeta: modelConfigMeta,
                defaults:
                  accessStore.serverConfigSnapshot?.reasoningEffortDefaults,
              });
              applyOpenAIResponsesModelConstraints(config);
              applyOpenAIImageGenerationDefaults(config);
            });
          }}
        >
          {Object.keys(groupModels).map((providerName) => (
            <optgroup label={providerName} key={providerName}>
              {groupModels[providerName].map((v) => (
                <option
                  value={`${v.name}@${v.provider?.providerName}`}
                  key={`${v.name}@${v.provider?.providerName}`}
                >
                  {v.displayName}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </ListItem>

      {isOpenAIImageGeneration ? (
        <>
          <ListItem
            title={Locale.Settings.ImageGeneration.Size}
            subTitle={sourceText("size")}
          >
            <Select
              aria-label={Locale.Settings.ImageGeneration.Size}
              value={currentImageSize}
              onChange={(e) => {
                updateUnlocked(["size"], (config) => {
                  config.size = e.currentTarget.value as typeof config.size;
                });
              }}
            >
              {imageSizeOptions.map((size) => (
                <option value={size} key={size}>
                  {Locale.Settings.ImageGeneration.SizeOption(size)}
                </option>
              ))}
            </Select>
          </ListItem>
          {imageQualityOptions.length > 0 && (
            <ListItem
              title={Locale.Settings.ImageGeneration.Quality}
              subTitle={sourceText("quality")}
            >
              <Select
                aria-label={Locale.Settings.ImageGeneration.Quality}
                value={currentImageQuality}
                onChange={(e) => {
                  updateUnlocked(["quality"], (config) => {
                    config.quality = e.currentTarget
                      .value as typeof config.quality;
                  });
                }}
              >
                {imageQualityOptions.map((quality) => (
                  <option value={quality} key={quality}>
                    {Locale.Settings.ImageGeneration.QualityOption(quality)}
                  </option>
                ))}
              </Select>
            </ListItem>
          )}
          {isDalle3Model && (
            <ListItem
              title={Locale.SdPanel.ImageStyle}
              subTitle={sourceText("style")}
            >
              <Select
                aria-label={Locale.SdPanel.ImageStyle}
                value={props.modelConfig.style ?? "vivid"}
                onChange={(e) => {
                  updateUnlocked(["style"], (config) => {
                    config.style = e.currentTarget.value as typeof config.style;
                  });
                }}
              >
                {DALLE3_IMAGE_STYLES.map((style) => (
                  <option value={style} key={style}>
                    {style}
                  </option>
                ))}
              </Select>
            </ListItem>
          )}
        </>
      ) : isOpenAIGpt5OrNewer ? (
        <>
          {visibleReasoningEffortOptions.length > 0 && (
            <ListItem
              title={Locale.Settings.ReasoningEffort.Title}
              subTitle={withSourceText(
                Locale.Settings.ReasoningEffort.SubTitle,
                "reasoningEffort",
              )}
            >
              <Select
                aria-label={Locale.Settings.ReasoningEffort.Title}
                value={reasoningEffort}
                disabled={
                  isLocked("reasoningEffort") ||
                  reasoningEffortOptions.length === 0
                }
                onChange={(e) => {
                  updateUnlocked(["reasoningEffort"], (config) => {
                    const effort = e.currentTarget
                      .value as OpenAIChatReasoningEffort;
                    config.reasoningEffort = effort;
                    if (!isLocked("max_output_tokens")) {
                      config.max_output_tokens =
                        getReasoningMaxOutputTokens(effort);
                    }
                  });
                }}
              >
                {visibleReasoningEffortOptions.map((effort) => (
                  <option
                    value={effort}
                    key={effort}
                    disabled={
                      !reasoningEffortOptions.some(
                        (allowedEffort) => allowedEffort === effort,
                      )
                    }
                  >
                    {REASONING_LABELS[effort]}
                  </option>
                ))}
              </Select>
            </ListItem>
          )}
          <ListItem
            title={Locale.Settings.TextVerbosity.Title}
            subTitle={withSourceText(
              Locale.Settings.TextVerbosity.SubTitle,
              "textVerbosity",
            )}
          >
            <Select
              aria-label={Locale.Settings.TextVerbosity.Title}
              value={textVerbosity}
              disabled={isLocked("textVerbosity")}
              onChange={(e) => {
                updateUnlocked(["textVerbosity"], (config) => {
                  config.textVerbosity = ModalConfigValidator.textVerbosity(
                    e.currentTarget.value,
                  );
                });
              }}
            >
              {(["low", "medium", "high"] as const).map((verbosity) => (
                <option value={verbosity} key={verbosity}>
                  {TEXT_VERBOSITY_LABELS[verbosity]}
                </option>
              ))}
            </Select>
          </ListItem>
          {isOpenAIGpt56 && (
            <>
              <ListItem
                title={Locale.Settings.GPT56Capabilities.ReasoningMode.Title}
                subTitle={`${
                  Locale.Settings.GPT56Capabilities.ReasoningMode.SubTitle
                }${
                  Locale.Settings.GPT56Capabilities.ConfigSource.Separator
                }${sourceText("reasoningMode")}`}
              >
                <Select
                  className={styles["gpt56-capability-select"]}
                  aria-label={
                    Locale.Settings.GPT56Capabilities.ReasoningMode.Title
                  }
                  value={reasoningMode}
                  disabled={isLocked("reasoningMode")}
                  onChange={(e) => {
                    updateUnlocked(["reasoningMode"], (config) => {
                      config.reasoningMode = ModalConfigValidator.reasoningMode(
                        e.currentTarget.value,
                      );
                    });
                  }}
                >
                  {(["standard", "pro"] as const).map((mode) => (
                    <option value={mode} key={mode}>
                      {REASONING_MODE_LABELS[mode]}
                    </option>
                  ))}
                </Select>
              </ListItem>
              <ListItem
                title={Locale.Settings.GPT56Capabilities.ReasoningContext.Title}
                subTitle={`${
                  Locale.Settings.GPT56Capabilities.ReasoningContext.SubTitle
                }${
                  Locale.Settings.GPT56Capabilities.ConfigSource.Separator
                }${sourceText("reasoningContext")}`}
              >
                <Select
                  className={styles["gpt56-capability-select"]}
                  aria-label={
                    Locale.Settings.GPT56Capabilities.ReasoningContext.Title
                  }
                  value={reasoningContext}
                  disabled={isLocked("reasoningContext")}
                  onChange={(e) => {
                    updateUnlocked(["reasoningContext"], (config) => {
                      config.reasoningContext =
                        ModalConfigValidator.reasoningContext(
                          e.currentTarget.value,
                        );
                    });
                  }}
                >
                  {(["auto", "current_turn", "all_turns"] as const).map(
                    (context) => (
                      <option value={context} key={context}>
                        {REASONING_CONTEXT_LABELS[context]}
                      </option>
                    ),
                  )}
                </Select>
              </ListItem>
              <ListItem
                title={Locale.Settings.GPT56Capabilities.InputImageDetail.Title}
                subTitle={`${
                  Locale.Settings.GPT56Capabilities.InputImageDetail.SubTitle
                }${
                  Locale.Settings.GPT56Capabilities.ConfigSource.Separator
                }${sourceText("inputImageDetail")}`}
              >
                <Select
                  className={styles["gpt56-capability-select"]}
                  aria-label={
                    Locale.Settings.GPT56Capabilities.InputImageDetail.Title
                  }
                  value={inputImageDetail}
                  disabled={isLocked("inputImageDetail")}
                  onChange={(e) => {
                    updateUnlocked(["inputImageDetail"], (config) => {
                      config.inputImageDetail =
                        ModalConfigValidator.inputImageDetail(
                          e.currentTarget.value,
                        );
                    });
                  }}
                >
                  {(["low", "high", "original", "auto"] as const).map(
                    (detail) => (
                      <option value={detail} key={detail}>
                        {INPUT_IMAGE_DETAIL_LABELS[detail]}
                      </option>
                    ),
                  )}
                </Select>
              </ListItem>
              <ListItem
                title={Locale.Settings.GPT56Capabilities.PromptCacheMode.Title}
                subTitle={`${
                  Locale.Settings.GPT56Capabilities.PromptCacheMode.SubTitle
                }${
                  Locale.Settings.GPT56Capabilities.ConfigSource.Separator
                }${sourceText("promptCacheMode")}`}
              >
                <Select
                  className={styles["gpt56-capability-select"]}
                  aria-label={
                    Locale.Settings.GPT56Capabilities.PromptCacheMode.Title
                  }
                  value={promptCacheMode}
                  disabled={isLocked("promptCacheMode")}
                  onChange={(e) => {
                    updateUnlocked(["promptCacheMode"], (config) => {
                      config.promptCacheMode =
                        ModalConfigValidator.promptCacheMode(
                          e.currentTarget.value,
                        );
                    });
                  }}
                >
                  {(["disabled", "implicit", "explicit"] as const).map(
                    (mode) => (
                      <option value={mode} key={mode}>
                        {PROMPT_CACHE_MODE_LABELS[mode]}
                      </option>
                    ),
                  )}
                </Select>
              </ListItem>
              <ListItem
                title={Locale.Settings.GPT56Capabilities.PromptCacheKey.Title}
                subTitle={`${
                  Locale.Settings.GPT56Capabilities.PromptCacheKey.SubTitle
                }${
                  Locale.Settings.GPT56Capabilities.ConfigSource.Separator
                }${sourceText("promptCacheKey")}`}
              >
                <input
                  aria-label={
                    Locale.Settings.GPT56Capabilities.PromptCacheKey.Title
                  }
                  type="text"
                  value={promptCacheKey}
                  disabled={
                    isLocked("promptCacheKey") || promptCacheMode === "disabled"
                  }
                  onChange={(e) => {
                    updateUnlocked(["promptCacheKey"], (config) => {
                      config.promptCacheKey = e.currentTarget.value;
                    });
                  }}
                />
              </ListItem>
            </>
          )}
        </>
      ) : (
        <>
          <ListItem
            title={Locale.Settings.Temperature.Title}
            subTitle={withSourceText(
              Locale.Settings.Temperature.SubTitle,
              "temperature",
            )}
          >
            <InputRange
              aria={Locale.Settings.Temperature.Title}
              value={props.modelConfig.temperature?.toFixed(1)}
              min="0"
              max="1"
              step="0.1"
              disabled={isLocked("temperature")}
              onChange={(e) => {
                updateUnlocked(["temperature"], (config) => {
                  config.temperature = ModalConfigValidator.temperature(
                    e.currentTarget.valueAsNumber,
                  );
                });
              }}
            />
          </ListItem>
          <ListItem
            title={Locale.Settings.TopP.Title}
            subTitle={withSourceText(Locale.Settings.TopP.SubTitle, "top_p")}
          >
            <InputRange
              aria={Locale.Settings.TopP.Title}
              value={(props.modelConfig.top_p ?? 1).toFixed(1)}
              min="0"
              max="1"
              step="0.1"
              onChange={(e) => {
                updateUnlocked(["top_p"], (config) => {
                  config.top_p = ModalConfigValidator.top_p(
                    e.currentTarget.valueAsNumber,
                  );
                });
              }}
            />
          </ListItem>
        </>
      )}

      {!isOpenAIImageGeneration && (
        <ListItem
          title={Locale.Settings.MaxTokens.Title}
          subTitle={withSourceText(
            Locale.Settings.MaxTokens.SubTitle,
            "max_output_tokens",
          )}
        >
          <input
            aria-label={Locale.Settings.MaxTokens.Title}
            type="number"
            min={1024}
            max={maxOutputTokensLimit}
            value={Math.min(maxOutputTokensValue, maxOutputTokensLimit)}
            disabled={forcedMaxOutputTokens || isLocked("max_output_tokens")}
            onChange={(e) => {
              if (forcedMaxOutputTokens || isLocked("max_output_tokens"))
                return;
              updateUnlocked(["max_output_tokens"], (config) => {
                config.max_output_tokens =
                  ModalConfigValidator.max_output_tokens(
                    e.currentTarget.valueAsNumber,
                    config.model,
                  );
              });
            }}
          />
        </ListItem>
      )}

      {props.modelConfig?.providerName == ServiceProvider.Google ||
      isOpenAIImageGeneration ? null : (
        <>
          {!isOpenAIGpt5OrNewer && (
            <>
              <ListItem
                title={Locale.Settings.PresencePenalty.Title}
                subTitle={Locale.Settings.PresencePenalty.SubTitle}
              >
                <InputRange
                  aria={Locale.Settings.PresencePenalty.Title}
                  value={props.modelConfig.presence_penalty?.toFixed(1)}
                  min="-2"
                  max="2"
                  step="0.1"
                  onChange={(e) => {
                    props.updateConfig((config) => {
                      config.presence_penalty =
                        ModalConfigValidator.presence_penalty(
                          e.currentTarget.valueAsNumber,
                        );
                    });
                    props.markOverride?.(["presence_penalty"]);
                  }}
                />
              </ListItem>

              <ListItem
                title={Locale.Settings.FrequencyPenalty.Title}
                subTitle={Locale.Settings.FrequencyPenalty.SubTitle}
              >
                <InputRange
                  aria={Locale.Settings.FrequencyPenalty.Title}
                  value={props.modelConfig.frequency_penalty?.toFixed(1)}
                  min="-2"
                  max="2"
                  step="0.1"
                  onChange={(e) => {
                    props.updateConfig((config) => {
                      config.frequency_penalty =
                        ModalConfigValidator.frequency_penalty(
                          e.currentTarget.valueAsNumber,
                        );
                    });
                    props.markOverride?.(["frequency_penalty"]);
                  }}
                />
              </ListItem>
            </>
          )}

          <ListItem
            title={Locale.Settings.InjectSystemPrompts.Title}
            subTitle={withSourceText(
              Locale.Settings.InjectSystemPrompts.SubTitle,
              "enableInjectSystemPrompts",
            )}
          >
            <input
              aria-label={Locale.Settings.InjectSystemPrompts.Title}
              type="checkbox"
              checked={props.modelConfig.enableInjectSystemPrompts}
              onChange={(e) => {
                updateUnlocked(["enableInjectSystemPrompts"], (config) => {
                  config.enableInjectSystemPrompts = e.currentTarget.checked;
                });
              }}
            />
          </ListItem>

          <ListItem
            title={Locale.Settings.InputTemplate.Title}
            subTitle={withSourceText(
              Locale.Settings.InputTemplate.SubTitle,
              "template",
            )}
          >
            <input
              aria-label={Locale.Settings.InputTemplate.Title}
              type="text"
              value={props.modelConfig.template}
              onChange={(e) => {
                updateUnlocked(["template"], (config) => {
                  config.template = e.currentTarget.value;
                });
              }}
            />
          </ListItem>
        </>
      )}

      {!isOpenAIImageGeneration && (
        <>
          <ListItem
            title={Locale.Settings.HistoryCount.Title}
            subTitle={withSourceText(
              Locale.Settings.HistoryCount.SubTitle,
              "historyMessageCount",
            )}
          >
            <InputRange
              aria={Locale.Settings.HistoryCount.Title}
              title={props.modelConfig.historyMessageCount.toString()}
              value={props.modelConfig.historyMessageCount}
              min="0"
              max="64"
              step="1"
              onChange={(e) => {
                updateUnlocked(["historyMessageCount"], (config) => {
                  config.historyMessageCount = e.target.valueAsNumber;
                });
              }}
            />
          </ListItem>

          <ListItem
            title={Locale.Settings.CompressThreshold.Title}
            subTitle={withSourceText(
              Locale.Settings.CompressThreshold.SubTitle,
              "compressMessageLengthThreshold",
            )}
          >
            <input
              aria-label={Locale.Settings.CompressThreshold.Title}
              type="number"
              min={500}
              max={4000}
              value={props.modelConfig.compressMessageLengthThreshold}
              disabled={isLocked("compressMessageLengthThreshold")}
              onChange={(e) => {
                updateUnlocked(["compressMessageLengthThreshold"], (config) => {
                  config.compressMessageLengthThreshold =
                    ModalConfigValidator.compressMessageLengthThreshold(
                      e.currentTarget.valueAsNumber,
                    );
                });
              }}
            />
          </ListItem>

          <ListItem
            title={Locale.Memory.Title}
            subTitle={withSourceText(Locale.Memory.Send, "sendMemory")}
          >
            <input
              aria-label={Locale.Memory.Title}
              type="checkbox"
              checked={props.modelConfig.sendMemory}
              onChange={(e) => {
                updateUnlocked(["sendMemory"], (config) => {
                  config.sendMemory = e.currentTarget.checked;
                });
              }}
            />
          </ListItem>

          <ListItem
            title={Locale.Settings.CompressModel.Title}
            subTitle={Locale.Settings.CompressModel.SubTitle}
          >
            <Select
              className={styles["select-compress-model"]}
              aria-label={Locale.Settings.CompressModel.Title}
              value={compressModelValue}
              onChange={(e) => {
                const [model, providerName] = getModelProvider(
                  e.currentTarget.value,
                );
                props.updateConfig((config) => {
                  config.compressModel = ModalConfigValidator.model(model);
                  config.compressProviderName = providerName as ServiceProvider;
                });
                props.markOverride?.(["compressModel", "compressProviderName"]);
              }}
            >
              {allModels.flatMap((v) =>
                v.available
                  ? [
                      <option
                        value={`${v.name}@${v.provider?.providerName}`}
                        key={`${v.name}@${v.provider?.providerName}`}
                      >
                        {v.displayName}({v.provider?.providerName})
                      </option>,
                    ]
                  : [],
              )}
            </Select>
          </ListItem>
        </>
      )}
    </>
  );
}
