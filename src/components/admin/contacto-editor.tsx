"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import { useAdminSave, useToast } from "@/app/admin/shell";
import { Field, inputCls } from "@/components/admin/settings-editors";

type S = Record<string, unknown>;

const CONTACT_FIELDS: [string, string][] = [
  ["telefono", "Teléfono (se muestra en la web)"],
  ["telefonoUrl", "Enlace tel: (p.ej. tel:+34922430406)"],
  ["whatsapp", "Enlace WhatsApp (wa.me/…)"],
  ["direccion", "Dirección"],
  ["localidad", "Localidad"],
];

/**
 * Editor de /admin/contacto: datos de contacto que se muestran en la web +
 * configuración de los avisos por email (settings.mensajes: TO/FROM). Guarda
 * ambas claves en un único «Guardar» para no pisar el registro del SaveProvider.
 */
export function ContactoEditor({
  contacto,
  mensajes,
}: {
  contacto: Record<string, string>;
  mensajes: Record<string, string>;
}) {
  const [draft, setDraft] = useState<S>({ ...contacto });
  const [mDraft, setMDraft] = useState<S>({ ...mensajes });
  const saveState = useAdminSave();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    saveState.setSave(async () => {
      saveState.setSaving(true);
      try {
        await saveSettings({ contacto: draft, mensajes: mDraft });
        saveState.setDirty(false);
        toast.push("Cambios guardados.");
        router.refresh();
      } catch {
        toast.push("No se pudo guardar.", "error");
      } finally {
        saveState.setSaving(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, mDraft]);

  function set(k: string, v: string) {
    setDraft((d) => ({ ...d, [k]: v }));
    saveState.setDirty(true);
  }

  function setM(k: string, v: string) {
    setMDraft((d) => ({ ...d, [k]: v }));
    saveState.setDirty(true);
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Datos de contacto</h1>
        <p>Estos datos aparecen en la sección de contacto de la web. Pulsa «Guardar» para aplicarlos.</p>
      </div>
      <section className="admin-section">
        <div className="admin-panel-card p-5">
          <h3 className="mb-1 font-semibold">📬 Avisos por email (bandeja de mensajes)</h3>
          <p className="mb-4 text-xs text-zinc-500">
            Cada mensaje del formulario de contacto se guarda en <b>/admin/mensajes</b> y se envía
            un aviso por email. Configura aquí quién lo recibe y desde qué dirección se envía.
          </p>
          <div className="admin-form-grid">
            <Field label="Email destinatario de los avisos (TO)">
              <input
                className={inputCls}
                value={String(mDraft.to ?? "")}
                placeholder="admin@tudominio.com"
                onChange={(e) => setM("to", e.target.value)}
              />
            </Field>
            <Field label="Remitente de los avisos (FROM)">
              <input
                className={inputCls}
                value={String(mDraft.from ?? "")}
                placeholder="Web <no-responder@tudominio.com>"
                onChange={(e) => setM("from", e.target.value)}
              />
            </Field>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Si se dejan vacíos: el TO usa el email de contacto (arriba) y luego la variable de
            entorno <code className="rounded bg-zinc-800 px-1">RESEND_TO</code>; el FROM usa
            <code className="rounded bg-zinc-800 px-1">RESEND_FROM</code> y, si tampoco existe, el
            sandbox de Resend. Lo guardado aquí gana siempre a las variables de entorno.
          </p>
        </div>

        <div className="admin-panel-card p-5" style={{ marginTop: 16 }}>
          <div className="admin-form-grid">
            {CONTACT_FIELDS.map(([k, label]) => (
              <Field key={k} label={label}>
                <input className={inputCls} value={String(draft[k] ?? "")} onChange={(e) => set(k, e.target.value)} />
              </Field>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
