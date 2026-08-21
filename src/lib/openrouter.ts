// Cliente de la API de imágenes de OpenRouter (solo server).
// La clave se resuelve: settings.ai.openrouterApiKey (configurable desde
// /admin/imagenes) > variable de entorno OPENROUTER_API_KEY.
import type { AiImageMode } from "@/lib/ai-images";
import { AI_ASPECTS, AI_QUALITIES, AI_IMAGE_MODELS } from "@/lib/ai-images";

export type { AiImageMode };
export { AI_ASPECTS, AI_QUALITIES, AI_IMAGE_MODELS };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

/** Clave de OpenRouter: settings de la BD (admin) con fallback a env. */
export async function getOpenRouterKey(): Promise<string | null> {
  try {
    const { getSettings } = await import("@/lib/data");
    const settings = await getSettings();
    const ai = (settings.ai ?? {}) as Record<string, unknown>;
    const fromDb = typeof ai.openrouterApiKey === "string" ? ai.openrouterApiKey.trim() : "";
    if (fromDb) return fromDb;
  } catch {
    // BD no disponible: seguir con env
  }
  const fromEnv = process.env.OPENROUTER_API_KEY?.trim();
  return fromEnv || null;
}

export type GeneratedImage = { b64: string; mediaType: string };

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

/** Descarga una imagen (server-side) y la convierte en data URL. */
async function fetchImageAsDataUrl(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "image/*" },
      redirect: "follow",
    });
  } catch {
    throw new ApiError("No se pudo descargar la imagen de origen para editar.", 502);
  }
  if (!res.ok) {
    throw new ApiError(`No se pudo descargar la imagen de origen (HTTP ${res.status}).`, 502);
  }
  const contentType = res.headers.get("content-type") ?? "image/png";
  if (!contentType.startsWith("image/")) {
    throw new ApiError("La URL de origen no apunta a una imagen.", 502);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_SOURCE_BYTES) {
    throw new ApiError("La imagen de origen supera 10 MB.", 413);
  }
  return `data:${contentType};base64,${buf.toString("base64")}`;
}

/**
 * Genera o edita una imagen con OpenRouter.
 * - `model`: modelo de imagen a usar (por defecto, el primero de AI_IMAGE_MODELS).
 * - mode "edit": usa input_references con la imagen de origen.
 * - mode "create": genera desde cero con el prompt.
 */
export async function generateAiImage(input: {
  model?: string;
  mode: AiImageMode;
  prompt: string;
  imageUrl?: string;
  aspectRatio?: string;
  quality?: string;
}): Promise<GeneratedImage> {
  const key = await getOpenRouterKey();
  if (!key) {
    throw new ApiError(
      "No hay clave de OpenRouter configurada. Ponla en /admin/imagenes o en OPENROUTER_API_KEY.",
      503,
    );
  }

  const body: Record<string, unknown> = {
    model: input.model ?? AI_IMAGE_MODELS[0],
    prompt: input.prompt,
    quality: input.quality ?? "low",
    background: "auto",
  };
  if (input.mode === "edit" && input.imageUrl) {
    // OpenRouter necesita poder acceder a la imagen de origen (rechaza URLs
    // locales o privadas). La bajamos desde el servidor y la mandamos como
    // data URL para que funcione también en local y con orígenes protegidos.
    const source = await fetchImageAsDataUrl(input.imageUrl);
    body.input_references = [{ type: "image_url", image_url: { url: source } }];
  }
  if (input.aspectRatio) body.aspect_ratio = input.aspectRatio;

  const res = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      // Identificación opcional del uso (política de OpenRouter)
      "X-Title": "Next.js Base CMS",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `OpenRouter respondió ${res.status}`;
    try {
      const err = (await res.json()) as { error?: { message?: string } };
      if (err.error?.message) message = err.error.message;
    } catch {
      // cuerpo no JSON
    }
    throw new ApiError(message, 502);
  }

  const data = (await res.json()) as {
    data?: { b64_json?: string; url?: string; media_type?: string }[];
  };
  const item = data.data?.[0];
  if (!item) throw new ApiError("OpenRouter no devolvió ninguna imagen.", 502);

  if (typeof item.b64_json === "string" && item.b64_json.length > 0) {
    return { b64: item.b64_json, mediaType: item.media_type ?? "image/png" };
  }
  if (typeof item.url === "string") {
    const img = await fetch(item.url);
    if (!img.ok) throw new ApiError("No se pudo descargar la imagen generada.", 502);
    const buffer = Buffer.from(await img.arrayBuffer());
    return {
      b64: buffer.toString("base64"),
      mediaType: img.headers.get("content-type") ?? "image/png",
    };
  }
  throw new ApiError("Respuesta inesperada de OpenRouter.", 502);
}
