import { siteConfig } from "@/lib/site";

export type SeoSettings = {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

const EMPTY: SeoSettings = {
  title: "",
  description: "",
  keywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
};

/** Normaliza el objeto `seo` de settings (JSONB) a un tipo seguro. */
export function normalizeSeoSettings(v: unknown): SeoSettings {
  const o = (v ?? {}) as Record<string, unknown>;
  const pick = (k: string) => (typeof o[k] === "string" ? (o[k] as string).trim() : "");
  return {
    title: pick("title"),
    description: pick("description"),
    keywords: pick("keywords"),
    ogTitle: pick("ogTitle"),
    ogDescription: pick("ogDescription"),
    ogImage: pick("ogImage"),
  };
}

/** "a, b ,c" → ["a", "b", "c"] */
export function parseKeywords(s: string): string[] {
  return s
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

/**
 * SEO efectivo para el sitio: valores del CMS (settings.seo) cuando existen,
 * vacíos para que el layout aplique los defaults de siteConfig.
 * Import dinámico para que un fallo de BD nunca rompa el render/build.
 */
export async function getSeoSettings(): Promise<SeoSettings> {
  try {
    const { getSettings } = await import("@/lib/data");
    const settings = await getSettings();
    return normalizeSeoSettings(settings.seo);
  } catch {
    return { ...EMPTY };
  }
}

export function seoFallbackTitle(): string {
  return `${siteConfig.name} | ${siteConfig.tagline}`;
}
