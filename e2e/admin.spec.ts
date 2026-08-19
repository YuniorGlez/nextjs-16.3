// e2e/admin.spec.ts — Caminos del CMS admin que heredan TODAS las webs.
// Login con ADMIN_PASSWORD (bootstrap del primer admin) → dashboard → páginas →
// crear una página y abrir su editor (caza el bug de /admin/paginas/:id que daba 500).
import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@e2e.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Temporal1234!";

test.describe("CMS Admin", () => {
  // El login del admin solo se prueba en desktop (evita duplicar logins y agotar
  // el rate-limit de /api/login, 5/15min por IP).
  test("login → dashboard → crear página → abrir editor (bug /admin/paginas/:id)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "solo en desktop");
    // 1. Login
    await page.goto("/admin");
    await expect(page.getByPlaceholder("Email")).toBeVisible({ timeout: 15_000 });
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Tras login se recarga; esperamos la topbar del admin.
    await expect(page.locator(".admin-topbar")).toBeVisible({ timeout: 20_000 });

    // 2. Ir a Páginas
    await page.goto("/admin/paginas");
    await expect(page.getByRole("heading", { name: "Páginas" })).toBeVisible({ timeout: 15_000 });

    // 3. Crear una página nueva (slug único para el test).
    const slug = `e2e-${Date.now()}`;
    await page.fill('input[name="name"]', `Página E2E ${slug}`);
    await page.fill('input[name="slug"]', slug);
    await page.click('button[type="submit"]', { timeout: 10_000 });

    // 4. createPage redirige al editor (/admin/paginas/<id>). Debe cargar sin 500
    //    (caza el bug conocido: el editor daba "This page couldn't load").
    await expect(page.getByRole("heading", { name: "Editar página" })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".admin-topbar")).toBeVisible({ timeout: 15_000 });
    // El editor debe renderizar sus secciones (no estar roto/vacío).
    await expect(page.getByRole("heading", { name: "Secciones de la página" })).toBeVisible({ timeout: 15_000 });

    // 5. Volver a la lista: la página creada debe aparecer.
    await page.goto("/admin/paginas");
    await expect(page.getByText(`Página E2E ${slug}`)).toBeVisible({ timeout: 15_000 });
  });
});
