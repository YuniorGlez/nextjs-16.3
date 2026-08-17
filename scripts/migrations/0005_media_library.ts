import type { Migration } from "@/lib/migrations/runner";

const migration: Migration = {
  version: 5,
  name: "media-library",
  statements: [
    `CREATE TABLE IF NOT EXISTS media_assets (
      id BIGSERIAL PRIMARY KEY,
      url TEXT NOT NULL UNIQUE,
      pathname TEXT,
      filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      bytes BIGINT NOT NULL CHECK (bytes >= 0),
      width INTEGER,
      height INTEGER,
      alt_text TEXT NOT NULL DEFAULT '',
      title TEXT,
      folder TEXT,
      tag TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by BIGINT REFERENCES admins(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at TIMESTAMPTZ
    )`,
    "CREATE INDEX IF NOT EXISTS media_assets_active_created_idx ON media_assets (created_at DESC, id DESC) WHERE deleted_at IS NULL",
    "CREATE INDEX IF NOT EXISTS media_assets_search_idx ON media_assets (folder, tag, content_type)",
    "CREATE INDEX IF NOT EXISTS media_assets_deleted_idx ON media_assets (deleted_at, created_at DESC)",
  ],
};

export default migration;
export const mediaMigrationStatements = migration.statements;
