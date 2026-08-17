"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  createSession,
  destroySession,
  isAdmin,
} from "@/lib/auth";
import {
  createPageVersion,
  deleteContactMessage,
  getPageById,
  getPageBySlug,
  prunePageVersions,
  registerPageRedirect,
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
import { PAGE_DEFAULT_LAYOUT } from "@/lib/sections";

async function guard() {
  if (!(await isAdmin())) {
    redirect("/admin");
  }
}

// ---------- Sesión ----------
export async function loginAction(data: FormData) {
  const pwd = String(data.get("password") ?? "");
  if (checkPassword(pwd)) {
    await createSession();
    redirect("/admin");
  }
  return { ok: false as const, error: "Contraseña incorrecta." };
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin");
}

// ---------- Carta (guardado masivo) ----------
export async function saveMenu(
  cats: {
    name: string;
    emoji: string;
    items: { name: string; description: string; price: string }[];
  }[],
) {
  await guard();
  await saveMenuDb(cats);
  revalidatePath("/admin");
  revalidatePath("/");
}

// ---------- Categorías ----------
export async function saveCategory(data: FormData) {
  await guard();
  const id = Number(data.get("id")) || undefined;
  await upsertCategory({
    id,
    name: String(data.get("name") ?? "").trim(),
    emoji: String(data.get("emoji") ?? "").trim(),
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteCategoryAction(id: number) {
  await guard();
  await removeCategory(id);
  revalidatePath("/admin");
  revalidatePath("/");
}

// ---------- Platos ----------
export async function saveItem(data: FormData) {
  await guard();
  const id = Number(data.get("id")) || undefined;
  await upsertItem({
    id,
    categoryId: Number(data.get("categoryId")),
    name: String(data.get("name") ?? "").trim(),
    description: String(data.get("description") ?? "").trim(),
    price: String(data.get("price") ?? "").trim(),
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteItem(id: number) {
  await guard();
  await removeItem(id);
  revalidatePath("/admin");
  revalidatePath("/");
}

// ---------- Ajustes / contenido ----------
export async function saveSettings(partial: Record<string, unknown>) {
  await guard();
  await updateSettings(partial);
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
  if (await getPageBySlug(slug)) {
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
  const other = await getPageBySlug(slug);
  if (other && other.id !== input.id) {
    throw new Error(`La URL /${slug} ya la usa otra página.`);
  }
  // Snapshot del estado actual ANTES de guardar: cada versión es un estado
  // previo al que se puede volver desde el historial.
  const current = await getPageById(input.id);
  if (current) {
    await createPageVersion(current);
  }
  await upsertPage({
    id: input.id,
    slug,
    name: input.name.trim() || "Página",
    visible: input.visible,
    seo: input.seo,
    layout: input.layout,
    content: input.content,
  });
  // Si cambió el slug, registrar redirección 301 del slug antiguo al nuevo
  // (el proxy la emite en el edge). Un fallo aquí no debe romper el guardado.
  if (current && current.slug !== slug) {
    try {
      await registerPageRedirect(current.slug, slug);
    } catch (err) {
      console.error("No se pudo registrar la redirección 301:", err);
    }
  }
  await prunePageVersions(input.id, 20);
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
  // Guarda también el estado actual como versión, para poder deshacer la restauración.
  await createPageVersion(current);
  // Conflicto de slug: si otra página ya lo usa, se restaura todo menos el slug.
  let slug = snapshot.slug;
  let slugChanged = false;
  const other = await getPageBySlug(slug);
  if (other && other.id !== pageId) {
    slug = current.slug;
    slugChanged = true;
  }
  await upsertPage({
    id: pageId,
    slug,
    name: snapshot.name,
    visible: snapshot.visible,
    seo: snapshot.seo,
    layout: snapshot.layout,
    content: snapshot.content,
  });
  // Si restaurar cambió el slug (volver a un slug anterior), registrar la
  // redirección 301 desde el slug actual para no romper enlaces existentes.
  if (slug !== current.slug) {
    try {
      await registerPageRedirect(current.slug, slug);
    } catch (err) {
      console.error("No se pudo registrar la redirección 301:", err);
    }
  }
  await prunePageVersions(pageId, 20);
  revalidatePath("/admin/paginas");
  revalidatePath("/");
  revalidatePath(`/${slug}`);
  if (slugChanged) revalidatePath(`/${current.slug}`);
  return { ok: true, slug, slugChanged };
}

export async function togglePageVisibility(id: number, visible: boolean) {
  await guard();
  await setPageVisibility(id, visible);
  revalidatePath("/admin/paginas");
  revalidatePath("/");
}

export async function deletePageAction(id: number) {
  await guard();
  await removePage(id);
  revalidatePath("/admin/paginas");
  revalidatePath("/");
  redirect("/admin/paginas");
}

// ---------- Bandeja de mensajes ----------
export async function setMessageReadAction(id: number, read: boolean) {
  await guard();
  await setMessageRead(id, read);
  revalidatePath("/admin/mensajes");
}

export async function deleteMessageAction(id: number) {
  await guard();
  await deleteContactMessage(id);
  revalidatePath("/admin/mensajes");
}