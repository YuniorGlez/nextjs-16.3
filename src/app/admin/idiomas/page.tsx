import { getSettings } from "@/lib/data";
import { normalizeI18nConfig, SUPPORTED_LOCALES } from "@/lib/i18n";
import { saveSettings } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LanguagesPage() {
  let settings: Record<string, unknown> = {};
  try { settings = await getSettings(); } catch { /* BD no disponible */ }
  const config = normalizeI18nConfig(settings.i18n);
  return (
    <div>
      <div className="admin-page-header">
        <h1>Idiomas</h1>
        <p>Configura el idioma por defecto y los idiomas públicos. Las traducciones de páginas son opcionales y siempre hacen fallback seguro al idioma por defecto.</p>
      </div>
      <form action={saveLanguages} className="admin-panel-card max-w-2xl p-5">
        <label className="admin-field">
          <span>Idioma por defecto</span>
          <select name="defaultLocale" defaultValue={config.defaultLocale} className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-sm text-zinc-100">
            {SUPPORTED_LOCALES.map((locale) => <option key={locale} value={locale}>{locale}</option>)}
          </select>
        </label>
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium">Idiomas habilitados</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SUPPORTED_LOCALES.map((locale) => (
              <label key={locale} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="enabledLocales" value={locale} defaultChecked={config.enabledLocales.includes(locale)} />
                <span lang={locale}>{locale}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="mt-6 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black">Guardar idiomas</button>
      </form>
    </div>
  );
}

async function saveLanguages(formData: FormData) {
  "use server";
  const enabledLocales = formData.getAll("enabledLocales").map(String);
  await saveSettings({ i18n: { defaultLocale: String(formData.get("defaultLocale") ?? ""), enabledLocales } });
}
