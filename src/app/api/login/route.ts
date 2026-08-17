import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, issueToken } from "@/lib/auth";
import { authenticateAdmin } from "@/lib/admins";

export const runtime = "nodejs";

const TTL = 7 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "");
  const pwd = String(form.get("password") ?? "");
  const wantsJson =
    (req.headers.get("accept") ?? "").includes("application/json") ||
    (req.headers.get("x-requested-with") === "fetch");

  const admin = await authenticateAdmin(email, pwd);

  if (admin) {
    const json = NextResponse.json({ ok: true });
    json.cookies.set(COOKIE_NAME, issueToken(admin.id, admin.tokenVersion), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TTL,
    });
    return json;
  }

  if (wantsJson) {
    return NextResponse.json({ ok: false, error: "Email o contraseña incorrectos." });
  }
  const dest = new URL("/admin", req.url);
  dest.searchParams.set("error", "1");
  return NextResponse.redirect(dest);
}
