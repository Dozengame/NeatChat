import { StateStorage } from "zustand/middleware";
import { get, set, del, clear } from "idb-keyval";
import { safeLocalStorage } from "@/app/utils/storage";

const localStorage = safeLocalStorage();

class IndexedDBStorage implements StateStorage {
  constructor(private readonly validateHydration = true) {}

  public async getItem(name: string): Promise<string | null> {
    try {
      const value = (await get(name)) || localStorage.getItem(name);
      return value;
    } catch (error) {
      return localStorage.getItem(name);
    }
  }

  public async setItem(name: string, value: string): Promise<void> {
    try {
      if (this.validateHydration) {
        const parsedValue = JSON.parse(value);
        if (!parsedValue?.state?._hasHydrated) {
          return;
        }
      }
      await set(name, value);
      localStorage.removeItem(name);
    } catch (error) {
      localStorage.setItem(name, value);
    }
  }

  public async removeItem(name: string): Promise<void> {
    try {
      await del(name);
    } catch (error) {
      // The local fallback is authoritative while IndexedDB is unavailable.
    }
    localStorage.removeItem(name);
  }

  public async clear(): Promise<void> {
    try {
      await clear();
    } catch (error) {
      // Always clear the fallback even when IndexedDB cannot be reached.
    }
    localStorage.clear();
  }
}

export const indexedDBStorage = new IndexedDBStorage();
export const rawIndexedDBStorage = new IndexedDBStorage(false);
