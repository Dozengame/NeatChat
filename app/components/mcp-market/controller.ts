import { useEffect, useMemo, useReducer } from "react";
import { useNavigate } from "react-router-dom";
import { Path } from "../../constant";
import Locale, { getLang } from "../../locales";
import {
  addMcpServer,
  getClientsStatus,
  getClientTools,
  getMcpConfigFromFile,
  isMcpEnabled,
  pauseMcpServer,
  restartAllClients,
  resumeMcpServer,
} from "../../mcp/actions";
import type {
  ListToolsResponse,
  McpConfigData,
  PresetServer,
  ServerStatusResponse,
} from "../../mcp/types";
import { useAccessStore } from "../../store/access";
import { useChatStore } from "../../store/chat";
import { showToast } from "../ui-lib-actions";
import {
  buildConfiguredServerConfig,
  buildServerConfigFromPreset,
  buildUserConfigFromServer,
} from "./helpers";
import { getPresetServersForLang } from "./presets";

interface MarketState {
  clientStatuses: Record<string, ServerStatusResponse>;
  config?: McpConfigData;
  editingServerId?: string;
  isLoading: boolean;
  loadingStates: Record<string, string>;
  mcpEnabled: boolean;
  searchText: string;
  tools: ListToolsResponse | null;
  userConfig: Record<string, any>;
  viewingServerId?: string;
}

type MarketAction =
  | { type: "close-config" }
  | { type: "close-tools" }
  | { type: "init-failed" }
  | { type: "init-start" }
  | {
      type: "init-success";
      clientStatuses: Record<string, ServerStatusResponse>;
      config: McpConfigData;
    }
  | {
      type: "open-config";
      editingServerId: string;
      userConfig: Record<string, any>;
    }
  | { type: "open-tools"; viewingServerId: string }
  | { type: "set-config"; config: McpConfigData }
  | {
      type: "set-loading-state";
      id: string;
      message: string | null;
    }
  | { type: "set-search-text"; searchText: string }
  | {
      type: "set-statuses";
      clientStatuses: Record<string, ServerStatusResponse>;
    }
  | { type: "set-tools"; tools: ListToolsResponse | null }
  | { type: "set-user-config"; userConfig: Record<string, any> };

const initialMarketState: MarketState = {
  clientStatuses: {},
  isLoading: false,
  loadingStates: {},
  mcpEnabled: false,
  searchText: "",
  tools: null,
  userConfig: {},
};

async function ensureMcpAccessSession() {
  const accessStore = useAccessStore.getState();
  if (!accessStore.needCode || !accessStore.hasValidAccessCode()) return;

  await accessStore.validateAccessCode();
}

function updateLoadingStates(
  loadingStates: Record<string, string>,
  id: string,
  message: string | null,
) {
  if (message === null) {
    const { [id]: _removed, ...rest } = loadingStates;
    return rest;
  }

  return { ...loadingStates, [id]: message };
}

function marketReducer(state: MarketState, action: MarketAction): MarketState {
  switch (action.type) {
    case "close-config":
      return { ...state, editingServerId: undefined };
    case "close-tools":
      return { ...state, viewingServerId: undefined };
    case "init-failed":
      return { ...state, isLoading: false, mcpEnabled: true };
    case "init-start":
      return { ...state, isLoading: true, mcpEnabled: true };
    case "init-success":
      return {
        ...state,
        clientStatuses: action.clientStatuses,
        config: action.config,
        isLoading: false,
        mcpEnabled: true,
      };
    case "open-config":
      return {
        ...state,
        editingServerId: action.editingServerId,
        userConfig: action.userConfig,
      };
    case "open-tools":
      return {
        ...state,
        tools: null,
        viewingServerId: action.viewingServerId,
      };
    case "set-config":
      return { ...state, config: action.config };
    case "set-loading-state":
      return {
        ...state,
        loadingStates: updateLoadingStates(
          state.loadingStates,
          action.id,
          action.message,
        ),
      };
    case "set-search-text":
      return { ...state, searchText: action.searchText };
    case "set-statuses":
      return { ...state, clientStatuses: action.clientStatuses };
    case "set-tools":
      return { ...state, tools: action.tools };
    case "set-user-config":
      return { ...state, userConfig: action.userConfig };
    default:
      return state;
  }
}

