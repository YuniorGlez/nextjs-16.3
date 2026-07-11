"use client";

import { useCookieConsent } from "@/lib/cookies";

export function CookieBanner() {
  const { consent, loaded, accept, reject } = useCookieConsent();

  if (!loaded || consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Usamos cookies para mejorar tu experiencia y analizar el tráfico.
          Puedes aceptar o rechazar las cookies no esenciales.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={reject}
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Rechazar
          </button>
          <button
            onClick={accept}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
