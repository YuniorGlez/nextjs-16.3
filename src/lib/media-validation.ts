const MAX_TEXT = 500;

export function mediaPagination(pageInput: unknown, pageSizeInput: unknown) {
  const page = Math.max(1, Number.isFinite(Number(pageInput)) ? Math.floor(Number(pageInput)) : 1);
  const pageSize = Math.min(100, Math.max(1, Number.isFinite(Number(pageSizeInput)) ? Math.floor(Number(pageSizeInput)) : 24));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function text(value: unknown, max = MAX_TEXT): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function sanitizeMediaMetadata(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input).slice(0, 50).map(([key, value]) => [text(key, 80), typeof value === "string" ? value.slice(0, 500) : value]).filter(([key]) => Boolean(key)));
}

export function sanitizeMediaInput(input: { altText?: unknown; title?: unknown; folder?: unknown; tag?: unknown; metadata?: unknown }) {
  return {
    altText: text(input.altText),
    title: text(input.title) || null,
    folder: text(input.folder, 120) || null,
    tag: text(input.tag, 120) || null,
    metadata: sanitizeMediaMetadata(input.metadata),
  };
}

export function mediaFilename(name: string): string {
  return text(name, 255).replace(/[^a-zA-Z0-9._-]/g, "_") || "imagen";
}
