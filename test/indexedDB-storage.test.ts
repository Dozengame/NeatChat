const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDel = jest.fn();
const mockClear = jest.fn();

jest.mock("idb-keyval", () => ({
  get: (...args: unknown[]) => mockGet(...args),
  set: (...args: unknown[]) => mockSet(...args),
  del: (...args: unknown[]) => mockDel(...args),
  clear: (...args: unknown[]) => mockClear(...args),
}));

import { rawIndexedDBStorage } from "../app/utils/indexedDB-storage";

describe("IndexedDB storage fallback cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue(undefined);
    mockSet.mockResolvedValue(undefined);
    mockDel.mockResolvedValue(undefined);
    mockClear.mockResolvedValue(undefined);
    localStorage.clear();
  });

  test("removes a stale local fallback after a successful IndexedDB write", async () => {
    localStorage.setItem("chat", "stale-chat");
    await rawIndexedDBStorage.setItem("chat", "new-chat");

    expect(mockSet).toHaveBeenCalledWith("chat", "new-chat");
    expect(localStorage.getItem("chat")).toBeNull();
  });

  test("removes both stores when IndexedDB deletion succeeds", async () => {
    localStorage.setItem("chat", "stale-chat");
    await rawIndexedDBStorage.removeItem("chat");

    expect(mockDel).toHaveBeenCalledWith("chat");
    expect(localStorage.getItem("chat")).toBeNull();
  });

  test("still removes the fallback when IndexedDB deletion fails", async () => {
    localStorage.setItem("chat", "stale-chat");
    mockDel.mockRejectedValueOnce(new Error("idb unavailable"));

    await expect(
      rawIndexedDBStorage.removeItem("chat"),
    ).resolves.toBeUndefined();
    expect(localStorage.getItem("chat")).toBeNull();
  });

  test("clears both stores regardless of IndexedDB availability", async () => {
    localStorage.setItem("chat", "stale-chat");
    await rawIndexedDBStorage.clear();
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(localStorage.length).toBe(0);

    jest.clearAllMocks();
    localStorage.setItem("chat", "stale-chat");
    mockClear.mockRejectedValueOnce(new Error("idb unavailable"));
    await expect(rawIndexedDBStorage.clear()).resolves.toBeUndefined();
    expect(localStorage.length).toBe(0);
  });
});
