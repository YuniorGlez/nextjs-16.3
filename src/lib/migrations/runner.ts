export type Migration = {
  version: number;
  name: string;
  statements: readonly string[];
};

export type AppliedMigration = Pick<Migration, "version" | "name">;

export type MigrationDatabase = {
  transaction: (queries: readonly string[]) => Promise<unknown>;
};

export type MigrationResult = {
  applied: AppliedMigration[];
  pending: AppliedMigration[];
};

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MigrationError";
  }
}

const CONTROL_TABLE = "schema_migrations";
const LOCK_KEY = "819274";
const CREATE_CONTROL_TABLE = `CREATE TABLE IF NOT EXISTS ${CONTROL_TABLE} (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;
const LOCK = `SELECT pg_advisory_xact_lock(${LOCK_KEY})`;
const SELECT_APPLIED = `SELECT version, name FROM ${CONTROL_TABLE} ORDER BY version`;

function quote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function validateMigrations(migrations: readonly Migration[]): void {
  const versions = new Set<number>();
  for (let index = 0; index < migrations.length; index += 1) {
    const migration = migrations[index];
    if (versions.has(migration.version)) {
      throw new MigrationError(`La migración ${migration.version} está duplicada.`);
    }
    if (index > 0 && migration.version <= migrations[index - 1].version) {
      throw new MigrationError("Las migraciones deben estar ordenadas por versión ascendente.");
    }
    if (!Number.isInteger(migration.version) || migration.version < 1) {
      throw new MigrationError(`Versión de migración inválida: ${migration.version}.`);
    }
    if (!migration.name.trim()) {
      throw new MigrationError(`La migración ${migration.version} no tiene nombre.`);
    }
    versions.add(migration.version);
  }
}

function readRows(result: unknown): AppliedMigration[] {
  if (!Array.isArray(result)) return [];
  return result
    .filter((row): row is { version: number | string; name: string } => {
      return typeof row === "object" && row !== null && "version" in row && "name" in row;
    })
    .map((row) => ({ version: Number(row.version), name: row.name }));
}

async function readApplied(db: MigrationDatabase): Promise<AppliedMigration[]> {
  const result = await db.transaction([CREATE_CONTROL_TABLE, LOCK, SELECT_APPLIED]);
  const batches = Array.isArray(result) ? result : [];
  return readRows(batches[2]);
}

export async function getAppliedMigrations(db: MigrationDatabase): Promise<AppliedMigration[]> {
  return readApplied(db);
}

export async function runMigrations(
  db: MigrationDatabase,
  migrations: readonly Migration[],
): Promise<MigrationResult> {
  validateMigrations(migrations);
  const appliedBefore = await readApplied(db);
  const appliedByVersion = new Map(appliedBefore.map((migration) => [migration.version, migration]));

  for (const migration of migrations) {
    const applied = appliedByVersion.get(migration.version);
    if (applied && applied.name !== migration.name) {
      throw new MigrationError(
        `La migración ${migration.version} cambió de nombre: "${applied.name}" → "${migration.name}".`,
      );
    }
  }

  const pending = migrations.filter((migration) => !appliedByVersion.has(migration.version));
  if (pending.length === 0) {
    return { applied: [], pending: [] };
  }

  const queries = [CREATE_CONTROL_TABLE, LOCK, SELECT_APPLIED];
  for (const migration of pending) {
    queries.push(...migration.statements);
    queries.push(
      `INSERT INTO ${CONTROL_TABLE} (version, name) VALUES (${migration.version}, ${quote(migration.name)})`,
    );
  }
  await db.transaction(queries);

  const applied = pending.map(({ version, name }) => ({ version, name }));
  return { applied, pending: [] };
}
