import fs from "fs";
import path from "path";

describe("startup page cache and service worker registration", () => {
  test("keeps the app shell export-compatible", () => {
    const page = fs.readFileSync(
      path.join(process.cwd(), "app/page.tsx"),
      "utf8",
    );

    expect(page).not.toContain('export const dynamic = "force-dynamic"');
    expect(page).not.toContain("export const revalidate = 0");
    expect(page).not.toContain('export const fetchCache = "force-no-store"');
  });

  test("keeps only the standalone app shell out of shared caches", () => {
    const page = fs.readFileSync(
      path.join(process.cwd(), "app/page.tsx"),
      "utf8",
    );

    expect(page).toContain("unstable_noStore as noStore");
    expect(page).toContain('process.env.BUILD_MODE !== "export"');
    expect(page).toContain("noStore();");
  });

  test("does not reload the first page load during service worker install", () => {
    const registerScript = fs.readFileSync(
      path.join(process.cwd(), "public/serviceWorkerRegister.js"),
      "utf8",
    );

    expect(registerScript).not.toContain("window.location.reload");
  });

  test("only enables service worker cache after the page is controlled", () => {
    const registerScript = fs.readFileSync(
      path.join(process.cwd(), "public/serviceWorkerRegister.js"),
      "utf8",
    );
    const serviceWorker = fs.readFileSync(
      path.join(process.cwd(), "public/serviceWorker.js"),
      "utf8",
    );

    expect(registerScript).toContain("navigator.serviceWorker.controller");
    expect(registerScript).toContain("controllerchange");
    expect(registerScript).not.toContain("window._SW_ENABLED = true");
    expect(serviceWorker).toContain("self.clients.claim()");
  });
});
