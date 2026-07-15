export type ComposerSubmitState = "disabled" | "send" | "stop";

export function getComposerSubmitState(input: {
  hasContent: boolean;
  uploading: boolean;
  readOnly: boolean;
  loading: boolean;
  streamingMessageIds: readonly string[];
}): ComposerSubmitState {
  if (input.streamingMessageIds.length > 0) return "stop";
  if (input.uploading || input.readOnly || input.loading || !input.hasContent) {
    return "disabled";
  }
  return "send";
}
