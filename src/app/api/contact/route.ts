import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "El email no está configurado." }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const name = String((body as any)?.name ?? "").trim();
  const email = String((body as any)?.email ?? "").trim();
  const message = String((body as any)?.message ?? "").trim();
  const website = String((body as any)?.website ?? "").trim();

  // honeypot contra bots
  if (website || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: true });
  }
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Completa nombre, email y mensaje." }, { status: 400 });
  }

  const settings = (await getSettings().catch(() => ({}))) as Record<string, unknown>;
  const to = ((settings.contacto as any)?.email as string) || process.env.RESEND_TO || "";
  if (!to) {
    return NextResponse.json({ error: "No hay destinatario configurado." }, { status: 400 });
  }
  const from = process.env.RESEND_FROM || "Web Bella Vista <onboarding@resend.dev>";

  const html = [
    `<h3>Nuevo mensaje desde la web</h3>`,
    `<p><b>Nombre:</b> ${escapeHtml(name)}</p>`,
    `<p><b>Email:</b> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>`,
    `<p><b>Mensaje:</b></p>`,
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
  ].join("");

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `📩 Nuevo mensaje de ${name} (web)`,
        html,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: "No se pudo enviar el mensaje.", detail: text.slice(0, 200) }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al enviar el email." }, { status: 502 });
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}