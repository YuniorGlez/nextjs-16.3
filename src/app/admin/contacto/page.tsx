import { getSettings } from "@/lib/data";
import { ContactoEditor } from "@/components/admin/contacto-editor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ContactoPage() {
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    // BD no disponible
  }
  const contacto = (settings.contacto ?? {}) as Record<string, string>;
  const mensajes = (settings.mensajes ?? {}) as Record<string, string>;
  return <ContactoEditor contacto={contacto} mensajes={mensajes} />;
}