"use client";

import { useCallback, useEffect, useState } from "react";
import { BlobUploader } from "@/components/admin/blob-uploader";

type Asset = { id: number; url: string; filename: string; bytes: number; contentType: string; altText: string; title: string | null; folder: string | null; tag: string | null; deletedAt: string | null };
type Result = { rows: Asset[]; total: number; page: number; pageSize: number; totalPages: number };

function size(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(2)} MB`; }

export function MediaLibrary() {
  const [result, setResult] = useState<Result>({ rows: [], total: 0, page: 1, pageSize: 24, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [deleted, setDeleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (page = 1) => {
    setBusy(true); setError("");
    try {
      const query = new URLSearchParams({ search, page: String(page), pageSize: "24" });
      if (deleted) query.set("deleted", "1");
      const response = await fetch(`/api/media?${query}`);
      const body = await response.json() as Result & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No se pudo cargar la biblioteca");
      setResult(body);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error cargando media"); }
    finally { setBusy(false); }
  }, [deleted, search]);

  useEffect(() => { void load(); }, [load]);

  async function update(asset: Asset, field: "altText" | "title" | "folder" | "tag", value: string) {
    const response = await fetch(`/api/media/${asset.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    if (!response.ok) { setError("No se pudieron guardar los metadatos"); return; }
    setResult((current) => ({ ...current, rows: current.rows.map((item) => item.id === asset.id ? { ...item, [field]: value } : item) }));
  }

  async function remove(asset: Asset) {
    const response = await fetch(`/api/media/${asset.id}`, { method: "DELETE" });
    const body = await response.json() as { error?: string };
    if (!response.ok) { setError(body.error ?? "No se pudo borrar"); return; }
    void load(result.page);
  }

  async function restore(asset: Asset) {
    const response = await fetch(`/api/media/${asset.id}?restore=1`, { method: "DELETE" });
    if (!response.ok) { setError("No se pudo restaurar"); return; }
    void load(result.page);
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-zinc-100">Biblioteca multimedia</h2><p className="text-sm text-zinc-500">{result.total} assets · las imágenes referenciadas no se pueden borrar.</p></div>
        <BlobUploader label="Subir a la biblioteca" onUploaded={() => void load(1)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <input aria-label="Buscar media" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" value={search} placeholder="Buscar por nombre, título, alt o etiqueta…" onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(1); }} />
        <button type="button" className="admin-btn admin-btn--sm" onClick={() => void load(1)}>Buscar</button>
        <label className="flex items-center gap-2 px-2 text-xs text-zinc-400"><input type="checkbox" checked={deleted} onChange={(event) => { setDeleted(event.target.checked); }} /> incluir eliminadas</label>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {busy ? <p className="py-10 text-center text-sm text-zinc-500">Cargando…</p> : <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.rows.map((asset) => <article key={asset.id} className={`overflow-hidden rounded-xl border border-white/10 bg-zinc-950 ${asset.deletedAt ? "opacity-60" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src={asset.url} alt={asset.altText} className="aspect-video w-full object-cover" />
          <div className="space-y-2 p-3"><p className="truncate text-xs font-medium text-zinc-200" title={asset.filename}>{asset.filename}</p><p className="text-xs text-zinc-500">{size(asset.bytes)} · {asset.contentType}</p>
            <input aria-label={`Texto alternativo de ${asset.filename}`} className="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200" defaultValue={asset.altText} placeholder="Texto alternativo" onBlur={(event) => { if (event.target.value !== asset.altText) void update(asset, "altText", event.target.value); }} />
            <div className="grid grid-cols-2 gap-2"><input aria-label={`Título de ${asset.filename}`} className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200" defaultValue={asset.title ?? ""} placeholder="Título" onBlur={(event) => void update(asset, "title", event.target.value)} /><input aria-label={`Carpeta de ${asset.filename}`} className="rounded border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200" defaultValue={asset.folder ?? ""} placeholder="Carpeta" onBlur={(event) => void update(asset, "folder", event.target.value)} /></div>
            <div className="flex flex-wrap gap-2"><button type="button" className="admin-btn admin-btn--sm" onClick={() => void navigator.clipboard.writeText(asset.url)}>Copiar URL</button>{asset.deletedAt ? <button type="button" className="admin-btn admin-btn--sm" onClick={() => void restore(asset)}>Restaurar</button> : <button type="button" className="admin-btn admin-btn--sm" onClick={() => void remove(asset)}>Borrar</button>}</div>
          </div>
        </article>)}
      </div>}
      {result.totalPages > 1 && <div className="mt-5 flex items-center justify-center gap-3"><button type="button" className="admin-btn admin-btn--sm" disabled={result.page <= 1} onClick={() => void load(result.page - 1)}>Anterior</button><span className="text-xs text-zinc-500">Página {result.page} de {result.totalPages}</span><button type="button" className="admin-btn admin-btn--sm" disabled={result.page >= result.totalPages} onClick={() => void load(result.page + 1)}>Siguiente</button></div>}
    </section>
  );
}

export function MediaLibraryUploadNotice() { return null; }
