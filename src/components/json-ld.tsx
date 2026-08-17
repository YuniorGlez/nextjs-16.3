import { effectiveSiteConfig, type EffectiveSiteConfig } from "@/lib/site";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumbs";
import { buildOrganizationJsonLd, buildWebsiteJsonLd, sanitizeSeoText, sanitizeSeoUrl } from "@/lib/seo-core";

type Props = { site?: EffectiveSiteConfig; name?: string; description?: string; url?: string; logo?: string; image?: string };

function JsonScript({ value }: { value: Record<string, unknown> }) {
  // JSON.stringify escapa comillas y caracteres de control; reemplazamos < para
  // impedir que contenido procedente del CMS cierre el script HTML.
  const json = JSON.stringify(value).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function JsonLd({ site = effectiveSiteConfig, name, description, url, logo, image }: Props = {}) {
  const safeName = sanitizeSeoText(name || site.organization.name, 120);
  const safeDescription = sanitizeSeoText(description || site.description, 200);
  const safeUrl = sanitizeSeoUrl(url || site.organization.url, site.url) || site.url;
  const organization = buildOrganizationJsonLd({ ...site, description: safeDescription, organization: { ...site.organization, name: safeName, url: safeUrl, logo: logo ? sanitizeSeoUrl(logo, site.url) : site.organization.logo } });
  const website = buildWebsiteJsonLd({ name: safeName, url: safeUrl, description: safeDescription });
  if (image) organization.image = sanitizeSeoUrl(image, site.url) || undefined;
  return <><JsonScript value={organization} /><JsonScript value={website} /></>;
}

export function BreadcrumbJsonLd({ siteUrl, name, slug }: { siteUrl: string; name: string; slug: string }) {
  return <JsonScript value={buildBreadcrumbJsonLd({ siteUrl, name: sanitizeSeoText(name, 120), slug: sanitizeSeoText(slug, 120) })} />;
}
