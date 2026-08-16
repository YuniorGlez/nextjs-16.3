// Catálogo de secciones del builder (compartido entre admin y servidor).
// Módulo plano sin "use client": puede importarse desde server actions y client.

export const SECTION_DEFS: { key: string; label: string; icon: string }[] = [
  { key: "hero", label: "Héroe", icon: "🖼️" },
  { key: "cabecera", label: "Cabecera", icon: "📌" },
  { key: "texto", label: "Texto", icon: "📝" },
  { key: "destacados", label: "Destacados", icon: "⭐" },
  { key: "numeros", label: "Números", icon: "🔢" },
  { key: "menu", label: "Menú", icon: "📖" },
  { key: "local", label: "Sobre nosotros", icon: "🏠" },
  { key: "galeria", label: "Galería", icon: "🖼️" },
  { key: "testimonios", label: "Testimonios", icon: "💬" },
  { key: "faq", label: "FAQ", icon: "❓" },
  { key: "cta", label: "Llamada a la acción", icon: "🚀" },
  { key: "contacto", label: "Contacto", icon: "📞" },
];

/** Layout por defecto para páginas interiores nuevas. */
export const PAGE_DEFAULT_LAYOUT = ["cabecera", "texto", "cta", "contacto"].map((key) => ({
  key,
  visible: true,
}));
