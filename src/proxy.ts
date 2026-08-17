import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProductionHost, platformDefaults } from "@/lib/site";
import { buildSecurityHeaders } from "@/lib/security-headers";
import { isPublicLocalePath, localeFromPath } from "@/lib/i18n";

// Cliente neon creado de forma perezosa (evita lanzar en import si falta
// DATABASE_URL; el driver HTTP de neon funciona en Node y en edge).
let redirectSql: ReturnType<typeof neon> | null = null;
function getRedirectSql() {
  if (!redirectSql) {
    const url = process.env.DATABASE_URL;
    if (!url) return null;
    redirectSql = neon(url);
  }
  return redirectSql;
}

// Paths de un solo segmento que nunca son slugs de página del CMS.
const EXCLUDED_PATHS = new Set([
  "/",
  "/admin",
  "/api",
  "/examples",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/favicon.ico",
]);

// Charset del slugify del CMS: /<segmento> con [a-z0-9-] (sin punto →
// excluye ficheros estáticos, y sin slash → solo rutas de un nivel).
const SLUG_PATH_RE = /^\/[a-z0-9-]+$/;

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  // Proxy solo usa el invariante de plataforma: no puede consultar el CMS.
  const isProduction = isProductionHost(host, platformDefaults.productionHost);

  // Cabeceras de seguridad en TODAS las respuestas que pasa el proxy
  // (páginas, redirects 301, no-prod...). HSTS solo en dominio de producción
  // y CSP solo en build de producción (ver src/lib/security-headers.ts).
  const securityHeaders = buildSecurityHeaders({
    host,
    productionHost: platformDefaults.productionHost,
    isProductionBuild: process.env.NODE_ENV === "production",
  });

  // Las URLs públicas localizadas se reescriben internamente a las rutas
  // existentes. Admin, API y preview nunca pasan por este resolver.
  if ((request.method === "GET" || request.method === "HEAD") && isPublicLocalePath(request.nextUrl.pathname)) {
    const locale = localeFromPath(request.nextUrl.pathname);
    if (locale) {
      const internal = request.nextUrl.clone();
      internal.pathname = request.nextUrl.pathname.slice(locale.length + 1) || "/";
      const headers = new Headers(request.headers);
      headers.set("x-cms-locale", locale);
      const response = NextResponse.rewrite(internal, { request: { headers } });
      for (const [name, value] of Object.entries(securityHeaders)) response.headers.set(name, value);
      if (!isProduction) response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }
  }

  // Redirecciones 301 de slugs del CMS (SEO): /slug-antiguo → /slug-nuevo.
  // Solo GET/HEAD de un segmento que parezca un slug; el resto pasa de largo.
  if (
    (request.method === "GET" || request.method === "HEAD") &&
    SLUG_PATH_RE.test(request.nextUrl.pathname) &&
    !EXCLUDED_PATHS.has(request.nextUrl.pathname)
  ) {
    try {
      const sql = getRedirectSql();
      if (sql) {
        const rows = (await sql`SELECT to_slug FROM page_redirects
          WHERE from_slug = ${request.nextUrl.pathname.slice(1)}`) as unknown as {
          to_slug: string;
        }[];
        const target = rows[0]?.to_slug;
        if (target) {
          const url = new URL(target, request.url);
          // Conserva la query string (UTM, etc.) en el destino.
          url.search = request.nextUrl.search;
          const response = NextResponse.redirect(url, 301);
          for (const [name, value] of Object.entries(securityHeaders)) {
            response.headers.set(name, value);
          }
          return response;
        }
      }
    } catch {
      // Fallo silencioso: un error de BD nunca debe romper el sitio.
    }
  }

  const response = NextResponse.next();
  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }
  if (!isProduction) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
