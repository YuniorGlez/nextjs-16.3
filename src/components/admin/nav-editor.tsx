"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import { useAdminSave, useToast } from "@/app/admin/shell";
import type { NavItemConfig } from "@/lib/nav";

type PageOption = { slug: string; name: string; visible: boolean };

const inputCls =
  "w-full bg-zinc-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

const iconBtnCls =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-sm text-zinc-400 transition hover:border-amber-500 hover:text-amber-400 disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-zinc-400";

/** Quita los campos vacíos antes de guardar. */
function cleanItem(item: NavItemConfig): NavItemConfig {
  const out: NavItemConfig = {};
  if (item.label?.trim()) out.label = item.label.trim();
  if (item.pageSlug?.trim()) out.pageSlug = item.pageSlug.trim();
  if (item.href?.trim()) out.href = item.href.trim();
  const children = (item.children ?? []).map(cleanItem).filter((c) => c.pageSlug || c.href);
  if (children.length) out.children = children;
  return out;
}

function PageSelect({
  value,
  onChange,
  pages,
  placeholder,
}: {
  value: string;
  onChange: (slug: string) => void;
  pages: PageOption[];
  placeholder: string;
}) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {pages.map((p) => (
        <option key={p.slug} value={p.slug}>
          {p.name}
          {p.visible ? "" : " (oculta)"}
        </option>
      ))}
    </select>
  );
}

