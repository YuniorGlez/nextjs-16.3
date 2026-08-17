import "./admin.css";
import { getCurrentAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { ADMIN_NAV, resolveModules } from "@/lib/admin-modules";
import { AdminShell } from "./shell";
import { LoginForm } from "@/components/admin/login-form";
import { ChangePasswordGate } from "@/components/admin/change-password-gate";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return <LoginForm />;
  }

  // Primer acceso con contraseña temporal: solo el cambio de contraseña.
  if (admin.mustChangePassword) {
    return <ChangePasswordGate email={admin.email} />;
  }

  // Filtra la navegación por módulos activos (settings.modules). Si la BD no
  // responde, se muestran todos los módulos (fallback por defecto).
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    // BD no disponible
  }
  const modules = resolveModules(settings.modules);
  const isSuperadmin = admin.isSuperadmin;

  const nav = ADMIN_NAV.filter(
    (n) => !(n.superadminOnly && !isSuperadmin) && modules[n.moduleId] !== false,
  );
  const disabledModules = ADMIN_NAV.filter((n) => modules[n.moduleId] === false).map((n) => ({
    href: n.href,
    label: n.label,
  }));

  return (
    <AdminShell nav={nav} disabledModules={disabledModules} isSuperadmin={isSuperadmin}>
      {children}
    </AdminShell>
  );
}
