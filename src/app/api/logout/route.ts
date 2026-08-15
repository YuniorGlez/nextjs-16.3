import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  const dest = new URL("/", _req.url);
  const res = NextResponse.redirect(dest);
  res.cookies.delete(COOKIE_NAME);
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}