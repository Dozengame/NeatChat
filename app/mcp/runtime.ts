import type { McpClientData, McpConfigData } from "./types";

export const clientsMap = new Map<string, McpClientData>();

const clientLifecycleTails = new Map<string, Promise<unknown>>();
let configMutationTail: Promise<unknown> = Promise.resolve();

export function runMcpClientLifecycle<T>(
  clientId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous = clientLifecycleTails.get(clientId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  let tracked: Promise<T>;
  tracked = current.finally(() => {
    if (clientLifecycleTails.get(clientId) === tracked) {
      clientLifecycleTails.delete(clientId);
    }
  });
  clientLifecycleTails.set(clientId, tracked);
  return tracked;
}

export function runMcpConfigMutation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const current = configMutationTail.catch(() => undefined).then(operation);
  let tracked: Promise<T>;
  tracked = current.finally(() => {
    if (configMutationTail === tracked) {
      configMutationTail = Promise.resolve();
    }
  });
  configMutationTail = tracked;
  return tracked;
}

let initializeMcpSystemPromise: Promise<McpConfigData | undefined> | null =
  null;

export function getInitializeMcpSystemPromise() {
  return initializeMcpSystemPromise;
}

export function setInitializeMcpSystemPromise(
  promise: Promise<McpConfigData | undefined> | null,
) {
  initializeMcpSystemPromise = promise;
}
