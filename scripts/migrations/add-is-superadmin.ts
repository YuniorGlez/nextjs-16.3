// Migración aditiva: columna is_superadmin en la tabla admins.
// Uso: bun --env-file=.env.local scripts/migrations/add-is-superadmin.ts
// Idempotente: se puede ejecutar varias veces sin efectos secundarios.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no está. Ejecuta con --env-file=.env.local");
const sql = neon(url);

await sql`ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT FALSE`;

// Proyectos ya sembrados: si nadie es superadmin todavía, promueve a todos los
// admins existentes (son los propietarios del panel). No-op si ya hay alguno.
await sql`UPDATE admins SET is_superadmin = TRUE
  WHERE NOT EXISTS (SELECT 1 FROM admins WHERE is_superadmin = TRUE)`;

console.log("Migración is_superadmin completada.");
