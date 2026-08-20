// e2e/publico.spec.ts — Caminos públicos que heredan TODAS las webs de clientes.
// Migrado de Playwright a bun:test + Bun.WebView (ver e2e/lib.ts y e2e/server.ts).
// Home renderiza, nav/footer enlaces 200, páginas legales, contacto, viewport móvil.
import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { nuevaView, textoBody, getLocal, esperaSelector, BASE_URL } from "./lib";
import { setupServer } from "./server";

const server = setupServer();

beforeAll(async () => {
  await server.start();
}, 90_000);

afterAll(async () => {
  await server.stop();
});

describe("Home y navegación pública", () => {
  test("la home responde 200 y renderiza contenido visible", async () => {
    const r = await getLocal("/");
    expect(r.status).toBe(200);

    await using view = nuevaView();
    await view.navigate(`${BASE_URL}/`);
    await esperaSelector(view, "main");
    const txt = await textoBody(view);
    expect(txt.trim().length).toBeGreaterThan(50);
  });

  test("los enlaces del nav y footer devuelven 200 con contenido no vacío", async () => {
    await using view = nuevaView();
    await view.navigate(`${BASE_URL}/`);
    await esperaSelector(view, "nav a[href], footer a[href]");

    // Extrae enlaces internos (relativos) del nav y footer.
    const hrefs = (await view.evaluate(
      `Array.from(document.querySelectorAll('nav a[href], footer a[href]'))
        .map(a => a.getAttribute('href'))
        .filter(h => h && h.startsWith('/') && !h.startsWith('//'))`,
    )) as string[];
    const unicos = [...new Set(hrefs)];
    expect(unicos.length).toBeGreaterThan(0);

    for (const href of unicos) {
      const r = await getLocal(href);
      expect(r.status, `enlace ${href} debe ser 200`).toBe(200);
      expect(r.text.trim().length, `enlace ${href} no debe estar vacío`).toBeGreaterThan(50);
    }
  });

  test("las páginas legales estándar responden 200", async () => {
    for (const path of ["/cookies", "/privacidad", "/contacto"]) {
      const r = await getLocal(path);
      expect(r.status, `${path} debe ser 200`).toBe(200);
    }
    // /aviso-legal puede no existir (el seed no la crea); no se exige aquí.
  });
});

describe("Formulario de contacto", () => {
  test("el POST /api/contact guarda el mensaje sin error", async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test E2E",
        email: "e2e@example.com",
        message: "Mensaje de prueba e2e",
        website: "",
      }),
    });
    expect(res.status).not.toBe(500);
    let ok = false;
    try {
      const json = (await res.json()) as { ok?: boolean };
      ok = !!json.ok;
    } catch {
      ok = false;
    }
    // Sin RESEND_API_KEY el aviso por email puede fallar, pero el guardado en BD
    // (contact_messages) y la respuesta no deben romperse.
    expect(res.ok || ok).toBe(true);
  });
});

describe("Viewport móvil", () => {
  test("la home es navegable en móvil (sin overflow horizontal)", async () => {
    await using view = nuevaView({ mobile: true });
    await view.navigate(`${BASE_URL}/`);
    await esperaSelector(view, "main");
    const overflow = (await view.evaluate(
      "document.documentElement.scrollWidth > document.documentElement.clientWidth",
    )) as boolean;
    expect(overflow).toBe(false);
  });
});