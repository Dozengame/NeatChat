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
  getMaxOutputTokensForReasoningEffort,
  isOpenAIGpt5OrNewerModelConfig,
  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT,
  OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY,
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
import type {
  OpenAIChatReasoningEffort,
  OpenAIResponsesTextVerbosity,
} from "../utils/openai-responses";

const SOURCE_LABELS: Record<ConfigSource, string> = {
  admin_forced: "管理员锁定",
  server_default: "管理员默认",
  user_override: "个人设置",
  conversation_override: "当前会话",
  fallback: "系统默认",
};

const REASONING_LABELS: Record<OpenAIChatReasoningEffort, string> = {
  low: Locale.Settings.ReasoningEffort.Low,
  medium: Locale.Settings.ReasoningEffort.Medium,
  high: Locale.Settings.ReasoningEffort.High,
};

const TEXT_VERBOSITY_LABELS: Record<OpenAIResponsesTextVerbosity, string> = {
  low: "简洁",
  medium: "适中",
  high: "详细",
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
    const text = `来源：${SOURCE_LABELS[source]}`;
    return isLocked(field) ? `${text}。该项已由管理员锁定` : text;
  };
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
  const isOpenAIImageGeneration = isOpenAIImageGenerationModelConfig({
    model: props.modelConfig.model,
    providerName: props.modelConfig?.providerName,
  });
  const isGptImageModel = isGptImageGenerationModel(props.modelConfig.model);
  const isDalle3Model = isDalle3(props.modelConfig.model);
  const imageSizeOptions = isGptImageModel
    ? GPT_IMAGE_2_SIZES
    : isDalle3Model
    ? DALLE3_IMAGE_SIZES
    : DALLE_IMAGE_COMPATIBLE_SIZES;
  const imageQualityOptions = isGptImageModel
    ? GPT_IMAGE_2_QUALITIES
    : isDalle3Model
    ? DALLE3_IMAGE_QUALITIES
    : [];
  const reasoningEffort = (props.modelConfig.reasoningEffort ??
    OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT) as OpenAIChatReasoningEffort;
  const getReasoningMaxOutputTokens = (effort: OpenAIChatReasoningEffort) =>
    accessStore.openaiMaxOutputTokens ??
    getMaxOutputTokensForReasoningEffort(effort);
  const forcedMaxOutputTokens =
    typeof accessStore.openaiMaxOutputTokens === "number";
  const maxOutputTokensValue =
    accessStore.openaiMaxOutputTokens ?? props.modelConfig.max_output_tokens;
  const textVerbosity = (props.modelConfig.textVerbosity ||
    accessStore.openaiTextVerbosity ||
    OPENAI_RESPONSES_DEFAULT_TEXT_VERBOSITY) as OpenAIResponsesTextVerbosity;

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
              applyOpenAIImageGenerationDefaults(config);
              if (
                isOpenAIGpt5OrNewerModelConfig({
                  model: config.model,
                  providerName: config.providerName,
                }) &&
                !isLocked("max_output_tokens")
              ) {
                const effort =
                  config.reasoningEffort ??
                  OPENAI_RESPONSES_DEFAULT_REASONING_EFFORT;
                config.max_output_tokens = getReasoningMaxOutputTokens(effort);
              }
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
          <ListItem title="图像尺寸" subTitle={sourceText("size")}>
            <Select
              aria-label="图像尺寸"
              value={props.modelConfig.size}
              onChange={(e) => {
                updateUnlocked(["size"], (config) => {
                  config.size = e.currentTarget.value as typeof config.size;
                });
              }}
            >
              {imageSizeOptions.map((size) => (
                <option value={size} key={size}>
                  {size}
                </option>
              ))}
            </Select>
          </ListItem>
          {imageQualityOptions.length > 0 && (
            <ListItem title="图像质量" subTitle={sourceText("quality")}>
              <Select
                aria-label="图像质量"
                value={props.modelConfig.quality}
                onChange={(e) => {
                  updateUnlocked(["quality"], (config) => {
                    config.quality = e.currentTarget
                      .value as typeof config.quality;
                  });
                }}
              >
                {imageQualityOptions.map((quality) => (
                  <option value={quality} key={quality}>
                    {quality}
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
          <ListItem
            title={Locale.Settings.ReasoningEffort.Title}
            subTitle={`${
              Locale.Settings.ReasoningEffort.SubTitle
            }。${sourceText("reasoningEffort")}`}
          >
            <Select
              aria-label={Locale.Settings.ReasoningEffort.Title}
              value={reasoningEffort}
              disabled={isLocked("reasoningEffort")}
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
              {(["low", "medium", "high"] as const).map((effort) => (
                <option value={effort} key={effort}>
                  {REASONING_LABELS[effort]}
                </option>
              ))}
            </Select>
          </ListItem>
          <ListItem
            title="回答详细程度 (text.verbosity)"
            subTitle={`控制 Responses API 的回答详略。${sourceText(
              "textVerbosity",
            )}`}
          >
            <Select
              aria-label="回答详细程度 (text.verbosity)"
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
        </>
      ) : (
        <>
          <ListItem
            title={Locale.Settings.Temperature.Title}
            subTitle={`${Locale.Settings.Temperature.SubTitle}。${sourceText(
              "temperature",
            )}`}
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
            subTitle={`${Locale.Settings.TopP.SubTitle}。${sourceText(
              "top_p",
            )}`}
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
          subTitle={`${Locale.Settings.MaxTokens.SubTitle}。${sourceText(
            "max_output_tokens",
          )}`}
        >
          <input
            aria-label={Locale.Settings.MaxTokens.Title}
            type="number"
            min={1024}
            max={512000}
            value={maxOutputTokensValue}
            disabled={forcedMaxOutputTokens || isLocked("max_output_tokens")}
            onChange={(e) => {
              if (forcedMaxOutputTokens || isLocked("max_output_tokens"))
                return;
              updateUnlocked(["max_output_tokens"], (config) => {
                config.max_output_tokens =
                  ModalConfigValidator.max_output_tokens(
                    e.currentTarget.valueAsNumber,
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
            subTitle={`${
              Locale.Settings.InjectSystemPrompts.SubTitle
            }。${sourceText("enableInjectSystemPrompts")}`}
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
            subTitle={`${Locale.Settings.InputTemplate.SubTitle}。${sourceText(
              "template",
            )}`}
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
            subTitle={`${Locale.Settings.HistoryCount.SubTitle}。${sourceText(
              "historyMessageCount",
            )}`}
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
            subTitle={`${
              Locale.Settings.CompressThreshold.SubTitle
            }。${sourceText("compressMessageLengthThreshold")}`}
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
            subTitle={`${Locale.Memory.Send}。${sourceText("sendMemory")}`}
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
