import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BreadcrumbJsonLd, JsonLd } from "@/components/json-ld";
import { SiteNav } from "@/components/site-nav";
import { SiteAnimations } from "@/components/site-animations";
import { brandingCss, normalizeBranding } from "@/lib/branding";
import { normalizeLegal } from "@/lib/legal";
import { normalizeNav } from "@/lib/nav";
import { resolveSiteConfig } from "@/lib/site-config";
import { verifyPreviewToken } from "@/lib/preview";
import { LandingFooter, LandingSections, type ContactoContent, type LandingContent } from "@/components/landing-sections";
import type { MenuCategory } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Vista previa privada", robots: { index: false, follow: false, nocache: true } };
}

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;
  if (!token || !verifyPreviewToken(token, slug)) notFound();

  let settings: Record<string, unknown> = {};
  let menu: MenuCategory[] = [];
  let pages: { slug: string; name: string; visible: boolean }[] = [];
  const data = await import("@/lib/data");
  const page = await data.getPageBySlug(slug, { draft: true });
  if (!page) notFound();
  [settings, menu, pages] = await Promise.all([data.getSettings(), data.getMenu(), data.getPages({ published: true })]);

  const site = await resolveSiteConfig(settings);
  const branding = normalizeBranding(settings.branding);
  const contacto = (settings.contacto ?? {}) as ContactoContent;
  const legal = normalizeLegal(settings.legal);
  const nav = normalizeNav(settings.nav, pages);
  return (
    <>
      <style>{brandingCss(branding)}</style>
      <div className="fixed left-0 top-0 z-50 w-full bg-cyan-600 px-3 py-2 text-center text-sm font-semibold text-white">Vista previa privada · borrador · no indexable</div>
      <JsonLd site={site} />
      <BreadcrumbJsonLd siteUrl={site.url} name={page.name} slug={page.slug} />
      <SiteNav pages={pages} brandName={site.name} nav={nav} />
      <SiteAnimations>
        <main className="pt-8"><LandingSections layout={page.layout} content={page.content as LandingContent} menu={menu} brandName={site.name} legal={legal} /></main>
        <LandingFooter name={site.name} tagline={site.tagline} pages={pages} contacto={contacto} legal={legal} />
      </SiteAnimations>
    </>
  );
}
