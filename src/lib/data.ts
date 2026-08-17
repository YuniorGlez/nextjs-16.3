import { sql } from "@/lib/db";
import { computeRedirectMoves, type RedirectMoves } from "@/lib/redirects";
import { slugify } from "@/lib/slug";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS, pageCacheTag, selectPublicSettings } from "@/lib/cache";
import { unstable_cache } from "next/cache";

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

/** Lectura pública cacheada. Las lecturas del admin siguen usando getMenu(). */
export const getPublicMenu = unstable_cache(getMenu, ["public-menu-query"], {
  tags: [CACHE_TAGS.menu],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

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
  draftUpdatedAt: string | null;
  publishedAt: string | null;
  isPublished: boolean;
};

type PageRow = {
  id: number; slug: string; name: string; visible: boolean; sort_order: number;
  seo: unknown; content: unknown; layout: unknown; updated_at: unknown;
  draft_seo?: unknown; draft_content?: unknown; draft_layout?: unknown; draft_name?: string; draft_slug?: string;
  draft_visible?: boolean; draft_updated_at?: unknown;
  published_seo?: unknown; published_content?: unknown; published_layout?: unknown; published_name?: string;
  published_slug?: string; published_visible?: boolean; published_at?: unknown;
};

function normalizePage(r: PageRow, mode: "draft" | "published" = "draft"): DbPage {
  const hasState = r.draft_seo !== undefined || r.published_seo !== undefined;
  const prefix = mode === "draft" ? "draft" : "published";
  const value = (key: string, legacy: unknown) => hasState ? (r as Record<string, unknown>)[`${prefix}_${key}`] ?? legacy : legacy;
  return {
    id: r.id, slug: String(value("slug", r.slug)), name: String(value("name", r.name)),
    visible: value("visible", r.visible) !== false, sortOrder: r.sort_order,
    seo: (value("seo", r.seo) ?? {}) as Record<string, string>,
    content: (value("content", r.content) ?? {}) as Record<string, unknown>,
    layout: Array.isArray(value("layout", r.layout)) ? (value("layout", r.layout) as PageLayoutItem[]) : [],
    updatedAt: r.updated_at ? new Date(String(r.updated_at)).toISOString() : null,
    draftUpdatedAt: r.draft_updated_at ? new Date(String(r.draft_updated_at)).toISOString() : null,
    publishedAt: r.published_at ? new Date(String(r.published_at)).toISOString() : null,
    isPublished: hasState ? r.published_visible !== false && r.published_at != null : !!r.visible,
  };
}

const PAGE_SELECT = `id, slug, name, visible, sort_order, seo, content, layout, updated_at,
    draft_seo, draft_content, draft_layout, draft_name, draft_slug, draft_visible, draft_updated_at,
    published_seo, published_content, published_layout, published_name, published_slug, published_visible, published_at`;

export async function getPages(options: { published?: boolean } = {}): Promise<DbPage[]> {
  try {
    const rows = (await sql`SELECT ${sql.unsafe(PAGE_SELECT)} FROM pages ORDER BY sort_order, id`) as unknown as PageRow[];
    return rows.map((row) => normalizePage(row, options.published ? "published" : "draft"));
  } catch {
    const rows = (await sql`SELECT id, slug, name, visible, sort_order, seo, content, layout, updated_at FROM pages ORDER BY sort_order, id`) as unknown as PageRow[];
    return rows.map((row) => normalizePage(row, "published"));
  }
}

/** Solo estado publicado: nunca reutilizar esta función para preview/admin. */
export const getPublicPages = unstable_cache(
  async () => getPages({ published: true }),
  ["public-pages-query"],
  { tags: [CACHE_TAGS.pages], revalidate: CACHE_REVALIDATE_SECONDS },
);

export async function getPageById(id: number): Promise<DbPage | null> {
  try {
    const rows = (await sql`SELECT ${sql.unsafe(PAGE_SELECT)} FROM pages WHERE id = ${id}`) as unknown as PageRow[];
    return rows[0] ? normalizePage(rows[0]) : null;
  } catch {
    const rows = (await sql`SELECT id, slug, name, visible, sort_order, seo, content, layout, updated_at FROM pages WHERE id = ${id}`) as unknown as PageRow[];
    return rows[0] ? normalizePage(rows[0], "published") : null;
  }
}

export async function getPageBySlug(slug: string, options: { draft?: boolean } = {}): Promise<DbPage | null> {
  try {
    const rows = (await sql`SELECT ${sql.unsafe(PAGE_SELECT)} FROM pages
      WHERE ${sql.unsafe(options.draft ? "draft_slug" : "published_slug")} = ${slug}
         OR (${sql.unsafe(options.draft ? "draft_slug" : "published_slug")} IS NULL AND slug = ${slug})`) as unknown as PageRow[];
    return rows[0] ? normalizePage(rows[0], options.draft ? "draft" : "published") : null;
  } catch {
    const rows = (await sql`SELECT id, slug, name, visible, sort_order, seo, content, layout, updated_at FROM pages WHERE slug = ${slug}`) as unknown as PageRow[];
    return rows[0] ? normalizePage(rows[0], "published") : null;
  }
}

/** Página publicada por slug, con una entrada/tag aislados por slug. */
export async function getPublicPageBySlug(slug: string): Promise<DbPage | null> {
  return unstable_cache(
    async () => getPageBySlug(slug),
    ["public-page-query", slug],
    { tags: [CACHE_TAGS.pages, pageCacheTag(slug)], revalidate: CACHE_REVALIDATE_SECONDS },
  )();
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
      layout = ${JSON.stringify(input.layout)}::jsonb, updated_at = now(),
      draft_slug = ${slug}, draft_name = ${input.name}, draft_visible = ${input.visible},
      draft_seo = ${JSON.stringify(input.seo)}::jsonb, draft_content = ${JSON.stringify(input.content)}::jsonb,
      draft_layout = ${JSON.stringify(input.layout)}::jsonb, draft_updated_at = now()
      WHERE id = ${input.id}`;
    return input.id;
  }
  const rows = (await sql`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM pages`) as unknown as { n: number }[];
  const next = rows[0];
  const inserted = (await sql`INSERT INTO pages (slug, name, visible, sort_order, seo, content, layout,
      draft_slug, draft_name, draft_visible, draft_seo, draft_content, draft_layout, draft_updated_at,
      published_slug, published_name, published_visible, published_seo, published_content, published_layout, published_at)
    VALUES (${slug}, ${input.name}, ${input.visible}, ${next.n},
      ${JSON.stringify(input.seo)}::jsonb, ${JSON.stringify(input.content)}::jsonb, ${JSON.stringify(input.layout)}::jsonb,
      ${slug}, ${input.name}, ${input.visible}, ${JSON.stringify(input.seo)}::jsonb, ${JSON.stringify(input.content)}::jsonb,
      ${JSON.stringify(input.layout)}::jsonb, now(), ${slug}, ${input.name}, ${input.visible},
      ${JSON.stringify(input.seo)}::jsonb, ${JSON.stringify(input.content)}::jsonb, ${JSON.stringify(input.layout)}::jsonb, now())
    RETURNING id`) as unknown as { id: number }[];
  return inserted[0].id;
}

export async function publishPage(id: number): Promise<void> {
  await sql`UPDATE pages SET published_slug = COALESCE(draft_slug, slug), published_name = COALESCE(draft_name, name),
    published_visible = COALESCE(draft_visible, visible), published_seo = COALESCE(draft_seo, seo),
    published_content = COALESCE(draft_content, content), published_layout = COALESCE(draft_layout, layout),
    published_at = now() WHERE id = ${id}`;
}

export async function setPageVisibility(id: number, visible: boolean) {
  await sql`UPDATE pages SET visible = ${visible}, draft_visible = ${visible}, draft_updated_at = now(), updated_at = now() WHERE id = ${id}`;
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

/** Cache para Server Components; el proxy usa una consulta edge separada. */
export const getPublicPageRedirects = unstable_cache(getPageRedirects, ["public-redirects-query"], {
  tags: [CACHE_TAGS.redirects],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

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

/** Configuración efectiva pública; no expone secretos ni settings de correo. */
export const getPublicSettings = unstable_cache(
  async () => selectPublicSettings(await getSettings()),
  ["public-settings-query"],
  { tags: [CACHE_TAGS.settings], revalidate: CACHE_REVALIDATE_SECONDS },
);

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