"use client";

import { useState } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { Accept: "application/json", "X-Requested-With": "fetch" },
        body: new FormData(form),
      });
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        window.location.reload();
      } else {
        setError(data?.error || "Email o contraseña incorrectos.");
      }
    } catch {
      setError("No se pudo conectar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl">
            ⚙️
          </div>
          <h1 className="font-serif text-2xl font-bold">Panel de administración</h1>
          <p className="mt-1 text-sm text-zinc-500">Introduce tu email y contraseña para editar la web.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-amber-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-amber-500"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={pending}
            className="w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50">
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
