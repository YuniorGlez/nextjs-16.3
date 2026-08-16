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

/* ---------------- SEO (metadata configurable desde el CMS) ---------------- */
export function SeoEditor({ settings }: { settings: S }) {
  const seo = (settings.seo ?? {}) as Record<string, string>;
  const [draft, setDraft] = useState<S>({ ...seo });
  const saveState = useSave(draft, "seo", () => draft);

  function set(k: string, v: string) {
    setDraft((d) => ({ ...d, [k]: v }));
    saveState.setDirty(true);
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>SEO de la web</h1>
        <p>Configura el título, la descripción y las redes sociales que ven Google y otros buscadores. Déjalo vacío para usar los valores por defecto del proyecto.</p>
      </div>
      <section className="admin-section">
        <div className="admin-panel-card p-5">
          <h3 className="mb-1 font-semibold">Búsqueda (Google)</h3>
          <p className="mb-4 text-xs text-zinc-500">Título: hasta ~60 caracteres. Descripción: hasta ~160 caracteres.</p>
          <div className="admin-form-grid">
            <Field label="Título SEO (title tag)">
              <input className={inputCls} value={String(draft.title ?? "")} maxLength={70} placeholder="Nombre | Tagline" onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Palabras clave (separadas por comas)">
              <input className={inputCls} value={String(draft.keywords ?? "")} placeholder="palabra1, palabra2, palabra3" onChange={(e) => set("keywords", e.target.value)} />
            </Field>
            <Field label="Meta descripción">
              <textarea className={`${inputCls} min-h-20`} value={String(draft.description ?? "")} maxLength={200} placeholder="Resumen de la web que aparece en los resultados." onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="admin-panel-card p-5" style={{ marginTop: 16 }}>
          <h3 className="mb-1 font-semibold">Redes sociales (Open Graph / Twitter)</h3>
          <p className="mb-4 text-xs text-zinc-500">Cómo se ve el enlace al compartirlo en WhatsApp, X, LinkedIn, etc.</p>
          <div className="admin-form-grid">
            <Field label="Título para compartir">
              <input className={inputCls} value={String(draft.ogTitle ?? "")} placeholder="Igual que el título SEO si lo dejas vacío" onChange={(e) => set("ogTitle", e.target.value)} />
            </Field>
            <Field label="Imagen para compartir (URL)">
              <input className={inputCls} value={String(draft.ogImage ?? "")} placeholder="https://…/og-image.png (1200×630)" onChange={(e) => set("ogImage", e.target.value)} />
            </Field>
            <Field label="Descripción para compartir">
              <textarea className={`${inputCls} min-h-20`} value={String(draft.ogDescription ?? "")} placeholder="Igual que la meta descripción si lo dejas vacío" onChange={(e) => set("ogDescription", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="admin-panel-card p-5" style={{ marginTop: 16 }}>
          <h3 className="font-semibold">Vista previa en Google</h3>
          <div className="mt-3 rounded-xl border border-white/10 bg-zinc-950 p-4">
            <div className="text-xs text-emerald-400">{siteUrl()}</div>
            <div className="mt-1 truncate text-lg text-blue-400">
              {String(draft.title ?? "").trim() || "Nombre | Tagline"}
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              {String(draft.description ?? "").trim() || "Descripción por defecto del proyecto."}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function siteUrl() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

/* ---------------- Datos legales (para páginas de cookies/privacidad) ---------------- */
const LEGAL_FIELDS: [string, string, string?][] = [
  ["razonSocial", "Razón social de la empresa"],
  ["cif", "NIF / CIF"],
  ["direccion", "Domicilio fiscal"],
  ["email", "Email legal (derechos RGPD)"],
  ["telefono", "Teléfono"],
  ["registro", "Inscripción registral (Registro Mercantil)"],
  ["dominio", "Dominio público (sin https://)"],
];

export function LegalEditor({ settings }: { settings: S }) {
  const legal = (settings.legal ?? {}) as Record<string, string>;
  const [draft, setDraft] = useState<S>({ ...legal });
  const saveState = useSave(draft, "legal", () => draft);

  function set(k: string, v: string) {
    setDraft((d) => ({ ...d, [k]: v }));
    saveState.setDirty(true);
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Datos legales</h1>
        <p>
          Estos datos se usan para rellenar automáticamente las páginas de <b>Política de cookies</b> y{' '}
          <b>Política de privacidad</b> donde aparecen los tokens{' '}
          <code className="rounded bg-zinc-800 px-1 text-xs">{"{{empresa}}"}</code>,{' '}
          <code className="rounded bg-zinc-800 px-1 text-xs">{"{{cif}}"}</code>,{' '}
          <code className="rounded bg-zinc-800 px-1 text-xs">{"{{direccion}}"}</code>,{' '}
          <code className="rounded bg-zinc-800 px-1 text-xs">{"{{email}}"}</code>,{' '}
          <code className="rounded bg-zinc-800 px-1 text-xs">{"{{telefono}}"}</code>,{' '}
          <code className="rounded bg-zinc-800 px-1 text-xs">{"{{registro}}"}</code> y{' '}
          <code className="rounded bg-zinc-800 px-1 text-xs">{"{{dominio}}"}</code>.
        </p>
      </div>
      <section className="admin-section">
        <div className="admin-panel-card p-5">
          <div className="admin-form-grid">
            {LEGAL_FIELDS.map(([k, label]) => (
              <Field key={k} label={label}>
                <input
                  className={inputCls}
                  value={String(draft[k] ?? "")}
                  placeholder="—"
                  onChange={(e) => set(k, e.target.value)}
                />
              </Field>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Aparecen también en el pie de página (razón social y CIF). Pulsa «Guardar» para aplicar los cambios.
          </p>
        </div>
      </section>
    </div>
  );
}