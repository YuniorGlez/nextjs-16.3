"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, getCurrentAdmin, isAdmin, requirePermission, type AdminSession } from "@/lib/auth";
import {
  createAdmin,
  deleteAdminById,
  getAdminById,
  getAdminByEmail,
  countAdmins,
  normalizeEmail,
  setAdminPassword,
  bumpAdminTokenVersion,
  authenticateAdmin,
  countSuperadmins,
  updateAdminAccess,
} from "@/lib/admins";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/passwords";
import { getClientIp, loginLimiter } from "@/lib/rate-limit";
import {
  deleteContactMessage,
  getSettings,
  getPageById,
  getPageBySlug,
  publishPage,
  savePageTransaction,
  removeCategory,
  removeItem,
  removePage,
  restorePageVersion,
  saveMenu as saveMenuDb,
  setMessageRead,
  setPageVisibility,
  updateSettings,
  upsertCategory,
  upsertItem,
  upsertPage,
  type PageLayoutItem,
} from "@/lib/data";
import { slugify } from "@/lib/slug";
import { normalizeSeoSettings } from "@/lib/seo";
import { PAGE_DEFAULT_LAYOUT } from "@/lib/sections";
import { ADMIN_MODULES } from "@/lib/admin-modules";
import { applyTemplateToSettings, getTemplate, validateTemplateId } from "@/lib/templates";
import { PERMISSIONS, isRole, sanitizePermissions, type Permission, type AdminRole } from "@/lib/rbac";
import { recordCurrentAdminAudit } from "@/lib/audit";
import { normalizeAnalyticsSettings } from "@/lib/analytics";
import { invalidatePublicMenu, invalidatePublicPages, invalidatePublicRedirects, invalidatePublicSettings } from "@/lib/cache";

async function guard(permission: Permission = PERMISSIONS.contentWrite) {
  if (!(await isAdmin())) {
    redirect("/admin");
  }
  await requirePermission(permission);
}

/** Como guard(), pero devuelve el admin de la sesión actual. */
async function requireAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin");
  }
  return admin;
}

