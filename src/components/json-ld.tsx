import { effectiveSiteConfig, type EffectiveSiteConfig } from "@/lib/site";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumbs";

type Props = {
  site?: EffectiveSiteConfig;
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  image?: string;
};

export function JsonLd({ site = effectiveSiteConfig, name, description, url, logo, image }: Props = {}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": site.organization.type,
    name: name || site.organization.name,
    url: url || site.organization.url,
    logo: logo || site.organization.logo,
    description: description || site.description,
    image: image || undefined,
    address: site.organization.address,
    sameAs: site.organization.sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/** Breadcrumbs schema.org (Home > Página) para las rutas /[slug]. */
export function BreadcrumbJsonLd({ siteUrl, name, slug }: { siteUrl: string; name: string; slug: string }) {
  const jsonLd = buildBreadcrumbJsonLd({ siteUrl, name, slug });
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
