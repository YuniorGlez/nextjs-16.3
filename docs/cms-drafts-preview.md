# Borradores, publicación y preview privado

Las páginas mantienen el esquema existente como compatibilidad y añaden columnas `draft_*` y `published_*`. La migración 0002 copia el contenido actual a ambos estados, por lo que una base ya sembrada conserva exactamente la web publicada.

## Flujo

- El editor de `/admin/paginas/:id` escribe únicamente el borrador y crea snapshots del borrador anterior en `page_versions`.
- `Publicar` copia el borrador a `published_*`, registra `published_at` y revalida el listado, home y slug.
- Las rutas públicas y navegación consultan exclusivamente `published_*`. El fallback usa las columnas legacy cuando la fila aún no tiene estado nuevo.
- Visibilidad se edita en el borrador y solo afecta a la web después de publicar.

## Preview

El panel genera un enlace `/preview/:slug?token=...`. El token es HMAC-SHA-256, contiene el slug y expira en dos horas. La clave es `PREVIEW_SECRET` (recomendado), con fallback a `ADMIN_SECRET` por compatibilidad. El endpoint verifica firma, slug y expiración **antes de consultar el borrador**; un token ausente, alterado o expirado devuelve 404.

La ruta es dinámica, no-cacheable (`force-dynamic`, `revalidate = 0`), incluye badge visible de borrador y metadata `noindex, nofollow, nocache`. Compartir el enlace no otorga acceso al admin ni permite editar.

En producción se debe configurar `PREVIEW_SECRET` con un secreto aleatorio independiente y rotarlo si se filtra. La expiración limita el impacto de un enlace compartido; para revocación anticipada se debe rotar la clave.

La preview soporta páginas `/:slug`; la home permanece ligada al contenido global de landing y no se altera en este alcance.

## Aplicar la migración

```bash
bun --env-file=.env.local scripts/migrate.ts up
```

No ejecutar el seed completo sobre una base existente: podría sobrescribir contenido del CMS.

## Tests

Los tests unitarios cubren la normalización legacy, la selección de estado publicado, la copia al publicar, la firma, expiración, tampering y protección por slug del token. No requieren una base real.

> Nunca almacenar tokens de preview en logs ni incrustarlos en contenido indexable.

## Verificación de no exposición

La ruta pública usa `getPageBySlug(slug)` y `getPages({ published: true })`; solo `/preview/[slug]`, tras validar un token, usa `getPageBySlug(slug, { draft: true })`.
