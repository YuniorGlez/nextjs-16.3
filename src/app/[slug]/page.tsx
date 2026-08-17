import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SiteNav } from "@/components/site-nav";
import { SiteAnimations } from "@/components/site-animations";
import { brandingCss, normalizeBranding } from "@/lib/branding";
import { normalizeLegal } from "@/lib/legal";
import { normalizeNav } from "@/lib/nav";
import { siteConfig } from "@/lib/site";
import {
  LandingFooter,
  LandingSections,
  type ContactoContent,
  type LandingContent,
} from "@/components/landing-sections";
import type { MenuCategory } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { getPageBySlug } = await import("@/lib/data");
    const page = await getPageBySlug(slug);
    if (!page || !page.visible) return { title: "Página no encontrada" };
    const ogImage = page.seo.ogImage?.trim();
    return {
      title: page.seo.title || page.name,
      description: page.seo.description || siteConfig.description,
      alternates: { canonical: `/${page.slug}` },
      ...(ogImage
        ? {
            openGraph: {
              title: page.seo.title || page.name,
              description: page.seo.description || siteConfig.description,
              images: [{ url: ogImage, width: 1200, height: 630 }],
            },
            twitter: { card: "summary_large_image", images: [ogImage] },
          }
        : {}),
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
    [settings, menu, pages] = await Promise.all([data.getSettings(), data.getMenu(), data.getPages()]);
    page = await data.getPageBySlug(slug);
  } catch {
    // BD no disponible
  }

  if (!page || !page.visible) notFound();

  const branding = normalizeBranding(settings.branding);
  const contacto = (settings.contacto ?? {}) as ContactoContent;
  const legal = normalizeLegal(settings.legal);
  const nav = normalizeNav(settings.nav, pages);

  return (
    <>
      <style>{brandingCss(branding)}</style>
      <JsonLd />
      <SiteNav pages={pages} brandName={siteConfig.name} nav={nav} />
      <SiteAnimations>
        <main>
          <LandingSections
            layout={page.layout}
            content={page.content as LandingContent}
            menu={menu}
            brandName={siteConfig.name}
            legal={legal}
          />
        </main>
        <LandingFooter
          name={siteConfig.name}
          tagline={siteConfig.tagline}
          pages={pages}
          contacto={contacto}
          legal={legal}
        />
      </SiteAnimations>
    </>
  );
}
