import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill in the value.",
  );
}

export const sql = neon(databaseUrl);

export type QueryResult<T = Record<string, unknown>> = T[];
