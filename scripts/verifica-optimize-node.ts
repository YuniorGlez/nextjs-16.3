// Verificación del camino NODE (sharp) del optimize.ts dual — lo que ejecuta Vercel.
import { optimizeImage, esRuntimeBun } from "../src/lib/optimize.ts";
import sharp from "sharp";

if (esRuntimeBun) throw new Error("debe detectar runtime NODE aquí");

const w = 2000;
const h = 1500;
const raw = Buffer.alloc(w * h * 3);
let semilla = 123456789;
for (let i = 0; i < raw.length; i++) {
  semilla = (semilla * 1103515245 + 12345) % 2147483648;
  raw[i] = semilla % 256;
}
const original = await sharp(raw, { raw: { width: w, height: h, channels: 3 } })
  .jpeg({ quality: 95 })
  .toBuffer();

const r = await optimizeImage(original, "image/jpeg");
const cabecera = r.buffer.subarray(0, 4).toString("ascii");
const ok =
  r.contentType === "image/webp" &&
  cabecera === "RIFF" &&
  r.buffer.length < original.length &&
  r.buffer.length > 0;

console.log(`runtime detectado: ${esRuntimeBun ? "BUN (mal)" : "NODE (correcto)"}`);
console.log(
  `original=${Math.round(original.length / 1024)}KB -> optimizado=${Math.round(r.buffer.length / 1024)}KB (${r.contentType})`,
);
console.log(ok ? "NODE_PATH_OK: la optimización vuelve a funcionar en Vercel" : "FALLO");
process.exit(ok ? 0 : 1);
