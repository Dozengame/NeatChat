"use client";

import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import { useChatStore } from "../store/chat";

import { Home } from "./home";

export function AppPage(props: { isVercel?: boolean }) {
  const chatStoreHydrated = useChatStore((state) => state._hasHydrated);

  useEffect(() => {
    useChatStore.getState().initMcp();
  }, []);

  useEffect(() => {
    if (chatStoreHydrated) {
      useChatStore.getState().newSession();
    }
  }, [chatStoreHydrated]);

  return (
    <>
      <Home />
      {props.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
