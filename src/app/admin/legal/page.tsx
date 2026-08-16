import { getSettings } from "@/lib/data";
import { LegalEditor } from "@/components/admin/settings-editors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LegalPage() {
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    // BD no disponible
  }
  return <LegalEditor settings={settings} />;
}
