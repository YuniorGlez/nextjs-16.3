import Link from "next/link";
import { getMenu, getSettings, type MenuCategory } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function KpiCard({
  label,
  value,
  sub,
  tone = "muted",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "muted" | "success" | "accent";
}) {
  return (
    <div className={`admin-stat-card admin-stat-card--${tone}`}>
      <div className="admin-stat-card-value">{value}</div>
      <div className="admin-stat-card-label">{label}</div>
      {sub && <div className="admin-stat-card-sub">{sub}</div>}
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="admin-quick-action">
      <span className="admin-quick-action-icon">{icon}</span>
      <span className="admin-quick-action-title">{title}</span>
      <span className="admin-quick-action-desc">{desc}</span>
    </Link>
  );
}

export default async function AdminPage() {
  let menu: MenuCategory[] = [];
  let settings: Record<string, unknown> = {};
  try {
    [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  } catch {
    // la BD no responde
  }

  const totalCat = menu.length;
  const totalItems = menu.reduce((a, c) => a + c.items.length, 0);
  const settingsCount = Object.keys(settings).length;
  const heroImg = (settings.hero as Record<string, string> | undefined)?.imagen ?? "";

  return (
    <>
      <div className="admin-page-header">
        <h1>Panel de administración</h1>
        <p>Bienvenido al centro de control de Bella Vista. Edita la carta, los precios, los datos de contacto y los textos de la web.</p>
      </div>

      <section className="admin-section">
        <h2 className="admin-section-title">Indicadores</h2>
        <div className="admin-stat-row">
          <KpiCard label="Categorías en la carta" value={totalCat} sub={totalCat ? "Visibles en el menú" : "Sin datos todavía"} tone="accent" />
          <KpiCard label="Platos y precios" value={totalItems} sub={totalItems ? "Items en total" : "Sin datos todavía"} tone="accent" />
          <KpiCard label="Datos de contacto" value={settingsCount > 0 ? "✓" : "—"} sub="Contacto y textos cargados" tone="success" />
          <KpiCard label="Imagen del héroe" value={heroImg ? "✓" : "—"} sub={heroImg ? "Configurada" : "Pon una imagen en Textos y héroe"} tone="success" />
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Contenido de la web</h2>
        <div className="admin-grid">
          <div className="admin-card">
            <div className="admin-card-header"><h3>📖 Carta</h3><Link href="/admin/carta" className="admin-btn admin-btn--sm admin-btn--secondary">Gestionar</Link></div>
            <div className="admin-card-body">
              <div className="admin-kpi-breakdown">
                <div className="admin-kpi-breakdown-item">
                  <span className="admin-kpi-breakdown-value">{totalCat}</span>
                  <span className="admin-kpi-breakdown-label">Categorías</span>
                </div>
                <div className="admin-kpi-breakdown-item">
                  <span className="admin-kpi-breakdown-value admin-kpi-breakdown-value--muted">{totalItems}</span>
                  <span className="admin-kpi-breakdown-label">Platos</span>
                </div>
              </div>
            </div>
          </div>
          <div className="admin-card">
            <div className="admin-card-header"><h3>📞 Contacto</h3><Link href="/admin/contacto" className="admin-btn admin-btn--sm admin-btn--secondary">Editar</Link></div>
            <div className="admin-card-body">
              <p className="admin-addr">{addrLine(settings)}</p>
            </div>
          </div>
          <div className="admin-card">
            <div className="admin-card-header"><h3>🖼️ Textos y héroe</h3><Link href="/admin/contenido" className="admin-btn admin-btn--sm admin-btn--secondary">Editar</Link></div>
            <div className="admin-card-body">
              {heroImg ? <p className="admin-empty">Héroe: <Link href={heroImg} target="_blank" rel="noopener noreferrer">{shorten(heroImg)}</Link></p> : <p className="admin-empty">Sin imagen de héroe configurada.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Acciones rápidas</h2>
        <div className="admin-grid">
          <QuickAction href="/admin/carta" icon="📖" title="Editar la carta" desc="Añade o cambia categorías, platos y precios del menú." />
          <QuickAction href="/admin/contacto" icon="📞" title="Datos de contacto" desc="Teléfono, WhatsApp y dirección que se muestran en la web." />
          <QuickAction href="/admin/contenido" icon="🖼️" title="Textos e imagen del héroe" desc="Titular, subtítulo, destacados, números y la foto de arriba." />
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Categorías de la carta</h3>
          </div>
          <div className="admin-card-body">
            {totalCat === 0 ? (
              <div className="admin-empty">No hay categorías todavía. Ve a Carta y precios para crear la primera.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>Categoría</th><th>Platos</th><th></th></tr>
                </thead>
                <tbody>
                  {menu.slice(0, 8).map((c) => (
                    <tr key={c.id}>
                      <td><Link href="/admin/carta">{c.emoji} {c.name}</Link></td>
                      <td>{c.items.length}</td>
                      <td><Link href="/admin/carta">Editar →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-guidance">
          <strong>Qué hacer a continuación</strong>
          <ol className="admin-guidance-list">
            <li>Revisa la carta y ajusta precios en «Carta y precios».</li>
            <li>Comprueba los datos de contacto en «Contacto».</li>
            <li>Elige la imagen del héroe en «Textos y héroe».</li>
          </ol>
        </div>
      </section>
    </>
  );
}

function addrLine(s: Record<string, unknown>) {
  const c = (s.contacto ?? {}) as Record<string, string>;
  return c.direccion || c.localidad || "Sin dirección configurada";
}

function shorten(p: string) {
  return p.length > 46 ? p.slice(0, 43) + "…" : p;
}