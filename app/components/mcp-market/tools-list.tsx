import Locale from "../../locales";
import type { ListToolsResponse } from "../../mcp/types";
import styles from "../mcp-market.module.scss";

export function ToolsList({
  error,
  isLoading,
  tools,
}: {
  error?: string | null;
  isLoading: boolean;
  tools: ListToolsResponse | null;
}) {
  const rawTools = tools?.tools;
  const toolItems = Array.isArray(rawTools) ? rawTools : [];

  if (isLoading) {
    return (
      <div
        className={`${styles["tools-list"]} ${styles["tools-loading"]}`}
        role="status"
        aria-live="polite"
      >
        <div className={styles["tools-state-title"]}>
          {Locale.Mcp.Market.ToolsModal.Loading}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${styles["tools-list"]} ${styles["tools-error"]}`}
        role="alert"
        aria-live="assertive"
      >
        <div className={styles["tools-state-title"]}>{error}</div>
        <div className={styles["tools-state-description"]}>
          {Locale.Mcp.Market.ToolsModal.LoadFailedHint}
        </div>
      </div>
    );
  }

  if (toolItems.length === 0) {
    return (
      <div
        className={`${styles["tools-list"]} ${styles["tools-empty"]}`}
        role="status"
        aria-live="polite"
      >
        <div className={styles["tools-state-title"]}>
          {Locale.Mcp.Market.ToolsModal.NoTools}
        </div>
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
