"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMenu } from "@/app/admin/actions";
import { useAdminSave, useToast } from "@/app/admin/shell";
import type { MenuCategory } from "@/lib/data";

type Row = {
  key: string;
  name: string;
  description: string;
  price: string;
};
type Cat = {
  key: string;
  name: string;
  emoji: string;
  items: Row[];
};

const inputCls =
  "w-full bg-zinc-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

export function CartaEditor({ categories }: { categories: MenuCategory[] }) {
  const router = useRouter();
  const saveState = useAdminSave();
  const toast = useToast();

  const [cats, setCats] = useState<Cat[]>(() =>
    categories.map((c) => ({
      key: `c-${c.id}`,
      name: c.name,
      emoji: c.emoji,
      items: c.items.map((it) => ({
        key: `i-${it.id}`,
        name: it.name,
        description: it.description,
        price: it.price,
      })),
    })),
  );
  const [selected, setSelected] = useState<string>(cats[0]?.key ?? "");

  useEffect(() => {
    if (!selected && cats.length > 0) setSelected(cats[0].key);
  }, [cats, selected]);

  // Envía los cambios a BD con el botón Guardar de la topbar.
  useEffect(() => {
    const run = async () => {
      saveState.setSaving(true);
      try {
        await saveMenu(
          cats.map((c) => ({
            name: c.name,
            emoji: c.emoji,
            items: c.items.map((i) => ({
              name: i.name,
              description: i.description,
              price: i.price,
            })),
          })),
        );
        saveState.setDirty(false);
        toast.push("Carta guardada. La web está actualizada.");
        router.refresh();
      } catch {
        toast.push("No se pudo guardar la carta.", "error");
      } finally {
        saveState.setSaving(false);
      }
    };
    saveState.setSave(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats]);

  function patchCat(key: string, patch: Partial<Cat>) {
    setCats((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));
    dirtyState();
  }
  function dirtyState() {
    saveState.setDirty(true);
  }
  function patchItem(catKey: string, itemKey: string, patch: Partial<Row>) {
    setCats((cs) =>
      cs.map((c) =>
        c.key === catKey
          ? { ...c, items: c.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)) }
          : c,
      ),
    );
    dirtyState();
  }

  function addCategory() {
    const key = `c-new-${Date.now()}`;
    setCats((cs) => [...cs, { key, name: "Nueva categoría", emoji: "🍽️", items: [] }]);
    setSelected(key);
    dirtyState();
  }
  function removeCategory(key: string) {
    setCats((cs) => cs.filter((c) => c.key !== key));
    if (selected === key) setSelected("");
    dirtyState();
  }
  function addItem(catKey: string) {
    const key = `i-new-${Date.now()}`;
    setCats((cs) =>
      cs.map((c) => (c.key === catKey ? { ...c, items: [...c.items, { key, name: "", description: "", price: "" }] } : c)),
    );
    dirtyState();
  }
  function removeItem(catKey: string, itemKey: string) {
    setCats((cs) =>
      cs.map((c) => (c.key === catKey ? { ...c, items: c.items.filter((i) => i.key !== itemKey) } : c)),
    );
    dirtyState();
  }

  const activeCat = cats.find((c) => c.key === selected);

  return (
    <div>
      <div className="admin-page-header">
        <h1>Carta y precios</h1>
        <p>Edita categorías, platos y precios. Los cambios se aplican a la web cuando pulses «Guardar».</p>
      </div>

      <section className="admin-section">
        <div className="admin-editor-layout">
          {/* Panel de edición */}
          <div className="flex flex-col gap-4">
            {cats.length === 0 && <div className="admin-empty">No hay categorías. Añade la primera abajo.</div>}
            {cats.map((c) => (
              <div key={c.key} className="admin-panel-card">
                <div className="admin-panel-card-header">
                  <button type="button" onClick={() => setSelected(c.key)} className="admin-btn admin-btn--sm admin-btn--secondary" title="Vista previa">
                    👁
                  </button>
                  <input className={inputCls} style={{ width: 56 }} value={c.emoji} maxLength={4}
                    onChange={(e) => patchCat(c.key, { emoji: e.target.value })} />
                  <input className={inputCls} style={{ flex: 1 }} value={c.name}
                    onChange={(e) => patchCat(c.key, { name: e.target.value })} />
                  <button type="button" className="admin-btn admin-btn--sm admin-btn--danger"
                    onClick={() => confirm("Borrar esta categoría y sus platos?") && removeCategory(c.key)}>
                    Borrar
                  </button>
                </div>
                <div className="p-4">
                  {c.items.map((it, idx) => (
                    <div key={it.key} className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs text-zinc-600 w-4">{idx + 1}</span>
                      <input className={inputCls} style={{ flex: "2 1 200px" }} value={it.name} placeholder="Plato"
                        onChange={(e) => patchItem(c.key, it.key, { name: e.target.value })} />
                      <input className={inputCls} style={{ flex: "2 1 180px" }} value={it.description} placeholder="Descripción"
                        onChange={(e) => patchItem(c.key, it.key, { description: e.target.value })} />
                      <input className={inputCls} style={{ flex: "1 1 110px" }} value={it.price} placeholder="Precio"
                        onChange={(e) => patchItem(c.key, it.key, { price: e.target.value })} />
                      <button type="button" className="admin-btn admin-btn--sm admin-btn--danger"
                        onClick={() => removeItem(c.key, it.key)}>✕</button>
                    </div>
                  ))}
                  <button type="button" className="admin-btn admin-btn--sm" onClick={() => addItem(c.key)}>
                    + Añadir plato
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="admin-btn admin-btn--primary" style={{ alignSelf: "flex-start" }}
              onClick={addCategory}>
              + Añadir categoría
            </button>
          </div>

          {/* Previsualización */}
          <div className="admin-preview-pane">
            <div className="admin-panel-card">
              <div className="admin-panel-card-header">Vista previa</div>
              {activeCat ? (
                <div className="p-5" style={{ background: "#18181b" }}>
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="mb-6 flex items-center justify-center gap-3">
                      <span className="text-3xl">{activeCat.emoji}</span>
                      <h3 className="font-serif text-2xl font-bold text-amber-400">{activeCat.name || "Sin nombre"}</h3>
                    </div>
                    <ul className="space-y-4">
                      {activeCat.items.map((it, i) => (
                        <li key={i} className="flex items-baseline gap-3 border-b border-dashed border-zinc-800 pb-3">
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-100">{it.name || "…"}</p>
                            {it.description && <p className="text-sm text-zinc-500">{it.description}</p>}
                          </div>
                          <div className="mx-1 flex-1" />
                          <span className="whitespace-nowrap font-semibold text-amber-400">{it.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="admin-empty p-5">Selecciona una categoría para ver la vista previa.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}