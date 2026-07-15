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
    const globals = fs.readFileSync(
      path.join(process.cwd(), "app/styles/globals.scss"),
      "utf8",
    );
    expect(styles).toMatch(
      /\.highest\s*\{[\s\S]*\.value\s*\{[\s\S]*color:\s*var\(--composer-rail-accent-text\);/,
    );
    expect(globals).toMatch(
      /@mixin dark[\s\S]*--composer-rail-accent-text:\s*rgb\(178, 143, 249\);/,
    );
    expect(contrast("#b28ff9", "#1e2124")).toBeGreaterThanOrEqual(4.5);
  });
});
