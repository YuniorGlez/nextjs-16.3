import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];

  try {
    const { getPages } = await import("@/lib/data");
    const pages = await getPages();
    for (const p of pages.filter((x) => x.visible)) {
      entries.push({
        url: `${siteConfig.url}/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  } catch {
    // BD no disponible: solo la home
  }

  return entries;
}
