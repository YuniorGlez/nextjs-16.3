import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { siteConfig } from "@/lib/site";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const isProduction = host === siteConfig.productionHost;

  if (isProduction) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
