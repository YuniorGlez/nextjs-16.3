import { describe, expect, it } from "vitest";
import { MigrationError, runMigrations, type Migration } from "@/lib/migrations/runner";

type FakeDb = {
  batches: string[][];
  rows: Array<Array<{ version: number; name: string }>>;
  transaction: (queries: readonly string[]) => Promise<unknown>;
};

function fakeDb(rows: Array<{ version: number; name: string }> = []): FakeDb {
  const db: FakeDb = {
    batches: [],
    rows: [rows],
    transaction: async (queries) => {
      db.batches.push([...queries]);
      return [[], [], db.rows[0]];
    },
  };
  return db;
}

const migrations: Migration[] = [
  { version: 1, name: "initial", statements: ["CREATE TABLE items (id integer)"] },
  { version: 2, name: "add status", statements: ["ALTER TABLE items ADD COLUMN status text"] },
];

describe("runMigrations", () => {
  it("aplica migraciones pendientes en orden y las registra", async () => {
    const db = fakeDb();

    const result = await runMigrations(db, migrations);

    expect(result.applied).toEqual([
      { version: 1, name: "initial" },
      { version: 2, name: "add status" },
    ]);
    expect(db.batches[1]).toEqual(expect.arrayContaining([
      expect.stringContaining("pg_advisory_xact_lock"),
      "CREATE TABLE items (id integer)",
      expect.stringContaining("INSERT INTO schema_migrations"),
    ]));
    expect(db.batches[1].indexOf("CREATE TABLE items (id integer)")).toBeLessThan(
      db.batches[1].indexOf("ALTER TABLE items ADD COLUMN status text"),
    );
  });

  it("es idempotente cuando no hay migraciones nuevas", async () => {
    const db = fakeDb([
      { version: 1, name: "initial" },
      { version: 2, name: "add status" },
    ]);

    const result = await runMigrations(db, migrations);

    expect(result.applied).toEqual([]);
    expect(db.batches[0]).not.toContain("CREATE TABLE items (id integer)");
  });

  it("rechaza una migración aplicada con otro nombre", async () => {
    const db = fakeDb([{ version: 1, name: "different" }]);

    await expect(runMigrations(db, migrations)).rejects.toThrow(MigrationError);
  });

  it("propaga el error del ejecutor para evitar registrar una migración fallida", async () => {
    const db: FakeDb = {
      batches: [],
      rows: [[]],
      transaction: async () => {
        throw new Error("database unavailable");
      },
    };

    await expect(runMigrations(db, migrations)).rejects.toThrow("database unavailable");
  });

  it("rechaza versiones duplicadas o fuera de orden", async () => {
    const db = fakeDb();

    await expect(runMigrations(db, [migrations[1], migrations[0]])).rejects.toThrow(
      "ordenadas",
    );
    await expect(runMigrations(db, [migrations[0], migrations[0]])).rejects.toThrow(
      "duplicada",
    );
  });
});
