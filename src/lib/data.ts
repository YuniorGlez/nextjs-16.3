import { sql } from "@/lib/db";
import { computeRedirectMoves, type RedirectMoves } from "@/lib/redirects";
import { slugify } from "@/lib/slug";

export type DbCategory = {
  id: number;
  name: string;
  emoji: string;
};

export type DbItem = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: string;
};

export type MenuCategory = DbCategory & { items: DbItem[] };

type CatRow = { id: number; name: string; emoji: string };
type ItemRow = {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: string;
};

export async function getCategories(): Promise<DbCategory[]> {
  const rows = (await sql`SELECT id, name, emoji FROM categories ORDER BY sort_order`) as unknown as CatRow[];
  return rows;
}

export async function getMenu(): Promise<MenuCategory[]> {
  const cats = (await sql`SELECT id, name, emoji FROM categories ORDER BY sort_order`) as unknown as CatRow[];
  const items = (await sql`SELECT id, category_id, name, description, price FROM items ORDER BY sort_order`) as unknown as ItemRow[];
  return cats.map((c) => ({
    ...c,
    items: items
      .filter((i) => i.category_id === c.id)
      .map((i) => ({
        id: i.id,
        categoryId: i.category_id,
        name: i.name,
        description: i.description,
        price: i.price,
      })),
  }));
}

export type Settings = Record<string, unknown>;

// ---------- Páginas (ruta /[slug], editables desde /admin/paginas) ----------
export type PageLayoutItem = { key: string; visible?: boolean };

export type DbPage = {
  id: number;
  slug: string;
  name: string;
  visible: boolean;
  sortOrder: number;
  seo: Record<string, string>;
  content: Record<string, unknown>;
  layout: PageLayoutItem[];
  /** Última modificación del contenido (ISO 8601) o null si no se conoce. */
  updatedAt: string | null;
};

type PageRow = {
  id: number;
  slug: string;
  name: string;
  visible: boolean;
  sort_order: number;
  seo: unknown;
  content: unknown;
  layout: unknown;
  updated_at: unknown;
};

function normalizePage(r: PageRow): DbPage {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    visible: !!r.visible,
    sortOrder: r.sort_order,
    seo: (r.seo ?? {}) as Record<string, string>,
    content: (r.content ?? {}) as Record<string, unknown>,
    layout: Array.isArray(r.layout) ? (r.layout as PageLayoutItem[]) : [],
    updatedAt: r.updated_at ? new Date(String(r.updated_at)).toISOString() : null,
  };
}

export async function getPages(): Promise<DbPage[]> {
  const rows = (await sql`SELECT id, slug, name, visible, sort_order, seo, content, layout, updated_at
    FROM pages ORDER BY sort_order, id`) as unknown as PageRow[];
  return rows.map(normalizePage);
}

export async function getPageById(id: number): Promise<DbPage | null> {
  const rows = (await sql`SELECT id, slug, name, visible, sort_order, seo, content, layout, updated_at
    FROM pages WHERE id = ${id}`) as unknown as PageRow[];
  return rows[0] ? normalizePage(rows[0]) : null;
}

export async function getPageBySlug(slug: string): Promise<DbPage | null> {
  const rows = (await sql`SELECT id, slug, name, visible, sort_order, seo, content, layout, updated_at
    FROM pages WHERE slug = ${slug}`) as unknown as PageRow[];
  return rows[0] ? normalizePage(rows[0]) : null;
}

/** Máximo updated_at de todas las páginas (última modificación del contenido). */
export async function getLatestPageUpdatedAt(): Promise<string | null> {
  const rows = (await sql`SELECT MAX(updated_at) AS m FROM pages`) as unknown as {
    m: unknown;
  }[];
  const m = rows[0]?.m;
  return m ? new Date(String(m)).toISOString() : null;
}

