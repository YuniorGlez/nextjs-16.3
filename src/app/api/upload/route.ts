import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { blobConfigured } from "@/lib/blob";
import { optimizeImage } from "@/lib/optimize";
import { getClientIp, uploadLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

export async function POST(request: NextRequest) {
  try { await requirePermission(PERMISSIONS.mediaUpload); } catch { return NextResponse.json({ error: "No autorizado" }, { status: 401 }); }

  // Rate-limit por IP: 20 subidas / 10 min. Solo cuenta a admins autenticados
  // (el 401 sale antes) y se comprueba antes de parsear el multipart.
  const rl = uploadLimiter.check(getClientIp(request.headers));
  if (!rl.allowed) {
    const retryAfter = Math.max(1, Math.ceil(rl.retryAfterSeconds));
    return NextResponse.json(
      {
        error: `Demasiadas subidas. Inténtalo en ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
        retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Sin archivo" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Debe ser una imagen" }, { status: 400 });
  }
  // Límite ~8 MB
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen supera 8 MB" }, { status: 413 });
  }
  if (!blobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Vercel Blob no está configurado. Crea un store con `npx vercel blob create-store` y añade BLOB_READ_WRITE_TOKEN a .env.local (ver /admin/imagenes).",
      },
      { status: 503 },
    );
  }

  let buffer = Buffer.from(await file.arrayBuffer());
  // Optimización server-side (WebP, máx. 1920 px): red de seguridad para que
  // cualquier imagen subida quede ligera aunque el cliente no la haya optimizado.
  const optimized = await optimizeImage(buffer, file.type);
  buffer = optimized.buffer;
  const contentType = optimized.contentType;

  const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.[^.]+$/, "") || "imagen";
  const ext = EXT_BY_TYPE[contentType] ?? "bin";
  const blob = await put(`fotos/${Date.now()}-${safeBase}.${ext}`, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}
