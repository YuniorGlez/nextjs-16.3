import { neon } from "@neondatabase/serverless";
import { runTransaction } from "@/lib/transactions";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill in the value.",
  );
}

export const sql = neon(databaseUrl);

export type QueryResult<T = Record<string, unknown>> = T[];
export type DbQuery = ReturnType<typeof sql>;

/** Ejecuta queries Neon HTTP como una transacción no interactiva. */
export function runDbTransaction<T>(queries: readonly DbQuery[], afterCommit?: () => void | Promise<void>): Promise<T> {
  return runTransaction((batch) => sql.transaction(batch as DbQuery[]), queries, afterCommit) as Promise<T>;
}
