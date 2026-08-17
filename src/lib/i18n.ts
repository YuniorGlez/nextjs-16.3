export const SUPPORTED_LOCALES = ["es", "es-ES", "en", "en-GB", "fr", "pt"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type I18nConfig = {
  defaultLocale: SupportedLocale;
  enabledLocales: readonly SupportedLocale[];
};

const LOCALE_RE = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const MAX_ENABLED = 12;
const MAX_TEXT = 5000;

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: unknown, fallback: SupportedLocale = "es"): SupportedLocale {
  if (isSupportedLocale(value)) return value;
  if (typeof value === "string") {
    const exact = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === value.toLowerCase());
    if (exact) return exact;
    const language = value.split("-")[0].toLowerCase();
    const generic = SUPPORTED_LOCALES.find((locale) => locale === language);
    if (generic) return generic;
  }
  return fallback;
}

export function normalizeI18nConfig(value: unknown): I18nConfig {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const fallback = normalizeLocale(source.defaultLocale);
  const raw = Array.isArray(source.enabledLocales) ? source.enabledLocales : [];
  const enabled = [...new Set(raw.filter(isSupportedLocale))].slice(0, MAX_ENABLED);
  const enabledLocales = enabled.length > 0 ? enabled : [fallback];
  return {
    defaultLocale: enabledLocales.includes(fallback) ? fallback : enabledLocales[0],
    enabledLocales,
  };
}

export function validateI18nConfig(value: unknown): { ok: true; config: I18nConfig } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Configuración i18n inválida." };
  const source = value as Record<string, unknown>;
  if (!isSupportedLocale(source.defaultLocale)) return { ok: false, error: "El idioma por defecto no es válido." };
  if (!Array.isArray(source.enabledLocales) || source.enabledLocales.length < 1 || source.enabledLocales.length > MAX_ENABLED) {
    return { ok: false, error: "Selecciona entre 1 y 12 idiomas." };
  }
  if (source.enabledLocales.some((locale) => !isSupportedLocale(locale))) return { ok: false, error: "Hay un idioma no permitido." };
  if (new Set(source.enabledLocales).size !== source.enabledLocales.length) return { ok: false, error: "No repitas idiomas." };
  if (!(source.enabledLocales as unknown[]).includes(source.defaultLocale)) return { ok: false, error: "El idioma por defecto debe estar habilitado." };
  return { ok: true, config: { defaultLocale: source.defaultLocale, enabledLocales: source.enabledLocales } };
}

export function localeFromPath(pathname: string): SupportedLocale | null {
  const segment = pathname.split("/")[1];
  return isSupportedLocale(segment) ? segment : null;
}

export function isPublicLocalePath(pathname: string): boolean {
  const locale = localeFromPath(pathname);
  if (!locale) return false;
  const rest = pathname.slice(locale.length + 1) || "/";
  return !rest.startsWith("/admin") && !rest.startsWith("/api") && !rest.startsWith("/preview") && !rest.startsWith("/_next");
}

export function localizedPath(pathname: string, locale: SupportedLocale, config: I18nConfig): string {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withoutLocale = localeFromPath(clean) ? clean.slice(locale.length + 1) || "/" : clean;
  return locale === config.defaultLocale ? withoutLocale : `/${locale}${withoutLocale === "/" ? "" : withoutLocale}`;
}

function sanitizeText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/<[^>]*>/g, "").trim();
  return text ? text.slice(0, MAX_TEXT) : undefined;
}

function mergeSafe(base: unknown, translation: unknown): unknown {
  if (typeof base === "string") return sanitizeText(translation) ?? base;
  if (Array.isArray(base)) {
    if (!Array.isArray(translation)) return base;
    return base.map((item, index) => mergeSafe(item, translation[index]));
  }
  if (base && typeof base === "object" && !Array.isArray(base)) {
    const translated = translation && typeof translation === "object" && !Array.isArray(translation) ? translation as Record<string, unknown> : {};
    return Object.fromEntries(Object.entries(base as Record<string, unknown>).map(([key, value]) => [key, mergeSafe(value, translated[key])]));
  }
  return base;
}

export type LocalizablePage = { name: string; seo: Record<string, string>; content: Record<string, unknown> };
export type PageTranslations = Record<string, Partial<LocalizablePage>>;

/** Aplica solo la forma de los datos base: claves arbitrarias y HTML no entran. */
export function resolvePageTranslation<T extends LocalizablePage>(page: T, translations: unknown, locale: SupportedLocale, fallback: SupportedLocale): T {
  if (locale === fallback || !translations || typeof translations !== "object" || Array.isArray(translations)) return page;
  const raw = (translations as Record<string, unknown>)[locale];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return page;
  const t = raw as Partial<LocalizablePage>;
  return {
    ...page,
    name: sanitizeText(t.name) ?? page.name,
    seo: mergeSafe(page.seo, t.seo) as Record<string, string>,
    content: mergeSafe(page.content, t.content) as Record<string, unknown>,
  };
}

export function alternatesForPath(siteUrl: string, pathname: string, config: I18nConfig) {
  return Object.fromEntries(config.enabledLocales.map((locale) => [locale, `${siteUrl}${localizedPath(pathname, locale, config)}`]));
}

export function localeSitemapUrls(siteUrl: string, paths: string[], config: I18nConfig): string[] {
  return config.enabledLocales.flatMap((locale) => paths.map((path) => `${siteUrl}${localizedPath(path, locale, config)}`));
}

export function localeSelectorItems(pathname: string, config: I18nConfig) {
  return config.enabledLocales.map((locale) => ({ locale, href: localizedPath(pathname, locale, config) }));
}

export { LOCALE_RE };
