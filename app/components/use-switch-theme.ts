import { useEffect, useRef } from "react";

import { useAppConfig } from "../store/config";
import { getCSSVar } from "../utils";

export function useSwitchTheme() {
  const config = useAppConfig();
  const didApplyInitialTheme = useRef(false);

  useEffect(() => {
    const applyTheme = () => {
      const theme = useAppConfig.getState().theme;

      document.body.classList.remove("light");
      document.body.classList.remove("dark");

      if (theme === "dark") {
        document.body.classList.add("dark");
      } else if (theme === "light") {
        document.body.classList.add("light");
      }

      const metaDescriptionDark = document.querySelector(
        'meta[name="theme-color"][media*="dark"]',
      );
      const metaDescriptionLight = document.querySelector(
        'meta[name="theme-color"][media*="light"]',
      );

      if (theme === "auto") {
        metaDescriptionDark?.setAttribute("content", "#151515");
        metaDescriptionLight?.setAttribute("content", "#fafafa");
      } else {
        const themeColor = getCSSVar("--theme-color");
        metaDescriptionDark?.setAttribute("content", themeColor);
        metaDescriptionLight?.setAttribute("content", themeColor);
      }
    };

    // 支持 View Transitions 的浏览器做一次根视图淡入过渡，其余瞬时切换
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const startViewTransition = (
      document as Document & {
        startViewTransition?: (update: () => void) => unknown;
      }
    ).startViewTransition;

    if (didApplyInitialTheme.current && !reduceMotion && startViewTransition) {
      startViewTransition.call(document, applyTheme);
    } else {
      applyTheme();
    }
    didApplyInitialTheme.current = true;
  }, [config.theme]);
}
