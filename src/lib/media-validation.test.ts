import { describe, expect, it } from "vitest";
import { sanitizeMediaInput, validateAltText } from "@/lib/media-validation";

describe("validación de texto alternativo", () => {
  it("recorta espacios y conserva un alt descriptivo válido", () => {
    expect(validateAltText("  Fachada del local  ")).toEqual({ ok: true, value: "Fachada del local" });
  });

  it("permite alt vacío únicamente cuando se marca como decorativo", () => {
    expect(validateAltText("", true)).toEqual({ ok: true, value: "" });
    expect(validateAltText("", false).ok).toBe(false);
  });

  it("rechaza HTML, controles y textos demasiado largos", () => {
    expect(validateAltText("<img src=x>").ok).toBe(false);
    expect(validateAltText("Texto\u0000inseguro").ok).toBe(false);
    expect(validateAltText("x".repeat(501)).ok).toBe(false);
  });

  it("incluye alt y metadatos saneados en el payload persistible", () => {
    expect(sanitizeMediaInput({ altText: "  Cocina  ", title: "  Título " })).toMatchObject({
      altText: "Cocina",
      title: "Título",
    });
  });
});
