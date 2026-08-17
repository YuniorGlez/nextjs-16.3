import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { SiteNav } from "@/components/site-nav";
import { SiteAnimations } from "@/components/site-animations";
import { brandingCss, normalizeBranding } from "@/lib/branding";
import { normalizeLegal } from "@/lib/legal";
import { normalizeNav } from "@/lib/nav";
import { resolveSiteConfig } from "@/lib/site-config";
import { canonicalUrl, normalizeSeoSettings, sanitizeSeoText, sanitizeSeoUrl } from "@/lib/seo";
import {
  LandingFooter,
  LandingSections,
  type ContactoContent,
  type LandingContent,
} from "@/components/landing-sections";
import type { MenuCategory } from "@/lib/data";
import { getRequestLocale, LocaleSelector } from "@/components/locale-selector";
import { alternatesForPath } from "@/lib/i18n";

export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { getPublicSettings, getPublicLocalizedPageBySlug } = await import("@/lib/data");
    const settings = await getPublicSettings();
    const { locale, config } = await getRequestLocale(settings);
    const page = await getPublicLocalizedPageBySlug(slug, locale, config.defaultLocale);
    if (!page || !page.visible) return { title: "Página no encontrada" };
    const site = await resolveSiteConfig();
    const seo = normalizeSeoSettings(page.seo, site.url);
    const siteSeo = normalizeSeoSettings(site.seo, site.url);
    const title = seo.title || page.name;
    const description = seo.description || siteSeo.description || site.description;
    const ogImageUrl = sanitizeSeoUrl(seo.ogImage, site.url) || canonicalUrl(site.url, `/og/${page.slug}`);
    return {
      title: sanitizeSeoText(title, 70),
      description: sanitizeSeoText(description, 200),
      alternates: { canonical: canonicalUrl(site.url, `/${page.slug}`), languages: alternatesForPath(site.url, `/${page.slug}`, config) },
      robots: { index: page.isPublished && page.visible, follow: page.isPublished && page.visible },
      openGraph: {
        type: "website",
        title: sanitizeSeoText(seo.ogTitle || title, 70),
        description: sanitizeSeoText(seo.ogDescription || description, 200),
        url: canonicalUrl(site.url, `/${page.slug}`),
        siteName: site.name,
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: sanitizeSeoText(title, 70) }],
      },
      twitter: { card: "summary_large_image", title: sanitizeSeoText(seo.ogTitle || title, 70), description, images: [ogImageUrl] },
    };
  } catch {
    return { title: "Página no encontrada" };
  }
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let settings: Record<string, unknown> = {};
  let menu: MenuCategory[] = [];
  let pages: { slug: string; name: string; visible: boolean }[] = [];
  let page: { slug: string; name: string; visible: boolean; layout: { key: string; visible?: boolean }[]; content: Record<string, unknown> } | null = null;

  try {
    const data = await import("@/lib/data");
    [settings, menu, pages] = await Promise.all([data.getPublicSettings(), data.getPublicMenu(), data.getPublicPages()]);
    const requestLocale = await getRequestLocale(settings);
    page = await data.getPublicLocalizedPageBySlug(slug, requestLocale.locale, requestLocale.config.defaultLocale);
  } catch {
    // BD no disponible
  }

  if (!page || !page.visible) notFound();

  const site = await resolveSiteConfig(settings);
  const { config } = await getRequestLocale(settings);
  const branding = normalizeBranding(settings.branding);
  const contacto = (settings.contacto ?? {}) as ContactoContent;
  const legal = normalizeLegal(settings.legal);
  const nav = normalizeNav(settings.nav, pages);

  return (
    <>
      <style>{brandingCss(branding)}</style>
      <JsonLd site={site} />
      <BreadcrumbJsonLd siteUrl={site.url} name={page.name} slug={page.slug} />
      <div className="mx-auto flex w-full max-w-7xl justify-end px-6 pt-4"><LocaleSelector pathname={`/${slug}`} config={config} /></div>
      <SiteNav pages={pages} brandName={site.name} nav={nav} />
      <SiteAnimations>
        <main id="contenido-principal">
          <LandingSections
            layout={page.layout}
            content={page.content as LandingContent}
            menu={menu}
            brandName={site.name}
            legal={legal}
          />
        </main>
        <LandingFooter
          name={site.name}
          tagline={site.tagline}
          pages={pages}
          contacto={contacto}
          legal={legal}
        />
      </SiteAnimations>
    </>
  );
}
