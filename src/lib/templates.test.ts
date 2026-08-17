import { describe, expect, it } from "vitest";
import {
  applyTemplateToSettings,
  getTemplate,
  SECTOR_TEMPLATES,
  validateTemplateId,
} from "@/lib/templates";
import { PERMISSIONS, routePermission } from "@/lib/rbac";

describe("plantillas sectoriales", () => {
  it("expone un catálogo tipado sin contenido de cliente", () => {
    expect(SECTOR_TEMPLATES.map((template) => template.id)).toEqual([
      "restaurante",
      "servicios-profesionales",
      "salud",
      "retail",
      "portfolio",
    ]);
    expect(getTemplate("restaurante")?.sections.length).toBeGreaterThan(0);
    expect(SECTOR_TEMPLATES.every((template) => template.description.length > 0)).toBe(true);
  });

  it("valida ids desconocidos sin aceptar valores arbitrarios", () => {
    expect(validateTemplateId("salud")).toBe("salud");
    expect(validateTemplateId("desconocida")).toBeNull();
    expect(getTemplate("desconocida")).toBeNull();
  });

  it("rellena solo campos ausentes y conserva contenido existente", () => {
    const template = getTemplate("retail");
    if (!template) throw new Error("plantilla de prueba ausente");
    const result = applyTemplateToSettings(
      { hero: { h1: "Título del cliente" }, layout: [{ key: "hero", visible: true }] },
      template,
    );

    expect(result.hero).toMatchObject({ h1: "Título del cliente" });
    expect(result.hero).toHaveProperty("cta1");
    expect(result.layout).toEqual([{ key: "hero", visible: true }]);
    expect(result.template).toBe("retail");
  });

  it("es idempotente al aplicar el mismo preset dos veces", () => {
    const template = getTemplate("portfolio");
    if (!template) throw new Error("plantilla de prueba ausente");
    const once = applyTemplateToSettings({}, template);
    expect(applyTemplateToSettings(once, template)).toEqual(once);
  });

  it("usa branding.manage para proteger la ruta de plantillas", () => {
    expect(routePermission("/admin/plantillas")).toBe(PERMISSIONS.branding);
  });
});


describe("autorización de presets", () => {
  it("no confunde el módulo de plantillas con modules.manage", () => {
    expect(PERMISSIONS.branding).toBe("branding.manage");
    expect(PERMISSIONS.modules).toBe("modules.manage");
  });
});


describe("migración de plantillas", () => {
  it("se incorpora como migración posterior a media library", async () => {
    const { migrations } = await import("../../scripts/migrations");
    expect(migrations.at(-1)?.version).toBe(6);
    const migration = migrations.at(-1);
    expect(migration?.statements[0]).toContain("ON CONFLICT (key) DO NOTHING");
  });
});

// La acción server-side se prueba mediante requirePermission en producción;
// esta suite mantiene la autorización pura y el comportamiento no destructivo.