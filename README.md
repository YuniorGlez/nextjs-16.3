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
- **Separación de configuración**: `src/lib/site.ts` contiene defaults e invariantes
  de plataforma; `src/lib/site-config.ts` resuelve la configuración efectiva del
  cliente sin importar JSON mutable en el bundle.
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

1. Usa el CLI de provisionamiento para generar la configuración del cliente;
   no edites `src/lib/site.ts` para datos de un cliente.
2. Edita `package.json` (`name`) con el nombre del nuevo proyecto.
3. Edita `AGENTS.md` para describir el contexto del proyecto concreto.
4. Copia `.env.example` a `.env.local` y rellena los valores reales.
5. Reemplaza `public/favicon.ico` y los assets de `public/` según el proyecto.
6. Configura las variables de entorno en el dashboard de Vercel.

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores. GA4 puede configurarse
por cliente desde `/admin/analytics`; las variables siguientes se mantienen como
fallback para instalaciones antiguas:

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

## Capacidades CMS reutilizables

La base está preparada para desplegar proyectos independientes para distintos
clientes, manteniendo separados el código de plataforma, la configuración del
cliente y el contenido editable:

- **Contenido y publicación**: páginas con borradores, publicación explícita,
  preview privado, historial de versiones y redirecciones 301 al cambiar slugs.
- **Usuarios y control operativo**: multi-admin, RBAC server-side, auditoría de
  cambios y protección de las rutas administrativas y APIs.
- **Datos y consistencia**: migraciones forward-only, operaciones críticas en
  transacciones Neon HTTP, caché pública por tags e invalidación después del
  commit. Los borradores, previews y datos administrativos nunca entran en la
  caché pública.
- **Media library**: assets persistentes en `media_assets`, búsqueda,
  paginación, metadatos accesibles, soft delete y protección contra borrar
  imágenes referenciadas.
- **Diseño y accesibilidad**: plantillas sectoriales no destructivas, branding
  configurable, `next/image` para rutas compatibles, validación de alt text,
  skip link y foco visible.
- **SEO**: canonical, Open Graph, Twitter, JSON-LD, sitemap con `lastmod`,
  score SEO y exclusión de contenido no publicado.
- **Multiidioma**: locales configurables por cliente, URLs `/<locale>/...`,
  fallback determinista, traducciones opcionales, `hreflang` y sitemap por
  idioma.
- **Analytics**: GA4 configurable desde `/admin/analytics`, consentimiento
  compatible con el banner existente y eventos allowlisted sin PII.

La documentación detallada de cada subsistema está en `docs/`: `rbac.md`,
`audit-log.md`, `cache.md`, `neon-transactions.md`, `media-library.md`,
`image-accessibility.md`, `sector-templates.md`, `seo.md`, `i18n.md` y
`analytics.md`.

## Scripts

```bash
bun run dev          # servidor de desarrollo
bun run build        # build de producción
bun run start        # servidor de producción
bun run lint         # oxlint
bun run typecheck    # tsc --noEmit
bun run test         # Vitest
bun run format:check # comprobar formato sin modificar archivos
```

## Migraciones de base de datos

El esquema se evoluciona con migraciones forward-only versionadas. El seed no
crea tablas: solo inserta datos demo/default y hace UPSERT de páginas estándar,
por lo que no debe ejecutarse contra producción ni usarse para actualizar una
base existente.

```bash
bun --env-file=.env.local run db:migrate         # aplica migraciones pendientes
bun --env-file=.env.local run db:migrate:status  # muestra el estado
bun --env-file=.env.local scripts/seed.ts        # datos demo, después de migrar
```

Las migraciones actuales llegan hasta la `0007_i18n`, que añade configuración
multiidioma y traducciones opcionales por página. Las funcionalidades que usan
JSONB existente (`analytics`, `template`, configuración SEO y branding) no
requieren una migración adicional. Revisa siempre `bun run db:migrate:status`
antes de aplicar cambios en una base de cliente.

