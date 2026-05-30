"use client";

require("../polyfill");

import {
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import styles from "./home.module.scss";

import { getCSSVar, useCompactScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import { getISOLang, getLang } from "../locales";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { type ClientApi, getClientApi } from "../client/api";
import { useAccessStore } from "../store/access";
import clsx from "clsx";
import { UpdateAnnouncement } from "./update-announcement";
import { Loading } from "./loading";

const Artifacts = dynamic(async () => (await import("./artifacts")).Artifacts, {
  loading: () => <Loading noLogo />,
});

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

const PluginPage = dynamic(async () => (await import("./plugin")).PluginPage, {
  loading: () => <Loading noLogo />,
});

const SearchChat = dynamic(
  async () => (await import("./search-chat")).SearchChatPage,
  {
    loading: () => <Loading noLogo />,
  },
);

const Sd = dynamic(async () => (await import("./sd")).Sd, {
  loading: () => <Loading noLogo />,
});

const McpMarketPage = dynamic(
  async () => (await import("./mcp-market")).McpMarketPage,
  {
    loading: () => <Loading noLogo />,
  },
);

function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const subscribeHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;
const useHasHydrated = () =>
  useSyncExternalStore(
    subscribeHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};

export function WindowContent(props: { children: React.ReactNode }) {
  return (
    <div className={styles["window-content"]} id={SlotID.AppBody}>
      {props?.children}
    </div>
  );
}

function ScreenContent(props: {
  isAuth: boolean;
  isHome: boolean;
  isSd: boolean;
  isSdNew: boolean;
  shouldRequireAccessCode: boolean;
}) {
  const { isAuth, isHome, isSd, isSdNew, shouldRequireAccessCode } = props;

  if (shouldRequireAccessCode) return <AuthPage />;
  if (isAuth) return <AuthPage />;
  if (isSd) return <Sd />;
  if (isSdNew) return <Sd />;
  return (
    <>
      <SideBar
        className={clsx({
          [styles["sidebar-show"]]: isHome,
        })}
      />
      <WindowContent>
        <Routes>
          <Route path={Path.Home} element={<Chat />} />
          <Route path={Path.NewChat} element={<NewChat />} />
          <Route path={Path.Masks} element={<MaskPage />} />
          <Route path={Path.Plugins} element={<PluginPage />} />
          <Route path={Path.SearchChat} element={<SearchChat />} />
          <Route path={Path.Chat} element={<Chat />} />
          <Route path={Path.Settings} element={<Settings />} />
          <Route path={Path.McpMarket} element={<McpMarketPage />} />
        </Routes>
      </WindowContent>
    </>
  );
}

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const didRouteMobileStartupRef = useRef(false);
  const isArtifact = location.pathname.includes(Path.Artifacts);
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isSd = location.pathname === Path.Sd;
  const isSdNew = location.pathname === Path.SdNew;
  const clientConfig = getClientConfig();
  const accessStore = useAccessStore();
  const {
    accessCode,
    accessCodeValidatedAt,
    validatedAccessCode,
    isValidatingAccessCode,
    validateAccessCode,
  } = accessStore;
  const isAccessControlled =
    !clientConfig?.isApp && accessStore.enabledAccessControl();
  const shouldWaitForServerConfig =
    accessStore._hasHydrated &&
    !clientConfig?.isApp &&
    !accessStore.hasFetchedServerConfig();
  const shouldRequireAccessCode =
    accessStore._hasHydrated &&
    !shouldWaitForServerConfig &&
    isAccessControlled &&
    !accessStore.hasValidAccessCode();

  const isCompactScreen = useCompactScreen();
  const shouldTightBorder =
    (clientConfig?.isApp || config.tightBorder) && !isCompactScreen;

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  useEffect(() => {
    if (
      !didRouteMobileStartupRef.current &&
      accessStore._hasHydrated &&
      isCompactScreen &&
      !shouldWaitForServerConfig &&
      !shouldRequireAccessCode
    ) {
      didRouteMobileStartupRef.current = true;
      if (isHome) {
        navigate(Path.Chat, { replace: true });
      }
    }
  }, [
    accessStore._hasHydrated,
    isHome,
    isCompactScreen,
    navigate,
    shouldRequireAccessCode,
    shouldWaitForServerConfig,
  ]);

  useEffect(() => {
    if (
      shouldRequireAccessCode &&
      accessCode &&
      accessCodeValidatedAt > 0 &&
      validatedAccessCode === accessCode &&
      !isValidatingAccessCode
    ) {
      validateAccessCode();
    }
  }, [
    shouldRequireAccessCode,
    accessCode,
    accessCodeValidatedAt,
    validatedAccessCode,
    isValidatingAccessCode,
    validateAccessCode,
  ]);

  if (!accessStore._hasHydrated || shouldWaitForServerConfig) {
    return <Loading />;
  }

  if (isArtifact && !shouldRequireAccessCode) {
    return (
      <Routes>
        <Route path="/artifacts/:id" element={<Artifacts />} />
      </Routes>
    );
  }
  return (
    <div
      className={clsx(styles.container, {
        [styles["tight-container"]]: shouldTightBorder,
        [styles["compact-container"]]: isCompactScreen,
        [styles["rtl-screen"]]: getLang() === ("ar" as any),
      })}
    >
      <ScreenContent
        isAuth={isAuth}
        isHome={isHome}
        isSd={isSd}
        isSdNew={isSdNew}
        shouldRequireAccessCode={shouldRequireAccessCode}
      />
      <UpdateAnnouncement
        enabled={!shouldRequireAccessCode && !isAuth}
        announcement={accessStore.serverConfigSnapshot?.updateAnnouncement}
        deploymentId={accessStore.serverConfigSnapshot?.deploymentId}
      />
    </div>
  );
}

function useLoadData() {
  const providerName = useAppConfig((state) => state.modelConfig.providerName);
  const accessCodeValidatedAt = useAccessStore(
    (state) => state.accessCodeValidatedAt,
  );
  const needCode = useAccessStore((state) => state.needCode);
  const clientConfig = useMemo(() => getClientConfig(), []);

  const api: ClientApi = useMemo(
    () => getClientApi(providerName),
    [providerName],
  );

  useEffect(() => {
    const accessStore = useAccessStore.getState();
    if (
      !clientConfig?.isApp &&
      accessStore.enabledAccessControl() &&
      !accessStore.hasValidAccessCode()
    ) {
      return;
    }

    let cancelled = false;
    (async () => {
      const models = await api.llm.models();
      if (!cancelled) {
        useAppConfig.getState().mergeModels(models);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessCodeValidatedAt, api.llm, clientConfig?.isApp, needCode]);
}

export function Home() {
  useSwitchTheme();
  useLoadData();
  useHtmlLang();

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
