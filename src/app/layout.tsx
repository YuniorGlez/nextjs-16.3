import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { isProductionHost } from "@/lib/site";
import { resolveSiteConfig } from "@/lib/site-config";
import { canonicalUrl, getSeoSettings, normalizeSeoSettings, parseKeywords, sanitizeSeoUrl } from "@/lib/seo";
import { Providers } from "@/components/providers";
import { alternatesForPath, normalizeI18nConfig, normalizeLocale } from "@/lib/i18n";
import { normalizeAnalyticsSettings } from "@/lib/analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const site = await resolveSiteConfig();
  let i18n = normalizeI18nConfig(undefined);
  try {
    const { getPublicSettings } = await import("@/lib/data");
    i18n = normalizeI18nConfig((await getPublicSettings()).i18n);
  } catch {
    // BD no disponible
  }
  const parsedLocale = normalizeLocale(headerList.get("x-cms-locale"), i18n.defaultLocale);
  const currentLocale = i18n.enabledLocales.includes(parsedLocale) ? parsedLocale : i18n.defaultLocale;
  const isProduction = isProductionHost(host, site.productionHost);

  // SEO del CMS con fallback a la configuración efectiva del cliente.
  const seo = normalizeSeoSettings(await getSeoSettings(), site.url);
  const siteSeo = normalizeSeoSettings(site.seo, site.url);
  const seoTitle = seo.title || siteSeo.title || `${site.name} | ${site.tagline}`;
  const seoDescription = seo.description || siteSeo.description || site.description;
  const seoKeywords = seo.keywords ? parseKeywords(seo.keywords) : siteSeo.keywords ? parseKeywords(siteSeo.keywords) : [...site.keywords];
  const ogTitle = seo.ogTitle || siteSeo.ogTitle || seoTitle;
  const ogDescription = seo.ogDescription || siteSeo.ogDescription || seoDescription;
  const ogImage = sanitizeSeoUrl(seo.ogImage || siteSeo.ogImage || "/opengraph-image", site.url) || canonicalUrl(site.url, "/opengraph-image");

  const baseMetadata: Metadata = {
    metadataBase: new URL(site.url),
    title: {
      default: seoTitle,
      template: `%s | ${site.name}`,
    },
    description: seoDescription,
    applicationName: site.name,
    creator: site.organization.name,
    publisher: site.organization.name,
    keywords: seoKeywords,
    alternates: {
      canonical: currentLocale === i18n.defaultLocale ? "/" : `/${currentLocale}`,
      languages: alternatesForPath(site.url, "/", i18n),
    },
    openGraph: {
      type: "website",
      locale: site.locale,
      url: site.url,
      siteName: site.name,
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    icons: {
      icon: "/favicon.ico",
    },
    category: "website",
  };

  if (!isProduction) {
    return {
      ...baseMetadata,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    ...baseMetadata,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestLocale = normalizeLocale((await headers()).get("x-cms-locale"));
  let analytics = normalizeAnalyticsSettings({
    enabled: Boolean(process.env.NEXT_PUBLIC_GA_ID),
    measurementId: process.env.NEXT_PUBLIC_GA_ID,
    consentDefault: process.env.NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT === "true",
  });
  try {
    const { getPublicSettings } = await import("@/lib/data");
    const settings = await getPublicSettings();
    if (settings.analytics !== undefined) analytics = normalizeAnalyticsSettings(settings.analytics);
  } catch {
    // BD no disponible: se conserva el fallback de provisioning/env.
  }
  return (
    <html
      lang={requestLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#contenido-principal" className="skip-link">Saltar al contenido principal</a>
        <Providers analytics={analytics}>{children}</Providers>
      </body>
    </html>
  );
}
