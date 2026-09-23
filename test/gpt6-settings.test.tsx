import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ModelConfigList } from "../app/components/model-config";
import { ServiceProvider } from "../app/constant";
import Locale from "../app/locales";
import { useAccessStore } from "../app/store/access";
import {
  DEFAULT_CONFIG,
  type ModelConfig,
  useAppConfig,
} from "../app/store/config";
import { parseOpenAIResponsesReasoningEffortAllowlist } from "../app/utils/openai-responses";
import type { PublicAppConfig } from "../app/utils/public-app-config";

jest.mock("lodash-es", () => ({
  groupBy: (items: any[], key: string) =>
    items.reduce<Record<string, any[]>>((groups, item) => {
      const value = key
        .split(".")
        .reduce((current, part) => current?.[part], item);
      groups[value] = [...(groups[value] ?? []), item];
      return groups;
    }, {}),
}));
jest.mock("../app/icons/down.svg", () => ({
  __esModule: true,
  default: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));
jest.mock("../app/utils/hooks", () => ({
  useAllModels: () =>
    ["gpt-6-astra", "gpt-6-sol", "gpt-6-luna", "gpt-image-2.5-flare"].map(
      (name) => ({
        name,
        displayName: name,
        available: true,
        provider: {
          id: "openai",
          providerName: "OpenAI",
          providerType: "openai",
        },
      }),
    ),
}));

const allowedModels = ["gpt-6-luna@OpenAI", "gpt-image-2.5-flare@OpenAI"];
const lockedFields = [
  "customModels",
  "baseUrl",
  "apiKey",
  "temperature",
  "textVerbosity",
  "reasoningMode",
  "reasoningContext",
  "inputImageDetail",
  "promptCacheMode",
  "promptCacheKey",
];

function publicConfig(): PublicAppConfig {
  return {
    schemaVersion: 1,
    configVersion: "gpt6-ui",
    configHash: "gpt6-ui-hash",
    updatedAt: "2026-09-23T00:00:00.000Z",
    defaults: {
      model: "gpt-6-luna",
      providerName: ServiceProvider.OpenAI,
      reasoningEffort: "xhigh",
    },
    forced: {},
    allowedModels,
    lockedFields,
    reasoningEffortAllowlist: parseOpenAIResponsesReasoningEffortAllowlist(
      "*=low,medium;gpt-6-sol=low,medium,high;gpt-6-luna=low,medium,high,xhigh,max",
    ),
    reasoningEffortDefaults: {
      default: "medium",
      models: { "gpt-6-luna": "xhigh" },
    },
    serverFlags: {
      needCode: false,
      hideUserApiKey: true,
      hideBalanceQuery: true,
      disableFastLink: false,
      disableGPT4: false,
    },
    legacy: {
      customModels: "-all,gpt-6-luna@openai,gpt-image-2.5-flare@openai",
      defaultModel: "gpt-6-luna",
    },
  };
}

function Harness({ initialConfig }: { initialConfig?: Partial<ModelConfig> }) {
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    ...DEFAULT_CONFIG.modelConfig,
    model: "gpt-6-luna" as any,
    providerName: ServiceProvider.OpenAI,
    reasoningEffort: "xhigh",
    ...initialConfig,
  });
  return (
    <ModelConfigList
      modelConfig={modelConfig}
      updateConfig={(updater) => {
        // Zustand's production update applies the callback during the event.
        const next = { ...modelConfig };
        updater(next);
        setModelConfig(next);
      }}
    />
  );
}

function options(label: string) {
  const select = screen.getByRole("combobox", {
    name: label,
  }) as HTMLSelectElement;
  return Array.from(select.options).map((option) => option.value);
}