export async function upsertPage(input: {
  id?: number;
  slug: string;
  name: string;
  visible: boolean;
  seo: Record<string, string>;
  content: Record<string, unknown>;
  layout: PageLayoutItem[];
}): Promise<number> {
  const slug = slugify(input.slug) || "pagina";
  if (input.id) {
    await sql`UPDATE pages SET slug = ${slug}, name = ${input.name}, visible = ${input.visible},
      seo = ${JSON.stringify(input.seo)}::jsonb, content = ${JSON.stringify(input.content)}::jsonb,
      layout = ${JSON.stringify(input.layout)}::jsonb, updated_at = now()
      WHERE id = ${input.id}`;
    return input.id;
  }
  const rows = (await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM pages`) as unknown as { n: number }[];
  const next = rows[0];
  const inserted = (await sql`INSERT INTO pages (slug, name, visible, sort_order, seo, content, layout)
    VALUES (${slug}, ${input.name}, ${input.visible}, ${next.n},
      ${JSON.stringify(input.seo)}::jsonb, ${JSON.stringify(input.content)}::jsonb,
      ${JSON.stringify(input.layout)}::jsonb)
    RETURNING id`) as unknown as { id: number }[];
  return inserted[0].id;
}

export async function setPageVisibility(id: number, visible: boolean) {
  await sql`UPDATE pages SET visible = ${visible}, updated_at = now() WHERE id = ${id}`;
}

export async function removePage(id: number) {
  await sql`DELETE FROM pages WHERE id = ${id}`;
}

// ---------- Redirecciones 301 de slugs ----------
// Tabla independiente (sin FK a pages): las redirecciones sobreviven aunque
// se borre la página. Al cambiar un slug se registra from=slug antiguo →
// to=slug nuevo y se encadenan las filas que apuntaban al slug antiguo.
export type DbRedirect = { from: string; to: string };

export async function getPageRedirects(): Promise<DbRedirect[]> {
  const rows = (await sql`SELECT from_slug, to_slug FROM page_redirects`) as unknown as {
    from_slug: string;
    to_slug: string;
  }[];
  return rows.map((r) => ({ from: r.from_slug, to: r.to_slug }));
}

export async function applyRedirectMoves(moves: RedirectMoves) {
  for (const u of moves.updates) {
    await sql`UPDATE page_redirects SET to_slug = ${u.to} WHERE from_slug = ${u.from}`;
  }
  for (const i of moves.inserts) {
    await sql`INSERT INTO page_redirects (from_slug, to_slug) VALUES (${i.from}, ${i.to})
      ON CONFLICT (from_slug) DO UPDATE SET to_slug = EXCLUDED.to_slug`;
  }
}

/**
 * Registra la redirección `fromSlug → toSlug` encadenando las existentes.
 * No-op si el slug no cambia de verdad (incluidos auto-bucles).
 */
export async function registerPageRedirect(fromSlug: string, toSlug: string) {
  const existing = await getPageRedirects();
  const moves = computeRedirectMoves(fromSlug, toSlug, existing);
  if (moves.inserts.length === 0 && moves.updates.length === 0) return;
  await applyRedirectMoves(moves);
}

/** Devuelve el destino de una redirección (o null si no hay). Para proxy.ts. */
export async function getRedirectTarget(fromSlug: string): Promise<string | null> {
  const rows = (await sql`SELECT to_slug FROM page_redirects WHERE from_slug = ${fromSlug}`) as unknown as {
    to_slug: string;
  }[];
  return rows[0]?.to_slug ?? null;
}

// ---------- Historial de versiones por página ----------
// Cada guardado crea una versión con el snapshot completo del estado previo de
// la página ({slug, name, visible, sort_order, seo, content, layout}).
export type PageSnapshot = {
  slug: string;
  name: string;
  visible: boolean;
  sort_order: number;
  seo: Record<string, string>;
  content: Record<string, unknown>;
  layout: PageLayoutItem[];
};

export type DbPageVersion = {
  id: number;
  pageId: number;
  snapshot: PageSnapshot;
  createdAt: string; // ISO 8601
};

type VersionRow = {
  id: number;
  page_id: number;
  snapshot: unknown;
  created_at: unknown;
};

function normalizeVersion(r: VersionRow): DbPageVersion {
  return {
    id: r.id,
    pageId: r.page_id,
    snapshot: (r.snapshot ?? {}) as PageSnapshot,
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}

/** Inserta una versión con el estado actual de la página. */
export async function createPageVersion(page: DbPage) {
  const snapshot: PageSnapshot = {
    slug: page.slug,
    name: page.name,
    visible: page.visible,
    sort_order: page.sortOrder,
    seo: page.seo,
    content: page.content,
    layout: page.layout,
  };
  await sql`INSERT INTO page_versions (page_id, snapshot)
    VALUES (${page.id}, ${JSON.stringify(snapshot)}::jsonb)`;
}

/** Lista las versiones de una página, de más reciente a más antigua. */
export async function listPageVersions(pageId: number, limit = 20): Promise<DbPageVersion[]> {
  const rows = (await sql`SELECT id, page_id, snapshot, created_at
    FROM page_versions WHERE page_id = ${pageId}
    ORDER BY created_at DESC, id DESC LIMIT ${limit}`) as unknown as VersionRow[];
  return rows.map(normalizeVersion);
}

/**
 * Lee el snapshot de una versión concreta (debe pertenecer a la página).
 * Devuelve los campos para restaurar; la escritura la hace el caller.
 */
export async function restorePageVersion(
  pageId: number,
  versionId: number,
): Promise<PageSnapshot | null> {
  const rows = (await sql`SELECT snapshot FROM page_versions
    WHERE id = ${versionId} AND page_id = ${pageId}`) as unknown as { snapshot: unknown }[];
  return rows[0] ? ((rows[0].snapshot ?? {}) as PageSnapshot) : null;
}

/** Borra las versiones más antiguas de una página, dejando solo las `keep` recientes. */
export async function prunePageVersions(pageId: number, keep = 20) {
  await sql`DELETE FROM page_versions WHERE page_id = ${pageId} AND id NOT IN (
    SELECT id FROM page_versions WHERE page_id = ${pageId}
    ORDER BY created_at DESC, id DESC LIMIT ${keep}
  )`;
}

export async function getSettings(): Promise<Settings> {
  const rows = (await sql`SELECT key, value FROM settings`) as unknown as {
    key: string;
    value: unknown;
  }[];
  const out: Settings = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

// ---------- Mutaciones (solo desde /admin) ----------
export async function upsertCategory(input: {
  id?: number;
  name: string;
  emoji: string;
}) {
  if (input.id) {
    await sql`
      UPDATE categories SET name = ${input.name}, emoji = ${input.emoji} WHERE id = ${input.id}`;
  } else {
    const rows = (await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM categories`) as unknown as { n: number }[];
    const next = rows[0];
    await sql`INSERT INTO categories (name, emoji, sort_order)
      VALUES (${input.name}, ${input.emoji}, ${next.n})`;
  }
}

