import type { Migration } from "@/lib/migrations/runner";

const migration: Migration = {
  version: 3,
  name: "admin-rbac",
  statements: [
    "ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'",
    "ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb",
    "UPDATE admins SET role = CASE WHEN is_superadmin THEN 'superadmin' ELSE 'admin' END WHERE role IS NULL OR role = ''",
    "UPDATE admins SET permissions = '[]'::jsonb WHERE permissions IS NULL",
    "ALTER TABLE admins ADD CONSTRAINT admins_role_check CHECK (role IN ('superadmin','admin','editor','seo','media','messages','viewer'))",
  ],
};

export default migration;