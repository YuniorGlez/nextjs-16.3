import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { ADMIN_MODULES, resolveModules } from "@/lib/admin-modules";
import { ModuleManager } from "@/components/admin/module-manager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ModulosPage() {
  const me = await getCurrentAdmin();
  if (!me?.isSuperadmin) redirect("/admin");

  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    // BD no disponible
  }
  const modules = resolveModules(settings.modules);

  return <ModuleManager modules={ADMIN_MODULES} initial={modules} />;
}
