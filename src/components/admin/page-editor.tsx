"use client";

import { useCallback, useState } from "react";
import { deletePageAction, updatePage } from "@/app/admin/actions";
import { SectionsEditor } from "@/components/admin/sections-editor";
import { useAdminSave } from "@/app/admin/shell";
import { slugify } from "@/lib/slug";
import type { DbPage } from "@/lib/data";
import type { MenuCategory } from "@/lib/data";

const inputCls =
  "w-full bg-zinc-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

export function PageEditor({ page, menu }: { page: DbPage; menu: MenuCategory[] }) {
  const saveState = useAdminSave();
  const [name, setName] = useState(page.name);
  const [slug, setSlug] = useState(page.slug);
  const [visible, setVisible] = useState(page.visible);
  const [seo, setSeo] = useState<Record<string, string>>({ ...page.seo });

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
