export function safeLocalStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
} {
  let storage: Storage | null = null;
  const canWarn = typeof window !== "undefined";

  try {
    if (canWarn && window.localStorage) {
      storage = window.localStorage;
    }
  } catch (e) {
    if (canWarn) {
      console.error("localStorage is not available:", e);
    }
    storage = null;
  }

  return {
    getItem(key: string): string | null {
      if (storage) {
        return storage.getItem(key);
      } else if (canWarn) {
        console.warn(
          `Attempted to get item "${key}" from localStorage, but localStorage is not available.`,
        );
      }
      return null;
    },
    setItem(key: string, value: string): void {
      if (storage) {
        storage.setItem(key, value);
      } else if (canWarn) {
        console.warn(
          `Attempted to set item "${key}" in localStorage, but localStorage is not available.`,
        );
      }
    },
    removeItem(key: string): void {
      if (storage) {
        storage.removeItem(key);
      } else if (canWarn) {
        console.warn(
          `Attempted to remove item "${key}" from localStorage, but localStorage is not available.`,
        );
      }
    },
    clear(): void {
      if (storage) {
        storage.clear();
      } else if (canWarn) {
        console.warn(
          "Attempted to clear localStorage, but localStorage is not available.",
        );
      }
    },
  };
}
