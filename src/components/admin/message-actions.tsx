"use client";

import { useTransition } from "react";
import { deleteMessageAction, setMessageReadAction } from "@/app/admin/actions";

export function ToggleReadButton({ id, read }: { id: number; read: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={`admin-btn admin-btn--sm ${read ? "admin-btn--secondary" : ""}`}
      disabled={pending}
      title={read ? "Marcar como no leído" : "Marcar como leído"}
      onClick={() => start(() => setMessageReadAction(id, !read))}
    >
      {read ? "○ No leído" : "● Leído"}
    </button>
  );
}

export function DeleteMessageButton({ id, name }: { id: number; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="admin-btn admin-btn--sm admin-btn--danger"
      disabled={pending}
      onClick={() => {
        if (confirm(`¿Eliminar el mensaje de «${name}»? Esta acción no se puede deshacer.`)) {
          start(() => deleteMessageAction(id));
        }
      }}
    >
      Eliminar
    </button>
  );
}
