import type { MenuCategory } from "@/lib/data";
import { ContactForm } from "@/components/contact-form";
import { fillLegal, normalizeLegal, type LegalData } from "@/lib/legal";

/* ---------- Tipos de contenido (espejo de lo que guarda el CMS) ---------- */

export type HeroContent = {
  titulo?: string;
  h1?: string;
  subtitulo?: string;
  cta1?: string;
  cta1Url?: string;
  cta2?: string;
  cta2Url?: string;
  ubicacion?: string;
  imagen?: string;
};
export type DestacadoItem = { icon?: string; titulo?: string; texto?: string };
export type NumeroItem = { n?: string; t?: string };
export type LocalContent = {
  etiqueta?: string;
  titulo?: string;
  parrafo1?: string;
  parrafo2?: string;
  imagen?: string;
};
export type GaleriaContent = { titulo?: string; texto?: string; fotos?: string[] };
export type TestimonioItem = { texto?: string; autor?: string; rol?: string };
export type FaqItem = { pregunta?: string; respuesta?: string };
export type CtaContent = { titulo?: string; texto?: string; boton?: string; botonUrl?: string };
export type ContactoContent = {
  telefono?: string;
  telefonoUrl?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  localidad?: string;
};
export type CabeceraContent = { titulo?: string; subtitulo?: string };
export type TextoContent = { titulo?: string; parrafos?: string[] };

export type SectionCfg = { key: string; visible?: boolean };

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/* ---------- Hero ---------- */

