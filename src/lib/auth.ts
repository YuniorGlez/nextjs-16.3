import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getAdminById } from "@/lib/admins";
import { hasPermission, type Permission } from "@/lib/rbac";

export const COOKIE_NAME = "btv_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

const password = process.env.ADMIN_PASSWORD ?? "Temporal1234!";
const secret = process.env.ADMIN_SECRET ?? password;

export type TokenPayload = { sub: number; ver: number; exp: number };
export type AdminSession = {
  id: number;
  email: string;
  mustChangePassword: boolean;
  isSuperadmin: boolean;
  role: string;
  permissions: string[];
};

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

/**
 * Emite un token HMAC-sha256 con identidad: `{sub: adminId, ver: token_version,
 * exp}`. Si el token_version del admin en BD cambia (cambio de contraseña,
 * revocación), los tokens anteriores dejan de ser válidos.
 */
export function issueToken(sub: number, ver: number): string {
  const payload = b64url(JSON.stringify({ sub, ver, exp: Date.now() + SESSION_TTL_MS }));
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Verifica firma y expiración. Devuelve el payload o null. */
export function verifyToken(token: string): TokenPayload | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as Partial<TokenPayload>;
    if (typeof parsed.sub !== "number" || typeof parsed.ver !== "number") return null;
    if (typeof parsed.exp !== "number" || parsed.exp <= Date.now()) return null;
    return { sub: parsed.sub, ver: parsed.ver, exp: parsed.exp };
  } catch {
    return null;
  }
}

/**
 * Admin de la sesión actual: valida la firma y que el `ver` del token coincida
 * con el `token_version` del admin en BD (revocación). Devuelve null si no hay
 * sesión válida.
 */
export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const admin = await getAdminById(payload.sub);
  if (!admin || admin.tokenVersion !== payload.ver) return null;
  return {
    id: admin.id,
    email: admin.email,
    mustChangePassword: admin.mustChangePassword,
    isSuperadmin: admin.isSuperadmin,
    role: admin.role,
    permissions: admin.permissions,
  };
}

export async function requirePermission(permission: Permission): Promise<AdminSession> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    const { redirect } = await import("next/navigation");
    redirect("/admin");
    throw new Error("Sesión requerida");
  }
  if (!hasPermission(admin, permission)) {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return admin;
}

export async function isAdmin(): Promise<boolean> {
  return (await getCurrentAdmin()) !== null;
}

export async function createSession(admin: { id: number; tokenVersion: number }) {
  const store = await cookies();
  store.set(COOKIE_NAME, issueToken(admin.id, admin.tokenVersion), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
