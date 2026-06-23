import CloseIcon from "../icons/close.svg";
import RestartIcon from "../icons/reload.svg";
import Locale from "../locales";
import { IconButton } from "./button";
import { ErrorBoundary } from "./error";
import { ConfigForm } from "./mcp-market/config-form";
import { useMcpMarketController } from "./mcp-market/controller";
import { ServerList } from "./mcp-market/server-list";
import { ToolsList } from "./mcp-market/tools-list";
import styles from "./mcp-market.module.scss";
import { Modal } from "./ui-lib";

export function McpMarketPage() {
  const {
    editingPreset,
    presetServers,
    state,
    addServer,
    closeConfig,
    closeTools,
    loadTools,
    navigateBack,
    openConfigModal,
    pauseServer,
    restartAllServers,
    restartServer,
    saveServerConfig,
    setSearchText,
    setUserConfig,
  } = useMcpMarketController();

  if (!state.mcpEnabled) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className={styles["mcp-market-page"]}>
        <div className="window-header">
          <div className="window-header-title">
            <div className="window-header-main-title">
              {Locale.Mcp.Market.Title}
              {state.loadingStates["all"] && (
                <span className={styles["loading-indicator"]}>
                  {state.loadingStates["all"]}
                </span>
              )}
            </div>
            <div className="window-header-sub-title">
              {Locale.Mcp.Market.SubTitle(
                Object.keys(state.config?.mcpServers ?? {}).length,
              )}
            </div>
          </div>

          <div className="window-actions">
            <div className="window-action-button">
              <IconButton
                icon={<RestartIcon />}
                bordered
                onClick={restartAllServers}
                text={Locale.Mcp.Market.Actions.RestartAll}
                disabled={state.isLoading}
              />
            </div>
            <div className="window-action-button">
              <IconButton
                icon={<CloseIcon />}
                bordered
                onClick={navigateBack}
                disabled={state.isLoading}
              />
            </div>
          </div>
        </div>

        <div className={styles["mcp-market-page-body"]}>
          <div className={styles["mcp-market-filter"]}>
            <input
              type="text"
              aria-label={Locale.Mcp.Market.SearchPlaceholder}
              aria-controls="mcp-market-server-results"
              className={styles["search-bar"]}
              placeholder={Locale.Mcp.Market.SearchPlaceholder}
              onInput={(event) => setSearchText(event.currentTarget.value)}
            />
          </div>

          <ServerList
            clientStatuses={state.clientStatuses}
            config={state.config}
            isLoading={state.isLoading}
            loadingStates={state.loadingStates}
            presetServers={presetServers}
            searchText={state.searchText}
            onAddServer={addServer}
            onConfigureServer={openConfigModal}
            onPauseServer={pauseServer}
            onRestartServer={restartServer}
            onViewTools={loadTools}
          />
        </div>

        {state.editingServerId && (
          <div className="modal-mask">
            <Modal
              title={`${Locale.Mcp.Market.ConfigModal.Title}${state.editingServerId}`}
              onClose={() => !state.isLoading && closeConfig()}
              actions={[
                <IconButton
                  key="cancel"
                  text={Locale.Mcp.Market.ConfigModal.Cancel}
                  onClick={closeConfig}
                  bordered
                  disabled={state.isLoading}
                />,
                <IconButton
                  key="confirm"
                  text={Locale.Mcp.Market.ConfigModal.Save}
                  type="primary"
                  onClick={saveServerConfig}
                  bordered
                  disabled={state.isLoading}
                />,
              ]}
            >
              <ConfigForm
                preset={editingPreset}
                userConfig={state.userConfig}
                onUserConfigChange={setUserConfig}
              />
            </Modal>
          </div>
        )}

        {state.viewingServerId && (
          <div className="modal-mask">
            <Modal
              title={`${Locale.Mcp.Market.ToolsModal.Title}${state.viewingServerId}`}
              onClose={closeTools}
              actions={[
                <IconButton
                  key="close"
                  text={Locale.Mcp.Market.ToolsModal.Close}
                  onClick={closeTools}
                  bordered
                />,
              ]}
            >
              <ToolsList
                error={state.toolsError}
                isLoading={state.toolsLoading}
                tools={state.tools}
              />
            </Modal>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
