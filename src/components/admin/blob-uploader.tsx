"use client";

import { useRef, useState } from "react";

export function BlobUploader({
  onUploaded,
  label = "Subir imagen",
  accept = "image/*",
}: {
  onUploaded: (url: string) => void;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error || "No se pudo subir la imagen.");
        return;
      }
      onUploaded(data.url);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Error de red al subir la imagen.");
    } finally {
      setBusy(false);
    }
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
        }}
      />
      <button
        type="button"
        className="admin-btn admin-btn--primary admin-btn--sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Subiendo…" : `⬆ ${label}`}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}