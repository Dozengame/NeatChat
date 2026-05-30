import clsx from "clsx";
import AddIcon from "../../icons/add.svg";
import EditIcon from "../../icons/edit.svg";
import EyeIcon from "../../icons/eye.svg";
import GithubIcon from "../../icons/github.svg";
import PlayIcon from "../../icons/play.svg";
import StopIcon from "../../icons/pause.svg";
import Locale from "../../locales";
import type {
  McpConfigData,
  PresetServer,
  ServerStatusResponse,
} from "../../mcp/types";
import { IconButton } from "../button";
import styles from "../mcp-market.module.scss";
import { getOperationStatusType } from "./helpers";

interface ServerListProps {
  clientStatuses: Record<string, ServerStatusResponse>;
  config?: McpConfigData;
  isLoading: boolean;
  loadingStates: Record<string, string>;
  presetServers: PresetServer[];
  searchText: string;
  onAddServer: (preset: PresetServer) => void;
  onConfigureServer: (serverId: string) => void;
  onPauseServer: (serverId: string) => void;
  onRestartServer: (serverId: string) => void;
  onViewTools: (serverId: string) => void;
}

const statusPriority: Record<string, number> = {
  error: 0,
  active: 1,
  initializing: 2,
  starting: 3,
  stopping: 4,
  paused: 5,
  undefined: 6,
};

function getEffectiveStatus(status: string, loading?: string) {
  if (loading) {
    const operationType = getOperationStatusType(loading);
    return operationType === "default" ? status : operationType;
  }

  if (status === "initializing") {
    return "active";
  }

  return status;
}

function getServerStatus(
  clientStatuses: Record<string, ServerStatusResponse>,
  clientId: string,
) {
  return clientStatuses[clientId] || { status: "undefined", errorMsg: null };
}

function ServerStatusDisplay({ status }: { status: ServerStatusResponse }) {
  if (status.status === "initializing") {
    return (
      <span className={clsx(styles["server-status"], styles["initializing"])}>
        Initializing
      </span>
    );
  }

  if (status.status === "paused") {
    return (
      <span className={clsx(styles["server-status"], styles["stopped"])}>
        Stopped
      </span>
    );
  }

  if (status.status === "active") {
    return <span className={styles["server-status"]}>Running</span>;
  }

  if (status.status === "error") {
    return (
      <span className={clsx(styles["server-status"], styles["error"])}>
        Error
        <span className={styles["error-message"]}>: {status.errorMsg}</span>
      </span>
    );
  }

  return null;
}

function getVisibleServers({
  clientStatuses,
  loadingStates,
  presetServers,
  searchText,
}: Pick<
  ServerListProps,
  "clientStatuses" | "loadingStates" | "presetServers" | "searchText"
>) {
  const searchLower = searchText.toLowerCase();

  return presetServers
    .filter((server) => {
      if (searchText.length === 0) return true;
      return (
        server.name.toLowerCase().includes(searchLower) ||
        server.description.toLowerCase().includes(searchLower) ||
        server.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      const aStatus = getServerStatus(clientStatuses, a.id).status;
      const bStatus = getServerStatus(clientStatuses, b.id).status;
      const aEffectiveStatus = getEffectiveStatus(aStatus, loadingStates[a.id]);
      const bEffectiveStatus = getEffectiveStatus(bStatus, loadingStates[b.id]);

      if (aEffectiveStatus !== bEffectiveStatus) {
        return (
          (statusPriority[aEffectiveStatus] ?? 6) -
          (statusPriority[bEffectiveStatus] ?? 6)
        );
      }

      return a.name.localeCompare(b.name);
    });
}

export function ServerList({
  clientStatuses,
  config,
  isLoading,
  loadingStates,
  presetServers,
  searchText,
  onAddServer,
  onConfigureServer,
  onPauseServer,
  onRestartServer,
  onViewTools,
}: ServerListProps) {
  if (!Array.isArray(presetServers) || presetServers.length === 0) {
    return (
      <div className={styles["empty-container"]}>
        <div className={styles["empty-text"]}>
          {Locale.Mcp.Market.NoServers}
        </div>
      </div>
    );
  }

  return (
    <>
      {getVisibleServers({
        clientStatuses,
        loadingStates,
        presetServers,
        searchText,
      }).map((server) => {
        const isAdded = server.id in (config?.mcpServers ?? {});
        const loadingState = loadingStates[server.id];
        const status = getServerStatus(clientStatuses, server.id);

        return (
          <div
            className={clsx(styles["mcp-market-item"], {
              [styles["loading"]]: loadingState,
            })}
            key={server.id}
          >
            <div className={styles["mcp-market-header"]}>
              <div className={styles["mcp-market-title"]}>
                <div className={styles["mcp-market-name"]}>
                  {server.name}
                  {loadingState && (
                    <span
                      className={styles["operation-status"]}
                      data-status={getOperationStatusType(loadingState)}
                    >
                      {loadingState}
                    </span>
                  )}
                  {!loadingState && <ServerStatusDisplay status={status} />}
                  {server.repo && (
                    <a
                      href={server.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles["repo-link"]}
                      title="Open repository"
                    >
                      <GithubIcon />
                    </a>
                  )}
                </div>
                <div className={styles["tags-container"]}>
                  {server.tags.map((tag) => (
                    <span key={tag} className={styles["tag"]}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div
                  className={clsx(styles["mcp-market-info"], "one-line")}
                  title={server.description}
                >
                  {server.description}
                </div>
              </div>
              <div className={styles["mcp-market-actions"]}>
                {isAdded ? (
                  <>
                    {server.configurable && (
                      <IconButton
                        icon={<EditIcon />}
                        text={Locale.Mcp.Market.Actions.Configure}
                        onClick={() => onConfigureServer(server.id)}
                        disabled={isLoading}
                      />
                    )}
                    {status.status === "paused" ? (
                      <IconButton
                        icon={<PlayIcon />}
                        text={Locale.Mcp.Market.Actions.Start}
                        onClick={() => onRestartServer(server.id)}
                        disabled={isLoading}
                      />
                    ) : (
                      <>
                        <IconButton
                          icon={<EyeIcon />}
                          text={Locale.Mcp.Market.Actions.Tools}
                          onClick={() => onViewTools(server.id)}
                          disabled={isLoading || status.status === "error"}
                        />
                        <IconButton
                          icon={<StopIcon />}
                          text={Locale.Mcp.Market.Actions.Stop}
                          onClick={() => onPauseServer(server.id)}
                          disabled={isLoading}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <IconButton
                    icon={<AddIcon />}
                    text={Locale.Mcp.Market.Actions.Add}
                    onClick={() => onAddServer(server)}
                    disabled={isLoading}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
