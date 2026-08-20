# AGENTS.md — Next.js Base

> **OBLIGATORIO**: Antes de escribir código, explora la estructura del proyecto
> y consulta la documentación relevante en `node_modules/next/dist/docs/`.
> Prefiere razonamiento basado en recuperación (retrieval-led) sobre
> razonamiento basado en entrenamiento (pre-training-led).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

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
| Animación | GSAP (+ ScrollTrigger) | 3.15.x |
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
bun run e2e          # Playwright (suite e2e: público + admin)
bun run e2e:ui       # Playwright con UI interactiva
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
- `ADMIN_PASSWORD` — contraseña de bootstrap del CMS: solo se usa mientras la tabla `admins` esté vacía; el primer login con email + ADMIN_PASSWORD crea el admin raíz
- `ADMIN_SECRET` — secreto HMAC de las sesiones (por defecto = ADMIN_PASSWORD; cámbialo en producción)
- `RESEND_API_KEY` — envío de avisos del formulario de contacto
- `NEXT_PUBLIC_SITE_URL` — URL pública del sitio
- `NEXT_PUBLIC_GA_ID` — Measurement ID de Google Analytics
- `NEXT_PUBLIC_ANALYTICS_DEFAULT_CONSENT` — `"true"` para activar GA sin banner

## Tests e2e (bun:test + Bun.WebView) y CI — SIEMPRE presente

El base incluye una **suite e2e con bun:test + Bun.WebView** (`e2e/`, basada en la skill
`~/.agents/skills/bun-webview/SKILL.md`) que cubre los caminos críticos que heredan TODAS las
webs de clientes. Migrado de Playwright a Bun.WebView (Bun 1.4.0): el navegador headless es el
integrado en el runtime (no se descarga nada), el runner es `bun:test` y el `next dev` se arranca
solo en `e2e/server.ts` (Bun.WebView, a diferencia de Playwright, no gestiona el webServer).

- `e2e/publico.spec.ts` — home renderiza (200 + contenido visible, incl. el fallback CSS de GSAP),
  todos los enlaces del nav/footer devuelven 200 con contenido no vacío, páginas legales estándar,
  POST `/api/contact` sin error, y viewport móvil sin overflow horizontal.
- `e2e/admin.spec.ts` — login con `ADMIN_PASSWORD` (bootstrap del primer admin) → dashboard →
  crear página → abrir el editor (`/admin/paginas/:id`). Este test caza el bug de que el editor
  daba 500 (se arregló en `src/lib/preview.ts`: usaba `??` que no ignora `ADMIN_SECRET=""`; ahora
  usa `||` para caer a `ADMIN_PASSWORD`). Corre una única vez (evita agotar el rate-limit de
  login, 5/15min por IP).
- Helpers: `e2e/lib.ts` (crear views, esperar selectores/textos, GET local) y `e2e/server.ts`
  (arrancar/parar `bun run dev`, inyectando `.env.local` al subproceso).

**Cómo correrlos:**
```bash
bun run e2e                    # suite completa secuencial
bun run e2e:parallel           # suite completa en paralelo
bun test e2e/publico.spec.ts --timeout 30000   # solo público
bun test e2e/admin.spec.ts --timeout 60000     # solo admin
E2E_BACKEND=chrome bun run e2e # forzar paridad Chromium (default: webkit en macOS, chrome en Linux/CI)
```

**Requisitos:** `.env.local` con `DATABASE_URL` (BD de staging) y `ADMIN_PASSWORD`. Antes de los
e2e hay que tener el esquema sembrado: `bun run db:migrate` + `bun scripts/seed.ts`. La BD de
staging del base es el proyecto Neon `flat-wave-02565341`.

**CI (GitHub Actions, `.github/workflows/ci.yml`):** en cada push a main y PR ejecuta
`bun install` → `typecheck` → `lint` → `test` → (si hay BD) → migrate+seed → `e2e`. En Linux CI,
Bun.WebView usa el backend `chrome` (el runner de GH ya trae Chrome), no hace falta instalar
navegador como ocurría con Playwright.

**IMPORTANTE para quien cree webs de clientes desde este base:** el CI es **resiliente**. Los pasos
que necesitan base de datos (migrate + seed + e2e) solo corren si el repo tiene el secreto
`DATABASE_URL` configurado. En un repo de cliente clonado del base **sin** secretos, esos pasos se
saltan con un aviso y el resto del CI (typecheck/lint/unit) sigue pasando — no falla. Para activar
los e2e en un repo de cliente hay que añadir 2 secrets de GitHub:
- `DATABASE_URL` → la BD Neon de ese proyecto (staging o la del cliente).
- `ADMIN_PASSWORD` → la contraseña de bootstrap del admin.
Añadirlos: `gh secret set DATABASE_URL --repo <owner>/<repo>` (pegar el valor) y lo mismo para
`ADMIN_PASSWORD`. Sin ellos, el CI funciona igual pero sin e2e.

## Issues, webhook al board y sincronización con upstream — IMPORTANTE

