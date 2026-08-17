import type { Migration } from "@/lib/migrations/runner";

const migration: Migration = {
  version: 6,
  name: "sector-templates",
  statements: [
    `INSERT INTO settings (key, value) VALUES ('template', '"servicios-profesionales"'::jsonb)
     ON CONFLICT (key) DO NOTHING`,
  ],
};

export default migration;
export const sectorTemplatesMigrationStatements = migration.statements;

/*
 * La migración solo añade el ajuste si no existe: no ejecuta seed ni modifica
 * contenido, por lo que es segura para instalaciones ya personalizadas.
 */