// ---------- Sesión ----------
export async function loginAction(data: FormData) {
  // Rate-limit por IP (5 intentos / 15 min), mismo límite que /api/login.
  const headerList = await headers();
  const rl = loginLimiter.check(getClientIp(headerList));
  if (!rl.allowed) {
    return {
      ok: false as const,
      error: `Demasiados intentos. Inténtalo en ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
    };
  }

  const email = String(data.get("email") ?? "");
  const pwd = String(data.get("password") ?? "");
  const admin = await authenticateAdmin(email, pwd);
  if (!admin) {
    return { ok: false as const, error: "Email o contraseña incorrectos." };
  }
  await createSession({ id: admin.id, tokenVersion: admin.tokenVersion });
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin");
}

// ---------- Seguridad (multi-admin) ----------
export type SecurityActionResult = { ok: boolean; error?: string };

/**
 * Cambia la contraseña del admin en sesión. Acepta un campo opcional
 * `current` (cambio voluntario desde /admin/seguridad); sin él (gate de
 * primer acceso) solo se valida la nueva contraseña. En ambos casos re-crea
 * la sesión con el nuevo token_version para no desloguear al propio admin.
 */
export async function changePasswordAction(data: FormData): Promise<SecurityActionResult> {
  const me = await requireAdmin();
  const current = String(data.get("current") ?? "");
  const next = String(data.get("new") ?? "");
  const confirm = String(data.get("confirm") ?? "");

  if (current) {
    const admin = await getAdminById(me.id);
    if (!admin || !verifyPassword(current, admin.passwordHash)) {
      return { ok: false, error: "La contraseña actual no es correcta." };
    }
    if (next === current) {
      return { ok: false, error: "La nueva contraseña no puede ser igual a la actual." };
    }
  }

  const passwordError = validatePassword(next);
  if (passwordError) return { ok: false, error: passwordError };
  if (next !== confirm) {
    return { ok: false, error: "Las contraseñas no coinciden." };
  }

  const newVersion = await setAdminPassword(me.id, hashPassword(next));
  await createSession({ id: me.id, tokenVersion: newVersion });
  await recordCurrentAdminAudit({ action: "auth.password_change", entityType: "admin", entityId: me.id });
  return { ok: true };
}

/** Añade un admin con contraseña temporal (cambio forzado en el primer login). */
export async function addAdminAction(data: FormData): Promise<SecurityActionResult> {
  await guard(PERMISSIONS.security);
  const email = normalizeEmail(String(data.get("email") ?? ""));
  if (!email) {
    return { ok: false, error: "Introduce un email válido." };
  }
  const tempPassword = String(data.get("password") ?? "");
  const passwordError = validatePassword(tempPassword);
  if (passwordError) return { ok: false, error: passwordError };

  if (await getAdminByEmail(email)) {
    return { ok: false, error: "Ya existe un admin con ese email." };
  }
  try {
    await createAdmin({
      email,
      passwordHash: hashPassword(tempPassword),
      mustChangePassword: true,
      tokenVersion: 1,
    });
  } catch {
    return { ok: false, error: "Ya existe un admin con ese email." };
  }
  await recordCurrentAdminAudit({ action: "admin.create", entityType: "admin", metadata: { email } });
  revalidatePath("/admin/seguridad");
  return { ok: true };
}

export async function deleteAdminAction(id: number): Promise<SecurityActionResult> {
  const me = await requirePermission(PERMISSIONS.security);
  if (id === me.id) {
    return { ok: false, error: "No puedes eliminar tu propio admin." };
  }
  if ((await countAdmins()) <= 1) {
    return { ok: false, error: "No puedes eliminar al último admin." };
  }
  await deleteAdminById(id);
  await recordCurrentAdminAudit({ action: "admin.delete", entityType: "admin", entityId: id });
  revalidatePath("/admin/seguridad");
  return { ok: true };
}

export async function revokeSessionsAction(id: number): Promise<SecurityActionResult> {
  await guard(PERMISSIONS.security);
  const admin = await getAdminById(id);
  if (!admin) {
    return { ok: false, error: "Ese admin ya no existe." };
  }
  await bumpAdminTokenVersion(id);
  await recordCurrentAdminAudit({ action: "admin.sessions_revoke", entityType: "admin", entityId: id });
  revalidatePath("/admin/seguridad");
  return { ok: true };
}

export async function updateAdminAccessAction(id: number, roleInput: string, permissionsInput: unknown): Promise<SecurityActionResult> {
  const me = await requirePermission(PERMISSIONS.security);
  if (!me.isSuperadmin) return { ok: false, error: "Solo un superadmin puede gestionar roles y permisos." };
  if (id === me.id) return { ok: false, error: "No puedes cambiar tus propios permisos." };
  if (!isRole(roleInput)) return { ok: false, error: "Rol no válido." };
  const target = await getAdminById(id);
  if (!target) return { ok: false, error: "Ese admin ya no existe." };
  if (target.isSuperadmin && roleInput !== "superadmin" && (await countSuperadmins()) <= 1) {
    return { ok: false, error: "Debe quedar al menos un superadmin." };
  }
  await updateAdminAccess(id, roleInput as AdminRole, sanitizePermissions(permissionsInput));
  await recordCurrentAdminAudit({ action: "admin.access_update", entityType: "admin", entityId: id, metadata: { role: roleInput } });
  revalidatePath("/admin/seguridad");
  return { ok: true };
}

// ---------- Carta (guardado masivo) ----------
export async function saveMenu(
  cats: {
    name: string;
    emoji: string;
    items: { name: string; description: string; price: string }[];
  }[],
) {
  await guard(PERMISSIONS.menu);
  await saveMenuDb(cats);
  invalidatePublicMenu();
  await recordCurrentAdminAudit({ action: "menu.save", entityType: "menu", metadata: { categories: cats.length } });
  revalidatePath("/admin");
  revalidatePath("/");
}

// ---------- Categorías ----------
export async function saveCategory(data: FormData) {
  await guard(PERMISSIONS.menu);
  const id = Number(data.get("id")) || undefined;
  await upsertCategory({
    id,
    name: String(data.get("name") ?? "").trim(),
    emoji: String(data.get("emoji") ?? "").trim(),
  });
  invalidatePublicMenu();
  await recordCurrentAdminAudit({ action: id ? "category.update" : "category.create", entityType: "category", entityId: id, metadata: { name: String(data.get("name") ?? "").trim() } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteCategoryAction(id: number) {
  await guard(PERMISSIONS.menu);
  await removeCategory(id);
  invalidatePublicMenu();
  await recordCurrentAdminAudit({ action: "category.delete", entityType: "category", entityId: id });
  revalidatePath("/admin");
  revalidatePath("/");
}

// ---------- Platos ----------
export async function saveItem(data: FormData) {
  await guard(PERMISSIONS.menu);
  const id = Number(data.get("id")) || undefined;
  await upsertItem({
    id,
    categoryId: Number(data.get("categoryId")),
    name: String(data.get("name") ?? "").trim(),
    description: String(data.get("description") ?? "").trim(),
    price: String(data.get("price") ?? "").trim(),
  });
  invalidatePublicMenu();
  await recordCurrentAdminAudit({ action: id ? "item.update" : "item.create", entityType: "item", entityId: id, metadata: { name: String(data.get("name") ?? "").trim() } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteItem(id: number) {
  await guard(PERMISSIONS.menu);
  await removeItem(id);
  invalidatePublicMenu();
  await recordCurrentAdminAudit({ action: "item.delete", entityType: "item", entityId: id });
  revalidatePath("/admin");
  revalidatePath("/");
}

// ---------- Ajustes / contenido ----------
export async function saveSettings(partial: Record<string, unknown>) {
  const settingPermissions: Record<string, Permission> = {
    seo: PERMISSIONS.seo, branding: PERMISSIONS.branding, contacto: PERMISSIONS.contact,
    mensajes: PERMISSIONS.contact, nav: PERMISSIONS.navigation, ai: PERMISSIONS.mediaAi,
    template: PERMISSIONS.branding,
    analytics: PERMISSIONS.analytics,
  };
  const keys = Object.keys(partial);
  if (keys.length === 0) await requirePermission(PERMISSIONS.contentWrite);
  await Promise.all(keys.map((key) => requirePermission(settingPermissions[key] ?? PERMISSIONS.contentWrite)));
  const safePartial = { ...partial };
  if ("seo" in safePartial) safePartial.seo = normalizeSeoSettings(safePartial.seo);
  if ("analytics" in safePartial) safePartial.analytics = normalizeAnalyticsSettings(safePartial.analytics);
  await updateSettings(safePartial);
  invalidatePublicSettings();
  await recordCurrentAdminAudit({ action: "settings.update", entityType: "settings", metadata: { keys } });
  revalidatePath("/admin");
  revalidatePath("/");
}

export type ApplyTemplateResult = { ok: true; template: string } | { ok: false; error: string };

/** Carga la estructura del preset rellenando únicamente campos vacíos. */
export async function applySectorTemplateAction(templateId: unknown): Promise<ApplyTemplateResult> {
  await requirePermission(PERMISSIONS.branding);
  const id = validateTemplateId(templateId);
  const template = getTemplate(id);
  if (!id || !template) return { ok: false, error: "La plantilla no existe." };
  const current = await getSettings();
  const next = applyTemplateToSettings(current, template);
  const changes: Record<string, unknown> = { template: next.template, layout: next.layout };
  for (const key of Object.keys(template.initialContent)) changes[key] = next[key];
  await updateSettings(changes);
  invalidatePublicSettings();
  await recordCurrentAdminAudit({ action: "template.apply", entityType: "settings", metadata: { template: id, mode: "fill-empty" } });
  revalidatePath("/admin/plantillas");
  revalidatePath("/admin/landing");
  revalidatePath("/");
  return { ok: true, template: id };
}

// ---------- Módulos del panel ----------
export async function saveModules(flags: Record<string, boolean>) {
  await requirePermission(PERMISSIONS.modules);
  // Valida contra el registro: solo ids conocidos y valores booleanos.
  const known = new Set(ADMIN_MODULES.map((m) => m.id));
  const clean: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(flags ?? {})) {
    if (known.has(k) && typeof v === "boolean") clean[k] = v;
  }
  for (const m of ADMIN_MODULES) {
    if (m.required) clean[m.id] = true;
  }
  await updateSettings({ modules: clean });
  invalidatePublicSettings();
  await recordCurrentAdminAudit({ action: "modules.update", entityType: "settings", metadata: { modules: clean } });
  revalidatePath("/admin");
  revalidatePath("/");
}

// ---------- Páginas (ruta /[slug]) ----------
export type CreatePageState = { ok: boolean; error?: string };

export async function createPage(
  _prev: CreatePageState,
  data: FormData,
): Promise<CreatePageState> {
  await guard();
  const name = String(data.get("name") ?? "").trim();
  const slugInput = String(data.get("slug") ?? "").trim();
  const slug = slugify(slugInput) || slugify(name);
  if (!name || !slug) {
    return { ok: false, error: "Pon un nombre válido a la página." };
  }
  if (await getPageBySlug(slug, { draft: true })) {
    return { ok: false, error: `Ya existe una página con la URL /${slug}.` };
  }
  const id = await upsertPage({
    slug,
    name,
    visible: true,
    seo: { title: "", description: "" },
    content: {},
    layout: PAGE_DEFAULT_LAYOUT,
  });
  invalidatePublicPages(slug);
  await recordCurrentAdminAudit({ action: "page.create", entityType: "page", entityId: id, metadata: { slug, name } });
  revalidatePath("/admin/paginas");
  revalidatePath("/");
  redirect(`/admin/paginas/${id}`);
}

export async function updatePage(input: {
  id: number;
  name: string;
  slug: string;
  visible: boolean;
  seo: Record<string, string>;
  layout: PageLayoutItem[];
  content: Record<string, unknown>;
}) {
  await guard();
  const slug = slugify(input.slug) || slugify(input.name);
  if (!slug) throw new Error("El slug no es válido.");
  const other = await getPageBySlug(slug, { draft: true });
  if (other && other.id !== input.id) {
    throw new Error(`La URL /${slug} ya la usa otra página.`);
  }
  // Snapshot, página, redirects y prune comparten el mismo commit HTTP de Neon.
  const current = await getPageById(input.id);
  const pageInput = {
    id: input.id,
    slug,
    name: input.name.trim() || "Página",
    visible: input.visible,
    seo: normalizeSeoSettings(input.seo),
    layout: input.layout,
    content: input.content,
  };
  if (current) await savePageTransaction(current, pageInput);
  else await upsertPage(pageInput);
  invalidatePublicPages(input.slug, slug, current?.slug ?? "");
  if (current && current.slug !== slug) invalidatePublicRedirects();
  await recordCurrentAdminAudit({ action: "page.update", entityType: "page", entityId: input.id, metadata: { slug, visible: input.visible } });
  revalidatePath("/admin/paginas");
  revalidatePath("/");
  revalidatePath(`/${slug}`);
}

export type RestorePageVersionResult =
  | { ok: true; slug: string; slugChanged: boolean }
  | { ok: false; error: string };

/**
 * Restaura una página al estado de una versión guardada. Si el slug del
 * snapshot ya lo usa otra página, se restaura todo menos el slug (se conserva
 * el actual) y se avisa con `slugChanged`.
 */
export async function restorePageVersionAction(
  pageId: number,
  versionId: number,
): Promise<RestorePageVersionResult> {
  await guard();
  const current = await getPageById(pageId);
  if (!current) {
    return { ok: false, error: "La página no existe." };
  }
  const snapshot = await restorePageVersion(pageId, versionId);
  if (!snapshot) {
    return { ok: false, error: "La versión no existe." };
  }
  // Conflicto de slug: si otra página ya lo usa, se restaura todo menos el slug.
  let slug = snapshot.slug;
  let slugChanged = false;
  const other = await getPageBySlug(slug, { draft: true });
  if (other && other.id !== pageId) {
    slug = current.slug;
    slugChanged = true;
  }
  await savePageTransaction(current, {
    id: pageId,
    slug,
    name: snapshot.name,
    visible: snapshot.visible,
    seo: snapshot.seo,
    layout: snapshot.layout,
    content: snapshot.content,
  });
  invalidatePublicPages(current.slug, slug);
  if (slug !== current.slug) invalidatePublicRedirects();
  await recordCurrentAdminAudit({ action: "page.restore", entityType: "page", entityId: pageId, metadata: { versionId } });
  revalidatePath("/admin/paginas");
  revalidatePath("/");
  revalidatePath(`/${slug}`);
  if (slugChanged) revalidatePath(`/${current.slug}`);
  return { ok: true, slug, slugChanged };
}

export async function publishPageAction(id: number) {
  await guard(PERMISSIONS.contentPublish);
  const page = await getPageById(id);
  if (!page) throw new Error("La página no existe.");
  await publishPage(id);
  invalidatePublicPages(page.slug);
  await recordCurrentAdminAudit({ action: "page.publish", entityType: "page", entityId: id });
  revalidatePath("/admin/paginas");
  revalidatePath("/");
  revalidatePath(`/${page.slug}`);
  return { ok: true as const, publishedAt: new Date().toISOString() };
}

export async function togglePageVisibility(id: number, visible: boolean) {
  await guard();
  await setPageVisibility(id, visible);
  const page = await getPageById(id);
  invalidatePublicPages(page?.slug ?? "");
  await recordCurrentAdminAudit({ action: "page.visibility", entityType: "page", entityId: id, metadata: { visible } });
  revalidatePath("/admin/paginas");
  revalidatePath("/");
}

export async function deletePageAction(id: number) {
  await guard();
  const page = await getPageById(id);
  await removePage(id);
  invalidatePublicPages(page?.slug ?? "");
  await recordCurrentAdminAudit({ action: "page.delete", entityType: "page", entityId: id });
  revalidatePath("/admin/paginas");
  revalidatePath("/");
  redirect("/admin/paginas");
}

// ---------- Bandeja de mensajes ----------
export async function setMessageReadAction(id: number, read: boolean) {
  await guard(PERMISSIONS.messagesManage);
  await setMessageRead(id, read);
  await recordCurrentAdminAudit({ action: "message.read", entityType: "contact_message", entityId: id, metadata: { read } });
  revalidatePath("/admin/mensajes");
}

export async function deleteMessageAction(id: number) {
  await guard(PERMISSIONS.messagesManage);
  await deleteContactMessage(id);
  await recordCurrentAdminAudit({ action: "message.delete", entityType: "contact_message", entityId: id });
  revalidatePath("/admin/mensajes");
}