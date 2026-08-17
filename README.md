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
| `OPENROUTER_API_KEY` | Clave de OpenRouter para el editor de imágenes con IA del CMS (fallback si no se configura desde el admin) |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob para almacenar las imágenes subidas desde el CMS |

## Imágenes en el CMS (subida, optimización e IA)

El base incluye un sistema de imágenes completo en el panel `/admin`:

- **Subida con drag & drop** en cualquier campo de imagen (héroe, galería, OG,
  imágenes de páginas…). Al soltar un archivo se abre un **recorte** con aspecto
  predefinido (16:9, 1200×630 para OG, libre…) y la imagen se **optimiza a WebP**
  (máx. 1920 px) antes de subirla. También se puede pegar una URL.
- **Optimización server-side**: `/api/upload` re-encodea a WebP (calidad 80,
  máx. 1920 px) cualquier raster >300 KB como red de seguridad, aunque el
  cliente no la haya optimizado (menos peso = mejor Core Web Vitals/SEO).
- **Edición y creación con IA** (OpenRouter, `openai/gpt-image-2`): el botón
  «✨ Editar con IA» aparece en cada campo de imagen; permite retocar la imagen
  actual (estilo, luz, fondo…) o crear una desde cero con un prompt, eligiendo
  formato y calidad. La llamada es server-side (`/api/ai-image`, protegido con
  sesión admin) y la clave se resuelve: **settings de la BD** (configurable en
  `/admin/imagenes`) → `OPENROUTER_API_KEY` del entorno.
- **Configuración y estado**: `/admin/imagenes` muestra si Blob y OpenRouter
  están configurados y permite guardar la clave de OpenRouter en la BD.
- **Imágenes de ejemplo**: `public/examples/` trae imágenes genéricas (generadas
  con IA) que el seed usa como valores por defecto (OG, héroe, local y galería).
  Se regeneran con `bun --env-file=.env.local scripts/gen-example-images.ts`.

### Configurar Vercel Blob

```bash
npx vercel link                    # enlaza el proyecto (si no está)
npx vercel blob create-store       # crea el store y muestra el token
```

Añade el `BLOB_READ_WRITE_TOKEN` a `.env.local` y a las variables de entorno
del proyecto en Vercel. Sin él, la subida avisa con un error claro.

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