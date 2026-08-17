/**
 * Configuración de plataforma: valores seguros del producto base e invariantes
 * técnicas. Los datos de cada cliente se resuelven en site-config.ts.
 */
export const platformDefaults = {
  name: "Next.js Base",
  shortName: "Next.js Base",
  tagline: "Base whitelabel para proyectos Next.js",
  description:
    "Repositorio base whitelabel para futuros proyectos Next.js. SEO optimizado, Google Analytics con consentimiento de cookies, capa de base de datos lista para usar y deploy en Vercel.",
  url: "https://example.com",
  productionHost: "example.com",
  locale: "es_ES",
  themeColor: "#000000",
  keywords: [] as string[],
  organization: {
    name: "Next.js Base",
    type: "Organization",
    url: "https://example.com",
    logo: "https://example.com/logo.png",
    sameAs: [] as string[],
    address: {
      "@type": "PostalAddress",
      addressRegion: "",
      addressCountry: "",
    },
  },
} as const;

/** Compatibilidad con código de plataforma existente; no es la configuración efectiva. */
export const siteConfig = {
  ...platformDefaults,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? platformDefaults.url,
} as const;

export type PlatformConfig = typeof platformDefaults;
export type SiteConfig = typeof siteConfig;

export type ClientSiteConfig = {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  url: string;
  productionHost: string;
  contact: { email: string; phone: string };
  branding: Record<string, unknown>;
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  };
  organization: {
    name: string;
    type: string;
    url: string;
    logo: string;
    sameAs: string[];
    address: { "@type": string; addressRegion: string; addressCountry: string };
  },
};

export function normalizeHost(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/:\d+$/, "");
}

export function normalizeUrl(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return fallback;
    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeClientConfig(input: unknown): Partial<ClientSiteConfig> {
  const source = object(input);
  const contact = object(source.contact);
  const seo = object(source.seo);
  const result: Partial<ClientSiteConfig> = {};
  for (const key of ["name", "shortName", "tagline", "description"] as const) {
    if (typeof source[key] === "string" && source[key].trim()) result[key] = source[key].trim();
  }
  if (source.url !== undefined) result.url = normalizeUrl(source.url, "");
  if (source.productionHost !== undefined) result.productionHost = normalizeHost(source.productionHost);
  if (source.contact !== undefined) {
    result.contact = { email: text(contact.email, ""), phone: text(contact.phone, "") };
  }
  if (source.branding !== undefined) result.branding = object(source.branding);
  if (source.seo !== undefined) {
    result.seo = {
      title: text(seo.title, ""),
      description: text(seo.description, ""),
      keywords: text(seo.keywords, ""),
      ogTitle: text(seo.ogTitle, ""),
      ogDescription: text(seo.ogDescription, ""),
      ogImage: text(seo.ogImage, ""),
    };
  }
  return result;
}

export function mergeClientConfig(
  ...sources: unknown[]
): ClientSiteConfig {
  const base = platformDefaults;
  const merged = sources.reduce<Record<string, unknown>>((out, source) => {
    Object.assign(out, normalizeClientConfig(source));
    return out;
  }, {});
  const url = normalizeUrl(merged.url, base.url);
  const productionHost = normalizeHost(merged.productionHost) || new URL(url).hostname;
  const organization = {
    ...base.organization,
    name: text(merged.name, base.name),
    url,
  };
  return {
    name: text(merged.name, base.name),
    shortName: text(merged.shortName, base.shortName),
    tagline: text(merged.tagline, base.tagline),
    description: text(merged.description, base.description),
    url,
    productionHost,
    contact: (merged.contact ?? { email: "", phone: "" }) as ClientSiteConfig["contact"],
    branding: (merged.branding ?? {}) as Record<string, unknown>,
    seo: (merged.seo ?? { title: "", description: "", keywords: "", ogTitle: "", ogDescription: "", ogImage: "" }) as ClientSiteConfig["seo"],
    organization,
  };
}

export function isProductionHost(host: string, productionHost: string): boolean {
  return normalizeHost(host) === normalizeHost(productionHost);
}

export type EffectiveSiteConfig = ClientSiteConfig & Pick<PlatformConfig, "locale" | "themeColor" | "keywords">;

export function withPlatformConfig(client: ClientSiteConfig): EffectiveSiteConfig {
  return { ...client, locale: platformDefaults.locale, themeColor: platformDefaults.themeColor, keywords: [...platformDefaults.keywords] };
}

export const effectiveSiteConfig = withPlatformConfig(mergeClientConfig(siteConfig));