Cada migración vive en `scripts/migrations/` y exporta un objeto con este
formato:

```ts
const migration = {
  version: 2,
  name: "add_example_column",
  statements: ["ALTER TABLE example ADD COLUMN IF NOT EXISTS value TEXT"],
};
export default migration;
```

Para crear la siguiente migración, usa el próximo entero, escribe únicamente
cambios aditivos y seguros para bases que ya contienen clientes, y añádela al
array de `scripts/migrations/index.ts`. No cambies la versión ni el nombre de
una migración aplicada, no reordenes migraciones y no incluyas secretos ni
contenido de negocio. El runner crea `schema_migrations`, ejecuta todo en una
transacción con bloqueo advisory, registra versión/nombre/fecha y deja la base
sin cambios si falla una migración. Las migraciones se prueban sin Neon mediante
un ejecutor SQL abstraído; este repositorio no afirma haber probado el flujo
contra Neon.

Para automatización, comprobar primero `db:migrate:status`, ejecutar después
`db:migrate`, y revisar que no queden pendientes. Nunca uses el seed como
sustituto del runner ni añadas rollback destructivo sin un diseño y pruebas
específicos.

## Provisionamiento no interactivo

El CLI `project:provision` permite a una IA validar un contrato de cliente,
generar configuración local de forma idempotente y ejecutar migraciones solo si
se solicitan explícitamente. No modifica `src/lib/site.ts` ni crea proyectos
cloud. Consulta el contrato, el ejemplo y los límites de seguridad en
[`docs/project-provisioning.md`](docs/project-provisioning.md).

```bash
bun run project:provision -- --config /ruta/cliente.json --dry-run --json
bun run project:provision -- --config /ruta/cliente.json --migrate --json
```

El seed nunca es implícito: requiere `--seed --allow-seed` y `DATABASE_URL`.

### Configuración de plataforma y cliente

`src/lib/site.ts` define los defaults del producto base y los invariantes
técnicos (locale, color de tema y forma del documento). Los datos editables del
cliente son nombre, tagline, descripción, URL, host de producción, contacto,
branding y SEO. La resolución server-side aplica esta precedencia:

```text
defaults de plataforma < .provisioning/site-overrides.json < settings.site (BD)
```

`settings.client` y los campos directos de `settings` se aceptan como
compatibilidad con instalaciones anteriores. El loader lee los JSON generados
con `fs` en server components; nunca se importa un JSON mutable en el bundle.
Si la BD o los archivos no están disponibles, se usan los defaults seguros.
Layout, páginas, sitemap, robots, manifest y JSON-LD consumen la configuración
efectiva. El proxy solo usa el host de plataforma porque no puede consultar el
CMS; actualiza ese invariante al desplegar un dominio nuevo.


## Deploy

El proyecto está configurado para desplegar en Vercel usando Bun.
`vercel.json` define `installCommand`, `devCommand` y `buildCommand` con bun.
Configura las variables de entorno en el dashboard de Vercel.

## Checklist para un nuevo cliente

1. Ejecutar `project:provision` en modo `--dry-run` y revisar la configuración.
2. Configurar las variables de entorno y el dominio productivo.
3. Aplicar migraciones pendientes; no ejecutar el seed contra una base existente.
4. Revisar branding, plantilla sectorial, SEO, idiomas y consentimiento de
   analytics desde `/admin`.
5. Completar alt text de imágenes y comprobar el flujo de media library.
6. Crear o revisar admins y sus permisos RBAC.
7. Verificar `/robots.txt`, `/sitemap.xml`, canonicals, alternates y preview.
8. Ejecutar `bun run test`, `bun run typecheck`, `bun run lint` y `bun run build`.
9. Probar en móvil, teclado y un dominio de preview antes de producción.

`AGENTS.md` contiene las reglas operativas del repositorio y el bloque generado
por Next.js; se conserva como fichero protegido. Los detalles funcionales y de
provisionamiento deben mantenerse en este README y en `docs/`.