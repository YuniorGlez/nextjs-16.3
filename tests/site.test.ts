import { describe, expect, it, vi } from "vitest";
import { siteConfig } from "@/lib/site";

describe("siteConfig", () => {
  it("define los metadatos base de la plantilla", () => {
    expect(siteConfig.name).toBe("Next.js Base");
    expect(siteConfig.tagline).toMatch(/Base whitelabel/);
    expect(siteConfig.locale).toBe("es_ES");
    expect(siteConfig.themeColor).toBe("#000000");
    expect(siteConfig.organization.type).toBe("Organization");
  });

  it("usa example.com como URL por defecto sin variable de entorno", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    expect(siteConfig.url).toBe("https://example.com");
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
