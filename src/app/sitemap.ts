import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { pageLastModified } from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // La home refleja la última modificación del contenido del sitio
  // (MAX(updated_at) de pages); sin BD, hoy.
  let homeLastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  try {
    const { getPages, getLatestPageUpdatedAt } = await import("@/lib/data");
    const [pages, latest] = await Promise.all([getPages(), getLatestPageUpdatedAt()]);
    if (latest) homeLastModified = new Date(latest);

    for (const p of pages.filter((x) => x.visible)) {
      const lastModified = pageLastModified(p.updatedAt);
      entries.push({
        url: `${siteConfig.url}/${p.slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  } catch {
    // BD no disponible: solo la home
  }

  entries.unshift({
    url: siteConfig.url,
    lastModified: homeLastModified,
    changeFrequency: "monthly",
    priority: 1,
  });

  return entries;
}
