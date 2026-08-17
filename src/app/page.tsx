import { JsonLd } from "@/components/json-ld";
import { SiteNav } from "@/components/site-nav";
import { SiteAnimations } from "@/components/site-animations";
import { brandingCss, normalizeBranding } from "@/lib/branding";
import { normalizeLegal } from "@/lib/legal";
import { normalizeNav } from "@/lib/nav";
import { resolveSiteConfig } from "@/lib/site-config";
import { resolveModules } from "@/lib/admin-modules";
import { SECTION_DEFS } from "@/lib/sections";
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
    [menu, settings, pages] = await Promise.all([data.getPublicMenu(), data.getPublicSettings(), data.getPublicPages()]);
  } catch {
    // BD no disponible — contenido por defecto
  }

  const modules = resolveModules(settings.modules);
  const site = await resolveSiteConfig(settings);

  const layout =
    (Array.isArray(settings.layout) && settings.layout.length
      ? (settings.layout as SectionCfg[]).filter((s) => s.visible !== false)
      : DEFAULT_LAYOUT.filter((s) => s.visible !== false)
    ).filter((s) => {
      // Secciones ligadas a un módulo del admin desactivado no se renderizan.
      const def = SECTION_DEFS.find((d) => d.key === s.key);
      return !def?.moduleId || modules[def.moduleId] !== false;
    });

  const content = settings as unknown as LandingContent;
  const branding = normalizeBranding(settings.branding);
  const contacto = (settings.contacto ?? {}) as ContactoContent;
  const legal = normalizeLegal(settings.legal);
  const nav = normalizeNav(settings.nav, pages);

  return (
    <>
      <style>{brandingCss(branding)}</style>
      <JsonLd site={site} />
      <SiteNav pages={pages} brandName={site.name} nav={nav} />
      <SiteAnimations>
        <main id="contenido-principal">
          <LandingSections
            layout={layout}
            content={content}
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
