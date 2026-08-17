import { headers } from "next/headers";
import { localeSelectorItems, normalizeI18nConfig, normalizeLocale, type I18nConfig } from "@/lib/i18n";

export async function getRequestLocale(settings: Record<string, unknown>): Promise<{ locale: ReturnType<typeof normalizeLocale>; config: I18nConfig }> {
  const config = normalizeI18nConfig(settings.i18n);
  const requested = (await headers()).get("x-cms-locale");
  const candidate = normalizeLocale(requested, config.defaultLocale);
  return { locale: config.enabledLocales.includes(candidate) ? candidate : config.defaultLocale, config };
}

export async function LocaleSelector({ pathname, config }: { pathname: string; config: I18nConfig }) {
  if (config.enabledLocales.length < 2) return null;
  const current = normalizeLocale((await headers()).get("x-cms-locale"), config.defaultLocale);
  return (
    <nav aria-label="Idioma" className="flex items-center gap-2 text-sm">
      {localeSelectorItems(pathname, config).map(({ locale, href }) => (
        <a key={locale} href={href} lang={locale} aria-current={locale === current ? "page" : undefined} className="underline-offset-4 hover:underline">
          {locale}
        </a>
      ))}
    </nav>
  );
}

