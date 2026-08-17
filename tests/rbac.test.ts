import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  hasPermission,
  permissionsFor,
  routePermission,
  sanitizePermissions,
} from "@/lib/rbac";

describe("RBAC", () => {
  it("da acceso total al superadmin aunque la fila tenga permisos vacíos", () => {
    expect(permissionsFor("viewer", [], true)).toEqual(ALL_PERMISSIONS);
    expect(hasPermission({ role: "viewer", permissions: [], isSuperadmin: true }, PERMISSIONS.modules)).toBe(true);
  });

  it("resuelve el preset de editor sin permisos administrativos", () => {
    expect(hasPermission({ role: "editor" }, PERMISSIONS.contentWrite)).toBe(true);
    expect(hasPermission({ role: "editor" }, PERMISSIONS.security)).toBe(false);
  });

  it("sanitiza permisos desconocidos y duplicados", () => {
    expect(sanitizePermissions([PERMISSIONS.seo, PERMISSIONS.seo, "root", 1])).toEqual([PERMISSIONS.seo]);
  });

  it("permite una selección explícita segura", () => {
    expect(permissionsFor("admin", [PERMISSIONS.messagesRead])).toEqual([PERMISSIONS.messagesRead]);
  });

  it("asocia rutas sensibles con el permiso correcto", () => {
    expect(routePermission("/admin/seguridad")).toBe(PERMISSIONS.security);
    expect(routePermission("/admin/paginas/1")).toBe(PERMISSIONS.contentRead);
    expect(routePermission("/admin/imagenes")).toBe(PERMISSIONS.mediaUpload);
  });
});
