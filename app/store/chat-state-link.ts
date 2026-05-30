type ChatStateUpdater = (updater: (state: any) => any) => void;
type ChatStoreApi = {
  getState: () => { _hasHydrated?: boolean; currentSession?: () => any };
  subscribe: (listener: () => void) => () => void;
  setState: ChatStateUpdater;
};

let updateChatState: ChatStateUpdater | undefined;
let chatStoreApi: ChatStoreApi | undefined;

export function registerChatStore(store: ChatStoreApi) {
  chatStoreApi = store;
  updateChatState = (updater) => store.setState(updater);
}

export function applyChatStateUpdate(updater: (state: any) => any) {
  updateChatState?.(updater);
}

export function getRegisteredChatStore() {
  return chatStoreApi;
}
