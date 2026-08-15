import { getSettings } from "@/lib/data";
import { ContenidoEditor } from "@/components/admin/settings-editors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ContenidoPage() {
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    // BD no disponible
  }
  return <ContenidoEditor settings={settings} />;
}