import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function checkDatabase(): Promise<"up" | "down" | "unconfigured"> {
  if (!process.env.DATABASE_URL) return "unconfigured";
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT 1 AS ok`;
    return result?.[0]?.ok === 1 ? "up" : "down";
  } catch {
    return "down";
  }
}

export async function GET() {
  const db = await checkDatabase();
  return NextResponse.json({
    status: db === "up" ? "ok" : "degraded",
    db,
    timestamp: new Date().toISOString(),
  });
}
