import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { generateAiImage, ApiError } from "@/lib/openrouter";
import { AI_ASPECTS, AI_QUALITIES, AI_IMAGE_MODELS } from "@/lib/ai-images";
import { blobConfigured, saveBufferToBlob } from "@/lib/blob";
import { recordCurrentAdminAudit } from "@/lib/audit";

export const runtime = "nodejs";
// qwen-image-3-pro puede tardar ~135 s; pedimos el máximo permitido por Vercel.
// (En plan Hobby Vercel puede recortarlo a 60 s: en ese caso qwen no llegará a
// terminar, pero las otras dos imágenes se guardan igual.)
export const maxDuration = 300;

const MAX_PROMPT = 2000;

type ImageResult = {
  model: string;
  url?: string;
  dataUrl?: string;
  temporary?: boolean;
  aspectRatio?: string;
  quality?: string;
  error?: string;
};

function slugOf(model: string): string {
  return (model.split("/").pop() ?? "ia").replace(/[^a-zA-Z0-9.-]/g, "_");
}

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

  // Lanzamos todos los modelos en paralelo; cada tarea gestiona su propio fallo
  // para que el resultado de un modelo no bloquee al resto.
  const results = await Promise.all(
    AI_IMAGE_MODELS.map(async (model): Promise<ImageResult> => {
      try {
        const { b64, mediaType } = await generateAiImage({
          model,
          mode,
          prompt,
          imageUrl: mode === "edit" ? imageUrl : undefined,
          aspectRatio,
          quality,
        });
        const buffer = Buffer.from(b64, "base64");
        if (blobConfigured()) {
          const url = await saveBufferToBlob(buffer, mediaType, "ia", `${slugOf(model)}.png`);
          return { model, url, aspectRatio, quality };
        }
        // Sin Blob configurado: data URL temporal (el cliente puede subirla).
        return { model, dataUrl: `data:${mediaType};base64,${b64}`, temporary: true, aspectRatio, quality };
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Error generando la imagen.";
        return { model, error: msg, aspectRatio, quality };
      }
    }),
  );

  await recordCurrentAdminAudit({ action: "media.ai_generate", entityType: "media", metadata: { mode, aspectRatio, quality, models: AI_IMAGE_MODELS } });

  return NextResponse.json({ results, aspectRatio, quality });
}
