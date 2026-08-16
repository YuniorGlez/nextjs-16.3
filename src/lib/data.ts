import { sql } from "@/lib/db";
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
  };
}

export async function getPages(): Promise<DbPage[]> {
  const rows = (await sql`SELECT id, slug, name, visible, sort_order, seo, content, layout
    FROM pages ORDER BY sort_order, id`) as unknown as PageRow[];
  return rows.map(normalizePage);
}

export async function getPageById(id: number): Promise<DbPage | null> {
  const rows = (await sql`SELECT id, slug, name, visible, sort_order, seo, content, layout
    FROM pages WHERE id = ${id}`) as unknown as PageRow[];
  return rows[0] ? normalizePage(rows[0]) : null;
}

export async function getPageBySlug(slug: string): Promise<DbPage | null> {
  const rows = (await sql`SELECT id, slug, name, visible, sort_order, seo, content, layout
    FROM pages WHERE slug = ${slug}`) as unknown as PageRow[];
  return rows[0] ? normalizePage(rows[0]) : null;
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
      layout = ${JSON.stringify(input.layout)}::jsonb
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
  await sql`UPDATE pages SET visible = ${visible} WHERE id = ${id}`;
}

export async function removePage(id: number) {
  await sql`DELETE FROM pages WHERE id = ${id}`;
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