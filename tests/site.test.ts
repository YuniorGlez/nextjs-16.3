import { describe, expect, it } from "bun:test";

const { siteConfig } = await import("@/lib/site");

describe("siteConfig", () => {
  it("define metadatos base de forma coherente", () => {
    expect(typeof siteConfig.name).toBe("string");
    expect(siteConfig.name.length).toBeGreaterThan(0);
    expect(siteConfig.locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
    expect(siteConfig.themeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(typeof siteConfig.organization.type).toBe("string");
    expect(siteConfig.organization.type.length).toBeGreaterThan(0);
  });

  it("resuelve siempre una URL https", () => {
    expect(siteConfig.url).toMatch(/^https:\/\//);
  });

  // Sustituye a vi.stubEnv + vi.resetModules: en Bun no se recarga el registro
  // de módulos, así que verificamos la resolución real en un proceso hijo con
  // la variable de entorno puesta (más fiel incluso que resetModules).
  it("respeta NEXT_PUBLIC_SITE_URL cuando está definida", async () => {
    const proc = Bun.spawnSync({
      cmd: [
        "bun",
        "-e",
        `const m = await import("@/lib/site"); console.log(m.siteConfig.url);`,
      ],
      cwd: import.meta.dir + "/..",
      env: { ...process.env, NEXT_PUBLIC_SITE_URL: "https://miproyecto.es" },
      stdout: "pipe",
      stderr: "pipe",
    });
    const out = proc.stdout.toString().trim();
    expect(out).toBe("https://miproyecto.es");
  });
});
