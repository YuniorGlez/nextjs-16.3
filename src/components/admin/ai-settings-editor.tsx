"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import { useAdminSave, useToast } from "@/app/admin/shell";

const inputCls =
  "w-full bg-zinc-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

/** Imágenes de ejemplo que trae el base (public/examples). */
const EXAMPLE_IMAGES = [
  { src: "/examples/og-default.jpg", label: "OG por defecto (1200×630)" },
  { src: "/examples/hero-default.jpg", label: "Héroe" },
  { src: "/examples/local-default.jpg", label: "Sección local" },
  { src: "/examples/g1.jpg", label: "Galería 1" },
  { src: "/examples/g2.jpg", label: "Galería 2" },
  { src: "/examples/g3.jpg", label: "Galería 3" },
  { src: "/examples/g4.jpg", label: "Galería 4" },
];

export function AiSettingsEditor({
  dbKeySet,
  envKeySet,
  blobOk,
}: {
  dbKeySet: boolean;
  envKeySet: boolean;
  blobOk: boolean;
}) {
  const saveState = useAdminSave();
  const toast = useToast();
  const router = useRouter();
  const [key, setKey] = useState("");

  useEffect(() => {
    saveState.setSave(async () => {
      saveState.setSaving(true);
      try {
        await saveSettings({ ai: { openrouterApiKey: key.trim() } });
        saveState.setDirty(false);
        toast.push("Ajustes de imágenes guardados.");
        router.refresh();
      } catch {
        toast.push("No se pudo guardar.", "error");
      } finally {
        saveState.setSaving(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const keyActive = dbKeySet || envKeySet;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Imágenes y IA</h1>
        <p>
          Configura aquí el generador de imágenes con IA (OpenRouter) y revisa el estado del
          almacenamiento de imágenes (Vercel Blob).
        </p>
      </div>

      <section className="admin-section">
        <div className="admin-panel-card p-5">
          <h3 className="mb-1 font-semibold">🤖 OpenRouter (imágenes con IA)</h3>
          <p className="mb-4 text-xs text-zinc-500">
            La clave guardada aquí tiene prioridad sobre la variable de entorno{' '}
            <code className="rounded bg-zinc-800 px-1">OPENROUTER_API_KEY</code>. Consíguela en{' '}
            <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
              openrouter.ai/settings/keys
            </a>
            .
          </p>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className={`admin-badge ${dbKeySet ? "admin-badge--success" : "admin-badge--warn"}`}>
              {dbKeySet ? "Clave guardada en la BD" : "Sin clave en la BD"}
            </span>
            <span className={`admin-badge ${envKeySet ? "admin-badge--success" : "admin-badge--warn"}`}>
              {envKeySet ? "OPENROUTER_API_KEY en el entorno" : "OPENROUTER_API_KEY no definida"}
            </span>
          </div>
          <label className="admin-field">
            <span>Clave de API de OpenRouter</span>
            <input
              type="password"
              className={inputCls}
              value={key}
              autoComplete="off"
              placeholder={dbKeySet ? "•••••••• (guardada — deja vacío para conservarla)" : "sk-or-v1-…"}
              onChange={(e) => {
                setKey(e.target.value);
                saveState.setDirty(true);
              }}
            />
          </label>
          <p className="mt-2 text-xs text-zinc-500">
            {dbKeySet
              ? "Si quieres borrar la clave de la BD (y usar la del entorno), guarda con el campo vacío."
              : "Guarda con el campo vacío para usar la clave de OPENROUTER_API_KEY."}
          </p>
          <p className="mt-3 text-xs text-zinc-600">
            {keyActive
              ? "✓ La IA está lista: verás el botón «✨ Editar/Crear con IA» en los campos de imagen del CMS."
              : "Sin clave no se puede generar ni editar imágenes con IA. Configúrala arriba."}
          </p>
        </div>

        <div className="admin-panel-card p-5" style={{ marginTop: 16 }}>
          <h3 className="mb-1 font-semibold">📦 Vercel Blob (almacenamiento)</h3>
          <p className="mb-3 text-xs text-zinc-500">
            Las imágenes subidas (fotos, OG, galería…) se guardan en Vercel Blob. Si no está
            configurado, la subida avisará del error.
          </p>
          <span className={`admin-badge ${blobOk ? "admin-badge--success" : "admin-badge--warn"}`}>
            {blobOk ? "BLOB_READ_WRITE_TOKEN configurado" : "BLOB_READ_WRITE_TOKEN no configurado"}
          </span>
          {!blobOk && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300">
              {`npx vercel link        # enlaza el proyecto (si no está)\nnpx vercel blob create-store   # crea el store y muestra el token`}
            </pre>
          )}
        </div>

        <div className="admin-panel-card p-5" style={{ marginTop: 16 }}>
          <h3 className="mb-1 font-semibold">🖼️ Imágenes de ejemplo del base</h3>
          <p className="mb-4 text-xs text-zinc-500">
            Viven en <code className="rounded bg-zinc-800 px-1">public/examples/</code> y ya se usan
            como valores por defecto del seed (OG, héroe, local y galería). Cámbialas desde cada
            campo de imagen del CMS.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EXAMPLE_IMAGES.map((im) => (
              <div key={im.src} className="overflow-hidden rounded-lg border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.src} alt={im.label} className="h-24 w-full object-cover" />
                <p className="px-2 py-1.5 text-[11px] text-zinc-400">{im.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
