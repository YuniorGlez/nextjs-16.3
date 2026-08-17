import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { listAdmins } from "@/lib/admins";
import {
  AddAdminForm,
  AdminsTable,
  ChangeOwnPasswordForm,
} from "@/components/admin/security-editors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SeguridadPage() {
  const me = await getCurrentAdmin();
  if (!me) redirect("/admin");

  let admins: Awaited<ReturnType<typeof listAdmins>> = [];
  let dbError = false;
  try {
    admins = await listAdmins();
  } catch {
    dbError = true;
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>Seguridad</h1>
        <p>
          Administradores del panel y contraseñas. Las sesiones se revocan al cambiar la
          contraseña o desde el botón «Revocar sesiones».
        </p>
      </div>

      <section className="admin-section">
        <h2 className="admin-section-title">Cambiar mi contraseña</h2>
        <div className="admin-panel-card p-5">
          <ChangeOwnPasswordForm currentEmail={me.email} />
        </div>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Admins</h2>
        {dbError ? (
          <div className="admin-panel-card p-5">
            <div className="admin-empty">No se pudo cargar la lista de admins (BD no disponible).</div>
          </div>
        ) : (
          <AdminsTable
            admins={admins.map((a) => ({
              id: a.id,
              email: a.email,
              mustChangePassword: a.mustChangePassword,
              lastLoginAt: a.lastLoginAt,
            }))}
            currentId={me.id}
          />
        )}
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Añadir admin</h2>
        <div className="admin-panel-card p-5">
          <AddAdminForm />
        </div>
      </section>
    </>
  );
}
