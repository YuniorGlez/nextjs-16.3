// e2e/publico.spec.ts — Caminos públicos que heredan TODAS las webs de clientes.
// Home renderiza, nav/footer enlaces 200, páginas legales, contacto, viewport móvil.
import { test, expect } from "@playwright/test";

test.describe("Home y navegación pública", () => {
  test("la home responde 200 y renderiza contenido visible", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    // El hero debe ser visible (el fallback CSS de GSAP evita opacity:0 sin JS).
    await expect(page.locator("main")).toBeVisible();
    // Debe haber texto real en la página (no vacía).
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.trim().length).toBeGreaterThan(50);
  });

  test("los enlaces del nav y footer devuelven 200 con contenido no vacío", async ({ page }) => {
    await page.goto("/");
    // Recoge todos los enlaces internos del nav y footer.
    const hrefs = await page
      .locator("nav a[href], footer a[href]")
      .evaluateAll((els) =>
        els
          .map((a) => a.getAttribute("href"))
          .filter((h): h is string => !!h && h.startsWith("/") && !h.startsWith("//")),
      );
    const unicos = [...new Set(hrefs)];
    expect(unicos.length).toBeGreaterThan(0);

    for (const href of unicos) {
      const r = await page.request.get(href);
      expect(r.status(), `enlace ${href} debe ser 200`).toBe(200);
      const text = await r.text();
      expect(text.trim().length, `enlace ${href} no debe estar vacío`).toBeGreaterThan(50);
    }
  });

  test("las páginas legales estándar responden 200", async ({ page }) => {
    for (const path of ["/aviso-legal", "/privacidad", "/cookies", "/contacto"]) {
      const r = await page.request.get(path);
      // Las legales se sirven desde [slug]; si no existen devuelven 404, pero
      // el seed crea contacto/cookies/privacidad. Aviso-legal puede no existir.
      if (path === "/aviso-legal") continue; // no la crea el seed por defecto
      expect(r.status(), `${path} debe ser 200`).toBe(200);
    }
  });
});

test.describe("Formulario de contacto", () => {
  test("el POST /api/contact guarda el mensaje sin error", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: { name: "Test E2E", email: "e2e@example.com", message: "Mensaje de prueba e2e", website: "" },
    });
    expect(res.status()).not.toBe(500);
    const json = await res.json().catch(() => ({}));
    // Sin RESEND_API_KEY el envío de aviso puede fallar, pero el guardado en BD
    // (contact_messages) y la respuesta ok no deben romperse.
    expect(res.ok() || json.ok).toBe(true);
  });
});

test.describe("Viewport móvil", () => {
  test("la home es navegable en móvil (sin overflow horizontal)", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
