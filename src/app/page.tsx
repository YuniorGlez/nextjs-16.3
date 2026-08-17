import { JsonLd } from "@/components/json-ld";
import { SiteNav } from "@/components/site-nav";
import { SiteAnimations } from "@/components/site-animations";
import { brandingCss, normalizeBranding } from "@/lib/branding";
import { normalizeLegal } from "@/lib/legal";
import { normalizeNav } from "@/lib/nav";
import { siteConfig } from "@/lib/site";
import type { MenuCategory } from "@/lib/data";
import {
  LandingFooter,
  LandingSections,
  type ContactoContent,
  type LandingContent,
  type SectionCfg,
} from "@/components/landing-sections";

const DEFAULT_LAYOUT: SectionCfg[] = [
  { key: "hero", visible: true },
  { key: "destacados", visible: true },
  { key: "numeros", visible: true },
  { key: "local", visible: true },
  { key: "galeria", visible: true },
  { key: "testimonios", visible: true },
  { key: "faq", visible: true },
  { key: "cta", visible: true },
  { key: "menu", visible: false },
  { key: "contacto", visible: true },
];

export default async function Home() {
  // La home se renderiza siempre: si la BD no responde, usa los defaults.
  let settings: Record<string, unknown> = {};
  let menu: MenuCategory[] = [];
  let pages: { slug: string; name: string; visible: boolean }[] = [];
  try {
    const data = await import("@/lib/data");
    [menu, settings, pages] = await Promise.all([data.getMenu(), data.getSettings(), data.getPages()]);
  } catch {
    // BD no disponible — contenido por defecto
  }

  const layout =
    Array.isArray(settings.layout) && settings.layout.length
      ? (settings.layout as SectionCfg[]).filter((s) => s.visible !== false)
      : DEFAULT_LAYOUT.filter((s) => s.visible !== false);

  const content = settings as unknown as LandingContent;
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
            layout={layout}
            content={content}
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
