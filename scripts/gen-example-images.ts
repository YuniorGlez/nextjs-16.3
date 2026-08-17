// Genera las imágenes de ejemplo de public/examples/ con OpenRouter (gpt-image-2).
// Uso: bun --env-file=.env.local scripts/gen-example-images.ts
// Las imágenes son genéricas (sin marcas ni textos) para que cualquier proyecto
// derivado del base pueda usarlas como punto de partida.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) throw new Error("OPENROUTER_API_KEY no está. Ejecuta con --env-file=.env.local");

const OUT = resolve(process.cwd(), "public/examples");

const IMAGES: { file: string; aspect: string; prompt: string }[] = [
  {
    file: "og-default.png",
    aspect: "16:9",
    prompt:
      "Abstract premium gradient background for a website social sharing card, deep midnight blue blending into warm amber and gold, smooth flowing silk waves, soft light, elegant minimalist, no text, no logos, no watermark, no people",
  },
  {
    file: "hero-default.png",
    aspect: "16:9",
    prompt:
      "Wide cinematic photograph of a cozy modern workspace at golden hour, warm sunlight through large windows, plants and a wooden desk, shallow depth of field, inviting atmosphere, no people, no text",
  },
  {
    file: "local-default.png",
    aspect: "3:2",
    prompt:
      "Editorial interior photograph of a small artisanal cafe, warm pendant lights, wooden tables, shelves with ceramics and books, soft morning light, cozy and authentic, no people, no text",
  },
  {
    file: "g1.png",
    aspect: "1:1",
    prompt:
      "Overhead flat-lay photograph of a cappuccino with latte art on a marble table beside a croissant and a small notebook, soft natural light, warm tones, no text",
  },
  {
    file: "g2.png",
    aspect: "3:2",
    prompt:
      "Close-up of a barista pouring latte art into a ceramic cup, warm cafe ambiance, shallow depth of field, hands only, no faces, no text",
  },
  {
    file: "g3.png",
    aspect: "1:1",
    prompt:
      "Minimalist product photograph of artisanal ceramic cups on a linen cloth, neutral beige palette, soft studio light, elegant, no text",
  },
  {
    file: "g4.png",
    aspect: "3:2",
    prompt:
      "Night exterior of a small boutique storefront glowing warmly, plants by the entrance, wet pavement reflections, cozy blue hour, no people, no readable signs or text",
  },
];

mkdirSync(OUT, { recursive: true });

for (const im of IMAGES) {
  process.stdout.write(`Generando ${im.file} (${im.aspect})… `);
  const res = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Next.js Base - ejemplo",
    },
    body: JSON.stringify({
      model: "openai/gpt-image-2",
      prompt: im.prompt,
      aspect_ratio: im.aspect,
      quality: "low",
      background: "auto",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${im.file}: HTTP ${res.status} ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    data?: { b64_json?: string; media_type?: string }[];
  };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${im.file}: OpenRouter no devolvió imagen`);
  const mediaType = data.data?.[0]?.media_type ?? "image/png";
  const ext = mediaType.includes("jpeg") ? "jpg" : "png";
  const file = im.file.replace(/\.png$/, `.${ext}`);
  writeFileSync(resolve(OUT, file), Buffer.from(b64, "base64"));
  console.log(`✓ ${file} (${mediaType})`);
}

console.log(`\nListo. Imágenes en ${OUT}`);
