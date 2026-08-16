import Link from "next/link";
import { getPages } from "@/lib/data";
import { CreatePageForm } from "@/components/admin/create-page-form";
import { DeletePageButton, TogglePageButton } from "@/components/admin/page-actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PaginasPage() {
  let pages: Awaited<ReturnType<typeof getPages>> = [];
  try {
    pages = await getPages();
  } catch {
    // BD no disponible
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>Páginas</h1>
        <p>
          Crea páginas estándar (Sobre nosotros, Contacto, Cookies, Privacidad…) con su propia URL,
          visibilidad y SEO. Cada página se edita con el mismo builder de secciones que la landing.
        </p>
      </div>

      <section className="admin-section">
        <div className="admin-panel-card p-5">
          <h3 className="mb-4 font-semibold">➕ Nueva página</h3>
          <CreatePageForm />
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-panel-card">
          <div className="admin-panel-card-header">Todas las páginas</div>
          {pages.length === 0 ? (
            <div className="admin-empty">No hay páginas todavía. Crea la primera arriba.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>URL</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/paginas/${p.id}`} className="font-medium hover:text-amber-400">
                        {p.name}
                      </Link>
                    </td>
                    <td>
                      <a
                        href={`/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={p.visible ? "text-amber-400 hover:underline" : "text-zinc-500 line-through"}
                      >
                        /{p.slug}
                      </a>
                    </td>
                    <td>
                      <TogglePageButton id={p.id} visible={p.visible} />
                    </td>
                    <td className="text-right">
                      <Link href={`/admin/paginas/${p.id}`} className="admin-btn admin-btn--sm admin-btn--secondary">
                        Editar
                      </Link>{" "}
                      <DeletePageButton id={p.id} name={p.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
