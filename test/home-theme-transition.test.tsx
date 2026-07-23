import { act, renderHook } from "@testing-library/react";

import { useSwitchTheme } from "../app/components/use-switch-theme";
import { Theme, useAppConfig } from "../app/store/config";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

describe("Home theme transition", () => {
  const originalTheme = useAppConfig.getState().theme;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    document.body.className = "";
    document.head.innerHTML = `
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="">
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="">
    `;
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    jest.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => {
            if (name !== "--theme-color") return "";
            return document.body.classList.contains("dark")
              ? "#151515"
              : "#fafafa";
          },
        }) as CSSStyleDeclaration,
    );
  });

  afterEach(() => {
    useAppConfig.setState({ theme: originalTheme });
    document.body.className = "";
    document.head.innerHTML = "";
    window.matchMedia = originalMatchMedia;
    delete (document as ViewTransitionDocument).startViewTransition;
    jest.restoreAllMocks();
  });

  test("updates theme-color only after the View Transition applies the new class", () => {
    let pendingUpdate: (() => void) | undefined;
    const startViewTransition = jest.fn((update: () => void) => {
      pendingUpdate = update;
      return {};
    });
    (document as ViewTransitionDocument).startViewTransition =
      startViewTransition;
    useAppConfig.setState({ theme: Theme.Light });

    const { unmount } = renderHook(() => useSwitchTheme());
    const darkMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][media*="dark"]',
    );
    const lightMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][media*="light"]',
    );

    expect(document.body).toHaveClass("light");
    expect(darkMeta).toHaveAttribute("content", "#fafafa");
    expect(lightMeta).toHaveAttribute("content", "#fafafa");

    act(() => {
      useAppConfig.setState({ theme: Theme.Dark });
    });

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(pendingUpdate).toBeDefined();
    expect(document.body).toHaveClass("light");
    expect(darkMeta).toHaveAttribute("content", "#fafafa");
    expect(lightMeta).toHaveAttribute("content", "#fafafa");

    act(() => pendingUpdate?.());

    expect(document.body).toHaveClass("dark");
    expect(document.body).not.toHaveClass("light");
    expect(darkMeta).toHaveAttribute("content", "#151515");
    expect(lightMeta).toHaveAttribute("content", "#151515");
    unmount();
  });

  test("keeps the latest theme when View Transition callbacks finish out of order", () => {
    const pendingUpdates: Array<() => void> = [];
    const startViewTransition = jest.fn((update: () => void) => {
      pendingUpdates.push(update);
      return {};
    });
    (document as ViewTransitionDocument).startViewTransition =
      startViewTransition;
    useAppConfig.setState({ theme: Theme.Light });

    const { unmount } = renderHook(() => useSwitchTheme());
    const darkMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][media*="dark"]',
    );
    const lightMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][media*="light"]',
    );

    act(() => {
      useAppConfig.setState({ theme: Theme.Dark });
    });
    act(() => {
      useAppConfig.setState({ theme: Theme.Light });
    });

    expect(startViewTransition).toHaveBeenCalledTimes(2);
    expect(pendingUpdates).toHaveLength(2);

    act(() => {
      pendingUpdates[1]?.();
      pendingUpdates[0]?.();
    });

    expect(useAppConfig.getState().theme).toBe(Theme.Light);
    expect(document.body).toHaveClass("light");
    expect(document.body).not.toHaveClass("dark");
    expect(darkMeta).toHaveAttribute("content", "#fafafa");
    expect(lightMeta).toHaveAttribute("content", "#fafafa");
    unmount();
  });
});
