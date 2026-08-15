import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Sin archivo" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Debe ser una imagen" }, { status: 400 });
  }
  // Límite ~8 MB
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen supera 8 MB" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`fotos/${Date.now()}-${safeName}`, buffer, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url });
}