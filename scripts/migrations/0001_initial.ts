import type { Migration } from "@/lib/migrations/runner";

const migration: Migration = {
  version: 1,
  name: "initial",
  statements: [
    `CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS pages (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      visible BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INT NOT NULL DEFAULT 0,
      seo JSONB NOT NULL DEFAULT '{}'::jsonb,
      content JSONB NOT NULL DEFAULT '{}'::jsonb,
      layout JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS page_versions (
      id SERIAL PRIMARY KEY,
      page_id INT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      snapshot JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS page_redirects (
      id SERIAL PRIMARY KEY,
      from_slug TEXT NOT NULL UNIQUE,
      to_slug TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      token_version INT NOT NULL DEFAULT 0,
      is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    "CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id)",
    "CREATE INDEX IF NOT EXISTS idx_page_versions_page_id ON page_versions(page_id)",
    "CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order)",
    "CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at)",
  ],
};

export default migration;
