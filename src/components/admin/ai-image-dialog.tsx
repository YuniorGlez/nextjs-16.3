"use client";

import { useState } from "react";
import {
  AI_ASPECTS,
  AI_QUALITIES,
  AI_PROMPT_SUGGESTIONS,
  type AiAspect,
  type AiImageMode,
  type AiQuality,
} from "@/lib/ai-images";
import { dataUrlToFile, uploadImage } from "@/lib/client-image";

/**
 * Modal de IA: edita una imagen existente o crea una desde cero con
 * OpenRouter (openai/gpt-image-2). La llamada es server-side (/api/ai-image);
 * el resultado se guarda en Vercel Blob y se entrega con onResult(url).
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
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [temporary, setTemporary] = useState(false);

  function reset() {
    setError("");
    setResultUrl(null);
    setResultDataUrl(null);
    setTemporary(false);
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
        url?: string;
        dataUrl?: string;
        temporary?: boolean;
        error?: string;
      };
      if (!res.ok || (!data.url && !data.dataUrl)) {
        setError(data.error || "No se pudo generar la imagen.");
        return;
      }
      if (data.url) {
        setResultUrl(data.url);
        setTemporary(false);
        return;
      }
      // Sin Blob configurado: intentamos subir la data URL por /api/upload.
      if (data.dataUrl) {
        try {
          const url = await uploadImage(dataUrlToFile(data.dataUrl, "ia.png"));
          setResultUrl(url);
          setTemporary(false);
          return;
        } catch (e) {
          setResultDataUrl(data.dataUrl);
          setTemporary(true);
          setError(
            e instanceof Error && e.message.includes("Blob")
              ? `${e.message} La imagen generada no se podrá guardar hasta configurarlo.`
              : (e instanceof Error ? e.message : "No se pudo guardar la imagen."),
          );
          return;
        }
      }
      setError("Respuesta inesperada del servidor.");
    } catch {
      setError("Error de red al contactar con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  const preview = resultUrl ?? resultDataUrl;
  if (!open) return null;
  const selectCls =
    "rounded-lg border border-white/15 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-amber-500";
  const chipCls =
    "rounded-full border border-white/10 bg-zinc-800/60 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-amber-500 hover:text-amber-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-100">✨ Imagen con IA (OpenRouter)</h3>
          <button type="button" className="text-sm text-zinc-400 hover:text-zinc-100" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {preview ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Resultado IA" className="w-full rounded-xl border border-white/10" />
            {temporary && (
              <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                ⚠️ Vercel Blob no está configurado: esta imagen solo está en la vista previa y no se podrá guardar.
                Añade BLOB_READ_WRITE_TOKEN (ver /admin/imagenes).
              </p>
            )}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button type="button" className="admin-btn admin-btn--sm" onClick={() => { reset(); }} disabled={busy}>
                ↻ Cambiar prompt
              </button>
              <button type="button" className="admin-btn admin-btn--sm" onClick={generate} disabled={busy}>
                {busy ? "Generando…" : "Regenerar"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary admin-btn--sm"
                disabled={!resultUrl}
                onClick={() => {
                  if (resultUrl) onResult(resultUrl);
                  onClose();
                }}
              >
                Usar esta imagen
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
              <span className="text-xs text-zinc-600">Modelo: openai/gpt-image-2</span>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={generate}
                disabled={busy || !prompt.trim()}
              >
                {busy ? "Generando… (puede tardar ~30 s)" : "✨ Generar imagen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
