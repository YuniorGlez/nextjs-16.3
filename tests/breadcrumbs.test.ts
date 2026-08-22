import { describe, expect, it } from "bun:test";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumbs";

describe("buildBreadcrumbJsonLd", () => {
  it("emite un BreadcrumbList con Home y la página (2 elementos)", () => {
    const ld = buildBreadcrumbJsonLd({
      siteUrl: "https://example.com",
      name: "Sobre nosotros",
      slug: "sobre-nosotros",
    });

    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld["@id"]).toBe("https://example.com/sobre-nosotros");
    expect(ld.itemListElement).toHaveLength(2);

    expect(ld.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: "https://example.com/",
    });
    expect(ld.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Sobre nosotros",
      item: "https://example.com/sobre-nosotros",
    });
  });

  it("usa URLs absolutas aunque siteUrl acabe en barra", () => {
    const ld = buildBreadcrumbJsonLd({
      siteUrl: "https://example.com/",
      name: "Contacto",
      slug: "contacto",
    });
    expect(ld.itemListElement[0].item).toBe("https://example.com/");
    expect(ld.itemListElement[1].item).toBe("https://example.com/contacto");
  });

  it("escapa caracteres especiales del nombre al serializar", () => {
    const name = 'A & B "C" <D>';
    const ld = buildBreadcrumbJsonLd({
      siteUrl: "https://example.com",
      name,
      slug: "a",
    });

    const json = JSON.stringify(ld);
    expect(json).toContain('A & B \\"C\\" <D>');
    // Al re-parsear el JSON el nombre se conserva literal (sin romper el HTML).
    expect(JSON.parse(json).itemListElement[1].name).toBe(name);
  });
});
