import { createHmac, timingSafeEqual } from "node:crypto";

const PREVIEW_TTL_MS = 2 * 60 * 60 * 1000;
const PREFIX = "v1";

function secret(): string {
  const value = process.env.PREVIEW_SECRET ?? process.env.ADMIN_SECRET ?? process.env.ADMIN_PASSWORD;
  if (!value) throw new Error("Falta PREVIEW_SECRET (o ADMIN_SECRET) para usar previews.");
  return value;
}

export type PreviewPayload = { slug: string; exp: number };

export function issuePreviewToken(slug: string, now = Date.now(), ttlMs = PREVIEW_TTL_MS): string {
  const payload = Buffer.from(JSON.stringify({ slug, exp: now + ttlMs })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(`${PREFIX}.${payload}`).digest("base64url");
  return `${PREFIX}.${payload}.${signature}`;
}

export function verifyPreviewToken(token: string, slug: string, now = Date.now()): PreviewPayload | null {
  const [prefix, encoded, signature] = token.split(".");
  if (prefix !== PREFIX || !encoded || !signature) return null;
  const expected = createHmac("sha256", secret()).update(`${PREFIX}.${encoded}`).digest("base64url");
  const actual = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString()) as Partial<PreviewPayload>;
    if (parsed.slug !== slug || typeof parsed.exp !== "number" || parsed.exp <= now) return null;
    return { slug: parsed.slug, exp: parsed.exp };
  } catch {
    return null;
  }
}

export const previewTtlMs = PREVIEW_TTL_MS;