function MoveButtons({
  onUp,
  onDown,
  onRemove,
  upDisabled,
  downDisabled,
  removeLabel,
  upLabel,
  downLabel,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
  removeLabel: string;
  upLabel: string;
  downLabel: string;
}) {
  return (
    <div className="flex gap-1">
      <button type="button" className={iconBtnCls} aria-label={upLabel} onClick={onUp} disabled={upDisabled}>
        ↑
      </button>
      <button type="button" className={iconBtnCls} aria-label={downLabel} onClick={onDown} disabled={downDisabled}>
        ↓
      </button>
      <button type="button" className={iconBtnCls} aria-label={removeLabel} onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}

function ItemRow({
  item,
  pages,
  onPatch,
  onUp,
  onDown,
  onRemove,
  upDisabled,
  downDisabled,
}: {
  item: NavItemConfig;
  pages: PageOption[];
  onPatch: (patch: Partial<NavItemConfig>) => void;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
}) {
  return (
    <div className="grid items-center gap-2" style={{ gridTemplateColumns: "1fr 1.2fr 1fr auto" }}>
      <input
        className={inputCls}
        placeholder="Texto (opcional)"
        value={item.label ?? ""}
        onChange={(e) => onPatch({ label: e.target.value })}
      />
      <PageSelect value={item.pageSlug ?? ""} onChange={(slug) => onPatch({ pageSlug: slug })} pages={pages} placeholder="— Sin página —" />
      <input
        className={inputCls}
        placeholder="Enlace externo (https://…)"
        value={item.href ?? ""}
        onChange={(e) => onPatch({ href: e.target.value })}
      />
      <MoveButtons
        onUp={onUp}
        onDown={onDown}
        onRemove={onRemove}
        upDisabled={upDisabled}
        downDisabled={downDisabled}
        upLabel="Subir"
        downLabel="Bajar"
        removeLabel="Eliminar ítem"
      />
    </div>
  );
}

function ItemCard({
  item,
  index,
  total,
  pages,
  onPatch,
  onMove,
  onRemove,
  onPatchChild,
  onMoveChild,
  onRemoveChild,
  onAddChild,
}: {
  item: NavItemConfig;
  index: number;
  total: number;
  pages: PageOption[];
  onPatch: (patch: Partial<NavItemConfig>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onPatchChild: (ci: number, patch: Partial<NavItemConfig>) => void;
  onMoveChild: (ci: number, dir: -1 | 1) => void;
  onRemoveChild: (ci: number) => void;
  onAddChild: () => void;
}) {
  const children = item.children ?? [];
  return (
    <div className="mb-3 rounded-xl border border-white/10 bg-zinc-950 p-3">
      <ItemRow
        item={item}
        pages={pages}
        onPatch={onPatch}
        onUp={() => onMove(-1)}
        onDown={() => onMove(1)}
        onRemove={onRemove}
        upDisabled={index === 0}
        downDisabled={index === total - 1}
      />

      {children.length > 0 && (
        <div className="mt-3 space-y-2 border-l border-white/10 pl-4">
          {children.map((child, ci) => (
            <ItemRow
              key={ci}
              item={child}
              pages={pages}
              onPatch={(patch) => onPatchChild(ci, patch)}
              onUp={() => onMoveChild(ci, -1)}
              onDown={() => onMoveChild(ci, 1)}
              onRemove={() => onRemoveChild(ci)}
              upDisabled={ci === 0}
              downDisabled={ci === children.length - 1}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="mt-3 rounded-lg border border-dashed border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-amber-500 hover:text-amber-400"
        onClick={onAddChild}
      >
        ＋ Añadir hijo (submenú)
      </button>
    </div>
  );
}

export function NavEditor({ initial, pages }: { initial: unknown; pages: PageOption[] }) {
  const raw = (typeof initial === "object" && initial !== null ? initial : {}) as Record<string, unknown>;
  const initialItems = Array.isArray(raw.items) ? (raw.items as NavItemConfig[]) : [];
  const initialCta = (typeof raw.cta === "object" && raw.cta !== null ? raw.cta : {}) as Record<string, unknown>;

  const [items, setItems] = useState<NavItemConfig[]>(initialItems);
  const [cta, setCta] = useState({ label: String(initialCta.label ?? ""), href: String(initialCta.href ?? "") });
  const [addPage, setAddPage] = useState("");

  const saveState = useAdminSave();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    saveState.setSave(async () => {
      saveState.setSaving(true);
      try {
        const cleanItems = items.map(cleanItem).filter((i) => i.pageSlug || i.href || i.children?.length);
        const cleanCta = { label: cta.label.trim(), href: cta.href.trim() };
        await saveSettings({
          nav: { items: cleanItems, cta: cleanCta.label && cleanCta.href ? cleanCta : undefined },
        });
        saveState.setDirty(false);
        toast.push("Menú guardado.");
        router.refresh();
      } catch {
        toast.push("No se pudo guardar.", "error");
      } finally {
        saveState.setSaving(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, cta]);

  const mark = () => saveState.setDirty(true);

  const patchItem = (i: number, patch: Partial<NavItemConfig>) => {
    setItems((list) => list.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
    mark();
  };

  const moveItem = (i: number, dir: -1 | 1) => {
    setItems((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
    mark();
  };

  const removeItem = (i: number) => {
    setItems((list) => list.filter((_, idx) => idx !== i));
    mark();
  };

  const addPageItem = () => {
    const slug = addPage.trim();
    if (!slug) {
      toast.push("Elige una página del desplegable.", "error");
      return;
    }
    setItems((list) => [...list, { pageSlug: slug }]);
    setAddPage("");
    mark();
  };

  const addExternalItem = () => {
    setItems((list) => [...list, { label: "", href: "" }]);
    mark();
  };

  const patchChild = (i: number, ci: number, patch: Partial<NavItemConfig>) => {
    setItems((list) =>
      list.map((it, idx) =>
        idx === i
          ? { ...it, children: (it.children ?? []).map((c, cidx) => (cidx === ci ? { ...c, ...patch } : c)) }
          : it,
      ),
    );
    mark();
  };

  const moveChild = (i: number, ci: number, dir: -1 | 1) => {
    setItems((list) =>
      list.map((it, idx) => {
        if (idx !== i) return it;
        const children = [...(it.children ?? [])];
        const j = ci + dir;
        if (j < 0 || j >= children.length) return it;
        [children[ci], children[j]] = [children[j], children[ci]];
        return { ...it, children };
      }),
    );
    mark();
  };

  const removeChild = (i: number, ci: number) => {
    setItems((list) =>
      list.map((it, idx) =>
        idx === i ? { ...it, children: (it.children ?? []).filter((_, cidx) => cidx !== ci) } : it,
      ),
    );
    mark();
  };

  const addChild = (i: number) => {
    setItems((list) =>
      list.map((it, idx) => (idx === i ? { ...it, children: [...(it.children ?? []), { label: "", href: "" }] } : it)),
    );
    mark();
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Menú de navegación</h1>
        <p>
          Elige qué páginas salen en la barra de navegación y en qué orden, con submenús y un botón destacado (CTA).
        </p>
      </div>

      <section className="admin-section">
        <div className="admin-panel-card p-5">
          <div className="admin-guidance">
            <strong>¿Cómo funciona?</strong>
            <ul className="admin-guidance-list">
              <li>
                Sin ítems, la nav muestra automáticamente <b>Inicio</b> + todas las páginas visibles (como antes).
              </li>
              <li>
                Si ningún ítem apunta a la home (<code className="rounded bg-zinc-800 px-1">/</code>), se añade{' '}
                <b>Inicio</b> al principio automáticamente.
              </li>
              <li>Cada ítem puede tener un submenú de hijos y un texto propio (si lo dejas vacío, se usa el de la página).</li>
            </ul>
          </div>

          <div className="mt-4">
            {items.length === 0 && (
              <div className="admin-empty mb-3">
                Todavía no hay ítems configurados: la nav muestra Inicio + todas las páginas visibles.
              </div>
            )}

            {items.map((item, i) => (
              <ItemCard
                key={i}
                item={item}
                index={i}
                total={items.length}
                pages={pages}
                onPatch={(patch) => patchItem(i, patch)}
                onMove={(dir) => moveItem(i, dir)}
                onRemove={() => removeItem(i)}
                onPatchChild={(ci, patch) => patchChild(i, ci, patch)}
                onMoveChild={(ci, dir) => moveChild(i, ci, dir)}
                onRemoveChild={(ci) => removeChild(i, ci)}
                onAddChild={() => addChild(i)}
              />
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="max-w-64 flex-1">
              <PageSelect value={addPage} onChange={setAddPage} pages={pages} placeholder="— Añadir página —" />
            </div>
            <button type="button" className="admin-btn admin-btn--sm" onClick={addPageItem}>
              ＋ Añadir página
            </button>
            <button type="button" className="admin-btn admin-btn--sm" onClick={addExternalItem}>
              ＋ Enlace personalizado
            </button>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-panel-card p-5">
          <h3 className="admin-section-title">Botón destacado (CTA)</h3>
          <p className="mb-4 text-xs text-zinc-500">
            Se muestra como botón ámbar al final de la nav. Déjalo vacío para ocultarlo.
          </p>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Texto del botón</span>
              <input
                className={inputCls}
                placeholder="P. ej. Reservar"
                value={cta.label}
                onChange={(e) => {
                  setCta((c) => ({ ...c, label: e.target.value }));
                  mark();
                }}
              />
            </label>
            <label className="admin-field">
              <span>Enlace del botón</span>
              <input
                className={inputCls}
                placeholder="https://… o /contacto"
                value={cta.href}
                onChange={(e) => {
                  setCta((c) => ({ ...c, href: e.target.value }));
                  mark();
                }}
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
