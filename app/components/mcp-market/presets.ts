import mcpPresetData from "../../../public/mcp.json";
import mcpPresetDataCn from "../../../public/mcp_cn.json";
import type { Lang } from "../../locales";
import type { PresetServer } from "../../mcp/types";

interface PresetPayload {
  data?: PresetServer[];
}

export function getPresetServersForLang(lang: Lang): PresetServer[] {
  const payload = (
    lang === "cn" ? mcpPresetDataCn : mcpPresetData
  ) as PresetPayload;
  return Array.isArray(payload.data) ? payload.data : [];
}
