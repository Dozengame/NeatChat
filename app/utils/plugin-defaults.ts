const RETIRED_DEFAULT_PLUGIN_IDS = [
  "dalle3",
  "arxivsearch",
  "duckduckgolite",
  "qdrant",
  "jinaurl",
] as const;

export function isRetiredDefaultPluginId(id: string) {
  return RETIRED_DEFAULT_PLUGIN_IDS.includes(
    id as (typeof RETIRED_DEFAULT_PLUGIN_IDS)[number],
  );
}

export function getRetiredDefaultPluginIds(
  plugins: Record<string, unknown>,
  activeDefaultPluginIds: Iterable<string>,
) {
  const activeIds = new Set(activeDefaultPluginIds);
  return RETIRED_DEFAULT_PLUGIN_IDS.filter(
    (id) => !activeIds.has(id) && !!plugins[id],
  );
}
