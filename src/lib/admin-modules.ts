/**
 * Registro declarativo de módulos del panel /admin.
 *
 * Un módulo agrupa secciones del admin (rutas del sidebar). Su estado se
 * guarda en `settings.modules` como Record<moduleId, boolean> y se resuelve
 * con `resolveModules()`. Este fichero es plano y sin imports server-only:
 * lo consumen server components, server actions y client components.
 */

export type AdminModule = {
  id: string;
  label: string;
  description: string;
  /** Obligatorios: siempre activos, no se pueden desactivar desde /admin/modulos. */
  required?: boolean;
};

export type AdminNavItem = {
  href: string;
  label: string;
  /** Path del icono SVG (stroke, viewBox 24x24, strokeWidth 2). */
  icon: string;
  moduleId: string;
  /** Solo visible para superadmins. */
  superadminOnly?: boolean;
  permission: import("@/lib/rbac").Permission;
};

// Iconos (paths SVG, stroke 2, viewBox 24x24)
const DASH = "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z";
const MENU = "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01";
const CONTACT =
  "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8 10a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.8.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2Z";
const SUN = "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 21v-2M12 5V3M21 12h-2M5 12H3M18 6l-2 2M8 8 6 6M18 18l-2-2M8 16l-2 2";
const LAYOUT = "M3 3h18v6H3zM3 11h9v8H3zM14 11h7v8h-7z";
const PALETTE =
  "M12 3a9 9 0 1 0 .1 18c1.6 0 2.5-1.3 2.5-2.6 0-1-.5-1.9-1.4-2.7-.9-.8-1.3-1.7-1.3-2.5 0-1.2.9-2 2.3-2h1.4c2.2 0 3.4-1.4 3.4-3.6C19.9 5 16.4 3 12 3Z";
const SEARCH = "M21 21l-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z";
const FILE = "M14 3v5a2 2 0 0 0 2 2h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z";
const SCALE = "M12 3v18M5 7h14M6 7l-3 6a3 3 0 0 0 6 0L6 7ZM18 7l-3 6a3 3 0 0 0 6 0l-3-6ZM4 21h16";
const IMAGE = "M3 3h18v18H3z M21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21 M9 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z";
const LOCK = "M12 3a4 4 0 0 0-4 4v3H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a4 4 0 0 0-4-4Zm-2 7V7a2 2 0 1 1 4 0v3h-4Z";
const SLIDERS = "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6";

export const ADMIN_MODULES: AdminModule[] = [
  {
    id: "core",
    label: "Núcleo",
    description:
      "Resumen, builder de landing, páginas, textos y héroe, SEO, imágenes e IA, legal, estilo y menú de navegación.",
    required: true,
  },
  {
    id: "carta",
    label: "Carta y precios",
    description: "Editor de carta con categorías y platos (webs de restaurantes, bares, cafeterías…).",
  },
  {
    id: "contacto",
    label: "Contacto y mensajes",
    description: "Datos de contacto del formulario y bandeja de mensajes recibidos.",
  },
];

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Resumen", icon: DASH, moduleId: "core", permission: "dashboard.view" },
  { href: "/admin/landing", label: "Landing (builder)", icon: LAYOUT, moduleId: "core", permission: "content.read" },
  { href: "/admin/paginas", label: "Páginas", icon: FILE, moduleId: "core", permission: "content.read" },
  { href: "/admin/menu", label: "Menú", icon: MENU, moduleId: "core", permission: "navigation.manage" },
  { href: "/admin/carta", label: "Carta y precios", icon: MENU, moduleId: "carta", permission: "menu.manage" },
  { href: "/admin/contacto", label: "Contacto", icon: CONTACT, moduleId: "contacto", permission: "contact.manage" },
  { href: "/admin/mensajes", label: "Mensajes", icon: CONTACT, moduleId: "contacto", permission: "messages.read" },
  { href: "/admin/contenido", label: "Textos y héroe", icon: SUN, moduleId: "core", permission: "content.read" },
  { href: "/admin/seo", label: "SEO", icon: SEARCH, moduleId: "core", permission: "seo.manage" },
  { href: "/admin/imagenes", label: "Imágenes y IA", icon: IMAGE, moduleId: "core", permission: "media.upload" },
  { href: "/admin/legal", label: "Datos legales", icon: SCALE, moduleId: "core", permission: "legal.manage" },
  { href: "/admin/estilo", label: "Estilo y marca", icon: PALETTE, moduleId: "core", permission: "branding.manage" },
  { href: "/admin/seguridad", label: "Seguridad", icon: LOCK, moduleId: "core", permission: "security.manage" },
  {
    href: "/admin/modulos",
    label: "Módulos",
    icon: SLIDERS,
    moduleId: "core",
    superadminOnly: true,
    permission: "modules.manage",
  },
];

/** Estado por defecto de los módulos (nuevos proyectos / settings sin configurar). */
export const DEFAULT_MODULES: Record<string, boolean> = {
  core: true,
  carta: true,
  contacto: true,
};

/**
 * Resuelve el estado de los módulos a partir de `settings.modules`:
 * defaults + override por proyecto + módulos obligatorios siempre activos.
 */
export function resolveModules(settingsModules: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = { ...DEFAULT_MODULES };
  if (settingsModules && typeof settingsModules === "object") {
    for (const [k, v] of Object.entries(settingsModules)) {
      if (typeof v === "boolean") out[k] = v;
    }
  }
  for (const m of ADMIN_MODULES) {
    if (m.required) out[m.id] = true;
  }
  return out;
}
