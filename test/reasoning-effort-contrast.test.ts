import fs from "node:fs";
import path from "node:path";

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("reasoning rail contrast", () => {
  test("keeps the highest value readable on the dark panel", () => {
    const styles = fs.readFileSync(
      path.join(
        process.cwd(),
        "app/components/reasoning-effort-rail.module.scss",
      ),
      "utf8",
    );
    expect(styles).toContain(":global(.dark) .highest .value");
    expect(contrast("#a77df7", "#1f2225")).toBeGreaterThanOrEqual(4.5);
  });
});
