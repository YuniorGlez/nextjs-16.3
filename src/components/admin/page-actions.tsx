"use client";

import { useTransition } from "react";
import { deletePageAction, togglePageVisibility } from "@/app/admin/actions";

export function TogglePageButton({ id, visible }: { id: number; visible: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={`admin-btn admin-btn--sm ${visible ? "" : "admin-btn--secondary"}`}
      disabled={pending}
      title={visible ? "Ocultar página" : "Publicar página"}
      onClick={() => start(() => togglePageVisibility(id, visible))}
    >
      {visible ? "● Publicada" : "○ Oculta"}
    </button>
  );
}

export function DeletePageButton({ id, name }: { id: number; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="admin-btn admin-btn--sm admin-btn--danger"
      disabled={pending}
      onClick={() => {
        if (confirm(`¿Eliminar la página «${name}»? Esta acción no se puede deshacer.`)) {
          start(() => deletePageAction(id));
        }
      }}
    >
      Eliminar
    </button>
  );
}
