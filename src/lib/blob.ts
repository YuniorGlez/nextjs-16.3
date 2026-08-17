// Utilidades de Vercel Blob (solo server).
import { put } from "@vercel/blob";
import { ApiError } from "@/lib/openrouter";

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Sube un buffer a Vercel Blob (acceso público) y devuelve la URL. */
export async function saveBufferToBlob(
  buffer: Buffer,
  contentType: string,
  folder = "fotos",
  name?: string,
): Promise<string> {
  if (!blobConfigured()) {
    throw new ApiError(
      "Vercel Blob no está configurado. Crea un store con `npx vercel blob create-store` y añade BLOB_READ_WRITE_TOKEN a .env.local (y a Vercel).",
      503,
    );
  }
  const safeName = (name ?? "imagen").replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`${folder}/${Date.now()}-${safeName}`, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}
