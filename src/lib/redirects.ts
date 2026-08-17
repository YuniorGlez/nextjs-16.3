/**
 * Redirecciones 301 de slugs del CMS (SEO).
 *
 * Cuando una página cambia de slug, el slug antiguo debe seguir funcionando
 * con un 301 permanente al nuevo para no perder enlaces ni posicionamiento.
 * Este módulo contiene SOLO lógica pura (sin BD) para calcular qué filas de
 * `page_redirects` hay que insertar o actualizar; el acceso a la BD vive en
 * `src/lib/data.ts`.
 */

export type RedirectRow = { from: string; to: string };

export type RedirectMoves = {
  /** Filas nuevas a insertar (from_slug UNIQUE). */
  inserts: RedirectRow[];
  /** Filas existentes cuyo `to` hay que reescribir. */
  updates: RedirectRow[];
};

/**
 * Calcula los movimientos necesarios al renombrar una página de `oldSlug` a
 * `newSlug` dado el estado actual de la tabla de redirecciones:
 *
 * - Si el slug no cambia (o falta alguno) → no hay movimientos.
 * - Auto-bucles (from === to) se ignoran.
 * - Dedupe: si ya existe una fila `from → newSlug`, no se toca nada.
 * - Encadenado: toda fila cuyo `to` sea el slug antiguo pasa a apuntar al
 *   nuevo (a→b y luego b→c ⇒ a→c), y si ya existe una fila `from → otro`,
 *   se reescribe a `from → nuevo` (el destino siguió a la página).
 */
export function computeRedirectMoves(
  oldSlug: string,
  newSlug: string,
  existing: RedirectRow[],
): RedirectMoves {
  const inserts: RedirectRow[] = [];
  const updates: RedirectRow[] = [];
  const from = oldSlug.trim();
  const to = newSlug.trim();

  // Sin cambio real de slug, o auto-bucle: no hacer nada.
  if (!from || !to || from === to) {
    return { inserts, updates };
  }

  for (const row of existing) {
    // Encadenado: algo que apuntaba al slug antiguo debe seguir a la página.
    if (row.to === from) {
      updates.push({ from: row.from, to });
      continue;
    }
    // Dedupe con destino distinto: la fila `from` ya existe pero apuntaba a
    // otro lado; el destino siguió a la página → reescribirla.
    if (row.from === from && row.to !== to) {
      updates.push({ from: row.from, to });
    }
  }

  // Si ninguna fila cubre ya `from`, insertar la nueva redirección.
  const alreadyCoversFrom = existing.some((row) => row.from === from);
  if (!alreadyCoversFrom) {
    inserts.push({ from, to });
  }

  return { inserts, updates };
}
