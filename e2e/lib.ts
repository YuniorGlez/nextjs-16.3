// e2e/lib.ts — Utilidades compartidas para la suite e2e con bun:test + Bun.WebView.
// Sustituye a playwright.config.ts + helpers de Playwright.
//
// El backend por defecto:
//  - en macOS local se usa "webkit" (default de Bun, cero dependencias).
//  - en CI/Linux se usa "chrome" (paridad Chromium con Playwright Desktop Chrome).
// Se puede forzar con E2E_BACKEND=chrome|webkit.
import { test } from "bun:test";

export const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

export const BACKEND = (process.env.E2E_BACKEND || (process.platform === "linux" ? "chrome" : "webkit")) as
  | "webkit"
  | "chrome";

export const VIEWPORT = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 667 },
};

/** Crea una view de Bun.WebView sin cargar url (evita el bug del constructor). */
export function nuevaView(opts: { mobile?: boolean; backend?: "webkit" | "chrome" } = {}) {
  const viewport = opts.mobile ? VIEWPORT.mobile : VIEWPORT.desktop;
  return new Bun.WebView({
    width: viewport.width,
    height: viewport.height,
    backend: opts.backend ?? BACKEND,
    headless: true,
  });
}

/** Espera (con polling) a que un selector exista en el DOM. */
export async function esperaSelector(
  view: Bun.WebView,
  selector: string,
  timeoutMs = 20000,
) {
  const inicio = Date.now();
  for (;;) {
    const existe = (await view.evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)) as boolean;
    if (existe) return;
    if (Date.now() - inicio > timeoutMs) {
      throw new Error(`timeout esperando selector: ${selector}`);
    }
    await Bun.sleep(150);
  }
}

/** Lee el texto de innerText del body. */
export async function textoBody(view: Bun.WebView): Promise<string> {
  return (await view.evaluate("document.body.innerText")) as string;
}

/** Espera (con polling) a que innerText del body contenga un texto. */
export async function esperaTexto(
  view: Bun.WebView,
  texto: string,
  timeoutMs = 20000,
) {
  const inicio = Date.now();
  for (;;) {
    const body = (await view.evaluate("document.body.innerText")) as string;
    if (body.includes(texto)) return;
    if (Date.now() - inicio > timeoutMs) {
      throw new Error(`timeout esperando texto: ${texto}`);
    }
    await Bun.sleep(150);
  }
}

/**
 * GET HTTP a una ruta local (dev/start) desde el runner. Equivalente a lo que
 * Playwright hacía con `page.request.get()`: comprueba status y contenido sin
 * lanzar una view real. Al ser una petición separada, verifica el render
 * server-side de la ruta.
 */
export async function getLocal(path: string): Promise<{ status: number; text: string }> {
  const res = await fetch(BASE_URL + path);
  const text = await res.text();
  return { status: res.status, text };
}

// Re-export de `test`/`expect` para compatibilidad (los archivos lo importan de aquí).
export { test, expect } from "bun:test";

