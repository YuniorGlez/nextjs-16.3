"use client";

import { useActionState } from "react";
import { createPage, type CreatePageState } from "@/app/admin/actions";

const inputCls =
  "w-full bg-zinc-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500";

export function CreatePageForm() {
  const [state, action] = useActionState<CreatePageState, FormData>(createPage, {
    ok: true,
  });

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="admin-field" style={{ margin: 0 }}>
        <span>Nombre</span>
        <input
          className={inputCls}
          name="name"
          required
          placeholder="P.ej. Servicios, Equipo, Tarifas…"
        />
      </label>
      <label className="admin-field" style={{ margin: 0 }}>
        <span>URL (slug) — opcional</span>
        <div className="flex items-center gap-1">
          <span className="text-sm text-zinc-500">/</span>
          <input className={inputCls} name="slug" placeholder="p.ej. servicios" />
        </div>
      </label>
      <button
        type="submit"
        className="admin-btn admin-btn--primary self-end"
        style={{ marginBottom: 0 }}
      >
        Crear página
      </button>
      {!state.ok && state.error && <p className="text-sm text-red-400 sm:col-span-3">{state.error}</p>}
      <p className="text-xs text-zinc-500 sm:col-span-3">
        Si dejas la URL vacía se genera automáticamente a partir del nombre (p.ej. «Servicios» → /servicios).
      </p>
    </form>
  );
}
