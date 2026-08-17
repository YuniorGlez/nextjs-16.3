// Normalización y validación puras del formulario de contacto (sin I/O).
// El route /api/contact las usa para decidir guardar en BD y enviar email.

export type ContactInput = {
  name: string;
  email: string;
  message: string;
  website: string;
};

export type ContactValidationResult =
  | { kind: "ok"; data: ContactInput } // válido → guardar en BD + enviar aviso
  | { kind: "bot" } // honeypot o email inválido → responder {ok:true} sin hacer nada
  | { kind: "invalid"; error: string }; // error 400 con mensaje para el usuario

export const MAX_MESSAGE_LENGTH = 10_000;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Extrae y recorta los campos del body (tolera null, arrays y tipos raros). */
export function normalizeContactInput(body: unknown): ContactInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    name: str(b.name).trim(),
    email: str(b.email).trim(),
    message: str(b.message).trim(),
    website: str(b.website).trim(),
  };
}

/**
 * Valida el input normalizado. Mantiene el comportamiento actual del route:
 * el honeypot relleno y el email con formato inválido se tratan como bots
 * (respuesta {ok:true} silenciosa); los campos vacíos y el mensaje excesivo
 * devuelven un error 400 tipado.
 */
export function validateContactInput(input: ContactInput): ContactValidationResult {
  // honeypot contra bots
  if (input.website) return { kind: "bot" };
  if (!EMAIL_RE.test(input.email)) return { kind: "bot" };
  if (!input.name || !input.email || !input.message) {
    return { kind: "invalid", error: "Completa nombre, email y mensaje." };
  }
  if (input.message.length > MAX_MESSAGE_LENGTH) {
    return {
      kind: "invalid",
      error: `El mensaje es demasiado largo (máx. ${MAX_MESSAGE_LENGTH.toLocaleString("es-ES")} caracteres).`,
    };
  }
  return { kind: "ok", data: input };
}
