import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { resolveSiteConfig } from "@/lib/site-config";
import { getPageBySlug } from "@/lib/data";
import { resolveOgTitle, truncateForOg } from "@/lib/og";

// La imagen depende del título de la página (BD) → nunca prerenderizar.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Cache corta: el título cambia al editar la página desde el CMS, así que no
// vale un immutable. s-maxage cubre el CDN; SWR refresca en background.
const CACHE_HEADERS = {
  "Cache-Control":
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  let page: { name: string; seo: Record<string, string>; visible: boolean } | null =
    null;
  try {
    // Import estático (interceptable por mock.module en tests en TODAS las
    // plataformas; el dinámico dentro de try no se honra igual en Linux).
    // El try/catch mantiene el 404 elegante si la BD no está disponible.
    page = await getPageBySlug(slug);
  } catch {
    // BD no disponible
  }

  if (!page || !page.visible) {
    return new Response("Not Found", { status: 404 });
  }

  const title = truncateForOg(resolveOgTitle(page));
  const site = await resolveSiteConfig();

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "#09090b", // zinc-950
            color: "#fafafa",
            padding: "80px 90px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                backgroundColor: "#f59e0b", // ámbar
                marginRight: 20,
              }}
            />
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 10,
                textTransform: "uppercase",
                color: "#f59e0b",
              }}
            >
              {site.name}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.15,
              color: "#fafafa",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 52,
              width: 96,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#f59e0b",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: CACHE_HEADERS,
      },
    );
  } catch (err) {
    console.error("No se pudo generar la OG image:", err);
    return new Response("Failed to generate the image", { status: 500 });
  }
}
