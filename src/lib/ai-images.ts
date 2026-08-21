// Constantes del generador de imágenes IA (compartidas entre server y client).
// Módulo plano sin imports de server: seguro para componentes 'use client'.

export type AiImageMode = "edit" | "create";

/**
 * Modelos de generación/edición de imágenes que se lanzan en paralelo desde el
 * editor de IA. Se generan los 3 y el usuario elige cuál le gusta más.
 */
export const AI_IMAGE_MODELS = [
  "openai/gpt-image-2",
  "google/gemini-3.1-flash-lite-image",
  "qwen/qwen-image-3-pro",
] as const;

export const AI_ASPECTS = ["16:9", "1:1", "3:2", "4:5", "9:16"] as const;
export const AI_QUALITIES = ["low", "medium", "high"] as const;

export type AiAspect = (typeof AI_ASPECTS)[number];
export type AiQuality = (typeof AI_QUALITIES)[number];

/** Nombre corto y legible para mostrar en el selector de resultados. */
export function aiModelLabel(model: string): string {
  const tail = model.split("/").pop() ?? model;
  const clean = tail.replace(/-/g, " ").replace(/pro|flash|image|gpt|gemini|qwen/g, "");
  return clean.trim() ? clean : tail;
}

/** Sugerencias de prompt rápidas para el editor de IA. */
export const AI_PROMPT_SUGGESTIONS: Record<AiImageMode, string[]> = {
  edit: [
    "Hazla más luminosa y con colores vibrantes",
    "Estilo atardecer cálido, luz dorada",
    "Fondo desenfocado de estudio, sujeto nítido",
    "Mejora la nitidez y el contraste",
    "Convierte el fondo en un paisaje urbano al anochecer",
  ],
  create: [
    "Fotografía editorial del interior de un café acogedor, luz cálida, sin personas",
    "Degradado abstracto premium azul noche y ámbar, ondas de seda, sin texto",
    "Producto en pedestal de mármol con luz suave de estudio",
    "Cartel tipográfico art déco dorado sobre fondo oscuro",
  ],
};
