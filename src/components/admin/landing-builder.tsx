"use client";

import { saveSettings } from "@/app/admin/actions";
import { SectionsEditor } from "@/components/admin/sections-editor";
import type { MenuCategory } from "@/lib/data";

const HOME_SECTION_KEYS = [
  "hero",
  "cabecera",
  "texto",
  "destacados",
  "numeros",
  "local",
  "galeria",
  "testimonios",
  "faq",
  "cta",
  "menu",
  "contacto",
];

export function LandingBuilder({
  settings,
  menu,
  hiddenKeys,
}: {
  settings: Record<string, unknown>;
  menu: MenuCategory[];
  hiddenKeys?: string[];
}) {
  const rawLayout = settings.layout as { key: string; visible?: boolean }[] | undefined;
  const initialSections =
    Array.isArray(rawLayout) && rawLayout.length
      ? rawLayout.map((l) => ({ key: l.key, visible: l.visible !== false }))
      : [];

  const initialContent: Record<string, unknown> = {};
  for (const k of HOME_SECTION_KEYS) {
    if (k in settings) initialContent[k] = settings[k];
  }

  async function save(
    sections: { key: string; visible: boolean }[],
    content: Record<string, unknown>,
  ) {
    await saveSettings({ layout: sections, ...content });
  }

  return (
    <SectionsEditor
      initialSections={initialSections}
      initialContent={initialContent}
      menu={menu}
      save={save}
      hiddenKeys={hiddenKeys}
      title="Builder de la landing"
      description="Reordena, muestra u oculta secciones, edita el texto y sube fotos. Todo se aplica a la web al pulsar «Guardar»."
    />
  );
}
