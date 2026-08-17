import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resolveOgTitle, truncateForOg } from "@/lib/og";

describe("resolveOgTitle", () => {
  it("usa seo.title si existe (recortado)", () => {
    expect(
      resolveOgTitle({ name: "Sobre nosotros", seo: { title: "  Conócenos  " } }),
    ).toBe("Conócenos");
  });

  it("cae a name cuando no hay seo.title", () => {
    expect(resolveOgTitle({ name: "Contacto", seo: {} })).toBe("Contacto");
    expect(resolveOgTitle({ name: "  Contacto  ", seo: undefined })).toBe("Contacto");
  });

  it("no rompe con páginas sin nombre", () => {
    expect(resolveOgTitle({ name: " ", seo: {} })).toBe("Página");
  });
});

describe("truncateForOg", () => {
  it("no toca títulos cortos", () => {
    expect(truncateForOg("Hola")).toBe("Hola");
  });

  it("recorta títulos largos con ellipsis", () => {
    const out = truncateForOg("x".repeat(100));
    expect(out).toHaveLength(56);
    expect(out.endsWith("…")).toBe(true);
  });

  it("respeta el máximo configurable", () => {
    const out = truncateForOg("abcdefghij", 5);
    expect(out).toBe("abcd…");
  });
});

// ---------- Ruta /og/[slug] (GET) ----------
// Se mockea la capa de datos para no tocar la BD real en tests.
const mocks = vi.hoisted(() => ({ getPageBySlug: vi.fn() }));
vi.mock("@/lib/data", () => ({ getPageBySlug: mocks.getPageBySlug }));

const { GET } = await import("@/app/og/[slug]/route");

describe("GET /og/[slug]", () => {
  const req = () => new NextRequest("https://example.com/og/sobre-nosotros");

  it("devuelve 404 si la página no existe", async () => {
    mocks.getPageBySlug.mockResolvedValueOnce(null);
    const res = await GET(req(), { params: Promise.resolve({ slug: "no-existe" }) });
    expect(res.status).toBe(404);
  });

  it("devuelve 404 si la página está oculta", async () => {
    mocks.getPageBySlug.mockResolvedValueOnce({
      id: 1,
      slug: "oculta",
      name: "Oculta",
      visible: false,
      sortOrder: 1,
      seo: {},
      content: {},
      layout: [],
      updatedAt: null,
    });
    const res = await GET(req(), { params: Promise.resolve({ slug: "oculta" }) });
    expect(res.status).toBe(404);
  });

  it("genera un PNG 1200×630 con cache corta para una página visible", async () => {
    mocks.getPageBySlug.mockResolvedValueOnce({
      id: 2,
      slug: "sobre-nosotros",
      name: "Sobre nosotros",
      visible: true,
      sortOrder: 1,
      seo: { title: "" },
      content: {},
      layout: [],
      updatedAt: "2026-08-17T10:00:00.000Z",
    });
    const res = await GET(req(), { params: Promise.resolve({ slug: "sobre-nosotros" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
    expect(res.headers.get("cache-control")).toBe(
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    );
    // PNG mágico: 8 bytes de cabecera.
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });
});
