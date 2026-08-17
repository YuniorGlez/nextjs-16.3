"use client";

import { useCallback, useState } from "react";
import { deletePageAction, restorePageVersionAction, updatePage } from "@/app/admin/actions";
import { SectionsEditor } from "@/components/admin/sections-editor";
import { ImageField } from "@/components/admin/image-field";
import { useAdminSave, useToast } from "@/app/admin/shell";
import { slugify } from "@/lib/slug";
import type { DbPage, DbPageVersion } from "@/lib/data";
import type { MenuCategory } from "@/lib/data";

const inputCls =
  "w-full bg-zinc-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

export function PageEditor({
  page,
  menu,
  versions,
}: {
  page: DbPage;
  menu: MenuCategory[];
  versions: DbPageVersion[];
}) {
  const saveState = useAdminSave();
  const toast = useToast();
  const [name, setName] = useState(page.name);
  const [slug, setSlug] = useState(page.slug);
  const [visible, setVisible] = useState(page.visible);
  const [seo, setSeo] = useState<Record<string, string>>({ ...page.seo });
  const [restoring, setRestoring] = useState<number | null>(null);

  const markMeta = () => saveState.setDirty(true);

  const save = useCallback(
    async (
      sections: { key: string; visible: boolean }[],
      content: Record<string, unknown>,
    ) => {
      await updatePage({
        id: page.id,
        name,
        slug,
        visible,
        seo,
        layout: sections,
        content,
      });
    },
    [page.id, name, slug, visible, seo],
  );

  const slugPreview = slugify(slug) || slugify(name) || "…";

  async function handleRestore(v: DbPageVersion) {
    const when = new Date(v.createdAt).toLocaleString("es-ES");
    const unsaved = saveState.dirty
      ? "\n\nSe perderán los cambios sin guardar del editor."
      : "";
    if (!confirm(`¿Restaurar la página a la versión del ${when}?${unsaved}`)) return;
    setRestoring(v.id);
    try {
      const res = await restorePageVersionAction(page.id, v.id);
      if (res.ok) {
        toast.push(
          res.slugChanged
            ? "Versión restaurada. La URL del snapshot ya la usa otra página, se conservó la actual."
            : "Versión restaurada. La página se ha actualizado.",
        );
        // Recarga completa: router.refresh() no resetea el useState de los editores.
        window.location.reload();
      } else {
        toast.push(res.error ?? "No se pudo restaurar la versión.", "error");
        setRestoring(null);
      }
    } catch {
      toast.push("No se pudo restaurar la versión.", "error");
      setRestoring(null);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Editar página</h1>
        <p>
          <a href={`/${slugPreview}`} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
            Ver /{slugPreview} ↗
          </a>
        </p>
      </div>

      <section className="admin-section">
        <div className="admin-panel-card p-5">
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Nombre (aparece en el menú)</span>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  markMeta();
                }}
              />
            </label>
            <label className="admin-field">
              <span>URL (slug)</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-zinc-500">/</span>
                <input
                  className={inputCls}
                  value={slug}
                  placeholder={slugify(name) || "mi-pagina"}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    markMeta();
                  }}
                />
              </div>
            </label>
            <label className="admin-field">
              <span>Visibilidad</span>
              <select
                className={inputCls}
                value={visible ? "1" : "0"}
                onChange={(e) => {
                  setVisible(e.target.value === "1");
                  markMeta();
                }}
              >
                <option value="1">Publicada (visible en la web)</option>
                <option value="0">Oculta (solo en el admin)</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Título SEO (vacío = nombre de la página)</span>
              <input
                className={inputCls}
                value={seo.title ?? ""}
                maxLength={70}
                placeholder={name}
                onChange={(e) => {
                  setSeo((s) => ({ ...s, title: e.target.value }));
                  markMeta();
                }}
              />
            </label>
            <label className="admin-field">
              <span>Descripción SEO</span>
              <textarea
                className={`${inputCls} min-h-16`}
                value={seo.description ?? ""}
                maxLength={200}
                placeholder="Resumen de la página para Google."
                onChange={(e) => {
                  setSeo((s) => ({ ...s, description: e.target.value }));
                  markMeta();
                }}
              />
            </label>
            <label className="admin-field">
              <span>Imagen para compartir (OG)</span>
              <ImageField
                value={seo.ogImage ?? ""}
                onUploaded={(url) => {
                  setSeo((s) => ({ ...s, ogImage: url }));
                  markMeta();
                }}
                onRemove={() => {
                  setSeo((s) => {
                    const { ogImage: _drop, ...rest } = s;
                    return rest;
                  });
                  markMeta();
                }}
                aspect={1200 / 630}
                aiAspect="16:9"
                hint="1200×630 px. Aparece al compartir la página en redes. Recorte y optimización automáticos."
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Pulsa «Guardar» en la barra superior para aplicar cambios en la página (nombre, URL, visibilidad y SEO).
          </p>
        </div>
      </section>

      <SectionsEditor
        initialSections={page.layout.map((l) => ({ key: l.key, visible: l.visible !== false }))}
        initialContent={page.content}
        menu={menu}
        save={save}
        title="Secciones de la página"
        description="Añade, reordena o edita las secciones de esta página. Los cambios se aplican al guardar."
      />

      <section className="admin-section">
        <div className="admin-page-header">
          <h2>Historial de versiones</h2>
          <p>
            Cada guardado crea una versión del estado anterior de la página. Puedes restaurar
            cualquiera de las últimas 20 versiones.
          </p>
        </div>
        <div className="admin-panel-card p-5">
          {versions.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Todavía no hay versiones. Se crearán automáticamente la próxima vez que guardes la página.
            </p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2"
                >
                  <span className="text-sm text-zinc-300">
                    <time dateTime={v.createdAt} suppressHydrationWarning>
                      {new Date(v.createdAt).toLocaleString("es-ES", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </time>
                  </span>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    onClick={() => handleRestore(v)}
                    disabled={restoring === v.id}
                  >
                    {restoring === v.id ? "Restaurando…" : "Restaurar"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="admin-section">
        <form
          action={deletePageAction.bind(null, page.id)}
          onSubmit={(e) => {
            if (!confirm(`¿Eliminar la página «${name}»? Esta acción no se puede deshacer.`)) {
              e.preventDefault();
            }
          }}
        >
          <button type="submit" className="admin-btn admin-btn--danger">
            Eliminar página
          </button>
        </form>
      </div>
    </div>
  );
}
