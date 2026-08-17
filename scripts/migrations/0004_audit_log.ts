import type { Migration } from "@/lib/migrations/runner";

const migration: Migration = {
  version: 4,
  name: "admin-audit-log",
  statements: [
    `CREATE TABLE IF NOT EXISTS audit_log (
      id BIGSERIAL PRIMARY KEY,
      admin_id BIGINT REFERENCES admins(id) ON DELETE SET NULL,
      admin_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      ip INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    "CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC, id DESC)",
    "CREATE INDEX IF NOT EXISTS audit_log_admin_id_idx ON audit_log (admin_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log (action, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity_type, entity_id, created_at DESC)",
  ],
};

export default migration;

export const auditMigrationStatements = migration.statements;
