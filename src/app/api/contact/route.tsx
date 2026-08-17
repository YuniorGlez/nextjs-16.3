import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { createContactMessage, getSettings } from "@/lib/data";
import { normalizeContactInput, validateContactInput } from "@/lib/contact";
import { ContactNotificationEmail } from "@/emails/contact-notification";

export const runtime = "nodejs";

type SendResult =
  | { ok: true }
  | { ok: false; status: number; error: string; detail?: string };

/**
 * Envía el aviso al admin con la plantilla de React Email. Devuelve el
 * resultado tipado para que el route decida la respuesta final: si el mensaje
 * ya está guardado en la bandeja, un fallo de email no debe romper el envío.
 */
async function sendContactNotification(input: {
  to: string;
  from: string;
  name: string;
  email: string;
  message: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY no está configurada (aviso no enviado).");
    return { ok: false, status: 500, error: "El email no está configurado." };
  }
  try {
    const html = await render(
      <ContactNotificationEmail
        name={input.name}
        email={input.email}
        message={input.message}
      />,
    );
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        reply_to: input.email,
        subject: `📩 Nuevo mensaje de ${input.name} (${input.email})`,
        html,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error("Resend devolvió un error al enviar el aviso:", text.slice(0, 200));
      return {
        ok: false,
        status: 502,
        error: "No se pudo enviar el mensaje.",
        detail: text.slice(0, 200),
      };
    }
    return { ok: true };
  } catch (err) {
    console.error("Error al enviar el email de aviso:", err);
    return { ok: false, status: 502, error: "Error al enviar el email." };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const input = normalizeContactInput(body);
  const validation = validateContactInput(input);
  // honeypot o email inválido → respuesta {ok:true} silenciosa (como antes)
  if (validation.kind === "bot") {
    return NextResponse.json({ ok: true });
  }
  if (validation.kind === "invalid") {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { name, email, message } = validation.data;

  // 1) Guardar en la bandeja del admin (contact_messages). Si la BD falla se
  // continúa SOLO con el email (nunca se rompe el envío por un problema de BD).
  let saved = false;
  try {
    await createContactMessage({ name, email, message });
    saved = true;
  } catch (err) {
    console.error("No se pudo guardar el mensaje en la bandeja:", err);
  }

  // 2) Resolver destinatario/remitente: settings.mensajes → settings.contacto
  // (TO) → variables de entorno → sandbox de Resend (FROM).
  const settings = (await getSettings().catch(() => ({}))) as Record<string, unknown>;
  const mensajes = (settings.mensajes ?? {}) as Record<string, string>;
  const contacto = (settings.contacto ?? {}) as Record<string, string>;
  const to = mensajes.to || contacto.email || process.env.RESEND_TO || "";
  const from = mensajes.from || process.env.RESEND_FROM || "Web <onboarding@resend.dev>";

  if (!to) {
    // Sin destinatario no hay aviso, pero el mensaje ya está en la bandeja.
    if (saved) {
      console.error("Mensaje guardado en la bandeja, pero no hay destinatario configurado para el aviso.");
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "No hay destinatario configurado." }, { status: 400 });
  }

  const sent = await sendContactNotification({ to, from, name, email, message });
  // El mensaje se considera entregado si está en la bandeja O se envió el aviso.
  if (sent.ok || saved) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    sent.detail ? { error: sent.error, detail: sent.detail } : { error: sent.error },
    { status: sent.status },
  );
}
