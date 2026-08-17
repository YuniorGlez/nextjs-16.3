import { platformDefaults } from "@/lib/site";
export * from "@/lib/seo-core";
import { normalizeSeoSettings, type SeoSettings } from "@/lib/seo-core";

const EMPTY: SeoSettings = { title: "", description: "", keywords: "", ogTitle: "", ogDescription: "", ogImage: "" };

/** Lectura pública cacheada; el módulo puro `seo-core` también puede usarse en cliente. */
export async function getSeoSettings(): Promise<SeoSettings> {
  try { const { getPublicSettings } = await import("@/lib/data"); return normalizeSeoSettings((await getPublicSettings()).seo); }
  catch { return { ...EMPTY }; }
}

export function seoFallbackTitle(): string { return `${platformDefaults.name} | ${platformDefaults.tagline}`; }
