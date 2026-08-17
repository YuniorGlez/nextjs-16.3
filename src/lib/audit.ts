import { headers } from "next/headers";
import type { AdminSession } from "@/lib/auth";

const SECRET_KEY = /(pass(word)?|token|secret|api[_-]?key|authorization|cookie|credential|private[_-]?key|message|body|prompt|input[_-]?reference)/i;
const MAX_DEPTH = 4;
const MAX_STRING = 500;
const MAX_KEYS = 50;

export type AuditEvent = {
  adminId: number | null;
  adminEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
};

function clean(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return "[truncated]";
  if (typeof value === "string") return value.slice(0, MAX_STRING);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, MAX_KEYS).map((item) => clean(item, depth + 1));
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value).slice(0, MAX_KEYS)) {
      if (!SECRET_KEY.test(key)) output[key] = clean(item, depth + 1);
    }
    return output;
  }
  return undefined;
}

export function sanitizeAuditMetadata(metadata: unknown): Record<string, unknown> {
  const value = clean(metadata, 0);
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function firstForwardedIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",", 1)[0]?.trim();
  return first ? first.slice(0, 80) : null;
}

export function buildAuditEvent(input: {
  admin?: Pick<AdminSession, "id" | "email"> | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  metadata?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}): AuditEvent {
  return {
    adminId: input.admin?.id ?? null,
    adminEmail: input.admin?.email?.trim().toLowerCase() ?? null,
    action: input.action.slice(0, 120),
    entityType: input.entityType.slice(0, 80),
    entityId: input.entityId == null ? null : String(input.entityId).slice(0, 160),
    metadata: sanitizeAuditMetadata(input.metadata),
    ip: firstForwardedIp(input.ip ?? null),
    userAgent: input.userAgent?.slice(0, 500) ?? null,
  };
}

export async function recordAudit(input: Parameters<typeof buildAuditEvent>[0]): Promise<void> {
  const event = buildAuditEvent(input);
  try {
    const { sql } = await import("@/lib/db");
    await sql`INSERT INTO audit_log (admin_id, admin_email, action, entity_type, entity_id, metadata, ip, user_agent)
      VALUES (${event.adminId}, ${event.adminEmail}, ${event.action}, ${event.entityType}, ${event.entityId},
        ${JSON.stringify(event.metadata)}::jsonb, ${event.ip}, ${event.userAgent})`;
  } catch (error) {
    console.error("[audit] no se pudo registrar el evento", {
      action: event.action,
      entityType: event.entityType,
      error,
    });
  }
}

export async function recordCurrentAdminAudit(input: Omit<Parameters<typeof buildAuditEvent>[0], "admin" | "ip" | "userAgent">): Promise<void> {
  try {
    const [{ getCurrentAdmin }, requestHeaders] = await Promise.all([import("@/lib/auth"), headers()]);
    const admin = await getCurrentAdmin();
    await recordAudit({
      ...input,
      admin,
      ip: requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
      userAgent: requestHeaders.get("user-agent"),
    });
  } catch (error) {
    console.error("[audit] no se pudo obtener el contexto del evento", { action: input.action, error });
  }
}

export type AuditRow = AuditEvent & { id: number; createdAt: string };
export type AuditFilters = { action?: string; entityType?: string; adminId?: number; from?: string; to?: string; page?: number; pageSize?: number };

export async function listAuditEvents(filters: AuditFilters = {}): Promise<{ rows: AuditRow[]; total: number; page: number; pageSize: number }> {
  const { sql } = await import("@/lib/db");
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 25));
  const offset = (page - 1) * pageSize;
  const rows = (await sql.query(
    `SELECT id, admin_id, admin_email, action, entity_type, entity_id, metadata, ip, user_agent, created_at,
      COUNT(*) OVER() AS total FROM audit_log
      WHERE ($1 = '' OR action ILIKE '%' || $1 || '%')
        AND ($2 = '' OR entity_type = $2)
        AND ($3::bigint IS NULL OR admin_id = $3)
        AND ($4::timestamptz IS NULL OR created_at >= $4)
        AND ($5::timestamptz IS NULL OR created_at < $5)
      ORDER BY created_at DESC, id DESC LIMIT $6 OFFSET $7`,
    [filters.action?.slice(0, 80) ?? "", filters.entityType?.slice(0, 80) ?? "", filters.adminId ?? null, filters.from || null, filters.to || null, pageSize, offset],
  )) as unknown as Array<Record<string, unknown>>;
  return {
    rows: rows.map((row) => buildAuditEvent({
      admin: row.admin_id == null ? null : { id: Number(row.admin_id), email: String(row.admin_email ?? "") },
      action: String(row.action), entityType: String(row.entity_type), entityId: row.entity_id == null ? null : String(row.entity_id),
      metadata: row.metadata, ip: row.ip == null ? null : String(row.ip), userAgent: row.user_agent == null ? null : String(row.user_agent),
    }) as AuditRow & { id: number; createdAt: string }).map((row, index) => ({ ...row, id: Number(rows[index].id), createdAt: new Date(String(rows[index].created_at)).toISOString() })),
    total: Number(rows[0]?.total ?? 0), page, pageSize,
  };
}

export function canReadAudit(admin: Pick<AdminSession, "isSuperadmin" | "permissions" | "role">): boolean {
  return admin.isSuperadmin || admin.permissions.includes("audit.read") || admin.permissions.includes("security.manage");
}
