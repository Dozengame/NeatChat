import { Emoji } from "emoji-picker-react";
import { ModelType } from "../store/config";
import {
  ClaudeIcon,
  CohereIcon,
  ComfyUIIcon,
  DallEIcon,
  DeepseekIcon,
  DouBaoIcon,
  FluxIcon,
  GeminiIcon,
  GemmaIcon,
  GlmIcon,
  Gpt35Icon,
  GrokIcon,
  HaiLuoIcon,
  HunYuanIcon,
  MetaIcon,
  MiniMaxIcon,
  MistralIcon,
  MoonShotIcon,
  NeatIcon,
  OllamaIcon,
  OpenAIIcon,
  PerplexityIcon,
  QwenIcon,
  SenseNovaIcon,
  SiliconCloudIcon,
  SparkIcon,
  StabilityIcon,
  StepFunIcon,
  VertexAIIcon,
  VolcEngineIcon,
  WenXinIcon,
  YiIcon,
  getEmojiUrl,
  getModelCategory,
} from "./emoji";

function ProviderAvatar(props: { model: string; provider: string }) {
  const { model, provider } = props;

  if (provider.includes("anthropic")) {
    return <ClaudeIcon className="user-avatar model-avatar" alt="Claude" />;
  }

  if (provider.includes("openai")) {
    if (model.includes("gpt-3.5") || model.includes("gpt3")) {
      return <Gpt35Icon className="user-avatar model-avatar" alt="GPT-3.5" />;
    }
    return <OpenAIIcon className="user-avatar model-avatar" alt="OpenAI" />;
  }

  if (provider.includes("google")) {
    return <GeminiIcon className="user-avatar model-avatar" alt="Gemini" />;
  }

  if (provider.includes("bytedance")) {
    return <DouBaoIcon className="user-avatar model-avatar" alt="DouBao" />;
  }

  if (provider.includes("baidu")) {
    return <WenXinIcon className="user-avatar model-avatar" alt="WenXin" />;
  }

  if (provider.includes("tencent")) {
    return <HunYuanIcon className="user-avatar model-avatar" alt="HunYuan" />;
  }

  if (provider.includes("meta")) {
    return <MetaIcon className="user-avatar model-avatar" alt="Meta" />;
  }

  if (provider.includes("cohere")) {
    return <CohereIcon className="user-avatar model-avatar" alt="Cohere" />;
  }

  if (provider.includes("deepseek")) {
    return <DeepseekIcon className="user-avatar model-avatar" />;
  }

  if (provider.includes("moonshot")) {
    return <MoonShotIcon className="user-avatar model-avatar" alt="MoonShot" />;
  }

  if (provider.includes("zhipu")) {
    return <GlmIcon className="user-avatar model-avatar" alt="GLM" />;
  }

  if (provider.includes("xai")) {
    return <GrokIcon className="user-avatar model-avatar" alt="Grok" />;
  }

  if (provider.includes("aliyun")) {
    return <QwenIcon className="user-avatar model-avatar" alt="Qwen" />;
  }

  return null;
}

function CategoryAvatar(props: { model: string }) {
  const { model } = props;

  switch (getModelCategory(model)) {
    case "Claude":
      return <ClaudeIcon className="user-avatar model-avatar" alt="Claude" />;
    case "DALL-E":
      return <DallEIcon className="user-avatar model-avatar" alt="DALL-E" />;
    case "WenXin":
      return <WenXinIcon className="user-avatar model-avatar" alt="WenXin" />;
    case "DouBao":
      return <DouBaoIcon className="user-avatar model-avatar" alt="DouBao" />;
    case "HunYuan":
      return <HunYuanIcon className="user-avatar model-avatar" alt="HunYuan" />;
    case "Gemini":
      return <GeminiIcon className="user-avatar model-avatar" alt="Gemini" />;
    case "Llama":
      return <MetaIcon className="user-avatar model-avatar" alt="Meta" />;
    case "ChatGPT":
      if (model.includes("gpt-3.5") || model.includes("gpt3")) {
        return <Gpt35Icon className="user-avatar model-avatar" alt="GPT-3.5" />;
      }
      return <OpenAIIcon className="user-avatar model-avatar" alt="OpenAI" />;
    case "Cohere":
      return <CohereIcon className="user-avatar model-avatar" alt="Cohere" />;
    case "DeepSeek":
      return <DeepseekIcon className="user-avatar model-avatar" />;
    case "MoonShot":
      return (
        <MoonShotIcon className="user-avatar model-avatar" alt="MoonShot" />
      );
    case "GLM":
      return <GlmIcon className="user-avatar model-avatar" alt="GLM" />;
    case "Grok":
      return <GrokIcon className="user-avatar model-avatar" alt="Grok" />;
    case "Qwen":
      return <QwenIcon className="user-avatar model-avatar" alt="Qwen" />;
    case "Mistral":
      return <MistralIcon className="user-avatar model-avatar" alt="Mistral" />;
    case "Yi":
      return <YiIcon className="user-avatar model-avatar" alt="Yi" />;
    case "SenseNova":
      return (
        <SenseNovaIcon className="user-avatar model-avatar" alt="SenseNova" />
      );
    case "Spark":
      return <SparkIcon className="user-avatar model-avatar" alt="Spark" />;
    case "MiniMax":
      return <MiniMaxIcon className="user-avatar model-avatar" alt="MiniMax" />;
    case "HaiLuo":
      return <HaiLuoIcon className="user-avatar model-avatar" alt="HaiLuo" />;
    case "Gemma":
      return <GemmaIcon className="user-avatar model-avatar" alt="Gemma" />;
    case "StepFun":
      return <StepFunIcon className="user-avatar model-avatar" alt="StepFun" />;
    case "Ollama":
      return <OllamaIcon className="user-avatar model-avatar" alt="Ollama" />;
    case "ComfyUI":
      return <ComfyUIIcon className="user-avatar model-avatar" alt="ComfyUI" />;
    case "VolcEngine":
      return (
        <VolcEngineIcon className="user-avatar model-avatar" alt="VolcEngine" />
      );
    case "VertexAI":
      return (
        <VertexAIIcon className="user-avatar model-avatar" alt="VertexAI" />
      );
    case "SiliconCloud":
      return (
        <SiliconCloudIcon
          className="user-avatar model-avatar"
          alt="SiliconCloud"
        />
      );
    case "Perplexity":
      return (
        <PerplexityIcon className="user-avatar model-avatar" alt="Perplexity" />
      );
    case "Stability":
      return (
        <StabilityIcon className="user-avatar model-avatar" alt="Stability" />
      );
    case "Flux":
      return <FluxIcon className="user-avatar model-avatar" alt="Flux" />;
    default:
      return <NeatIcon className="user-avatar model-avatar" alt="Logo" />;
  }
}

export function Avatar(props: {
  model?: ModelType;
  avatar?: string;
  provider?: string;
}) {
  if (props.model) {
    const model = props.model.toLowerCase();
    const provider = props.provider?.toLowerCase() || "";
    const providerAvatar = provider ? (
      <ProviderAvatar model={model} provider={provider} />
    ) : null;

    return (
      <div className="no-dark">
        {providerAvatar ?? <CategoryAvatar model={model} />}
      </div>
    );
  }

  return (
    <div className="user-avatar">
      {props.avatar && <EmojiAvatar avatar={props.avatar} />}
    </div>
  );
}

export function EmojiAvatar(props: { avatar: string; size?: number }) {
  return (
    <Emoji
      unified={props.avatar}
      size={props.size ?? 18}
      getEmojiUrl={getEmojiUrl}
    />
  );
}
