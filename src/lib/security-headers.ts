// Cabeceras de seguridad (lógica pura, testeable sin servidor).
//
// CSP y 'unsafe-inline' — decisión y tradeoff:
// - script-src 'unsafe-inline' es NECESARIO hoy: el App Router de Next.js
//   embebe el payload RSC en <script> inline (self.__next_f.push), el admin
//   usa un INIT_SCRIPT inline y GA inyecta su init inline vía next/script.
//   Sin 'unsafe-inline', Next añade automáticamente un nonce a sus scripts,
//   pero los inline propios (GA init, JSON-LD) y el INIT_SCRIPT del admin
//   romperían. El siguiente paso natural es CSP con nonces: usar el nonce
//   que Next expone vía request header `x-nextjs-csp-nonce` en el proxy y
//   eliminar 'unsafe-inline' de script-src.
// - style-src 'unsafe-inline' lo exige Tailwind v4 (estilos inyectados) y los
//   atributos style inline del admin; quitarlo rompería el renderizado.
// - El resto de directivas cierra lo que no se usa: object-src 'none',
//   frame-ancestors 'none', base-uri 'self', form-action 'self'.

const BASE_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
];

export function buildCsp(): string {
  return CSP_DIRECTIVES.join("; ");
}

export function buildSecurityHeaders(input: {
  host: string;
  productionHost: string;
  /** Build de producción (process.env.NODE_ENV === "production"). */
  isProductionBuild: boolean;
}): Record<string, string> {
  const headers: Record<string, string> = { ...BASE_HEADERS };

  // HSTS solo en el dominio de producción (mismo criterio que X-Robots-Tag):
  // nunca enviarlo en localhost/previews porque un navegador que lo cachee
  // forzaría HTTPS aunque el entorno no lo sirva.
  if (input.host === input.productionHost) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }

  // CSP solo en build de producción: en `next dev` (Turbopack/HMR) rompería
  // los inline de desarrollo (react-refresh, eval de source maps, etc.).
  if (input.isProductionBuild) {
    headers["Content-Security-Policy"] = buildCsp();
  }

  return headers;
}
