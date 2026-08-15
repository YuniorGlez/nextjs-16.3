"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import { useAdminSave, useToast } from "@/app/admin/shell";
import { BlobUploader } from "@/components/admin/blob-uploader";
import { siteConfig } from "@/lib/site";
import type { MenuCategory } from "@/lib/data";

type T = Record<string, string>;
type DItem = { icon: string; titulo: string; texto: string };
type NItem = { n: string; t: string };
type SectCfg = { key: string; label: string; visible: boolean };

const SECTIONS: { key: string; label: string; icon: string }[] = [
  { key: "hero", label: "Héroe", icon: "🖼️" },
  { key: "destacados", label: "Destacados", icon: "⭐" },
  { key: "menu", label: "Menú", icon: "📖" },
  { key: "local", label: "El local", icon: "🏠" },
  { key: "galeria", label: "Galería", icon: "🖼️" },
  { key: "contacto", label: "Contacto", icon: "📞" },
];
const inputCls =
  "w-full bg-zinc-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

function arr<I>(v: unknown): I[] {
  return Array.isArray(v) ? (v as I[]) : [];
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function LandingBuilder({ settings, menu }: { settings: Record<string, unknown>; menu: MenuCategory[] }) {
  const router = useRouter();
  const saveState = useAdminSave();
  const toast = useToast();

  const [sections, setSections] = useState<SectCfg[]>(() => {
    const raw = settings.layout as { key: string; visible?: boolean }[] | undefined;
    if (Array.isArray(raw) && raw.length) {
      return raw.map((l) => ({
        key: l.key,
        label: SECTIONS.find((s) => s.key === l.key)?.label ?? l.key,
        visible: l.visible !== false,
      }));
    }
    return SECTIONS.map((s) => ({ ...s, visible: true }));
  });
  const [selected, setSelected] = useState("hero");
  const [hero, setHero] = useState<T>({ ...((settings.hero ?? {}) as T) });
  const [dest, setDest] = useState<DItem[]>(() =>
    arr<DItem>(settings.destacados).map((x) => ({ icon: str(x.icon), titulo: str(x.titulo), texto: str(x.texto) })),
  );
  const [num, setNum] = useState<NItem[]>(() => arr<NItem>(settings.numeros).map((x) => ({ n: str(x.n), t: str(x.t) })));
  const [local, setLocal] = useState<T>({ ...((settings.local ?? {}) as T) });
  const [galeria, setGal] = useState<any>({ ...((settings.galeria ?? {}) as Record<string, unknown>) });

  const mark = () => saveState.setDirty(true);

  useEffect(() => {
    const run = async () => {
      saveState.setSaving(true);
      try {
        await saveSettings({
          layout: sections.map((l) => ({ key: l.key, visible: l.visible })),
          hero,
          destacados: dest,
          numeros: num,
          local,
          galeria,
        });
        saveState.setDirty(false);
        toast.push("Landing guardada. La web está actualizada.");
        router.refresh();
      } catch {
        toast.push("No se pudo guardar.", "error");
      } finally {
        saveState.setSaving(false);
      }
    };
    saveState.setSave(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, hero, dest, num, local, galeria]);

  function move(key: string, dir: -1 | 1) {
    setSections((arrL) => {
      const i = arrL.findIndex((s) => s.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= arrL.length) return arrL;
      const copy = [...arrL];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
    mark();
  }
  function toggleVisible(key: string) {
    setSections((arrL) => arrL.map((s) => (s.key === key ? { ...s, visible: !s.visible } : s)));
    mark();
  }
  function setT(set: (v: T) => void, sub: T, k: string, val: string) {
    set({ ...sub, [k]: val });
    mark();
  }
  function setItem<I>(set: (v: I[]) => void, arrI: I[], i: number, k: keyof I, val: string) {
    const copy = arrI.map((x) => ({ ...x }));
    (copy[i] as Record<string, unknown>)[k as string] = val;
    set(copy);
    mark();
  }

  const galFotos = Array.isArray(galeria.fotos) ? (galeria.fotos as string[]) : [];
  function addFoto(url: string) {
    setGal({ ...galeria, fotos: [...galFotos, url] });
    mark();
  }
  function removeFoto(url: string) {
    setGal({ ...galeria, fotos: galFotos.filter((f) => f !== url) });
    mark();
  }

  function previewItem(key: string) {
    if (key === "hero")
      return (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div
            className="flex h-36 flex-col items-center justify-center bg-cover bg-center text-center"
            style={
              hero.imagen
                ? { backgroundImage: `linear-gradient(rgba(0,0,0,.55),rgba(9,9,11,.88)),url(${hero.imagen})` }
                : { background: "linear-gradient(135deg,#18181b,#27272a)" }
            }
          >
            <div className="px-4">
              <div className="text-[10px] uppercase tracking-[.3em] text-amber-400">{hero.titulo || "Etiqueta"}</div>
              <div className="font-serif text-2xl font-bold">{siteConfig.name}</div>
              <div className="mt-1 text-xs text-zinc-300">{hero.subtitulo || "Subtítulo de tu negocio"}</div>
            </div>
          </div>
        </div>
      );
    if (key === "destacados")
      return (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center">
              <div className="text-xl">{dest[i]?.icon || "🍽️"}</div>
              <div className="mt-1 text-xs font-semibold">{dest[i]?.titulo || "Título"}</div>
              <div className="text-[10px] text-zinc-500">{dest[i]?.texto || "Texto…"}</div>
            </div>
          ))}
        </div>
      );
    if (key === "menu")
      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-center text-sm font-bold text-amber-400">Ver el Menú</div>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {menu.slice(0, 6).map((c) => (
              <span key={c.id} className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">{c.name}</span>
            ))}
            {menu.length > 6 && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">+{menu.length - 6}</span>}
          </div>
          <p className="mt-2 text-center text-[10px] text-zinc-600">La carta se edita en «Carta y precios».</p>
        </div>
      );
    if (key === "local")
      return (
        <div className="rounded-xl border border-zinc-800 p-4">
          <div className="text-[10px] uppercase tracking-widest text-amber-500">{local.etiqueta || "Tu etiqueta"}</div>
          <div className="font-serif text-lg font-bold">{local.titulo || "Tu titular"}</div>
          <p className="mt-1 text-[11px] text-zinc-400">{local.parrafo1 || "Descríbelo en una línea…"}</p>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded border border-zinc-800 p-1 text-center">
                <div className="text-sm font-bold text-amber-400">{num[i]?.n || "–"}</div>
                <div className="text-[8px] text-zinc-500">{num[i]?.t}</div>
              </div>
            ))}
          </div>
        </div>
      );
    if (key === "galeria")
      return (
        <div className="rounded-xl border border-zinc-800 p-4">
          <div className="text-center text-sm font-semibold">{galeria.titulo || "Un vistazo a tu proyecto"}</div>
          {galFotos.length === 0 ? (
            <div className="mt-2 text-center text-[10px] text-zinc-500">Sube fotos para llenar la galería.</div>
          ) : (
            <div className="mt-2 grid grid-cols-4 gap-1">
              {galFotos.slice(0, 4).map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f} src={f} alt="" className="h-12 w-full rounded object-cover" />
              ))}
            </div>
          )}
        </div>
      );
    if (key === "contacto")
      return (
        <div className="rounded-xl border border-zinc-800 p-4 text-center">
          <div className="font-serif text-lg font-bold">Hablemos</div>
          <div className="mt-2 flex justify-center gap-2 text-[10px] text-zinc-400">📞 · 💬 · 📍</div>
        </div>
      );
    return null;
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Builder de la landing</h1>
        <p>Reordena, muestra u oculta secciones, edita el texto y sube fotos. Todo se aplica a la web al pulsar «Guardar».</p>
      </div>

      <section className="admin-section">
        <div className="admin-editor-layout">
          <div className="flex flex-col gap-2">
            {sections.map((s) => {
              const cfg = SECTIONS.find((x) => x.key === s.key) ?? { key: s.key, label: s.key, icon: "📄" };
              return (
                <div
                  key={s.key}
                  className="admin-panel-card cursor-pointer"
                  style={{ opacity: s.visible ? 1 : 0.55, borderColor: selected === s.key ? "var(--admin-accent)" : undefined }}
                  onClick={() => setSelected(s.key)}
                >
                  <div className="admin-panel-card-header" style={{ justifyContent: "space-between" }}>
                    <div className="flex items-center gap-2">
                      <span>{cfg.icon}</span>
                      <span>{s.label}</span>
                      {!s.visible && <span className="admin-badge admin-badge--warn">oculta</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" className="admin-btn admin-btn--sm" title="Arriba" onClick={(e) => { e.stopPropagation(); move(s.key, -1); }}>↑</button>
                      <button type="button" className="admin-btn admin-btn--sm" title="Abajo" onClick={(e) => { e.stopPropagation(); move(s.key, 1); }}>↓</button>
                      <button type="button" className="admin-btn admin-btn--sm" title={s.visible ? "Ocultar" : "Mostrar"} onClick={(e) => { e.stopPropagation(); toggleVisible(s.key); }}>👁</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {selected === "hero" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">📷 Imagen del héroe</h3>
                <BlobUploader onUploaded={(url) => setT(setHero, hero, "imagen", url)} />
                {hero.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hero.imagen} alt="héroe" className="mt-3 max-h-32 w-full rounded-lg border border-white/10 object-cover" />
                ) : null}
                <Field label="Etiqueta"><input className={inputCls} value={hero.titulo ?? ""} onChange={(e) => setT(setHero, hero, "titulo", e.target.value)} /></Field>
                <Field label="Subtítulo"><input className={inputCls} value={hero.subtitulo ?? ""} onChange={(e) => setT(setHero, hero, "subtitulo", e.target.value)} /></Field>
                <Field label="Línea de ubicación"><input className={inputCls} value={hero.ubicacion ?? ""} onChange={(e) => setT(setHero, hero, "ubicacion", e.target.value)} /></Field>
              </div>
            )}

            {selected === "destacados" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">⭐ Tarjetas destacadas</h3>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="mb-2 grid gap-2" style={{ gridTemplateColumns: "56px 1fr 1fr" }}>
                    <input className={inputCls} value={dest[i]?.icon ?? ""} placeholder="Emoji" onChange={(e) => setItem(setDest, dest, i, "icon", e.target.value)} />
                    <input className={inputCls} value={dest[i]?.titulo ?? ""} placeholder="Título" onChange={(e) => setItem(setDest, dest, i, "titulo", e.target.value)} />
                    <input className={inputCls} value={dest[i]?.texto ?? ""} placeholder="Texto" onChange={(e) => setItem(setDest, dest, i, "texto", e.target.value)} />
                  </div>
                ))}
              </div>
            )}

            {selected === "menu" && (
              <div className="admin-panel-card p-4">
                <p className="text-sm text-zinc-400">La sección «Menú» refleja la base de datos. Para cambiar platos y precios ve a <b>Carta y precios</b>. Aquí solo eliges si se muestra y el orden.</p>
              </div>
            )}

            {selected === "local" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">El local + números</h3>
                <Field label="Etiqueta"><input className={inputCls} value={local.etiqueta ?? ""} onChange={(e) => setT(setLocal, local, "etiqueta", e.target.value)} /></Field>
                <Field label="Título"><input className={inputCls} value={local.titulo ?? ""} onChange={(e) => setT(setLocal, local, "titulo", e.target.value)} /></Field>
                <Field label="Párrafo 1"><textarea className={`${inputCls} min-h-16`} value={local.parrafo1 ?? ""} onChange={(e) => setT(setLocal, local, "parrafo1", e.target.value)} /></Field>
                <Field label="Párrafo 2"><textarea className={`${inputCls} min-h-16`} value={local.parrafo2 ?? ""} onChange={(e) => setT(setLocal, local, "parrafo2", e.target.value)} /></Field>
                <h4 className="mb-2 mt-4 text-sm font-semibold text-amber-400">Números destacados</h4>
                <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 2fr" }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="contents">
                      <input className={inputCls} value={num[i]?.n ?? ""} placeholder="Nº" onChange={(e) => setItem(setNum, num, i, "n", e.target.value)} />
                      <input className={inputCls} value={num[i]?.t ?? ""} placeholder="Etiqueta" onChange={(e) => setItem(setNum, num, i, "t", e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected === "galeria" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">Galería de fotos</h3>
                <Field label="Título"><input className={inputCls} value={galeria.titulo ?? ""} onChange={(e) => setT(setGal, galeria, "titulo", e.target.value)} /></Field>
                <Field label="Texto"><textarea className={`${inputCls} min-h-14`} value={galeria.texto ?? ""} onChange={(e) => setT(setGal, galeria, "texto", e.target.value)} /></Field>
                <h4 className="mb-2 mt-4 text-sm font-semibold text-amber-400">Fotos</h4>
                <BlobUploader label="Subir foto a la galería" onUploaded={addFoto} />
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {galFotos.map((f) => (
                    <div key={f} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f} alt="" className="h-20 w-full rounded object-cover" />
                      <button type="button" onClick={() => removeFoto(f)} className="absolute right-1 top-1 rounded bg-red-600 px-1.5 text-xs text-white">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected === "contacto" && (
              <div className="admin-panel-card p-4">
                <p className="text-sm text-zinc-400">Los datos de contacto (teléfono, WhatsApp y dirección) se editan en la sección <b>Contacto</b> del panel.</p>
              </div>
            )}
          </div>

          <div className="admin-preview-pane">
            <div className="admin-panel-card">
              <div className="admin-panel-card-header">Vista previa de la landing</div>
              <div className="p-4" style={{ background: "#0b0d12" }}>
                <div className="space-y-3">
                  {sections.filter((s) => s.visible).map((s) => (
                    <div key={s.key}>{previewItem(s.key)}</div>
                  ))}
                </div>
                <p className="mt-3 text-center text-[10px] text-zinc-600">Así se verá la página (resumen).</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="admin-field" style={{ marginTop: 10 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}