import { normalizeNav, type NavPage, type NavRenderItem, type NormalizedNav } from "@/lib/nav";

/**
 * Cabecera de navegación pública.
 * Sin configuración (nav) renderiza el comportamiento por defecto: "Inicio" +
 * todas las páginas visibles excepto "inicio". Con configuración normalizada
 * renderiza exactamente lo configurado, con submenús (sin JavaScript: <details>
 * + hover/focus-within para teclado) y botón CTA destacado al final.
 */
export function SiteNav({
  pages,
  brandName,
  nav,
}: {
  pages: NavPage[];
  brandName: string;
  nav?: NormalizedNav;
}) {
  const normalized = nav ?? normalizeNav(null, pages);
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
        <a href="/" className="font-serif text-lg font-semibold text-zinc-50">
          {brandName}
        </a>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm" aria-label="Principal">
          {normalized.items.map((item) =>
            item.children?.length ? (
              <Submenu key={item.href ?? item.label} item={item} />
            ) : (
              <a
                key={item.href ?? item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="text-zinc-400 transition hover:text-amber-400"
              >
                {item.label}
              </a>
            ),
          )}
          {normalized.cta && (
            <a
              href={normalized.cta.href}
              className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-zinc-950 transition hover:bg-amber-400"
            >
              {normalized.cta.label}
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

/** Submenú accesible sin JS: <details> nativo + apertura por hover/foco (CSS). */
function Submenu({ item }: { item: NavRenderItem }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 text-zinc-400 transition hover:text-amber-400 [&::-webkit-details-marker]:hidden">
        {item.href ? (
          <a href={item.href} className="transition hover:text-amber-400">
            {item.label}
          </a>
        ) : (
          item.label
        )}
        <svg
          className="h-3.5 w-3.5 transition group-open:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      {/* El pt-2 forma parte del panel: el hueco entre el summary y la lista
          mantiene el hover activo al mover el ratón. */}
      <div className="absolute right-0 top-full z-50 hidden pt-2 group-hover:block group-focus-within:block group-open:block">
        <ul className="min-w-48 rounded-xl border border-zinc-800 bg-zinc-950/95 p-2 shadow-xl backdrop-blur">
          {item.children!.map((child) => (
            <li key={child.href ?? child.label}>
              <a
                href={child.href}
                target={child.external ? "_blank" : undefined}
                rel={child.external ? "noopener noreferrer" : undefined}
                className="block rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-amber-400"
              >
                {child.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
