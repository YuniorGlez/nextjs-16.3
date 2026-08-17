import { describe, expect, it } from "vitest";
import {
  canonicalUrl,
  getSeoScore,
  normalizeSeoSettings,
  sanitizeSeoUrl,
  shouldIndexPage,
} from "@/lib/seo";

describe("SEO automatizado", () => {
  it("construye canonical estable sin dobles barras ni query", () => {
    expect(canonicalUrl("https://example.com/", "/sobre?x=1")).toBe("https://example.com/sobre");
  });

  it("rechaza URLs peligrosas y permite rutas relativas", () => {
    expect(sanitizeSeoUrl("javascript:alert(1)", "https://example.com")).toBe("");
    expect(sanitizeSeoUrl("/media/og.webp", "https://example.com")).toBe("https://example.com/media/og.webp");
  });

  it("sanea HTML, controles y límites sin aceptar JSON arbitrario", () => {
    const seo = normalizeSeoSettings({ title: "<script>alert(1)</script>Título", description: "ok\u0000" });
    expect(seo.title).not.toContain("<script>");
    expect(seo.description).toBe("ok");
  });

  it("calcula score determinista y recomendaciones no bloqueantes", () => {
    const result = getSeoScore({ title: "Título correcto", description: "Una descripción suficientemente descriptiva para la página.", ogImage: "https://example.com/og.webp" });
    expect(result.score).toBeGreaterThan(0);
    expect(result.recommendations).toContain("Añade palabras clave relevantes.");
  });

  it("solo indexa páginas visibles publicadas fuera de preview", () => {
    expect(shouldIndexPage({ visible: true, isPublished: true, preview: false })).toBe(true);
    expect(shouldIndexPage({ visible: true, isPublished: false, preview: false })).toBe(false);
    expect(shouldIndexPage({ visible: true, isPublished: true, preview: true })).toBe(false);
  });
});
