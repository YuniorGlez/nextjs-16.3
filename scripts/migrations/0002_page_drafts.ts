import type { Migration } from "@/lib/migrations/runner";

const migration: Migration = {
  version: 2,
  name: "page-drafts-and-published-state",
  statements: [
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS draft_seo JSONB",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS draft_content JSONB",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS draft_layout JSONB",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS draft_name TEXT",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS draft_slug TEXT",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS draft_visible BOOLEAN",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS draft_updated_at TIMESTAMPTZ",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS published_seo JSONB",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS published_content JSONB",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS published_layout JSONB",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS published_name TEXT",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS published_slug TEXT",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS published_visible BOOLEAN",
    "ALTER TABLE pages ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ",
    `UPDATE pages SET
      draft_seo = COALESCE(draft_seo, seo), draft_content = COALESCE(draft_content, content),
      draft_layout = COALESCE(draft_layout, layout), draft_name = COALESCE(draft_name, name),
      draft_slug = COALESCE(draft_slug, slug), draft_visible = COALESCE(draft_visible, visible),
      draft_updated_at = COALESCE(draft_updated_at, updated_at),
      published_seo = COALESCE(published_seo, seo), published_content = COALESCE(published_content, content),
      published_layout = COALESCE(published_layout, layout), published_name = COALESCE(published_name, name),
      published_slug = COALESCE(published_slug, slug), published_visible = COALESCE(published_visible, visible),
      published_at = COALESCE(published_at, updated_at)
    WHERE draft_seo IS NULL OR published_seo IS NULL`,
    "ALTER TABLE pages ALTER COLUMN draft_seo SET DEFAULT '{}'::jsonb",
    "ALTER TABLE pages ALTER COLUMN draft_content SET DEFAULT '{}'::jsonb",
    "ALTER TABLE pages ALTER COLUMN draft_layout SET DEFAULT '[]'::jsonb",
    "ALTER TABLE pages ALTER COLUMN draft_visible SET DEFAULT TRUE",
    "ALTER TABLE pages ALTER COLUMN published_seo SET DEFAULT '{}'::jsonb",
    "ALTER TABLE pages ALTER COLUMN published_content SET DEFAULT '{}'::jsonb",
    "ALTER TABLE pages ALTER COLUMN published_layout SET DEFAULT '[]'::jsonb",
    "ALTER TABLE pages ALTER COLUMN published_visible SET DEFAULT TRUE",
  ],
};

export default migration;

export function normalizePageState(row: {
  seo?: unknown; content?: unknown; layout?: unknown; name?: string; slug?: string; visible?: boolean;
  draft_seo?: unknown; draft_content?: unknown; draft_layout?: unknown; draft_name?: string; draft_slug?: string; draft_visible?: boolean;
  published_seo?: unknown; published_content?: unknown; published_layout?: unknown; published_name?: string; published_slug?: string; published_visible?: boolean;
}) {
  const draft = row.draft_seo !== undefined || row.draft_content !== undefined || row.draft_layout !== undefined || row.draft_slug !== undefined;
  return {
    draft: {
      seo: (draft ? row.draft_seo : row.seo) ?? {}, content: (draft ? row.draft_content : row.content) ?? {},
      layout: (draft ? row.draft_layout : row.layout) ?? [], name: (draft ? row.draft_name : row.name) ?? "",
      slug: (draft ? row.draft_slug : row.slug) ?? "", visible: draft ? row.draft_visible !== false : row.visible !== false,
    },
    published: {
      seo: (row.published_seo ?? row.seo) ?? {}, content: (row.published_content ?? row.content) ?? {},
      layout: (row.published_layout ?? row.layout) ?? [], name: (row.published_name ?? row.name) ?? "",
      slug: (row.published_slug ?? row.slug) ?? "", visible: (row.published_visible ?? row.visible) !== false,
    },
  };
}

export function publishPageState(state: ReturnType<typeof normalizePageState>) {
  return { ...state.draft };
}
