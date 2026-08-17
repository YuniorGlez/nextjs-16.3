import { listContactMessages } from "@/lib/data";
import {
  DeleteMessageButton,
  ToggleReadButton,
} from "@/components/admin/message-actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function MensajesPage() {
  let messages: Awaited<ReturnType<typeof listContactMessages>> = [];
  try {
    messages = await listContactMessages(100);
  } catch {
    // BD no disponible
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>Mensajes</h1>
        <p>
          Mensajes recibidos a través del formulario de contacto de la web. Los no leídos
          aparecen primero.
        </p>
      </div>

      <section className="admin-section">
        {messages.length === 0 ? (
          <div className="admin-panel-card p-5">
            <div className="admin-empty">
              No hay mensajes todavía. Cuando alguien envíe el formulario de contacto,
              aparecerá aquí.
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`admin-panel-card p-5${m.read ? "" : " admin-message-card--unread"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!m.read && <span className="admin-badge admin-badge--warn">nuevo</span>}
                      <b className="text-sm">{m.name}</b>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      <a href={`mailto:${m.email}`} className="text-amber-400 hover:underline">
                        {m.email}
                      </a>
                      {" · "}
                      <span>{formatDate(m.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <ToggleReadButton id={m.id} read={m.read} />
                    <DeleteMessageButton id={m.id} name={m.name} />
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">{m.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