export function useMcpMarketController() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(marketReducer, initialMarketState);
  const presetServers = useMemo(() => getPresetServersForLang(getLang()), []);
  const editingPreset = presetServers.find(
    (server) => server.id === state.editingServerId,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      await ensureMcpAccessSession();

      const enabled = await isMcpEnabled();

      if (!enabled) {
        navigate(Path.Home);
        return;
      }

      dispatch({ type: "init-start" });

      try {
        const [config, clientStatuses] = await Promise.all([
          getMcpConfigFromFile(),
          getClientsStatus(),
        ]);

        if (!cancelled) {
          dispatch({ type: "init-success", config, clientStatuses });
        }
      } catch (error) {
        console.error("Failed to load initial state:", error);
        showToast(Locale.Mcp.Market.Errors.InitFailed);

        if (!cancelled) {
          dispatch({ type: "init-failed" });
        }
      }
    }

    loadInitialState();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!state.mcpEnabled || !state.config) return;

    const updateStatuses = async () => {
      const clientStatuses = await getClientsStatus();
      dispatch({ type: "set-statuses", clientStatuses });
    };

    updateStatuses();
    const timer = setInterval(updateStatuses, 1000);

    return () => clearInterval(timer);
  }, [state.mcpEnabled, state.config]);

  const updateLoadingState = (id: string, message: string | null) => {
    dispatch({ type: "set-loading-state", id, message });
  };

  const openConfigModal = (serverId: string) => {
    const preset = presetServers.find((server) => server.id === serverId);
    dispatch({
      type: "open-config",
      editingServerId: serverId,
      userConfig: buildUserConfigFromServer(preset, state.config, serverId),
    });
  };

  const saveServerConfig = async () => {
    const editingServerId = state.editingServerId;
    const preset = presetServers.find(
      (server) => server.id === editingServerId,
    );
    if (!preset || !preset.configSchema || !editingServerId) return;

    dispatch({ type: "close-config" });

    try {
      updateLoadingState(editingServerId, "Updating configuration...");
      const serverConfig = buildConfiguredServerConfig(
        preset,
        state.userConfig,
      );
      const config = await addMcpServer(editingServerId, serverConfig);
      dispatch({ type: "set-config", config });
      useChatStore.getState().resetMcpCache();
      showToast(Locale.Mcp.Market.Errors.ConfigUpdateSuccess);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save configuration",
      );
    } finally {
      updateLoadingState(editingServerId, null);
    }
  };

  const loadTools = async (id: string) => {
    try {
      dispatch({ type: "open-tools", viewingServerId: id });
      const tools = await getClientTools(id);
      if (tools) {
        dispatch({ type: "set-tools", tools });
      } else {
        throw new Error("Failed to load tools");
      }
    } catch (error) {
      showToast(Locale.Mcp.Market.Errors.ToolsLoadFailed);
      console.error(error);
      dispatch({ type: "set-tools", tools: null });
    }
  };

  const addServer = async (preset: PresetServer) => {
    if (preset.configurable) {
      openConfigModal(preset.id);
      return;
    }

    try {
      updateLoadingState(preset.id, "Creating MCP client...");
      const serverConfig = buildServerConfigFromPreset(preset);
      const config = await addMcpServer(preset.id, serverConfig);
      dispatch({ type: "set-config", config });
      useChatStore.getState().resetMcpCache();

      const clientStatuses = await getClientsStatus();
      dispatch({ type: "set-statuses", clientStatuses });
    } finally {
      updateLoadingState(preset.id, null);
    }
  };

  const pauseServer = async (id: string) => {
    try {
      updateLoadingState(id, "Stopping server...");
      const config = await pauseMcpServer(id);
      dispatch({ type: "set-config", config });
      useChatStore.getState().resetMcpCache();
      showToast(Locale.Mcp.Market.Errors.StopSuccess);
    } catch (error) {
      showToast(Locale.Mcp.Market.Errors.StopFailed);
      console.error(error);
    } finally {
      updateLoadingState(id, null);
    }
  };

  const restartServer = async (id: string) => {
    try {
      updateLoadingState(id, "Starting server...");
      await resumeMcpServer(id);
      useChatStore.getState().resetMcpCache();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Failed to start server, please check logs",
      );
      console.error(error);
    } finally {
      updateLoadingState(id, null);
    }
  };

  const restartAllServers = async () => {
    try {
      updateLoadingState("all", "Restarting all servers...");
      const config = await restartAllClients();
      dispatch({ type: "set-config", config });
      useChatStore.getState().resetMcpCache();
      showToast(Locale.Mcp.Market.Errors.RestartSuccess);
    } catch (error) {
      showToast(Locale.Mcp.Market.Errors.RestartFailed);
      console.error(error);
    } finally {
      updateLoadingState("all", null);
    }
  };

  const navigateBack = async () => {
    if (state.config) {
      useChatStore.getState().resetMcpCache();
      await useChatStore.getState().initMcp();
    }

    navigate(-1);
  };

  return {
    editingPreset,
    presetServers,
    state,
    addServer,
    closeConfig: () => dispatch({ type: "close-config" }),
    closeTools: () => dispatch({ type: "close-tools" }),
    loadTools,
    navigateBack,
    openConfigModal,
    pauseServer,
    restartAllServers,
    restartServer,
    saveServerConfig,
    setSearchText: (searchText: string) =>
      dispatch({ type: "set-search-text", searchText }),
    setUserConfig: (userConfig: Record<string, any>) =>
      dispatch({ type: "set-user-config", userConfig }),
  };
}
