"use client";

import { useState } from "react";
import { trackEvent } from "@/components/analytics";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          website: data.get("website") ?? "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        trackEvent("contact_submit", { form_id: "contact" });
        setStatus("ok");
        form.reset();
      } else {
        setStatus("error");
        setError(json.error || "No se pudo enviar. Inténtalo de nuevo.");
      }
    } catch {
      setStatus("error");
      setError("Error de conexión. Inténtalo de nuevo.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 px-6 py-8 text-center">
        <div className="mb-2 text-3xl">✅</div>
        <p className="font-semibold text-emerald-300">¡Mensaje enviado!</p>
        <p className="mt-1 text-sm text-zinc-400">Gracias por escribirnos. Te responderemos pronto.</p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-4 text-sm text-amber-400 hover:underline">
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  const input =
    "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-amber-400 placeholder:text-zinc-600";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left"
    >
      <h3 className="mb-1 font-serif text-xl font-semibold">Escríbenos</h3>
      <p className="mb-5 text-sm text-zinc-500">Cuéntanos qué necesitas y te contestamos por email.</p>

      {/* honeypot */}
      <input type="text" name="website" defaultValue="" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Tu nombre" className={input} />
        <input name="email" type="email" required placeholder="Tu email" className={input} />
      </div>
      <textarea name="message" required placeholder="Tu mensaje…" rows={4} className={`${input} mb-4`} />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
      >
        {status === "sending" ? "Enviando…" : "Enviar mensaje ✉️"}
      </button>
      {status === "error" && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </form>
  );
}