"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addAdminAction,
  changePasswordAction,
  deleteAdminAction,
  revokeSessionsAction,
  updateAdminAccessAction,
} from "@/app/admin/actions";
import { useToast } from "@/app/admin/shell";
import { ROLE_LABELS, ROLES, ALL_PERMISSIONS, permissionLabel, type AdminRole } from "@/lib/rbac";

type AdminListItem = {
  id: number;
  email: string;
  mustChangePassword: boolean;
  isSuperadmin: boolean;
  role: AdminRole;
  permissions: string[];
  lastLoginAt: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "nunca";
  return new Date(iso).toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* ================= Cambiar mi contraseña ================= */

export function ChangeOwnPasswordForm({ currentEmail }: { currentEmail: string }) {
  const { push } = useToast();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setError("");
    start(async () => {
      const result = await changePasswordAction(data);
      if (result?.ok) {
        push("Contraseña actualizada. Las demás sesiones se han cerrado.");
        form.reset();
        router.refresh();
      } else {
        setError(result?.error ?? "No se pudo cambiar la contraseña.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="admin-form-grid">
        <div className="admin-field">
          <span>Email</span>
          <input className="admin-input" value={currentEmail} disabled aria-disabled />
        </div>
        <div className="admin-field">
          <span>Contraseña actual</span>
          <input
            className="admin-input"
            type="password"
            name="current"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>
        <div className="admin-field">
          <span>Nueva contraseña</span>
          <input
            className="admin-input"
            type="password"
            name="new"
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div className="admin-field">
          <span>Repite la nueva contraseña</span>
          <input
            className="admin-input"
            type="password"
            name="confirm"
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="••••••••"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={pending} className="admin-btn admin-btn--primary">
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}

/* ================= Añadir admin ================= */

export function AddAdminForm() {
  const { push } = useToast();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setError("");
    start(async () => {
      const result = await addAdminAction(data);
      if (result?.ok) {
        push("Admin añadido. Deberá cambiar la contraseña en su primer acceso.");
        form.reset();
        router.refresh();
      } else {
        setError(result?.error ?? "No se pudo añadir el admin.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="admin-form-grid">
        <div className="admin-field">
          <span>Email del nuevo admin</span>
          <input
            className="admin-input"
            type="email"
            name="email"
            autoComplete="off"
            required
            placeholder="admin@ejemplo.com"
          />
        </div>
        <div className="admin-field">
          <span>Contraseña temporal (mín. 8 caracteres)</span>
          <input
            className="admin-input"
            type="text"
            name="password"
            autoComplete="off"
            minLength={8}
            required
            placeholder="Solo válida para el primer acceso"
          />
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        El nuevo admin tendrá que cambiar esta contraseña en su primer acceso.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={pending} className="admin-btn admin-btn--primary">
        {pending ? "Añadiendo…" : "Añadir admin"}
      </button>
    </form>
  );
}

/* ================= Lista de admins ================= */

export function AdminsTable({
  admins,
  currentId,
}: {
  admins: AdminListItem[];
  currentId: number;
}) {
  const { push } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const lastAdmin = admins.length <= 1;

  function run(
    id: number,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    successMsg: string,
  ) {
    setBusyId(id);
    start(async () => {
      try {
        const result = await fn();
        if (result?.ok) {
          push(successMsg);
          router.refresh();
        } else {
          push(result?.error ?? "No se pudo completar la acción.", "error");
        }
      } finally {
        setBusyId(null);
      }
    });
  }

  function remove(id: number, email: string) {
    if (!confirm(`¿Eliminar el admin «${email}»? Esta acción no se puede deshacer.`)) return;
    run(id, () => deleteAdminAction(id), "Admin eliminado.");
  }

  function revoke(id: number) {
    if (!confirm("¿Revocar todas las sesiones de este admin? Tendrá que volver a iniciar sesión.")) return;
    run(id, () => revokeSessionsAction(id), "Sesiones revocadas.");
  }

  const isBusy = (id: number) => pending && busyId === id;

  function access(a: AdminListItem, form: HTMLFormElement) {
    const values = new FormData(form);
    const role = String(values.get("role") ?? a.role);
    const permissions = String(values.get("permissions") ?? "").split(",").map((p) => p.trim()).filter(Boolean);
    run(a.id, () => updateAdminAccessAction(a.id, role, permissions), "Permisos actualizados.");
  }

  return (
    <div className="admin-panel-card overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Último acceso</th>
            <th>Estado</th>
            <th>Rol y permisos</th>
            <th className="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id}>
              <td>
                {a.email}
                {a.isSuperadmin && (
                  <span className="admin-badge ml-2" style={{ verticalAlign: "middle" }}>
                    superadmin
                  </span>
                )}
                {a.id === currentId && (
                  <span className="admin-badge ml-2" style={{ verticalAlign: "middle" }}>
                    tú
                  </span>
                )}
              </td>
              <td>{formatDate(a.lastLoginAt)}</td>
              <td>
                {a.mustChangePassword ? (
                  <span className="admin-badge admin-badge--warn">debe cambiar contraseña</span>
                ) : (
                  <span className="admin-badge admin-badge--success">activo</span>
                )}
              </td>
              <td>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm"
                    disabled={isBusy(a.id)}
                    title="Revocar sesiones"
                    onClick={() => revoke(a.id)}
                  >
                    Revocar sesiones
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    disabled={isBusy(a.id)}
                    title={
                      a.id === currentId
                        ? "No puedes eliminar tu propio admin"
                        : lastAdmin
                          ? "No puedes eliminar al último admin"
                          : "Eliminar admin"
                    }
                    onClick={() => remove(a.id, a.email)}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
              <td>
                <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); access(a, e.currentTarget); }}>
                  <select className="admin-input" name="role" defaultValue={a.role} disabled={a.id === currentId}>
                    {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                  </select>
                  <input className="admin-input" name="permissions" defaultValue={a.permissions.join(", ")} disabled={a.id === currentId} aria-label="Permisos explícitos" />
                  <small className="text-xs text-zinc-500">{ALL_PERMISSIONS.map(permissionLabel).join(" · ")}</small>
                  {a.id !== currentId && <button type="submit" className="admin-btn admin-btn--sm" disabled={isBusy(a.id)}>Guardar acceso</button>}
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
