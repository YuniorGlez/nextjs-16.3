import { describe, expect, it } from "bun:test";
import { mediaFilename, mediaPagination, sanitizeMediaInput, sanitizeMediaMetadata } from "@/lib/media-validation";
import migration from "../scripts/migrations/0005_media_library";

describe("media library", () => {
  it("sanitiza metadatos y limita texto", () => {
    const value = sanitizeMediaInput({ altText: "  foto del menú  ", title: " título ", folder: " comidas ", metadata: { author: "Ana", secret: "x" } });
    expect(value).toEqual({ altText: "foto del menú", title: "título", folder: "comidas", tag: null, metadata: { author: "Ana", secret: "x" } });
    expect(sanitizeMediaMetadata(["no"])).toEqual({});
  });

  it("normaliza nombres de Blob sin permitir rutas", () => {
    expect(mediaFilename("../mi foto?.png")).toBe(".._mi_foto_.png");
  });

  it("normaliza paginación y limita el tamaño", () => {
    expect(mediaPagination("-2", "1000")).toEqual({ page: 1, pageSize: 100, offset: 0 });
  });

  it("declara una migración aditiva e idempotente", () => {
    expect(migration.version).toBe(5);
    expect(migration.statements.join(" ")).toContain("CREATE TABLE IF NOT EXISTS media_assets");
    expect(migration.statements.join(" ")).toContain("created_by BIGINT REFERENCES admins(id)");
  });
});

describe("media permissions", () => {
  it("mantiene media.upload fuera de viewer y dentro de media", async () => {
    const { hasPermission, PERMISSIONS } = await import("@/lib/rbac");
    expect(hasPermission({ role: "viewer" }, PERMISSIONS.mediaUpload)).toBe(false);
    expect(hasPermission({ role: "media" }, PERMISSIONS.mediaUpload)).toBe(true);
  });
});
