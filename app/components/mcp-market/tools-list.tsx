import Locale from "../../locales";
import type { ListToolsResponse } from "../../mcp/types";
import styles from "../mcp-market.module.scss";

export function ToolsList({
  isLoading,
  tools,
}: {
  isLoading: boolean;
  tools: ListToolsResponse | null;
}) {
  const rawTools = tools?.tools;
  const toolItems = Array.isArray(rawTools) ? rawTools : [];

  if (isLoading) {
    return (
      <div className={styles["tools-list"]} role="status" aria-live="polite">
        {Locale.Mcp.Market.ToolsModal.Loading}
      </div>
    );
  }

  if (toolItems.length === 0) {
    return (
      <div className={styles["tools-list"]} role="status" aria-live="polite">
        {Locale.Mcp.Market.ToolsModal.NoTools}
      </div>
    );
  }

  return (
    <div
      className={styles["tools-list"]}
      role="list"
      aria-label={Locale.Mcp.Market.Actions.Tools}
    >
      {toolItems.map((tool) => (
        <div key={tool.name} className={styles["tool-item"]} role="listitem">
          <div className={styles["tool-name"]}>{tool.name}</div>
          <div className={styles["tool-description"]}>{tool.description}</div>
        </div>
      ))}
    </div>
  );
}
