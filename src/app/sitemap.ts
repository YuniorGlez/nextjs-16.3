import type { MetadataRoute } from "next";
import { resolveSiteConfig } from "@/lib/site-config";
import { pageLastModified } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await resolveSiteConfig();
  // La home refleja la última modificación del contenido del sitio
  // (MAX(updated_at) de pages); sin BD, hoy.
  let homeLastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  try {
    const { getPublicPages, getLatestPageUpdatedAt } = await import("@/lib/data");
    const [pages, latest] = await Promise.all([getPublicPages(), getLatestPageUpdatedAt()]);
    if (latest) homeLastModified = new Date(latest);

    for (const p of pages.filter((x) => x.visible && x.isPublished)) {
      const lastModified = pageLastModified(p.updatedAt || p.publishedAt);
      entries.push({
        url: `${site.url}/${p.slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  } catch {
    // BD no disponible: solo la home
  }

  entries.unshift({
    url: site.url,
    lastModified: homeLastModified,
    changeFrequency: "monthly",
    priority: 1,
  });

  return entries;
}
