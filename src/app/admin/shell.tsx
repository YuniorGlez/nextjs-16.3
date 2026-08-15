"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
const DASH = "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z";
const MENU = "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01";
const CONTACT = "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8 10a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.8.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2Z";
const SUN = "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 21v-2M12 5V3M21 12h-2M5 12H3M18 6l-2 2M8 8 6 6M18 18l-2-2M8 16l-2 2";
const LAYOUT = "M3 3h18v6H3zM3 11h9v8H3zM14 11h7v8h-7z";
const PUB = "M14 3v5a2 2 0 0 0 2 2h5M14 3h-7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z M14 3v6h6";
const SIGNOUT = "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9";
const LEFT = "M15 6l-6 6 6 6";
const RIGHT = "M9 6l6 6-6 6";

/* ================= Nav ================= */
const NAV = [
  { href: "/admin", label: "Resumen", icon: DASH },
  { href: "/admin/landing", label: "Landing (builder)", icon: LAYOUT },
  { href: "/admin/carta", label: "Carta y precios", icon: MENU },
  { href: "/admin/contacto", label: "Contacto", icon: CONTACT },
  { href: "/admin/contenido", label: "Textos y héroe", icon: SUN },
].map((n) => ({ ...n }));

const SIDEBAR_KEY = "bellavista:admin:sidebar";
const INIT_SCRIPT = `var p=document.currentScript.parentElement,s="expanded";try{if(localStorage.getItem("bellavista:admin:sidebar")==="rail")s="rail"}catch(e){}p.dataset.adminSidebar=s`;

function Sidebar() {
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

  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="admin-sidebar" ref={ref}>
      <div className="admin-sidebar-logo">
        <Link href="/admin" aria-label="Bella Vista — Panel">
          <span className="admin-sidebar-logo-mark" aria-hidden>🏔️</span>
          <span className="admin-sidebar-logo-text">
            Bella Vista
            <span className="admin-sidebar-label">Backoffice</span>
          </span>
        </Link>
      </div>
      <nav className="admin-nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} data-tooltip={n.label}
            className={`admin-nav-item ${active(n.href) ? "admin-nav-item--active" : ""}`}
            aria-current={active(n.href) ? "page" : undefined}>
            <span className="admin-nav-icon"><Icon d={n.icon} /></span>
            <span className="admin-nav-label">{n.label}</span>
          </Link>
        ))}
      </nav>
      <div className="admin-sidebar-footer">
        <a href="/" className="admin-nav-item" target="_blank" rel="noopener noreferrer" data-tooltip="Ver la web">
          <span className="admin-nav-icon"><Icon d={PUB} /></span>
          <span className="admin-nav-label">Ver la web</span>
        </a>
        <button type="button" className="admin-sidebar-collapse" onClick={toggle}
          aria-label={collapsed ? "Expandir" : "Colapsar"} data-tooltip={collapsed ? "Expandir" : "Colapsar"}>
          <Icon d={collapsed ? RIGHT : LEFT} size={15} />
        </button>
      </div>
    </aside>
  );
}

/* ================= Topbar ================= */
const SEG_LABELS: Record<string, string> = {
  carta: "Carta y precios",
  contacto: "Contacto",
  contenido: "Textos y héroe",
  landing: "Landing (builder)",
};

function Topbar() {
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
      <nav className="admin-topbar-crumb" aria-label="Ruta">
        {segments.length === 0 ? (
          <b aria-current="page">Panel</b>
        ) : (
          <>
            <Link href="/admin">Panel</Link>
            {segments.map((s) => (
              <span key={s} className="admin-topbar-crumb-segment">
                <span className="admin-topbar-crumb-sep" aria-hidden>{" / "}</span>
                <b aria-current="page">{SEG_LABELS[s] ?? s[0].toUpperCase() + s.slice(1)}</b>
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
        <Icon d={SIGNOUT} size={17} />
      </button>
    </header>
  );
}

/* ================= Shell ================= */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SaveProvider>
        <div className="admin-shell" suppressHydrationWarning>
          <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
          <div className="admin-desktop-guard" role="status">
            <div className="admin-desktop-guard-logo" aria-hidden>🏔️</div>
            <h1>El panel requiere una pantalla de escritorio</h1>
            <p>Accede desde un dispositivo con pantalla de al menos 1024 px de ancho para gestionar la web de Bella Vista.</p>
            <a href="/">← Volver al sitio público</a>
          </div>
          <Sidebar />
          <div className="admin-main">
            <Topbar />
            <main className="admin-content">{children}</main>
          </div>
        </div>
      </SaveProvider>
    </ToastProvider>
  );
}