"use client";

import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";
import { useChatStore } from "../store/chat";
import { useAccessStore } from "../store/access";
import { getClientConfig } from "../config/client";

import { Home } from "./home";

function useAppBootstrap() {
  const chatStoreHydrated = useChatStore((state) => state._hasHydrated);

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    const accessStore = useAccessStore.getState();
    accessStore.fetch();
    if (accessStore.needCode && accessStore.hasValidAccessCode()) {
      void accessStore.validateAccessCode();
    }
  }, []);

  useEffect(() => {
    if (chatStoreHydrated) {
      useChatStore.getState().newSession();
    }
  }, [chatStoreHydrated]);
}

export function AppPage(props: { isVercel?: boolean }) {
  useAppBootstrap();

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
