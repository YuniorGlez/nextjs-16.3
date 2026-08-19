import { defineConfig, devices } from "@playwright/test";

// Config de Playwright para el repo base nextjs-16.3.
// Arranca el servidor de producción (next start) sobre un build previo, o dev si no hay build.
// Los e2e cubren los caminos críticos que heredan TODAS las webs de clientes.
// Requiere: .env.local con DATABASE_URL (y ADMIN_PASSWORD para el login del admin).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Viewport móvil con el mismo Chromium instalado (no requiere WebKit).
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: "chromium" },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
