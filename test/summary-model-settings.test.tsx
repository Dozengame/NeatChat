import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ModelConfigList } from "../app/components/model-config";
import { ServiceProvider } from "../app/constant";
import { useAccessStore } from "../app/store/access";
import {
  DEFAULT_CONFIG,
  type ModelConfig,
  useAppConfig,
} from "../app/store/config";

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
  useAllModels: () => [
    {
      name: "gpt-5.6-luna",
      displayName: "gpt-5.6-luna",
      available: true,
      provider: {
        id: "openai",
        providerName: "OpenAI",
        providerType: "openai",
      },
    },
    {
      name: "gpt-5.6-terra",
      displayName: "gpt-5.6-terra",
      available: true,
      provider: {
        id: "openai",
        providerName: "OpenAI",
        providerType: "openai",
      },
    },
    {
      name: "gpt-5.6-sol",
      displayName: "gpt-5.6-sol",
      available: false,
      provider: {
        id: "openai",
        providerName: "OpenAI",
        providerType: "openai",
      },
    },
  ],
}));

function Harness(props: {
  clearOverride: jest.Mock;
  markOverride: jest.Mock;
  initialConfig?: Partial<ModelConfig>;
}) {
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    ...DEFAULT_CONFIG.modelConfig,
    model: "gpt-5.6-terra" as any,
    providerName: ServiceProvider.OpenAI,
    compressModel: "",
    compressProviderName: "",
    ...props.initialConfig,
  });

  return (
    <ModelConfigList
      modelConfig={modelConfig}
      clearOverride={props.clearOverride}
      markOverride={props.markOverride}
      updateConfig={(updater) => {
        setModelConfig((current) => {
          const next = { ...current };
          updater(next);
          return next;
        });
      }}
    />
  );
}

describe("Summary Model settings", () => {
  beforeEach(() => {
    useAppConfig.setState({
      modelConfig: {
        ...DEFAULT_CONFIG.modelConfig,
        model: "gpt-5.6-luna" as any,
        providerName: ServiceProvider.OpenAI,
      },
      serverConfigSnapshot: {
        schemaVersion: 1,
        configVersion: "summary-ui",
        configHash: "summary-ui-hash",
        updatedAt: "2026-07-13T00:00:00.000Z",
        defaults: {
          model: "gpt-5.6-luna",
          providerName: ServiceProvider.OpenAI,
          reasoningEffort: "xhigh",
        },
        forced: {
          model: "gpt-5.6-luna",
          providerName: ServiceProvider.OpenAI,
        },
        allowedModels: ["gpt-5.6-luna@OpenAI", "gpt-5.6-terra@OpenAI"],
        reasoningEffortDefaults: {
          default: "medium",
          models: { "gpt-5.6-luna": "xhigh", "gpt-5.6-terra": "high" },
        },
        lockedFields: [],
        serverFlags: {
          needCode: false,
          hideUserApiKey: false,
          hideBalanceQuery: false,
          disableFastLink: false,
          disableGPT4: false,
        },
        legacy: { customModels: "", defaultModel: "gpt-5.6-luna" },
      },
    });
    useAccessStore.setState({
      allowedModels: ["gpt-5.6-luna@OpenAI", "gpt-5.6-terra@OpenAI"],
      lockedFields: [],
    });
  });

  test("renders an explicit follow-default sentinel and can restore it", () => {
    const clearOverride = jest.fn();
    const markOverride = jest.fn();
    render(
      <Harness clearOverride={clearOverride} markOverride={markOverride} />,
    );

    const select = screen.getByRole("combobox", {
      name: /Summary Model|对话摘要模型/,
    }) as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(select.options[0].textContent).toMatch(/gpt-5\.6-luna\(OpenAI\)/);
    expect(
      Array.from(select.options).some(
        (option) => option.value === "gpt-5.6-sol@OpenAI",
      ),
    ).toBe(false);

    fireEvent.change(select, { target: { value: "gpt-5.6-terra@OpenAI" } });
    expect(select.value).toBe("gpt-5.6-terra@OpenAI");
    expect(markOverride).toHaveBeenCalledWith([
      "compressModel",
      "compressProviderName",
    ]);

    fireEvent.change(select, { target: { value: "" } });
    expect(select.value).toBe("");
    expect(clearOverride).toHaveBeenCalledWith([
      "compressModel",
      "compressProviderName",
    ]);
  });

  test("disables Summary selection when model policy is locked", () => {
    useAccessStore.setState({
      lockedFields: ["model", "providerName"],
    });

    render(
      <Harness
        clearOverride={jest.fn()}
        markOverride={jest.fn()}
        initialConfig={{
          compressModel: "gpt-5.6-terra",
          compressProviderName: ServiceProvider.OpenAI,
        }}
      />,
    );

    const select = screen.getByRole("combobox", {
      name: /Summary Model|对话摘要模型/,
    }) as HTMLSelectElement;
    expect(select).toBeDisabled();
    expect(select.value).toBe("");
    expect(select.selectedOptions[0].textContent).toMatch(/gpt-5\.6-luna/);
  });

  test("keeps an unavailable persisted override visible until it is cleared", () => {
    const clearOverride = jest.fn();
    useAccessStore.setState({
      allowedModels: ["gpt-5.6-luna@OpenAI"],
      lockedFields: [],
    });

    render(
      <Harness
        clearOverride={clearOverride}
        markOverride={jest.fn()}
        initialConfig={{
          compressModel: "gpt-5.6-terra",
          compressProviderName: ServiceProvider.OpenAI,
        }}
      />,
    );

    const select = screen.getByRole("combobox", {
      name: /Summary Model|对话摘要模型/,
    }) as HTMLSelectElement;
    expect(select.value).toBe("gpt-5.6-terra@OpenAI");
    expect(select.selectedOptions[0]).toBeDisabled();
    expect(select.selectedOptions[0].textContent).toMatch(
      /unavailable|不可用/i,
    );

    fireEvent.change(select, { target: { value: "" } });
    expect(select.value).toBe("");
    expect(clearOverride).toHaveBeenCalledWith([
      "compressModel",
      "compressProviderName",
    ]);
  });

  test("marks a persisted model unavailable when discovery reports available=false", () => {
    useAccessStore.setState({
      allowedModels: ["gpt-5.6-luna@OpenAI", "gpt-5.6-sol@OpenAI"],
      lockedFields: [],
    });

    render(
      <Harness
        clearOverride={jest.fn()}
        markOverride={jest.fn()}
        initialConfig={{
          compressModel: "gpt-5.6-sol",
          compressProviderName: ServiceProvider.OpenAI,
        }}
      />,
    );

    const select = screen.getByRole("combobox", {
      name: /Summary Model|对话摘要模型/,
    }) as HTMLSelectElement;
    expect(select.value).toBe("gpt-5.6-sol@OpenAI");
    expect(select.selectedOptions[0]).toBeDisabled();
    expect(select.selectedOptions[0].textContent).toMatch(
      /unavailable|不可用/i,
    );
  });
});