**1. Las issues de GitHub entran al board de mission-control (webhook).** Cualquier issue que se abra
en ESTE repo (o en cualquier repo de pedroarenes-blip) aparece automáticamente como tarea en el
board de mission-control (CRM → Tareas). Si detectas un bug, ábrelo como issue con la etiqueta
`bug` (mejora 03). El webhook del repo está activado; si creas un repo NUEVO, actívalo con:
`cd ~/Documents/proyectos/mission-control && bun --env-file=.env.local run scripts/activar-webhook.ts <repo>`.
(Nota: el webhook apunta a una URL de túnel cloudflared que cambia; el watchdog `verificar-tunel`
lo re-apunta automáticamente.)

**2. Este repo es un FORK de YuniorGlez/nextjs-16.3.** `origin` = nuestro repo
(pedroarenes-blip/nextjs-16.3), `upstream` = el original de YuniorGlez. Puede haber mejoras en
`upstream/main` que merezca la pena traer, y a veces las issues se resuelven aquí o en el original.
Antes de empezar a trabajar (y de forma periódica) comprueba si hay novedades:

```bash
git fetch origin main && git fetch upstream main
git log --oneline origin/main..upstream/main   # mejoras de YuniorGlez que aún no tenemos
git log --oneline upstream/main..origin/main   # commits nuestros (PRs aceptados)
```

Si hay commits de `upstream/main` que merecen la pena (a juicio del agente), intégralos:
`git merge upstream/main` (o un cherry-pick selectivo). Decisión de producto: pregunta a Pedro antes
de traer cambios sustanciales del original que puedan afectar a las webs de clientes.

**3. Revisa el board de mission-control por issues del repo.** Las issues abiertas en este repo, una
vez llegadas al board, pueden resolverlas Iván u otros agentes automáticamente
(despachador-fixes, mejora 03). No asumas que la resolución solo es tuya: revisa si ya hay una tarea
creada y si hay agentes ya trabajando en ella antes de duplicar trabajo.

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

## GSAP (animaciones) — SIEMPRE presente

- `gsap` está en `package.json`. El wrapper `src/components/site-animations.tsx`
  (client component) registra ScrollTrigger y anima por atributos `data-*`.
- En la página pública (server component) envuelve TODO el contenido:
  `<SiteAnimations>…tu landing…</SiteAnimations>`.
- Marcadores disponibles: `data-hero` (entrada del hero), `data-reveal`
  (revelado al hacer scroll), `data-stagger` (aparición escalonada de tarjetas),
  `data-hero-bg` (parallax sutil del fondo). Respeta `prefers-reduced-motion`.
- Referencia completa del patrón conectado al CMS: `src/app/page.tsx` del
  proyecto `restaurante-bellavista`.

## CMS Admin (incluido) + Vercel Blob — SIEMPRE presente y OBLIGATORIO

El base incluye un CMS admin en /admin (panel oscuro con sidebar, dashboard, builder de landing, carta/prices opcional, contacto y textos) y es **responsive** (menú hamburguesa en móvil, sidebar drawer, editor en una columna).

- **NeonDB es OBLIGATORIA en TODOS los proyectos** (aunque la web sea sencilla): en ella se guardan los textos de la landing y las imágenes, editables desde el CMS. No existe la opción "sin base de datos".
- Acceso: /admin con **email + contraseña** (multi-admin, tabla `admins`, hash scrypt en `src/lib/passwords.ts`). Bootstrap: con la tabla vacía, cualquier email válido + env ADMIN_PASSWORD crea el primer admin; después la auth es contra la BD y el env deja de servir. Gestionar admins (añadir con contraseña temporal y cambio forzado en el primer login, eliminar, revocar sesiones) y cambiar contraseña en /admin/seguridad. Sesiones: cookie HMAC `{sub, ver, exp}` revocable (token_version).
- Sembrar BD: bun --env-file=.env.local scripts/seed.ts (crea tablas categories/items/settings/pages/page_versions/page_redirects/contact_messages/admins + ajustes del builder). OJO: el seed hace UPSERT de las 4 páginas estándar con contenido por defecto — para DDL aditivo en BD ya sembrada usar scripts inline (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS), no el seed completo.
- Datos editables desde el panel (hero, destacados, numeros, local, galeria, layout) guardados en settings; la web debe leerlos y renderizar por orden/visibilidad (ver src/app/page.tsx del proyecto ejemplo restaurante-bellavista).
- Vercel Blob (subir imagenes): token BLOB_READ_WRITE_TOKEN via vercel blob create-store. Endpoint src/app/api/upload/route.ts ya listo (protegido con ADMIN). next.config.ts ya tiene remotePatterns de *.blob.vercel-storage.com.
- Subida desde cliente: POST multipart a /api/upload devuelve {url}.
- Skill de referencia: vercel-blob.

