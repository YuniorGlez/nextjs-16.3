// e2e/admin.spec.ts — Caminos del CMS admin que heredan TODAS las webs.
// Migrado de Playwright a bun:test + Bun.WebView.
// Login con ADMIN_PASSWORD (bootstrap del primer admin) → dashboard → páginas →
// crear una página y abrir su editor (caza el bug de /admin/paginas/:id que daba 500).
//
// NOTA: el login del admin está protegido por rate-limit (5/15min por IP en
// /api/login). Este test corre una única vez y no en bucle para no agotarlo.
import { test, expect, beforeAll, afterAll } from "bun:test";
import { nuevaView, esperaSelector, esperaTexto, BASE_URL } from "./lib";
import { setupServer } from "./server";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@e2e.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Temporal1234!";

const server = setupServer();

beforeAll(async () => {
  await server.start();
}, 90_000);

afterAll(async () => {
  await server.stop();
});

test("login → dashboard → crear página → abrir editor (bug /admin/paginas/:id)", async () => {
  await using view = nuevaView();

  // 1. Login.
  await view.navigate(`${BASE_URL}/admin`);
  await esperaSelector(view, 'input[name="email"]');
  await view.click('input[name="email"]');
  await view.type(ADMIN_EMAIL);
  await view.click('input[name="password"]');
  await view.type(ADMIN_PASSWORD);
  await view.click('button[type="submit"]', { timeout: 20000 });

  // Tras login se recarga; esperamos la topbar del admin (indica sesión ok).
  await esperaSelector(view, ".admin-topbar", 25000);

  // 3. Crear una página nueva (slug único para el test), yendo directo a Páginas.
  const slug = `e2e-${Date.now()}`;
  await view.navigate(`${BASE_URL}/admin/paginas`);
  await esperaSelector(view, 'input[name="name"]', 20000);
  await view.click('input[name="name"]');
  await view.type(`Página E2E ${slug}`);
  await view.click('input[name="slug"]');
  await view.type(slug);
  await view.click('button[type="submit"]', { timeout: 10000 });

  // createPage redirige al editor /admin/paginas/<id>. La ruta /admin/paginas/<id>
  // debe cargar sin 500 (caza el bug conocido). Verificamos por el contenido real
  // del editor (el routing del admin es client-side y no actualiza view.url fiable).
  await esperaTexto(view, "Secciones de la página", 25000);
  await esperaSelector(view, ".admin-topbar", 20000);

  // 4. Volver a la lista: la página recién creada debe aparecer.
  await view.navigate(`${BASE_URL}/admin/paginas`);
  await esperaTexto(view, `Página E2E ${slug}`, 25000);
  expect((await view.evaluate("document.title")) as string).not.toMatch(/500|error/i);
}, 120_000);