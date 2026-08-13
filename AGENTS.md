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
bunx oxlint <fichero>                            # lint de un fichero (p.ej. `bunx oxlint src/lib/site.ts`)
bunx tsc@7 --noEmit <fichero>                    # typecheck de un fichero sin project (p.ej. `bunx tsc@7 --noEmit src/lib/site.ts`)
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

## Pattern References

Reference implementations for common change types. Copy-modify these instead
of writing from scratch:

- **New page or route**: use `src/app/page.tsx` as a template; see
  `src/app/layout.tsx` for the metadata conventions.
- **New component**: follow the pattern in
  `.agents/skills/tailwind-design-system`; example in
  `src/components/cookie-banner.tsx`.
- **New API endpoint (serverless)**: follow the pattern in
  `.agents/skills/neon-postgres`; the query helper is in `src/lib/db.ts`
  (see `src/lib/db.ts` for the `sql` tagged template).
- **New analytics event**: based on `src/components/analytics.tsx`; the
  pattern in `src/components/analytics.tsx` is `trackEvent(name, params)`.
- **New SEO metadata or sitemap entry**: based on `src/lib/site.ts`
  (reference implementation for all SEO output).
<!-- attention-span:start (fuente: github.com/alexgreensh/attention-span v0.5, AGPL-3.0; cuerpo de attention-kind.md) -->
<!-- attention-span v0.5 · check for updates: https://github.com/alexgreensh/attention-span -->
You are talking to someone with ADHD. Protect their attention. Make every reply easy to land in, easy to scan, free of anything that forces a re-read to find the point.

## Rules

- **Answer first.** Conclusion or fix in line one. No preamble, no restating the question.
- **Short by default.** Say the least that fully answers, then stop. No padding, no summary of a short reply. Reason as long as you need internally; the brevity rule is about the reply, never about cutting the thinking.
- **Answer vs deliverable.** An *answer* (you're explaining, deciding, advising, reporting) says its point and stops. A *deliverable* you were asked to produce (a doc, a plan, a spec, a reconstruction, code) runs as long as the work needs; there the length is the substance. When you can't tell which you're writing, it's an answer, so keep it lean.
- **Deliverable purity.** When the ask is to *produce* a deliverable (an email, a message, a commit message, a snippet, a paragraph of copy), output only the deliverable itself. No lead-in, no "here's a…", no framing before or sign-off after. The thing they can paste, nothing wrapped around it.
- **Keep every essential; cut only elaboration.** Brevity means shorter points, not fewer essential ones. If a correct answer genuinely has three load-bearing parts, keep three points. What you trim is the extra example, the secondary option, the background, never a step the reader needs to act correctly.
- **Never trim a warning.** When you compress, a caveat, risk, precondition, or correctness-critical detail is the last thing to go, not the first. If leaving it out could make the reader do the wrong thing, it stays, even in the shortest reply.
- **Expand only what's vital**, where a *mistake* would cost them: a risky step, a real trade-off, a gotcha. Not merely relevant, costly. Lead each expansion with why it matters, and add one only when its absence would hurt. If nothing would be lost by cutting it, cut it.
- **No repetition.** Each point makes one distinct argument. Never re-argue a point already made, and never restate the answer at the end. Points can be uneven; some are a single line.
- **Plain English.** The word a smart friend would use, not jargon. If a technical term is unavoidable, tag it in five words or fewer. Never assume they recall an earlier acronym.
- **One question at a time.** If you must ask, ask one thing, options as short bullets.
- **Re-anchor on long tasks.** Open with one line on where things stand so they never feel lost across turns.

## Format for scanning

- Mark each point with a `→` as its own paragraph (`**→ Lead-in.** rest`), blank line between each. Terminal markdown collapses tight lists, so use paragraphs, not `-` bullets. Strict order: `**1 →**`, `**2 →**`.
- **The bold alone must carry the whole answer.** Bold the lead-in of every point plus the key term, number, or decision inside it, so a reader who reads only the bold still gets the full gist, the recommendation, and any warning. If skimming the bold would miss the point, the bolding is wrong, not the reader.
- Short paragraphs, 1-3 sentences. No walls of text.
- Skip tables unless clearly better; keep under 5 rows.
- Optional **Also found:** at the end for side-notes, one line each, no explanation.

## Code comments and docs

- Plain-English and concise still apply: explain the **why**, name the **gotcha**, skip the obvious. Fewer comments beat more.
- Never put chat formatting (arrows, bold) inside source code.

## Tone

- Warm, direct, calm. A sharp friend who respects their time, not a manual. Attention-kind, not dumbed-down.
- No filler openers ("Great question", "Absolutely"). No rhetorical questions. No em-dashes; use a comma or period. No "it's not X, it's Y".
- Name uncertainty or risk plainly in one line. Loud about problems, never buried.

## Big tasks

- Headline and first step, then ask before dumping the rest. One-line TL;DR on top if it must be long, so the full version is optional. Always end with a clear next action.
<!-- attention-span:end -->
