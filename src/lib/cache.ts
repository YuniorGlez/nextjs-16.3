import { revalidateTag } from "next/cache";

/** Tags de la superficie pública. Nunca incluyen borradores ni datos de admin. */
export const CACHE_TAGS = {
  settings: "public-settings",
  menu: "public-menu",
  pages: "public-pages",
  redirects: "public-redirects",
} as const;

export const CACHE_REVALIDATE_SECONDS = 300;
export const CACHE_REVALIDATE_PROFILE = "max";

export function pageCacheTag(slug: string): string {
  return `public-page:${slug}`;
}

/** Invalidación SWR compatible con la API de Next 16. */
export function invalidatePublicSettings(): void {
  revalidateTag(CACHE_TAGS.settings, CACHE_REVALIDATE_PROFILE);
}

export function invalidatePublicMenu(): void {
  revalidateTag(CACHE_TAGS.menu, CACHE_REVALIDATE_PROFILE);
}

export function invalidatePublicPages(...slugs: string[]): void {
  revalidateTag(CACHE_TAGS.pages, CACHE_REVALIDATE_PROFILE);
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidateTag(pageCacheTag(slug), CACHE_REVALIDATE_PROFILE);
  }
}

export function invalidatePublicRedirects(): void {
  revalidateTag(CACHE_TAGS.redirects, CACHE_REVALIDATE_PROFILE);
}

export function invalidatePublicContent(options: { settings?: boolean; menu?: boolean; pages?: boolean; slugs?: string[] } = {}): void {
  if (options.settings) invalidatePublicSettings();
  if (options.menu) invalidatePublicMenu();
  if (options.pages) invalidatePublicPages(...(options.slugs ?? []));
}

export function isCacheablePublicQuery(options: { published?: boolean; draft?: boolean } = {}): boolean {
  return options.published === true && options.draft !== true;
}
