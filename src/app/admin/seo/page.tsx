import { getSettings } from "@/lib/data";
import { SeoEditor } from "@/components/admin/settings-editors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SeoPage() {
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    // BD no disponible
  }
  return <SeoEditor settings={settings} />;
}