- Branding desde el CMS: /admin/estilo guarda `settings.branding` (primary, font, radius). La web debe inyectar `brandingCss(settings.branding)` (`src/lib/branding.ts`) como <style> para repintar color/tipografia/radio (override de clases Tailwind amber).
- Formulario de contacto: `src/components/contact-form.tsx` POSTea JSON a `/api/contact`. El mensaje se guarda SIEMPRE en la tabla `contact_messages` (bandeja en /admin/mensajes: leer/borrar) y se avisa por email con plantilla React Email (`src/emails/contact-notification.tsx`, deps @react-email/*). Destinatario/remitente configurables desde /admin/contacto: `settings.mensajes.to` > `settings.contacto.email` > env `RESEND_TO`; `settings.mensajes.from` > env `RESEND_FROM` > sandbox. Anadir RESEND_API_KEY al .env.local y a Vercel.

## CMS — características añadidas

- **Editor markdown seguro** en la sección Texto: `src/lib/markdown.ts` (parser propio sin dependencias, salida sanitizada; enlaces solo http(s)/mailto/#/relativas). Editor con toolbar y preview en `src/components/admin/markdown-editor.tsx`.
- **Historial de versiones por página**: cada guardado crea un snapshot en `page_versions` (máx 20); restaurar desde el editor de página. Deshacer/rehacer local en el builder (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z/Y).
- **Redirecciones 301**: al cambiar un slug se registra `page_redirects` (con encadenado a→b→c) y `proxy.ts` emite el 301 real (redirect() de página es 307 y permanentRedirect() 308 — el 301 solo es posible en proxy).
- **Menú de navegación configurable**: `settings.nav` (editor en /admin/menu) — ítems de página o enlace externo, submenús sin JS (<details>), botón CTA destacado. Sin config, fallback al comportamiento actual.
- **SEO por página**: OG image dinámica `/og/[slug]` (ImageResponse de `next/og`), breadcrumbs JSON-LD (BreadcrumbList, `src/lib/breadcrumbs.ts`), sitemap con `pages.updated_at` real.
- **Seguridad**: rate-limit en memoria en /api/login (5/15 min por IP) y /api/upload (20/10 min por IP) → 429 + Retry-After; cabeceras de seguridad y CSP (solo producción) en `proxy.ts` (X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy, HSTS solo en dominio de producción). 'unsafe-inline' en script/style-src es necesario (RSC inline + Tailwind v4); siguiente paso: nonces.

## Imagenes y IA en el CMS — SIEMPRE presente

El base incluye un sistema de imagenes completo para el CMS (subida, optimizacion e IA):

- **Campo de imagen reutilizable**: `src/components/admin/image-field.tsx` (`ImageField`, client) — drag & drop (react-dropzone), recorte (react-easy-crop), pegar URL y boton de IA. Props: `value`, `onUploaded(url)`, `onRemove`, `aspect` (relacion de recorte, p.ej. `1200/630`), `aiAspect`, `allowAi`. Integrado en: SEO global (ogImage), Textos y heroe (hero/local/galeria), builder de paginas (hero/local/galeria) y pagina por pagina (seo.ogImage → metadata OG en `[slug]/page.tsx`).
- **Recorte + optimizacion en cliente**: `src/lib/client-image.ts` (`cropImageToBlob`) → WebP max 1920 px antes de subir. `src/components/admin/blob-uploader.tsx` mantiene su API historica pero ahora tambien recorta/optimiza.
- **Optimizacion server-side**: `/api/upload` re-encodea a WebP (sharp, calidad 80, max 1920 px) cualquier raster >300 KB (red de seguridad). Sharp ya viene como dependencia de Next — NO anadir de nuevo.
- **IA con OpenRouter**: `src/lib/openrouter.ts` (solo server) — `getOpenRouterKey()` resuelve: `settings.ai.openrouterApiKey` (BD, editable en `/admin/imagenes`) > env `OPENROUTER_API_KEY`. `generateAiImage()` llama a `POST https://openrouter.ai/api/v1/images` (modelo `openai/gpt-image-2`). Para editar, la imagen de origen se baja server-side y se manda como **data URL** en `input_references` (OpenRouter rechaza URLs locales/privadas). Respuesta: `{data:[{b64_json, media_type}]}`.
- **Rutas**: `/api/ai-image` (POST JSON, protegido con sesion admin; guarda en Blob carpeta `ia/`; sin Blob devuelve `dataUrl` temporal) y `/api/upload` (multipart → Blob `fotos/`, 8 MB max). Ambos dan errores claros si falta `BLOB_READ_WRITE_TOKEN`.
- **Ejemplos**: `public/examples/` (imagenes genericas de ejemplo, usadas por el seed: ogImage, hero, local, galeria). Regenerar con `bun --env-file=.env.local scripts/gen-example-images.ts`. `scripts/seed.ts` incluye `settings.ai.openrouterApiKey = ""` (no seedear claves reales).
- **IMPORTANTE**: `src/lib/ai-images.ts` tiene las constantes compartidas (AI_ASPECTS, AI_QUALITIES, prompts) SIN imports de server — importarlas desde componentes client. `src/lib/openrouter.ts` y `src/lib/blob.ts` son SOLO server (no importarlas en client components; arrastran DB/env).
