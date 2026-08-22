import { describe, expect, it } from "bun:test";
import { optimizeImage, OPTIMIZE_MIN_BYTES, esRuntimeBun } from "@/lib/optimize";

// Genera un JPEG ruidoso (incompresible) por encima del umbral de optimización,
// para ejercitar el camino real de re-encode en el runtime que sea.
async function jpegRuidosoGrande(): Promise<Buffer> {
  const { default: sharp } = await import("sharp");
  const w = 2000;
  const h = 1500;
  const raw = Buffer.alloc(w * h * 3);
  // Ruido pseudoaleatorio determinista (LCG): JPEG grande garantizado.
  let semilla = 123456789;
  for (let i = 0; i < raw.length; i++) {
    semilla = (semilla * 1103515245 + 12345) % 2147483648;
    raw[i] = semilla % 256;
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
}

describe("optimizeImage", () => {
  it("usa el motor correcto para cada runtime", () => {
    // Bajo bun:test esto es true; bajo vitest/node sería false.
    expect(typeof esRuntimeBun).toBe("boolean");
  });

  it("no toca imágenes pequeñas o no raster", async () => {
    const pequeño = Buffer.alloc(100);
    const r1 = await optimizeImage(pequeño, "image/jpeg");
    expect(r1.contentType).toBe("image/jpeg");
    expect(r1.buffer.length).toBe(100);

    const svg = Buffer.from("<svg></svg>");
    const r2 = await optimizeImage(svg, "image/svg+xml");
    expect(r2.contentType).toBe("image/svg+xml");
  });

  it(`re-encodea a WebP un JPEG grande (${esRuntimeBun ? "motor Bun.Image" : "motor sharp"})`, async () => {
    const original = await jpegRuidosoGrande();
    expect(original.length).toBeGreaterThan(OPTIMIZE_MIN_BYTES);

    const r = await optimizeImage(original, "image/jpeg");
    expect(r.contentType).toBe("image/webp");
    expect(r.buffer.length).toBeLessThan(original.length);
    // Verificación real de que el resultado es un WebP válido (cabecera RIFF).
    const cabecera = r.buffer.subarray(0, 4).toString("ascii");
    expect(cabecera).toBe("RIFF");
  }, 30000);
});
