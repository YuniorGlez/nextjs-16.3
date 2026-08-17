"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site";
import { ADMIN_NAV, type AdminNavItem } from "@/lib/admin-modules";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ================= Toast system ================= */
type ToastKind = "success" | "error";
type Toast = { id: number; message: string; kind: ToastKind };
type ToastCtx = { push: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast fuera de ToastProvider");
  return ctx;
}

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);
  const push = useCallback((message: string, kind: ToastKind = "success") => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="admin-toast-viewport" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`admin-toast admin-toast--${t.kind}`}>
            <span>{t.kind === "success" ? "✓" : "✕"}</span> {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ================= Save / dirty state ================= */
type SaveValue = {
  dirty: boolean;
  saving: boolean;
  setDirty: (d: boolean) => void;
  setSaving: (s: boolean) => void;
  setSave: (fn?: () => void | Promise<void>) => void;
  submit: () => void;
};
const SaveContext = createContext<SaveValue | null>(null);

export function useAdminSave() {
  const ctx = useContext(SaveContext);
  if (!ctx) throw new Error("useAdminSave fuera de SaveProvider");
  return ctx;
}

function SaveProvider({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const fnRef = useRef<(() => void | Promise<void>) | undefined>(undefined);

  const setSave = useCallback((fn?: () => void | Promise<void>) => {
    fnRef.current = fn;
  }, []);
  const submit = useCallback(() => {
    fnRef.current?.();
  }, []);
  const value = { dirty, saving, setDirty, setSaving, setSave, submit };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  return <SaveContext.Provider value={value}>{children}</SaveContext.Provider>;
}

/* ================= Icons ================= */
function Icon({ d, size = 18, w = 2 }: { d: string; size?: number; w?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/* ================= Nav ================= */
// Etiquetas de migas de pan por segmento de ruta (derivadas del registro).
const SEGMENT_LABELS: Record<string, string> = {};
for (const n of ADMIN_NAV) {
  const seg = n.href.split("/").at(-1);
  if (seg) SEGMENT_LABELS[seg] = n.label;
}

const SIDEBAR_KEY = `${siteConfig.name}:admin:sidebar`;
const INIT_SCRIPT = `var p=document.currentScript.parentElement,s="expanded";try{if(localStorage.getItem(${JSON.stringify(SIDEBAR_KEY)})==="rail")s="rail"}catch(e){}p.dataset.adminSidebar=s`;

function Sidebar({
  open,
  onClose,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  nav: AdminNavItem[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let v = "expanded";
    try {
      v = localStorage.getItem(SIDEBAR_KEY) === "rail" ? "rail" : "expanded";
    } catch {}
    ref.current?.closest<HTMLElement>(".admin-shell")?.setAttribute("data-admin-sidebar", v);
    setCollapsed(v === "rail");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    ref.current?.closest<HTMLElement>(".admin-shell")?.setAttribute("data-admin-sidebar", next ? "rail" : "expanded");
    try {
      localStorage.setItem(SIDEBAR_KEY, next ? "rail" : "expanded");
    } catch {}
  };

  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className={`admin-sidebar${open ? " admin-sidebar--open" : ""}`} ref={ref}>
      <div className="admin-sidebar-logo">
        <Link href="/admin" aria-label={`${siteConfig.name} — Panel`} onClick={onClose}>
          <span className="admin-sidebar-logo-mark" aria-hidden>⚙️</span>
          <span className="admin-sidebar-logo-text">
            {siteConfig.name}
            <span className="admin-sidebar-label">Backoffice</span>
          </span>
        </Link>
      </div>
      <nav className="admin-nav">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} data-tooltip={n.label} onClick={onClose}
            className={`admin-nav-item ${active(n.href) ? "admin-nav-item--active" : ""}`}
            aria-current={active(n.href) ? "page" : undefined}>
            <span className="admin-nav-icon"><Icon d={n.icon} /></span>
            <span className="admin-nav-label">{n.label}</span>
          </Link>
        ))}
      </nav>
      <div className="admin-sidebar-footer">
        <a href="/" className="admin-nav-item" target="_blank" rel="noopener noreferrer" data-tooltip="Ver la web" onClick={onClose}>
          <span className="admin-nav-icon"><Icon d={"M14 3v5a2 2 0 0 0 2 2h5M14 3h-7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z M14 3v6h6"} /></span>
          <span className="admin-nav-label">Ver la web</span>
        </a>
        <button type="button" className="admin-sidebar-collapse" onClick={toggle}
          aria-label={collapsed ? "Expandir" : "Colapsar"} data-tooltip={collapsed ? "Expandir" : "Colapsar"}>
          <Icon d={collapsed ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} size={15} />
        </button>
      </div>
    </aside>
  );
}

