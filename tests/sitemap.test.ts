import { describe, expect, it } from "vitest";
import { pageLastModified } from "@/lib/sitemap";

describe("pageLastModified", () => {
  it("convierte un ISO válido a Date", () => {
    const d = pageLastModified("2026-08-17T10:00:00.000Z");
    expect(d).toBeInstanceOf(Date);
    expect(d!.toISOString()).toBe("2026-08-17T10:00:00.000Z");
  });

  it("devuelve undefined con null, undefined o cadena vacía", () => {
    expect(pageLastModified(null)).toBeUndefined();
    expect(pageLastModified(undefined)).toBeUndefined();
    expect(pageLastModified("")).toBeUndefined();
  });

  it("devuelve undefined con una fecha inválida", () => {
    expect(pageLastModified("no-es-una-fecha")).toBeUndefined();
  });
});
