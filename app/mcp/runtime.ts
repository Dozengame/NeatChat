import type { McpClientData, McpConfigData } from "./types";

export const clientsMap = new Map<string, McpClientData>();

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
