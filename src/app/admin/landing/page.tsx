import { getMenu, getSettings } from "@/lib/data";
import { LandingBuilder } from "@/components/admin/landing-builder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LandingPage() {
  let settings: Record<string, unknown> = {};
  let menu: Awaited<ReturnType<typeof getMenu>> = [];
  try {
    [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  } catch {
    // BD no disponible
  }
  return <LandingBuilder settings={settings} menu={menu} />;
}