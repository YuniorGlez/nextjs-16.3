/** Catálogo server-safe/client-safe de presets sectoriales. No contiene datos de clientes. */

export const TEMPLATE_IDS = [
  "restaurante",
  "servicios-profesionales",
  "salud",
  "retail",
  "portfolio",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];
export type TemplateSection = { key: string; visible: boolean };
export type SectorTemplate = {
  id: TemplateId;
  sector: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  initialContent: Record<string, unknown>;
};

const section = (keys: string[]): TemplateSection[] => keys.map((key) => ({ key, visible: true }));
const initial = (keys: string[]): Record<string, unknown> =>
  Object.fromEntries(keys.map((key) => [key, key === "hero"
    ? { titulo: "", h1: "", subtitulo: "", cta1: "", cta1Url: "#contacto", cta2: "", cta2Url: "#sobre-nosotros" }
    : key === "cta" ? { titulo: "", texto: "", boton: "", botonUrl: "#contacto" } : {}]));

export const SECTOR_TEMPLATES: readonly SectorTemplate[] = [
  {
    id: "restaurante",
    sector: "Hostelería",
    name: "Restaurante",
    description: "Presentación visual con carta, galería, ubicación y contacto.",
    sections: section(["hero", "destacados", "menu", "local", "galeria", "testimonios", "faq", "contacto"]),
    initialContent: { ...initial(["hero", "destacados", "local", "galeria", "testimonios", "faq", "contacto"]), menu: {} },
  },
  {
    id: "servicios-profesionales",
    sector: "Servicios",
    name: "Servicios profesionales",
    description: "Enfoque en propuesta de valor, servicios, confianza y solicitud de contacto.",
    sections: section(["hero", "destacados", "numeros", "local", "testimonios", "faq", "cta", "contacto"]),
    initialContent: initial(["hero", "destacados", "numeros", "local", "testimonios", "faq", "cta", "contacto"]),
  },
  {
    id: "salud",
    sector: "Salud y bienestar",
    name: "Salud y bienestar",
    description: "Estructura clara para servicios, equipo, preguntas frecuentes y reserva de contacto.",
    sections: section(["hero", "destacados", "local", "faq", "cta", "contacto"]),
    initialContent: initial(["hero", "destacados", "local", "faq", "cta", "contacto"]),
  },
  {
    id: "retail",
    sector: "Comercio",
    name: "Retail",
    description: "Catálogo visual de productos, ventajas, novedades y canales de contacto.",
    sections: section(["hero", "destacados", "galeria", "numeros", "testimonios", "cta", "contacto"]),
    initialContent: initial(["hero", "destacados", "galeria", "numeros", "testimonios", "cta", "contacto"]),
  },
  {
    id: "portfolio",
    sector: "Creativo",
    name: "Portfolio",
    description: "Muestra de trabajos, presentación profesional, prueba social y contacto.",
    sections: section(["hero", "galeria", "local", "testimonios", "cta", "contacto"]),
    initialContent: initial(["hero", "galeria", "local", "testimonios", "cta", "contacto"]),
  },
];

export function validateTemplateId(value: unknown): TemplateId | null {
  return typeof value === "string" && (TEMPLATE_IDS as readonly string[]).includes(value)
    ? (value as TemplateId)
    : null;
}

export function getTemplate(value: unknown): SectorTemplate | null {
  const id = validateTemplateId(value);
  return id ? SECTOR_TEMPLATES.find((template) => template.id === id) ?? null : null;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

function fillEmpty(existing: unknown, preset: unknown): unknown {
  if (isEmpty(existing)) return preset;
  if (typeof existing !== "object" || existing === null || Array.isArray(existing)) return existing;
  if (typeof preset !== "object" || preset === null || Array.isArray(preset)) return existing;
  const result: Record<string, unknown> = { ...(existing as Record<string, unknown>) };
  for (const [key, value] of Object.entries(preset as Record<string, unknown>)) {
    result[key] = fillEmpty(result[key], value);
  }
  return result;
}

/** Aplica un preset de forma no destructiva; nunca reemplaza un valor no vacío. */
export function applyTemplateToSettings(
  settings: Record<string, unknown>,
  template: SectorTemplate,
): Record<string, unknown> {
  const next = { ...settings };
  next.template = template.id;
  next.layout = isEmpty(settings.layout) ? template.sections.map((item) => ({ ...item })) : settings.layout;
  for (const [key, value] of Object.entries(template.initialContent)) {
    next[key] = fillEmpty(settings[key], value);
  }
  return next;
}

export function templatePermission(): "branding.manage" {
  return "branding.manage";
}

export const DEFAULT_TEMPLATE_ID: TemplateId = "servicios-profesionales";
