"use client";

import { useState } from "react";
import { applySectorTemplateAction } from "@/app/admin/actions";
import { useToast } from "@/app/admin/shell";
import type { SectorTemplate, TemplateId } from "@/lib/templates";

export function TemplateManager({ templates, selected }: { templates: readonly SectorTemplate[]; selected: TemplateId | null }) {
  const toast = useToast();
  const [choice, setChoice] = useState<TemplateId>(selected ?? templates[0].id);
  const [saving, setSaving] = useState(false);
  const current = templates.find((template) => template.id === choice);

  async function apply() {
    setSaving(true);
    try {
      const result = await applySectorTemplateAction(choice);
      if (!result.ok) toast.push(result.error, "error");
      else toast.push("Preset cargado: los campos con contenido se han conservado.");
    } catch {
      toast.push("No se pudo aplicar la plantilla.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Plantillas sectoriales</h1>
        <p>Selecciona una estructura reutilizable para este cliente. Aplicar preset solo rellena campos vacíos: nunca sustituye contenido existente.</p>
      </div>
      <section className="admin-section">
        <label className="admin-label" htmlFor="sector-template">Sector</label>
        <select id="sector-template" className="admin-input mt-2 w-full max-w-xl" value={choice} onChange={(event) => setChoice(event.target.value as TemplateId)}>
          {templates.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.sector}</option>)}
        </select>
        {current && (
          <div className="admin-panel-card mt-4 max-w-xl p-5">
            <h2 className="text-lg font-semibold">{current.name}</h2>
            <p className="mt-2 text-sm text-zinc-400">{current.description}</p>
            <p className="mt-4 text-sm text-zinc-300"><strong>Composición:</strong> {current.sections.map((item) => item.key).join(" · ")}</p>
            <button type="button" className="admin-button mt-5" onClick={apply} disabled={saving}>
              {saving ? "Cargando…" : "Aplicar preset (solo campos vacíos)"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