export function LandingHero({ hero, brandName }: { hero: HeroContent; brandName: string }) {
  const badge = str(hero.titulo) || brandName;
  return (
    <section id="inicio" className="relative overflow-hidden bg-zinc-950 text-zinc-50">
      {hero.imagen ? (
        <div
          data-hero-bg
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(9,9,11,.78),rgba(9,9,11,.9)),url(${hero.imagen})`,
          }}
        />
      ) : (
        <div
          data-hero-bg
          className="absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(60% 80% at 50% 0%, #27272a 0%, #09090b 70%)" }}
        />
      )}
      <div className="relative mx-auto flex min-h-[88vh] w-full max-w-6xl flex-col items-center justify-center px-6 py-28 text-center">
        {badge && (
          <p data-hero className="text-xs font-semibold uppercase tracking-[.3em] text-amber-400">
            {badge}
          </p>
        )}
        <h1 data-hero className="mt-6 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-6xl">
          {str(hero.h1) || "Tu titular principal en una línea potente"}
        </h1>
        {hero.subtitulo && (
          <p data-hero className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
            {hero.subtitulo}
          </p>
        )}
        {(hero.cta1 || hero.cta2) && (
          <div data-hero className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {hero.cta1 && (
              <a
                href={str(hero.cta1Url) || "#contacto"}
                className="rounded-2xl bg-amber-500 px-7 py-3.5 font-semibold text-zinc-950 transition hover:bg-amber-400"
              >
                {hero.cta1}
              </a>
            )}
            {hero.cta2 && (
              <a
                href={str(hero.cta2Url) || "#sobre-nosotros"}
                className="rounded-2xl border border-zinc-700 px-7 py-3.5 font-semibold text-zinc-100 transition hover:border-amber-400 hover:text-amber-400"
              >
                {hero.cta2}
              </a>
            )}
          </div>
        )}
        {hero.ubicacion && (
          <p data-hero className="mt-10 text-sm text-zinc-400">
            📍 {hero.ubicacion}
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- Destacados (features) ---------- */

export function LandingDestacados({ items }: { items: DestacadoItem[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-zinc-50 py-20 dark:bg-black sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-6">
        <h2 data-reveal className="text-center font-serif text-3xl font-bold sm:text-4xl">
          Lo que ofrecemos
        </h2>
        <div data-stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="text-4xl">{str(d.icon)}</div>
              <h3 className="mt-4 font-serif text-lg font-semibold">{str(d.titulo)}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{str(d.texto)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Números / stats ---------- */

export function LandingNumeros({ items }: { items: NumeroItem[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-zinc-950 py-16 text-zinc-50">
      <div data-stagger className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-10 px-6 text-center sm:grid-cols-4">
        {items.map((x, i) => (
          <div key={i}>
            <div className="font-serif text-4xl font-bold text-amber-400">{str(x.n)}</div>
            <div className="mt-2 text-sm text-zinc-400">{str(x.t)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Sobre nosotros / el local ---------- */

export function LandingLocal({ local }: { local: LocalContent }) {
  const titulo = str(local.titulo) || "Sobre nosotros";
  return (
    <section id="sobre-nosotros" className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div data-reveal>
          {local.etiqueta && (
            <p className="text-xs font-semibold uppercase tracking-[.3em] text-amber-500">{local.etiqueta}</p>
          )}
          <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">{titulo}</h2>
          {local.parrafo1 && (
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">{local.parrafo1}</p>
          )}
          {local.parrafo2 && (
            <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">{local.parrafo2}</p>
          )}
        </div>
        <div data-reveal>
          {local.imagen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={local.imagen}
              alt={titulo}
              className="aspect-[4/3] w-full rounded-3xl object-cover"
            />
          ) : (
            <div className="aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-950" />
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Galería ---------- */

export function LandingGaleria({ galeria }: { galeria: GaleriaContent }) {
  const fotos = arr(galeria.fotos);
  if (!fotos.length) return null;
  return (
    <section className="bg-zinc-50 py-20 dark:bg-black sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div data-reveal className="text-center">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">{str(galeria.titulo) || "Galería"}</h2>
          {galeria.texto && <p className="mt-3 text-zinc-500 dark:text-zinc-400">{galeria.texto}</p>}
        </div>
        <div data-stagger className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={f}
              alt=""
              className="aspect-square w-full rounded-2xl object-cover"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonios ---------- */

export function LandingTestimonios({ items }: { items: TestimonioItem[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-6">
        <h2 data-reveal className="text-center font-serif text-3xl font-bold sm:text-4xl">
          Lo que dicen de nosotros
        </h2>
        <div data-stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="font-serif text-5xl leading-none text-amber-500">“</div>
              <blockquote className="mt-3 flex-1 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {str(t.texto)}
              </blockquote>
              <figcaption className="mt-6">
                <div className="font-semibold">{str(t.autor)}</div>
                {t.rol && <div className="text-xs text-zinc-500">{t.rol}</div>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

export function LandingFaq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-zinc-50 py-20 dark:bg-black sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-6">
        <h2 data-reveal className="text-center font-serif text-3xl font-bold sm:text-4xl">
          Preguntas frecuentes
        </h2>
        <div className="mt-12 space-y-3">
          {items.map((f, i) => (
            <details
              key={i}
              data-reveal
              className="group rounded-2xl border border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {str(f.pregunta)}
                <span className="shrink-0 text-amber-500 transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{str(f.respuesta)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA final ---------- */

export function LandingCta({ cta }: { cta: CtaContent }) {
  return (
    <section className="bg-zinc-950 py-20 text-center text-zinc-50 sm:py-28">
      <div data-reveal className="mx-auto w-full max-w-2xl px-6">
        <h2 className="font-serif text-3xl font-bold sm:text-5xl">{str(cta.titulo) || "¿Hablamos de tu proyecto?"}</h2>
        {cta.texto && <p className="mt-6 text-lg leading-8 text-zinc-300">{cta.texto}</p>}
        {cta.boton && (
          <a
            href={str(cta.botonUrl) || "#contacto"}
            className="mt-10 inline-block rounded-2xl bg-amber-500 px-8 py-4 font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            {cta.boton}
          </a>
        )}
      </div>
    </section>
  );
}

/* ---------- Menú / carta (opcional, oculto por defecto) ---------- */

export function LandingMenu({ menu }: { menu: MenuCategory[] }) {
  if (!menu.length) return null;
  return (
    <section id="menu" className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto w-full max-w-4xl px-6">
        <h2 data-reveal className="text-center font-serif text-3xl font-bold sm:text-4xl">Nuestra carta</h2>
        <div className="mt-12 space-y-10">
          {menu.map((c) => (
            <div key={c.id}>
              <h3 data-reveal className="mb-4 text-center font-serif text-xl font-semibold text-amber-500">
                {c.emoji} {c.name}
              </h3>
              <ul data-stagger className="space-y-3">
                {c.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-baseline justify-between gap-4 rounded-xl border border-zinc-200 px-5 py-3 dark:border-zinc-800"
                  >
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      {it.description && (
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">{it.description}</div>
                      )}
                    </div>
                    <div className="shrink-0 font-semibold text-amber-500">{it.price}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Contacto ---------- */

export function LandingContacto({ contacto }: { contacto: ContactoContent }) {
  const telefono = str(contacto.telefono);
  const telefonoHref = str(contacto.telefonoUrl) || (telefono ? `tel:${telefono}` : "");
  return (
    <section id="contacto" className="bg-white py-20 dark:bg-zinc-950 sm:py-28">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-2">
        <div data-reveal>
          <p className="text-xs font-semibold uppercase tracking-[.3em] text-amber-500">Contacto</p>
          <h2 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">Hablemos</h2>
          <ul className="mt-8 space-y-4 text-zinc-600 dark:text-zinc-400">
            {telefono && (
              <li>
                📞{" "}
                <a href={telefonoHref} className="hover:text-amber-500">
                  {telefono}
                </a>
              </li>
            )}
            {contacto.whatsapp && (
              <li>
                💬{" "}
                <a
                  href={str(contacto.whatsapp).startsWith("http") ? contacto.whatsapp : `https://wa.me/${contacto.whatsapp}`}
                  className="hover:text-amber-500"
                >
                  Escríbenos por WhatsApp
                </a>
              </li>
            )}
            {contacto.email && (
              <li>
                ✉️{" "}
                <a href={`mailto:${contacto.email}`} className="hover:text-amber-500">
                  {contacto.email}
                </a>
              </li>
            )}
            {(contacto.direccion || contacto.localidad) && (
              <li>📍 {[str(contacto.direccion), str(contacto.localidad)].filter(Boolean).join(", ")}</li>
            )}
          </ul>
        </div>
        <div data-reveal>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

/* ---------- Cabecera de página interior ---------- */

export function LandingCabecera({ cabecera, legal }: { cabecera: CabeceraContent; legal?: LegalData }) {
  const data = normalizeLegal(legal);
  return (
    <section className="bg-zinc-950 py-20 text-center text-zinc-50 sm:py-24">
      <div className="mx-auto w-full max-w-3xl px-6">
        <h1 className="font-serif text-4xl font-bold sm:text-5xl">
          {fillLegal(str(cabecera.titulo), data) || "Página"}
        </h1>
        {cabecera.subtitulo && (
          <p className="mt-4 text-lg leading-8 text-zinc-400">{fillLegal(cabecera.subtitulo, data)}</p>
        )}
      </div>
    </section>
  );
}

/* ---------- Texto (contenido de página, párrafos) ---------- */

export function LandingTexto({ texto, legal }: { texto: TextoContent; legal?: LegalData }) {
  const parrafos = Array.isArray(texto.parrafos)
    ? texto.parrafos.filter((p): p is string => typeof p === "string")
    : [];
  if (!parrafos.length && !texto.titulo) return null;
  const data = normalizeLegal(legal);
  return (
    <section className="bg-white py-16 dark:bg-zinc-950 sm:py-20">
      <article className="mx-auto w-full max-w-3xl px-6">
        {texto.titulo && (
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">{fillLegal(texto.titulo, data)}</h2>
        )}
        <div className="mt-6 space-y-5 text-base leading-8 text-zinc-600 dark:text-zinc-400">
          {parrafos.map((p, i) => (
            <p key={i}>{fillLegal(p, data)}</p>
          ))}
        </div>
      </article>
    </section>
  );
}

/* ---------- Renderizador compartido (home y páginas /[slug]) ---------- */

type LandingContent = {
  hero?: HeroContent;
  cabecera?: CabeceraContent;
  texto?: TextoContent;
  destacados?: DestacadoItem[];
  numeros?: NumeroItem[];
  local?: LocalContent;
  galeria?: GaleriaContent;
  testimonios?: TestimonioItem[];
  faq?: FaqItem[];
  cta?: CtaContent;
  contacto?: ContactoContent;
};

export type { LandingContent };

export function LandingSections({
  layout,
  content,
  menu,
  brandName,
  legal,
}: {
  layout: SectionCfg[];
  content: LandingContent;
  menu: MenuCategory[];
  brandName: string;
  legal?: LegalData;
}) {
  return (
    <>
      {layout.map((s) => {
        switch (s.key) {
          case "hero":
            return <LandingHero key="hero" hero={content.hero ?? {}} brandName={brandName} />;
          case "cabecera":
            return <LandingCabecera key="cabecera" cabecera={content.cabecera ?? {}} legal={legal} />;
          case "texto":
            return <LandingTexto key="texto" texto={content.texto ?? {}} legal={legal} />;
          case "destacados":
            return <LandingDestacados key="destacados" items={content.destacados ?? []} />;
          case "numeros":
            return <LandingNumeros key="numeros" items={content.numeros ?? []} />;
          case "local":
            return <LandingLocal key="local" local={content.local ?? {}} />;
          case "galeria":
            return <LandingGaleria key="galeria" galeria={content.galeria ?? {}} />;
          case "testimonios":
            return <LandingTestimonios key="testimonios" items={content.testimonios ?? []} />;
          case "faq":
            return <LandingFaq key="faq" items={content.faq ?? []} />;
          case "cta":
            return <LandingCta key="cta" cta={content.cta ?? {}} />;
          case "menu":
            return <LandingMenu key="menu" menu={menu} />;
          case "contacto":
            return <LandingContacto key="contacto" contacto={content.contacto ?? {}} />;
          default:
            return null;
        }
      })}
    </>
  );
}

/* ---------- Footer ---------- */

type FooterPage = { slug: string; name: string; visible: boolean };
const LEGAL_SLUGS = ["cookies", "privacidad", "aviso-legal", "terminos"];

export function LandingFooter({
  name,
  tagline,
  pages,
  contacto,
  legal,
}: {
  name: string;
  tagline: string;
  pages: FooterPage[];
  contacto: ContactoContent;
  legal?: LegalData;
}) {
  const year = new Date().getFullYear();
  const visible = pages.filter((p) => p.visible);
  const legalPages = visible.filter((p) => LEGAL_SLUGS.includes(p.slug));
  const otherPages = visible.filter((p) => !LEGAL_SLUGS.includes(p.slug) && p.slug !== "inicio");
  const legalData = normalizeLegal(legal);

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-14 text-sm text-zinc-400">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-serif text-lg font-semibold text-zinc-100">{name}</div>
          {tagline && <p className="mt-3 text-xs leading-6 text-zinc-500">{tagline}</p>}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Páginas</h3>
          <ul className="mt-4 space-y-2">
            <li>
              <a href="/" className="transition hover:text-amber-400">Inicio</a>
            </li>
            {otherPages.map((p) => (
              <li key={p.slug}>
                <a href={`/${p.slug}`} className="transition hover:text-amber-400">{p.name}</a>
              </li>
            ))}
            {otherPages.length === 0 && (
              <li className="text-zinc-600">Crea páginas desde el panel.</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Legal</h3>
          <ul className="mt-4 space-y-2">
            {legalPages.length === 0 ? (
              <li className="text-zinc-600">—</li>
            ) : (
              legalPages.map((p) => (
                <li key={p.slug}>
                  <a href={`/${p.slug}`} className="transition hover:text-amber-400">{p.name}</a>
                </li>
              ))
            )}
          </ul>
          {legalData.razonSocial && (
            <p className="mt-4 text-xs leading-5 text-zinc-600">
              {legalData.razonSocial}
              {legalData.cif ? ` · ${legalData.cif}` : ""}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Contacto</h3>
          <ul className="mt-4 space-y-2 text-zinc-500">
            {contacto.telefono && (
              <li>
                📞{" "}
                <a
                  href={contacto.telefonoUrl || `tel:${contacto.telefono}`}
                  className="transition hover:text-amber-400"
                >
                  {contacto.telefono}
                </a>
              </li>
            )}
            {contacto.email && (
              <li>
                ✉️{" "}
                <a href={`mailto:${contacto.email}`} className="transition hover:text-amber-400">
                  {contacto.email}
                </a>
              </li>
            )}
            {(contacto.direccion || contacto.localidad) && (
              <li>📍 {[contacto.direccion, contacto.localidad].filter(Boolean).join(", ")}</li>
            )}
            {!contacto.telefono && !contacto.email && !contacto.direccion && !contacto.localidad && (
              <li className="text-zinc-600">Rellena los datos en «Contacto» del panel.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-6xl border-t border-zinc-800/70 px-6 pt-6 text-center text-xs text-zinc-600">
        © {year} {name}
        {legalData.razonSocial ? ` · ${legalData.razonSocial}` : ""}
      </div>
    </footer>
  );
}
