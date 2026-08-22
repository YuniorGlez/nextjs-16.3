import { describe, expect, it, beforeEach, mock } from "bun:test";

// Estado del host simulado (sustituye a vi.hoisted).
const state = { value: "" };

mock.module("next/headers", () => ({
  headers: async () => ({
    get: (key: string) => (key === "host" ? state.value : null),
  }),
}));

const [{ siteConfig }, { default: robots }] = await Promise.all([
  import("@/lib/site"),
  import("@/app/robots"),
]);

describe("robots()", () => {
  beforeEach(() => {
    state.value = "";
  });

  it("bloquea todo el rastreo fuera de producción", async () => {
    state.value = "localhost:3000";
    const result = await robots();
    expect(result).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("permite el rastreo y publica sitemap en producción", async () => {
    state.value = siteConfig.productionHost;
    const result = await robots();
    expect(result.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
    expect(result.host).toBe(siteConfig.url);
  });
});
