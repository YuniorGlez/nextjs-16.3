export const ROLES = ["superadmin", "admin", "editor", "seo", "media", "messages", "viewer"] as const;
export type AdminRole = (typeof ROLES)[number];

export const PERMISSIONS = {
  dashboard: "dashboard.view",
  contentRead: "content.read",
  contentWrite: "content.write",
  contentPublish: "content.publish",
  seo: "seo.manage",
  branding: "branding.manage",
  contact: "contact.manage",
  menu: "menu.manage",
  mediaUpload: "media.upload",
  mediaAi: "media.ai",
  messagesRead: "messages.read",
  messagesManage: "messages.manage",
  security: "security.manage",
  auditRead: "audit.read",
  modules: "modules.manage",
  legal: "legal.manage",
  navigation: "navigation.manage",
} as const;
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

export const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Superadmin",
  admin: "Administrador",
  editor: "Editor",
  seo: "SEO",
  media: "Media",
  messages: "Mensajes",
  viewer: "Solo lectura",
};

const ROLE_DEFAULTS: Record<AdminRole, Permission[]> = {
  superadmin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter((permission) => permission !== PERMISSIONS.modules && permission !== PERMISSIONS.security),
  editor: [PERMISSIONS.dashboard, PERMISSIONS.contentRead, PERMISSIONS.contentWrite, PERMISSIONS.contentPublish, PERMISSIONS.navigation],
  seo: [PERMISSIONS.dashboard, PERMISSIONS.contentRead, PERMISSIONS.seo],
  media: [PERMISSIONS.dashboard, PERMISSIONS.contentRead, PERMISSIONS.mediaUpload, PERMISSIONS.mediaAi],
  messages: [PERMISSIONS.dashboard, PERMISSIONS.messagesRead, PERMISSIONS.messagesManage],
  viewer: [PERMISSIONS.dashboard, PERMISSIONS.contentRead, PERMISSIONS.seo, PERMISSIONS.messagesRead],
};

export function isRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function sanitizePermissions(value: unknown): Permission[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is Permission =>
    typeof item === "string" && (ALL_PERMISSIONS as readonly string[]).includes(item),
  ))];
}

export function permissionsFor(role: unknown, explicit: unknown, isSuperadmin = false): Permission[] {
  if (isSuperadmin) return [...ALL_PERMISSIONS];
  const safeRole: AdminRole = isRole(role) && role !== "superadmin" ? role : "admin";
  const custom = sanitizePermissions(explicit).filter((permission) =>
    permission !== PERMISSIONS.modules && permission !== PERMISSIONS.security,
  );
  return custom.length > 0 ? custom : [...ROLE_DEFAULTS[safeRole]];
}

export function hasPermission(
  admin: { role?: unknown; permissions?: unknown; isSuperadmin?: boolean },
  permission: Permission,
): boolean {
  return permissionsFor(admin.role, admin.permissions, admin.isSuperadmin).includes(permission);
}

export function rolePermissions(role: AdminRole): Permission[] {
  return [...ROLE_DEFAULTS[role]];
}

export function permissionLabel(permission: Permission): string {
  return permission.split(".").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

export function routePermission(pathname: string): Permission {
  if (pathname.startsWith("/admin/seguridad")) return PERMISSIONS.security;
  if (pathname.startsWith("/admin/auditoria")) return PERMISSIONS.auditRead;
  if (pathname.startsWith("/admin/modulos")) return PERMISSIONS.modules;
  if (pathname.startsWith("/admin/seo")) return PERMISSIONS.seo;
  if (pathname.startsWith("/admin/imagenes")) return PERMISSIONS.mediaUpload;
  if (pathname.startsWith("/admin/mensajes")) return PERMISSIONS.messagesRead;
  if (pathname.startsWith("/admin/carta")) return PERMISSIONS.menu;
  if (pathname.startsWith("/admin/contacto")) return PERMISSIONS.contact;
  if (pathname.startsWith("/admin/estilo")) return PERMISSIONS.branding;
  if (pathname.startsWith("/admin/plantillas")) return PERMISSIONS.branding;
  if (pathname.startsWith("/admin/legal")) return PERMISSIONS.legal;
  if (pathname.startsWith("/admin/menu")) return PERMISSIONS.navigation;
  return PERMISSIONS.contentRead;
}
