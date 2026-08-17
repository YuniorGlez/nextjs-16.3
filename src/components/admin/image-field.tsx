"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageCropDialog } from "@/components/admin/image-crop-dialog";
import { AiImageDialog } from "@/components/admin/ai-image-dialog";
import { isHttpUrl, validImageUrl } from "@/lib/client-image";

/**
 * Campo de imagen completo para el admin: drag & drop, pegar URL, recorte +
 * optimización automática y edición/creación con IA (OpenRouter).
 *
 * - `value` imagen actual (URL); `onUploaded(url)` se llama con cualquier
 *   imagen nueva elegida; `onRemove` borra (opcional).
 * - `aspect` relación de recorte (p.ej. 1200/630); sin valor = recorte libre.
 * - `allowAi={false}` desactiva el botón de IA.
 */
export function ImageField({
  value,
  onUploaded,
  onRemove,
  label,
  aspect,
  aiAspect = "16:9",
  allowAi = true,
  hint,
  altText,
  onAltTextChange,
}: {
  value: string;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  aspect?: number;
  aiAspect?: string;
  allowAi?: boolean;
  hint?: string;
  altText?: string;
  onAltTextChange?: (value: string) => void;
}) {
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    setError("");
    setCropFile(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  async function useUrl() {
    const url = urlDraft.trim();
    if (!isHttpUrl(url)) {
      setError("Escribe una URL válida (https://…).");
      return;
    }
    setUrlBusy(true);
    setError("");
    const ok = await validImageUrl(url);
    setUrlBusy(false);
    if (!ok) {
      setError("Esa URL no parece cargar una imagen.");
      return;
    }
    onUploaded(url);
    setUrlMode(false);
    setUrlDraft("");
  }

  const inputCls =
    "w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

  return (
    <div>
      {label && <span className="mb-1 block text-xs font-medium text-zinc-400">{label}</span>}

      <div
        {...getRootProps()}
        aria-label={label ?? "Seleccionar imagen"}
        className={`cursor-pointer rounded-xl border border-dashed p-3 transition ${
          isDragActive
            ? "border-amber-500 bg-amber-500/10"
            : value
              ? "border-white/15 bg-zinc-950"
              : "border-white/25 bg-zinc-950/60 hover:border-amber-500/60"
        }`}
      >
        <input {...getInputProps()} />
        {value ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Imagen actual" className="h-20 w-32 shrink-0 rounded-lg border border-white/10 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-zinc-400" title={value}>{value}</p>
              <p className="mt-1 text-xs text-zinc-600">Arrastra otra imagen aquí o haz clic para cambiarla.</p>
              <div className="mt-2 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {allowAi && (
                  <button type="button" className="admin-btn admin-btn--sm" onClick={() => setAiOpen(true)}>
                    ✨ Editar con IA
                  </button>
                )}
                {onRemove && (
                  <button type="button" className="admin-btn admin-btn--sm" onClick={onRemove}>
                    ✕ Quitar
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <div className="text-2xl">📁</div>
            <p className="mt-1 text-sm text-zinc-300">
              {isDragActive ? "Suelta la imagen aquí" : "Arrastra una imagen o haz clic para elegir"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Se recorta y optimiza automáticamente (WebP, máx. 1920 px)</p>
          </div>
        )}
      </div>

      {!value && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" className="text-xs text-amber-400 hover:underline" onClick={() => setUrlMode((v) => !v)}>
            {urlMode ? "Ocultar URL" : "o pega una URL"}
          </button>
          {allowAi && (
            <button type="button" className="text-xs text-amber-400 hover:underline" onClick={() => setAiOpen(true)}>
              ✨ o crea una con IA
            </button>
          )}
        </div>
      )}

      {urlMode && !value && (
        <div className="mt-2 flex gap-2">
          <input
            className={inputCls}
            value={urlDraft}
            placeholder="https://…/imagen.jpg"
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void useUrl();
              }
            }}
          />
          <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={useUrl} disabled={urlBusy}>
            {urlBusy ? "Comprobando…" : "Usar URL"}
          </button>
        </div>
      )}

      {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
      {onAltTextChange && <label className="mt-3 block text-xs text-zinc-400">Texto alternativo (vacío solo si es decorativa)<input className={`${inputCls} mt-1`} value={altText ?? ""} maxLength={500} onChange={(event) => onAltTextChange(event.target.value)} /></label>}
      {hint && !error && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}

      <ImageCropDialog
        key={cropFile ? `${cropFile.name}-${cropFile.size}` : "none"}
        file={cropFile}
        aspect={aspect}
        onClose={() => setCropFile(null)}
        onUploaded={onUploaded}
      />
      <AiImageDialog
        open={aiOpen}
        sourceImage={value || undefined}
        defaultAspect={aiAspect}
        onClose={() => setAiOpen(false)}
        onResult={onUploaded}
      />
    </div>
  );
}
