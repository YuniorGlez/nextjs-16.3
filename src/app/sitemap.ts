import type { MetadataRoute } from "next";
import { resolveSiteConfig } from "@/lib/site-config";
import { pageLastModified } from "@/lib/sitemap";
import { localeSitemapUrls, normalizeI18nConfig } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await resolveSiteConfig();
  let i18n = normalizeI18nConfig(undefined);
  let homeLastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];
  try {
    const { getPublicPages, getLatestPageUpdatedAt, getPublicSettings } = await import("@/lib/data");
    const [pages, latest, settings] = await Promise.all([getPublicPages(), getLatestPageUpdatedAt(), getPublicSettings()]);
    if (latest) homeLastModified = new Date(latest);
    i18n = normalizeI18nConfig(settings.i18n);
    for (const p of pages.filter((x) => x.visible && x.isPublished)) {
      const lastModified = pageLastModified(p.updatedAt || p.publishedAt);
      for (const url of localeSitemapUrls(site.url, [`/${p.slug}`], i18n)) {
        entries.push({ url, ...(lastModified ? { lastModified } : {}), changeFrequency: "monthly", priority: 0.8 });
      }
    }
  } catch {
    // BD no disponible: solo la home
  }
  for (const url of localeSitemapUrls(site.url, ["/"], i18n)) {
    entries.push({ url, lastModified: homeLastModified, changeFrequency: "monthly", priority: 1 });
  }
  return entries;
}

export function sitemapPaths(siteUrl: string, paths: string[], settings: unknown): string[] {
  return localeSitemapUrls(siteUrl, paths, normalizeI18nConfig(settings));
}
