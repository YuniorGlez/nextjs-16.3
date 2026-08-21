// Optimización server-side de imágenes (solo server).
// Red de seguridad: cualquier imagen subida se re-encodea a WebP si merece la
// pena, aunque el cliente ya optimice antes de subir (recorte del admin).
// Usa la API integrada de Bun (Bun.Image) en lugar de sharp.
export const MAX_IMAGE_DIM = 1920;
/** Por debajo de este tamaño no compensa re-encodear. */
export const OPTIMIZE_MIN_BYTES = 300 * 1024;

const RASTER = ["image/jpeg", "image/png", "image/webp"];

/**
 * Re-encodea a WebP (máx. 1920 px, calidad 80) si la imagen es raster y
 * suficientemente grande. Devuelve el original si no aplica o si la codificación
 * falla (nunca rompe una subida). Los GIF animados y SVG se dejan intactos.
 */
export async function optimizeImage(
  buffer: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer<ArrayBuffer>; contentType: string }> {
  if (!RASTER.includes(contentType) || buffer.length < OPTIMIZE_MIN_BYTES) {
    return { buffer: Buffer.from(buffer), contentType };
  }
  try {
    const img = new Bun.Image(buffer);
    const meta = await img.metadata();
    if (!meta.width || !meta.height) return { buffer: Buffer.from(buffer), contentType };
    // Downscale proporcional a máx. 1920 px sin ampliar (fit: "inside").
    const scale = Math.min(MAX_IMAGE_DIM / meta.width, MAX_IMAGE_DIM / meta.height, 1);
    const w = Math.max(1, Math.round(meta.width * scale));
    const h = Math.max(1, Math.round(meta.height * scale));
    const resized = img.resize(w, h, { fit: "inside" });
    const enc = await resized.webp({ quality: 80 });
    const out = Buffer.from(await enc.toBuffer());
    // Solo sustituimos si el resultado pesa menos que el original.
    if (out.length < buffer.length) {
      return { buffer: out, contentType: "image/webp" };
    }
  } catch {
    // Ha fallado la codificación (formato raro, etc.): subir el original
  }
  return { buffer: Buffer.from(buffer), contentType };
}
