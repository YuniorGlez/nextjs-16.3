import { getSettings } from "@/lib/data";
import { normalizeBranding } from "@/lib/branding";
import { BrandingEditor } from "@/components/admin/branding-editor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function EstiloPage() {
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    // BD no disponible
  }
  return <BrandingEditor branding={normalizeBranding(settings.branding)} />;
}