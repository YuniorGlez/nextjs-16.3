import { siteConfig } from "@/lib/site";

export function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": siteConfig.organization.type,
    name: siteConfig.organization.name,
    url: siteConfig.organization.url,
    logo: siteConfig.organization.logo,
    description: siteConfig.description,
    address: siteConfig.organization.address,
    sameAs: siteConfig.organization.sameAs,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
