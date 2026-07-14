import type { ModelConfig, ModelConfigMeta } from "../store/config";
import type { Mask } from "../store/mask";

// Match the original role and content as well as the legacy id so user edits
// are never removed. Fingerprints keep retired unsafe prompts out of the bundle.
const LEGACY_BUILTIN_CONTEXT_FINGERPRINTS: Readonly<Record<string, string>> = {
  "can-0": "user:1361:75812ff4034664e4:c5ab7478c281ad8c",
  "Copilot-0": "system:2584:eed5acc5880407db:5961018dbead7389",
  "doctor-0": "user:537:204bdc3825f4c2c6:1fad874224caef98",
  "jb-0": "user:1348:39d6028e121174fb:9d03d966fc15c134",
  "jb-1": "assistant:11:dd3c1351d8977c87:0de2d72d323234ae",
  "lang-0": "user:80:842058af976b25f4:807037b50f401c59",
  "mentor-0": "user:153:b4df05c027b4d483:1eb963fd22242ca9",
  "mentor-1": "assistant:8:22184eb92bdac7cf:7bb6d03052c49d35",
  "mentor-2": "user:9:3b7ae307941f38bd:b2f3122c7041cfe3",
  "mentor-3": "assistant:72:36153713a815cbad:03bc3f4a18eeab2b",
  "mentor-4": "user:8:653c14690bc19f22:4fb75a3898a62a87",
  "mentor-5": "assistant:69:ea62dce014e2ab42:40b9e278498cfdcc",
  "text-to-pic-0": "system:160:14af4fedde967b86:31aec83536cf434a",
  "text-to-pic-1": "user:34:74edb3d8a0c5934c:e3e9cbe68ee60dba",
  "text-to-pic-2": "assistant:34:3c3b0780b906f536:a950a3bd8e0f8bd5",
  "text-to-pic-3": "system:262:27e59d321590b941:6c2777ee1445aae6",
};

type LegacyContextMessage = Mask["context"][number];

function getLegacyContextFingerprint(
  message: LegacyContextMessage,
): string | undefined {
  if (typeof message.content !== "string") return undefined;

  const input = `${message.role}\0${message.content}`;
  let first = 0xcbf29ce484222325n;
  let second = 0x84222325cbf29cen;

  for (let index = 0; index < input.length; index += 1) {
    const value = BigInt(input.charCodeAt(index));
    first = BigInt.asUintN(64, (first ^ value) * 0x100000001b3n);
    second = BigInt.asUintN(
      64,
      (second ^ (value + BigInt(index))) * 0x9e3779b185ebca87n,
    );
  }

  return `${message.role}:${message.content.length}:${first
    .toString(16)
    .padStart(16, "0")}:${second.toString(16).padStart(16, "0")}`;
}

function isUnmodifiedLegacyBuiltinContext(
  message: LegacyContextMessage,
): boolean {
  const expectedFingerprint = LEGACY_BUILTIN_CONTEXT_FINGERPRINTS[message.id];
  return (
    expectedFingerprint !== undefined &&
    getLegacyContextFingerprint(message) === expectedFingerprint
  );
}

export function migrateLegacyBuiltinMask(
  mask: Mask,
  modelConfig: ModelConfig,
  modelConfigMeta: ModelConfigMeta | undefined,
): Mask {
  if (mask.builtin !== true) return mask;
  const context = mask.context.filter(
    (message) => !isUnmodifiedLegacyBuiltinContext(message),
  );
  if (mask.syncGlobalConfig === false) {
    return {
      ...mask,
      context,
      syncGlobalConfig: false,
    };
  }
  return {
    ...mask,
    context,
    modelConfig: { ...modelConfig },
    modelConfigMeta: { ...(modelConfigMeta ?? {}) },
    syncGlobalConfig: true,
  };
}
