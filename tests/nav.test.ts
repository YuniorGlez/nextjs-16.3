import { describe, expect, it } from "vitest";
import { normalizeNav, type NavPage } from "@/lib/nav";

const pages: NavPage[] = [
  { slug: "inicio", name: "Inicio", visible: true },
  { slug: "sobre-nosotros", name: "Sobre nosotros", visible: true },
  { slug: "contacto", name: "Contacto", visible: true },
  { slug: "oculta", name: "Página oculta", visible: false },
];

describe("normalizeNav", () => {
  it("sin configuración → fallback: Inicio + páginas visibles excepto 'inicio'", () => {
    expect(normalizeNav(undefined, pages)).toEqual({
      items: [
        { label: "Inicio", href: "/" },
        { label: "Sobre nosotros", href: "/sobre-nosotros" },
        { label: "Contacto", href: "/contacto" },
      ],
    });
  });

  it("configuración vacía ({} o items []) → fallback", () => {
    expect(normalizeNav({}, pages).items).toHaveLength(3);
    expect(normalizeNav({ items: [] }, pages).items).toHaveLength(3);
    expect(normalizeNav("no-object", pages).items).toHaveLength(3);
  });

  it("mezcla ítem de página, enlace externo y submenú", () => {
    const nav = normalizeNav(
      {
        items: [
          { pageSlug: "sobre-nosotros" },
          { label: "Blog", href: "https://blog.example.com" },
          {
            label: "Servicios",
            children: [
              { pageSlug: "contacto" },
              { label: "Tarifas", href: "/tarifas" },
            ],
          },
        ],
      },
      pages,
    );
    expect(nav.items).toEqual([
      { label: "Inicio", href: "/" },
      { label: "Sobre nosotros", href: "/sobre-nosotros" },
      { label: "Blog", href: "https://blog.example.com", external: true },
      {
        label: "Servicios",
        children: [
          { label: "Contacto", href: "/contacto" },
          { label: "Tarifas", href: "/tarifas" },
        ],
      },
    ]);
  });

  it("label override: gana el label del ítem sobre el nombre de la página", () => {
    const nav = normalizeNav({ items: [{ pageSlug: "sobre-nosotros", label: "Nosotros" }] }, pages);
    expect(nav.items[1]).toEqual({ label: "Nosotros", href: "/sobre-nosotros" });
  });

  it("página oculta descartada; con href explícito se conserva como enlace", () => {
    expect(normalizeNav({ items: [{ pageSlug: "oculta" }] }, pages).items).toEqual([
      { label: "Inicio", href: "/" },
    ]);
    const nav = normalizeNav(
      { items: [{ pageSlug: "oculta", label: "Oculta", href: "https://x.com/oculta" }] },
      pages,
    );
    expect(nav.items).toEqual([
      { label: "Inicio", href: "/" },
      { label: "Oculta", href: "https://x.com/oculta", external: true },
    ]);
  });

  it("página inexistente sin label ni href → ítem roto descartado", () => {
    const nav = normalizeNav({ items: [{ pageSlug: "no-existe" }] }, pages);
    expect(nav.items).toEqual([{ label: "Inicio", href: "/" }]);
  });

  it("slug antiguo con label se mantiene como /slug (lo resuelve la redirección 301)", () => {
    const nav = normalizeNav({ items: [{ pageSlug: "quienes-somos", label: "Quiénes somos" }] }, pages);
    expect(nav.items[1]).toEqual({ label: "Quiénes somos", href: "/quienes-somos" });
  });

  it("slug antiguo con href → enlace personalizado (requiere label)", () => {
    expect(normalizeNav({ items: [{ pageSlug: "no-existe", href: "https://x.com" }] }, pages).items).toEqual([
      { label: "Inicio", href: "/" },
    ]);
    const nav = normalizeNav(
      { items: [{ pageSlug: "no-existe", label: "Externo", href: "https://x.com" }] },
      pages,
    );
    expect(nav.items[1]).toEqual({ label: "Externo", href: "https://x.com", external: true });
  });

  it("enlace personalizado sin label ni página → descartado", () => {
    const nav = normalizeNav({ items: [{ href: "https://x.com" }] }, pages);
    expect(nav.items).toEqual([{ label: "Inicio", href: "/" }]);
  });

  it("submenú con todos los hijos rotos → el padre se descarta (sin href ni hijos válidos)", () => {
    const nav = normalizeNav(
      { items: [{ label: "Padre", children: [{ pageSlug: "no-existe" }] }] },
      pages,
    );
    expect(nav.items).toEqual([{ label: "Inicio", href: "/" }]);
  });

  it("submenú con algún hijo válido → el padre se conserva como desplegable", () => {
    const nav = normalizeNav(
      {
        items: [
          {
            label: "Padre",
            children: [{ pageSlug: "no-existe" }, { pageSlug: "contacto" }],
          },
        ],
      },
      pages,
    );
    expect(nav.items).toEqual([
      { label: "Inicio", href: "/" },
      { label: "Padre", children: [{ label: "Contacto", href: "/contacto" }] },
    ]);
  });

  it("ítem sin href ni children → descartado", () => {
    const nav = normalizeNav({ items: [{ label: "Solo texto" }] }, pages);
    expect(nav.items).toEqual([{ label: "Inicio", href: "/" }]);
  });

  it("dedupe: el mismo href solo aparece una vez (se conserva el primero)", () => {
    const nav = normalizeNav(
      { items: [{ pageSlug: "contacto" }, { label: "Escríbenos", href: "/contacto" }] },
      pages,
    );
    expect(nav.items).toEqual([
      { label: "Inicio", href: "/" },
      { label: "Contacto", href: "/contacto" },
    ]);
  });

  it("fallback amigable: sin ítem a '/' se antepone Inicio; si existe, se respeta el orden", () => {
    const nav = normalizeNav({ items: [{ pageSlug: "sobre-nosotros" }] }, pages);
    expect(nav.items.map((i) => i.href)).toEqual(["/", "/sobre-nosotros"]);

    const withHome = normalizeNav(
      { items: [{ pageSlug: "sobre-nosotros" }, { pageSlug: "inicio" }] },
      pages,
    );
    expect(withHome.items.map((i) => i.href)).toEqual(["/sobre-nosotros", "/"]);
  });

  it("CTA completo se incluye; incompleto se omite", () => {
    expect(
      normalizeNav({ items: [{ pageSlug: "contacto" }], cta: { label: "Reservar", href: "/contacto" } }, pages)
        .cta,
    ).toEqual({ label: "Reservar", href: "/contacto" });

    expect(normalizeNav({ items: [], cta: { label: "Reservar" } }, pages).cta).toBeUndefined();
    expect(normalizeNav({ items: [], cta: { href: "/contacto" } }, pages).cta).toBeUndefined();
  });

  it("el CTA se mantiene aunque la nav caiga al fallback por falta de ítems", () => {
    const nav = normalizeNav({ items: [], cta: { label: "Reservar", href: "/contacto" } }, pages);
    expect(nav.items).toHaveLength(3);
    expect(nav.cta).toEqual({ label: "Reservar", href: "/contacto" });
  });

  it("hijos con pageSlug no visible se descartan (y el padre, si no queda ningún hijo)", () => {
    const nav = normalizeNav(
      { items: [{ label: "Más", children: [{ pageSlug: "oculta" }] }] },
      pages,
    );
    expect(nav.items).toEqual([{ label: "Inicio", href: "/" }]);
  });
});
