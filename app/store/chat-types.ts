import type { RequestMessage } from "../client/types";
import Locale from "../locales";
import type { ModelType } from "./config";

export type ChatMessageTool = {
  id: string;
  index?: number;
  type?: string;
  function?: {
    name: string;
    arguments?: string;
  };
  content?: string;
  isError?: boolean;
  errorMsg?: string;
};

export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
  openaiResponseId?: string;
  openaiResponseStored?: boolean;
  openaiResponsesOutput?: unknown[];
  openaiResponsesRecoveryPending?: boolean;
  tools?: ChatMessageTool[];
  audio_url?: string;
  isMcpResponse?: boolean;
};

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
