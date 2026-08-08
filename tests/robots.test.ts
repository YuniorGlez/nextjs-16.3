import { describe, expect, it, vi } from "vitest";

const mockHost = vi.hoisted(() => ({ value: "" }));

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (key: string) => (key === "host" ? mockHost.value : null),
  }),
}));

import { siteConfig } from "@/lib/site";
import robots from "@/app/robots";

describe("robots()", () => {
  it("bloquea todo el rastreo fuera de producción", async () => {
    mockHost.value = "localhost:3000";
    const result = await robots();
    expect(result).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("permite el rastreo y publica sitemap en producción", async () => {
    mockHost.value = siteConfig.productionHost;
    const result = await robots();
    expect(result.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
    expect(result.host).toBe(siteConfig.url);
  });
});
