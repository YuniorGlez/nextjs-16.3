import { NextRequest, NextResponse } from "next/server";
import { checkPassword, COOKIE_NAME, issueToken } from "@/lib/auth";

export const runtime = "nodejs";

const TTL = 7 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const pwd = String(form.get("password") ?? "");
  const wantsJson =
    (req.headers.get("accept") ?? "").includes("application/json") ||
    (req.headers.get("x-requested-with") === "fetch");

  if (checkPassword(pwd)) {
    const json = NextResponse.json({ ok: true });
    json.cookies.set(COOKIE_NAME, issueToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TTL,
    });
    return json;
  }

  if (wantsJson) {
    return NextResponse.json({ ok: false, error: "Contraseña incorrecta." });
  }
  const dest = new URL("/admin", req.url);
  dest.searchParams.set("error", "1");
  return NextResponse.redirect(dest);
}