/* ================= Topbar ================= */
function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { dirty, saving, submit } = useAdminSave();
  const [log, setLog] = useState(false);

  async function logout() {
    if (dirty && !confirm("Tienes cambios sin guardar. ¿Salir de todas formas?")) return;
    setLog(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } finally {
      setLog(false);
    }
  }

  const segments = (pathname ?? "/admin").split("/").filter(Boolean).slice(1);

  return (
    <header className="admin-topbar">
      <button type="button" className="admin-topbar-menu-btn" onClick={onMenuClick}
        aria-label="Abrir menú">
        <Icon d={"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"} size={20} />
      </button>
      <nav className="admin-topbar-crumb" aria-label="Ruta">
        {segments.length === 0 ? (
          <b aria-current="page">Panel</b>
        ) : (
          <>
            <Link href="/admin">Panel</Link>
            {segments.map((s) => (
              <span key={s} className="admin-topbar-crumb-segment">
                <span className="admin-topbar-crumb-sep" aria-hidden>{" / "}</span>
                <b aria-current="page">{SEGMENT_LABELS[s] ?? s[0].toUpperCase() + s.slice(1)}</b>
              </span>
            ))}
          </>
        )}
      </nav>
      <div className="admin-topbar-spacer" />
      {dirty && (
        <div className="admin-topbar-save-zone">
          <span className="admin-topbar-dirty-chip" role="status">
            <span className="admin-topbar-dirty-dot" aria-hidden />
            Cambios sin guardar
          </span>
          <button type="button" className="admin-btn admin-btn--primary admin-btn--sm"
            onClick={submit} disabled={!dirty || saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      )}
      <div className="admin-topbar-avatar" aria-hidden />
      <button type="button" className="admin-topbar-icon-btn" onClick={logout} disabled={log}
        aria-label="Cerrar sesión" title="Cerrar sesión">
        <Icon d={"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"} size={17} />
      </button>
    </header>
  );
}

/* ================= Shell ================= */
export function AdminShell({
  children,
  nav,
  disabledModules,
  isSuperadmin,
}: {
  children: ReactNode;
  nav: AdminNavItem[];
  disabledModules: { href: string; label: string }[];
  isSuperadmin: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const blocked = disabledModules.find(
    (m) => pathname === m.href || pathname.startsWith(m.href + "/"),
  );
  return (
    <ToastProvider>
      <SaveProvider>
        <div className="admin-shell" suppressHydrationWarning>
          <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
          <button
            type="button"
            className={`admin-nav-backdrop${mobileOpen ? " admin-nav-backdrop--visible" : ""}`}
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            tabIndex={mobileOpen ? 0 : -1}
          />
          <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} nav={nav} />
          <div className="admin-main">
            <Topbar onMenuClick={() => setMobileOpen(true)} />
            <main className="admin-content">
              {blocked ? (
                <div className="admin-panel-card p-6">
                  <div className="admin-empty">
                    El módulo «{blocked.label}» está desactivado en este proyecto.
                    {isSuperadmin ? " Puedes activarlo desde «Módulos»." : ""}
                  </div>
                </div>
              ) : (
                children
              )}
            </main>
          </div>
        </div>
      </SaveProvider>
    </ToastProvider>
  );
}
