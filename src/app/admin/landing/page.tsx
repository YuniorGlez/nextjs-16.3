import { getMenu, getSettings } from "@/lib/data";
import { LandingBuilder } from "@/components/admin/landing-builder";
import { resolveModules } from "@/lib/admin-modules";
import { SECTION_DEFS } from "@/lib/sections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LandingPage() {
  let settings: Record<string, unknown> = {};
  let menu: Awaited<ReturnType<typeof getMenu>> = [];
  let hiddenKeys: string[] = [];
  try {
    [menu, settings] = await Promise.all([getMenu(), getSettings()]);
    const modules = resolveModules(settings.modules);
    hiddenKeys = SECTION_DEFS.filter(
      (s) => s.moduleId && modules[s.moduleId] === false,
    ).map((s) => s.key);
  } catch {
    // BD no disponible
  }
  return <LandingBuilder settings={settings} menu={menu} hiddenKeys={hiddenKeys} />;
}
