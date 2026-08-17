import { describe, expect, it } from "vitest";
import { buildAuditEvent, sanitizeAuditMetadata } from "@/lib/audit";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

describe("registro de auditoría", () => {
  it("elimina secretos y cuerpos de mensajes del metadata", () => {
    const result = sanitizeAuditMetadata({
      password: "secret",
      token: "jwt",
      apiKey: "key",
      message: "cuerpo privado",
      nested: { authorization: "Bearer abc", ok: "safe" },
      count: 2,
    });

    expect(result).toEqual({ nested: { ok: "safe" }, count: 2 });
  });

  it("construye un evento con identidad snapshot e IP segura", () => {
    expect(buildAuditEvent({
      admin: { id: 7, email: "Admin@Example.COM" },
      action: "page.update",
      entityType: "page",
      entityId: 12,
      metadata: { title: "Inicio" },
      ip: "2001:db8::1, 10.0.0.1",
      userAgent: "Mozilla/5.0",
    })).toEqual({
      adminId: 7,
      adminEmail: "admin@example.com",
      action: "page.update",
      entityType: "page",
      entityId: "12",
      metadata: { title: "Inicio" },
      ip: "2001:db8::1",
      userAgent: "Mozilla/5.0",
    });
  });

  it("autoriza auditoría a superadmin y security.manage, no a viewer", () => {
    expect(hasPermission({ isSuperadmin: true }, PERMISSIONS.auditRead)).toBe(true);
    expect(hasPermission({ permissions: [PERMISSIONS.security] }, PERMISSIONS.auditRead)).toBe(true);
    expect(hasPermission({ role: "viewer" }, PERMISSIONS.auditRead)).toBe(false);
  });
});
