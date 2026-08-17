import { describe, expect, it } from "vitest";
import { buildSecurityHeaders } from "@/lib/security-headers";

const PROD_HOST = "example.com";

describe("buildSecurityHeaders", () => {
  it("incluye siempre las cabeceras base", () => {
    const h = buildSecurityHeaders({
      host: "localhost:3100",
      productionHost: PROD_HOST,
      isProductionBuild: true,
    });
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
  });

  it("HSTS solo cuando el host es el de producción", () => {
    const prod = buildSecurityHeaders({
      host: PROD_HOST,
      productionHost: PROD_HOST,
      isProductionBuild: true,
    });
    expect(prod["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");

    const local = buildSecurityHeaders({
      host: "localhost:3100",
      productionHost: PROD_HOST,
      isProductionBuild: true,
    });
    expect(local["Strict-Transport-Security"]).toBeUndefined();

    // Subdominio de preview (vercel.app) tampoco recibe HSTS.
    const preview = buildSecurityHeaders({
      host: "mi-web.vercel.app",
      productionHost: PROD_HOST,
      isProductionBuild: true,
    });
    expect(preview["Strict-Transport-Security"]).toBeUndefined();
  });

  it("CSP solo en build de producción", () => {
    const prod = buildSecurityHeaders({
      host: "localhost:3100",
      productionHost: PROD_HOST,
      isProductionBuild: true,
    });
    expect(prod["Content-Security-Policy"]).toBeDefined();

    const dev = buildSecurityHeaders({
      host: "localhost:3000",
      productionHost: PROD_HOST,
      isProductionBuild: false,
    });
    expect(dev["Content-Security-Policy"]).toBeUndefined();
  });

  it("CSP contiene las directivas clave", () => {
    const h = buildSecurityHeaders({
      host: PROD_HOST,
      productionHost: PROD_HOST,
      isProductionBuild: true,
    });
    const csp = h["Content-Security-Policy"];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline' https://www.googletagmanager.com");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data: blob: https:");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });
});
