import { getCurrentAdmin } from "@/lib/auth";
import { canReadAudit, listAuditEvents } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin || !canReadAudit(admin)) {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const page = Number(value("page") ?? 1);
  let result: Awaited<ReturnType<typeof listAuditEvents>> = { rows: [], total: 0, page, pageSize: 25 };
  let dbError = false;
  try {
    result = await listAuditEvents({ action: value("action"), entityType: value("entity"), adminId: Number(value("admin")) || undefined, from: value("from"), to: value("to"), page });
  } catch {
    dbError = true;
  }
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const query = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) if (typeof raw === "string") query.set(key, raw);
  const previous = new URLSearchParams(query); previous.set("page", String(Math.max(1, result.page - 1)));
  const next = new URLSearchParams(query); next.set("page", String(result.page + 1));

  return (
    <>
      <div className="admin-page-header">
        <h1>Auditoría</h1>
        <p>Registro de cambios sensibles y acciones de seguridad. Los datos privados se excluyen automáticamente.</p>
      </div>
      <section className="admin-section">
        <form className="admin-panel-card p-5 grid gap-3 md:grid-cols-4" method="get">
          <label className="text-xs text-zinc-400">Acción<input name="action" defaultValue={value("action")} placeholder="page.update" className="admin-input mt-1" /></label>
          <label className="text-xs text-zinc-400">Entidad<input name="entity" defaultValue={value("entity")} placeholder="page" className="admin-input mt-1" /></label>
          <label className="text-xs text-zinc-400">Admin ID<input name="admin" type="number" min="1" defaultValue={value("admin")} placeholder="1" className="admin-input mt-1" /></label>
          <label className="text-xs text-zinc-400">Desde<input name="from" type="date" defaultValue={value("from")} className="admin-input mt-1" /></label>
          <label className="text-xs text-zinc-400">Hasta<input name="to" type="date" defaultValue={value("to")} className="admin-input mt-1" /></label>
          <button className="admin-btn admin-btn--primary md:col-span-4" type="submit">Filtrar</button>
        </form>
      </section>
      <section className="admin-section">
        {dbError ? <div className="admin-panel-card p-5 admin-empty">No se pudo cargar la auditoría (BD no disponible).</div> : result.rows.length === 0 ? <div className="admin-panel-card p-5 admin-empty">No hay eventos para estos filtros.</div> : (
          <div className="admin-panel-card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-xs text-zinc-500"><th className="p-3">Fecha</th><th className="p-3">Admin</th><th className="p-3">Acción</th><th className="p-3">Entidad</th><th className="p-3">Metadata</th></tr></thead><tbody>
            {result.rows.map((row) => <tr key={row.id} className="border-t border-white/10"><td className="p-3 whitespace-nowrap">{formatDate(row.createdAt)}</td><td className="p-3">{row.adminEmail ?? "Admin eliminado"}</td><td className="p-3 font-mono text-xs">{row.action}</td><td className="p-3">{row.entityType}{row.entityId ? ` #${row.entityId}` : ""}</td><td className="p-3"><code className="text-xs text-zinc-400 break-all">{JSON.stringify(row.metadata)}</code></td></tr>)}
          </tbody></table></div>
        )}
        {pages > 1 && <nav className="mt-4 flex gap-3 text-sm"><span>Página {result.page} de {pages}</span>{result.page > 1 && <a className="admin-btn admin-btn--sm" href={`?${previous.toString()}`}>Anterior</a>}{result.page < pages && <a className="admin-btn admin-btn--sm" href={`?${next.toString()}`}>Siguiente</a>}</nav>}
      </section>
    </>
  );
}
