// Utilidades de marca puras (sin imports de servidor) — reutilizables en admin y web.
export type Branding = { primary: string; font: string; radius: number };

export const FONT_OPTIONS = [
  { key: "playfair", label: "Playfair Display", stack: '"Playfair Display", Georgia, serif', url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap" },
  { key: "lora", label: "Lora", stack: "Lora, Georgia, serif", url: "https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap" },
  { key: "montserrat", label: "Montserrat", stack: "Montserrat, ui-sans-serif, sans-serif", url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap" },
  { key: "georgia", label: "Georgia (clásico)", stack: 'Georgia, "Times New Roman", serif', url: "" },
];

export function defaultBranding(): Branding {
  return { primary: "#f59e0b", font: "playfair", radius: 18 };
}

export function normalizeBranding(v: unknown): Branding {
  const d = defaultBranding();
  const o = (v ?? {}) as Record<string, unknown>;
  const primary = typeof o.primary === "string" && /^#[0-9a-fA-F]{3,8}$/.test(o.primary) ? o.primary : d.primary;
  const font = typeof o.font === "string" && FONT_OPTIONS.some((f) => f.key === o.font) ? o.font : d.font;
  const radius = Number.isFinite(o.radius) ? Number(o.radius) : d.radius;
  return { primary, font, radius };
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex: string, pct: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${clamp(r + (255 - r) * -pct)}, ${clamp(g + (255 - g) * -pct)}, ${clamp(b + (255 - b) * -pct)})`;
}

export function brandingCss(b: Branding): string {
  const font = FONT_OPTIONS.find((f) => f.key === b.font) ?? FONT_OPTIONS[0];
  const lighter = shade(b.primary, -0.16); // hover / variante más clara
  const radius = `${b.radius}px`;
  return [
    font.url ? `@import url('${font.url}');` : "",
    `:root{--bv-1:${b.primary};--bv-1-light:${lighter};--bv-font-head:${font.stack};--bv-r:${radius}}`,
    `.text-amber-400,.text-amber-500{color:var(--bv-1)!important}`,
    `.bg-amber-500{background-color:var(--bv-1)!important}`,
    `.bg-amber-500\\/30{--tw-shadow-color:var(--bv-1)!important}`,
    `.border-amber-400,.border-amber-500{border-color:var(--bv-1)!important}`,
    `.hover\\:text-amber-400:hover,.group:hover .group-hover\\:text-amber-300{color:var(--bv-1)!important}`,
    `.hover\\:border-amber-400:hover,.hover\\:text-amber-400:hover{border-color:var(--bv-1)!important;color:var(--bv-1)!important}`,
    `.hover\\:bg-amber-400:hover{background-color:var(--bv-1-light)!important}`,
    `.font-serif,.font-serif h1,.font-serif h2,.font-serif h3{font-family:var(--bv-font-head)!important}`,
    `.rounded-2xl{border-radius:calc(var(--bv-r)*1.1)!important}`,
    `.rounded-3xl{border-radius:calc(var(--bv-r)*1.4)!important}`,
    `.rounded-full{border-radius:9999px!important}`,
  ]
    .join("\n")
    .trim();
}