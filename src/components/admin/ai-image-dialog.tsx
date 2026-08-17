"use client";

import { useState } from "react";
import {
  AI_ASPECTS,
  AI_QUALITIES,
  AI_PROMPT_SUGGESTIONS,
  aiModelLabel,
  type AiAspect,
  type AiImageMode,
  type AiQuality,
} from "@/lib/ai-images";
import { dataUrlToFile, uploadImage } from "@/lib/client-image";

type AiResult = {
  model: string;
  url?: string;
  dataUrl?: string;
  temporary?: boolean;
  error?: string;
};

/**
 * Modal de IA: edita una imagen existente o crea una desde cero. Se lanzan
 * varios modelos en paralelo (server-side /api/ai-image) y el usuario elige
 * cuál de las propuestas utiliza. La elegida se guarda en Vercel Blob y se
 * entrega con onResult(url).
 */
export function AiImageDialog({
  open,
  sourceImage,
  defaultAspect = "16:9",
  onClose,
  onResult,
}: {
  open: boolean;
  sourceImage?: string;
  defaultAspect?: string;
  onClose: () => void;
  onResult: (url: string) => void;
}) {
  const [mode, setMode] = useState<AiImageMode>(sourceImage ? "edit" : "create");
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState<AiAspect>(
    AI_ASPECTS.includes(defaultAspect as AiAspect) ? (defaultAspect as AiAspect) : "16:9",
  );
  const [quality, setQuality] = useState<AiQuality>("low");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<AiResult[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  function reset() {
    setError("");
    setResults(null);
    setSelected(null);
  }

  async function generate() {
    const p = prompt.trim();
    if (!p) {
      setError("Escribe qué quieres que haga la IA con la imagen.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt: p,
          imageUrl: mode === "edit" && sourceImage ? sourceImage : undefined,
          aspectRatio: aspect,
          quality,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        results?: AiResult[];
        error?: string;
      };
      if (!res.ok || !data.results || data.results.length === 0) {
        setError(data.error || "No se pudo generar ninguna imagen.");
        return;
      }
      setResults(data.results);
      // Preseleccionamos la primera propuesta válida; el usuario puede cambiar.
      const first = data.results.find((r) => r.url ?? r.dataUrl);
      setSelected(first?.model ?? null);
    } catch {
      setError("Error de red al contactar con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  async function useSelected() {
    if (!selected) return;
    const r = results?.find((x) => x.model === selected);
    if (!r) return;
    setBusy(true);
    setError("");
    try {
      let finalUrl = r.url;
      if (!finalUrl && r.dataUrl) {
        // Sin Blob en el servidor: subimos la data URL elegida por /api/upload.
        try {
          finalUrl = await uploadImage(dataUrlToFile(r.dataUrl, "ia.png"));
        } catch (e) {
          setError(
            e instanceof Error && e.message.includes("Blob")
              ? `${e.message} La imagen elegida no se podrá guardar hasta configurarlo.`
              : (e instanceof Error ? e.message : "No se pudo guardar la imagen."),
          );
          return;
        }
      }
      if (!finalUrl) {
        setError("La imagen seleccionada no está disponible.");
        return;
      }
      onResult(finalUrl);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  const selectCls =
    "rounded-lg border border-white/15 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-amber-500";
  const chipCls =
    "rounded-full border border-white/10 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-amber-500 hover:text-amber-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-100">✨ Imagen con IA (OpenRouter)</h3>
          <button type="button" className="text-sm text-zinc-400 hover:text-zinc-100" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {results ? (
          <div>
            <p className="mb-3 text-xs text-zinc-400">
              Se generaron <span className="text-zinc-200">{results.length}</span> propuestas con distintos
              modelos. Haz clic en la que más te guste.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {results.map((r) => {
                const img = r.url ?? r.dataUrl;
                const isSel = selected === r.model;
                return (
                  <div
                    key={r.model}
                    role="button"
                    tabIndex={0}
                    onClick={() => img && setSelected(r.model)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && img) setSelected(r.model);
                    }}
                    className={`overflow-hidden rounded-xl border bg-zinc-950 transition ${
                      img ? "cursor-pointer" : "cursor-default"
                    } ${isSel ? "border-amber-500 ring-2 ring-amber-500/40" : "border-white/10"}`}
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={`Propuesta de ${r.model}`} className="aspect-video w-full object-cover" />
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center p-3 text-center text-xs text-red-400">
                        {r.error || "Sin resultado"}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                      <span className="truncate text-[11px] text-zinc-300" title={r.model}>
                        {aiModelLabel(r.model)}
                      </span>
                      {isSel && <span className="shrink-0 text-[11px] font-semibold text-amber-400">Elegida</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button type="button" className="admin-btn admin-btn--sm" onClick={reset} disabled={busy}>
                ↻ Cambiar prompt
              </button>
              <button type="button" className="admin-btn admin-btn--sm" onClick={generate} disabled={busy}>
                {busy ? "Generando…" : "Regenerar"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary admin-btn--sm"
                disabled={busy || !selected}
                onClick={useSelected}
              >
                {busy ? "Guardando…" : "Usar esta imagen"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {sourceImage && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sourceImage} alt="Origen" className="h-14 w-20 rounded-lg object-cover" />
                <div className="text-xs text-zinc-400">
                  Imagen de origen <span className="text-zinc-600">(se usa cuando el modo es «Editar»)</span>
                </div>
              </div>
            )}

            <div className="mb-3 flex gap-2">
              <button
                type="button"
                className={`${chipCls} ${mode === "edit" ? "border-amber-500 text-amber-300" : ""}`}
                disabled={!sourceImage}
                onClick={() => { setMode("edit"); reset(); }}
              >
                🖼 Editar imagen
              </button>
              <button
                type="button"
                className={`${chipCls} ${mode === "create" ? "border-amber-500 text-amber-300" : ""}`}
                onClick={() => { setMode("create"); reset(); }}
              >
                ✨ Crear desde cero
              </button>
            </div>
            {mode === "edit" && !sourceImage && (
              <p className="mb-2 text-xs text-zinc-500">
                Primero sube o elige una imagen para poder editarla.
              </p>
            )}

            <textarea
              className="min-h-24 w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500"
              value={prompt}
              placeholder={
                mode === "edit"
                  ? "Describe el cambio: «Hazla más luminosa», «Estilo atardecer», «Fondo de estudio»…"
                  : "Describe la imagen que quieres crear…"
              }
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={2000}
            />

            <div className="mt-2 flex flex-wrap gap-1.5">
              {AI_PROMPT_SUGGESTIONS[mode].map((s) => (
                <button key={s} type="button" className={chipCls} onClick={() => setPrompt(s)}>
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                Formato
                <select className={selectCls} value={aspect} onChange={(e) => setAspect(e.target.value as AiAspect)}>
                  {AI_ASPECTS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                Calidad
                <select className={selectCls} value={quality} onChange={(e) => setQuality(e.target.value as AiQuality)}>
                  {AI_QUALITIES.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </label>
              <span className="text-xs text-zinc-600">3 modelos en paralelo</span>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={generate}
                disabled={busy || !prompt.trim()}
              >
                {busy ? "Generando 3 imágenes… (hasta ~2 min)" : "✨ Generar 3 imágenes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
