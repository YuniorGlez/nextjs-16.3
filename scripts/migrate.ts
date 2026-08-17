import { neon } from "@neondatabase/serverless";
import { getAppliedMigrations, runMigrations, type MigrationDatabase } from "../src/lib/migrations/runner";
import { migrations } from "./migrations";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definido. Usa bun --env-file=.env.local run db:migrate");
}

const sql = neon(databaseUrl);
const db: MigrationDatabase = {
  transaction: (queries) => sql.transaction(queries.map((query) => sql`${sql.unsafe(query)}`)),
};

const command = process.argv[2] ?? "up";
if (command !== "up" && command !== "status") {
  throw new Error(`Comando desconocido: ${command}. Usa "up" o "status".`);
}

if (command === "status") {
  const applied = await getAppliedMigrations(db);
  const appliedVersions = new Set(applied.map(({ version }) => version));
  console.log(`Migraciones aplicadas: ${applied.length}`);
  for (const migration of migrations) {
    console.log(`${appliedVersions.has(migration.version) ? "aplicada" : "pendiente"} ${String(migration.version).padStart(4, "0")} ${migration.name}`);
  }
} else {
  const result = await runMigrations(db, migrations);
  if (result.applied.length === 0) {
    console.log("La base de datos ya está al día.");
  } else {
    console.log("Migraciones aplicadas:", result.applied.map(({ version, name }) => `${version} ${name}`).join(", "));
  }
}
