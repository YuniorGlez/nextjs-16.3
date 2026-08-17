import { platformDefaults } from "@/lib/site";

export type SeoSettings = { title: string; description: string; keywords: string; ogTitle: string; ogDescription: string; ogImage: string };
export type SeoScore = { score: number; recommendations: string[] };
const LIMITS = { title: 70, description: 200, keywords: 500, ogTitle: 70, ogDescription: 200, ogImage: 2048 } as const;

export function sanitizeSeoText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  const withoutTags = value.replace(/<[^>]*>/g, "");
  const withoutControls = Array.from(withoutTags, (char) => { const code = char.charCodeAt(0); return code < 32 || code === 127 ? " " : char; }).join("");
  return withoutControls.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function sanitizeSeoUrl(value: unknown, baseUrl: string): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const parsed = new URL(value.trim(), baseUrl);
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.username || parsed.password) return "";
    return parsed.toString();
  } catch { return ""; }
}

export function canonicalUrl(siteUrl: string, path = "/"): string {
  const base = new URL(siteUrl); base.search = ""; base.hash = "";
  const cleanPath = path.split(/[?#]/, 1)[0] || "/";
  base.pathname = `/${cleanPath.replace(/^\/+|\/+$/g, "")}`.replace("//", "/") || "/";
  return base.toString().replace(/\/$/, "") || base.origin;
}

function normalizeImageValue(value: unknown, baseUrl: string): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const raw = value.trim();
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw.slice(0, LIMITS.ogImage);
  return sanitizeSeoUrl(raw, baseUrl).slice(0, LIMITS.ogImage);
}

export function normalizeSeoSettings(v: unknown, baseUrl: string = platformDefaults.url): SeoSettings {
  const o = v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
  return { title: sanitizeSeoText(o.title, LIMITS.title), description: sanitizeSeoText(o.description, LIMITS.description), keywords: sanitizeSeoText(o.keywords, LIMITS.keywords), ogTitle: sanitizeSeoText(o.ogTitle, LIMITS.ogTitle), ogDescription: sanitizeSeoText(o.ogDescription, LIMITS.ogDescription), ogImage: normalizeImageValue(o.ogImage, baseUrl) };
}

export function parseKeywords(s: string): string[] { return s.split(",").map((k) => sanitizeSeoText(k, 80)).filter(Boolean).slice(0, 20); }

export function getSeoScore(input: Partial<SeoSettings>): SeoScore {
  const title = sanitizeSeoText(input.title, LIMITS.title), description = sanitizeSeoText(input.description, LIMITS.description);
  const recommendations: string[] = []; let score = 0;
  if (title.length >= 30 && title.length <= 60) score += 30; else recommendations.push("Ajusta el título a 30–60 caracteres.");
  if (description.length >= 120 && description.length <= 160) score += 30; else recommendations.push("Ajusta la descripción a 120–160 caracteres.");
  if (input.keywords?.trim()) score += 15; else recommendations.push("Añade palabras clave relevantes.");
  if (input.ogImage?.trim()) score += 25; else recommendations.push("Añade una imagen Open Graph.");
  return { score, recommendations };
}

export function shouldIndexPage(input: { visible: boolean; isPublished: boolean; preview?: boolean }): boolean { return input.visible && input.isPublished && input.preview !== true; }

export function seoFallbackTitle(): string { return `${platformDefaults.name} | ${platformDefaults.tagline}`; }

export function buildOrganizationJsonLd(site: { organization: { type: string; name: string; url: string; logo?: string; sameAs?: string[]; address?: Record<string, string> }; description: string }) {
  const value: Record<string, unknown> = { "@context": "https://schema.org", "@type": site.organization.type || "Organization", name: site.organization.name, url: site.organization.url, description: site.description };
  if (site.organization.logo) value.logo = site.organization.logo;
  if (site.organization.sameAs?.length) value.sameAs = site.organization.sameAs;
  if (site.organization.address && Object.values(site.organization.address).some(Boolean)) value.address = site.organization.address;
  return value;
}

export function buildWebsiteJsonLd(site: { name: string; url: string; description: string }) { return { "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: site.url, description: site.description }; }
