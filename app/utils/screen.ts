import { useEffect, useState } from "react";
import { useAppConfig } from "../store/config";
import { shouldUseCompactLayout } from "./responsive-layout";

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return size;
}

const MOBILE_MAX_WIDTH = 600;

export function useMobileScreen() {
  const { width } = useWindowSize();

  return width <= MOBILE_MAX_WIDTH;
}

export function useCompactScreen() {
  const sidebarWidth = useAppConfig((state) => state.sidebarWidth);
  const [isCompactScreen, setIsCompactScreen] = useState(() =>
    typeof window === "undefined"
      ? false
      : shouldUseCompactLayout(window.innerWidth, sidebarWidth),
  );

  useEffect(() => {
    const updateCompactScreen = () => {
      setIsCompactScreen(
        shouldUseCompactLayout(window.innerWidth, sidebarWidth),
      );
    };

    updateCompactScreen();
    window.addEventListener("resize", updateCompactScreen);

    return () => {
      window.removeEventListener("resize", updateCompactScreen);
    };
  }, [sidebarWidth]);

  return isCompactScreen;
}
