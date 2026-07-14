import type { ModelConfig } from "../store/config";
import type { LLMConfig } from "./types";

type Merge<Left, Right> = Omit<Left, keyof Right> & Right;

export function mergeLLMRequestConfig(
  globalConfig: ModelConfig,
  sessionConfig: ModelConfig,
  requestConfig: LLMConfig,
): ModelConfig & LLMConfig;
export function mergeLLMRequestConfig<
  GlobalConfig extends object,
  SessionConfig extends object,
  RequestConfig extends object,
>(
  globalConfig: GlobalConfig,
  sessionConfig: SessionConfig,
  requestConfig: RequestConfig,
): Merge<Merge<GlobalConfig, SessionConfig>, RequestConfig>;
export function mergeLLMRequestConfig(
  globalConfig: object,
  sessionConfig: object,
  requestConfig: object,
) {
  return {
    ...globalConfig,
    ...sessionConfig,
    ...requestConfig,
  };
}
