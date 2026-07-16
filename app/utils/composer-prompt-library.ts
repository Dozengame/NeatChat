import type { Prompt } from "../store/prompt";

export type ComposerPromptFilter = "all" | "user" | "builtin";

export function filterComposerPrompts(
  prompts: Prompt[],
  filter: ComposerPromptFilter,
) {
  if (filter === "user") {
    return prompts.filter((prompt) => prompt.isUser === true);
  }

  if (filter === "builtin") {
    return prompts.filter((prompt) => prompt.isUser !== true);
  }

  return prompts;
}
