import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { listMedia, sanitizeMediaInput, createMediaAsset } from "@/lib/media";
import { recordCurrentAdminAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try { await requirePermission(PERMISSIONS.mediaUpload); } catch { return NextResponse.json({ error: "No autorizado" }, { status: 401 }); }
  const params = request.nextUrl.searchParams;
  const result = await listMedia({ search: params.get("search") ?? "", folder: params.get("folder") ?? "", includeDeleted: params.get("deleted") === "1", page: Number(params.get("page") ?? 1), pageSize: Number(params.get("pageSize") ?? 24) });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission(PERMISSIONS.mediaUpload);
    const body = await request.json() as Record<string, unknown>;
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const filename = typeof body.filename === "string" ? body.filename : "imagen";
    const contentType = typeof body.contentType === "string" ? body.contentType : "application/octet-stream";
    const bytes = Number(body.bytes);
    if (!/^https?:\/\//.test(url) || !Number.isFinite(bytes) || bytes < 0 || bytes > 8 * 1024 * 1024) return NextResponse.json({ error: "Datos de media no válidos" }, { status: 400 });
    const asset = await createMediaAsset({ url, pathname: typeof body.pathname === "string" ? body.pathname : null, filename, contentType, bytes, altText: body.altText, title: body.title, folder: body.folder, tag: body.tag, metadata: body.metadata, decorative: body.decorative === true || body.altText === undefined, createdBy: admin.id });
    await recordCurrentAdminAudit({ action: "media.create", entityType: "media", entityId: asset.id, metadata: { filename: asset.filename } });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo registrar el asset" }, { status: error instanceof Error && error.message.includes("alternativo") ? 400 : 500 }); }
}

export function parseMediaMetadata(body: Record<string, unknown>) { return sanitizeMediaInput(body); }
