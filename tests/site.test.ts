import { describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/lib/site";

describe("siteConfig", () => {
  it("define metadatos base de forma coherente", () => {
    expect(typeof siteConfig.name).toBe("string");
    expect(siteConfig.name.length).toBeGreaterThan(0);
    expect(siteConfig.locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    expect(siteConfig.themeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(typeof siteConfig.organization.type).toBe("string");
    expect(siteConfig.organization.type.length).toBeGreaterThan(0);
  });

  it("usa una URL por defecto https sin variable de entorno", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    expect(siteConfig.url).toMatch(/^https:\/\/.+/);
    vi.unstubAllEnvs();
  });

  it("respeta NEXT_PUBLIC_SITE_URL cuando está definida", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://miproyecto.es");
    vi.resetModules();
    const reloaded = await import("@/lib/site");
    expect(reloaded.siteConfig.url).toBe("https://miproyecto.es");
    vi.unstubAllEnvs();
  });
});