// Optimización server-side de imágenes (solo server).
// Red de seguridad: cualquier imagen subida se re-encodea a WebP si merece la
// pena, aunque el cliente ya optimice antes de subir (recorte del admin).
import sharp from "sharp";

export const MAX_IMAGE_DIM = 1920;
/** Por debajo de este tamaño no compensa re-encodear. */
export const OPTIMIZE_MIN_BYTES = 300 * 1024;

const RASTER = ["image/jpeg", "image/png", "image/webp"];

/**
 * Re-encodea a WebP (máx. 1920 px, calidad 80) si la imagen es raster y
 * suficientemente grande. Devuelve el original si no aplica o si sharp falla
 * (nunca rompe una subida). Los GIF animados y SVG se dejan intactos.
 */
export async function optimizeImage(
  buffer: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer<ArrayBuffer>; contentType: string }> {
  if (!RASTER.includes(contentType) || buffer.length < OPTIMIZE_MIN_BYTES) {
    return { buffer: Buffer.from(buffer), contentType };
  }
  try {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    if (!meta.width || !meta.height) return { buffer: Buffer.from(buffer), contentType };
    const needsResize = meta.width > MAX_IMAGE_DIM || meta.height > MAX_IMAGE_DIM;
    let pipeline = sharp(buffer, { failOn: "none" });
    if (needsResize) {
      pipeline = pipeline.resize({
        width: MAX_IMAGE_DIM,
        height: MAX_IMAGE_DIM,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    const out = await pipeline.webp({ quality: 80 }).toBuffer();
    // Solo sustituimos si el resultado pesa menos que el original.
    if (out.length < buffer.length) {
      return { buffer: Buffer.from(out), contentType: "image/webp" };
    }
  } catch {
    // sharp falla con formatos raros: subir el original
  }
  return { buffer: Buffer.from(buffer), contentType };
}
