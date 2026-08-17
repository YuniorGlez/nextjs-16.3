import { sql } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/passwords";

/**
 * Capa de BD de administradores del panel (tabla `admins`).
 *
 * Bootstrap sin lockout: si la tabla está vacía, el login con el env
 * ADMIN_PASSWORD crea el primer admin (email del formulario + hash del env
 * password). Una vez existe el primer admin, el env deja de servir y la
 * autenticación es contra la tabla con scrypt.
 */

export type AdminRow = {
  id: number;
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  tokenVersion: number;
  lastLoginAt: string | null;
  createdAt: string;
};

type AdminDbRow = {
  id: number;
  email: string;
  password_hash: string;
  must_change_password: boolean;
  token_version: number;
  last_login_at: unknown;
  created_at: unknown;
};

function normalizeAdmin(r: AdminDbRow): AdminRow {
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.password_hash,
    mustChangePassword: !!r.must_change_password,
    tokenVersion: r.token_version,
    lastLoginAt: r.last_login_at ? new Date(String(r.last_login_at)).toISOString() : null,
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}

// Lista de columnas constante (confiable): se interpola como fragmento SQL.
const ADMIN_COLS =
  "id, email, password_hash, must_change_password, token_version, last_login_at, created_at";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normaliza un email (trim + lowercase) y valida el formato básico. */
export function normalizeEmail(email: string): string | null {
  const value = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!value || !EMAIL_REGEX.test(value)) return null;
  return value;
}

export async function countAdmins(): Promise<number> {
  const rows = (await sql.query("SELECT COUNT(*) AS n FROM admins")) as unknown as {
    n: number;
  }[];
  return Number(rows[0]?.n ?? 0);
}

export async function getAdminById(id: number): Promise<AdminRow | null> {
  const rows = (await sql.query(`SELECT ${ADMIN_COLS} FROM admins WHERE id = $1`, [
    id,
  ])) as unknown as AdminDbRow[];
  return rows[0] ? normalizeAdmin(rows[0]) : null;
}

export async function getAdminByEmail(email: string): Promise<AdminRow | null> {
  const rows = (await sql.query(`SELECT ${ADMIN_COLS} FROM admins WHERE email = $1`, [
    email,
  ])) as unknown as AdminDbRow[];
  return rows[0] ? normalizeAdmin(rows[0]) : null;
}

export async function listAdmins(): Promise<AdminRow[]> {
  const rows = (await sql.query(`SELECT ${ADMIN_COLS} FROM admins ORDER BY id`)) as unknown as AdminDbRow[];
  return rows.map(normalizeAdmin);
}

export async function createAdmin(input: {
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  tokenVersion: number;
}): Promise<AdminRow> {
  const rows = (await sql.query(
    `INSERT INTO admins (email, password_hash, must_change_password, token_version)
     VALUES ($1, $2, $3, $4) RETURNING ${ADMIN_COLS}`,
    [input.email, input.passwordHash, input.mustChangePassword, input.tokenVersion],
  )) as unknown as AdminDbRow[];
  return normalizeAdmin(rows[0]);
}

export async function deleteAdminById(id: number): Promise<void> {
  await sql.query("DELETE FROM admins WHERE id = $1", [id]);
}

/** Cambia la contraseña, quita el flag de cambio forzado e invalida sesiones (token_version+1). */
export async function setAdminPassword(id: number, passwordHash: string): Promise<number> {
  const rows = (await sql.query(
    `UPDATE admins
     SET password_hash = $1, must_change_password = FALSE, token_version = token_version + 1
     WHERE id = $2 RETURNING token_version`,
    [passwordHash, id],
  )) as unknown as { token_version: number }[];
  return Number(rows[0]?.token_version ?? 0);
}

/** Invalida las sesiones de un admin (token_version+1). Devuelve el nuevo valor. */
export async function bumpAdminTokenVersion(id: number): Promise<number> {
  const rows = (await sql.query(
    "UPDATE admins SET token_version = token_version + 1 WHERE id = $1 RETURNING token_version",
    [id],
  )) as unknown as { token_version: number }[];
  return Number(rows[0]?.token_version ?? 0);
}

export async function touchAdminLogin(id: number): Promise<void> {
  await sql.query("UPDATE admins SET last_login_at = now() WHERE id = $1", [id]);
}

/**
 * Autentica email+contraseña contra la tabla `admins`. Si la tabla está
 * vacía, hace bootstrap con el env ADMIN_PASSWORD (crea el primer admin y lo
 * devuelve). Devuelve null para cualquier credencial incorrecta (error
 * genérico, sin revelar si el email existe).
 */
export async function authenticateAdmin(
  emailInput: string,
  password: string,
): Promise<AdminRow | null> {
  const email = normalizeEmail(emailInput);
  if (!email || typeof password !== "string" || password.length === 0) return null;

  const hasAdmins = (await countAdmins()) > 0;

  if (!hasAdmins) {
    // Bootstrap: el env ADMIN_PASSWORD crea el primer admin (sin lockout).
    const envPassword = process.env.ADMIN_PASSWORD ?? "Temporal1234!";
    if (password !== envPassword) return null;
    const rows = (await sql.query(
      `INSERT INTO admins (email, password_hash, must_change_password, token_version, last_login_at)
       SELECT $1, $2, FALSE, 1, now()
       WHERE NOT EXISTS (SELECT 1 FROM admins)
       RETURNING ${ADMIN_COLS}`,
      [email, hashPassword(password)],
    )) as unknown as AdminDbRow[];
    if (rows[0]) return normalizeAdmin(rows[0]);
    // Carrera: otra petición creó el primer admin justo ahora → autenticar normal.
  }

  const admin = await getAdminByEmail(email);
  if (!admin || !verifyPassword(password, admin.passwordHash)) return null;
  await touchAdminLogin(admin.id);
  return admin;
}
