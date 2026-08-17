import "./admin.css";
import { getCurrentAdmin } from "@/lib/auth";
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

  return <AdminShell>{children}</AdminShell>;
}
