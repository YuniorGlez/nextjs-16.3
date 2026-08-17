/**
 * Construcción del JSON-LD de breadcrumbs (schema.org BreadcrumbList) para
 * las páginas /[slug]. Función pura y testeable; el escaping del nombre se
 * delega en JSON.stringify al serializar (los caracteres & < > " ' se
 * escapan como entidades/códigos en el JSON final).
 */

export type BreadcrumbListItem = {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
};

export type BreadcrumbList = {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  "@id": string;
  itemListElement: BreadcrumbListItem[];
};

export function buildBreadcrumbJsonLd(input: {
  siteUrl: string;
  name: string;
  slug: string;
}): BreadcrumbList {
  const base = input.siteUrl.replace(/\/+$/, "");
  const homeUrl = `${base}/`;
  const pageUrl = `${base}/${input.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": pageUrl,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: homeUrl },
      { "@type": "ListItem", position: 2, name: input.name, item: pageUrl },
    ],
  };
}
