"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveModules } from "@/app/admin/actions";
import { useAdminSave, useToast } from "@/app/admin/shell";
import type { AdminModule } from "@/lib/admin-modules";

export function ModuleManager({
  modules,
  initial,
}: {
  modules: AdminModule[];
  initial: Record<string, boolean>;
}) {
  const router = useRouter();
  const saveState = useAdminSave();
  const toast = useToast();
  const [flags, setFlags] = useState<Record<string, boolean>>(initial);

  useEffect(() => {
    const run = async () => {
      saveState.setSaving(true);
      try {
        await saveModules(flags);
        saveState.setDirty(false);
        toast.push("Módulos guardados. El panel se actualiza.");
        router.refresh();
      } catch {
        toast.push("No se pudo guardar.", "error");
      } finally {
        saveState.setSaving(false);
      }
    };
    saveState.setSave(run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flags]);

  const toggle = (id: string) => {
    setFlags((f) => ({ ...f, [id]: !f[id] }));
    saveState.setDirty(true);
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Módulos</h1>
        <p>
          Activa o desactiva secciones del panel para este proyecto. Los datos no se borran:
          reactivar un módulo lo restaura tal cual.
        </p>
      </div>

      <section className="admin-section">
        {modules.map((m) => {
          const on = flags[m.id] !== false;
          const locked = !!m.required;
          return (
            <div
              key={m.id}
              className="admin-panel-card mb-3 flex items-start justify-between gap-4 p-4"
            >
              <div>
                <div className="flex items-center gap-2 font-medium text-zinc-100">
                  {m.label}
                  {locked && <span className="admin-badge">siempre activo</span>}
                </div>
                <p className="mt-1 text-sm text-zinc-400">{m.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={m.label}
                disabled={locked}
                onClick={() => toggle(m.id)}
                className={`admin-switch${on ? " admin-switch--on" : ""}${locked ? " admin-switch--disabled" : ""}`}
              >
                <span className="admin-switch-knob" />
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