describe("GPT-6 settings", () => {
  beforeEach(() => {
    const config = publicConfig();
    useAppConfig.setState({
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "gpt-6-luna" as any,
        reasoningEffort: "xhigh",
      },
      modelConfigMeta: {},
      serverConfigSnapshot: config,
    });
    useAccessStore.setState({
      allowedModels,
      lockedFields,
      serverConfigSnapshot: config,
      openaiMaxOutputTokens: undefined,
    });
  });

  test("shows only Luna and Flare with the five allowed Luna efforts", () => {
    render(<Harness />);
    const models = screen.getByRole("combobox", {
      name: Locale.Settings.Model,
    });
    expect(models).not.toBeDisabled();
    expect(options(Locale.Settings.Model)).toEqual(allowedModels);
    expect(options(Locale.Settings.CompressModel.Title)).toEqual([
      "",
      "gpt-6-luna@OpenAI",
    ]);
    expect(options(Locale.Settings.ReasoningEffort.Title)).toEqual([
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
    ]);
    expect(
      screen.getByLabelText(Locale.Settings.ReasoningEffort.Title),
    ).toHaveValue("xhigh");
    fireEvent.change(
      screen.getByLabelText(Locale.Settings.ReasoningEffort.Title),
      {
        target: { value: "max" },
      },
    );
    expect(
      screen.getByLabelText(Locale.Settings.ReasoningEffort.Title),
    ).toHaveValue("max");
  });

  test("never offers none for Astra, even without an environment allowlist", () => {
    useAccessStore.setState({
      allowedModels: ["gpt-6-astra@OpenAI"],
      serverConfigSnapshot: {
        ...publicConfig(),
        reasoningEffortAllowlist: undefined,
      },
    });
    render(
      <Harness
        initialConfig={{ model: "gpt-6-astra" as any, reasoningEffort: "none" }}
      />,
    );
    expect(options(Locale.Settings.ReasoningEffort.Title)).toEqual([
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
    ]);
    expect(
      screen.getByLabelText(Locale.Settings.ReasoningEffort.Title),
    ).toHaveValue("low");
    expect(
      screen.queryByLabelText(Locale.Settings.Temperature.Title),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(Locale.Settings.TopP.Title),
    ).not.toBeInTheDocument();
  });

  test.each(["gpt-6-sol", "gpt-6-luna"])(
    "%s shows sampling controls only while none is selected",
    (model) => {
      useAccessStore.setState({
        allowedModels: [`${model}@OpenAI`],
        lockedFields: [],
        serverConfigSnapshot: {
          ...publicConfig(),
          reasoningEffortAllowlist: undefined,
        },
      });
      render(
        <Harness
          initialConfig={{ model: model as any, reasoningEffort: "none" }}
        />,
      );
      expect(
        screen.getByLabelText(Locale.Settings.Temperature.Title),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(Locale.Settings.TopP.Title),
      ).toBeInTheDocument();
      fireEvent.change(
        screen.getByLabelText(Locale.Settings.ReasoningEffort.Title),
        {
          target: { value: "low" },
        },
      );
      expect(
        screen.queryByLabelText(Locale.Settings.Temperature.Title),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(Locale.Settings.TopP.Title),
      ).not.toBeInTheDocument();
      fireEvent.change(
        screen.getByLabelText(Locale.Settings.ReasoningEffort.Title),
        {
          target: { value: "none" },
        },
      );
      expect(
        screen.getByLabelText(Locale.Settings.Temperature.Title),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(Locale.Settings.TopP.Title),
      ).toBeInTheDocument();
    },
  );

  test("switches to Flare with six qualities and 2K/4K sizes", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText(Locale.Settings.Model), {
      target: { value: "gpt-image-2.5-flare@OpenAI" },
    });
    expect(options(Locale.Settings.ImageGeneration.Quality)).toEqual([
      "auto",
      "low",
      "medium",
      "high",
      "xhigh",
      "max",
    ]);
    expect(options(Locale.Settings.ImageGeneration.Size)).toEqual(
      expect.arrayContaining([
        "2048x2048",
        "2048x1152",
        "3840x2160",
        "2160x3840",
      ]),
    );
    expect(
      screen.getByLabelText(Locale.Settings.ImageGeneration.Size),
    ).toHaveValue("auto");
    expect(
      screen.getByLabelText(Locale.Settings.ImageGeneration.Quality),
    ).toHaveValue("auto");
    fireEvent.change(
      screen.getByLabelText(Locale.Settings.ImageGeneration.Quality),
      {
        target: { value: "max" },
      },
    );
    fireEvent.change(
      screen.getByLabelText(Locale.Settings.ImageGeneration.Size),
      {
        target: { value: "3840x2160" },
      },
    );
    expect(
      screen.getByLabelText(Locale.Settings.ImageGeneration.Quality),
    ).toHaveValue("max");
    expect(
      screen.getByLabelText(Locale.Settings.ImageGeneration.Size),
    ).toHaveValue("3840x2160");
    expect(
      screen.queryByLabelText(Locale.Settings.ReasoningEffort.Title),
    ).not.toBeInTheDocument();
  });
});
