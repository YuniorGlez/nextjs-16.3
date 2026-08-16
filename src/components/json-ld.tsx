import { siteConfig } from "@/lib/site";

type Props = {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  image?: string;
};

export function JsonLd({ name, description, url, logo, image }: Props = {}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": siteConfig.organization.type,
    name: name || siteConfig.organization.name,
    url: url || siteConfig.organization.url,
    logo: logo || siteConfig.organization.logo,
    description: description || siteConfig.description,
    image: image || undefined,
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
