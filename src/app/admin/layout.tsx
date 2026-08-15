import "./admin.css";
import { isAdmin } from "@/lib/auth";
import { AdminShell } from "./shell";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();

  if (!admin) {
    return <LoginForm />;
  }

  return <AdminShell>{children}</AdminShell>;
}