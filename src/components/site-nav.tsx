type NavItem = { slug: string; name: string; visible: boolean };

/** Cabecera de navegación pública: logo + enlaces a las páginas visibles. */
export function SiteNav({ pages, brandName }: { pages: NavItem[]; brandName: string }) {
  const visiblePages = pages.filter((p) => p.visible && p.slug !== "inicio");
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
        <a href="/" className="font-serif text-lg font-semibold text-zinc-50">
          {brandName}
        </a>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <a href="/" className="text-zinc-400 transition hover:text-amber-400">
            Inicio
          </a>
          {visiblePages.map((p) => (
            <a key={p.slug} href={`/${p.slug}`} className="text-zinc-400 transition hover:text-amber-400">
              {p.name}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
