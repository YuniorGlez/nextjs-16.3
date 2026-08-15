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
  removeCategory,
  removeItem,
  saveMenu as saveMenuDb,
  updateSettings,
  upsertCategory,
  upsertItem,
} from "@/lib/data";

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