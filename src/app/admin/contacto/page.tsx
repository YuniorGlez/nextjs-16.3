import { getSettings } from "@/lib/data";
import { ContactoEditor } from "@/components/admin/settings-editors";

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
  return <ContactoEditor contacto={contacto} />;
}