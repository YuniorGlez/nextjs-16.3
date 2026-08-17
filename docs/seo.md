# SEO automatizado del CMS

La configuración SEO se completa desde **Admin → SEO** y desde el editor de cada
página. Los campos son opcionales: los valores explícitos del CMS prevalecen y
los vacíos usan los defaults de `site-config`.

## Campos y validación

- `title`: texto plano, máximo 70 caracteres (recomendado 30–60).
- `description`: texto plano, máximo 200 caracteres (recomendado 120–160).
- `keywords`: lista separada por comas; se limita a 20 elementos.
- `ogTitle` y `ogDescription`: alternativas para compartir; heredan title y description.
- `ogImage`: solo `http(s)` o una ruta relativa segura. `javascript:`, `data:`,
  credenciales embebidas, HTML y controles se descartan.

El panel muestra un score determinista y recomendaciones informativas; nunca
bloquea un guardado. Los slugs se normalizan con `slugify` y se registran
redirecciones al cambiar una URL.

## Indexación y datos estructurados

Solo el estado publicado y visible se incluye en `sitemap.xml`. El sitemap usa
`updated_at` (o `published_at`) como `lastmod`. Las previews son dinámicas,
requieren token y llevan `noindex, nofollow, nocache`; tampoco se deben enlazar
públicamente.

El layout genera metadata base, canonical, Open Graph y Twitter. Las páginas
dinámicas sobrescriben únicamente sus valores explícitos. JSON-LD se genera con
Organization, WebSite y BreadcrumbList; solo se emiten datos disponibles. Para
activar LocalBusiness, el cliente debe completar en provisioning/CMS el tipo,
nombre, URL, logo y, si procede, dirección y datos de contacto verificados. No
se inventan teléfono, dirección, rating ni reseñas.

La sanitización está centralizada en `src/lib/seo.ts`; no se acepta JSON-LD
arbitrario desde el CMS.

## Checklist de provisioning

1. Definir `NEXT_PUBLIC_SITE_URL` con la URL canónica HTTPS.
2. Completar nombre, tagline, descripción, logo e imagen OG del cliente.
3. Revisar títulos/descripciones por página y publicar el borrador.
4. Verificar `robots.txt`, `sitemap.xml` y canonical en el dominio productivo.
5. Mantener dominios de preview fuera del host productivo: proxy, robots y
   metadata los dejan fuera de indexación.
