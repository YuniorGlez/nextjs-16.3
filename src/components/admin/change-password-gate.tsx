"use client";

import { useState, useTransition } from "react";
import { changePasswordAction } from "@/app/admin/actions";

/**
 * Puerta de cambio de contraseña obligatorio (primer login de un admin creado
 * con contraseña temporal). Se renderiza SOLO desde el layout de /admin; nada
 * del panel es accesible hasta que la contraseña se cambie.
 */
export function ChangePasswordGate({ email }: { email: string }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setError("");
    start(async () => {
      const result = await changePasswordAction(data);
      if (result?.ok) {
        // La sesión se re-creó con el nuevo token_version: recargar para que
        // el layout detecte el cambio y muestre el panel.
        window.location.reload();
      } else {
        setError(result?.error ?? "No se pudo cambiar la contraseña.");
        form.reset();
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl">
            🔒
          </div>
          <h1 className="font-serif text-2xl font-bold">Cambia tu contraseña</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {email ? `${email} · ` : ""}Es la primera vez que entras con una contraseña temporal.
            Elige una nueva para continuar.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            name="new"
            placeholder="Nueva contraseña (mín. 8 caracteres)"
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-amber-500"
          />
          <input
            type="password"
            name="confirm"
            placeholder="Repite la nueva contraseña"
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-amber-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={pending}
            className="w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50">
            {pending ? "Guardando…" : "Guardar y entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
