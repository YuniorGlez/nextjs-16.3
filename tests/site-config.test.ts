import { describe, expect, it } from "vitest";
import { mergeClientConfig, normalizeHost, normalizeUrl } from "@/lib/site";
import { resolveSiteConfigSync } from "@/lib/site-config";

describe("configuración de cliente", () => {
  it("aplica defaults < provisioning < base de datos", () => {
    const result = resolveSiteConfigSync(
      { name: "Provisionado", url: "https://provision.example", productionHost: "provision.example" },
      { name: "BD ignorada", site: { name: "Cliente CMS", description: "Descripción CMS" } },
    );
    expect(result.name).toBe("Cliente CMS");
    expect(result.description).toBe("Descripción CMS");
    expect(result.url).toBe("https://provision.example");
  });

  it("normaliza URLs y hosts sin aceptar valores inseguros", () => {
    expect(normalizeUrl(" https://acme.example/ ", "https://fallback.example")).toBe("https://acme.example");
    expect(normalizeUrl("javascript:alert(1)", "https://fallback.example")).toBe("https://fallback.example");
    expect(normalizeHost(" ACME.EXAMPLE:443 ")).toBe("acme.example");
  });

  it("deriva el host de producción de la URL y conserva el fallback", () => {
    expect(mergeClientConfig({ url: "https://cliente.example" }).productionHost).toBe("cliente.example");
    expect(mergeClientConfig({ name: " " }).name).toBe("Next.js Base");
  });
});
