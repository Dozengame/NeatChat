import { mapWithConcurrencyLimit } from "../app/utils/file";

describe("PDF page extraction concurrency", () => {
  test("bounds parallel work and preserves page order", async () => {
    let active = 0;
    let peak = 0;
    const releases: Array<() => void> = [];

    const resultPromise = mapWithConcurrencyLimit(
      Array.from({ length: 12 }, (_, index) => index + 1),
      4,
      async (page) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise<void>((resolve) => releases.push(resolve));
        active -= 1;
        return `page-${page}`;
      },
    );

    for (let completed = 0; completed < 12; completed += 1) {
      while (releases.length === 0) {
        await Promise.resolve();
      }
      releases.shift()?.();
      await Promise.resolve();
    }

    await expect(resultPromise).resolves.toEqual(
      Array.from({ length: 12 }, (_, index) => `page-${index + 1}`),
    );
    expect(peak).toBe(4);
  });
});
