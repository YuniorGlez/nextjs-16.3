// Constantes del generador de imágenes IA (compartidas entre server y client).
// Módulo plano sin imports de server: seguro para componentes 'use client'.

export type AiImageMode = "edit" | "create";

export const AI_ASPECTS = ["16:9", "1:1", "3:2", "4:5", "9:16"] as const;
export const AI_QUALITIES = ["low", "medium", "high"] as const;

export type AiAspect = (typeof AI_ASPECTS)[number];
export type AiQuality = (typeof AI_QUALITIES)[number];

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
