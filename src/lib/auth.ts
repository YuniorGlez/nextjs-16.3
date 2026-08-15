import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "btv_admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

const password = process.env.ADMIN_PASSWORD ?? "Temporal1234!";
const secret = process.env.ADMIN_SECRET ?? password;

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

export function issueToken(): string {
  const payload = b64url(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }));
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): boolean {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expBuf)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return !!token && verifyToken(token);
}

export async function createSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, issueToken(), {
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

export function checkPassword(input: string): boolean {
  return input === password;
}