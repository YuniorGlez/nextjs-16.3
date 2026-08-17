// Utilidades de imagen que solo se ejecutan en el navegador.
// Importar únicamente desde componentes 'use client'.

export type CropArea = { x: number; y: number; width: number; height: number };

/** Sube un File a /api/upload (Vercel Blob) y devuelve la URL pública. */
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "No se pudo subir la imagen.");
  }
  return data.url;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = src;
  });
}

/**
 * Recorta (áreas en % de la imagen original) y optimiza a WebP (con fallback
 * JPEG), limitando la dimensión mayor a `maxDim` px.
 */
export async function cropImageToBlob(
  src: string,
  crop: CropArea,
  opts: { maxDim?: number; quality?: number } = {},
): Promise<Blob> {
  const { maxDim = 1920, quality = 0.85 } = opts;
  const img = await loadImage(src);
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!nw || !nh) throw new Error("Imagen inválida.");
  const sx = (crop.x / 100) * nw;
  const sy = (crop.y / 100) * nh;
  const sw = (crop.width / 100) * nw;
  const sh = (crop.height / 100) * nh;
  if (sw < 1 || sh < 1) throw new Error("Área de recorte inválida.");
  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible en este navegador.");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
  if (webp) return webp;
  const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
  if (!jpeg) throw new Error("No se pudo generar la imagen optimizada.");
  return jpeg;
}

/** Convierte una data URL (de la API de IA) en un File subible. */
export function dataUrlToFile(dataUrl: string, name: string): File {
  const comma = dataUrl.indexOf(",");
  const head = comma >= 0 ? dataUrl.slice(0, comma) : "";
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const mime = /^data:([^;]+)/.exec(head)?.[1] ?? "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

export function isHttpUrl(s: string): boolean {
  return /^https?:\/\/\S+$/.test(s.trim());
}

/** Comprueba que una URL carga como imagen. */
export function validImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
