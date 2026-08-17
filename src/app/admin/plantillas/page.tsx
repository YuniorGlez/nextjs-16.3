import { getSettings } from "@/lib/data";
import { getTemplate, SECTOR_TEMPLATES, validateTemplateId } from "@/lib/templates";
import { TemplateManager } from "@/components/admin/template-manager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PlantillasPage() {
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    // La acción seguirá protegida y devolverá un error si la BD no está disponible.
  }
  const selected = validateTemplateId(settings.template);
  return <TemplateManager templates={SECTOR_TEMPLATES} selected={selected ?? getTemplate("servicios-profesionales")?.id ?? null} />;
}
