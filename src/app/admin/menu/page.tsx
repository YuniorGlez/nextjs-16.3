import { getPages, getSettings } from "@/lib/data";
import { NavEditor } from "@/components/admin/nav-editor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function MenuPage() {
  let settings: Record<string, unknown> = {};
  let pages: Awaited<ReturnType<typeof getPages>> = [];
  try {
    [settings, pages] = await Promise.all([getSettings(), getPages()]);
  } catch {
    // BD no disponible
  }
  return (
    <NavEditor
      initial={settings.nav}
      pages={pages.map((p) => ({ slug: p.slug, name: p.name, visible: p.visible }))}
    />
  );
}
