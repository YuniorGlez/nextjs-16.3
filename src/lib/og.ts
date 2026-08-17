/**
 * Helpers puros para la generación de OG images dinámicas (/og/[slug]).
 * Se mantienen libres de imports de server/BD para poder testearlos en vitest.
 */

export type OgTitleSource = {
  name: string;
  seo?: { title?: string } | null;
};

/** Título que se pinta en la OG image: seo.title de la página, o su nombre. */
export function resolveOgTitle(page: OgTitleSource): string {
  const seoTitle = page.seo?.title?.trim();
  return seoTitle || page.name.trim() || "Página";
}

/**
 * Recorta el título para que entre en el lienzo 1200×630 sin desbordar
 * (2 líneas como mucho a 64px). Añade ellipsis si recorta.
 */
export function truncateForOg(title: string, max = 56): string {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}
