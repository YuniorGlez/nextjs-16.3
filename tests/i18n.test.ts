import { describe, expect, it } from "bun:test";
import {
  alternatesForPath,
  isPublicLocalePath,
  localeSitemapUrls,
  normalizeI18nConfig,
  normalizeLocale,
  resolvePageTranslation,
  validateI18nConfig,
} from "@/lib/i18n";

const config = { defaultLocale: "es" as const, enabledLocales: ["es", "en", "fr"] as const };

describe("i18n", () => {
  it("valida catálogo, default y límites", () => {
    expect(validateI18nConfig(config).ok).toBe(true);
    expect(validateI18nConfig({ defaultLocale: "de", enabledLocales: ["de"] }).ok).toBe(false);
    expect(normalizeI18nConfig({ defaultLocale: "en-GB", enabledLocales: ["en-GB", "fr"] })).toEqual({ defaultLocale: "en-GB", enabledLocales: ["en-GB", "fr"] });
  });

  it("normaliza locale desconocido al fallback determinista", () => {
    expect(normalizeLocale("EN-gb")).toBe("en-GB");
    expect(normalizeLocale("de", "fr")).toBe("fr");
  });

  it("excluye rutas privadas del resolver público", () => {
    expect(isPublicLocalePath("/en/contacto")).toBe(true);
    expect(isPublicLocalePath("/en/admin")).toBe(false);
    expect(isPublicLocalePath("/en/api/health")).toBe(false);
    expect(isPublicLocalePath("/contacto")).toBe(false);
  });

  it("hace fallback por campo y elimina HTML de traducciones", () => {
    const page = { name: "Inicio", seo: { title: "Título", description: "Descripción" }, content: { hero: { titulo: "Hola", texto: "Base" } } };
    expect(resolvePageTranslation(page, { en: { name: "<b>Home</b>", content: { hero: { titulo: "Welcome", texto: "<script>x</script>" } } } }, "en", "es")).toEqual({
      name: "Home", seo: { title: "Título", description: "Descripción" }, content: { hero: { titulo: "Welcome", texto: "x" } },
    });
  });

  it("genera alternates y sitemap por cada idioma habilitado", () => {
    expect(alternatesForPath("https://example.com", "/contacto", config)).toEqual({ es: "https://example.com/contacto", en: "https://example.com/en/contacto", fr: "https://example.com/fr/contacto" });
    expect(localeSitemapUrls("https://example.com", ["/", "/contacto"], config)).toHaveLength(6);
  });
});

