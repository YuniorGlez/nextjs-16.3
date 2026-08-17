import type { Migration } from "@/lib/migrations/runner";

const migration: Migration = {
  version: 7,
  name: "i18n-config-and-page-translations",
  statements: [
    `INSERT INTO settings (key, value) VALUES ('i18n', '{"defaultLocale":"es","enabledLocales":["es"]}'::jsonb)
     ON CONFLICT (key) DO NOTHING`,
    `ALTER TABLE pages ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb`,
  ],
};

export default migration;
export const i18nMigrationStatements = migration.statements;
