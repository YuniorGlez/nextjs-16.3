import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { generateAiImage, AI_ASPECTS, AI_QUALITIES, ApiError } from "@/lib/openrouter";
import { blobConfigured, saveBufferToBlob } from "@/lib/blob";
import { recordCurrentAdminAudit } from "@/lib/audit";

export const runtime = "nodejs";

const MAX_PROMPT = 2000;

export async function POST(request: NextRequest) {
  try { await requirePermission(PERMISSIONS.mediaAi); } catch { return NextResponse.json({ error: "No autorizado" }, { status: 401 }); }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const mode = body.mode === "edit" ? "edit" : "create";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "Escribe un prompt para la imagen." }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT) {
    return NextResponse.json({ error: "El prompt es demasiado largo (máx. 2000 caracteres)." }, { status: 400 });
  }
  const aspectRatio = AI_ASPECTS.includes(body.aspectRatio as (typeof AI_ASPECTS)[number])
    ? (body.aspectRatio as string)
    : "16:9";
  const quality = AI_QUALITIES.includes(body.quality as (typeof AI_QUALITIES)[number])
    ? (body.quality as string)
    : "low";
  const rawImageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  // La URL de origen puede ser absoluta (https://…) o relativa (/img/foto.jpg
  // en public/img). Las relativas se resuelven contra el origen de la petición
  // para poder descargarlas server-side y mandarlas a OpenRouter.
  let imageUrl = rawImageUrl;
  if (mode === "edit" && rawImageUrl) {
    if (rawImageUrl.startsWith("/")) {
      imageUrl = new URL(rawImageUrl, request.nextUrl.origin).toString();
    } else if (!/^https?:\/\/\S+$/.test(rawImageUrl)) {
      return NextResponse.json({ error: "La imagen de origen no es una URL válida." }, { status: 400 });
    }
  }

  try {
    const { b64, mediaType } = await generateAiImage({
      mode,
      prompt,
      imageUrl: mode === "edit" ? imageUrl : undefined,
      aspectRatio,
      quality,
    });
    const buffer = Buffer.from(b64, "base64");
    if (blobConfigured()) {
      const url = await saveBufferToBlob(buffer, mediaType, "ia", "ia.png");
      return NextResponse.json({ url, aspectRatio, quality });
    }
    // Sin Blob configurado: devolvemos la imagen como data URL para que el
    // cliente pueda previsualizarla e intentar subirla por /api/upload.
    await recordCurrentAdminAudit({ action: "media.ai_generate", entityType: "media", metadata: { mode, aspectRatio, quality, temporary: true } });
    return NextResponse.json({
      dataUrl: `data:${mediaType};base64,${b64}`,
      temporary: true,
      aspectRatio,
      quality,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Error generando la imagen." }, { status: 500 });
  }
}
