"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import { useAdminSave, useToast } from "@/app/admin/shell";

type S = Record<string, unknown>;

const inputCls =
  "w-full bg-zinc-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function useSave(draft: S, key: string, getValue: () => S) {
  const saveState = useAdminSave();
  const toast = useToast();
  const router = useRouter();
  useEffect(() => {
    saveState.setSave(async () => {
      saveState.setSaving(true);
      try {
        await saveSettings({ [key]: getValue() });
        saveState.setDirty(false);
        toast.push("Cambios guardados.");
        router.refresh();
      } catch {
        toast.push("No se pudo guardar.", "error");
      } finally {
        saveState.setSaving(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, key]);
  return saveState;
}

/* ---------------- Contacto ---------------- */
const CONTACT_FIELDS: [string, string][] = [
  ["telefono", "Teléfono (se muestra en la web)"],
  ["telefonoUrl", "Enlace tel: (p.ej. tel:+34922430406)"],
  ["whatsapp", "Enlace WhatsApp (wa.me/…)"],
  ["direccion", "Dirección"],
  ["localidad", "Localidad"],
];

export function ContactoEditor({ contacto }: { contacto: Record<string, string> }) {
  const [draft, setDraft] = useState<S>({ ...contacto });
  const saveState = useSave(draft, "contacto", () => draft);

  function set(k: string, v: string) {
    setDraft((d) => ({ ...d, [k]: v }));
    saveState.setDirty(true);
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Datos de contacto</h1>
        <p>Estos datos aparecen en la sección de contacto de la web. Pulsa «Guardar» para aplicarlos.</p>
      </div>
      <section className="admin-section">
        <div className="admin-panel-card p-5">
          <div className="admin-form-grid">
            {CONTACT_FIELDS.map(([k, label]) => (
              <Field key={k} label={label}>
                <input className={inputCls} value={String(draft[k] ?? "")} onChange={(e) => set(k, e.target.value)} />
              </Field>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Contenido (textos + héroe) ---------------- */
export function ContenidoEditor({ settings }: { settings: S }) {
  const hero = (settings.hero ?? {}) as Record<string, string>;
  const local = (settings.local ?? {}) as Record<string, string>;
  const destacados = (settings.destacados ?? []) as { icon: string; titulo: string; texto: string }[];
  const numeros = (settings.numeros ?? []) as { n: string; t: string }[];
  const galeria = (settings.galeria ?? {}) as Record<string, string>;

  const [h, setH] = useState<S>({ ...hero });
  const [l, setL] = useState<S>({ ...local });
  const [d, setD] = useState<S[]>(destacados.map((x) => ({ ...x })));
  const [n, setN] = useState<S[]>(numeros.map((x) => ({ ...x })));
  const [g, setG] = useState<S>({ ...galeria });

  const saveState = useAdminSave();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    saveState.setSave(async () => {
      saveState.setSaving(true);
      try {
        await saveSettings({ hero: h, local: l, destacados: d, numeros: n, galeria: g });
        saveState.setDirty(false);
        toast.push("Cambios guardados.");
        router.refresh();
      } catch {
        toast.push("No se pudo guardar.", "error");
      } finally {
        saveState.setSaving(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h, l, d, n, g]);

  const mark = () => saveState.setDirty(true);
  const setField = (setter: (d: any) => void, val: any) => {
    setter(val);
    mark();
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Textos y héroe</h1>
        <p>Edita el titular, los destacados, los números y la imagen de arriba de la web. Y cuando termines, pulsa «Guardar».</p>
      </div>

      <section className="admin-section">
        <div className="admin-panel-card p-5">
          <h3 className="mb-3 font-semibold">🖼️ Imagen del héroe</h3>
          <Field label="Fondo del héroe (ruta o URL de imagen)">
            <input className={inputCls} value={String(h.imagen ?? "")} placeholder="/img/hero.jpg o https://…"
              onChange={(e) => setField(setH, { ...h, imagen: e.target.value })} />
          </Field>
          <p className="mt-1 text-xs text-zinc-500">Puedes usar una imagen de public/img o una URL externa.</p>
          {h.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={String(h.imagen)} alt="Héroe" className="mt-3 w-full max-h-48 rounded-lg object-cover border border-white/10" />
          ) : null}
        </div>

        <div className="admin-panel-card p-5" style={{ marginTop: 16 }}>
          <h3 className="admin-section-title" style={{ marginBottom: 12 }}>Texto del héroe</h3>
          <div className="admin-form-grid">
            <Field label="Etiqueta superior"><input className={inputCls} value={String(h.titulo ?? "")} onChange={(e) => setField(setH, { ...h, titulo: e.target.value })} /></Field>
            <Field label="Subtítulo"><input className={inputCls} value={String(h.subtitulo ?? "")} onChange={(e) => setField(setH, { ...h, subtitulo: e.target.value })} /></Field>
            <Field label="Línea de ubicación"><input className={inputCls} value={String(h.ubicacion ?? "")} onChange={(e) => setField(setH, { ...h, ubicacion: e.target.value })} /></Field>
          </div>
        </div>

        <div className="admin-panel-card p-5" style={{ marginTop: 16 }}>
          <h3 className="admin-section-title" style={{ margin: 0, marginBottom: 12 }}>Destacados (3 tarjetas)</h3>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid gap-2 mb-2" style={{ gridTemplateColumns: "64px 1fr 1fr" }}>
              <input className={inputCls} value={String(d[i]?.icon ?? "")} placeholder="Emoji" onChange={(e) => setField(setD, sel(d, i, "icon", e.target.value))} />
              <input className={inputCls} value={String(d[i]?.titulo ?? "")} placeholder="Título" onChange={(e) => setField(setD, sel(d, i, "titulo", e.target.value))} />
              <input className={inputCls} value={String(d[i]?.texto ?? "")} placeholder="Texto" onChange={(e) => setField(setD, sel(d, i, "texto", e.target.value))} />
            </div>
          ))}
        </div>

        <div className="admin-panel-card p-5" style={{ marginTop: 16 }}>
          <h3 className="admin-section-title" style={{ margin: 0, marginBottom: 12 }}>Números destacados (4)</h3>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid gap-2">
                <input className={inputCls} value={String(n[i]?.n ?? "")} placeholder="Nº (16+)" onChange={(e) => setField(setN, sel(n, i, "n", e.target.value))} />
                <input className={inputCls} value={String(n[i]?.t ?? "")} placeholder="Etiqueta" onChange={(e) => setField(setN, sel(n, i, "t", e.target.value))} />
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel-card p-5" style={{ marginTop: 16 }}>
          <h3 className="admin-section-title" style={{ margin: 0, marginBottom: 12 }}>Sección «El local»</h3>
          <div className="admin-form-grid">
            <Field label="Etiqueta"><input className={inputCls} value={String(l.etiqueta ?? "")} onChange={(e) => setField(setL, { ...l, etiqueta: e.target.value })} /></Field>
            <Field label="Título"><input className={inputCls} value={String(l.titulo ?? "")} onChange={(e) => setField(setL, { ...l, titulo: e.target.value })} /></Field>
            <Field label="Párrafo 1"><textarea className={`${inputCls} min-h-20`} value={String(l.parrafo1 ?? "")} onChange={(e) => setField(setL, { ...l, parrafo1: e.target.value })} /></Field>
            <Field label="Párrafo 2"><textarea className={`${inputCls} min-h-20`} value={String(l.parrafo2 ?? "")} onChange={(e) => setField(setL, { ...l, parrafo2: e.target.value })} /></Field>
          </div>
        </div>

        <div className="admin-panel-card p-5" style={{ marginTop: 16 }}>
          <h3 className="admin-section-title" style={{ margin: 0, marginBottom: 12 }}>Galería</h3>
          <div className="admin-form-grid">
            <Field label="Título"><input className={inputCls} value={String(g.titulo ?? "")} onChange={(e) => setField(setG, { ...g, titulo: e.target.value })} /></Field>
            <Field label="Texto"><textarea className={`${inputCls} min-h-16`} value={String(g.texto ?? "")} onChange={(e) => setField(setG, { ...g, texto: e.target.value })} /></Field>
          </div>
        </div>
      </section>
    </div>
  );
}

function sel<T>(arr: T[], i: number, key: keyof T, val: string): T[] {
  const copy = arr.map((x) => ({ ...x }));
  copy[i] = { ...copy[i], [key]: val };
  return copy;
}