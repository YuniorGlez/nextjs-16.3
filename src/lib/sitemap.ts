/**
 * Helpers puros del sitemap (/sitemap.xml). El lastmod real sale de la
 * columna pages.updated_at (ISO 8601); si la página no tiene fecha (p.ej.
 * BD sembrada antes de la columna) se omite el campo lastModified.
 */

export function pageLastModified(
  updatedAt: string | null | undefined,
): Date | undefined {
  if (!updatedAt) return undefined;
  const d = new Date(updatedAt);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
