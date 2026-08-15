"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import { useAdminSave, useToast } from "@/app/admin/shell";
import { FONT_OPTIONS, type Branding } from "@/lib/branding";

const inputCls =
  "w-full bg-zinc-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

export function BrandingEditor({ branding }: { branding: Branding }) {
  const router = useRouter();
  const saveState = useAdminSave();
  const toast = useToast();

  const [primary, setPrimary] = useState(branding.primary);
  const [font, setFont] = useState(branding.font);
  const [radius, setRadius] = useState(branding.radius);

  useEffect(() => {
    const run = async () => {
      saveState.setSaving(true);
      try {
        await saveSettings({ branding: { primary, font, radius } });
        saveState.setDirty(false);
        toast.push("Marca guardada. La web se actualiza.");
        router.refresh();
      } catch {
        toast.push("No se pudo guardar.", "error");
      } finally {
        saveState.setSaving(false);
      }
    };
    saveState.setSave(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary, font, radius]);

  const fontOption = FONT_OPTIONS.find((f) => f.key === font) ?? FONT_OPTIONS[0];

  return (
    <div>
      <div className="admin-page-header">
        <h1>Estilo y marca</h1>
        <p>Personaliza el color principal, la tipografía de los titulares y las esquinas redondeadas de la web.</p>
      </div>

      <section className="admin-section">
        <div className="admin-editor-layout">
          <div className="flex flex-col gap-4">
            <div className="admin-panel-card p-4">
              <label className="admin-field">
                <span>Color principal</span>
                <div className="flex items-center gap-3">
                  <input type="color" value={primary} onChange={(e) => { setPrimary(e.target.value); saveState.setDirty(true); }} className="h-10 w-14 cursor-pointer rounded border border-white/15 bg-zinc-950" />
                  <input className={inputCls} style={{ maxWidth: 120 }} value={primary} onChange={(e) => { setPrimary(e.target.value); saveState.setDirty(true); }} />
                </div>
              </label>
            </div>

            <div className="admin-panel-card p-4">
              <label className="admin-field">
                <span>Tipografía de títulos</span>
                <select className={`${inputCls} max-w-xs`} value={font} onChange={(e) => { setFont(e.target.value); saveState.setDirty(true); }}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-panel-card p-4">
              <label className="admin-field">
                <span>Radio de esquinas (px)</span>
                <input type="range" min={4} max={32} value={radius}
                  onChange={(e) => { setRadius(Number(e.target.value)); saveState.setDirty(true); }} className="w-full max-w-sm" />
                <span className="text-xs text-zinc-500">{radius}px</span>
              </label>
            </div>
          </div>

          {/* Vista previa */}
          <div className="admin-preview-pane">
            <div className="admin-panel-card">
              <div className="admin-panel-card-header">Vista previa</div>
              <div className="p-5" style={{ background: "#0b0d12" }}>
                <div style={{ fontFamily: fontOption.stack }} className="text-2xl font-bold text-zinc-100">
                  Título con la tipografía elegida
                  <div className="mt-2 text-sm font-normal text-zinc-400">Y este es el aspecto del cuerpo de texto.</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-950" style={{ background: primary, borderRadius: radius }}>
                    Botón principal
                  </span>
                  <span className="rounded-full px-4 py-2 text-sm text-zinc-200" style={{ border: "1px solid " + primary, color: primary, borderRadius: radius }}>
                    Botón secundario
                  </span>
                </div>
                <div className="mt-4 rounded-xl border border-zinc-800 p-4" style={{ borderRadius: Math.max(radius, 10) }}>
                  <p className="text-sm text-zinc-300">Tarjeta con esquinas redondeadas, siguiendo el radio elegido.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}