jest.mock("nanoid", () => ({ nanoid: () => "builtin-mask-test-id" }));

import { CN_MASKS } from "../app/masks/cn";
import { EN_MASKS } from "../app/masks/en";
import { BUILTIN_MASK_STORE } from "../app/masks";
import { migrateLegacyBuiltinMask } from "../app/masks/migration";
import { DEFAULT_CONFIG, useAppConfig } from "../app/store/config";
import {
  migrateMaskState,
  resolveMaskLanguageFilter,
  useMaskStore,
} from "../app/store/mask";
import { getLang } from "../app/locales";
import type { Mask } from "../app/store/mask";

const FAMILIES = [
  "content-writing",
  "engineering-collaboration",
  "prompt-design",
  "research-decision",
  "event-operations",
  "career-resume",
  "startup-validation",
  "emotional-support",
];

function legacyMask(overrides: Partial<Mask> = {}): Mask {
  return {
    id: "100001",
    avatar: "avatar",
    name: "Legacy",
    context: [{ id: "safe-0", role: "system", content: "safe", date: "" }],
    modelConfig: { ...DEFAULT_CONFIG.modelConfig, model: "gpt-4" },
    lang: "cn",
    builtin: true,
    createdAt: 1,
    ...overrides,
  };
}

describe("built-in masks", () => {
  beforeEach(() => {
    useAppConfig.setState({ ...DEFAULT_CONFIG });
    useMaskStore.setState({
      language: getLang(),
      languageFilterMode: "app",
    });
  });

  test("provides exactly eight localized capability families", () => {
    for (const [lang, masks] of [
      ["cn", CN_MASKS],
      ["en", EN_MASKS],
    ] as const) {
      expect(masks).toHaveLength(8);
      expect(masks.map((mask) => mask.id).sort()).toEqual(
        FAMILIES.map((family) => `builtin-${family}-${lang}`).sort(),
      );
      masks.forEach((mask) => {
        expect(mask.context).toHaveLength(1);
        expect(mask.context[0].role).toBe("system");
        expect(mask.modelConfig).toEqual({});
      });
    }
  });

  test("follows the app locale by default while retaining explicit language filters", () => {
    expect(useMaskStore.getState().language).toBe(getLang());
    expect(useMaskStore.getState().languageFilterMode).toBe("app");
    expect(resolveMaskLanguageFilter(useMaskStore.getState(), "en")).toBe("en");
    expect(useMaskStore.getState().getAll()).toHaveLength(16);

    useMaskStore.getState().setLanguage(undefined);
    expect(useMaskStore.getState().language).toBeUndefined();
    expect(useMaskStore.getState().languageFilterMode).toBe("all");
    expect(
      resolveMaskLanguageFilter(useMaskStore.getState(), "en"),
    ).toBeUndefined();

    useMaskStore.getState().setLanguage("cn");
    expect(useMaskStore.getState().languageFilterMode).toBe("fixed");
    expect(resolveMaskLanguageFilter(useMaskStore.getState(), "en")).toBe("cn");

    useMaskStore.getState().followAppLanguage();
    expect(useMaskStore.getState().languageFilterMode).toBe("app");
    expect(resolveMaskLanguageFilter(useMaskStore.getState(), "en")).toBe("en");
  });

  test("migrates the legacy default filter to app language while preserving fixed filters", () => {
    const concreteLanguage = migrateMaskState(
      { masks: {}, language: "cn" },
      3.2,
    );
    expect(concreteLanguage.languageFilterMode).toBe("fixed");
    expect(concreteLanguage.language).toBe("cn");
    expect(resolveMaskLanguageFilter(concreteLanguage, "en")).toBe("cn");

    const legacyDefault = migrateMaskState({ masks: {} }, 3.2);
    expect(legacyDefault.languageFilterMode).toBe("app");
    expect(resolveMaskLanguageFilter(legacyDefault, "en")).toBe("en");
  });

  test("tombstones unsafe numeric links and aliases safe legacy links", () => {
    ["100000", "100006", "100013", "100014", "100016"].forEach((id) =>
      expect(BUILTIN_MASK_STORE.get(id)).toBeUndefined(),
    );
    expect(BUILTIN_MASK_STORE.get("100001")?.id).toBe(
      "builtin-content-writing-cn",
    );
    expect(BUILTIN_MASK_STORE.get("100008")?.id).toBe(
      "builtin-career-resume-cn",
    );
    expect(BUILTIN_MASK_STORE.get("100015")?.id).toBe(
      "builtin-prompt-design-en",
    );
  });

  test("materializes direct built-in links with the current model config", () => {
    useAppConfig.setState({
      ...DEFAULT_CONFIG,
      modelConfig: { ...DEFAULT_CONFIG.modelConfig, model: "current-model" },
    });
    const first = BUILTIN_MASK_STORE.get("builtin-content-writing-cn")!;
    const second = BUILTIN_MASK_STORE.get("builtin-content-writing-cn")!;
    expect(first.modelConfig.model).toBe("current-model");
    expect(first.modelConfig).not.toBe(second.modelConfig);
    expect(first.context).not.toBe(second.context);
  });

  test("migrates only built-in sessions and removes only unmodified legacy preset context", () => {
    const current = { ...DEFAULT_CONFIG.modelConfig, model: "current-model" };
    const safe = legacyMask();
    const safeMigrated = migrateLegacyBuiltinMask(safe, current, undefined);
    expect(safeMigrated.context).toEqual(safe.context);
    expect(safeMigrated.modelConfig.model).toBe("current-model");
    expect(safeMigrated.name).toBe(safe.name);
    expect(safeMigrated.id).toBe(safe.id);

    const unsafe = legacyMask({
      context: [
        {
          id: "mentor-1",
          role: "assistant",
          content: "我已经准备好了。",
          date: "",
        },
        {
          id: "user-pin-1",
          role: "user",
          content: "pinned by the user",
          date: "",
        },
      ],
    });
    expect(
      migrateLegacyBuiltinMask(unsafe, current, undefined).context,
    ).toEqual([
      {
        id: "user-pin-1",
        role: "user",
        content: "pinned by the user",
        date: "",
      },
    ]);

    const editedLegacyContext = legacyMask({
      context: [
        {
          id: "mentor-1",
          role: "assistant",
          content: "这是用户改写后的提示词。",
          date: "",
        },
      ],
    });
    expect(
      migrateLegacyBuiltinMask(editedLegacyContext, current, undefined).context,
    ).toEqual(editedLegacyContext.context);

    const userMask = legacyMask({ builtin: false });
    expect(migrateLegacyBuiltinMask(userMask, current, undefined)).toBe(
      userMask,
    );
  });

  test("preserves explicit built-in overrides and user context while removing legacy preset context", () => {
    const modelConfig = {
      ...DEFAULT_CONFIG.modelConfig,
      model: "legacy-explicit-model",
      temperature: 0.25,
    };
    const modelConfigMeta: NonNullable<Mask["modelConfigMeta"]> = {
      model: {
        source: "conversation_override",
        updatedAt: 1,
      },
    };
    const mask = legacyMask({
      context: [
        {
          id: "mentor-1",
          role: "assistant",
          content: "我已经准备好了。",
          date: "",
        },
        {
          id: "doctor-0",
          role: "system",
          content: "user-authored replacement",
          date: "",
        },
        {
          id: "user-pin-2",
          role: "assistant",
          content: "pinned by the user",
          date: "",
        },
      ],
      modelConfig,
      modelConfigMeta,
      syncGlobalConfig: false,
    });

    const migrated = migrateLegacyBuiltinMask(
      mask,
      { ...DEFAULT_CONFIG.modelConfig, model: "current-model" },
      undefined,
    );

    expect(migrated.context).toEqual([
      {
        id: "doctor-0",
        role: "system",
        content: "user-authored replacement",
        date: "",
      },
      {
        id: "user-pin-2",
        role: "assistant",
        content: "pinned by the user",
        date: "",
      },
    ]);
    expect(migrated.modelConfig).toBe(modelConfig);
    expect(migrated.modelConfigMeta).toBe(modelConfigMeta);
    expect(migrated.syncGlobalConfig).toBe(false);
  });
});
