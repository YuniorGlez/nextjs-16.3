import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { isProductionHost } from "@/lib/site";
import { resolveSiteConfig } from "@/lib/site-config";
import { canonicalUrl, getSeoSettings, normalizeSeoSettings, parseKeywords, sanitizeSeoUrl } from "@/lib/seo";
import { Providers } from "@/components/providers";

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
      canonical: "/",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#contenido-principal" className="skip-link">Saltar al contenido principal</a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
