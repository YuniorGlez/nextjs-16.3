export const siteConfig = {
  name: "Next.js Base",
  shortName: "Next.js Base",
  tagline: "Base whitelabel para proyectos Next.js",
  description:
    "Repositorio base whitelabel para futuros proyectos Next.js. SEO optimizado, Google Analytics con consentimiento de cookies, capa de base de datos lista para usar y deploy en Vercel.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
  productionHost: "example.com",
  locale: "es_ES",
  themeColor: "#000000",
  keywords: [],
  organization: {
    name: "Next.js Base",
    type: "Organization",
    url: "https://example.com",
    logo: "https://example.com/logo.png",
    sameAs: [],
    address: {
      "@type": "PostalAddress",
      addressRegion: "",
      addressCountry: "",
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;