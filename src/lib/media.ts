import { sql } from "@/lib/db";
import { runDbTransaction } from "@/lib/db";
import { mediaPagination, sanitizeMediaInput } from "@/lib/media-validation";
export { mediaFilename, mediaPagination, sanitizeMediaInput, sanitizeMediaMetadata } from "@/lib/media-validation";
export const MEDIA_PAGE_SIZE = 24;


export type MediaAsset = {
  id: number;
  url: string;
  pathname: string | null;
  filename: string;
  contentType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  title: string | null;
  folder: string | null;
  tag: string | null;
  metadata: Record<string, unknown>;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type MediaRow = Record<string, unknown>;


function normalize(row: MediaRow): MediaAsset {
  return {
    id: Number(row.id), url: String(row.url), pathname: row.pathname == null ? null : String(row.pathname),
    filename: String(row.filename), contentType: String(row.content_type), bytes: Number(row.bytes),
    width: row.width == null ? null : Number(row.width), height: row.height == null ? null : Number(row.height),
    altText: String(row.alt_text ?? ""), title: row.title == null ? null : String(row.title),
    folder: row.folder == null ? null : String(row.folder), tag: row.tag == null ? null : String(row.tag),
    metadata: (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>,
    createdBy: row.created_by == null ? null : Number(row.created_by),
    createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString(),
    deletedAt: row.deleted_at == null ? null : new Date(String(row.deleted_at)).toISOString(),
  };
}

export async function createMediaAsset(input: { url: string; pathname?: string | null; filename: string; contentType: string; bytes: number; width?: number | null; height?: number | null; altText?: unknown; title?: unknown; folder?: unknown; tag?: unknown; metadata?: unknown; decorative?: boolean; createdBy?: number | null }): Promise<MediaAsset> {
  const mediaInput = sanitizeMediaInput(input, { decorative: input.decorative ?? input.altText === undefined });
  const rows = await sql`INSERT INTO media_assets (url, pathname, filename, content_type, bytes, width, height, alt_text, title, folder, tag, metadata, created_by)
    VALUES (${input.url}, ${input.pathname ?? null}, ${(input.filename.trim().slice(0, 255) || "imagen")}, ${input.contentType}, ${input.bytes}, ${input.width ?? null}, ${input.height ?? null}, ${mediaInput.altText}, ${mediaInput.title}, ${mediaInput.folder}, ${mediaInput.tag}, ${JSON.stringify(mediaInput.metadata)}::jsonb, ${input.createdBy ?? null})
    RETURNING *` as unknown as MediaRow[];
  return normalize(rows[0]);
}

export async function listMedia(options: { search?: string; folder?: string; includeDeleted?: boolean; page?: number; pageSize?: number } = {}) {
  const { page, pageSize, offset } = mediaPagination(options.page, options.pageSize ?? MEDIA_PAGE_SIZE);
  const search = typeof options.search === "string" ? options.search.trim().slice(0, 120) : "";
  const folder = typeof options.folder === "string" ? options.folder.trim().slice(0, 120) : "";
  const rows = await sql`SELECT *, COUNT(*) OVER() AS total FROM media_assets
    WHERE (${options.includeDeleted === true} OR deleted_at IS NULL)
      AND (${search} = '' OR filename ILIKE ${`%${search}%`} OR alt_text ILIKE ${`%${search}%`} OR title ILIKE ${`%${search}%`} OR tag ILIKE ${`%${search}%`})
      AND (${folder} = '' OR folder = ${folder})
    ORDER BY created_at DESC, id DESC LIMIT ${pageSize} OFFSET ${offset}` as unknown as MediaRow[];
  return { rows: rows.map(normalize), total: Number(rows[0]?.total ?? 0), page, pageSize, totalPages: Math.max(1, Math.ceil(Number(rows[0]?.total ?? 0) / pageSize)) };
}

export async function updateMediaAsset(id: number, input: ReturnType<typeof sanitizeMediaInput>): Promise<MediaAsset | null> {
  const rows = await sql`UPDATE media_assets SET alt_text = ${input.altText}, title = ${input.title}, folder = ${input.folder}, tag = ${input.tag}, metadata = ${JSON.stringify(input.metadata)}::jsonb, updated_at = now()
    WHERE id = ${id} RETURNING *` as unknown as MediaRow[];
  return rows[0] ? normalize(rows[0]) : null;
}

export async function isMediaReferenced(url: string, pathname: string | null): Promise<boolean> {
  const needle = pathname || url;
  const rows = await sql`SELECT EXISTS (
    SELECT 1 FROM settings WHERE value::text LIKE ${`%${needle}%`}
    UNION ALL SELECT 1 FROM pages WHERE content::text LIKE ${`%${needle}%`} OR seo::text LIKE ${`%${needle}%`}
  ) AS referenced` as unknown as { referenced: boolean }[];
  return Boolean(rows[0]?.referenced);
}

export async function softDeleteMediaAsset(id: number): Promise<"deleted" | "missing" | "referenced"> {
  const current = await sql`SELECT url, pathname FROM media_assets WHERE id = ${id} AND deleted_at IS NULL` as unknown as { url: string; pathname: string | null }[];
  if (!current[0]) return "missing";
  if (await isMediaReferenced(current[0].url, current[0].pathname)) return "referenced";
  await runDbTransaction([sql`UPDATE media_assets SET deleted_at = now(), updated_at = now() WHERE id = ${id} AND deleted_at IS NULL`]);
  return "deleted";
}

export async function restoreMediaAsset(id: number): Promise<boolean> {
  const rows = await sql`UPDATE media_assets SET deleted_at = NULL, updated_at = now() WHERE id = ${id} RETURNING id` as unknown as { id: number }[];
  return Boolean(rows[0]);
}

export async function getMediaAsset(id: number): Promise<MediaAsset | null> {
  const rows = await sql`SELECT * FROM media_assets WHERE id = ${id}` as unknown as MediaRow[];
  return rows[0] ? normalize(rows[0]) : null;
}
