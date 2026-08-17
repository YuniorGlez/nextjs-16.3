"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminSave, useToast } from "@/app/admin/shell";
import { ImageField } from "@/components/admin/image-field";
import { SECTION_DEFS } from "@/lib/sections";
import { siteConfig } from "@/lib/site";
import type { MenuCategory } from "@/lib/data";

type T = Record<string, string>;
type DItem = { icon: string; titulo: string; texto: string };
type NItem = { n: string; t: string };
type TItem = { texto: string; autor: string; rol: string };
type QItem = { pregunta: string; respuesta: string };
type Sect = { key: string; label: string; visible: boolean };

const inputCls =
  "w-full bg-zinc-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

function arr<I>(v: unknown): I[] {
  return Array.isArray(v) ? (v as I[]) : [];
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function SectionsEditor({
  initialSections,
  initialContent,
  menu,
  save,
  title,
  description,
}: {
  initialSections: { key: string; visible: boolean }[];
  initialContent: Record<string, unknown>;
  menu: MenuCategory[];
  save: (
    sections: { key: string; visible: boolean }[],
    content: Record<string, unknown>,
  ) => Promise<void>;
  title: string;
  description: string;
}) {
  const router = useRouter();
  const saveState = useAdminSave();
  const toast = useToast();

  const [sections, setSections] = useState<Sect[]>(() => {
    if (initialSections.length) {
      return initialSections.map((l) => ({
        key: l.key,
        label: SECTION_DEFS.find((s) => s.key === l.key)?.label ?? l.key,
        visible: l.visible !== false,
      }));
    }
    return SECTION_DEFS.map((s) => ({ ...s, visible: true }));
  });
  const [content, setContent] = useState<Record<string, unknown>>(initialContent);
  const [selected, setSelected] = useState<string>(() => sections[0]?.key ?? "hero");

  const mark = () => saveState.setDirty(true);
  function patch(key: string, value: unknown) {
    setContent((c) => ({ ...c, [key]: value }));
    mark();
  }

  useEffect(() => {
    const run = async () => {
      saveState.setSaving(true);
      try {
        await save(
          sections.map(({ key, visible }) => ({ key, visible })),
          content,
        );
        saveState.setDirty(false);
        toast.push("Cambios guardados. La web está actualizada.");
        router.refresh();
      } catch {
        toast.push("No se pudo guardar.", "error");
      } finally {
        saveState.setSaving(false);
      }
    };
    saveState.setSave(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, content, save]);

  /* ---------- helpers de edición ---------- */
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
  function removeSection(key: string) {
    setSections((arrL) => arrL.filter((s) => s.key !== key));
    setContent((c) => {
      const { [key]: _drop, ...rest } = c;
      return rest;
    });
    if (selected === key) setSelected(sections.find((s) => s.key !== key)?.key ?? "");
    mark();
  }
  function addSection(key: string) {
    const def = SECTION_DEFS.find((d) => d.key === key);
    if (!def || sections.some((s) => s.key === key)) return;
    setSections((arrL) => [...arrL, { key: def.key, label: def.label, visible: true }]);
    setSelected(key);
    mark();
  }
  function setObj(key: string, cur: Record<string, unknown>, field: string, val: string) {
    patch(key, { ...cur, [field]: val });
  }
  function setArrItem(key: string, cur: unknown[], i: number, field: string, val: string) {
    const copy = cur.map((x) => ({ ...(x as object) }));
    (copy[i] as Record<string, unknown>)[field] = val;
    patch(key, copy);
  }

  /* ---------- contenido derivado ---------- */
  const hero = (content.hero ?? {}) as T;
  const cabecera = (content.cabecera ?? {}) as T;
  const texto = (content.texto ?? {}) as { titulo?: string; parrafos?: string[] };
  const dest = arr<DItem>(content.destacados);
  const num = arr<NItem>(content.numeros);
  const local = (content.local ?? {}) as T;
  const galeria = (content.galeria ?? {}) as Record<string, unknown>;
  const testis = arr<TItem>(content.testimonios);
  const faqs = arr<QItem>(content.faq);
  const cta = (content.cta ?? {}) as T;

  const galFotos = Array.isArray(galeria.fotos) ? (galeria.fotos as string[]) : [];
  function addFoto(url: string) {
    patch("galeria", { ...galeria, fotos: [...galFotos, url] });
  }
  function removeFoto(url: string) {
    patch("galeria", { ...galeria, fotos: galFotos.filter((f) => f !== url) });
  }

  const textoParrafos = Array.isArray(texto.parrafos)
    ? texto.parrafos.filter((p): p is string => typeof p === "string")
    : [];
  function setParrafo(i: number, val: string) {
    const copy = [...textoParrafos];
    copy[i] = val;
    patch("texto", { ...texto, parrafos: copy });
  }
  function addParrafo() {
    patch("texto", { ...texto, parrafos: [...textoParrafos, ""] });
  }
  function removeParrafo(i: number) {
    patch("texto", { ...texto, parrafos: textoParrafos.filter((_, j) => j !== i) });
  }

  /* ---------- vista previa ---------- */
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
              <div className="font-serif text-2xl font-bold">{hero.h1 || siteConfig.name}</div>
              <div className="mt-1 text-xs text-zinc-300">{hero.subtitulo || "Subtítulo de tu negocio"}</div>
            </div>
          </div>
        </div>
      );
    if (key === "cabecera")
      return (
        <div className="rounded-xl bg-zinc-950 p-5 text-center">
          <div className="font-serif text-xl font-bold">{cabecera.titulo || "Título de la página"}</div>
          <div className="mt-1 text-[11px] text-zinc-400">{cabecera.subtitulo || "Subtítulo"}</div>
        </div>
      );
    if (key === "texto")
      return (
        <div className="rounded-xl border border-zinc-800 p-4">
          <div className="font-serif text-base font-bold">{texto.titulo || "Título del contenido"}</div>
          {textoParrafos.length === 0 ? (
            <div className="mt-2 text-[10px] text-zinc-500">Añade párrafos en el editor.</div>
          ) : (
            <div className="mt-2 space-y-1.5">
              {textoParrafos.slice(0, 3).map((p, i) => (
                <p key={i} className="text-[10px] leading-4 text-zinc-400">{p || "…"}</p>
              ))}
            </div>
          )}
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
    if (key === "numeros")
      return (
        <div className="grid grid-cols-4 gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-center">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className="text-sm font-bold text-amber-400">{num[i]?.n || "–"}</div>
              <div className="text-[8px] text-zinc-500">{num[i]?.t}</div>
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
        <div className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-zinc-800 p-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-amber-500">{local.etiqueta || "Tu etiqueta"}</div>
            <div className="font-serif text-lg font-bold">{local.titulo || "Tu titular"}</div>
            <p className="mt-1 text-[11px] text-zinc-400">{local.parrafo1 || "Descríbelo en una línea…"}</p>
          </div>
          {local.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={local.imagen} alt="" className="h-16 w-24 rounded-lg object-cover" />
          ) : (
            <div className="h-16 w-24 rounded-lg bg-zinc-800" />
          )}
        </div>
      );
    if (key === "galeria")
      return (
        <div className="rounded-xl border border-zinc-800 p-4">
          <div className="text-center text-sm font-semibold">{str(galeria.titulo) || "Un vistazo a tu proyecto"}</div>
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
    if (key === "testimonios")
      return (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="text-[9px] leading-4 text-zinc-400">“{testis[i]?.texto || "Testimonio…"}"</div>
              <div className="mt-2 text-[10px] font-semibold">{testis[i]?.autor || "Autor"}</div>
              <div className="text-[8px] text-zinc-500">{testis[i]?.rol}</div>
            </div>
          ))}
        </div>
      );
    if (key === "faq")
      return (
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
              <div className="flex items-center justify-between text-[10px] font-semibold">
                {faqs[i]?.pregunta || "Pregunta frecuente…"}
                <span className="text-amber-400">＋</span>
              </div>
            </div>
          ))}
        </div>
      );
    if (key === "cta")
      return (
        <div className="rounded-xl bg-zinc-950 p-5 text-center">
          <div className="font-serif text-base font-bold">{cta.titulo || "¿Hablamos?"}</div>
          <div className="mt-1 text-[10px] text-zinc-400">{cta.texto}</div>
          <div className="mt-2 inline-block rounded-full bg-amber-500 px-3 py-1 text-[10px] font-semibold text-zinc-950">
            {cta.boton || "Contactar"}
          </div>
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

  const available = SECTION_DEFS.filter((d) => !sections.some((s) => s.key === d.key));

  return (
    <div>
      <div className="admin-page-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <section className="admin-section">
        <div className="admin-editor-layout">
          <div className="flex flex-col gap-2">
            {sections.map((s) => {
              const cfg = SECTION_DEFS.find((x) => x.key === s.key) ?? { key: s.key, label: s.key, icon: "📄" };
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
                      <button type="button" className="admin-btn admin-btn--sm" title="Quitar sección" onClick={(e) => { e.stopPropagation(); removeSection(s.key); }}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {available.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <select
                  className={inputCls}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addSection(e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="">+ Añadir sección…</option>
                  {available.map((d) => (
                    <option key={d.key} value={d.key}>{d.icon} {d.label}</option>
                  ))}
                </select>
              </div>
            )}

            {selected === "hero" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">📷 Imagen del héroe</h3>
                <ImageField
                  value={hero.imagen ?? ""}
                  onUploaded={(url) => setObj("hero", hero, "imagen", url)}
                  onRemove={() => setObj("hero", hero, "imagen", "")}
                  aspect={16 / 9}
                  aiAspect="16:9"
                />
                <Field label="Etiqueta (badge superior)"><input className={inputCls} value={hero.titulo ?? ""} onChange={(e) => setObj("hero", hero, "titulo", e.target.value)} /></Field>
                <Field label="Titular principal (H1)"><input className={inputCls} value={hero.h1 ?? ""} onChange={(e) => setObj("hero", hero, "h1", e.target.value)} /></Field>
                <Field label="Subtítulo"><input className={inputCls} value={hero.subtitulo ?? ""} onChange={(e) => setObj("hero", hero, "subtitulo", e.target.value)} /></Field>
                <Field label="Botón principal (texto)"><input className={inputCls} value={hero.cta1 ?? ""} onChange={(e) => setObj("hero", hero, "cta1", e.target.value)} /></Field>
                <Field label="Botón principal (enlace)"><input className={inputCls} value={hero.cta1Url ?? ""} placeholder="#contacto" onChange={(e) => setObj("hero", hero, "cta1Url", e.target.value)} /></Field>
                <Field label="Botón secundario (texto)"><input className={inputCls} value={hero.cta2 ?? ""} onChange={(e) => setObj("hero", hero, "cta2", e.target.value)} /></Field>
                <Field label="Botón secundario (enlace)"><input className={inputCls} value={hero.cta2Url ?? ""} placeholder="#sobre-nosotros" onChange={(e) => setObj("hero", hero, "cta2Url", e.target.value)} /></Field>
                <Field label="Línea de ubicación"><input className={inputCls} value={hero.ubicacion ?? ""} onChange={(e) => setObj("hero", hero, "ubicacion", e.target.value)} /></Field>
              </div>
            )}

            {selected === "cabecera" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">📌 Cabecera de la página</h3>
                <Field label="Título"><input className={inputCls} value={cabecera.titulo ?? ""} onChange={(e) => setObj("cabecera", cabecera, "titulo", e.target.value)} /></Field>
                <Field label="Subtítulo"><input className={inputCls} value={cabecera.subtitulo ?? ""} onChange={(e) => setObj("cabecera", cabecera, "subtitulo", e.target.value)} /></Field>
              </div>
            )}

            {selected === "texto" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">📝 Contenido de la página</h3>
                <Field label="Título del contenido"><input className={inputCls} value={texto.titulo ?? ""} onChange={(e) => patch("texto", { ...texto, titulo: e.target.value })} /></Field>
                <div className="mb-2 mt-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-amber-400">Párrafos</h4>
                  <button type="button" className="admin-btn admin-btn--sm" onClick={addParrafo}>+ Añadir párrafo</button>
                </div>
                {textoParrafos.map((p, i) => (
                  <div key={i} className="mb-2">
                    <textarea
                      className={`${inputCls} min-h-16`}
                      value={p}
                      placeholder={`Párrafo ${i + 1}`}
                      onChange={(e) => setParrafo(i, e.target.value)}
                    />
                    <button type="button" className="mt-1 text-xs text-red-400 hover:underline" onClick={() => removeParrafo(i)}>
                      Quitar párrafo
                    </button>
                  </div>
                ))}
                {textoParrafos.length === 0 && (
                  <p className="text-xs text-zinc-500">Todavía no hay párrafos. Añade el primero.</p>
                )}
              </div>
            )}

            {selected === "destacados" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">⭐ Tarjetas destacadas</h3>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="mb-2 grid gap-2" style={{ gridTemplateColumns: "56px 1fr 1fr" }}>
                    <input className={inputCls} value={dest[i]?.icon ?? ""} placeholder="Emoji" onChange={(e) => setArrItem("destacados", dest, i, "icon", e.target.value)} />
                    <input className={inputCls} value={dest[i]?.titulo ?? ""} placeholder="Título" onChange={(e) => setArrItem("destacados", dest, i, "titulo", e.target.value)} />
                    <input className={inputCls} value={dest[i]?.texto ?? ""} placeholder="Texto" onChange={(e) => setArrItem("destacados", dest, i, "texto", e.target.value)} />
                  </div>
                ))}
              </div>
            )}

            {selected === "numeros" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">🔢 Números destacados</h3>
                <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 2fr" }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="contents">
                      <input className={inputCls} value={num[i]?.n ?? ""} placeholder="Nº (100+)" onChange={(e) => setArrItem("numeros", num, i, "n", e.target.value)} />
                      <input className={inputCls} value={num[i]?.t ?? ""} placeholder="Etiqueta" onChange={(e) => setArrItem("numeros", num, i, "t", e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected === "menu" && (
              <div className="admin-panel-card p-4">
                <p className="text-sm text-zinc-400">La sección «Menú» refleja la base de datos. Para cambiar platos y precios ve a <b>Carta y precios</b>. Aquí solo eliges si se muestra y el orden.</p>
              </div>
            )}

            {selected === "local" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">🏠 Sobre nosotros</h3>
                <ImageField
                  value={local.imagen ?? ""}
                  onUploaded={(url) => setObj("local", local, "imagen", url)}
                  onRemove={() => setObj("local", local, "imagen", "")}
                  aspect={3 / 2}
                  aiAspect="3:2"
                  label="Imagen de la sección"
                />
                <Field label="Etiqueta"><input className={inputCls} value={local.etiqueta ?? ""} onChange={(e) => setObj("local", local, "etiqueta", e.target.value)} /></Field>
                <Field label="Título"><input className={inputCls} value={local.titulo ?? ""} onChange={(e) => setObj("local", local, "titulo", e.target.value)} /></Field>
                <Field label="Párrafo 1"><textarea className={`${inputCls} min-h-16`} value={local.parrafo1 ?? ""} onChange={(e) => setObj("local", local, "parrafo1", e.target.value)} /></Field>
                <Field label="Párrafo 2"><textarea className={`${inputCls} min-h-16`} value={local.parrafo2 ?? ""} onChange={(e) => setObj("local", local, "parrafo2", e.target.value)} /></Field>
              </div>
            )}

            {selected === "galeria" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">Galería de fotos</h3>
                <Field label="Título"><input className={inputCls} value={str(galeria.titulo)} onChange={(e) => setObj("galeria", galeria, "titulo", e.target.value)} /></Field>
                <Field label="Texto"><textarea className={`${inputCls} min-h-14`} value={str(galeria.texto)} onChange={(e) => setObj("galeria", galeria, "texto", e.target.value)} /></Field>
                <h4 className="mb-2 mt-4 text-sm font-semibold text-amber-400">Fotos</h4>
                <ImageField
                  value=""
                  onUploaded={addFoto}
                  aspect={4 / 3}
                  aiAspect="4:5"
                  label="Añadir foto a la galería"
                />
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

            {selected === "testimonios" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">💬 Testimonios</h3>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="mb-3 rounded-lg border border-white/10 p-3">
                    <div className="mb-1 text-[11px] font-semibold text-amber-400">Testimonio {i + 1}</div>
                    <textarea className={`${inputCls} min-h-14`} value={testis[i]?.texto ?? ""} placeholder="Texto del testimonio" onChange={(e) => setArrItem("testimonios", testis, i, "texto", e.target.value)} />
                    <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <input className={inputCls} value={testis[i]?.autor ?? ""} placeholder="Autor" onChange={(e) => setArrItem("testimonios", testis, i, "autor", e.target.value)} />
                      <input className={inputCls} value={testis[i]?.rol ?? ""} placeholder="Rol / empresa" onChange={(e) => setArrItem("testimonios", testis, i, "rol", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selected === "faq" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">❓ Preguntas frecuentes</h3>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="mb-3 rounded-lg border border-white/10 p-3">
                    <div className="mb-1 text-[11px] font-semibold text-amber-400">Pregunta {i + 1}</div>
                    <input className={inputCls} value={faqs[i]?.pregunta ?? ""} placeholder="Pregunta" onChange={(e) => setArrItem("faq", faqs, i, "pregunta", e.target.value)} />
                    <textarea className={`${inputCls} mt-2 min-h-14`} value={faqs[i]?.respuesta ?? ""} placeholder="Respuesta" onChange={(e) => setArrItem("faq", faqs, i, "respuesta", e.target.value)} />
                  </div>
                ))}
              </div>
            )}

            {selected === "cta" && (
              <div className="admin-panel-card p-4">
                <h3 className="mb-3 font-semibold">🚀 Llamada a la acción final</h3>
                <Field label="Título"><input className={inputCls} value={cta.titulo ?? ""} onChange={(e) => setObj("cta", cta, "titulo", e.target.value)} /></Field>
                <Field label="Texto"><textarea className={`${inputCls} min-h-14`} value={cta.texto ?? ""} onChange={(e) => setObj("cta", cta, "texto", e.target.value)} /></Field>
                <Field label="Texto del botón"><input className={inputCls} value={cta.boton ?? ""} onChange={(e) => setObj("cta", cta, "boton", e.target.value)} /></Field>
                <Field label="Enlace del botón"><input className={inputCls} value={cta.botonUrl ?? ""} placeholder="#contacto" onChange={(e) => setObj("cta", cta, "botonUrl", e.target.value)} /></Field>
              </div>
            )}

            {selected === "contacto" && (
              <div className="admin-panel-card p-4">
                <p className="text-sm text-zinc-400">Los datos de contacto (teléfono, WhatsApp, email y dirección) se editan en la sección <b>Contacto</b> del panel, y son comunes a toda la web.</p>
              </div>
            )}
          </div>

          <div className="admin-preview-pane">
            <div className="admin-panel-card">
              <div className="admin-panel-card-header">Vista previa de la página</div>
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
