import { getSettings } from "@/lib/data";
import { AnalyticsEditor } from "@/components/admin/settings-editors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AnalyticsPage() {
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    // BD no disponible
  }
  return <AnalyticsEditor settings={settings} />;
}
