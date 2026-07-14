import type { Mask } from "../store/mask";
import { useAppConfig } from "../store/config";

import { type BuiltinMask } from "./typing";
import { CN_MASKS } from "./cn";
import { EN_MASKS } from "./en";
export { type BuiltinMask } from "./typing";

const LEGACY_BUILTIN_MASK_TOMBSTONES = new Set([
  "100000",
  "100006",
  "100013",
  "100014",
  "100016",
]);
const LEGACY_BUILTIN_MASK_ALIASES: Record<string, string> = {
  "100001": "builtin-content-writing-cn",
  "100002": "builtin-engineering-collaboration-cn",
  "100003": "builtin-event-operations-cn",
  "100004": "builtin-career-resume-cn",
  "100005": "builtin-content-writing-cn",
  "100007": "builtin-content-writing-cn",
  "100008": "builtin-career-resume-cn",
  "100009": "builtin-emotional-support-cn",
  "100010": "builtin-startup-validation-cn",
  "100011": "builtin-content-writing-cn",
  "100012": "builtin-emotional-support-cn",
  "100015": "builtin-prompt-design-en",
  "100017": "builtin-prompt-design-en",
};

export function materializeBuiltinMask(mask: BuiltinMask): Mask {
  const config = useAppConfig.getState();
  return {
    ...mask,
    context: mask.context.map((message) => ({ ...message })),
    modelConfig: { ...config.modelConfig, ...mask.modelConfig },
    modelConfigMeta: { ...(config.modelConfigMeta ?? {}) },
    syncGlobalConfig: true,
  } as Mask;
}

export const BUILTIN_MASK_STORE = {
  masks: {} as Record<string, BuiltinMask>,
  get(id?: string) {
    if (!id || LEGACY_BUILTIN_MASK_TOMBSTONES.has(String(id))) return undefined;
    const resolvedId = LEGACY_BUILTIN_MASK_ALIASES[String(id)] ?? String(id);
    const mask = this.masks[resolvedId];
    return mask ? materializeBuiltinMask(mask) : undefined;
  },
  add(m: BuiltinMask) {
    const mask = { ...m, builtin: true };
    this.masks[mask.id] = mask;
    return mask;
  },
};

export const BUILTIN_MASKS: BuiltinMask[] = [...CN_MASKS, ...EN_MASKS].map(
  (mask) => BUILTIN_MASK_STORE.add(mask),
);
