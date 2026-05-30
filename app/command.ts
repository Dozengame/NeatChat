import { useLayoutEffect } from "react";
import { useSearchParams as useRouterSearchParams } from "react-router-dom";
import Locale from "./locales";

type Command = (param: string) => void;
interface Commands {
  fill?: Command;
  submit?: Command;
  mask?: Command;
  code?: Command;
  settings?: Command;
}

const EMPTY_COMMANDS: Commands = {};
const EMPTY_CHAT_COMMANDS: ChatCommands = {};

function extractChatCommand(userInput: string) {
  const match = userInput.match(ChatCommandPrefix);
  if (match) {
    return userInput.slice(1) as keyof ChatCommands;
  }
  return userInput as keyof ChatCommands;
}

export function useCommand(commands: Commands = EMPTY_COMMANDS) {
  const [searchParams, setSearchParams] = useRouterSearchParams();

  useLayoutEffect(() => {
    let shouldUpdate = false;
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.forEach((param, name) => {
      const commandName = name as keyof Commands;
      const command = commands[commandName];
      if (typeof command === "function") {
        command(param);
        nextSearchParams.delete(name);
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      setSearchParams(nextSearchParams);
    }
  }, [searchParams, commands, setSearchParams]);
}

interface ChatCommands {
  new?: Command;
  newm?: Command;
  next?: Command;
  prev?: Command;
  clear?: Command;
  fork?: Command;
  del?: Command;
}

// Compatible with Chinese colon character "："
export const ChatCommandPrefix = /^[:：]/;

export function useChatCommand(commands: ChatCommands = EMPTY_CHAT_COMMANDS) {
  function search(userInput: string) {
    const input = extractChatCommand(userInput);
    const desc = Locale.Chat.Commands;
    return Object.keys(commands).flatMap((c) =>
      c.startsWith(input)
        ? [
            {
              title: desc[c as keyof ChatCommands],
              content: ":" + c,
            },
          ]
        : [],
    );
  }

  function match(userInput: string) {
    const command = extractChatCommand(userInput);
    const matched = typeof commands[command] === "function";

    return {
      matched,
      invoke: () => matched && commands[command]!(userInput),
    };
  }

  return { match, search };
}
