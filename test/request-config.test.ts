import { readFileSync } from "fs";
import path from "path";

import { mergeLLMRequestConfig } from "../app/client/request-config";
import { ServiceProvider } from "../app/constant";

const providerFiles = [
  "openai",
  "google",
  "anthropic",
  "alibaba",
  "baidu",
  "bytedance",
  "glm",
  "iflytek",
  "moonshot",
  "tencent",
  "xai",
];

describe("mergeLLMRequestConfig", () => {
  test("keeps request-level Summary config authoritative over the active session", () => {
    const result = mergeLLMRequestConfig(
      {
        model: "gpt-5.6-sol",
        providerName: ServiceProvider.OpenAI,
        reasoningEffort: "medium",
        max_output_tokens: 20000,
        stream: true,
      },
      {
        model: "gpt-5.6-terra",
        providerName: ServiceProvider.OpenAI,
        reasoningEffort: "high",
        max_output_tokens: 30000,
        stream: true,
      },
      {
        model: "gpt-5.6-luna",
        providerName: ServiceProvider.OpenAI,
        reasoningEffort: "xhigh",
        max_output_tokens: 30000,
        stream: false,
      },
    );

    expect(result).toMatchObject({
      model: "gpt-5.6-luna",
      providerName: ServiceProvider.OpenAI,
      reasoningEffort: "xhigh",
      max_output_tokens: 30000,
      stream: false,
    });
  });

  test("lets explicit undefined clear fields inherited from the active session", () => {
    const result = mergeLLMRequestConfig(
      { model: "gpt-5.6-luna", reasoningEffort: "xhigh" },
      { model: "gpt-5.6-terra", reasoningEffort: "high" },
      {
        model: "gpt-4o",
        reasoningEffort: undefined,
        max_output_tokens: undefined,
      },
    );

    expect(result.reasoningEffort).toBeUndefined();
    expect(result.max_output_tokens).toBeUndefined();
  });

  test.each(providerFiles)(
    "%s adopts request-level config and provider headers",
    (provider) => {
      const source = readFileSync(
        path.join(process.cwd(), "app/client/platforms", `${provider}.ts`),
        "utf8",
      );

      expect(source).toContain("mergeLLMRequestConfig(");
      expect(source).toMatch(
        /getHeadersAsync\([\s\S]{0,100}modelConfig\.providerName/,
      );
    },
  );

  test.each(["google", "anthropic", "glm", "moonshot", "xai"])(
    "%s only exposes session tools when the request allows them",
    (provider) => {
      const source = readFileSync(
        path.join(process.cwd(), "app/client/platforms", `${provider}.ts`),
        "utf8",
      );

      expect(source).toContain("options.allowTools === true");
      expect(source).toMatch(
        /options\.allowTools === true[\s\S]{0,220}getAsTools/,
      );
    },
  );
});
