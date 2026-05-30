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
    return <div>{Locale.Mcp.Market.ToolsModal.Loading}</div>;
  }

  if (toolItems.length === 0) {
    return <div>{Locale.Mcp.Market.ToolsModal.NoTools}</div>;
  }

  return (
    <>
      {toolItems.map((tool) => (
        <div key={tool.name} className={styles["tool-item"]}>
          <div className={styles["tool-name"]}>{tool.name}</div>
          <div className={styles["tool-description"]}>{tool.description}</div>
        </div>
      ))}
    </>
  );
}
