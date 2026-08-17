/**
 * Normalización de la navegación configurable (settings.nav).
 *
 * Estructura de settings.nav (JSONB):
 *   {
 *     items: [
 *       { label?: string, pageSlug?: string, href?: string, children?: Item[] }
 *     ],
 *     cta?: { label: string, href: string }
 *   }
 *
 * Reglas de resolución de un ítem:
 *  - pageSlug → página visible: label ?? page.name, href = "/" + slug.
 *  - pageSlug → página oculta: se descarta la referencia; solo se conserva si
 *    el ítem trae href explícito (enlace externo, label ?? page.name).
 *  - pageSlug → página inexistente con label: se mantiene la URL "/" + slug
 *    para que la redirección 301 de proxy.ts la resuelva (slugs antiguos).
 *  - pageSlug → página inexistente con href: enlace externo (label obligatorio).
 *  - pageSlug → página inexistente sin label ni href: ítem roto, se descarta.
 *  - Sin pageSlug: hace falta label + href (enlace personalizado).
 *  - Sin href y sin children: ítem sin destino, se descarta.
 *
 * Fallback (compatibilidad): si no hay configuración (ausente, no-objeto o
 * items vacío) la nav se comporta como antes: "Inicio" + todas las páginas
 * visibles excepto la página "inicio".
 *
 * Con configuración: se renderiza exactamente lo configurado (deduplicado por
 * href). Como fallback amigable, si ningún ítem apunta a "/" se antepone
 * "Inicio" al principio.
 */

export type NavPage = { slug: string; name: string; visible: boolean };

export type NavItemConfig = {
  label?: string;
  pageSlug?: string;
  href?: string;
  children?: NavItemConfig[];
};

/** Ítem listo para renderizar. href es opcional solo para padres con submenú. */
export type NavRenderItem = {
  label: string;
  href?: string;
  /** Enlace externo (http/https) → target blank + rel noopener. */
  external?: boolean;
  children?: NavRenderItem[];
};

export type NavCta = { label: string; href: string };

export type NormalizedNav = {
  items: NavRenderItem[];
  cta?: NavCta;
};

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function dedupe(items: NavRenderItem[]): NavRenderItem[] {
  const seen = new Set<string>();
  const out: NavRenderItem[] = [];
  for (const item of items) {
    const key = item.href ?? item.label;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function normalizeItem(raw: unknown, pages: Map<string, NavPage>): NavRenderItem | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const cfg = raw as Record<string, unknown>;

  const label = str(cfg.label);
  const href = str(cfg.href);
  const pageSlug = str(cfg.pageSlug);
  const rawChildren = Array.isArray(cfg.children) ? cfg.children : [];

  let outLabel = label;
  let outHref = href;

  if (pageSlug) {
    const page = pages.get(pageSlug);
    if (page && page.visible) {
      // La página "inicio" vive en "/" (la home), no en /inicio.
      outHref = page.slug === "inicio" ? "/" : `/${page.slug}`;
      outLabel = label ?? page.name;
    } else if (page && !page.visible) {
      // Página oculta: la referencia se descarta; solo se conserva un href explícito.
      if (!href) return null;
      outLabel = label ?? page.name;
    } else if (href) {
      // Slug desconocido con enlace alternativo → enlace personalizado.
      if (!label) return null;
    } else if (label) {
      // Slug antiguo: se mantiene la URL para que la redirección 301 la resuelva.
      outHref = `/${pageSlug}`;
    } else {
      // Página inexistente sin nada que mostrar → ítem roto.
      return null;
    }
  }

  if (!outLabel) return null;

  const children = dedupe(
    rawChildren
      .map((c) => normalizeItem(c, pages))
      .filter((c): c is NavRenderItem => c !== null),
  );

  if (!outHref && children.length === 0) return null;

  return {
    label: outLabel,
    ...(outHref
      ? { href: outHref, ...(isExternalUrl(outHref) ? { external: true } : {}) }
      : {}),
    ...(children.length ? { children } : {}),
  };
}

function fallbackItems(pages: NavPage[]): NavRenderItem[] {
  return [
    { label: "Inicio", href: "/" },
    ...pages
      .filter((p) => p.visible && p.slug !== "inicio")
      .map((p) => ({ label: p.name, href: `/${p.slug}` })),
  ];
}

function normalizeCta(raw: unknown): NavCta | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const c = raw as Record<string, unknown>;
  const label = str(c.label);
  const href = str(c.href);
  if (!label || !href) return undefined; // CTA incompleto → no se muestra.
  return { label, href };
}

export function normalizeNav(rawNav: unknown, pages: NavPage[]): NormalizedNav {
  const pageMap = new Map(pages.map((p) => [p.slug, p]));

  const raw = typeof rawNav === "object" && rawNav !== null ? (rawNav as Record<string, unknown>) : undefined;
  const cta = raw ? normalizeCta(raw.cta) : undefined;

  const configured =
    !!raw && Array.isArray(raw.items) && (raw.items as unknown[]).length > 0;

  if (!configured) {
    return { items: fallbackItems(pages), ...(cta ? { cta } : {}) };
  }

  const items = dedupe(
    (raw.items as unknown[])
      .map((i) => normalizeItem(i, pageMap))
      .filter((i): i is NavRenderItem => i !== null),
  );

  // Fallback amigable: si ningún ítem apunta a la home (o todos se descartaron),
  // anteponer "Inicio" para que la nav nunca quede vacía.
  if (!items.some((i) => i.href === "/")) {
    items.unshift({ label: "Inicio", href: "/" });
  }

  return { items, ...(cta ? { cta } : {}) };
}
