# AGENTS.md — Next.js Base

> **OBLIGATORIO**: Antes de escribir código, explora la estructura del proyecto
> y consulta la documentación relevante en `node_modules/next/dist/docs/`.
> Prefiere razonamiento basado en recuperación (retrieval-led) sobre
> razonamiento basado en entrenamiento (pre-training-led).

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Proyecto

Repositorio base whitelabel para futuros proyectos Next.js. Proporciona una
base sólida y opinionated: SEO optimizado, Google Analytics con consentimiento
de cookies, capa de base de datos lista para usar, y configuración de deploy en
Vercel. Clona este repo y adáptalo a las necesidades del proyecto concreto.

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.3.0 |
| UI | React + Tailwind CSS | 19.2.4 / v4 |
| Lenguaje | TypeScript | 7.0.x |
| BD | NeonDB (PostgreSQL serverless) | @neondatabase/serverless 1.x |
| Analytics | Google Analytics 4 (gtag) | vía next/script |
| Package Manager | Bun | 1.3.x |
| Deploy | Vercel (con Bun) | — |

## Comandos

```bash
bun run dev          # servidor de desarrollo (Turbopack)
bun run build        # build de producción
bun run start        # servidor de producción
bun run lint         # oxlint (15 ficheros, ~24ms)
bun run typecheck    # tsc --noEmit (TS7)
bun run test         # vitest run
bun run test:coverage # vitest con umbral de cobertura ≥80%
```

## Verificación por fichero (single-file)

Cuando un cambio afecte a un solo fichero y no haga falta el typecheck completo:

```bash
bunx oxlint <fichero>                            # lint de un fichero (p.ej. bunx oxlint src/lib/site.ts)
bunx tsc@7 --noEmit <fichero>                    # typecheck de un fichero sin project (p.ej. bunx tsc@7 --noEmit src/lib/site.ts)
bunx tsc@7 --noEmit --checkers 4                 # typecheck global (proyecto completo, ~2s con 4 workers)
```

Antes de dar una tarea por terminada: `bun run test` + `bunx tsc@7 --noEmit --checkers 4`.

## Arquitectura

```
src/
├── app/
│   ├── layout.tsx        # Root layout: generateMetadata (SEO dinámico) + Providers
│   ├── page.tsx          # Home (placeholder + JSON-LD)
│   ├── globals.css       # Estilos globales (Tailwind v4)
│   ├── sitemap.ts        # Sitemap dinámico (/sitemap.xml)
│   ├── robots.ts         # Robots.txt dinámico (/robots.txt) — bloquea en no-prod
│   └── manifest.ts       # PWA manifest (/manifest.webmanifest)
├── components/
│   ├── providers.tsx     # Wrapper: GA + CookieBanner
│   ├── analytics.tsx     # Google Analytics + trackEvent()
│   ├── cookie-banner.tsx # Banner de consentimiento de cookies
│   └── json-ld.tsx       # Datos estructurados (Schema.org)
├── lib/
│   ├── site.ts           # Configuración del sitio (single source of truth SEO)
│   ├── db.ts             # Conexión NeonDB (sql tagged template)
│   └── cookies.ts        # Hook useCookieConsent (useSyncExternalStore)
└── proxy.ts              # Proxy (middleware): X-Robots-Tag en dominios no-prod
```

## Reglas

1. **Server Components por defecto**; `'use client'` solo para interactividad.
2. `cookies()` y `headers()` son async en Next.js 16 → siempre `await`.
3. `middleware.ts` deprecado en Next.js 16 → usar `proxy.ts`.
4. **No usar `setState` dentro de `useEffect`** — el linter de React 19 lo
   prohíbe. Usar `useSyncExternalStore` para sincronizar con stores externos.
5. Tailwind v4: la configuración va en CSS (`@import "tailwindcss"`), no en
   `tailwind.config.ts`.
6. **SEO**: toda configuración de metadata sale de `src/lib/site.ts`. Editar
   ahí para cambiar títulos, descripciones, keywords, etc.
7. **Analytics**: usar `trackEvent(name, params)` desde
   `@/components/analytics` para lanzar eventos. GA solo carga si el usuario
   acepta cookies (o si `NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT=true`).
8. **BD**: usar `sql` desde `@/lib/db` para queries. Es el driver serverless
   de Neon (HTTP, no WebSocket). Ej: `const rows = await sql\`SELECT * FROM cars\``.
9. **Indexación SEO**: el dominio de producción es el único que se indexa.
   Dominios no-prod (`*.vercel.app`, `localhost`) se bloquean con 3 capas:
   `X-Robots-Tag` header (proxy.ts), `Disallow: /` (robots.ts), y
   `<meta name="robots" content="noindex">` (generateMetadata). El dominio
   de producción se define en `siteConfig.productionHost` en `src/lib/site.ts`.
10. **PROHIBIDO hacer `git commit` o `git push` sin autorización explícita y
    confirmación del usuario.**
11. **PROHIBIDO commitear `.env.local`** — contiene credenciales. Ya está
    gitignored.

## Variables de entorno

Ver `.env.example` para referencia. Las reales están en `.env.local`:

- `DATABASE_URL` — conexión NeonDB (PostgreSQL)
- `NEXT_PUBLIC_SITE_URL` — URL pública del sitio
- `NEXT_PUBLIC_GA_ID` — Measurement ID de Google Analytics
- `NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT` — `"true"` para activar GA sin banner

## Deploy en Vercel

- `vercel.json` configurado para usar Bun (`installCommand`, `devCommand`, `buildCommand`).
- Configurar las variables de entorno en el dashboard de Vercel.
- El build usa Turbopack con `turbopackFileSystemCacheForBuild` activado.

## Skills

En `.agents/skills/`: skills instaladas para asistir al agente. Úsalas como
referencia al trabajar con las tecnologías correspondientes.

- `vercel-react-best-practices` — patrones y buenas prácticas de React (Vercel)
- `nextjs-app-router-patterns` — patrones del App Router de Next.js
- `tailwind-design-system` — sistema de diseño con Tailwind CSS
- `neon-postgres` — mejores prácticas de Neon PostgreSQL