"use client";

import { useRef, useState } from "react";
import { ImageCropDialog } from "@/components/admin/image-crop-dialog";

/**
 * Subida de imagen compacta (botón) con recorte + optimización automática.
 * Mantiene la API histórica del base: onUploaded(url).
 */
export function BlobUploader({
  onUploaded,
  label = "Subir imagen",
  accept = "image/*",
  aspect,
}: {
  onUploaded: (url: string) => void;
  label?: string;
  accept?: string;
  aspect?: number; // relación de recorte (undefined = libre)
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  function handleFile(f: File) {
    setError("");
    if (!f.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    setFile(f);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      <button
        type="button"
        className="admin-btn admin-btn--primary admin-btn--sm"
        onClick={() => inputRef.current?.click()}
      >
        ⬆ {label}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
      <ImageCropDialog
        key={file ? `${file.name}-${file.size}` : "none"}
        file={file}
        aspect={aspect}
        onClose={() => setFile(null)}
        onUploaded={(url) => {
          onUploaded(url);
          setFile(null);
        }}
      />
    </div>
  );
}
