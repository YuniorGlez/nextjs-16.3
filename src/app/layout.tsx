import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { isProductionHost } from "@/lib/site";
import { resolveSiteConfig } from "@/lib/site-config";
import { getSeoSettings, parseKeywords } from "@/lib/seo";
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
  const seo = await getSeoSettings();
  const seoTitle = seo.title || site.seo.title || `${site.name} | ${site.tagline}`;
  const seoDescription = seo.description || site.seo.description || site.description;
  const seoKeywords = seo.keywords ? parseKeywords(seo.keywords) : site.seo.keywords ? parseKeywords(site.seo.keywords) : [...site.keywords];
  const ogTitle = seo.ogTitle || seoTitle;
  const ogDescription = seo.ogDescription || seoDescription;
  const ogImage = seo.ogImage || site.seo.ogImage || "/opengraph-image";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
