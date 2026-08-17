import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, issueToken } from "@/lib/auth";
import { authenticateAdmin } from "@/lib/admins";
import { getClientIp, loginLimiter } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

const TTL = 7 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  const wantsJson =
    (req.headers.get("accept") ?? "").includes("application/json") ||
    (req.headers.get("x-requested-with") === "fetch");

  // Rate-limit por IP: cuenta TODAS las peticiones de login (también las
  // exitosas) para frenar fuerza bruta antes del coste de verificación
  // (scrypt). 5 intentos / 15 min por IP.
  const rl = loginLimiter.check(getClientIp(req.headers));
  if (!rl.allowed) {
    const retryAfter = Math.max(1, Math.ceil(rl.retryAfterSeconds));
    if (wantsJson) {
      return NextResponse.json(
        {
          ok: false,
          error: `Demasiados intentos. Inténtalo en ${Math.ceil(rl.retryAfterSeconds / 60)} min.`,
          retryAfter,
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
    // Sin JS: mismo patrón que el error de credenciales (redirect con ?error=).
    const dest = new URL("/admin", req.url);
    dest.searchParams.set("error", "rate");
    return NextResponse.redirect(dest);
  }

  const form = await req.formData();
  const email = String(form.get("email") ?? "");
  const pwd = String(form.get("password") ?? "");

  const admin = await authenticateAdmin(email, pwd);

  if (admin) {
    await recordAudit({
      admin: { id: admin.id, email: admin.email }, action: "auth.login_success", entityType: "admin",
      entityId: admin.id, ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"), userAgent: req.headers.get("user-agent"),
    });
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

  await recordAudit({ action: "auth.login_failure", entityType: "admin", metadata: { email: email.trim().toLowerCase() }, ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"), userAgent: req.headers.get("user-agent") });

  if (wantsJson) {
    return NextResponse.json({ ok: false, error: "Email o contraseña incorrectos." });
  }
  const dest = new URL("/admin", req.url);
  dest.searchParams.set("error", "1");
  return NextResponse.redirect(dest);
}
