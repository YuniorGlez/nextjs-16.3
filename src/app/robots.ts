import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { siteConfig } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const isProduction = host === siteConfig.productionHost;

  if (!isProduction) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
