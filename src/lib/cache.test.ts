import { describe, expect, it, mock } from "bun:test";

const revalidateTag = mock((_tag: string, _profile?: unknown) => {});

mock.module("next/cache", () => ({ revalidateTag: revalidateTag }));

const {
  CACHE_REVALIDATE_PROFILE,
  CACHE_TAGS,
  invalidatePublicContent,
  invalidatePublicPages,
  isCacheablePublicQuery,
  pageCacheTag,
  selectPublicSettings,
} = await import("@/lib/cache");

describe("cache pública", () => {
  it("centraliza tags y crea tags de página deterministas", () => {
    expect(CACHE_TAGS.pages).toBe("public-pages");
    expect(pageCacheTag("contacto")).toBe("public-page:contacto");
  });

  it("solo considera cacheable el estado publicado", () => {
    expect(isCacheablePublicQuery({ published: true })).toBe(true);
    expect(isCacheablePublicQuery({ published: false })).toBe(false);
    expect(isCacheablePublicQuery({ published: true, draft: true })).toBe(false);
  });

  it("excluye secretos y configuración de correo de settings públicos", () => {
    expect(
      selectPublicSettings({
        ai: { openrouterApiKey: "***" },
        mensajes: { to: "private" },
        analytics: { enabled: true, measurementId: "G-ABC", extra: "discard" },
        hero: { h1: "Hola" },
      }),
    ).toEqual({
      analytics: { enabled: true, measurementId: "G-ABC", consentDefault: false },
      hero: { h1: "Hola" },
    });
  });

  it("invalida páginas y slugs sin duplicados usando SWR de Next 16", () => {
    invalidatePublicPages("inicio", "inicio", "contacto");
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.pages, CACHE_REVALIDATE_PROFILE);
    expect(revalidateTag).toHaveBeenCalledWith(pageCacheTag("inicio"), CACHE_REVALIDATE_PROFILE);
    expect(revalidateTag).toHaveBeenCalledWith(pageCacheTag("contacto"), CACHE_REVALIDATE_PROFILE);
    expect(revalidateTag).toHaveBeenCalledTimes(3);
  });

  it("permite invalidar el conjunto de contenido público de forma explícita", () => {
    revalidateTag.mockClear();
    invalidatePublicContent({ settings: true, menu: true, pages: true, slugs: ["inicio"] });
    expect(revalidateTag).toHaveBeenCalledTimes(4);
  });
});
