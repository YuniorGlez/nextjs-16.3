"use client";

import { useCallback, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import type { CropArea } from "@/lib/client-image";
import { cropImageToBlob, uploadImage } from "@/lib/client-image";

/**
 * Modal de recorte + optimización: recibe un File, deja ajustar el encuadre
 * (con aspecto fijo o libre) y al confirmar sube la imagen optimizada a
 * Vercel Blob vía /api/upload llamando a onUploaded(url).
 */
export function ImageCropDialog({
  file,
  aspect,
  onClose,
  onUploaded,
}: {
  file: File | null;
  aspect?: number; // undefined = recorte libre
  onClose: () => void;
  onUploaded: (url: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropArea | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const src = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  const onCropComplete = useCallback((percentages: CropArea) => {
    setArea(percentages);
  }, []);

  async function finish(blobOrFile: File | Blob, name: string, type: string) {
    setBusy(true);
    setError("");
    try {
      const url = await uploadImage(new File([blobOrFile], name, { type }));
      onUploaded(url);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setBusy(false);
    }
  }

  async function applyCrop() {
    if (!file || !area) return;
    try {
      const blob = await cropImageToBlob(src, area, { maxDim: 1920, quality: 0.85 });
      const ext = blob.type === "image/png" ? "png" : "webp";
      const base = file.name.replace(/\.[^.]+$/, "") || "imagen";
      await finish(blob, `${base}-opt.${ext}`, blob.type);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar la imagen.");
    }
  }

  async function uploadOriginal() {
    if (!file) return;
    await finish(file, file.name, file.type);
  }

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-100">✂️ Recortar y optimizar</h3>
          <button type="button" className="text-sm text-zinc-400 hover:text-zinc-100" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="relative h-80 w-full overflow-hidden rounded-xl bg-zinc-950">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              {...(aspect ? { aspect } : {})}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-zinc-500">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            className="flex-1 accent-amber-500"
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          Al confirmar, la imagen se recorta y se optimiza a WebP (máx. 1920 px) antes de subirla.
        </p>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button type="button" className="admin-btn admin-btn--sm" onClick={uploadOriginal} disabled={busy}>
            Subir original
          </button>
          <button type="button" className="admin-btn admin-btn--primary admin-btn--sm" onClick={applyCrop} disabled={busy || !area}>
            {busy ? "Subiendo…" : "Recortar y optimizar"}
          </button>
        </div>
      </div>
    </div>
  );
}
