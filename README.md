# Next.js Base

Repositorio base whitelabel para futuros proyectos Next.js. Proporciona una
base sólida y opinionated: SEO optimizado, Google Analytics con consentimiento
de cookies, capa de base de datos lista para usar, y configuración de deploy
en Vercel. Clona este repo y adáptalo a las necesidades del proyecto concreto.

## Stack

- **Next.js 16.3** (App Router, Turbopack)
- **React 19** + **Tailwind CSS v4**
- **TypeScript** (strict)
- **NeonDB** (PostgreSQL serverless)
- **Google Analytics 4** (con consentimiento de cookies)
- **Bun** como package manager
- **Vercel** para deploy

## Diseño y arquitectura

El design rationale completo (precondiciones, invariantes, decisiones y
trade-offs) está en [`docs/design/design.md`](docs/design/design.md). Resumen:

- **Por qué Bun**: es el package manager más rápido para Next.js; el
  trade-off es un ecosistema con adopción menor que npm, aceptado para una
  plantilla whitelabel. Instead of un segundo lockfile, `bun.lock` es la
  única fuente de verdad y CI instala con `--frozen-lockfile`.
- **Invariante principal**: `src/lib/site.ts` es el single source of truth
  de SEO. Esta invariante debe mantenerse en todos los proyectos derivados.
- **Por qué NeonDB**: Postgres serverless vía HTTP elimina la
  infraestructura de connection pooling. La consecuencia asumida es ~100ms
  de cold start en la primera query, aceptable para sitios de contenido.

## Comenzar

```bash
bun install
bun run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Al clonar para un nuevo proyecto

1. Edita `src/lib/site.ts` — es el single source of truth para SEO: nombre,
   tagline, descripción, keywords, dominio de producción, organización, etc.
2. Edita `package.json` (`name`) con el nombre del nuevo proyecto.
3. Edita `AGENTS.md` para describir el contexto del proyecto concreto.
4. Copia `.env.example` a `.env.local` y rellena los valores reales.
5. Reemplaza `public/favicon.ico` y los assets de `public/` según el proyecto.
6. Configura las variables de entorno en el dashboard de Vercel.

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión NeonDB (PostgreSQL) |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio |
| `NEXT_PUBLIC_GA_ID` | Measurement ID de Google Analytics |
| `NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT` | `"true"` para activar GA sin banner |

## Scripts

```bash
bun run dev        # servidor de desarrollo
bun run build      # build de producción
bun run start      # servidor de producción
bun run lint       # ESLint
bun run typecheck  # tsc --noEmit
```

## Deploy

El proyecto está configurado para desplegar en Vercel usando Bun.
`vercel.json` define `installCommand`, `devCommand` y `buildCommand` con bun.
Configura las variables de entorno en el dashboard de Vercel.