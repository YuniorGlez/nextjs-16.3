import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { siteConfig } from "@/lib/site";

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
  const isProduction = host === siteConfig.productionHost;

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
          return NextResponse.redirect(url, 301);
        }
      }
    } catch {
      // Fallo silencioso: un error de BD nunca debe romper el sitio.
    }
  }

  if (isProduction) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