export async function removeCategory(id: number) {
  await sql`DELETE FROM categories WHERE id = ${id}`;
}

export async function upsertItem(input: {
  id?: number;
  categoryId: number;
  name: string;
  description: string;
  price: string;
}) {
  if (input.id) {
    await sql`
      UPDATE items SET category_id = ${input.categoryId}, name = ${input.name},
        description = ${input.description}, price = ${input.price} WHERE id = ${input.id}`;
  } else {
    const rows = (await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n
      FROM items WHERE category_id = ${input.categoryId}`) as unknown as { n: number }[];
    const next = rows[0];
    await sql`INSERT INTO items (category_id, name, description, price, sort_order)
      VALUES (${input.categoryId}, ${input.name}, ${input.description}, ${input.price}, ${next.n})`;
  }
}

export async function removeItem(id: number) {
  await sql`DELETE FROM items WHERE id = ${id}`;
}

export async function updateSettings(partial: Settings) {
  for (const [k, v] of Object.entries(partial)) {
    await sql`INSERT INTO settings (key, value) VALUES (${k}, ${JSON.stringify(v)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  }
}

/**
 * Guardado masivo de la carta (desde el editor admin). Reconstruye categorías
 * y platos en orden. Los ids se reasignan (cascade truncate + reinsert).
 */
export async function saveMenu(
  cats: {
    name: string;
    emoji: string;
    items: { name: string; description: string; price: string }[];
  }[],
) {
  await sql`TRUNCATE categories RESTART IDENTITY CASCADE`;
  for (const c of cats) {
    const rows = (
      await sql`INSERT INTO categories (name, emoji, sort_order) VALUES (${c.name}, ${c.emoji}, 0) RETURNING id`
    ) as unknown as { id: number }[];
    const catId = rows[0].id;
    for (let i = 0; i < c.items.length; i++) {
      const it = c.items[i];
      await sql`INSERT INTO items (category_id, name, description, price, sort_order)
        VALUES (${catId}, ${it.name}, ${it.description}, ${it.price}, ${i})`;
    }
  }
}

// ---------- Bandeja de mensajes (formulario de contacto) ----------
export type DbContactMessage = {
  id: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
  /** Fecha de recepción (ISO 8601). */
  createdAt: string;
};

type ContactMessageRow = {
  id: number;
  name: string;
  email: string;
  message: string;
  read: unknown;
  created_at: unknown;
};

function normalizeContactMessage(r: ContactMessageRow): DbContactMessage {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    message: r.message,
    read: !!r.read,
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<number> {
  const rows = (await sql`INSERT INTO contact_messages (name, email, message)
    VALUES (${input.name}, ${input.email}, ${input.message})
    RETURNING id`) as unknown as { id: number }[];
  return rows[0].id;
}

/** Lista los mensajes con los no leídos primero y los más recientes arriba. */
export async function listContactMessages(limit = 100): Promise<DbContactMessage[]> {
  const rows = (await sql`SELECT id, name, email, message, read, created_at
    FROM contact_messages ORDER BY read ASC, created_at DESC, id DESC LIMIT ${limit}`) as unknown as ContactMessageRow[];
  return rows.map(normalizeContactMessage);
}

export async function setMessageRead(id: number, read: boolean) {
  await sql`UPDATE contact_messages SET read = ${read} WHERE id = ${id}`;
}

export async function deleteContactMessage(id: number) {
  await sql`DELETE FROM contact_messages WHERE id = ${id}`;
}