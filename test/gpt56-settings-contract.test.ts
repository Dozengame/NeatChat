import fs from "fs";
import path from "path";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("GPT-5.6 Settings contract", () => {
  test("keeps advanced capability controls inside the GPT-5.6 ModelConfig gate", () => {
    const modelConfig = read("app/components/model-config.tsx");
    const chat = read("app/components/chat.tsx");
    const publicConfig = read("app/utils/public-app-config.ts");

    expect(modelConfig).toContain("isOpenAIGpt56ModelConfig");
    expect(modelConfig).toContain("{isOpenAIGpt56 && (");
    for (const field of [
      "reasoningMode",
      "reasoningContext",
      "inputImageDetail",
      "promptCacheMode",
      "promptCacheKey",
    ]) {
      expect(modelConfig).toMatch(new RegExp(`sourceText\\(\\s*"${field}"`));
      expect(modelConfig).toContain(`updateUnlocked([\"${field}\"]`);
      expect(publicConfig).toMatch(
        new RegExp(
          `DEFAULT_WEBUI_LOCKED_FIELDS[\\s\\S]*?"${field}"[\\s\\S]*?\\]`,
        ),
      );
      expect(chat).not.toContain(field);
    }
    for (const field of [
      "reasoningMode",
      "reasoningContext",
      "inputImageDetail",
      "promptCacheMode",
    ]) {
      expect(modelConfig).toMatch(
        new RegExp(
          `value=\\{${field}\\}[\\s\\S]{0,180}disabled=\\{isLocked\\("${field}"\\)\\}`,
        ),
      );
    }
    expect(
      modelConfig.match(
        /Locale\.Settings\.GPT56Capabilities\.ConfigSource\.Separator/g,
      )?.length ?? 0,
    ).toBeGreaterThanOrEqual(5);
  });

  test("keeps both locales complete and warns against cache-key secrets", () => {
    const cn = read("app/locales/cn.ts");
    const en = read("app/locales/en.ts");
    const modelConfig = read("app/components/model-config.tsx");
    const envTemplate = read(".env.template");

    for (const locale of [cn, en]) {
      expect(locale).toContain("GPT56Capabilities");
      expect(locale).toContain("ConfigSource");
      expect(locale).toContain("ReasoningMode");
      expect(locale).toContain("ReasoningContext");
      expect(locale).toContain("InputImageDetail");
      expect(locale).toContain("PromptCacheMode");
      expect(locale).toContain("PromptCacheKey");
    }
    expect(cn).toContain("请勿填写密钥或个人信息");
    expect(en).toContain("do not enter secrets or personal data");
    expect(en).toContain('Prefix: "Source: "');
    expect(cn).toContain('Disabled: "关闭"');
    expect(en).toContain('Disabled: "Disabled"');
    expect(modelConfig).toContain(
      "disabled: Locale.Settings.GPT56Capabilities.PromptCacheMode.Disabled",
    );
    expect(modelConfig).toContain(
      '(["disabled", "implicit", "explicit"] as const)',
    );
    expect(modelConfig).toMatch(
      /disabled=\{[\s\S]*isLocked\("promptCacheKey"\)[\s\S]*promptCacheMode === "disabled"[\s\S]*\}/,
    );
    expect(envTemplate).toContain("disabled、implicit、explicit");
    expect(modelConfig).not.toContain("来源：");
  });

  test("keeps GPT-5.6 select values readable at narrow widths", () => {
    const modelConfig = read("app/components/model-config.tsx");
    const styles = read("app/components/model-config.module.scss");

    expect(
      modelConfig.match(/className=\{styles\["gpt56-capability-select"\]\}/g) ??
        [],
    ).toHaveLength(4);
    expect(styles).toContain(".gpt56-capability-select");
    expect(styles).toContain("clamp(104px, 31vw, 148px)");
  });

  test("filters every reasoning effort selector through the public allowlist", () => {
    const modelConfig = read("app/components/model-config.tsx");
    const chat = read("app/components/chat.tsx");
    const publicConfig = read("app/utils/public-app-config.ts");
    const envTemplate = read(".env.template");

    expect(
      modelConfig.match(/filterOpenAIResponsesReasoningEfforts\(/g) ?? [],
    ).toHaveLength(1);
    expect(
      chat.match(/filterOpenAIResponsesReasoningEfforts\(/g) ?? [],
    ).toHaveLength(2);
    expect(modelConfig).toContain(
      "accessStore.serverConfigSnapshot?.reasoningEffortAllowlist",
    );
    expect(chat).toContain(
      "accessStore.serverConfigSnapshot?.reasoningEffortAllowlist",
    );
    expect(modelConfig).toContain("visibleReasoningEffortOptions.map");
    expect(modelConfig).toContain("!reasoningEffortOptions.some(");
    expect(chat).toContain("visibleCurrentReasoningEfforts.map");
    expect(chat).toContain("efforts={visibleHeaderReasoningEfforts}");
    expect(chat).toContain("allowedEfforts={headerReasoningEfforts}");
    expect(chat).toContain("locked={!!headerReasoningLocked}");
    expect(publicConfig).toContain("reasoningEffortAllowlist?");
    expect(envTemplate).toContain("WEBUI_ALLOWED_REASONING_EFFORTS=");
    expect(envTemplate).toContain("gpt-5.6-sol=");
    expect(envTemplate).toContain("不支持产品级 Ultra");
  });
});
