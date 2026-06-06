import { useEffect, useState } from "react";

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
const COMPACT_MAX_WIDTH = 767;

export function useMobileScreen() {
  const { width } = useWindowSize();

  return width <= MOBILE_MAX_WIDTH;
}

export function useCompactScreen() {
  const { width } = useWindowSize();

  return width <= COMPACT_MAX_WIDTH;
}
