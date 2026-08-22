// Optimización server-side de imágenes (solo server).
// Red de seguridad: cualquier imagen subida se re-encodea a WebP si merece la
// pena, aunque el cliente ya optimice antes de subir (recorte del admin).
//
// MOTOR DUAL según runtime (fix 22-ago-2026):
//  - Runtime Node (Vercel producción, `next start`): usa SHARP (viene con Next).
//    Bun.Image NO existe en Node y dejaba las fotos sin optimizar en silencio.
//  - Runtime Bun (`next dev` con Bun, scripts con `bun`): usa Bun.Image nativo.
export const MAX_IMAGE_DIM = 1920;
/** Por debajo de este tamaño no compensa re-encodear. */
export const OPTIMIZE_MIN_BYTES = 300 * 1024;

const RASTER = ["image/jpeg", "image/png", "image/webp"];

/** ¿Estamos corriendo bajo el runtime de Bun? (process.versions.bun solo existe ahí) */
export const esRuntimeBun =
  typeof process !== "undefined" && Boolean((process.versions as Record<string, string | undefined>).bun);

type Resultado = { buffer: Buffer<ArrayBuffer>; contentType: string };

/** Motor sharp (Node / Vercel). Devuelve null si falla: nunca rompe una subida. */
async function conSharp(buffer: Buffer): Promise<Resultado | null> {
  try {
    const { default: sharp } = await import("sharp");
    const out = await sharp(buffer)
      .rotate()
      .resize({
        width: MAX_IMAGE_DIM,
        height: MAX_IMAGE_DIM,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    if (!out.info.width || !out.info.height) return null;
    return { buffer: Buffer.from(out.data), contentType: "image/webp" };
  } catch {
    return null;
  }
}

/** Motor Bun.Image (runtime Bun). Misma política: null si falla. */
async function conBunImage(buffer: Buffer): Promise<Resultado | null> {
  try {
    const img = new Bun.Image(buffer);
    const meta = await img.metadata();
    if (!meta.width || !meta.height) return null;
    // Downscale proporcional a máx. 1920 px sin ampliar (fit: "inside").
    const scale = Math.min(MAX_IMAGE_DIM / meta.width, MAX_IMAGE_DIM / meta.height, 1);
    const w = Math.max(1, Math.round(meta.width * scale));
    const h = Math.max(1, Math.round(meta.height * scale));
    const enc = await img.resize(w, h, { fit: "inside" }).webp({ quality: 80 });
    const out = Buffer.from(await enc.toBuffer());
    return { buffer: out, contentType: "image/webp" };
  } catch {
    return null;
  }
}

/**
 * Re-encodea a WebP (máx. 1920 px, calidad 80) si la imagen es raster y
 * suficientemente grande. Devuelve el original si no aplica o si la
 * codificación falla (nunca rompe una subida). GIF animados y SVG intactos.
 */
export async function optimizeImage(
  buffer: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer<ArrayBuffer>; contentType: string }> {
  if (!RASTER.includes(contentType) || buffer.length < OPTIMIZE_MIN_BYTES) {
    return { buffer: Buffer.from(buffer), contentType };
  }
  const resultado = esRuntimeBun ? await conBunImage(buffer) : await conSharp(buffer);
  // Solo sustituimos si el resultado pesa menos que el original.
  if (resultado && resultado.buffer.length < buffer.length) {
    return resultado;
  }
  return { buffer: Buffer.from(buffer), contentType };
}
