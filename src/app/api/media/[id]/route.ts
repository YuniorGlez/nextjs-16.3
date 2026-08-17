import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getMediaAsset, restoreMediaAsset, sanitizeMediaInput, softDeleteMediaAsset, updateMediaAsset } from "@/lib/media";
import { recordCurrentAdminAudit } from "@/lib/audit";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

async function idOf(context: Context) { const id = Number((await context.params).id); return Number.isSafeInteger(id) && id > 0 ? id : null; }

export async function PATCH(request: NextRequest, context: Context) {
  try { await requirePermission(PERMISSIONS.mediaUpload); } catch { return NextResponse.json({ error: "No autorizado" }, { status: 401 }); }
  const id = await idOf(context);
  if (!id) return NextResponse.json({ error: "ID no válido" }, { status: 400 });
  const body = await request.json() as Record<string, unknown>;
  const current = await getMediaAsset(id);
  if (!current) return NextResponse.json({ error: "Asset no encontrado" }, { status: 404 });
  try {
    const asset = await updateMediaAsset(id, sanitizeMediaInput({ altText: body.altText ?? current.altText, title: body.title ?? current.title, folder: body.folder ?? current.folder, tag: body.tag ?? current.tag, metadata: body.metadata ?? current.metadata }, { decorative: body.decorative === true || body.altText === "" }));
    if (!asset) return NextResponse.json({ error: "Asset no encontrado" }, { status: 404 });
    await recordCurrentAdminAudit({ action: "media.update", entityType: "media", entityId: id });
    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Metadatos no válidos" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try { await requirePermission(PERMISSIONS.mediaUpload); } catch { return NextResponse.json({ error: "No autorizado" }, { status: 401 }); }
  const id = await idOf(context);
  if (!id) return NextResponse.json({ error: "ID no válido" }, { status: 400 });
  const restore = request.nextUrl.searchParams.get("restore") === "1";
  if (restore) {
    if (!await restoreMediaAsset(id)) return NextResponse.json({ error: "Asset no encontrado" }, { status: 404 });
    await recordCurrentAdminAudit({ action: "media.restore", entityType: "media", entityId: id });
    return NextResponse.json({ ok: true });
  }
  const result = await softDeleteMediaAsset(id);
  if (result === "missing") return NextResponse.json({ error: "Asset no encontrado" }, { status: 404 });
  if (result === "referenced") return NextResponse.json({ error: "No se puede borrar: la imagen está referenciada por contenido." }, { status: 409 });
  await recordCurrentAdminAudit({ action: "media.delete", entityType: "media", entityId: id });
  return NextResponse.json({ ok: true });
}

export async function GET(_request: NextRequest, context: Context) {
  try { await requirePermission(PERMISSIONS.mediaUpload); } catch { return NextResponse.json({ error: "No autorizado" }, { status: 401 }); }
  const id = await idOf(context);
  if (!id) return NextResponse.json({ error: "ID no válido" }, { status: 400 });
  const asset = await getMediaAsset(id);
  return asset ? NextResponse.json({ asset }) : NextResponse.json({ error: "Asset no encontrado" }, { status: 404 });
}
