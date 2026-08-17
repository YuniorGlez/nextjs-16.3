import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash de contraseñas con scrypt (node:crypto, sin dependencias).
 * Formato almacenado: `saltBase64:hashBase64` (salt aleatorio de 16 bytes,
 * derivación de 64 bytes con N=16384, r=8, p=1).
 */

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

/** Valida la longitud de una contraseña; devuelve el error o null si es válida. */
export function validatePassword(password: string): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `La contraseña no puede superar los ${MAX_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}

/** Genera `salt:hash` en base64. Lanza si la contraseña no pasa la validación. */
export function hashPassword(password: string): string {
  const error = validatePassword(password);
  if (error) throw new Error(error);
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTS);
  return `${salt.toString("base64")}:${derived.toString("base64")}`;
}

/** Compara una contraseña con un hash almacenado (`salt:hash`). Nunca lanza. */
export function verifyPassword(password: string, stored: string): boolean {
  if (typeof password !== "string" || typeof stored !== "string") return false;
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [saltB64, hashB64] = parts;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64");
    expected = Buffer.from(hashB64, "base64");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = scryptSync(password, salt, expected.length, SCRYPT_OPTS);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
